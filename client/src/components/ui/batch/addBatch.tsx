import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { API_ROUTES } from "../../../utils/api";
import { 
  AlertCircle, 
  PlusCircle, 
  X, 
  Save, 
  BarChart2,
  Droplets, 
  Beaker, 
  Layers,
  Check,
  Tag,
  ActivitySquare,
  ArrowRight,
  ChevronRight,
  RotateCw,
  PackagePlus,
  CalendarCheck,
  CalendarClock,
  FileSpreadsheet
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const AddBatch: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>("basic");
  const [newProductName, setNewProductName] = useState<string>(""); 
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]); 
  const [formData, setFormData] = useState({
    batchNumber: "",
    productId: "",
    dateOfProduction: "",
    bestBeforeDate: "",
    sampleAnalysisStarted: "",
    sampleAnalysisCompleted: "",
    sampleAnalysisStatus: "PENDING"
  });
  const [parameterValues, setParameterValues] = useState<Array<{
    parameterId: string;
    value: string;
    unitId?: string;
    methodologyId?: string;
  }>>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isComplete, setIsComplete] = useState<Record<string, boolean>>({
    basic: false,
    parameters: false
  });
  
  const authToken = localStorage.getItem("authToken");

  // API queries with proper error handling
  const { data: productsData = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      try {
        const response = await axios.get(API_ROUTES.PRODUCT.GET_PRODUCTS, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        return response.data?.products || [];
      } catch (error) {
        console.error("Error fetching products:", error);
        return [];
      }
    }
  });
  
  const { data: unitsData = [] } = useQuery({
    queryKey: ["units"],
    queryFn: async () => {
      try {
        const response = await axios.get(API_ROUTES.UNIT.GET_UNITS, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        return response.data?.units || [];
      } catch (error) {
        console.error("Error fetching units:", error);
        return [];
      }
    }
  });
  
  const { data: methodologiesData = [] } = useQuery({
    queryKey: ["methodologies"],
    queryFn: async () => {
      try {
        const response = await axios.get(API_ROUTES.METHODOLOGY.GET_METHODOLOGIES, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        return response.data?.methodologies || [];
      } catch (error) {
        console.error("Error fetching methodologies:", error);
        return [];
      }
    }
  });

  const { data: parametersData = [] } = useQuery({
    queryKey: ["parameters"],
    queryFn: async () => {
      try {
        const response = await axios.get(API_ROUTES.STANDARD.GET_STANDARD_PARAMETERS, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        return response.data?.parameters || [];
      } catch (error) {
        console.error("Error fetching parameters:", error);
        return [];
      }
    }
  });

  // Group parameters by category
  const parametersByCategory = React.useMemo(() => {
    if (!parametersData) return {};
    
    const grouped: Record<string, any[]> = {};
    parametersData.forEach((param: any) => {
      const categoryName = param.category?.name || "Uncategorized";
      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }
      grouped[categoryName].push(param);
    });
    return grouped;
  }, [parametersData]);

  // Form field handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Parameter value handlers
  const addParameterValue = (parameterId: string) => {
    const exists = parameterValues.some(pv => pv.parameterId === parameterId);
    if (exists) return;
    
    setParameterValues([
      ...parameterValues,
      { parameterId, value: "" }
    ]);
  };
  
  const removeParameterValue = (parameterId: string) => {
    setParameterValues(parameterValues.filter(pv => pv.parameterId !== parameterId));
  };
  
  const updateParameterValue = (parameterId: string, field: string, value: any) => {
    setParameterValues(parameterValues.map(pv => 
      pv.parameterId === parameterId ? { ...pv, [field]: value } : pv
    ));
  };

  // Check completion status of each section
  useEffect(() => {
    const basicComplete = 
    formData.batchNumber.trim() !== "" && 
    (formData.productId !== "" || newProductName.trim() !== "") && // Check for either productId or newProductName
    formData.dateOfProduction !== "" && 
    formData.bestBeforeDate !== "";
    
    const parametersComplete = parameterValues.length > 0;
    
    setIsComplete({
      basic: basicComplete,
      parameters: parametersComplete
    });
  }, [formData, parameterValues,newProductName]);

  // Create batch mutation
  const createBatchMutation = useMutation({
    mutationFn: async (batchData: any) => {
      const response = await axios.post(API_ROUTES.BATCH.CREATE_BATCH, batchData, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      return response.data;
    },
    onSuccess: () => {
      navigate("/batches");
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || "Failed to create batch");
      setIsSaving(false);
    }
  });

  // Handle save/submit
  const handleSave = () => {
    if (!isComplete.basic || !isComplete.parameters) {
      setError("Please complete all required fields before saving");
      return;
    }

    setIsSaving(true);
    
    // Transform form data to match API expectations
    const transformedData = {
      ...formData,
      productName: newProductName || undefined, // Include the new product name
      sampleAnalysisStarted: formData.sampleAnalysisStarted || null,
      sampleAnalysisCompleted: formData.sampleAnalysisCompleted || null,
      parameterValues,
    };
    
    // Submit the data
    createBatchMutation.mutate(transformedData);
  };

  // Navigation sections
  const sections = [
    { 
      id: "basic", 
      title: "Basic Information", 
      icon: <Layers size={20} />,
      color: "blue",
      isComplete: isComplete.basic
    },
    { 
      id: "parameters", 
      title: "Parameters", 
      icon: <Beaker size={20} />,
      color: "blue",
      isComplete: isComplete.parameters
    }
  ];

  return (
    <div className="mx-auto">
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start shadow-lg"
          >
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5" />
            <span>{error}</span>
            <button 
              className="ml-auto" 
              onClick={() => setError(null)}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="flex flex-col lg:flex-row gap-6 h-full">
        {/* Left sidebar navigation with blue-themed glassmorphism */}
        <div className="lg:w-72 flex-shrink-0">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="backdrop-blur-xl bg-white/30 p-5 rounded-xl shadow-lg border border-blue-200/40 relative overflow-hidden"
            style={{
              background: "linear-gradient(145deg, rgba(240, 249, 255, 0.5) 0%, rgba(219, 234, 254, 0.3) 100%)",
              boxShadow: "0 8px 32px rgba(30, 64, 175, 0.12)"
            }}
          >
            {/* Animated background elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-blue-300/20 to-blue-400/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-tr from-blue-300/20 to-blue-400/20 rounded-full blur-xl" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-blue-600/90 to-blue-700/90 rounded-lg backdrop-blur-sm shadow-inner shadow-white/10">
                  <PackagePlus size={24} className="text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Create Batch</h2>
              </div>
              
              <div className="mb-6">
                <motion.div 
                  className="w-full h-1.5 rounded-full overflow-hidden backdrop-blur-sm bg-white/30"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.5 }}
                >
                  <motion.div 
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
                    initial={{ width: '0%' }}
                    animate={{ 
                      width: isComplete.basic && isComplete.parameters ? '100%' : 
                             isComplete.basic ? '50%' : '10%' 
                    }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  />
                </motion.div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-600">Progress</span>
                  <span className="text-xs font-medium text-blue-700">
                    {isComplete.basic && isComplete.parameters ? '100%' : 
                     isComplete.basic ? '50%' : '10%'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                {sections.map((section, index) => {
                  const isActive = activeSection === section.id;
                  const colorClasses = "from-blue-600/80 to-blue-500/80 border-blue-300/50";
                  
                  return (
                    <motion.div 
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`relative rounded-xl cursor-pointer overflow-hidden backdrop-blur-sm
                        ${isActive ? 'ring-1 ring-white/70 shadow-lg' : 'opacity-90 hover:opacity-100'}`}
                      whileHover={{ scale: 1.03, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-r ${colorClasses} opacity-${isActive ? '90' : '70'}`} 
                           style={{ backdropFilter: "blur(4px)" }} />
                      
                      <div className="relative p-4 flex items-center">
                        <div className={`rounded-lg p-2 ${isActive ? 'bg-white/25' : 'bg-white/15'} mr-3`}>
                          {section.icon}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-white">{section.title}</div>
                          {section.isComplete ? (
                            <div className="flex items-center text-xs text-white/90 mt-1">
                              <Check size={12} className="mr-1" /> Complete
                            </div>
                          ) : (
                            <div className="text-xs text-white/80 mt-1">Required</div>
                          )}
                        </div>
                        <div>
                          <ChevronRight size={20} className={`text-white/70 ${isActive ? 'opacity-100' : 'opacity-50'}`} />
                        </div>
                        
                        {/* Glass highlight for active section */}
                        {isActive && (
                          <motion.div
                            className="absolute inset-0 rounded-xl z-[-1]"
                            style={{ background: "linear-gradient(120deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 100%)" }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                          />
                        )}
                        
                        {/* Pulsing animation for active section */}
                        {isActive && (
                          <motion.div
                            className="absolute -inset-0.5 rounded-xl bg-white/20 z-[-1]"
                            animate={{ 
                              opacity: [0.1, 0.2, 0.1],
                              scale: [1, 1.01, 1]
                            }}
                            transition={{ 
                              repeat: Infinity, 
                              duration: 2,
                              ease: "easeInOut"
                            }}
                          />
                        )}
                      </div>
                      
                      {/* Progress indicator */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/20" />
                      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-white transition-all duration-300 ${index === 0 ? 'h-full' : isComplete.basic ? 'h-full' : 'h-0'}`} />
                    </motion.div>
                  );
                })}
              </div>
              
              <div className="mt-8">
                <motion.button
                  onClick={handleSave}
                  disabled={isSaving || !isComplete.basic || !isComplete.parameters}
                  className={`w-full py-3 px-4 rounded-xl font-medium relative overflow-hidden backdrop-blur-sm ${
                    isSaving || !isComplete.basic || !isComplete.parameters
                      ? "bg-gray-400/50 text-gray-600 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600/90 to-blue-700/90 text-white hover:shadow-lg hover:shadow-blue-500/20"
                  }`}
                  style={{
                    boxShadow: isSaving || !isComplete.basic || !isComplete.parameters ? 
                      "none" : 
                      "0 4px 15px rgba(37, 99, 235, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                  }}
                  whileHover={{ scale: isSaving || !isComplete.basic || !isComplete.parameters ? 1 : 1.02 }}
                  whileTap={{ scale: isSaving || !isComplete.basic || !isComplete.parameters ? 1 : 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  {/* Animated background for save button - subtle waves */}
                  {!(isSaving || !isComplete.basic || !isComplete.parameters) && (
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"
                      animate={{ 
                        x: ['-100%', '100%'],
                      }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: 4,
                        ease: "easeInOut"
                      }}
                    />
                  )}
                  
                  <span className="relative flex items-center justify-center gap-2">
                    {isSaving ? (
                      <>
                        <RotateCw className="h-5 w-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Save Batch
                      </>
                    )}
                  </span>
                </motion.button>
              </div>
              
              <div className="mt-5 text-gray-600 text-xs text-center">
                Make sure all required fields are completed
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Main content area */}
        <div className="flex-1">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white p-6 rounded-lg shadow-md border border-blue-100 relative overflow-hidden"
          >
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-b from-blue-50 to-transparent rounded-bl-full opacity-70" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-t from-blue-50 to-transparent rounded-tr-full opacity-70" />
            
            <AnimatePresence mode="wait">
              {/* Basic Information Section */}
              {activeSection === "basic" && (
                <motion.div
                  key="basic-section"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="relative"
                >
                  <header className="mb-6">
                    <motion.div 
                      className="flex items-center gap-2"
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Layers size={22} className="text-blue-600" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-800">Basic Batch Information</h2>
                    </motion.div>
                    <motion.p 
                      className="text-gray-600 mt-1 pl-11"
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      Enter the core details about this batch.
                    </motion.p>
                  </header>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    {/* Batch Number */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Batch Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <FileSpreadsheet size={16} className="absolute top-3 left-3 text-gray-400" />
                        <input
                          type="text"
                          name="batchNumber"
                          value={formData.batchNumber}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-lg pl-10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter batch number"
                          required
                        />
                      </div>
                    </motion.div>
                    
                    {/* Product */}
                    <motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.4 }}
>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Product <span className="text-red-500">*</span>
  </label>
  <div className="relative">
    <Tag size={16} className="absolute top-3 left-3 text-gray-400" />
    <input
      type="text"
      name="productName"
      value={newProductName}
      onChange={(e) => {
        const value = e.target.value;
        setNewProductName(value); // Track the custom product name

        // Filter suggestions based on input
        const suggestions = productsData.filter((product: any) =>
          product.name.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredProducts(suggestions);

        // Update formData.productId if the product exists in the database
        const matchedProduct = productsData.find((product: any) => product.name === value);
        setFormData((prev) => ({
          ...prev,
          productId: matchedProduct ? matchedProduct.id : "",
        }));
      }}
      className="w-full border border-gray-300 rounded-lg pl-10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      placeholder="Type to search or add a new product"
      required
    />
    {newProductName && !productsData.some((product: any) => product.name === newProductName) && (
      <span className="absolute top-3 right-3 text-green-500 text-xs font-medium">
        New
      </span>
    )}
  </div>

  {/* Suggestions Dropdown */}
  {newProductName && filteredProducts.length > 0 && (
    <ul className="absolute z-10 bg-white border border-gray-300 rounded-lg shadow-lg mt-1 w-full max-h-40 overflow-y-auto">
      {filteredProducts.map((product: any) => (
        <li
          key={product.id}
          onClick={() => {
            setNewProductName(product.name);
            setFormData((prev) => ({
              ...prev,
              productId: product.id,
            }));
            setFilteredProducts([]); // Clear suggestions
          }}
          className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
        >
          {product.name}
        </li>
      ))}
      {!filteredProducts.some((product: any) => product.name === newProductName) && (
        <li className="px-4 py-2 text-green-500 font-medium">
          {newProductName} (New)
        </li>
      )}
    </ul>
  )}
</motion.div>
                    
                    {/* Date of Production */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date of Production <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <CalendarClock size={16} className="absolute top-3 left-3 text-gray-400" />
                        <input
                          type="date"
                          name="dateOfProduction"
                          value={formData.dateOfProduction}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-lg pl-10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                    </motion.div>
                    
                    {/* Best Before Date */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Best Before Date <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <CalendarCheck size={16} className="absolute top-3 left-3 text-gray-400" />
                        <input
                          type="date"
                          name="bestBeforeDate"
                          value={formData.bestBeforeDate}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-lg pl-10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                    </motion.div>
                    
                    {/* Sample Analysis Started */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sample Analysis Started
                      </label>
                      <div className="relative">
                        <ActivitySquare size={16} className="absolute top-3 left-3 text-gray-400" />
                        <input
                          type="date"
                          name="sampleAnalysisStarted"
                          value={formData.sampleAnalysisStarted}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-lg pl-10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </motion.div>
                    
                    {/* Sample Analysis Completed */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sample Analysis Completed
                      </label>
                      <div className="relative">
                        <ActivitySquare size={16} className="absolute top-3 left-3 text-gray-400" />
                        <input
                          type="date"
                          name="sampleAnalysisCompleted"
                          value={formData.sampleAnalysisCompleted}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-lg pl-10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </motion.div>
                    
                    {/* Sample Analysis Status */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9 }}
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sample Analysis Status
                      </label>
                      <div className="relative">
                        <Droplets size={16} className="absolute top-3 left-3 text-gray-400" />
                        <select
                          name="sampleAnalysisStatus"
                          value={formData.sampleAnalysisStatus}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-lg pl-10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                        </select>
                        <ChevronRight size={16} className="absolute top-3 right-3 text-gray-400 pointer-events-none transform rotate-90" />
                      </div>
                    </motion.div>
                  </div>
                  
                  <motion.div 
                    className="mt-8 flex justify-end"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                  >
                    <motion.button
                      type="button"
                      onClick={() => setActiveSection("parameters")}
                      disabled={!isComplete.basic}
                      className={`flex items-center gap-2 py-2 px-6 rounded-lg text-white ${
                        isComplete.basic
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 shadow-md shadow-blue-100 hover:shadow-lg hover:shadow-blue-200"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                      whileHover={isComplete.basic ? { scale: 1.03 } : {}}
                      whileTap={isComplete.basic ? { scale: 0.97 } : {}}
                    >
                      Next: Parameters
                      <ArrowRight size={16} />
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}
              
              {/* Parameters Section */}
              {activeSection === "parameters" && (
                <motion.div
                  key="parameters-section"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="relative"
                >
                  <header className="mb-6">
                    <motion.div 
                      className="flex items-center gap-2"
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Beaker size={22} className="text-blue-600" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-800">Parameter Values</h2>
                    </motion.div>
                    <motion.p 
                      className="text-gray-600 mt-1 pl-11"
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      Specify test parameters and their values.
                    </motion.p>
                  </header>
                  
                  <div className="space-y-6">
                    {Object.entries(parametersByCategory).map(([categoryName, parameters], categoryIndex) => (
                      <motion.div 
                        key={categoryName}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + categoryIndex * 0.1 }}
                        className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border border-blue-200 shadow-sm"
                      >
                        <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                          <Tag size={18} className="mr-2 text-blue-600" />
                          {categoryName} Parameters
                        </h3>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {parameters.map((parameter: any, index: number) => {
                            const paramValue = parameterValues.find(pv => pv.parameterId === parameter.id);
                            const isAdded = !!paramValue;
                            
                            return (
                              <motion.div 
                                key={parameter.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 + index * 0.05 }}
                                whileHover={{ scale: 1.01 }}
                                className={`border ${
                                  isAdded 
                                    ? 'bg-blue-50 border-blue-300' 
                                    : 'bg-white border-gray-200'
                                } rounded-xl p-4 shadow-sm relative overflow-hidden`}
                              >
                                <div className="flex justify-between items-center mb-3 relative z-10">
                                  <div className="flex items-center">
                                    <span className="text-base font-medium text-gray-800">{parameter.name}</span>
                                    {isAdded && (
                                      <motion.span 
                                        className="ml-2 bg-blue-100 text-blue-700 text-xs py-0.5 px-2 rounded-full"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring" }}
                                      >
                                        Added
                                      </motion.span>
                                    )}
                                  </div>
                                  
                                  {isAdded ? (
                                    <motion.button
                                      type="button"
                                      onClick={() => removeParameterValue(parameter.id)}
                                      className="text-red-500 hover:text-red-700 transition-colors p-1 hover:bg-red-50 rounded-full"
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                    >
                                      <X size={18} />
                                    </motion.button>
                                  ) : (
                                    <motion.button
                                      type="button"
                                      onClick={() => addParameterValue(parameter.id)}
                                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm transition-colors bg-blue-50 hover:bg-blue-100 rounded-lg py-1 px-3"
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                    >
                                      <PlusCircle size={16} />
                                      <span>Add</span>
                                    </motion.button>
                                  )}
                                </div>
                                
                                {isAdded && (
                                  <motion.div 
                                    className="space-y-4 relative z-10"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    transition={{ duration: 0.3 }}
                                  >
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                                      <input
                                        type="text"
                                        value={paramValue.value}
                                        onChange={(e) => updateParameterValue(parameter.id, 'value', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter value"
                                      />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                                        <div className="relative">
                                          <select
                                            value={paramValue.unitId || ""}
                                            onChange={(e) => updateParameterValue(parameter.id, 'unitId', e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none pr-8"
                                          >
                                            <option value="">No Unit</option>
                                            {unitsData?.map((unit: any) => (
                                              <option key={unit.id} value={unit.id}>
                                                {unit.name} ({unit.symbol})
                                              </option>
                                            ))}
                                          </select>
                                          <ChevronRight size={16} className="absolute top-3 right-3 text-gray-400 pointer-events-none transform rotate-90" />
                                        </div>
                                      </div>
                                      
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Methodology</label>
                                        <div className="relative">
                                          <select
                                            value={paramValue.methodologyId || ""}
                                            onChange={(e) => updateParameterValue(parameter.id, 'methodologyId', e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none pr-8"
                                          >
                                            <option value="">No Methodology</option>
                                            {methodologiesData?.map((methodology: any) => (
                                              <option key={methodology.id} value={methodology.id}>
                                                {methodology.name}
                                              </option>
                                            ))}
                                          </select>
                                          <ChevronRight size={16} className="absolute top-3 right-3 text-gray-400 pointer-events-none transform rotate-90" />
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      </motion.div>
                    ))}
                    
                    {Object.keys(parametersByCategory).length === 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center p-10 bg-gray-50 border border-gray-200 rounded-xl"
                      >
                        <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                          <BarChart2 size={30} className="text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">No parameters available.</p>
                        <p className="text-gray-400 text-sm mt-1">Please create parameters first.</p>
                      </motion.div>
                    )}
                  </div>
                  
                  <motion.div 
                    className="mt-8 flex justify-between"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <motion.button
                      type="button"
                      onClick={() => setActiveSection("basic")}
                      className="py-2 px-6 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      Back to Basic Info
                    </motion.button>
                    
                    <motion.button
                      type="button"
                      onClick={handleSave}
                      disabled={isSaving || !isComplete.basic || !isComplete.parameters}
                      className={`py-2 px-6 rounded-lg flex items-center gap-2 ${
                        isSaving || !isComplete.basic || !isComplete.parameters
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md shadow-green-100 hover:shadow-lg hover:shadow-green-200"
                      }`}
                      whileHover={!(isSaving || !isComplete.basic || !isComplete.parameters) ? { scale: 1.03 } : {}}
                      whileTap={!(isSaving || !isComplete.basic || !isComplete.parameters) ? { scale: 0.97 } : {}}
                    >
                      {isSaving ? (
                        <>
                          <RotateCw className="h-5 w-5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          Save Batch
                        </>
                      )}
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AddBatch;