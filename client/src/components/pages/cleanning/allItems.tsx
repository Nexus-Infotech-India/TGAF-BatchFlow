import React, { useEffect, useState, useCallback } from 'react';
import api, { API_ROUTES } from '../../../utils/api';
import { generateCleaningHistoryPDF } from '../../../utils/exportPdf';
import { Modal, Select, message, InputNumber } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  CheckCircle,
  Layers,
  ArrowRight,
  FileText,
  Sparkles,
  ClipboardCheck,
  Search,
  RefreshCw,
  X,
  Eye,
  Clock,
  MapPin,
  Mountain,
  Sprout,
  AlertTriangle,
  Download,
  XCircle,
} from 'lucide-react';
import { convertWeight } from '../../ui/Order/statusModal';

const { Option } = Select;

// ─── Animations ──────────────────────────────────────────────────────────
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

// ─── Processing Overlay ──────────────────────────────────────────────────
type OverlayPhase = 'processing' | 'success' | 'error';
type OverlayMode = 'transfer' | 'cleaning';

const overlayConfig = {
  transfer: {
    processingTitle: 'Transferring Material',
    processingSubtitle: 'Creating lot & updating inventory...',
    successTitle: 'Transfer Complete!',
    successSubtitle: 'Lot generated successfully',
    gradientFrom: 'hsl(220, 70%, 55%)',
    gradientTo: 'hsl(250, 65%, 50%)',
    accentRing: 'hsl(220, 80%, 60%)',
  },
  cleaning: {
    processingTitle: 'Finishing Cleaning',
    processingSubtitle: 'Recording wastage & updating quantities...',
    successTitle: 'Cleaning Complete!',
    successSubtitle: 'All records updated',
    gradientFrom: 'hsl(155, 70%, 38%)',
    gradientTo: 'hsl(170, 60%, 35%)',
    accentRing: 'hsl(155, 80%, 42%)',
  },
};

const ProcessingOverlay: React.FC<{
  visible: boolean;
  phase: OverlayPhase;
  mode: OverlayMode;
  errorMessage?: string;
}> = ({ visible, phase, mode, errorMessage }) => {
  const cfg = overlayConfig[mode];
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.35 } }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.45)' }} />

          {/* Content Card */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } }}
            exit={{ scale: 0.9, opacity: 0, y: 10, transition: { duration: 0.25 } }}
            className="relative z-10 flex flex-col items-center px-12 py-10 rounded-3xl shadow-2xl"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', minWidth: 340 }}
          >
            {/* Animated ring behind icon */}
            <div className="relative flex items-center justify-center mb-6" style={{ width: 80, height: 80 }}>
              {phase === 'processing' && (
                <>
                  {/* Spinning ring */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
                    className="absolute inset-0 rounded-full"
                    style={{
                      border: '3px solid transparent',
                      borderTopColor: cfg.accentRing,
                      borderRightColor: cfg.accentRing,
                      opacity: 0.7,
                    }}
                  />
                  {/* Pulsing glow */}
                  <motion.div
                    animate={{ scale: [1, 1.25, 1], opacity: [0.15, 0.3, 0.15] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    className="absolute inset-0 rounded-full"
                    style={{ background: `radial-gradient(circle, ${cfg.gradientFrom}33, transparent 70%)` }}
                  />
                </>
              )}

              {phase === 'success' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="absolute inset-0 rounded-full"
                  style={{ background: `radial-gradient(circle, hsl(155,60%,45%)22, transparent 70%)` }}
                />
              )}

              {phase === 'error' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="absolute inset-0 rounded-full"
                  style={{ background: 'radial-gradient(circle, hsl(0,60%,50%)22, transparent 70%)' }}
                />
              )}

              {/* Center Icon */}
              <motion.div
                className="relative z-10 flex items-center justify-center w-12 h-12 rounded-2xl shadow-lg"
                style={{
                  background: phase === 'error'
                    ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                    : phase === 'success'
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : `linear-gradient(135deg, ${cfg.gradientFrom}, ${cfg.gradientTo})`,
                  color: '#fff',
                }}
                animate={phase === 'processing' ? { y: [0, -4, 0] } : {}}
                transition={phase === 'processing' ? { repeat: Infinity, duration: 1.5, ease: 'easeInOut' } : {}}
              >
                {phase === 'processing' && (
                  mode === 'transfer'
                    ? <ArrowRight size={20} strokeWidth={2.5} />
                    : <Sparkles size={20} strokeWidth={2.5} />
                )}
                {phase === 'success' && (
                  <motion.div initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 300 }}>
                    <CheckCircle size={24} strokeWidth={2.5} />
                  </motion.div>
                )}
                {phase === 'error' && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
                    <XCircle size={24} strokeWidth={2.5} />
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* Title */}
            <motion.h3
              key={phase}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg font-bold mb-1"
              style={{ color: 'var(--foreground)' }}
            >
              {phase === 'processing' && cfg.processingTitle}
              {phase === 'success' && cfg.successTitle}
              {phase === 'error' && 'Something went wrong'}
            </motion.h3>

            {/* Subtitle */}
            <motion.p
              key={`sub-${phase}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.1 } }}
              className="text-sm text-center max-w-xs"
              style={{ color: 'var(--muted-foreground)' }}
            >
              {phase === 'processing' && cfg.processingSubtitle}
              {phase === 'success' && cfg.successSubtitle}
              {phase === 'error' && (errorMessage || 'Please try again')}
            </motion.p>

            {/* Animated dots for processing */}
            {phase === 'processing' && (
              <div className="flex items-center gap-1.5 mt-5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2, ease: 'easeInOut' }}
                    className="w-2 h-2 rounded-full"
                    style={{ background: cfg.gradientFrom }}
                  />
                ))}
              </div>
            )}

            {/* Floating particles for success */}
            {phase === 'success' && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
                {Array.from({ length: 8 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 60, x: 170 + (Math.random() - 0.5) * 80 }}
                    animate={{ opacity: [0, 1, 0], y: [60, -30], x: 170 + (Math.random() - 0.5) * 160 }}
                    transition={{ duration: 1.2, delay: i * 0.08, ease: 'easeOut' }}
                    className="absolute w-1.5 h-1.5 rounded-full"
                    style={{ background: i % 2 === 0 ? '#10b981' : '#fbbf24' }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── Types ───────────────────────────────────────────────────────────────
interface CleaningLotItem {
  id: string;
  lotNumber: string;
  quantity: number;
  cleanedQuantity?: number;
  status: string;
  stoneWastageQty?: number;
  stoneWastageUnit?: string;
  seedWastageQty?: number;
  seedWastageUnit?: string;
  wastagePercentage?: number;
  wastageType?: string;
  createdAt: string;
  warehouse: { name: string };
  cleaningJob?: { id: string; quantity: number };
}

interface CleaningJobItem {
  id: string;
  quantity: number;
  status: string;
  startedAt: string;
  finishedAt?: string;
  stoneWastageQty?: number;
  stoneWastageUnit?: string;
  seedWastageQty?: number;
  seedWastageUnit?: string;
  wastagePercentage?: number;
  wastageType?: string;
  fromLocation?: { id: string; name: string | null } | null;
  toLocation?: { id: string; name: string | null } | null;
  fromWarehouse: { name: string };
  toWarehouse: { name: string };
  cleaningLots: CleaningLotItem[];
}

interface GRNItem {
  id: string;
  grnNumber: string;
  rawMaterialName: string;
  variety: string;
  supplier: string;
  createdAt: string;
  purchaseOrder: { poNumber: string; vendor: { name: string } };
  purchaseOrderItem: {
    rawMaterialId: string;
    rawMaterial: { name: string; skuCode: string; unitOfMeasurement: string; category: string };
    totalReceived: number;
    receivals: {
      warehouseId?: string;
      warehouse?: { name: string; location?: string | null };
      locationId?: string;
      location?: { name: string };
      fromLocation?: { id: string; name: string | null } | null;
    }[];
  };
  qualityReport?: { id: string; parameters: { parameter: string; standard: string; result: string }[] };
  cleaningJobs: CleaningJobItem[];
  cleaningLots: CleaningLotItem[];
  totalReceived: number;
  totalTransferred: number;
  leftQuantity: number;
  allJobsFinished: boolean;
}

interface LocationItem {
  id: string;
  code: string;
  name: string;
  type: string;
  enabled?: boolean;
}

// ─── Main Component ─────────────────────────────────────────────────────
const CleaningRawMaterialList: React.FC = () => {
  const [grns, setGrns] = useState<GRNItem[]>([]);
  const [filteredGrns, setFilteredGrns] = useState<GRNItem[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // Transfer Modal
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedGrn, setSelectedGrn] = useState<GRNItem | null>(null);
  const [transferQty, setTransferQty] = useState<number>(0);
  const [transferUnit, setTransferUnit] = useState<string>('KG');
  const [toLocationId, setToLocationId] = useState('');
  const [transferring, setTransferring] = useState(false);

  // Finish Cleaning Modal
  const [finishModalOpen, setFinishModalOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [stoneWastageQty, setStoneWastageQty] = useState<number>(0);
  const [stoneWastageUnit, setStoneWastageUnit] = useState<string>('KG');
  const [seedWastageQty, setSeedWastageQty] = useState<number>(0);
  const [seedWastageUnit, setSeedWastageUnit] = useState<string>('KG');
  const [finishing, setFinishing] = useState(false);

  // Processing Overlay
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [overlayPhase, setOverlayPhase] = useState<OverlayPhase>('processing');
  const [overlayMode, setOverlayMode] = useState<OverlayMode>('transfer');
  const [overlayError, setOverlayError] = useState('');

  // Cleaning History Modal (Eye icon)
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyGrn, setHistoryGrn] = useState<GRNItem | null>(null);


  const fetchGRNs = async () => {
    setLoading(true);
    try {
      const authToken = localStorage.getItem('authToken');
      const res = await api.get(API_ROUTES.RAW.GET_GRNS_FOR_CLEANING, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = res.data?.data || res.data || [];
      setGrns(data);
      setFilteredGrns(data);
    } catch (err: any) {
      console.error('Failed to fetch GRNs:', err);
      message.error(err?.response?.data?.error || 'Failed to fetch GRNs');
    }
    setLoading(false);
  };

  const fetchLocations = async () => {
    try {
      const authToken = localStorage.getItem('authToken');
      const res = await api.get(API_ROUTES.RAW.GET_LOCATIONS, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      // Handle both { data: [...] } and direct array response
      const data = res.data?.data || res.data || [];
      const safeData = Array.isArray(data) ? data : [];
      const enabledLocations = safeData.filter((l: LocationItem) => l.enabled !== false);
      setLocations(enabledLocations);
    } catch (err) {
      console.error('Failed to fetch locations:', err);
    }
  };

  useEffect(() => {
    fetchGRNs();
    fetchLocations();
  }, []);

  // ─── Search / Filter ──────────────────────────────────────────────
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredGrns(grns);
      return;
    }
    const lower = searchTerm.toLowerCase();
    setFilteredGrns(
      grns.filter(
        (g) =>
          g.grnNumber?.toLowerCase().includes(lower) ||
          g.rawMaterialName?.toLowerCase().includes(lower) ||
          g.supplier?.toLowerCase().includes(lower) ||
          g.purchaseOrder?.poNumber?.toLowerCase().includes(lower)
      )
    );
    setCurrentPage(1);
  }, [searchTerm, grns]);

  // ─── Transfer to Cleaning ─────────────────────────────────────────
  const handleOpenTransfer = (grn: GRNItem) => {
    setSelectedGrn(grn);
    setTransferQty(0);
    setToLocationId('');
    setTransferUnit(grn.purchaseOrderItem?.rawMaterial?.unitOfMeasurement || 'KG');
    setTransferModalOpen(true);
  };

  const showOverlay = useCallback((mode: OverlayMode) => {
    setOverlayMode(mode);
    setOverlayPhase('processing');
    setOverlayError('');
    setOverlayVisible(true);
  }, []);

  const finishOverlay = useCallback((success: boolean, errMsg?: string) => {
    setOverlayPhase(success ? 'success' : 'error');
    if (errMsg) setOverlayError(errMsg);
    setTimeout(() => setOverlayVisible(false), success ? 1600 : 2200);
  }, []);

  const handleTransfer = async () => {
    if (!selectedGrn || !toLocationId || transferQty <= 0) {
      message.warning('Please fill all fields correctly');
      return;
    }
    const unit = selectedGrn.purchaseOrderItem?.rawMaterial?.unitOfMeasurement || 'KG';
    const convertedQty = convertWeight(transferQty, transferUnit, unit);

    if (convertedQty > selectedGrn.leftQuantity) {
      message.error(`Cannot exceed available quantity (${selectedGrn.leftQuantity} ${unit})`);
      return;
    }
    setTransferring(true);
    setTransferModalOpen(false);
    showOverlay('transfer');
    try {
      const authToken = localStorage.getItem('authToken');
      await api.post(API_ROUTES.RAW.CREATE_GRN_CLEANING_TRANSFER, {
        grnId: selectedGrn.id,
        toLocationId,
        quantity: convertedQty,
      }, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      finishOverlay(true);
      fetchGRNs();
    } catch (err: any) {
      console.error('Transfer failed:', err);
      finishOverlay(false, err?.response?.data?.error || 'Transfer failed');
    }
    setTransferring(false);
  };

  // ─── Finish Cleaning ──────────────────────────────────────────────
  const handleOpenFinish = (jobId: string) => {
    setSelectedJobId(jobId);
    setStoneWastageQty(0);
    setStoneWastageUnit('KG');
    setSeedWastageQty(0);
    setSeedWastageUnit('KG');
    setFinishModalOpen(true);
  };

  const handleFinishCleaning = async () => {
    if (!selectedJobId) return;
    setFinishing(true);
    setFinishModalOpen(false);
    showOverlay('cleaning');
    try {
      const authToken = localStorage.getItem('authToken');
      await api.put(API_ROUTES.RAW.FINISH_CLEANING_JOB(selectedJobId), {
        stoneWastageQty,
        stoneWastageUnit,
        seedWastageQty,
        seedWastageUnit,
      }, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      finishOverlay(true);
      fetchGRNs();
    } catch (err: any) {
      console.error('Finish cleaning failed:', err);
      finishOverlay(false, err?.response?.data?.error || 'Failed to finish cleaning');
    }
    setFinishing(false);
  };

  // ─── View Cleaning History ─────────────────────────────────────────
  const handleViewHistory = (grn: GRNItem) => {
    setHistoryGrn(grn);
    setHistoryModalOpen(true);
  };

  // ─── Export Cleaning History PDF ───────────────────────────────────
  const handleExportPDF = () => {
    if (!historyGrn) return;
    const unit = historyGrn.purchaseOrderItem?.rawMaterial?.unitOfMeasurement || 'KG';
    generateCleaningHistoryPDF({
      grnNumber: historyGrn.grnNumber,
      rawMaterialName: historyGrn.rawMaterialName,
      variety: historyGrn.variety,
      supplier: historyGrn.supplier,
      unit,
      totalReceived: historyGrn.totalReceived,
      totalTransferred: historyGrn.totalTransferred,
      leftQuantity: historyGrn.leftQuantity,
      allJobsFinished: historyGrn.allJobsFinished,
      cleaningJobs: historyGrn.cleaningJobs.map((job) => ({
        ...job,
        cleaningLots: job.cleaningLots || [],
      })),
    });
  };

  // ─── Status helpers ────────────────────────────────────────────────
  const getStatusTag = (status: string) => {
    switch (status) {
      case 'Sent':
        return <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--secondary) 14%, transparent)', color: 'var(--secondary)' }}>Sent</span>;
      case 'Cleaning':
        return <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, #f59e0b 14%, transparent)', color: '#d97706' }}>Cleaning</span>;
      case 'Cleaned':
        return <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, #10b981 14%, transparent)', color: '#059669' }}>Cleaned</span>;
      case 'Active':
        return <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--primary) 14%, transparent)', color: 'var(--primary)' }}>Active</span>;
      default:
        return <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>{status}</span>;
    }
  };

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <motion.div
      className="min-h-screen"
      style={{ background: 'var(--background)' }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* ─── Header ─────────────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="bg-brand-header rounded-2xl px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div
              className="flex items-center justify-center w-11 h-11 rounded-xl shadow-md"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              <Sparkles size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
                GRN-wise Cleaning
              </h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                Transfer received materials to cleaning by GRN &amp; generate lot numbers
              </p>
            </div>
          </div>
          <button
            onClick={fetchGRNs}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95"
            style={{ background: 'var(--muted)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </motion.div>

        {/* ─── Summary Cards ──────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<FileText size={18} />} label="Total GRNs" value={grns.length} color="var(--primary)" />
          <StatCard icon={<Package size={18} />} label="Pending Transfer" value={grns.filter((g) => g.leftQuantity > 0).length} color="#d97706" />
          <StatCard icon={<CheckCircle size={18} />} label="Fully Transferred" value={grns.filter((g) => g.leftQuantity === 0 && g.cleaningJobs?.length > 0).length} color="var(--secondary)" />
          <StatCard icon={<ClipboardCheck size={18} />} label="All Cleaned" value={grns.filter((g) => g.allJobsFinished).length} color="#059669" />
        </motion.div>

        {/* ─── Search Bar ────────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 flex-1 rounded-xl px-4 py-2.5 transition-all duration-200"
            style={{
              background: 'color-mix(in srgb, var(--card) 96%, var(--primary) 4%)',
              border: '1px solid var(--border)',
            }}
          >
            <Search size={16} style={{ color: 'var(--muted-foreground)' }} />
            <input
              className="flex-1 outline-none text-sm bg-transparent"
              style={{ color: 'var(--foreground)' }}
              placeholder="Search by GRN, Material, Supplier, PO..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="p-0.5 rounded hover:opacity-70 transition-all">
                <X size={14} style={{ color: 'var(--muted-foreground)' }} />
              </button>
            )}
          </div>
          <span
            className="text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ background: 'color-mix(in srgb, var(--primary) 10%, transparent)', color: 'var(--primary)' }}
          >
            {filteredGrns.length} entries
          </span>
        </motion.div>

        {/* ─── GRN Table ──────────────────────────────────────────── */}
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border overflow-hidden"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div
            className="px-5 py-4 flex items-center justify-between"
            style={{ borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 6%, var(--card)), color-mix(in srgb, var(--secondary) 4%, var(--card)))' }}
          >
            <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
              <Layers size={16} style={{ color: 'var(--primary)' }} />
              GRN Materials
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {['GRN #', 'Material', 'Supplier', 'Received', 'Transferred', 'Remaining', 'Cleaned', 'Status', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap"
                      style={{
                        color: 'var(--muted-foreground)',
                        borderBottom: '1px solid var(--border)',
                        background: 'var(--muted)',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredGrns
                    .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                    .map((grn, idx) => {
                      const unit = grn.purchaseOrderItem?.rawMaterial?.unitOfMeasurement || 'KG';
                      return (
                        <motion.tr
                          key={grn.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.02, duration: 0.15 }}
                          className="transition-colors duration-150 cursor-default"
                          style={{ borderBottom: '1px solid color-mix(in srgb, var(--border) 50%, transparent)' }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--muted)'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                        >
                          <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--foreground)' }}>
                            <span
                              className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-lg"
                              style={{
                                background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
                                color: 'var(--primary)',
                              }}
                            >
                              {grn.grnNumber}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{grn.rawMaterialName}</div>

                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: 'var(--foreground)' }}>{grn.supplier}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                            {grn.totalReceived} {unit}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold" style={{ color: 'var(--secondary)' }}>
                            {grn.totalTransferred} {unit}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-bold" style={{ color: grn.leftQuantity > 0 ? '#d97706' : '#059669' }}>
                            {grn.leftQuantity} {unit}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold" style={{ color: '#059669' }}>
                            {grn.cleaningJobs?.filter((j) => j.status === 'Cleaned').reduce((sum, j) => {
                              const stoneWastageInBase = convertWeight((j.stoneWastageQty || 0), (j.stoneWastageUnit || 'kg'), unit);
                              const seedWastageInBase = convertWeight((j.seedWastageQty || 0), (j.seedWastageUnit || 'kg'), unit);
                              const net = (j.quantity || 0) - stoneWastageInBase - seedWastageInBase;
                              return sum + Math.max(0, net);
                            }, 0).toFixed(2)} {unit}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {grn.allJobsFinished ? (
                              <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, #10b981 14%, transparent)', color: '#059669' }}>
                                <CheckCircle size={10} className="mr-1" /> All Cleaned
                              </span>
                            ) : grn.cleaningJobs?.length > 0 ? (
                              <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--secondary) 14%, transparent)', color: 'var(--secondary)' }}>
                                In Progress
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                                Not Started
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {grn.leftQuantity > 0 && (
                                <button
                                  onClick={() => handleOpenTransfer(grn)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 active:scale-95"
                                  style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                                >
                                  <ArrowRight size={12} /> Transfer
                                </button>
                              )}
                              {/* Eye icon for cleaning history */}
                              <button
                                onClick={() => handleViewHistory(grn)}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 active:scale-95"
                                style={{
                                  background: 'color-mix(in srgb, var(--secondary) 10%, transparent)',
                                  color: 'var(--secondary)',
                                  border: '1px solid color-mix(in srgb, var(--secondary) 20%, var(--border))',
                                }}
                                title="View Cleaning History"
                              >
                                <Eye size={15} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                </AnimatePresence>
                {filteredGrns.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-12">
                      <div style={{ color: 'var(--muted-foreground)' }} className="text-sm">
                        {loading ? 'Loading GRN data...' : 'No GRN entries found'}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ─── Pagination Controls ─────────────────────────────── */}
          {filteredGrns.length > 0 && (
            <div
              className="px-5 py-3 flex items-center justify-between"
              style={{ borderTop: '1px solid var(--border)', background: 'var(--muted)' }}
            >
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredGrns.length)}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredGrns.length)} of {filteredGrns.length}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 disabled:opacity-40"
                  style={{ background: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
                >
                  ← Prev
                </button>
                {Array.from({ length: Math.ceil(filteredGrns.length / ITEMS_PER_PAGE) }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className="w-8 h-8 rounded-lg text-xs font-bold transition-all active:scale-95"
                    style={{
                      background: page === currentPage ? 'var(--primary)' : 'var(--card)',
                      color: page === currentPage ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                      border: page === currentPage ? 'none' : '1px solid var(--border)',
                    }}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(Math.ceil(filteredGrns.length / ITEMS_PER_PAGE), p + 1))}
                  disabled={currentPage === Math.ceil(filteredGrns.length / ITEMS_PER_PAGE)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 disabled:opacity-40"
                  style={{ background: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* ─── Transfer Modal ─────────────────────────────────────── */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
              <ArrowRight size={16} />
            </div>
            <span className="text-base font-bold" style={{ color: 'var(--foreground)' }}>Transfer to Cleaning</span>
          </div>
        }
        open={transferModalOpen}
        onCancel={() => setTransferModalOpen(false)}
        footer={null}
        centered
      >
        {selectedGrn && (
          <div className="space-y-4 pt-2">
            <div className="rounded-xl p-4 space-y-2" style={{ background: 'color-mix(in srgb, var(--primary) 4%, var(--card))', border: '1px solid var(--border)' }}>
              <InfoRow label="GRN" value={selectedGrn.grnNumber} />
              <InfoRow label="Material" value={selectedGrn.rawMaterialName} />
              <InfoRow label="Available Qty" value={`${selectedGrn.leftQuantity} ${selectedGrn.purchaseOrderItem?.rawMaterial?.unitOfMeasurement || 'KG'}`} valueColor="#d97706" />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                  Transfer Quantity <span style={{ color: 'var(--destructive)' }}>*</span>
                </label>
                {transferUnit !== (selectedGrn.purchaseOrderItem?.rawMaterial?.unitOfMeasurement || 'KG') && (
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                    = {convertWeight(transferQty, transferUnit, selectedGrn.purchaseOrderItem?.rawMaterial?.unitOfMeasurement || 'KG').toFixed(2)} {selectedGrn.purchaseOrderItem?.rawMaterial?.unitOfMeasurement || 'KG'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <InputNumber
                  className="flex-1"
                  min={0.01}
                  step={0.1}
                  value={transferQty}
                  onChange={(v) => setTransferQty(v || 0)}
                  placeholder={`Base Max: ${selectedGrn.leftQuantity}`}
                />
                <select
                  className="bg-muted/20 border border-border/30 rounded-lg px-2 py-1 text-sm text-foreground focus:outline-none focus:border-primary/50 transition cursor-pointer"
                  style={{ height: '32px' }}
                  value={transferUnit}
                  onChange={(e) => setTransferUnit(e.target.value)}
                >
                  {Array.from(new Set([selectedGrn.purchaseOrderItem?.rawMaterial?.unitOfMeasurement || 'KG', 'gram', 'KG', 'Ton'])).map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                From Location
              </label>
              <div
                className="w-full rounded-lg px-3 py-2.5 text-sm"
                style={{ background: 'var(--muted)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
              >
                {selectedGrn.purchaseOrderItem?.receivals?.[0]?.fromLocation?.name
                  || selectedGrn.purchaseOrderItem?.receivals?.[0]?.location?.name
                  || selectedGrn.purchaseOrderItem?.receivals?.[0]?.warehouse?.name
                  || '-'}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                To Location <span style={{ color: 'var(--destructive)' }}>*</span>
              </label>
              <Select
                className="w-full"
                placeholder="Select destination location"
                value={toLocationId || undefined}
                onChange={(v) => setToLocationId(v)}
              >
                {locations.map((l) => (
                  <Option key={l.id} value={l.id}>{l.name} ({l.code})</Option>
                ))}
              </Select>
            </div>

            <div className="flex items-center gap-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => setTransferModalOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95"
                style={{ background: 'var(--muted)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleTransfer}
                disabled={!toLocationId || transferQty <= 0 || transferring}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
                style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
              >
                {transferring ? 'Transferring...' : 'Transfer & Generate Lot'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Finish Cleaning Modal ──────────────────────────────── */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: '#059669', color: '#fff' }}>
              <CheckCircle size={16} />
            </div>
            <span className="text-base font-bold" style={{ color: 'var(--foreground)' }}>Finish Cleaning</span>
          </div>
        }
        open={finishModalOpen}
        onCancel={() => setFinishModalOpen(false)}
        footer={null}
        centered
      >
        <div className="space-y-4 pt-2">
          <div className="rounded-xl p-4" style={{ background: 'color-mix(in srgb, #059669 4%, var(--card))', border: '1px solid var(--border)' }}>
            <InfoRow label="Cleaning Job" value={selectedJobId} />
          </div>

          {/* Stone Wastage */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
              Stone Wastage
            </label>
            <div className="flex items-center gap-2">
              <InputNumber
                className="flex-1"
                min={0}
                step={0.1}
                value={stoneWastageQty}
                onChange={(v) => setStoneWastageQty(v || 0)}
                placeholder="Qty"
              />
              <select
                className="bg-muted/20 border border-border/30 rounded-lg px-2 py-1 text-sm text-foreground focus:outline-none focus:border-primary/50 transition cursor-pointer"
                style={{ height: '32px', width: '90px' }}
                value={stoneWastageUnit}
                onChange={(e) => setStoneWastageUnit(e.target.value)}
              >
                <option value="Ton">Ton</option>
                <option value="KG">KG</option>
                <option value="gram">gram</option>
              </select>
            </div>
          </div>

          {/* Seed Wastage */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
              Seed Wastage
            </label>
            <div className="flex items-center gap-2">
              <InputNumber
                className="flex-1"
                min={0}
                step={0.1}
                value={seedWastageQty}
                onChange={(v) => setSeedWastageQty(v || 0)}
                placeholder="Qty"
              />
              <select
                className="bg-muted/20 border border-border/30 rounded-lg px-2 py-1 text-sm text-foreground focus:outline-none focus:border-primary/50 transition cursor-pointer"
                style={{ height: '32px', width: '90px' }}
                value={seedWastageUnit}
                onChange={(e) => setSeedWastageUnit(e.target.value)}
              >
                <option value="Ton">Ton</option>
                <option value="KG">KG</option>
                <option value="gram">gram</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            <button
              onClick={() => setFinishModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95"
              style={{ background: 'var(--muted)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
            >
              Cancel
            </button>
            <button
              onClick={handleFinishCleaning}
              disabled={finishing}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
              style={{ background: '#059669', color: '#fff' }}
            >
              {finishing ? 'Finishing...' : 'Finish Cleaning'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── Cleaning History Modal (Eye Icon) ──────────────────── */}
      <Modal
        title={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: 'var(--secondary)', color: '#fff' }}>
                <Eye size={16} />
              </div>
              <div>
                <span className="text-base font-bold block" style={{ color: 'var(--foreground)' }}>
                  Cleaning History
                </span>
                <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {historyGrn?.grnNumber} - {historyGrn?.rawMaterialName}
                </span>
              </div>
            </div>
            <button
              onClick={handleExportPDF}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95 mr-6"
              style={{
                background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
                color: 'var(--primary)',
                border: '1px solid color-mix(in srgb, var(--primary) 25%, var(--border))',
              }}
              title="Export as PDF"
            >
              <Download size={14} />
              Export PDF
            </button>
          </div>
        }
        open={historyModalOpen}
        onCancel={() => setHistoryModalOpen(false)}
        footer={null}
        centered
        width={780}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      >
        {historyGrn && (
          <div className="space-y-6 pt-2">

            {/* Quantity Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              <QuantityCard
                label="Total Received"
                value={historyGrn.totalReceived}
                unit={historyGrn.purchaseOrderItem?.rawMaterial?.unitOfMeasurement || 'KG'}
                color="var(--primary)"
              />
              <QuantityCard
                label="Transferred"
                value={historyGrn.totalTransferred}
                unit={historyGrn.purchaseOrderItem?.rawMaterial?.unitOfMeasurement || 'KG'}
                color="var(--secondary)"
              />
              <QuantityCard
                label="Remaining"
                value={historyGrn.leftQuantity}
                unit={historyGrn.purchaseOrderItem?.rawMaterial?.unitOfMeasurement || 'KG'}
                color={historyGrn.leftQuantity > 0 ? '#d97706' : '#059669'}
              />
            </div>

            {/* Cleaning Jobs Timeline */}
            <div className="space-y-4">
              <h3 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 px-1" style={{ color: 'var(--muted-foreground)' }}>
                <ClipboardCheck size={14} className="text-primary" />
                Cleaning Transfers & Job History
              </h3>

              {historyGrn.cleaningJobs?.length > 0 ? (
                <div className="space-y-4">
                  {historyGrn.cleaningJobs.map((job) => {
                    const unit = historyGrn.purchaseOrderItem?.rawMaterial?.unitOfMeasurement || 'KG';
                    const stoneWastageInBase = convertWeight((job.stoneWastageQty || 0), (job.stoneWastageUnit || 'kg'), unit);
                    const seedWastageInBase = convertWeight((job.seedWastageQty || 0), (job.seedWastageUnit || 'kg'), unit);
                    const netQty = Math.max(0, (job.quantity || 0) - stoneWastageInBase - seedWastageInBase);

                    return (
                      <motion.div
                        key={job.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border overflow-hidden shadow-sm transition-all hover:shadow-md"
                        style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
                      >
                        {/* Job Header */}
                        <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--border)', background: 'linear-gradient(to right, color-mix(in srgb, var(--primary) 5%, transparent), transparent)' }}>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl shadow-sm" style={{ background: '#fff', border: '1px solid var(--border)', color: 'var(--primary)' }}>
                              <Package size={20} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-base font-bold" style={{ color: 'var(--foreground)' }}>LOT-{job.id}</span>
                                {getStatusTag(job.status)}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs font-medium mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                                <MapPin size={12} className="text-primary" />
                                <span>{job.fromLocation?.name || job.fromWarehouse?.name || '-'}</span>
                                <ArrowRight size={10} className="mx-1 text-muted-foreground" />
                                <MapPin size={12} className="text-secondary" />
                                <span>{job.toLocation?.name || job.toWarehouse?.name || '-'}</span>
                              </div>
                            </div>
                          </div>

                          {job.status === 'Sent' && (
                            <button
                              onClick={() => { setHistoryModalOpen(false); handleOpenFinish(job.id); }}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:shadow-md active:scale-95 shadow-sm"
                              style={{ background: '#059669', color: '#fff' }}
                            >
                              <CheckCircle size={16} /> Finish Cleaning
                            </button>
                          )}
                        </div>

                        {/* Job Details Grid */}
                        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* Column 1: Quantity Flow */}
                          <div className="space-y-5">
                            <div className="flex items-center justify-between p-4 rounded-xl border border-dashed" style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--muted) 40%, transparent)' }}>
                              <div className="text-center flex-1">
                                <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Transfer Qty</div>
                                <div className="text-xl font-extrabold" style={{ color: 'var(--foreground)' }}>
                                  {job.quantity} <span className="text-[10px] font-medium opacity-60 ml-0.5">{unit}</span>
                                </div>
                              </div>
                              <div className="px-4 flex flex-col items-center">
                                <ArrowRight size={16} className="text-muted-foreground" />
                                <div className="text-[9px] font-bold text-muted-foreground mt-1 uppercase tracking-tighter">PROCESS</div>
                              </div>
                              <div className="text-center flex-1">
                                <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Cleaned Qty</div>
                                <div className="text-xl font-extrabold" style={{ color: job.status === 'Cleaned' ? '#059669' : 'var(--primary)' }}>
                                  {job.status === 'Cleaned' ? netQty.toFixed(2) : '--'} <span className="text-[10px] font-medium opacity-60 ml-0.5">{unit}</span>
                                </div>
                              </div>
                            </div>

                            {/* Wastage Breakdown If Cleaned */}
                            {job.status === 'Cleaned' && (
                              <div className="flex items-center gap-8 px-5 py-3.5 rounded-2xl border" style={{ background: 'color-mix(in srgb, #f59e0b 3%, var(--card))', borderColor: 'color-mix(in srgb, #f59e0b 15%, var(--border))' }}>
                                <div className="flex items-center gap-3.5">
                                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm" style={{ background: '#fff', border: '1px solid color-mix(in srgb, #f59e0b 20%, var(--border))' }}>
                                    <Mountain size={16} className="text-amber-600" />
                                  </div>
                                  <div>
                                    <div className="text-[10px] font-bold text-amber-700/80 uppercase tracking-widest leading-none">Stone Loss</div>
                                    <div className="text-base font-extrabold text-foreground mt-1">
                                      {job.stoneWastageQty || 0} <span className="text-[10px] font-medium opacity-50">{(job.stoneWastageUnit || 'kg').toUpperCase()}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="w-px h-8 bg-amber-200/40" />

                                <div className="flex items-center gap-3.5">
                                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm" style={{ background: '#fff', border: '1px solid color-mix(in srgb, #f59e0b 20%, var(--border))' }}>
                                    <Sprout size={16} className="text-amber-600" />
                                  </div>
                                  <div>
                                    <div className="text-[10px] font-bold text-amber-700/80 uppercase tracking-widest leading-none">Seed Loss</div>
                                    <div className="text-base font-extrabold text-foreground mt-1">
                                      {job.seedWastageQty || 0} <span className="text-[10px] font-medium opacity-50">{(job.seedWastageUnit || 'kg').toUpperCase()}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Column 2: Timeline & Logs */}
                          <div className="flex flex-col h-full">
                                <div className="flex-1 space-y-5">
                              {(() => {
                                const totalWasteInBase = stoneWastageInBase + seedWastageInBase;
                                const wastPct = job.wastagePercentage ?? (job.quantity ? parseFloat(((totalWasteInBase / job.quantity) * 100).toFixed(2)) : 0);
                                const wastType = job.wastageType ?? (wastPct > 3 ? 'Abnormal Loss' : 'Normal Loss');
                                const isAbnormal = wastType === 'Abnormal Loss';
                                const showWastage = job.status === 'Cleaned';

                                return (
                                  <div className="flex gap-4">
                                    {/* Timeline dots */}
                                    <div className="flex flex-col items-center pt-1">
                                      <div className="w-2.5 h-2.5 rounded-full border-2 border-primary bg-white shadow-sm" />
                                      <div className="w-0.5 flex-1 bg-border border-dashed my-1" />
                                      <div className={`w-2.5 h-2.5 rounded-full border-2 ${job.finishedAt ? 'border-emerald-500 bg-emerald-50' : 'border-muted bg-muted'}`} />
                                      {showWastage && (
                                        <>
                                          <div className="w-0.5 flex-1 my-1" style={{ background: isAbnormal ? '#fca5a5' : '#6ee7b7' }} />
                                          <div
                                            className="w-3 h-3 rounded-full border-2 shadow-sm"
                                            style={{
                                              borderColor: isAbnormal ? '#ef4444' : '#10b981',
                                              background: isAbnormal ? '#fef2f2' : '#ecfdf5',
                                            }}
                                          />
                                        </>
                                      )}
                                    </div>

                                    {/* Timeline content */}
                                    <div className="space-y-6">
                                      <div>
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Job Initialized</div>
                                        <div className="flex items-center gap-2 mt-1.5">
                                          <Clock size={14} className="text-muted-foreground opacity-60" />
                                          <span className="text-xs font-bold text-foreground">
                                            {new Date(job.startedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                          </span>
                                        </div>
                                      </div>
                                      <div>
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Process Completed</div>
                                        <div className="flex items-center gap-2 mt-1.5">
                                          <CheckCircle size={14} className={`${job.finishedAt ? 'text-emerald-500' : 'text-muted-foreground opacity-40'}`} />
                                          <span className={`text-xs font-bold ${job.finishedAt ? 'text-foreground' : 'text-muted-foreground italic font-medium'}`}>
                                            {job.finishedAt
                                              ? new Date(job.finishedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                              : 'Still in progress...'
                                            }
                                          </span>
                                        </div>
                                      </div>

                                      {/* Wastage % — as a timeline entry */}
                                      {showWastage && (
                                        <div>
                                          <div
                                            className="text-[10px] font-bold uppercase tracking-widest leading-none"
                                            style={{ color: isAbnormal ? '#dc2626' : '#059669' }}
                                          >
                                            Wastage Analysis
                                          </div>
                                          <div className="flex items-center gap-2.5 mt-1.5">
                                            {isAbnormal
                                              ? <AlertTriangle size={14} className="text-red-500" />
                                              : <CheckCircle size={14} className="text-emerald-500" />}
                                            <span className="text-sm font-extrabold" style={{ color: 'var(--foreground)' }}>
                                              {wastPct}%
                                            </span>
                                            <span
                                              className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full"
                                              style={{
                                                background: isAbnormal
                                                  ? 'color-mix(in srgb, #ef4444 14%, transparent)'
                                                  : 'color-mix(in srgb, #10b981 14%, transparent)',
                                                color: isAbnormal ? '#dc2626' : '#059669',
                                              }}
                                            >
                                              {isAbnormal && <AlertTriangle size={9} className="mr-1" />}
                                              {wastType}
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl p-12 text-center border-2 border-dashed" style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--primary) 2%, transparent)' }}>
                  <Sparkles size={40} className="mx-auto mb-4 opacity-20 text-primary" />
                  <div className="text-base font-bold text-foreground">No Cleaning Records Found</div>
                  <p className="text-xs text-muted-foreground mt-2 max-w-xs mx-auto">
                    This GRN hasn't been queued for cleaning yet. Start by transferring material from the main list.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Processing Overlay ────────────────────────────────── */}
      <ProcessingOverlay
        visible={overlayVisible}
        phase={overlayPhase}
        mode={overlayMode}
        errorMessage={overlayError}
      />
    </motion.div>
  );
};

// ─── Sub Components ──────────────────────────────────────────────────────
const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: number; color: string }> = ({
  icon, label, value, color,
}) => (
  <motion.div
    whileHover={{ y: -2 }}
    transition={{ duration: 0.15 }}
    className="rounded-xl border p-4 flex items-center gap-3 cursor-default"
    style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
  >
    <div
      className="flex items-center justify-center w-10 h-10 rounded-lg"
      style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, color }}
    >
      {icon}
    </div>
    <div>
      <div className="text-xl font-extrabold" style={{ color: 'var(--foreground)' }}>{value}</div>
      <div className="text-[11px] font-medium" style={{ color: 'var(--muted-foreground)' }}>{label}</div>
    </div>
  </motion.div>
);

const InfoRow: React.FC<{ label: string; value: string; valueColor?: string }> = ({ label, value, valueColor }) => (
  <div className="flex items-center justify-between py-1">
    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{label}</span>
    <span className="text-sm font-semibold" style={{ color: valueColor || 'var(--foreground)' }}>{value}</span>
  </div>
);

const QuantityCard: React.FC<{ label: string; value: number; unit: string; color: string }> = ({
  label, value, unit, color,
}) => (
  <div
    className="rounded-lg p-3 text-center"
    style={{
      background: `color-mix(in srgb, ${color} 6%, var(--card))`,
      border: `1px solid color-mix(in srgb, ${color} 20%, var(--border))`,
    }}
  >
    <div className="text-xl font-extrabold" style={{ color }}>{value}</div>
    <div className="text-[10px] font-medium mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{unit}</div>
    <div className="text-[10px] mt-1" style={{ color: 'var(--muted-foreground)' }}>{label}</div>
  </div>
);

export default CleaningRawMaterialList;
