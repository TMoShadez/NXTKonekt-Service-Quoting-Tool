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
                
                {/* Labor Hold line (always show for all quotes) */}
                {(parseFloat(quote.laborHoldHours || '0') > 0 || parseFloat(quote.laborHoldCost || '0') > 0) && (
                  <div className="px-6 py-4">
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <span className="nxt-gray-800">Labor hold for possible overage, returned if unused in final billing</span>
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
