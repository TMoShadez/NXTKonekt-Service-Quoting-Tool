import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, CheckCircle, Clock, Plus, Download, LogOut, User, ChevronDown, Trash2, Share, Copy, Settings, ExternalLink, Shield, Eye } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import nxtKonektLogo from "@assets/NxtKonekt Logo_1749973360626.png";

export default function Dashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [selectedQuote, setSelectedQuote] = useState<any>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: quotes = [], isLoading: quotesLoading } = useQuery({
    queryKey: ["/api/quotes"],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: assessments = [], isLoading: assessmentsLoading } = useQuery({
    queryKey: ["/api/assessments"],
    enabled: isAuthenticated,
    retry: false,
  });

  const deleteQuoteMutation = useMutation({
    mutationFn: async (quoteId: number) => {
      await apiRequest("DELETE", `/api/quotes/${quoteId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Quote deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Error",
        description: "Failed to delete quote",
        variant: "destructive",
      });
    },
  });

  const handleDeleteQuote = (quoteId: number, quoteNumber: string) => {
    if (confirm(`Are you sure you want to delete quote #${quoteNumber}? This action cannot be undone.`)) {
      deleteQuoteMutation.mutate(quoteId);
    }
  };

  const handleExportReports = () => {
    // Create CSV content with quotes and assessments data
    const csvHeaders = [
      'Quote Number',
      'Customer Name', 
      'Customer Company',
      'Customer Email',
      'Customer Phone',
      'Service Type',
      'Total Cost',
      'Status',
      'Site Address',
      'Industry',
      'Building Type',
      'Created Date',
      'Survey Hours',
      'Installation Hours',
      'Configuration Hours',
      'Labor Hold Cost',
      'Hardware Cost'
    ];

    const csvRows = quotes.map((quote: any) => [
      quote.quoteNumber,
      quote.assessment?.customerContactName || '',
      quote.assessment?.customerCompanyName || '',
      quote.assessment?.customerEmail || '',
      quote.assessment?.customerPhone || '',
      quote.assessment?.serviceType?.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || '',
      parseFloat(quote.totalCost).toFixed(2),
      quote.status,
      quote.assessment?.siteAddress || '',
      quote.assessment?.industry || '',
      quote.assessment?.buildingType || '',
      new Date(quote.createdAt).toLocaleDateString(),
      quote.surveyHours || '0',
      quote.installationHours || '0',
      quote.configurationHours || '0',
      parseFloat(quote.laborHoldCost || 0).toFixed(2),
      parseFloat(quote.hardwareCost || 0).toFixed(2)
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `nxtkonekt-quotes-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Report Exported",
      description: `Downloaded quotes report with ${quotes.length} records`,
    });
  };

  const handleShareCustomerPortal = async (quoteId: number, customerName: string) => {
    const customerPortalUrl = `${window.location.origin}/customer/${quoteId}`;
    
    // Try to copy to clipboard first
    try {
      await navigator.clipboard.writeText(customerPortalUrl);
      toast({
        title: "Customer Portal Link Copied!",
        description: `Link copied to clipboard. Share with ${customerName} to view and approve the quote.`,
      });
    } catch (error) {
      // Fallback: Show a prompt with the URL for manual copying
      const userAction = prompt(
        `Copy this customer portal link to share with ${customerName}:`, 
        customerPortalUrl
      );
      
      if (userAction !== null) {
        toast({
          title: "Customer Portal Link Ready",
          description: `Share this link with ${customerName} to view and approve the quote`,
        });
      }
    }
  };

  // HubSpot integration mutations


  const hubspotSyncMutation = useMutation({
    mutationFn: async (quoteId: number) => {
      return apiRequest("POST", `/api/hubspot/sync-quote/${quoteId}`, {});
    },
    onSuccess: (data: any) => {
      toast({
        title: "HubSpot Sync Successful",
        description: `Quote synced to HubSpot. Contact ID: ${data.hubspotData.contactId}`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "HubSpot Sync Failed",
        description: "Failed to sync quote to HubSpot",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleNewAssessment = async (serviceType: string) => {
    try {
      const response = await apiRequest("POST", "/api/assessments", {
        salesExecutiveName: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '',
        salesExecutiveEmail: user?.email || '',
        salesExecutivePhone: '',
        customerCompanyName: '',
        customerContactName: '',
        customerEmail: '',
        customerPhone: '',
        siteAddress: '',
        serviceType: serviceType,
        // Don't include organizationId at all initially
      });
      
      const assessment = await response.json();
      
      // Route to appropriate form based on service type
      if (serviceType === 'site-assessment') {
        navigate(`/assessment/${assessment.id}`);
      } else if (serviceType === 'fleet-tracking') {
        navigate(`/fleet-tracking/${assessment.id}`);
      } else if (serviceType === 'fleet-camera') {
        navigate(`/fleet-camera/${assessment.id}`);
      }
    } catch (error) {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Error",
        description: "Failed to create new assessment",
        variant: "destructive",
      });
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-nxt-gray-50">
        <div className="text-center">
          <img 
            src={nxtKonektLogo} 
            alt="NXTKonekt Logo" 
            className="h-8 w-auto mx-auto mb-4"
          />
          <p className="nxt-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  const totalQuotes = quotes.length;
  const approvedQuotes = quotes.filter((q: any) => q.status === 'approved').length;
  const pendingQuotes = quotes.filter((q: any) => q.status === 'pending').length;

  return (
    <div className="min-h-screen bg-nxt-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img 
                src={nxtKonektLogo} 
                alt="NXTKonekt Logo" 
                className="h-8 w-auto"
              />
              <span className="ml-3 text-xl font-semibold nxt-gray-800">NXTKonekt</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden lg:flex items-center space-x-4">
                <span className="text-sm nxt-gray-500">
                  {user?.firstName} {user?.lastName}
                </span>
                <div className="h-8 w-8 bg-nxt-blue rounded-full flex items-center justify-center">
                  {user?.profileImageUrl ? (
                    <img 
                      src={user.profileImageUrl} 
                      alt="Profile" 
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <User className="text-white" size={16} />
                  )}
                </div>
                {(user?.isSystemAdmin || user?.role === 'admin') && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => window.location.href = "/admin"}
                    className="text-blue-600 hover:bg-blue-50"
                  >
                    <Shield size={16} />
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut size={16} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="text-nxt-blue" size={24} />
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold nxt-gray-800">{totalQuotes}</h3>
                  <p className="nxt-gray-500">Total Quotes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="text-nxt-green" size={24} />
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold nxt-gray-800">{approvedQuotes}</h3>
                  <p className="nxt-gray-500">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="text-yellow-600" size={24} />
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold nxt-gray-800">{pendingQuotes}</h3>
                  <p className="nxt-gray-500">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 sm:flex-none">
            <Select onValueChange={(value) => handleNewAssessment(value)}>
              <SelectTrigger className="w-full bg-nxt-blue text-white px-6 py-4 rounded-xl font-medium hover:bg-blue-700 transition-colors border-none">
                <div className="flex items-center">
                  <Plus className="mr-2" size={20} />
                  <SelectValue placeholder="Generate New Quote" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="site-assessment">Fixed Wireless Access Assessment</SelectItem>
                <SelectItem value="fleet-tracking">Fleet & Asset Tracking Device</SelectItem>
                <SelectItem value="fleet-camera">Fleet Camera Installation</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            variant="outline"
            className="flex-1 sm:flex-none px-6 py-4 rounded-xl font-medium border-gray-200 hover:bg-gray-50 transition-colors"
            onClick={handleExportReports}
            disabled={quotes.length === 0}
          >
            <Download className="mr-2" size={20} />
            Export Reports
          </Button>
        </div>



        {/* Recent Quotes Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold nxt-gray-800">Recent Quotes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {quotesLoading ? (
              <div className="p-8 text-center">
                <p className="nxt-gray-500">Loading quotes...</p>
              </div>
            ) : quotes.length === 0 ? (
              <div className="p-8 text-center">
                <p className="nxt-gray-500">No quotes yet. Create your first assessment to generate a quote.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-nxt-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium nxt-gray-500 uppercase tracking-wider">Quote ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium nxt-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium nxt-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium nxt-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium nxt-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium nxt-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {quotes.map((quote: any) => (
                      <tr key={quote.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-nxt-blue">
                          #{quote.quoteNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm nxt-gray-800">
                          {quote.assessment.customerCompanyName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm nxt-gray-800">
                          ${parseFloat(quote.totalCost).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge 
                            variant={quote.status === 'approved' ? 'default' : 'secondary'}
                            className={
                              quote.status === 'approved' 
                                ? 'bg-nxt-green text-white' 
                                : 'bg-yellow-100 text-yellow-800'
                            }
                          >
                            {quote.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm nxt-gray-500">
                          {new Date(quote.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button 
                            variant="link" 
                            className="text-nxt-blue hover:text-blue-700 p-0 mr-3"
                            onClick={() => setSelectedQuote(quote)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {quote.pdfUrl && (
                            <Button 
                              variant="link" 
                              className="nxt-gray-500 hover:text-nxt-gray-700 p-0 mr-3"
                              onClick={() => window.open(quote.pdfUrl, '_blank')}
                            >
                              Download
                            </Button>
                          )}
                          <Button 
                            variant="link" 
                            className="text-nxt-blue hover:text-blue-700 p-0 mr-3"
                            onClick={() => handleShareCustomerPortal(quote.id, quote.assessment.customerCompanyName)}
                            title="Share customer portal link"
                          >
                            <Share className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="link" 
                            className="text-green-600 hover:text-green-700 p-0 mr-3"
                            onClick={() => hubspotSyncMutation.mutate(quote.id)}
                            disabled={hubspotSyncMutation.isPending}
                            title="Sync to HubSpot"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="link" 
                            className="text-red-500 hover:text-red-700 p-0"
                            onClick={() => handleDeleteQuote(quote.id, quote.quoteNumber)}
                            disabled={deleteQuoteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quote View Modal */}
        <Dialog open={!!selectedQuote} onOpenChange={() => setSelectedQuote(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Quote Details - {selectedQuote?.quoteNumber}</DialogTitle>
              <DialogDescription>
                Complete quote information and pricing breakdown
              </DialogDescription>
            </DialogHeader>
            {selectedQuote && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Customer Information</h3>
                    <p><strong>Name:</strong> {selectedQuote.assessment?.customerContactName || 'N/A'}</p>
                    <p><strong>Company:</strong> {selectedQuote.assessment?.customerCompanyName || 'N/A'}</p>
                    <p><strong>Email:</strong> {selectedQuote.assessment?.customerEmail || 'N/A'}</p>
                    <p><strong>Phone:</strong> {selectedQuote.assessment?.customerPhone || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Quote Summary</h3>
                    <p><strong>Quote Number:</strong> {selectedQuote.quoteNumber}</p>
                    <p><strong>Service Type:</strong> <Badge variant="outline">{selectedQuote.assessment?.serviceType?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}</Badge></p>
                    <p><strong>Total Cost:</strong> ${parseFloat(selectedQuote.totalCost).toFixed(2)}</p>
                    <p><strong>Status:</strong> <Badge variant={selectedQuote.status === 'approved' ? 'default' : 'secondary'}>{selectedQuote.status}</Badge></p>
                    <p><strong>Created:</strong> {new Date(selectedQuote.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Pricing Breakdown</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p>Survey Hours: {selectedQuote.surveyHours || 0}</p>
                    <p>Survey Cost: ${parseFloat(selectedQuote.surveyCost || 0).toFixed(2)}</p>
                    <p>Installation Hours: {selectedQuote.installationHours || 0}</p>
                    <p>Installation Cost: ${parseFloat(selectedQuote.installationCost || 0).toFixed(2)}</p>
                    <p>Configuration Hours: {selectedQuote.configurationHours || 0}</p>
                    <p>Configuration Cost: ${parseFloat(selectedQuote.configurationCost || 0).toFixed(2)}</p>
                    <p>Hardware Cost: ${parseFloat(selectedQuote.hardwareCost || 0).toFixed(2)}</p>
                    <p>Labor Hold: ${parseFloat(selectedQuote.laborHoldCost || 0).toFixed(2)}</p>
                    {selectedQuote.removalCost && parseFloat(selectedQuote.removalCost) > 0 && (
                      <>
                        <p>Removal Hours: {selectedQuote.removalHours || 0}</p>
                        <p>Removal Cost: ${parseFloat(selectedQuote.removalCost).toFixed(2)}</p>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Site Information</h3>
                  <p><strong>Address:</strong> {selectedQuote.assessment?.siteAddress || 'N/A'}</p>
                  <p><strong>Industry:</strong> {selectedQuote.assessment?.industry || 'N/A'}</p>
                  <p><strong>Building Type:</strong> {selectedQuote.assessment?.buildingType || 'N/A'}</p>
                </div>

                <div className="flex gap-2">
                  {selectedQuote.pdfUrl && (
                    <Button 
                      variant="outline"
                      onClick={() => window.open(selectedQuote.pdfUrl, '_blank')}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </Button>
                  )}
                  <Button 
                    variant="outline"
                    onClick={() => handleShareCustomerPortal(selectedQuote.id, selectedQuote.assessment?.customerCompanyName)}
                  >
                    <Share className="mr-2 h-4 w-4" />
                    Share Customer Portal
                  </Button>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="secondary" onClick={() => setSelectedQuote(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
