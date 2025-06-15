import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle, Clock, Plus, Download, LogOut, User, ChevronDown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import nxtKonektLogo from "@assets/NxtKonekt Logo_1749973360626.png";

export default function Dashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();

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
                  <SelectValue placeholder="Create New Assessment" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="site-assessment">Site Assessment (Fixed Wireless)</SelectItem>
                <SelectItem value="fleet-tracking">Fleet & Asset Tracking Device</SelectItem>
                <SelectItem value="fleet-camera">Fleet Camera Installation</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            variant="outline"
            className="flex-1 sm:flex-none px-6 py-4 rounded-xl font-medium border-gray-200 hover:bg-gray-50 transition-colors"
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
                            onClick={() => navigate(`/assessment/${quote.assessmentId}`)}
                          >
                            View
                          </Button>
                          {quote.pdfUrl && (
                            <Button 
                              variant="link" 
                              className="nxt-gray-500 hover:text-nxt-gray-700 p-0"
                              onClick={() => window.open(quote.pdfUrl, '_blank')}
                            >
                              Download
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
