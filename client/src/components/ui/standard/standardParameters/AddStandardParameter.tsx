import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api, { API_ROUTES } from "../../../../utils/api";
import { motion } from "framer-motion";
import { 
  Save, 
  X, 
  AlertCircle, 
  FileText, 
  Tag, 
  Info, 
  DatabaseIcon, 
  RefreshCw, 
  CheckCircle,
  ChevronDown,
  BarChart,
  Ruler,
  
} from "lucide-react";
import { toast } from "react-toastify";

interface AddStandardParameterProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const dataTypeOptions = [
  { value: "TEXT", label: "Text", description: "Free text values" },
  { value: "FLOAT", label: "Float", description: "Decimal numbers" },
  { value: "INTEGER", label: "Integer", description: "Whole numbers" },
  { value: "BOOLEAN", label: "Boolean", description: "True/False values" },
  { value: "PERCENTAGE", label: "Percentage", description: "Percentage values" },
  { value: "DATE", label: "Date", description: "Date values" }
];

const AddStandardParameter: React.FC<AddStandardParameterProps> = ({ onSuccess, onCancel }) => {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [dataType, setDataType] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // New state variables for standard values - removed standardId
  const [showStandardValue, setShowStandardValue] = useState(false);
  const [standardValue, setStandardValue] = useState("");
  const [unitId, setUnitId] = useState("");

  // Fetch categories using TanStack Query
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const authToken = localStorage.getItem("authToken");
      const response = await api.get(API_ROUTES.STANDARD.GET_STANDARD_CATEGORIES, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      return response.data.categories || [];
    },
  });
  
  // Removed standards fetching
  
  // Fetch units when the standard value toggle is enabled
  const { data: units = [], isLoading: isLoadingUnits } = useQuery({
    queryKey: ["units"],
    queryFn: async () => {
      const authToken = localStorage.getItem("authToken");
      const response = await api.get(API_ROUTES.UNIT.GET_UNITS, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      return response.data.units || [];
    },
    enabled: showStandardValue // Only fetch when toggle is enabled
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    
    try {
      const authToken = localStorage.getItem("authToken");
      
      // Add standard value data to payload when toggle is enabled - removed standardId
      const payload = { 
        name, 
        categoryId, 
        description, 
        dataType,
        // Include these fields conditionally
        ...(showStandardValue && standardValue ? {
          standardValue,
          unitId: unitId || undefined,
        } : {})
      };
      
      await api.post(
        API_ROUTES.STANDARD.CREATE_STANDARD_PARAMETER,
        payload,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      
      setSuccess(true);
      toast.success("Standard parameter created successfully!", {
        position: "bottom-right",
        autoClose: 3000,
      });
      
      // Clear form
      setName("");
      setCategoryId("");
      setDescription("");
      setDataType("");
      setStandardValue("");
      setUnitId("");
      setShowStandardValue(false);
      
      // Slight delay before redirecting
      setTimeout(() => {
        onSuccess();
      }, 1000);
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to create parameter.";
      setError(errorMessage);
      toast.error(errorMessage, {
        position: "bottom-right",
        autoClose: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      className="bg-white rounded-xl border border-blue-100 shadow-md overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-100 p-6">
        <div className="flex items-center gap-3">
          <Tag className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">Create Standard Parameter</h2>
        </div>
        <p className="text-gray-600 mt-1 pl-9">
          Define a new measurable parameter for use in quality standards and specifications.
        </p>
      </div>
      
      {/* Error Message */}
      {error && (
        <motion.div 
          className="mx-6 my-4 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-red-700">Error</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
          <button 
            onClick={() => setError("")}
            className="ml-auto p-1 text-red-500 hover:text-red-700"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
      
      {/* Form */}
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Parameter Name*</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FileText className="h-4 w-4 text-blue-500" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-blue-200 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-blue-400 focus:border-blue-300 outline-none transition-all duration-200"
                  placeholder="E.g., Moisture Content, pH Level"
                  required
                />
              </div>
              <p className="mt-1.5 text-xs text-gray-500">
                The name of the parameter to be measured or tested
              </p>
            </div>
            
            {/* Category dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category*</label>
              {isLoadingCategories ? (
                <div className="flex items-center space-x-2 text-sm text-gray-600 py-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                  <span>Loading categories...</span>
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full appearance-none border border-blue-200 rounded-lg pl-4 pr-10 py-2.5 focus:ring-2 focus:ring-blue-400 focus:border-blue-300 outline-none transition-all duration-200 bg-white"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((category: { id: string; name: string }) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <ChevronDown size={16} />
                  </div>
                </div>
              )}
              <p className="mt-1.5 text-xs text-gray-500">
                The category this parameter belongs to (e.g., Organoleptic, Chemical)
              </p>
            </div>
          </div>
          
          {/* Description field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <div className="relative">
              <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                <Info className="h-4 w-4 text-blue-500" />
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-blue-200 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-blue-400 focus:border-blue-300 outline-none transition-all duration-200 min-h-[100px]"
                placeholder="Provide details about what this parameter measures..."
              />
            </div>
            <p className="mt-1.5 text-xs text-gray-500">
              Additional information about the purpose and meaning of this parameter
            </p>
          </div>
          
          {/* Data Type selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Data Type*</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DatabaseIcon className="h-4 w-4 text-blue-500" />
              </div>
              <select
                value={dataType}
                onChange={(e) => setDataType(e.target.value)}
                className="w-full appearance-none border border-blue-200 rounded-lg pl-10 pr-10 py-2.5 focus:ring-2 focus:ring-blue-400 focus:border-blue-300 outline-none transition-all duration-200 bg-white"
                required
              >
                <option value="">Select data type</option>
                {dataTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label} - {option.description}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <ChevronDown size={16} />
              </div>
            </div>
            <p className="mt-1.5 text-xs text-gray-500">
              The type of data this parameter measures (affects validation and display)
            </p>
          </div>
          
          {/* Standard Value Section */}
          <div className="border-t border-blue-100 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart className="h-5 w-5 text-blue-600" />
                <h3 className="font-medium text-gray-800">Expected Value</h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={showStandardValue} 
                  onChange={() => setShowStandardValue(!showStandardValue)}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-700">
                  {showStandardValue ? 'Define expected value' : 'No expected value'}
                </span>
              </label>
            </div>
            
            {/* Show additional fields only when the toggle is enabled */}
            {showStandardValue && (
              <motion.div 
                className="space-y-5 bg-blue-50 p-4 rounded-lg border border-blue-100 mt-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-sm text-blue-700">
                  Define the expected value for this parameter according to quality standards.
                </p>
                
                {/* Removed Standard selection section */}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Standard value field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Expected Value*</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={standardValue}
                        onChange={(e) => setStandardValue(e.target.value)}
                        className="w-full border border-blue-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-400 focus:border-blue-300 outline-none transition-all duration-200"
                        placeholder="E.g., 10, 5.5-7.8, ≤ 2.0"
                        required={showStandardValue}
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-gray-500">
                      The expected value or range (e.g., "10", "5.5-7.8", "≤ 2.0")
                    </p>
                  </div>
                  
                  {/* Unit selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Unit of Measurement</label>
                    {isLoadingUnits ? (
                      <div className="flex items-center space-x-2 text-sm text-gray-600 py-2">
                        <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                        <span>Loading units...</span>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Ruler className="h-4 w-4 text-blue-500" />
                        </div>
                        <select
                          value={unitId}
                          onChange={(e) => setUnitId(e.target.value)}
                          className="w-full appearance-none border border-blue-200 rounded-lg pl-10 pr-10 py-2.5 focus:ring-2 focus:ring-blue-400 focus:border-blue-300 outline-none transition-all duration-200 bg-white"
                        >
                          <option value="">Select a unit</option>
                          {units.map((unit: { id: string; name: string; symbol: string }) => (
                            <option key={unit.id} value={unit.id}>
                              {unit.name} ({unit.symbol})
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                          <ChevronDown size={16} />
                        </div>
                      </div>
                    )}
                    <p className="mt-1.5 text-xs text-gray-500">
                      The unit for this parameter (e.g., %, mg/kg)
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <motion.button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2 shadow-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitting}
            >
              <X size={16} />
              Cancel
            </motion.button>
            
            <motion.button
              type="submit"
              className={`px-5 py-2.5 rounded-lg shadow-md flex items-center gap-2 ${
                success 
                  ? "bg-green-600 text-white" 
                  : "bg-gradient-to-r from-blue-600 to-blue-700 text-white"
              }`}
              whileHover={!isSubmitting && !success ? { 
                scale: 1.02, 
                boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3), 0 4px 6px -2px rgba(59, 130, 246, 0.15)" 
              } : {}}
              whileTap={!isSubmitting && !success ? { scale: 0.98 } : {}}
              disabled={isSubmitting || success}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Creating...</span>
                </>
              ) : success ? (
                <>
                  <CheckCircle size={16} />
                  <span>Created</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Create Parameter</span>
                </>
              )}
            </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default AddStandardParameter;