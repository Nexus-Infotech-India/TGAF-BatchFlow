import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Download,
  ChevronRight,
  Search,
  RefreshCw,
  FileText,
  Clock,
  Package,
  Mail,
  Building,
  Hash,
  Beaker,
  AlertCircle,
  X,
  Check,
  RotateCw,
  ChevronDown,
  Filter,
  Target,
  ShoppingCart,
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
  getRMQualityReports,
} from '../../../utils/api';
import { RMQualityReport as RMQualityReportType } from '../../../Types/qualityTypes';
import api, { API_ROUTES } from '../../../utils/api';
import { mailFilteredRMQualityReports } from '../../../utils/api';
import { exportFilteredRMQualityReports } from '../../../utils/api';
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
  { parameter: 'Moisture', standard: 'max 10%' },
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

// Types for PO-based flow
interface POItem {
  id: string;
  rawMaterialId: string;
  quantityOrdered: number;
  rate: number;
  totalReceived: number;
  status: string;
  rawMaterial: { id: string; name: string; skuCode: string; category: string };
  receivals: any[];
}

interface ReceivedPO {
  id: string;
  poNumber: string;
  vendorId: string;
  orderDate: string;
  expectedDate: string;
  status: string;
  vendor: { id: string; name: string; vendorCode: string };
  items: POItem[];
}

interface GRNEntry {
  id: string;
  grnNumber: string;
  purchaseOrderId: string;
  purchaseOrderItemId: string;
  rawMaterialName: string;
  variety: string;
  supplier: string;
  createdAt: string;
  purchaseOrder: { id: string; poNumber: string; vendor: { name: string } };
  purchaseOrderItem: { rawMaterial: { name: string; skuCode: string }; quantityOrdered: number; totalReceived: number };
  qualityReport: RMQualityReportType | null;
  createdBy: { id: string; name: string; email: string };
}

const RMQualityReport: React.FC = () => {
  const [isExportingFiltered, setIsExportingFiltered] = useState(false);
  const handleExportFiltered = async () => {
    if (filteredGRNs.length === 0) {
      setError('No filtered reports available to export');
      return;
    }
    try {
      setIsExportingFiltered(true);
      setError(null);
      // If user selected GRN rows, map them to their quality report IDs
      let idsToSend: string[] | undefined = undefined;
      if (selectedGRNIds && selectedGRNIds.length > 0) {
        const mapped = selectedGRNIds
          .map(sid => grns.find(g => g.id === sid)?.qualityReport?.id)
          .filter((v): v is string => typeof v === 'string' && v.length > 0);
        if (mapped.length === 0) {
          setError('Selected GRNs do not have associated quality reports to export');
          setIsExportingFiltered(false);
          return;
        }
        idsToSend = mapped;
      }

      const filtersToSend = {
        supplier: appliedFilters.supplier,
        grn: appliedFilters.grn,
        fromDate: appliedFilters.fromDate,
        toDate: appliedFilters.toDate,
        ids: idsToSend,
      };
      const response = await exportFilteredRMQualityReports(filtersToSend);
      if (response && response.data) {
        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute(
          'download',
          `Filtered_RM_Quality_Reports_${new Date().toISOString().split('T')[0]}.xlsx`
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        toast.success('Filtered Excel export started');
      } else {
        setError('Failed to export filtered reports');
      }
    } catch (error) {
      setError('Failed to export filtered reports');
    } finally {
      setIsExportingFiltered(false);
    }
  };

  // GRN list state
  const [grns, setGRNs] = useState<GRNEntry[]>([]);
  const [reports, setReports] = useState<RMQualityReportType[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [isMailingAll, setIsMailingAll] = useState(false);
  const [isMailingFiltered, setIsMailingFiltered] = useState(false);
  const [selectedGRNIds, setSelectedGRNIds] = useState<string[]>([]);
  const [isDeletingMultiple, setIsDeletingMultiple] = useState(false);

  const handleMailFiltered = async () => {
    if (filteredGRNs.length === 0) {
      setError('No filtered reports available to mail');
      return;
    }
    try {
      setIsMailingFiltered(true);
      setError(null);
      const filtersToSend = {
        supplier: appliedFilters.supplier,
        grn: appliedFilters.grn,
        fromDate: appliedFilters.fromDate,
        toDate: appliedFilters.toDate,
      };
      const response = await mailFilteredRMQualityReports(filtersToSend);
      if (response.data.success) {
        toast.success(response.data.message || 'Filtered reports mailed successfully');
      } else {
        setError(response.data.error || 'Failed to mail filtered reports');
      }
    } catch (error) {
      setError('Failed to mail filtered reports');
    } finally {
      setIsMailingFiltered(false);
    }
  };

  const [error, setError] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    supplier: '',
    grn: '',
    fromDate: '',
    toDate: '',
  });
  const [appliedFilters, setAppliedFilters] = useState({
    supplier: '',
    grn: '',
    fromDate: '',
    toDate: '',
  });

  const applyFilters = () => setAppliedFilters(filters);
  const clearFilters = () => {
    const empty = { supplier: '', grn: '', fromDate: '', toDate: '' };
    setFilters(empty);
    setAppliedFilters(empty);
  };
  const handleFilterChange = (name: string, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // PO-based form state
  const [receivedPOs, setReceivedPOs] = useState<ReceivedPO[]>([]);
  const [selectedPOId, setSelectedPOId] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);

  // Results state for fixed parameters
  const [results, setResults] = useState<string[]>(
    Array(CHILLI_PARAMETERS.length).fill('')
  );

  const authToken = localStorage.getItem('authToken');

  const selectedPO = receivedPOs.find((p) => p.id === selectedPOId);
  const selectedItem = selectedPO?.items?.[0];

  useEffect(() => {
    fetchGRNs();
    fetchReceivedPOs();
    fetchReports();
  }, []);

  const fetchReceivedPOs = async () => {
    try {
      const response = await api.get(API_ROUTES.RAW.GET_RECEIVED_POS, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (response.data.success) {
        setReceivedPOs(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch received POs:', error);
    }
  };

  const fetchGRNs = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ROUTES.RAW.GET_GRNS, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (response.data.success) {
        setGRNs(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch GRNs');
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const response = await getRMQualityReports({ search: searchTerm });
      if (response.success) {
        setReports(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch reports');
    }
  };

  // Check if form is valid
  useEffect(() => {
    const poSelected = selectedPOId !== '' && !!selectedItem;
    const parametersValid = results.every((r) => r.trim() !== '');
    setIsFormValid(poSelected && parametersValid);
  }, [selectedPOId, selectedItem, results]);



  const handleResultChange = (index: number, value: string) => {
    const newResults = [...results];
    newResults[index] = value;
    setResults(newResults);
  };

  // Generate GRN handler
  const handleGenerateGRN = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid || !selectedPO || !selectedItem) {
      setError('Please select a PO and complete all parameters');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const data = {
        purchaseOrderId: selectedPOId,
        purchaseOrderItemId: selectedItem.id,
        rawMaterialName: selectedItem.rawMaterial.name,
        variety: '',
        supplier: selectedPO.vendor.name,
        parameters: CHILLI_PARAMETERS.map((p, i) => ({
          parameter: p.parameter,
          standard: p.standard,
          result: results[i],
        })),
      };

      const response = await api.post(API_ROUTES.RAW.CREATE_GRN, data, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (response.data.success) {
        toast.success(`GRN ${response.data.data.grnNumber} generated successfully`);
        setShowForm(false);
        resetForm();
        fetchGRNs();
        fetchReports();
        fetchReceivedPOs();
      } else {
        setError(response.data.error || 'Failed to generate GRN');
      }
    } catch (error) {
      // Show server-provided error when available
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err: any = error;
      const serverMsg = err?.response?.data?.error || err?.message;
      setError(serverMsg || 'Failed to generate GRN');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGRN = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this GRN and its quality report?')) {
      try {
        const response = await api.delete(API_ROUTES.RAW.DELETE_GRN(id), {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (response.data.success) {
          toast.success('GRN deleted successfully');
          fetchGRNs();
          fetchReports();
          fetchReceivedPOs();
        } else {
          toast.error(response.data.error || 'Failed to delete GRN');
        }
      } catch (error) {
        toast.error('Failed to delete GRN');
      }
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedGRNIds(prev =>
      prev.includes(id) ? prev.filter(gid => gid !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedGRNIds.length === filteredGRNs.length) {
      setSelectedGRNIds([]);
    } else {
      setSelectedGRNIds(filteredGRNs.map(g => g.id));
    }
  };

  const handleDeleteMultiple = async () => {
    if (selectedGRNIds.length === 0) {
      toast.error('No GRNs selected');
      return;
    }
    if (window.confirm(`Are you sure you want to delete ${selectedGRNIds.length} selected GRN(s)?`)) {
      try {
        setIsDeletingMultiple(true);
        const deletePromises = selectedGRNIds.map(id =>
          api.delete(API_ROUTES.RAW.DELETE_GRN(id), {
            headers: { Authorization: `Bearer ${authToken}` },
          })
        );
        const results = await Promise.all(deletePromises);
        const successCount = results.filter(r => r.data.success).length;
        const failCount = results.length - successCount;
        if (successCount > 0) toast.success(`${successCount} GRN(s) deleted successfully`);
        if (failCount > 0) toast.error(`Failed to delete ${failCount} GRN(s)`);
        setSelectedGRNIds([]);
        fetchGRNs();
        fetchReports();
        fetchReceivedPOs();
      } catch (error) {
        toast.error('Failed to delete GRNs');
      } finally {
        setIsDeletingMultiple(false);
      }
    }
  };

  const handleExport = async (
    id: string,
    fmt: 'excel' | 'pdf' = 'excel'
  ) => {
    try {
      if (fmt === 'excel') {
        // Find the GRN's quality report ID
        const grn = grns.find(g => g.id === id);
        const reportId = grn?.qualityReport?.id;
        if (!reportId) {
          toast.error('No quality report associated with this GRN');
          return;
        }
        const url = `${API_ROUTES.RAW.EXPORT_QUALITY_REPORT(reportId)}?format=excel`;
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        if (!response.ok) {
          toast.error('Failed to export report');
          return;
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `RM_Quality_Report_${grn?.grnNumber || id}.xlsx`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
        toast.success('Excel export started');
      }
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const handleExportAll = async () => {
    if (reports.length === 0) {
      setError('No reports available to export');
      return;
    }

    try {
      setIsExportingAll(true);
      const response = await api.get(
        `${API_ROUTES.RAW.EXPORT_ALL_QUALITY_REPORTS}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
          responseType: 'blob',
        }
      );

      // Create blob and trigger download
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // <-- Excel MIME type
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `RM_Quality_Reports_${new Date().toISOString().split('T')[0]}.xlsx` // <-- Excel extension
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      setError('Failed to export reports');
    } finally {
      setIsExportingAll(false);
    }
  };

  const handleMailAll = async () => {
    if (reports.length === 0) {
      setError('No reports available to mail');
      return;
    }

    try {
      setIsMailingAll(true);
      const response = await api.get(
        `${API_ROUTES.RAW.MAIL_ALL_QUALITY_REPORTS}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (response.data.success) {
        toast.success(response.data.message || 'Reports mailed successfully');
      } else {
        setError(response.data.error || 'Failed to mail reports');
      }
    } catch (error) {
      console.error('Mail failed:', error);
      setError('Failed to mail reports');
    } finally {
      setIsMailingAll(false);
    }
  };

  const resetForm = () => {
    setSelectedPOId('');
    setResults(Array(CHILLI_PARAMETERS.length).fill(''));
    setError(null);
  };

  const filteredGRNs = grns.filter((grn) => {
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      [grn.rawMaterialName, grn.variety, grn.supplier, grn.grnNumber,
       grn.purchaseOrder?.poNumber].some((f) =>
        String(f || '').toLowerCase().includes(q)
      );

    const { supplier, grn: grnFilter, fromDate, toDate } = appliedFilters;
    if (supplier && supplier !== grn.supplier) return false;
    if (grnFilter && !grn.grnNumber.toLowerCase().includes(grnFilter.toLowerCase())) return false;

    const grnDate = grn.createdAt ? new Date(grn.createdAt) : null;
    if (fromDate && grnDate && new Date(fromDate) > grnDate) return false;
    if (toDate && grnDate && new Date(toDate) < grnDate) return false;

    return matchesSearch;
  });

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
        <div className="max-w-7xl mx-auto pt-0 pb-4 sm:pt-0 sm:px-6 sm:pb-6">
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
                  Generate GRN
                </h1>
                <div className="ml-auto">
                  <button
                    onClick={() => {
                      setShowForm(false);
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

          {/* Main Content: 30-70 Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Sidebar: PO Selection */}
            <motion.div variants={itemVariants} className="lg:col-span-3">
              <div className="bg-card rounded-xl border border-border sticky top-4">
                <div className="p-5 border-b border-border">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <ShoppingCart size={18} />
                    Purchase Order
                    {selectedPO && selectedItem && (
                      <span className="ml-2 inline-flex items-center text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">
                        <Check size={12} className="mr-1" />
                        Selected
                      </span>
                    )}
                  </h2>
                </div>

                <div className="p-5 space-y-5">
                  {/* PO Selector */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                      Purchase Order <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={selectedPOId}
                        onChange={(e) => {
                          setSelectedPOId(e.target.value);
                        }}
                        className="w-full border border-input rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background pl-10 appearance-none cursor-pointer"
                      >
                        <option value="">Select Purchase Order</option>
                        {receivedPOs.map((po) => (
                          <option key={po.id} value={po.id}>
                            {po.poNumber} — {po.vendor.name}
                          </option>
                        ))}
                      </select>
                      <ShoppingCart
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

                  {/* Auto-filled details */}
                  {selectedItem && (
                    <div className="space-y-3 pt-3 border-t border-border">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Auto-Filled Details
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Package size={14} className="text-primary" />
                          <span className="text-muted-foreground">Raw Material:</span>
                          <span className="font-medium text-foreground">{selectedItem.rawMaterial.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Building size={14} className="text-primary" />
                          <span className="text-muted-foreground">Supplier:</span>
                          <span className="font-medium text-foreground">{selectedPO!.vendor.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Hash size={14} className="text-primary" />
                          <span className="text-muted-foreground">PO Number:</span>
                          <span className="font-medium text-foreground">{selectedPO!.poNumber}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Package size={14} className="text-primary" />
                          <span className="text-muted-foreground">Qty Ordered:</span>
                          <span className="font-medium text-foreground">{selectedItem.quantityOrdered}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Check size={14} className="text-primary" />
                          <span className="text-muted-foreground">Qty Received:</span>
                          <span className="font-medium text-foreground">{selectedItem.totalReceived}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Right Content: Quality Parameters (75%) */}
            <motion.div variants={itemVariants} className="lg:col-span-9">
              <div className="bg-card border border-border">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Beaker size={16} className="text-primary" />
                    Quality Parameters
                  </h2>
                  {parametersComplete && (
                    <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 border border-primary/20">
                      <Check size={12} className="inline mr-1" />
                      Complete
                    </span>
                  )}
                </div>

                {selectedItem ? (
                  <div className="divide-y divide-border">
                    {CHILLI_PARAMETERS.map((param, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="px-4 py-3 hover:bg-muted/40 transition-colors"
                      >
                        <div className="grid grid-cols-12 gap-3 items-center">
                          <div className="col-span-4">
                            <div className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                              <Beaker size={11} /> Parameter
                            </div>
                            <div className="text-sm font-medium text-foreground">
                              {param.parameter}
                            </div>
                          </div>
                          <div className="col-span-4">
                            <div className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                              <Target size={11} /> Standard
                            </div>
                            <div className="text-sm text-foreground">
                              {param.standard}
                            </div>
                          </div>
                          <div className="col-span-3">
                            <input
                              type="text"
                              value={results[index]}
                              onChange={(e) =>
                                handleResultChange(index, e.target.value)
                              }
                              className="w-full text-sm px-2 py-1 border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary/40"
                              placeholder="Result *"
                            />
                          </div>
                          <div className="col-span-1 flex justify-end">
                            {results[index]?.trim() ? (
                              <Check size={14} className="text-primary" />
                            ) : (
                              <Clock size={14} className="text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6">
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-8 text-center">
                      <p className="text-sm text-muted-foreground">
                        Select a Purchase Order and item to view quality parameters.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

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
                        Ready to generate GRN
                      </span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center text-foreground bg-muted px-3 py-1.5 rounded border border-border">
                      <Clock size={16} className="mr-2" />
                      <span className="text-sm font-medium">
                        Select PO & fill parameters
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
                      resetForm();
                    }}
                    className="px-4 py-2 border border-input text-foreground bg-background hover:bg-accent rounded-lg text-sm transition"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerateGRN}
                    disabled={isSaving || !isFormValid}
                    className={`px-5 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2 transition ${isSaving || !isFormValid
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
                        Generating...
                      </>
                    ) : (
                      <>
                        <Hash size={16} />
                        Generate GRN
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

  // Main list view - GRN-wise tabular
  return (
    <motion.div
      className="min-h-screen bg-background"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto shadow-sm rounded-xl">
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
                  RM Quality Reports (GRN)
                </h1>
              </div>
              <div className="flex gap-2">
                {selectedGRNIds.length > 0 && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDeleteMultiple}
                    disabled={isDeletingMultiple}
                    className={`px-4 py-2.5 rounded-lg flex items-center font-bold text-sm shadow-md transition-all cursor-pointer ${
                      isDeletingMultiple
                        ? 'bg-muted text-muted-foreground cursor-not-allowed'
                        : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                    }`}
                  >
                    {isDeletingMultiple ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, ease: 'linear', repeat: Infinity }}
                        >
                          <RotateCw size={16} className="mr-2" strokeWidth={2.5} />
                        </motion.div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <X size={16} className="mr-2" strokeWidth={2.5} />
                        Delete ({selectedGRNIds.length})
                      </>
                    )}
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleExportFiltered}
                  disabled={isExportingFiltered || filteredGRNs.length === 0}
                  className={`px-4 py-2.5 rounded-lg flex items-center font-bold text-sm shadow-md transition-all cursor-pointer ${isExportingFiltered || filteredGRNs.length === 0
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    }`}
                  title="Export only filtered reports"
                >
                  {isExportingFiltered ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, ease: 'linear', repeat: Infinity }}>
                        <RotateCw size={16} className="mr-2" strokeWidth={2.5} />
                      </motion.div>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download size={16} className="mr-2" strokeWidth={2.5} />
                      Export Filtered
                    </>
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleExportAll}
                  disabled={isExportingAll || grns.length === 0}
                  className={`px-4 py-2.5 rounded-lg flex items-center font-bold text-sm shadow-md transition-all cursor-pointer ${isExportingAll || grns.length === 0
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/90'
                    }`}
                >
                  {isExportingAll ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, ease: 'linear', repeat: Infinity }}>
                        <RotateCw size={16} className="mr-2" strokeWidth={2.5} />
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
                  onClick={handleMailAll}
                  disabled={isMailingAll || grns.length === 0}
                  className={`px-4 py-2.5 rounded-lg flex items-center font-bold text-sm shadow-md transition-all cursor-pointer ${isMailingAll || grns.length === 0
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    }`}
                >
                  {isMailingAll ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, ease: 'linear', repeat: Infinity }}>
                        <RotateCw size={16} className="mr-2" strokeWidth={2.5} />
                      </motion.div>
                      Mailing...
                    </>
                  ) : (
                    <>
                      <Mail size={16} className="mr-2" strokeWidth={2.5} />
                      Mail All
                    </>
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleMailFiltered}
                  disabled={isMailingFiltered || filteredGRNs.length === 0}
                  className={`px-4 py-2.5 rounded-lg flex items-center font-bold text-sm shadow-md transition-all cursor-pointer ${isMailingFiltered || filteredGRNs.length === 0
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/90'
                    }`}
                  title="Mail only filtered reports"
                >
                  {isMailingFiltered ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, ease: 'linear', repeat: Infinity }}>
                        <RotateCw size={16} className="mr-2" strokeWidth={2.5} />
                      </motion.div>
                      Mailing...
                    </>
                  ) : (
                    <>
                      <Mail size={16} className="mr-2" strokeWidth={2.5} />
                      Mail Filtered
                    </>
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowForm(true);
                    resetForm();
                  }}
                  className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center font-bold text-base shadow-md transition-all cursor-pointer"
                >
                  <Plus size={18} className="mr-2 font-bold" strokeWidth={2.5} />
                  Generate GRN
                </motion.button>
              </div>
            </div>
          </div>

          {/* Search and Filters Section */}
          <div className="p-6 pt-3 pb-2">
            <div className="flex flex-col md:flex-row gap-4 mb-3">
              {!isFilterOpen && (
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by GRN, PO, raw material, supplier..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2.5 w-full border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-ring outline-none transition-all duration-200 text-sm bg-background"
                  />
                </div>
              )}

              <div className="flex gap-2 shrink-0 items-center">
                <motion.button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors duration-200 text-sm ${isFilterOpen ? 'bg-accent/10 border border-primary/20' : 'bg-background border border-input hover:bg-accent'}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">Filter</span>
                  {Object.values(appliedFilters).some((v) => v) && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs bg-primary text-primary-foreground">
                      Applied
                    </span>
                  )}
                  <motion.div
                    animate={{ rotate: isFilterOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={14} className="text-muted-foreground" />
                  </motion.div>
                </motion.button>

                <motion.button
                  onClick={() => { fetchGRNs(); fetchReports(); }}
                  className="flex items-center gap-2 px-4 py-2.5 border border-input bg-background rounded-lg hover:bg-accent transition-colors duration-200 text-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">Refresh</span>
                </motion.button>
              </div>

              {isFilterOpen && (
                <div className="mt-2 p-2 bg-card border border-border rounded-lg grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
                  <div className="md:col-span-2 flex flex-col">
                    <label className="block text-xs text-muted-foreground mb-0.5">Supplier</label>
                    <input
                      value={filters.supplier}
                      onChange={(e) => handleFilterChange('supplier', e.target.value)}
                      className="w-full border border-input rounded px-2 py-1 bg-background text-xs focus:ring-1 focus:ring-primary/30 h-8"
                      placeholder="Supplier name"
                    />
                  </div>
                  <div className="md:col-span-2 flex flex-col">
                    <label className="block text-xs text-muted-foreground mb-0.5">GRN</label>
                    <input
                      value={filters.grn}
                      onChange={(e) => handleFilterChange('grn', e.target.value)}
                      className="w-full border border-input rounded px-2 py-1 bg-background text-xs focus:ring-1 focus:ring-primary/30 h-8"
                      placeholder="Contains GRN"
                    />
                  </div>
                  <div className="md:col-span-1 flex flex-col">
                    <label className="block text-xs text-muted-foreground mb-0.5">From Date</label>
                    <input
                      type="date"
                      value={filters.fromDate}
                      onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                      className="w-full border border-input rounded px-2 py-1 bg-background text-xs focus:ring-1 focus:ring-primary/30 h-8"
                    />
                  </div>
                  <div className="md:col-span-1 flex flex-col">
                    <label className="block text-xs text-muted-foreground mb-0.5">To Date</label>
                    <input
                      type="date"
                      value={filters.toDate}
                      onChange={(e) => handleFilterChange('toDate', e.target.value)}
                      className="w-full border border-input rounded px-2 py-1 bg-background text-xs focus:ring-1 focus:ring-primary/30 h-8"
                    />
                  </div>
                  <div className="md:col-span-6 flex gap-2 justify-end pt-1">
                    <button
                      onClick={clearFilters}
                      className="px-3 py-1 border rounded bg-background text-xs hover:bg-accent h-8"
                    >
                      Clear
                    </button>
                    <button
                      onClick={applyFilters}
                      className="px-3 py-1 bg-primary text-primary-foreground rounded text-xs hover:bg-primary/90 h-8"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* GRN Table Section */}
          <div className="pt-0">
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <motion.div
                  animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, ease: 'linear', repeat: Infinity }}
                  className="rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary"
                />
              </div>
            ) : filteredGRNs.length === 0 ? (
              <div className="p-12 text-center">
                <div className="p-3 bg-primary/10 rounded-full inline-block mb-4">
                  <FileText size={36} className="text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No GRNs found
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
                  {searchTerm
                    ? 'No GRNs match your search criteria. Try adjusting your search.'
                    : 'Get started by generating your first GRN from a Purchase Order'}
                </p>
                {!searchTerm && (
                  <motion.button
                    onClick={() => {
                      setShowForm(true);
                      resetForm();
                    }}
                    className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 inline-flex items-center font-medium text-sm"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Plus size={14} className="mr-1" />
                    Generate First GRN
                  </motion.button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-border text-sm">
                  <thead className="bg-muted/40 border-b border-border">
                    <tr className="text-xs text-muted-foreground uppercase">
                      <th className="px-3 py-2 text-center w-12">
                        <input
                          type="checkbox"
                          checked={filteredGRNs.length > 0 && selectedGRNIds.length === filteredGRNs.length}
                          onChange={handleToggleSelectAll}
                          className="w-4 h-4 cursor-pointer accent-primary"
                          title="Select all"
                        />
                      </th>
                      <th className="px-3 py-2 text-left">GRN Number</th>
                      <th className="px-3 py-2 text-left">PO Number</th>
                      <th className="px-3 py-2 text-left">Raw Material</th>
                      <th className="px-3 py-2 text-left">Variety</th>
                      <th className="px-3 py-2 text-left">Supplier</th>
                      <th className="px-3 py-2 text-left">Qty (Ordered/Received)</th>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">Params</th>
                      <th className="px-3 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {filteredGRNs.map((grn, index) => (
                      <motion.tr
                        key={grn.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04 }}
                        className="hover:bg-muted/30"
                      >
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={selectedGRNIds.includes(grn.id)}
                            onChange={() => handleToggleSelect(grn.id)}
                            className="w-4 h-4 cursor-pointer accent-primary"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td className="px-3 py-2 font-mono text-xs font-bold text-primary">
                          {grn.grnNumber}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                          {grn.purchaseOrder?.poNumber || '-'}
                        </td>
                        <td className="px-3 py-2 font-medium text-foreground">
                          {grn.rawMaterialName}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {grn.variety || '-'}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {grn.supplier}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          <span className="text-foreground font-medium">{grn.purchaseOrderItem?.quantityOrdered ?? '-'}</span>
                          {' / '}
                          <span className="text-primary font-medium">{grn.purchaseOrderItem?.totalReceived ?? '-'}</span>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {formatDate(grn.createdAt)}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {grn.qualityReport?.parameters?.length || 0}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <details className="relative inline-block">
                            <summary className="cursor-pointer list-none px-2 py-1 text-muted-foreground hover:text-foreground">
                              ⋮
                            </summary>
                            <div className="absolute right-0 mt-1 w-32 border border-border bg-card shadow-md z-20 text-left rounded-lg overflow-hidden">
                              <button
                                onClick={() => handleExport(grn.id, 'excel')}
                                className="block w-full px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                              >
                                Export
                              </button>
                              <button
                                onClick={() => handleDeleteGRN(grn.id)}
                                className="block w-full px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </details>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default RMQualityReport;
