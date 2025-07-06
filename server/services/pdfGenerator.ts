import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { Assessment, Quote } from '@shared/schema';

export interface QuoteData {
  assessment: Assessment;
  quote: Quote;
  organizationName: string;
}

function getServiceTitle(serviceType?: string): string {
  switch (serviceType) {
    case 'fleet-tracking':
      return 'Fleet & Asset Tracking Device';
    case 'fleet-camera':
      return 'Fleet Camera Installation';
    default:
      return 'Fixed Wireless Access';
  }
}

export async function generateQuotePDF(quoteData: QuoteData): Promise<string> {
  const { assessment, quote, organizationName } = quoteData;
  
  // Create PDFs directory if it doesn't exist
  const pdfsDir = path.join(process.cwd(), 'uploads', 'pdfs');
  if (!fs.existsSync(pdfsDir)) {
    fs.mkdirSync(pdfsDir, { recursive: true });
  }

  const fileName = `quote-${quote.quoteNumber}.pdf`;
  const filePath = path.join(pdfsDir, fileName);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40 });
      doc.pipe(fs.createWriteStream(filePath));

      // Header with logo
      const logoPath = path.join(process.cwd(), 'attached_assets', 'NxtKonekt Astro 5_1749972215768.png');
      
      // Check if logo exists and add it
      if (fs.existsSync(logoPath)) {
        try {
          doc.image(logoPath, 50, 30, { width: 50, height: 50 });
        } catch (logoError) {
          console.warn('Could not load logo for PDF:', logoError);
        }
      }

      // Company name and title
      doc.fontSize(18)
         .text('NXTKonekt', 110, 35)
         .fontSize(12)
         .text('Professional Installation Services', 110, 55)
         .fontSize(11)
         .text(`Quote #${quote.quoteNumber}`, 450, 35)
         .text(`Date: ${new Date().toLocaleDateString()}`, 450, 50);

      // Customer Information - Compact
      let currentY = 100;
      doc.fontSize(14)
         .text('Customer Information', 50, currentY);
      
      currentY += 20;
      doc.fontSize(10)
         .text(`${assessment.customerCompanyName || 'Not specified'} | ${assessment.customerContactName || 'Not specified'}`, 50, currentY)
         .text(`${assessment.customerPhone || 'Not specified'} | ${assessment.customerEmail || 'Not specified'}`, 50, currentY + 12);

      // Service Information - Compact
      currentY += 35;
      doc.fontSize(14)
         .text('Service Information', 50, currentY);
      
      currentY += 20;
      const serviceTitle = getServiceTitle(assessment.serviceType ?? undefined);
      doc.fontSize(10)
         .text(`Service: ${serviceTitle}`, 50, currentY)
         .text(`Location: ${assessment.siteAddress || 'Not specified'}`, 50, currentY + 12);

      // Pricing breakdown header
      currentY += 35;
      doc.fontSize(14)
         .text('Pricing Breakdown', 50, currentY);

      const lineY = currentY + 18;
      
      // Table headers
      doc.fontSize(10)
         .text('Service Item', 50, lineY)
         .text('Hours', 300, lineY)
         .text('Rate', 350, lineY)
         .text('Cost', 450, lineY);

      // Draw line
      doc.moveTo(50, lineY + 12)
         .lineTo(550, lineY + 12)
         .stroke();

      currentY = lineY + 18;
      
      // Parse numeric values from quote (handle string/decimal conversion)
      const surveyHours = parseFloat(quote.surveyHours?.toString() || '0');
      const installationHours = parseFloat(quote.installationHours?.toString() || '0');
      const configurationHours = parseFloat(quote.configurationHours?.toString() || '0');
      const laborHoldHours = parseFloat(quote.laborHoldHours?.toString() || '0');
      const hourlyRate = parseFloat(quote.hourlyRate?.toString() || '190');
      const hardwareCost = parseFloat(quote.hardwareCost?.toString() || '0');
      const surveyCost = parseFloat(quote.surveyCost?.toString() || '0');
      const installationCost = parseFloat(quote.installationCost?.toString() || '0');
      const configurationCost = parseFloat(quote.configurationCost?.toString() || '0');
      const laborHoldCost = parseFloat(quote.laborHoldCost?.toString() || '0');
      
      console.log('PDF Labor Hold Debug:', { laborHoldHours, laborHoldCost, quote });
      
      // Survey line (only show if > 0 hours)
      if (surveyHours > 0) {
        doc.text('Site Survey & Planning', 50, currentY)
           .text(`${surveyHours}`, 300, currentY)
           .text(`$${hourlyRate}`, 350, currentY)
           .text(`$${surveyCost.toFixed(2)}`, 450, currentY);
        currentY += 15;
      }
      
      // Installation line
      doc.text('Installation & Setup', 50, currentY)
         .text(`${installationHours}`, 300, currentY)
         .text(`$${hourlyRate}`, 350, currentY)
         .text(`$${installationCost.toFixed(2)}`, 450, currentY);
      
      currentY += 15;
      
      // Configuration line (only show if > 0 hours and cost > 0)
      if (configurationHours > 0 && configurationCost > 0) {
        doc.text('Configuration & Testing', 50, currentY)
           .text(`${configurationHours}`, 300, currentY)
           .text(`$${hourlyRate}`, 350, currentY)
           .text(`$${configurationCost.toFixed(2)}`, 450, currentY);
        currentY += 15;
      } else if (configurationHours > 0) {
        doc.text('Configuration & Testing', 50, currentY)
           .text('Included', 450, currentY);
        currentY += 15;
      }
      
      // Labor Hold line - ALWAYS show if we have labor hold data
      if (laborHoldHours > 0 || laborHoldCost > 0) {
        doc.text('Labor Hold - Overage Reserve', 50, currentY)
           .text(`${laborHoldHours}`, 300, currentY)
           .text(`$${hourlyRate}`, 350, currentY)
           .text(`$${laborHoldCost.toFixed(2)}`, 450, currentY);
        currentY += 15;
      }
      
      // Hardware line (cable costs)
      if (hardwareCost > 0) {
        doc.text('Hardware & Materials', 50, currentY)
           .text('', 300, currentY)
           .text('', 350, currentY)
           .text(`$${hardwareCost.toFixed(2)}`, 450, currentY);
        currentY += 15;
      }
      
      // Training line
      doc.text('Documentation & Training', 50, currentY)
         .text('Included', 450, currentY);

      // Total line
      currentY += 20;
      doc.moveTo(50, currentY)
         .lineTo(550, currentY)
         .stroke();

      currentY += 8;
      const totalCost = parseFloat(quote.totalCost?.toString() || '0');
      doc.fontSize(12)
         .text('Total Project Cost', 50, currentY)
         .text(`$${totalCost.toFixed(2)}`, 450, currentY);

      // Terms and conditions - compact
      currentY += 35;
      doc.fontSize(10)
         .text('Terms & Conditions:', 50, currentY)
         .text('• Quote valid for 30 days from generation date', 50, currentY + 12)
         .text('• Labor hold returned if unused in final billing', 50, currentY + 24)
         .text('• Installation subject to site assessment approval', 50, currentY + 36)
         .text('• Contact your sales representative for questions', 50, currentY + 48);

      // Statement of Work for Fleet Tracking - check if new page needed
      if (assessment.serviceType === 'fleet-tracking') {
        currentY += 70;
        
        // Check if we need a new page
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }
        
        doc.fontSize(12)
           .text('Statement of Work: Fleet Tracker Equipment Installation (OBD-II)', 50, currentY);
        
        currentY += 20;
        doc.fontSize(9)
           .text('This document outlines the scope of work for the professional installation of fleet tracker equipment into your individual vehicle(s) through its Smart Data II (OBD-II) port. This service ensures proper device connection and initial functionality testing, enabling you to effectively monitor your fleet.', 50, currentY, { width: 500 });
        
        currentY += 35;
        doc.text('All hardware for the fleet tracker equipment will be provided by your designated Wireless Vendor. All necessary installation materials (zip-ties, mounting tape) will be provided by NXTKonekt/Tekumo.', 50, currentY, { width: 500 });
        
        currentY += 35;
        doc.fontSize(10)
           .text('Summary of Services', 50, currentY);
        
        currentY += 15;
        doc.fontSize(9)
           .text('Our designated technician will install fleet tracker equipment in each designated vehicle by performing the following key steps:', 50, currentY, { width: 500 });
        
        currentY += 20;
        doc.text('• Vehicle Preparation: Identifying the vehicle\'s OBD-II port and ensuring a safe work / accessible installation environment.', 50, currentY, { width: 500 });
        currentY += 15;
        doc.text('• Device Connection: Securely plugging the fleet tracker device into the vehicle\'s OBD-II port.', 50, currentY, { width: 500 });
        currentY += 15;
        doc.text('• Cable Management: Neatly securing the device and any associated cabling to prevent interference with vehicle operation and to ensure a clean installation.', 50, currentY, { width: 500 });
        currentY += 15;
        doc.text('• Device Verification: Confirming the device is powered on and communicating correctly.', 50, currentY, { width: 500 });
        
        currentY += 25;
        doc.fontSize(10)
           .text('Our Process', 50, currentY);
        
        currentY += 15;
        doc.fontSize(9)
           .text('Here\'s a detailed breakdown of the steps our technician will take for each vehicle:', 50, currentY, { width: 500 });
        
        currentY += 20;
        doc.fontSize(9)
           .text('1. Pre-Installation Check', 50, currentY);
        currentY += 12;
        doc.fontSize(8)
           .text('• Vehicle Identification: The technician will confirm the specific vehicle to be worked on with your designated contact.', 60, currentY, { width: 490 });
        currentY += 10;
        doc.text('• Access Vehicle: Access the vehicle to begin the installation process.', 60, currentY, { width: 490 });
        currentY += 10;
        doc.text('• Locate OBD-II Port: The technician will locate the vehicle\'s OBD-II port, which is typically found within 3 feet of the steering wheel, often under the dashboard on the driver\'s side.', 60, currentY, { width: 490 });
        currentY += 15;
        doc.text('• Assess Installation Area: A quick assessment of the area around the OBD-II port will be made to determine the best approach for a secure and discrete installation.', 60, currentY, { width: 490 });
        
        currentY += 20;
        doc.fontSize(9)
           .text('2. Device Installation', 50, currentY);
        currentY += 12;
        doc.fontSize(8)
           .text('• Connect Device: The fleet tracker device will be carefully plugged directly into the vehicle\'s OBD-II port.', 60, currentY, { width: 490 });
        currentY += 10;
        doc.text('• Verify Initial Power: The technician will observe the device\'s indicator lights (if applicable) to ensure it is properly powered from the vehicle\'s OBD-II port.', 60, currentY, { width: 490 });
        
        currentY += 20;
        doc.fontSize(9)
           .text('3. Cable Management', 50, currentY);
        currentY += 12;
        doc.fontSize(8)
           .text('• Secure Device and Cables: The device and any associated cables will be neatly secured using appropriate mounting materials (zip ties, mounting tape) without interfering with vehicle operations, preventing tampering, and achieving a discreet and safe installation.', 60, currentY, { width: 490 });
        currentY += 15;
        doc.text('• Concealment (where possible): Efforts will be made to discreetly conceal the device and cables without obstructing vehicle controls or access to other ports.', 60, currentY, { width: 490 });
        
        currentY += 20;
        doc.fontSize(9)
           .text('4. Functionality Verification', 50, currentY);
        currentY += 12;
        doc.fontSize(8)
           .text('• Power Confirmation: The technician will verify that the device is powered and (if applicable) is detected by a specific light pattern message.', 60, currentY, { width: 490 });
        currentY += 10;
        doc.text('• Connectivity Check: If the device has a visual indicator for cellular or GPS signal, the technician will observe to confirm it has been established or has established a connection. (Note: Full data transmission verification may occur remotely by your cellular service provider).', 60, currentY, { width: 490 });
        currentY += 15;
        doc.text('• Basic Operation Check: Ensure the device does not interfere with the vehicle\'s normal systems.', 60, currentY, { width: 490 });
        
        currentY += 25;
        doc.fontSize(10)
           .text('Estimated Time Per Vehicle', 50, currentY);
        currentY += 15;
        doc.fontSize(9)
           .text('The estimated time on-site for the installation of one fleet tracker device is typically 20 minutes per vehicle, depending on vehicle size and access to the OBD-II port access.', 50, currentY, { width: 500 });
        currentY += 20;
        doc.text('Work will be completed within a typical timeframe, the final charge will accurately reflect the actual time our team spends on-site. This includes the minimum service fee plus any additional time for completion. Any on-site challenges or unexpected extra work or unforeseen delay. A preliminary Travel hold of $190.00 in total hold.', 50, currentY, { width: 500 });
      }

      // Additional notes - if any
      if (assessment.additionalNotes) {
        currentY += 35;
        // Check if we need a new page for additional notes
        if (currentY > 750) {
          doc.addPage();
          currentY = 50;
        }
        doc.fontSize(10)
           .text('Additional Notes:', 50, currentY)
           .text(assessment.additionalNotes, 50, currentY + 12, { width: 500 });
      }

      doc.end();

      doc.on('end', () => {
        resolve(filePath);
      });

      doc.on('error', (error) => {
        reject(error);
      });

    } catch (error) {
      reject(error);
    }
  });
}