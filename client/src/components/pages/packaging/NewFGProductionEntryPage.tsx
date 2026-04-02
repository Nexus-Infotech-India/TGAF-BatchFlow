import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { API_ROUTES } from '../../../utils/api';
import { Button, InputNumber, Input, message, Steps } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Package,
  Factory,
  CheckCircle,
  Scale,
  Hash,
} from 'lucide-react';

/* ─── Unit conversion helpers ─── */
const UNIT_TO_GRAMS: Record<string, number> = {
  gram: 1, grams: 1, g: 1,
  kg: 1000, KG: 1000, Kg: 1000,
  ton: 1_000_000, Ton: 1_000_000, TON: 1_000_000, tonne: 1_000_000,
  quintal: 100_000, Quintal: 100_000,
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

/* ─── Types ─── */
interface FGBatch {
  id: string;
  batchNumber: string;
  fgProductName: string;
  productionQty: number;
  productionUnit: string;
  packetSize?: number;
  packetUnit?: string;
  totalPackets: number;
  status: string;
  notes?: string;
  createdAt: string;
  hasProductionEntry?: boolean;
  consumptions: any[];
}

interface MachineData {
  id: string;
  machineId: string;
  name: string;
  location: string;
  capacityQty: number;
  capacityUnit: string;
}

interface MachineAllocation {
  machine: MachineData;
  allocatedQty: number;
  allocatedUnit: string;
  plannedPackets: number;
  notes: string;
}

/* ─── Component ─── */
const NewFGProductionEntryPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  // Step 1: FG Batch selection
  const [batches, setBatches] = useState<FGBatch[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<FGBatch | null>(null);

  // Step 2: Auto allocation
  const [machines, setMachines] = useState<MachineData[]>([]);
  const [loadingMachines, setLoadingMachines] = useState(false);
  const [allocations, setAllocations] = useState<MachineAllocation[]>([]);

  // Step 4: Notes + Submit
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /* ─── Fetch accepted batches ─── */
  useEffect(() => {
    const fetch = async () => {
      setLoadingBatches(true);
      try {
        const res = await api.get(API_ROUTES.RAW.GET_ACCEPTED_FG_BATCHES);
        setBatches((res.data?.data || []).filter((b: FGBatch) => !b.hasProductionEntry));
      } catch (err) {
        message.error('Failed to load accepted FG batches');
      }
      setLoadingBatches(false);
    };
    fetch();
  }, []);

  /* ─── Fetch machines ─── */
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(API_ROUTES.MACHINE.GET_MACHINES);
        setMachines(res.data?.data || []);
      } catch (err) {
        message.error('Failed to load machines');
      }
    };
    fetch();
  }, []);

  /* ─── Build allocations when batch and machines are ready ─── */
  const buildAllocations = (batch: FGBatch, machineList: MachineData[]) => {
    if (!batch || machineList.length === 0) return;

    const totalCapTon = machineList.reduce((s, m) => s + capacityInTon(m), 0);
    const packetSizeGrams =
      batch.packetSize && batch.packetUnit ? toGrams(batch.packetSize, batch.packetUnit) : 0;

    const allocs: MachineAllocation[] = machineList.map((machine) => {
      const proportion = totalCapTon > 0 ? capacityInTon(machine) / totalCapTon : 1 / machineList.length;
      const allocatedQty = Number((batch.productionQty * proportion).toFixed(3));

      let plannedPackets = 0;
      if (packetSizeGrams > 0) {
        const allocGrams = toGrams(allocatedQty, batch.productionUnit);
        plannedPackets = Math.floor(allocGrams / packetSizeGrams);
      }

      return {
        machine,
        allocatedQty: 0,
        allocatedUnit: batch.productionUnit,
        plannedPackets: 0,
        notes: '',
      };
    });

    setAllocations(allocs);
  };

  const handleSelectBatch = (batch: FGBatch) => {
    setSelectedBatch(batch);
    buildAllocations(batch, machines);
    setStep(1);
  };

  const updateAllocation = (index: number, field: string, value: any) => {
    setAllocations((prev) => {
      const next = [...prev];
      (next[index] as any)[field] = value;

      // Auto-calc planned packets if allocated qty changes
      if (field === 'allocatedQty' && selectedBatch) {
        const packetSizeGrams =
          selectedBatch.packetSize && selectedBatch.packetUnit
            ? toGrams(selectedBatch.packetSize, selectedBatch.packetUnit)
            : 0;
        if (packetSizeGrams > 0 && value > 0) {
          const allocGrams = toGrams(value, selectedBatch.productionUnit);
          next[index].plannedPackets = Math.floor(allocGrams / packetSizeGrams);
        } else {
          next[index].plannedPackets = 0;
        }
      }

      return next;
    });
  };

  /* ─── Summary calculations ─── */
  const totalAllocatedQty = allocations.reduce((s, a) => s + (Number(a.allocatedQty) || 0), 0);
  const totalPlannedPackets = allocations.reduce((s, a) => s + (Number(a.plannedPackets) || 0), 0);
  const remainingQty = selectedBatch ? Number((selectedBatch.productionQty - totalAllocatedQty).toFixed(3)) : 0;
  const isFullyAllocated = selectedBatch ? Math.abs(remainingQty) < 0.001 : false;

  /* Helper: get machine capacity in the same unit as the batch for comparison */
  const getMachineCapacityInBatchUnit = (machine: MachineData): number => {
    if (!selectedBatch) return 0;
    const capTon = capacityInTon(machine);
    const batchUnit = selectedBatch.productionUnit.toLowerCase();
    if (batchUnit === 'ton' || batchUnit === 'tonne') return capTon;
    if (batchUnit === 'kg') return capTon * 1000;
    if (batchUnit === 'gram' || batchUnit === 'grams' || batchUnit === 'g') return capTon * 1_000_000;
    if (batchUnit === 'quintal') return capTon * 10;
    return capTon;
  };

  /* ─── Submit ─── */
  const handleSubmit = async () => {
    if (!selectedBatch) return;

    if (totalAllocatedQty <= 0) {
      message.error('Please allocate production to at least one machine');
      return;
    }

    if (!isFullyAllocated) {
      if (remainingQty > 0) {
        message.error(`You still have ${remainingQty.toFixed(3)} ${selectedBatch.productionUnit} remaining. Please distribute the full quantity.`);
      } else {
        message.error(`Total allocated exceeds target by ${Math.abs(remainingQty).toFixed(3)} ${selectedBatch.productionUnit}. Please reduce allocation.`);
      }
      return;
    }

    setSubmitting(true);
    try {
      // Filter out zero allocations
      const activeAllocations = allocations.filter(a => a.allocatedQty > 0);

      await api.post(API_ROUTES.RAW.CREATE_FG_PRODUCTION_ENTRY, {
        fgBatchId: selectedBatch.id,
        notes,
        machineEntries: activeAllocations.map((a) => ({
          machineId: a.machine.id,
          allocatedQty: a.allocatedQty,
          plannedPackets: a.plannedPackets,
          notes: a.notes,
        })),
      });
      message.success('Production machine mapping created successfully!');
      navigate('/packaging/fg-production');
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to create production mapping');
    }
    setSubmitting(false);
  };

  const stepItems = [
    { title: 'Select Batch', icon: <Package size={16} /> },
    { title: 'Machine Assignment', icon: <Factory size={16} /> },
  ];

  return (
    <motion.div className="min-h-screen bg-background p-4 md:p-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            icon={<ArrowLeft size={18} />}
            onClick={() => navigate('/packaging/fg-production')}
            className="rounded-full shadow-sm hover:shadow-md transition-shadow"
            size="large"
          />
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              New Production Entry
            </h1>
            <p className="text-muted-foreground">Machine-wise FG production recording with auto-allocation</p>
          </div>
        </div>

        {/* Stepper */}
        <motion.div
          className="bg-card rounded-2xl p-4 mb-6 border border-border/80 shadow-sm"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.05 }}
        >
          <Steps
            current={step}
            items={stepItems.map((s, i) => ({
              title: <span className="text-xs font-semibold">{s.title}</span>,
              icon: (
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    i <= step
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/30'
                      : 'bg-muted/60 text-muted-foreground'
                  }`}
                >
                  {i < step ? <CheckCircle size={16} /> : s.icon}
                </div>
              ),
            }))}
            className="px-2"
          />
        </motion.div>

        {/* Step Content */}
        <motion.div
          className="bg-card rounded-2xl border border-border/80 shadow-xl overflow-hidden"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <AnimatePresence mode="wait">
            {/* ═══ STEP 1: Select Accepted FG Batch ═══ */}
            {step === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-6 md:p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
                    <Package size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Select Accepted FG Batch</h2>
                    <p className="text-sm text-muted-foreground">Choose an accepted batch from the Receive Materials flow</p>
                  </div>
                </div>

                {loadingBatches ? (
                  <div className="flex items-center justify-center py-20">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      className="w-8 h-8 border-[3px] rounded-full border-t-emerald-600 border-emerald-200"
                    />
                  </div>
                ) : batches.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <Package className="mx-auto mb-3 opacity-30" size={48} />
                    <p className="text-lg font-semibold">No accepted FG batches available</p>
                    <p className="text-sm mt-1">Create and accept FG batches first from the Receive Materials page.</p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border shadow-sm overflow-hidden bg-card">
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-muted/50 border-b border-border">
                          <tr>
                            <th className="px-5 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Batch Number</th>
                            <th className="px-5 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Product</th>
                            <th className="px-5 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Target Qty</th>
                            <th className="px-5 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Packets</th>
                            <th className="px-5 py-4 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">Created</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {batches.map((batch) => (
                            <tr 
                              key={batch.id} 
                              onClick={() => handleSelectBatch(batch)}
                              className={`cursor-pointer transition-colors ${
                                selectedBatch?.id === batch.id
                                  ? 'bg-emerald-500/10 hover:bg-emerald-500/20'
                                  : 'hover:bg-muted/30'
                              }`}
                            >
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  {selectedBatch?.id === batch.id ? (
                                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                                      <CheckCircle size={12} className="text-white" />
                                    </div>
                                  ) : (
                                    <div className="p-2 rounded-lg bg-violet-500/10 shrink-0">
                                      <Package size={16} className="text-violet-600" />
                                    </div>
                                  )}
                                  <span className="font-bold font-mono text-primary">{batch.batchNumber}</span>
                                </div>
                              </td>
                              <td className="px-5 py-4">
                                <span className="font-semibold text-foreground">{batch.fgProductName}</span>
                              </td>
                              <td className="px-5 py-4 text-right">
                                <span className="bg-indigo-500/10 text-indigo-600 px-3 py-1 rounded-lg text-xs font-bold border border-indigo-500/20 whitespace-nowrap">
                                  <Scale size={10} className="inline mr-1" />
                                  {batch.productionQty} {batch.productionUnit}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-right">
                                {batch.totalPackets > 0 ? (
                                  <span className="bg-violet-500/10 text-violet-600 px-3 py-1 rounded-lg text-xs font-bold border border-violet-500/20 whitespace-nowrap">
                                    <Hash size={10} className="inline mr-1" />
                                    {batch.totalPackets.toLocaleString()}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground text-xs">-</span>
                                )}
                              </td>
                              <td className="px-5 py-4 text-center text-[11px] text-muted-foreground">
                                {new Date(batch.createdAt).toLocaleDateString()}
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

            {/* ═══ STEP 2: Machine Assignment ═══ */}
            {step === 1 && selectedBatch && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-6 md:p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
                    <Factory size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Machine Assignment</h2>
                    <p className="text-sm text-muted-foreground">
                      Assign target production quantities and estimated packets to machines
                    </p>
                  </div>
                </div>

                {/* Batch Info Card */}
                <div className="mb-6 rounded-xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 p-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Batch</div>
                      <div className="text-sm font-bold font-mono text-primary mt-1">{selectedBatch.batchNumber}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Product</div>
                      <div className="text-sm font-bold text-foreground mt-1">{selectedBatch.fgProductName}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Target Production</div>
                      <div className="text-sm font-bold text-emerald-600 mt-1">
                        {selectedBatch.productionQty} {selectedBatch.productionUnit}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Allocated</div>
                      <div className={`text-sm font-bold mt-1 ${isFullyAllocated ? 'text-emerald-600' : totalAllocatedQty > selectedBatch.productionQty ? 'text-red-500' : 'text-blue-600'}`}>
                        {totalAllocatedQty.toFixed(3)} / {selectedBatch.productionQty} {selectedBatch.productionUnit}
                      </div>
                      {!isFullyAllocated && totalAllocatedQty > 0 && (
                        <div className={`text-xs font-semibold mt-0.5 ${remainingQty > 0 ? 'text-amber-600' : 'text-red-500'}`}>
                          {remainingQty > 0
                            ? `⚠ ${remainingQty.toFixed(3)} ${selectedBatch.productionUnit} remaining`
                            : `✕ Exceeds by ${Math.abs(remainingQty).toFixed(3)} ${selectedBatch.productionUnit}`
                          }
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Machine Assignment Grid */}
                <div className="space-y-4 mb-6">
                  {allocations.map((alloc, idx) => (
                    <motion.div
                      key={alloc.machine.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex flex-col md:flex-row gap-4 p-4 rounded-xl border-2 border-border bg-card hover:border-blue-500/30 transition-colors items-center"
                    >
                      <div className="flex-1 flex gap-3 min-w-[200px]">
                        <div className="p-2 rounded-lg bg-blue-500/10 shrink-0 h-10 w-10 flex items-center justify-center">
                          <Factory size={18} className="text-blue-600" />
                        </div>
                        <div>
                          <div className="font-bold text-foreground leading-tight">{alloc.machine.name}</div>
                          <div className="text-xs text-muted-foreground font-mono mt-0.5">
                            Capacity: {alloc.machine.capacityQty} {alloc.machine.capacityUnit === 'TON_PER_SHIFT' ? 'Ton/Shift' : 'KG/Shift'}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4 md:gap-8 min-w-[300px]">
                        <div className="space-y-1">
                          <div className="text-[10px] font-bold text-muted-foreground uppercase">Target Allocation</div>
                          <div className="flex items-center gap-2">
                            <InputNumber
                              min={0}
                              step={0.1}
                              precision={3}
                              value={alloc.allocatedQty || undefined}
                              onChange={(val) => updateAllocation(idx, 'allocatedQty', val || 0)}
                              placeholder="0.00"
                              className="w-28 font-semibold"
                              status={alloc.allocatedQty > getMachineCapacityInBatchUnit(alloc.machine) ? 'warning' : undefined}
                            />
                            <span className="text-xs font-bold text-muted-foreground">{selectedBatch.productionUnit}</span>
                          </div>
                          {alloc.allocatedQty > getMachineCapacityInBatchUnit(alloc.machine) && (
                            <div className="text-[10px] text-amber-600 font-semibold mt-1">
                              ⚠ Exceeds capacity ({getMachineCapacityInBatchUnit(alloc.machine).toFixed(2)} {selectedBatch.productionUnit}/Shift)
                            </div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="text-[10px] font-bold text-muted-foreground uppercase">Est. Packets</div>
                          <InputNumber
                            min={0}
                            step={1}
                            precision={0}
                            value={alloc.plannedPackets || undefined}
                            onChange={(val) => updateAllocation(idx, 'plannedPackets', val || 0)}
                            placeholder="0"
                            className="w-28 font-semibold"
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className={`flex items-center justify-between p-4 rounded-xl border ${isFullyAllocated ? 'bg-emerald-500/5 border-emerald-500/30' : remainingQty < 0 ? 'bg-red-500/5 border-red-500/30' : 'bg-muted/30 border-border'}`}>
                  <div>
                    <span className="font-bold">Total Mapping:</span>
                    {!isFullyAllocated && totalAllocatedQty > 0 && (
                      <span className={`ml-3 text-xs font-semibold px-2 py-0.5 rounded-full ${remainingQty > 0 ? 'bg-amber-500/10 text-amber-600' : 'bg-red-500/10 text-red-500'}`}>
                        {remainingQty > 0
                          ? `${remainingQty.toFixed(3)} ${selectedBatch.productionUnit} remaining`
                          : `Exceeds by ${Math.abs(remainingQty).toFixed(3)} ${selectedBatch.productionUnit}`
                        }
                      </span>
                    )}
                    {isFullyAllocated && (
                      <span className="ml-3 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                        ✓ Fully distributed
                      </span>
                    )}
                  </div>
                  <div className="flex gap-8">
                    <span className={`font-bold ${isFullyAllocated ? 'text-emerald-600' : remainingQty < 0 ? 'text-red-500' : 'text-blue-600'}`}>
                      {totalAllocatedQty.toFixed(3)} {selectedBatch.productionUnit}
                    </span>
                    <span className="font-bold text-violet-600">
                      {totalPlannedPackets.toLocaleString()} Packets
                    </span>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2 mt-6">
                  <label className="text-sm font-bold text-foreground">Remarks (optional)</label>
                  <Input.TextArea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about machine allocation..."
                    autoSize={{ minRows: 2, maxRows: 4 }}
                    className="rounded-xl bg-muted/20 border-border/50"
                  />
                </div>
              </motion.div>
            )}


          </AnimatePresence>

          {/* Navigation */}
          <div className="px-6 py-5 border-t border-border bg-muted/10 flex items-center justify-between">
            <Button
              size="large"
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="rounded-xl px-6 h-11 font-semibold"
              icon={<ArrowLeft size={16} />}
            >
              Back
            </Button>

            <div className="text-sm text-muted-foreground font-medium">
              Step {step + 1} of 2
            </div>

            {step < 1 ? (
              <Button
                type="primary"
                size="large"
                onClick={() => {
                  if (step === 0 && !selectedBatch) {
                    message.warning('Please select an FG batch first');
                    return;
                  }
                  if (step === 0 && machines.length === 0) {
                    message.warning('No machines configured. Add machines first.');
                    return;
                  }
                  setStep(step + 1);
                }}
                disabled={step === 0 && !selectedBatch}
                className="rounded-xl px-6 h-11 font-bold shadow-lg border-0"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
              >
                Next <ArrowRight size={16} className="ml-1 inline" />
              </Button>
            ) : (
              <Button
                type="primary"
                size="large"
                loading={submitting}
                onClick={handleSubmit}
                disabled={!isFullyAllocated}
                className="rounded-xl px-8 h-11 text-base font-bold shadow-lg shadow-emerald-500/30 border-0 transition-all hover:scale-105 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
              >
                {!submitting && <CheckCircle size={18} className="mr-2 inline" />}
                Submit Allocation
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default NewFGProductionEntryPage;
