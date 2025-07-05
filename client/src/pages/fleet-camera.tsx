import { useState, useEffect, useCallback } from "react";
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

interface VehicleDetail {
  year: string;
  make: string;
  model: string;
}

export default function FleetCameraForm() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  // Local form state - simplified to prevent input issues
  const [deviceCount, setDeviceCount] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [formData, setFormData] = useState<Partial<Assessment>>({});
  const [vehicleDetails, setVehicleDetails] = useState<VehicleDetail[]>([]);
  const [protectiveHarness, setProtectiveHarness] = useState<'yes' | 'no' | ''>('');

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

  // Load initial data
  useEffect(() => {
    if (assessment) {
      setFormData(assessment);
      setDeviceCount(assessment.deviceCount?.toString() || '');
      setSiteAddress(assessment.siteAddress || '');
      setSpecialRequirements(assessment.specialRequirements || '');
      
      // Initialize vehicle details based on device count
      if (assessment.deviceCount && assessment.deviceCount > 0) {
        const details = [];
        for (let i = 0; i < assessment.deviceCount; i++) {
          details.push({ year: '', make: '', model: '' });
        }
        setVehicleDetails(details);
      }
    }
  }, [assessment]);

  const saveData = useCallback((data: Partial<Assessment>) => {
    if (assessment && !updateMutation.isPending) {
      updateMutation.mutate(data);
    }
  }, [assessment, updateMutation]);

  // Simple input handlers with onBlur save
  const handleDeviceCountBlur = useCallback(() => {
    const numValue = deviceCount ? parseInt(deviceCount) : null;
    const updatedData = { ...formData, deviceCount: numValue };
    setFormData(updatedData);
    saveData(updatedData);
    
    // Update vehicle details array based on device count
    if (numValue && numValue > 0) {
      const newDetails: VehicleDetail[] = [];
      for (let i = 0; i < numValue; i++) {
        newDetails.push(vehicleDetails[i] || { year: '', make: '', model: '' });
      }
      setVehicleDetails(newDetails);
    } else {
      setVehicleDetails([]);
    }
  }, [deviceCount, formData, saveData, vehicleDetails]);

  const handleSiteAddressBlur = useCallback(() => {
    const updatedData = { ...formData, siteAddress: siteAddress };
    setFormData(updatedData);
    saveData(updatedData);
  }, [siteAddress, formData, saveData]);

  const handleSpecialRequirementsBlur = useCallback(() => {
    const updatedData = { ...formData, specialRequirements: specialRequirements };
    setFormData(updatedData);
    saveData(updatedData);
  }, [specialRequirements, formData, saveData]);

  const handleSelectChange = useCallback((field: keyof Assessment, value: any) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    saveData(updatedData);
  }, [formData, saveData]);

  const handleCheckboxChange = useCallback((field: keyof Assessment, value: boolean) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    saveData(updatedData);
  }, [formData, saveData]);

  const updateVehicleDetail = useCallback((index: number, field: 'year' | 'make' | 'model', value: string) => {
    setVehicleDetails(prev => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
  }, []);

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
              saveData(updatedData);
            }}
          />
        );
      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Camera className="h-6 w-6 text-nxt-blue" />
                Fleet Camera Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium nxt-gray-800 mb-2">
                    Number of Vehicles for Camera Installation
                  </Label>
                  <Input
                    type="number"
                    value={deviceCount}
                    onChange={(e) => setDeviceCount(e.target.value)}
                    onBlur={handleDeviceCountBlur}
                    placeholder="Number of vehicles"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium nxt-gray-800 mb-2">
                    Carrier Sim
                  </Label>
                  <Select value={formData.networkSignal || ''} onValueChange={(value) => handleSelectChange('networkSignal', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select carrier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="t-mobile">T-Mobile</SelectItem>
                      <SelectItem value="verizon">Verizon</SelectItem>
                      <SelectItem value="att">AT&T</SelectItem>
                      <SelectItem value="wholesale">Wholesale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium nxt-gray-800 mb-2">
                  Primary Service Location
                </Label>
                <Input
                  value={siteAddress}
                  onChange={(e) => setSiteAddress(e.target.value)}
                  onBlur={handleSiteAddressBlur}
                  placeholder="Enter primary service address"
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium nxt-gray-800 mb-2">
                    Tracking Partner
                  </Label>
                  <Select value={formData.routerLocation || ''} onValueChange={(value) => handleSelectChange('routerLocation', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tracking partner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zenduit">Zenduit</SelectItem>
                      <SelectItem value="spireon">Spireon</SelectItem>
                      <SelectItem value="geotab">Geotab</SelectItem>
                      <SelectItem value="trackcam">TrackCam</SelectItem>
                      <SelectItem value="fleethoster">Fleethoster</SelectItem>
                      <SelectItem value="airiq">AirIQ</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium nxt-gray-800 mb-2">
                    Model
                  </Label>
                  <Input
                    value={formData.routerMake || ''}
                    onChange={(e) => handleSelectChange('routerMake', e.target.value)}
                    placeholder="Camera model"
                    maxLength={20}
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium nxt-gray-800 mb-2">
                  Protective Wiring Harness
                </Label>
                <Select value={protectiveHarness} onValueChange={(value) => {
                  setProtectiveHarness(value as 'yes' | 'no');
                  handleSelectChange('ceilingHeight', `protective_harness_${value}`);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Protective wiring harness required?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        );
      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {vehicleDetails.map((vehicle, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <h4 className="font-medium text-nxt-gray-800">Vehicle {index + 1}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium nxt-gray-800 mb-2">
                        Year
                      </Label>
                      <Input
                        value={vehicle.year}
                        onChange={(e) => updateVehicleDetail(index, 'year', e.target.value)}
                        placeholder="Year"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium nxt-gray-800 mb-2">
                        Make
                      </Label>
                      <Input
                        value={vehicle.make}
                        onChange={(e) => updateVehicleDetail(index, 'make', e.target.value)}
                        placeholder="Make"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium nxt-gray-800 mb-2">
                        Model
                      </Label>
                      <Input
                        value={vehicle.model}
                        onChange={(e) => updateVehicleDetail(index, 'model', e.target.value)}
                        placeholder="Model"
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              {vehicleDetails.length === 0 && (
                <p className="text-gray-500 text-center py-8">
                  Please specify the number of vehicles in the previous step to add vehicle details.
                </p>
              )}
            </CardContent>
          </Card>
        );
      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Camera Features Required</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="front-facing"
                      checked={formData.powerAvailable || false}
                      onCheckedChange={(checked) => handleCheckboxChange('powerAvailable', !!checked)}
                    />
                    <Label htmlFor="front-facing">Front-facing camera</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rear-facing"
                      checked={formData.ethernetRequired || false}
                      onCheckedChange={(checked) => handleCheckboxChange('ethernetRequired', !!checked)}
                    />
                    <Label htmlFor="rear-facing">Rear-facing camera</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="driver-facing"
                      checked={formData.ceilingMount || false}
                      onCheckedChange={(checked) => handleCheckboxChange('ceilingMount', !!checked)}
                    />
                    <Label htmlFor="driver-facing">Driver-facing camera</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="side-cameras"
                      checked={formData.outdoorCoverage || false}
                      onCheckedChange={(checked) => handleCheckboxChange('outdoorCoverage', !!checked)}
                    />
                    <Label htmlFor="side-cameras">Side/blind spot cameras</Label>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium nxt-gray-800 mb-2">
                      Recording Mode
                    </Label>
                    <Select value={formData.ceilingType || ''} onValueChange={(value) => handleSelectChange('ceilingType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select recording mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="continuous">Continuous Recording</SelectItem>
                        <SelectItem value="event-triggered">Event-Triggered</SelectItem>
                        <SelectItem value="live-streaming">Live Streaming</SelectItem>
                        <SelectItem value="cloud-storage">Cloud Storage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium nxt-gray-800 mb-2">
                      Audio Recording
                    </Label>
                    <Select value={formData.signalStrength || ''} onValueChange={(value) => handleSelectChange('signalStrength', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Audio recording options" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enabled">Audio Enabled</SelectItem>
                        <SelectItem value="disabled">Audio Disabled</SelectItem>
                        <SelectItem value="driver-consent">Driver Consent Required</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium nxt-gray-800 mb-2">
                  Special Requirements or Notes
                </Label>
                <Textarea
                  value={specialRequirements}
                  onChange={(e) => setSpecialRequirements(e.target.value)}
                  onBlur={handleSpecialRequirementsBlur}
                  placeholder="Any special installation requirements, camera positioning needs, or additional notes..."
                  className="min-h-[120px]"
                />
              </div>

              <div>
                <Label className="text-sm font-medium nxt-gray-800 mb-2">
                  Preferred Installation Date
                </Label>
                <Input
                  type="date"
                  value={formData.preferredInstallationDate ? new Date(formData.preferredInstallationDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const value = e.target.value ? new Date(e.target.value) : null;
                    handleSelectChange('preferredInstallationDate', value);
                  }}
                  className="w-full"
                />
                <p className="text-sm text-gray-500 mt-2">
                  * Installation dates are subject to 48-hour SLA for scheduling confirmation
                </p>
              </div>
            </CardContent>
          </Card>
        );
      case 5:
        return (
          <StepQuoteGeneration
            assessmentId={parseInt(id || '0')}
            data={formData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-nxt-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="flex items-center gap-2 hover:bg-nxt-gray-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <Badge variant="outline" className="bg-nxt-blue-50 text-nxt-blue border-nxt-blue">
              Fleet Camera Assessment
            </Badge>
          </div>
          
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-nxt-gray-900 mb-2">
              Fleet Camera Installation
            </h1>
            <p className="text-nxt-gray-600">
              Step {currentStep} of {totalSteps}: Complete the assessment for professional fleet camera installation
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-nxt-gray-200 rounded-full h-2 mb-8">
            <div 
              className="bg-nxt-blue h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>

          {currentStep === totalSteps ? (
            <Button
              onClick={handleFinish}
              className="flex items-center gap-2 bg-nxt-blue hover:bg-nxt-blue-600"
            >
              <CheckCircle className="h-4 w-4" />
              Complete Assessment
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="flex items-center gap-2 bg-nxt-blue hover:bg-nxt-blue-600"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}