import React, { useEffect, useState, useMemo } from 'react';
import api, { API_ROUTES } from '../../../utils/api';
import { Button, Modal, Input, Select, message, Spin } from 'antd';
import { PlusOutlined, LoadingOutlined } from '@ant-design/icons';
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
  ArrowDownToLine,
  MapPin,
  Send,
  XCircle,
  Check,
  X,
} from 'lucide-react';

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

  // ── Reject Modal ──
  const [rejectModal, setRejectModal] = useState<{
    visible: boolean;
    dispatch?: GrindingDispatch;
    reason: string;
    loading: boolean;
  }>({
    visible: false,
    dispatch: undefined,
    reason: '',
    loading: false,
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
    setBatchModal((prev) => ({ ...prev, selectedLots: { ...prev.selectedLots, [lotId]: qty } }));
  };

  const updateSeedWastageQuantity = (lotId: string, qty: number) => {
    setBatchModal((prev) => ({ ...prev, seedWastageLots: { ...prev.seedWastageLots, [lotId]: qty } }));
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
    return Object.values(batchModal.selectedLots).reduce((s, q) => s + q, 0)
      + Object.values(batchModal.seedWastageLots).reduce((s, q) => s + q, 0);
  }, [batchModal.selectedLots, batchModal.seedWastageLots]);

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

  /* ─── Accept / Reject ─── */
  const handleAcceptDispatch = async (dispatch: GrindingDispatch) => {
    try {
      await api.put(API_ROUTES.RAW.ACCEPT_GRINDING_DISPATCH(dispatch.id));
      message.success(`Dispatch ${dispatch.batchNumber} accepted!`);
      fetchDispatches();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to accept dispatch');
    }
  };

  const openRejectModal = (dispatch: GrindingDispatch) => {
    setRejectModal({ visible: true, dispatch, reason: '', loading: false });
  };

  const handleRejectDispatch = async () => {
    if (!rejectModal.dispatch) return;
    if (!rejectModal.reason.trim()) { message.error('Please enter a rejection reason'); return; }
    setRejectModal((prev) => ({ ...prev, loading: true }));
    try {
      await api.put(API_ROUTES.RAW.REJECT_GRINDING_DISPATCH(rejectModal.dispatch.id), {
        rejectionReason: rejectModal.reason,
      });
      message.success(`Dispatch ${rejectModal.dispatch.batchNumber} rejected. Quantities restored.`);
      setRejectModal({ visible: false, dispatch: undefined, reason: '', loading: false });
      fetchDispatches();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to reject dispatch');
      setRejectModal((prev) => ({ ...prev, loading: false }));
    }
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
                            {dispatch.status === 'SENT' && (
                              <div className="flex gap-1 justify-center">
                                <Button type="primary" size="small"
                                  icon={<Check className="w-3 h-3" />}
                                  onClick={() => handleAcceptDispatch(dispatch)}
                                  className="rounded-lg"
                                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}
                                >Accept</Button>
                                <Button size="small" danger
                                  icon={<X className="w-3 h-3" />}
                                  onClick={() => openRejectModal(dispatch)}
                                  className="rounded-lg"
                                >Reject</Button>
                              </div>
                            )}
                            {dispatch.status === 'REJECTED' && dispatch.rejectionReason && (
                              <span className="text-xs text-red-500 italic" title={dispatch.rejectionReason}>
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

                                {/* Cleaned Qty */}
                                <div className="rounded-xl border border-border bg-card overflow-hidden">
                                  <button type="button" className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                                    onClick={() => toggleSection(dispatch.id, 'cleaned')}>
                                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                      <Layers className="w-4 h-4 text-primary" /> Cleaned Quantity Allocation
                                    </h4>
                                    {(expandedSections[dispatch.id]?.cleaned !== false)
                                      ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                      : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                                  </button>
                                  <AnimatePresence>
                                    {(expandedSections[dispatch.id]?.cleaned !== false) && (
                                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                                        <div className="px-4 pb-4">
                                          {(!dispatch.lots || dispatch.lots.length === 0) ? (
                                            <p className="text-sm text-muted-foreground italic">No lot allocation data available.</p>
                                          ) : (
                                            <table className="min-w-full">
                                              <thead><tr className="bg-muted/40">
                                                <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Lot</th>
                                                <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Material</th>
                                                <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">Cleaned Qty</th>
                                                <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">Allocated</th>
                                              </tr></thead>
                                              <tbody className="divide-y divide-border">
                                                {dispatch.lots.filter((bl) => bl.allocatedQuantity > 0).map((bl) => (
                                                  <tr key={bl.id} className="hover:bg-muted/30">
                                                    <td className="px-3 py-2 text-sm font-mono text-primary">{bl.cleaningLot?.lotNumber || bl.cleaningLotId}</td>
                                                    <td className="px-3 py-2 text-sm text-foreground">{bl.cleaningLot?.rawMaterial?.name || '-'}</td>
                                                    <td className="px-3 py-2 text-sm text-right text-muted-foreground">{bl.cleaningLot?.cleanedQuantity ?? '-'} {bl.cleaningLot?.rawMaterial?.unitOfMeasurement || ''}</td>
                                                    <td className="px-3 py-2 text-sm text-right font-semibold text-foreground">{bl.allocatedQuantity} {bl.cleaningLot?.rawMaterial?.unitOfMeasurement || ''}</td>
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

                                {/* Seed Wastage */}
                                <div className="rounded-xl border border-border bg-card overflow-hidden">
                                  <button type="button" className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                                    onClick={() => toggleSection(dispatch.id, 'seedWastage')}>
                                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                      <Leaf className="w-4 h-4 text-amber-500" /> Seed Wastage Allocation
                                    </h4>
                                    {(expandedSections[dispatch.id]?.seedWastage !== false)
                                      ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                      : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                                  </button>
                                  <AnimatePresence>
                                    {(expandedSections[dispatch.id]?.seedWastage !== false) && (
                                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                                        <div className="px-4 pb-4">
                                          {(!dispatch.lots || dispatch.lots.filter(bl => bl.seedWastageAllocated > 0).length === 0) ? (
                                            <p className="text-sm text-muted-foreground italic">No seed wastage allocated.</p>
                                          ) : (
                                            <table className="min-w-full">
                                              <thead><tr className="bg-amber-500/5">
                                                <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Lot</th>
                                                <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Material</th>
                                                <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">Seed Wastage Allocated</th>
                                              </tr></thead>
                                              <tbody className="divide-y divide-border">
                                                {dispatch.lots.filter((bl) => bl.seedWastageAllocated > 0).map((bl) => (
                                                  <tr key={`sw-${bl.id}`} className="hover:bg-muted/30">
                                                    <td className="px-3 py-2 text-sm font-mono text-amber-600">{bl.cleaningLot?.lotNumber || bl.cleaningLotId}</td>
                                                    <td className="px-3 py-2 text-sm text-foreground">{bl.cleaningLot?.rawMaterial?.name || '-'}</td>
                                                    <td className="px-3 py-2 text-sm text-right font-semibold text-amber-600">{bl.seedWastageAllocated} {bl.cleaningLot?.rawMaterial?.unitOfMeasurement || ''}</td>
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
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Send className="text-white" size={14} />
            </div>
            <span className="text-lg font-semibold">Create Grinding Dispatch</span>
          </div>
        }
        onCancel={closeBatchModal}
        width={700}
        footer={null}
      >
        <div className="space-y-4 mt-4">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-4">
            {['Locations', 'Material', 'Select Lots'].map((label, idx) => (
              <div key={label} className="flex items-center gap-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  batchModal.step >= idx ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>{idx + 1}</div>
                <span className={`text-xs ${batchModal.step >= idx ? 'text-primary font-medium' : 'text-muted-foreground'}`}>{label}</span>
                {idx < 2 && <div className="w-6 h-px bg-border" />}
              </div>
            ))}
          </div>

          {/* Step 0: From/To Location */}
          {batchModal.step === 0 && (
            <div className="space-y-3">
              <div>
                <div className="text-xs text-muted-foreground mb-1 font-medium flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> From Location (Source)
                </div>
                <Select style={{ width: '100%' }} placeholder="Select source location" value={batchModal.fromLocationId || undefined}
                  onChange={(val) => setBatchModal((prev) => ({ ...prev, fromLocationId: val }))}
                  showSearch filterOption={(input, option) => (option?.children?.toString() || '').toLowerCase().includes(input.toLowerCase())}
                >
                  {locations.map((l) => <Option key={l.id} value={l.id}>{l.name} ({l.code}) - {l.type}</Option>)}
                </Select>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1 font-medium flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> To Location (Destination)
                </div>
                <Select style={{ width: '100%' }} placeholder="Select destination location" value={batchModal.toLocationId || undefined}
                  onChange={(val) => setBatchModal((prev) => ({ ...prev, toLocationId: val }))}
                  showSearch filterOption={(input, option) => (option?.children?.toString() || '').toLowerCase().includes(input.toLowerCase())}
                >
                  {locations.filter(l => l.id !== batchModal.fromLocationId).map((l) => <Option key={l.id} value={l.id}>{l.name} ({l.code}) - {l.type}</Option>)}
                </Select>
              </div>
            </div>
          )}

          {/* Step 1: Material */}
          {batchModal.step === 1 && (
            <div>
              <div className="text-xs text-muted-foreground mb-1 font-medium">Select Raw Material</div>
              <Select style={{ width: '100%' }} placeholder="Choose raw material" value={batchModal.rawMaterialId || undefined}
                onChange={handleBatchMaterialSelect} showSearch
                filterOption={(input, option) => (option?.children?.toString() || '').toLowerCase().includes(input.toLowerCase())}>
                {availableMaterials.map((m) => <Option key={m.id} value={m.id}>{m.name} ({m.skuCode})</Option>)}
              </Select>
            </div>
          )}

          {/* Step 2: Lots */}
          {batchModal.step === 2 && (
            <div className="space-y-3">
              {filteredLots.length === 0 && filteredSeedWastageLots.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Boxes className="mx-auto mb-2 opacity-40" size={32} />
                  <p className="text-sm">No available lots for selected material</p>
                </div>
              ) : (
                <>
                  {filteredLots.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Cleaned Lots</div>
                      {filteredLots.map((lot) => (
                        <div key={lot.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border mb-2 cursor-pointer transition-all ${
                            batchModal.selectedLots[lot.id] !== undefined ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/30'
                          }`}
                          onClick={() => toggleLotSelection(lot.id, lot)}>
                          <div className="flex-1">
                            <div className="text-sm font-mono text-primary">{lot.lotNumber}</div>
                            <div className="text-xs text-muted-foreground">Cleaned: {lot.cleanedQuantity ?? 0} {lot.rawMaterial?.unitOfMeasurement}</div>
                          </div>
                          {batchModal.selectedLots[lot.id] !== undefined && (
                            <div className="w-24">
                              <Input type="number" size="small" value={batchModal.selectedLots[lot.id]}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => updateLotQuantity(lot.id, Number(e.target.value))}
                                min={0} max={lot.cleanedQuantity ?? 0} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {filteredSeedWastageLots.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">Seed Wastage Lots</div>
                      {filteredSeedWastageLots.map((lot) => (
                        <div key={`sw-${lot.id}`}
                          className={`flex items-center gap-3 p-3 rounded-lg border mb-2 cursor-pointer transition-all ${
                            batchModal.seedWastageLots[lot.id] !== undefined ? 'border-amber-500 bg-amber-500/5' : 'border-border hover:bg-muted/30'
                          }`}
                          onClick={() => toggleSeedWastageLotSelection(lot.id, lot)}>
                          <div className="flex-1">
                            <div className="text-sm font-mono text-amber-600">{lot.lotNumber}</div>
                            <div className="text-xs text-muted-foreground">Available: {lot.availableSeedWastage ?? 0} {lot.rawMaterial?.unitOfMeasurement}</div>
                          </div>
                          {batchModal.seedWastageLots[lot.id] !== undefined && (
                            <div className="w-24">
                              <Input type="number" size="small" value={batchModal.seedWastageLots[lot.id]}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => updateSeedWastageQuantity(lot.id, Number(e.target.value))}
                                min={0} max={lot.availableSeedWastage ?? 0} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <div className="text-xs text-muted-foreground mb-1 font-medium">Notes (optional)</div>
                    <TextArea rows={2} placeholder="Add any dispatch notes..."
                      value={batchModal.notes}
                      onChange={(e) => setBatchModal((prev) => ({ ...prev, notes: e.target.value }))} />
                  </div>

                  <div className="text-sm font-semibold text-foreground pt-2 border-t border-border">
                    Total Selected: {totalSelectedQuantity}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex justify-between pt-3 border-t border-border">
            <Button disabled={batchModal.step === 0} onClick={handleBatchPrevStep}>Back</Button>
            <div className="flex gap-2">
              <Button onClick={closeBatchModal}>Cancel</Button>
              {batchModal.step < 2 ? (
                <Button type="primary" onClick={handleBatchNextStep}
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none' }}>Next</Button>
              ) : (
                <Button type="primary" loading={batchModal.loading} onClick={handleCreateBatch}
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', fontWeight: 600 }}>
                  <Send className="w-3 h-3 mr-1 inline" /> Create Dispatch
                </Button>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Reject Modal ── */}
      <Modal
        open={rejectModal.visible}
        title={<div className="flex items-center gap-2"><XCircle className="text-red-500" size={18} /><span>Reject Dispatch</span></div>}
        onCancel={() => setRejectModal((p) => ({ ...p, visible: false }))}
        footer={null} width={450}
      >
        <div className="space-y-4 mt-4">
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
            <p className="text-sm text-red-600 font-medium">
              Rejecting dispatch <span className="font-mono">{rejectModal.dispatch?.batchNumber}</span> will restore all allocated quantities back to the cleaning lots.
            </p>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1 font-medium">Rejection Reason *</div>
            <TextArea rows={3} value={rejectModal.reason}
              onChange={(e) => setRejectModal((p) => ({ ...p, reason: e.target.value }))}
              placeholder="Enter reason for rejecting this dispatch" />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button onClick={() => setRejectModal((p) => ({ ...p, visible: false }))}>Cancel</Button>
            <Button type="primary" danger loading={rejectModal.loading} onClick={handleRejectDispatch}>
              <XCircle size={12} className="mr-1 inline" /> Reject Dispatch
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

export default DispatchToGrinding;
