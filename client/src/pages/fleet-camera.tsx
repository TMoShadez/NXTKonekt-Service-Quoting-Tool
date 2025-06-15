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
import { ArrowLeft, ArrowRight, CheckCircle, Camera } from "lucide-react";
import type { Assessment } from "@shared/schema";
import { StepCustomerInfo } from "@/components/assessment/step-customer-info";
import { StepQuoteGeneration } from "@/components/assessment/step-quote-generation";

export default function FleetCameraForm() {
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
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    updateMutation.mutate(updatedData);
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
      description: "Fleet camera installation assessment completed successfully!",
    });
    navigate("/");
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-nxt-gray-50">
        <div className="text-center">
          <Camera className="mx-auto h-12 w-12 text-nxt-blue mb-4" />
          <p className="nxt-gray-500">Loading fleet camera assessment...</p>
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
              updateMutation.mutate(updatedData);
            }}
          />
        );
      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Camera className="h-6 w-6 text-nxt-blue" />
                Fleet & Camera Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium nxt-gray-800 mb-2">
                    Number of Vehicles
                  </Label>
                  <Input
                    type="number"
                    value={formData.deviceCount || ''}
                    onChange={(e) => handleInputChange('deviceCount', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="Vehicles requiring cameras"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nxt-blue focus:border-nxt-blue"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium nxt-gray-800 mb-2">
                    Vehicle Types
                  </Label>
                  <Select
                    value={formData.buildingType || ''}
                    onValueChange={(value) => handleInputChange('buildingType', value)}
                  >
                    <SelectTrigger className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nxt-blue focus:border-nxt-blue">
                      <SelectValue placeholder="Select vehicle types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="delivery-vans">Delivery Vans</SelectItem>
                      <SelectItem value="trucks">Commercial Trucks</SelectItem>
                      <SelectItem value="buses">Buses/Transit</SelectItem>
                      <SelectItem value="construction">Construction Vehicles</SelectItem>
                      <SelectItem value="emergency">Emergency Vehicles</SelectItem>
                      <SelectItem value="mixed-fleet">Mixed Fleet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium nxt-gray-800 mb-2">
                    Camera Purpose
                  </Label>
                  <Select
                    value={formData.industry || ''}
                    onValueChange={(value) => handleInputChange('industry', value)}
                  >
                    <SelectTrigger className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nxt-blue focus:border-nxt-blue">
                      <SelectValue placeholder="Primary use case" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="safety">Driver Safety Monitoring</SelectItem>
                      <SelectItem value="security">Security & Theft Prevention</SelectItem>
                      <SelectItem value="compliance">Compliance & Documentation</SelectItem>
                      <SelectItem value="training">Driver Training & Coaching</SelectItem>
                      <SelectItem value="insurance">Insurance Risk Management</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium nxt-gray-800 mb-2">
                    Operating Environment
                  </Label>
                  <Input
                    value={formData.siteAddress || ''}
                    onChange={(e) => handleInputChange('siteAddress', e.target.value)}
                    placeholder="e.g., Urban delivery, Highway transport, Construction sites"
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
                  placeholder="Any specific camera requirements, vehicle restrictions, or compliance needs..."
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
              <CardTitle>Camera Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium nxt-gray-800">Camera Types Required</h4>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="forward-facing"
                      checked={formData.powerAvailable || false}
                      onCheckedChange={(checked) => handleInputChange('powerAvailable', checked)}
                    />
                    <Label htmlFor="forward-facing">Forward-facing road camera</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="driver-facing"
                      checked={formData.ethernetRequired || false}
                      onCheckedChange={(checked) => handleInputChange('ethernetRequired', checked)}
                    />
                    <Label htmlFor="driver-facing">Driver-facing interior camera</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="side-cameras"
                      checked={formData.ceilingMount || false}
                      onCheckedChange={(checked) => handleInputChange('ceilingMount', checked)}
                    />
                    <Label htmlFor="side-cameras">Side-view cameras</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rear-camera"
                      checked={formData.outdoorCoverage || false}
                      onCheckedChange={(checked) => handleInputChange('outdoorCoverage', checked)}
                    />
                    <Label htmlFor="rear-camera">Rear-view backup camera</Label>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium nxt-gray-800 mb-2">
                      Video Quality
                    </Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select video resolution" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="720p">720p HD</SelectItem>
                        <SelectItem value="1080p">1080p Full HD</SelectItem>
                        <SelectItem value="4k">4K Ultra HD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium nxt-gray-800 mb-2">
                      Storage Requirement
                    </Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select storage option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="local-only">Local storage only</SelectItem>
                        <SelectItem value="cloud-backup">Cloud backup</SelectItem>
                        <SelectItem value="real-time-streaming">Real-time streaming</SelectItem>
                        <SelectItem value="hybrid">Hybrid local + cloud</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium nxt-gray-800 mb-2">
                      Recording Mode
                    </Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select recording mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="continuous">Continuous recording</SelectItem>
                        <SelectItem value="event-triggered">Event-triggered only</SelectItem>
                        <SelectItem value="motion-detection">Motion detection</SelectItem>
                        <SelectItem value="scheduled">Scheduled recording</SelectItem>
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
              <CardTitle>Installation & Power Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium nxt-gray-800 mb-2">
                    Power Source
                  </Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select power option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vehicle-battery">Vehicle battery (12V/24V)</SelectItem>
                      <SelectItem value="hardwired">Hardwired to electrical system</SelectItem>
                      <SelectItem value="solar">Solar panel backup</SelectItem>
                      <SelectItem value="auxiliary">Auxiliary battery pack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium nxt-gray-800 mb-2">
                    Installation Complexity
                  </Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select installation type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic - Dash mount cameras</SelectItem>
                      <SelectItem value="professional">Professional - Integrated installation</SelectItem>
                      <SelectItem value="custom">Custom - Fleet-specific solution</SelectItem>
                      <SelectItem value="retrofit">Retrofit existing vehicles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium nxt-gray-800 mb-2">
                    Installation Timeline
                  </Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timeline preference" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate (1-2 weeks)</SelectItem>
                      <SelectItem value="standard">Standard (2-4 weeks)</SelectItem>
                      <SelectItem value="phased">Phased rollout (1-3 months)</SelectItem>
                      <SelectItem value="scheduled">Scheduled maintenance windows</SelectItem>
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
              </div>

              <div>
                <Label className="text-sm font-medium nxt-gray-800 mb-2">
                  Installation Notes
                </Label>
                <Textarea
                  value={formData.interferenceSources || ''}
                  onChange={(e) => handleInputChange('interferenceSources', e.target.value)}
                  placeholder="Vehicle access requirements, downtime restrictions, or specific installation preferences..."
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
              <h1 className="text-xl font-semibold nxt-gray-800">Fleet Camera Installation</h1>
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