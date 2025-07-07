import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Clock, FileText, Download, Phone, Mail, MapPin, Calendar } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Quote, Assessment } from "@shared/schema";

interface CustomerQuoteData extends Quote {
  assessment: Assessment;
  organization: {
    name: string;
  };
}

export default function CustomerPortal() {
  const [, params] = useRoute("/customer/:token");
  const token = params?.token;
  const [customerFeedback, setCustomerFeedback] = useState("");
  const { toast } = useToast();

  // Fetch quote data using secure token
  const { data: quoteData, isLoading } = useQuery<CustomerQuoteData>({
    queryKey: [`/api/customer/quote/${token}`],
    enabled: !!token,
  });

  // Quote approval mutation
  const approvalMutation = useMutation({
    mutationFn: async ({ action, feedback }: { action: "approve" | "reject"; feedback?: string }) => {
      return apiRequest(`/api/customer/quote/${token}/${action}`, {
        method: "POST",
        body: JSON.stringify({ feedback }),
      });
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.action === "approve" ? "Quote Approved" : "Quote Rejected",
        description: "Your response has been sent to our team. We'll be in touch soon!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit response. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nxt-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your quote...</p>
        </div>
      </div>
    );
  }

  if (!quoteData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Quote Not Found</h2>
            <p className="text-gray-600 mb-4">
              The quote link may be invalid or expired. Please contact our sales team for assistance.
            </p>
            <Button className="bg-nxt-blue hover:bg-blue-700">
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const quote = quoteData;
  const assessment = quote.assessment;
  const organization = quote.organization;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending Review</Badge>;
    }
  };

  const getServiceTypeDisplay = (serviceType: string) => {
    switch (serviceType) {
      case "site-assessment": return "Fixed Wireless Access";
      case "fleet-tracking": return "Fleet & Asset Tracking";
      case "fleet-camera": return "Fleet Camera Installation";
      default: return serviceType;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Installation Quote</h1>
              <p className="text-gray-600">Quote #{quote.quoteNumber}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">From</div>
              <div className="font-semibold text-nxt-blue">{organization.name}</div>
              {getStatusBadge(quote.status)}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-nxt-blue" />
              Installation Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-gray-900">Service Type</h4>
                <p className="text-gray-700">{getServiceTypeDisplay(assessment.serviceType)}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Installation Location</h4>
                <p className="text-gray-700">{assessment.siteAddress}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Contact Person</h4>
                <p className="text-gray-700">{assessment.customerContactName}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Preferred Installation Date</h4>
                <p className="text-gray-700 flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(assessment.preferredInstallationDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing Breakdown</CardTitle>
            <CardDescription>Detailed cost breakdown for your installation project</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {parseFloat(quote.surveyCost) > 0 && (
                <div className="flex justify-between">
                  <span>Site Survey ({quote.surveyHours} hours)</span>
                  <span>${quote.surveyCost}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Installation ({quote.installationHours} hours @ ${quote.hourlyRate}/hr)</span>
                <span>${quote.installationCost}</span>
              </div>
              {parseFloat(quote.configurationCost) > 0 && (
                <div className="flex justify-between">
                  <span>Configuration ({quote.configurationHours} hours @ ${quote.hourlyRate}/hr)</span>
                  <span>${quote.configurationCost}</span>
                </div>
              )}
              {parseFloat(quote.trainingCost) > 0 && (
                <div className="flex justify-between">
                  <span>Training & Support</span>
                  <span>${quote.trainingCost}</span>
                </div>
              )}
              {parseFloat(quote.hardwareCost) > 0 && (
                <div className="flex justify-between">
                  <span>Hardware & Materials</span>
                  <span>${quote.hardwareCost}</span>
                </div>
              )}
              {quote.removalCost && parseFloat(quote.removalCost) > 0 && (
                <div className="flex justify-between">
                  <span>Existing System Removal ({quote.removalHours} hours)</span>
                  <span>${quote.removalCost}</span>
                </div>
              )}
              {parseFloat(quote.laborHoldCost) > 0 && (
                <div className="flex justify-between">
                  <span>Labor Hold - Final bill Return ({quote.laborHoldHours} hours)</span>
                  <span>${quote.laborHoldCost}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-semibold">
                <span>Total Project Cost</span>
                <span>${quote.totalCost}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sales Executive Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Your Sales Executive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-nxt-blue rounded-full flex items-center justify-center text-white font-semibold">
                {assessment.salesExecutiveName.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">{assessment.salesExecutiveName}</h4>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <Mail className="w-4 h-4 mr-1" />
                    {assessment.salesExecutiveEmail}
                  </span>
                  {assessment.salesExecutivePhone && (
                    <span className="flex items-center">
                      <Phone className="w-4 h-4 mr-1" />
                      {assessment.salesExecutivePhone}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PDF Download */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2 text-nxt-blue" />
              Quote Documentation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Download the complete quote documentation including technical specifications and terms.
            </p>
            <Button 
              variant="outline" 
              className="flex items-center"
              onClick={() => window.open(quote.pdfUrl || `/api/quotes/${quote.id}/pdf`, '_blank')}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Full Quote (PDF)
            </Button>
          </CardContent>
        </Card>

        {/* Quote Response Section */}
        {quote.status === "pending" && (
          <Card>
            <CardHeader>
              <CardTitle>Quote Response</CardTitle>
              <CardDescription>
                Please review the quote above and let us know your decision. You can also provide additional feedback or questions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Additional Comments or Questions (Optional)
                </label>
                <Textarea
                  placeholder="Any questions, modifications, or special requirements..."
                  value={customerFeedback}
                  onChange={(e) => setCustomerFeedback(e.target.value)}
                  rows={4}
                />
              </div>
              
              <div className="flex space-x-3">
                <Button
                  className="bg-green-600 hover:bg-green-700 flex-1"
                  onClick={() => approvalMutation.mutate({ action: "approve", feedback: customerFeedback })}
                  disabled={approvalMutation.isPending}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Quote
                </Button>
                <Button
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50 flex-1"
                  onClick={() => approvalMutation.mutate({ action: "reject", feedback: customerFeedback })}
                  disabled={approvalMutation.isPending}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Request Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Message for Responded Quotes */}
        {quote.status !== "pending" && (
          <Card className={quote.status === "approved" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            <CardContent className="pt-6">
              <div className="text-center">
                {quote.status === "approved" ? (
                  <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                ) : (
                  <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
                )}
                <h3 className="text-lg font-semibold mb-2">
                  {quote.status === "approved" ? "Quote Approved!" : "Quote Response Received"}
                </h3>
                <p className="text-gray-600 mb-4">
                  {quote.status === "approved" 
                    ? "Thank you for approving this quote. Our team will contact you shortly to schedule the installation."
                    : "We've received your response and will follow up with revised options soon."
                  }
                </p>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = `mailto:${assessment.salesExecutiveEmail}`}
                >
                  Contact Sales Executive
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}