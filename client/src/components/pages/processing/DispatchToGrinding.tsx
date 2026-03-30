import React, { useEffect, useState, useMemo } from 'react';
import api, { API_ROUTES } from '../../../utils/api';
import { Button, Modal, Input, Select, message, Spin } from 'antd';
import { PlusOutlined, LoadingOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  CheckCircle,
  FileText,
  Boxes,
  Scale,
  Layers,
  Hash,
  CalendarDays,
  Eye,
  ChevronDown,
  Leaf,
  ArrowDownToLine,
  MapPin,
  Send,
  XCircle,
  Check,
  Download,
} from 'lucide-react';
import { generateGrindingDispatchPDF } from '../../../utils/exportPdf';

const { Option } = Select;
const { TextArea } = Input;

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

interface LocationType {
  id: string;
  code: string;
  name: string;
  type: string;
  enabled: boolean;
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
  cleanedQuantityUnit?: string;
  stoneWastageQty?: number;
  stoneWastageUnit?: string;
  seedWastageQty?: number;
  seedWastageUnit?: string;
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

interface DispatchLot {
  id: string;
  cleaningLotId: string;
  allocatedQuantity: number;
  seedWastageAllocated: number;
  cleaningLot: CleaningLot;
}

interface GrindingDispatch {
  id: string;
  batchNumber: string;
  inputRawMaterialId: string;
  fromLocationId: string;
  toLocationId: string;
  totalQuantity: number;
  status: 'SENT' | 'ACCEPTED' | 'REJECTED';
  sentAt: string;
  acceptedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  notes: string | null;
  createdAt: string;
  inputRawMaterial?: RawMaterial;
  fromLocation?: LocationType;
  toLocation?: LocationType;
  lots?: DispatchLot[];
}

/* ─── Component ─── */
const DispatchToGrinding: React.FC = () => {

  // ── Dispatch data ──
  const [dispatches, setDispatches] = useState<GrindingDispatch[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [locations, setLocations] = useState<LocationType[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [availableLots, setAvailableLots] = useState<CleaningLot[]>([]);
  const [availableSeedWastageLots, setAvailableSeedWastageLots] = useState<CleaningLot[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  const paginatedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return dispatches.slice(startIndex, startIndex + itemsPerPage);
  }, [dispatches, currentPage]);

  const [expandedSections, setExpandedSections] = useState<Record<string, { cleaned: boolean; seedWastage: boolean }>>({});

  // ── Create Batch Modal ──
  const [batchModal, setBatchModal] = useState<{
    visible: boolean;
    step: number;
    fromLocationId: string;
    toLocationId: string;
    rawMaterialId: string;
    selectedLots: Record<string, number>;
    seedWastageLots: Record<string, number>;
    notes: string;
    loading: boolean;
  }>({
    visible: false,
    step: 0,
    fromLocationId: '',
    toLocationId: '',
    rawMaterialId: '',
    selectedLots: {},
    seedWastageLots: {},
    notes: '',
    loading: false,
  });

  // ── View Detail Modal ──
  const [viewModal, setViewModal] = useState<{ visible: boolean; dispatch?: GrindingDispatch }>({
    visible: false,
    dispatch: undefined,
  });

  /* ─── Fetchers ─── */
  const fetchDispatches = async () => {
    setLoading(true);
    try {
      const res = await api.get(API_ROUTES.RAW.GET_GRINDING_DISPATCHES);
      setDispatches(res.data);
    } catch {
      message.error('Failed to fetch dispatches');
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

  const fetchLocations = async () => {
    try {
      const res = await api.get(API_ROUTES.RAW.GET_LOCATIONS);
      setLocations(res.data.filter((l: LocationType) => l.enabled));
    } catch {
      message.error('Failed to fetch locations');
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
    fetchDispatches();
    fetchWarehouses();
    fetchLocations();
    fetchRawMaterials();
  }, []);

  /* ─── Batch Modal Helpers ─── */
  const openBatchModal = () => {
    setBatchModal({
      visible: true, step: 0, fromLocationId: '', toLocationId: '',
      rawMaterialId: '',
      selectedLots: {}, seedWastageLots: {}, notes: '', loading: false,
    });
  };

  const closeBatchModal = () => {
    setBatchModal({
      visible: false, step: 0, fromLocationId: '', toLocationId: '',
      rawMaterialId: '',
      selectedLots: {}, seedWastageLots: {}, notes: '', loading: false,
    });
  };

  const handleBatchMaterialSelect = (rawMaterialId: string) => {
    setBatchModal((prev) => ({ ...prev, rawMaterialId, selectedLots: {}, seedWastageLots: {} }));
    fetchAvailableLots(undefined, rawMaterialId);
    fetchAvailableSeedWastageLots(undefined, rawMaterialId);
  };

  const handleBatchNextStep = () => {
    if (batchModal.step === 0) {
      if (!batchModal.fromLocationId || !batchModal.toLocationId) { message.error('Please select both From and To locations'); return; }
      if (batchModal.fromLocationId === batchModal.toLocationId) { message.error('From and To locations must be different'); return; }
      fetchAvailableLots();
      fetchAvailableSeedWastageLots();
    }
    if (batchModal.step === 1 && !batchModal.rawMaterialId) { message.error('Please select a raw material'); return; }
    if (batchModal.step === 1) {
      fetchAvailableLots(undefined, batchModal.rawMaterialId);
      fetchAvailableSeedWastageLots(undefined, batchModal.rawMaterialId);
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
        newSelected[lotId] = lot.cleanedQuantity ?? 0;
        newSeedWastage[lotId] = 0;
      }
      return { ...prev, selectedLots: newSelected, seedWastageLots: newSeedWastage };
    });
  };

  const updateLotQuantity = (lotId: string, qty: number) => {
    const lot = availableLots.find(l => l.id === lotId);
    const maxQty = lot?.cleanedQuantity ?? 0;
    const clampedQty = Math.min(Math.max(0, qty), maxQty);
    setBatchModal((prev) => ({ ...prev, selectedLots: { ...prev.selectedLots, [lotId]: clampedQty } }));
  };

  const updateSeedWastageQuantity = (lotId: string, qty: number) => {
    const lot = availableSeedWastageLots.find(l => l.id === lotId);
    const maxQty = lot?.availableSeedWastage ?? 0;
    const clampedQty = Math.min(Math.max(0, qty), maxQty);
    setBatchModal((prev) => ({ ...prev, seedWastageLots: { ...prev.seedWastageLots, [lotId]: clampedQty } }));
  };

  const toggleSeedWastageLotSelection = (lotId: string, lot: CleaningLot) => {
    setBatchModal((prev) => {
      const newSeedWastage = { ...prev.seedWastageLots };
      if (newSeedWastage[lotId] !== undefined) { delete newSeedWastage[lotId]; }
      else { newSeedWastage[lotId] = lot.availableSeedWastage ?? 0; }
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
    const UNIT_TO_GRAMS: Record<string, number> = {
      kg: 1000, KG: 1000, gram: 1, g: 1, G: 1,
      ton: 1_000_000, Ton: 1_000_000, TON: 1_000_000, tonne: 1_000_000,
      quintal: 100_000, Quintal: 100_000, lb: 453.592, oz: 28.3495,
    };
    const toGrams = (qty: number, unit: string) => qty * (UNIT_TO_GRAMS[unit] ?? UNIT_TO_GRAMS[unit.toLowerCase()] ?? 1);
    const fromGrams = (grams: number, unit: string) => grams / (UNIT_TO_GRAMS[unit] ?? UNIT_TO_GRAMS[unit.toLowerCase()] ?? 1);

    const targetUnit = availableLots[0]?.rawMaterial?.unitOfMeasurement || availableSeedWastageLots[0]?.rawMaterial?.unitOfMeasurement || 'KG';

    let totalGrams = 0;
    Object.entries(batchModal.selectedLots).forEach(([lotId, qty]) => {
      const lot = availableLots.find(l => l.id === lotId);
      if (lot) totalGrams += toGrams(qty, lot.cleanedQuantityUnit || 'KG');
    });

    Object.entries(batchModal.seedWastageLots).forEach(([lotId, qty]) => {
      const lot = availableSeedWastageLots.find(l => l.id === lotId);
      if (lot) totalGrams += toGrams(qty, lot.seedWastageUnit || 'KG');
    });

    return Number(fromGrams(totalGrams, targetUnit).toFixed(3));
  }, [batchModal.selectedLots, batchModal.seedWastageLots, availableLots, availableSeedWastageLots]);

  const filteredLots = availableLots;
  const filteredSeedWastageLots = availableSeedWastageLots;

  const availableMaterials = useMemo(() => {
    const materialIds = new Set<string>();
    const materials: RawMaterial[] = [];
    [...availableLots, ...availableSeedWastageLots]
      .forEach((lot) => {
        if (!materialIds.has(lot.rawMaterialId)) { materialIds.add(lot.rawMaterialId); materials.push(lot.rawMaterial); }
      });
    rawMaterials.forEach((rm) => {
      if (!materialIds.has(rm.id)) { materialIds.add(rm.id); materials.push(rm); }
    });
    return materials;
  }, [availableLots, availableSeedWastageLots, rawMaterials]);

  /* ─── Submit Create Dispatch ─── */
  const handleCreateBatch = async () => {
    const cleanedEntries = Object.entries(batchModal.selectedLots);
    const seedWastageEntries = Object.entries(batchModal.seedWastageLots);
    if (cleanedEntries.length === 0 && seedWastageEntries.length === 0) {
      message.error('Select at least one lot'); return;
    }
    // Validate quantities don't exceed available
    for (const [lotId, qty] of cleanedEntries) {
      const lot = availableLots.find(l => l.id === lotId);
      if (lot && qty > (lot.cleanedQuantity ?? 0)) {
        message.error(`Quantity for ${lot.cleaningJobId ? `LOT-${lot.cleaningJobId}` : lot.lotNumber} exceeds available (${lot.cleanedQuantity})`);
        return;
      }
      if (qty <= 0) {
        message.error(`Quantity must be greater than 0 for ${lot?.cleaningJobId ? `LOT-${lot.cleaningJobId}` : lot?.lotNumber || lotId}`);
        return;
      }
    }
    for (const [lotId, qty] of seedWastageEntries) {
      if (qty > 0) {
        const lot = availableSeedWastageLots.find(l => l.id === lotId);
        if (lot && qty > (lot.availableSeedWastage ?? 0)) {
          message.error(`Seed wastage for ${lot.cleaningJobId ? `LOT-${lot.cleaningJobId}` : lot.lotNumber} exceeds available (${lot.availableSeedWastage})`);
          return;
        }
      }
    }
    const lotsMap = new Map<string, { lotId: string; allocatedQuantity: number; seedWastageAllocated: number }>();
    for (const [lotId, qty] of cleanedEntries) lotsMap.set(lotId, { lotId, allocatedQuantity: qty, seedWastageAllocated: 0 });
    for (const [lotId, qty] of seedWastageEntries) {
      if (qty > 0) {
        const existing = lotsMap.get(lotId);
        if (existing) existing.seedWastageAllocated = qty;
        else lotsMap.set(lotId, { lotId, allocatedQuantity: 0, seedWastageAllocated: qty });
      }
    }
    setBatchModal((prev) => ({ ...prev, loading: true }));
    try {
      await api.post(API_ROUTES.RAW.CREATE_GRINDING_DISPATCH, {
        fromLocationId: batchModal.fromLocationId,
        toLocationId: batchModal.toLocationId,
        inputRawMaterialId: batchModal.rawMaterialId,
        lots: Array.from(lotsMap.values()),
        notes: batchModal.notes || undefined,
      });
      message.success('Dispatch created successfully! Status: SENT');
      closeBatchModal();
      fetchDispatches();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to create dispatch');
      setBatchModal((prev) => ({ ...prev, loading: false }));
    }
  };

  /* ─── View / Download PDF ─── */
  const handleViewDispatch = (dispatch: GrindingDispatch) => {
    setViewModal({ visible: true, dispatch });
  };

  const handleDownloadPDF = (dispatch: GrindingDispatch) => {
    generateGrindingDispatchPDF({
      batchNumber: dispatch.batchNumber,
      rawMaterialName: dispatch.inputRawMaterial?.name || '-',
      skuCode: dispatch.inputRawMaterial?.skuCode || '-',
      unit: dispatch.inputRawMaterial?.unitOfMeasurement || '',
      fromLocation: dispatch.fromLocation?.name || '-',
      toLocation: dispatch.toLocation?.name || '-',
      totalQuantity: dispatch.totalQuantity,
      status: dispatch.status,
      sentAt: dispatch.sentAt,
      acceptedAt: dispatch.acceptedAt ? dispatch.acceptedAt : undefined,
      rejectedAt: dispatch.rejectedAt ? dispatch.rejectedAt : undefined,
      rejectionReason: dispatch.rejectionReason ? dispatch.rejectionReason : undefined,
      notes: dispatch.notes ? dispatch.notes : undefined,
      lots: (dispatch.lots || []).filter(l => l.allocatedQuantity > 0 || l.seedWastageAllocated > 0).map(l => ({
        lotId: l.cleaningLot?.cleaningJobId ? `LOT-${l.cleaningLot.cleaningJobId}` : (l.cleaningLot?.lotNumber || l.cleaningLotId),
        material: l.cleaningLot?.rawMaterial?.name || '-',
        cleanedQty: l.cleaningLot?.cleanedQuantity ?? 0,
        allocatedQty: l.allocatedQuantity,
        seedWastage: l.seedWastageAllocated ?? 0,
        unit: l.cleaningLot?.cleanedQuantityUnit || l.cleaningLot?.rawMaterial?.unitOfMeasurement || '',
        seedWastageUnit: l.cleaningLot?.seedWastageUnit || l.cleaningLot?.rawMaterial?.unitOfMeasurement || '',
      })),
    });
  };

  /* ─── Stats ─── */
  const totalBatches = dispatches.length;
  const sentBatches = dispatches.filter((d) => d.status === 'SENT').length;
  const acceptedBatches = dispatches.filter((d) => d.status === 'ACCEPTED').length;
  const rejectedBatches = dispatches.filter((d) => d.status === 'REJECTED').length;

  /* ─── Status badge helper ─── */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-blue-500/10 text-blue-600 border-blue-500/20">
            <Send className="w-3 h-3 mr-1" /> Sent
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
            <CheckCircle className="w-3 h-3 mr-1" /> Accepted
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-red-500/10 text-red-600 border-red-500/20">
            <XCircle className="w-3 h-3 mr-1" /> Rejected
          </span>
        );
      default:
        return <span className="text-xs text-muted-foreground">{status}</span>;
    }
  };



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
              <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                <ArrowDownToLine className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Dispatch to Grinding</h1>
                <p className="text-muted-foreground text-sm">
                  Create and manage material dispatches to grinding unit
                </p>
              </div>
              <div className="ml-auto flex gap-2">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={openBatchModal}
                  className="rounded-lg"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', border: 'none', fontWeight: 600 }}
                >
                  Create Dispatch
                </Button>
              </div>
            </div>
          </div>

          {/* ═══ Stats Row ═══ */}
          <>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-muted/50">
                <div className="bg-card rounded-xl p-4 border border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Total Dispatches</p>
                  <p className="text-2xl font-bold text-foreground">{totalBatches}</p>
                  <div className="flex items-center mt-1">
                    <Boxes size={12} className="text-primary mr-1" />
                    <span className="text-xs text-primary font-medium">All records</span>
                  </div>
                </div>
                <div className="bg-card rounded-xl p-4 border border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Sent</p>
                  <p className="text-2xl font-bold text-foreground">{sentBatches}</p>
                  <div className="flex items-center mt-1">
                    <Send size={12} className="text-blue-500 mr-1" />
                    <span className="text-xs text-blue-500 font-medium">Awaiting approval</span>
                  </div>
                </div>
                <div className="bg-card rounded-xl p-4 border border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Accepted</p>
                  <p className="text-2xl font-bold text-foreground">{acceptedBatches}</p>
                  <div className="flex items-center mt-1">
                    <CheckCircle size={12} className="text-emerald-500 mr-1" />
                    <span className="text-xs text-emerald-500 font-medium">Ready for production</span>
                  </div>
                </div>
                <div className="bg-card rounded-xl p-4 border border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Rejected</p>
                  <p className="text-2xl font-bold text-foreground">{rejectedBatches}</p>
                  <div className="flex items-center mt-1">
                    <XCircle size={12} className="text-red-500 mr-1" />
                    <span className="text-xs text-red-500 font-medium">Returned</span>
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
                        <div className="inline-flex items-center gap-2"><Hash className="w-3.5 h-3.5" /> Batch No.</div>
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <div className="inline-flex items-center gap-2"><Package className="w-3.5 h-3.5" /> Raw Material</div>
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <div className="inline-flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> From → To</div>
                      </th>
                      <th className="px-4 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <div className="inline-flex items-center gap-2"><Scale className="w-3.5 h-3.5" /> Total Qty</div>
                      </th>
                      <th className="px-4 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="px-4 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <div className="inline-flex items-center gap-2"><CalendarDays className="w-3.5 h-3.5" /> Sent / Updated</div>
                      </th>
                      <th className="px-4 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {loading && (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                          <Spin indicator={<LoadingOutlined style={{ fontSize: 36, color: '#6366f1' }} spin />} />
                          <p className="text-lg font-medium mt-4">Loading dispatches...</p>
                        </td>
                      </tr>
                    )}
                    {!loading && dispatches.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                          <Boxes className="mx-auto mb-3 opacity-40" size={36} />
                          <p className="text-lg font-medium">No dispatches yet</p>
                          <p className="text-sm">Click "Create Dispatch" to start.</p>
                        </td>
                      </tr>
                    )}
                    {!loading && paginatedJobs.map((dispatch, index) => (
                      <React.Fragment key={dispatch.id}>
                        <motion.tr
                          className="hover:bg-muted/50 transition-colors duration-150"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.04 }}
                        >
                          <td className="px-2 py-4 text-center">
                            <Button type="text" size="small"
                              icon={expandedJobId === dispatch.id ? <ChevronDown className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              onClick={() => setExpandedJobId(expandedJobId === dispatch.id ? null : dispatch.id)}
                            />
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-primary font-semibold">
                            {dispatch.batchNumber}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                            {dispatch.inputRawMaterial?.name || '-'}
                            {dispatch.inputRawMaterial?.skuCode && (
                              <span className="ml-1 text-xs text-muted-foreground">({dispatch.inputRawMaterial.skuCode})</span>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-foreground/80">
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-medium">{dispatch.fromLocation?.name || '-'}</span>
                              <span className="text-muted-foreground">→</span>
                              <span className="text-xs font-medium">{dispatch.toLocation?.name || '-'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-foreground text-right font-semibold">
                            {dispatch.totalQuantity} {dispatch.inputRawMaterial?.unitOfMeasurement || ''}
                          </td>
                          <td className="px-4 py-4 text-center">
                            {getStatusBadge(dispatch.status)}
                          </td>
                          <td className="px-4 py-4 text-center text-xs text-foreground/70">
                            <div>{dispatch.sentAt && !isNaN(Date.parse(dispatch.sentAt)) ? new Date(dispatch.sentAt).toLocaleString() : '-'}</div>
                            {dispatch.acceptedAt && !isNaN(Date.parse(dispatch.acceptedAt)) && (
                              <div className="text-emerald-500 mt-0.5">✓ {new Date(dispatch.acceptedAt).toLocaleString()}</div>
                            )}
                            {dispatch.rejectedAt && !isNaN(Date.parse(dispatch.rejectedAt)) && (
                              <div className="text-red-500 mt-0.5">✗ {new Date(dispatch.rejectedAt).toLocaleString()}</div>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex gap-1 justify-center">
                              <Button type="text" size="small"
                                icon={<Eye className="w-3.5 h-3.5" />}
                                onClick={() => handleViewDispatch(dispatch)}
                                className="rounded-lg text-primary hover:bg-primary/10"
                                title="View Details"
                              >View</Button>
                              <Button type="text" size="small"
                                icon={<Download className="w-3.5 h-3.5" />}
                                onClick={() => handleDownloadPDF(dispatch)}
                                className="rounded-lg text-emerald-600 hover:bg-emerald-500/10"
                                title="Download PDF"
                              >PDF</Button>
                            </div>
                            {dispatch.status === 'REJECTED' && dispatch.rejectionReason && (
                              <span className="text-xs text-red-500 italic block mt-1" title={dispatch.rejectionReason}>
                                {dispatch.rejectionReason.length > 20 ? dispatch.rejectionReason.slice(0, 20) + '…' : dispatch.rejectionReason}
                              </span>
                            )}
                          </td>
                        </motion.tr>

                        {/* Expanded row */}
                        <AnimatePresence>
                          {expandedJobId === dispatch.id && (
                            <motion.tr initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-muted/30">
                              <td colSpan={8} className="px-6 py-4 space-y-3">

                                {/* Transfer Info */}
                                <div className="rounded-xl border border-border bg-card p-4 flex flex-wrap gap-6">
                                  <div>
                                    <div className="text-xs text-muted-foreground font-medium">From Location</div>
                                    <div className="text-sm font-semibold text-foreground flex items-center gap-1 mt-1">
                                      <MapPin className="w-3.5 h-3.5 text-primary" />
                                      {dispatch.fromLocation?.name || '-'}
                                      <span className="text-xs text-muted-foreground ml-1">({dispatch.fromLocation?.code})</span>
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-muted-foreground font-medium">To Location</div>
                                    <div className="text-sm font-semibold text-foreground flex items-center gap-1 mt-1">
                                      <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                                      {dispatch.toLocation?.name || '-'}
                                      <span className="text-xs text-muted-foreground ml-1">({dispatch.toLocation?.code})</span>
                                    </div>
                                  </div>
                                  {dispatch.notes && (
                                    <div>
                                      <div className="text-xs text-muted-foreground font-medium">Notes</div>
                                      <div className="text-sm text-foreground/80 mt-1">{dispatch.notes}</div>
                                    </div>
                                  )}
                                  {dispatch.rejectionReason && (
                                    <div>
                                      <div className="text-xs text-red-500 font-medium">Rejection Reason</div>
                                      <div className="text-sm text-red-600 mt-1">{dispatch.rejectionReason}</div>
                                    </div>
                                  )}
                                </div>

                                {/* Lot Allocation Table */}
                                  {dispatch.lots && dispatch.lots.filter(l => l.allocatedQuantity > 0 || l.seedWastageAllocated > 0).length > 0 && (
                                    <div className="rounded-xl border border-border bg-card overflow-hidden">
                                      <div className="p-3 border-b border-border">
                                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                          <Layers className="w-4 h-4 text-primary" /> Lot Allocation
                                        </h4>
                                      </div>
                                      <table className="min-w-full">
                                        <thead><tr className="bg-muted/40">
                                          <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Lot</th>
                                          <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Material</th>
                                          <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">Allocated</th>
                                          <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">Seed Wastage</th>
                                        </tr></thead>
                                        <tbody className="divide-y divide-border">
                                          {dispatch.lots.filter(bl => bl.allocatedQuantity > 0 || bl.seedWastageAllocated > 0).map(bl => (
                                            <tr key={bl.id} className="hover:bg-muted/30">
                                              <td className="px-3 py-2 text-sm font-mono text-primary">{bl.cleaningLot?.cleaningJobId ? `LOT-${bl.cleaningLot.cleaningJobId}` : (bl.cleaningLot?.lotNumber || bl.cleaningLotId)}</td>
                                              <td className="px-3 py-2 text-sm text-foreground">{bl.cleaningLot?.rawMaterial?.name || '-'}</td>
                                              <td className="px-3 py-2 text-sm text-right font-semibold text-foreground">{bl.allocatedQuantity} {bl.cleaningLot?.cleanedQuantityUnit || bl.cleaningLot?.rawMaterial?.unitOfMeasurement || ''}</td>
                                              <td className="px-3 py-2 text-sm text-right text-amber-600">{bl.seedWastageAllocated > 0 ? `${bl.seedWastageAllocated} ${bl.cleaningLot?.seedWastageUnit || bl.cleaningLot?.rawMaterial?.unitOfMeasurement || ''}` : '-'}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
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
              {dispatches.length > itemsPerPage && (
                <div className="flex items-center justify-between p-4 border-t border-border">
                  <span className="text-xs text-muted-foreground">
                    Page {currentPage} of {Math.ceil(dispatches.length / itemsPerPage)} · {dispatches.length} total
                  </span>
                  <div className="flex gap-2">
                    <Button size="small" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>Previous</Button>
                    <Button size="small" disabled={currentPage >= Math.ceil(dispatches.length / itemsPerPage)} onClick={() => setCurrentPage((p) => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </>
        </motion.div>
      </div>

      {/* ── Create Dispatch Modal ── */}
      <Modal
        open={batchModal.visible}
        title={
          <div className="flex items-center gap-3 py-2">
            <div className="p-2.5 rounded-xl shadow-sm" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Send className="text-white" size={18} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Create Grinding Dispatch</h2>
              <p className="text-xs text-muted-foreground font-normal">Transfer cleaned raw material to grinding unit</p>
            </div>
          </div>
        }
        onCancel={closeBatchModal}
        width={850}
        footer={null}
        centered
        className="rounded-xl overflow-hidden"
      >
        <div className="space-y-6 mt-4">
          {/* Step indicator */}
          <div className="flex items-center justify-center mb-8 bg-muted/20 p-4 rounded-xl border border-border/50">
            {['Locations', 'Material', 'Select Lots'].map((label, idx) => (
              <React.Fragment key={label}>
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-all duration-300 ${
                    batchModal.step >= idx 
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white scale-110 shadow-indigo-200' 
                      : 'bg-white border-2 border-muted text-muted-foreground'
                  }`}>
                    {batchModal.step > idx ? <Check size={16} /> : idx + 1}
                  </div>
                  <span className={`text-xs font-semibold tracking-wide uppercase ${batchModal.step >= idx ? 'text-indigo-600' : 'text-muted-foreground'}`}>
                    {label}
                  </span>
                </div>
                {idx < 2 && (
                  <div className={`w-24 h-1 mx-4 rounded-full transition-all duration-300 ${
                    batchModal.step > idx ? 'bg-indigo-500' : 'bg-muted'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step 0: From/To Location */}
          {batchModal.step === 0 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-xl border bg-gradient-to-b from-white to-gray-50/50 shadow-sm transition-hover hover:border-indigo-300 hover:shadow-md">
                  <div className="flex items-center gap-2 text-sm text-indigo-700 mb-3 font-semibold pb-2 border-b border-indigo-100">
                    <div className="p-1.5 bg-indigo-100 rounded-md"><MapPin className="w-4 h-4 text-indigo-600" /></div>
                    From Location (Source)
                  </div>
                  <Select style={{ width: '100%' }} placeholder="Select source location" size="large" value={batchModal.fromLocationId || undefined}
                    onChange={(val) => setBatchModal((prev) => ({ ...prev, fromLocationId: val }))}
                    bordered={false} className="bg-white border border-gray-200 rounded-lg shadow-inner-sm"
                    showSearch filterOption={(input, option) => (option?.children?.toString() || '').toLowerCase().includes(input.toLowerCase())}
                  >
                    {locations.map((l) => <Option key={l.id} value={l.id}>{l.name} ({l.code}) - {l.type}</Option>)}
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2 px-1">Where the cleaned materials currently reside.</p>
                </div>
                
                <div className="p-5 rounded-xl border bg-gradient-to-b from-white to-emerald-50/30 shadow-sm transition-hover hover:border-emerald-300 hover:shadow-md">
                  <div className="flex items-center gap-2 text-sm text-emerald-700 mb-3 font-semibold pb-2 border-b border-emerald-100">
                    <div className="p-1.5 bg-emerald-100 rounded-md"><ArrowDownToLine className="w-4 h-4 text-emerald-600" /></div>
                    To Location (Destination)
                  </div>
                  <Select style={{ width: '100%' }} placeholder="Select destination location" size="large" value={batchModal.toLocationId || undefined}
                    onChange={(val) => setBatchModal((prev) => ({ ...prev, toLocationId: val }))}
                    bordered={false} className="bg-white border border-gray-200 rounded-lg shadow-inner-sm"
                    showSearch filterOption={(input, option) => (option?.children?.toString() || '').toLowerCase().includes(input.toLowerCase())}
                  >
                    {locations.filter(l => l.id !== batchModal.fromLocationId).map((l) => <Option key={l.id} value={l.id}>{l.name} ({l.code}) - {l.type}</Option>)}
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2 px-1">The grinding unit or processing area destination.</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 1: Material */}
          {batchModal.step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="py-4">
              <div className="max-w-md mx-auto p-6 rounded-2xl border bg-card shadow-sm">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-blue-100 rounded-2xl text-blue-600">
                    <Package size={28} />
                  </div>
                </div>
                <div className="text-center mb-5">
                  <h3 className="text-lg font-semibold text-foreground">Select Raw Material</h3>
                  <p className="text-sm text-muted-foreground mt-1">Choose the material to dispatch</p>
                </div>
                <Select style={{ width: '100%' }} placeholder="Choose raw material" size="large" value={batchModal.rawMaterialId || undefined}
                  onChange={handleBatchMaterialSelect} showSearch bordered={false} className="bg-muted/30 border border-border rounded-lg"
                  filterOption={(input, option) => (option?.children?.toString() || '').toLowerCase().includes(input.toLowerCase())}>
                  {availableMaterials.map((m) => <Option key={m.id} value={m.id}>{m.name} <span className="text-muted-foreground ml-1">({m.skuCode})</span></Option>)}
                </Select>
              </div>
            </motion.div>
          )}

          {/* Step 2: Lots */}
          {batchModal.step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              {filteredLots.length === 0 && filteredSeedWastageLots.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-xl border border-dashed border-border bg-muted/10">
                  <Boxes className="mx-auto mb-3 text-muted-foreground/50" size={48} />
                  <h3 className="text-base font-semibold text-foreground">No Available Lots</h3>
                  <p className="text-sm text-muted-foreground mt-1">There are no cleaned lots available for the selected material at this location.</p>
                </div>
              ) : (
                <>
                  <div className="bg-muted/20 p-3 rounded-xl flex items-center justify-between border border-border/50">
                    <div className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                       <Scale className="w-4 h-4" /> Selected Quantity:
                    </div>
                    <div className="text-lg font-bold text-indigo-600 bg-white px-4 py-1 rounded-lg border shadow-sm">
                      {totalSelectedQuantity.toLocaleString()} {filteredLots[0]?.rawMaterial?.unitOfMeasurement || filteredSeedWastageLots[0]?.rawMaterial?.unitOfMeasurement || ''}
                    </div>
                  </div>

                  <div className="max-h-[350px] overflow-y-auto pr-2 custom-scrollbar space-y-6">
                    {filteredLots.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Layers className="w-4 h-4 text-primary" />
                          <h4 className="text-sm font-bold text-primary tracking-wide">CLEANED LOTS</h4>
                          <div className="h-px bg-border flex-1 ml-2"></div>
                        </div>
                        <div className="flex flex-col gap-3">
                          {filteredLots.map((lot) => (
                            <div key={lot.id}
                              className={`flex flex-col rounded-xl border transition-all duration-200 overflow-hidden ${
                                batchModal.selectedLots[lot.id] !== undefined 
                                  ? 'border-primary ring-1 ring-primary/20 bg-primary/[0.02] shadow-sm' 
                                  : 'border-border bg-card hover:border-primary/40 hover:shadow-sm'
                              }`}
                            >
                              <div 
                                className="flex items-center justify-between p-4 cursor-pointer"
                                onClick={() => toggleLotSelection(lot.id, lot)}
                              >
                                <div className="flex items-center gap-4 flex-1 pr-4">
                                  <div className={`w-5 h-5 flex-shrink-0 rounded-full border flex items-center justify-center transition-colors ${
                                    batchModal.selectedLots[lot.id] !== undefined ? 'bg-primary border-primary text-white' : 'border-gray-300 bg-white'
                                  }`}>
                                    {batchModal.selectedLots[lot.id] !== undefined && <Check size={12} strokeWidth={3} />}
                                  </div>
                                  <div className="flex-1">
                                    <div className="text-sm font-bold text-gray-800 break-words leading-tight">
                                      {lot.cleaningJobId ? `LOT-${lot.cleaningJobId}` : lot.lotNumber}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="text-right flex-shrink-0">
                                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1">Available Qty</div>
                                  <div className="text-sm font-medium bg-muted/40 px-3 py-1 rounded-lg border border-border/50">
                                    {lot.cleanedQuantity ?? 0} {lot.cleanedQuantityUnit || lot.rawMaterial?.unitOfMeasurement || ''}
                                  </div>
                                </div>
                              </div>
                              
                              <AnimatePresence>
                                {batchModal.selectedLots[lot.id] !== undefined && (
                                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                                    <div className="px-4 pb-4 pt-3 border-t border-primary/10 bg-primary/5">
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-primary">Quantity to Allocate:</span>
                                        <div className="w-32">
                                          <Input type="number" size="large" value={batchModal.selectedLots[lot.id]}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) => updateLotQuantity(lot.id, Number(e.target.value))}
                                            min={0} max={lot.cleanedQuantity ?? 0}
                                            status={batchModal.selectedLots[lot.id] > (lot.cleanedQuantity ?? 0) ? 'error' : undefined}
                                            className="font-bold text-center text-primary shadow-inner-sm bg-white" />
                                        </div>
                                      </div>
                                      {batchModal.selectedLots[lot.id] > (lot.cleanedQuantity ?? 0) && (
                                        <div className="mt-2 text-xs text-red-500 font-medium flex items-center gap-1">
                                          <XCircle size={12} />
                                          Cannot exceed available: {lot.cleanedQuantity ?? 0} {lot.cleanedQuantityUnit || lot.rawMaterial?.unitOfMeasurement || ''}
                                        </div>
                                      )}
                                      <div className="mt-1 text-[11px] text-muted-foreground">
                                        Max: {lot.cleanedQuantity ?? 0} {lot.cleanedQuantityUnit || lot.rawMaterial?.unitOfMeasurement || ''}
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {filteredSeedWastageLots.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Leaf className="w-4 h-4 text-amber-500" />
                          <h4 className="text-sm font-bold text-amber-600 tracking-wide">SEED WASTAGE LOTS</h4>
                          <div className="h-px bg-border flex-1 ml-2"></div>
                        </div>
                        <div className="flex flex-col gap-3">
                          {filteredSeedWastageLots.map((lot) => (
                            <div key={`sw-${lot.id}`}
                              className={`flex flex-col rounded-xl border transition-all duration-200 overflow-hidden ${
                                batchModal.seedWastageLots[lot.id] !== undefined 
                                  ? 'border-amber-500 ring-1 ring-amber-500/20 bg-amber-500/[0.02] shadow-sm' 
                                  : 'border-border bg-card hover:border-amber-500/40 hover:shadow-sm'
                              }`}
                            >
                              <div 
                                className="flex items-center justify-between p-4 cursor-pointer"
                                onClick={() => toggleSeedWastageLotSelection(lot.id, lot)}
                              >
                                <div className="flex items-center gap-4 flex-1 pr-4">
                                  <div className={`w-5 h-5 flex-shrink-0 rounded-full border flex items-center justify-center transition-colors ${
                                    batchModal.seedWastageLots[lot.id] !== undefined ? 'bg-amber-500 border-amber-500 text-white' : 'border-gray-300 bg-white'
                                  }`}>
                                    {batchModal.seedWastageLots[lot.id] !== undefined && <Check size={12} strokeWidth={3} />}
                                  </div>
                                  <div className="flex-1">
                                    <div className="text-sm font-bold text-gray-800 break-words leading-tight">
                                      {lot.cleaningJobId ? `LOT-${lot.cleaningJobId}` : lot.lotNumber}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="text-right flex-shrink-0">
                                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1">Available Qty</div>
                                  <div className="text-sm font-medium bg-amber-50 px-3 py-1 rounded-lg border border-amber-100 text-amber-700">
                                    {lot.availableSeedWastage ?? 0} {lot.seedWastageUnit || lot.rawMaterial?.unitOfMeasurement || ''}
                                  </div>
                                </div>
                              </div>
                              
                              <AnimatePresence>
                                {batchModal.seedWastageLots[lot.id] !== undefined && (
                                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                                    <div className="px-4 pb-4 pt-3 border-t border-amber-500/10 bg-amber-50">
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-amber-700">Quantity to Allocate:</span>
                                        <div className="w-32">
                                          <Input type="number" size="large" value={batchModal.seedWastageLots[lot.id]}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) => updateSeedWastageQuantity(lot.id, Number(e.target.value))}
                                            min={0} max={lot.availableSeedWastage ?? 0}
                                            status={batchModal.seedWastageLots[lot.id] > (lot.availableSeedWastage ?? 0) ? 'error' : undefined}
                                            className="font-bold text-center text-amber-600 shadow-inner-sm bg-white" />
                                        </div>
                                      </div>
                                      {batchModal.seedWastageLots[lot.id] > (lot.availableSeedWastage ?? 0) && (
                                        <div className="mt-2 text-xs text-red-500 font-medium flex items-center gap-1">
                                          <XCircle size={12} />
                                          Cannot exceed available: {lot.availableSeedWastage ?? 0} {lot.seedWastageUnit || lot.rawMaterial?.unitOfMeasurement || ''}
                                        </div>
                                      )}
                                      <div className="mt-1 text-[11px] text-muted-foreground">
                                        Max: {lot.availableSeedWastage ?? 0} {lot.seedWastageUnit || lot.rawMaterial?.unitOfMeasurement || ''}
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div className="pt-2">
                    <div className="text-xs text-muted-foreground mb-1.5 font-medium flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Dispatch Notes (optional)</div>
                    <TextArea rows={2} placeholder="Add any special instructions or notes for this dispatch..."
                      value={batchModal.notes} className="rounded-lg resize-none"
                      onChange={(e) => setBatchModal((prev) => ({ ...prev, notes: e.target.value }))} />
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* Modal Footer */}
          <div className="flex justify-between items-center pt-5 mt-2 border-t border-border/80">
            <Button size="large" className="rounded-lg font-medium" disabled={batchModal.step === 0} onClick={handleBatchPrevStep}>Back</Button>
            <div className="flex gap-3">
              <Button size="large" className="rounded-lg text-muted-foreground hover:text-foreground border-border" onClick={closeBatchModal}>Cancel</Button>
              {batchModal.step < 2 ? (
                <Button size="large" type="primary" onClick={handleBatchNextStep} className="rounded-lg shadow-md font-semibold px-8"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none' }}>
                  Next Step
                </Button>
              ) : (
                <Button size="large" type="primary" loading={batchModal.loading} onClick={handleCreateBatch} className="rounded-lg shadow-md font-semibold px-6"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}>
                  <Send className="w-4 h-4 mr-2 inline" /> Create Dispatch
                </Button>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* ── View Details Modal ── */}
      <Modal
        open={viewModal.visible}
        title={
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Eye className="text-white" size={14} />
            </div>
            <span className="text-lg font-semibold">Dispatch Details</span>
          </div>
        }
        onCancel={() => setViewModal({ visible: false, dispatch: undefined })}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setViewModal({ visible: false, dispatch: undefined })}>Close</Button>
            {viewModal.dispatch && (
              <Button type="primary" icon={<Download size={14} />} onClick={() => handleDownloadPDF(viewModal.dispatch!)}
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}
              >Download PDF</Button>
            )}
          </div>
        }
        width={700}
      >
        {viewModal.dispatch && (
          <div className="space-y-5 mt-4">
            {/* Batch Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/20 rounded-xl p-3 border border-border/50">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Batch Number</div>
                <div className="text-sm font-mono font-bold text-primary">{viewModal.dispatch.batchNumber}</div>
              </div>
              <div className="bg-muted/20 rounded-xl p-3 border border-border/50">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Status</div>
                <div>{getStatusBadge(viewModal.dispatch.status)}</div>
              </div>
              <div className="bg-muted/20 rounded-xl p-3 border border-border/50">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Raw Material</div>
                <div className="text-sm font-medium">{viewModal.dispatch.inputRawMaterial?.name || '-'} <span className="text-xs text-muted-foreground">({viewModal.dispatch.inputRawMaterial?.skuCode})</span></div>
              </div>
              <div className="bg-muted/20 rounded-xl p-3 border border-border/50">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Total Quantity</div>
                <div className="text-sm font-bold">{viewModal.dispatch.totalQuantity} {viewModal.dispatch.inputRawMaterial?.unitOfMeasurement || ''}</div>
              </div>
              <div className="bg-muted/20 rounded-xl p-3 border border-border/50">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">From Location</div>
                <div className="text-sm font-medium flex items-center gap-1"><MapPin className="w-3 h-3 text-indigo-500" /> {viewModal.dispatch.fromLocation?.name || '-'}</div>
              </div>
              <div className="bg-muted/20 rounded-xl p-3 border border-border/50">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">To Location</div>
                <div className="text-sm font-medium flex items-center gap-1"><MapPin className="w-3 h-3 text-emerald-500" /> {viewModal.dispatch.toLocation?.name || '-'}</div>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-3 gap-3">
              {viewModal.dispatch.sentAt && (
                <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="text-[10px] uppercase text-blue-500 font-semibold">Sent</div>
                  <div className="text-xs font-medium text-blue-700 mt-1">{new Date(viewModal.dispatch.sentAt).toLocaleString()}</div>
                </div>
              )}
              {viewModal.dispatch.acceptedAt && (
                <div className="text-center p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                  <div className="text-[10px] uppercase text-emerald-500 font-semibold">Accepted</div>
                  <div className="text-xs font-medium text-emerald-700 mt-1">{new Date(viewModal.dispatch.acceptedAt).toLocaleString()}</div>
                </div>
              )}
              {viewModal.dispatch.rejectedAt && (
                <div className="text-center p-2 bg-red-50 rounded-lg border border-red-100">
                  <div className="text-[10px] uppercase text-red-500 font-semibold">Rejected</div>
                  <div className="text-xs font-medium text-red-700 mt-1">{new Date(viewModal.dispatch.rejectedAt).toLocaleString()}</div>
                </div>
              )}
            </div>

            {/* Rejection Reason */}
            {viewModal.dispatch.rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="text-xs font-semibold text-red-600 mb-1">Rejection Reason</div>
                <div className="text-sm text-red-700">{viewModal.dispatch.rejectionReason}</div>
              </div>
            )}

            {/* Notes */}
            {viewModal.dispatch.notes && (
              <div className="bg-muted/20 border border-border/50 rounded-lg p-3">
                <div className="text-xs font-semibold text-muted-foreground mb-1">Notes</div>
                <div className="text-sm text-foreground">{viewModal.dispatch.notes}</div>
              </div>
            )}

            {/* Lot Allocation Table */}
            {viewModal.dispatch.lots && viewModal.dispatch.lots.filter(l => l.allocatedQuantity > 0 || l.seedWastageAllocated > 0).length > 0 && (
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-primary mb-2 flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5" /> Lot Allocation
                </div>
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="min-w-full">
                    <thead><tr className="bg-muted/50">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Lot</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Material</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">Allocated</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">Seed Wastage</th>
                    </tr></thead>
                    <tbody className="divide-y divide-border">
                      {viewModal.dispatch.lots.filter(l => l.allocatedQuantity > 0 || l.seedWastageAllocated > 0).map(l => (
                        <tr key={l.id} className="hover:bg-muted/30">
                          <td className="px-3 py-2 text-sm font-mono text-primary font-medium">
                            {l.cleaningLot?.cleaningJobId ? `LOT-${l.cleaningLot.cleaningJobId}` : (l.cleaningLot?.lotNumber || l.cleaningLotId)}
                          </td>
                          <td className="px-3 py-2 text-sm text-foreground">{l.cleaningLot?.rawMaterial?.name || '-'}</td>
                          <td className="px-3 py-2 text-sm text-right font-semibold">{l.allocatedQuantity} {l.cleaningLot?.cleanedQuantityUnit || l.cleaningLot?.rawMaterial?.unitOfMeasurement || ''}</td>
                          <td className="px-3 py-2 text-sm text-right text-amber-600">{l.seedWastageAllocated > 0 ? `${l.seedWastageAllocated} ${l.cleaningLot?.seedWastageUnit || l.cleaningLot?.rawMaterial?.unitOfMeasurement || ''}` : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

export default DispatchToGrinding;
