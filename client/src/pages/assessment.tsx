import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { AssessmentHeader } from "@/components/assessment/assessment-header";
import { StepSalesExecutive } from "@/components/assessment/step-sales-executive";
import { StepCustomerInfo } from "@/components/assessment/step-customer-info";
import { StepSiteAssessment } from "@/components/assessment/step-site-assessment";
import { StepFileUpload } from "@/components/assessment/step-file-upload";
import { StepQuoteGeneration } from "@/components/assessment/step-quote-generation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Assessment } from "@shared/schema";

const TOTAL_STEPS = 5;

export default function AssessmentPage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [assessmentData, setAssessmentData] = useState<Partial<Assessment>>({});

  // Redirect to login if not authenticated
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

  const { data: assessment, isLoading: assessmentLoading } = useQuery({
    queryKey: ["/api/assessments", id],
    queryFn: async () => {
      const response = await fetch(`/api/assessments/${id}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!id && isAuthenticated,
    retry: false,
  });

  const updateAssessmentMutation = useMutation({
    mutationFn: async (data: Partial<Assessment>) => {
      return await apiRequest("PUT", `/api/assessments/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assessments", id] });
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
        description: "Failed to update assessment",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (assessment) {
      setAssessmentData(assessment);
    }
  }, [assessment]);

  const handleBackToDashboard = () => {
    navigate("/");
  };

  const handleNext = async () => {
    // Save current step data
    await updateAssessmentMutation.mutateAsync(assessmentData);
    
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete assessment
      toast({
        title: "Success",
        description: "Assessment completed successfully!",
      });
      navigate("/");
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDataChange = (stepData: Partial<Assessment>) => {
    setAssessmentData(prev => ({ ...prev, ...stepData }));
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-nxt-gray-50">
        <p className="nxt-gray-500">Loading...</p>
      </div>
    );
  }

  if (assessmentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-nxt-gray-50">
        <p className="nxt-gray-500">Loading assessment...</p>
      </div>
    );
  }

  if (!assessment && id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-nxt-gray-50">
        <p className="nxt-gray-500">Assessment not found</p>
      </div>
    );
  }

  const progress = (currentStep / TOTAL_STEPS) * 100;

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepSalesExecutive 
            data={assessmentData} 
            onChange={handleDataChange}
          />
        );
      case 2:
        return (
          <StepCustomerInfo 
            data={assessmentData} 
            onChange={handleDataChange}
          />
        );
      case 3:
        return (
          <StepSiteAssessment 
            data={assessmentData} 
            onChange={handleDataChange}
          />
        );
      case 4:
        return (
          <StepFileUpload 
            assessmentId={parseInt(id || '0')}
          />
        );
      case 5:
        return (
          <StepQuoteGeneration 
            assessmentId={parseInt(id || '0')}
            data={assessmentData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-nxt-gray-50">
      <AssessmentHeader
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        progress={progress}
        onBackToDashboard={handleBackToDashboard}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderCurrentStep()}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="px-6 py-3 font-medium"
          >
            <ArrowLeft className="mr-2" size={16} />
            Previous
          </Button>

          <Button
            onClick={handleNext}
            disabled={updateAssessmentMutation.isPending}
            className="px-6 py-3 bg-nxt-blue text-white font-medium hover:bg-blue-700"
          >
            {currentStep === TOTAL_STEPS ? (
              <>
                <Check className="mr-2" size={16} />
                Complete Assessment
              </>
            ) : (
              <>
                Next
                <ArrowRight className="ml-2" size={16} />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
