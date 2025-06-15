import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Wifi } from "lucide-react";

interface AssessmentHeaderProps {
  currentStep: number;
  totalSteps: number;
  progress: number;
  onBackToDashboard: () => void;
}

export function AssessmentHeader({ 
  currentStep, 
  totalSteps, 
  progress, 
  onBackToDashboard 
}: AssessmentHeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={onBackToDashboard}
              className="p-2 nxt-gray-500 hover:text-nxt-gray-800 mr-3"
            >
              <ArrowLeft size={20} />
            </Button>
            <div className="flex items-center">
              <div className="h-6 w-6 bg-nxt-blue rounded-lg flex items-center justify-center mr-2">
                <Wifi className="text-white" size={14} />
              </div>
              <h1 className="text-xl font-semibold nxt-gray-800">Site Assessment</h1>
            </div>
          </div>
          
          <div className="text-sm nxt-gray-500">
            Step {currentStep} of {totalSteps}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="pb-4">
          <div className="w-full bg-nxt-gray-100 rounded-full h-2">
            <div 
              className="bg-nxt-blue h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
