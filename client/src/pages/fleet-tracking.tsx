import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, CheckCircle, Truck } from "lucide-react";
import { StepSalesExecutive } from "@/components/assessment/step-sales-executive";
import { StepCustomerInfo } from "@/components/assessment/step-customer-info";
import { StepQuoteGeneration } from "@/components/assessment/step-quote-generation";

export default function FleetTrackingForm() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

  // Completely isolated local state - no useEffect conflicts
  const [localDeviceCount, setLocalDeviceCount] = useState('');
  const [localSiteAddress, setLocalSiteAddress] = useState('');
  const [localSpecialRequirements, setLocalSpecialRequirements] = useState('');
  const [formData, setFormData] = useState<any>({});
  const [vehicleDetails, setVehicleDetails] = useState<Array<{year: string, make: string, model: string}>>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    enabled: !!id && id !== 'new' && isAuthenticated,
    retry: false,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/assessments/${id}`, data);
      return response;
    },
    onSuccess: () => {
      // No query invalidation to prevent form resets
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

  // Initialize form data ONLY ONCE
  useEffect(() => {
    if (assessment && !isInitialized) {
      setFormData(assessment);
      setLocalDeviceCount(assessment.deviceCount?.toString() || '');
      setLocalSiteAddress(assessment.siteAddress || '');
      setLocalSpecialRequirements(assessment.specialRequirements || '');
      
      // Initialize vehicle details from database or based on device count
      try {
        if ((assessment as any).vehicleDetails) {
          const savedDetails = JSON.parse((assessment as any).vehicleDetails);
          if (Array.isArray(savedDetails)) {
            setVehicleDetails(savedDetails);
          }
        } else {
          // Fallback: Initialize based on device count
          const deviceCount = assessment.deviceCount;
          if (deviceCount && deviceCount > 0) {
            const details = [];
            for (let i = 0; i < deviceCount; i++) {
              details.push({ year: '', make: '', model: '' });
            }
            setVehicleDetails(details);
          }
        }
      } catch (error) {
        console.warn('Failed to parse vehicle details, using device count fallback');
        const deviceCount = assessment.deviceCount;
        if (deviceCount && deviceCount > 0) {
          const details = [];
          for (let i = 0; i < deviceCount; i++) {
            details.push({ year: '', make: '', model: '' });
          }
          setVehicleDetails(details);
        }
      }
      
      setIsInitialized(true);
    }
  }, [assessment, isInitialized]);

  // Debounced save function
  const debouncedSave = useCallback((data: any) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      if (assessment && !updateMutation.isPending) {
        updateMutation.mutate(data);
      }
    }, 1000);
  }, [assessment, updateMutation]);

  // Simple input handlers that save on blur
  const handleDeviceCountChange = useCallback((value: string) => {
    setLocalDeviceCount(value);
  }, []);

  const handleDeviceCountBlur = useCallback(() => {
    const numValue = localDeviceCount ? parseInt(localDeviceCount) : null;
    const updatedData = { ...formData, deviceCount: numValue };
    setFormData(updatedData);
    debouncedSave(updatedData);
    
    // Update vehicle details array based on device count
    if (numValue && numValue > 0) {
      const newDetails = [];
      for (let i = 0; i < numValue; i++) {
        // Preserve existing data if available, otherwise create empty
        newDetails.push(vehicleDetails[i] || { year: '', make: '', model: '' });
      }
      setVehicleDetails(newDetails);
    } else {
      setVehicleDetails([]);
    }
  }, [localDeviceCount, formData, debouncedSave, vehicleDetails]);

  const handleSiteAddressChange = useCallback((value: string) => {
    setLocalSiteAddress(value);
  }, []);

  const handleSiteAddressBlur = useCallback(() => {
    const updatedData = { ...formData, siteAddress: localSiteAddress };
    setFormData(updatedData);
    debouncedSave(updatedData);
  }, [localSiteAddress, formData, debouncedSave]);

  const handleSpecialRequirementsChange = useCallback((value: string) => {
    setLocalSpecialRequirements(value);
  }, []);

  const handleSpecialRequirementsBlur = useCallback(() => {
    const updatedData = { ...formData, specialRequirements: localSpecialRequirements };
    setFormData(updatedData);
    debouncedSave(updatedData);
  }, [localSpecialRequirements, formData, debouncedSave]);

  const handleSelectChange = useCallback((field: string, value: any) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    debouncedSave(updatedData);
  }, [formData, debouncedSave]);

  const handleCheckboxChange = useCallback((field: string, value: boolean) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    debouncedSave(updatedData);
  }, [formData, debouncedSave]);

  const updateVehicleDetail = useCallback((index: number, field: 'year' | 'make' | 'model', value: string) => {
    setVehicleDetails(prev => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = { ...updated[index], [field]: value };
      }
      
      // Save vehicle details to database
      const updatedData = { 
        ...formData, 
        vehicleDetails: JSON.stringify(updated.filter(v => v.year || v.make || v.model)) // Only save non-empty entries
      };
      setFormData(updatedData);
      debouncedSave(updatedData);
      
      return updated;
    });
  }, [formData, debouncedSave]);

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
          <StepSalesExecutive 
            data={formData}
            onChange={(data) => {
              const updatedData = { ...formData, ...data };
              setFormData(updatedData);
              debouncedSave(updatedData);
            }}
          />
        );
      case 2:
        return (
          <StepCustomerInfo 
            data={formData}
            onChange={(data) => {
              const updatedData = { ...formData, ...data };
              setFormData(updatedData);
              debouncedSave(updatedData);
            }}
          />
        );
      case 3:
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
                    Number of Vehicles for Installation
                  </Label>
                  <Input
                    type="number"
                    value={localDeviceCount}
                    onChange={(e) => handleDeviceCountChange(e.target.value)}
                    onBlur={handleDeviceCountBlur}
                    placeholder="Number of vehicles for tracker installation"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium nxt-gray-800 mb-2">
                    Total Number of Vehicles in Fleet
                  </Label>
                  <Input
                    type="number"
                    value={formData.totalFleetSize?.toString() || ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value) : null;
                      handleSelectChange('totalFleetSize', value);
                    }}
                    placeholder="Total fleet size"
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium nxt-gray-800 mb-2">
                  Installation Site Address
                </Label>
                <Input
                  value={localSiteAddress}
                  onChange={(e) => handleSiteAddressChange(e.target.value)}
                  onBlur={handleSiteAddressBlur}
                  placeholder="Enter installation site address"
                  className="w-full"
                />
              </div>

              {/* Dynamic Vehicle Details Section */}
              {vehicleDetails.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-nxt-gray-800 border-b border-nxt-gray-200 pb-2">
                    Vehicle Details ({vehicleDetails.length} vehicle{vehicleDetails.length !== 1 ? 's' : ''})
                  </h4>
                  {vehicleDetails.map((vehicle, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-4 bg-nxt-gray-50">
                      <h5 className="font-medium text-nxt-gray-800">Vehicle {index + 1}</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-sm font-medium nxt-gray-800 mb-2">
                            Year
                          </Label>
                          <Input
                            type="number"
                            value={vehicle.year}
                            onChange={(e) => updateVehicleDetail(index, 'year', e.target.value)}
                            placeholder="Vehicle year"
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
                            placeholder="Vehicle make"
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
                            placeholder="Vehicle model"
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {vehicleDetails.length === 0 && (
                <div className="bg-nxt-gray-50 border border-nxt-gray-200 rounded-lg p-6 text-center">
                  <p className="text-nxt-gray-600">
                    Enter the number of vehicles for installation above to add vehicle details.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Tracking Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium nxt-gray-800 mb-2">
                    Tracker Type
                  </Label>
                  <Select value={formData.trackerType || ''} onValueChange={(value) => handleSelectChange('trackerType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tracker type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vehicle-tracker">Vehicle Tracker</SelectItem>
                      <SelectItem value="asset-tracker">Asset Tracker</SelectItem>
                      <SelectItem value="slap-track">Slap & Track</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium nxt-gray-800 mb-2">
                    Installation Type
                  </Label>
                  <Select value={formData.ceilingType || ''} onValueChange={(value) => handleSelectChange('ceilingType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select installation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="obd-port">OBD Port Installation</SelectItem>
                      <SelectItem value="hardwired">Hardwired Installation</SelectItem>
                      <SelectItem value="magnetic">Magnetic Mount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium nxt-gray-800 mb-2">
                    IoT Tracking Partner
                  </Label>
                  <Select value={formData.iotTrackingPartner || ''} onValueChange={(value) => handleSelectChange('iotTrackingPartner', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tracking partner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="geotab">GeoTab</SelectItem>
                      <SelectItem value="zenduit">Zenduit</SelectItem>
                      <SelectItem value="spireon">Spireon</SelectItem>
                      <SelectItem value="airiq">AirIQ</SelectItem>
                      <SelectItem value="verizon-connect">Verizon Connect</SelectItem>
                      <SelectItem value="samsara">Samsara</SelectItem>
                      <SelectItem value="fleetio">Fleetio</SelectItem>
                      <SelectItem value="truckx">TruckX</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium nxt-gray-800 mb-2">
                    Carrier Sim
                  </Label>
                  <Select value={formData.carrierSim || ''} onValueChange={(value) => handleSelectChange('carrierSim', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select carrier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="t-mobile">T-Mobile</SelectItem>
                      <SelectItem value="verizon-wireless">Verizon Wireless</SelectItem>
                      <SelectItem value="att">AT&T</SelectItem>
                      <SelectItem value="wholesale-provider">Wholesale Provider</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Additional Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm font-medium nxt-gray-800 mb-2">
                  Special Requirements or Notes
                </Label>
                <Textarea
                  value={localSpecialRequirements}
                  onChange={(e) => handleSpecialRequirementsChange(e.target.value)}
                  onBlur={handleSpecialRequirementsBlur}
                  placeholder="Any special installation requirements, vehicle access restrictions, or additional notes..."
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
      case 6:
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
              Fleet Tracking Assessment
            </Badge>
          </div>
          
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-nxt-gray-900 mb-2">
              Fleet & Asset Tracking Device Installation
            </h1>
            <p className="text-nxt-gray-600">
              Step {currentStep} of {totalSteps}: Complete the assessment for professional fleet tracking installation
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