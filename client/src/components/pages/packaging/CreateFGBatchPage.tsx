import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { API_ROUTES } from '../../../utils/api';
import { Button, Select, Input, InputNumber, message, Tooltip } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Layers,
  Zap,
  Database,
  Truck,
  Hash,
  Scale,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

const { Option } = Select;

/* ─── Unit Conversion Helpers ─── */
const UNIT_TO_GRAMS: Record<string, number> = {
  gram: 1, grams: 1, g: 1,
  kg: 1000, KG: 1000, Kg: 1000,
  ton: 1_000_000, Ton: 1_000_000, TON: 1_000_000,
  quintal: 100_000, Quintal: 100_000,
};

function toGrams(qty: number, unit: string): number {
  const factor = UNIT_TO_GRAMS[unit] ?? UNIT_TO_GRAMS[unit.toLowerCase()] ?? 1;
  return qty * factor;
}

/* ─── Types ─── */
interface BOM {
  id: string;
  bomCode: string;
  productName: string;
  unitOfMeasurement: string;
  outputQuantity: number;
  items: {
    id: string;
    rawMaterialId: string;
    quantity: number;
    unitOfMeasurement: string;
    rawMaterial: {
      id: string;
      name: string;
      skuCode: string;
      category: string;
      unitOfMeasurement: string;
    };
  }[];
}

interface AvailableSfgBatch {
  transferId: string;
  transferNumber: string;
  batchNumber: string;
  dispatchId: string;
  lineId: string;
  totalQuantity: number;
  consumedQuantity: number;
  remainingQuantity: number;
  unit: string;
  fromLocation: string;
  toLocation: string;
  acceptedAt: string;
}

interface BOMItemData {
  bomItemId: string;
  rawMaterialId: string;
  rawMaterialName: string;
  skuCode: string;
  category: string;
  isSFG: boolean;
  bomQuantity: number;
  bomUnit: string;
  expectedQuantity: number;
  displayUnit: string;
  availableSfgBatches: AvailableSfgBatch[];
  currentStockQty: number;
  currentStockUnit: string;
}

interface ConsumptionLine {
  rawMaterialId: string;
  rawMaterialName: string;
  skuCode: string;
  isSFG: boolean;
  expectedQuantity: number;
  actualQuantity: number;
  unit: string;
  sourceType: 'SFG_BATCH' | 'STOCK';
  batchNumber: string;
  dispatchId: string;
  availableSfgBatches: AvailableSfgBatch[];
  currentStockQty: number;
  currentStockUnit: string;
}

const CreateFGBatchPage: React.FC = () => {
  const navigate = useNavigate();
  const [boms, setBoms] = useState<BOM[]>([]);
  const [loadingBoms, setLoadingBoms] = useState(false);

  const [selectedBomId, setSelectedBomId] = useState('');
  const [productionQty, setProductionQty] = useState<number | null>(null);
  const [productionUnit, setProductionUnit] = useState('KG');
  const [packetSize, setPacketSize] = useState<number | null>(null);
  const [packetUnit, setPacketUnit] = useState('gram');
  const [cartonCapacity, setCartonCapacity] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [consumptionLines, setConsumptionLines] = useState<ConsumptionLine[]>([]);
  const [bomItemsLoading, setBomItemsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const unitOptions = ['gram', 'KG', 'Ton', 'Quintal'];

  useEffect(() => {
    const fetchBoms = async () => {
      setLoadingBoms(true);
      try {
        const res = await api.get(API_ROUTES.RAW.GET_FG_BOMS);
        setBoms(res.data?.data || []);
      } catch (err) {
        message.error('Failed to load FG BOMs');
      }
      setLoadingBoms(false);
    };
    fetchBoms();
  }, []);

  const selectedBom = boms.find(b => b.id === selectedBomId);

  // Calculate packets on the fly
  const calculatedPackets = (() => {
    if (!productionQty || !packetSize || packetSize <= 0) return 0;
    const prodInGrams = toGrams(productionQty, productionUnit);
    const packetInGrams = toGrams(packetSize, packetUnit);
    if (packetInGrams <= 0) return 0;
    return Math.floor(prodInGrams / packetInGrams);
  })();

  // Calculate cartons on the fly
  const calculatedCartons = (() => {
    if (calculatedPackets <= 0 || !cartonCapacity || cartonCapacity <= 0) return 0;
    return Math.ceil(calculatedPackets / cartonCapacity);
  })();

  const fetchBomItems = useCallback(async (bomId: string, qty: number, unit: string) => {
    if (!bomId || !qty || qty <= 0) return;
    setBomItemsLoading(true);
    try {
      const res = await api.get(API_ROUTES.RAW.GET_FG_BOM_ITEMS, {
        params: { bomId, productionQty: qty, productionUnit: unit },
      });
      const items: BOMItemData[] = res.data?.items || [];
      const lines: ConsumptionLine[] = items.map(item => ({
        rawMaterialId: item.rawMaterialId,
        rawMaterialName: item.rawMaterialName,
        skuCode: item.skuCode,
        isSFG: item.isSFG,
        expectedQuantity: item.expectedQuantity,
        actualQuantity: item.expectedQuantity,
        unit: item.displayUnit,
        sourceType: item.isSFG ? 'SFG_BATCH' : 'STOCK',
        batchNumber: item.isSFG && item.availableSfgBatches.length > 0
          ? item.availableSfgBatches[0].batchNumber : '',
        dispatchId: item.isSFG && item.availableSfgBatches.length > 0
          ? item.availableSfgBatches[0].dispatchId : '',
        availableSfgBatches: item.availableSfgBatches,
        currentStockQty: item.currentStockQty,
        currentStockUnit: item.currentStockUnit,
      }));
      setConsumptionLines(lines);
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to fetch BOM items');
    }
    setBomItemsLoading(false);
  }, []);

  const handleBomSelect = (bomId: string) => {
    setSelectedBomId(bomId);
    setConsumptionLines([]);
    setProductionQty(null);
    const bom = boms.find(b => b.id === bomId);
    if (bom) {
      setProductionUnit(bom.unitOfMeasurement || 'KG');
    }
  };

  const handleProductionQtyChange = (value: number | null) => {
    setProductionQty(value);
    if (value && value > 0 && selectedBomId) {
      fetchBomItems(selectedBomId, value, productionUnit);
    } else {
      setConsumptionLines([]);
    }
  };

  const handleProductionUnitChange = (unit: string) => {
    setProductionUnit(unit);
    if (productionQty && productionQty > 0 && selectedBomId) {
      fetchBomItems(selectedBomId, productionQty, unit);
    }
  };

  const updateConsumption = (index: number, field: string, value: any) => {
    setConsumptionLines(prev => {
      const lines = [...prev];
      (lines[index] as any)[field] = value;
      return lines;
    });
  };

  const handleSubmit = async () => {
    if (!selectedBomId) { message.error('Select an FG item (BOM)'); return; }
    if (!productionQty || productionQty <= 0) { message.error('Enter production quantity'); return; }
    if (consumptionLines.length === 0) { message.error('No BOM items loaded'); return; }

    // Validate availability
    for (const line of consumptionLines) {
      if (line.sourceType === 'SFG_BATCH') {
        if (line.availableSfgBatches.length === 0) {
          message.error(`No incoming SFG transfer available for ${line.rawMaterialName}`);
          return;
        }
        if (!line.batchNumber) {
          message.error(`Select a transfer batch for ${line.rawMaterialName}`);
          return;
        }
        // Check allocation against selected batch remaining
        const selectedBatch = line.availableSfgBatches.find(b => b.batchNumber === line.batchNumber);
        if (selectedBatch && line.actualQuantity > selectedBatch.remainingQuantity) {
          message.error(`Allocated quantity (${line.actualQuantity}) exceeds available (${selectedBatch.remainingQuantity}) in transfer ${line.batchNumber}`);
          return;
        }
      } else {
        if (line.currentStockQty <= 0 || line.actualQuantity > line.currentStockQty) {
          message.error(`Insufficient stock for ${line.rawMaterialName}. Available: ${line.currentStockQty} ${line.currentStockUnit}`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      await api.post(API_ROUTES.RAW.CREATE_FG_BATCH, {
        bomId: selectedBomId,
        productionQty,
        productionUnit,
        packetSize: packetSize || null,
        packetUnit: packetUnit || null,
        cartonCapacity: cartonCapacity || null,
        notes,
        consumptions: consumptionLines.map(c => ({
          rawMaterialId: c.rawMaterialId,
          rawMaterialName: c.rawMaterialName,
          expectedQuantity: c.expectedQuantity,
          actualQuantity: c.actualQuantity,
          unit: c.unit,
          sourceType: c.sourceType,
          batchNumber: c.batchNumber || null,
          dispatchId: c.dispatchId || null,
        })),
      });
      message.success('FG Batch created successfully!');
      navigate('/packaging/material-transfer');
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to create FG Batch');
    }
    setSubmitting(false);
  };

  return (
    <motion.div className="min-h-screen bg-background p-4 md:p-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            icon={<ArrowLeft size={18} />}
            onClick={() => navigate('/packaging/material-transfer')}
            className="rounded-full shadow-sm hover:shadow-md transition-shadow"
            size="large"
          />
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              Create FG Batch
            </h1>
            <p className="text-muted-foreground">Setup raw material requirements and package sizing</p>
          </div>
        </div>

        <motion.div
          className="bg-card rounded-2xl border border-border/80 shadow-xl overflow-hidden p-6 md:p-8 space-y-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {/* Step 1: Select FG Item (BOM) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <div className="bg-violet-100 dark:bg-violet-500/20 p-2 rounded-lg">
                <Layers size={18} className="text-violet-600 dark:text-violet-400" />
              </div>
              <h2 className="text-lg font-bold">1. Select Finished Good (BOM)</h2>
            </div>
            <Select
              style={{ width: '100%' }}
              placeholder="Search and select a finished good product"
              size="large"
              value={selectedBomId || undefined}
              onChange={handleBomSelect}
              showSearch
              loading={loadingBoms}
              filterOption={(input, option) => (option?.children?.toString() || '').toLowerCase().includes(input.toLowerCase())}
              className="mt-2"
            >
              {boms.map(bom => (
                <Option key={bom.id} value={bom.id}>
                  {bom.productName} — {bom.bomCode} (Batch: {bom.outputQuantity} {bom.unitOfMeasurement})
                </Option>
              ))}
            </Select>

            {/* BOM Info */}
            {selectedBom && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 flex items-center gap-4"
              >
                <div className="p-3 bg-white dark:bg-black rounded-lg shadow-sm border border-violet-500/10">
                  <Package className="text-violet-600 w-6 h-6" />
                </div>
                <div>
                  <div className="font-semibold text-violet-700 text-lg">{selectedBom.productName}</div>
                  <div className="text-sm text-muted-foreground font-medium flex items-center gap-2 mt-1">
                    <span className="bg-violet-500/10 text-violet-600 px-2 flex py-0.5 rounded">Code: {selectedBom.bomCode}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Step 2: Production Quantity + Packet Info */}
          {selectedBomId && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <div className="bg-indigo-100 dark:bg-indigo-500/20 p-2 rounded-lg">
                  <Zap size={18} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-lg font-bold">2. Target Production & Packaging</h2>
              </div>

              <div className="bg-gradient-to-br from-indigo-50/50 to-indigo-100/30 dark:from-indigo-950/20 dark:to-indigo-900/10 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-500/20 shadow-inner">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Production quantity */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground flex items-center gap-2">
                      Total Output Quantity <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <InputNumber
                        style={{ width: '100%' }}
                        min={0.001}
                        step={0.1}
                        precision={3}
                        value={productionQty}
                        onChange={handleProductionQtyChange}
                        placeholder="e.g. 5.5"
                        size="large"
                        className="font-semibold"
                      />
                      <Select
                        style={{ width: 120 }}
                        value={productionUnit}
                        onChange={handleProductionUnitChange}
                        size="large"
                      >
                        {unitOptions.map(u => (
                          <Option key={u} value={u}>{u}</Option>
                        ))}
                      </Select>
                    </div>
                    <p className="text-xs text-muted-foreground pt-1">The system will dynamically calculate material demands based on this target.</p>
                  </div>

                  {/* Packet size */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground">
                      Packet Sizing 
                    </label>
                    <div className="flex gap-2">
                      <InputNumber
                        style={{ width: '100%' }}
                        min={0.001}
                        step={1}
                        precision={2}
                        value={packetSize}
                        onChange={v => setPacketSize(v)}
                        placeholder="e.g. 5"
                        size="large"
                      />
                      <Select
                        style={{ width: 120 }}
                        value={packetUnit}
                        onChange={v => setPacketUnit(v)}
                        size="large"
                      >
                        {unitOptions.map(u => (
                          <Option key={u} value={u}>{u}</Option>
                        ))}
                      </Select>
                    </div>
                    <p className="text-xs text-muted-foreground pt-1">Will be used to estimate number of items to package.</p>
                  </div>
                  
                  {/* Carton capacity */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground">
                      Carton Capacity
                    </label>
                    <InputNumber
                      style={{ width: '100%' }}
                      min={1}
                      step={1}
                      precision={0}
                      value={cartonCapacity}
                      onChange={v => setCartonCapacity(v)}
                      placeholder="Packets per carton, e.g. 100"
                      size="large"
                    />
                    <p className="text-xs text-muted-foreground pt-1">Will be used to estimate total cartons required.</p>
                  </div>
                </div>

                {/* Packet Calculation Display */}
                <AnimatePresence>
                  {productionQty && productionQty > 0 && packetSize && packetSize > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 p-5 text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-all duration-700"></div>
                        <div className="flex items-center justify-between relative z-10">
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-4">
                              <div className="p-3 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20">
                                <Hash size={24} className="text-white" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-white/80 tracking-widest uppercase mb-1">Estimated Packets</div>
                                <div className="text-4xl font-black">{calculatedPackets.toLocaleString()}</div>
                              </div>
                            </div>
                            
                            {cartonCapacity && cartonCapacity > 0 && (
                              <div className="flex items-center gap-4 border-l border-white/20 pl-6">
                                <div className="p-3 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20">
                                  <Package size={24} className="text-white" />
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-white/80 tracking-widest uppercase mb-1">Total Cartons</div>
                                  <div className="text-4xl font-black text-amber-300">{calculatedCartons.toLocaleString()}</div>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="text-right flex flex-col items-end gap-1">
                            <div className="bg-white/15 backdrop-blur-sm px-3 py-1 rounded-md text-sm border border-white/10">
                              Output: <span className="font-bold text-white">{productionQty} {productionUnit}</span>
                            </div>
                            <div className="bg-white/15 backdrop-blur-sm px-3 py-1 rounded-md text-sm border border-white/10">
                              Size: <span className="font-bold text-white">{packetSize} {packetUnit}</span> / ea
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {bomItemsLoading && (
                <div className="flex items-center gap-3 text-indigo-600 mt-4 p-4 bg-indigo-50/50 rounded-xl">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-5 h-5 border-[3px] rounded-full border-t-indigo-600 border-indigo-200"
                  />
                  <span className="font-bold animate-pulse">Computing material requirements...</span>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 3: Material Requirements Table */}
          {consumptionLines.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 border-b border-border pb-2 pt-4">
                <div className="bg-amber-100 dark:bg-amber-500/20 p-2 rounded-lg">
                  <Scale size={18} className="text-amber-600 dark:text-amber-400" />
                </div>
                <h2 className="text-lg font-bold text-amber-600 dark:text-amber-500">3. Material Consumption Allocation</h2>
              </div>

              <div className="rounded-xl border border-border shadow-sm overflow-hidden bg-card">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-muted/60 border-b border-border">
                      <tr>
                        <th className="px-5 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Raw Material</th>
                        <th className="px-5 py-4 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider w-24">Source</th>
                        <th className="px-5 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Requirement</th>
                        <th className="px-5 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          {consumptionLines.some(l => l.sourceType === 'SFG_BATCH') ? 'Est. Availability' : 'Available'}
                        </th>
                        <th className="px-5 py-4 text-right text-xs font-bold text-violet-600 uppercase tracking-wider w-40 bg-violet-50/30">Allocate Amount *</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {consumptionLines.map((line, idx) => {
                        const isInsufficient = line.sourceType === 'STOCK'
                          ? (line.currentStockQty <= 0 || line.actualQuantity > line.currentStockQty)
                          : line.availableSfgBatches.length === 0;

                        return (
                          <React.Fragment key={idx}>
                            <tr className={`transition-colors ${isInsufficient ? 'bg-red-500/5 hover:bg-red-500/10' : 'hover:bg-muted/30'}`}>
                              <td className="px-5 py-4">
                                <div className="font-bold text-foreground text-[15px]">{line.rawMaterialName}</div>
                                <div className="text-xs text-muted-foreground font-mono mt-0.5">{line.skuCode}</div>
                              </td>
                              <td className="px-5 py-4 text-center">
                                {line.sourceType === 'SFG_BATCH' ? (
                                  <Tooltip title="Sourced from accepted SFG warehouse transfer">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-black tracking-wide border bg-purple-500/10 text-purple-600 border-purple-500/20">
                                      <Truck size={12} /> SFG
                                    </span>
                                  </Tooltip>
                                ) : (
                                  <Tooltip title={`Available: ${line.currentStockQty} ${line.currentStockUnit}`}>
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-black tracking-wide border bg-cyan-500/10 text-cyan-700 border-cyan-500/20">
                                      <Database size={12} /> STOCK
                                    </span>
                                  </Tooltip>
                                )}
                              </td>
                              <td className="px-5 py-4 text-right">
                                <div className="flex items-baseline justify-end gap-1.5">
                                  <span className="font-bold text-violet-600 text-[15px]">{line.expectedQuantity}</span>
                                  <span className="text-xs font-bold text-violet-600/70">{line.unit}</span>
                                </div>
                              </td>
                              <td className="px-5 py-4 text-right">
                                {line.sourceType === 'SFG_BATCH' ? (
                                  line.availableSfgBatches.length > 0 ? (
                                    <div>
                                      <div className="flex items-baseline justify-end gap-1.5">
                                        <span className="font-bold text-emerald-600 text-[15px]">
                                          {line.availableSfgBatches.reduce((s, b) => s + b.remainingQuantity, 0).toFixed(3)}
                                        </span>
                                        <span className="text-xs font-bold text-emerald-600/70">
                                          {line.availableSfgBatches[0]?.unit}
                                        </span>
                                      </div>
                                      <div className="text-[10px] text-emerald-600/70 font-semibold mt-1">
                                        Over {line.availableSfgBatches.length} transfer(s)
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="font-bold text-red-500 bg-red-100 px-2 py-1 rounded text-xs">NO INCOMING</span>
                                  )
                                ) : (
                                  <div className="flex items-baseline justify-end gap-1.5">
                                    <span className={`font-bold text-[15px] ${line.currentStockQty > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                      {line.currentStockQty}
                                    </span>
                                    <span className={`text-xs font-bold ${line.currentStockQty > 0 ? 'text-emerald-600/70' : 'text-red-500/70'}`}>
                                      {line.currentStockUnit}
                                    </span>
                                  </div>
                                )}
                              </td>
                              <td className="px-5 py-4 bg-violet-50/20 align-middle">
                                <div className="flex items-center justify-end gap-2">
                                  <InputNumber
                                    min={0}
                                    step={0.01}
                                    precision={3}
                                    value={line.actualQuantity}
                                    onChange={val => updateConsumption(idx, 'actualQuantity', val || 0)}
                                    size="large"
                                    className={`w-28 font-semibold shadow-sm ${isInsufficient ? 'border-red-400' : 'border-border focus:border-violet-500'}`}
                                  />
                                  <span className="text-sm font-bold text-violet-600/80 w-8 text-left">
                                    {line.unit}
                                  </span>
                                </div>
                              </td>
                            </tr>

                            {/* SFG Incoming Transfer Batch Selection */}
                            {line.sourceType === 'SFG_BATCH' && (
                              <tr className="bg-purple-50/30 dark:bg-purple-900/10">
                                <td colSpan={5} className="px-5 py-4 border-b border-border/50">
                                  <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 text-purple-600 font-semibold whitespace-nowrap text-sm">
                                      <ArrowRight size={14} className="opacity-50" />
                                      <Truck size={16} />
                                      Source Transfer:
                                    </div>

                                    <div className="flex-1 max-w-2xl">
                                      {line.availableSfgBatches.length > 0 ? (
                                        <Select
                                          style={{ width: '100%' }}
                                          size="large"
                                          placeholder="Select an accepted transfer batch"
                                          value={line.batchNumber || undefined}
                                          onChange={(val) => {
                                            const selectedBatch = line.availableSfgBatches.find(b => b.batchNumber === val);
                                            if (selectedBatch) {
                                              updateConsumption(idx, 'batchNumber', selectedBatch.batchNumber);
                                              updateConsumption(idx, 'dispatchId', selectedBatch.dispatchId);
                                            }
                                          }}
                                        >
                                          {line.availableSfgBatches.map((batch) => (
                                            <Option key={batch.lineId} value={batch.batchNumber}>
                                              <div className="flex justify-between items-center w-full">
                                                <span className="font-mono font-medium">{batch.batchNumber}</span>
                                                <span className="text-emerald-600 font-semibold">
                                                  {batch.remainingQuantity} {batch.unit} available
                                                </span>
                                              </div>
                                            </Option>
                                          ))}
                                        </Select>
                                      ) : (
                                        <div className="text-red-500 font-medium text-sm flex items-center gap-2">
                                          <div className="w-2 h-2 rounded-full bg-red-500" />
                                          No incoming SFG material transfers accepted in the warehouse. Cannot fulfill.
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Notes and Submit */}
          <div className="pt-4 border-t border-border">
            <div className="space-y-2 mb-8">
              <label className="text-sm font-bold text-foreground">Production Remarks (optional)</label>
              <Input.TextArea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add any specific notes about this batch..."
                autoSize={{ minRows: 2, maxRows: 6 }}
                className="rounded-xl p-3 border-border bg-muted/30 focus:bg-background transition-colors"
                size="large"
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button size="large" onClick={() => navigate('/packaging/material-transfer')} className="rounded-xl px-6 h-12 font-medium">
                Cancel
              </Button>
              <Button
                size="large"
                type="primary"
                loading={submitting}
                onClick={handleSubmit}
                disabled={!selectedBomId || !productionQty || consumptionLines.length === 0}
                className="rounded-xl shadow-lg shadow-violet-500/30 px-8 h-12 text-base font-bold transition-all hover:scale-105 active:scale-95 border-0"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}
              >
                {!submitting && <Package className="w-5 h-5 mr-2" />}
                Confirm & Create Batch
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default CreateFGBatchPage;
