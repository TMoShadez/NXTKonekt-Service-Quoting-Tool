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
    staleTime: 0, // Force fresh data
    refetchOnMount: true,
  }) as { data: any[], isLoading: boolean };



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
      'Sales Executive Name',
      'Sales Executive Email', 
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
      quote.assessment?.salesExecutiveName || '',
      quote.assessment?.salesExecutiveEmail || '',
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



  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleNewAssessment = async (serviceType: string) => {
    try {
      const response = await apiRequest("POST", "/api/assessments", {
        salesExecutiveName: (user as any)?.firstName ? `${(user as any).firstName} ${(user as any).lastName || ''}`.trim() : '',
        salesExecutiveEmail: (user as any)?.email || '',
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
                <div className="text-right">
                  <span className="block text-sm font-medium nxt-gray-800">
                    {(user as any)?.firstName ? `${(user as any).firstName} ${(user as any).lastName || ''}`.trim() : (user as any)?.email || 'User'}
                  </span>
                  <span className="block text-xs nxt-gray-500">
                    {(user as any)?.isSystemAdmin ? 'System Administrator' : 
                     (user as any)?.role === 'admin' ? 'Administrator' : 
                     (user as any)?.role === 'sales_executive' ? 'Sales Executive' : 
                     'Partner'}
                  </span>
                </div>
                <div className="h-8 w-8 bg-nxt-blue rounded-full flex items-center justify-center">
                  {(user as any)?.profileImageUrl ? (
                    <img 
                      src={(user as any).profileImageUrl} 
                      alt="Profile" 
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <User className="text-white" size={16} />
                  )}
                </div>
                {((user as any)?.isSystemAdmin || (user as any)?.role === 'admin') && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => window.location.href = "/admin"}
                    className="text-blue-600 hover:bg-blue-50"
                    title="Admin Dashboard"
                  >
                    <Shield size={16} />
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={handleLogout} title="Logout">
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
                      <th className="px-6 py-3 text-left text-xs font-medium nxt-gray-500 uppercase tracking-wider">Sales Executive</th>
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
                          {quote.assessment?.customerCompanyName || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm nxt-gray-800">
                          {quote.assessment?.salesExecutiveName || 'N/A'}
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
                          <Button 
                            variant="link" 
                            className="nxt-gray-500 hover:text-nxt-gray-700 p-0 mr-3"
                            onClick={async () => {
                              if (quote.pdfUrl) {
                                // Try to download existing PDF first
                                const filename = quote.pdfUrl.split('/').pop();
                                const pdfUrl = `/api/files/pdf/${filename}`;
                                
                                // Check if file exists by trying to access it
                                try {
                                  const response = await fetch(pdfUrl, { method: 'HEAD' });
                                  if (response.ok) {
                                    window.open(pdfUrl, '_blank');
                                    return;
                                  }
                                } catch (error) {
                                  console.log('PDF file not found, generating new one...');
                                }
                              }
                              
                              // Generate new PDF if existing one doesn't exist
                              try {
                                const response = await apiRequest("POST", `/api/quotes/${quote.id}/pdf`);
                                const data = await response.json();
                                window.open(data.pdfUrl, '_blank');
                                toast({
                                  title: "Success",
                                  description: "PDF generated and downloaded successfully!",
                                });
                                // Refresh quotes to update the pdfUrl
                                queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
                              } catch (error) {
                                toast({
                                  title: "Error", 
                                  description: "Failed to generate PDF",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            Download
                          </Button>
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
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Sales Executive</h3>
                    <p><strong>Name:</strong> {selectedQuote.assessment?.salesExecutiveName || 'N/A'}</p>
                    <p><strong>Email:</strong> {selectedQuote.assessment?.salesExecutiveEmail || 'N/A'}</p>
                    <p><strong>Phone:</strong> {selectedQuote.assessment?.salesExecutivePhone || 'N/A'}</p>
                  </div>
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
                    <p><strong>Service Type:</strong> <Badge variant="outline">{selectedQuote.assessment?.serviceType?.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'N/A'}</Badge></p>
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

                {/* Infrastructure Requirements */}
                <div>
                  <h3 className="font-semibold mb-3">Infrastructure Requirements</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedQuote.assessment?.deviceCount && (
                      <p><strong>Device Count:</strong> {selectedQuote.assessment.deviceCount} devices</p>
                    )}
                    <p><strong>Power Available:</strong> {selectedQuote.assessment?.powerAvailable ? 'Yes' : 'No'}</p>
                    <p><strong>Ethernet Required:</strong> {selectedQuote.assessment?.ethernetRequired ? 'Yes' : 'No'}</p>
                    <p><strong>Device Connection Assistance:</strong> {
                      selectedQuote.assessment?.deviceConnectionAssistance === 'yes' ? 'Required' : 
                      selectedQuote.assessment?.deviceConnectionAssistance === 'no' ? 'Not Required' : 'Not specified'
                    }</p>
                    {selectedQuote.assessment?.routerMake && (
                      <p><strong>Router:</strong> {selectedQuote.assessment.routerMake} {selectedQuote.assessment.routerModel}</p>
                    )}
                    {selectedQuote.assessment?.routerCount && (
                      <p><strong>Router Count:</strong> {selectedQuote.assessment.routerCount}</p>
                    )}
                    {selectedQuote.assessment?.routerLocation && (
                      <p><strong>Router Location:</strong> {selectedQuote.assessment.routerLocation}</p>
                    )}
                    {selectedQuote.assessment?.cableFootage && (
                      <p><strong>Cable Footage:</strong> {selectedQuote.assessment.cableFootage}</p>
                    )}
                    {selectedQuote.assessment?.antennaType && (
                      <p><strong>Antenna Type:</strong> {selectedQuote.assessment.antennaType}</p>
                    )}
                    {selectedQuote.assessment?.antennaInstallationLocation && (
                      <p><strong>Antenna Location:</strong> {selectedQuote.assessment.antennaInstallationLocation}</p>
                    )}
                    {selectedQuote.assessment?.routerMounting && (
                      <p><strong>Router Mounting:</strong> {selectedQuote.assessment.routerMounting}</p>
                    )}
                    {selectedQuote.assessment?.dualWanSupport && (
                      <p><strong>Dual WAN Support:</strong> {selectedQuote.assessment.dualWanSupport}</p>
                    )}
                  </div>
                </div>

                {/* Site Characteristics */}
                <div>
                  <h3 className="font-semibold mb-3">Site Characteristics</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <p><strong>Address:</strong> {selectedQuote.assessment?.siteAddress || 'N/A'}</p>
                    <p><strong>Industry:</strong> {selectedQuote.assessment?.industry || 'N/A'}</p>
                    {selectedQuote.assessment?.buildingType && (
                      <p><strong>Building Type:</strong> {selectedQuote.assessment.buildingType}</p>
                    )}
                    {selectedQuote.assessment?.coverageArea && (
                      <p><strong>Coverage Area:</strong> {selectedQuote.assessment.coverageArea.toLocaleString()} sq ft</p>
                    )}
                    {selectedQuote.assessment?.floors && (
                      <p><strong>Number of Floors:</strong> {selectedQuote.assessment.floors}</p>
                    )}
                    <p><strong>Ceiling Mount:</strong> {selectedQuote.assessment?.ceilingMount ? 'Yes' : 'No'}</p>
                    <p><strong>Outdoor Coverage:</strong> {selectedQuote.assessment?.outdoorCoverage ? 'Required' : 'Not Required'}</p>
                    {selectedQuote.assessment?.ceilingHeight && (
                      <p><strong>Ceiling Height:</strong> {selectedQuote.assessment.ceilingHeight}</p>
                    )}
                    {selectedQuote.assessment?.ceilingType && (
                      <p><strong>Ceiling Type:</strong> {selectedQuote.assessment.ceilingType}</p>
                    )}
                    {selectedQuote.assessment?.networkSignal && (
                      <p><strong>Network Signal:</strong> {selectedQuote.assessment.networkSignal}</p>
                    )}
                    {selectedQuote.assessment?.signalStrength && (
                      <p><strong>Signal Strength:</strong> {selectedQuote.assessment.signalStrength}</p>
                    )}
                    {selectedQuote.assessment?.connectionUsage && (
                      <p><strong>Connection Usage:</strong> {selectedQuote.assessment.connectionUsage}</p>
                    )}
                  </div>
                </div>

                {/* Environmental Factors & Notes */}
                {(selectedQuote.assessment?.interferenceSources || selectedQuote.assessment?.specialRequirements || selectedQuote.assessment?.additionalNotes) && (
                  <div>
                    <h3 className="font-semibold mb-3">Environmental Factors & Special Requirements</h3>
                    <div className="space-y-3 text-sm">
                      {selectedQuote.assessment?.interferenceSources && (
                        <div>
                          <p><strong>Interference Sources:</strong></p>
                          <p className="mt-1 text-gray-600 leading-relaxed">{selectedQuote.assessment.interferenceSources}</p>
                        </div>
                      )}
                      {selectedQuote.assessment?.specialRequirements && (
                        <div>
                          <p><strong>Special Requirements:</strong></p>
                          <p className="mt-1 text-gray-600 leading-relaxed">{selectedQuote.assessment.specialRequirements}</p>
                        </div>
                      )}
                      {selectedQuote.assessment?.additionalNotes && (
                        <div>
                          <p><strong>Additional Notes:</strong></p>
                          <p className="mt-1 text-gray-600 leading-relaxed">{selectedQuote.assessment.additionalNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Fleet-specific details if applicable */}
                {selectedQuote.assessment?.serviceType === 'fleet-tracking' && (
                  <div>
                    <h3 className="font-semibold mb-3">Fleet Tracking Details</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {selectedQuote.assessment?.totalFleetSize && (
                        <p><strong>Total Fleet Size:</strong> {selectedQuote.assessment.totalFleetSize} vehicles</p>
                      )}
                      {selectedQuote.assessment?.trackerType && (
                        <p><strong>Tracker Type:</strong> {selectedQuote.assessment.trackerType}</p>
                      )}
                      {selectedQuote.assessment?.iotTrackingPartner && (
                        <p><strong>IoT Partner:</strong> {selectedQuote.assessment.iotTrackingPartner}</p>
                      )}
                      {selectedQuote.assessment?.carrierSim && (
                        <p><strong>Carrier SIM:</strong> {selectedQuote.assessment.carrierSim}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Fleet Camera specific details if applicable */}
                {selectedQuote.assessment?.serviceType === 'fleet-camera' && (
                  <div>
                    <h3 className="font-semibold mb-3">Fleet Camera Details</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {selectedQuote.assessment?.cameraSolutionType && (
                        <p><strong>Camera Solution:</strong> {selectedQuote.assessment.cameraSolutionType}</p>
                      )}
                      {selectedQuote.assessment?.numberOfCameras && (
                        <p><strong>Number of Cameras:</strong> {selectedQuote.assessment.numberOfCameras}</p>
                      )}
                      {selectedQuote.assessment?.removalNeeded && (
                        <p><strong>Removal Needed:</strong> {selectedQuote.assessment.removalNeeded}</p>
                      )}
                      {selectedQuote.assessment?.existingCameraSolution && (
                        <p><strong>Existing Solution:</strong> {selectedQuote.assessment.existingCameraSolution}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={async () => {
                      try {
                        const response = await apiRequest("POST", `/api/quotes/${selectedQuote.id}/pdf`);
                        const data = await response.json();
                        window.open(data.pdfUrl, '_blank');
                        toast({
                          title: "Success",
                          description: "PDF generated successfully!",
                        });
                      } catch (error) {
                        toast({
                          title: "Error", 
                          description: "Failed to generate PDF",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Generate PDF
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={async () => {
                      if (selectedQuote.pdfUrl) {
                        // Try to download existing PDF first
                        const filename = selectedQuote.pdfUrl.split('/').pop();
                        const pdfUrl = `/api/files/pdf/${filename}`;
                        
                        // Check if file exists by trying to access it
                        try {
                          const response = await fetch(pdfUrl, { method: 'HEAD' });
                          if (response.ok) {
                            window.open(pdfUrl, '_blank');
                            return;
                          }
                        } catch (error) {
                          console.log('PDF file not found, generating new one...');
                        }
                      }
                      
                      // Generate new PDF if existing one doesn't exist
                      try {
                        const response = await apiRequest("POST", `/api/quotes/${selectedQuote.id}/pdf`);
                        const data = await response.json();
                        window.open(data.pdfUrl, '_blank');
                        toast({
                          title: "Success",
                          description: "PDF generated and downloaded successfully!",
                        });
                        // Update the selected quote
                        setSelectedQuote({...selectedQuote, pdfUrl: data.pdfUrl});
                        // Refresh quotes to update the pdfUrl
                        queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
                      } catch (error) {
                        toast({
                          title: "Error", 
                          description: "Failed to generate PDF",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
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
