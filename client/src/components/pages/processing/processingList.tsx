import React, { useEffect, useState, useMemo } from 'react';
import api, { API_ROUTES } from '../../../utils/api';
import { Button, Modal, Input, Select, message, Switch, Checkbox, Steps, Spin } from 'antd';
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
  ArrowRight,
  Eye,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Leaf,
} from 'lucide-react';
import UnitSelect from '../../ui/Unitselect';

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
  // Seed wastage info from backend
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
const ProcessingList: React.FC = () => {
  // ── Main data ──
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
    step: number; // 0 = select warehouse, 1 = select material, 2 = select lots
    warehouseId: string;
    rawMaterialId: string;
    selectedLots: Record<string, number>; // lotId -> allocatedQuantity
    seedWastageLots: Record<string, number>; // lotId -> seedWastageAllocated
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

  // ── Finish Modal (received quantity approach) ──
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
        // Use the authoritative cleanedQuantity from the database
        const netQty = lot.cleanedQuantity ?? 0;
        newSelected[lotId] = netQty;
        newSeedWastage[lotId] = 0; // default seed wastage allocation to 0
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

  // Filter available lots to match the selected warehouse
  const filteredLots = useMemo(() => {
    return availableLots.filter((lot) => lot.warehouseId === batchModal.warehouseId);
  }, [availableLots, batchModal.warehouseId]);

  // Filter seed wastage lots to match the selected warehouse
  const filteredSeedWastageLots = useMemo(() => {
    return availableSeedWastageLots.filter((lot) => lot.warehouseId === batchModal.warehouseId);
  }, [availableSeedWastageLots, batchModal.warehouseId]);

  // Unique materials from the available lots for the selected warehouse 
  const materialsInWarehouse = useMemo(() => {
    const materialIds = new Set<string>();
    const materials: RawMaterial[] = [];
    // From cleaned qty lots
    availableLots
      .filter((l) => l.warehouseId === batchModal.warehouseId)
      .forEach((lot) => {
        if (!materialIds.has(lot.rawMaterialId)) {
          materialIds.add(lot.rawMaterialId);
          materials.push(lot.rawMaterial);
        }
      });
    // From seed wastage lots
    availableSeedWastageLots
      .filter((l) => l.warehouseId === batchModal.warehouseId)
      .forEach((lot) => {
        if (!materialIds.has(lot.rawMaterialId)) {
          materialIds.add(lot.rawMaterialId);
          materials.push(lot.rawMaterial);
        }
      });
    // Also include from raw materials list
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

    // Merge both selections into a single lots array keyed by lotId
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
      receivedQuantity: job.quantityInput, // default to full qty (no loss)
      unit: job.inputRawMaterial?.unitOfMeasurement,
      reason: '',
      warehouseId: job.warehouse?.id || '',
      loading: false,
      isReusable: false,
    });
  };

  // Auto-computed loss
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

      // Only send by-product data if there is a loss
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
              <div className="p-2 bg-primary rounded-xl">
                <Layers className="text-primary-foreground" size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Processing Batches</h1>
                <p className="text-muted-foreground text-sm">
                  Create batches from cleaned lots and manage processing
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
                      {/* Expand */}
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
                      {/* Batch No */}
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-primary font-semibold">
                        {job.batchNumber || job.id}
                      </td>
                      {/* Material */}
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                        {job.inputRawMaterial?.name || '-'}
                        {job.inputRawMaterial?.skuCode && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({job.inputRawMaterial.skuCode})
                          </span>
                        )}
                      </td>
                      {/* Warehouse */}
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-foreground/80">
                        {job.warehouse?.name || '-'}
                      </td>
                      {/* Qty */}
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-foreground text-right font-semibold">
                        {job.quantityInput} {job.inputRawMaterial?.unitOfMeasurement || ''}
                      </td>
                      {/* Status */}
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
                      {/* Dates */}
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
                      {/* Action */}
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

                    {/* Expanded: show lot details with two collapsible sections */}
                    <AnimatePresence>
                      {expandedJobId === job.id && (
                        <motion.tr
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="bg-muted/30"
                        >
                          <td colSpan={8} className="px-6 py-4 space-y-3">
                            {/* ── Section 1: Cleaned Quantity Allocation ── */}
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
                                          No lot allocations found for this batch.
                                        </p>
                                      ) : (
                                        <div className="overflow-x-auto">
                                          <table className="min-w-full divide-y divide-border">
                                            <thead>
                                              <tr className="bg-muted/40">
                                                <th className="px-3 py-2 text-xs text-left font-semibold text-muted-foreground uppercase">
                                                  Cleaning Job
                                                </th>
                                                <th className="px-3 py-2 text-xs text-right font-semibold text-muted-foreground uppercase">
                                                  Cleaned Qty
                                                </th>
                                                <th className="px-3 py-2 text-xs text-right font-semibold text-muted-foreground uppercase">
                                                  Allocated Qty
                                                </th>
                                                <th className="px-3 py-2 text-xs text-center font-semibold text-muted-foreground uppercase">
                                                  Status
                                                </th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                              {job.processingBatchLots.map((bl) => {
                                                const lotStatus =
                                                  job.status === 'Finished' || job.status === 'Completed'
                                                    ? 'Finished'
                                                    : job.status === 'In-Progress'
                                                      ? 'In Processing'
                                                      : bl.cleaningLot?.status || 'Pending';

                                                const statusStyle =
                                                  lotStatus === 'Finished'
                                                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                                    : lotStatus === 'In Processing'
                                                      ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                                      : 'bg-primary/10 text-primary border-primary/20';

                                                const initialQty = bl.cleaningLot?.cleaningJob?.quantity || bl.cleaningLot?.quantity || 0;
                                                const wastages = (bl.cleaningLot?.cleaningJob?.stoneWastageQty || bl.cleaningLot?.stoneWastageQty || 0) +
                                                  (bl.cleaningLot?.cleaningJob?.seedWastageQty || bl.cleaningLot?.seedWastageQty || 0);
                                                const netQty = Math.max(0, initialQty - wastages);

                                                return (
                                                  <tr key={bl.id} className="hover:bg-accent/50 transition">
                                                    <td className="px-3 py-2 text-sm font-mono text-primary">
                                                      LOT-{bl.cleaningLot?.cleaningJob?.id || bl.cleaningLot?.cleaningJobId || '-'}
                                                    </td>
                                                    <td className="px-3 py-2 text-sm text-foreground text-right">
                                                      {netQty}{' '}
                                                      {job.inputRawMaterial?.unitOfMeasurement || ''}
                                                    </td>
                                                    <td className="px-3 py-2 text-sm font-semibold text-foreground text-right">
                                                      {bl.allocatedQuantity}{' '}
                                                      {job.inputRawMaterial?.unitOfMeasurement || ''}
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusStyle}`}>
                                                        {lotStatus === 'Finished' && <CheckCircle className="w-3 h-3 mr-1" />}
                                                        {lotStatus}
                                                      </span>
                                                    </td>
                                                  </tr>
                                                );
                                              })}
                                            </tbody>
                                          </table>
                                        </div>
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            {/* ── Section 2: Seed Wastage Allocation ── */}
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
                                      {(!job.processingBatchLots || job.processingBatchLots.length === 0) ? (
                                        <p className="text-sm text-muted-foreground italic">
                                          No lot allocations found for this batch.
                                        </p>
                                      ) : (() => {
                                        const lotsWithSeedWastage = job.processingBatchLots.filter(
                                          (bl) => (bl.seedWastageAllocated || 0) > 0
                                        );
                                        if (lotsWithSeedWastage.length === 0) {
                                          return (
                                            <p className="text-sm text-muted-foreground italic">
                                              No seed wastage was allocated for this batch.
                                            </p>
                                          );
                                        }
                                        return (
                                          <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-border">
                                              <thead>
                                                <tr className="bg-amber-500/5">
                                                  <th className="px-3 py-2 text-xs text-left font-semibold text-muted-foreground uppercase">
                                                    Lot
                                                  </th>
                                                  <th className="px-3 py-2 text-xs text-right font-semibold text-muted-foreground uppercase">
                                                    Total Seed Wastage
                                                  </th>
                                                  <th className="px-3 py-2 text-xs text-right font-semibold text-muted-foreground uppercase">
                                                    Allocated
                                                  </th>
                                                  <th className="px-3 py-2 text-xs text-right font-semibold text-muted-foreground uppercase">
                                                    Rest Wastage
                                                  </th>
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y divide-border">
                                                {lotsWithSeedWastage.map((bl) => {
                                                  const lotSeedWastage = bl.cleaningLot?.seedWastageQty || 0;
                                                  const allocated = bl.seedWastageAllocated || 0;
                                                  const rest = Math.max(0, lotSeedWastage - allocated);
                                                  const unit = job.inputRawMaterial?.unitOfMeasurement || 'kg';

                                                  return (
                                                    <tr key={bl.id} className="hover:bg-accent/50 transition">
                                                      <td className="px-3 py-2 text-sm font-mono text-amber-600">
                                                        LOT-{bl.cleaningLot?.cleaningJob?.id || bl.cleaningLot?.cleaningJobId || '-'}
                                                      </td>
                                                      <td className="px-3 py-2 text-sm text-foreground text-right">
                                                        {lotSeedWastage} {unit}
                                                      </td>
                                                      <td className="px-3 py-2 text-sm font-semibold text-amber-600 text-right">
                                                        {allocated} {unit}
                                                      </td>
                                                      <td className="px-3 py-2 text-sm text-foreground/70 text-right">
                                                        {rest} {unit}
                                                      </td>
                                                    </tr>
                                                  );
                                                })}
                                              </tbody>
                                            </table>
                                          </div>
                                        );
                                      })()}
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

          {/* Pagination Controls */}
          {!loading && processingJobs.length > 0 && (
            <div className="p-4 border-t border-border flex items-center justify-between bg-muted/20">
              <div className="text-sm text-muted-foreground">
                Showing <span className="font-medium text-foreground">{Math.min((currentPage - 1) * itemsPerPage + 1, processingJobs.length)}</span> to <span className="font-medium text-foreground">{Math.min(currentPage * itemsPerPage, processingJobs.length)}</span> of <span className="font-medium text-foreground">{processingJobs.length}</span> results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  icon={<ChevronLeft size={16} />}
                  className="flex items-center justify-center bg-card hover:bg-muted border-border"
                />
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, Math.ceil(processingJobs.length / itemsPerPage)) }, (_, i) => {
                    let pageNum;
                    const totalP = Math.ceil(processingJobs.length / itemsPerPage);
                    if (totalP <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalP - 2) {
                      pageNum = totalP - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 p-0 flex items-center justify-center ${currentPage === pageNum
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card hover:bg-muted border-border text-foreground'
                          }`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(processingJobs.length / itemsPerPage), p + 1))}
                  disabled={currentPage === Math.ceil(processingJobs.length / itemsPerPage)}
                  icon={<ChevronRight size={16} />}
                  className="flex items-center justify-center bg-card hover:bg-muted border-border"
                />
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* ─── CREATE BATCH MODAL ─── */}
      <Modal
        open={batchModal.visible}
        title={
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Layers className="text-white" size={16} />
            </div>
            <span className="text-lg font-semibold text-foreground">Create Processing Batch</span>
          </div>
        }
        onCancel={closeBatchModal}
        width={820}
        footer={null}
        className="rounded-xl"
      >
        {/* Steps indicator */}
        <Steps
          current={batchModal.step}
          size="small"
          className="mb-6"
          items={[
            { title: 'Warehouse' },
            { title: 'Material' },
            { title: 'Select Lots' },
          ]}
        />

        {/* Step 0: Select Warehouse */}
        {batchModal.step === 0 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="text-sm text-muted-foreground mb-3">
              Select the warehouse where the cleaned material is stored:
            </div>
            <Select
              style={{ width: '100%' }}
              size="large"
              placeholder="Choose warehouse..."
              value={batchModal.warehouseId || undefined}
              onChange={handleBatchWarehouseSelect}
            >
              {warehouses.map((w) => (
                <Option key={w.id} value={w.id}>
                  <div className="flex items-center gap-2">
                    <Warehouse className="w-4 h-4 text-primary" />
                    {w.name}
                  </div>
                </Option>
              ))}
            </Select>
            <div className="flex justify-end mt-6">
              <Button
                type="primary"
                onClick={handleBatchNextStep}
                disabled={!batchModal.warehouseId}
                style={{
                  background: batchModal.warehouseId ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : undefined,
                  border: 'none',
                }}
              >
                Next <ArrowRight className="w-4 h-4 ml-1 inline" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 1: Select Material */}
        {batchModal.step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="text-sm text-muted-foreground mb-3">
              Select the raw material to process:
            </div>
            <Select
              style={{ width: '100%' }}
              size="large"
              placeholder="Choose raw material..."
              value={batchModal.rawMaterialId || undefined}
              onChange={handleBatchMaterialSelect}
              showSearch
              filterOption={(input, option) =>
                (option?.children?.toString() || '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {materialsInWarehouse.map((rm) => (
                <Option key={rm.id} value={rm.id}>
                  {rm.name} ({rm.skuCode})
                </Option>
              ))}
            </Select>
            <div className="flex justify-between mt-6">
              <Button onClick={handleBatchPrevStep}>Back</Button>
              <Button
                type="primary"
                onClick={handleBatchNextStep}
                disabled={!batchModal.rawMaterialId}
                style={{
                  background: batchModal.rawMaterialId ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : undefined,
                  border: 'none',
                }}
              >
                Next <ArrowRight className="w-4 h-4 ml-1 inline" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Select Lots */}
        {batchModal.step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-muted-foreground">
                Allocate cleaned quantity and/or seed wastage from lots:
              </div>
              <div className="text-sm font-medium text-primary">
                Total: {totalSelectedQuantity}{' '}
                {rawMaterials.find((rm) => rm.id === batchModal.rawMaterialId)?.unitOfMeasurement || ''}
              </div>
            </div>

            <div className="space-y-4 max-h-[420px] overflow-y-auto">
              {/* ── Section A: Cleaned Quantity Allocation ── */}
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <button
                  type="button"
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => toggleSection('_modal', 'cleaned')}
                >
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    Cleaned Quantity Allocation
                    <span className="text-xs font-normal text-muted-foreground">
                      ({filteredLots.length} lot{filteredLots.length !== 1 ? 's' : ''} available)
                    </span>
                  </h4>
                  {(expandedSections['_modal']?.cleaned !== false) ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                <AnimatePresence>
                  {(expandedSections['_modal']?.cleaned !== false) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3">
                        {filteredLots.length === 0 ? (
                          <div className="text-center py-6 text-muted-foreground">
                            <Package className="mx-auto mb-2 opacity-40" size={24} />
                            <p className="text-sm">No lots with available cleaned quantity.</p>
                          </div>
                        ) : (
                          <div className="rounded-lg border border-border overflow-hidden">
                            <table className="min-w-full divide-y divide-border">
                              <thead className="bg-muted/70">
                                <tr>
                                  <th className="px-3 py-2 text-xs text-center font-semibold text-muted-foreground uppercase w-10">
                                    ✓
                                  </th>
                                  <th className="px-3 py-2 text-xs text-left font-semibold text-muted-foreground uppercase">
                                    Cleaning Job
                                  </th>
                                  <th className="px-3 py-2 text-xs text-left font-semibold text-muted-foreground uppercase">
                                    GRN
                                  </th>
                                  <th className="px-3 py-2 text-xs text-right font-semibold text-muted-foreground uppercase">
                                    Cleaned Qty
                                  </th>
                                  <th className="px-3 py-2 text-xs text-right font-semibold text-muted-foreground uppercase w-32">
                                    Allocate Qty
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border bg-card">
                                {filteredLots.map((lot) => {
                                  const isSelected = batchModal.selectedLots[lot.id] !== undefined;
                                  const netQty = lot.cleanedQuantity ?? 0;

                                  return (
                                    <tr
                                      key={lot.id}
                                      className={`transition-colors ${isSelected ? 'bg-primary/5' : 'hover:bg-accent/50'}`}
                                    >
                                      <td className="px-3 py-2 text-center">
                                        <Checkbox
                                          checked={isSelected}
                                          onChange={() => toggleLotSelection(lot.id, lot)}
                                        />
                                      </td>
                                      <td className="px-3 py-2 text-sm font-mono text-primary font-medium">
                                        LOT-{lot.cleaningJob?.id || lot.cleaningJobId}
                                      </td>
                                      <td className="px-3 py-2 text-sm text-foreground">
                                        {lot.grn?.grnNumber || '-'}
                                      </td>
                                      <td className="px-3 py-2 text-sm text-foreground text-right">
                                        {netQty}{' '}
                                        {lot.rawMaterial?.unitOfMeasurement || ''}
                                      </td>
                                      <td className="px-3 py-2 text-right">
                                        {isSelected ? (
                                          <Input
                                            type="number"
                                            min={0.01}
                                            max={netQty}
                                            step={0.01}
                                            value={batchModal.selectedLots[lot.id]}
                                            onChange={(e) => {
                                              const val = Number(e.target.value);
                                              updateLotQuantity(lot.id, Math.min(val, netQty));
                                            }}
                                            style={{ width: 110, textAlign: 'right' }}
                                            size="small"
                                          />
                                        ) : (
                                          <span className="text-muted-foreground text-sm">-</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Section B: Seed Wastage Allocation ── */}
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <button
                  type="button"
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => toggleSection('_modal', 'seedWastage')}
                >
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-amber-500" />
                    Seed Wastage Allocation
                    <span className="text-xs font-normal text-muted-foreground">
                      ({filteredSeedWastageLots.length} lot{filteredSeedWastageLots.length !== 1 ? 's' : ''} available)
                    </span>
                  </h4>
                  {(expandedSections['_modal']?.seedWastage !== false) ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                <AnimatePresence>
                  {(expandedSections['_modal']?.seedWastage !== false) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3">
                        {filteredSeedWastageLots.length === 0 ? (
                          <div className="text-center py-6 text-muted-foreground">
                            <Leaf className="mx-auto mb-2 opacity-40" size={24} />
                            <p className="text-sm">No lots with available seed wastage.</p>
                          </div>
                        ) : (
                          <div className="rounded-lg border border-border overflow-hidden">
                            <table className="min-w-full divide-y divide-border">
                              <thead className="bg-amber-500/5">
                                <tr>
                                  <th className="px-3 py-2 text-xs text-center font-semibold text-muted-foreground uppercase w-10">
                                    ✓
                                  </th>
                                  <th className="px-3 py-2 text-xs text-left font-semibold text-muted-foreground uppercase">
                                    Lot
                                  </th>
                                  <th className="px-3 py-2 text-xs text-left font-semibold text-muted-foreground uppercase">
                                    GRN
                                  </th>
                                  <th className="px-3 py-2 text-xs text-right font-semibold text-amber-600 uppercase">
                                    Available Wastage
                                  </th>
                                  <th className="px-3 py-2 text-xs text-right font-semibold text-amber-600 uppercase w-32">
                                    Allocate
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border bg-card">
                                {filteredSeedWastageLots.map((lot) => {
                                  const isSelected = batchModal.seedWastageLots[lot.id] !== undefined;
                                  const availableSeedWastage = lot.availableSeedWastage ?? 0;

                                  return (
                                    <tr
                                      key={lot.id}
                                      className={`transition-colors ${isSelected ? 'bg-amber-500/5' : 'hover:bg-accent/50'}`}
                                    >
                                      <td className="px-3 py-2 text-center">
                                        <Checkbox
                                          checked={isSelected}
                                          onChange={() => toggleSeedWastageLotSelection(lot.id, lot)}
                                        />
                                      </td>
                                      <td className="px-3 py-2 text-sm font-mono text-amber-600 font-medium">
                                        LOT-{lot.cleaningJob?.id || lot.cleaningJobId}
                                      </td>
                                      <td className="px-3 py-2 text-sm text-foreground">
                                        {lot.grn?.grnNumber || '-'}
                                      </td>
                                      <td className="px-3 py-2 text-sm text-amber-600 text-right font-medium">
                                        {availableSeedWastage}{' '}
                                        {lot.rawMaterial?.unitOfMeasurement || 'kg'}
                                      </td>
                                      <td className="px-3 py-2 text-right">
                                        {isSelected ? (
                                          <Input
                                            type="number"
                                            min={0.01}
                                            max={availableSeedWastage}
                                            step={0.01}
                                            value={batchModal.seedWastageLots[lot.id]}
                                            onChange={(e) => {
                                              const val = Number(e.target.value);
                                              updateSeedWastageQuantity(lot.id, Math.min(val, availableSeedWastage));
                                            }}
                                            style={{ width: 110, textAlign: 'right' }}
                                            size="small"
                                          />
                                        ) : (
                                          <span className="text-muted-foreground text-sm">-</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <Button onClick={handleBatchPrevStep}>Back</Button>
              <Button
                type="primary"
                onClick={handleCreateBatch}
                loading={batchModal.loading}
                disabled={Object.keys(batchModal.selectedLots).length === 0 && Object.keys(batchModal.seedWastageLots).length === 0}
                style={{
                  background: (Object.keys(batchModal.selectedLots).length > 0 || Object.keys(batchModal.seedWastageLots).length > 0)
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : undefined,
                  border: 'none',
                  fontWeight: 600,
                }}
              >
                <CheckCircle className="w-4 h-4 mr-1 inline" />
                Create Batch
              </Button>
            </div>
          </motion.div>
        )}
      </Modal>

      {/* ─── FINISH PROCESSING MODAL ─── */}
      <Modal
        open={editStatusModal.visible}
        title={
          <div className="flex items-center gap-2">
            <CheckCircle className="text-emerald-500" size={18} />
            <span>Finish Processing ─ {editStatusModal.job?.batchNumber || editStatusModal.job?.id}</span>
          </div>
        }
        onCancel={() =>
          setEditStatusModal({
            visible: false,
            job: undefined,
            receivedQuantity: 0,
            reason: '',
            warehouseId: '',
            loading: false,
          })
        }
        onOk={handleEditStatusSubmit}
        confirmLoading={editStatusModal.loading}
        okText="Finish"
        className="rounded-xl"
      >
        {/* Input Quantity Summary */}
        <div className="mb-4 rounded-lg border border-border bg-muted/40 p-3">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground font-medium">Input Quantity (sent for processing)</div>
            <div className="text-lg font-bold text-foreground">
              {inputQty} {editStatusModal.job?.inputRawMaterial?.unitOfMeasurement || ''}
            </div>
          </div>
        </div>

        {/* Received Quantity */}
        <div className="mb-4">
          <div className="text-xs text-muted-foreground mb-1 font-medium">
            Received Quantity (after processing)
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Input
              type="number"
              min={0}
              max={inputQty}
              step={0.01}
              value={editStatusModal.receivedQuantity}
              onChange={(e) =>
                setEditStatusModal((prev) => ({
                  ...prev,
                  receivedQuantity: Number(e.target.value),
                }))
              }
              placeholder="Enter received quantity"
              className="rounded"
              style={{ flex: 2 }}
            />
            <UnitSelect
              value={editStatusModal.unit}
              baseUnit={editStatusModal.job?.inputRawMaterial?.unitOfMeasurement}
              onChange={(val: string | number) =>
                setEditStatusModal((prev) => ({
                  ...prev,
                  unit: String(val),
                }))
              }
            />
          </div>
        </div>

        {/* Auto-calculated Loss/Waste indicator */}
        {hasLoss && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-lg border p-3"
            style={{
              borderColor: 'rgba(245, 158, 11, 0.3)',
              background: 'rgba(245, 158, 11, 0.06)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Loss / Waste Detected</span>
              </div>
              <span className="text-lg font-bold text-amber-600">
                {lossQty.toFixed(2)} {editStatusModal.job?.inputRawMaterial?.unitOfMeasurement || ''}
              </span>
            </div>
            <div className="text-xs text-amber-600/70">
              {((lossQty / inputQty) * 100).toFixed(1)}% of input quantity
            </div>
          </motion.div>
        )}

        {/* Reason - show only when there is a loss */}
        {hasLoss && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <div className="text-xs text-muted-foreground mb-1 font-medium">
              Reason for Loss <span className="text-red-500">*</span>
            </div>
            <Input
              value={editStatusModal.reason}
              onChange={(e) =>
                setEditStatusModal((prev) => ({
                  ...prev,
                  reason: e.target.value,
                }))
              }
              placeholder="Enter reason (e.g., moisture loss, breakage, spillage)"
              className="rounded"
            />
          </motion.div>
        )}

        {/* Reusable toggle - only if loss */}
        {hasLoss && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <div className="text-xs text-muted-foreground mb-1 font-medium">Is the lost/waste material reusable?</div>
            <Switch
              checked={editStatusModal.isReusable}
              onChange={(checked) =>
                setEditStatusModal((prev) => ({ ...prev, isReusable: checked }))
              }
              checkedChildren="Yes"
              unCheckedChildren="No"
            />
          </motion.div>
        )}

        {/* No loss - confirmation */}
        {!hasLoss && receivedQty > 0 && (
          <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="text-emerald-500" size={16} />
              <span className="text-sm font-medium text-emerald-600">
                No loss - full quantity received
              </span>
            </div>
          </div>
        )}

        {/* Warehouse */}
        <div>
          <div className="text-xs text-muted-foreground mb-1 font-medium">Warehouse</div>
          <Select
            style={{ width: '100%' }}
            placeholder="Select warehouse"
            value={editStatusModal.warehouseId || undefined}
            onChange={(val) =>
              setEditStatusModal((prev) => ({
                ...prev,
                warehouseId: val,
              }))
            }
            className="rounded"
          >
            {warehouses.map((w) => (
              <Option key={w.id} value={w.id}>
                {w.name}
              </Option>
            ))}
          </Select>
        </div>
      </Modal>
    </motion.div>
  );
};

export default ProcessingList;
