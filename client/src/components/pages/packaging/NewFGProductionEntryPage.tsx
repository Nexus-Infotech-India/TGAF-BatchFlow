import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { API_ROUTES } from '../../../utils/api';
import { Button, InputNumber, Input, message, Steps, Select } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Package,
  Factory,
  CheckCircle,
  Scale,
  MapPin,
  Database,
  Truck,
} from 'lucide-react';

/* ─── Unit conversion helpers ─── */
const UNIT_TO_GRAMS: Record<string, number> = {
  gram: 1, grams: 1, g: 1,
  kg: 1000, KG: 1000, Kg: 1000,
  ton: 1_000_000, Ton: 1_000_000, TON: 1_000_000,
};
function toGrams(qty: number, unit: string): number {
  const factor = UNIT_TO_GRAMS[unit] ?? UNIT_TO_GRAMS[unit.toLowerCase()] ?? 1;
  return qty * factor;
}
function capacityInTon(machine: { capacityQty: number; capacityUnit: string }): number {
  if (machine.capacityUnit === 'TON_PER_SHIFT') return machine.capacityQty;
  if (machine.capacityUnit === 'KG_PER_SHIFT') return machine.capacityQty / 1000;
  return machine.capacityQty;
}

const NewFGProductionEntryPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  // General State
  const [locations, setLocations] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [boms, setBoms] = useState<any[]>([]);

  // Step 1: Selection & Planning
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [selectedBomId, setSelectedBomId] = useState('');
  const [productionQty, setProductionQty] = useState<number | null>(null);
  const [productionUnit, setProductionUnit] = useState('KG');

  // Packaging Data
  const [packetSize, setPacketSize] = useState<number | null>(null);
  const [packetUnit, setPacketUnit] = useState('gram');
  const [cartonCapacity, setCartonCapacity] = useState<number | null>(null);

  // Materials & Consumptions
  const [consumptionLines, setConsumptionLines] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Step 2: Auto allocation
  const [allocations, setAllocations] = useState<any[]>([]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /* ─── Fetch Base Data ─── */
  useEffect(() => {
    const fetchBase = async () => {
      try {
        const [locRes, mchRes, bomRes] = await Promise.all([
          api.get(API_ROUTES.RAW.GET_LOCATIONS),
          api.get(API_ROUTES.MACHINE.GET_MACHINES),
          api.get(API_ROUTES.RAW.GET_FG_BOMS),
        ]);
        const locData = locRes.data;
        setLocations(Array.isArray(locData) ? locData : locData?.data || []);
        setMachines(mchRes.data?.data || []);
        setBoms(bomRes.data?.data || []);
      } catch (err) {
        message.error('Failed to load initial data');
      }
    };
    fetchBase();
  }, []);

  /* ─── Fetch BOM Items and Stock ─── */
  const fetchBomItems = async (bomId: string, qty: number, unit: string, locationId: string) => {
    if (!bomId || !qty || !locationId) return;
    setLoadingItems(true);
    try {
      const res = await api.get(API_ROUTES.RAW.GET_FG_BOM_ITEMS, {
        params: { bomId, productionQty: qty, productionUnit: unit, locationId }
      });
      if (res.data?.items) {
        const lines = res.data.items.map((item: any) => {
          let sourceType = 'STOCK';
          let batchNumber = '';
          let dispatchId = '';

          if (item.isSFG) {
            sourceType = 'SFG_BATCH';
            if (item.availableSfgBatches && item.availableSfgBatches.length > 0) {
              const b = item.availableSfgBatches[0];
              batchNumber = b.batchNumber;
              dispatchId = b.dispatchId;
            }
          }

          return {
            rawMaterialId: item.rawMaterialId,
            rawMaterialName: item.rawMaterialName,
            skuCode: item.skuCode,
            isSFG: item.isSFG,
            expectedQuantity: item.expectedQuantity,
            actualQuantity: item.expectedQuantity, // Auto-fill
            unit: item.displayUnit,
            sourceType,
            batchNumber,
            dispatchId,
            availableSfgBatches: item.availableSfgBatches || [],
            currentStockQty: item.currentStockQty || 0,
            currentStockUnit: item.currentStockUnit || item.displayUnit,
          };
        });
        setConsumptionLines(lines);

        // Fetch packaging master
        const selectedBom = boms.find(b => b.id === bomId);
        if (selectedBom && selectedBom.fgProductId) {
          try {
            const pkgRes = await api.get(API_ROUTES.RAW.FG_PACKAGING_BY_PRODUCT(selectedBom.fgProductId));
            if (pkgRes.data?.success && pkgRes.data?.data) {
              setPacketSize(pkgRes.data.data.packetSize);
              setPacketUnit(pkgRes.data.data.packetUnit);
              setCartonCapacity(pkgRes.data.data.cartonCapacity);
            }
          } catch (e: any) {
             // ignore 404
          }
        }
      }
    } catch (err) {
      message.error('Failed to load BOM items');
    }
    setLoadingItems(false);
  };

  /* ─── Trigger BOM fetch when inputs change ─── */
  useEffect(() => {
    if (selectedBomId && productionQty && productionQty > 0 && selectedLocationId) {
      fetchBomItems(selectedBomId, productionQty, productionUnit, selectedLocationId);
    } else {
      setConsumptionLines([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBomId, productionQty, productionUnit, selectedLocationId]);

  /* ─── Build Allocations ─── */
  const buildAllocations = () => {
    if (!productionQty || machines.length === 0) return;

    // Filter machines by selected location
    const locationName = locations.find(l => l.id === selectedLocationId)?.name || '';
    const availableMachines = machines.filter(m => m.location === locationName || !m.location);
    const mList = availableMachines.length > 0 ? availableMachines : machines;

    const totalCapTon = mList.reduce((s, m) => s + capacityInTon(m), 0);
    const packetSizeGrams = packetSize && packetUnit ? toGrams(packetSize, packetUnit) : 0;
    const cCap = cartonCapacity || 0;

    const allocs = mList.map((machine) => {
      const proportion = totalCapTon > 0 ? capacityInTon(machine) / totalCapTon : 1 / mList.length;
      const allocatedQty = Number((productionQty * proportion).toFixed(3));

      let plannedPackets = 0;
      let plannedCartons = 0;
      if (packetSizeGrams > 0) {
        const allocGrams = toGrams(allocatedQty, productionUnit);
        plannedPackets = Math.floor(allocGrams / packetSizeGrams);
        if (cCap > 0) {
          plannedCartons = Math.ceil(plannedPackets / cCap);
        }
      }

      return {
        machine,
        allocatedQty,
        allocatedUnit: productionUnit,
        plannedPackets,
        plannedCartons,
        notes: '',
      };
    });

    setAllocations(allocs);
  };

  const proceedToMachineAllocation = () => {
    if (!selectedLocationId || !selectedBomId || !productionQty) {
      message.error('Please complete all planning fields');
      return;
    }
    
    // Check material availability
    for (const item of consumptionLines) {
       if (item.isSFG) {
          if (!item.availableSfgBatches || item.availableSfgBatches.length === 0) {
             message.error(`No SFG transfer data available for ${item.rawMaterialName} at this location`);
             return;
          }
       } else {
          if (item.currentStockQty < item.expectedQuantity) {
             message.warning(`Warning: Insufficient general stock for ${item.rawMaterialName}`);
          }
       }
    }

    buildAllocations();
    setStep(1);
  };

  const updateAllocation = (index: number, field: string, value: any) => {
    setAllocations((prev) => {
      const next = [...prev];
      (next[index] as any)[field] = value;

      if (field === 'allocatedQty') {
        const packetSizeGrams = packetSize && packetUnit ? toGrams(packetSize, packetUnit) : 0;
        if (packetSizeGrams > 0 && value > 0) {
          const allocGrams = toGrams(value, productionUnit);
          next[index].plannedPackets = Math.floor(allocGrams / packetSizeGrams);
          if (cartonCapacity && cartonCapacity > 0) {
            next[index].plannedCartons = Math.ceil(next[index].plannedPackets / cartonCapacity);
          }
        } else {
          next[index].plannedPackets = 0;
          next[index].plannedCartons = 0;
        }
      }
      return next;
    });
  };

  /* ─── Submit (Creates both Batch & Entry) ─── */
  const handleSubmit = async () => {
    const totalAllocatedQty = allocations.reduce((s, a) => s + (Number(a.allocatedQty) || 0), 0);
    const remain = productionQty ? productionQty - totalAllocatedQty : 0;
    
    if (totalAllocatedQty <= 0) {
      message.error('Please assign production to at least one machine');
      return;
    }
    if (Math.abs(remain) > 0.001) {
       if (remain > 0) {
          message.error(`You still have ${remain.toFixed(3)} ${productionUnit} remaining to distribute.`);
       } else {
          message.error(`You have exceeded the target by ${Math.abs(remain).toFixed(3)} ${productionUnit}.`);
       }
       return;
    }

    setSubmitting(true);
    try {
      // 1. Create FG Batch First
      const batchRes = await api.post(API_ROUTES.RAW.CREATE_FG_BATCH, {
        bomId: selectedBomId,
        productionQty,
        productionUnit,
        packetSize,
        packetUnit,
        cartonCapacity,
        notes: "Auto-created from Production Entry Flow",
        consumptions: consumptionLines,
      });
      
      const newBatchId = batchRes.data?.data?.id;

      // 2. Accept the Batch instantly (so it can be used for production)
      await api.put(API_ROUTES.RAW.ACCEPT_FG_BATCH(newBatchId));

      // 3. Create FG Production Entry
      const activeAllocations = allocations.filter(a => a.allocatedQty > 0);
      await api.post(API_ROUTES.RAW.CREATE_FG_PRODUCTION_ENTRY, {
        fgBatchId: newBatchId,
        notes,
        machineEntries: activeAllocations.map((a) => ({
          machineId: a.machine.id,
          allocatedQty: a.allocatedQty,
          plannedPackets: a.plannedPackets,
          plannedCartons: a.plannedCartons,
          notes: a.notes,
        })),
      });

      message.success('Production Entry and Allocations created successfully!');
      navigate('/packaging/fg-production');
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to complete production entry');
    }
    setSubmitting(false);
  };

  const stepItems = [
    { title: 'Location & Planning', icon: <MapPin size={16} /> },
    { title: 'Machine Assignment', icon: <Factory size={16} /> },
  ];

  return (
    <motion.div className="min-h-screen bg-background p-4 md:p-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button icon={<ArrowLeft size={18} />} onClick={() => navigate('/packaging/fg-production')} className="rounded-full shadow-sm" size="large" />
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              New Production Plan
            </h1>
            <p className="text-muted-foreground">Select location, plan raw materials, and allocate to machines</p>
          </div>
        </div>

        <motion.div className="bg-card rounded-2xl p-4 mb-6 border border-border mt-4 shadow-sm">
          <Steps current={step} items={stepItems.map((s, i) => ({
             title: <span className="text-xs font-semibold">{s.title}</span>,
             icon: <div className={`w-8 h-8 rounded-full flex items-center justify-center ${i <= step ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'}`}>{i < step ? <CheckCircle size={16} /> : s.icon}</div>
          }))} />
        </motion.div>

        <motion.div className="bg-card rounded-2xl border border-border shadow-md overflow-hidden">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: Planning */}
            {step === 0 && (
              <motion.div key="step-0" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="p-6 md:p-8 space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-muted/20 border border-border rounded-xl">
                   <div>
                      <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">1. Select Production Location</label>
                      <Select 
                        className="w-full" size="large" placeholder="E.g. Packaging Area"
                        value={selectedLocationId || undefined} onChange={setSelectedLocationId}
                        options={locations.map(l => ({ value: l.id, label: l.name }))}
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">2. Target FG Item (BOM)</label>
                      <Select 
                        className="w-full" size="large" placeholder="Select Product"
                        value={selectedBomId || undefined} onChange={setSelectedBomId}
                        options={boms.map(b => ({ value: b.id, label: b.productName }))}
                      />
                   </div>
                   <div className="md:col-span-2">
                      <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">3. Total Planned Production</label>
                      <div className="flex items-center gap-3">
                         <InputNumber min={0.001} step={1} className="w-full font-semibold" size="large" value={productionQty} onChange={setProductionQty} placeholder="E.g. 500" />
                         <Select className="w-40" size="large" value={productionUnit} onChange={setProductionUnit} options={['KG', 'Ton', 'gram'].map(u => ({ value: u, label: u }))} />
                      </div>
                   </div>
                </div>

                {/* Items Required Suggestion */}
                {consumptionLines.length > 0 && (
                   <div className="mt-6">
                      <h3 className="text-lg font-bold text-foreground mb-4 border-b border-border pb-2">Material Requirements & Availability</h3>
                      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                         <table className="min-w-full">
                            <thead className="bg-muted/50 border-b border-border">
                               <tr>
                                 <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Material</th>
                                 <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">Source</th>
                                 <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Required</th>
                                 <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Available</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                               {consumptionLines.map((line, idx) => (
                                  <tr key={idx} className="hover:bg-muted/30">
                                     <td className="px-4 py-3 font-semibold text-sm">{line.rawMaterialName}</td>
                                     <td className="px-4 py-3 text-center">
                                       {line.isSFG ? <Truck size={14} className="inline text-violet-500 mr-1"/> : <Database size={14} className="inline text-blue-500 mr-1"/>}
                                       <span className="text-xs font-bold">{line.isSFG ? 'SFG TRANSFER' : 'STOCK'}</span>
                                     </td>
                                     <td className="px-4 py-3 text-right font-bold text-amber-600">{line.expectedQuantity} {line.unit}</td>
                                     <td className="px-4 py-3 text-right">
                                        {line.isSFG ? (
                                           line.availableSfgBatches.length > 0 ? (
                                              <span className="text-emerald-600 font-bold">{line.availableSfgBatches[0].remainingQuantity} {line.availableSfgBatches[0].unit}</span>
                                           ) : (
                                              <span className="text-red-500 font-bold text-xs">No Transfer Available</span>
                                           )
                                        ) : (
                                           <span className={line.currentStockQty >= line.expectedQuantity ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}>
                                              {line.currentStockQty.toLocaleString()} {line.currentStockUnit}
                                           </span>
                                        )}
                                     </td>
                                  </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                   </div>
                )}
                
              </motion.div>
            )}

            {/* STEP 2: Allocation */}
            {step === 1 && (
              <motion.div key="step-1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg"><Factory size={20} className="text-white" /></div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Machine Assignment</h2>
                    <p className="text-sm text-muted-foreground">Distribute the total {productionQty} {productionUnit} across available machines</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  {allocations.map((alloc, idx) => (
                    <div key={idx} className="flex flex-col md:flex-row gap-4 p-4 rounded-xl border-2 border-border bg-card hover:border-blue-500/30 transition-colors items-center">
                      <div className="flex-1 flex gap-3 min-w-[200px]">
                        <div className="p-2 rounded-lg bg-blue-500/10 shrink-0 h-10 w-10 flex items-center justify-center"><Factory size={18} className="text-blue-600" /></div>
                        <div>
                          <div className="font-bold text-foreground">{alloc.machine.name}</div>
                          <div className="text-xs text-muted-foreground font-mono mt-0.5">Capacity: {alloc.machine.capacityQty} {alloc.machine.capacityUnit}</div>
                        </div>
                      </div>
                      <div className="flex gap-4 md:gap-8">
                        <div className="space-y-1">
                          <div className="text-[10px] font-bold text-muted-foreground uppercase">Target Allocation</div>
                          <div className="flex items-center gap-2">
                            <InputNumber min={0} step={0.1} precision={3} value={alloc.allocatedQty} onChange={v => updateAllocation(idx, 'allocatedQty', v || 0)} className="w-28 font-semibold" />
                            <span className="text-xs font-bold text-muted-foreground">{productionUnit}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[10px] font-bold text-muted-foreground uppercase">Est. Packets</div>
                          <InputNumber min={0} step={1} precision={0} value={alloc.plannedPackets} onChange={v => updateAllocation(idx, 'plannedPackets', v || 0)} className="w-24 font-semibold" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-2 mt-6">
                  <label className="text-sm font-bold text-foreground">Notes (optional)</label>
                  <Input.TextArea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Supervisor notes..." className="rounded-xl" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="px-6 py-5 border-t border-border bg-muted/10 flex items-center justify-between">
            <Button size="large" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="rounded-xl font-semibold"><ArrowLeft size={16} className="mr-1 inline" /> Back</Button>
            {step < 1 ? (
              <Button type="primary" size="large" onClick={proceedToMachineAllocation} className="rounded-xl px-6 font-bold shadow-md" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}>Next Step <ArrowRight size={16} className="ml-1 inline" /></Button>
            ) : (
              <Button type="primary" size="large" loading={submitting} onClick={handleSubmit} className="rounded-xl px-8 font-bold shadow-md" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}><CheckCircle size={18} className="mr-2 inline" /> Make Allocation</Button>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default NewFGProductionEntryPage;
