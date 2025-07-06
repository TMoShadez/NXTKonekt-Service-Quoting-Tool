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
        
        currentY += 25;
        doc.fontSize(8)
           .text('This document outlines the scope of work for the installation of a cellular wireless router to serve as your primary internet service provider (ISP) at the designated location. This comprehensive service includes a detailed site survey, preparation and installation of the wireless router, and, if necessary, the running of up to 200 feet of coaxial cable for the installation of an internal antenna to optimize signal strength.', 50, currentY, { width: 500, lineGap: 3 });
        
        currentY += 35;
        doc.text('Hardware for this project will be provided by your Wireless Vendor. All necessary materials will be provided by NXTKonekt/Tekumo.', 50, currentY, { width: 500, lineGap: 3 });
        
        currentY += 30;
        doc.fontSize(9)
           .text('Summary of Services', 50, currentY);
        
        currentY += 20;
        doc.fontSize(8)
           .text('Our team will install a cellular wireless router, performing the following key steps:', 50, currentY, { width: 500 });
        
        currentY += 20;
        doc.text('• Site Survey: Assessment of location for optimal router/antenna placement', 50, currentY, { width: 500 });
        currentY += 16;
        doc.text('• Router Preparation: Unboxing and component verification', 50, currentY, { width: 500 });
        currentY += 16;
        doc.text('• Installation: Secure mounting of router/antenna with component connections', 50, currentY, { width: 500 });
        currentY += 16;
        doc.text('• Coaxial Cable Installation: Up to 200ft cable run for antenna connection', 50, currentY, { width: 500 });
        currentY += 16;
        doc.text('• Configuration: Cellular connection setup and connectivity testing', 50, currentY, { width: 500 });
        
        currentY += 25;
        doc.fontSize(9)
           .text('Our Process', 50, currentY);
        
        currentY += 20;
        doc.fontSize(8)
           .text('Detailed breakdown of installation steps:', 50, currentY, { width: 500 });
        
        currentY += 25;
        doc.fontSize(8)
           .text('1. Preparation and Planning', 50, currentY);
        
        currentY += 18;
        doc.fontSize(7)
           .text('• Location Determination: Site contact collaboration to identify optimal router placement', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• Wireless Survey: Cellular device assessment for best antenna positioning', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• Route Planning: Cable path design minimizing bends and interference sources', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• Hardware Verification: Component check and documentation review', 50, currentY, { width: 500 });
        
        currentY += 20;
        doc.fontSize(8)
           .text('2. Coaxial Cable Installation (If Required)', 50, currentY);
        
        currentY += 18;
        doc.fontSize(7)
           .text('• Drilling: Careful hole creation through walls, avoiding structural members', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• Cable Routing: Fish tape/rod guidance through walls and conduits', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• Cable Pulling: Smooth installation adhering to bend radius specifications', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• Interference Avoidance: Clear of power lines and electromagnetic sources', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• Securing & Labeling: Cable ties for support, unique ID labels for troubleshooting', 50, currentY, { width: 500 });
        
        currentY += 20;
        doc.fontSize(8)
           .text('3. Cable Termination (If Required)', 50, currentY);
        
        currentY += 18;
        doc.fontSize(7)
           .text('• Cable Preparation: Precision stripping to expose conductor and shielding', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• Connector Installation: F-type connector attachment per manufacturer specs', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• Crimping & Testing: Compression tool securing and cable tester verification', 50, currentY, { width: 500 });
        
        currentY += 20;
        doc.fontSize(8)
           .text('4. Installation and Configuration', 50, currentY);
        
        currentY += 18;
        doc.fontSize(7)
           .text('• Wall Plate Installation: F-type jacks connected to terminated cables', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• SIM Card Installation: Proper orientation and secure placement', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• Router Mounting: Wall mounting with appropriate hardware (if requested)', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• Power Connection: Adapter connection and boot-up verification', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• Router Configuration: Password setup, APN configuration, and connectivity testing', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• Final Testing: Speed test confirmation of primary ISP functionality', 50, currentY, { width: 500 });
      }

      // Statement of Work for Fixed Wireless (Primary Only - No Antenna) - optimized for readability
      if (assessment.serviceType === 'site-assessment' && 
          assessment.connectionUsage === 'primary' && 
          assessment.lowSignalAntennaCable !== 'yes') {
        // Always start on new page for SOW to keep it organized
        doc.addPage();
        currentY = 50;
        
        doc.fontSize(11)
           .text('Scope of Work: Cellular Wireless Router Installation', 50, currentY);
        
        currentY += 25;
        doc.fontSize(8)
           .text('This document outlines the scope of work for the installation of a cellular wireless router at your designated location. This service includes a comprehensive site survey, preparation and installation of the router, and basic configuration to ensure your devices are connected. Please note that this service does not include network cabling.', 50, currentY, { width: 500, lineGap: 3 });
        
        currentY += 35;
        doc.fontSize(9)
           .text('Summary of Services', 50, currentY);
        
        currentY += 20;
        doc.fontSize(8)
           .text('Our team will install a cellular wireless router, performing the following key steps:', 50, currentY, { width: 500 });
        
        currentY += 20;
        doc.text('• Site Survey: Assessment of location for optimal router placement', 50, currentY, { width: 500 });
        currentY += 16;
        doc.text('• Router Preparation: Unboxing and component verification', 50, currentY, { width: 500 });
        currentY += 16;
        doc.text('• Mounting and Installation: Secure mounting with component connections', 50, currentY, { width: 500 });
        currentY += 16;
        doc.text('• Basic Router Configuration: Cellular connection and Wi-Fi setup', 50, currentY, { width: 500 });
        currentY += 16;
        doc.text('• Device Configuration Support: Connect up to 5 devices to wireless network', 50, currentY, { width: 500 });
        
        currentY += 25;
        doc.fontSize(9)
           .text('Our Process', 50, currentY);
        
        currentY += 20;
        doc.fontSize(8)
           .text('Detailed breakdown of installation steps:', 50, currentY, { width: 500 });
        
        currentY += 25;
        doc.fontSize(8)
           .text('1. Preparation and Planning', 50, currentY);
        
        currentY += 18;
        doc.fontSize(7)
           .text('• Location Determination: Site contact collaboration for optimal router placement within 5 feet of power outlet', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• Hardware Verification: Component check and documentation review', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• Documentation Review: Manufacturer installation guide review', 50, currentY, { width: 500 });
        
        currentY += 20;
        doc.fontSize(8)
           .text('2. SIM Card Installation', 50, currentY);
        
        currentY += 18;
        doc.fontSize(7)
           .text('• Power Off: Complete router shutdown before SIM insertion', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• SIM Card Slot Location: Locate slot typically on side or back of router', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• SIM Card Insertion: Careful insertion with correct orientation using provided tool', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• Secure Cover: Replace SIM card cover securely', 50, currentY, { width: 500 });
        
        currentY += 20;
        doc.fontSize(8)
           .text('3. Mounting (Optional)', 50, currentY);
        
        currentY += 18;
        doc.fontSize(7)
           .text('• Wall Mounting: Secure wall mounting if desired with appropriate hardware and neat cable routing', 50, currentY, { width: 500 });
        
        currentY += 20;
        doc.fontSize(8)
           .text('4. Antenna Connection', 50, currentY);
        
        currentY += 18;
        doc.fontSize(7)
           .text('• Antenna Attachment: Secure attachment of detachable antennas with proper alignment', 50, currentY, { width: 500 });
        
        currentY += 20;
        doc.fontSize(8)
           .text('5. Power Connection', 50, currentY);
        
        currentY += 18;
        doc.fontSize(7)
           .text('• Power Adapter Connection: Connect adapter to router power input and suitable outlet', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• Power On: Router startup and indicator light observation for boot confirmation', 50, currentY, { width: 500 });
        
        currentY += 20;
        doc.fontSize(8)
           .text('6. Network Connection', 50, currentY);
        
        currentY += 18;
        doc.fontSize(7)
           .text('• Wireless Connection (Wi-Fi): Device connection using provided SSID and password', 50, currentY, { width: 500 });
        
        currentY += 20;
        doc.fontSize(8)
           .text('7. Router Configuration', 50, currentY);
        
        currentY += 18;
        doc.fontSize(7)
           .text('• Configuration Interface Access: Web browser access via router IP address', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• Login and Password Change: Default credentials entry and immediate password change for security', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• Cellular Connection Configuration: APN configuration from cellular carrier', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• Network Settings (Optional): DHCP, DNS, and firewall configuration as needed', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• Connection Test: Internet speed test verification via browser', 50, currentY, { width: 500 });
        
        currentY += 20;
        doc.fontSize(8)
           .text('8. Device Configuration (Up to 5 Devices)', 50, currentY);
        
        currentY += 18;
        doc.fontSize(7)
           .text('• Device Connection Support: Hands-on assistance connecting up to 5 existing devices to wireless network', 50, currentY, { width: 500 });
        
        currentY += 25;
        doc.fontSize(9)
           .text('Estimated Time On-Site', 50, currentY);
        
        currentY += 18;
        doc.fontSize(8)
           .text('The estimated time on-site for this installation is 1 hour.', 50, currentY);
        
        currentY += 25;
        doc.fontSize(9)
           .text('Additional Labor Hold', 50, currentY);
        
        currentY += 18;
        doc.fontSize(8)
           .text('Price: $380.00', 50, currentY);
        
        currentY += 16;
        doc.fontSize(7)
           .text('While we aim for completion within a typical timeframe, the final charge will accurately reflect the actual time our team spends on-site. This includes the minimum service fee plus any additional time (billed at $190 per hour in 15-minute increments) needed for extra work or unforeseen issues. A preliminary Credit Hold of $380.00 in total Hold Amount. This will cover most external penetrations, or ceiling issues.', 50, currentY, { width: 500, lineGap: 3 });
      }

      // Statement of Work for Fixed Wireless (Failover + Antenna) - optimized for readability
      if (assessment.serviceType === 'site-assessment' && 
          assessment.connectionUsage === 'failover' && 
          assessment.lowSignalAntennaCable === 'yes') {
        // Always start on new page for SOW to keep it organized
        doc.addPage();
        currentY = 50;
        
        doc.fontSize(11)
           .text('Scope of Work: Comprehensive Cellular Wireless Router Installation', 50, currentY);
        
        currentY += 25;
        doc.fontSize(8)
           .text('This document outlines the scope of work for the installation of a cellular wireless router at your designated location, providing a robust internet solution. This comprehensive service includes a detailed site survey, preparation and installation of the wireless router, potential internal coaxial cabling for an antenna, external penetration for an external antenna (if required), and network cabling back to your server or equipment rack.', 50, currentY, { width: 500, lineGap: 3 });
        
        currentY += 35;
        doc.text('Hardware for this project will be provided by your Wireless Vendor. All necessary materials will be provided by NXTKonekt/Tekumo.', 50, currentY, { width: 500, lineGap: 3 });
        
        currentY += 30;
        doc.fontSize(9)
           .text('Summary of Services', 50, currentY);
        
        currentY += 20;
        doc.fontSize(8)
           .text('Our team will install a cellular wireless router, performing the following key steps:', 50, currentY, { width: 500 });
        
        currentY += 20;
        doc.text('• Site Survey: A thorough assessment of your location to determine optimal placement for the wireless router and any associated antennas (internal or external) for maximum cellular signal, and to plan the most efficient routes for all necessary cabling', 50, currentY, { width: 500 });
        currentY += 16;
        doc.text('• Router Preparation: Unboxing and verifying all components of the wireless router, and reviewing the manufacturer\'s documentation', 50, currentY, { width: 500 });
        currentY += 16;
        doc.text('• Antenna Installation (Internal/External):', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('  - Internal Antenna: If required, installation of an internal antenna with associated coaxial cabling', 50, currentY, { width: 500 });
        currentY += 12;
        doc.text('  - External Antenna (Optional): If required for optimal signal, installation of an external antenna, which may involve external building penetration', 50, currentY, { width: 500 });
        currentY += 16;
        doc.text('• Important Note on External Penetrations: NXTKonekt and Tekumo are not responsible for obtaining permits or securing permission from building owners for any external building penetrations required for external antenna installations. It is the client\'s sole responsibility to ensure all necessary approvals are in place prior to installation', 50, currentY, { width: 500 });
        currentY += 18;
        doc.text('• Cabling: Running and terminating necessary coaxial cable for antenna connections (up to 200 feet) and network cabling (e.g., Cat5e/6) from the router back to your server or equipment rack', 50, currentY, { width: 500 });
        currentY += 16;
        doc.text('• Mounting and Installation: Securely mounting the router and any antennas (internal or external) as determined by the site survey', 50, currentY, { width: 500 });
        currentY += 16;
        doc.text('• Basic Router Configuration: Setting up the cellular connection, establishing Wi-Fi connectivity (if desired), and configuring the router for integration with your network', 50, currentY, { width: 500 });
        currentY += 16;
        doc.text('• Connection Testing: Comprehensive testing of all connections to ensure full functionality', 50, currentY, { width: 500 });
        
        currentY += 25;
        doc.fontSize(9)
           .text('Our Process', 50, currentY);
        
        currentY += 20;
        doc.fontSize(8)
           .text('Detailed breakdown of installation steps:', 50, currentY, { width: 500 });
        
        currentY += 25;
        doc.fontSize(8)
           .text('Preparation and Planning', 50, currentY);
        
        currentY += 18;
        doc.fontSize(7)
           .text('• Location Determination: Our technician will collaborate with your site contact to identify the preferred location for the cellular wireless router and any associated antennas. A comprehensive wireless signal survey using a cellular device will be conducted to determine optimal placement for signal strength', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• Cable Path Planning: Detailed plans will be developed for all cable paths (coaxial for antenna, network for server/rack), aiming to minimize bends, avoid interference sources (e.g., power lines, fluorescent lights), and ensure adherence to building codes. Future needs and potential expansion will be considered, allowing for adequate cable slack', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• Hardware Verification: All hardware, provided by the wireless vendor, will be checked to ensure all components are present and accounted for', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• Documentation Review: The manufacturer\'s installation guide and user manual for the router and any antennas will be thoroughly reviewed', 50, currentY, { width: 500 });
        
        currentY += 20;
        doc.fontSize(8)
           .text('External Antenna Installation (If Required)', 50, currentY);
        
        currentY += 18;
        doc.fontSize(7)
           .text('• External Placement Survey: If an external antenna is deemed necessary for optimal signal, our technician will identify the best outdoor location, considering signal strength, line of sight, and accessibility', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• External Penetration: If required, a controlled penetration through the exterior wall will be made to route the coaxial cable from the external antenna to the router\'s location. Client acknowledges and agrees that NXTKonekt and Tekumo are not responsible for obtaining any necessary permits or permissions from building owners for external penetrations. This responsibility rests solely with the client', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• Antenna Mounting: The external antenna will be securely mounted using appropriate hardware, ensuring stability and proper orientation for optimal signal reception', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• Coaxial Cable Routing (External): Coaxial cable will be routed from the external antenna, through the penetration, and to the router\'s location, ensuring weatherproofing at the entry point', 50, currentY, { width: 500 });
        
        currentY += 20;
        doc.fontSize(8)
           .text('Internal Antenna Installation (If Required)', 50, currentY);
        
        currentY += 18;
        doc.fontSize(7)
           .text('• Internal Placement Survey: If an internal antenna is deemed necessary, our technician will identify the best indoor location for optimal signal distribution and aesthetic integration', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• Antenna Mounting: The internal antenna will be securely mounted using appropriate hardware', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• Coaxial Cable Routing (Internal): Coaxial cable will be routed from the internal antenna to the router\'s location, typically through ceiling spaces or conduit', 50, currentY, { width: 500 });
        
        currentY += 20;
        doc.fontSize(8)
           .text('Coaxial Cable Installation & Termination (For Antennas)', 50, currentY);
        
        currentY += 18;
        doc.fontSize(7)
           .text('• Cable Routing: Coaxial cables will be carefully routed along planned paths, minimizing bends and avoiding interference', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• Drilling Holes: If necessary, holes will be carefully drilled through studs or walls, ensuring they are sufficiently sized for the cable to pass through comfortably. Structural members will be avoided', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• Pulling Cable: Cables will be pulled carefully and smoothly, avoiding excessive tension or abrupt movements. The cable\'s bend radius specifications will be adhered to', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• Avoiding Interference: Coaxial cables will be kept clear of power lines and other sources of electromagnetic interference. If crossing power lines is unavoidable, it will be done at a 90-degree angle', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• Securing Cables: Cable ties or clips will be used to secure the cable along its run, preventing sagging, tangling, or resting on ceiling surfaces. Cable ties will not be overtightened to prevent damage', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• Termination: Coaxial cables will be stripped and terminated with appropriate F-type connectors using a compression tool, ensuring a secure and reliable connection', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• Testing: A cable tester will be used to verify the integrity and continuity of all coaxial cable runs', 50, currentY, { width: 500 });
        
        currentY += 20;
        doc.fontSize(8)
           .text('Network Cabling (to Server or Rack)', 50, currentY);
        
        currentY += 18;
        doc.fontSize(7)
           .text('• Cable Path Planning: The route for the network cable (e.g., Cat5e/6) from the cellular router to your server or equipment rack will be planned to ensure efficiency and minimize disruption', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• Cable Routing: The network cable will be routed through walls, ceilings, or conduits as required, adhering to industry best practices for data cabling', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• Termination: The network cable will be terminated with RJ45 connectors or jacks at both the router end and the server/rack end, ensuring proper pinout', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• Testing: A network cable tester will be used to verify the integrity and performance of the installed network cable run', 50, currentY, { width: 500 });
        
        currentY += 20;
        doc.fontSize(8)
           .text('SIM Card Installation', 50, currentY);
        
        currentY += 18;
        doc.fontSize(7)
           .text('• Power Off: The router will be completely powered off before any SIM card insertion or removal', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• SIM Card Slot Location: The technician will locate the SIM card slot, typically on the side or back of the router', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• SIM Card Insertion: The SIM card will be carefully inserted, ensuring correct orientation. A SIM card insertion tool will be used if provided', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• Secure Cover: The SIM card cover will be securely replaced', 50, currentY, { width: 500 });
        
        currentY += 20;
        doc.fontSize(8)
           .text('Router Mounting & Power Connection', 50, currentY);
        
        currentY += 18;
        doc.fontSize(7)
           .text('• Mounting: The router will be securely mounted (e.g., wall-mounted, placed in a rack) as determined during the planning phase', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• Power Connection: The power adapter will be plugged into the router\'s power input and then into a suitable power outlet', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• Power On: The router will be powered on, and the indicator lights will be observed to confirm boot-up', 50, currentY, { width: 500 });
        
        currentY += 20;
        doc.fontSize(8)
           .text('Router Configuration', 50, currentY);
        
        currentY += 18;
        doc.fontSize(7)
           .text('• Accessing Configuration Interface: A web browser on a connected device will be used to access the router\'s configuration interface via its IP address', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• Login and Password Change: The default username and password will be entered. The technician will work with your site contact to immediately change the default password for security purposes', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• Configure Cellular Connection: The cellular settings will be configured, including entering the APN (Access Point Name) provided by your cellular carrier', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• Configure Network Settings: Essential network settings such as IP address, DHCP, DNS, and any necessary routing or firewall rules will be configured to integrate the router seamlessly with your existing network infrastructure', 50, currentY, { width: 500 });
        currentY += 14;
        doc.text('• Test the Connection: An internet connection test will be performed using a speed test from the browser to confirm the cellular connection\'s speed and reliability', 50, currentY, { width: 500 });
        
        currentY += 20;
        doc.fontSize(8)
           .text('Final Testing & Verification', 50, currentY);
        
        currentY += 18;
        doc.fontSize(7)
           .text('• Comprehensive testing will be conducted to ensure all components (cellular connection, antenna signal, network cable connectivity) are functioning correctly and integrated as planned', 50, currentY, { width: 500 });
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