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

      // Customer Information - Ultra Compact
      let currentY = 90;
      doc.fontSize(10).font('Helvetica-Bold')
         .text('Customer Information', 50, currentY);
      
      currentY += 14;
      doc.fontSize(8).font('Helvetica')
         .text(`${assessment.customerCompanyName || 'Not specified'} | ${assessment.customerContactName || 'Not specified'}`, 50, currentY);
      currentY += 10;
      doc.text(`${assessment.customerPhone || 'Not specified'} | ${assessment.customerEmail || 'Not specified'}`, 50, currentY);

      // Service Information - Ultra Compact
      currentY += 16;
      doc.fontSize(10).font('Helvetica-Bold')
         .text('Service Information', 50, currentY);
      
      currentY += 18;
      const serviceTitle = getServiceTitle(assessment.serviceType ?? undefined);
      doc.fontSize(9)
         .text(`Service: ${serviceTitle}`, 50, currentY);
      currentY += 12;
      doc.text(`Location: ${assessment.siteAddress || 'Not specified'}`, 50, currentY);

      // Pricing breakdown header - Ultra Compact
      currentY += 16;
      doc.fontSize(10).font('Helvetica-Bold')
         .text('Pricing Breakdown', 50, currentY);

      const lineY = currentY + 12;
      
      // Table headers
      doc.fontSize(8).font('Helvetica')
         .text('Service Item', 50, lineY)
         .text('Hours', 300, lineY)
         .text('Rate', 350, lineY)
         .text('Cost', 450, lineY);

      // Draw line
      doc.moveTo(50, lineY + 10)
         .lineTo(550, lineY + 10)
         .stroke();

      currentY = lineY + 14;
      
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
      
      // Survey line (only show if > 0 hours) - Compact
      if (surveyHours > 0) {
        doc.fontSize(8).font('Helvetica')
           .text('Site Survey & Planning', 50, currentY)
           .text(`${surveyHours}`, 300, currentY)
           .text(`$${hourlyRate}`, 350, currentY)
           .text(`$${surveyCost.toFixed(2)}`, 450, currentY);
        currentY += 12;
      }
      
      // Installation line - Compact
      doc.fontSize(8).font('Helvetica')
         .text('Installation & Setup', 50, currentY)
         .text(`${installationHours}`, 300, currentY)
         .text(`$${hourlyRate}`, 350, currentY)
         .text(`$${installationCost.toFixed(2)}`, 450, currentY);
      
      currentY += 12;
      
      // Configuration line (only show if > 0 hours and cost > 0) - Compact
      if (configurationHours > 0 && configurationCost > 0) {
        doc.fontSize(8).font('Helvetica')
           .text('Configuration & Testing', 50, currentY)
           .text(`${configurationHours}`, 300, currentY)
           .text(`$${hourlyRate}`, 350, currentY)
           .text(`$${configurationCost.toFixed(2)}`, 450, currentY);
        currentY += 12;
      } else if (configurationHours > 0) {
        doc.fontSize(8).font('Helvetica')
           .text('Configuration & Testing', 50, currentY)
           .text('Included', 450, currentY);
        currentY += 12;
      }
      
      // Existing System Removal line (only for Fleet Camera with removal needed) - Compact
      if (removalHours > 0 && removalCost > 0) {
        doc.fontSize(8).font('Helvetica')
           .text('Existing System Removal', 50, currentY)
           .text(`${removalHours}`, 300, currentY)
           .text(`$${hourlyRate}`, 350, currentY)
           .text(`$${removalCost.toFixed(2)}`, 450, currentY);
        currentY += 12;
      }
      
      // Labor Hold line - ALWAYS show if we have labor hold data - Compact
      if (laborHoldHours > 0 || laborHoldCost > 0) {
        doc.fontSize(8).font('Helvetica')
           .text('Labor Hold, Final bill Return', 50, currentY)
           .text(`${laborHoldHours}`, 300, currentY)
           .text(`$${hourlyRate}`, 350, currentY)
           .text(`$${laborHoldCost.toFixed(2)}`, 450, currentY);
        currentY += 12;
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

      // Statement of Work for Fixed Wireless (Primary + Antenna) - Ultra Condensed
      if (assessment.serviceType === 'site-assessment' && 
          assessment.connectionUsage === 'primary' && 
          assessment.lowSignalAntennaCable === 'yes') {
        // Continue on same page to save space
        currentY += 20;
        
        doc.fontSize(10).font('Helvetica-Bold')
           .text('Scope of Work: Primary Cellular Router + Antenna Installation', 50, currentY);
        
        currentY += 16;
        doc.fontSize(7).font('Helvetica')
           .text('Cellular router installation as primary ISP with site survey, router setup, and up to 200ft coaxial cable for antenna installation. Hardware provided by Wireless Vendor, materials by NXTKonekt.', 50, currentY, { width: 500, lineGap: 2 });
        
        currentY += 18;
        doc.fontSize(8).font('Helvetica-Bold')
           .text('Services: ', 50, currentY);
        doc.fontSize(7).font('Helvetica')
           .text('Site survey • Router preparation • Secure mounting • Coaxial cable installation • Configuration & testing', 100, currentY, { width: 400, lineGap: 2 });
        
        currentY += 16;
        doc.fontSize(8).font('Helvetica-Bold')
           .text('Process: ', 50, currentY);
        doc.fontSize(7).font('Helvetica')
           .text('1) Site planning & location determination 2) Hardware preparation & verification 3) Router & antenna mounting 4) Cable routing & connections 5) SIM installation & configuration 6) Testing & documentation', 100, currentY, { width: 400, lineGap: 2 });
        
        currentY += 18;
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

      // Statement of Work for Fixed Wireless (Primary Only - No Antenna) - Ultra Condensed  
      if (assessment.serviceType === 'site-assessment' && 
          assessment.connectionUsage === 'primary' && 
          assessment.lowSignalAntennaCable !== 'yes') {
        // Continue on same page to save space
        currentY += 20;
        
        doc.fontSize(10).font('Helvetica-Bold')
           .text('Scope of Work: Cellular Router Installation', 50, currentY);
        
        currentY += 16;
        doc.fontSize(7).font('Helvetica')
           .text('Cellular router installation as primary ISP with site survey, router setup, and basic configuration. No network cabling included. Hardware provided by Wireless Vendor, materials by NXTKonekt.', 50, currentY, { width: 500, lineGap: 2 });
        
        currentY += 18;
        doc.fontSize(8).font('Helvetica-Bold')
           .text('Services: ', 50, currentY);
        doc.fontSize(7).font('Helvetica')
           .text('Site survey • Router preparation • Secure mounting • Basic configuration • Connect up to 5 devices', 100, currentY, { width: 400, lineGap: 2 });
        
        currentY += 16;
        doc.fontSize(8).font('Helvetica-Bold')
           .text('Process: ', 50, currentY);
        doc.fontSize(7).font('Helvetica')
           .text('1) Site planning & router placement 2) Hardware preparation 3) Router mounting & power 4) SIM installation 5) Configuration & Wi-Fi setup 6) Device connection & testing', 100, currentY, { width: 400, lineGap: 2 });
        
        currentY += 18;
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

      // Statement of Work for Fixed Wireless (Failover + Antenna) - Ultra Condensed
      if (assessment.serviceType === 'site-assessment' && 
          assessment.connectionUsage === 'failover' && 
          assessment.lowSignalAntennaCable === 'yes') {
        // Continue on same page to save space
        currentY += 20;
        
        doc.fontSize(10).font('Helvetica-Bold')
           .text('Scope of Work: Failover Cellular Router + Antenna Installation', 50, currentY);
        
        currentY += 16;
        doc.fontSize(7).font('Helvetica')
           .text('Cellular router installation as failover ISP with antenna, network cabling to server/rack. Up to 200ft coaxial cable included. External penetration permits are client responsibility. Hardware provided by Wireless Vendor, materials by NXTKonekt.', 50, currentY, { width: 500, lineGap: 2 });
        
        currentY += 18;
        doc.fontSize(8).font('Helvetica-Bold')
           .text('Services: ', 50, currentY);
        doc.fontSize(7).font('Helvetica')
           .text('Site survey • Router preparation • Antenna installation • Network cabling • Router configuration & testing', 100, currentY, { width: 400, lineGap: 2 });
        
        currentY += 16;
        doc.fontSize(8).font('Helvetica-Bold')
           .text('Process: ', 50, currentY);
        doc.fontSize(7).font('Helvetica')
           .text('1) Site survey & planning 2) Hardware preparation 3) Antenna & router mounting 4) Cable routing & termination 5) Network integration 6) SIM installation & configuration 7) Failover testing', 100, currentY, { width: 400, lineGap: 2 });
        
        currentY += 18;
        
        // Step 2
        doc.fontSize(8).font('Helvetica-Bold')
           .text('2. Antenna Installation', 50, currentY, { width: 500 });
        currentY += 12;
        
        doc.fontSize(7).font('Helvetica')
           .text('External: Survey location, controlled wall penetration, secure mounting, weatherproof cable routing.', 50, currentY, { width: 500, lineGap: 2 });
        currentY += 10;
        
        doc.text('Internal: Indoor location survey, secure mounting, ceiling/conduit cable routing.', 50, currentY, { width: 500, lineGap: 2 });
        currentY += 16;
        
        // Step 3
        doc.fontSize(8).font('Helvetica-Bold')
           .text('3. Cable Installation', 50, currentY, { width: 500 });
        currentY += 12;
        
        doc.fontSize(7).font('Helvetica')
           .text('Coaxial: Careful routing, drilling as needed, secure with ties, F-type termination, integrity testing.', 50, currentY, { width: 500, lineGap: 2 });
        currentY += 10;
        
        doc.text('Network: Route to server/rack through walls/ceilings, RJ45 termination, performance testing.', 50, currentY, { width: 500, lineGap: 2 });
        currentY += 16;
        
        // Step 4
        doc.fontSize(8).font('Helvetica-Bold')
           .text('4. Router Setup & Configuration', 50, currentY, { width: 500 });
        currentY += 12;
        
        doc.fontSize(7).font('Helvetica')
           .text('SIM installation, secure mounting, power connection, web interface access, password change, cellular APN configuration, network settings (IP/DHCP/DNS), routing rules, speed testing.', 50, currentY, { width: 500, lineGap: 2 });
        currentY += 16;
        
        // Step 5
        doc.fontSize(8).font('Helvetica-Bold')
           .text('5. Final Testing', 50, currentY, { width: 500 });
        currentY += 12;
        
        doc.fontSize(7).font('Helvetica')
           .text('Comprehensive testing of cellular connection, antenna signal strength, network cable connectivity, and system integration.', 50, currentY, { width: 500, lineGap: 2 });
      }

      // Statement of Work for Fixed Wireless (Failover Only - No Antenna) - Ultra Condensed
      if (assessment.serviceType === 'site-assessment' && 
          assessment.connectionUsage === 'failover' && 
          assessment.lowSignalAntennaCable !== 'yes') {
        // Continue on same page to save space
        currentY += 20;
        
        doc.fontSize(10).font('Helvetica-Bold')
           .text('Scope of Work: Failover Cellular Router Installation', 50, currentY);
        
        currentY += 16;
        doc.fontSize(7).font('Helvetica')
           .text('Cellular router installation as failover ISP with site survey, router setup, and network integration for seamless failover operation. Hardware provided by Wireless Vendor, materials by NXTKonekt.', 50, currentY, { width: 500, lineGap: 2 });
        
        currentY += 18;
        doc.fontSize(8).font('Helvetica-Bold')
           .text('Services: ', 50, currentY);
        doc.fontSize(7).font('Helvetica')
           .text('Site survey • Router preparation • Secure mounting • Basic configuration • Failover integration', 100, currentY, { width: 400, lineGap: 2 });
        
        currentY += 16;
        doc.fontSize(8).font('Helvetica-Bold')
           .text('Process: ', 50, currentY);
        doc.fontSize(7).font('Helvetica')
           .text('1) Site planning & router placement 2) Hardware preparation 3) Router mounting & power 4) SIM installation 5) Failover configuration 6) Network integration & testing', 100, currentY, { width: 400, lineGap: 2 });
        
        currentY += 18;
        
        doc.text('• Failover Testing: Verification of smooth transition during primary ISP outage.', 50, currentY, { width: 500, lineGap: 4 });
        currentY += 20;
        
        // Our Process
        doc.fontSize(11).font('Helvetica-Bold')
           .text('Our Process', 50, currentY, { width: 500 });
        currentY += 18;
        
        doc.fontSize(9).font('Helvetica')
           .text('Detailed breakdown of installation steps:', 50, currentY, { width: 500, lineGap: 4 });
        currentY += 18;
        
        // Preparation and Planning
        doc.fontSize(10).font('Helvetica-Bold')
           .text('Preparation and Planning', 50, currentY, { width: 500 });
        currentY += 16;
        
        doc.fontSize(8).font('Helvetica')
           .text('• Site survey for optimal router placement within 5 feet of power and network equipment', 50, currentY, { width: 500, lineGap: 3 });
        currentY += 16;
        
        doc.text('• Network topology assessment and failover integration planning', 50, currentY, { width: 500, lineGap: 3 });
        currentY += 14;
        
        doc.text('• Hardware verification and component check', 50, currentY, { width: 500, lineGap: 3 });
        currentY += 14;
        
        doc.text('• Installation guide and documentation review', 50, currentY, { width: 500, lineGap: 3 });
        currentY += 18;
        
        // SIM Card Installation
        doc.fontSize(10).font('Helvetica-Bold')
           .text('SIM Card Installation', 50, currentY, { width: 500 });
        currentY += 16;
        
        doc.fontSize(8).font('Helvetica')
           .text('• Power off router, locate SIM slot, insert card with proper orientation, secure cover', 50, currentY, { width: 500, lineGap: 3 });
        currentY += 18;
        
        // Mounting & Power
        doc.fontSize(10).font('Helvetica-Bold')
           .text('Mounting & Power Connection', 50, currentY, { width: 500 });
        currentY += 16;
        
        doc.fontSize(8).font('Helvetica')
           .text('• Secure wall mounting (if desired) with neat cable routing', 50, currentY, { width: 500, lineGap: 3 });
        currentY += 14;
        
        doc.text('• Connect power adapter and power on router, observe boot-up indicators', 50, currentY, { width: 500, lineGap: 3 });
        currentY += 18;
        
        // Network Connection
        doc.fontSize(10).font('Helvetica-Bold')
           .text('Network Connection', 50, currentY, { width: 500 });
        currentY += 16;
        
        doc.fontSize(8).font('Helvetica')
           .text('• Connect via Ethernet to existing network equipment (firewall/router)', 50, currentY, { width: 500, lineGap: 3 });
        currentY += 14;
        
        doc.text('• Configure Wi-Fi SSID and password (if desired for failover connection)', 50, currentY, { width: 500, lineGap: 3 });
        currentY += 18;
        
        // Router Configuration
        doc.fontSize(10).font('Helvetica-Bold')
           .text('Router Configuration', 50, currentY, { width: 500 });
        currentY += 16;
        
        doc.fontSize(8).font('Helvetica')
           .text('• Access web interface via IP address and change default password', 50, currentY, { width: 500, lineGap: 3 });
        currentY += 14;
        
        doc.text('• Configure cellular connection with carrier APN settings', 50, currentY, { width: 500, lineGap: 3 });
        currentY += 14;
        
        doc.text('• Set network settings (IP, DHCP, DNS) for network integration', 50, currentY, { width: 500, lineGap: 3 });
        currentY += 14;
        
        doc.text('• Configure failover settings and routing rules with network admin', 50, currentY, { width: 500, lineGap: 3 });
        currentY += 14;
        
        doc.text('• Perform speed test to confirm cellular connection reliability', 50, currentY, { width: 500, lineGap: 3 });
        currentY += 18;
        
        // Failover Testing
        doc.fontSize(10).font('Helvetica-Bold')
           .text('Failover Testing', 50, currentY, { width: 500 });
        currentY += 16;
        
        doc.fontSize(8).font('Helvetica')
           .text('• Temporarily disable primary connection to verify seamless failover transition', 50, currentY, { width: 500, lineGap: 3 });
        currentY += 14;
        
        doc.text('• Re-enable primary connection once failover functionality is confirmed', 50, currentY, { width: 500, lineGap: 3 });
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