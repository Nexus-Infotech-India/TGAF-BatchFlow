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
  ChevronDown,
  Filter,
  Target,
  ShoppingCart,
  MoreVertical,
  Eye,
  Calendar,
  User,
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
  const [actionModalGRN, setActionModalGRN] = useState<GRNEntry | null>(null);
  const [viewGRN, setViewGRN] = useState<GRNEntry | null>(null);

  const handleMailFiltered = async () => {
    if (filteredGRNs.length === 0) {
      setError('No filtered reports available to mail');
      return;
    }
    try {
      setIsMailingFiltered(true);
      setError(null);

      // If user selected GRN rows, map them to their quality report IDs
      let idsToSend: string[] | undefined = undefined;
      if (selectedGRNIds && selectedGRNIds.length > 0) {
        const mapped = selectedGRNIds
          .map(sid => grns.find(g => g.id === sid)?.qualityReport?.id)
          .filter((v): v is string => typeof v === 'string' && v.length > 0);
        if (mapped.length === 0) {
          setError('Selected GRNs do not have associated quality reports to mail');
          setIsMailingFiltered(false);
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

  // PDF Download handler — generates a styled PDF from GRN data
  const handleDownloadPDF = (grn: GRNEntry) => {
    const params = grn.qualityReport?.parameters || [];
    const grnDate = grn.createdAt ? format(new Date(grn.createdAt), 'dd MMM yyyy') : 'N/A';

    const paramRows = params.map((p: any) =>
      `<tr><td style="padding:8px 12px;border:1px solid #e2e2e2;font-size:13px;">${p.parameter}</td><td style="padding:8px 12px;border:1px solid #e2e2e2;font-size:13px;text-align:center;">${p.standard}</td><td style="padding:8px 12px;border:1px solid #e2e2e2;font-size:13px;text-align:center;font-weight:600;">${p.result}</td></tr>`
    ).join('');

    const html = `
      <html><head><title>GRN Report - ${grn.grnNumber}</title>
      <style>
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        body { font-family: 'Segoe UI', Arial, sans-serif; margin:0; padding:40px; color:#222; }
        .header { background: linear-gradient(135deg, #5317AA, #178EC8); color:#fff; padding:28px 32px; border-radius:12px; margin-bottom:28px; }
        .header h1 { margin:0 0 4px; font-size:22px; font-weight:700; }
        .header p { margin:0; font-size:13px; opacity:0.85; }
        .section { margin-bottom:22px; }
        .section-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; color:#5317AA; margin-bottom:10px; padding-bottom:6px; border-bottom:2px solid #5317AA20; }
        .details-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px 24px; }
        .detail-item { display:flex; gap:8px; font-size:13px; padding:4px 0; }
        .detail-label { color:#777; min-width:110px; }
        .detail-value { font-weight:600; color:#222; }
        table { width:100%; border-collapse:collapse; margin-top:8px; }
        thead th { background:#5317AA; color:#fff; padding:10px 12px; font-size:11px; text-transform:uppercase; letter-spacing:1px; text-align:left; }
        thead th:not(:first-child) { text-align:center; }
        tbody tr:nth-child(even) { background:#f8f6ff; }
        .footer { margin-top:32px; padding-top:16px; border-top:1px solid #e2e2e2; font-size:11px; color:#999; text-align:center; }
      </style></head><body>
      <div class="header"><h1>RM Quality Report</h1><p>GRN: ${grn.grnNumber} &middot; Generated on ${grnDate}</p></div>
      <div class="section"><div class="section-title">GRN Details</div>
        <div class="details-grid">
          <div class="detail-item"><span class="detail-label">GRN Number:</span><span class="detail-value">${grn.grnNumber}</span></div>
          <div class="detail-item"><span class="detail-label">PO Number:</span><span class="detail-value">${grn.purchaseOrder?.poNumber || '—'}</span></div>
          <div class="detail-item"><span class="detail-label">Raw Material:</span><span class="detail-value">${grn.rawMaterialName}</span></div>
          <div class="detail-item"><span class="detail-label">Variety:</span><span class="detail-value">${grn.variety || '—'}</span></div>
          <div class="detail-item"><span class="detail-label">Supplier:</span><span class="detail-value">${grn.supplier}</span></div>
          <div class="detail-item"><span class="detail-label">Date:</span><span class="detail-value">${grnDate}</span></div>
          <div class="detail-item"><span class="detail-label">Qty Ordered:</span><span class="detail-value">${grn.purchaseOrderItem?.quantityOrdered ?? '—'}</span></div>
          <div class="detail-item"><span class="detail-label">Qty Received:</span><span class="detail-value">${grn.purchaseOrderItem?.totalReceived ?? '—'}</span></div>
        </div>
      </div>
      <div class="section"><div class="section-title">Quality Parameters</div>
        <table><thead><tr><th>Parameter</th><th>Standard</th><th>Result</th></tr></thead><tbody>${paramRows || '<tr><td colspan="3" style="padding:16px;text-align:center;color:#999;">No parameters recorded</td></tr>'}</tbody></table>
      </div>
      <div class="footer">TGAF BatchFlow &middot; RM Quality Report &middot; ${grn.grnNumber} &middot; Printed ${format(new Date(), 'dd MMM yyyy, HH:mm')}</div>
      </body></html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 400);
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium animate__animated animate__fadeInDown"
                style={{
                  background: 'color-mix(in srgb, var(--destructive) 12%, var(--card))',
                  border: '1px solid color-mix(in srgb, var(--destructive) 30%, var(--border))',
                  color: 'var(--destructive)',
                }}
              >
                <AlertCircle size={16} />
                <span className="flex-1 font-medium">{error}</span>
                <button onClick={() => setError(null)} className="p-1 rounded-lg transition-all hover:opacity-70" aria-label="Close">
                  <X size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div variants={itemVariants} className="bg-brand-header rounded-2xl px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div
                className="flex items-center justify-center w-11 h-11 rounded-xl shadow-md"
                style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
              >
                <FileText size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
                  Generate RM Quality Report
                </h1>
                <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  Create a new Goods Receipt Note with quality parameters
                </p>
              </div>
            </div>
            <button
              onClick={() => { setShowForm(false); resetForm(); }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95"
              style={{ background: 'var(--muted)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
            >
              <ChevronRight size={14} className="rotate-180" />
              Back
            </button>
          </motion.div>

          {/* Main Content: 30-70 Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Sidebar: PO Selection */}
            <motion.div variants={itemVariants} className="lg:col-span-3">
              <div className="rounded-2xl border sticky top-4" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 6%, var(--card)), color-mix(in srgb, var(--secondary) 4%, var(--card)))' }}>
                  <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                    <ShoppingCart size={16} style={{ color: 'var(--primary)' }} />
                    Purchase Order
                    {selectedPO && selectedItem && (
                      <span className="ml-auto inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--primary) 14%, transparent)', color: 'var(--primary)' }}>
                        <Check size={10} className="mr-1" />
                        Selected
                      </span>
                    )}
                  </h2>
                </div>

                <div className="p-5 space-y-5">
                  {/* PO Selector */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                      Purchase Order <span style={{ color: 'var(--destructive)' }}>*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={selectedPOId}
                        onChange={(e) => setSelectedPOId(e.target.value)}
                        className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all duration-200 appearance-none cursor-pointer"
                        style={{
                          background: 'color-mix(in srgb, var(--card) 96%, var(--primary) 4%)',
                          border: '1px solid var(--border)',
                          color: 'var(--foreground)',
                          paddingLeft: '2.25rem',
                        }}
                      >
                        <option value="">Select Purchase Order</option>
                        {receivedPOs.map((po) => (
                          <option key={po.id} value={po.id}>
                            {po.poNumber} — {po.vendor.name}
                          </option>
                        ))}
                      </select>
                      <ShoppingCart size={14} className="absolute left-3.5 top-3 pointer-events-none" style={{ color: 'var(--primary)' }} />
                      <ChevronDown size={14} className="absolute right-3.5 top-3 pointer-events-none" style={{ color: 'var(--muted-foreground)' }} />
                    </div>
                  </div>

                  {/* Auto-filled details */}
                  {selectedItem && (
                    <div className="space-y-3 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--secondary)' }}>Auto-Filled Details</span>
                        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                      </div>
                      <div className="space-y-2.5">
                        {[
                          { icon: Package, label: 'Raw Material', value: selectedItem.rawMaterial.name },
                          { icon: Building, label: 'Supplier', value: selectedPO!.vendor.name },
                          { icon: Hash, label: 'PO Number', value: selectedPO!.poNumber },
                          { icon: Package, label: 'Qty Ordered', value: selectedItem.quantityOrdered },
                          { icon: Check, label: 'Qty Received', value: selectedItem.totalReceived },
                        ].map(({ icon: Icon, label, value }) => (
                          <div key={label} className="flex items-center gap-2.5 text-sm">
                            <Icon size={13} style={{ color: 'var(--primary)' }} />
                            <span style={{ color: 'var(--muted-foreground)' }}>{label}:</span>
                            <span className="font-medium" style={{ color: 'var(--foreground)' }}>{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Right Content: Quality Parameters (75%) */}
            <motion.div variants={itemVariants} className="lg:col-span-9">
              <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 6%, var(--card)), color-mix(in srgb, var(--secondary) 4%, var(--card)))' }}>
                  <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                    <Beaker size={16} style={{ color: 'var(--primary)' }} />
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
                        transition={{ delay: index * 0.04 }}
                        className="px-5 py-3.5 transition-colors duration-150"
                        style={{ borderBottom: index < CHILLI_PARAMETERS.length - 1 ? '1px solid color-mix(in srgb, var(--border) 50%, transparent)' : undefined }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--muted)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                      >
                        <div className="grid grid-cols-12 gap-3 items-center">
                          <div className="col-span-4">
                            <div className="text-[10px] font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1" style={{ color: 'var(--muted-foreground)' }}>
                              <Beaker size={10} /> Parameter
                            </div>
                            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                              {param.parameter}
                            </div>
                          </div>
                          <div className="col-span-4">
                            <div className="text-[10px] font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1" style={{ color: 'var(--muted-foreground)' }}>
                              <Target size={10} /> Standard
                            </div>
                            <div className="text-sm" style={{ color: 'var(--secondary)' }}>
                              {param.standard}
                            </div>
                          </div>
                          <div className="col-span-3">
                            <input
                              type="text"
                              value={results[index]}
                              onChange={(e) => handleResultChange(index, e.target.value)}
                              className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-all duration-200"
                              style={{
                                background: 'color-mix(in srgb, var(--card) 96%, var(--primary) 4%)',
                                border: '1px solid var(--border)',
                                color: 'var(--foreground)',
                              }}
                              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--primary) 12%, transparent)'; }}
                              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                              placeholder="Result *"
                            />
                          </div>
                          <div className="col-span-1 flex justify-end">
                            {results[index]?.trim() ? (
                              <Check size={14} style={{ color: 'var(--primary)' }} />
                            ) : (
                              <Clock size={14} style={{ color: 'var(--muted-foreground)' }} />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8">
                    <div className="rounded-xl p-8 text-center" style={{ background: 'color-mix(in srgb, var(--primary) 6%, transparent)', border: '1px dashed color-mix(in srgb, var(--primary) 25%, var(--border))' }}>
                      <ShoppingCart size={28} style={{ color: 'var(--primary)', margin: '0 auto', marginBottom: '0.75rem' }} />
                      <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
                        Select a Purchase Order to view quality parameters.
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
            className="rounded-2xl border"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <div className="px-5 py-4">
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  {isFormValid ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: 'color-mix(in srgb, var(--primary) 12%, transparent)', color: 'var(--primary)', border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)' }}>
                      <Check size={13} />
                      Ready to generate GRN
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}>
                      <Clock size={13} />
                      Select PO & fill parameters
                    </div>
                  )}
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {CHILLI_PARAMETERS.length} parameters configured
                  </span>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); resetForm(); }}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95"
                    style={{ background: 'var(--muted)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}
                  >
                    <X size={13} /> Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerateGRN}
                    disabled={isSaving || !isFormValid}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all duration-200 hover:shadow-lg active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: isSaving || !isFormValid ? 'var(--muted)' : 'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 80%, var(--secondary)))',
                      color: isSaving || !isFormValid ? 'var(--muted-foreground)' : 'var(--primary-foreground)',
                    }}
                  >
                    {isSaving ? (
                      <><span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
                    ) : (
                      <><Hash size={14} /> Generate Report</>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* ── Page Header ── */}
        <motion.div variants={itemVariants} className="bg-brand-header rounded-2xl px-6 py-5 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div
              className="flex items-center justify-center w-11 h-11 rounded-xl shadow-md"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              <FileText size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
                RM Quality Reports
              </h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                Goods Receipt Notes &middot; <span className="font-medium" style={{ color: 'var(--primary)' }}>{grns.length}</span> GRN{grns.length !== 1 ? 's' : ''} recorded
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { setShowForm(true); resetForm(); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all duration-200 hover:shadow-lg active:scale-[0.97]"
            style={{
              background: 'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 80%, var(--secondary)))',
              color: 'var(--primary-foreground)',
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            Generate RM Quality Report
          </motion.button>
        </motion.div>

        {/* ── Action Toolbar ── */}
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border overflow-hidden"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div
            className="flex flex-wrap items-center gap-2 px-5 py-3"
            style={{
              background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 6%, var(--card)), color-mix(in srgb, var(--secondary) 4%, var(--card)))',
              borderBottom: '1px solid var(--border)',
            }}
          >


            <button
              onClick={handleExportFiltered}
              disabled={isExportingFiltered || filteredGRNs.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 shadow-sm hover:shadow-lg hover:scale-105 active:scale-[0.97] disabled:opacity-40 disabled:shadow-none"
              style={{
                background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
                color: 'var(--primary)',
                border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)',
              }}
              title="Export only filtered reports"
            >
              {isExportingFiltered ? <><span className="inline-block w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" /> Exporting...</> : <><Download size={13} /> Export Filtered</>}
            </button>

            <button
              onClick={handleExportAll}
              disabled={isExportingAll || grns.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 shadow-sm hover:shadow-lg hover:scale-105 active:scale-[0.97] disabled:opacity-40 disabled:shadow-none"
              style={{
                background: 'color-mix(in srgb, var(--secondary) 12%, transparent)',
                color: 'var(--secondary)',
                border: '1px solid color-mix(in srgb, var(--secondary) 20%, transparent)',
              }}
            >
              {isExportingAll ? <><span className="inline-block w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" /> Exporting...</> : <><Download size={13} /> Export All</>}
            </button>

            <button
              onClick={handleMailAll}
              disabled={isMailingAll || grns.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 shadow-sm hover:shadow-lg hover:scale-105 active:scale-[0.97] disabled:opacity-40 disabled:shadow-none"
              style={{
                background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
                color: 'var(--primary)',
                border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)',
              }}
            >
              {isMailingAll ? <><span className="inline-block w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" /> Mailing...</> : <><Mail size={13} /> Mail All</>}
            </button>

            <button
              onClick={handleMailFiltered}
              disabled={isMailingFiltered || filteredGRNs.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 shadow-sm hover:shadow-lg hover:scale-105 active:scale-[0.97] disabled:opacity-40 disabled:shadow-none"
              style={{
                background: 'color-mix(in srgb, var(--secondary) 12%, transparent)',
                color: 'var(--secondary)',
                border: '1px solid color-mix(in srgb, var(--secondary) 20%, transparent)',
              }}
              title="Mail only filtered reports"
            >
              {isMailingFiltered ? <><span className="inline-block w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" /> Mailing...</> : <><Mail size={13} /> Mail Filtered</>}
            </button>

            <div className="flex-1" />

            <motion.button
              onClick={() => { fetchGRNs(); fetchReports(); }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
              style={{ color: 'var(--muted-foreground)', background: 'var(--muted)', border: '1px solid var(--border)' }}
            >
              <RefreshCw size={13} /> Refresh
            </motion.button>
          </div>

          {/* Search and Filters Section */}
          <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex flex-col md:flex-row gap-3">
              {!isFilterOpen && (
                <div className="relative flex-grow">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }}>
                    <Search size={15} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search by GRN, PO, raw material, supplier..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all duration-200"
                    style={{
                      background: 'color-mix(in srgb, var(--card) 96%, var(--primary) 4%)',
                      border: '1px solid var(--border)',
                      color: 'var(--foreground)',
                      paddingLeft: '2.25rem',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--primary) 12%, transparent)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
              )}

              <div className="flex gap-2 shrink-0 items-center">
                <motion.button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                  style={{
                    background: isFilterOpen ? 'color-mix(in srgb, var(--primary) 10%, transparent)' : 'var(--muted)',
                    border: isFilterOpen ? '1px solid color-mix(in srgb, var(--primary) 25%, transparent)' : '1px solid var(--border)',
                    color: isFilterOpen ? 'var(--primary)' : 'var(--foreground)',
                  }}
                >
                  <Filter size={14} />
                  Filter
                  {Object.values(appliedFilters).some((v) => v) && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                      Active
                    </span>
                  )}
                  <motion.div animate={{ rotate: isFilterOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={13} />
                  </motion.div>
                </motion.button>
              </div>
            </div>

            <AnimatePresence>
              {isFilterOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 p-4 rounded-xl grid grid-cols-1 md:grid-cols-6 gap-3 items-end"
                    style={{ background: 'color-mix(in srgb, var(--primary) 4%, var(--card))', border: '1px solid color-mix(in srgb, var(--primary) 12%, var(--border))' }}
                  >
                    <div className="md:col-span-2 flex flex-col">
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--muted-foreground)' }}>Supplier</label>
                      <input value={filters.supplier} onChange={(e) => handleFilterChange('supplier', e.target.value)} placeholder="Supplier name"
                        className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-all"
                        style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                      />
                    </div>
                    <div className="md:col-span-2 flex flex-col">
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--muted-foreground)' }}>GRN</label>
                      <input value={filters.grn} onChange={(e) => handleFilterChange('grn', e.target.value)} placeholder="Contains GRN"
                        className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-all"
                        style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                      />
                    </div>
                    <div className="md:col-span-1 flex flex-col">
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--muted-foreground)' }}>From</label>
                      <input type="date" value={filters.fromDate} onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                        className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-all"
                        style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                      />
                    </div>
                    <div className="md:col-span-1 flex flex-col">
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--muted-foreground)' }}>To</label>
                      <input type="date" value={filters.toDate} onChange={(e) => handleFilterChange('toDate', e.target.value)}
                        className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-all"
                        style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                      />
                    </div>
                    <div className="md:col-span-6 flex gap-2 justify-end pt-1">
                      <button onClick={clearFilters}
                        className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg text-xs font-medium transition-all active:scale-95"
                        style={{ background: 'var(--muted)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}
                      >
                        <X size={12} /> Clear
                      </button>
                      <button onClick={applyFilters}
                        className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95 shadow-sm"
                        style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                      >
                        <Check size={12} /> Apply
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* GRN Table Section */}
          <div>
            {loading ? (
              <div className="flex flex-col justify-center items-center py-16 gap-3">
                <span className="inline-block w-10 h-10 border-[3px] rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} />
                <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading GRNs…</span>
              </div>
            ) : filteredGRNs.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: 'color-mix(in srgb, var(--primary) 10%, transparent)' }}>
                  <FileText size={32} style={{ color: 'var(--primary)' }} />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                  No GRNs found
                </h3>
                <p className="max-w-md mx-auto text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
                  {searchTerm
                    ? 'No GRNs match your search criteria. Try adjusting your search.'
                    : 'Get started by generating your first GRN from a Purchase Order'}
                </p>
                {!searchTerm && (
                  <motion.button
                    onClick={() => { setShowForm(true); resetForm(); }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all"
                    style={{ background: 'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 80%, var(--secondary)))', color: 'var(--primary-foreground)' }}
                  >
                    <Plus size={14} /> Generate First GRN
                  </motion.button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                      {['', 'GRN Number', 'PO Number', 'Raw Material', 'Variety', 'Supplier', 'Qty (Ord/Recv)', 'Date', 'Params', 'Actions'].map((h, i) => (
                        <th key={h || 'cb'} className={`px-4 py-3 text-xs font-bold uppercase tracking-wider ${i === 0 ? 'w-12 text-center' : i === 9 ? 'text-right' : 'text-left'}`} style={{ color: 'var(--muted-foreground)' }}>
                          {i === 0 ? (
                            <input type="checkbox" checked={filteredGRNs.length > 0 && selectedGRNIds.length === filteredGRNs.length} onChange={handleToggleSelectAll} className="w-4 h-4 cursor-pointer accent-primary" title="Select all" />
                          ) : h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGRNs.map((grn, index) => (
                      <motion.tr
                        key={grn.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="group transition-colors duration-150"
                        style={{ borderBottom: '1px solid color-mix(in srgb, var(--border) 50%, transparent)' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--muted)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                      >
                        <td className="px-4 py-3.5 text-center">
                          <input type="checkbox" checked={selectedGRNIds.includes(grn.id)} onChange={() => handleToggleSelect(grn.id)} className="w-4 h-4 cursor-pointer accent-primary" onClick={(e) => e.stopPropagation()} />
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded inline-block whitespace-nowrap" style={{ background: 'color-mix(in srgb, var(--primary) 10%, transparent)', color: 'var(--primary)' }}>{grn.grnNumber}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-mono text-xs" style={{ color: 'var(--muted-foreground)' }}>{grn.purchaseOrder?.poNumber || '—'}</span>
                        </td>
                        <td className="px-4 py-3.5 text-sm font-medium" style={{ color: 'var(--foreground)' }}>{grn.rawMaterialName}</td>
                        <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--muted-foreground)' }}>{grn.variety || '—'}</td>
                        <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--muted-foreground)' }}>{grn.supplier}</td>
                        <td className="px-4 py-3.5 text-sm">
                          <span style={{ color: 'var(--foreground)' }} className="font-medium">{grn.purchaseOrderItem?.quantityOrdered ?? '—'}</span>
                          <span style={{ color: 'var(--muted-foreground)' }}> / </span>
                          <span style={{ color: 'var(--primary)' }} className="font-semibold">{grn.purchaseOrderItem?.totalReceived ?? '—'}</span>
                        </td>
                        <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--muted-foreground)' }}>{formatDate(grn.createdAt)}</td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--secondary) 12%, transparent)', color: 'var(--secondary)' }}>
                            {grn.qualityReport?.parameters?.length || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setActionModalGRN(grn)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-200"
                            style={{ color: 'var(--muted-foreground)' }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'color-mix(in srgb, var(--primary) 10%, transparent)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--primary)'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-foreground)'; }}
                            title="Actions"
                          >
                            <MoreVertical size={16} />
                          </motion.button>
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

      {/* Action Modal Popup */}
      <AnimatePresence>
        {actionModalGRN && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={() => setActionModalGRN(null)}
          >
            {/* Overlay */}
            <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }} />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md mx-4 overflow-hidden rounded-2xl shadow-2xl"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 10%, var(--card)), color-mix(in srgb, var(--secondary) 6%, var(--card)))' }}>
                <div>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>Choose Action</h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                    GRN: <span className="font-mono font-semibold" style={{ color: 'var(--primary)' }}>{actionModalGRN.grnNumber}</span>
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setActionModalGRN(null)}
                  className="p-2 rounded-lg transition-colors duration-200"
                  style={{ color: 'var(--muted-foreground)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--muted)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--foreground)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-foreground)'; }}
                >
                  <X size={16} />
                </motion.button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-3">
                {/* View GRN Option */}
                <motion.button
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setViewGRN(actionModalGRN); setActionModalGRN(null); }}
                  className="w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-200 group"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'color-mix(in srgb, var(--secondary) 6%, var(--card))'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'color-mix(in srgb, var(--secondary) 25%, var(--border))'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--card)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; }}
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200" style={{ background: 'color-mix(in srgb, var(--secondary) 12%, transparent)', color: 'var(--secondary)' }}>
                    <Eye size={20} />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-semibold block" style={{ color: 'var(--foreground)' }}>View GRN Details</span>
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>View full GRN and quality report details</span>
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--muted-foreground)' }} />
                </motion.button>

                {/* Export Option */}
                <motion.button
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { handleExport(actionModalGRN.id, 'excel'); setActionModalGRN(null); }}
                  className="w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-200 group"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'color-mix(in srgb, var(--primary) 6%, var(--card))'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'color-mix(in srgb, var(--primary) 25%, var(--border))'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--card)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; }}
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200" style={{ background: 'color-mix(in srgb, var(--primary) 12%, transparent)', color: 'var(--primary)' }}>
                    <Download size={20} />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-semibold block" style={{ color: 'var(--foreground)' }}>Export Report</span>
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Download as Excel spreadsheet</span>
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--muted-foreground)' }} />
                </motion.button>
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-3" style={{ borderTop: '1px solid var(--border)' }}>
                <button
                  onClick={() => setActionModalGRN(null)}
                  className="w-full py-2.5 text-sm font-medium rounded-xl transition-all duration-200 active:scale-[0.98]"
                  style={{ background: 'var(--muted)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── View GRN Detail Modal ── */}
      <AnimatePresence>
        {viewGRN && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={() => setViewGRN(null)}
          >
            <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }} />

            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-2xl mx-4 overflow-hidden rounded-2xl shadow-2xl max-h-[85vh] flex flex-col"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 10%, var(--card)), color-mix(in srgb, var(--secondary) 6%, var(--card)))' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                    <FileText size={18} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>GRN Details</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                      <span className="font-mono font-semibold" style={{ color: 'var(--primary)' }}>{viewGRN.grnNumber}</span>
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setViewGRN(null)}
                  className="p-2 rounded-lg transition-colors duration-200"
                  style={{ color: 'var(--muted-foreground)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--muted)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--foreground)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-foreground)'; }}
                >
                  <X size={16} />
                </motion.button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                {/* GRN Info Grid */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--primary)' }}>GRN Information</span>
                    <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: Hash, label: 'GRN Number', value: viewGRN.grnNumber },
                      { icon: ShoppingCart, label: 'PO Number', value: viewGRN.purchaseOrder?.poNumber || '—' },
                      { icon: Package, label: 'Raw Material', value: viewGRN.rawMaterialName },
                      { icon: Package, label: 'Variety', value: viewGRN.variety || '—' },
                      { icon: Building, label: 'Supplier', value: viewGRN.supplier },
                      { icon: Calendar, label: 'Date', value: viewGRN.createdAt ? format(new Date(viewGRN.createdAt), 'dd MMM yyyy') : 'N/A' },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex items-center gap-2.5 p-3 rounded-xl" style={{ background: 'var(--muted)' }}>
                        <Icon size={14} style={{ color: 'var(--primary)' }} />
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>{label}</div>
                          <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{value}</div>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center gap-2.5 p-3 rounded-xl" style={{ background: 'var(--muted)' }}>
                      <Package size={14} style={{ color: 'var(--primary)' }} />
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Quantity (Ordered / Received)</div>
                        <div className="text-sm">
                          <span className="font-medium" style={{ color: 'var(--foreground)' }}>{viewGRN.purchaseOrderItem?.quantityOrdered ?? '—'}</span>
                          <span style={{ color: 'var(--muted-foreground)' }}> / </span>
                          <span className="font-semibold" style={{ color: 'var(--primary)' }}>{viewGRN.purchaseOrderItem?.totalReceived ?? '—'}</span>
                        </div>
                      </div>
                    </div>
                    {viewGRN.createdBy && (
                      <div className="flex items-center gap-2.5 p-3 rounded-xl" style={{ background: 'var(--muted)' }}>
                        <User size={14} style={{ color: 'var(--primary)' }} />
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Created By</div>
                          <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{viewGRN.createdBy.name}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quality Parameters */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--secondary)' }}>Quality Parameters</span>
                    <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--secondary) 12%, transparent)', color: 'var(--secondary)' }}>
                      {viewGRN.qualityReport?.parameters?.length || 0} params
                    </span>
                  </div>

                  {viewGRN.qualityReport?.parameters && viewGRN.qualityReport.parameters.length > 0 ? (
                    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                      <table className="w-full">
                        <thead>
                          <tr style={{ background: 'var(--muted)' }}>
                            <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Parameter</th>
                            <th className="px-4 py-2.5 text-center text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Standard</th>
                            <th className="px-4 py-2.5 text-center text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Result</th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewGRN.qualityReport.parameters.map((p: any, i: number) => (
                            <tr key={i} style={{ borderBottom: i < viewGRN.qualityReport!.parameters.length - 1 ? '1px solid color-mix(in srgb, var(--border) 50%, transparent)' : undefined }}>
                              <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--foreground)' }}>{p.parameter}</td>
                              <td className="px-4 py-3 text-sm text-center" style={{ color: 'var(--secondary)' }}>{p.standard}</td>
                              <td className="px-4 py-3 text-sm text-center font-semibold" style={{ color: 'var(--primary)' }}>{p.result}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-6 rounded-xl text-center" style={{ background: 'color-mix(in srgb, var(--primary) 4%, transparent)', border: '1px dashed color-mix(in srgb, var(--primary) 20%, var(--border))' }}>
                      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No quality parameters recorded for this GRN.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer with Download PDF */}
              <div className="shrink-0 px-6 py-4 flex items-center justify-between gap-3" style={{ borderTop: '1px solid var(--border)', background: 'color-mix(in srgb, var(--primary) 3%, var(--card))' }}>
                <button
                  onClick={() => setViewGRN(null)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95"
                  style={{ background: 'var(--muted)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}
                >
                  Close
                </button>
                <button
                  onClick={() => handleDownloadPDF(viewGRN)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all duration-200 hover:shadow-lg active:scale-[0.97]"
                  style={{ background: 'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 80%, var(--secondary)))', color: 'var(--primary-foreground)' }}
                >
                  <Download size={14} /> Download PDF
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default RMQualityReport;
