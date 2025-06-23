import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, CheckCircle, Truck } from "lucide-react";
import type { Assessment } from "@shared/schema";
import { StepCustomerInfo } from "@/components/assessment/step-customer-info";
import { StepQuoteGeneration } from "@/components/assessment/step-quote-generation";

export default function FleetTrackingForm() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  const [formData, setFormData] = useState<Partial<Assessment>>({});

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
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
  }, [isAuthenticated, authLoading, toast]);

  const { data: assessment, isLoading } = useQuery({
    queryKey: [`/api/assessments/${id}`],
    enabled: !!id && isAuthenticated,
    retry: false,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Assessment>) => {
      const response = await apiRequest("PUT", `/api/assessments/${id}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/assessments/${id}`] });
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
        description: "Failed to save assessment data",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (assessment) {
      setFormData(assessment);
    }
  }, [assessment]);

  const handleInputChange = (field: keyof Assessment, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleInputBlur = () => {
    if (assessment?.id && !updateMutation.isPending) {
      updateMutation.mutate(formData);
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    toast({
      title: "Success",
      description: "Fleet tracking device assessment completed successfully!",
    });
    navigate("/");
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-nxt-gray-50">
        <div className="text-center">
          <Truck className="mx-auto h-12 w-12 text-nxt-blue mb-4" />
          <p className="nxt-gray-500">Loading fleet tracking assessment...</p>
        </div>
      </div>
    );
  }

  const progress = (currentStep / totalSteps) * 100;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepCustomerInfo 
            data={formData}
            onChange={(data) => {
              const updatedData = { ...formData, ...data };
              setFormData(updatedData);
              if (assessment?.id) {
                updateMutation.mutate(updatedData);
              }
            }}
          />
        );
      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Truck className="h-6 w-6 text-nxt-blue" />
                Fleet Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium nxt-gray-800 mb-2">
                    Fleet Size
                  </Label>
                  <Input
                    type="number"
                    value={formData.deviceCount || ''}
                    onChange={(e) => handleInputChange('deviceCount', e.target.value)}
                    onBlur={(e) => {
                      const numValue = e.target.value ? parseInt(e.target.value) : null;
                      handleInputChange('deviceCount', numValue);
                      handleInputBlur();
                    }}
                    placeholder="Number of vehicles"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nxt-blue focus:border-nxt-blue"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium nxt-gray-800 mb-2">
                    Vehicle Types
                  </Label>
                  <Select
                    value={formData.buildingType || ''}
                    onValueChange={(value) => {
                      handleInputChange('buildingType', value);
                      handleInputBlur();
                    }}
                  >
                    <SelectTrigger className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nxt-blue focus:border-nxt-blue">
                      <SelectValue placeholder="Select vehicle types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light-duty">Light Duty Vehicles</SelectItem>
                      <SelectItem value="medium-duty">Medium Duty Trucks</SelectItem>
                      <SelectItem value="heavy-duty">Heavy Duty Trucks</SelectItem>
                      <SelectItem value="mixed-fleet">Mixed Fleet</SelectItem>
                      <SelectItem value="specialized">Specialized Vehicles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium nxt-gray-800 mb-2">
                    Operating Hours
                  </Label>
                  <Select
                    value={formData.industry || ''}
                    onValueChange={(value) => {
                      handleInputChange('industry', value);
                      handleInputBlur();
                    }}
                  >
                    <SelectTrigger className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nxt-blue focus:border-nxt-blue">
                      <SelectValue placeholder="Select operating schedule" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="business-hours">Business Hours (8-5)</SelectItem>
                      <SelectItem value="extended-hours">Extended Hours (6-8)</SelectItem>
                      <SelectItem value="24-7">24/7 Operations</SelectItem>
                      <SelectItem value="seasonal">Seasonal Operations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium nxt-gray-800 mb-2">
                    Coverage Area
                  </Label>
                  <Input
                    value={formData.siteAddress || ''}
                    onChange={(e) => handleInputChange('siteAddress', e.target.value)}
                    onBlur={handleInputBlur}
                    placeholder="Geographic coverage area"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nxt-blue focus:border-nxt-blue"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium nxt-gray-800 mb-2">
                  Special Requirements
                </Label>
                <Textarea
                  value={formData.specialRequirements || ''}
                  onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
                  onBlur={handleInputBlur}
                  placeholder="Any specific tracking requirements or compliance needs..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nxt-blue focus:border-nxt-blue"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Tracking Features Required</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="real-time"
                      checked={formData.powerAvailable || false}
                      onCheckedChange={(checked) => {
                        handleInputChange('powerAvailable', checked);
                        handleInputBlur();
                      }}
                    />
                    <Label htmlFor="real-time">Real-time GPS tracking</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="geofencing"
                      checked={formData.ethernetRequired || false}
                      onCheckedChange={(checked) => {
                        handleInputChange('ethernetRequired', checked);
                        handleInputBlur();
                      }}
                    />
                    <Label htmlFor="geofencing">Geofencing alerts</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="driver-behavior"
                      checked={formData.ceilingMount || false}
                      onCheckedChange={(checked) => handleInputChange('ceilingMount', checked)}
                    />
                    <Label htmlFor="driver-behavior">Driver behavior monitoring</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="maintenance"
                      checked={formData.outdoorCoverage || false}
                      onCheckedChange={(checked) => handleInputChange('outdoorCoverage', checked)}
                    />
                    <Label htmlFor="maintenance">Maintenance scheduling</Label>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium nxt-gray-800 mb-2">
                      Reporting Frequency
                    </Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select reporting frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="real-time">Real-time</SelectItem>
                        <SelectItem value="5-minutes">Every 5 minutes</SelectItem>
                        <SelectItem value="15-minutes">Every 15 minutes</SelectItem>
                        <SelectItem value="hourly">Hourly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium nxt-gray-800 mb-2">
                      Data Retention Period
                    </Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select retention period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30-days">30 days</SelectItem>
                        <SelectItem value="90-days">90 days</SelectItem>
                        <SelectItem value="1-year">1 year</SelectItem>
                        <SelectItem value="2-years">2 years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Installation Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm font-medium nxt-gray-800 mb-2">
                  Installation Complexity
                </Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select installation type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic - OBD port installation</SelectItem>
                    <SelectItem value="hardwired">Hardwired - Direct vehicle connection</SelectItem>
                    <SelectItem value="asset-tracking">Asset tracking - Magnetic/adhesive mount</SelectItem>
                    <SelectItem value="custom">Custom integration required</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium nxt-gray-800 mb-2">
                  Preferred Installation Date
                </Label>
                <Input
                  type="date"
                  value={formData.preferredInstallationDate ? new Date(formData.preferredInstallationDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleInputChange('preferredInstallationDate', e.target.value ? new Date(e.target.value) : null)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nxt-blue focus:border-nxt-blue"
                  min={new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0]}
                />
                <p className="text-xs nxt-gray-500 mt-1">
                  Minimum 48 hours from today required for equipment confirmation
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium nxt-gray-800 mb-2">
                  Installation Notes
                </Label>
                <Textarea
                  value={formData.interferenceSources || ''}
                  onChange={(e) => handleInputChange('interferenceSources', e.target.value)}
                  placeholder="Any specific installation requirements, vehicle access restrictions, or scheduling preferences..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nxt-blue focus:border-nxt-blue"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-nxt-green" />
                Quote Generation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StepQuoteGeneration 
                assessmentId={parseInt(id!)}
                data={formData}
              />
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-nxt-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/")}
                className="flex items-center gap-2 text-nxt-gray-600 hover:text-nxt-gray-800"
              >
                <ArrowLeft size={20} />
                Back to Dashboard
              </Button>
            </div>
            
            <div className="text-center">
              <h1 className="text-xl font-semibold nxt-gray-800">Fleet & Asset Tracking Device</h1>
              <p className="text-sm nxt-gray-500">Step {currentStep} of {totalSteps}</p>
            </div>
            
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-nxt-blue h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderStep()}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Previous
          </Button>

          {currentStep < totalSteps ? (
            <Button
              onClick={handleNext}
              className="bg-nxt-blue text-white flex items-center gap-2"
            >
              Next
              <ArrowRight size={16} />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}