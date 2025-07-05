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
      const doc = new PDFDocument({ margin: 50 });
      doc.pipe(fs.createWriteStream(filePath));

      // Header with logo
      const logoPath = path.join(process.cwd(), 'attached_assets', 'NxtKonekt Astro 5_1749972215768.png');
      
      // Check if logo exists and add it
      if (fs.existsSync(logoPath)) {
        try {
          doc.image(logoPath, 50, 40, { width: 60, height: 60 });
        } catch (logoError) {
          console.warn('Could not load logo for PDF:', logoError);
        }
      }
      
      // Company name and title (positioned to right of logo)
      const serviceTitle = getServiceTitle(assessment.serviceType ?? undefined);
      doc.fontSize(20)
         .text('NXTKonekt', 120, 50)
         .fontSize(16)
         .text(`${serviceTitle} Installation Quote`, 120, 75);

      // Quote details (moved down to accommodate logo)
      doc.fontSize(12)
         .text(`Quote Number: ${quote.quoteNumber}`, 50, 130)
         .text(`Date: ${new Date().toLocaleDateString()}`, 50, 150)
         .text(`Sales Organization: ${organizationName}`, 50, 170);

      // Customer information - using actual assessment data
      doc.fontSize(14)
         .text('Customer Information', 50, 210)
         .fontSize(12)
         .text(`Company: ${assessment.customerCompanyName || 'Not provided'}`, 50, 230)
         .text(`Contact: ${assessment.customerContactName || 'Not provided'}`, 50, 250)
         .text(`Email: ${assessment.customerEmail || 'Not provided'}`, 50, 270)
         .text(`Phone: ${assessment.customerPhone || 'Not provided'}`, 50, 290)
         .text(`Site Address: ${assessment.siteAddress || 'Not provided'}`, 50, 310);

      // Service-specific assessment summary
      const serviceType = assessment.serviceType || 'site-assessment';
      let summaryTitle = 'Site Assessment Summary';
      let summaryContent = '';
      
      if (serviceType === 'fleet-tracking') {
        summaryTitle = 'Fleet Tracking Requirements';
        summaryContent = `Vehicle Count: ${assessment.deviceCount || 'Not specified'}\n` +
                        `Vehicle Types: ${assessment.buildingType || 'Not specified'}\n` +
                        `Operating Hours: ${assessment.industry || 'Not specified'}\n` +
                        `Coverage Area: ${assessment.siteAddress || 'Not specified'}`;
      } else if (serviceType === 'fleet-camera') {
        summaryTitle = 'Fleet Camera Requirements';
        summaryContent = `Vehicle Count: ${assessment.deviceCount || 'Not specified'}\n` +
                        `Vehicle Types: ${assessment.buildingType || 'Not specified'}\n` +
                        `Camera Purpose: ${assessment.industry || 'Not specified'}`;
      } else {
        summaryTitle = 'Site Assessment Summary';
        summaryContent = `Building Type: ${assessment.buildingType || 'Not specified'}\n` +
                        `Coverage Area: ${assessment.coverageArea || 'Not specified'} sq ft\n` +
                        `Number of Floors: ${assessment.floors || 'Not specified'}\n` +
                        `Expected Device Count: ${assessment.deviceCount || 'Not specified'}`;
      }
      
      doc.fontSize(14)
         .text(summaryTitle, 50, 350)
         .fontSize(12);
      
      const lines = summaryContent.split('\n');
      let yPos = 370;
      lines.forEach(line => {
        doc.text(line, 50, yPos);
        yPos += 20;
      });

      // Pricing breakdown
      doc.fontSize(14)
         .text('Pricing Breakdown', 50, 470);

      const lineY = 490;
      doc.fontSize(12)
         .text('Service Item', 50, lineY)
         .text('Hours', 300, lineY)
         .text('Rate', 350, lineY)
         .text('Cost', 450, lineY);

      // Draw line
      doc.moveTo(50, lineY + 15)
         .lineTo(550, lineY + 15)
         .stroke();

      let currentY = lineY + 25;
      
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
      
      // Survey line (only show if > 0 hours)
      if (surveyHours > 0) {
        doc.text('Site Survey & Planning', 50, currentY)
           .text(`${surveyHours}`, 300, currentY)
           .text(`$${hourlyRate}`, 350, currentY)
           .text(`$${surveyCost.toFixed(2)}`, 450, currentY);
        currentY += 20;
      }
      
      // Installation line
      doc.text('Installation & Setup', 50, currentY)
         .text(`${installationHours}`, 300, currentY)
         .text(`$${hourlyRate}`, 350, currentY)
         .text(`$${installationCost.toFixed(2)}`, 450, currentY);
      
      currentY += 20;
      
      // Configuration line (only show if > 0 hours and cost > 0)
      if (configurationHours > 0 && configurationCost > 0) {
        doc.text('Configuration & Testing', 50, currentY)
           .text(`${configurationHours}`, 300, currentY)
           .text(`$${hourlyRate}`, 350, currentY)
           .text(`$${configurationCost.toFixed(2)}`, 450, currentY);
        currentY += 20;
      } else if (configurationHours > 0) {
        doc.text('Configuration & Testing', 50, currentY)
           .text('Included', 450, currentY);
        currentY += 20;
      }
      
      // Labor Hold line (always show for all quotes)
      if (laborHoldHours > 0 || laborHoldCost > 0) {
        doc.text('Labor hold for possible overage, returned if unused in final billing', 50, currentY)
           .text(`${laborHoldHours}`, 300, currentY)
           .text(`$${hourlyRate}`, 350, currentY)
           .text(`$${laborHoldCost.toFixed(2)}`, 450, currentY);
        currentY += 20;
      }
      
      // Hardware line (cable costs)
      if (hardwareCost > 0) {
        doc.text('Hardware', 50, currentY)
           .text('', 300, currentY)
           .text('', 350, currentY)
           .text(`$${hardwareCost.toFixed(2)}`, 450, currentY);
        currentY += 20;
      }
      
      // Training line
      doc.text('Documentation & Training', 50, currentY)
         .text('Included', 450, currentY);

      // Total line
      currentY += 30;
      doc.moveTo(50, currentY)
         .lineTo(550, currentY)
         .stroke();

      currentY += 10;
      const totalCost = parseFloat(quote.totalCost?.toString() || '0');
      doc.fontSize(14)
         .text('Total Project Cost', 50, currentY)
         .text(`$${totalCost.toFixed(2)}`, 450, currentY);

      // Additional notes
      if (assessment.additionalNotes) {
        doc.fontSize(14)
           .text('Additional Notes', 50, currentY + 40)
           .fontSize(12)
           .text(assessment.additionalNotes, 50, currentY + 60, { width: 500 });
      }

      // Footer
      doc.fontSize(10)
         .text('This quote is valid for 30 days from the date of generation.', 50, 750)
         .text('Contact your sales representative for any questions or modifications.', 50, 765);

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
