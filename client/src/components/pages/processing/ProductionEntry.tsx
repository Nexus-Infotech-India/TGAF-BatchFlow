import React, { useEffect, useState, useMemo, useCallback } from 'react';
import api, { API_ROUTES } from '../../../utils/api';
import { Button, Input, Select, message, InputNumber, Tooltip, Modal } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Factory,
  Package,
  ChevronDown,
  ChevronRight,
  Layers,
  CheckCircle,
  PlusCircle,
  FlaskConical,
  Recycle,
  AlertTriangle,
  Zap,
  Database,
  Truck,
  Info,
  ClipboardCheck,
} from 'lucide-react';

const { Option } = Select;
const { TextArea } = Input;

/* ─── Types ─── */
interface Location {
  id: string;
  name: string;
  type: string;
}

interface SFGProduct {
  id: string;
  name: string;
  skuCode: string;
  unitOfMeasurement: string;
  category: string;
}

interface BOMInfo {
  id: string;
  bomCode: string;
  productName: string;
  unitOfMeasurement: string;
  outputQuantity: number;
  itemCount: number;
}

interface AvailableBatch {
  dispatchId: string;
  batchNumber: string;
  totalQuantity: number;
  unit: string;
}

interface ConsumptionItem {
  rawMaterialId: string;
  rawMaterialName: string;
  skuCode: string;
  category: string;
  bomQuantity: number;
  bomUnit: string;
  expectedQuantity: number;
  displayUnit: string;
  sourceType: 'BATCH' | 'STOCK';
  availableBatches: AvailableBatch[];
  currentStockQty: number;
  currentStockUnit: string;
}

interface ConsumptionLine {
  rawMaterialId: string;
  rawMaterialName: string;
  skuCode: string;
  expectedQuantity: number;
  actualQuantity: number;
  unit: string;
  sourceType: 'BATCH' | 'STOCK';
  batchNumber: string;
  availableBatches: AvailableBatch[];
  currentStockQty: number;
  currentStockUnit: string;
}

interface OutputLine {
  outputType: 'SFG' | 'BYPRODUCT' | 'SCRAP';
  productName: string;
  skuCode: string;
  quantity: number;
  unit: string;
  batchNumber: string;
}

interface ProductionPosting {
  id: string;
  postingNumber: string;
  sfgProductId: string;
  bomId: string;
  locationId: string;
  shiftDate: string;
  productionQty?: number;
  productionUnit?: string;
  status: string;
  notes?: string;
  createdAt: string;
  consumptions: {
    id: string;
    rawMaterialId: string;
    expectedQuantity: number;
    actualQuantity: number;
    batchNumber?: string;
  }[];
  outputs: {
    id: string;
    outputType: string;
    productName: string;
    skuCode?: string;
    quantity: number;
    unit: string;
    batchNumber?: string;
  }[];
}

/* ─── Component ─── */
const ProductionEntry: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [sfgProducts, setSfgProducts] = useState<SFGProduct[]>([]);
  const [postings, setPostings] = useState<ProductionPosting[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedPostingId, setExpandedPostingId] = useState<string | null>(null);

  // Form state
  const [formVisible, setFormVisible] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [selectedSfgId, setSelectedSfgId] = useState('');
  const [selectedBom, setSelectedBom] = useState<BOMInfo | null>(null);
  const [bomLoading, setBomLoading] = useState(false);
  const [shiftDate, setShiftDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  // Production quantity
  const [productionQty, setProductionQty] = useState<number | null>(null);
  const [productionUnit, setProductionUnit] = useState<string>('KG');

  const [consumptionLines, setConsumptionLines] = useState<ConsumptionLine[]>([]);
  const [outputLines, setOutputLines] = useState<OutputLine[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [consumptionLoading, setConsumptionLoading] = useState(false);

  // Complete Production Modal
  const [completeModal, setCompleteModal] = useState<{
    visible: boolean;
    posting?: ProductionPosting;
    byproductQty: number;
    byproductUnit: string;
    byproductName: string;
    scrapQty: number;
    scrapUnit: string;
    scrapName: string;
    loading: boolean;
  }>({
    visible: false,
    posting: undefined,
    byproductQty: 0,
    byproductUnit: 'KG',
    byproductName: 'Byproduct',
    scrapQty: 0,
    scrapUnit: 'KG',
    scrapName: 'Scrap',
    loading: false,
  });

  const grindingLocations = useMemo(() => locations.filter((l) => l.type === 'GRINDING'), [locations]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [locRes, prodRes, postRes] = await Promise.all([
        api.get(API_ROUTES.RAW.GET_LOCATIONS),
        api.get(API_ROUTES.RAW.GET_PRODUCTS),
        api.get(API_ROUTES.RAW.GET_PRODUCTION_POSTINGS),
      ]);
      setLocations(locRes.data || []);
      const allProducts = prodRes.data || [];
      const sfg = allProducts.filter(
        (p: SFGProduct) => p.category === 'SFG' || p.category === 'SEMI_FINISHED' || p.category === 'SEMI_FINISHED_GOOD'
      );
      setSfgProducts(sfg.length > 0 ? sfg : allProducts);
      setPostings(postRes.data?.data || []);
    } catch {
      message.error('Failed to fetch data');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // When SFG product is selected → fetch BOM info only
  const handleSfgSelect = async (productId: string) => {
    setSelectedSfgId(productId);
    setSelectedBom(null);
    setConsumptionLines([]);
    setProductionQty(null);
    setBomLoading(true);
    try {
      const res = await api.get(API_ROUTES.RAW.GET_BOM_BY_SFG(productId));
      const bom = res.data;
      setSelectedBom({
        id: bom.id,
        bomCode: bom.bomCode,
        productName: bom.productName,
        unitOfMeasurement: bom.unitOfMeasurement,
        outputQuantity: bom.outputQuantity,
        itemCount: bom.items?.length || 0,
      });
      setProductionUnit(bom.unitOfMeasurement || 'KG');
      const sfg = sfgProducts.find((p) => p.id === productId);
      setOutputLines([
        {
          outputType: 'SFG',
          productName: bom.productName || sfg?.name || '',
          skuCode: sfg?.skuCode || '',
          quantity: 0,
          unit: bom.unitOfMeasurement || sfg?.unitOfMeasurement || 'KG',
          batchNumber: '',
        },
      ]);
    } catch {
      message.warning('No active BOM found for this SFG.');
      setConsumptionLines([]);
      const sfg = sfgProducts.find((p) => p.id === productId);
      setOutputLines([
        {
          outputType: 'SFG',
          productName: sfg?.name || '',
          skuCode: sfg?.skuCode || '',
          quantity: 0,
          unit: sfg?.unitOfMeasurement || 'KG',
          batchNumber: '',
        },
      ]);
    }
    setBomLoading(false);
  };

  // When production quantity changes → fetch consumption data from backend
  const fetchConsumptionData = useCallback(async (qty: number) => {
    if (!selectedSfgId || !qty || qty <= 0) return;

    setConsumptionLoading(true);
    try {
      const res = await api.get(API_ROUTES.RAW.GET_CONSUMPTION_DATA, {
        params: {
          sfgProductId: selectedSfgId,
          productionQty: qty,
          productionUnit,
          locationId: selectedLocationId || undefined,
        },
      });

      const data = res.data;
      if (data.bom) setSelectedBom(data.bom);

      const lines: ConsumptionLine[] = (data.consumptionItems || []).map((item: ConsumptionItem) => ({
        rawMaterialId: item.rawMaterialId,
        rawMaterialName: item.rawMaterialName,
        skuCode: item.skuCode,
        expectedQuantity: item.expectedQuantity,
        actualQuantity: item.expectedQuantity,
        unit: item.displayUnit,
        sourceType: item.sourceType,
        batchNumber: item.sourceType === 'BATCH' && item.availableBatches.length > 0
          ? item.availableBatches[0].batchNumber
          : '',
        availableBatches: item.availableBatches,
        currentStockQty: item.currentStockQty,
        currentStockUnit: item.currentStockUnit,
      }));

      setConsumptionLines(lines);
      setOutputLines((prev) =>
        prev.map((line) =>
          line.outputType === 'SFG' ? { ...line, quantity: qty } : line
        )
      );
    } catch (err: any) {
      console.error('Failed to fetch consumption data:', err);
      message.error(err?.response?.data?.error || 'Failed to calculate consumption');
    }
    setConsumptionLoading(false);
  }, [selectedSfgId, productionUnit, selectedLocationId]);

  const handleProductionQtyChange = (value: number | null) => {
    setProductionQty(value);
    if (value && value > 0) {
      fetchConsumptionData(value);
    } else {
      setConsumptionLines([]);
    }
  };

  const updateConsumption = (index: number, field: string, value: any) => {
    setConsumptionLines((prev) => {
      const lines = [...prev];
      (lines[index] as any)[field] = value;
      return lines;
    });
  };

  // Submit production posting (SFG only, no byproduct/scrap)
  const handleSubmit = async () => {
    if (!selectedLocationId) { message.error('Select a grinding location'); return; }
    if (!selectedSfgId) { message.error('Select an SFG product'); return; }
    if (!productionQty || productionQty <= 0) { message.error('Enter a valid production quantity'); return; }
    if (consumptionLines.length === 0) { message.error('Add at least one raw material consumption'); return; }

    setSubmitting(true);
    try {
      await api.post(API_ROUTES.RAW.POST_PRODUCTION, {
        sfgProductId: selectedSfgId,
        bomId: selectedBom?.id || 'manual',
        locationId: selectedLocationId,
        shiftDate,
        productionQty,
        productionUnit,
        notes,
        consumptions: consumptionLines.map((c) => ({
          rawMaterialId: c.rawMaterialId,
          expectedQuantity: c.expectedQuantity,
          actualQuantity: c.actualQuantity,
          unit: c.unit,
          batchNumber: c.batchNumber || null,
          sourceType: c.sourceType,
        })),
        outputs: outputLines
          .filter((o) => o.quantity > 0)
          .map((o) => ({
            outputType: o.outputType,
            productName: o.productName,
            skuCode: o.skuCode || null,
            quantity: o.quantity,
            unit: o.unit,
            batchNumber: o.batchNumber || null,
          })),
      });
      message.success('Production posted successfully!');
      resetForm();
      fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to post production');
    }
    setSubmitting(false);
  };

  const resetForm = () => {
    setFormVisible(false);
    setSelectedLocationId('');
    setSelectedSfgId('');
    setSelectedBom(null);
    setConsumptionLines([]);
    setOutputLines([]);
    setNotes('');
    setProductionQty(null);
    setProductionUnit('KG');
    setShiftDate(new Date().toISOString().slice(0, 10));
  };

  // ─── Complete Production ───
  const openCompleteModal = (posting: ProductionPosting) => {
    const sfgOutput = posting.outputs.find((o) => o.outputType === 'SFG');
    setCompleteModal({
      visible: true,
      posting,
      byproductQty: 0,
      byproductUnit: sfgOutput?.unit || posting.productionUnit || 'KG',
      byproductName: 'Byproduct',
      scrapQty: 0,
      scrapUnit: sfgOutput?.unit || posting.productionUnit || 'KG',
      scrapName: 'Scrap',
      loading: false,
    });
  };

  const handleCompleteProduction = async () => {
    if (!completeModal.posting) return;
    setCompleteModal((prev) => ({ ...prev, loading: true }));
    try {
      await api.put(API_ROUTES.RAW.COMPLETE_PRODUCTION(completeModal.posting.id), {
        byproductQty: completeModal.byproductQty || 0,
        byproductUnit: completeModal.byproductUnit,
        byproductName: completeModal.byproductName || 'Byproduct',
        scrapQty: completeModal.scrapQty || 0,
        scrapUnit: completeModal.scrapUnit,
        scrapName: completeModal.scrapName || 'Scrap',
      });
      message.success(`Production ${completeModal.posting.postingNumber} completed!`);
      setCompleteModal((prev) => ({ ...prev, visible: false }));
      fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to complete production');
      setCompleteModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // Helpers for net SFG calculation in modal
  const getNetSfgInModal = () => {
    if (!completeModal.posting) return { net: 0, unit: 'KG', total: 0 };
    const sfgOutput = completeModal.posting.outputs.find((o) => o.outputType === 'SFG');
    if (!sfgOutput) return { net: 0, unit: 'KG', total: 0 };

    const UNIT_TO_GRAMS: Record<string, number> = {
      gram: 1, grams: 1, g: 1,
      kg: 1000, KG: 1000, Kg: 1000,
      ton: 1_000_000, Ton: 1_000_000, TON: 1_000_000,
      quintal: 100_000, Quintal: 100_000,
    };
    const toG = (q: number, u: string) => q * (UNIT_TO_GRAMS[u] ?? UNIT_TO_GRAMS[u.toLowerCase()] ?? 1);
    const fromG = (g: number, u: string) => g / (UNIT_TO_GRAMS[u] ?? UNIT_TO_GRAMS[u.toLowerCase()] ?? 1);

    const totalG = toG(sfgOutput.quantity, sfgOutput.unit);
    const bpG = toG(completeModal.byproductQty || 0, completeModal.byproductUnit);
    const scG = toG(completeModal.scrapQty || 0, completeModal.scrapUnit);
    const netG = Math.max(0, totalG - bpG - scG);

    return {
      total: sfgOutput.quantity,
      unit: sfgOutput.unit,
      net: Math.round(fromG(netG, sfgOutput.unit) * 1000) / 1000,
    };
  };

  const outputTypeColors: Record<string, string> = {
    SFG: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    BYPRODUCT: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    SCRAP: 'bg-red-500/10 text-red-600 border-red-500/20',
  };

  const outputTypeIcons: Record<string, React.ReactNode> = {
    SFG: <Package size={12} />,
    BYPRODUCT: <Recycle size={12} />,
    SCRAP: <AlertTriangle size={12} />,
  };

  const unitOptions = ['gram', 'KG', 'Ton', 'Quintal'];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'POSTED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border bg-amber-500/10 text-amber-600 border-amber-500/20">
            <Factory className="w-3 h-3 mr-1" /> Posted
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
            <CheckCircle className="w-3 h-3 mr-1" /> Completed
          </span>
        );
      default:
        return <span className="text-xs text-muted-foreground">{status}</span>;
    }
  };

  return (
    <div className="space-y-5">
      {/* Header / toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Factory size={18} className="text-primary" />
            Production Postings
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {postings.length} posting{postings.length !== 1 ? 's' : ''} recorded
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusCircle size={14} />}
          onClick={() => setFormVisible(!formVisible)}
          className="rounded-lg"
          style={{
            background: formVisible ? '#ef4444' : 'linear-gradient(135deg, #10b981, #059669)',
            border: 'none',
            fontWeight: 600,
          }}
        >
          {formVisible ? '✕ Cancel' : 'New Production Posting'}
        </Button>
      </div>

      {/* ─── Production Entry Form ─── */}
      <AnimatePresence>
        {formVisible && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card rounded-xl border border-primary/20 p-5 space-y-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <FlaskConical size={14} />
                <span className="uppercase tracking-wider text-xs">New Production Posting</span>
                <div className="flex-1 h-px bg-primary/20" />
              </div>

              {/* Row 1: Location + SFG + Shift Date */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1 font-medium">Grinding Location *</div>
                  <Select
                    style={{ width: '100%' }}
                    placeholder="Select grinding location"
                    value={selectedLocationId || undefined}
                    onChange={(val) => {
                      setSelectedLocationId(val);
                      if (productionQty && productionQty > 0 && selectedSfgId) {
                        setTimeout(() => fetchConsumptionData(productionQty), 100);
                      }
                    }}
                  >
                    {grindingLocations.map((l) => (
                      <Option key={l.id} value={l.id}>{l.name}</Option>
                    ))}
                  </Select>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1 font-medium">SFG Product *</div>
                  <Select
                    style={{ width: '100%' }}
                    placeholder="Select SFG to produce"
                    value={selectedSfgId || undefined}
                    onChange={handleSfgSelect}
                    loading={bomLoading}
                    showSearch
                    filterOption={(input, option) =>
                      (option?.children?.toString() || '').toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {sfgProducts.map((p) => (
                      <Option key={p.id} value={p.id}>{p.name} ({p.skuCode})</Option>
                    ))}
                  </Select>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1 font-medium">Shift Date *</div>
                  <Input type="date" value={shiftDate} onChange={(e) => setShiftDate(e.target.value)} />
                </div>
              </div>

              {/* BOM Info */}
              {selectedBom && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Layers size={14} className="text-primary" />
                    <span className="font-semibold text-primary">BOM: {selectedBom.bomCode}</span>
                    <span className="text-xs text-muted-foreground">— {selectedBom.productName}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Output: {selectedBom.outputQuantity} {selectedBom.unitOfMeasurement} &middot; {selectedBom.itemCount} raw material{selectedBom.itemCount !== 1 ? 's' : ''}
                  </div>
                </div>
              )}

              {/* ── Production Quantity Input ── */}
              {selectedBom && (
                <div className="rounded-xl border-2 border-dashed border-emerald-400/40 bg-emerald-50/30 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10">
                      <Zap size={14} className="text-emerald-600" />
                    </div>
                    <span className="text-sm font-bold text-emerald-700 uppercase tracking-wider">
                      SFG Production Quantity
                    </span>
                    <Tooltip title="Enter how much SFG was produced. The system will automatically calculate raw material quantities from the BOM recipe.">
                      <Info size={14} className="text-muted-foreground cursor-help" />
                    </Tooltip>
                  </div>
                  <div className="flex items-end gap-3">
                    <div className="flex-1 max-w-xs">
                      <div className="text-xs text-muted-foreground mb-1 font-medium">
                        How much {selectedBom.productName} was produced? *
                      </div>
                      <InputNumber
                        style={{ width: '100%' }}
                        min={0.001}
                        step={0.1}
                        precision={3}
                        value={productionQty}
                        onChange={handleProductionQtyChange}
                        placeholder="Enter quantity"
                        size="large"
                        className="font-semibold"
                      />
                    </div>
                    <div className="w-32">
                      <div className="text-xs text-muted-foreground mb-1 font-medium">Unit</div>
                      <Select
                        style={{ width: '100%' }}
                        value={productionUnit}
                        onChange={(val) => {
                          setProductionUnit(val);
                          if (productionQty && productionQty > 0) {
                            setTimeout(() => fetchConsumptionData(productionQty), 100);
                          }
                        }}
                        size="large"
                      >
                        {unitOptions.map((u) => (
                          <Option key={u} value={u}>{u}</Option>
                        ))}
                      </Select>
                    </div>
                    {consumptionLoading && (
                      <div className="flex items-center gap-2 text-emerald-600 pb-1">
                        <div className="inline-block w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: '#d1d5db', borderTopColor: '#10b981' }} />
                        <span className="text-xs font-medium">Calculating...</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Raw Material Consumption ── */}
              {consumptionLines.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-amber-600">Raw Material Consumption</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <div className="rounded-lg border border-border overflow-hidden">
                    <table className="min-w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Material</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground uppercase w-20">Source</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">Expected</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase w-36">Actual *</th>
                          {consumptionLines.some((l) => l.sourceType === 'BATCH') && (
                            <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase w-44">Batch</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {consumptionLines.map((line, idx) => (
                          <tr key={idx} className="hover:bg-muted/30 transition-colors">
                            <td className="px-3 py-2.5 text-sm">
                              <div className="font-semibold text-foreground">{line.rawMaterialName}</div>
                              <div className="text-xs text-muted-foreground font-mono">{line.skuCode}</div>
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              {line.sourceType === 'BATCH' ? (
                                <Tooltip title="Sourced from grinding dispatch batch">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-purple-500/10 text-purple-600 border-purple-500/20">
                                    <Truck size={10} /> BATCH
                                  </span>
                                </Tooltip>
                              ) : (
                                <Tooltip title={`Available: ${line.currentStockQty} ${line.currentStockUnit}`}>
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-blue-500/10 text-blue-600 border-blue-500/20">
                                    <Database size={10} /> STOCK
                                  </span>
                                </Tooltip>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-sm text-right">
                              <span className="font-semibold text-emerald-600">{line.expectedQuantity}</span>{' '}
                              <span className="text-muted-foreground text-xs">{line.unit}</span>
                            </td>
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-1 justify-end">
                                <InputNumber
                                  min={0}
                                  step={0.01}
                                  precision={3}
                                  value={line.actualQuantity}
                                  onChange={(val) => updateConsumption(idx, 'actualQuantity', val || 0)}
                                  size="small"
                                  style={{ width: 90 }}
                                  className="text-right"
                                />
                                <span className="text-xs text-muted-foreground font-medium min-w-[30px]">{line.unit}</span>
                              </div>
                            </td>
                            {consumptionLines.some((l) => l.sourceType === 'BATCH') && (
                              <td className="px-3 py-2.5">
                                {line.sourceType === 'BATCH' ? (
                                  line.availableBatches.length > 0 ? (
                                    <Select
                                      size="small"
                                      style={{ width: '100%' }}
                                      value={line.batchNumber || undefined}
                                      onChange={(val) => updateConsumption(idx, 'batchNumber', val)}
                                      placeholder="Select batch"
                                    >
                                      {line.availableBatches.map((b) => (
                                        <Option key={b.dispatchId} value={b.batchNumber}>
                                          <div className="flex items-center justify-between gap-2">
                                            <span className="font-mono text-xs">{b.batchNumber}</span>
                                            <span className="text-xs text-muted-foreground">{b.totalQuantity} {b.unit}</span>
                                          </div>
                                        </Option>
                                      ))}
                                    </Select>
                                  ) : (
                                    <span className="text-xs text-red-500 italic">No batch available</span>
                                  )
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    Avail: {line.currentStockQty} {line.currentStockUnit}
                                  </span>
                                )}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Notes */}
              {consumptionLines.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1 font-medium">Notes (optional)</div>
                  <TextArea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Shift notes, observations..."
                  />
                </div>
              )}

              {/* Submit */}
              {consumptionLines.length > 0 && (
                <div className="flex justify-end gap-2 pt-3 border-t border-border">
                  <Button onClick={resetForm}>Cancel</Button>
                  <Button
                    type="primary"
                    loading={submitting}
                    onClick={handleSubmit}
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', fontWeight: 600 }}
                  >
                    <CheckCircle size={12} className="mr-1 inline" /> Post Production
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Past Postings List ─── */}
      <div className="space-y-3">
        {loading && (
          <div className="text-center py-12 text-muted-foreground">
            <div className="inline-block w-8 h-8 border-[3px] rounded-full animate-spin mb-3" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} />
            <p className="text-sm">Loading postings…</p>
          </div>
        )}

        {!loading && postings.length === 0 && (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
            <Factory className="mx-auto mb-3 opacity-40" size={36} />
            <p className="text-lg font-medium">No production postings yet</p>
            <p className="text-sm">Click "New Production Posting" to record shift production.</p>
          </div>
        )}

        {!loading &&
          postings.map((posting) => {
            const sfgOutput = posting.outputs.find((o) => o.outputType === 'SFG');
            const bpOutputs = posting.outputs.filter((o) => o.outputType === 'BYPRODUCT');
            const scrapOutputs = posting.outputs.filter((o) => o.outputType === 'SCRAP');
            const isCompleted = posting.status === 'COMPLETED';

            return (
              <motion.div
                key={posting.id}
                className="bg-card rounded-xl border border-border overflow-hidden"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedPostingId(expandedPostingId === posting.id ? null : posting.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isCompleted ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                      <Factory size={16} className={isCompleted ? 'text-emerald-600' : 'text-amber-600'} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold font-mono text-primary">{posting.postingNumber}</span>
                        {getStatusBadge(posting.status || 'POSTED')}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Shift: {new Date(posting.shiftDate).toLocaleDateString()} &middot;{' '}
                        {sfgOutput ? `${sfgOutput.quantity} ${sfgOutput.unit}` : `${posting.productionQty || 0} ${posting.productionUnit || ''}`}
                        {' '}SFG
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isCompleted && (
                      <Button
                        type="primary"
                        size="small"
                        icon={<ClipboardCheck size={12} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          openCompleteModal(posting);
                        }}
                        className="rounded-lg"
                        style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', fontWeight: 600 }}
                      >
                        Complete
                      </Button>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(posting.createdAt).toLocaleString()}
                    </span>
                    {expandedPostingId === posting.id ? (
                      <ChevronDown size={16} className="text-muted-foreground" />
                    ) : (
                      <ChevronRight size={16} className="text-muted-foreground" />
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {expandedPostingId === posting.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-border p-4 bg-muted/20 space-y-3">
                        {/* Production Summary for completed */}
                        {isCompleted && (sfgOutput || bpOutputs.length > 0 || scrapOutputs.length > 0) && (
                          <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/30 p-4">
                            <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3">
                              Production Summary
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                              <div>
                                <div className="text-xs text-muted-foreground">Total Production</div>
                                <div className="text-lg font-bold text-foreground">
                                  {posting.productionQty || sfgOutput?.quantity || 0} {posting.productionUnit || sfgOutput?.unit || ''}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-amber-600 font-medium">Byproduct</div>
                                <div className="text-lg font-bold text-amber-600">
                                  {bpOutputs.length > 0
                                    ? bpOutputs.map((b) => `${b.quantity} ${b.unit}`).join(', ')
                                    : '0'}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-red-500 font-medium">Scrap</div>
                                <div className="text-lg font-bold text-red-500">
                                  {scrapOutputs.length > 0
                                    ? scrapOutputs.map((s) => `${s.quantity} ${s.unit}`).join(', ')
                                    : '0'}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-emerald-600 font-medium">Net SFG</div>
                                <div className="text-lg font-bold text-emerald-600">
                                  {sfgOutput ? `${sfgOutput.quantity} ${sfgOutput.unit}` : '0'}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Consumption */}
                        <div>
                          <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">
                            Raw Material Consumed
                          </div>
                          <table className="min-w-full">
                            <thead className="bg-muted/40">
                              <tr>
                                <th className="px-3 py-1.5 text-left text-xs font-semibold text-muted-foreground uppercase">Material</th>
                                <th className="px-3 py-1.5 text-right text-xs font-semibold text-muted-foreground uppercase">Expected</th>
                                <th className="px-3 py-1.5 text-right text-xs font-semibold text-muted-foreground uppercase">Actual</th>
                                <th className="px-3 py-1.5 text-left text-xs font-semibold text-muted-foreground uppercase">Batch</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {posting.consumptions.map((c) => (
                                <tr key={c.id}>
                                  <td className="px-3 py-1.5 text-sm text-foreground">{c.rawMaterialId}</td>
                                  <td className="px-3 py-1.5 text-sm text-right text-muted-foreground">{c.expectedQuantity}</td>
                                  <td className="px-3 py-1.5 text-sm text-right font-semibold text-foreground">{c.actualQuantity}</td>
                                  <td className="px-3 py-1.5 text-sm text-muted-foreground">{c.batchNumber || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Outputs */}
                        <div>
                          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">
                            Production Output
                          </div>
                          <table className="min-w-full">
                            <thead className="bg-muted/40">
                              <tr>
                                <th className="px-3 py-1.5 text-left text-xs font-semibold text-muted-foreground uppercase">Type</th>
                                <th className="px-3 py-1.5 text-left text-xs font-semibold text-muted-foreground uppercase">Product</th>
                                <th className="px-3 py-1.5 text-right text-xs font-semibold text-muted-foreground uppercase">Quantity</th>
                                <th className="px-3 py-1.5 text-left text-xs font-semibold text-muted-foreground uppercase">Batch</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {posting.outputs.map((o) => (
                                <tr key={o.id}>
                                  <td className="px-3 py-1.5">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${outputTypeColors[o.outputType] || ''}`}>
                                      {outputTypeIcons[o.outputType]} {o.outputType}
                                    </span>
                                  </td>
                                  <td className="px-3 py-1.5 text-sm text-foreground">
                                    {o.productName} {o.skuCode && <span className="text-xs text-muted-foreground font-mono ml-1">({o.skuCode})</span>}
                                  </td>
                                  <td className="px-3 py-1.5 text-sm text-right font-semibold text-foreground">
                                    {o.quantity} {o.unit}
                                  </td>
                                  <td className="px-3 py-1.5 text-sm text-muted-foreground">{o.batchNumber || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {posting.notes && (
                          <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-2">
                            <strong>Notes:</strong> {posting.notes}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
      </div>

      {/* ─── Complete Production Modal ─── */}
      <Modal
        open={completeModal.visible}
        title={
          <div className="flex items-center gap-2">
            <ClipboardCheck className="text-amber-500" size={18} />
            <span>Complete Production — {completeModal.posting?.postingNumber}</span>
          </div>
        }
        onCancel={() => setCompleteModal((p) => ({ ...p, visible: false }))}
        footer={null}
        width={520}
      >
        <div className="space-y-5 mt-4">
          {/* Total Production Info */}
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
            <div className="text-xs text-muted-foreground mb-1">Total SFG Produced</div>
            <div className="text-xl font-bold text-primary">
              {completeModal.posting?.outputs.find((o) => o.outputType === 'SFG')?.quantity || completeModal.posting?.productionQty || 0}{' '}
              {completeModal.posting?.outputs.find((o) => o.outputType === 'SFG')?.unit || completeModal.posting?.productionUnit || 'KG'}
            </div>
          </div>

          {/* Byproduct Input */}
          <div className="rounded-lg border border-amber-500/20 bg-amber-50/30 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Recycle size={14} className="text-amber-600" />
              <span className="text-sm font-semibold text-amber-700">Byproduct</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <div className="text-xs text-muted-foreground mb-1">Quantity</div>
                <InputNumber
                  min={0}
                  step={0.01}
                  precision={3}
                  value={completeModal.byproductQty}
                  onChange={(val) => setCompleteModal((p) => ({ ...p, byproductQty: val || 0 }))}
                  style={{ width: '100%' }}
                />
              </div>
              <div className="col-span-1">
                <div className="text-xs text-muted-foreground mb-1">Unit</div>
                <Select
                  value={completeModal.byproductUnit}
                  onChange={(val) => setCompleteModal((p) => ({ ...p, byproductUnit: val }))}
                  style={{ width: '100%' }}
                >
                  {unitOptions.map((u) => (
                    <Option key={u} value={u}>{u}</Option>
                  ))}
                </Select>
              </div>
              <div className="col-span-1">
                <div className="text-xs text-muted-foreground mb-1">Name</div>
                <Input
                  value={completeModal.byproductName}
                  onChange={(e) => setCompleteModal((p) => ({ ...p, byproductName: e.target.value }))}
                  placeholder="Byproduct"
                />
              </div>
            </div>
          </div>

          {/* Scrap Input */}
          <div className="rounded-lg border border-red-500/20 bg-red-50/30 p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={14} className="text-red-600" />
              <span className="text-sm font-semibold text-red-700">Scrap / Wastage</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <div className="text-xs text-muted-foreground mb-1">Quantity</div>
                <InputNumber
                  min={0}
                  step={0.01}
                  precision={3}
                  value={completeModal.scrapQty}
                  onChange={(val) => setCompleteModal((p) => ({ ...p, scrapQty: val || 0 }))}
                  style={{ width: '100%' }}
                />
              </div>
              <div className="col-span-1">
                <div className="text-xs text-muted-foreground mb-1">Unit</div>
                <Select
                  value={completeModal.scrapUnit}
                  onChange={(val) => setCompleteModal((p) => ({ ...p, scrapUnit: val }))}
                  style={{ width: '100%' }}
                >
                  {unitOptions.map((u) => (
                    <Option key={u} value={u}>{u}</Option>
                  ))}
                </Select>
              </div>
              <div className="col-span-1">
                <div className="text-xs text-muted-foreground mb-1">Name</div>
                <Input
                  value={completeModal.scrapName}
                  onChange={(e) => setCompleteModal((p) => ({ ...p, scrapName: e.target.value }))}
                  placeholder="Scrap"
                />
              </div>
            </div>
          </div>

          {/* Net SFG Calculation */}
          {(() => {
            const { total, unit, net } = getNetSfgInModal();
            return (
              <div className="rounded-xl border-2 border-emerald-500/30 bg-emerald-50/40 p-4">
                <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">
                  Net SFG Output (after deductions)
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-emerald-600">{net}</span>
                  <span className="text-lg text-emerald-500 font-semibold">{unit}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  = {total} {unit} (total) — {completeModal.byproductQty || 0} {completeModal.byproductUnit} (byproduct) — {completeModal.scrapQty || 0} {completeModal.scrapUnit} (scrap)
                </div>
              </div>
            );
          })()}

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button onClick={() => setCompleteModal((p) => ({ ...p, visible: false }))}>Cancel</Button>
            <Button
              type="primary"
              loading={completeModal.loading}
              onClick={handleCompleteProduction}
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', fontWeight: 600 }}
            >
              <CheckCircle size={12} className="mr-1 inline" /> Complete Production
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProductionEntry;
