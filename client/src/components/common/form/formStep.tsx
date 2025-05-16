import React, { ReactNode, useEffect } from "react";
import { useStepForm } from "./stepForm";

interface FormStepProps {
  title: string;
  children: ReactNode;
  onValidate?: () => Promise<boolean> | boolean;
  stepNumber: number;
}

export const FormStep: React.FC<FormStepProps> = ({
  title,
  children,
  onValidate,
  stepNumber
}) => {
  const { currentStep, nextStep, prevStep, isLastStep, formData } = useStepForm();
  
  // Handle form submission with validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If there's a validation function, run it
    if (onValidate) {
      const isValid = await onValidate();
      if (!isValid) return; // Stop if validation fails
    }
    
    nextStep();
  };
  
  return (
    <div className="form-step">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">{title}</h2>
      <form onSubmit={handleSubmit}>
        {children}
        
        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={prevStep}
            className={`px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors ${
              currentStep === 0 ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={currentStep === 0}
          >
            Back
          </button>
          
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#00fac8] to-[#00e0b5] text-white hover:shadow-lg transition-all"
          >
            {isLastStep ? "Complete" : "Continue"}
          </button>
        </div>
      </form>
    </div>
  );
};