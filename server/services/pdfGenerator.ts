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

      // Statement of Work for Fleet Camera - optimized for readability with proper spacing
      if (assessment.serviceType === 'fleet-camera') {
        // Always start on new page for SOW to keep it organized
        doc.addPage();
        currentY = 50;
        
        doc.fontSize(11)
           .text('Statement of Work: Fleet Camera Dashcam and Optional External Camera Installation', 50, currentY);
        
        currentY += 20;
        doc.fontSize(8)
           .text('This document outlines the scope of work for the professional installation of fleet camera equipment into your individual vehicle(s) including dashcams, external cameras, and optional existing system removal. This service ensures proper device connection and initial functionality testing, enabling you to effectively monitor your fleet.', 50, currentY, { width: 500 });
        
        currentY += 28;
        doc.fontSize(9)
           .text('Summary of Services', 50, currentY);
        
        currentY += 16;
        doc.fontSize(8)
           .text('• Vehicle Preparation: Pre-installation check and planning', 50, currentY, { width: 500 });
        currentY += 12;
        doc.text('• Fleet Camera Dashcam Installation: Professional installation for optimal performance', 50, currentY, { width: 500 });
        currentY += 12;
        doc.text('• Optional External Camera Installation (if selected): Additional camera points for comprehensive coverage', 50, currentY, { width: 500 });
        currentY += 12;
        doc.text('• Optional Fleet Tracker Installation (if selected): Integration with existing fleet management systems', 50, currentY, { width: 500 });
        
        currentY += 20;
        doc.fontSize(9)
           .text('Our Process', 50, currentY);
        
        currentY += 16;
        doc.fontSize(8)
           .text('Pre-Installation Check and Planning: Vehicle identification to confirm details and access requirements, power assessment to verify adequate supply and identify optimal connection points, camera positioning to determine optimal placement for maximum coverage while maintaining driver visibility, wiring route planning for efficient and secure cable routing.', 50, currentY, { width: 500 });
        
        currentY += 30;
        doc.text('Fleet Camera Dashcam Installation: Securely mount dashcam in optimal position for clear forward view, connect to vehicle power system with proper voltage protection, route and secure all cables to prevent interference with vehicle operation, configure basic camera settings and verify proper operation.', 50, currentY, { width: 500 });
        
        currentY += 30;
        doc.text('Optional External Camera Installation (if selected): Install external cameras at specified locations (rear, side, etc.), ensure all external connections are properly sealed and weatherproofed, connect external cameras to main dashcam unit or recording system, verify all camera feeds are properly integrated and functioning.', 50, currentY, { width: 500 });
        
        currentY += 30;
        doc.text('Optional Fleet Tracker Installation (if selected): Connect fleet tracker to vehicle\'s diagnostic port, confirm tracker receives adequate power and signal, verify tracker communicates properly with fleet management system, ensure accurate location and vehicle data reporting.', 50, currentY, { width: 500 });
        
        currentY += 25;
        doc.fontSize(9)
           .text('Functionality Verification', 50, currentY);
        
        currentY += 16;
        doc.fontSize(8)
           .text('Power Test: Verify all devices receive proper power and show correct status indicators.', 50, currentY, { width: 500 });
        currentY += 12;
        doc.text('Recording Test: Confirm all cameras are recording properly with clear image quality.', 50, currentY, { width: 500 });
        currentY += 12;
        doc.text('Storage Verification: Ensure adequate storage capacity and proper file management.', 50, currentY, { width: 500 });
        currentY += 12;
        doc.text('System Integration: Verify all components work together seamlessly.', 50, currentY, { width: 500 });
        currentY += 12;
        doc.text('Final Inspection: Complete system check to ensure professional installation quality.', 50, currentY, { width: 500 });
        
        currentY += 20;
        doc.fontSize(9)
           .text('Post-Installation Clean-up', 50, currentY);
        
        currentY += 16;
        doc.fontSize(8)
           .text('Remove all installation materials and packaging. Ensure vehicle interior is clean and professional. Provide basic operation instructions and contact information for support.', 50, currentY, { width: 500 });
        
        currentY += 20;
        doc.fontSize(9)
           .text('Estimated Time Per Vehicle', 50, currentY);
        
        currentY += 16;
        doc.fontSize(8)
           .text('Fleet Camera Dashcam Only: Approximately 45-60 minutes per vehicle.', 50, currentY, { width: 500 });
        currentY += 12;
        doc.text('Fleet Camera Dashcam + Optional External Cameras: Approximately 60-90 minutes per vehicle.', 50, currentY, { width: 500 });
        currentY += 12;
        doc.text('Fleet Camera Dashcam + Optional Fleet Tracker: Approximately 60-75 minutes per vehicle.', 50, currentY, { width: 500 });
        currentY += 12;
        doc.text('Complete Installation (All Components): Approximately 75-120 minutes per vehicle.', 50, currentY, { width: 500 });
        
        currentY += 18;
        doc.text('Work will be completed within a typical timeframe, the final charge will accurately reflect the actual time our team spends on-site. This includes the minimum service fee plus any additional time for completion. Any on-site challenges or unexpected extra work or unforeseen delay. A preliminary labor hold of $190.00 in total hold.', 50, currentY, { width: 500 });
      }

      // Statement of Work for Fixed Wireless (Primary + Antenna) - optimized for readability
      if (assessment.serviceType === 'site-assessment' && 
          assessment.connectionUsage === 'primary' && 
          assessment.lowSignalAntennaCable === 'yes') {
        // Always start on new page for SOW to keep it organized
        doc.addPage();
        currentY = 50;
        
        doc.fontSize(11)
           .text('Scope of Work: Primary Cellular Wireless Router Installation with Antenna Installation', 50, currentY);
        
        currentY += 20;
        doc.fontSize(8)
           .text('This document outlines the scope of work for the installation of a cellular wireless router to serve as your primary internet service provider (ISP) at the designated location. This comprehensive service includes a detailed site survey, preparation and installation of the wireless router, and, if necessary, the running of up to 200 feet of coaxial cable for the installation of an internal antenna to optimize signal strength.', 50, currentY, { width: 500 });
        
        currentY += 28;
        doc.text('Hardware for this project will be provided by your Wireless Vendor. All necessary materials will be provided by NXTKonekt/Tekumo.', 50, currentY, { width: 500 });
        
        currentY += 20;
        doc.fontSize(9)
           .text('Summary of Services', 50, currentY);
        
        currentY += 16;
        doc.fontSize(8)
           .text('Our team will install a cellular wireless router, performing the following key steps:', 50, currentY, { width: 500 });
        
        currentY += 16;
        doc.text('• Site Survey: A thorough assessment of your location to determine the optimal placement for the wireless router and, if required, the best position for an external or internal antenna to achieve maximum cellular signal.', 50, currentY, { width: 500 });
        currentY += 18;
        doc.text('• Router Preparation: Unboxing and verifying all components of the wireless router, and reviewing the manufacturer\'s documentation.', 50, currentY, { width: 500 });
        currentY += 18;
        doc.text('• Mounting and Installation: Securely mounting the router and/or antenna (if applicable) and connecting all necessary components, including power and coaxial cable.', 50, currentY, { width: 500 });
        currentY += 18;
        doc.text('• Coaxial Cable Installation (If Needed): Running and terminating up to 200 feet of coaxial cable to connect the router to a strategically placed internal antenna for enhanced signal reception.', 50, currentY, { width: 500 });
        currentY += 18;
        doc.text('• Basic Router Configuration: Setting up the cellular connection, establishing Wi-Fi connectivity, and performing initial testing to confirm primary internet functionality.', 50, currentY, { width: 500 });
        
        currentY += 20;
        doc.fontSize(9)
           .text('Our Process', 50, currentY);
        
        currentY += 16;
        doc.fontSize(8)
           .text('Here\'s a detailed breakdown of the steps our technician will take:', 50, currentY, { width: 500 });
        
        currentY += 20;
        doc.fontSize(9)
           .text('Preparation and Planning', 50, currentY);
        
        currentY += 14;
        doc.fontSize(8)
           .text('Location Determination: Our technician will collaborate with your site contact to identify the preferred location for the cellular wireless router. A comprehensive wireless survey using a cellular device will be conducted to determine the optimal position for the antenna, ensuring the best possible signal reception. If cable routing is necessary, the technician will review the above-ceiling space to determine the most efficient and least intrusive cable path.', 50, currentY, { width: 500 });
        
        currentY += 30;
        doc.text('Route Planning (If Cable Run Needed): A detailed plan will be developed for the coaxial cable path, aiming to minimize bends and avoid potential interference sources such as power lines or fluorescent lights. Future needs and potential expansion will be considered, allowing for adequate cable slack (at least 5-10 feet).', 50, currentY, { width: 500 });
        
        currentY += 25;
        doc.text('Hardware Verification: All hardware, provided by the wireless vendor, will be checked to ensure all components are present and accounted for. Documentation Review: The manufacturer\'s installation guide and user manual for the router will be thoroughly reviewed.', 50, currentY, { width: 500 });
        
        currentY += 25;
        doc.fontSize(9)
           .text('Coaxial Cable Installation (If Required)', 50, currentY);
        
        currentY += 14;
        doc.fontSize(8)
           .text('Drilling Holes: If necessary, holes will be carefully drilled through studs or walls, ensuring they are sufficiently sized for the cable to pass through comfortably. Structural members will be avoided. Using Fish Tape/Rods: For routing cable through walls or conduits, fish tape or rods will be utilized to guide the cable, with the cable securely attached.', 50, currentY, { width: 500 });
        
        currentY += 30;
        doc.text('Pulling Cable: The cable will be pulled carefully and smoothly, avoiding excessive tension or abrupt movements. The cable\'s bend radius specifications will be adhered to. Avoiding Interference: Coaxial cables will be kept clear of power lines and other sources of electromagnetic interference. If crossing power lines is unavoidable, it will be done at a 90-degree angle.', 50, currentY, { width: 500 });
        
        currentY += 30;
        doc.text('Securing Cables: Cable ties or clips will be used to secure the cable along its run, preventing sagging, tangling, or resting on ceiling surfaces. Cable ties will not be overtightened to prevent damage. Labeling Cables: Both ends of each installed cable will be clearly labeled with a unique identifier to facilitate future troubleshooting.', 50, currentY, { width: 500 });
        
        currentY += 25;
        doc.fontSize(9)
           .text('Coaxial Cable Termination (If Required)', 50, currentY);
        
        currentY += 14;
        doc.fontSize(8)
           .text('Stripping Cable Jacket: A coaxial cable stripper will be used to carefully remove the outer jacket of the cable, exposing the center conductor and shielding. Care will be taken to avoid nicking the center conductor. Preparing Connector: The connector manufacturer\'s instructions will be followed for preparing the connector, which may involve sliding a compression ring onto the cable.', 50, currentY, { width: 500 });
        
        currentY += 30;
        doc.text('Inserting Cable into Connector: The prepared cable will be inserted into the F-type connector, ensuring the center conductor is properly seated. Crimping Connector: A compression tool will be used to crimp the connector, securely fastening the cable in place. Testing: A cable tester will be used to verify the connection, confirming a proper signal path.', 50, currentY, { width: 500 });
        
        currentY += 25;
        doc.fontSize(9)
           .text('Installation and Configuration', 50, currentY);
        
        currentY += 14;
        doc.fontSize(8)
           .text('Finishing Touches (If Cable Run Needed): Wall plates will be installed, and F-type jacks will be connected to the terminated cables. All cables will be neatly organized and secured with cable ties or clips.', 50, currentY, { width: 500 });
        
        currentY += 20;
        doc.text('SIM Card Installation: The router will be completely powered off before any SIM card insertion or removal. The technician will locate the SIM card slot, carefully insert the SIM card ensuring correct orientation, and securely replace the cover.', 50, currentY, { width: 500 });
        
        currentY += 20;
        doc.text('Mounting of Router and Antenna: If wall-mounting is desired and feasible, the router and/or antenna will be secured to the wall using appropriate screws and hardware with neat cable routing.', 50, currentY, { width: 500 });
        
        currentY += 20;
        doc.text('Power Connection: The power adapter will be plugged into the router\'s power input and then into a suitable power outlet. The router will be powered on and indicator lights observed to confirm boot-up.', 50, currentY, { width: 500 });
        
        currentY += 20;
        doc.text('Router Configuration: A web browser on a connected device will be used to access the router\'s configuration interface. The technician will work with your site contact to change the default password for security, configure cellular settings including APN provided by your cellular carrier, configure network settings as needed, and test the connection using a speed test to confirm primary ISP functionality.', 50, currentY, { width: 500 });
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