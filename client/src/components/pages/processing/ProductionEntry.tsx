import React, { useEffect, useState, useMemo } from 'react';
import api, { API_ROUTES } from '../../../utils/api';
import { Button, Input, Select, message } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Factory,
  Package,
  ChevronDown,
  ChevronRight,
  Layers,
  CheckCircle,
  PlusCircle,
  Trash2,
  FlaskConical,
  Recycle,
  AlertTriangle,
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

interface BOMItem {
  id: string;
  rawMaterialId: string;
  quantity: number;
  unit: string;
  rawMaterial: { id: string; name: string; skuCode: string; unitOfMeasurement: string };
}

interface BOM {
  id: string;
  bomCode: string;
  productName: string;
  unitOfMeasurement: string;
  outputQuantity: number;
  items: BOMItem[];
}

interface ConsumptionLine {
  rawMaterialId: string;
  rawMaterialName: string;
  skuCode: string;
  expectedQuantity: number;
  actualQuantity: number;
  unit: string;
  batchNumber: string;
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
  const [selectedBom, setSelectedBom] = useState<BOM | null>(null);
  const [bomLoading, setBomLoading] = useState(false);
  const [shiftDate, setShiftDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [consumptionLines, setConsumptionLines] = useState<ConsumptionLine[]>([]);
  const [outputLines, setOutputLines] = useState<OutputLine[]>([]);
  const [submitting, setSubmitting] = useState(false);

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
      // Filter SFG category products
      const allProducts = prodRes.data || [];
      setSfgProducts(allProducts.filter((p: SFGProduct) => p.category === 'SFG' || p.category === 'SEMI_FINISHED'));
      // If no SFG category, show all so the user can at least select
      if (allProducts.filter((p: SFGProduct) => p.category === 'SFG' || p.category === 'SEMI_FINISHED').length === 0) {
        setSfgProducts(allProducts);
      }
      setPostings(postRes.data?.data || []);
    } catch {
      message.error('Failed to fetch data');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // When SFG product is selected → fetch BOM
  const handleSfgSelect = async (productId: string) => {
    setSelectedSfgId(productId);
    setSelectedBom(null);
    setConsumptionLines([]);
    setBomLoading(true);
    try {
      const res = await api.get(API_ROUTES.RAW.GET_BOM_BY_SFG(productId));
      const bom: BOM = res.data;
      setSelectedBom(bom);
      // Pre-fill consumption lines from BOM items
      setConsumptionLines(
        bom.items.map((item) => ({
          rawMaterialId: item.rawMaterial.id,
          rawMaterialName: item.rawMaterial.name,
          skuCode: item.rawMaterial.skuCode,
          expectedQuantity: item.quantity,
          actualQuantity: item.quantity,
          unit: item.unit || item.rawMaterial.unitOfMeasurement,
          batchNumber: '',
        }))
      );
      // Pre-fill SFG output
      const sfg = sfgProducts.find((p) => p.id === productId);
      setOutputLines([
        {
          outputType: 'SFG',
          productName: bom.productName || sfg?.name || '',
          skuCode: sfg?.skuCode || '',
          quantity: bom.outputQuantity || 0,
          unit: bom.unitOfMeasurement || sfg?.unitOfMeasurement || 'kg',
          batchNumber: '',
        },
      ]);
    } catch {
      message.warning('No active BOM found for this SFG. You can still enter data manually.');
      setConsumptionLines([]);
      const sfg = sfgProducts.find((p) => p.id === productId);
      setOutputLines([
        {
          outputType: 'SFG',
          productName: sfg?.name || '',
          skuCode: sfg?.skuCode || '',
          quantity: 0,
          unit: sfg?.unitOfMeasurement || 'kg',
          batchNumber: '',
        },
      ]);
    }
    setBomLoading(false);
  };

  // Update consumption line
  const updateConsumption = (index: number, field: string, value: any) => {
    setConsumptionLines((prev) => {
      const lines = [...prev];
      (lines[index] as any)[field] = value;
      return lines;
    });
  };

  // Add / update / remove output lines
  const addOutputLine = (type: 'BYPRODUCT' | 'SCRAP') => {
    setOutputLines((prev) => [
      ...prev,
      { outputType: type, productName: '', skuCode: '', quantity: 0, unit: 'kg', batchNumber: '' },
    ]);
  };

  const updateOutput = (index: number, field: string, value: any) => {
    setOutputLines((prev) => {
      const lines = [...prev];
      (lines[index] as any)[field] = value;
      return lines;
    });
  };

  const removeOutput = (index: number) => {
    setOutputLines((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit production posting
  const handleSubmit = async () => {
    if (!selectedLocationId) {
      message.error('Select a grinding location');
      return;
    }
    if (!selectedSfgId) {
      message.error('Select an SFG product');
      return;
    }
    if (consumptionLines.length === 0) {
      message.error('Add at least one raw material consumption');
      return;
    }
    const sfgOutputs = outputLines.filter((o) => o.outputType === 'SFG' && o.quantity > 0);
    if (sfgOutputs.length === 0) {
      message.error('At least one SFG output with quantity > 0 is required');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(API_ROUTES.RAW.POST_PRODUCTION, {
        sfgProductId: selectedSfgId,
        bomId: selectedBom?.id || 'manual',
        locationId: selectedLocationId,
        shiftDate,
        notes,
        consumptions: consumptionLines.map((c) => ({
          rawMaterialId: c.rawMaterialId,
          expectedQuantity: c.expectedQuantity,
          actualQuantity: c.actualQuantity,
          batchNumber: c.batchNumber || null,
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
    setShiftDate(new Date().toISOString().slice(0, 10));
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
          {formVisible ? 'Cancel' : 'New Production Posting'}
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
                    onChange={(val) => setSelectedLocationId(val)}
                  >
                    {grindingLocations.map((l) => (
                      <Option key={l.id} value={l.id}>
                        {l.name}
                      </Option>
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
                      <Option key={p.id} value={p.id}>
                        {p.name} ({p.skuCode})
                      </Option>
                    ))}
                  </Select>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1 font-medium">Shift Date *</div>
                  <Input
                    type="date"
                    value={shiftDate}
                    onChange={(e) => setShiftDate(e.target.value)}
                  />
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
                    Output: {selectedBom.outputQuantity} {selectedBom.unitOfMeasurement} &middot; {selectedBom.items.length} raw material{selectedBom.items.length !== 1 ? 's' : ''}
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
                          <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">Expected</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase w-28">Actual</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase w-28">Batch #</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {consumptionLines.map((line, idx) => (
                          <tr key={idx} className="hover:bg-muted/30">
                            <td className="px-3 py-2 text-sm">
                              <div className="font-medium text-foreground">{line.rawMaterialName}</div>
                              <div className="text-xs text-muted-foreground font-mono">{line.skuCode}</div>
                            </td>
                            <td className="px-3 py-2 text-sm text-right text-muted-foreground">
                              {line.expectedQuantity} {line.unit}
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                type="number"
                                min={0}
                                step={0.01}
                                value={line.actualQuantity}
                                onChange={(e) => updateConsumption(idx, 'actualQuantity', Number(e.target.value))}
                                size="small"
                                style={{ width: 100, textAlign: 'right' }}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                value={line.batchNumber}
                                onChange={(e) => updateConsumption(idx, 'batchNumber', e.target.value)}
                                size="small"
                                placeholder="Optional"
                                style={{ width: 100 }}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── Outputs ── */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">Production Output</span>
                  <div className="flex-1 h-px bg-border" />
                  <Button
                    type="dashed"
                    size="small"
                    onClick={() => addOutputLine('BYPRODUCT')}
                    className="text-xs"
                  >
                    + Byproduct
                  </Button>
                  <Button
                    type="dashed"
                    size="small"
                    onClick={() => addOutputLine('SCRAP')}
                    className="text-xs"
                  >
                    + Scrap
                  </Button>
                </div>

                <div className="space-y-2">
                  {outputLines.map((line, idx) => (
                    <div
                      key={idx}
                      className="flex items-end gap-2 p-3 rounded-lg border bg-muted/10"
                      style={{
                        borderColor:
                          line.outputType === 'SFG'
                            ? 'rgba(16, 185, 129, 0.3)'
                            : line.outputType === 'BYPRODUCT'
                            ? 'rgba(245, 158, 11, 0.3)'
                            : 'rgba(239, 68, 68, 0.3)',
                      }}
                    >
                      <div className="w-20">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${outputTypeColors[line.outputType]}`}
                        >
                          {outputTypeIcons[line.outputType]} {line.outputType}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground mb-0.5">Product Name</div>
                        <Input
                          value={line.productName}
                          onChange={(e) => updateOutput(idx, 'productName', e.target.value)}
                          size="small"
                          disabled={line.outputType === 'SFG'}
                        />
                      </div>
                      <div className="w-24">
                        <div className="text-xs text-muted-foreground mb-0.5">SKU</div>
                        <Input
                          value={line.skuCode}
                          onChange={(e) => updateOutput(idx, 'skuCode', e.target.value)}
                          size="small"
                          disabled={line.outputType === 'SFG'}
                        />
                      </div>
                      <div className="w-20">
                        <div className="text-xs text-muted-foreground mb-0.5">Qty *</div>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={line.quantity || ''}
                          onChange={(e) => updateOutput(idx, 'quantity', Number(e.target.value))}
                          size="small"
                        />
                      </div>
                      <div className="w-16">
                        <div className="text-xs text-muted-foreground mb-0.5">Unit</div>
                        <Input
                          value={line.unit}
                          onChange={(e) => updateOutput(idx, 'unit', e.target.value)}
                          size="small"
                        />
                      </div>
                      <div className="w-24">
                        <div className="text-xs text-muted-foreground mb-0.5">Batch #</div>
                        <Input
                          value={line.batchNumber}
                          onChange={(e) => updateOutput(idx, 'batchNumber', e.target.value)}
                          size="small"
                          placeholder="Optional"
                        />
                      </div>
                      {line.outputType !== 'SFG' && (
                        <Button
                          danger
                          size="small"
                          icon={<Trash2 size={12} />}
                          onClick={() => removeOutput(idx)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <div className="text-xs text-muted-foreground mb-1 font-medium">Notes (optional)</div>
                <TextArea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Shift notes, observations..."
                />
              </div>

              {/* Submit */}
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
          postings.map((posting) => (
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
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Factory size={16} className="text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold font-mono text-primary">{posting.postingNumber}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Shift: {new Date(posting.shiftDate).toLocaleDateString()} &middot; {posting.consumptions.length} input{posting.consumptions.length !== 1 ? 's' : ''} &middot; {posting.outputs.length} output{posting.outputs.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
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
          ))}
      </div>
    </div>
  );
};

export default ProductionEntry;
