import React, { useEffect, useState } from 'react';
import api, { API_ROUTES } from '../../../utils/api';
import { Modal, Select, message, InputNumber } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  CheckCircle,
  Layers,
  ArrowRight,
  Hash,
  FileText,
  Sparkles,
  ClipboardCheck,
  Search,
  RefreshCw,
  X,
  Eye,
  Clock,
  MapPin,
} from 'lucide-react';

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

// ─── Types ───────────────────────────────────────────────────────────────
interface CleaningLotItem {
  id: string;
  lotNumber: string;
  quantity: number;
  status: string;
  stoneWastageQty?: number;
  stoneWastageUnit?: string;
  seedWastageQty?: number;
  seedWastageUnit?: string;
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
    receivals: { warehouseId: string; warehouse: { name: string } }[];
  };
  qualityReport?: { id: string; parameters: { parameter: string; standard: string; result: string }[] };
  cleaningJobs: CleaningJobItem[];
  cleaningLots: CleaningLotItem[];
  totalReceived: number;
  totalTransferred: number;
  leftQuantity: number;
  allJobsFinished: boolean;
}

interface WarehouseItem {
  id: string;
  name: string;
}

// ─── Main Component ─────────────────────────────────────────────────────
const CleaningRawMaterialList: React.FC = () => {
  const [grns, setGrns] = useState<GRNItem[]>([]);
  const [filteredGrns, setFilteredGrns] = useState<GRNItem[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  // Transfer Modal
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedGrn, setSelectedGrn] = useState<GRNItem | null>(null);
  const [transferQty, setTransferQty] = useState<number>(0);
  const [toWarehouseId, setToWarehouseId] = useState('');
  const [transferring, setTransferring] = useState(false);

  // Finish Cleaning Modal
  const [finishModalOpen, setFinishModalOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [stoneWastageQty, setStoneWastageQty] = useState<number>(0);
  const [stoneWastageUnit, setStoneWastageUnit] = useState<string>('kg');
  const [seedWastageQty, setSeedWastageQty] = useState<number>(0);
  const [seedWastageUnit, setSeedWastageUnit] = useState<string>('kg');
  const [finishing, setFinishing] = useState(false);

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

  const fetchWarehouses = async () => {
    try {
      const authToken = localStorage.getItem('authToken');
      const res = await api.get(API_ROUTES.RAW.GET_WAREHOUSES, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      // Handle both { data: [...] } and direct array response
      const data = res.data?.data || res.data || [];
      setWarehouses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch warehouses:', err);
    }
  };

  useEffect(() => {
    fetchGRNs();
    fetchWarehouses();
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
    setToWarehouseId('');
    setTransferModalOpen(true);
  };

  const handleTransfer = async () => {
    if (!selectedGrn || !toWarehouseId || transferQty <= 0) {
      message.warning('Please fill all fields correctly');
      return;
    }
    if (transferQty > selectedGrn.leftQuantity) {
      message.error(`Cannot exceed available quantity (${selectedGrn.leftQuantity})`);
      return;
    }
    setTransferring(true);
    const transferKey = `transfer_${selectedGrn?.id || Date.now()}`;
    message.loading({ content: 'Transferring...', key: transferKey, duration: 0 });
    try {
      const authToken = localStorage.getItem('authToken');
      const res = await api.post(API_ROUTES.RAW.CREATE_GRN_CLEANING_TRANSFER, {
        grnId: selectedGrn.id,
        toWarehouseId,
        quantity: transferQty,
      }, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      message.success({ content: res.data?.message || 'Transfer created successfully!', key: transferKey, duration: 2 });
      setTransferModalOpen(false);
      fetchGRNs();
    } catch (err: any) {
      console.error('Transfer failed:', err);
      message.error({ content: err?.response?.data?.error || 'Transfer failed', key: transferKey, duration: 2 });
    }
    setTransferring(false);
  };

  // ─── Finish Cleaning ──────────────────────────────────────────────
  const handleOpenFinish = (jobId: string) => {
    setSelectedJobId(jobId);
    setStoneWastageQty(0);
    setStoneWastageUnit('kg');
    setSeedWastageQty(0);
    setSeedWastageUnit('kg');
    setFinishModalOpen(true);
  };

  const handleFinishCleaning = async () => {
    if (!selectedJobId) return;
    setFinishing(true);
    const finishKey = `finish_${selectedJobId || Date.now()}`;
    message.loading({ content: 'Finishing...', key: finishKey, duration: 0 });
    try {
      const authToken = localStorage.getItem('authToken');
      const res = await api.put(API_ROUTES.RAW.FINISH_CLEANING_JOB(selectedJobId), {
        stoneWastageQty,
        stoneWastageUnit,
        seedWastageQty,
        seedWastageUnit,
      }, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      message.success({ content: res.data?.message || 'Cleaning finished!', key: finishKey, duration: 2 });
      setFinishModalOpen(false);
      fetchGRNs();
    } catch (err: any) {
      console.error('Finish cleaning failed:', err);
      message.error({ content: err?.response?.data?.error || 'Failed to finish cleaning', key: finishKey, duration: 2 });
    }
    setFinishing(false);
  };

  // ─── View Cleaning History ─────────────────────────────────────────
  const handleViewHistory = (grn: GRNItem) => {
    setHistoryGrn(grn);
    setHistoryModalOpen(true);
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
                              const net = (j.quantity || 0) - (j.stoneWastageQty || 0) - (j.seedWastageQty || 0);
                              return sum + Math.max(0, net);
                            }, 0)} {unit}
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
          {filteredGrns.length > ITEMS_PER_PAGE && (
            <div
              className="px-5 py-3 flex items-center justify-between"
              style={{ borderTop: '1px solid var(--border)', background: 'var(--muted)' }}
            >
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredGrns.length)} of {filteredGrns.length}
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
              <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                Transfer Quantity(KG) <span style={{ color: 'var(--destructive)' }}>*</span>
              </label>
              <InputNumber
                className="w-full"
                min={0.01}
                max={selectedGrn.leftQuantity}
                step={0.1}
                value={transferQty}
                onChange={(v) => setTransferQty(v || 0)}
                placeholder={`Max: ${selectedGrn.leftQuantity}`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                Destination Warehouse <span style={{ color: 'var(--destructive)' }}>*</span>
              </label>
              <Select
                className="w-full"
                placeholder="Select warehouse"
                value={toWarehouseId || undefined}
                onChange={(v) => setToWarehouseId(v)}
              >
                {warehouses.map((w) => (
                  <Option key={w.id} value={w.id}>{w.name}</Option>
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
                disabled={!toWarehouseId || transferQty <= 0 || transferring}
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
              <Select
                style={{ width: 90 }}
                value={stoneWastageUnit}
                onChange={(v) => setStoneWastageUnit(v)}
              >
                <Option value="kg">KG</Option>
                <Option value="gm">GM</Option>
              </Select>
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
              <Select
                style={{ width: 90 }}
                value={seedWastageUnit}
                onChange={(v) => setSeedWastageUnit(v)}
              >
                <Option value="kg">KG</Option>
                <Option value="gm">GM</Option>
              </Select>
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
        }
        open={historyModalOpen}
        onCancel={() => setHistoryModalOpen(false)}
        footer={null}
        centered
        width={780}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      >
        {historyGrn && (
          <div className="space-y-5 pt-2">

            {/* Quantity Summary */}
            <div className="grid grid-cols-3 gap-3">
              <QuantityCard label="Total Received" value={historyGrn.totalReceived} unit={historyGrn.purchaseOrderItem?.rawMaterial?.unitOfMeasurement || 'KG'} color="var(--primary)" />
              <QuantityCard label="Transferred" value={historyGrn.totalTransferred} unit={historyGrn.purchaseOrderItem?.rawMaterial?.unitOfMeasurement || 'KG'} color="var(--secondary)" />
              <QuantityCard label="Remaining" value={historyGrn.leftQuantity} unit={historyGrn.purchaseOrderItem?.rawMaterial?.unitOfMeasurement || 'KG'} color={historyGrn.leftQuantity > 0 ? '#d97706' : '#059669'} />
            </div>

            {/* Cleaning Jobs + Lot Timeline */}
            {historyGrn.cleaningJobs?.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--primary)' }}>
                  <ClipboardCheck size={14} /> Cleaning Transfers &amp; Lots
                </h3>
                {historyGrn.cleaningJobs.map((job) => {
                  const unit = historyGrn.purchaseOrderItem?.rawMaterial?.unitOfMeasurement || 'KG';
                  return (
                    <div key={job.id} className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                      {/* Job Header */}
                      <div
                        className="px-4 py-3 flex items-center justify-between flex-wrap gap-2"
                        style={{
                          background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 5%, var(--card)), color-mix(in srgb, var(--secondary) 3%, var(--card)))',
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ background: 'color-mix(in srgb, var(--primary) 12%, transparent)', color: 'var(--primary)' }}>
                            <ClipboardCheck size={14} />
                          </div>
                          <div>
                            <span className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>LOT-{job.id}</span>
                            <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                              <MapPin size={10} />
                              {job.fromWarehouse?.name} → {job.toWarehouse?.name}
                            </div>
                          </div>
                        </div>
                          <div className="flex items-center gap-2">
                          {getStatusTag(job.status)}
                          <span className="text-sm font-bold" style={{ color: 'var(--primary)' }}>
                            {/* Show cleaned quantity = transferred - wastage */}
                            {Math.max(0, (job.quantity || 0) - (job.stoneWastageQty || 0) - (job.seedWastageQty || 0))} {unit}
                          </span>
                          {job.status === 'Sent' && (
                            <button
                              onClick={() => { setHistoryModalOpen(false); handleOpenFinish(job.id); }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all active:scale-95"
                              style={{ background: '#059669', color: '#fff' }}
                            >
                              <CheckCircle size={11} /> Finish
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Stone & Seed Wastage Info for this Job */}
                      {job.status === 'Cleaned' && ((job.stoneWastageQty ?? 0) > 0 || (job.seedWastageQty ?? 0) > 0) && (
                        <div
                          className="px-4 py-2.5 flex items-center flex-wrap gap-3 text-xs"
                          style={{
                            background: 'color-mix(in srgb, #f59e0b 5%, var(--card))',
                            borderBottom: '1px solid var(--border)',
                          }}
                        >
                          {(job.stoneWastageQty ?? 0) > 0 && (
                            <span className="font-semibold" style={{ color: '#d97706' }}>
                              Stone: {job.stoneWastageQty} {(job.stoneWastageUnit || 'kg').toUpperCase()}
                            </span>
                          )}
                          {(job.seedWastageQty ?? 0) > 0 && (
                            <span className="font-semibold" style={{ color: '#d97706' }}>
                               Seed: {job.seedWastageQty} {(job.seedWastageUnit || 'kg').toUpperCase()}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Lot Numbers for this Job */}
                      {job.cleaningLots?.length > 0 ? (
                        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                          {job.cleaningLots.map((lot) => (
                            <div
                              key={lot.lotNumber}
                              className="px-4 py-3 flex items-center justify-between transition-colors duration-150"
                              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--muted)'; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-7 h-7 rounded-md" style={{ background: 'color-mix(in srgb, var(--primary) 10%, transparent)' }}>
                                  <Hash size={13} style={{ color: 'var(--primary)' }} />
                                </div>
                                <div>
                                  <div className="text-sm font-bold" style={{ color: 'var(--primary)' }}>LOT-{job.id}</div>
                                  <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                                    <MapPin size={9} /> {lot.warehouse?.name}
                                    <span>•</span>
                                    <Clock size={9} /> {new Date(lot.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                                  {Math.max(0, (job.quantity || 0) - (job.stoneWastageQty || 0) - (job.seedWastageQty || 0))} {unit}
                                </span>
                                {getStatusTag(lot.status)}
                                {((lot.stoneWastageQty ?? 0) > 0 || (lot.seedWastageQty ?? 0) > 0) && (
                                  <span
                                    className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full"
                                    style={{ background: 'color-mix(in srgb, #f59e0b 14%, transparent)', color: '#d97706' }}
                                  >
                                    {(lot.stoneWastageQty ?? 0) > 0 && ` ${lot.stoneWastageQty} ${(lot.stoneWastageUnit || 'kg').toUpperCase()}`}
                                    {(lot.stoneWastageQty ?? 0) > 0 && (lot.seedWastageQty ?? 0) > 0 && ' · '}
                                    {(lot.seedWastageQty ?? 0) > 0 && ` ${lot.seedWastageQty} ${(lot.seedWastageUnit || 'kg').toUpperCase()}`}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="px-4 py-6 text-center">
                          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>No lot numbers generated for this job</span>
                        </div>
                      )}

                      {/* Job Footer with timestamps */}
                      <div className="px-4 py-2 flex items-center gap-4 text-[10px]" style={{ background: 'var(--muted)', borderTop: '1px solid var(--border)', color: 'var(--muted-foreground)' }}>
                        <span className="flex items-center gap-1">
                          <Clock size={9} /> Started: {new Date(job.startedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        {job.finishedAt && (
                          <span className="flex items-center gap-1">
                            <CheckCircle size={9} /> Finished: {new Date(job.finishedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl p-8 text-center" style={{ background: 'color-mix(in srgb, var(--primary) 4%, transparent)', border: '1px dashed color-mix(in srgb, var(--primary) 25%, var(--border))' }}>
                <Sparkles size={32} style={{ color: 'var(--muted-foreground)', margin: '0 auto 12px' }} />
                <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>No Cleaning History</div>
                <div className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                  This GRN has not been transferred to cleaning yet. Use the "Transfer" button to start.
                </div>
              </div>
            )}

            {/* Summary: All Lot Numbers Table */}
            {historyGrn.cleaningLots?.length > 0 && (
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                <div className="px-4 py-3 flex items-center gap-2" style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  <Hash size={14} style={{ color: 'var(--primary)' }} />
                  <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--primary)' }}>
                    All Generated Lot Numbers
                  </h3>
                  <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--primary) 12%, transparent)', color: 'var(--primary)' }}>
                    {historyGrn.cleaningLots.length} lots
                  </span>
                </div>
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      {['Cleaning Job', 'Cleaned Qty', 'Warehouse', 'Status', 'Created'].map((h) => (
                        <th key={h} className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)', borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {historyGrn.cleaningLots.map((lot) => (
                      <tr
                        key={lot.id}
                        className="transition-colors duration-150"
                        style={{ borderBottom: '1px solid color-mix(in srgb, var(--border) 50%, transparent)' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--muted)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                      >
                        <td className="px-4 py-2.5 font-bold" style={{ color: 'var(--primary)' }}>LOT-{lot.cleaningJob?.id || lot.lotNumber}</td>
                        <td className="px-4 py-2.5 font-semibold" style={{ color: 'var(--foreground)' }}>{lot.cleaningJob ? Math.max(0, (lot.cleaningJob.quantity || 0) - (lot.stoneWastageQty || 0) - (lot.seedWastageQty || 0)) : lot.quantity} {historyGrn.purchaseOrderItem?.rawMaterial?.unitOfMeasurement || 'KG'}</td>
                        <td className="px-4 py-2.5" style={{ color: 'var(--foreground)' }}>{lot.warehouse?.name}</td>
                        <td className="px-4 py-2.5">{getStatusTag(lot.status)}</td>
                        <td className="px-4 py-2.5" style={{ color: 'var(--muted-foreground)' }}>{new Date(lot.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>
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
