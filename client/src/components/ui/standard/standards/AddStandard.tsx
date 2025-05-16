import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api, { API_ROUTES } from "../../../../utils/api";
import { motion } from "framer-motion";
import { Save, X, AlertCircle, Info, Tag, FileText, Award, RefreshCw, CheckCircle, ChevronDown } from "lucide-react";
import { toast } from "react-toastify";

interface AddStandardProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const AddStandard: React.FC<AddStandardProps> = ({ onSuccess, onCancel }) => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [methodologyIds, setMethodologyIds] = useState<string[]>([]);
  const [unitIds, setUnitIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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

  // Fetch methodologies using TanStack Query
  const { data: methodologies = [], isLoading: isLoadingMethodologies } = useQuery({
    queryKey: ["methodologies"],
    queryFn: async () => {
      const authToken = localStorage.getItem("authToken");
      const response = await api.get(API_ROUTES.METHODOLOGY.GET_METHODOLOGIES, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      return response.data.methodologies || [];
    },
  });

  // Fetch units using TanStack Query
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
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    
    try {
      const authToken = localStorage.getItem("authToken");
      await api.post(
        API_ROUTES.STANDARD.CREATE_STANDARD,
        { name, code, description, categoryId, methodologyIds, unitIds },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      
      setSuccess(true);
      toast.success("Standard created successfully!", {
        position: "bottom-right",
        autoClose: 3000,
      });
      
      // Clear form
      setName("");
      setCode("");
      setDescription("");
      setCategoryId("");
      setMethodologyIds([]);
      setUnitIds([]);
      
      // Slight delay before redirecting
      setTimeout(() => {
        onSuccess();
      }, 1000);
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to create standard.";
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
          <Award className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">Create New Standard</h2>
        </div>
        <p className="text-gray-600 mt-1 pl-9">
          Add a new standard with detailed information for accurate documentation and tracking.
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
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Standard Name*</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Tag className="h-4 w-4 text-blue-500" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-blue-200 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-blue-400 focus:border-blue-300 outline-none transition-all duration-200"
                  placeholder="Enter standard name"
                  required
                />
              </div>
              <p className="mt-1.5 text-xs text-gray-500">
                Provide a clear and specific name that identifies this standard
              </p>
            </div>
            
            {/* Code field */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Standard Code*</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FileText className="h-4 w-4 text-blue-500" />
                </div>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full border border-blue-200 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-blue-400 focus:border-blue-300 outline-none transition-all duration-200"
                  placeholder="E.g., ISO-9001 or STD-0042"
                  required
                />
              </div>
              <p className="mt-1.5 text-xs text-gray-500">
                A unique identifier code for reference purposes
              </p>
            </div>
            
            {/* Description field - full width */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description*</label>
              <div className="relative">
                <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                  <Info className="h-4 w-4 text-blue-500" />
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-blue-200 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-blue-400 focus:border-blue-300 outline-none transition-all duration-200 min-h-[120px]"
                  placeholder="Provide a detailed description of this standard..."
                  required
                />
              </div>
              <p className="mt-1.5 text-xs text-gray-500">
                Describe the purpose, scope, and requirements of this standard
              </p>
            </div>
          </div>
          
          <hr className="border-blue-100" />
          
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
              Assign this standard to a specific category for better organization
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Methodologies multi-select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Methodologies</label>
              {isLoadingMethodologies ? (
                <div className="flex items-center space-x-2 text-sm text-gray-600 py-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                  <span>Loading methodologies...</span>
                </div>
              ) : (
                <div className="relative">
                  <select
                    multiple
                    value={methodologyIds}
                    onChange={(e) => setMethodologyIds(Array.from(e.target.selectedOptions, (option) => option.value))}
                    className="w-full border border-blue-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-400 focus:border-blue-300 outline-none transition-all duration-200 min-h-[120px]"
                  >
                    {methodologies.map((methodology: { id: string; name: string }) => (
                      <option key={methodology.id} value={methodology.id}>
                        {methodology.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <p className="mt-1.5 text-xs text-gray-500">
                Hold Ctrl/Cmd to select multiple methodologies
              </p>
            </div>
            
            {/* Units multi-select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Units</label>
              {isLoadingUnits ? (
                <div className="flex items-center space-x-2 text-sm text-gray-600 py-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                  <span>Loading units...</span>
                </div>
              ) : (
                <select
                  multiple
                  value={unitIds}
                  onChange={(e) => setUnitIds(Array.from(e.target.selectedOptions, (option) => option.value))}
                  className="w-full border border-blue-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-400 focus:border-blue-300 outline-none transition-all duration-200 min-h-[120px]"
                >
                  {units.map((unit: { id: string; name: string }) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
              )}
              <p className="mt-1.5 text-xs text-gray-500">
                Hold Ctrl/Cmd to select multiple units of measurement
              </p>
            </div>
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
                  <span>Create Standard</span>
                </>
              )}
            </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default AddStandard;