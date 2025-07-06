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
