import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileText, Mail, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Assessment } from "@shared/schema";

interface StepQuoteGenerationProps {
  assessmentId: number;
  data: Partial<Assessment>;
}

export function StepQuoteGeneration({ assessmentId, data }: StepQuoteGenerationProps) {
  const { toast } = useToast();

  const { data: quote, isLoading: quoteLoading } = useQuery({
    queryKey: ["/api/assessments", assessmentId, "quote"],
    queryFn: async () => {
      const response = await apiRequest("POST", `/api/assessments/${assessmentId}/quote`);
      return response.json();
    },
    enabled: !!assessmentId,
  });

  const generatePdfMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/quotes/${quote.id}/pdf`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "PDF quote generated successfully!",
      });
      // Open PDF in new tab
      window.open(data.pdfUrl, '_blank');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    },
  });

  const emailQuoteMutation = useMutation({
    mutationFn: async () => {
      // This would typically send an email with the quote
      // For now, we'll just simulate it
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Quote emailed to customer successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to email quote",
        variant: "destructive",
      });
    },
  });

  if (quoteLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="nxt-gray-500">Generating quote...</p>
        </CardContent>
      </Card>
    );
  }

  if (!quote) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="nxt-gray-500">Failed to generate quote</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold nxt-gray-800">
          Quote Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Assessment Summary */}
          <div className="bg-nxt-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold nxt-gray-800 mb-4">Assessment Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="nxt-gray-500">Customer:</span>
                <span className="ml-2 font-medium">{data.customerCompanyName}</span>
              </div>
              <div>
                <span className="nxt-gray-500">Coverage Area:</span>
                <span className="ml-2 font-medium">{data.coverageArea || 'Not specified'} sq ft</span>
              </div>
              <div>
                <span className="nxt-gray-500">Building Type:</span>
                <span className="ml-2 font-medium">{data.buildingType || 'Not specified'}</span>
              </div>
              <div>
                <span className="nxt-gray-500">Device Count:</span>
                <span className="ml-2 font-medium">{data.deviceCount || 'Not specified'} devices</span>
              </div>
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div>
            <h3 className="text-lg font-semibold nxt-gray-800 mb-4">Pricing Breakdown</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-nxt-gray-50 px-6 py-3 border-b border-gray-200">
                <div className="grid grid-cols-4 gap-4 text-sm font-medium nxt-gray-800">
                  <span>Service Item</span>
                  <span>Hours</span>
                  <span>Rate</span>
                  <span>Cost</span>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200">
                {/* Survey line (only show if > 0 hours) */}
                {parseFloat(quote.surveyHours || '0') > 0 && (
                  <div className="px-6 py-4">
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <span className="nxt-gray-800">Site Survey & Planning</span>
                      <span className="nxt-gray-500">{parseFloat(quote.surveyHours || '0')}</span>
                      <span className="nxt-gray-500">${parseFloat(quote.hourlyRate || '190')}</span>
                      <span className="font-medium">${parseFloat(quote.surveyCost || '0').toFixed(2)}</span>
                    </div>
                  </div>
                )}
                
                {/* Installation line */}
                <div className="px-6 py-4">
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <span className="nxt-gray-800">Installation & Setup</span>
                    <span className="nxt-gray-500">{parseFloat(quote.installationHours || '0')}</span>
                    <span className="nxt-gray-500">${parseFloat(quote.hourlyRate || '190')}</span>
                    <span className="font-medium">${parseFloat(quote.installationCost || '0').toFixed(2)}</span>
                  </div>
                </div>
                
                {/* Configuration line (only show if > 0 hours and cost > 0) */}
                {parseFloat(quote.configurationHours || '0') > 0 && parseFloat(quote.configurationCost || '0') > 0 && (
                  <div className="px-6 py-4">
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <span className="nxt-gray-800">Configuration & Testing</span>
                      <span className="nxt-gray-500">{parseFloat(quote.configurationHours || '0')}</span>
                      <span className="nxt-gray-500">${parseFloat(quote.hourlyRate || '190')}</span>
                      <span className="font-medium">${parseFloat(quote.configurationCost || '0').toFixed(2)}</span>
                    </div>
                  </div>
                )}
                
                {/* Configuration included line */}
                {parseFloat(quote.configurationHours || '0') > 0 && parseFloat(quote.configurationCost || '0') === 0 && (
                  <div className="px-6 py-4">
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <span className="nxt-gray-800">Configuration & Testing</span>
                      <span className="nxt-gray-500">-</span>
                      <span className="nxt-gray-500">-</span>
                      <span className="font-medium">Included</span>
                    </div>
                  </div>
                )}
                
                {/* Existing System Removal line (only for Fleet Camera with removal needed) */}
                {parseFloat(quote.removalCost || '0') > 0 && (
                  <div className="px-6 py-4">
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <span className="nxt-gray-800">Existing System Removal</span>
                      <span className="nxt-gray-500">{parseFloat(quote.removalHours || '0')}</span>
                      <span className="nxt-gray-500">${parseFloat(quote.hourlyRate || '190')}</span>
                      <span className="font-medium">${parseFloat(quote.removalCost || '0').toFixed(2)}</span>
                    </div>
                  </div>
                )}
                
                {/* Labor Hold line (always show for all quotes) */}
                {(parseFloat(quote.laborHoldHours || '0') > 0 || parseFloat(quote.laborHoldCost || '0') > 0) && (
                  <div className="px-6 py-4">
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <span className="nxt-gray-800">Labor Hold, Final bill Return</span>
                      <span className="nxt-gray-500">{parseFloat(quote.laborHoldHours || '0')}</span>
                      <span className="nxt-gray-500">${parseFloat(quote.hourlyRate || '190')}</span>
                      <span className="font-medium">${parseFloat(quote.laborHoldCost || '0').toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Hardware line (cable costs) */}
                {parseFloat(quote.hardwareCost || '0') > 0 && (
                  <div className="px-6 py-4">
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <span className="nxt-gray-800">Hardware</span>
                      <span className="nxt-gray-500">-</span>
                      <span className="nxt-gray-500">-</span>
                      <span className="font-medium">${parseFloat(quote.hardwareCost || '0').toFixed(2)}</span>
                    </div>
                  </div>
                )}
                
                {/* Training line */}
                <div className="px-6 py-4">
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <span className="nxt-gray-800">Documentation & Training</span>
                    <span className="nxt-gray-500">-</span>
                    <span className="nxt-gray-500">-</span>
                    <span className="font-medium">Included</span>
                  </div>
                </div>
                
                <div className="px-6 py-4 bg-nxt-gray-50">
                  <div className="grid grid-cols-4 gap-4 text-lg font-semibold">
                    <span className="nxt-gray-800">Total Project Cost</span>
                    <span></span>
                    <span></span>
                    <span className="text-nxt-blue">${parseFloat(quote.totalCost || '0').toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statement of Work for Fleet Tracking */}
          {data.serviceType === 'fleet-tracking' && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-nxt-gray-800 mb-4">Statement of Work: Fleet Tracker Equipment Installation (OBD-II)</h3>
              
              <div className="space-y-4 text-sm text-nxt-gray-700">
                <p>
                  This document outlines the scope of work for the professional installation of 
                  fleet tracker equipment into your individual vehicle(s) through its Smart Data 
                  II (OBD-II) port. This service ensures proper device connection and initial 
                  functionality testing, enabling you to effectively monitor your fleet.
                </p>
                
                <p>
                  All hardware for the fleet tracker equipment will be provided by your 
                  designated Wireless Vendor. All necessary installation materials (zip-
                  ties, mounting tape) will be provided by NXTKonekt/Tekumo.
                </p>
                
                <div>
                  <h4 className="font-semibold text-nxt-gray-800 mb-2">Summary of Services</h4>
                  <p>Our designated technician will install fleet tracker equipment in each designated 
                  vehicle by performing the following key steps:</p>
                  
                  <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                    <li><strong>Vehicle Preparation:</strong> Identifying the vehicle's OBD-II port and ensuring a 
                    safe work / accessible installation environment.</li>
                    <li><strong>Device Connection:</strong> Securely plugging the fleet tracker device into the 
                    vehicle's OBD-II port.</li>
                    <li><strong>Cable Management:</strong> Neatly securing the device and any associated 
                    cabling to prevent interference with vehicle operation and to ensure a 
                    clean installation.</li>
                    <li><strong>Device Verification:</strong> Confirming the device is powered on and 
                    communicating correctly.</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-nxt-gray-800 mb-2">Our Process</h4>
                  <p>Here's a detailed breakdown of the steps our technician will take for each 
                  vehicle:</p>
                  
                  <div className="mt-2 space-y-3">
                    <div>
                      <h5 className="font-medium">1. Pre-Installation Check</h5>
                      <ul className="list-disc list-inside mt-1 space-y-1 ml-4 text-xs">
                        <li><strong>Vehicle Identification:</strong> The technician will confirm the specific vehicle to 
                        be worked on with your designated contact.</li>
                        <li><strong>Access Vehicle:</strong> Access the vehicle to begin the installation process.</li>
                        <li><strong>Locate OBD-II Port:</strong> The technician will locate the vehicle's OBD-II port, 
                        which is typically found within 3 feet of the steering wheel, often under 
                        the dashboard on the driver's side.</li>
                        <li><strong>Assess Installation Area:</strong> A quick assessment of the area around the OBD-
                        II port will be made to determine the best approach for a secure and 
                        discrete installation.</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium">2. Device Installation</h5>
                      <ul className="list-disc list-inside mt-1 space-y-1 ml-4 text-xs">
                        <li><strong>Connect Device:</strong> The fleet tracker device will be carefully plugged directly 
                        into the vehicle's OBD-II port.</li>
                        <li><strong>Verify Initial Power:</strong> The technician will observe the device's indicator 
                        lights (if applicable) to ensure it is properly powered from the vehicle's 
                        OBD-II port.</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium">3. Cable Management</h5>
                      <ul className="list-disc list-inside mt-1 space-y-1 ml-4 text-xs">
                        <li><strong>Secure Device and Cables:</strong> The device and any associated cables will be 
                        neatly secured using appropriate mounting materials (zip ties, mounting 
                        tape) with interfering with vehicle operations, preventing tampering, and 
                        achieving a discreet and safe installation.</li>
                        <li><strong>Concealment (where possible):</strong> Efforts will be made to discreetly conceal 
                        the device and cables without obstructing vehicle controls or access to 
                        other ports.</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium">4. Functionality Verification</h5>
                      <ul className="list-disc list-inside mt-1 space-y-1 ml-4 text-xs">
                        <li><strong>Power Confirmation:</strong> The technician will verify that the device is powered 
                        and (if applicable) is detected by a specific light pattern message.</li>
                        <li><strong>Connectivity Check:</strong> If the device has a visual indicator for cellular or GPS 
                        signal, the technician will observe to confirm it has been 
                        established or has established a connection. (Note: Full data transmission 
                        verification may occur remotely by your cellular service provider).</li>
                        <li><strong>Basic Operation Check:</strong> Ensure the device does not interfere with the 
                        vehicle's normal systems.</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-nxt-gray-800 mb-2">Estimated Time Per Vehicle</h4>
                  <p>
                    The estimated time on-site for the installation of one fleet tracker device is 
                    typically 20 minutes per vehicle, depending on vehicle size and access to the 
                    OBD-II port access.
                  </p>
                  <p className="mt-2">
                    Work will be completed within a typical timeframe, the final charge will accurately 
                    reflect the actual time our team spends on-site. This includes the minimum service fee 
                    plus any additional time for completion. Any on-site challenges or unexpected 
                    extra work or unforeseen delay. A preliminary Travel hold of $190.00 in total hold.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Statement of Work for Fleet Camera */}
          {data.serviceType === 'fleet-camera' && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-nxt-gray-800 mb-4">Statement of Work: Fleet Camera Dashcam and Optional External Camera Installation</h3>
              
              <div className="space-y-4 text-sm text-nxt-gray-700">
                <p>
                  This document outlines the scope of work for the professional installation of 
                  fleet camera equipment into your individual vehicle(s) including dashcams, external 
                  cameras, and optional existing system removal. This service ensures proper device 
                  connection and initial functionality testing, enabling you to effectively monitor your fleet.
                </p>
                
                <div>
                  <h4 className="font-semibold text-nxt-gray-800 mb-2">Summary of Services</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Vehicle Preparation: Pre-installation check and planning</li>
                    <li>Fleet Camera Dashcam Installation: Professional installation for optimal performance</li>
                    <li>Optional External Camera Installation (if selected): Additional camera points for comprehensive coverage</li>
                    <li>Optional Fleet Tracker Installation (if selected): Integration with existing fleet management systems</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-nxt-gray-800 mb-2">Our Process</h4>
                  <div className="space-y-3">
                    <div>
                      <h5 className="font-medium text-nxt-gray-800 mb-1">Pre-Installation Check and Planning</h5>
                      <ul className="list-disc list-inside mt-1 space-y-1 ml-4 text-xs">
                        <li><strong>Vehicle Identification:</strong> Confirm vehicle details and access requirements</li>
                        <li><strong>Power Assessment:</strong> Verify adequate power supply and identify optimal power connection points</li>
                        <li><strong>Camera Positioning:</strong> Determine optimal camera placement for maximum coverage while maintaining driver visibility</li>
                        <li><strong>Wiring Route Planning:</strong> Plan efficient and secure cable routing to minimize interference</li>
                        <li><strong>Asset Verification:</strong> Confirm all required equipment and materials are available</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-nxt-gray-800 mb-1">Fleet Camera Dashcam Installation</h5>
                      <ul className="list-disc list-inside mt-1 space-y-1 ml-4 text-xs">
                        <li><strong>Mounting:</strong> Securely mount dashcam in optimal position for clear forward view</li>
                        <li><strong>Power Connection:</strong> Connect to vehicle power system with proper voltage protection</li>
                        <li><strong>Cable Management:</strong> Route and secure all cables to prevent interference with vehicle operation</li>
                        <li><strong>Initial Setup:</strong> Configure basic camera settings and verify proper operation</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-nxt-gray-800 mb-1">Optional External Camera Installation (if selected)</h5>
                      <ul className="list-disc list-inside mt-1 space-y-1 ml-4 text-xs">
                        <li><strong>Camera Positioning:</strong> Install external cameras at specified locations (rear, side, etc.)</li>
                        <li><strong>Weather Protection:</strong> Ensure all external connections are properly sealed and weatherproofed</li>
                        <li><strong>Integration:</strong> Connect external cameras to main dashcam unit or recording system</li>
                        <li><strong>Testing:</strong> Verify all camera feeds are properly integrated and functioning</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-nxt-gray-800 mb-1">Optional Fleet Tracker Installation (if selected)</h5>
                      <ul className="list-disc list-inside mt-1 space-y-1 ml-4 text-xs">
                        <li><strong>OBD-II Connection:</strong> Connect fleet tracker to vehicle's diagnostic port</li>
                        <li><strong>Power Verification:</strong> Confirm tracker receives adequate power and signal</li>
                        <li><strong>Integration Testing:</strong> Verify tracker communicates properly with fleet management system</li>
                        <li><strong>Calibration:</strong> Ensure accurate location and vehicle data reporting</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-nxt-gray-800 mb-2">Functionality Verification</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-xs">
                    <li><strong>Power Test:</strong> Verify all devices receive proper power and show correct status indicators</li>
                    <li><strong>Recording Test:</strong> Confirm all cameras are recording properly with clear image quality</li>
                    <li><strong>Storage Verification:</strong> Ensure adequate storage capacity and proper file management</li>
                    <li><strong>System Integration:</strong> Verify all components work together seamlessly</li>
                    <li><strong>Final Inspection:</strong> Complete system check to ensure professional installation quality</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-nxt-gray-800 mb-2">Post-Installation Clean-up</h4>
                  <p>
                    Remove all installation materials and packaging. Ensure vehicle interior is clean and professional. 
                    Provide basic operation instructions and contact information for support.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-nxt-gray-800 mb-2">Estimated Time Per Vehicle</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-xs">
                    <li><strong>Fleet Camera Dashcam Only:</strong> Approximately 45-60 minutes per vehicle</li>
                    <li><strong>Fleet Camera Dashcam + Optional External Cameras:</strong> Approximately 60-90 minutes per vehicle</li>
                    <li><strong>Fleet Camera Dashcam + Optional Fleet Tracker:</strong> Approximately 60-75 minutes per vehicle</li>
                    <li><strong>Complete Installation (All Components):</strong> Approximately 75-120 minutes per vehicle</li>
                  </ul>
                  <p className="mt-2 text-xs">
                    Work will be completed within a typical timeframe, the final charge will accurately 
                    reflect the actual time our team spends on-site. This includes the minimum service fee 
                    plus any additional time for completion. Any on-site challenges or unexpected 
                    extra work or unforeseen delay. A preliminary labor hold of $190.00 in total hold.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Statement of Work for Fixed Wireless (Primary + Antenna) */}
          {data.serviceType === 'site-assessment' && 
           data.connectionUsage === 'primary' && 
           data.lowSignalAntennaCable === 'yes' && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-nxt-gray-800 mb-4">Scope of Work: Primary Cellular Wireless Router Installation with Antenna Installation</h3>
              
              <div className="space-y-4 text-sm text-nxt-gray-700">
                <p>
                  This document outlines the scope of work for the installation of a cellular wireless router to serve as your primary internet service provider (ISP) at the designated location. This comprehensive service includes a detailed site survey, preparation and installation of the wireless router, and, if necessary, the running of up to 200 feet of coaxial cable for the installation of an internal antenna to optimize signal strength.
                </p>
                
                <p>
                  Hardware for this project will be provided by your Wireless Vendor. All necessary materials will be provided by NXTKonekt/Tekumo.
                </p>
                
                <div>
                  <h4 className="font-semibold text-nxt-gray-800 mb-2">Summary of Services</h4>
                  <p className="mb-2">Our team will install a cellular wireless router, performing the following key steps:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Site Survey:</strong> A thorough assessment of your location to determine the optimal placement for the wireless router and, if required, the best position for an external or internal antenna to achieve maximum cellular signal.</li>
                    <li><strong>Router Preparation:</strong> Unboxing and verifying all components of the wireless router, and reviewing the manufacturer's documentation.</li>
                    <li><strong>Mounting and Installation:</strong> Securely mounting the router and/or antenna (if applicable) and connecting all necessary components, including power and coaxial cable.</li>
                    <li><strong>Coaxial Cable Installation (If Needed):</strong> Running and terminating up to 200 feet of coaxial cable to connect the router to a strategically placed internal antenna for enhanced signal reception.</li>
                    <li><strong>Basic Router Configuration:</strong> Setting up the cellular connection, establishing Wi-Fi connectivity, and performing initial testing to confirm primary internet functionality.</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-nxt-gray-800 mb-2">Our Process</h4>
                  <p className="mb-2">Here's a detailed breakdown of the steps our technician will take:</p>
                  
                  <div className="space-y-3">
                    <div>
                      <h5 className="font-medium text-nxt-gray-800 mb-1">Preparation and Planning</h5>
                      <ul className="list-disc list-inside mt-1 space-y-1 ml-4 text-xs">
                        <li><strong>Location Determination:</strong> Our technician will collaborate with your site contact to identify the preferred location for the cellular wireless router. A comprehensive wireless survey using a cellular device will be conducted to determine the optimal position for the antenna, ensuring the best possible signal reception. If cable routing is necessary, the technician will review the above-ceiling space to determine the most efficient and least intrusive cable path.</li>
                        <li><strong>Route Planning (If Cable Run Needed):</strong> A detailed plan will be developed for the coaxial cable path, aiming to minimize bends and avoid potential interference sources such as power lines or fluorescent lights. Future needs and potential expansion will be considered, allowing for adequate cable slack (at least 5-10 feet).</li>
                        <li><strong>Hardware Verification:</strong> All hardware, provided by the wireless vendor, will be checked to ensure all components are present and accounted for.</li>
                        <li><strong>Documentation Review:</strong> The manufacturer's installation guide and user manual for the router will be thoroughly reviewed.</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-nxt-gray-800 mb-1">Coaxial Cable Installation (If Required)</h5>
                      <ul className="list-disc list-inside mt-1 space-y-1 ml-4 text-xs">
                        <li><strong>Drilling Holes:</strong> If necessary, holes will be carefully drilled through studs or walls, ensuring they are sufficiently sized for the cable to pass through comfortably. Structural members will be avoided.</li>
                        <li><strong>Using Fish Tape/Rods:</strong> For routing cable through walls or conduits, fish tape or rods will be utilized to guide the cable, with the cable securely attached.</li>
                        <li><strong>Pulling Cable:</strong> The cable will be pulled carefully and smoothly, avoiding excessive tension or abrupt movements. The cable's bend radius specifications will be adhered to.</li>
                        <li><strong>Avoiding Interference:</strong> Coaxial cables will be kept clear of power lines and other sources of electromagnetic interference. If crossing power lines is unavoidable, it will be done at a 90-degree angle.</li>
                        <li><strong>Securing Cables:</strong> Cable ties or clips will be used to secure the cable along its run, preventing sagging, tangling, or resting on ceiling surfaces. Cable ties will not be overtightened to prevent damage.</li>
                        <li><strong>Labeling Cables:</strong> Both ends of each installed cable will be clearly labeled with a unique identifier to facilitate future troubleshooting.</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-nxt-gray-800 mb-1">Coaxial Cable Termination (If Required)</h5>
                      <ul className="list-disc list-inside mt-1 space-y-1 ml-4 text-xs">
                        <li><strong>Stripping Cable Jacket:</strong> A coaxial cable stripper will be used to carefully remove the outer jacket of the cable, exposing the center conductor and shielding. Care will be taken to avoid nicking the center conductor.</li>
                        <li><strong>Preparing Connector:</strong> The connector manufacturer's instructions will be followed for preparing the connector, which may involve sliding a compression ring onto the cable.</li>
                        <li><strong>Inserting Cable into Connector:</strong> The prepared cable will be inserted into the F-type connector, ensuring the center conductor is properly seated.</li>
                        <li><strong>Crimping Connector:</strong> A compression tool will be used to crimp the connector, securely fastening the cable in place.</li>
                        <li><strong>Testing:</strong> A cable tester will be used to verify the connection, confirming a proper signal path.</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-nxt-gray-800 mb-1">Finishing Touches (If Cable Run Needed)</h5>
                      <ul className="list-disc list-inside mt-1 space-y-1 ml-4 text-xs">
                        <li><strong>Wall Plates and F-Type Jacks:</strong> Wall plates will be installed, and F-type jacks will be connected to the terminated cables.</li>
                        <li><strong>Cable Management:</strong> All cables will be neatly organized and secured with cable ties or clips.</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-nxt-gray-800 mb-1">SIM Card Installation</h5>
                      <ul className="list-disc list-inside mt-1 space-y-1 ml-4 text-xs">
                        <li><strong>Power Off:</strong> The router will be completely powered off before any SIM card insertion or removal.</li>
                        <li><strong>SIM Card Slot Location:</strong> The technician will locate the SIM card slot, typically on the side or back of the router.</li>
                        <li><strong>SIM Card Insertion:</strong> The SIM card will be carefully inserted, ensuring correct orientation. A SIM card insertion tool will be used if provided.</li>
                        <li><strong>Secure Cover:</strong> The SIM card cover will be securely replaced.</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-nxt-gray-800 mb-1">Mounting of Router and Antenna (Optional)</h5>
                      <ul className="list-disc list-inside mt-1 space-y-1 ml-4 text-xs">
                        <li><strong>Wall Mounting:</strong> If wall-mounting is desired and feasible, the router and/or antenna will be secured to the wall using appropriate screws and hardware. The location will be suitable, and cables will be routed neatly.</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-nxt-gray-800 mb-1">Power Connection</h5>
                      <ul className="list-disc list-inside mt-1 space-y-1 ml-4 text-xs">
                        <li><strong>Connect Power Adapter:</strong> The power adapter will be plugged into the router's power input and then into a suitable power outlet.</li>
                        <li><strong>Power ON the Router:</strong> The router will be powered on, and the indicator lights will be observed to confirm boot-up.</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-nxt-gray-800 mb-1">Router Configuration</h5>
                      <ul className="list-disc list-inside mt-1 space-y-1 ml-4 text-xs">
                        <li><strong>Accessing Configuration Interface:</strong> A web browser on a connected device will be used to access the router's configuration interface via its IP address.</li>
                        <li><strong>Login and Password Change:</strong> The default username and password will be entered. The technician will work with your site contact to immediately change the default password for security purposes.</li>
                        <li><strong>Configure Cellular Connection:</strong> The cellular settings will be configured, including entering the APN (Access Point Name) provided by your cellular carrier.</li>
                        <li><strong>Configure Network Settings (Optional):</strong> Other network settings like DHCP, DNS, and firewall may be configured based on your specific requirements and the router's documentation.</li>
                        <li><strong>Test the Connection:</strong> An internet connection test will be performed using a speed test from the browser to confirm primary ISP functionality.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Statement of Work for Fixed Wireless (Primary Only - No Antenna) */}
          {data.serviceType === 'site-assessment' && 
           data.connectionUsage === 'primary' && 
           data.lowSignalAntennaCable !== 'yes' && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-nxt-gray-800 mb-4">Scope of Work: Cellular Wireless Router Installation</h3>
              
              <div className="space-y-4 text-sm text-nxt-gray-700">
                <p>
                  This document outlines the scope of work for the installation of a cellular wireless router at your designated location. This service includes a comprehensive site survey, preparation and installation of the router, and basic configuration to ensure your devices are connected. Please note that this service does not include network cabling.
                </p>
                
                <div>
                  <h4 className="font-semibold text-nxt-gray-800 mb-2">Summary of Services</h4>
                  <p className="mb-2">Our team will install a cellular wireless router, performing the following key steps:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Site Survey:</strong> A thorough assessment of your location to determine the optimal placement for the wireless router, ensuring the best possible cellular signal.</li>
                    <li><strong>Router Preparation:</strong> Unboxing and verifying all components of the wireless router, and reviewing the manufacturer's documentation.</li>
                    <li><strong>Mounting and Installation:</strong> Securely mounting the router (if applicable) and connecting all necessary components, including antennas and power.</li>
                    <li><strong>Basic Router Configuration:</strong> Setting up the cellular connection, establishing Wi-Fi connectivity, and performing initial testing.</li>
                    <li><strong>Device Configuration Support:</strong> We will assist with connecting up to 5 of your devices (workstations, printers, terminals) to the new wireless network and provide guidance on connecting additional hardware.</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-nxt-gray-800 mb-2">Our Process</h4>
                  <p className="mb-2">Here's a detailed breakdown of the steps our technician will take:</p>
                  
                  <div className="space-y-3">
                    <div>
                      <h5 className="font-medium text-nxt-gray-800 mb-1">Preparation and Planning</h5>
                      <ul className="list-disc list-inside mt-1 space-y-1 ml-4 text-xs">
                        <li><strong>Location Determination:</strong> Our technician will work with your site contact to perform a walkthrough and signal survey using a mobile phone to identify the best position for the wireless router. The chosen location will be within 5 feet of a power outlet.</li>
                        <li><strong>Hardware Verification:</strong> All hardware, provided by the wireless vendor, will be checked to ensure all components are present and accounted for.</li>
                        <li><strong>Documentation Review:</strong> The manufacturer's installation guide and user manual for the router will be thoroughly reviewed.</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-nxt-gray-800 mb-1">SIM Card Installation</h5>
                      <ul className="list-disc list-inside mt-1 space-y-1 ml-4 text-xs">
                        <li><strong>Power Off:</strong> The router will be completely powered off before any SIM card insertion or removal.</li>
                        <li><strong>SIM Card Slot Location:</strong> The technician will locate the SIM card slot, typically on the side or back of the router.</li>
                        <li><strong>SIM Card Insertion:</strong> The SIM card will be carefully inserted, ensuring correct orientation. A SIM card insertion tool will be used if provided.</li>
                        <li><strong>Secure Cover:</strong> The SIM card cover will be securely replaced.</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-nxt-gray-800 mb-1">Mounting (Optional)</h5>
                      <ul className="list-disc list-inside mt-1 space-y-1 ml-4 text-xs">
                        <li><strong>Wall Mounting:</strong> If wall-mounting is desired and feasible, the router will be secured to the wall using appropriate screws and hardware. Cables will be routed neatly.</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-nxt-gray-800 mb-1">Antenna Connection</h5>
                      <ul className="list-disc list-inside mt-1 space-y-1 ml-4 text-xs">
                        <li><strong>Antenna Attachment:</strong> If the router has detachable antennas, they will be securely screwed onto their designated connectors, ensuring proper alignment.</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-nxt-gray-800 mb-1">Power Connection</h5>
                      <ul className="list-disc list-inside mt-1 space-y-1 ml-4 text-xs">
                        <li><strong>Power Adapter Connection:</strong> The power adapter will be plugged into the router's power input and then into a suitable power outlet.</li>
                        <li><strong>Power On:</strong> The router will be powered on, and the indicator lights will be observed to confirm boot-up.</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-nxt-gray-800 mb-1">Network Connection</h5>
                      <ul className="list-disc list-inside mt-1 space-y-1 ml-4 text-xs">
                        <li><strong>Wireless Connection (Wi-Fi):</strong> Your device will be connected to the router's Wi-Fi network using the provided network name (SSID) and password.</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-nxt-gray-800 mb-1">Router Configuration</h5>
                      <ul className="list-disc list-inside mt-1 space-y-1 ml-4 text-xs">
                        <li><strong>Accessing Configuration Interface:</strong> A web browser on a connected device will be used to access the router's configuration interface via its IP address.</li>
                        <li><strong>Login and Password Change:</strong> The default username and password will be entered. The technician will work with your site contact to immediately change the default password for security purposes.</li>
                        <li><strong>Cellular Connection Configuration:</strong> The cellular settings will be configured, including entering the APN (Access Point Name) provided by your cellular carrier.</li>
                        <li><strong>Network Settings (Optional):</strong> Other network settings like DHCP, DNS, and firewall may be configured based on your specific requirements and the router's documentation.</li>
                        <li><strong>Connection Test:</strong> An internet connection test will be performed using a speed test from the browser.</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-nxt-gray-800 mb-1">Device Configuration (Up to 5 Devices)</h5>
                      <ul className="list-disc list-inside mt-1 space-y-1 ml-4 text-xs">
                        <li><strong>Device Connection Support:</strong> Our technician will provide hands-on assistance and training to connect up to 5 of your existing devices (e.g., workstations, printers, terminals) to the newly established wireless network.</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-nxt-gray-800 mb-2">Estimated Time On-Site</h4>
                  <p>The estimated time on-site for this installation is 1 hour.</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-nxt-gray-800 mb-2">Additional Labor Hold</h4>
                  <p className="mb-1"><strong>Price:</strong> $380.00</p>
                  <p>
                    While we aim for completion within a typical timeframe, the final charge will accurately 
                    reflect the actual time our team spends on-site. This includes the minimum service fee plus 
                    any additional time (billed at $190 per hour in 15-minute increments) needed for extra work 
                    or unforeseen issues. A preliminary Credit Hold of $380.00 in total Hold Amount. This will 
                    cover most external penetrations, or ceiling issues.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Third conditional Statement of Work for Fixed Wireless (Failover + Antenna) */}
          {data.serviceType === 'site-assessment' && 
           data.connectionUsage === 'failover' && 
           data.lowSignalAntennaCable === 'yes' && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-nxt-gray-800 mb-4">Scope of Work: Comprehensive Cellular Wireless Router Installation</h3>
              
              <div className="space-y-4 text-sm text-nxt-gray-700">
                <p>
                  This document outlines the scope of work for the installation of a cellular wireless router at your designated location, providing a robust internet solution. This comprehensive service includes a detailed site survey, preparation and installation of the wireless router, potential internal coaxial cabling for an antenna, external penetration for an external antenna (if required), and network cabling back to your server or equipment rack.
                </p>
                
                <p>
                  Hardware for this project will be provided by your Wireless Vendor. All necessary materials will be provided by NXTKonekt/Tekumo.
                </p>
                
                <div>
                  <h4 className="font-semibold text-nxt-gray-800 mb-2">Summary of Services</h4>
                  <p className="mb-2">Our team will install a cellular wireless router, performing the following key steps:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Site Survey:</strong> A thorough assessment of your location to determine optimal placement for the wireless router and any associated antennas (internal or external) for maximum cellular signal, and to plan the most efficient routes for all necessary cabling.</li>
                    <li><strong>Router Preparation:</strong> Unboxing and verifying all components of the wireless router, and reviewing the manufacturer's documentation.</li>
                    <li><strong>Antenna Installation (Internal/External):</strong>
                      <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                        <li>Internal Antenna: If required, installation of an internal antenna with associated coaxial cabling.</li>
                        <li>External Antenna (Optional): If required for optimal signal, installation of an external antenna, which may involve external building penetration.</li>
                      </ul>
                    </li>
                    <li><strong>Important Note on External Penetrations:</strong> NXTKonekt and Tekumo are not responsible for obtaining permits or securing permission from building owners for any external building penetrations required for external antenna installations. It is the client's sole responsibility to ensure all necessary approvals are in place prior to installation.</li>
                    <li><strong>Cabling:</strong> Running and terminating necessary coaxial cable for antenna connections (up to 200 feet) and network cabling (e.g., Cat5e/6) from the router back to your server or equipment rack.</li>
                    <li><strong>Mounting and Installation:</strong> Securely mounting the router and any antennas (internal or external) as determined by the site survey.</li>
                    <li><strong>Basic Router Configuration:</strong> Setting up the cellular connection, establishing Wi-Fi connectivity (if desired), and configuring the router for integration with your network.</li>
                    <li><strong>Connection Testing:</strong> Comprehensive testing of all connections to ensure full functionality.</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-nxt-gray-800 mb-2">Our Process</h4>
                  <p className="mb-2">Here's a detailed breakdown of the steps our technician will take:</p>
                  
                  <div className="space-y-3">
                    <div>
                      <h5 className="font-medium text-nxt-gray-800 mb-1">Preparation and Planning</h5>
                      <ul className="list-disc list-inside mt-1 space-y-1 ml-4 text-xs">
                        <li><strong>Location Determination:</strong> Our technician will collaborate with your site contact to identify the preferred location for the cellular wireless router and any associated antennas. A comprehensive wireless signal survey using a cellular device will be conducted to determine optimal placement for signal strength.</li>
                        <li><strong>Cable Path Planning:</strong> Detailed plans will be developed for all cable paths (coaxial for antenna, network for server/rack), aiming to minimize bends, avoid interference sources (e.g., power lines, fluorescent lights), and ensure adherence to building codes. Future needs and potential expansion will be considered, allowing for adequate cable slack.</li>
                        <li><strong>Hardware Verification:</strong> All hardware, provided by the wireless vendor, will be checked to ensure all components are present and accounted for.</li>
                        <li><strong>Documentation Review:</strong> The manufacturer's installation guide and user manual for the router and any antennas will be thoroughly reviewed.</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-nxt-gray-800 mb-1">External Antenna Installation (If Required)</h5>
                      <ul className="list-disc list-inside mt-1 space-y-1 ml-4 text-xs">
                        <li><strong>External Placement Survey:</strong> If an external antenna is deemed necessary for optimal signal, our technician will identify the best outdoor location, considering signal strength, line of sight, and accessibility.</li>
                        <li><strong>External Penetration:</strong> If required, a controlled penetration through the exterior wall will be made to route the coaxial cable from the external antenna to the router's location. Client acknowledges and agrees that NXTKonekt and Tekumo are not responsible for obtaining any necessary permits or permissions from building owners for external penetrations. This responsibility rests solely with the client.</li>
                        <li><strong>Antenna Mounting:</strong> The external antenna will be securely mounted using appropriate hardware, ensuring stability and proper orientation for optimal signal reception.</li>
                        <li><strong>Coaxial Cable Routing (External):</strong> Coaxial cable will be routed from the external antenna, through the penetration, and to the router's location, ensuring weatherproofing at the entry point.</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-nxt-gray-800 mb-1">Internal Antenna Installation (If Required)</h5>
                      <ul className="list-disc list-inside mt-1 space-y-1 ml-4 text-xs">
                        <li><strong>Internal Placement Survey:</strong> If an internal antenna is deemed necessary, our technician will identify the best indoor location for optimal signal distribution and aesthetic integration.</li>
                        <li><strong>Antenna Mounting:</strong> The internal antenna will be securely mounted using appropriate hardware.</li>
                        <li><strong>Coaxial Cable Routing (Internal):</strong> Coaxial cable will be routed from the internal antenna to the router's location, typically through ceiling spaces or conduit.</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-nxt-gray-800 mb-1">Coaxial Cable Installation & Termination (For Antennas)</h5>
                      <ul className="list-disc list-inside mt-1 space-y-1 ml-4 text-xs">
                        <li><strong>Cable Routing:</strong> Coaxial cables will be carefully routed along planned paths, minimizing bends and avoiding interference.</li>
                        <li><strong>Drilling Holes:</strong> If necessary, holes will be carefully drilled through studs or walls, ensuring they are sufficiently sized for the cable to pass through comfortably. Structural members will be avoided.</li>
                        <li><strong>Pulling Cable:</strong> Cables will be pulled carefully and smoothly, avoiding excessive tension or abrupt movements. The cable's bend radius specifications will be adhered to.</li>
                        <li><strong>Avoiding Interference:</strong> Coaxial cables will be kept clear of power lines and other sources of electromagnetic interference. If crossing power lines is unavoidable, it will be done at a 90-degree angle.</li>
                        <li><strong>Securing Cables:</strong> Cable ties or clips will be used to secure the cable along its run, preventing sagging, tangling, or resting on ceiling surfaces. Cable ties will not be overtightened to prevent damage.</li>
                        <li><strong>Termination:</strong> Coaxial cables will be stripped and terminated with appropriate F-type connectors using a compression tool, ensuring a secure and reliable connection.</li>
                        <li><strong>Testing:</strong> A cable tester will be used to verify the integrity and continuity of all coaxial cable runs.</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-nxt-gray-800 mb-1">Network Cabling (to Server or Rack)</h5>
                      <ul className="list-disc list-inside mt-1 space-y-1 ml-4 text-xs">
                        <li><strong>Cable Path Planning:</strong> The route for the network cable (e.g., Cat5e/6) from the cellular router to your server or equipment rack will be planned to ensure efficiency and minimize disruption.</li>
                        <li><strong>Cable Routing:</strong> The network cable will be routed through walls, ceilings, or conduits as required, adhering to industry best practices for data cabling.</li>
                        <li><strong>Termination:</strong> The network cable will be terminated with RJ45 connectors or jacks at both the router end and the server/rack end, ensuring proper pinout.</li>
                        <li><strong>Testing:</strong> A network cable tester will be used to verify the integrity and performance of the installed network cable run.</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-nxt-gray-800 mb-1">SIM Card Installation</h5>
                      <ul className="list-disc list-inside mt-1 space-y-1 ml-4 text-xs">
                        <li><strong>Power Off:</strong> The router will be completely powered off before any SIM card insertion or removal.</li>
                        <li><strong>SIM Card Slot Location:</strong> The technician will locate the SIM card slot, typically on the side or back of the router.</li>
                        <li><strong>SIM Card Insertion:</strong> The SIM card will be carefully inserted, ensuring correct orientation. A SIM card insertion tool will be used if provided.</li>
                        <li><strong>Secure Cover:</strong> The SIM card cover will be securely replaced.</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-nxt-gray-800 mb-1">Router Mounting & Power Connection</h5>
                      <ul className="list-disc list-inside mt-1 space-y-1 ml-4 text-xs">
                        <li><strong>Mounting:</strong> The router will be securely mounted (e.g., wall-mounted, placed in a rack) as determined during the planning phase.</li>
                        <li><strong>Power Connection:</strong> The power adapter will be plugged into the router's power input and then into a suitable power outlet.</li>
                        <li><strong>Power On:</strong> The router will be powered on, and the indicator lights will be observed to confirm boot-up.</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-nxt-gray-800 mb-1">Router Configuration</h5>
                      <ul className="list-disc list-inside mt-1 space-y-1 ml-4 text-xs">
                        <li><strong>Accessing Configuration Interface:</strong> A web browser on a connected device will be used to access the router's configuration interface via its IP address.</li>
                        <li><strong>Login and Password Change:</strong> The default username and password will be entered. The technician will work with your site contact to immediately change the default password for security purposes.</li>
                        <li><strong>Configure Cellular Connection:</strong> The cellular settings will be configured, including entering the APN (Access Point Name) provided by your cellular carrier.</li>
                        <li><strong>Configure Network Settings:</strong> Essential network settings such as IP address, DHCP, DNS, and any necessary routing or firewall rules will be configured to integrate the router seamlessly with your existing network infrastructure.</li>
                        <li><strong>Test the Connection:</strong> An internet connection test will be performed using a speed test from the browser to confirm the cellular connection's speed and reliability.</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-nxt-gray-800 mb-1">Final Testing & Verification</h5>
                      <ul className="list-disc list-inside mt-1 space-y-1 ml-4 text-xs">
                        <li><strong>Comprehensive Testing:</strong> Testing will be conducted to ensure all components (cellular connection, antenna signal, network cable connectivity) are functioning correctly and integrated as planned.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Additional Notes */}
          <div>
            <Label className="text-sm font-medium nxt-gray-800 mb-2">
              Additional Notes (Optional)
            </Label>
            <Textarea
              placeholder="Any additional notes or special considerations for this quote"
              value={data.additionalNotes || ''}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nxt-blue focus:border-nxt-blue"
              rows={4}
            />
          </div>

          {/* Quote Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
            <Button
              onClick={() => generatePdfMutation.mutate()}
              disabled={generatePdfMutation.isPending}
              className="flex-1 bg-nxt-blue text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <FileText className="mr-2" size={16} />
              Generate PDF Quote
            </Button>
            
            <Button
              onClick={() => emailQuoteMutation.mutate()}
              disabled={emailQuoteMutation.isPending}
              className="flex-1 bg-nxt-green text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              <Mail className="mr-2" size={16} />
              Email to Customer
            </Button>
            
            <Button
              variant="outline"
              className="px-6 py-3 rounded-lg font-medium border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <Save className="mr-2" size={16} />
              Save Draft
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
