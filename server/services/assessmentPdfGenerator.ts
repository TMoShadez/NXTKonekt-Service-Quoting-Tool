import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import type { Assessment, Quote, User, Organization } from '@shared/schema';

export interface AssessmentPdfData {
  assessment: Assessment;
  user: User | null;
  organization: Organization | null;
  quote: Quote | null;
}

export async function generateAssessmentPDF(data: AssessmentPdfData): Promise<string> {
  const { assessment, user, organization, quote } = data;
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  // Ensure uploads/pdfs directory exists
  const pdfDir = path.join(process.cwd(), 'uploads', 'pdfs');
  if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
  }

  const filename = `assessment-${assessment.id}-${new Date().toISOString().split('T')[0]}.pdf`;
  const filepath = path.join(pdfDir, filename);
  const stream = fs.createWriteStream(filepath);
  doc.pipe(stream);

  // Add logo if available
  try {
    const logoPath = path.join(process.cwd(), 'attached_assets', 'NxtKonekt Logo_1749973360626.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 40, 40, { width: 100 });
      doc.moveDown(3);
    }
  } catch (error) {
    console.log('Logo not found, continuing without logo');
  }

  // Header
  doc.fontSize(20).font('Helvetica-Bold')
     .text('Assessment Details Report', { align: 'center' });
  doc.moveDown(0.5);

  // Assessment Summary Box
  doc.rect(40, doc.y, 515, 80).stroke();
  const summaryY = doc.y + 10;
  doc.fontSize(12).font('Helvetica-Bold')
     .text('Assessment Summary', 50, summaryY);
  doc.fontSize(10).font('Helvetica')
     .text(`Assessment ID: ${assessment.id}`, 50, summaryY + 15)
     .text(`Service Type: ${assessment.serviceType?.replace('-', ' ').toUpperCase() || 'N/A'}`, 50, summaryY + 30)
     .text(`Status: ${assessment.status || 'Active'}`, 300, summaryY + 15)
     .text(`Created: ${new Date(assessment.createdAt!).toLocaleDateString()}`, 300, summaryY + 30);
  if (assessment.totalCost) {
    doc.text(`Total Cost: $${assessment.totalCost}`, 300, summaryY + 45);
  }

  doc.y += 100;
  doc.moveDown(0.5);

  // Sales Executive Information
  addSection(doc, 'Sales Executive Information');
  addField(doc, 'Name', assessment.salesExecutiveName);
  addField(doc, 'Email', assessment.salesExecutiveEmail);
  addField(doc, 'Phone', assessment.salesExecutivePhone);
  if (user) {
    addField(doc, 'User Account', `${user.firstName} ${user.lastName} (${user.email})`);
  }
  if (organization) {
    addField(doc, 'Organization', organization.name);
    addField(doc, 'Organization Type', organization.partnerType);
    addField(doc, 'Organization Status', organization.partnerStatus);
  }

  // Customer Information
  addSection(doc, 'Customer Information');
  addField(doc, 'Contact Name', assessment.customerContactName);
  addField(doc, 'Company Name', assessment.customerCompanyName);
  addField(doc, 'Email', assessment.customerEmail);
  addField(doc, 'Phone', assessment.customerPhone);
  addField(doc, 'Site Address', assessment.siteAddress);
  addField(doc, 'Industry', assessment.industry);
  addField(doc, 'Preferred Installation Date', assessment.preferredInstallationDate);

  // Service-Specific Technical Details
  if (assessment.serviceType === 'fixed-wireless') {
    addFixedWirelessDetails(doc, assessment);
  } else if (assessment.serviceType === 'fleet-tracking') {
    addFleetTrackingDetails(doc, assessment);
  } else if (assessment.serviceType === 'fleet-camera') {
    addFleetCameraDetails(doc, assessment);
  }

  // Quote Information
  if (quote) {
    addSection(doc, 'Quote Information');
    addField(doc, 'Quote Number', quote.quoteNumber);
    addField(doc, 'Quote Status', quote.status);
    addField(doc, 'Quote Created', new Date(quote.createdAt!).toLocaleDateString());
    
    // Pricing Breakdown
    doc.moveDown(0.3);
    doc.fontSize(11).font('Helvetica-Bold').text('Pricing Breakdown:');
    doc.fontSize(9).font('Helvetica');
    
    const pricing = [
      ['Service', 'Hours', 'Rate', 'Cost'],
      ['Survey', quote.surveyHours?.toString() || '0', `$${quote.hourlyRate}`, `$${quote.surveyCost}`],
      ['Installation', quote.installationHours?.toString() || '0', `$${quote.hourlyRate}`, `$${quote.installationCost}`],
      ['Configuration', quote.configurationHours?.toString() || '0', `$${quote.hourlyRate}`, `$${quote.configurationCost}`],
    ];

    if (quote.removalCost && quote.removalCost > 0) {
      pricing.push(['Existing System Removal', quote.removalHours?.toString() || '0', `$${quote.hourlyRate}`, `$${quote.removalCost}`]);
    }

    if (quote.laborHoldCost && quote.laborHoldCost > 0) {
      pricing.push(['Labor Hold - Overage Reserve', quote.laborHoldHours?.toString() || '0', `$${quote.hourlyRate}`, `$${quote.laborHoldCost}`]);
    }

    if (quote.hardwareCost && quote.hardwareCost > 0) {
      pricing.push(['Hardware/Materials', '', '', `$${quote.hardwareCost}`]);
    }

    pricing.push(['', '', 'TOTAL:', `$${quote.totalCost}`]);

    drawTable(doc, pricing);
  }

  // Additional Notes
  if (assessment.additionalNotes) {
    addSection(doc, 'Additional Notes');
    doc.fontSize(9).font('Helvetica')
       .text(assessment.additionalNotes, { width: 500, align: 'left' });
  }

  // Footer
  doc.fontSize(8).font('Helvetica')
     .text(`Generated on ${new Date().toLocaleDateString()} by NXTKonekt Admin Dashboard`, 40, doc.page.height - 50, {
       align: 'center',
       width: 515
     });

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(filename));
    stream.on('error', reject);
  });
}

function addSection(doc: PDFKit.PDFDocument, title: string) {
  if (doc.y > 700) {
    doc.addPage();
  }
  doc.moveDown(0.5);
  doc.fontSize(12).font('Helvetica-Bold')
     .text(title, { underline: true });
  doc.moveDown(0.3);
}

function addField(doc: PDFKit.PDFDocument, label: string, value: string | null | undefined) {
  if (!value) return;
  
  if (doc.y > 750) {
    doc.addPage();
  }
  
  doc.fontSize(9).font('Helvetica-Bold')
     .text(`${label}: `, { continued: true })
     .font('Helvetica')
     .text(value);
  doc.moveDown(0.1);
}

function addFixedWirelessDetails(doc: PDFKit.PDFDocument, assessment: Assessment) {
  addSection(doc, 'Fixed Wireless Technical Details');
  
  // Infrastructure Requirements
  doc.fontSize(10).font('Helvetica-Bold').text('Infrastructure Requirements:');
  doc.fontSize(9).font('Helvetica');
  addField(doc, 'Network Signal', assessment.networkSignal);
  addField(doc, 'Signal Strength', assessment.signalStrength);
  addField(doc, 'Connection Usage', assessment.connectionUsage);
  addField(doc, 'Router Location', assessment.routerLocation);
  addField(doc, 'Router Count', assessment.routerCount?.toString());
  addField(doc, 'Router Make', assessment.routerMake);
  addField(doc, 'Router Model', assessment.routerModel);
  addField(doc, 'Antenna Cable Required', assessment.antennaCable);
  addField(doc, 'Cable Footage', assessment.cableFootage?.toString());
  addField(doc, 'Device Connection Assistance', assessment.deviceConnectionAssistance);
  
  // Site Characteristics
  doc.moveDown(0.3);
  doc.fontSize(10).font('Helvetica-Bold').text('Site Characteristics:');
  doc.fontSize(9).font('Helvetica');
  addField(doc, 'Building Type', assessment.buildingType);
  addField(doc, 'Coverage Area', assessment.coverageArea);
  addField(doc, 'Floors', assessment.floors?.toString());
  addField(doc, 'Device Count', assessment.deviceCount?.toString());
  addField(doc, 'Ceiling Height', assessment.ceilingHeight);
  addField(doc, 'Ceiling Type', assessment.ceilingType);
  
  // Environmental Factors
  doc.moveDown(0.3);
  doc.fontSize(10).font('Helvetica-Bold').text('Environmental Factors:');
  doc.fontSize(9).font('Helvetica');
  addField(doc, 'Interference Sources', assessment.interferenceSources);
  addField(doc, 'Special Requirements', assessment.specialRequirements);
  
  // Advanced Configuration (if applicable)
  if (assessment.antennaType || assessment.routerMounting || assessment.dualWanSupport) {
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica-Bold').text('Advanced Configuration:');
    doc.fontSize(9).font('Helvetica');
    addField(doc, 'Antenna Type', assessment.antennaType);
    addField(doc, 'Antenna Installation Location', assessment.antennaInstallationLocation);
    addField(doc, 'Router Mounting', assessment.routerMounting);
    addField(doc, 'Dual WAN Support', assessment.dualWanSupport);
  }
}

function addFleetTrackingDetails(doc: PDFKit.PDFDocument, assessment: Assessment) {
  addSection(doc, 'Fleet Tracking Technical Details');
  
  addField(doc, 'Total Fleet Size', assessment.totalFleetSize?.toString());
  addField(doc, 'Vehicles for Installation', assessment.deviceCount?.toString());
  addField(doc, 'Tracker Type', assessment.trackerType);
  addField(doc, 'IoT Tracking Partner', assessment.iotTrackingPartner);
  addField(doc, 'Carrier SIM', assessment.carrierSim);
  
  // Vehicle Details
  if (assessment.vehicleYear || assessment.vehicleMake || assessment.vehicleModel) {
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica-Bold').text('Vehicle Details:');
    doc.fontSize(9).font('Helvetica');
    addField(doc, 'Vehicle Year', assessment.vehicleYear);
    addField(doc, 'Vehicle Make', assessment.vehicleMake);
    addField(doc, 'Vehicle Model', assessment.vehicleModel);
  }
}

function addFleetCameraDetails(doc: PDFKit.PDFDocument, assessment: Assessment) {
  addSection(doc, 'Fleet Camera Technical Details');
  
  addField(doc, 'Camera Solution Type', assessment.cameraSolutionType);
  addField(doc, 'Number of Cameras', assessment.numberOfCameras?.toString());
  addField(doc, 'Vehicles for Installation', assessment.deviceCount?.toString());
  addField(doc, 'Carrier SIM', assessment.carrierSim);
  
  // Existing System Information
  if (assessment.removalNeeded === 'yes') {
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica-Bold').text('Existing System Removal:');
    doc.fontSize(9).font('Helvetica');
    addField(doc, 'Removal Required', 'Yes');
    addField(doc, 'Existing Camera Solution', assessment.existingCameraSolution);
    if (assessment.otherSolutionDetails) {
      addField(doc, 'Other Solution Details', assessment.otherSolutionDetails);
    }
  }
  
  // Vehicle Details
  if (assessment.vehicleYear || assessment.vehicleMake || assessment.vehicleModel) {
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica-Bold').text('Vehicle Details:');
    doc.fontSize(9).font('Helvetica');
    addField(doc, 'Vehicle Year', assessment.vehicleYear);
    addField(doc, 'Vehicle Make', assessment.vehicleMake);
    addField(doc, 'Vehicle Model', assessment.vehicleModel);
  }
}

function drawTable(doc: PDFKit.PDFDocument, data: string[][]) {
  const startX = 40;
  const startY = doc.y + 10;
  const rowHeight = 15;
  const colWidths = [200, 80, 100, 100];
  
  data.forEach((row, rowIndex) => {
    let currentX = startX;
    const currentY = startY + (rowIndex * rowHeight);
    
    // Check if we need a new page
    if (currentY > 750) {
      doc.addPage();
      return;
    }
    
    row.forEach((cell, colIndex) => {
      if (rowIndex === 0) {
        doc.fontSize(9).font('Helvetica-Bold');
      } else if (rowIndex === data.length - 1) {
        doc.fontSize(9).font('Helvetica-Bold');
      } else {
        doc.fontSize(8).font('Helvetica');
      }
      
      doc.text(cell, currentX, currentY, {
        width: colWidths[colIndex],
        align: colIndex > 1 ? 'right' : 'left'
      });
      
      currentX += colWidths[colIndex];
    });
  });
  
  doc.y = startY + (data.length * rowHeight) + 10;
}