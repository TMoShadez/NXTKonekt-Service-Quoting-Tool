import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
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
import { Shield, Users, FileText, BarChart3, CheckCircle, XCircle, Clock, Settings, Link, Copy, Mail, Send, TrendingUp, Eye, Trash2, Download, ExternalLink } from "lucide-react";
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
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);

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

  // No need for additional queries since admin dashboard already has all data

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

  // Handler functions for assessment downloads
  const handleDownloadAssessment = (assessmentId: number) => {
    downloadAssessmentMutation.mutate(assessmentId);
  };

  const handleBulkExport = () => {
    bulkExportMutation.mutate();
  };

  // Close quote mutation
  const closeQuoteMutation = useMutation({
    mutationFn: async (quoteId: number) => {
      await apiRequest(`/api/admin/quotes/${quoteId}/close`, {
        method: "PATCH",
        body: { status: "closed" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quotes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setSelectedQuote(null);
      toast({
        title: "Quote Closed",
        description: "Quote has been closed successfully.",
      });
    },
    onError: (error) => {
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
      await apiRequest(`/api/admin/quotes/${quoteId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quotes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setSelectedQuote(null);
      toast({
        title: "Quote Deleted",
        description: "Quote has been permanently deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete quote. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Individual assessment download mutation (PDF)
  const downloadAssessmentMutation = useMutation({
    mutationFn: async (assessmentId: number) => {
      const response = await fetch(`/api/admin/assessments/${assessmentId}/download`);
      if (!response.ok) {
        throw new Error('Failed to download assessment PDF');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `assessment-${assessmentId}-${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast({
        title: "Assessment Downloaded",
        description: "Complete assessment report has been downloaded as PDF.",
      });
    },
    onError: () => {
      toast({
        title: "Download Failed",
        description: "Failed to download assessment PDF.",
        variant: "destructive",
      });
    },
  });

  // Bulk assessment export mutation
  const bulkExportMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/assessments/export');
      if (!response.ok) {
        throw new Error('Failed to export assessments');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `all-assessments-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast({
        title: "Assessments Exported",
        description: "All assessment data has been exported to CSV successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Export Failed",
        description: "Failed to export assessment data.",
        variant: "destructive",
      });
    },
  });

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
            <TabsTrigger value="users">User Roles</TabsTrigger>
            <TabsTrigger value="hubspot">HubSpot</TabsTrigger>
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

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Role Management</CardTitle>
                <CardDescription>
                  Manage user roles and admin permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {partners ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Current Role</TableHead>
                        <TableHead>System Admin</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {partners.map((user: any) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.firstName} {user.lastName}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={user.role === 'admin' ? 'destructive' : 'default'}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.isSystemAdmin ? 'destructive' : 'secondary'}>
                              {user.isSystemAdmin ? 'Yes' : 'No'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.isActive ? "default" : "secondary"}>
                              {user.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Select
                                value={user.role}
                                onValueChange={(role) => {
                                  // Update user role
                                  fetch(`/api/admin/users/${user.id}/role`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ role })
                                  }).then(() => {
                                    queryClient.invalidateQueries({ queryKey: ["/api/admin/partners"] });
                                    toast({
                                      title: "Role Updated",
                                      description: `User role changed to ${role}`,
                                    });
                                  });
                                }}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="partner">Partner</SelectItem>
                                  <SelectItem value="sales_executive">Sales Executive</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              <Button
                                variant={user.isSystemAdmin ? "destructive" : "outline"}
                                size="sm"
                                onClick={() => {
                                  // Toggle system admin status
                                  fetch(`/api/admin/users/${user.id}/role`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ isSystemAdmin: !user.isSystemAdmin })
                                  }).then(() => {
                                    queryClient.invalidateQueries({ queryKey: ["/api/admin/partners"] });
                                    toast({
                                      title: "System Admin Updated",
                                      description: `User ${user.isSystemAdmin ? 'removed from' : 'added to'} system admin`,
                                    });
                                  });
                                }}
                              >
                                {user.isSystemAdmin ? "Remove Admin" : "Make Admin"}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-4">Loading users...</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hubspot" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg font-semibold">
                  <Settings className="mr-2" size={20} />
                  HubSpot CRM Integration
                </CardTitle>
                <CardDescription>
                  Test and manage HubSpot CRM connection for automated quote synchronization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        // Test HubSpot connection
                        fetch('/api/hubspot/test')
                          .then(res => res.json())
                          .then(data => {
                            toast({
                              title: data.connected ? "HubSpot Connected" : "HubSpot Connection Failed",
                              description: data.message,
                              variant: data.connected ? "default" : "destructive",
                            });
                          })
                          .catch(() => {
                            toast({
                              title: "HubSpot Test Failed",
                              description: "Failed to test HubSpot connection",
                              variant: "destructive",
                            });
                          });
                      }}
                      className="flex items-center"
                    >
                      <ExternalLink className="mr-2" size={16} />
                      Test HubSpot Connection
                    </Button>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <div className="flex items-center mb-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                      Quotes automatically sync to HubSpot when created. Quote approvals/rejections update deal status.
                    </div>
                    <div className="text-xs text-green-600 bg-green-50 p-3 rounded border">
                      <strong>✅ Working:</strong> Contacts, Deals, and Tickets create successfully.
                      <br/>
                      <strong>⚠️ Limited:</strong> Contact-Deal-Ticket associations may be skipped (missing associations scope), but individual records sync perfectly to HubSpot.
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Integration Status</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-sm font-medium text-blue-800">Contacts</div>
                        <div className="text-xs text-blue-600">Auto-created from assessments</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="text-sm font-medium text-green-800">Deals</div>
                        <div className="text-xs text-green-600">Created with quotes</div>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <div className="text-sm font-medium text-purple-800">Tickets</div>
                        <div className="text-xs text-purple-600">Follow-up tracking</div>
                      </div>
                    </div>
                  </div>
                </div>
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
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Assessment Management</CardTitle>
                    <CardDescription>
                      View assessment details and download comprehensive PDF reports with complete technical specifications
                    </CardDescription>
                  </div>
                  <Button
                    onClick={handleBulkExport}
                    disabled={bulkExportMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {bulkExportMutation.isPending ? "Exporting..." : "Export All to CSV"}
                  </Button>
                </div>
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
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assessments?.slice(0, 20).map((assessment) => (
                        <TableRow key={assessment.id}>
                          <TableCell>{assessment.id}</TableCell>
                          <TableCell className="capitalize">
                            {assessment.serviceType?.replace('-', ' ')}
                          </TableCell>
                          <TableCell>
                            {assessment.customerContactName || assessment.customerCompanyName || 'N/A'}
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
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedAssessment(assessment)}
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadAssessment(assessment.id)}
                                title="Download Complete Assessment Report (PDF)"
                                className="text-green-600 hover:text-green-700"
                              >
                                <Download className="h-4 w-4" />
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
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotes?.slice(0, 10).map((quote) => (
                        <TableRow key={quote.id}>
                          <TableCell>{quote.quoteNumber}</TableCell>
                          <TableCell>
                            {quote.customerContactName || quote.customerCompanyName || 'N/A'}
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
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedQuote(quote)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteQuoteMutation.mutate(quote.id)}
                                disabled={deleteQuoteMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quote Details - {selectedQuote?.quoteNumber}</DialogTitle>
            <DialogDescription>
              Complete quote information and management options
            </DialogDescription>
          </DialogHeader>
          {selectedQuote && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Customer Information</h3>
                  <p><strong>Name:</strong> {selectedQuote.customerName || 'N/A'}</p>
                  <p><strong>Company:</strong> {selectedQuote.customerCompany || 'N/A'}</p>
                  <p><strong>Email:</strong> {selectedQuote.customerEmail || 'N/A'}</p>
                  <p><strong>Phone:</strong> {selectedQuote.customerPhone || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Quote Summary</h3>
                  <p><strong>Quote Number:</strong> {selectedQuote.quoteNumber || 'N/A'}</p>
                  <p><strong>Service Type:</strong> <Badge variant="outline">{selectedQuote.serviceType?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}</Badge></p>
                  <p><strong>Total Cost:</strong> ${selectedQuote.totalCost || 0}</p>
                  <p><strong>Status:</strong> <Badge variant={selectedQuote.status === 'approved' ? 'default' : 'secondary'}>{selectedQuote.status || 'N/A'}</Badge></p>
                  <p><strong>Created:</strong> {new Date(selectedQuote.createdAt || Date.now()).toLocaleString()}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Pricing Breakdown</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p>Survey Hours: {selectedQuote.surveyHours || 0}</p>
                  <p>Survey Cost: ${selectedQuote.surveyCost || 0}</p>
                  <p>Installation Hours: {selectedQuote.installationHours || 0}</p>
                  <p>Installation Cost: ${selectedQuote.installationCost || 0}</p>
                  <p>Configuration Hours: {selectedQuote.configurationHours || 0}</p>
                  <p>Configuration Cost: ${selectedQuote.configurationCost || 0}</p>
                  <p>Hardware Cost: ${selectedQuote.hardwareCost || 0}</p>
                  <p>Labor Hold: ${selectedQuote.laborHoldCost || 0}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Sales Executive Information</h3>
                <p><strong>Name:</strong> {selectedQuote.userFirstName && selectedQuote.userLastName ? `${selectedQuote.userFirstName} ${selectedQuote.userLastName}` : selectedQuote.userEmail || 'N/A'}</p>
                <p><strong>Email:</strong> {selectedQuote.userEmail || 'N/A'}</p>
                <p><strong>Organization:</strong> {selectedQuote.organizationName || 'N/A'}</p>
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assessment Details Modal */}
      <Dialog open={!!selectedAssessment} onOpenChange={() => setSelectedAssessment(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Assessment Details - #{selectedAssessment?.id}
              <Badge variant="outline" className="ml-2">
                {selectedAssessment?.serviceType?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Complete assessment questions and answers for HubSpot service ticket creation
            </DialogDescription>
          </DialogHeader>
          {selectedAssessment && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-6">
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 text-blue-600">Customer Information</h3>
                  <div className="space-y-2">
                    <p><strong>Name:</strong> {selectedAssessment.customerContactName || 'N/A'}</p>
                    <p><strong>Company:</strong> {selectedAssessment.customerCompanyName || 'N/A'}</p>
                    <p><strong>Email:</strong> {selectedAssessment.customerEmail || 'N/A'}</p>
                    <p><strong>Phone:</strong> {selectedAssessment.customerPhone || 'N/A'}</p>
                    <p><strong>Site Address:</strong> {selectedAssessment.siteAddress || 'N/A'}</p>
                    <p><strong>Industry:</strong> {selectedAssessment.industry || 'N/A'}</p>
                    <p><strong>Preferred Installation Date:</strong> {selectedAssessment.preferredInstallationDate || 'N/A'}</p>
                  </div>
                </Card>
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 text-green-600">Sales Executive & Assessment</h3>
                  <div className="space-y-2">
                    <p><strong>Sales Executive:</strong> {selectedAssessment.salesExecutiveName || 'N/A'}</p>
                    <p><strong>Executive Email:</strong> {selectedAssessment.salesExecutiveEmail || 'N/A'}</p>
                    <p><strong>Executive Phone:</strong> {selectedAssessment.salesExecutivePhone || 'N/A'}</p>
                    <p><strong>Organization:</strong> {selectedAssessment.organizationName || 'N/A'}</p>
                    <p><strong>Assessment ID:</strong> #{selectedAssessment.id}</p>
                    <p><strong>Created:</strong> {new Date(selectedAssessment.createdAt || Date.now()).toLocaleDateString()}</p>
                    <p><strong>Total Cost:</strong> ${selectedAssessment.totalCost || 0}</p>
                  </div>
                </Card>
              </div>

              {/* Service-Specific Questions */}
              {selectedAssessment.serviceType === 'fixed-wireless' && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-4 text-purple-600 flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Fixed Wireless Assessment Questions
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-700">Infrastructure Requirements</h4>
                      <div className="space-y-2 text-sm">
                        <p><strong>Network Signal:</strong> {selectedAssessment.networkSignal || 'Not specified'}</p>
                        <p><strong>Signal Strength:</strong> {selectedAssessment.signalStrength || 'Not specified'}</p>
                        <p><strong>Connection Usage:</strong> {selectedAssessment.connectionUsage || 'Not specified'}</p>
                        <p><strong>Router Location:</strong> {selectedAssessment.routerLocation || 'Not specified'}</p>
                        <p><strong>Antenna Cable Required:</strong> {selectedAssessment.antennaCable ? 'Yes' : 'No'}</p>
                        <p><strong>Low Signal Antenna Cable:</strong> {selectedAssessment.lowSignalAntennaCable ? 'Yes' : 'No'}</p>
                        <p><strong>Device Connection Assistance:</strong> {selectedAssessment.deviceConnectionAssistance ? 'Yes' : 'No'}</p>
                        <p><strong>Router Make:</strong> {selectedAssessment.routerMake || 'Not specified'}</p>
                        <p><strong>Router Model:</strong> {selectedAssessment.routerModel || 'Not specified'}</p>
                        <p><strong>Number of Routers:</strong> {selectedAssessment.routerCount || 'Not specified'}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-700">Site Characteristics</h4>
                      <div className="space-y-2 text-sm">
                        <p><strong>Building Type:</strong> {selectedAssessment.buildingType || 'Not specified'}</p>
                        <p><strong>Coverage Area:</strong> {selectedAssessment.coverageArea || 'Not specified'}</p>
                        <p><strong>Floors:</strong> {selectedAssessment.floors || 'Not specified'}</p>
                        <p><strong>Device Count:</strong> {selectedAssessment.deviceCount || 'Not specified'}</p>
                        <p><strong>Ceiling Height:</strong> {selectedAssessment.ceilingHeight || 'Not specified'}</p>
                        <p><strong>Ceiling Type:</strong> {selectedAssessment.ceilingType || 'Not specified'}</p>
                        <p><strong>Cable Footage:</strong> {selectedAssessment.cableFootage || 'Not specified'}</p>
                        <p><strong>Antenna Type:</strong> {selectedAssessment.antennaType || 'Not specified'}</p>
                        <p><strong>Antenna Location:</strong> {selectedAssessment.antennaInstallationLocation || 'Not specified'}</p>
                        <p><strong>Router Mounting:</strong> {selectedAssessment.routerMounting || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-medium text-gray-700 mb-2">Environmental Factors</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <p><strong>Power Available:</strong> {selectedAssessment.powerAvailable ? 'Yes' : 'No'}</p>
                      <p><strong>Ethernet Required:</strong> {selectedAssessment.ethernetRequired ? 'Yes' : 'No'}</p>
                      <p><strong>Ceiling Mount:</strong> {selectedAssessment.ceilingMount ? 'Yes' : 'No'}</p>
                      <p><strong>Outdoor Coverage:</strong> {selectedAssessment.outdoorCoverage ? 'Yes' : 'No'}</p>
                      <p><strong>Dual WAN Support:</strong> {selectedAssessment.dualWanSupport ? 'Yes' : 'No'}</p>
                    </div>
                    {(selectedAssessment.interferenceSources || selectedAssessment.specialRequirements) && (
                      <div className="mt-3 space-y-2">
                        {selectedAssessment.interferenceSources && (
                          <p><strong>Interference Sources:</strong> {selectedAssessment.interferenceSources}</p>
                        )}
                        {selectedAssessment.specialRequirements && (
                          <p><strong>Special Requirements:</strong> {selectedAssessment.specialRequirements}</p>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {selectedAssessment.serviceType === 'fleet-tracking' && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-4 text-orange-600 flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Fleet Tracking Assessment Questions
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-700">Fleet Information</h4>
                      <div className="space-y-2 text-sm">
                        <p><strong>Billing Address:</strong> {selectedAssessment.billingAddress || 'Not specified'}</p>
                        <p><strong>Installation Site Address:</strong> {selectedAssessment.installationSiteAddress || 'Not specified'}</p>
                        <p><strong>Number of Vehicles for Installation:</strong> {selectedAssessment.vehicleCount || 'Not specified'}</p>
                        <p><strong>Total Fleet Size:</strong> {selectedAssessment.totalFleetSize || 'Not specified'}</p>
                        <p><strong>Installation Type:</strong> {selectedAssessment.installationType || 'Not specified'}</p>
                        <p><strong>Tracker Type:</strong> {selectedAssessment.trackerType || 'Not specified'}</p>
                        <p><strong>IoT Tracking Partner:</strong> {selectedAssessment.iotTrackingPartner || 'Not specified'}</p>
                        <p><strong>Carrier SIM:</strong> {selectedAssessment.carrierSim || 'Not specified'}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-700">Vehicle Details</h4>
                      <div className="space-y-2 text-sm">
                        {selectedAssessment.vehicleDetails ? (
                          <div className="space-y-2">
                            {JSON.parse(selectedAssessment.vehicleDetails).map((vehicle: any, index: number) => (
                              <div key={index} className="bg-gray-50 p-2 rounded">
                                <p><strong>Vehicle {index + 1}:</strong> {vehicle.year || 'N/A'} {vehicle.make || 'N/A'} {vehicle.model || 'N/A'}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          selectedAssessment.vehicleYear || selectedAssessment.vehicleMake || selectedAssessment.vehicleModel ? (
                            <div className="bg-gray-50 p-2 rounded">
                              <p><strong>Vehicle:</strong> {selectedAssessment.vehicleYear || 'N/A'} {selectedAssessment.vehicleMake || 'N/A'} {selectedAssessment.vehicleModel || 'N/A'}</p>
                            </div>
                          ) : (
                            <p>No vehicle details specified</p>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {selectedAssessment.serviceType === 'fleet-camera' && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-4 text-red-600 flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Fleet Camera Assessment Questions
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-700">Camera Solution Details</h4>
                      <div className="space-y-2 text-sm">
                        <p><strong>Billing Address:</strong> {selectedAssessment.billingAddress || 'Not specified'}</p>
                        <p><strong>Installation Site Address:</strong> {selectedAssessment.installationSiteAddress || 'Not specified'}</p>
                        <p><strong>Number of Vehicles for Installation:</strong> {selectedAssessment.vehicleCount || 'Not specified'}</p>
                        <p><strong>Total Fleet Size:</strong> {selectedAssessment.totalFleetSize || 'Not specified'}</p>
                        <p><strong>Camera Solution Type:</strong> {selectedAssessment.cameraSolutionType || 'Not specified'}</p>
                        <p><strong>Number of Cameras:</strong> {selectedAssessment.numberOfCameras || 'Not specified'}</p>
                        <p><strong>Tracking Partner:</strong> {selectedAssessment.iotTrackingPartner || 'Not specified'}</p>
                        <p><strong>Carrier SIM:</strong> {selectedAssessment.carrierSim || 'Not specified'}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-700">Installation & Removal</h4>
                      <div className="space-y-2 text-sm">
                        <p><strong>Removal of existing solution needed:</strong> {selectedAssessment.removalNeeded ? 'Yes' : 'No'}</p>
                        {selectedAssessment.removalNeeded && (
                          <>
                            <p><strong>Existing Camera Solution:</strong> {selectedAssessment.existingCameraSolution || 'Not specified'}</p>
                            {selectedAssessment.otherSolutionDetails && (
                              <p><strong>Other Solution Details:</strong> {selectedAssessment.otherSolutionDetails}</p>
                            )}
                            <p><strong>Removal Vehicle Count:</strong> {selectedAssessment.removalVehicleCount || 'Not specified'}</p>
                          </>
                        )}
                        <p><strong>Protective Wiring Harness:</strong> {selectedAssessment.protectiveWiringHarness ? 'Yes' : 'No'}</p>
                      </div>
                      
                      <h4 className="font-medium text-gray-700 mt-4">Vehicle Details</h4>
                      <div className="space-y-2 text-sm">
                        {selectedAssessment.vehicleDetails ? (
                          <div className="space-y-2">
                            {JSON.parse(selectedAssessment.vehicleDetails).map((vehicle: any, index: number) => (
                              <div key={index} className="bg-gray-50 p-2 rounded">
                                <p><strong>Vehicle {index + 1}:</strong> {vehicle.year || 'N/A'} {vehicle.make || 'N/A'} {vehicle.model || 'N/A'}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          selectedAssessment.vehicleYear || selectedAssessment.vehicleMake || selectedAssessment.vehicleModel ? (
                            <div className="bg-gray-50 p-2 rounded">
                              <p><strong>Vehicle:</strong> {selectedAssessment.vehicleYear || 'N/A'} {selectedAssessment.vehicleMake || 'N/A'} {selectedAssessment.vehicleModel || 'N/A'}</p>
                            </div>
                          ) : (
                            <p>No vehicle details specified</p>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* HubSpot Integration Helper */}
              <Card className="p-4 bg-blue-50 border-blue-200">
                <h3 className="font-semibold mb-3 text-blue-700 flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  HubSpot Service Ticket Information
                </h3>
                <div className="space-y-2 text-sm text-blue-800">
                  <p>Use the detailed information above to create comprehensive HubSpot service tickets. All technical specifications and customer requirements are captured in the assessment responses.</p>
                  <div className="bg-blue-100 p-3 rounded mt-2">
                    <p><strong>Service Type:</strong> {selectedAssessment.serviceType?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                    <p><strong>Assessment ID:</strong> #{selectedAssessment.id} (for reference)</p>
                    <p><strong>Customer Contact:</strong> {selectedAssessment.customerContactName} ({selectedAssessment.customerEmail})</p>
                    <p><strong>Total Project Value:</strong> ${selectedAssessment.totalCost}</p>
                  </div>
                </div>
              </Card>
            </div>
          )}
          <DialogFooter className="flex justify-between">
            <Button 
              variant="outline"
              onClick={() => handleDownloadAssessment(selectedAssessment?.id)}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download PDF Report
            </Button>
            <Button variant="secondary" onClick={() => setSelectedAssessment(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}