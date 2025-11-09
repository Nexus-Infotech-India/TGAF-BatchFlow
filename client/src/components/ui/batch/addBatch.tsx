import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_ROUTES } from '../../../utils/api';
import {
  AlertCircle,
  X,
  Save,
  Calendar,
  Package,
  ChevronRight,
  Clock,
  Check,
  Tag,
  RotateCw,
  Minus,
  Beaker,
  SlidersHorizontal,
  Hash,
  Ruler,
  CheckCircle,
  Settings,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAutoSave } from '../../../hooks/useAutoSave';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

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
  const [sieveSelections, setSieveSelections] = useState<
    Record<string, string>
  >({});
  const [isSaving, setIsSaving] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [, setExpandedCategories] = useState<{ [key: string]: boolean }>({});
  const [draftFetchedAt, setDraftFetchedAt] = useState<string | null>(null);

  const authToken = localStorage.getItem('authToken');
  const [draftId, setDraftId] = useState<string | null>(null);
  const [removedParameters, setRemovedParameters] = useState<Set<string>>(
    new Set()
  );

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

  const handleRemoveParameter = (parameterId: string) => {
    setRemovedParameters((prev) => new Set([...prev, parameterId]));
    setParameterValues((prev) =>
      prev.filter((pv) => pv.parameterId !== parameterId)
    );
  };

  useEffect(() => {
    const fetchDraft = async () => {
      try {
        let draftData;

        if (draftIdFromUrl) {
          const response = await axios.get(
            API_ROUTES.DRAFT.GET_BATCH(draftIdFromUrl),
            {
              headers: { Authorization: `Bearer ${authToken}` },
            }
          );
          draftData = response.data;
        } else {
          const response = await axios.get(
            API_ROUTES.DRAFT.GET_LATEST_BATCH_DRAFT,
            {
              headers: { Authorization: `Bearer ${authToken}` },
            }
          );
          draftData = response.data;
        }

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
        setNewProductName(draftData.newProductName || '');
        setDraftFetchedAt(draftData.updatedAt || draftData.createdAt || null);
        if (draftData.parameterValues) {
          const parsedData =
            typeof draftData.parameterValues === 'string'
              ? JSON.parse(draftData.parameterValues)
              : draftData.parameterValues;

          if (Array.isArray(parsedData)) {
            setParameterValues(parsedData);
          } else if (parsedData && typeof parsedData === 'object') {
            setParameterValues(parsedData.values || []);
            if (parsedData.removedParameters) {
              setRemovedParameters(new Set(parsedData.removedParameters));
            }
          } else {
            setParameterValues([]);
          }
        } else {
          setParameterValues([]);
        }
      } catch (error) {
        // ignore
      }
    };

    if (authToken) {
      fetchDraft();
    }
  }, [authToken, draftIdFromUrl]);

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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

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

  const parametersByCategory =
    productParametersData?.parametersByCategory || {};

  const isSieveParam = (name?: string) =>
    (name || '').toLowerCase().includes('pass through us sieve');

  const SIEVE_OPTIONS = [
    '400 micron',
    '500 micron',
    '600 micron',
    '710 micron',
    '850 micron',
    '2.36 mm',
    '3.35 mm',
  ];

  useAutoSave({
    saveUrl: API_ROUTES.DRAFT.SAVE_BATCH,
    getUrl: draftId ? API_ROUTES.DRAFT.GET_BATCH(draftId) : undefined,
    data: {
      formData,
      parameterValues: {
        values: parameterValues,
        removedParameters: Array.from(removedParameters),
      },
      newProductName,
    },
    isSuccess: createBatchMutation.isSuccess,
    authToken: authToken || '',
    draftId,
    onDraftIdChange: setDraftId,
  });

  function toDateInputString(dateStr: string | null | undefined) {
    if (!dateStr) return '';
    return new Date(dateStr).toISOString().slice(0, 10);
  }

  useEffect(() => {
    const fetchLatestDraft = async () => {
      try {
        const response = await axios.get(
          API_ROUTES.DRAFT.GET_LATEST_BATCH_DRAFT,
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );
        const draftData = response.data;

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
        if (draftData.parameterValues) {
          const parsedData =
            typeof draftData.parameterValues === 'string'
              ? JSON.parse(draftData.parameterValues)
              : draftData.parameterValues;

          if (Array.isArray(parsedData)) {
            setParameterValues(parsedData);
          } else if (parsedData && typeof parsedData === 'object') {
            setParameterValues(parsedData.values || []);
            if (parsedData.removedParameters) {
              setRemovedParameters(new Set(parsedData.removedParameters));
            }
          } else {
            setParameterValues([]);
          }
        } else {
          setParameterValues([]);
        }
        setNewProductName(draftData.newProductName || '');
        setDraftFetchedAt(draftData.updatedAt || draftData.createdAt || null);
      } catch (error) {
        // ignore
      }
    };
    fetchLatestDraft();
  }, [authToken]);

  function formatDraftDate(dateStr: string | null) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const basicInfoComplete =
    formData.batchNumber &&
    (formData.productId || newProductName) &&
    formData.dateOfProduction &&
    formData.bestBeforeDate;
  const parametersComplete =
    parameterValues.length > 0 &&
    parameterValues.every((pv) => pv.value.trim() !== '');


  return (
    <motion.div
      className="min-h-screen bg-background"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto pt-0 px-4 pb-4 sm:pt-0 sm:px-6 sm:pb-6">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mb-4 bg-destructive/10 border border-destructive/30 text-destructive px-4 py- rounded-lg flex items-start"
            >
              <AlertCircle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <span className="font-medium">{error}</span>
              </div>
              <button
                className="ml-3 hover:opacity-80 p-1 rounded"
                onClick={() => setError(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          variants={itemVariants}
          className="bg-card rounded-xl  mb-3"
        >
          <div className="pr-5 pb-5 pt-5 pl-2">
            {/* Header Row: Icon, Title, Draft Info, Back Button */}
            <div className=" flex flex-wrap items-center gap-3">
              <div className="w-1.5 h-10 bg-primary rounded-full" />
              <div className="p-2 bg-primary rounded-md">
                <Package className="text-primary-foreground" size={20} />
              </div>
              <h1 className="text-3xl font-bold text-foreground">
                Create New Batch
              </h1>
              {draftFetchedAt && (
                <div className="inline-flex items-center gap-2 text-sm text-foreground bg-accent px-3 py-1 rounded-md border border-border ml-2">
                  <Clock size={14} />
                  <span>Draft loaded: {formatDraftDate(draftFetchedAt)}</span>
                </div>
              )}
              <div className="ml-auto">
                <button
                  onClick={() => navigate('/batches')}
                  className="inline-flex items-center gap-2 px-3 py-2 border border-input rounded-lg bg-background text-foreground hover:bg-accent transition"
                >
                  <ChevronRight size={16} className="rotate-180" />
                  <span className="text-sm font-medium">Back</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Basic Information */}
        <motion.div
          variants={itemVariants}
          className="bg-card rounded-xl border border-border"
        >
          <div className="p-5 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <SlidersHorizontal size={18} />
              Basic Information
              {basicInfoComplete && (
                <span className="ml-2 inline-flex items-center text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">
                  <Check size={12} className="mr-1" />
                  Complete
                </span>
              )}
            </h2>
          </div>

          <div className="p-5">
            {/* First row: Batch Number, Product, Production Date, Best Before Date */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Batch Number <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="batchNumber"
                    value={formData.batchNumber}
                    onChange={handleInputChange}
                    className="w-full border border-input rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background pl-10"
                    placeholder="Enter unique batch identifier"
                    required
                  />
                  <Package
                    size={16}
                    className="absolute left-3.5 top-3"
                    style={{ color: 'var(--primary)' }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Product <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <select
                    value={showNewProductForm ? 'new' : selectedProductId}
                    onChange={handleProductChange}
                    className="w-full border border-input rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background appearance-none cursor-pointer pl-10"
                    required
                  >
                    <option value="">Choose product type</option>
                    {productsData.map((product: any) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                    <option value="new">Create New Product</option>
                  </select>
                  <Tag
                    size={16}
                    className="absolute left-3.5 top-3 text-muted-foreground pointer-events-none"
                    style={{ color: 'var(--primary)' }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Production Date <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="dateOfProduction"
                    value={formData.dateOfProduction}
                    onChange={handleInputChange}
                    className="w-full border border-input rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background pl-10"
                    required
                  />
                  <Calendar
                    size={16}
                    className="absolute left-3.5 top-3 text-muted-foreground"
                    style={{ color: 'var(--primary)' }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Best Before Date <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="bestBeforeDate"
                    value={formData.bestBeforeDate}
                    onChange={handleInputChange}
                    className="w-full border border-input rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background pl-10"
                    required
                  />
                  <Clock
                    size={16}
                    className="absolute left-3.5 top-3 text-muted-foreground"
                    style={{ color: 'var(--primary)' }}
                  />
                </div>
              </div>
            </div>

            {/* New Product Name (if needed) */}
            {showNewProductForm && (
              <div className="mt-5">
                <label className="block text-sm font-medium text-foreground">
                  New Product Name
                </label>
                <input
                  type="text"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full border border-input rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                  placeholder="Enter new product name"
                  required
                />
              </div>
            )}

            {/* Second row: Sample Analysis Status, Started, Completed */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Sample Analysis Status
                </label>
                <div className="flex items-center gap-2">
                  <select
                    name="sampleAnalysisStatus"
                    value={formData.sampleAnalysisStatus}
                    onChange={handleInputChange}
                    className="w-full border border-input rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                  >
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-foreground">
                  Analysis Started
                </label>
                <input
                  type="date"
                  name="sampleAnalysisStarted"
                  value={formData.sampleAnalysisStarted}
                  onChange={handleInputChange}
                  className="w-full border border-input rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-foreground">
                  Analysis Completed
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="sampleAnalysisCompleted"
                    value={formData.sampleAnalysisCompleted}
                    onChange={handleInputChange}
                    className={`w-full border border-input rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background pr-10 ${
                      formData.sampleAnalysisStatus !== 'COMPLETED'
                        ? 'cursor-not-allowed text-muted-foreground bg-muted'
                        : ''
                    }`}
                    disabled={formData.sampleAnalysisStatus !== 'COMPLETED'}
                  />
                  {formData.sampleAnalysisStatus !== 'COMPLETED' && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      {/* Lucide: Circle with a slash (radius line) */}
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                      >
                        <circle
                          cx="10"
                          cy="10"
                          r="8"
                          stroke="var(--muted-foreground)"
                          strokeWidth="2"
                        />
                        <line
                          x1="6"
                          y1="14"
                          x2="14"
                          y2="6"
                          stroke="var(--muted-foreground)"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quality Parameters */}
        <motion.div
          variants={itemVariants}
          className="mt-6 bg-card rounded-xl border border-border shadow-sm"
        >
          <div className="p-5 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Beaker size={18} className="text-primary" />
              Quality Parameters
              {parametersComplete && (
                <span className="ml-2 inline-flex items-center text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                  <Check size={12} className="mr-1" />
                  Complete
                </span>
              )}
            </h2>
          </div>

          <div className="p-5">
            {isLoadingProductParameters && selectedProductId && (
              <div className="flex items-center justify-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1.5,
                    ease: 'linear',
                    repeat: Infinity,
                  }}
                >
                  <RotateCw size={28} className="text-primary/70" />
                </motion.div>
              </div>
            )}

            {selectedProductId &&
              !isLoadingProductParameters &&
              Object.keys(parametersByCategory).length === 0 && (
                <div className="text-center py-12 border border-dashed border-border rounded-lg bg-accent/30">
                  <div className="text-sm text-muted-foreground">
                    No Parameters Configured for this product.
                  </div>
                </div>
              )}

            {!selectedProductId &&
              !showNewProductForm &&
              !isLoadingProductParameters && (
                <div className="text-center py-12 border border-dashed border-border rounded-lg bg-accent/30">
                  <div className="text-sm text-muted-foreground">
                    Select a product to view quality parameters.
                  </div>
                </div>
              )}

            {selectedProductId &&
              !isLoadingProductParameters &&
              Object.keys(parametersByCategory).length > 0 && (
                <div className="space-y-6">
                  {Object.entries(parametersByCategory).map(
                    ([categoryName, parameters]) => {
                      const categoryParams = Array.isArray(parameters)
                        ? parameters
                        : [];

                      return (
                        <div
                          key={categoryName}
                          className="border border-border rounded-lg overflow-hidden shadow-sm"
                        >
                          <div className="px-4 py-3 bg-primary/5 border-b border-border">
                            <div className="text-sm font-semibold text-foreground">
                              {categoryName}
                            </div>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-accent/40 border-b border-border">
                                <tr>
                                  <th className="text-left p-3 text-xs font-semibold text-foreground uppercase">
                                    <div className="inline-flex items-center gap-2">
                                      <Beaker
                                        size={13}
                                        className="text-primary"
                                      />
                                      Parameter
                                    </div>
                                  </th>
                                  <th className="text-left p-3 text-xs font-semibold text-foreground uppercase w-44">
                                    <div className="inline-flex items-center gap-2">
                                      <Hash
                                        size={13}
                                        className="text-primary"
                                      />
                                      Value
                                    </div>
                                  </th>
                                  <th className="text-left p-3 text-xs font-semibold text-foreground uppercase w-32">
                                    <div className="inline-flex items-center gap-2">
                                      <Ruler
                                        size={13}
                                        className="text-primary"
                                      />
                                      Unit
                                    </div>
                                  </th>
                                  <th className="text-center p-3 text-xs font-semibold text-foreground uppercase w-24">
                                    <div className="inline-flex items-center gap-2 justify-center">
                                      <CheckCircle
                                        size={13}
                                        className="text-primary"
                                      />
                                      Status
                                    </div>
                                  </th>
                                  <th className="text-center p-3 text-xs font-semibold text-foreground uppercase w-20">
                                    <div className="inline-flex items-center gap-2 justify-center">
                                      <Settings
                                        size={13}
                                        className="text-primary"
                                      />
                                      Action
                                    </div>
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {categoryParams
                                  .filter(
                                    (parameter: any) =>
                                      !removedParameters.has(parameter.id)
                                  )
                                  .map((parameter: any, idx: number) => {
                                    const paramValue = parameterValues.find(
                                      (pv) => pv.parameterId === parameter.id
                                    );
                                    const hasValue =
                                      paramValue &&
                                      paramValue.value.trim() !== '';

                                    return (
                                      <tr
                                        key={parameter.id}
                                        className={`border-b border-border last:border-b-0 ${
                                          idx % 2 === 1
                                            ? 'bg-accent/20'
                                            : 'bg-card'
                                        } hover:bg-accent/30 transition-colors duration-150`}
                                      >
                                        <td className="p-3 align-top">
                                          <div className="text-sm font-medium text-foreground">
                                            {parameter.name}
                                          </div>
                                          {parameter.description && (
                                            <div className="text-xs text-muted-foreground mt-0.5">
                                              {parameter.description}
                                            </div>
                                          )}
                                        </td>
                                        <td className="p-3 align-top">
                                          <div className="flex items-center gap-2">
                                            {isSieveParam(parameter.name) && (
                                              <select
                                                value={
                                                  sieveSelections[
                                                    parameter.id
                                                  ] || ''
                                                }
                                                onChange={(e) => {
                                                  const sel = e.target.value;
                                                  setSieveSelections(
                                                    (prev) => ({
                                                      ...prev,
                                                      [parameter.id]: sel,
                                                    })
                                                  );
                                                  const existing =
                                                    parameterValues.find(
                                                      (pv) =>
                                                        pv.parameterId ===
                                                        parameter.id
                                                    );
                                                  const valuePart =
                                                    existing?.value?.includes(
                                                      '|'
                                                    )
                                                      ? existing.value.split(
                                                          '|'
                                                        )[1] || ''
                                                      : '';
                                                  const combined =
                                                    sel && valuePart
                                                      ? `${sel}|${valuePart}`
                                                      : sel
                                                        ? `${sel}|`
                                                        : valuePart;
                                                  if (existing) {
                                                    setParameterValues(
                                                      parameterValues.map(
                                                        (pv) =>
                                                          pv.parameterId ===
                                                          parameter.id
                                                            ? {
                                                                ...pv,
                                                                value: combined,
                                                              }
                                                            : pv
                                                      )
                                                    );
                                                  } else {
                                                    setParameterValues([
                                                      ...parameterValues,
                                                      {
                                                        parameterId:
                                                          parameter.id,
                                                        value: combined,
                                                        unitId:
                                                          parameter.unitId,
                                                      },
                                                    ]);
                                                  }
                                                }}
                                                className="border border-input rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary bg-background w-28 min-w-0"
                                              >
                                                <option value="">
                                                  sieve size
                                                </option>
                                                {SIEVE_OPTIONS.map((o) => (
                                                  <option key={o} value={o}>
                                                    {o}
                                                  </option>
                                                ))}
                                              </select>
                                            )}

                                            <input
                                              type="text"
                                              value={
                                                isSieveParam(parameter.name)
                                                  ? (() => {
                                                      const pv =
                                                        parameterValues.find(
                                                          (pvv) =>
                                                            pvv.parameterId ===
                                                            parameter.id
                                                        );
                                                      return pv?.value?.includes(
                                                        '|'
                                                      )
                                                        ? pv.value.split(
                                                            '|'
                                                          )[1] || ''
                                                        : '';
                                                    })()
                                                  : paramValue?.value || ''
                                              }
                                              onChange={(e) => {
                                                const raw = e.target.value;
                                                const selectedSize =
                                                  sieveSelections[
                                                    parameter.id
                                                  ] || '';

                                                const combined =
                                                  isSieveParam(
                                                    parameter.name
                                                  ) && selectedSize
                                                    ? `${selectedSize}|${raw}`
                                                    : raw;
                                                const existingParam =
                                                  parameterValues.find(
                                                    (pv) =>
                                                      pv.parameterId ===
                                                      parameter.id
                                                  );
                                                if (existingParam) {
                                                  setParameterValues(
                                                    parameterValues.map((pv) =>
                                                      pv.parameterId ===
                                                      parameter.id
                                                        ? {
                                                            ...pv,
                                                            value: combined,
                                                          }
                                                        : pv
                                                    )
                                                  );
                                                } else {
                                                  setParameterValues([
                                                    ...parameterValues,
                                                    {
                                                      parameterId: parameter.id,
                                                      value: combined,
                                                      unitId: parameter.unitId,
                                                    },
                                                  ]);
                                                }
                                              }}
                                              className={`border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary bg-background flex-1 min-w-0 ${
                                                isSieveParam(parameter.name)
                                                  ? 'w-full'
                                                  : ''
                                              }`}
                                              placeholder="Enter value"
                                              disabled={
                                                isSieveParam(parameter.name) &&
                                                !sieveSelections[parameter.id]
                                              }
                                            />
                                          </div>
                                        </td>
                                        <td className="p-3 align-top">
                                          {parameter.unit ? (
                                            <span className="text-sm text-foreground px-2 py-1 rounded border border-border bg-accent/20">
                                              {parameter.unit.symbol}
                                            </span>
                                          ) : (
                                            <span className="text-sm text-muted-foreground italic">
                                              No unit
                                            </span>
                                          )}
                                        </td>
                                        <td className="p-3 text-center align-top">
                                          <div
                                            className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium border ${
                                              hasValue
                                                ? 'bg-primary/10 text-primary border-primary/20'
                                                : 'bg-muted text-muted-foreground border-border'
                                            }`}
                                          >
                                            {hasValue ? (
                                              <Check
                                                size={12}
                                                className="mr-1"
                                              />
                                            ) : (
                                              <Clock
                                                size={12}
                                                className="mr-1"
                                              />
                                            )}
                                            {hasValue ? 'Filled' : 'Pending'}
                                          </div>
                                        </td>
                                        <td className="p-3 text-center align-top">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleRemoveParameter(
                                                parameter.id
                                              )
                                            }
                                            className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-destructive/30 text-destructive hover:bg-destructive/10 transition cursor-pointer"
                                            title={`Remove ${parameter.name} parameter`}
                                          >
                                            <Minus size={14} />
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
          </div>
        </motion.div>

        {/* Footer actions */}
        <motion.div
          variants={itemVariants}
          className="mt-6 bg-card rounded-xl border border-border"
        >
          <div className="p-5">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                {isFormValid ? (
                  <div className="inline-flex items-center text-primary bg-primary/10 px-3 py-1.5 rounded border border-primary/20">
                    <Check size={16} className="mr-2" />
                    <span className="text-sm font-medium">
                      Ready to create batch
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center text-foreground bg-muted px-3 py-1.5 rounded border border-border">
                    <Clock size={16} className="mr-2" />
                    <span className="text-sm font-medium">
                      Complete required fields
                    </span>
                  </div>
                )}
                <div className="text-sm text-muted-foreground">
                  {parameterValues.length} parameters configured
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/batches')}
                  className="px-4 py-2 border border-input text-foreground bg-background hover:bg-accent rounded-lg text-sm transition"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || !isFormValid}
                  className={`px-5 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2 transition ${
                    isSaving || !isFormValid
                      ? 'bg-muted text-muted-foreground cursor-not-allowed'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90'
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
                        <RotateCw className="h-4 w-4" />
                      </motion.div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Create Batch
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AddBatch;
