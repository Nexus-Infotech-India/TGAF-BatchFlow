import React, { useEffect, useState } from 'react';
import api, { API_ROUTES } from '../../../utils/api';
import { Button, message, Select, InputNumber, Input, Checkbox } from 'antd';
import { useNavigate } from 'react-router-dom';
import { Plus, Package, Truck, Loader2, Warehouse, MapPin, Scale, Check, FileText, Layers, ShoppingCart, Trash2, Tag, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ═══════════════════════ Types ═══════════════════════ */

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

interface PackagingMaterial {
  id: string;
  name: string;
  skuCode: string;
  unitOfMeasurement: string;
  category: string;
}

interface CartItem {
  id: string;
  category: 'SFG' | 'PACKAGING_MATERIAL';
  rawMaterialId: string;
  productName: string;
  skuCode: string;
  quantity: number;
  unitOfMeasurement: string;
  numberOfBags?: number;
  bagSizeKg?: number;
  batchNumber?: string;
  warehouseLocationId?: string;
  fromLocationId: string;
  fromLocationName: string;
  toLocationId: string;
  toLocationName: string;
}

/* ═══════════════════════ Component ═══════════════════════ */

const CreateMaterialTransferPage: React.FC = () => {
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Step 0: Category (single select per item)
  const [selectedCategory, setSelectedCategory] = useState<'SFG' | 'PACKAGING_MATERIAL' | null>(null);

  // Step 1: Locations (per item)
  const [locations, setLocations] = useState<any[]>([]);
  const [fromLocationId, setFromLocationId] = useState<string>('');
  const [toLocationId, setToLocationId] = useState<string>('');

  // Step 2: Material selection
  // SFG
  const [sfgStock, setSfgStock] = useState<SfgStockItem[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState<SfgStockItem | null>(null);
  const [batchQuantities, setBatchQuantities] = useState<Record<string, number | null>>({});
  const [selectedBatches, setSelectedBatches] = useState<Set<string>>(new Set());
  // Packaging
  const [packagingMaterials, setPackagingMaterials] = useState<PackagingMaterial[]>([]);
  const [packagingStockMap, setPackagingStockMap] = useState<Record<string, { available: number; unit: string }>>({});
  const [selectedPkgMaterial, setSelectedPkgMaterial] = useState<PackagingMaterial | null>(null);
  const [pkgQuantity, setPkgQuantity] = useState<number | null>(null);
  const [pkgUnit, setPkgUnit] = useState<string>('KG');

  // Cart + Notes
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState<string>('');

  /* ═══ Fetchers ═══ */

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

  const fetchPackagingMaterials = async () => {
    try {
      const [matRes, stockRes] = await Promise.all([
        api.get(API_ROUTES.RAW.GET_PRODUCTS, { params: { category: 'PACKAGING_MATERIAL' } }),
        api.get(API_ROUTES.RAW.GET_PACKAGING_SOURCE_STOCK, fromLocationId ? { params: { locationId: fromLocationId } } : undefined),
      ]);
      const data = Array.isArray(matRes.data) ? matRes.data : (matRes.data?.data || []);
      setPackagingMaterials(data.filter((p: any) => p.category === 'PACKAGING_MATERIAL'));
      const stockList = stockRes.data?.data || [];
      const map: Record<string, { available: number; unit: string }> = {};
      for (const s of stockList) map[s.rawMaterialId] = { available: s.available, unit: s.unit };
      setPackagingStockMap(map);
    } catch (e) {
      message.error('Failed to load packaging materials');
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  /* ═══ SFG Handlers ═══ */

  const handleSelectStockItem = (itemKey: string) => {
    const item = sfgStock.find(s => `${s.rawMaterialId}__${s.warehouseLocationId}` === itemKey);
    setSelectedStockItem(item || null);
    if (!item) { setBatchQuantities({}); setSelectedBatches(new Set()); return; }
    const init: Record<string, number | null> = {};
    item.batches.forEach(b => { init[b.batchNumber] = null; });
    setBatchQuantities(init);
    setSelectedBatches(new Set());
  };

  const handleToggleBatch = (batchNumber: string, checked: boolean) => {
    const s = new Set(selectedBatches);
    if (checked) s.add(batchNumber);
    else { s.delete(batchNumber); setBatchQuantities(prev => ({ ...prev, [batchNumber]: null })); }
    setSelectedBatches(s);
  };

  const handleBatchQtyChange = (batchNumber: string, value: number | null) => {
    setBatchQuantities(prev => ({ ...prev, [batchNumber]: value }));
  };

  const totalSelectedBags = selectedStockItem
    ? selectedStockItem.batches.reduce((sum, b) => selectedBatches.has(b.batchNumber) ? sum + Number(batchQuantities[b.batchNumber] || 0) : sum, 0)
    : 0;

  const totalSelectedKg = selectedStockItem
    ? selectedStockItem.batches.reduce((sum, b) => {
        if (!selectedBatches.has(b.batchNumber)) return sum;
        return sum + Number(batchQuantities[b.batchNumber] || 0) * (b.bagSizeKg || 25);
      }, 0)
    : 0;

  /* ═══ Add to Cart ═══ */

  const getLocationName = (id: string) => locations.find((l: any) => l.id === id)?.name || '';

  const addSfgToCart = () => {
    if (!selectedStockItem) return;
    const lineItems = selectedStockItem.batches
      .filter(b => selectedBatches.has(b.batchNumber))
      .map(b => {
        const bags = Number(batchQuantities[b.batchNumber] || 0);
        const safeBag = b.bagSizeKg || 25;
        const qty = bags * safeBag;
        const derivedAvail = (typeof b.availableBags === 'number' && !isNaN(b.availableBags) && b.availableBags > 0)
          ? b.availableBags
          : Math.floor(((selectedStockItem.unit.toLowerCase() === 'ton' || selectedStockItem.unit.toLowerCase() === 'mt') ? b.availableQty * 1000 : b.availableQty) / safeBag);
        return { batch: b, bags, qty, safeBag, derivedAvail };
      })
      .filter(x => x.bags > 0);

    if (lineItems.length === 0) return message.error('Enter bag count for at least one batch');
    for (const { batch, bags, derivedAvail } of lineItems) {
      if (bags > derivedAvail) return message.error(`Batch ${batch.batchNumber}: max ${derivedAvail} bags`);
    }

    const newItems: CartItem[] = lineItems.map(({ batch, bags, qty, safeBag }) => ({
      id: `sfg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      category: 'SFG' as const,
      rawMaterialId: selectedStockItem.rawMaterialId,
      productName: selectedStockItem.productName,
      skuCode: selectedStockItem.skuCode,
      quantity: qty,
      unitOfMeasurement: 'KG',
      numberOfBags: bags,
      bagSizeKg: safeBag,
      batchNumber: batch.batchNumber,
      warehouseLocationId: selectedStockItem.warehouseLocationId,
      fromLocationId, fromLocationName: getLocationName(fromLocationId),
      toLocationId, toLocationName: getLocationName(toLocationId),
    }));

    setCartItems(prev => [...prev, ...newItems]);
    message.success(`Added ${lineItems.length} SFG lot(s)`);
    resetItemForm();
    setCurrentStep(3);
  };

  const addPackagingToCart = () => {
    if (!selectedPkgMaterial || !pkgQuantity || pkgQuantity <= 0) return message.error('Select material & enter quantity');
    const newItem: CartItem = {
      id: `pkg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      category: 'PACKAGING_MATERIAL',
      rawMaterialId: selectedPkgMaterial.id,
      productName: selectedPkgMaterial.name,
      skuCode: selectedPkgMaterial.skuCode,
      quantity: pkgQuantity,
      unitOfMeasurement: pkgUnit,
      fromLocationId, fromLocationName: getLocationName(fromLocationId),
      toLocationId, toLocationName: getLocationName(toLocationId),
    };
    setCartItems(prev => [...prev, newItem]);
    message.success(`Added ${selectedPkgMaterial.name}`);
    resetItemForm();
    setCurrentStep(3);
  };

  const removeCartItem = (id: string) => setCartItems(prev => prev.filter(i => i.id !== id));

  const resetItemForm = () => {
    setSelectedCategory(null);
    setFromLocationId('');
    setToLocationId('');
    setSelectedStockItem(null);
    setBatchQuantities({});
    setSelectedBatches(new Set());
    setSelectedPkgMaterial(null);
    setPkgQuantity(null);
    setPkgUnit('KG');
  };

  /* ═══ Navigation ═══ */

  const handleNext = () => {
    if (currentStep === 0 && !selectedCategory) return message.warning('Select a material category');
    if (currentStep === 1) {
      if (!fromLocationId) return message.warning('Select source location');
      if (!toLocationId) return message.warning('Select destination location');
      if (fromLocationId === toLocationId) return message.warning('Source and destination must differ');
      // Load data for selected category
      if (selectedCategory === 'SFG') fetchSfgWarehouseStock();
      else fetchPackagingMaterials();
    }
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => setCurrentStep(prev => prev - 1);

  /* ═══ Submit ═══ */

  const handleSubmit = async () => {
    if (cartItems.length === 0) return message.error('No items in the transfer');
    setSubmitting(true);
    try {
      // Group items by (fromLocationId, toLocationId)
      const groups: Record<string, CartItem[]> = {};
      cartItems.forEach(item => {
        const key = `${item.fromLocationId}__${item.toLocationId}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
      });

      for (const [key, items] of Object.entries(groups)) {
        const [fromId, toId] = key.split('__');
        const lines = items.map(item => ({
          lineType: item.category,
          rawMaterialId: item.rawMaterialId,
          productName: item.productName,
          skuCode: item.skuCode,
          quantity: item.quantity,
          transferredQuantity: item.quantity,
          transferredUnit: item.unitOfMeasurement,
          unitOfMeasurement: item.unitOfMeasurement,
          batchNumber: item.batchNumber || null,
          numberOfBags: item.numberOfBags || null,
          bagSizeKg: item.bagSizeKg || null,
        }));

        await api.post(API_ROUTES.RAW.CREATE_TRANSFER, {
          direction: 'SFG_TO_PRODUCTION',
          fromLocationId: fromId,
          toLocationId: toId,
          notes,
          lines,
        });
      }

      const count = Object.keys(groups).length;
      message.success(`Created ${count} transfer batch${count > 1 ? 'es' : ''} successfully!`);
      navigate('/packaging/material-transfer');
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to create transfer');
    }
    setSubmitting(false);
  };

  /* ═══ Helpers ═══ */

  const stepLabels = ['CATEGORY', 'LOCATIONS', 'MATERIAL', 'REVIEW'];

  const lineTypeBadge = (cat: string) => {
    if (cat === 'PACKAGING_MATERIAL') return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-bold border border-blue-200"><Tag size={8} /> PKG</span>;
    return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-violet-50 text-violet-600 rounded text-[9px] font-bold border border-violet-200"><Layers size={8} /> SFG</span>;
  };

  /* ═══════════════════════ RENDER ═══════════════════════ */

  return (
    <motion.div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
            <Truck className="text-violet-600" />
            Create Material Transfer
          </h1>
          <p className="text-muted-foreground mt-1">Transfer SFG & Packaging Materials to Production Lines</p>
        </div>
        <Button icon={<ArrowLeft size={14} />} onClick={() => navigate('/packaging/material-transfer')} size="large">
          Back to Transfers
        </Button>
      </div>

      <div className="bg-white dark:bg-card border border-border shadow-sm rounded-xl overflow-hidden p-6 md:p-8">
        {/* Title + Cart Badge */}
        <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
          <div className="flex items-center gap-2 text-lg font-bold">
            <div className="p-2 bg-violet-100 text-violet-600 rounded-lg"><Truck size={20} /></div>
            <div>
              <div className="text-foreground">Create Material Transfer</div>
              <div className="text-[11px] font-normal text-muted-foreground">Add SFG & Packaging items — each with its own source location</div>
            </div>
          </div>
          {cartItems.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 rounded-lg border border-violet-200">
              <ShoppingCart size={14} className="text-violet-600" />
              <span className="text-xs font-bold text-violet-700">{cartItems.length} item{cartItems.length > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center mb-6 px-4">
          {stepLabels.map((label, index) => (
            <React.Fragment key={label}>
              <div className="flex flex-col items-center relative z-10 w-20">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors cursor-pointer ${
                    currentStep > index ? 'bg-violet-600 text-white shadow-md shadow-violet-500/30'
                    : currentStep === index ? 'bg-violet-600 text-white shadow-md shadow-violet-500/30'
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
              {index < stepLabels.length - 1 && (
                <div className={`flex-1 h-[3px] mx-1 -mt-6 transition-colors z-0 rounded-full ${currentStep > index ? 'bg-violet-600' : 'bg-muted'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="space-y-4 min-h-[200px]">
          <AnimatePresence mode="wait">

            {/* ═══ Step 0: Category ═══ */}
            {currentStep === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-5">
                <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3 flex items-center">
                  <Layers size={14} className="mr-1.5" /> Select Material Category
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedCategory === 'SFG'
                        ? 'border-violet-500 bg-violet-50/60 shadow-md shadow-violet-200/50'
                        : 'border-border hover:border-violet-300 hover:bg-violet-50/20'
                    }`}
                    onClick={() => setSelectedCategory('SFG')}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${selectedCategory === 'SFG' ? 'bg-violet-600 text-white' : 'bg-violet-100 text-violet-600'}`}>
                        <Layers size={20} />
                      </div>
                      {selectedCategory === 'SFG' && (
                        <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center mb-3"><Check size={14} className="text-white" strokeWidth={3} /></div>
                      )}
                    </div>
                    <h3 className="font-bold text-sm">Semi-Finished Goods</h3>
                    <p className="text-[11px] text-muted-foreground mt-1">Transfer SFG from warehouse with bag selection</p>
                  </div>
                  <div
                    className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedCategory === 'PACKAGING_MATERIAL'
                        ? 'border-blue-500 bg-blue-50/60 shadow-md shadow-blue-200/50'
                        : 'border-border hover:border-blue-300 hover:bg-blue-50/20'
                    }`}
                    onClick={() => setSelectedCategory('PACKAGING_MATERIAL')}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${selectedCategory === 'PACKAGING_MATERIAL' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'}`}>
                        <Package size={20} />
                      </div>
                      {selectedCategory === 'PACKAGING_MATERIAL' && (
                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center mb-3"><Check size={14} className="text-white" strokeWidth={3} /></div>
                      )}
                    </div>
                    <h3 className="font-bold text-sm">Packaging Material</h3>
                    <p className="text-[11px] text-muted-foreground mt-1">Transfer packaging material with quantity & unit</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══ Step 1: Locations ═══ */}
            {currentStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2 flex items-center">
                    <Warehouse size={14} className="mr-1.5" /> Source Location (From)
                  </label>
                  <Select
                    className="w-full" size="large" placeholder="Where to transfer FROM"
                    value={fromLocationId || undefined}
                    onChange={setFromLocationId}
                    showSearch optionFilterProp="label"
                    options={locations.map((l: any) => ({ value: l.id, label: l.name }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2 flex items-center">
                    <MapPin size={14} className="mr-1.5" /> Destination Location (To)
                  </label>
                  <Select
                    className="w-full" size="large" placeholder="Where to transfer TO"
                    value={toLocationId || undefined}
                    onChange={setToLocationId}
                    showSearch optionFilterProp="label"
                    options={locations.map((l: any) => ({ value: l.id, label: l.name }))}
                  />
                  <p className="text-[11px] text-muted-foreground mt-2">
                    {selectedCategory === 'SFG'
                      ? 'Select SFG warehouse as source and production line as destination.'
                      : 'Select packaging store as source and production line as destination.'}
                  </p>
                </div>
              </motion.div>
            )}

            {/* ═══ Step 2: Material — SFG ═══ */}
            {currentStep === 2 && selectedCategory === 'SFG' && (
              <motion.div key="step2-sfg" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                <div className="mb-4">
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
                      options={sfgStock.map(stock => {
                        const displayBags = stock.totalAvailableBags != null && !isNaN(stock.totalAvailableBags)
                          ? stock.totalAvailableBags
                          : stock.batches.reduce((sum, b) => sum + Math.floor(((stock.unit.toLowerCase() === 'ton' || stock.unit.toLowerCase() === 'mt') ? b.availableQty * 1000 : b.availableQty) / (b.bagSizeKg || 25)), 0);
                        return { value: `${stock.rawMaterialId}__${stock.warehouseLocationId}`, label: `${stock.productName} (${stock.skuCode || 'NO-SKU'}) — ${displayBags} Bags` };
                      })}
                    />
                  )}
                </div>

                {selectedStockItem && (
                  <>
                    <div className="flex items-center justify-between border border-violet-200 rounded-lg px-4 py-3 mb-4 bg-violet-50/60">
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

                    <div className="border border-border rounded-lg bg-white dark:bg-card overflow-hidden mb-4">
                      <div className="px-4 py-2.5 bg-muted/20 border-b border-border flex items-center justify-between">
                        <span className="font-bold text-[10px] tracking-widest uppercase text-muted-foreground">Source Batches</span>
                        <span className="text-[10px] text-muted-foreground">{selectedStockItem.batches.length} lots</span>
                      </div>
                      <div className="max-h-[260px] overflow-y-auto">
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
                              const allocBags = batchQuantities[batch.batchNumber] || 0;
                              const safeBag = batch.bagSizeKg || 25;
                              const derivedAvail = (typeof batch.availableBags === 'number' && !isNaN(batch.availableBags) && batch.availableBags > 0)
                                ? batch.availableBags
                                : Math.floor(((selectedStockItem.unit.toLowerCase() === 'ton' || selectedStockItem.unit.toLowerCase() === 'mt') ? batch.availableQty * 1000 : batch.availableQty) / safeBag);
                              const dynKg = allocBags * safeBag;
                              return (
                                <tr key={batch.batchNumber} className={`transition-colors ${isChecked ? 'bg-violet-50/60' : 'hover:bg-muted/10'}`}>
                                  <td className="px-3 py-3 text-center"><Checkbox checked={isChecked} onChange={e => handleToggleBatch(batch.batchNumber, e.target.checked)} /></td>
                                  <td className="px-3 py-3">
                                    <div className="font-mono font-bold text-[12px] text-primary truncate" title={batch.batchNumber}>{batch.batchNumber}</div>
                                    <div className="text-[10px] text-muted-foreground mt-0.5">{batch.receivedQty} {batch.unit} · {safeBag}kg/bag</div>
                                  </td>
                                  <td className="px-3 py-3 text-center"><div className="font-bold text-xs">{batch.receivedBags} <span className="text-muted-foreground font-normal">bags</span></div></td>
                                  <td className="px-3 py-3 text-center"><div className={`font-bold text-xs ${batch.transferredBags > 0 ? 'text-violet-600' : 'text-muted-foreground/40'}`}>{batch.transferredBags} <span className="font-normal">bags</span></div></td>
                                  <td className="px-3 py-3 text-center"><span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md font-bold text-xs border border-emerald-200">{derivedAvail} bags</span></td>
                                  <td className="px-3 py-3">
                                    {isChecked ? (
                                      <div className="flex flex-col items-center">
                                        <InputNumber min={1} max={derivedAvail} step={1} precision={0} value={batchQuantities[batch.batchNumber]} onChange={v => handleBatchQtyChange(batch.batchNumber, v)} className="w-full font-semibold text-center" size="small" placeholder="0" />
                                        {allocBags > 0 && <div className="text-[10px] text-violet-600 font-bold mt-1">{dynKg.toLocaleString()} KG</div>}
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
                  </>
                )}
              </motion.div>
            )}

            {/* ═══ Step 2: Material — Packaging ═══ */}
            {currentStep === 2 && selectedCategory === 'PACKAGING_MATERIAL' && (
              <motion.div key="step2-pkg" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2 flex items-center">
                    <Package size={14} className="mr-1.5" /> Select Packaging Material
                  </label>
                  <Select
                    className="w-full" size="large" showSearch placeholder="Select packaging material"
                    value={selectedPkgMaterial?.id || undefined}
                    onChange={id => { const mat = packagingMaterials.find(m => m.id === id); setSelectedPkgMaterial(mat || null); if (mat) setPkgUnit(mat.unitOfMeasurement || 'KG'); }}
                    optionFilterProp="label"
                    options={packagingMaterials.map(m => {
                      const stock = packagingStockMap[m.id];
                      const availLabel = stock ? ` — Available: ${stock.available} ${stock.unit}` : ' — Available: 0';
                      return { value: m.id, label: `${m.name} (${m.skuCode || 'NO-SKU'})${availLabel}` };
                    })}
                  />
                </div>

                {selectedPkgMaterial && (() => {
                  const stock = packagingStockMap[selectedPkgMaterial.id];
                  const availableQty = stock?.available ?? 0;
                  const availableUnit = stock?.unit || selectedPkgMaterial.unitOfMeasurement || 'KG';
                  return (
                  <div className="border border-blue-200 rounded-xl p-5 bg-blue-50/40 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center"><Package size={16} className="text-blue-600" /></div>
                        <div>
                          <div className="text-sm font-bold">{selectedPkgMaterial.name}</div>
                          <div className="text-[10px] text-muted-foreground">{selectedPkgMaterial.skuCode}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Available</div>
                        <div className={`text-base font-extrabold ${availableQty > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {availableQty} <span className="text-[10px] font-medium opacity-70">{availableUnit}</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-muted-foreground mb-1.5">Quantity</label>
                        <InputNumber className="w-full" size="large" min={0.001} max={availableQty || undefined} step={1} precision={3} value={pkgQuantity} onChange={setPkgQuantity} placeholder="Enter quantity" />
                        {pkgQuantity != null && availableQty > 0 && pkgQuantity > availableQty && (
                          <div className="text-[10px] text-red-500 mt-1 font-medium">Exceeds available stock</div>
                        )}
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-muted-foreground mb-1.5">Unit</label>
                        <Select className="w-full" size="large" value={pkgUnit} onChange={setPkgUnit}
                          options={[
                            { value: 'KG', label: 'KG' }, { value: 'Ton', label: 'Ton' },
                            { value: 'PCS', label: 'PCS (Pieces)' }, { value: 'Rolls', label: 'Rolls' },
                            { value: 'Meters', label: 'Meters' }, { value: 'Sheets', label: 'Sheets' },
                          ]}
                        />
                      </div>
                    </div>
                  </div>
                  );
                })()}
              </motion.div>
            )}

            {/* ═══ Step 3: Review Cart ═══ */}
            {currentStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                {cartItems.length === 0 ? (
                  <div className="border border-dashed border-border rounded-xl p-10 text-center bg-muted/10">
                    <ShoppingCart size={32} className="mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-sm font-semibold text-muted-foreground">No items added yet</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Go back to add SFG or Packaging materials</p>
                  </div>
                ) : (
                  <div className="border border-border rounded-lg bg-white dark:bg-card overflow-hidden mb-4">
                    <div className="px-4 py-2.5 bg-gradient-to-r from-violet-50 to-blue-50 border-b border-border flex items-center justify-between">
                      <span className="font-bold text-[10px] tracking-widest uppercase text-muted-foreground">Transfer Items</span>
                      <span className="text-xs font-bold text-violet-600">{cartItems.length} item{cartItems.length > 1 ? 's' : ''}</span>
                    </div>
                    <div className="max-h-[280px] overflow-y-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-muted/10 border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground font-bold sticky top-0 z-10">
                          <tr>
                            <th className="px-4 py-2">Type</th>
                            <th className="px-4 py-2">Material</th>
                            <th className="px-4 py-2">From → To</th>
                            <th className="px-4 py-2 text-right">Quantity</th>
                            <th className="px-4 py-2 text-right">Unit</th>
                            <th className="px-4 py-2 w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {cartItems.map(item => (
                            <tr key={item.id} className="hover:bg-muted/10">
                              <td className="px-4 py-2.5">{lineTypeBadge(item.category)}</td>
                              <td className="px-4 py-2.5">
                                <div className="font-semibold text-[13px]">{item.productName}</div>
                                <div className="text-[10px] text-muted-foreground">{item.skuCode}{item.batchNumber ? ` · ${item.batchNumber}` : ''}</div>
                                {item.numberOfBags != null && <div className="text-[10px] text-muted-foreground">{item.numberOfBags} bags</div>}
                              </td>
                              <td className="px-4 py-2.5">
                                <div className="text-[11px]">
                                  <span className="text-muted-foreground">{item.fromLocationName}</span>
                                  <span className="mx-1 text-violet-400">→</span>
                                  <span className="font-medium">{item.toLocationName}</span>
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-right font-bold">{item.quantity.toLocaleString()}</td>
                              <td className="px-4 py-2.5 text-right text-xs text-muted-foreground font-medium uppercase">{item.unitOfMeasurement}</td>
                              <td className="px-4 py-2.5">
                                <button onClick={() => removeCartItem(item.id)} className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors">
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Add More */}
                <Button type="dashed" onClick={() => { resetItemForm(); setCurrentStep(0); }} className="w-full rounded-lg font-semibold mb-4" icon={<Plus size={14} />} size="large">
                  Add Another Material
                </Button>

                {/* Notes */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center">
                    <FileText size={12} className="mr-1" /> Dispatch Notes (optional)
                  </label>
                  <Input.TextArea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add any special instructions..." autoSize={{ minRows: 2, maxRows: 4 }} className="rounded-lg bg-muted/10 text-sm" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-5 mt-2 border-t border-border">
          <Button size="large" onClick={() => {
            if (currentStep === 0) navigate('/packaging/material-transfer');
            else handleBack();
          }} className="rounded-lg font-medium">
            {currentStep === 0 ? 'Cancel' : 'Back'}
          </Button>
          <div className="flex gap-2">
            {currentStep > 0 && currentStep < 3 && (
              <Button size="large" onClick={() => navigate('/packaging/material-transfer')} className="rounded-lg font-medium">Cancel</Button>
            )}

            {currentStep < 2 && (
              <Button type="primary" size="large" onClick={handleNext} className="rounded-lg font-bold shadow-md" style={{ background: '#7c3aed', border: 'none' }}>
                Next Step
              </Button>
            )}

            {currentStep === 2 && selectedCategory === 'SFG' && (
              <Button type="primary" size="large" onClick={addSfgToCart} disabled={totalSelectedBags <= 0}
                className="rounded-lg font-bold shadow-md" style={{ background: '#7c3aed', border: 'none' }} icon={<ShoppingCart size={14} />}>
                Add SFG to Cart
              </Button>
            )}

            {currentStep === 2 && selectedCategory === 'PACKAGING_MATERIAL' && (() => {
              const stockAvail = selectedPkgMaterial ? (packagingStockMap[selectedPkgMaterial.id]?.available ?? 0) : 0;
              const exceeds = !!(pkgQuantity && pkgQuantity > stockAvail);
              return (
                <Button type="primary" size="large" onClick={addPackagingToCart}
                  disabled={!selectedPkgMaterial || !pkgQuantity || pkgQuantity <= 0 || stockAvail <= 0 || exceeds}
                  className="rounded-lg font-bold shadow-md" style={{ background: '#2563eb', border: 'none' }} icon={<ShoppingCart size={14} />}>
                  Add Packaging to Cart
                </Button>
              );
            })()}

            {currentStep === 3 && (
              <Button type="primary" size="large" loading={submitting} onClick={handleSubmit} disabled={cartItems.length === 0}
                className="rounded-lg font-bold shadow-md" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', border: 'none' }}>
                Create Transfer ({cartItems.length})
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CreateMaterialTransferPage;
