import React from "react";
import { useStepForm } from "./stepForm";
import { CheckIcon } from "lucide-react";

interface Step {
  title: string;
  description?: string;
}

interface StepIndicatorProps {
  steps: Step[];
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ steps }) => {
  const { currentStep, goToStep } = useStepForm();
  
  return (
    <div className="w-full py-6">
      <div className="flex items-center">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            {/* Step circle */}
            <div className="relative flex flex-col items-center">
              <button 
                onClick={() => goToStep(index)}
                disabled={index > currentStep}
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 
                  ${index < currentStep 
                    ? "bg-[#00fac8] border-[#00fac8] text-white" 
                    : index === currentStep 
                    ? "border-[#00fac8] text-[#00fac8]" 
                    : "border-gray-300 text-gray-300 cursor-not-allowed"
                  }`}
              >
                {index < currentStep ? (
                  <CheckIcon className="w-5 h-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </button>
              
              <div className="mt-2 text-center">
                <div className={`text-xs font-medium ${
                  index <= currentStep ? "text-[#00fac8]" : "text-gray-400"
                }`}>
                  {step.title}
                </div>
                {step.description && (
                  <div className={`text-xs mt-1 ${
                    index <= currentStep ? "text-gray-600" : "text-gray-400"
                  }`}>
                    {step.description}
                  </div>
                )}
              </div>
            </div>
            
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div 
                className={`flex-auto border-t-2 transition duration-200 ease-in-out mx-2 ${
                  index < currentStep ? "border-[#00fac8]" : "border-gray-300"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};