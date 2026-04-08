import React, { useEffect, useState } from 'react';
import api, { API_ROUTES } from '../../../utils/api';
import { Button, message, Modal, Select, InputNumber, Input, Checkbox, Tooltip } from 'antd';
import { Plus, Package, Truck, Calendar, Loader2, ArrowRight, Warehouse, MapPin, Scale, Check, FileText, ChevronDown, ChevronUp, Info, Boxes, ArrowDownRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const { Option } = Select;

interface SfgStockItem {
  rawMaterialId: string;
  productName: string;
  skuCode: string;
  unit: string;
  totalAvailableQty: number;
  totalAvailableBags: number;
  warehouseLocation: string;
  warehouseLocationId: string;
  batches: {
    sourceTransferId: string;
    sourceTransferNumber: string;
    batchNumber: string;
    acceptedAt: string | null;
    unit: string;
    receivedQty: number;
    consumedByFGQty: number;
    transferredQty: number;
    availableQty: number;
    receivedBags: number;
    transferredBags: number;
    availableBags: number;
    bagSizeKg: number;
  }[];
}

interface TransferLine {
  id: string;
  productName: string;
  skuCode: string;
  quantity: number;
  unitOfMeasurement: string;
  numberOfBags?: number;
  transferredQuantity?: number;
  transferredUnit?: string;
  batchNumber?: string;
  bagSizeKg?: number;
  rawMaterialId?: string;
}

interface Transfer {
  id: string;
  transferNumber: string;
  fromLocation: { id: string; name: string };
  toLocation: { id: string; name: string };
  status: string;
  createdAt: string;
  lines: TransferLine[];
}

const MaterialTransferPage: React.FC = () => {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedTransferId, setExpandedTransferId] = useState<string | null>(null);

  // Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Form State
  const [locations, setLocations] = useState<any[]>([]);
  const [toLocationId, setToLocationId] = useState<string>('');

  // SFG Warehouse Stock
  const [sfgStock, setSfgStock] = useState<SfgStockItem[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState<SfgStockItem | null>(null);
  const [batchQuantities, setBatchQuantities] = useState<Record<string, number | null>>({});
  const [selectedBatches, setSelectedBatches] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState<string>('');

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const res = await api.get(API_ROUTES.RAW.GET_TRANSFERS, {
        params: { direction: 'SFG_TO_PRODUCTION' }
      });
      setTransfers(res.data?.data || []);
    } catch (e) {
      message.error('Failed to load transfers');
    }
    setLoading(false);
  };

  const fetchLocations = async () => {
    try {
      const res = await api.get(API_ROUTES.RAW.GET_LOCATIONS);
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setLocations(data);
    } catch (e) {
      message.error('Failed to load locations');
    }
  };

  const fetchSfgWarehouseStock = async () => {
    setLoadingStock(true);
    try {
      const res = await api.get(API_ROUTES.RAW.GET_SFG_WAREHOUSE_STOCK);
      setSfgStock(res.data?.data || []);
    } catch (e) {
      message.error('Failed to load SFG warehouse stock');
    }
    setLoadingStock(false);
  };

  useEffect(() => {
    fetchTransfers();
    fetchLocations();
  }, []);

  const openModal = () => {
    setIsModalVisible(true);
    fetchSfgWarehouseStock();
    setToLocationId('');
    setSelectedStockItem(null);
    setBatchQuantities({});
    setSelectedBatches(new Set());
    setNotes('');
    setCurrentStep(0);
  };

  const handleSelectStockItem = (itemKey: string) => {
    const item = sfgStock.find(s => `${s.rawMaterialId}__${s.warehouseLocationId}` === itemKey);
    setSelectedStockItem(item || null);
    if (!item) {
      setBatchQuantities({});
      setSelectedBatches(new Set());
      return;
    }
    const initialBatchQuantities: Record<string, number | null> = {};
    item.batches.forEach((b) => {
      initialBatchQuantities[b.batchNumber] = null;
    });
    setBatchQuantities(initialBatchQuantities);
    setSelectedBatches(new Set());
  };

  const handleToggleBatch = (batchNumber: string, checked: boolean) => {
    const newSet = new Set(selectedBatches);
    if (checked) {
      newSet.add(batchNumber);
    } else {
      newSet.delete(batchNumber);
      setBatchQuantities((prev) => ({ ...prev, [batchNumber]: null }));
    }
    setSelectedBatches(newSet);
  };

  const handleNext = () => {
    if (currentStep === 0 && !toLocationId) {
      return message.warning('Please select a destination location');
    }
    if (currentStep === 1 && !selectedStockItem) {
      return message.warning('Please select an SFG item');
    }
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const totalSelectedBags = selectedStockItem
    ? selectedStockItem.batches.reduce((sum, batch) => {
        if (selectedBatches.has(batch.batchNumber)) {
          return sum + Number(batchQuantities[batch.batchNumber] || 0);
        }
        return sum;
      }, 0)
    : 0;

  const totalSelectedKg = selectedStockItem
    ? selectedStockItem.batches.reduce((sum, batch) => {
        if (selectedBatches.has(batch.batchNumber)) {
          const bags = Number(batchQuantities[batch.batchNumber] || 0);
          const safeBagSizeKg = batch.bagSizeKg || 25;
          return sum + (bags * safeBagSizeKg);
        }
        return sum;
      }, 0)
    : 0;

  const handleBatchQtyChange = (batchNumber: string, value: number | null) => {
    setBatchQuantities((prev) => ({
      ...prev,
      [batchNumber]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!selectedStockItem || !toLocationId) {
      message.error('Please select an SFG item and destination');
      return;
    }

    const lineItems = selectedStockItem.batches
      .filter((batch) => selectedBatches.has(batch.batchNumber))
      .map((batch) => {
        const bags = Number(batchQuantities[batch.batchNumber] || 0);
        const safeBagSizeKg = batch.bagSizeKg || 25;
        // Always calculate quantity in KG: bags × bagSizeKg
        const qty = bags * safeBagSizeKg;
        
        const derivedAvailableBags = (typeof batch.availableBags === 'number' && !isNaN(batch.availableBags) && batch.availableBags > 0)
          ? batch.availableBags
          : Math.floor(
              ((selectedStockItem.unit.toLowerCase() === 'ton' || selectedStockItem.unit.toLowerCase() === 'mt') 
                ? batch.availableQty * 1000 
                : batch.availableQty) / safeBagSizeKg
            );

        return { batch, bags, qty, safeBagSizeKg, derivedAvailableBags };
      })
      .filter((x) => x.bags > 0);

    if (lineItems.length === 0) {
      message.error('Please enter transfer bags for at least one batch');
      return;
    }

    for (const { batch, bags, derivedAvailableBags } of lineItems) {
      if (bags > derivedAvailableBags) {
        message.error(`Batch ${batch.batchNumber}: max allowed is ${derivedAvailableBags} Bags`);
        return;
      }
    }

    setSubmitting(true);
    try {
      await api.post(API_ROUTES.RAW.CREATE_TRANSFER, {
        direction: 'SFG_TO_PRODUCTION',
        fromLocationId: selectedStockItem.warehouseLocationId,
        toLocationId,
        notes,
        lines: lineItems.map(({ batch, bags, qty, safeBagSizeKg }) => ({
          lineType: 'SFG',
          rawMaterialId: selectedStockItem.rawMaterialId,
          productName: selectedStockItem.productName,
          skuCode: selectedStockItem.skuCode,
          quantity: qty, // Always in KG
          transferredQuantity: qty,
          transferredUnit: 'KG',
          unitOfMeasurement: 'KG',
          batchNumber: batch.batchNumber,
          numberOfBags: bags,
          bagSizeKg: safeBagSizeKg,
        })),
      });

      message.success('Transfer created & source stock deducted successfully');
      setIsModalVisible(false);
      fetchTransfers();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to create transfer');
    }
    setSubmitting(false);
  };

  const statusBg: Record<string, string> = {
    SENT: 'bg-amber-50 text-amber-700 border-amber-200',
    ACCEPTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    REJECTED: 'bg-red-50 text-red-700 border-red-200',
  };

  const toggleExpand = (id: string) => {
    setExpandedTransferId(expandedTransferId === id ? null : id);
  };

  return (
    <motion.div className="p-6 md:p-8 space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
            <Truck className="text-violet-600" />
            SFG Material Transfer
          </h1>
          <p className="text-muted-foreground mt-1">Move Semi-Finished Goods from SFG Warehouse to Production Lines</p>
        </div>
        <Button 
          type="primary" 
          icon={<Plus size={16} />} 
          size="large"
          className="rounded-lg shadow-md"
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', border: 'none' }}
          onClick={openModal}
        >
          New Transfer
        </Button>
      </div>

      {/* ═══ Transfer Table ═══ */}
      <div className="bg-white dark:bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <Loader2 className="animate-spin text-violet-500" size={32} />
          </div>
        ) : transfers.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <Package className="mx-auto mb-4 text-muted-foreground/40" size={48} />
            <p className="text-lg font-semibold">No SFG transfers found</p>
            <p className="text-sm mt-1">Click "New Transfer" to move SFG stock to a production line</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-muted/30 dark:to-muted/20 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Transfer #</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">From</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">To</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Product</th>
                <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Bags</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Qty (KG)</th>
                <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Date</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transfers.map((t) => {
                const isExpanded = expandedTransferId === t.id;
                const totalBags = t.lines.reduce((s, l) => s + (l.numberOfBags || 0), 0);
                const totalQty = t.lines.reduce((s, l) => s + l.quantity, 0);
                const unit = t.lines[0]?.unitOfMeasurement || 'KG';
                const productNames = [...new Set(t.lines.map(l => l.productName).filter(Boolean))];

                return (
                  <React.Fragment key={t.id}>
                    <tr
                      className={`cursor-pointer transition-colors ${isExpanded ? 'bg-violet-50/40 dark:bg-violet-900/10' : 'hover:bg-muted/30'}`}
                      onClick={() => toggleExpand(t.id)}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-[13px] text-violet-700">{t.transferNumber}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-medium text-[13px]">{t.fromLocation?.name}</td>
                      <td className="px-4 py-3 font-medium text-[13px]">{t.toLocation?.name}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-[13px]">{productNames.join(', ') || '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {totalBags > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-bold text-xs border border-emerald-200">
                            <Package size={10} /> {totalBags}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600 text-[13px]">
                        {totalQty.toLocaleString()} {unit}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusBg[t.status] || 'bg-gray-50 text-gray-600'}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar size={11} />
                          {new Date(t.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isExpanded ? 'bg-violet-100 text-violet-600' : 'text-muted-foreground/50'}`}>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={9} className="p-0">
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-gradient-to-b from-muted/15 to-transparent px-6 py-4 border-b border-violet-100"
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <Boxes size={13} className="text-violet-600" />
                              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Line Items</span>
                            </div>
                            <div className="rounded-lg border border-border overflow-hidden bg-white dark:bg-card">
                              <table className="w-full text-left text-sm">
                                <thead className="bg-muted/20 border-b border-border">
                                  <tr>
                                    <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Source Batch</th>
                                    <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Product</th>
                                    <th className="px-4 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Bags</th>
                                    <th className="px-4 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Quantity</th>
                                    <th className="px-4 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Unit</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                  {t.lines.map((line, idx) => (
                                    <tr key={line.id || idx} className="hover:bg-muted/10">
                                      <td className="px-4 py-2.5">
                                        <span className="font-mono text-xs font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded">
                                          {line.batchNumber || '—'}
                                        </span>
                                      </td>
                                      <td className="px-4 py-2.5">
                                        <div className="font-semibold text-[13px]">{line.productName || '—'}</div>
                                        {line.skuCode && <div className="text-[10px] text-muted-foreground">{line.skuCode}</div>}
                                      </td>
                                      <td className="px-4 py-2.5 text-center">
                                        {line.numberOfBags != null ? (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md font-bold text-xs border border-emerald-200">
                                            {line.numberOfBags}
                                          </span>
                                        ) : '—'}
                                      </td>
                                      <td className="px-4 py-2.5 text-right font-bold text-sm">{Number(line.quantity).toLocaleString()}</td>
                                      <td className="px-4 py-2.5 text-right text-xs text-muted-foreground font-medium uppercase">{line.unitOfMeasurement}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ═══ New Transfer Modal ═══ */}
      <Modal
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        title={null}
        width={720}
        destroyOnClose
      >
        <div className="pt-2 pb-1 flex justify-between items-center mb-6 border-b border-border px-2">
          <div className="flex items-center gap-2 text-lg font-bold">
            <div className="p-2 bg-violet-100 dark:bg-violet-900/20 text-violet-600 rounded-lg">
              <Truck size={20} />
            </div>
            <div>
              <div className="text-foreground">Create SFG Dispatch</div>
              <div className="text-[11px] font-normal text-muted-foreground">Transfer SFG to production line — deducts from source batch</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center mb-5 px-4 mt-2">
          {['LOCATIONS', 'MATERIAL', 'SELECT LOTS'].map((label, index) => (
            <React.Fragment key={label}>
              <div className="flex flex-col items-center relative z-10 w-20">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors cursor-pointer ${
                    currentStep > index
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-500/30'
                      : currentStep === index
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-500/30'
                      : 'bg-muted text-muted-foreground'
                  }`}
                  onClick={() => { if (index < currentStep) setCurrentStep(index); }}
                >
                  {currentStep > index ? <Check size={16} strokeWidth={3} /> : index + 1}
                </div>
                <span className={`mt-2 text-[10px] font-bold uppercase tracking-wider ${currentStep >= index ? 'text-violet-600' : 'text-muted-foreground'}`}>
                  {label}
                </span>
              </div>
              {index < 2 && (
                <div className={`flex-1 h-[3px] mx-1 -mt-6 transition-colors z-0 rounded-full ${currentStep > index ? 'bg-violet-600' : 'bg-muted'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="space-y-4 min-h-[140px]">
          <AnimatePresence mode="wait">
            {currentStep === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2 flex items-center">
                    <MapPin size={14} className="mr-1.5" /> Destination (Production Line)
                  </label>
                  <Select
                    className="w-full" size="large" placeholder="Select Production Location"
                    value={toLocationId || undefined}
                    onChange={setToLocationId}
                    showSearch optionFilterProp="label"
                    options={locations.map((l: any) => ({ value: l.id, label: l.name }))}
                  />
                  <p className="text-[11px] text-muted-foreground mt-2">
                    Select the production line or location where the material will be dispatched.
                  </p>
                </div>
              </motion.div>
            )}

            {currentStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2 flex items-center">
                    <Warehouse size={14} className="mr-1.5" /> SFG Item Name
                  </label>
                  {loadingStock ? (
                    <div className="py-10 flex flex-col justify-center items-center">
                      <Loader2 className="animate-spin text-violet-500 mb-2" size={24} />
                      <div className="text-xs text-muted-foreground">Loading warehouse stock...</div>
                    </div>
                  ) : sfgStock.length === 0 ? (
                    <div className="border border-dashed border-border rounded-xl p-8 text-center bg-muted/10">
                      <Package size={28} className="mx-auto text-muted-foreground/40 mb-3" />
                      <p className="text-sm font-semibold">No SFG stock available in warehouse</p>
                    </div>
                  ) : (
                    <Select
                      className="w-full" size="large" showSearch placeholder="Select SFG item"
                      value={selectedStockItem ? `${selectedStockItem.rawMaterialId}__${selectedStockItem.warehouseLocationId}` : undefined}
                      onChange={handleSelectStockItem} optionFilterProp="label"
                      options={sfgStock.map((stock) => {
                        const displayBags = stock.totalAvailableBags != null && !isNaN(stock.totalAvailableBags) 
                           ? stock.totalAvailableBags 
                           : stock.batches.reduce((sum, b) => {
                               return sum + Math.floor(
                                 ((stock.unit.toLowerCase() === 'ton' || stock.unit.toLowerCase() === 'mt') ? b.availableQty * 1000 : b.availableQty) / (b.bagSizeKg || 25)
                               );
                             }, 0);
                        return {
                          value: `${stock.rawMaterialId}__${stock.warehouseLocationId}`,
                          label: `${stock.productName} (${stock.skuCode || 'NO-SKU'}) — ${displayBags} Bags available`,
                        };
                      })}
                    />
                  )}
                </div>
              </motion.div>
            )}

            {currentStep === 2 && selectedStockItem && (
              <motion.div key="step2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                {/* Summary bar */}
                <div className="flex items-center justify-between border border-violet-200 rounded-lg px-4 py-3 mb-5 bg-violet-50/60">
                  <div className="flex items-center gap-2">
                    <Scale size={16} className="text-violet-600" />
                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Allocating</div>
                      <div className="text-sm font-bold">{selectedStockItem.productName}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Bags</div>
                      <div className="font-bold text-violet-700 text-lg">{totalSelectedBags}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Weight</div>
                      <div className="font-bold text-violet-700">{totalSelectedKg.toLocaleString()} KG</div>
                    </div>
                  </div>
                </div>

                {/* Batch Table */}
                <div className="border border-border rounded-lg bg-white dark:bg-card overflow-hidden mb-5">
                  <div className="px-4 py-2.5 bg-muted/20 border-b border-border flex items-center justify-between">
                    <span className="font-bold text-[10px] tracking-widest uppercase text-muted-foreground">Source Batches</span>
                    <span className="text-[10px] text-muted-foreground">{selectedStockItem.batches.length} lots</span>
                  </div>
                  <div className="max-h-[280px] overflow-y-auto">
                    <table className="w-full text-left text-sm table-fixed">
                      <thead className="bg-muted/10 border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground font-bold sticky top-0 z-10">
                        <tr>
                          <th className="px-3 py-2.5 w-10 text-center"></th>
                          <th className="px-3 py-2.5 w-[35%]">Source Transfer ID</th>
                          <th className="px-3 py-2.5 text-center">Received</th>
                          <th className="px-3 py-2.5 text-center text-violet-600">Transferred</th>
                          <th className="px-3 py-2.5 text-center text-emerald-600">Available</th>
                          <th className="px-3 py-2.5 text-center w-[120px]">Allocate Bags</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {selectedStockItem.batches.map(batch => {
                          const isChecked = selectedBatches.has(batch.batchNumber);
                          const allocatedBags = batchQuantities[batch.batchNumber] || 0;
                          const safeBagSizeKg = batch.bagSizeKg || 25;
                          const derivedAvailableBags = (typeof batch.availableBags === 'number' && !isNaN(batch.availableBags) && batch.availableBags > 0)
                            ? batch.availableBags
                            : Math.floor(
                                ((selectedStockItem.unit.toLowerCase() === 'ton' || selectedStockItem.unit.toLowerCase() === 'mt') 
                                  ? batch.availableQty * 1000 
                                  : batch.availableQty) / safeBagSizeKg
                              );
                          const dynamicQtyKg = allocatedBags * safeBagSizeKg;

                          return (
                            <tr key={batch.batchNumber} className={`transition-colors ${isChecked ? 'bg-violet-50/60' : 'hover:bg-muted/10'}`}>
                              <td className="px-3 py-3 text-center">
                                <Checkbox checked={isChecked} onChange={(e) => handleToggleBatch(batch.batchNumber, e.target.checked)} />
                              </td>
                              <td className="px-3 py-3">
                                <div className="font-mono font-bold text-[12px] text-primary truncate" title={batch.batchNumber}>
                                  {batch.batchNumber}
                                </div>
                                <div className="text-[10px] text-muted-foreground mt-0.5">
                                  {batch.receivedQty} {batch.unit} · {safeBagSizeKg}kg/bag
                                </div>
                              </td>
                              <td className="px-3 py-3 text-center">
                                <div className="font-bold text-xs">{batch.receivedBags} <span className="text-muted-foreground font-normal">bags</span></div>
                              </td>
                              <td className="px-3 py-3 text-center">
                                <div className={`font-bold text-xs ${batch.transferredBags > 0 ? 'text-violet-600' : 'text-muted-foreground/40'}`}>
                                  {batch.transferredBags} <span className="font-normal">bags</span>
                                </div>
                              </td>
                              <td className="px-3 py-3 text-center">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md font-bold text-xs border border-emerald-200">
                                  {derivedAvailableBags} bags
                                </span>
                              </td>
                              <td className="px-3 py-3">
                                {isChecked ? (
                                  <div className="flex flex-col items-center">
                                    <InputNumber
                                      min={1} max={derivedAvailableBags} step={1} precision={0}
                                      value={batchQuantities[batch.batchNumber]}
                                      onChange={(v) => handleBatchQtyChange(batch.batchNumber, v)}
                                      className="w-full font-semibold text-center" size="small" placeholder="0"
                                    />
                                    {allocatedBags > 0 && (
                                      <div className="text-[10px] text-violet-600 font-bold mt-1">{dynamicQtyKg.toLocaleString()} KG</div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-center text-[10px] text-muted-foreground/50 italic">—</div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mb-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center">
                    <FileText size={12} className="mr-1" /> Dispatch Notes (optional)
                  </label>
                  <Input.TextArea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any special instructions..."
                    autoSize={{ minRows: 2, maxRows: 4 }}
                    className="rounded-lg bg-muted/10 text-sm"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-5 mt-2 border-t border-border">
          <Button size="large" onClick={() => { if (currentStep === 0) setIsModalVisible(false); else handleBack(); }} className="rounded-lg font-medium">
            {currentStep === 0 ? 'Cancel' : 'Back'}
          </Button>
          <div className="flex gap-2">
            {currentStep > 0 && currentStep < 2 && (
              <Button size="large" onClick={() => setIsModalVisible(false)} className="rounded-lg font-medium">Cancel</Button>
            )}
            {currentStep < 2 ? (
              <Button type="primary" size="large" onClick={handleNext} className="rounded-lg font-bold shadow-md" style={{ background: '#7c3aed', border: 'none' }}>
                Next Step
              </Button>
            ) : (
              <Button
                type="primary" size="large" loading={submitting} onClick={handleSubmit}
                disabled={totalSelectedKg <= 0 && totalSelectedBags <= 0}
                className="rounded-lg font-bold shadow-md"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', border: 'none' }}
              >
                Create Dispatch
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

export default MaterialTransferPage;
