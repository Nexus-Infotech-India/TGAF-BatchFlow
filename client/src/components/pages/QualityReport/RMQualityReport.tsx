import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Save,
  Download,
  Edit,
  Trash2,
  ArrowLeft,
  Search,
  RefreshCw,
  FileText,
  CheckCircle,
  Clock,
  Package,
  Calendar,
  Building,
  Hash,
  PlusCircle,
  MinusCircle,
  Sparkles,
  TrendingUp,
  BarChart3,
  Shield,
  Beaker,
  FlaskConical,
  Target,
  Award,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
  createRMQualityReport,
  getRMQualityReports,
  updateRMQualityReport,
  deleteRMQualityReport,
  exportRMQualityReport,
} from '../../../utils/api';
import {
  RMQualityReport as RMQualityReportType,
  RMQualityParameter,
} from '../../../Types/qualityTypes';
import api, { API_ROUTES } from '../../../utils/api';

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

// Status Indicator Component
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
    {isValid ? <CheckCircle size={14} /> : <Clock size={14} />}
    {label}
  </motion.div>
);

const RMQualityReport: React.FC = () => {
  const [reports, setReports] = useState<RMQualityReportType[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingReport, setEditingReport] =
    useState<RMQualityReportType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);

   const [receivedRawMaterials, setReceivedRawMaterials] = useState<any[]>([]);
   const [receivedVendors, setReceivedVendors] = useState<any[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    rawMaterialName: '',
    variety: '',
    supplier: '',
    grn: '',
  });

  const [parameters, setParameters] = useState<RMQualityParameter[]>([
    { parameter: '', standard: '', result: '' },
  ]);

   useEffect(() => {
     fetchReports();
     fetchReceivedRawMaterials();
     fetchReceivedVendors();
   }, []);

    const fetchReceivedRawMaterials = async () => {
      try {
        const authToken = localStorage.getItem('authToken');
        const response = await api.get(
          API_ROUTES.RAW.GET_RECEIVED_RAW_MATERIALS,
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );
        setReceivedRawMaterials(response.data);
      } catch (error) {
        console.error('Failed to fetch received raw materials:', error);
      }
    };

    const fetchReceivedVendors = async () => {
      try {
        const authToken = localStorage.getItem('authToken');
        const response = await api.get(API_ROUTES.RAW.GET_RECEIVED_VENDORS, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        setReceivedVendors(response.data);
      } catch (error) {
        console.error('Failed to fetch received vendors:', error);
      }
    };


  // Check if form is valid
  useEffect(() => {
    const basicInfoValid =
      formData.rawMaterialName.trim() !== '' &&
      formData.variety.trim() !== '' &&
      formData.supplier.trim() !== '' &&
      formData.grn.trim() !== '';

    const parametersValid =
      parameters.length > 0 &&
      parameters.every(
        (p) =>
          p.parameter.trim() !== '' &&
          p.standard.trim() !== '' &&
          p.result.trim() !== ''
      );

    setIsFormValid(basicInfoValid && parametersValid);
  }, [formData, parameters]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await getRMQualityReports({ search: searchTerm });
      if (response.success) {
        setReports(response.data);
      }
    } catch (error) {
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleParameterChange = (
    index: number,
    field: keyof RMQualityParameter,
    value: string
  ) => {
    const newParameters = [...parameters];
    newParameters[index] = { ...newParameters[index], [field]: value };
    setParameters(newParameters);
  };

  const addParameter = () => {
    setParameters([...parameters, { parameter: '', standard: '', result: '' }]);
  };

  const removeParameter = (index: number) => {
    if (parameters.length > 1) {
      setParameters(parameters.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      toast.error('Please complete all required fields');
      return;
    }

    try {
      setLoading(true);
      const data = {
        ...formData,
        parameters: parameters.filter(
          (p) => p.parameter && p.standard && p.result
        ),
      };

      let response;
      if (editingReport) {
        response = await updateRMQualityReport(editingReport.id, data);
      } else {
        response = await createRMQualityReport(data);
      }

      if (response.success) {
        toast.success(
          editingReport
            ? 'Report updated successfully'
            : 'Report created successfully'
        );
        setShowForm(false);
        setEditingReport(null);
        resetForm();
        fetchReports();
      } else {
        toast.error(response.error || 'Failed to save report');
      }
    } catch (error) {
      toast.error('Failed to save report');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (report: RMQualityReportType) => {
    setEditingReport(report);
    setFormData({
      rawMaterialName: report.rawMaterialName,
      variety: report.variety,
      supplier: report.supplier,
      grn: report.grn,
    });
    setParameters(
      report.parameters.length > 0
        ? report.parameters
        : [{ parameter: '', standard: '', result: '' }]
    );
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      try {
        const response = await deleteRMQualityReport(id);
        if (response.success) {
          toast.success('Report deleted successfully');
          fetchReports();
        } else {
          toast.error(response.error || 'Failed to delete report');
        }
      } catch (error) {
        toast.error('Failed to delete report');
      }
    }
  };

  const handleExport = async (id: string) => {
    try {
      const response = await exportRMQualityReport(id);
      if (response.success) {
        toast.success('Report exported successfully');
      } else {
        toast.error(response.error || 'Failed to export report');
      }
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const resetForm = () => {
    setFormData({
      rawMaterialName: '',
      variety: '',
      supplier: '',
      grn: '',
    });
    setParameters([{ parameter: '', standard: '', result: '' }]);
  };

  const filteredReports = reports.filter(
    (report) =>
      report.rawMaterialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.variety.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.grn.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate stats
  const totalReports = reports.length;
  const recentReports = reports.filter((report) => {
    const reportDate = new Date(report.dateOfReport);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return reportDate >= thirtyDaysAgo;
  }).length;

  if (showForm) {
    return (
      <motion.div
        className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-7xl mx-auto p-6">
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
                    onClick={() => setShowForm(false)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                  >
                    <ArrowLeft size={16} className="text-gray-600" />
                    <span className="text-gray-700 font-medium">
                      Back to Reports
                    </span>
                  </motion.button>

                  <div className="flex gap-3">
                    <StatusIndicator
                      isValid={
                        formData.rawMaterialName.trim() !== '' &&
                        formData.variety.trim() !== '' &&
                        formData.supplier.trim() !== '' &&
                        formData.grn.trim() !== ''
                      }
                      label="Basic Info"
                    />
                    <StatusIndicator
                      isValid={parameters.every(
                        (p) => p.parameter && p.standard && p.result
                      )}
                      label="Parameters"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <FileText className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {editingReport
                        ? 'Edit Quality Report'
                        : 'Create Quality Report'}
                    </h1>
                    <p className="text-gray-600 text-sm mt-0.5">
                      {editingReport
                        ? 'Update raw material quality parameters'
                        : 'Define quality parameters for raw material testing'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="p-4 bg-gradient-to-r from-gray-50/50 to-blue-50/50">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Form Completion</span>
                <span>
                  {Math.round(
                    (formData.rawMaterialName &&
                    formData.variety &&
                    formData.supplier &&
                    formData.grn
                      ? 50
                      : 0) +
                      (parameters.every(
                        (p) => p.parameter && p.standard && p.result
                      )
                        ? 50
                        : 0)
                  )}
                  %
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{
                    width: `${
                      (formData.rawMaterialName &&
                      formData.variety &&
                      formData.supplier &&
                      formData.grn
                        ? 50
                        : 0) +
                      (parameters.every(
                        (p) => p.parameter && p.standard && p.result
                      )
                        ? 50
                        : 0)
                    }%`,
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
                    <Package size={20} className="mr-3 text-blue-600" />
                    Basic Information
                    {formData.rawMaterialName &&
                      formData.variety &&
                      formData.supplier &&
                      formData.grn && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="ml-3 p-1 bg-green-100 rounded-full"
                        >
                          <CheckCircle size={12} className="text-green-600" />
                        </motion.div>
                      )}
                  </h2>
                </div>

                <div className="p-6 space-y-6">
                  {/* Raw Material Name */}
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    className="space-y-2"
                  >
                    <label className="block text-sm font-semibold text-gray-700">
                      Raw Material Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        name="rawMaterialName"
                        value={formData.rawMaterialName}
                        onChange={handleInputChange}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white pl-12 appearance-none cursor-pointer"
                        required
                      >
                        <option value="">Select raw material</option>
                        {receivedRawMaterials.map((material) => (
                          <option key={material.id} value={material.name}>
                            {material.name} ({material.skuCode})
                          </option>
                        ))}
                      </select>
                      <Package
                        size={16}
                        className="absolute left-4 top-3.5 text-gray-400 pointer-events-none"
                      />
                      <ChevronRight
                        size={16}
                        className="absolute right-4 top-3.5 text-gray-400 pointer-events-none rotate-90"
                      />
                    </div>
                  </motion.div>

                  {/* Variety */}
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    className="space-y-2"
                  >
                    <label className="block text-sm font-semibold text-gray-700">
                      Variety <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="variety"
                        value={formData.variety}
                        onChange={handleInputChange}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white pl-12"
                        placeholder="Enter variety"
                        required
                      />
                      <Award
                        size={16}
                        className="absolute left-4 top-3.5 text-gray-400"
                      />
                    </div>
                  </motion.div>

                  {/* Supplier */}
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    className="space-y-2"
                  >
                    <label className="block text-sm font-semibold text-gray-700">
                      Supplier <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        name="supplier"
                        value={formData.supplier}
                        onChange={handleInputChange}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white pl-12 appearance-none cursor-pointer"
                        required
                      >
                        <option value="">Select supplier</option>
                        {receivedVendors.map((vendor) => (
                          <option key={vendor.id} value={vendor.name}>
                            {vendor.name} ({vendor.vendorCode})
                          </option>
                        ))}
                      </select>
                      <Building
                        size={16}
                        className="absolute left-4 top-3.5 text-gray-400 pointer-events-none"
                      />
                      <ChevronRight
                        size={16}
                        className="absolute right-4 top-3.5 text-gray-400 pointer-events-none rotate-90"
                      />
                    </div>
                  </motion.div>

                  {/* GRN */}
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    className="space-y-2"
                  >
                    <label className="block text-sm font-semibold text-gray-700">
                      GRN <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="grn"
                        value={formData.grn}
                        onChange={handleInputChange}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white pl-12"
                        placeholder="Enter GRN number"
                        required
                      />
                      <Hash
                        size={16}
                        className="absolute left-4 top-3.5 text-gray-400"
                      />
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
                      <Beaker size={20} className="mr-3 text-blue-600" />
                      Quality Parameters
                      {parameters.every(
                        (p) => p.parameter && p.standard && p.result
                      ) && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="ml-3 p-1 bg-green-100 rounded-full"
                        >
                          <CheckCircle size={12} className="text-green-600" />
                        </motion.div>
                      )}
                    </h2>

                    <div className="flex items-center gap-3">
                      {parameters.length > 0 && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full flex items-center gap-1">
                          <Target size={12} />
                          {parameters.length} parameters
                        </span>
                      )}

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={addParameter}
                        className="bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1 text-sm font-medium"
                      >
                        <PlusCircle size={14} />
                        Add Parameter
                      </motion.button>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    {parameters.map((param, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-4"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-gray-800 flex items-center">
                            <FlaskConical
                              size={16}
                              className="mr-2 text-blue-600"
                            />
                            Parameter {index + 1}
                          </h3>
                          {parameters.length > 1 && (
                            <button
                              onClick={() => removeParameter(index)}
                              className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              <MinusCircle size={16} />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Parameter <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={param.parameter}
                              onChange={(e) =>
                                handleParameterChange(
                                  index,
                                  'parameter',
                                  e.target.value
                                )
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                              placeholder="e.g., Moisture"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Standard <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={param.standard}
                              onChange={(e) =>
                                handleParameterChange(
                                  index,
                                  'standard',
                                  e.target.value
                                )
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                              placeholder="e.g., max 8%"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Result <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={param.result}
                              onChange={(e) =>
                                handleParameterChange(
                                  index,
                                  'result',
                                  e.target.value
                                )
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                              placeholder="e.g., 7.5%"
                              required
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
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
                      <CheckCircle size={18} className="mr-2" />
                      <span className="font-medium">Ready to save report</span>
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
                    {parameters.length} parameters configured
                  </div>
                </div>

                <div className="flex gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-all shadow-sm"
                  >
                    Cancel
                  </motion.button>

                  <motion.button
                    whileHover={
                      isFormValid && !loading
                        ? {
                            scale: 1.02,
                            boxShadow: '0 8px 25px rgba(59, 130, 246, 0.15)',
                          }
                        : {}
                    }
                    whileTap={isFormValid && !loading ? { scale: 0.98 } : {}}
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading || !isFormValid}
                    className={`px-8 py-3 rounded-xl font-semibold flex items-center gap-3 transition-all shadow-lg ${
                      loading || !isFormValid
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                    }`}
                  >
                    {loading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 2,
                            ease: 'linear',
                            repeat: Infinity,
                          }}
                        >
                          <RefreshCw className="h-5 w-5" />
                        </motion.div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        {editingReport ? 'Update Report' : 'Save Report'}
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
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto p-6">
        {/* Enhanced Header */}
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
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    <FileText className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      RM Quality Reports
                    </h1>
                    <p className="text-gray-600 text-sm mt-0.5">
                      Manage raw material quality testing and compliance reports
                    </p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowForm(true);
                    setEditingReport(null);
                    resetForm();
                  }}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg flex items-center gap-2 font-semibold"
                >
                  <Plus size={18} />
                  New Report
                </motion.button>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="p-6 bg-gradient-to-r from-gray-50/50 to-blue-50/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                <p className="text-xs font-medium text-gray-600 mb-1">
                  Total Reports
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalReports}
                </p>
                <div className="flex items-center mt-1">
                  <TrendingUp size={10} className="text-blue-500 mr-1" />
                  <span className="text-xs text-blue-600 font-medium">
                    All time
                  </span>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                <p className="text-xs font-medium text-gray-600 mb-1">
                  Recent Reports
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {recentReports}
                </p>
                <div className="flex items-center mt-1">
                  <Clock size={10} className="text-green-500 mr-1" />
                  <span className="text-xs text-green-600 font-medium">
                    Last 30 days
                  </span>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                <p className="text-xs font-medium text-gray-600 mb-1">
                  Avg Parameters
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {reports.length > 0
                    ? Math.round(
                        reports.reduce(
                          (sum, r) => sum + r.parameters.length,
                          0
                        ) / reports.length
                      )
                    : 0}
                </p>
                <div className="flex items-center mt-1">
                  <BarChart3 size={10} className="text-purple-500 mr-1" />
                  <span className="text-xs text-purple-600 font-medium">
                    Per report
                  </span>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                <p className="text-xs font-medium text-gray-600 mb-1">
                  Compliance
                </p>
                <p className="text-2xl font-bold text-gray-900">98%</p>
                <div className="flex items-center mt-1">
                  <Shield size={10} className="text-green-500 mr-1" />
                  <span className="text-xs text-green-600 font-medium">
                    Success rate
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-6"
        >
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search
                  size={20}
                  className="absolute left-3 top-3 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search reports by material, variety, supplier, or GRN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={fetchReports}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Refresh
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Reports Table */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Raw Material
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Variety
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    GRN
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Parameters
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReports.map((report, index) => (
                  <motion.tr
                    key={report.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg mr-3">
                          <Package size={16} className="text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {report.rawMaterialName}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {report.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {report.variety}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Building size={14} className="text-gray-400 mr-2" />
                        {report.supplier}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Hash size={14} className="text-gray-400 mr-2" />
                        {report.grn}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar size={14} className="text-gray-400 mr-2" />
                        {new Date(report.dateOfReport).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Target size={12} className="mr-1" />
                        {report.parameters.length} params
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEdit(report)}
                          className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Edit Report"
                        >
                          <Edit size={16} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleExport(report.id)}
                          className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 transition-colors"
                          title="Export Report"
                        >
                          <Download size={16} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(report.id)}
                          className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete Report"
                        >
                          <Trash2 size={16} />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>

            {filteredReports.length === 0 && (
              <div className="text-center py-16">
                <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  No reports found
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm
                    ? 'Try adjusting your search criteria'
                    : 'Get started by creating your first quality report'}
                </p>
                {!searchTerm && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setShowForm(true);
                      setEditingReport(null);
                      resetForm();
                    }}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg flex items-center gap-2 font-semibold mx-auto"
                  >
                    <Plus size={18} />
                    Create First Report
                  </motion.button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default RMQualityReport;
