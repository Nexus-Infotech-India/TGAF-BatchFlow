import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Save,
  Download,
  Edit2,
  Trash2,
  ChevronRight,
  Search,
  RefreshCw,
  FileText,
  CheckCircle,
  Clock,
  Package,
  Calendar,
  Building,
  Hash,
  Beaker,
  SlidersHorizontal,
  AlertCircle,
  X,
  Check,
  RotateCw,
  ChevronDown,
  Filter,
  Tag,
  Ruler,
  Settings,
  Target,
  Award,
  Eye,
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
  createRMQualityReport,
  getRMQualityReports,
  updateRMQualityReport,
  deleteRMQualityReport,
  exportRMQualityReport,
} from '../../../utils/api';
import { RMQualityReport as RMQualityReportType } from '../../../Types/qualityTypes';
import api, { API_ROUTES } from '../../../utils/api';
import { format } from 'date-fns';

// Enhanced animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2,
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2 },
  },
};

// Fixed parameters for Chilli
const CHILLI_PARAMETERS = [
  { parameter: 'Moisture', standard: 'max 8%' },
  { parameter: 'ASTA Color', standard: 'min 40' },
  { parameter: 'Acid Insoluble Ash', standard: 'max 1.5%' },
  { parameter: 'Total Ash', standard: 'max 8%' },
  { parameter: 'Aflatoxin', standard: 'max 20 ppb' },
  { parameter: 'TPC', standard: 'max 10 million cfu' },
  { parameter: 'YM', standard: '10,000 cfu' },
];

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  return format(new Date(dateString), 'MMM dd, yyyy');
};

const RMQualityReport: React.FC = () => {
  const [reports, setReports] = useState<RMQualityReportType[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingReport, setEditingReport] =
    useState<RMQualityReportType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [receivedRawMaterials, setReceivedRawMaterials] = useState<any[]>([]);
  const [receivedVendors, setReceivedVendors] = useState<any[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    rawMaterialName: '',
    variety: '',
    supplier: '',
    grn: '',
  });

  // Results state for fixed parameters
  const [results, setResults] = useState<string[]>(
    Array(CHILLI_PARAMETERS.length).fill('')
  );

  const authToken = localStorage.getItem('authToken');

  useEffect(() => {
    fetchReports();
    fetchReceivedRawMaterials();
    fetchReceivedVendors();
  }, []);

  const fetchReceivedRawMaterials = async () => {
    try {
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

    const parametersValid = results.every((r) => r.trim() !== '');

    setIsFormValid(basicInfoValid && parametersValid);
  }, [formData, results]);

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

  const handleResultChange = (index: number, value: string) => {
    const newResults = [...results];
    newResults[index] = value;
    setResults(newResults);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      setError('Please complete all required fields before saving');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      const data = {
        ...formData,
        parameters: CHILLI_PARAMETERS.map((p, i) => ({
          parameter: p.parameter,
          standard: p.standard,
          result: results[i],
        })),
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
        setError(response.error || 'Failed to save report');
      }
    } catch (error) {
      setError('Failed to save report');
    } finally {
      setIsSaving(false);
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
    // Load results from report parameters
    const loadedResults = CHILLI_PARAMETERS.map((p) => {
      const param = report.parameters.find(
        (rp) => rp.parameter === p.parameter
      );
      return param ? param.result : '';
    });
    setResults(loadedResults);
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

  const handleExport = async (
    id: string,
    format: 'excel' | 'pdf' = 'excel'
  ) => {
    try {
      if (format === 'excel') {
        const url = `${API_ROUTES.RAW.EXPORT_QUALITY_REPORT(id)}?format=excel`;
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (!response.ok) {
          toast.error('Failed to export report');
          return;
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `RM_Quality_Report_${id}.xlsx`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);

        toast.success('Excel export started');
      } else {
        const response = await exportRMQualityReport(id);
        if (response.success) {
          toast.success('Report exported successfully');
        } else {
          toast.error(response.error || 'Failed to export report');
        }
      }
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const handleExportAll = async () => {
    if (reports.length === 0) {
      toast.error('No reports to export');
      return;
    }

    try {
      setIsExportingAll(true);
      const exportPromises = reports.map((report) => {
        const url = `${API_ROUTES.RAW.EXPORT_QUALITY_REPORT(report.id)}?format=excel`;
        return fetch(url, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }).then((res) => res.blob());
      });

      const blobs = await Promise.all(exportPromises);

      // Create a zip file or download individually
      // For now, we'll download them sequentially with a small delay
      for (let i = 0; i < blobs.length; i++) {
        const blob = blobs[i];
        const report = reports[i];
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `RM_Quality_Report_${report.id}.xlsx`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);

        // Small delay to avoid browser blocking multiple downloads
        if (i < blobs.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      toast.success(`Exported ${reports.length} reports successfully`);
    } catch (error) {
      toast.error('Failed to export all reports');
    } finally {
      setIsExportingAll(false);
    }
  };

  const resetForm = () => {
    setFormData({
      rawMaterialName: '',
      variety: '',
      supplier: '',
      grn: '',
    });
    setResults(Array(CHILLI_PARAMETERS.length).fill(''));
    setError(null);
  };

  const filteredReports = reports.filter(
    (report) =>
      report.rawMaterialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.variety.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.grn.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const basicInfoComplete =
    formData.rawMaterialName &&
    formData.variety &&
    formData.supplier &&
    formData.grn;
  const parametersComplete =
    results.length > 0 && results.every((r) => r.trim() !== '');

  // Show form view
  if (showForm) {
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
                className="mb-4 bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg flex items-start"
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
            className="bg-card rounded-xl mb-3"
          >
            <div className="pr-5 pb-5 pt-5 pl-2">
              <div className="flex flex-wrap items-center gap-3">
                <div className="w-1.5 h-10 bg-primary rounded-full" />
                <div className="p-2 bg-primary rounded-md">
                  <FileText className="text-primary-foreground" size={20} />
                </div>
                <h1 className="text-3xl font-bold text-foreground">
                  {editingReport
                    ? 'Edit Quality Report'
                    : 'Create Quality Report'}
                </h1>
                <div className="ml-auto">
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setEditingReport(null);
                      resetForm();
                    }}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Raw Material Name{' '}
                    <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="rawMaterialName"
                      value={formData.rawMaterialName}
                      onChange={handleInputChange}
                      className="w-full border border-input rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background pl-10 appearance-none cursor-pointer"
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
                      className="absolute left-3.5 top-3 text-muted-foreground pointer-events-none"
                      style={{ color: 'var(--primary)' }}
                    />
                    <ChevronRight
                      size={16}
                      className="absolute right-3.5 top-3 text-muted-foreground pointer-events-none rotate-90"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Variety <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="variety"
                      value={formData.variety}
                      onChange={handleInputChange}
                      className="w-full border border-input rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background pl-10"
                      placeholder="Enter variety"
                      required
                    />
                    <Award
                      size={16}
                      className="absolute left-3.5 top-3 text-muted-foreground"
                      style={{ color: 'var(--primary)' }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Supplier <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="supplier"
                      value={formData.supplier}
                      onChange={handleInputChange}
                      className="w-full border border-input rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background pl-10 appearance-none cursor-pointer"
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
                      className="absolute left-3.5 top-3 text-muted-foreground pointer-events-none"
                      style={{ color: 'var(--primary)' }}
                    />
                    <ChevronRight
                      size={16}
                      className="absolute right-3.5 top-3 text-muted-foreground pointer-events-none rotate-90"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    GRN <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="grn"
                      value={formData.grn}
                      onChange={handleInputChange}
                      className="w-full border border-input rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background pl-10"
                      placeholder="Enter GRN number"
                      required
                    />
                    <Hash
                      size={16}
                      className="absolute left-3.5 top-3 text-muted-foreground"
                      style={{ color: 'var(--primary)' }}
                    />
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
              <div className="space-y-4">
                {CHILLI_PARAMETERS.map((param, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border border-border rounded-lg p-4 bg-card"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Parameter
                        </label>
                        <input
                          type="text"
                          value={param.parameter}
                          readOnly
                          className="w-full border border-input rounded-lg px-3 py-2.5 bg-muted text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Standard
                        </label>
                        <input
                          type="text"
                          value={param.standard}
                          readOnly
                          className="w-full border border-input rounded-lg px-3 py-2.5 bg-muted text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Result <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="text"
                          value={results[index]}
                          onChange={(e) =>
                            handleResultChange(index, e.target.value)
                          }
                          className="w-full border border-input rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all bg-background"
                          placeholder="Enter result"
                          required
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
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
                        Ready to save report
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
                    {CHILLI_PARAMETERS.length} parameters configured
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingReport(null);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-input text-foreground bg-background hover:bg-accent rounded-lg text-sm transition"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmit}
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
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        {editingReport ? 'Update Report' : 'Save Report'}
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
  }

  // Main list view
  return (
    <motion.div
      className="min-h-screen bg-background"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto shadow-sm rounded-xl py-0">
        <motion.div
          variants={itemVariants}
          className="bg-card rounded-xl overflow-hidden"
        >
          {/* Header Section */}
          <div className="p-6 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-1.5 h-10 bg-primary rounded-full shadow-md" />
                <div className="p-2 bg-primary rounded-lg shadow-md flex items-center justify-center">
                  <FileText
                    className="text-primary-foreground"
                    size={21}
                    strokeWidth={2.5}
                  />
                </div>
                <h1 className="text-3xl font-extrabold text-foreground tracking-tight drop-shadow-sm">
                  RM Quality Reports
                </h1>
              </div>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleExportAll}
                  disabled={isExportingAll || reports.length === 0}
                  className={`px-4 py-2.5 rounded-lg flex items-center font-bold text-sm shadow-md transition-all cursor-pointer ${
                    isExportingAll || reports.length === 0
                      ? 'bg-muted text-muted-foreground cursor-not-allowed'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  }`}
                >
                  {isExportingAll ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 2,
                          ease: 'linear',
                          repeat: Infinity,
                        }}
                      >
                        <RotateCw
                          size={16}
                          className="mr-2"
                          strokeWidth={2.5}
                        />
                      </motion.div>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download size={16} className="mr-2" strokeWidth={2.5} />
                      Export All
                    </>
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowForm(true);
                    setEditingReport(null);
                    resetForm();
                  }}
                  className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center font-bold text-base shadow-md transition-all cursor-pointer"
                >
                  <Plus
                    size={18}
                    className="mr-2 font-bold"
                    strokeWidth={2.5}
                  />
                  New Report
                </motion.button>
              </div>
            </div>
          </div>

          {/* Search and Filters Section */}
          <div className="p-6 pt-3 pb-2">
            <div className="flex flex-col md:flex-row gap-4 mb-3">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-full border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-ring outline-none transition-all duration-200 text-sm bg-background"
                />
              </div>

              <div className="flex gap-2 shrink-0">
                <motion.button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="flex items-center gap-2 px-4 py-2.5 border border-input bg-background rounded-lg hover:bg-accent transition-colors duration-200 text-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">Filter</span>
                  <motion.div
                    animate={{ rotate: isFilterOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={14} className="text-muted-foreground" />
                  </motion.div>
                </motion.button>

                <motion.button
                  onClick={fetchReports}
                  className="flex items-center gap-2 px-4 py-2.5 border border-input bg-background rounded-lg hover:bg-accent transition-colors duration-200 text-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">Refresh</span>
                </motion.button>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="pt-0">
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <motion.div
                  animate={{
                    rotate: 360,
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    ease: 'linear',
                    repeat: Infinity,
                  }}
                  className="rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary"
                />
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="p-12 text-center">
                <div className="p-3 bg-primary/10 rounded-full inline-block mb-4">
                  <FileText size={36} className="text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No reports found
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
                  {searchTerm
                    ? 'No reports match your search criteria. Try adjusting your search.'
                    : 'Get started by creating your first quality report'}
                </p>
                {!searchTerm && (
                  <motion.button
                    onClick={() => {
                      setShowForm(true);
                      setEditingReport(null);
                      resetForm();
                    }}
                    className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 inline-flex items-center font-medium text-sm"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Plus size={14} className="mr-1" />
                    Create First Report
                  </motion.button>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead>
                      <tr className="bg-muted/50">
                        <th
                          scope="col"
                          className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                        >
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            Raw Material
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                        >
                          <div className="flex items-center gap-2">
                            <Award className="w-4 h-4" />
                            Variety
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                        >
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4" />
                            Supplier
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                        >
                          <div className="flex items-center gap-2">
                            <Hash className="w-4 h-4" />
                            GRN
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                        >
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Date
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                        >
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            Parameters
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                        >
                          <div className="flex items-center gap-2 justify-end">
                            <Settings className="w-4 h-4" />
                            Actions
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {filteredReports.map((report, index) => (
                        <motion.tr
                          key={report.id}
                          className="hover:bg-muted/50 transition-colors duration-150"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                            {report.rawMaterialName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                              {report.variety}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Building
                                size={14}
                                className="text-muted-foreground mr-2"
                              />
                              {report.supplier}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Hash
                                size={14}
                                className="text-muted-foreground mr-2"
                              />
                              {report.grn}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Calendar
                                size={14}
                                className="text-muted-foreground mr-2"
                              />
                              {formatDate(report.dateOfReport)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                              <Target size={12} className="mr-1" />
                              {report.parameters.length} params
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleEdit(report)}
                                className="group relative flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all border border-primary/20 cursor-pointer"
                                title="Edit Report"
                              >
                                <Edit2 size={16} />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleExport(report.id, 'excel')}
                                className="group relative flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all border border-primary/20 cursor-pointer"
                                title="Export as Excel"
                              >
                                <Download size={16} />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleDelete(report.id)}
                                className="group relative flex items-center justify-center w-8 h-8 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-all border border-destructive/20 cursor-pointer"
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
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default RMQualityReport;
