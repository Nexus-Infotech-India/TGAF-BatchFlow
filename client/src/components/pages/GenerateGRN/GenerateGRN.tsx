import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hash,
  RefreshCw,
  FileText,
  Search,
  Check,
  Clock,
  Package,
  Eye,
  X,
  Calendar,
  Building,
  ShoppingCart,
  User,
  Truck,
  MapPin,
  ClipboardList,
  MessageSquare,
  Download,
  Boxes,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'react-toastify';
import api, { API_ROUTES } from '../../../utils/api';
import { format } from 'date-fns';

const ITEMS_PER_PAGE = 6;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2, staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

interface ReportEntry {
  id: string;
  reportNumber: string | null;
  rawMaterialName: string;
  variety: string;
  supplier: string;
  createdAt: string;
  grn: string | null;
  purchaseOrderId: string | null;
  purchaseOrderItemId: string | null;
  purchaseOrder: { id: string; poNumber: string; vendor: { name: string } } | null;
  purchaseOrderItem: {
    rawMaterial: { name: string; skuCode: string; unitOfMeasurement?: string };
    quantityOrdered: number;
    quantityReceived: number;
    totalReceived?: number;
    receivals?: any[];
  } | null;
  parameters: any[];
  grn_entry?: {
    id: string;
    grnNumber: string;
    truckNumber?: string;
    deliveryLocation?: string;
    costCenter?: string;
    receivedBagsPacks?: string;
    remarks?: string;
  } | null;
  createdBy: { id: string; name: string; email: string };
}

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  return format(new Date(dateString), 'MMM dd, yyyy');
};

interface GRNFormData {
  truckNumber: string;
  deliveryLocation: string;
  costCenter: string;
  receivedBagsPacks: string;
  remarks: string;
}

const GenerateGRN: React.FC = () => {
  const [reports, setReports] = useState<ReportEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [viewReport, setViewReport] = useState<ReportEntry | null>(null);
  const [grnFormReport, setGrnFormReport] = useState<ReportEntry | null>(null);
  const [grnFormData, setGrnFormData] = useState<GRNFormData>({
    truckNumber: '',
    deliveryLocation: '',
    costCenter: '',
    receivedBagsPacks: '',
    remarks: '',
    });

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await api.get(API_ROUTES.RAW.GET_REPORTS_FOR_GRN_PAGE);
      if (response.data?.data) {
        setReports(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const openGRNForm = (report: ReportEntry) => {
    setGrnFormReport(report);
    setGrnFormData({
      truckNumber: '',
      deliveryLocation: '',
      costCenter: '',
      receivedBagsPacks: '',
      remarks: '',
    });
  };

  const handleGenerateGRN = async () => {
    if (!grnFormReport) return;
    setGeneratingId(grnFormReport.id);
    try {
      const response = await api.post(API_ROUTES.RAW.GENERATE_GRN_FROM_REPORT, {
        qualityReportId: grnFormReport.id,
        ...grnFormData,
      });
      if (response.data?.grnNumber) {
        toast.success(`GRN generated: ${response.data.grnNumber}`);
      } else {
        toast.success('GRN generated successfully');
      }
      setGrnFormReport(null);
      fetchReports();
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Failed to generate GRN';
      toast.error(msg);
    } finally {
      setGeneratingId(null);
    }
  };

  // PDF Download handler - generates a TG Agri Farms GRN PDF
  const handleDownloadGRNPdf = (report: ReportEntry) => {
    if (!report.grn_entry) return;
    const grn = report.grn_entry;
    const reportDate = report.createdAt ? format(new Date(report.createdAt), 'dd/MM/yyyy') : 'N/A';
    const poNumber = report.purchaseOrder?.poNumber || '-';
    const supplier = report.supplier;
    const rawMaterial = report.rawMaterialName;
    const skuCode = report.purchaseOrderItem?.rawMaterial?.skuCode || '-';
    const uom = report.purchaseOrderItem?.rawMaterial?.unitOfMeasurement || '-';
    const qtyOrdered = report.purchaseOrderItem?.quantityOrdered ?? '-';
    const qtyReceived = report.purchaseOrderItem?.totalReceived ?? report.purchaseOrderItem?.quantityReceived ?? '-';
    const truckNumber = grn.truckNumber || '-';
    const deliveryLocation = grn.deliveryLocation || '-';
    const costCenter = grn.costCenter || '-';
    const receivedBagsPacks = grn.receivedBagsPacks || '-';
    const remarks = grn.remarks || '-';

    const html = `
      <html><head><title>GRN - ${grn.grnNumber}</title>
      <style>
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } @page { margin: 20mm; } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', -apple-system, Arial, sans-serif; padding: 24px; color: #1a1a2e; background: #fff; }
        .page { max-width: 780px; margin: 0 auto; }

        /* Header */
        .header { background: linear-gradient(135deg, #5317AA 0%, #7c3aed 40%, #178EC8 100%); color: #fff; padding: 28px 32px; border-radius: 14px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .company { font-size: 22px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; }
        .doc-label { font-size: 12px; opacity: 0.8; margin-top: 4px; font-weight: 500; }
        .grn-badge { text-align: right; }
        .grn-tag { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.7; }
        .grn-number { font-size: 20px; font-weight: 800; margin-top: 4px; letter-spacing: 0.5px; }

        /* Meta Section */
        .meta-section { margin-bottom: 20px; }
        .meta-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #5317AA; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 2px solid #5317AA20; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .meta-card { background: #f8f7fc; border: 1px solid #e8e5f0; border-radius: 10px; padding: 10px 14px; }
        .meta-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #8b7fb0; margin-bottom: 2px; }
        .meta-value { font-size: 13px; font-weight: 600; color: #1a1a2e; }

        /* Material Table */
        .table-section { margin-bottom: 20px; }
        .table-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #5317AA; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 2px solid #5317AA20; }
        table { width: 100%; border-collapse: collapse; border-radius: 10px; overflow: hidden; border: 1px solid #e0dce8; }
        thead th { background: linear-gradient(135deg, #5317AA, #6d28d9); color: #fff; padding: 10px 14px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; text-align: left; }
        tbody td { padding: 12px 14px; font-size: 12px; border-bottom: 1px solid #f0edf5; color: #333; }
        tbody tr:last-child td { border-bottom: none; }
        .td-code { font-family: 'Consolas', 'Courier New', monospace; font-weight: 700; color: #5317AA; font-size: 11px; }
        .td-material { font-weight: 700; color: #1a1a2e; }
        .td-received { font-weight: 700; color: #5317AA; }

        /* Remarks */
        .remarks { background: #f8f7fc; border: 1px solid #e8e5f0; border-radius: 10px; padding: 12px 16px; margin-bottom: 24px; }
        .remarks-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #8b7fb0; margin-bottom: 4px; }
        .remarks-value { font-size: 12px; color: #333; line-height: 1.5; }

        /* Footer */
        .footer { border-top: 2px solid #e0dce8; padding-top: 20px; }
        .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-bottom: 16px; }
        .sig-box { text-align: center; }
        .sig-line { border-top: 1.5px solid #bbb; margin-top: 48px; padding-top: 8px; font-size: 10px; color: #777; font-weight: 600; }
        .print-info { font-size: 9px; color: #aaa; text-align: center; margin-top: 8px; }
      </style></head><body>
      <div class="page">
        <div class="header">
          <div>
            <div class="company">TG Agri Farms Limited</div>
            <div class="doc-label">Goods Received Note</div>
          </div>
          <div class="grn-badge">
            <div class="grn-tag">GRN Number</div>
            <div class="grn-number">${grn.grnNumber}</div>
          </div>
        </div>

        <div class="meta-section">
          <div class="meta-title">Order Information</div>
          <div class="meta-grid">
            <div class="meta-card"><div class="meta-label">Supplier</div><div class="meta-value">${supplier}</div></div>
            <div class="meta-card"><div class="meta-label">Date</div><div class="meta-value">${reportDate}</div></div>
            <div class="meta-card"><div class="meta-label">Purchase Order No.</div><div class="meta-value">${poNumber}</div></div>
            <div class="meta-card"><div class="meta-label">Truck Number</div><div class="meta-value">${truckNumber}</div></div>
            <div class="meta-card"><div class="meta-label">Delivery Location</div><div class="meta-value">${deliveryLocation}</div></div>
            <div class="meta-card"><div class="meta-label">Cost Center</div><div class="meta-value">${costCenter}</div></div>
          </div>
        </div>

        <div class="table-section">
          <div class="table-title">Material Details</div>
          <table>
            <thead>
              <tr>
                <th>S/N</th>
                <th>Material Code</th>
                <th>Material Description</th>
                <th>UOM</th>
                <th>Order Qty</th>
                <th>Received Qty</th>
                <th>Bags/Packs</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td class="td-code">${skuCode}</td>
                <td class="td-material">${rawMaterial}</td>
                <td>${uom}</td>
                <td>${qtyOrdered}</td>
                <td class="td-received">${qtyReceived}</td>
                <td>${receivedBagsPacks}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="remarks">
          <div class="remarks-label">Remarks / Comments</div>
          <div class="remarks-value">${remarks}</div>
        </div>

        <div class="footer">
          <div class="sig-grid">
            <div class="sig-box"><div class="sig-line">Received by</div></div>
            <div class="sig-box"><div class="sig-line">Checked by</div></div>
          </div>
          <div class="print-info">TGAF BatchFlow &middot; GRN ${grn.grnNumber} &middot; Printed ${format(new Date(), 'dd MMM yyyy, HH:mm')}</div>
        </div>
      </div>
      </body></html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 400);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.trim().toLowerCase();
    return [
      r.reportNumber,
      r.rawMaterialName,
      r.variety,
      r.supplier,
      r.purchaseOrder?.poNumber,
      r.grn_entry?.grnNumber,
    ].some((f) => String(f || '').toLowerCase().includes(q));
  });

  const totalPages = Math.max(1, Math.ceil(filteredReports.length / ITEMS_PER_PAGE));
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const reportsWithoutGRN = filteredReports.filter((r) => !r.grn_entry);

  return (
    <motion.div
      className="min-h-screen bg-background"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Page Header */}
        <motion.div variants={itemVariants} className="bg-brand-header rounded-2xl px-6 py-5 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div
              className="flex items-center justify-center w-11 h-11 rounded-xl shadow-md"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              <Hash size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
                Generate GRN
              </h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                Create GRN numbers against quality reports &middot;{' '}
                <span className="font-medium" style={{ color: 'var(--primary)' }}>
                  {reportsWithoutGRN.length}
                </span>{' '}
                pending
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={fetchReports}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ color: 'var(--muted-foreground)', background: 'var(--muted)', border: '1px solid var(--border)' }}
          >
            <RefreshCw size={14} /> Refresh
          </motion.button>
        </motion.div>

        {/* Search */}
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border overflow-hidden"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }}>
                <Search size={15} />
              </span>
              <input
                type="text"
                placeholder="Search by Report No., PO, raw material, supplier, GRN..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all duration-200"
                style={{
                  background: 'color-mix(in srgb, var(--card) 96%, var(--primary) 4%)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
                  paddingLeft: '2.25rem',
                }}
              />
            </div>
          </div>

          {/* Table */}
          <div>
            {loading ? (
              <div className="flex flex-col justify-center items-center py-16 gap-3">
                <span className="inline-block w-10 h-10 border-[3px] rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} />
                <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading reports…</span>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: 'color-mix(in srgb, var(--primary) 10%, transparent)' }}>
                  <FileText size={32} style={{ color: 'var(--primary)' }} />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                  No reports found
                </h3>
                <p className="max-w-md mx-auto text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  {searchTerm
                    ? 'No reports match your search criteria.'
                    : 'No quality reports available yet. Create reports from the RM Quality Report page first.'}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead>
                      <tr style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                        {['Report No.', 'PO Number', 'Raw Material', 'Supplier', 'Date', 'Params', 'GRN Status', 'Actions'].map((h, i) => (
                          <th key={h} className={`px-4 py-3 text-xs font-bold uppercase tracking-wider ${i === 7 ? 'text-right' : 'text-left'}`} style={{ color: 'var(--muted-foreground)' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedReports.map((report, index) => {
                        const hasGRN = !!report.grn_entry;
                        const isGenerating = generatingId === report.id;
                        return (
                          <motion.tr
                            key={report.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className="group transition-colors duration-150"
                            style={{ borderBottom: '1px solid color-mix(in srgb, var(--border) 50%, transparent)' }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--muted)'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                          >
                            <td className="px-4 py-3.5">
                              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded inline-block whitespace-nowrap" style={{ background: 'color-mix(in srgb, var(--primary) 10%, transparent)', color: 'var(--primary)' }}>
                                {report.reportNumber || '-'}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="font-mono text-xs" style={{ color: 'var(--muted-foreground)' }}>{report.purchaseOrder?.poNumber || '-'}</span>
                            </td>
                            <td className="px-4 py-3.5 text-sm font-medium" style={{ color: 'var(--foreground)' }}>{report.rawMaterialName}</td>
                            <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--muted-foreground)' }}>{report.supplier}</td>
                            <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--muted-foreground)' }}>{formatDate(report.createdAt)}</td>
                            <td className="px-4 py-3.5">
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--secondary) 12%, transparent)', color: 'var(--secondary)' }}>
                                {report.parameters?.length || 0}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              {hasGRN ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold" style={{ background: 'color-mix(in srgb, #22c55e 12%, transparent)', color: '#16a34a', border: '1px solid color-mix(in srgb, #22c55e 20%, transparent)' }}>
                                  <Check size={12} />
                                  {report.grn_entry?.grnNumber}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium" style={{ background: 'color-mix(in srgb, var(--primary) 8%, transparent)', color: 'var(--primary)', border: '1px solid color-mix(in srgb, var(--primary) 15%, transparent)' }}>
                                  <Clock size={12} />
                                  Pending
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <div className="inline-flex items-center gap-2">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => setViewReport(report)}
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-200"
                                  style={{ color: 'var(--muted-foreground)' }}
                                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'color-mix(in srgb, var(--secondary) 10%, transparent)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--secondary)'; }}
                                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-foreground)'; }}
                                  title="View details"
                                >
                                  <Eye size={16} />
                                </motion.button>
                                {hasGRN && (
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleDownloadGRNPdf(report)}
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-200"
                                    style={{ color: 'var(--muted-foreground)' }}
                                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'color-mix(in srgb, var(--primary) 10%, transparent)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--primary)'; }}
                                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-foreground)'; }}
                                    title="Download GRN PDF"
                                  >
                                    <Download size={16} />
                                  </motion.button>
                                )}
                                {!hasGRN && (
                                  <motion.button
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => openGRNForm(report)}
                                    disabled={isGenerating}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{
                                      background: isGenerating ? 'var(--muted)' : 'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 80%, var(--secondary)))',
                                      color: isGenerating ? 'var(--muted-foreground)' : 'var(--primary-foreground)',
                                    }}
                                  >
                                    {isGenerating ? (
                                      <><span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
                                    ) : (
                                      <><Hash size={12} /> Generate GRN</>
                                    )}
                                  </motion.button>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {filteredReports.length > ITEMS_PER_PAGE && (
                  <div
                    className="flex items-center justify-between px-5 py-3"
                    style={{ borderTop: '1px solid var(--border)' }}
                  >
                    <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                      Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredReports.length)} of {filteredReports.length} entries
                    </span>
                    <div className="flex items-center gap-1.5">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: 'var(--muted)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}
                      >
                        <ChevronLeft size={15} />
                      </motion.button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <motion.button
                          key={page}
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setCurrentPage(page)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold transition-all duration-200"
                          style={{
                            background: page === currentPage
                              ? 'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 80%, var(--secondary)))'
                              : 'var(--muted)',
                            color: page === currentPage ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                            border: page === currentPage ? 'none' : '1px solid var(--border)',
                            boxShadow: page === currentPage ? '0 2px 8px color-mix(in srgb, var(--primary) 30%, transparent)' : 'none',
                          }}
                        >
                          {page}
                        </motion.button>
                      ))}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: 'var(--muted)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}
                      >
                        <ChevronRight size={15} />
                      </motion.button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* GRN Generation Form Modal */}
      <AnimatePresence>
        {grnFormReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={() => setGrnFormReport(null)}
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
                    <Hash size={18} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>Generate GRN</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                      Fill in delivery details for <span className="font-mono font-semibold" style={{ color: 'var(--primary)' }}>{grnFormReport.reportNumber}</span>
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setGrnFormReport(null)}
                  className="p-2 rounded-lg transition-colors duration-200"
                  style={{ color: 'var(--muted-foreground)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--muted)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                >
                  <X size={16} />
                </motion.button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                {/* Auto-filled info */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--primary)' }}>Auto-Filled from Database</span>
                    <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { icon: ShoppingCart, label: 'PO Number', value: grnFormReport.purchaseOrder?.poNumber || '-' },
                      { icon: Building, label: 'Supplier', value: grnFormReport.supplier },
                      { icon: Package, label: 'Raw Material', value: grnFormReport.rawMaterialName },
                      { icon: Hash, label: 'Material Code', value: grnFormReport.purchaseOrderItem?.rawMaterial?.skuCode || '-' },
                      { icon: ClipboardList, label: 'UOM', value: grnFormReport.purchaseOrderItem?.rawMaterial?.unitOfMeasurement || '-' },
                      { icon: Calendar, label: 'Date', value: grnFormReport.createdAt ? format(new Date(grnFormReport.createdAt), 'dd MMM yyyy') : 'N/A' },
                      { icon: Package, label: 'Qty Ordered', value: grnFormReport.purchaseOrderItem?.quantityOrdered ?? '-' },
                      { icon: Check, label: 'Qty Received', value: grnFormReport.purchaseOrderItem?.totalReceived ?? grnFormReport.purchaseOrderItem?.quantityReceived ?? '-' },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex items-center gap-2.5 p-2.5 rounded-xl" style={{ background: 'var(--muted)' }}>
                        <Icon size={13} style={{ color: 'var(--primary)' }} />
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>{label}</div>
                          <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Manual fields */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--secondary)' }}>Delivery Details</span>
                    <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: Truck, label: 'Truck Number', key: 'truckNumber' as const, placeholder: 'e.g. MH 12 AB 1234' },
                      { icon: MapPin, label: 'Delivery Location', key: 'deliveryLocation' as const, placeholder: 'e.g. Main Warehouse' },
                      { icon: Building, label: 'Cost Center', key: 'costCenter' as const, placeholder: 'e.g. RM Store' },
                      { icon: Boxes, label: 'Received Bags/Packs', key: 'receivedBagsPacks' as const, placeholder: 'e.g. 8 Bags' },
                    ].map(({ icon: Icon, label, key, placeholder }) => (
                      <div key={key} className="space-y-1">
                        <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                          <Icon size={12} style={{ color: 'var(--primary)' }} />
                          {label}
                        </label>
                        <input
                          type="text"
                          value={grnFormData[key]}
                          onChange={(e) => setGrnFormData(prev => ({ ...prev, [key]: e.target.value }))}
                          placeholder={placeholder}
                          className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all duration-200"
                          style={{
                            background: 'color-mix(in srgb, var(--card) 96%, var(--primary) 4%)',
                            border: '1px solid var(--border)',
                            color: 'var(--foreground)',
                          }}
                          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--primary) 12%, transparent)'; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                        />
                      </div>
                    ))}
                    <div className="col-span-2 space-y-1">
                      <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                        <MessageSquare size={12} style={{ color: 'var(--primary)' }} />
                        Remarks / Comments
                      </label>
                      <textarea
                        value={grnFormData.remarks}
                        onChange={(e) => setGrnFormData(prev => ({ ...prev, remarks: e.target.value }))}
                        placeholder="Any additional notes..."
                        rows={2}
                        className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all duration-200 resize-none"
                        style={{
                          background: 'color-mix(in srgb, var(--card) 96%, var(--primary) 4%)',
                          border: '1px solid var(--border)',
                          color: 'var(--foreground)',
                        }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--primary) 12%, transparent)'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="shrink-0 px-6 py-4 flex items-center justify-between gap-3" style={{ borderTop: '1px solid var(--border)', background: 'color-mix(in srgb, var(--primary) 3%, var(--card))' }}>
                <button
                  onClick={() => setGrnFormReport(null)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95"
                  style={{ background: 'var(--muted)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateGRN}
                  disabled={generatingId === grnFormReport.id}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all duration-200 hover:shadow-lg active:scale-[0.97] disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 80%, var(--secondary)))', color: 'var(--primary-foreground)' }}
                >
                  {generatingId === grnFormReport.id ? (
                    <><span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
                  ) : (
                    <><Hash size={14} /> Generate GRN</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Report Detail Modal */}
      <AnimatePresence>
        {viewReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={() => setViewReport(null)}
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
                    <h3 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>Report Details</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                      <span className="font-mono font-semibold" style={{ color: 'var(--primary)' }}>{viewReport.reportNumber || '-'}</span>
                      {viewReport.grn_entry && (
                        <span className="ml-2 font-mono" style={{ color: '#16a34a' }}>GRN: {viewReport.grn_entry.grnNumber}</span>
                      )}
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setViewReport(null)}
                  className="p-2 rounded-lg transition-colors duration-200"
                  style={{ color: 'var(--muted-foreground)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--muted)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--foreground)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-foreground)'; }}
                >
                  <X size={16} />
                </motion.button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--primary)' }}>Report Information</span>
                    <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: Hash, label: 'Report No.', value: viewReport.reportNumber || '-' },
                      { icon: ShoppingCart, label: 'PO Number', value: viewReport.purchaseOrder?.poNumber || '-' },
                      { icon: Package, label: 'Raw Material', value: viewReport.rawMaterialName },
                      { icon: Building, label: 'Supplier', value: viewReport.supplier },
                      { icon: Calendar, label: 'Date', value: viewReport.createdAt ? format(new Date(viewReport.createdAt), 'dd MMM yyyy') : 'N/A' },
                      { icon: Hash, label: 'GRN Number', value: viewReport.grn_entry?.grnNumber || 'Not generated' },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex items-center gap-2.5 p-3 rounded-xl" style={{ background: 'var(--muted)' }}>
                        <Icon size={14} style={{ color: 'var(--primary)' }} />
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>{label}</div>
                          <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{value}</div>
                        </div>
                      </div>
                    ))}
                    {viewReport.createdBy && (
                      <div className="flex items-center gap-2.5 p-3 rounded-xl" style={{ background: 'var(--muted)' }}>
                        <User size={14} style={{ color: 'var(--primary)' }} />
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Created By</div>
                          <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{viewReport.createdBy.name}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Material Details */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--secondary)' }}>Material Details</span>
                    <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                  </div>
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                    <table className="w-full">
                      <thead>
                        <tr style={{ background: 'var(--muted)' }}>
                          {['SKU Code', 'Material', 'UOM', 'Qty Ordered', 'Qty Received'].map(h => (
                            <th key={h} className="px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-left" style={{ color: 'var(--muted-foreground)' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="px-3 py-3 text-xs font-mono font-semibold" style={{ color: 'var(--primary)' }}>{viewReport.purchaseOrderItem?.rawMaterial?.skuCode || '-'}</td>
                          <td className="px-3 py-3 text-sm font-medium" style={{ color: 'var(--foreground)' }}>{viewReport.rawMaterialName}</td>
                          <td className="px-3 py-3 text-sm" style={{ color: 'var(--muted-foreground)' }}>{viewReport.purchaseOrderItem?.rawMaterial?.unitOfMeasurement || '-'}</td>
                          <td className="px-3 py-3 text-sm font-medium" style={{ color: 'var(--foreground)' }}>{viewReport.purchaseOrderItem?.quantityOrdered ?? '-'}</td>
                          <td className="px-3 py-3 text-sm font-semibold" style={{ color: 'var(--primary)' }}>{viewReport.purchaseOrderItem?.totalReceived ?? '-'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* GRN Delivery Details (shown when GRN exists) */}
                {viewReport.grn_entry && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--primary)' }}>Delivery Details</span>
                      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { icon: Truck, label: 'Truck Number', value: viewReport.grn_entry.truckNumber || '-' },
                        { icon: MapPin, label: 'Delivery Location', value: viewReport.grn_entry.deliveryLocation || '-' },
                        { icon: Building, label: 'Cost Center', value: viewReport.grn_entry.costCenter || '-' },
                        { icon: Boxes, label: 'Received Bags/Packs', value: viewReport.grn_entry.receivedBagsPacks || '-' },
                      ].map(({ icon: Icon, label, value }) => (
                        <div key={label} className="flex items-center gap-2.5 p-2.5 rounded-xl" style={{ background: 'var(--muted)' }}>
                          <Icon size={13} style={{ color: 'var(--primary)' }} />
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>{label}</div>
                            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{value}</div>
                          </div>
                        </div>
                      ))}
                      {viewReport.grn_entry.remarks && (
                        <div className="col-span-2 flex items-start gap-2.5 p-2.5 rounded-xl" style={{ background: 'var(--muted)' }}>
                          <MessageSquare size={13} className="mt-0.5" style={{ color: 'var(--primary)' }} />
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Remarks</div>
                            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{viewReport.grn_entry.remarks}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="shrink-0 px-6 py-4 flex items-center justify-between gap-3" style={{ borderTop: '1px solid var(--border)', background: 'color-mix(in srgb, var(--primary) 3%, var(--card))' }}>
                <button
                  onClick={() => setViewReport(null)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95"
                  style={{ background: 'var(--muted)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}
                >
                  Close
                </button>
                <div className="flex items-center gap-2">
                  {viewReport.grn_entry && (
                    <button
                      onClick={() => handleDownloadGRNPdf(viewReport)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.97]"
                      style={{ background: 'color-mix(in srgb, var(--primary) 12%, transparent)', color: 'var(--primary)', border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)' }}
                    >
                      <Download size={14} /> Download GRN
                    </button>
                  )}
                  {!viewReport.grn_entry && (
                    <button
                      onClick={() => { openGRNForm(viewReport); setViewReport(null); }}
                      disabled={generatingId === viewReport.id}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all duration-200 hover:shadow-lg active:scale-[0.97] disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 80%, var(--secondary)))', color: 'var(--primary-foreground)' }}
                    >
                      <Hash size={14} /> Generate GRN
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default GenerateGRN;
