import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Shield, Users, FileText, BarChart3, CheckCircle, XCircle, Clock, Settings, Link, Copy, Mail, Send, TrendingUp, Eye, Trash2, Download, ExternalLink } from "lucide-react";
import type { User, Organization, Quote } from "@shared/schema";

interface AdminStats {
  totalPartners: number;
  pendingPartners: number;
  activeQuotes: number;
  totalQuotes: number;
}

export default function AdminDashboard() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [selectedQuoteData, setSelectedQuoteData] = useState<any>(null);

  // Redirect if not system admin
  useEffect(() => {
    if (!authLoading && isAuthenticated && !user?.isSystemAdmin && user?.role !== 'admin') {
      window.location.href = '/dashboard';
    }
  }, [authLoading, isAuthenticated, user]);

  // Admin stats query
  const { data: adminStats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: user?.isSystemAdmin || user?.role === 'admin',
    staleTime: 0,
    refetchOnMount: true,
  });

  // Partners query
  const { data: partners, isLoading: partnersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/partners"],
    enabled: user?.isSystemAdmin || user?.role === 'admin',
    staleTime: 0,
    refetchOnMount: true,
  });

  // Quotes query
  const { data: quotes, isLoading: quotesLoading } = useQuery<Quote[]>({
    queryKey: ["/api/admin/quotes"],
    enabled: user?.isSystemAdmin || user?.role === 'admin',
    staleTime: 0,
    refetchOnMount: true,
  });

  // Organizations query
  const { data: organizations, isLoading: orgsLoading } = useQuery<Organization[]>({
    queryKey: ["/api/admin/organizations"],
    enabled: user?.isSystemAdmin || user?.role === 'admin',
    staleTime: 0,
    refetchOnMount: true,
  });

  // Users query for role management
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: user?.isSystemAdmin || user?.role === 'admin',
    staleTime: 0,
    refetchOnMount: true,
  });

  // HubSpot test query
  const { data: hubspotStatus, isLoading: hubspotLoading } = useQuery({
    queryKey: ["/api/admin/hubspot/test"],
    enabled: user?.isSystemAdmin || user?.role === 'admin',
    staleTime: 0,
    refetchOnMount: true,
  });

  // Handle quote details view with full assessment data
  const handleViewQuoteDetails = async (quote: any) => {
    try {
      const response = await fetch(`/api/admin/quotes/${quote.id}/details`);
      if (!response.ok) {
        throw new Error('Failed to fetch quote details');
      }
      const quoteWithAssessment = await response.json();
      setSelectedQuoteData(quoteWithAssessment);
      setSelectedQuote(quote);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load quote details. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Partner approval mutation
  const approvePartnerMutation = useMutation({
    mutationFn: async (partnerId: string) => {
      const response = await fetch(`/api/admin/partners/${partnerId}/approve`, {
        method: 'POST',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to approve partner');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Partner Approved",
        description: "Partner has been approved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve partner. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Partner rejection mutation
  const rejectPartnerMutation = useMutation({
    mutationFn: async (partnerId: string) => {
      const response = await fetch(`/api/admin/partners/${partnerId}/reject`, {
        method: 'POST',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reject partner');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Partner Rejected",
        description: "Partner has been rejected successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Rejection Failed",
        description: error.message || "Failed to reject partner. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Role update mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update role');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Role Updated",
        description: "User role has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update role. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Copy signup link to clipboard
  const copySignupLink = async () => {
    const signupLink = `${window.location.origin}/auth/login?signup=true`;
    try {
      await navigator.clipboard.writeText(signupLink);
      toast({
        title: "Link Copied",
        description: "Partner signup link has been copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  // Close quote mutation
  const closeQuoteMutation = useMutation({
    mutationFn: async (quoteId: number) => {
      const response = await fetch(`/api/admin/quotes/${quoteId}/close`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed' }),
      });
      if (!response.ok) {
        throw new Error('Failed to close quote');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quotes"] });
      setSelectedQuote(null);
      toast({
        title: "Quote Closed",
        description: "Quote has been closed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to close quote. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete quote mutation
  const deleteQuoteMutation = useMutation({
    mutationFn: async (quoteId: number) => {
      const response = await fetch(`/api/admin/quotes/${quoteId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete quote');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quotes"] });
      setSelectedQuote(null);
      toast({
        title: "Quote Deleted",
        description: "Quote has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete quote. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (authLoading || (!user?.isSystemAdmin && user?.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
            {authLoading ? 'Verifying access...' : 'Access Denied'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {authLoading ? 'Please wait while we verify your permissions.' : 'System administrator access required.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Administration</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Manage partners, users, and system settings</p>
        </div>

        {/* Admin Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Partners</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsLoading ? '-' : adminStats?.totalPartners || 0}</div>
              <p className="text-xs text-muted-foreground">Active partnerships</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsLoading ? '-' : adminStats?.pendingPartners || 0}</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Quotes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsLoading ? '-' : adminStats?.activeQuotes || 0}</div>
              <p className="text-xs text-muted-foreground">Open quotes</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Quotes</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsLoading ? '-' : adminStats?.totalQuotes || 0}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="partners" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="partners">Partners</TabsTrigger>
            <TabsTrigger value="user-roles">User Roles</TabsTrigger>
            <TabsTrigger value="hubspot">HubSpot</TabsTrigger>
            <TabsTrigger value="invitations">Invitations</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="quotes">Quotes</TabsTrigger>
          </TabsList>

          <TabsContent value="partners" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Partner Management</CardTitle>
                    <CardDescription>Approve or reject partner applications</CardDescription>
                  </div>
                  <Button onClick={copySignupLink} variant="outline" className="flex items-center gap-2">
                    <Copy className="h-4 w-4" />
                    Copy Signup Link
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {partnersLoading ? (
                  <div className="text-center py-4">Loading partners...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Registration Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {partners?.map((partner) => (
                        <TableRow key={partner.id}>
                          <TableCell className="font-medium">{partner.username}</TableCell>
                          <TableCell>{partner.email}</TableCell>
                          <TableCell>{partner.organizationId || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={partner.status === 'approved' ? 'default' : 
                                            partner.status === 'pending' ? 'secondary' : 'destructive'}>
                              {partner.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(partner.createdAt || Date.now()).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {partner.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  onClick={() => approvePartnerMutation.mutate(partner.id)}
                                  disabled={approvePartnerMutation.isPending}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => rejectPartnerMutation.mutate(partner.id)}
                                  disabled={rejectPartnerMutation.isPending}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            )}
                            {partner.status === 'approved' && (
                              <Badge variant="outline">Active</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="user-roles" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Role Management</CardTitle>
                <CardDescription>Manage user permissions and roles</CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="text-center py-4">Loading users...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Current Role</TableHead>
                        <TableHead>System Admin</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users?.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.username}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{u.role || 'user'}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={u.isSystemAdmin ? 'default' : 'secondary'}>
                              {u.isSystemAdmin ? 'Yes' : 'No'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => updateRoleMutation.mutate({ userId: u.id, role: 'admin' })}
                                disabled={updateRoleMutation.isPending || u.role === 'admin'}
                              >
                                Make Admin
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => updateRoleMutation.mutate({ userId: u.id, role: 'user' })}
                                disabled={updateRoleMutation.isPending || u.role === 'user'}
                              >
                                Make User
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

          <TabsContent value="hubspot" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>HubSpot Integration</CardTitle>
                <CardDescription>Monitor HubSpot API connectivity and sync status</CardDescription>
              </CardHeader>
              <CardContent>
                {hubspotLoading ? (
                  <div className="text-center py-4">Testing HubSpot connection...</div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant={hubspotStatus?.success ? 'default' : 'destructive'}>
                        {hubspotStatus?.success ? 'Connected' : 'Error'}
                      </Badge>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {hubspotStatus?.success 
                          ? `Found ${hubspotStatus.contactCount} contacts` 
                          : hubspotStatus?.error || 'Connection failed'}
                      </span>
                    </div>
                    
                    {hubspotStatus?.success && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                          <h4 className="font-medium text-green-800 dark:text-green-200">API Status</h4>
                          <p className="text-sm text-green-600 dark:text-green-300">Connected and responding</p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                          <h4 className="font-medium text-blue-800 dark:text-blue-200">Contact Count</h4>
                          <p className="text-sm text-blue-600 dark:text-blue-300">{hubspotStatus.contactCount} contacts found</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invitations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Invitation Management</CardTitle>
                <CardDescription>Track sent invitations and signup conversions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Invitation tracking coming soon...
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Dashboard</CardTitle>
                <CardDescription>System metrics and usage analytics</CardDescription>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="text-center py-4">Loading analytics...</div>
                ) : (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-lg">
                      <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Partner Conversion</h3>
                      <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                        {adminStats?.totalPartners ? Math.round((adminStats.totalPartners - (adminStats.pendingPartners || 0)) / adminStats.totalPartners * 100) : 0}%
                      </div>
                      <p className="text-sm text-blue-600 dark:text-blue-300">Approval rate</p>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-lg">
                      <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">Quote Generation</h3>
                      <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                        {adminStats?.totalQuotes || 0}
                      </div>
                      <p className="text-sm text-green-600 dark:text-green-300">Total quotes created</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quotes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quote Management</CardTitle>
                <CardDescription>View and manage all system quotes</CardDescription>
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
                        <TableHead>Sales Executive</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead>Total Cost</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotes?.map((quote) => (
                        <TableRow key={quote.id}>
                          <TableCell className="font-medium">{quote.quoteNumber}</TableCell>
                          <TableCell>N/A</TableCell>
                          <TableCell>N/A</TableCell>
                          <TableCell>N/A</TableCell>
                          <TableCell>${quote.totalCost}</TableCell>
                          <TableCell>
                            <Badge variant={quote.status === 'active' ? 'default' : 'secondary'}>
                              {quote.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(quote.createdAt || Date.now()).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleViewQuoteDetails(quote)}
                                className="flex items-center gap-1"
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(`/api/files/pdf/${quote.pdfUrl}`, '_blank')}
                                className="flex items-center gap-1"
                              >
                                <Download className="h-4 w-4" />
                                PDF
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
        </Tabs>
      </div>

      {/* Quote Details Modal */}
      <Dialog open={!!selectedQuote} onOpenChange={() => setSelectedQuote(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Quote Details - {selectedQuote?.quoteNumber}
              <Badge variant="outline" className="ml-2">
                {selectedQuoteData?.assessment?.serviceType?.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Complete quote details and assessment information
            </DialogDescription>
          </DialogHeader>
          {selectedQuoteData && (
            <div className="space-y-6">
              {/* Quote Summary */}
              <div className="grid grid-cols-2 gap-6">
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 text-blue-600">Quote Information</h3>
                  <div className="space-y-2">
                    <p><strong>Quote Number:</strong> {selectedQuote?.quoteNumber}</p>
                    <p><strong>Total Cost:</strong> ${selectedQuote?.totalCost}</p>
                    <p><strong>Survey Cost:</strong> ${selectedQuote?.surveyCost || 'N/A'}</p>
                    <p><strong>Status:</strong> {selectedQuote?.status}</p>
                    <p><strong>Created:</strong> {new Date(selectedQuote?.createdAt || Date.now()).toLocaleDateString()}</p>
                  </div>
                </Card>
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 text-green-600">Customer Information</h3>
                  <div className="space-y-2">
                    <p><strong>Name:</strong> {selectedQuoteData?.assessment?.customerContactName || 'N/A'}</p>
                    <p><strong>Company:</strong> {selectedQuoteData?.assessment?.customerCompanyName || 'N/A'}</p>
                    <p><strong>Email:</strong> {selectedQuoteData?.assessment?.customerEmail || 'N/A'}</p>
                    <p><strong>Phone:</strong> {selectedQuoteData?.assessment?.customerPhone || 'N/A'}</p>
                    <p><strong>Organization:</strong> {selectedQuoteData?.organization?.name || 'N/A'}</p>
                  </div>
                </Card>
              </div>

              {/* Service-Specific Assessment Details */}
              {selectedQuoteData?.assessment?.serviceType === 'fixed-wireless' && (
                <div className="grid grid-cols-3 gap-6">
                  <Card className="p-4">
                    <h3 className="font-semibold mb-3 text-purple-600">Infrastructure Requirements</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Network Signal:</strong> {selectedQuoteData?.assessment?.networkSignal || 'Not specified'}</p>
                      <p><strong>Signal Strength:</strong> {selectedQuoteData?.assessment?.signalStrength || 'Not specified'}</p>
                      <p><strong>Connection Usage:</strong> {selectedQuoteData?.assessment?.connectionUsage || 'Not specified'}</p>
                      <p><strong>Router Location:</strong> {selectedQuoteData?.assessment?.routerLocation || 'Not specified'}</p>
                      <p><strong>Antenna Cable Required:</strong> {selectedQuoteData?.assessment?.antennaCable ? 'Yes' : 'No'}</p>
                      <p><strong>Low Signal Antenna Cable:</strong> {selectedQuoteData?.assessment?.lowSignalAntennaCable ? 'Yes' : 'No'}</p>
                      <p><strong>Device Connection Assistance:</strong> {selectedQuoteData?.assessment?.deviceConnectionAssistance ? 'Yes' : 'No'}</p>
                      <p><strong>Router Make:</strong> {selectedQuoteData?.assessment?.routerMake || 'Not specified'}</p>
                      <p><strong>Router Model:</strong> {selectedQuoteData?.assessment?.routerModel || 'Not specified'}</p>
                      <p><strong>Number of Routers:</strong> {selectedQuoteData?.assessment?.routerCount || 'Not specified'}</p>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <h3 className="font-semibold mb-3 text-orange-600">Site Characteristics</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Building Type:</strong> {selectedQuoteData?.assessment?.buildingType || 'Not specified'}</p>
                      <p><strong>Coverage Area:</strong> {selectedQuoteData?.assessment?.coverageArea || 'Not specified'}</p>
                      <p><strong>Floors:</strong> {selectedQuoteData?.assessment?.floors || 'Not specified'}</p>
                      <p><strong>Device Count:</strong> {selectedQuoteData?.assessment?.deviceCount || 'Not specified'}</p>
                      <p><strong>Ceiling Height:</strong> {selectedQuoteData?.assessment?.ceilingHeight || 'Not specified'}</p>
                      <p><strong>Ceiling Type:</strong> {selectedQuoteData?.assessment?.ceilingType || 'Not specified'}</p>
                      <p><strong>Cable Footage:</strong> {selectedQuoteData?.assessment?.cableFootage || 'Not specified'}</p>
                      <p><strong>Antenna Type:</strong> {selectedQuoteData?.assessment?.antennaType || 'Not specified'}</p>
                      <p><strong>Antenna Location:</strong> {selectedQuoteData?.assessment?.antennaInstallationLocation || 'Not specified'}</p>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <h3 className="font-semibold mb-3 text-red-600">Environmental Factors</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Interference Sources:</strong> {selectedQuoteData?.assessment?.interferenceSources || 'Not specified'}</p>
                      <p><strong>Special Requirements:</strong> {selectedQuoteData?.assessment?.specialRequirements || 'Not specified'}</p>
                      <p><strong>Additional Notes:</strong> {selectedQuoteData?.assessment?.additionalNotes || 'Not specified'}</p>
                      <p><strong>Site Address:</strong> {selectedQuoteData?.assessment?.siteAddress || 'Not specified'}</p>
                      <p><strong>Industry:</strong> {selectedQuoteData?.assessment?.industry || 'Not specified'}</p>
                      <p><strong>Preferred Install Date:</strong> {selectedQuoteData?.assessment?.preferredInstallationDate || 'Not specified'}</p>
                    </div>
                  </Card>
                </div>
              )}

              {/* Fleet services would have similar organized sections */}
              {(selectedQuoteData?.assessment?.serviceType === 'fleet-tracking' || selectedQuoteData?.assessment?.serviceType === 'fleet-camera') && (
                <div className="grid grid-cols-3 gap-6">
                  <Card className="p-4">
                    <h3 className="font-semibold mb-3 text-purple-600">Fleet Information</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Vehicle Count for Installation:</strong> {selectedQuoteData?.assessment?.vehicleCount || 'Not specified'}</p>
                      <p><strong>Total Fleet Size:</strong> {selectedQuoteData?.assessment?.totalFleetSize || 'Not specified'}</p>
                      <p><strong>Billing Address:</strong> {selectedQuoteData?.assessment?.billingAddress || 'Not specified'}</p>
                      <p><strong>Installation Site Address:</strong> {selectedQuoteData?.assessment?.installationSiteAddress || 'Not specified'}</p>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <h3 className="font-semibold mb-3 text-orange-600">Service Details</h3>
                    <div className="space-y-2 text-sm">
                      {selectedQuoteData?.assessment?.serviceType === 'fleet-tracking' && (
                        <>
                          <p><strong>Tracker Type:</strong> {selectedQuoteData?.assessment?.trackerType || 'Not specified'}</p>
                          <p><strong>Installation Type:</strong> {selectedQuoteData?.assessment?.installationType || 'Not specified'}</p>
                        </>
                      )}
                      {selectedQuoteData?.assessment?.serviceType === 'fleet-camera' && (
                        <>
                          <p><strong>Camera Solution Type:</strong> {selectedQuoteData?.assessment?.cameraSolutionType || 'Not specified'}</p>
                          <p><strong>Number of Cameras:</strong> {selectedQuoteData?.assessment?.numberOfCameras || 'Not specified'}</p>
                        </>
                      )}
                      <p><strong>Tracking Partner:</strong> {selectedQuoteData?.assessment?.iotTrackingPartner || 'Not specified'}</p>
                      <p><strong>Carrier SIM:</strong> {selectedQuoteData?.assessment?.carrierSim || 'Not specified'}</p>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <h3 className="font-semibold mb-3 text-red-600">Vehicle Information</h3>
                    <div className="space-y-2 text-sm">
                      {selectedQuoteData?.assessment?.vehicleDetails ? (
                        <div className="space-y-2">
                          {JSON.parse(selectedQuoteData.assessment.vehicleDetails).map((vehicle: any, index: number) => (
                            <div key={index} className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                              <p><strong>Vehicle {index + 1}:</strong> {vehicle.year || 'N/A'} {vehicle.make || 'N/A'} {vehicle.model || 'N/A'}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p>No vehicle details specified</p>
                      )}
                    </div>
                  </Card>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => window.open(`/api/files/pdf/${selectedQuote.pdfUrl}`, '_blank')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Quote PDF
            </Button>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={() => closeQuoteMutation.mutate(selectedQuote?.id)}
                disabled={closeQuoteMutation.isPending}
              >
                Close Quote
              </Button>
              <Button
                variant="outline"
                onClick={() => deleteQuoteMutation.mutate(selectedQuote?.id)}
                disabled={deleteQuoteMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Quote
              </Button>
              <Button variant="secondary" onClick={() => setSelectedQuote(null)}>
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}