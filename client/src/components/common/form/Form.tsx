import React from "react";
import { useStepForm } from "./stepForm";

// Base form field props
interface BaseFieldProps {
  label: string;
  name: string;
  required?: boolean;
  className?: string;
}

// Input field component
interface InputFieldProps extends BaseFieldProps {
  type?: string;
  placeholder?: string;
  min?: string | number;
  max?: string | number;
  step?: string;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
  className,
  ...rest
}) => {
  const { formData, updateFormData } = useStepForm();
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = type === "number" ? parseFloat(e.target.value) : e.target.value;
    updateFormData({ [name]: value });
  };
  
  return (
    <div className={className}>
      <label 
        htmlFor={name} 
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        value={formData[name] || ""}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00fac8] focus:border-[#00fac8] transition-colors"
        {...rest}
      />
    </div>
  );
};

// Select field component
interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps extends BaseFieldProps {
  options: SelectOption[];
  placeholder?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  name,
  options,
  required = false,
  placeholder,
  className
}) => {
  const { formData, updateFormData } = useStepForm();
  
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFormData({ [name]: e.target.value });
  };
  
  return (
    <div className={className}>
      <label 
        htmlFor={name} 
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        id={name}
        name={name}
        value={formData[name] || ""}
        onChange={handleChange}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00fac8] focus:border-[#00fac8] transition-colors"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

// Textarea field component
interface TextareaFieldProps extends BaseFieldProps {
  placeholder?: string;
  rows?: number;
}

export const TextareaField: React.FC<TextareaFieldProps> = ({
  label,
  name,
  required = false,
  placeholder,
  rows = 3,
  className
}) => {
  const { formData, updateFormData } = useStepForm();
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateFormData({ [name]: e.target.value });
  };
  
  return (
    <div className={className}>
      <label 
        htmlFor={name} 
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        id={name}
        name={name}
        value={formData[name] || ""}
        onChange={handleChange}
        rows={rows}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00fac8] focus:border-[#00fac8] transition-colors"
      />
    </div>
  );
};

// Date field component
interface DateFieldProps extends BaseFieldProps {
  minDate?: string;
  maxDate?: string;
}

export const DateField: React.FC<DateFieldProps> = ({
  label,
  name,
  required = false,
  minDate,
  maxDate,
  className
}) => {
  const { formData, updateFormData } = useStepForm();
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFormData({ [name]: e.target.value });
  };
  
  return (
    <div className={className}>
      <label 
        htmlFor={name} 
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="date"
        id={name}
        name={name}
        value={formData[name] || ""}
        onChange={handleChange}
        min={minDate}
        max={maxDate}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00fac8] focus:border-[#00fac8] transition-colors"
      />
    </div>
  );
};

