import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_ROUTES } from '../../../utils/api';
import {
  AlertCircle,
  PlusCircle,
  X,
  Save,
  BarChart2,
  Beaker,
  Check,
  Tag,
  ActivitySquare,
  ChevronDown,
  RotateCw,
  PackagePlus,
  FileSpreadsheet,
  Zap,
  Sparkles,
  Calendar,
  Package,
  ChevronRight,
  Clock,
  Shield,
  Layers,
  ArrowLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAutoSave } from '../../../hooks/useAutoSave';

// Enhanced animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

// Enhanced Status Indicator
const StatusIndicator = ({
  isValid,
  label,
}: {
  isValid: boolean;
  label: string;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
      isValid
        ? 'bg-green-100 text-green-700 border border-green-200'
        : 'bg-amber-100 text-amber-700 border border-amber-200'
    }`}
  >
    {isValid ? <Check size={14} /> : <Clock size={14} />}
    {label}
  </motion.div>
);

// Enhanced Parameter Card

const AddBatch: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [newProductName, setNewProductName] = useState<string>('');
  const [formData, setFormData] = useState({
    batchNumber: '',
    productId: '',
    dateOfProduction: '',
    bestBeforeDate: '',
    sampleAnalysisStarted: '',
    sampleAnalysisCompleted: '',
    sampleAnalysisStatus: 'PENDING',
  });
  const [parameterValues, setParameterValues] = useState<
    Array<{
      parameterId: string;
      value: string;
      unitId?: string;
    }>
  >([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [, setExpandedCategories] = useState<{ [key: string]: boolean }>({});
  const [draftFetchedAt, setDraftFetchedAt] = useState<string | null>(null);

  const authToken = localStorage.getItem('authToken');
  const [draftId, setDraftId] = useState<string | null>(null);

  // API queries with proper error handling
  const { data: productsData = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      try {
        const response = await axios.get(API_ROUTES.PRODUCT.GET_PRODUCTS, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        return response.data?.products || [];
      } catch (error) {
        console.error('Error fetching products:', error);
        return [];
      }
    },
  });

  // Product-specific parameters query
  const { data: productParametersData, isLoading: isLoadingProductParameters } =
    useQuery({
      queryKey: ['productParameters', selectedProductId],
      queryFn: async () => {
        if (!selectedProductId) return { parametersByCategory: {} };

        try {
          const response = await axios.get(
            API_ROUTES.PRODUCT.GET_PARAMETERS_BY_PRODUCT_ID(selectedProductId),
            { headers: { Authorization: `Bearer ${authToken}` } }
          );
          return response.data || { parametersByCategory: {} };
        } catch (error) {
          console.error('Error fetching product parameters:', error);
          return { parametersByCategory: {} };
        }
      },
      enabled: !!selectedProductId,
    });

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const draftIdFromUrl = searchParams.get('draftId');

  // Update the useEffect for fetching draft (around line 271)
  useEffect(() => {
    const fetchDraft = async () => {
      try {
        let draftData;

        // If draft ID is provided in URL, fetch that specific draft
        if (draftIdFromUrl) {
          const response = await axios.get(
            API_ROUTES.DRAFT.GET_BATCH(draftIdFromUrl),
            { headers: { Authorization: `Bearer ${authToken}` } }
          );
          draftData = response.data;
        } else {
          // Otherwise, fetch the latest draft
          const response = await axios.get(
            API_ROUTES.DRAFT.GET_LATEST_BATCH_DRAFT,
            { headers: { Authorization: `Bearer ${authToken}` } }
          );
          draftData = response.data;
        }

        console.log('draftData', draftData);

        setDraftId(draftData.id);
        setFormData({
          batchNumber: draftData.batchNumber || '',
          productId: draftData.productId || '',
          dateOfProduction: toDateInputString(draftData.dateOfProduction),
          bestBeforeDate: toDateInputString(draftData.bestBeforeDate),
          sampleAnalysisStarted: toDateInputString(
            draftData.sampleAnalysisStarted
          ),
          sampleAnalysisCompleted: toDateInputString(
            draftData.sampleAnalysisCompleted
          ),
          sampleAnalysisStatus: draftData.sampleAnalysisStatus || 'PENDING',
        });
        setSelectedProductId(draftData.productId || '');
        setParameterValues(draftData.parameterValues || []);
        setNewProductName(draftData.newProductName || '');
        setDraftFetchedAt(draftData.updatedAt || draftData.createdAt || null);
      } catch (error) {
        // No draft found or error, do nothing
        console.log('No draft found');
      }
    };

    if (authToken) {
      fetchDraft();
    }
  }, [authToken, draftIdFromUrl]);

 
    // Auto-expand first category when parameters load
    useEffect(() => {
      if (productParametersData?.parametersByCategory) {
        const categories = Object.keys(
          productParametersData.parametersByCategory
        );
        if (categories.length > 0) {
          setExpandedCategories({ [categories[0]]: true });
        }
      }
    }, [productParametersData]);

  // Form field handlers
    const handleInputChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    };

  // Product selection handler
    const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;

      if (value === 'new') {
        setShowNewProductForm(true);
        setSelectedProductId('');
        setFormData((prev) => ({ ...prev, productId: '' }));
      } else {
        setShowNewProductForm(false);
        setSelectedProductId(value);
        setFormData((prev) => ({ ...prev, productId: value }));
        setNewProductName('');
      }
    };

  // Check if form is valid
  useEffect(() => {
    const basicInfoValid =
      formData.batchNumber.trim() !== '' &&
      (formData.productId !== '' || newProductName.trim() !== '') &&
      formData.dateOfProduction !== '' &&
      formData.bestBeforeDate !== '';

    const parametersValid =
      parameterValues.length > 0 &&
      parameterValues.every((pv) => pv.value.trim() !== '');

    setIsFormValid(basicInfoValid && parametersValid);
  }, [formData, parameterValues, newProductName]);

  // Create batch mutation
   const createBatchMutation = useMutation({
     mutationFn: async (batchData: any) => {
       const response = await axios.post(
         API_ROUTES.BATCH.CREATE_BATCH,
         batchData,
         {
           headers: { Authorization: `Bearer ${authToken}` },
         }
       );
       return response.data;
     },
     onSuccess: async () => {
       // Delete draft if it exists
       if (draftId) {
         try {
           await axios.delete(API_ROUTES.DRAFT.DELETE_BATCH(draftId), {
             headers: { Authorization: `Bearer ${authToken}` },
           });
         } catch (error) {
           console.error('Error deleting draft after submission:', error);
         }
       }
       navigate('/batches');
     },
     onError: (error: any) => {
       setError(error.response?.data?.message || 'Failed to create batch');
       setIsSaving(false);
     },
   });

  // Handle save/submit
  const handleSave = () => {
    if (!isFormValid) {
      setError('Please complete all required fields before saving');
      return;
    }

    setIsSaving(true);

    const transformedData = {
      ...formData,
      productName: formData.productId ? undefined : newProductName,
      sampleAnalysisStarted: formData.sampleAnalysisStarted || null,
      sampleAnalysisCompleted: formData.sampleAnalysisCompleted || null,
      parameterValues,
      status: 'SUBMITTED',
    };

    createBatchMutation.mutate(transformedData);
  };

  const handleDeleteDraft = async () => {
    if (!draftId) return;

    try {
      await axios.delete(API_ROUTES.DRAFT.DELETE_BATCH(draftId), {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      // Clear form
      setFormData({
        batchNumber: '',
        productId: '',
        dateOfProduction: '',
        bestBeforeDate: '',
        sampleAnalysisStarted: '',
        sampleAnalysisCompleted: '',
        sampleAnalysisStatus: 'PENDING',
      });
      setParameterValues([]);
      setNewProductName('');
      setDraftId(null);
      setDraftFetchedAt(null);
    } catch (error) {
      console.error('Error deleting draft:', error);
      setError('Failed to delete draft');
    }
  };

  const parametersByCategory =
    productParametersData?.parametersByCategory || {};

  // Calculate validation stats
  const basicInfoComplete =
    formData.batchNumber &&
    (formData.productId || newProductName) &&
    formData.dateOfProduction &&
    formData.bestBeforeDate;
  const parametersComplete =
    parameterValues.length > 0 &&
    parameterValues.every((pv) => pv.value.trim() !== '');

  useAutoSave({
    saveUrl: API_ROUTES.DRAFT.SAVE_BATCH,
    getUrl: draftId ? API_ROUTES.DRAFT.GET_BATCH(draftId) : undefined,
    data: { formData, parameterValues, newProductName },
    isSuccess: createBatchMutation.isSuccess,
    authToken: authToken || '',
    draftId,
    onDraftIdChange: setDraftId,
  });

  function toDateInputString(dateStr: string | null | undefined) {
    if (!dateStr) return '';
    // Handles ISO string to "YYYY-MM-DD"
    return new Date(dateStr).toISOString().slice(0, 10);
  }

  useEffect(() => {
    const fetchLatestDraft = async () => {
      try {
        const response = await axios.get(
          API_ROUTES.DRAFT.GET_LATEST_BATCH_DRAFT, // e.g. '/api/draft/batch-latest'
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        const draftData = response.data;
        console.log('draftData', draftData);

        setDraftId(draftData.id);
        setFormData({
          batchNumber: draftData.batchNumber || '',
          productId: draftData.productId || '',
          dateOfProduction: toDateInputString(draftData.dateOfProduction),
          bestBeforeDate: toDateInputString(draftData.bestBeforeDate),
          sampleAnalysisStarted: toDateInputString(
            draftData.sampleAnalysisStarted
          ),
          sampleAnalysisCompleted: toDateInputString(
            draftData.sampleAnalysisCompleted
          ),
          sampleAnalysisStatus: draftData.sampleAnalysisStatus || 'PENDING',
        });
        setSelectedProductId(draftData.productId || '');
        setParameterValues(draftData.parameterValues || []);
        setNewProductName(draftData.newProductName || '');
        setDraftFetchedAt(draftData.updatedAt || draftData.createdAt || null);
      } catch (error) {
        // No draft found or error, do nothing
      }
    };
    fetchLatestDraft();
  }, [authToken]);

  function formatDraftDate(dateStr: string | null) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    // Format as "YYYY-MM-DD, HH:mm"
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto p-6">
        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="mb-6 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-start shadow-lg backdrop-blur-sm"
            >
              <AlertCircle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <span className="font-medium">{error}</span>
              </div>
              <button
                className="ml-3 hover:bg-red-100 p-1 rounded-lg transition-colors"
                onClick={() => setError(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Header with Progress */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-8"
        >
          <div className="relative bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-6 border-b border-gray-100">
            <div className="absolute top-0 right-0 -mt-2 -mr-2">
              <Sparkles size={60} className="text-blue-100 opacity-50" />
            </div>

            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/batches')}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                >
                  <ArrowLeft size={16} className="text-gray-600" />
                  <span className="text-gray-700 font-medium">
                    Back to Batches
                  </span>
                </motion.button>

                <div className="flex gap-3">
                  <StatusIndicator
                    isValid={!!basicInfoComplete}
                    label="Basic Info"
                  />
                  <StatusIndicator
                    isValid={parametersComplete}
                    label="Parameters"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <PackagePlus className="text-blue-600" size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Create New Batch
                  </h1>
                  <p className="text-gray-600 text-sm mt-0.5">
                    Define batch details and configure quality parameters for
                    production tracking
                  </p>
                </div>
                {draftFetchedAt && (
                  <div className="mt-2 flex items-center gap-2 text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1 text-sm font-medium">
                    <Clock size={14} className="mr-1" />
                    Fetched data from your latest draft:{' '}
                    {formatDraftDate(draftFetchedAt)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="p-4 bg-gradient-to-r from-gray-50/50 to-blue-50/50">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Form Completion</span>
              <span>
                {Math.round(
                  (basicInfoComplete ? 50 : 0) + (parametersComplete ? 50 : 0)
                )}
                %
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                initial={{ width: '0%' }}
                animate={{
                  width: `${(basicInfoComplete ? 50 : 0) + (parametersComplete ? 50 : 0)}%`,
                }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full"
              />
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Enhanced Basic Information */}
          <motion.div variants={itemVariants} className="xl:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <FileSpreadsheet size={20} className="mr-3 text-blue-600" />
                  Basic Information
                  {basicInfoComplete && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-3 p-1 bg-green-100 rounded-full"
                    >
                      <Check size={12} className="text-green-600" />
                    </motion.div>
                  )}
                </h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Batch Number */}
                <motion.div whileHover={{ scale: 1.01 }} className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Batch Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="batchNumber"
                      value={formData.batchNumber}
                      onChange={handleInputChange}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white pl-12"
                      placeholder="Enter unique batch identifier"
                      required
                    />
                    <Package
                      size={16}
                      className="absolute left-4 top-3.5 text-gray-400"
                    />
                  </div>
                </motion.div>

                {/* Product Selection */}
                <motion.div whileHover={{ scale: 1.01 }} className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Product <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={showNewProductForm ? 'new' : selectedProductId}
                      onChange={handleProductChange}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white appearance-none cursor-pointer pl-12"
                      required
                    >
                      <option value="">Choose product type</option>
                      {productsData.map((product: any) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                      <option value="new">➕ Create New Product</option>
                    </select>
                    <Tag
                      size={16}
                      className="absolute left-4 top-3.5 text-gray-400 pointer-events-none"
                    />
                    <ChevronDown
                      size={16}
                      className="absolute top-3.5 right-4 text-gray-400 pointer-events-none"
                    />
                  </div>

                  <AnimatePresence>
                    {showNewProductForm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                          <div className="flex items-center text-green-700 font-medium text-sm mb-3">
                            <PlusCircle size={16} className="mr-2" />
                            Creating New Product
                          </div>
                          <input
                            type="text"
                            value={newProductName}
                            onChange={(e) => setNewProductName(e.target.value)}
                            className="w-full border border-green-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-white"
                            placeholder="Enter new product name"
                            required
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Date Fields */}
                <div className="grid grid-cols-1 gap-4">
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    className="space-y-2"
                  >
                    <label className="block text-sm font-semibold text-gray-700">
                      Production Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        name="dateOfProduction"
                        value={formData.dateOfProduction}
                        onChange={handleInputChange}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white pl-12"
                        required
                      />
                      <Calendar
                        size={16}
                        className="absolute left-4 top-3.5 text-gray-400"
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    className="space-y-2"
                  >
                    <label className="block text-sm font-semibold text-gray-700">
                      Best Before Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        name="bestBeforeDate"
                        value={formData.bestBeforeDate}
                        onChange={handleInputChange}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white pl-12"
                        required
                      />
                      <Clock
                        size={16}
                        className="absolute left-4 top-3.5 text-gray-400"
                      />
                    </div>
                  </motion.div>
                </div>

                {/* Enhanced Sample Analysis Section */}
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100"
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Beaker size={18} className="mr-2 text-blue-600" />
                    Sample Analysis
                    <div className="ml-auto">
                      <Shield size={16} className="text-blue-500" />
                    </div>
                  </h3>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Analysis Started
                        </label>
                        <input
                          type="date"
                          name="sampleAnalysisStarted"
                          value={formData.sampleAnalysisStarted}
                          onChange={handleInputChange}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Analysis Completed
                        </label>
                        <input
                          type="date"
                          name="sampleAnalysisCompleted"
                          value={formData.sampleAnalysisCompleted}
                          onChange={handleInputChange}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <div className="relative">
                        <select
                          name="sampleAnalysisStatus"
                          value={formData.sampleAnalysisStatus}
                          onChange={handleInputChange}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white appearance-none"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                        </select>
                        <ChevronDown
                          size={16}
                          className="absolute top-3 right-3 text-gray-400 pointer-events-none"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Enhanced Parameters Section */}
          <motion.div variants={itemVariants} className="xl:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    <Zap size={20} className="mr-3 text-blue-600" />
                    Quality Parameters
                    {parametersComplete && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-3 p-1 bg-green-100 rounded-full"
                      >
                        <Check size={12} className="text-green-600" />
                      </motion.div>
                    )}
                  </h2>

                  <div className="flex items-center gap-3">
                    {parameterValues.length > 0 && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full flex items-center gap-1">
                        <Layers size={12} />
                        {parameterValues.length} filled
                      </span>
                    )}

                    {!selectedProductId && !showNewProductForm && (
                      <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-lg">
                        Select product first
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6">
                {isLoadingProductParameters && selectedProductId && (
                  <div className="flex items-center justify-center p-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <div className="flex flex-col items-center space-y-4">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 2,
                          ease: 'linear',
                          repeat: Infinity,
                        }}
                      >
                        <RotateCw size={32} className="text-blue-500" />
                      </motion.div>
                      <p className="text-gray-700 font-medium">
                        Loading quality parameters...
                      </p>
                      <p className="text-gray-500 text-sm">
                        Fetching product-specific test requirements
                      </p>
                    </div>
                  </div>
                )}

                {selectedProductId &&
                  !isLoadingProductParameters &&
                  Object.keys(parametersByCategory).length === 0 && (
                    <div className="text-center p-16 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-200">
                      <BarChart2
                        size={48}
                        className="mx-auto mb-4 text-gray-400"
                      />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">
                        No Parameters Configured
                      </h3>
                      <p className="text-gray-500 mb-4">
                        This product doesn't have any quality parameters set up
                        yet.
                      </p>
                      <div className="text-sm text-gray-400">
                        Contact your administrator to configure parameters for
                        this product.
                      </div>
                    </div>
                  )}

                {!selectedProductId &&
                  !showNewProductForm &&
                  !isLoadingProductParameters && (
                    <div className="text-center p-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <Tag size={48} className="mx-auto mb-4 text-blue-400" />
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        Choose Product Type
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Select a product to view and configure its quality
                        testing parameters.
                      </p>
                      <div className="text-sm text-gray-500">
                        Quality parameters are product-specific and ensure
                        compliance standards.
                      </div>
                    </div>
                  )}

                {selectedProductId &&
                  !isLoadingProductParameters &&
                  Object.keys(parametersByCategory).length > 0 && (
                    <div className="space-y-6">
                      {Object.entries(parametersByCategory).map(
                        ([categoryName, parameters], categoryIndex) => {
                          const categoryParams = Array.isArray(parameters)
                            ? parameters
                            : [];
                          const filledParams = categoryParams.filter(
                            (p: any) => {
                              const paramValue = parameterValues.find(
                                (pv) => pv.parameterId === p.id
                              );
                              return (
                                paramValue && paramValue.value.trim() !== ''
                              );
                            }
                          );
                          const categoryProgress =
                            categoryParams.length > 0
                              ? Math.round(
                                  (filledParams.length /
                                    categoryParams.length) *
                                    100
                                )
                              : 0;

                          return (
                            <motion.div
                              key={categoryName}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: categoryIndex * 0.1 }}
                              className="border border-gray-200 rounded-xl overflow-hidden bg-gradient-to-br from-white to-gray-50"
                            >
                              {/* Category Header */}
                              <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <div className="p-2 bg-blue-100 rounded-lg mr-3">
                                      <ActivitySquare
                                        size={16}
                                        className="text-blue-600"
                                      />
                                    </div>
                                    <div>
                                      <h3 className="font-bold text-gray-800">
                                        {categoryName}
                                      </h3>
                                      <div className="flex items-center gap-2 mt-1">
                                        <div className="flex items-center text-xs text-gray-500">
                                          <div className="w-16 h-1.5 bg-gray-200 rounded-full mr-2">
                                            <motion.div
                                              initial={{ width: '0%' }}
                                              animate={{
                                                width: `${categoryProgress}%`,
                                              }}
                                              className="h-full bg-blue-500 rounded-full"
                                            />
                                          </div>
                                          {filledParams.length}/
                                          {categoryParams.length} completed
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Simplified Parameters Table */}
                              <div className="p-0">
                                <div className="overflow-x-auto">
                                  <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                      <tr>
                                        <th className="text-left p-4 font-semibold text-gray-700 text-sm">
                                          Parameter
                                        </th>
                                        <th className="text-left p-4 font-semibold text-gray-700 text-sm w-32">
                                          Value
                                        </th>
                                        <th className="text-left p-4 font-semibold text-gray-700 text-sm w-32">
                                          Unit
                                        </th>
                                        <th className="text-center p-4 font-semibold text-gray-700 text-sm w-20">
                                          Status
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {categoryParams.map(
                                        (
                                          parameter: any,
                                          paramIndex: number
                                        ) => {
                                          const paramValue =
                                            parameterValues.find(
                                              (pv) =>
                                                pv.parameterId === parameter.id
                                            );
                                          const hasValue =
                                            paramValue &&
                                            paramValue.value.trim() !== '';

                                          return (
                                            <motion.tr
                                              key={parameter.id}
                                              initial={{ opacity: 0 }}
                                              animate={{ opacity: 1 }}
                                              transition={{
                                                delay: paramIndex * 0.05,
                                              }}
                                              className={`border-b border-gray-100 hover:bg-blue-50/30 transition-colors ${
                                                hasValue ? 'bg-green-50/30' : ''
                                              }`}
                                            >
                                              <td className="p-4">
                                                <div>
                                                  <div className="font-medium text-gray-800">
                                                    {parameter.name}
                                                  </div>
                                                  {parameter.description && (
                                                    <div className="text-xs text-gray-500 mt-0.5">
                                                      {parameter.description}
                                                    </div>
                                                  )}
                                                </div>
                                              </td>
                                              <td className="p-4">
                                                <input
                                                  type="text"
                                                  value={
                                                    paramValue?.value || ''
                                                  }
                                                  onChange={(e) => {
                                                    const value =
                                                      e.target.value;
                                                    const existingParam =
                                                      parameterValues.find(
                                                        (pv) =>
                                                          pv.parameterId ===
                                                          parameter.id
                                                      );

                                                    if (existingParam) {
                                                      // Update existing parameter
                                                      setParameterValues(
                                                        parameterValues.map(
                                                          (pv) =>
                                                            pv.parameterId ===
                                                            parameter.id
                                                              ? { ...pv, value }
                                                              : pv
                                                        )
                                                      );
                                                    } else {
                                                      // Add new parameter with the associated unit ID from parameter
                                                      setParameterValues([
                                                        ...parameterValues,
                                                        {
                                                          parameterId:
                                                            parameter.id,
                                                          value,
                                                          unitId:
                                                            parameter.unitId, // Use parameter's unitId directly
                                                        },
                                                      ]);
                                                    }
                                                  }}
                                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                                  placeholder="Enter value"
                                                />
                                              </td>
                                              <td className="p-4">
                                                <div className="flex items-center">
                                                  {parameter.unit ? (
                                                    <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-medium text-sm">
                                                      {parameter.unit.symbol}
                                                    </span>
                                                  ) : (
                                                    <span className="text-gray-400 italic text-sm">
                                                      No unit
                                                    </span>
                                                  )}
                                                </div>
                                              </td>
                                              <td className="p-4 text-center">
                                                <motion.div
                                                  initial={{ scale: 0 }}
                                                  animate={{ scale: 1 }}
                                                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
                                                    hasValue
                                                      ? 'bg-green-100 text-green-600'
                                                      : 'bg-gray-100 text-gray-400'
                                                  }`}
                                                >
                                                  {hasValue ? (
                                                    <Check size={12} />
                                                  ) : (
                                                    <Clock size={12} />
                                                  )}
                                                </motion.div>
                                              </td>
                                            </motion.tr>
                                          );
                                        }
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </motion.div>
                          );
                        }
                      )}
                    </div>
                  )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Enhanced Action Buttons */}
        <motion.div
          variants={itemVariants}
          className="mt-8 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
        >
          <div className="p-6 bg-gradient-to-r from-gray-50/50 to-blue-50/50 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                {isFormValid ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center text-green-600 bg-green-50 px-4 py-2 rounded-xl border border-green-200"
                  >
                    <Check size={18} className="mr-2" />
                    <span className="font-medium">Ready to create batch</span>
                  </motion.div>
                ) : (
                  <div className="flex items-center text-amber-600 bg-amber-50 px-4 py-2 rounded-xl border border-amber-200">
                    <Clock size={18} className="mr-2" />
                    <span className="font-medium">
                      Complete required fields to continue
                    </span>
                  </div>
                )}

                <div className="text-sm text-gray-500">
                  {parameterValues.length} parameters configured
                </div>
              </div>

              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => navigate('/batches')}
                  className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-all shadow-sm"
                >
                  Cancel
                </motion.button>

                <motion.button
                  whileHover={
                    isFormValid && !isSaving
                      ? {
                          scale: 1.02,
                          boxShadow: '0 8px 25px rgba(59, 130, 246, 0.15)',
                        }
                      : {}
                  }
                  whileTap={isFormValid && !isSaving ? { scale: 0.98 } : {}}
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || !isFormValid}
                  className={`px-8 py-3 rounded-xl font-semibold flex items-center gap-3 transition-all shadow-lg ${
                    isSaving || !isFormValid
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 2,
                          ease: 'linear',
                          repeat: Infinity,
                        }}
                      >
                        <RotateCw className="h-5 w-5" />
                      </motion.div>
                      Creating Batch...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Create Batch
                      <ChevronRight size={16} />
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AddBatch;
