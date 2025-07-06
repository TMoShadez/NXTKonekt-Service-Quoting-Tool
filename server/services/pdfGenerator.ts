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
      let currentY = 90;
      doc.fontSize(12)
         .text('Customer Information', 50, currentY);
      
      currentY += 18;
      doc.fontSize(9)
         .text(`${assessment.customerCompanyName || 'Not specified'} | ${assessment.customerContactName || 'Not specified'}`, 50, currentY);
      currentY += 12;
      doc.text(`${assessment.customerPhone || 'Not specified'} | ${assessment.customerEmail || 'Not specified'}`, 50, currentY);

      // Service Information - Compact
      currentY += 20;
      doc.fontSize(12)
         .text('Service Information', 50, currentY);
      
      currentY += 18;
      const serviceTitle = getServiceTitle(assessment.serviceType ?? undefined);
      doc.fontSize(9)
         .text(`Service: ${serviceTitle}`, 50, currentY);
      currentY += 12;
      doc.text(`Location: ${assessment.siteAddress || 'Not specified'}`, 50, currentY);

      // Pricing breakdown header
      currentY += 20;
      doc.fontSize(12)
         .text('Pricing Breakdown', 50, currentY);

      const lineY = currentY + 15;
      
      // Table headers
      doc.fontSize(9)
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
      const removalHours = parseFloat(quote.removalHours?.toString() || '0');
      const removalCost = parseFloat(quote.removalCost?.toString() || '0');
      
      console.log('PDF Labor Hold Debug:', { laborHoldHours, laborHoldCost, quote });
      console.log('PDF Removal Debug:', { removalHours, removalCost, quote: { removalHours: quote.removalHours, removalCost: quote.removalCost } });
      
      // Survey line (only show if > 0 hours)
      if (surveyHours > 0) {
        doc.fontSize(9)
           .text('Site Survey & Planning', 50, currentY)
           .text(`${surveyHours}`, 300, currentY)
           .text(`$${hourlyRate}`, 350, currentY)
           .text(`$${surveyCost.toFixed(2)}`, 450, currentY);
        currentY += 14;
      }
      
      // Installation line
      doc.fontSize(9)
         .text('Installation & Setup', 50, currentY)
         .text(`${installationHours}`, 300, currentY)
         .text(`$${hourlyRate}`, 350, currentY)
         .text(`$${installationCost.toFixed(2)}`, 450, currentY);
      
      currentY += 14;
      
      // Configuration line (only show if > 0 hours and cost > 0)
      if (configurationHours > 0 && configurationCost > 0) {
        doc.fontSize(9)
           .text('Configuration & Testing', 50, currentY)
           .text(`${configurationHours}`, 300, currentY)
           .text(`$${hourlyRate}`, 350, currentY)
           .text(`$${configurationCost.toFixed(2)}`, 450, currentY);
        currentY += 14;
      } else if (configurationHours > 0) {
        doc.fontSize(9)
           .text('Configuration & Testing', 50, currentY)
           .text('Included', 450, currentY);
        currentY += 14;
      }
      
      // Existing System Removal line (only for Fleet Camera with removal needed)
      if (removalHours > 0 && removalCost > 0) {
        doc.fontSize(9)
           .text('Existing System Removal', 50, currentY)
           .text(`${removalHours}`, 300, currentY)
           .text(`$${hourlyRate}`, 350, currentY)
           .text(`$${removalCost.toFixed(2)}`, 450, currentY);
        currentY += 14;
      }
      
      // Labor Hold line - ALWAYS show if we have labor hold data
      if (laborHoldHours > 0 || laborHoldCost > 0) {
        doc.fontSize(9)
           .text('Labor Hold, Final bill Return', 50, currentY)
           .text(`${laborHoldHours}`, 300, currentY)
           .text(`$${hourlyRate}`, 350, currentY)
           .text(`$${laborHoldCost.toFixed(2)}`, 450, currentY);
        currentY += 14;
      }
      
      // Hardware line (cable costs)
      if (hardwareCost > 0) {
        doc.fontSize(9)
           .text('Hardware & Materials', 50, currentY)
           .text('', 300, currentY)
           .text('', 350, currentY)
           .text(`$${hardwareCost.toFixed(2)}`, 450, currentY);
        currentY += 14;
      }
      
      // Training line
      doc.fontSize(9)
         .text('Documentation & Training', 50, currentY)
         .text('Included', 450, currentY);

      // Total line
      currentY += 15;
      doc.moveTo(50, currentY)
         .lineTo(550, currentY)
         .stroke();

      currentY += 8;
      const totalCost = parseFloat(quote.totalCost?.toString() || '0');
      doc.fontSize(11)
         .text('Total Project Cost', 50, currentY)
         .text(`$${totalCost.toFixed(2)}`, 450, currentY);

      // Terms and conditions - compact
      currentY += 20;
      doc.fontSize(9)
         .text('Terms & Conditions:', 50, currentY);
      currentY += 12;
      doc.text('• Quote valid for 30 days from generation date', 50, currentY);
      currentY += 12;
      doc.text('• Labor hold returned if unused in final billing', 50, currentY);
      currentY += 12;
      doc.text('• Installation subject to site assessment approval', 50, currentY);
      currentY += 12;
      doc.text('• Contact your sales representative for questions', 50, currentY);

      // Statement of Work for Fleet Tracking - optimized for space
      if (assessment.serviceType === 'fleet-tracking') {
        // Always start on new page for SOW to keep it organized
        doc.addPage();
        currentY = 50;
        
        doc.fontSize(11)
           .text('Statement of Work: Fleet Tracker Equipment Installation (OBD-II)', 50, currentY);
        
        currentY += 18;
        doc.fontSize(8)
           .text('This document outlines the scope of work for the professional installation of fleet tracker equipment into your individual vehicle(s) through its Smart Data II (OBD-II) port. This service ensures proper device connection and initial functionality testing, enabling you to effectively monitor your fleet. All hardware will be provided by your designated Wireless Vendor. All installation materials (zip-ties, mounting tape) will be provided by NXTKonekt/Tekumo.', 50, currentY, { width: 500 });
        
        currentY += 35;
        doc.fontSize(9)
           .text('Summary of Services', 50, currentY);
        
        currentY += 14;
        doc.fontSize(8)
           .text('Our technician will install fleet tracker equipment in each vehicle by performing: • Vehicle Preparation: Identifying OBD-II port and ensuring safe installation environment. • Device Connection: Securely plugging tracker into OBD-II port. • Cable Management: Neatly securing device and cabling. • Device Verification: Confirming power and communication.', 50, currentY, { width: 500 });
        
        currentY += 30;
        doc.fontSize(9)
           .text('Installation Process', 50, currentY);
        
        currentY += 14;
        doc.fontSize(8)
           .text('1. Pre-Installation: Vehicle identification, access vehicle, locate OBD-II port (typically within 3 feet of steering wheel, under dashboard), assess installation area for secure and discrete placement.', 50, currentY, { width: 500 });
        
        currentY += 18;
        doc.text('2. Device Installation: Connect tracker directly to OBD-II port, verify initial power through indicator lights to ensure proper power from vehicle port.', 50, currentY, { width: 500 });
        
        currentY += 18;
        doc.text('3. Cable Management: Secure device and cables using mounting materials (zip ties, mounting tape) without interfering with vehicle operations, preventing tampering, achieving discreet installation. Conceal device and cables when possible without obstructing vehicle controls.', 50, currentY, { width: 500 });
        
        currentY += 25;
        doc.text('4. Functionality Verification: Confirm device power and light pattern detection, check cellular/GPS signal indicators if available (full transmission verification by cellular provider), ensure no interference with vehicle systems.', 50, currentY, { width: 500 });
        
        currentY += 30;
        doc.fontSize(9)
           .text('Time Estimate', 50, currentY);
        
        currentY += 14;
        doc.fontSize(8)
           .text('Estimated installation time: 20 minutes per vehicle, depending on vehicle size and OBD-II port access. Final charge reflects actual time on-site including minimum service fee plus additional time for completion. Preliminary labor hold of $190.00 for unforeseen challenges or delays.', 50, currentY, { width: 500 });
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