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
    if (!authLoading && isAuthenticated && !(user as any)?.isSystemAdmin && (user as any)?.role !== 'admin') {
      window.location.href = '/dashboard';
    }
  }, [authLoading, isAuthenticated, user]);

  // Admin stats query
  const { data: adminStats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: (user as any)?.isSystemAdmin || (user as any)?.role === 'admin',
    staleTime: 0,
    refetchOnMount: true,
  });

  // Partners query  
  const { data: partners, isLoading: partnersLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/partners"],
    enabled: (user as any)?.isSystemAdmin || (user as any)?.role === 'admin',
    staleTime: 0,
    refetchOnMount: true,
  });

  // Quotes query with joined assessment data
  const { data: quotes, isLoading: quotesLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/quotes"],
    enabled: (user as any)?.isSystemAdmin || (user as any)?.role === 'admin',
    staleTime: 0,
    refetchOnMount: true,
  });

  // Organizations query
  const { data: organizations, isLoading: orgsLoading } = useQuery<Organization[]>({
    queryKey: ["/api/admin/organizations"],
    enabled: (user as any)?.isSystemAdmin || (user as any)?.role === 'admin',
    staleTime: 0,
    refetchOnMount: true,
  });

  // Users query for role management
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: (user as any)?.isSystemAdmin || (user as any)?.role === 'admin',
    staleTime: 0,
    refetchOnMount: true,
  });

  // HubSpot test query
  const { data: hubspotStatus, isLoading: hubspotLoading } = useQuery({
    queryKey: ["/api/admin/hubspot/test"],
    enabled: (user as any)?.isSystemAdmin || (user as any)?.role === 'admin',
    staleTime: 0,
    refetchOnMount: true,
  });

  // Invitations query
  const { data: invitations, isLoading: invitationsLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/invitations"],
    enabled: (user as any)?.isSystemAdmin || (user as any)?.role === 'admin',
    staleTime: 0,
    refetchOnMount: true,
  });

  // State for invitation form
  const [invitationEmail, setInvitationEmail] = useState("");
  const [invitationName, setInvitationName] = useState("");
  const [invitationCompany, setInvitationCompany] = useState("");

  // Handle quote details view with full assessment data
  const handleViewQuoteDetails = async (quote: any) => {
    try {
      const response = await fetch(`/api/admin/quotes/${quote.id}/details`);
      if (!response.ok) {
        throw new Error(`Failed to fetch quote details: ${response.status}`);
      }
      const quoteWithAssessment = await response.json();
      console.log('Quote details loaded:', quoteWithAssessment);
      setSelectedQuoteData(quoteWithAssessment);
      setSelectedQuote(quote);
    } catch (error) {
      console.error('Error loading quote details:', error);
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

  // Partner status update mutation
  const updatePartnerStatusMutation = useMutation({
    mutationFn: async ({ partnerId, status }: { partnerId: string; status: string }) => {
      const response = await fetch(`/api/admin/partners/${partnerId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update partner status');
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      const statusText = variables.status === 'approved' ? 'Approved' : 
                        variables.status === 'suspended' ? 'Suspended' : 
                        'Updated';
      toast({
        title: `Partner ${statusText}`,
        description: `Partner status has been updated to ${variables.status}.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update partner status. Please try again.",
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
    const signupLink = `${window.location.origin}/api/login`;
    try {
      await navigator.clipboard.writeText(signupLink);
      toast({
        title: "Link Copied",
        description: "General signup link has been copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  // Send email invitation mutation
  const sendInvitationMutation = useMutation({
    mutationFn: async ({ email, recipientName, companyName }: { email: string; recipientName?: string; companyName?: string }) => {
      const response = await fetch('/api/admin/send-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, recipientName, companyName }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send invitation');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invitations"] });
      toast({
        title: "Invitation Sent",
        description: "Partner invitation has been sent successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Invitation Failed",
        description: error.message || "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
    },
  });

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

  if (authLoading || (!(user as any)?.isSystemAdmin && (user as any)?.role !== 'admin')) {
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
                    Copy General Signup Link
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
                          <TableCell className="font-medium">
                            {partner.firstName ? `${partner.firstName} ${partner.lastName || ''}`.trim() : partner.email}
                          </TableCell>
                          <TableCell>{partner.email}</TableCell>
                          <TableCell>{partner.organization?.name || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={partner.organization?.partnerStatus === 'approved' ? 'default' : 
                                            partner.organization?.partnerStatus === 'pending' ? 'secondary' : 'destructive'}>
                              {partner.organization?.partnerStatus === 'approved' ? 'Approved' :
                               partner.organization?.partnerStatus === 'pending' ? 'Pending' :
                               partner.organization?.partnerStatus === 'suspended' ? 'Suspended' :
                               'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(partner.createdAt || Date.now()).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {partner.organization?.partnerStatus === 'pending' && (
                                <>
                                  <Button 
                                    size="sm" 
                                    onClick={() => approvePartnerMutation.mutate(partner.organization?.id)}
                                    disabled={approvePartnerMutation.isPending}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    onClick={() => rejectPartnerMutation.mutate(partner.organization?.id)}
                                    disabled={rejectPartnerMutation.isPending}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </>
                              )}
                              {partner.organization?.partnerStatus === 'approved' && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => updatePartnerStatusMutation.mutate({ 
                                    partnerId: partner.organization?.id, 
                                    status: 'suspended' 
                                  })}
                                  disabled={updatePartnerStatusMutation.isPending}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Suspend
                                </Button>
                              )}
                              {partner.organization?.partnerStatus === 'suspended' && (
                                <Button 
                                  size="sm" 
                                  variant="default"
                                  onClick={() => updatePartnerStatusMutation.mutate({ 
                                    partnerId: partner.organization?.id, 
                                    status: 'approved' 
                                  })}
                                  disabled={updatePartnerStatusMutation.isPending}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Reactivate
                                </Button>
                              )}
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
                          <TableCell className="font-medium">
                            {u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : u.email}
                          </TableCell>
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
                      <Badge variant={(hubspotStatus as any)?.success ? 'default' : 'destructive'}>
                        {(hubspotStatus as any)?.success ? 'Connected' : 'Error'}
                      </Badge>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {(hubspotStatus as any)?.success 
                          ? `Found ${(hubspotStatus as any)?.contactCount} contacts` 
                          : (hubspotStatus as any)?.error || 'Connection failed'}
                      </span>
                    </div>
                    
                    {(hubspotStatus as any)?.success && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                          <h4 className="font-medium text-green-800 dark:text-green-200">API Status</h4>
                          <p className="text-sm text-green-600 dark:text-green-300">Connected and responding</p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                          <h4 className="font-medium text-blue-800 dark:text-blue-200">Contact Count</h4>
                          <p className="text-sm text-blue-600 dark:text-blue-300">{(hubspotStatus as any)?.contactCount} contacts found</p>
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
                <CardTitle>Send Partner Invitation</CardTitle>
                <CardDescription>Invite new partners to join the platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="partner@company.com"
                      value={invitationEmail}
                      onChange={(e) => setInvitationEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Recipient Name</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={invitationName}
                      onChange={(e) => setInvitationName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company Name</Label>
                  <Input
                    id="company"
                    placeholder="Company Inc."
                    value={invitationCompany}
                    onChange={(e) => setInvitationCompany(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={() => {
                    if (invitationEmail) {
                      sendInvitationMutation.mutate({
                        email: invitationEmail,
                        recipientName: invitationName || undefined,
                        companyName: invitationCompany || undefined,
                      });
                      setInvitationEmail("");
                      setInvitationName("");
                      setInvitationCompany("");
                    }
                  }}
                  disabled={!invitationEmail || sendInvitationMutation.isPending}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sendInvitationMutation.isPending ? "Sending..." : "Send Invitation"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Invitation History</CardTitle>
                <CardDescription>Track sent invitations and their status</CardDescription>
              </CardHeader>
              <CardContent>
                {invitationsLoading ? (
                  <div className="text-center py-4">Loading invitations...</div>
                ) : invitations && invitations.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Invited By</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sent Date</TableHead>
                        <TableHead>Expires</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invitations.map((invitation) => (
                        <TableRow key={invitation.id}>
                          <TableCell className="font-medium">{invitation.email}</TableCell>
                          <TableCell>{invitation.recipientName || 'N/A'}</TableCell>
                          <TableCell>{invitation.invitedByName}</TableCell>
                          <TableCell>
                            <Badge variant={invitation.status === 'accepted' ? 'default' : 
                                          invitation.status === 'pending' ? 'secondary' : 'destructive'}>
                              {invitation.status || 'pending'}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(invitation.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>{new Date(invitation.expiresAt).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No invitations sent yet. Send your first invitation above.
                  </div>
                )}
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
                          <TableCell>{quote.customerCompany || quote.customerName || 'N/A'}</TableCell>
                          <TableCell>{quote.salesExecutiveName || 'N/A'}</TableCell>
                          <TableCell>{quote.organizationName || 'N/A'}</TableCell>
                          <TableCell>${parseFloat(quote.totalCost || 0).toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant={quote.status === 'approved' ? 'default' : 
                                           quote.status === 'pending' ? 'secondary' : 'destructive'}>
                              {quote.status || 'pending'}
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
                                onClick={() => {
                                  if (quote.pdfUrl) {
                                    const filename = quote.pdfUrl.split('/').pop();
                                    window.open(`/api/files/pdf/${filename}`, '_blank');
                                  }
                                }}
                                className="flex items-center gap-1"
                                disabled={!quote.pdfUrl}
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
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Sales Executive</h3>
                  <p><strong>Name:</strong> {selectedQuoteData?.assessment?.salesExecutiveName || 'N/A'}</p>
                  <p><strong>Email:</strong> {selectedQuoteData?.assessment?.salesExecutiveEmail || 'N/A'}</p>
                  <p><strong>Phone:</strong> {selectedQuoteData?.assessment?.salesExecutivePhone || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Customer Information</h3>
                  <p><strong>Name:</strong> {selectedQuoteData?.assessment?.customerContactName || 'N/A'}</p>
                  <p><strong>Company:</strong> {selectedQuoteData?.assessment?.customerCompanyName || 'N/A'}</p>
                  <p><strong>Email:</strong> {selectedQuoteData?.assessment?.customerEmail || 'N/A'}</p>
                  <p><strong>Phone:</strong> {selectedQuoteData?.assessment?.customerPhone || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Quote Summary</h3>
                  <p><strong>Quote Number:</strong> {selectedQuoteData?.quoteNumber}</p>
                  <p><strong>Service Type:</strong> <Badge variant="outline">{selectedQuoteData?.assessment?.serviceType?.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'N/A'}</Badge></p>
                  <p><strong>Total Cost:</strong> ${parseFloat(selectedQuoteData?.totalCost || 0).toFixed(2)}</p>
                  <p><strong>Status:</strong> <Badge variant={selectedQuoteData?.status === 'approved' ? 'default' : 'secondary'}>{selectedQuoteData?.status}</Badge></p>
                  <p><strong>Created:</strong> {new Date(selectedQuoteData?.createdAt || Date.now()).toLocaleString()}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Pricing Breakdown</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p>Survey Hours: {selectedQuoteData?.surveyHours || 0}</p>
                  <p>Survey Cost: ${parseFloat(selectedQuoteData?.surveyCost || 0).toFixed(2)}</p>
                  <p>Installation Hours: {selectedQuoteData?.installationHours || 0}</p>
                  <p>Installation Cost: ${parseFloat(selectedQuoteData?.installationCost || 0).toFixed(2)}</p>
                  <p>Configuration Hours: {selectedQuoteData?.configurationHours || 0}</p>
                  <p>Configuration Cost: ${parseFloat(selectedQuoteData?.configurationCost || 0).toFixed(2)}</p>
                  <p>Hardware Cost: ${parseFloat(selectedQuoteData?.hardwareCost || 0).toFixed(2)}</p>
                  <p>Labor Hold: ${parseFloat(selectedQuoteData?.laborHoldCost || 0).toFixed(2)}</p>
                  {selectedQuoteData?.removalCost && parseFloat(selectedQuoteData.removalCost) > 0 && (
                    <>
                      <p>Removal Hours: {selectedQuoteData.removalHours || 0}</p>
                      <p>Removal Cost: ${parseFloat(selectedQuoteData.removalCost).toFixed(2)}</p>
                    </>
                  )}
                </div>
              </div>

              {/* Infrastructure Requirements */}
              <div>
                <h3 className="font-semibold mb-3">Infrastructure Requirements</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedQuoteData?.assessment?.deviceCount && (
                    <p><strong>Device Count:</strong> {selectedQuoteData.assessment.deviceCount} devices</p>
                  )}
                  <p><strong>Power Available:</strong> {selectedQuoteData?.assessment?.powerAvailable ? 'Yes' : 'No'}</p>
                  <p><strong>Ethernet Required:</strong> {selectedQuoteData?.assessment?.ethernetRequired ? 'Yes' : 'No'}</p>
                  <p><strong>Device Connection Assistance:</strong> {
                    selectedQuoteData?.assessment?.deviceConnectionAssistance === 'yes' ? 'Required' : 
                    selectedQuoteData?.assessment?.deviceConnectionAssistance === 'no' ? 'Not Required' : 'Not specified'
                  }</p>
                  {selectedQuoteData?.assessment?.routerMake && (
                    <p><strong>Router:</strong> {selectedQuoteData.assessment.routerMake} {selectedQuoteData.assessment.routerModel}</p>
                  )}
                  {selectedQuoteData?.assessment?.routerCount && (
                    <p><strong>Router Count:</strong> {selectedQuoteData.assessment.routerCount}</p>
                  )}
                  {selectedQuoteData?.assessment?.routerLocation && (
                    <p><strong>Router Location:</strong> {selectedQuoteData.assessment.routerLocation}</p>
                  )}
                  {selectedQuoteData?.assessment?.cableFootage && (
                    <p><strong>Cable Footage:</strong> {selectedQuoteData.assessment.cableFootage}</p>
                  )}
                  {selectedQuoteData?.assessment?.antennaType && (
                    <p><strong>Antenna Type:</strong> {selectedQuoteData.assessment.antennaType}</p>
                  )}
                  {selectedQuoteData?.assessment?.antennaInstallationLocation && (
                    <p><strong>Antenna Location:</strong> {selectedQuoteData.assessment.antennaInstallationLocation}</p>
                  )}
                  {selectedQuoteData?.assessment?.routerMounting && (
                    <p><strong>Router Mounting:</strong> {selectedQuoteData.assessment.routerMounting}</p>
                  )}
                  {selectedQuoteData?.assessment?.dualWanSupport && (
                    <p><strong>Dual WAN Support:</strong> {selectedQuoteData.assessment.dualWanSupport}</p>
                  )}
                </div>
              </div>

              {/* Site Characteristics */}
              <div>
                <h3 className="font-semibold mb-3">Site Characteristics</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <p><strong>Address:</strong> {selectedQuoteData?.assessment?.siteAddress || 'N/A'}</p>
                  <p><strong>Industry:</strong> {selectedQuoteData?.assessment?.industry || 'N/A'}</p>
                  {selectedQuoteData?.assessment?.buildingType && (
                    <p><strong>Building Type:</strong> {selectedQuoteData.assessment.buildingType}</p>
                  )}
                  {selectedQuoteData?.assessment?.coverageArea && (
                    <p><strong>Coverage Area:</strong> {selectedQuoteData.assessment.coverageArea.toLocaleString()} sq ft</p>
                  )}
                  {selectedQuoteData?.assessment?.floors && (
                    <p><strong>Number of Floors:</strong> {selectedQuoteData.assessment.floors}</p>
                  )}
                  <p><strong>Ceiling Mount:</strong> {selectedQuoteData?.assessment?.ceilingMount ? 'Yes' : 'No'}</p>
                  <p><strong>Outdoor Coverage:</strong> {selectedQuoteData?.assessment?.outdoorCoverage ? 'Required' : 'Not Required'}</p>
                  {selectedQuoteData?.assessment?.ceilingHeight && (
                    <p><strong>Ceiling Height:</strong> {selectedQuoteData.assessment.ceilingHeight}</p>
                  )}
                  {selectedQuoteData?.assessment?.ceilingType && (
                    <p><strong>Ceiling Type:</strong> {selectedQuoteData.assessment.ceilingType}</p>
                  )}
                  {selectedQuoteData?.assessment?.networkSignal && (
                    <p><strong>Network Signal:</strong> {selectedQuoteData.assessment.networkSignal}</p>
                  )}
                  {selectedQuoteData?.assessment?.signalStrength && (
                    <p><strong>Signal Strength:</strong> {selectedQuoteData.assessment.signalStrength}</p>
                  )}
                  {selectedQuoteData?.assessment?.connectionUsage && (
                    <p><strong>Connection Usage:</strong> {selectedQuoteData.assessment.connectionUsage}</p>
                  )}
                </div>
              </div>

              {/* Environmental Factors & Notes */}
              {(selectedQuoteData?.assessment?.interferenceSources || selectedQuoteData?.assessment?.specialRequirements || selectedQuoteData?.assessment?.additionalNotes) && (
                <div>
                  <h3 className="font-semibold mb-3">Environmental Factors & Special Requirements</h3>
                  <div className="space-y-3 text-sm">
                    {selectedQuoteData?.assessment?.interferenceSources && (
                      <div>
                        <p><strong>Interference Sources:</strong></p>
                        <p className="mt-1 text-gray-600 leading-relaxed">{selectedQuoteData.assessment.interferenceSources}</p>
                      </div>
                    )}
                    {selectedQuoteData?.assessment?.specialRequirements && (
                      <div>
                        <p><strong>Special Requirements:</strong></p>
                        <p className="mt-1 text-gray-600 leading-relaxed">{selectedQuoteData.assessment.specialRequirements}</p>
                      </div>
                    )}
                    {selectedQuoteData?.assessment?.additionalNotes && (
                      <div>
                        <p><strong>Additional Notes:</strong></p>
                        <p className="mt-1 text-gray-600 leading-relaxed">{selectedQuoteData.assessment.additionalNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Fleet-specific details if applicable */}
              {selectedQuoteData?.assessment?.serviceType === 'fleet-tracking' && (
                <div>
                  <h3 className="font-semibold mb-3">Fleet Tracking Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedQuoteData?.assessment?.totalFleetSize && (
                      <p><strong>Total Fleet Size:</strong> {selectedQuoteData.assessment.totalFleetSize} vehicles</p>
                    )}
                    {selectedQuoteData?.assessment?.trackerType && (
                      <p><strong>Tracker Type:</strong> {selectedQuoteData.assessment.trackerType}</p>
                    )}
                    {selectedQuoteData?.assessment?.iotTrackingPartner && (
                      <p><strong>IoT Partner:</strong> {selectedQuoteData.assessment.iotTrackingPartner}</p>
                    )}
                    {selectedQuoteData?.assessment?.carrierSim && (
                      <p><strong>Carrier SIM:</strong> {selectedQuoteData.assessment.carrierSim}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Fleet Camera specific details if applicable */}
              {selectedQuoteData?.assessment?.serviceType === 'fleet-camera' && (
                <div>
                  <h3 className="font-semibold mb-3">Fleet Camera Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedQuoteData?.assessment?.cameraSolutionType && (
                      <p><strong>Camera Solution:</strong> {selectedQuoteData.assessment.cameraSolutionType}</p>
                    )}
                    {selectedQuoteData?.assessment?.numberOfCameras && (
                      <p><strong>Number of Cameras:</strong> {selectedQuoteData.assessment.numberOfCameras}</p>
                    )}
                    {selectedQuoteData?.assessment?.removalNeeded && (
                      <p><strong>Removal Needed:</strong> {selectedQuoteData.assessment.removalNeeded}</p>
                    )}
                    {selectedQuoteData?.assessment?.existingCameraSolution && (
                      <p><strong>Existing Solution:</strong> {selectedQuoteData.assessment.existingCameraSolution}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex gap-2">
            {selectedQuoteData?.pdfUrl && (
              <Button 
                variant="outline"
                onClick={() => {
                  if (selectedQuoteData.pdfUrl) {
                    const filename = selectedQuoteData.pdfUrl.split('/').pop();
                    window.open(`/api/files/pdf/${filename}`, '_blank');
                  }
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={() => closeQuoteMutation.mutate(selectedQuoteData?.id)}
              disabled={closeQuoteMutation.isPending}
            >
              Close Quote
            </Button>
            <Button
              variant="outline"
              onClick={() => deleteQuoteMutation.mutate(selectedQuoteData?.id)}
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
    </div>
  );
}