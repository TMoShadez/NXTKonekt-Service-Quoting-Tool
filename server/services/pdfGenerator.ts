import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { Assessment, Quote } from '@shared/schema';

export interface QuoteData {
  assessment: Assessment;
  quote: Quote;
  organizationName: string;
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

      // Header
      doc.fontSize(20)
         .text('NXT Konekt', 50, 50)
         .fontSize(16)
         .text('Fixed Wireless Access Installation Quote', 50, 80);

      // Quote details
      doc.fontSize(12)
         .text(`Quote Number: ${quote.quoteNumber}`, 50, 120)
         .text(`Date: ${new Date().toLocaleDateString()}`, 50, 140)
         .text(`Sales Organization: ${organizationName}`, 50, 160);

      // Customer information
      doc.fontSize(14)
         .text('Customer Information', 50, 200)
         .fontSize(12)
         .text(`Company: ${assessment.customerCompanyName}`, 50, 220)
         .text(`Contact: ${assessment.customerContactName}`, 50, 240)
         .text(`Email: ${assessment.customerEmail}`, 50, 260)
         .text(`Phone: ${assessment.customerPhone}`, 50, 280)
         .text(`Site Address: ${assessment.siteAddress}`, 50, 300);

      // Site assessment summary
      doc.fontSize(14)
         .text('Site Assessment Summary', 50, 340)
         .fontSize(12)
         .text(`Building Type: ${assessment.buildingType || 'Not specified'}`, 50, 360)
         .text(`Coverage Area: ${assessment.coverageArea || 'Not specified'} sq ft`, 50, 380)
         .text(`Number of Floors: ${assessment.floors || 'Not specified'}`, 50, 400)
         .text(`Expected Device Count: ${assessment.deviceCount || 'Not specified'}`, 50, 420);

      // Pricing breakdown
      doc.fontSize(14)
         .text('Pricing Breakdown', 50, 460);

      const lineY = 480;
      doc.fontSize(12)
         .text('Service Item', 50, lineY)
         .text('Cost', 400, lineY);

      // Draw line
      doc.moveTo(50, lineY + 15)
         .lineTo(550, lineY + 15)
         .stroke();

      let currentY = lineY + 25;
      
      doc.text('Site Survey & Planning', 50, currentY)
         .text(`$${quote.surveyCost}`, 400, currentY);
      
      currentY += 20;
      doc.text('Router Installation', 50, currentY)
         .text(`$${quote.installationCost}`, 400, currentY);
      
      currentY += 20;
      doc.text('Configuration & Testing', 50, currentY)
         .text(`$${quote.configurationCost}`, 400, currentY);
      
      currentY += 20;
      doc.text('Documentation & Training', 50, currentY)
         .text(`$${quote.trainingCost}`, 400, currentY);

      // Total line
      currentY += 30;
      doc.moveTo(50, currentY)
         .lineTo(550, currentY)
         .stroke();

      currentY += 10;
      doc.fontSize(14)
         .text('Total Project Cost', 50, currentY)
         .text(`$${quote.totalCost}`, 400, currentY);

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
