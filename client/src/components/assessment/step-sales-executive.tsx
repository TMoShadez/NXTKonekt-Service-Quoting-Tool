import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Assessment } from "@shared/schema";

interface StepSalesExecutiveProps {
  data: Partial<Assessment>;
  onChange: (data: Partial<Assessment>) => void;
}

export function StepSalesExecutive({ data, onChange }: StepSalesExecutiveProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [organizationName, setOrganizationName] = useState('');
  const [showCreateOrg, setShowCreateOrg] = useState(false);

  // Fetch existing organization
  const { data: organization } = useQuery({
    queryKey: ["/api/organizations/my"],
    retry: false,
  }) as { data: any };

  // Create organization mutation
  const createOrgMutation = useMutation({
    mutationFn: async (orgData: { name: string; partnerOrganization?: string; phone?: string }) => {
      const response = await apiRequest("POST", "/api/organizations", orgData);
      return await response.json();
    },
    onSuccess: (newOrg: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations/my"] });
      onChange({ organizationId: newOrg.id });
      setShowCreateOrg(false);
      toast({
        title: "Success",
        description: "Organization created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create organization",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (organization && organization.id) {
      onChange({ organizationId: organization.id });
      setOrganizationName(organization.name || '');
    }
  }, [organization, onChange]);

  const handleChange = (field: keyof Assessment, value: string | number) => {
    onChange({ [field]: value });
  };

  const handleCreateOrganization = () => {
    if (!organizationName.trim()) {
      toast({
        title: "Error",
        description: "Please enter an organization name",
        variant: "destructive",
      });
      return;
    }

    createOrgMutation.mutate({
      name: organizationName.trim(),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold nxt-gray-800">
          Sales Executive Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="text-sm font-medium nxt-gray-800 mb-2">
              Sales Executive Name
            </Label>
            <Input
              type="text"
              placeholder="Enter your name"
              value={data.salesExecutiveName || ''}
              onChange={(e) => handleChange('salesExecutiveName', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nxt-blue focus:border-nxt-blue"
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium nxt-gray-800 mb-2">
              Email Address
            </Label>
            <Input
              type="email"
              placeholder="Enter email address"
              value={data.salesExecutiveEmail || ''}
              onChange={(e) => handleChange('salesExecutiveEmail', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nxt-blue focus:border-nxt-blue"
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium nxt-gray-800 mb-2">
              Phone Number
            </Label>
            <Input
              type="tel"
              placeholder="Enter phone number"
              value={data.salesExecutivePhone || ''}
              onChange={(e) => handleChange('salesExecutivePhone', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nxt-blue focus:border-nxt-blue"
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium nxt-gray-800 mb-2">
              Organization Name
            </Label>
            {organization && organization.name ? (
              <div className="p-3 bg-nxt-gray-50 rounded-lg border">
                <span className="text-sm font-medium nxt-gray-800">{organization.name}</span>
                <p className="text-xs nxt-gray-500 mt-1">Organization already set up</p>
              </div>
            ) : (
              <div className="space-y-3">
                <Input
                  type="text"
                  placeholder="Enter organization name"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nxt-blue focus:border-nxt-blue"
                />
                <Button
                  type="button"
                  onClick={handleCreateOrganization}
                  disabled={createOrgMutation.isPending || !organizationName.trim()}
                  className="w-full bg-nxt-blue text-white hover:bg-blue-700"
                >
                  {createOrgMutation.isPending ? 'Creating...' : 'Create Organization'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
