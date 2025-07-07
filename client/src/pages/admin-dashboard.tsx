import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Users, FileText, BarChart3, CheckCircle, XCircle, Clock, Settings } from "lucide-react";
import type { User, Organization, Assessment, Quote } from "@shared/schema";

interface AdminStats {
  totalPartners: number;
  pendingPartners: number;
  totalAssessments: number;
  totalQuotes: number;
  monthlyRevenue: number;
}

interface PartnerWithOrg extends User {
  organization?: Organization;
}

export default function AdminDashboard() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin dashboard.",
        variant: "destructive",
      });
      window.location.href = "/";
    }
  }, [user, authLoading, isAuthenticated, toast]);

  // Admin stats query
  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: user?.role === 'admin',
  });

  // Partners query
  const { data: partners, isLoading: partnersLoading } = useQuery<PartnerWithOrg[]>({
    queryKey: ["/api/admin/partners"],
    enabled: user?.role === 'admin',
  });

  // Assessments query
  const { data: assessments, isLoading: assessmentsLoading } = useQuery<Assessment[]>({
    queryKey: ["/api/admin/assessments"],
    enabled: user?.role === 'admin',
  });

  // Quotes query
  const { data: quotes, isLoading: quotesLoading } = useQuery<Quote[]>({
    queryKey: ["/api/admin/quotes"],
    enabled: user?.role === 'admin',
  });

  // Update partner status mutation
  const updatePartnerMutation = useMutation({
    mutationFn: async ({ partnerId, status }: { partnerId: string; status: string }) => {
      await apiRequest("PATCH", `/api/admin/partners/${partnerId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Partner Updated",
        description: "Partner status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update partner status.",
        variant: "destructive",
      });
    },
  });

  // Toggle user active status mutation
  const toggleUserMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      await apiRequest("PATCH", `/api/admin/users/${userId}/toggle`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partners"] });
      toast({
        title: "User Updated",
        description: "User status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update user status.",
        variant: "destructive",
      });
    },
  });

  if (authLoading || user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">Loading...</h3>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: "secondary", icon: Clock },
      approved: { variant: "default", icon: CheckCircle },
      suspended: { variant: "destructive", icon: XCircle },
    };
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">NXTKonekt Partner Management</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = "/"}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Back to App
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Partners</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalPartners || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.pendingPartners || 0} pending approval
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assessments</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalAssessments || 0}</div>
              <p className="text-xs text-muted-foreground">Total completed</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quotes Generated</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalQuotes || 0}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats?.monthlyRevenue?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="partners" className="space-y-4">
          <TabsList>
            <TabsTrigger value="partners">Partners</TabsTrigger>
            <TabsTrigger value="assessments">Assessments</TabsTrigger>
            <TabsTrigger value="quotes">Quotes</TabsTrigger>
          </TabsList>

          <TabsContent value="partners" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Partner Management</CardTitle>
                <CardDescription>
                  Manage partner registrations and approvals
                </CardDescription>
              </CardHeader>
              <CardContent>
                {partnersLoading ? (
                  <div className="text-center py-4">Loading partners...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Partner Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Active</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {partners?.map((partner) => (
                        <TableRow key={partner.id}>
                          <TableCell className="font-medium">
                            {partner.firstName} {partner.lastName}
                          </TableCell>
                          <TableCell>{partner.email}</TableCell>
                          <TableCell>{partner.organization?.name || "No org"}</TableCell>
                          <TableCell className="capitalize">
                            {partner.organization?.partnerType || "installer"}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(partner.organization?.partnerStatus || "pending")}
                          </TableCell>
                          <TableCell>
                            <Badge variant={partner.isActive ? "default" : "secondary"}>
                              {partner.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Select
                                value={partner.organization?.partnerStatus || "pending"}
                                onValueChange={(status) =>
                                  partner.organization?.id &&
                                  updatePartnerMutation.mutate({
                                    partnerId: partner.organization.id.toString(),
                                    status,
                                  })
                                }
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="approved">Approved</SelectItem>
                                  <SelectItem value="suspended">Suspended</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  toggleUserMutation.mutate({
                                    userId: partner.id,
                                    isActive: !partner.isActive,
                                  })
                                }
                              >
                                {partner.isActive ? "Deactivate" : "Activate"}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assessments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Assessments</CardTitle>
                <CardDescription>
                  Overview of all partner assessments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {assessmentsLoading ? (
                  <div className="text-center py-4">Loading assessments...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Service Type</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Sales Executive</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assessments?.slice(0, 10).map((assessment) => (
                        <TableRow key={assessment.id}>
                          <TableCell>{assessment.id}</TableCell>
                          <TableCell className="capitalize">
                            {assessment.serviceType?.replace('-', ' ')}
                          </TableCell>
                          <TableCell>{assessment.customerCompanyName}</TableCell>
                          <TableCell>{assessment.salesExecutiveName}</TableCell>
                          <TableCell>
                            {new Date(assessment.createdAt!).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quotes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Quotes</CardTitle>
                <CardDescription>
                  Overview of generated quotes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {quotesLoading ? (
                  <div className="text-center py-4">Loading quotes...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Quote #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotes?.slice(0, 10).map((quote) => (
                        <TableRow key={quote.id}>
                          <TableCell>{quote.quoteNumber}</TableCell>
                          <TableCell>{quote.customerName}</TableCell>
                          <TableCell>${quote.totalCost}</TableCell>
                          <TableCell className="capitalize">
                            <Badge variant={quote.status === 'approved' ? 'default' : 'secondary'}>
                              {quote.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(quote.createdAt!).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}