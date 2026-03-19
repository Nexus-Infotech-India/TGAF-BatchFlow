import React, { useEffect, useState, useMemo } from 'react';
import api, { API_ROUTES } from '../../../utils/api';
import { Button, Modal, Input, Select, message, Spin } from 'antd';
import { PlusOutlined, EditOutlined, CheckOutlined, LoadingOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  TrendingUp,
  CheckCircle,
  FileText,
  Boxes,
  Warehouse,
  Scale,
  Layers,
  Hash,
  CalendarDays,
  Eye,
  ChevronDown,
  ChevronRight,
  Leaf,
} from 'lucide-react';


const { Option } = Select;

/* ─── Types ─── */
interface RawMaterial {
  id: string;
  name: string;
  skuCode: string;
  unitOfMeasurement: string;
  category?: string;
}

interface WarehouseType {
  id: string;
  name: string;
  location?: string;
}

interface CleaningLot {
  id: string;
  lotNumber: string;
  cleaningJobId: string;
  grnId: string;
  rawMaterialId: string;
  warehouseId: string;
  quantity: number;
  cleanedQuantity?: number;
  stoneWastageQty?: number;
  seedWastageQty?: number;
  status: string;
  createdAt: string;
  rawMaterial: RawMaterial;
  warehouse: WarehouseType;
  grn?: { grnNumber: string };
  cleaningJob?: {
    id: string;
    quantity: number;
    stoneWastageQty?: number;
    seedWastageQty?: number;
    fromWarehouse?: WarehouseType;
    toWarehouse?: WarehouseType;
  };
  availableSeedWastage?: number;
  totalSeedWastage?: number;
  seedWastageRecord?: {
    id: string;
    quantity: number;
    allocatedQuantity: number;
    restWastage: number;
  } | null;
}

interface ProcessingBatchLot {
  id: string;
  cleaningLotId: string;
  allocatedQuantity: number;
  seedWastageAllocated: number;
  cleaningLot: CleaningLot;
}

interface ProcessingJob {
  id: string;
  batchNumber?: string;
  inputRawMaterialId: string;
  warehouseId?: string;
  quantityInput: number;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  warehouse?: WarehouseType;
  inputRawMaterial?: RawMaterial;
  processingBatchLots?: ProcessingBatchLot[];
}

/* ─── Component ─── */
const ProcessingBatchesPage: React.FC = () => {
  const [processingJobs, setProcessingJobs] = useState<ProcessingJob[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [availableLots, setAvailableLots] = useState<CleaningLot[]>([]);
  const [availableSeedWastageLots, setAvailableSeedWastageLots] = useState<CleaningLot[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  const paginatedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processingJobs.slice(startIndex, startIndex + itemsPerPage);
  }, [processingJobs, currentPage]);

  const [expandedSections, setExpandedSections] = useState<Record<string, { cleaned: boolean; seedWastage: boolean }>>({});

  // ── Create Batch Modal ──
  const [batchModal, setBatchModal] = useState<{
    visible: boolean;
    step: number;
    warehouseId: string;
    rawMaterialId: string;
    selectedLots: Record<string, number>;
    seedWastageLots: Record<string, number>;
    loading: boolean;
  }>({
    visible: false,
    step: 0,
    warehouseId: '',
    rawMaterialId: '',
    selectedLots: {},
    seedWastageLots: {},
    loading: false,
  });

  // ── Finish Modal ──
  const [editStatusModal, setEditStatusModal] = useState<{
    visible: boolean;
    job?: ProcessingJob;
    receivedQuantity: number;
    unit?: string;
    reason: string;
    warehouseId: string;
    loading: boolean;
    isReusable?: boolean;
  }>({
    visible: false,
    job: undefined,
    receivedQuantity: 0,
    unit: undefined,
    reason: '',
    warehouseId: '',
    loading: false,
    isReusable: false,
  });

  /* ─── Fetchers ─── */
  const fetchProcessingJobs = async () => {
    setLoading(true);
    try {
      const res = await api.get(API_ROUTES.RAW.GET_PROCESSING_JOBS);
      setProcessingJobs(res.data);
    } catch {
      message.error('Failed to fetch processing jobs');
    }
    setLoading(false);
  };

  const fetchWarehouses = async () => {
    try {
      const res = await api.get(API_ROUTES.RAW.GET_WAREHOUSES);
      setWarehouses(res.data);
    } catch {
      message.error('Failed to fetch warehouses');
    }
  };

  const fetchRawMaterials = async () => {
    try {
      const res = await api.get(API_ROUTES.RAW.GET_PRODUCTS);
      setRawMaterials(res.data);
    } catch {
      message.error('Failed to fetch raw materials');
    }
  };

  const fetchAvailableLots = async (warehouseId?: string, rawMaterialId?: string) => {
    try {
      const params: any = {};
      if (warehouseId) params.warehouseId = warehouseId;
      if (rawMaterialId) params.rawMaterialId = rawMaterialId;
      const res = await api.get(API_ROUTES.RAW.GET_AVAILABLE_LOTS, { params });
      setAvailableLots(res.data);
    } catch {
      message.error('Failed to fetch available lots');
    }
  };

  const fetchAvailableSeedWastageLots = async (warehouseId?: string, rawMaterialId?: string) => {
    try {
      const params: any = { type: 'seedWastage' };
      if (warehouseId) params.warehouseId = warehouseId;
      if (rawMaterialId) params.rawMaterialId = rawMaterialId;
      const res = await api.get(API_ROUTES.RAW.GET_AVAILABLE_LOTS, { params });
      setAvailableSeedWastageLots(res.data);
    } catch {
      message.error('Failed to fetch seed wastage lots');
    }
  };

  useEffect(() => {
    fetchProcessingJobs();
    fetchWarehouses();
    fetchRawMaterials();
  }, []);

  /* ─── Batch Modal Helpers ─── */
  const openBatchModal = () => {
    setBatchModal({
      visible: true,
      step: 0,
      warehouseId: '',
      rawMaterialId: '',
      selectedLots: {},
      seedWastageLots: {},
      loading: false,
    });
  };

  const closeBatchModal = () => {
    setBatchModal({
      visible: false,
      step: 0,
      warehouseId: '',
      rawMaterialId: '',
      selectedLots: {},
      seedWastageLots: {},
      loading: false,
    });
  };

  const handleBatchWarehouseSelect = (warehouseId: string) => {
    setBatchModal((prev) => ({ ...prev, warehouseId, rawMaterialId: '', selectedLots: {}, seedWastageLots: {} }));
    fetchAvailableLots(warehouseId);
    fetchAvailableSeedWastageLots(warehouseId);
  };

  const handleBatchMaterialSelect = (rawMaterialId: string) => {
    setBatchModal((prev) => ({ ...prev, rawMaterialId, selectedLots: {}, seedWastageLots: {} }));
    fetchAvailableLots(batchModal.warehouseId, rawMaterialId);
    fetchAvailableSeedWastageLots(batchModal.warehouseId, rawMaterialId);
  };

  const handleBatchNextStep = () => {
    if (batchModal.step === 0 && !batchModal.warehouseId) {
      message.error('Please select a warehouse');
      return;
    }
    if (batchModal.step === 1 && !batchModal.rawMaterialId) {
      message.error('Please select a raw material');
      return;
    }
    if (batchModal.step === 1) {
      fetchAvailableLots(batchModal.warehouseId, batchModal.rawMaterialId);
      fetchAvailableSeedWastageLots(batchModal.warehouseId, batchModal.rawMaterialId);
    }
    setBatchModal((prev) => ({ ...prev, step: prev.step + 1 }));
  };

  const handleBatchPrevStep = () => {
    setBatchModal((prev) => ({ ...prev, step: Math.max(0, prev.step - 1) }));
  };

  const toggleLotSelection = (lotId: string, lot: CleaningLot) => {
    setBatchModal((prev) => {
      const newSelected = { ...prev.selectedLots };
      const newSeedWastage = { ...prev.seedWastageLots };
      if (newSelected[lotId] !== undefined) {
        delete newSelected[lotId];
        delete newSeedWastage[lotId];
      } else {
        const netQty = lot.cleanedQuantity ?? 0;
        newSelected[lotId] = netQty;
        newSeedWastage[lotId] = 0;
      }
      return { ...prev, selectedLots: newSelected, seedWastageLots: newSeedWastage };
    });
  };

  const updateLotQuantity = (lotId: string, qty: number) => {
    setBatchModal((prev) => ({
      ...prev,
      selectedLots: { ...prev.selectedLots, [lotId]: qty },
    }));
  };

  const updateSeedWastageQuantity = (lotId: string, qty: number) => {
    setBatchModal((prev) => ({
      ...prev,
      seedWastageLots: { ...prev.seedWastageLots, [lotId]: qty },
    }));
  };

  const toggleSeedWastageLotSelection = (lotId: string, lot: CleaningLot) => {
    setBatchModal((prev) => {
      const newSeedWastage = { ...prev.seedWastageLots };
      if (newSeedWastage[lotId] !== undefined) {
        delete newSeedWastage[lotId];
      } else {
        newSeedWastage[lotId] = lot.availableSeedWastage ?? 0;
      }
      return { ...prev, seedWastageLots: newSeedWastage };
    });
  };

  const toggleSection = (jobId: string, section: 'cleaned' | 'seedWastage') => {
    setExpandedSections((prev) => {
      const current = prev[jobId] || { cleaned: true, seedWastage: true };
      return { ...prev, [jobId]: { ...current, [section]: !current[section] } };
    });
  };

  const totalSelectedQuantity = useMemo(() => {
    const cleanedTotal = Object.values(batchModal.selectedLots).reduce((sum, q) => sum + q, 0);
    const seedWastageTotal = Object.values(batchModal.seedWastageLots).reduce((sum, q) => sum + q, 0);
    return cleanedTotal + seedWastageTotal;
  }, [batchModal.selectedLots, batchModal.seedWastageLots]);

  const filteredLots = useMemo(() => {
    return availableLots.filter((lot) => lot.warehouseId === batchModal.warehouseId);
  }, [availableLots, batchModal.warehouseId]);

  const filteredSeedWastageLots = useMemo(() => {
    return availableSeedWastageLots.filter((lot) => lot.warehouseId === batchModal.warehouseId);
  }, [availableSeedWastageLots, batchModal.warehouseId]);

  const materialsInWarehouse = useMemo(() => {
    const materialIds = new Set<string>();
    const materials: RawMaterial[] = [];
    availableLots
      .filter((l) => l.warehouseId === batchModal.warehouseId)
      .forEach((lot) => {
        if (!materialIds.has(lot.rawMaterialId)) {
          materialIds.add(lot.rawMaterialId);
          materials.push(lot.rawMaterial);
        }
      });
    availableSeedWastageLots
      .filter((l) => l.warehouseId === batchModal.warehouseId)
      .forEach((lot) => {
        if (!materialIds.has(lot.rawMaterialId)) {
          materialIds.add(lot.rawMaterialId);
          materials.push(lot.rawMaterial);
        }
      });
    rawMaterials.forEach((rm) => {
      if (!materialIds.has(rm.id)) {
        materialIds.add(rm.id);
        materials.push(rm);
      }
    });
    return materials;
  }, [availableLots, availableSeedWastageLots, batchModal.warehouseId, rawMaterials]);

  /* ─── Submit Create Batch ─── */
  const handleCreateBatch = async () => {
    const cleanedEntries = Object.entries(batchModal.selectedLots);
    const seedWastageEntries = Object.entries(batchModal.seedWastageLots);

    if (cleanedEntries.length === 0 && seedWastageEntries.length === 0) {
      message.error('Select at least one lot (cleaned qty or seed wastage)');
      return;
    }

    const lotsMap = new Map<string, { lotId: string; allocatedQuantity: number; seedWastageAllocated: number }>();

    for (const [lotId, qty] of cleanedEntries) {
      lotsMap.set(lotId, { lotId, allocatedQuantity: qty, seedWastageAllocated: 0 });
    }
    for (const [lotId, qty] of seedWastageEntries) {
      if (qty > 0) {
        const existing = lotsMap.get(lotId);
        if (existing) {
          existing.seedWastageAllocated = qty;
        } else {
          lotsMap.set(lotId, { lotId, allocatedQuantity: 0, seedWastageAllocated: qty });
        }
      }
    }

    setBatchModal((prev) => ({ ...prev, loading: true }));
    try {
      await api.post(API_ROUTES.RAW.CREATE_PROCESSING_BATCH, {
        warehouseId: batchModal.warehouseId,
        inputRawMaterialId: batchModal.rawMaterialId,
        lots: Array.from(lotsMap.values()),
      });
      message.success('Processing batch created successfully!');
      closeBatchModal();
      fetchProcessingJobs();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to create batch');
      setBatchModal((prev) => ({ ...prev, loading: false }));
    }
  };

  /* ─── Finish Processing Submit ─── */
  const openEditStatusModal = (job: ProcessingJob) => {
    setEditStatusModal({
      visible: true,
      job,
      receivedQuantity: job.quantityInput,
      unit: job.inputRawMaterial?.unitOfMeasurement,
      reason: '',
      warehouseId: job.warehouse?.id || '',
      loading: false,
      isReusable: false,
    });
  };

  const inputQty = editStatusModal.job?.quantityInput || 0;
  const receivedQty = editStatusModal.receivedQuantity || 0;
  const lossQty = Math.max(0, inputQty - receivedQty);
  const hasLoss = lossQty > 0;

  const handleEditStatusSubmit = async () => {
    if (!editStatusModal.job) return;
    if (editStatusModal.receivedQuantity < 0) {
      message.error('Received quantity cannot be negative');
      return;
    }
    if (editStatusModal.receivedQuantity > inputQty) {
      message.error(`Received quantity cannot exceed input quantity (${inputQty})`);
      return;
    }
    if (hasLoss && !editStatusModal.reason) {
      message.error('Please enter a reason for the loss');
      return;
    }
    if (!editStatusModal.warehouseId) {
      message.error('Select a warehouse');
      return;
    }
    setEditStatusModal((prev) => ({ ...prev, loading: true }));
    try {
      const payload: any = {
        status: 'Finished',
        finishedAt: new Date().toISOString(),
        receivedQuantity: editStatusModal.receivedQuantity,
      };

      if (hasLoss) {
        payload.byProducts = [
          {
            quantity: lossQty,
            unit: editStatusModal.unit || editStatusModal.job?.inputRawMaterial?.unitOfMeasurement,
            reason: editStatusModal.reason,
            warehouseId: editStatusModal.warehouseId,
            skuCode: editStatusModal.job.inputRawMaterial?.skuCode || '',
            tag: 'Processing_Waste',
            isReusable: editStatusModal.isReusable,
          },
        ];
      }

      await api.put(API_ROUTES.RAW.UPDATE_PROCESSING_JOB(editStatusModal.job.id), payload);
      message.success('Processing job finished successfully!');
      setEditStatusModal({
        visible: false,
        job: undefined,
        receivedQuantity: 0,
        reason: '',
        warehouseId: '',
        loading: false,
      });
      fetchProcessingJobs();
    } catch {
      message.error('Failed to finish processing');
      setEditStatusModal((prev) => ({ ...prev, loading: false }));
    }
  };

  /* ─── Stats ─── */
  const totalBatches = processingJobs.length;
  const inProgressBatches = processingJobs.filter((j) => j.status === 'In-Progress').length;
  const finishedBatches = processingJobs.filter((j) => j.status === 'Finished' || j.status === 'Completed').length;

  /* ─── Render ─── */
  return (
    <motion.div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          className="bg-card rounded-2xl border border-border overflow-hidden"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' }}>
                <Layers className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Processing Batches</h1>
                <p className="text-muted-foreground text-sm">
                  Create batches from cleaned lots and manage grinding process
                </p>
              </div>
              <div className="ml-auto flex gap-2">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={openBatchModal}
                  className="rounded-lg"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    border: 'none',
                    fontWeight: 600,
                  }}
                >
                  Create Batch
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-muted/50">
            <div className="bg-card rounded-xl p-4 border border-border">
              <p className="text-xs font-medium text-muted-foreground mb-1">Total Batches</p>
              <p className="text-2xl font-bold text-foreground">{totalBatches}</p>
              <div className="flex items-center mt-1">
                <Boxes size={12} className="text-primary mr-1" />
                <span className="text-xs text-primary font-medium">All records</span>
              </div>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border">
              <p className="text-xs font-medium text-muted-foreground mb-1">In-Progress</p>
              <p className="text-2xl font-bold text-foreground">{inProgressBatches}</p>
              <div className="flex items-center mt-1">
                <TrendingUp size={12} className="text-amber-500 mr-1" />
                <span className="text-xs text-amber-500 font-medium">Active processing</span>
              </div>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border">
              <p className="text-xs font-medium text-muted-foreground mb-1">Finished</p>
              <p className="text-2xl font-bold text-foreground">{finishedBatches}</p>
              <div className="flex items-center mt-1">
                <CheckCircle size={12} className="text-emerald-500 mr-1" />
                <span className="text-xs text-emerald-500 font-medium">Completed</span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-4"></th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <div className="inline-flex items-center gap-2">
                      <Hash className="w-3.5 h-3.5" />
                      Batch No.
                    </div>
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <div className="inline-flex items-center gap-2">
                      <Package className="w-3.5 h-3.5" />
                      Raw Material
                    </div>
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <div className="inline-flex items-center gap-2">
                      <Warehouse className="w-3.5 h-3.5" />
                      Warehouse
                    </div>
                  </th>
                  <th className="px-4 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <div className="inline-flex items-center gap-2">
                      <Scale className="w-3.5 h-3.5" />
                      Total Qty
                    </div>
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <div className="inline-flex items-center gap-2">
                      <CalendarDays className="w-3.5 h-3.5" />
                      Started / Finished
                    </div>
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {loading && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                      <Spin indicator={<LoadingOutlined style={{ fontSize: 36, color: '#6366f1' }} spin />} />
                      <p className="text-lg font-medium mt-4">Loading processing batches...</p>
                    </td>
                  </tr>
                )}
                {!loading && processingJobs.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                      <Boxes className="mx-auto mb-3 opacity-40" size={36} />
                      <p className="text-lg font-medium">No processing batches yet</p>
                      <p className="text-sm">Click "Create Batch" to start.</p>
                    </td>
                  </tr>
                )}
                {!loading && paginatedJobs.map((job, index) => (
                  <React.Fragment key={job.id}>
                    <motion.tr
                      className="hover:bg-muted/50 transition-colors duration-150"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.04 }}
                    >
                      <td className="px-2 py-4 text-center">
                        <Button
                          type="text"
                          size="small"
                          icon={expandedJobId === job.id ? <CheckOutlined /> : <Eye className="w-4 h-4" />}
                          onClick={() =>
                            setExpandedJobId(expandedJobId === job.id ? null : job.id)
                          }
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-primary font-semibold">
                        {job.batchNumber || job.id}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                        {job.inputRawMaterial?.name || '-'}
                        {job.inputRawMaterial?.skuCode && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({job.inputRawMaterial.skuCode})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-foreground/80">
                        {job.warehouse?.name || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-foreground text-right font-semibold">
                        {job.quantityInput} {job.inputRawMaterial?.unitOfMeasurement || ''}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${job.status === 'Finished' || job.status === 'Completed'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                            }`}
                        >
                          {job.status === 'Finished' || job.status === 'Completed' ? (
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          ) : (
                            <FileText className="w-3.5 h-3.5 mr-1" />
                          )}
                          {job.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center text-xs text-foreground/70">
                        <div>
                          {job.startedAt && !isNaN(Date.parse(job.startedAt))
                            ? new Date(job.startedAt).toLocaleString()
                            : '-'}
                        </div>
                        {job.finishedAt && !isNaN(Date.parse(job.finishedAt)) && (
                          <div className="text-emerald-500 mt-0.5">
                            → {new Date(job.finishedAt).toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {job.status !== 'Finished' && job.status !== 'Completed' && (
                          <Button
                            type="primary"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => openEditStatusModal(job)}
                            className="rounded-lg"
                            style={{
                              background: 'linear-gradient(135deg, #10b981, #059669)',
                              border: 'none',
                            }}
                          >
                            Finish
                          </Button>
                        )}
                      </td>
                    </motion.tr>

                    {/* Expanded row details */}
                    <AnimatePresence>
                      {expandedJobId === job.id && (
                        <motion.tr
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="bg-muted/30"
                        >
                          <td colSpan={8} className="px-6 py-4 space-y-3">
                            {/* Cleaned Quantity Allocation */}
                            <div className="rounded-xl border border-border bg-card overflow-hidden">
                              <button
                                type="button"
                                className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                                onClick={() => toggleSection(job.id, 'cleaned')}
                              >
                                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                  <Layers className="w-4 h-4 text-primary" />
                                  Cleaned Quantity Allocation
                                </h4>
                                {(expandedSections[job.id]?.cleaned !== false) ? (
                                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                )}
                              </button>
                              <AnimatePresence>
                                {(expandedSections[job.id]?.cleaned !== false) && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="px-4 pb-4">
                                      {(!job.processingBatchLots || job.processingBatchLots.length === 0) ? (
                                        <p className="text-sm text-muted-foreground italic">
                                          No lot allocation data available.
                                        </p>
                                      ) : (
                                        <table className="min-w-full">
                                          <thead>
                                            <tr className="bg-muted/40">
                                              <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Lot</th>
                                              <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Material</th>
                                              <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">Cleaned Qty</th>
                                              <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">Allocated</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-border">
                                            {job.processingBatchLots
                                              .filter((bl) => bl.allocatedQuantity > 0)
                                              .map((bl) => (
                                                <tr key={bl.id} className="hover:bg-muted/30">
                                                  <td className="px-3 py-2 text-sm font-mono text-primary">
                                                    {bl.cleaningLot?.lotNumber || bl.cleaningLotId}
                                                  </td>
                                                  <td className="px-3 py-2 text-sm text-foreground">
                                                    {bl.cleaningLot?.rawMaterial?.name || '-'}
                                                  </td>
                                                  <td className="px-3 py-2 text-sm text-right text-muted-foreground">
                                                    {bl.cleaningLot?.cleanedQuantity ?? '-'} {bl.cleaningLot?.rawMaterial?.unitOfMeasurement || ''}
                                                  </td>
                                                  <td className="px-3 py-2 text-sm text-right font-semibold text-foreground">
                                                    {bl.allocatedQuantity} {bl.cleaningLot?.rawMaterial?.unitOfMeasurement || ''}
                                                  </td>
                                                </tr>
                                              ))}
                                          </tbody>
                                        </table>
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            {/* Seed Wastage Allocation */}
                            <div className="rounded-xl border border-border bg-card overflow-hidden">
                              <button
                                type="button"
                                className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                                onClick={() => toggleSection(job.id, 'seedWastage')}
                              >
                                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                  <Leaf className="w-4 h-4 text-amber-500" />
                                  Seed Wastage Allocation
                                </h4>
                                {(expandedSections[job.id]?.seedWastage !== false) ? (
                                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                )}
                              </button>
                              <AnimatePresence>
                                {(expandedSections[job.id]?.seedWastage !== false) && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="px-4 pb-4">
                                      {(!job.processingBatchLots || job.processingBatchLots.filter(bl => bl.seedWastageAllocated > 0).length === 0) ? (
                                        <p className="text-sm text-muted-foreground italic">
                                          No seed wastage allocated for this batch.
                                        </p>
                                      ) : (
                                        <table className="min-w-full">
                                          <thead>
                                            <tr className="bg-amber-500/5">
                                              <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Lot</th>
                                              <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Material</th>
                                              <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">Seed Wastage Allocated</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-border">
                                            {job.processingBatchLots
                                              .filter((bl) => bl.seedWastageAllocated > 0)
                                              .map((bl) => (
                                                <tr key={`sw-${bl.id}`} className="hover:bg-muted/30">
                                                  <td className="px-3 py-2 text-sm font-mono text-amber-600">
                                                    {bl.cleaningLot?.lotNumber || bl.cleaningLotId}
                                                  </td>
                                                  <td className="px-3 py-2 text-sm text-foreground">
                                                    {bl.cleaningLot?.rawMaterial?.name || '-'}
                                                  </td>
                                                  <td className="px-3 py-2 text-sm text-right font-semibold text-amber-600">
                                                    {bl.seedWastageAllocated} {bl.cleaningLot?.rawMaterial?.unitOfMeasurement || ''}
                                                  </td>
                                                </tr>
                                              ))}
                                          </tbody>
                                        </table>
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {processingJobs.length > itemsPerPage && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Page {currentPage} of {Math.ceil(processingJobs.length / itemsPerPage)} · {processingJobs.length} total
              </span>
              <div className="flex gap-2">
                <Button
                  size="small"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="small"
                  disabled={currentPage >= Math.ceil(processingJobs.length / itemsPerPage)}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Create Batch Modal ── */}
      <Modal
        open={batchModal.visible}
        title={
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Layers className="text-white" size={14} />
            </div>
            <span className="text-lg font-semibold">Create Processing Batch</span>
          </div>
        }
        onCancel={closeBatchModal}
        width={700}
        footer={null}
      >
        <div className="space-y-4 mt-4">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-4">
            {['Warehouse', 'Material', 'Select Lots'].map((label, idx) => (
              <div key={label} className="flex items-center gap-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    batchModal.step >= idx ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {idx + 1}
                </div>
                <span className={`text-xs ${batchModal.step >= idx ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                  {label}
                </span>
                {idx < 2 && <div className="w-8 h-px bg-border" />}
              </div>
            ))}
          </div>

          {/* Step 0: Select Warehouse */}
          {batchModal.step === 0 && (
            <div>
              <div className="text-xs text-muted-foreground mb-1 font-medium">Select Warehouse</div>
              <Select
                style={{ width: '100%' }}
                placeholder="Choose a warehouse"
                value={batchModal.warehouseId || undefined}
                onChange={handleBatchWarehouseSelect}
              >
                {warehouses.map((w) => (
                  <Option key={w.id} value={w.id}>{w.name}</Option>
                ))}
              </Select>
            </div>
          )}

          {/* Step 1: Select Material */}
          {batchModal.step === 1 && (
            <div>
              <div className="text-xs text-muted-foreground mb-1 font-medium">Select Raw Material</div>
              <Select
                style={{ width: '100%' }}
                placeholder="Choose raw material"
                value={batchModal.rawMaterialId || undefined}
                onChange={handleBatchMaterialSelect}
                showSearch
                filterOption={(input, option) =>
                  (option?.children?.toString() || '').toLowerCase().includes(input.toLowerCase())
                }
              >
                {materialsInWarehouse.map((m) => (
                  <Option key={m.id} value={m.id}>{m.name} ({m.skuCode})</Option>
                ))}
              </Select>
            </div>
          )}

          {/* Step 2: Select Lots */}
          {batchModal.step === 2 && (
            <div className="space-y-3">
              {filteredLots.length === 0 && filteredSeedWastageLots.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Boxes className="mx-auto mb-2 opacity-40" size={32} />
                  <p className="text-sm">No available lots for selected warehouse & material</p>
                </div>
              ) : (
                <>
                  {filteredLots.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Cleaned Lots
                      </div>
                      {filteredLots.map((lot) => (
                        <div
                          key={lot.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border mb-2 cursor-pointer transition-all ${
                            batchModal.selectedLots[lot.id] !== undefined
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:bg-muted/30'
                          }`}
                          onClick={() => toggleLotSelection(lot.id, lot)}
                        >
                          <div className="flex-1">
                            <div className="text-sm font-mono text-primary">{lot.lotNumber}</div>
                            <div className="text-xs text-muted-foreground">
                              Cleaned: {lot.cleanedQuantity ?? 0} {lot.rawMaterial?.unitOfMeasurement}
                            </div>
                          </div>
                          {batchModal.selectedLots[lot.id] !== undefined && (
                            <div className="w-24">
                              <Input
                                type="number"
                                size="small"
                                value={batchModal.selectedLots[lot.id]}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => updateLotQuantity(lot.id, Number(e.target.value))}
                                min={0}
                                max={lot.cleanedQuantity ?? 0}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {filteredSeedWastageLots.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">
                        Seed Wastage Lots
                      </div>
                      {filteredSeedWastageLots.map((lot) => (
                        <div
                          key={`sw-${lot.id}`}
                          className={`flex items-center gap-3 p-3 rounded-lg border mb-2 cursor-pointer transition-all ${
                            batchModal.seedWastageLots[lot.id] !== undefined
                              ? 'border-amber-500 bg-amber-500/5'
                              : 'border-border hover:bg-muted/30'
                          }`}
                          onClick={() => toggleSeedWastageLotSelection(lot.id, lot)}
                        >
                          <div className="flex-1">
                            <div className="text-sm font-mono text-amber-600">{lot.lotNumber}</div>
                            <div className="text-xs text-muted-foreground">
                              Available: {lot.availableSeedWastage ?? 0} {lot.rawMaterial?.unitOfMeasurement}
                            </div>
                          </div>
                          {batchModal.seedWastageLots[lot.id] !== undefined && (
                            <div className="w-24">
                              <Input
                                type="number"
                                size="small"
                                value={batchModal.seedWastageLots[lot.id]}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => updateSeedWastageQuantity(lot.id, Number(e.target.value))}
                                min={0}
                                max={lot.availableSeedWastage ?? 0}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-sm font-semibold text-foreground pt-2 border-t border-border">
                    Total Selected: {totalSelectedQuantity}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between pt-3 border-t border-border">
            <Button
              disabled={batchModal.step === 0}
              onClick={handleBatchPrevStep}
            >
              Back
            </Button>
            <div className="flex gap-2">
              <Button onClick={closeBatchModal}>Cancel</Button>
              {batchModal.step < 2 ? (
                <Button
                  type="primary"
                  onClick={handleBatchNextStep}
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none' }}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="primary"
                  loading={batchModal.loading}
                  onClick={handleCreateBatch}
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', fontWeight: 600 }}
                >
                  Create Batch
                </Button>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Finish Processing Modal ── */}
      <Modal
        open={editStatusModal.visible}
        title={
          <div className="flex items-center gap-2">
            <CheckCircle className="text-emerald-500" size={18} />
            <span>Finish Processing</span>
          </div>
        }
        onCancel={() => setEditStatusModal((p) => ({ ...p, visible: false }))}
        footer={null}
        width={500}
      >
        <div className="space-y-4 mt-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1 font-medium">Input Quantity</div>
            <div className="text-sm font-semibold text-foreground">{inputQty} {editStatusModal.unit || ''}</div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-1 font-medium">Received Quantity *</div>
            <Input
              type="number"
              value={editStatusModal.receivedQuantity}
              onChange={(e) => setEditStatusModal((p) => ({ ...p, receivedQuantity: Number(e.target.value) }))}
              min={0}
              max={inputQty}
            />
          </div>

          {hasLoss && (
            <>
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                <div className="text-xs font-medium text-amber-600">Loss Detected: {lossQty} {editStatusModal.unit || ''}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1 font-medium">Reason for Loss *</div>
                <Input.TextArea
                  rows={2}
                  value={editStatusModal.reason}
                  onChange={(e) => setEditStatusModal((p) => ({ ...p, reason: e.target.value }))}
                  placeholder="Enter reason for the loss"
                />
              </div>
            </>
          )}

          <div>
            <div className="text-xs text-muted-foreground mb-1 font-medium">Target Warehouse *</div>
            <Select
              style={{ width: '100%' }}
              placeholder="Select warehouse"
              value={editStatusModal.warehouseId || undefined}
              onChange={(val) => setEditStatusModal((p) => ({ ...p, warehouseId: val }))}
            >
              {warehouses.map((w) => (
                <Option key={w.id} value={w.id}>{w.name}</Option>
              ))}
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button onClick={() => setEditStatusModal((p) => ({ ...p, visible: false }))}>Cancel</Button>
            <Button
              type="primary"
              loading={editStatusModal.loading}
              onClick={handleEditStatusSubmit}
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', fontWeight: 600 }}
            >
              <CheckCircle size={12} className="mr-1 inline" /> Complete Processing
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

export default ProcessingBatchesPage;
