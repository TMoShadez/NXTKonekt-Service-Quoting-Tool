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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Shield, Users, FileText, BarChart3, CheckCircle, XCircle, Clock, Settings, Link, Copy, Mail, Send, TrendingUp } from "lucide-react";
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

  // Redirect if not system admin
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || (!user?.isSystemAdmin && user?.role !== 'admin'))) {
      toast({
        title: "Access Denied",
        description: "System administrator access required.",
        variant: "destructive",
      });
      window.location.href = "/";
    }
  }, [user, authLoading, isAuthenticated, toast]);

  // Admin stats query
  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: user?.isSystemAdmin || user?.role === 'admin',
  });

  // Partners query
  const { data: partners, isLoading: partnersLoading } = useQuery<PartnerWithOrg[]>({
    queryKey: ["/api/admin/partners"],
    enabled: user?.isSystemAdmin || user?.role === 'admin',
  });

  // Assessments query
  const { data: assessments, isLoading: assessmentsLoading } = useQuery<Assessment[]>({
    queryKey: ["/api/admin/assessments"],
    enabled: user?.isSystemAdmin || user?.role === 'admin',
  });

  // Quotes query
  const { data: quotes, isLoading: quotesLoading } = useQuery<Quote[]>({
    queryKey: ["/api/admin/quotes"],
    enabled: user?.isSystemAdmin || user?.role === 'admin',
  });

  // Invitations query
  const { data: invitations } = useQuery({
    queryKey: ["/api/admin/invitations"],
    enabled: user?.isSystemAdmin || user?.role === 'admin',
  });

  // Analytics query
  const { data: analytics } = useQuery({
    queryKey: ["/api/admin/analytics"],
    enabled: user?.isSystemAdmin || user?.role === 'admin',
  });

  // Test email connection mutation
  const testEmailMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("GET", "/api/admin/test-email");
    },
    onSuccess: (data) => {
      toast({
        title: data.success ? "Email Connection Success" : "Email Connection Failed",
        description: data.success 
          ? "Company mailbox is properly configured and ready to send invitations"
          : `Email configuration error: ${data.error}`,
        variant: data.success ? "default" : "destructive",
      });
    },
    onError: (error) => {
      toast({
        title: "Email Test Failed",
        description: "Failed to test email connection",
        variant: "destructive",
      });
    },
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

  // Send email invitation mutation
  const sendInvitationMutation = useMutation({
    mutationFn: async (data: { email: string; recipientName?: string; companyName?: string }) => {
      return apiRequest("POST", "/api/admin/send-invitation", data);
    },
    onSuccess: () => {
      toast({
        title: "Invitation Sent",
        description: "Partner invitation email has been sent successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invitations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
    },
    onError: (error) => {
      toast({
        title: "Invitation Failed",
        description: "Failed to send partner invitation",
        variant: "destructive",
      });
    },
  });

  // Copy signup link function
  const copySignupLink = async () => {
    const signupLink = `${window.location.origin}/api/login`;
    try {
      await navigator.clipboard.writeText(signupLink);
      toast({
        title: "Link Copied",
        description: "Partner signup link has been copied to clipboard",
      });
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = signupLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      toast({
        title: "Link Copied",
        description: "Partner signup link has been copied to clipboard",
      });
    }
  };

  if (authLoading || (!user?.isSystemAdmin && user?.role !== 'admin')) {
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
              <div className="flex items-center gap-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                      size="sm"
                    >
                      <Mail className="h-4 w-4" />
                      Send Email Invitation
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Send Partner Invitation</DialogTitle>
                      <DialogDescription>
                        Send a branded email invitation to potential partners
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      sendInvitationMutation.mutate({
                        email: formData.get('email') as string,
                        recipientName: formData.get('recipientName') as string,
                        companyName: formData.get('companyName') as string,
                      });
                    }}>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="email" className="text-right">
                            Email *
                          </Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className="col-span-3"
                            placeholder="partner@company.com"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="recipientName" className="text-right">
                            Name
                          </Label>
                          <Input
                            id="recipientName"
                            name="recipientName"
                            className="col-span-3"
                            placeholder="John Doe"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="companyName" className="text-right">
                            Company
                          </Label>
                          <Input
                            id="companyName"
                            name="companyName"
                            className="col-span-3"
                            placeholder="ABC Installation Services"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          type="submit" 
                          disabled={sendInvitationMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {sendInvitationMutation.isPending ? (
                            <>Sending...</>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Send Invitation
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
                
                <Button
                  onClick={() => testEmailMutation.mutate()}
                  disabled={testEmailMutation.isPending}
                  variant="outline"
                  className="flex items-center gap-2"
                  size="sm"
                >
                  <Mail className="h-4 w-4" />
                  {testEmailMutation.isPending ? "Testing..." : "Test Email"}
                </Button>

                <Button
                  onClick={copySignupLink}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                  size="sm"
                >
                  <Copy className="h-4 w-4" />
                  Copy Signup Link
                </Button>
                
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
            <TabsTrigger value="invitations">Invitations</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="assessments">Assessments</TabsTrigger>
            <TabsTrigger value="quotes">Quotes</TabsTrigger>
          </TabsList>

          <TabsContent value="partners" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Partner Management</CardTitle>
                    <CardDescription>
                      Manage partner registrations and approvals. Use the "Copy Partner Signup Link" button above to share the registration link with new partners.
                    </CardDescription>
                  </div>
                  <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-md">
                    <div className="font-medium mb-1">Partner Signup Process:</div>
                    <div>1. Copy the signup link above</div>
                    <div>2. Email to potential partners</div>
                    <div>3. They sign in and create organization</div>
                    <div>4. Approve their status here</div>
                  </div>
                </div>
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

          <TabsContent value="invitations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Partner Invitations</CardTitle>
                <CardDescription>
                  Track sent invitations and signup progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                {invitations ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Invited By</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sent Date</TableHead>
                        <TableHead>Expires</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invitations.map((invitation: any) => (
                        <TableRow key={invitation.id}>
                          <TableCell className="font-medium">{invitation.email}</TableCell>
                          <TableCell>{invitation.invitedByName}</TableCell>
                          <TableCell>
                            <Badge variant={
                              invitation.status === 'accepted' ? 'default' :
                              invitation.status === 'expired' ? 'destructive' : 'secondary'
                            }>
                              {invitation.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(invitation.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>{new Date(invitation.expiresAt).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-4">Loading invitations...</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Signup Analytics</CardTitle>
                <CardDescription>
                  Track partner signup funnel and conversion rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analytics ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {analytics.filter((a: any) => a.event === 'invitation_sent').length}
                        </div>
                        <div className="text-sm text-blue-600">Invitations Sent</div>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">
                          {analytics.filter((a: any) => a.event === 'invitation_clicked').length}
                        </div>
                        <div className="text-sm text-yellow-600">Clicks</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {analytics.filter((a: any) => a.event === 'signup_completed').length}
                        </div>
                        <div className="text-sm text-green-600">Signups</div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {analytics.filter((a: any) => a.event === 'organization_created').length}
                        </div>
                        <div className="text-sm text-purple-600">Organizations</div>
                      </div>
                    </div>
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Event</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Timestamp</TableHead>
                          <TableHead>Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analytics.slice(0, 10).map((event: any) => (
                          <TableRow key={event.id}>
                            <TableCell>
                              <Badge variant="outline">
                                {event.event.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell>{event.email || 'N/A'}</TableCell>
                            <TableCell>{new Date(event.timestamp).toLocaleString()}</TableCell>
                            <TableCell className="text-xs text-gray-500">
                              {event.metadata ? JSON.stringify(event.metadata).slice(0, 50) + '...' : 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-4">Loading analytics...</div>
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
                        <TableHead>Partner Org</TableHead>
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
                          <TableCell>
                            {assessment.customerName || assessment.customerCompany || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {assessment.userFirstName && assessment.userLastName 
                              ? `${assessment.userFirstName} ${assessment.userLastName}`
                              : assessment.userEmail || 'N/A'
                            }
                          </TableCell>
                          <TableCell>{assessment.organizationName || 'N/A'}</TableCell>
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
                        <TableHead>Sales Executive</TableHead>
                        <TableHead>Partner Org</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotes?.slice(0, 10).map((quote) => (
                        <TableRow key={quote.id}>
                          <TableCell>{quote.quoteNumber}</TableCell>
                          <TableCell>
                            {quote.customerName || quote.customerCompany || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {quote.userFirstName && quote.userLastName 
                              ? `${quote.userFirstName} ${quote.userLastName}`
                              : quote.userEmail || 'N/A'
                            }
                          </TableCell>
                          <TableCell>{quote.organizationName || 'N/A'}</TableCell>
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