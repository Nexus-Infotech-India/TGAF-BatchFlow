import React, { useState, createContext, useContext, ReactNode } from "react";
import { StepIndicator } from "./stepIndicator";

interface StepFormContextType {
  currentStep: number;
  totalSteps: number;
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  formData: Record<string, any>;
  updateFormData: (data: Record<string, any>) => void;
}

const StepFormContext = createContext<StepFormContextType | undefined>(undefined);

export const useStepForm = () => {
  const context = useContext(StepFormContext);
  if (!context) {
    throw new Error("useStepForm must be used within a StepFormProvider");
  }
  return context;
};

interface StepFormProps {
  children: ReactNode;
  initialData?: Record<string, any>;
  onComplete: (formData: Record<string, any>) => void;
}

export const StepForm: React.FC<StepFormProps> = ({ 
  children, 
  initialData = {}, 
  onComplete 
}) => {
    
    
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  
  const childrenArray = React.Children.toArray(children);
  const stepIndicator = childrenArray.find(child => 
    React.isValidElement(child) && 
    typeof (child.type as any) === 'function' && 
    ((child.type as any).name === 'StepIndicator' || (child as any).props.hasOwnProperty('steps'))
  );
  
  // Get only FormStep components for actual step logic
  const formSteps = childrenArray.filter(child => 
    React.isValidElement(child) && 
    typeof (child.type as any) === 'function' && 
    ((child.type as any).name === 'FormStep' || !(child as any).props.hasOwnProperty('steps'))
  );

  
  const totalSteps = formSteps.length;


  
  
  
  const goToStep = (step: number) => {
    if (step >= 0 && step < totalSteps) {
      setCurrentStep(step);
    }
  };
  
  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // If we're on the last step, complete the form
      onComplete(formData);
    }
  };
  
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  const updateFormData = (newData: Record<string, any>) => {
    setFormData(prev => ({ ...prev, ...newData }));
  };
  
  const value = {
    currentStep,
    totalSteps,
    goToStep,
    nextStep,
    prevStep,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === totalSteps - 1,
    formData,
    updateFormData
  };
  
  return (
    <StepFormContext.Provider value={value}>
      <div className="step-form-container">
        {/* Always render StepIndicator if present */}
        {stepIndicator}
        
        {/* Then render the current form step */}
        {formSteps[currentStep]}
      </div>
    </StepFormContext.Provider>
  );
};