import React, { useState } from "react";
import { motion } from "framer-motion";
import api, { API_ROUTES } from "../../../../utils/api";
import { toast } from "react-toastify";
import { Folder, Save, X, AlertCircle, RefreshCw } from "lucide-react";

interface AddStandardCategoryProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const AddStandardCategory: React.FC<AddStandardCategoryProps> = ({ onSuccess, onCancel }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    
    try {
      const authToken = localStorage.getItem("authToken");
      await api.post(
        API_ROUTES.STANDARD.CREATE_STANDARD_CATEGORY,
        { name, description },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      
      toast.success("Category created successfully!", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      setName("");
      setDescription("");
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Failed to create category";
      setError(errorMsg);
      
      toast.error(errorMsg, {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      className="bg-white rounded-xl shadow-md border border-blue-100 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="p-6 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-blue-100">
        <div className="flex items-center gap-3">
          <Folder className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">Create New Category</h2>
        </div>
        <p className="text-gray-600 mt-1 pl-9">
          Create a new category to organize related standards and specifications.
        </p>
      </div>
      
      {error && (
        <motion.div 
          className="mx-6 my-4 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
          <div>
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

      <div className="p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Category Name*</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-blue-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-400 focus:border-blue-300 outline-none transition-all duration-200"
              placeholder="Enter category name"
              required
            />
            <p className="mt-1.5 text-xs text-gray-500">
              Choose a clear and specific name to identify this category (e.g., "ISO Standards", "Environmental Regulations")
            </p>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-blue-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-400 focus:border-blue-300 outline-none transition-all duration-200 min-h-[120px]"
              placeholder="Provide a description of this category (optional)"
            />
            <p className="mt-1.5 text-xs text-gray-500">
              Add details about what types of standards belong in this category and its purpose
            </p>
          </div>
          
          <div className="flex justify-end gap-3">
            {onCancel && (
              <motion.button
                type="button"
                onClick={onCancel}
                className="px-5 py-2.5 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isSubmitting}
              >
                <X size={16} />
                Cancel
              </motion.button>
            )}
            
            <motion.button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-md flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              whileHover={!isSubmitting ? { 
                scale: 1.02, 
                boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3), 0 4px 6px -2px rgba(59, 130, 246, 0.15)" 
              } : {}}
              whileTap={!isSubmitting ? { scale: 0.98 } : {}}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Create Category</span>
                </>
              )}
            </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default AddStandardCategory;