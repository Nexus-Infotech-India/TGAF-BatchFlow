import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, InputNumber, Input, message, Modal, Empty, Spin } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Package,
  Factory,
  ClipboardCheck,
  CheckCircle,
  Hash,
  AlertTriangle,
  Trash2,
  Scale,
  Zap,
} from 'lucide-react';
import api, { API_ROUTES } from '../../../utils/api';

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

export default function ProductionOutputEntryPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  
  // Machine inputs form state
  const [machineInputs, setMachineInputs] = useState<any[]>([]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /* ─── Fetch Pending Entries ─── */
  useEffect(() => {
    const fetchEntries = async () => {
      setLoading(true);
      try {
        const res = await api.get(API_ROUTES.RAW.GET_FG_PRODUCTION_ENTRIES);
        if (res.data?.success) {
          const pending = res.data.data.filter((e: any) => e.status === 'PENDING');
          setEntries(pending);
        }
      } catch (err: any) {
        message.error('Failed to load pending production entries');
      } finally {
        setLoading(false);
      }
    };
    fetchEntries();
  }, []);

  const handleSelectEntry = (entry: any) => {
    setSelectedEntry(entry);
    
    // Initialize machine inputs mapping
    const initInputs = entry.machineEntries.map((me: any) => {
      return {
        id: me.id,
        machine: me.machine,
        allocatedQty: me.allocatedQty,
        allocatedUnit: me.allocatedUnit,
        plannedPackets: me.plannedPackets,
        actualFgQty: 0,
        actualByproduct: 0,
        actualScrap: 0,
        actualPackets: 0,
      };
    });
    setMachineInputs(initInputs);
    setStep(1);
  };

  const updateInput = (index: number, field: string, value: any) => {
    setMachineInputs((prev) => {
      const next = [...prev];
      (next[index] as any)[field] = value;

      // Auto-calc packets if FG qty changes
      if (field === 'actualFgQty' && selectedEntry?.fgBatch) {
        const packetSizeGrams =
          selectedEntry.fgBatch.packetSize && selectedEntry.fgBatch.packetUnit
            ? toGrams(selectedEntry.fgBatch.packetSize, selectedEntry.fgBatch.packetUnit)
            : 0;
        if (packetSizeGrams > 0 && value > 0) {
          const actualFgGrams = toGrams(value, selectedEntry.fgBatch.productionUnit);
          next[index].actualPackets = Math.floor(actualFgGrams / packetSizeGrams);
        } else {
          next[index].actualPackets = 0;
        }
      }
      return next;
    });
  };

  /* ─── Summary calculations ─── */
  const totalAllocated = machineInputs.reduce((s, a) => s + (Number(a.allocatedQty) || 0), 0);
  const totalActualFg = machineInputs.reduce((s, a) => s + (Number(a.actualFgQty) || 0), 0);
  const totalByproduct = machineInputs.reduce((s, a) => s + (Number(a.actualByproduct) || 0), 0);
  const totalScrap = machineInputs.reduce((s, a) => s + (Number(a.actualScrap) || 0), 0);
  const totalActualPackets = machineInputs.reduce((s, a) => s + (Number(a.actualPackets) || 0), 0);

  const handleSubmit = async () => {
    if (!selectedEntry) return;

    // Validate
    for (const alloc of machineInputs) {
      if (alloc.actualFgQty > alloc.allocatedQty * 1.05) {
        message.warning(`${alloc.machine.name}: Actual FG exceeds allocated by more than 5%. Will require approval if strict check is active.`);
      }
    }

    if (totalActualFg <= 0) {
      message.error('Please enter actual FG production for at least one machine');
      return;
    }

    if (totalActualFg > selectedEntry.targetQty * 1.05) {
      message.error(`Total actual FG exceeds batch target by more than 5%`);
      return;
    }

    setSubmitting(true);
    try {
      await api.put(API_ROUTES.RAW.COMPLETE_FG_PRODUCTION_ENTRY(selectedEntry.id), {
        machineEntries: machineInputs.map((a) => ({
          id: a.id,
          actualFgQty: a.actualFgQty,
          actualByproduct: a.actualByproduct,
          actualScrap: a.actualScrap,
          actualPackets: a.actualPackets,
        })),
        notes
      });
      message.success('Production output submitted successfully!');
      navigate('/packaging/fg-production');
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to submit production output');
    }
    setSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto py-8"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-foreground">Production Output Entry</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Record actual production output against allocated machine targets
          </p>
        </div>
      </div>

      <div className="bg-card rounded-2xl shadow-xl shadow-black/5 border border-border overflow-hidden">
        {/* Header Steps */}
        <div className="px-6 py-4 border-b border-border bg-muted/10">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 ${step >= 0 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 0 ? 'bg-primary text-white' : 'bg-primary/20'}`}>1</div>
              <span className="font-semibold text-sm">Select Running Allocation</span>
            </div>
            <div className="flex-1 max-w-[100px] h-0.5 bg-border mx-4" />
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 1 ? 'bg-blue-600 text-white' : step > 1 ? 'bg-blue-600/20' : 'bg-muted'}`}>2</div>
              <span className="font-semibold text-sm">Supervisor Output Entry</span>
            </div>
            <div className="flex-1 max-w-[100px] h-0.5 bg-border mx-4" />
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-emerald-600' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 2 ? 'bg-emerald-600 text-white' : 'bg-muted'}`}>3</div>
              <span className="font-semibold text-sm">Review & Submit</span>
            </div>
          </div>
        </div>

        <motion.div className="relative min-h-[400px]">
          <AnimatePresence mode="wait">
            
            {/* ═══ STEP 0: Select Pipeline ═══ */}
            {step === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-6 md:p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
                    <Package size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Select Allocated Output</h2>
                    <p className="text-sm text-muted-foreground">Select an in-progress machine allocation entry to record output</p>
                  </div>
                </div>

                {loading ? (
                  <div className="py-20 flex justify-center"><Spin size="large" /></div>
                ) : entries.length === 0 ? (
                  <Empty description="No pending allocations found" className="py-10" />
                ) : (
                  <div className="rounded-xl border border-border shadow-sm overflow-hidden bg-card">
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-muted/50 border-b border-border">
                          <tr>
                            <th className="px-5 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Allocation No</th>
                            <th className="px-5 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Batch</th>
                            <th className="px-5 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Product</th>
                            <th className="px-5 py-4 text-right text-xs font-bold text-muted-foreground uppercase">Target Qty</th>
                            <th className="px-5 py-4 text-center text-xs font-bold text-muted-foreground uppercase">Machines</th>
                            <th className="px-5 py-4 text-center text-xs font-bold text-muted-foreground uppercase">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {entries.map((entry) => (
                            <tr key={entry.id} className="hover:bg-muted/20 transition-colors">
                              <td className="px-5 py-4 font-bold text-primary text-sm">{entry.entryNumber}</td>
                              <td className="px-5 py-4 text-sm">
                                <div className="font-mono">{entry.fgBatch?.batchNumber}</div>
                                <div className="text-[10px] text-muted-foreground mt-0.5">{new Date(entry.createdAt).toLocaleDateString()}</div>
                              </td>
                              <td className="px-5 py-4 font-semibold text-foreground text-sm">{entry.fgProductName}</td>
                              <td className="px-5 py-4 text-right font-bold text-emerald-600 text-sm">
                                {entry.targetQty} {entry.targetUnit}
                              </td>
                              <td className="px-5 py-4 text-center text-sm font-semibold text-muted-foreground">
                                {entry.machineEntries?.length || 0}
                              </td>
                              <td className="px-5 py-4 text-center">
                                <Button
                                  type="primary"
                                  onClick={() => handleSelectEntry(entry)}
                                  className="rounded-lg shadow-sm font-semibold"
                                >
                                  Record Output
                                </Button>
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

            {/* ═══ STEP 1: Output Entry ═══ */}
            {step === 1 && selectedEntry && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-6 md:p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
                    <ClipboardCheck size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Machine Output Entry</h2>
                    <p className="text-sm text-muted-foreground">Enter actual FG produced, byproduct, and scrap per machine</p>
                  </div>
                </div>

                <div className="space-y-5">
                  {machineInputs.map((alloc, idx) => {
                    const overAllocated = alloc.actualFgQty > alloc.allocatedQty * 1.05;

                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        className={`rounded-xl border-2 p-5 transition-all ${
                          overAllocated ? 'border-red-400 bg-red-500/5' : 'border-border bg-card hover:border-blue-500/40'
                        }`}
                      >
                        {/* Machine header */}
                        <div className="flex items-center justify-between mb-5">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/10">
                              <Factory size={20} className="text-blue-600" />
                            </div>
                            <div>
                              <div className="font-bold text-foreground text-lg">{alloc.machine.name}</div>
                              <div className="text-xs text-muted-foreground font-mono">
                                {alloc.machine.machineId} • Allocated: <span className="font-bold text-foreground">{alloc.allocatedQty} {alloc.allocatedUnit}</span>
                              </div>
                            </div>
                          </div>
                          {alloc.actualPackets > 0 && (
                            <div className="bg-gradient-to-r from-violet-500 to-purple-600 text-white px-4 py-2 rounded-xl shadow-lg shadow-violet-500/20">
                              <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">Actual Packets</div>
                              <div className="text-xl font-black">{alloc.actualPackets.toLocaleString()}</div>
                            </div>
                          )}
                        </div>

                        {overAllocated && (
                          <div className="mb-4 flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-red-600 text-xs font-bold">
                            <AlertTriangle size={14} />
                            Actual FG exceeds allocated quantity by more than 5%
                          </div>
                        )}

                        {/* Input fields */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                              <Zap size={12} className="text-emerald-500" />
                              Actual FG Produced <span className="text-red-500">*</span>
                            </label>
                            <div className="flex items-center gap-2">
                              <InputNumber
                                min={0}
                                step={0.001}
                                precision={3}
                                value={alloc.actualFgQty || undefined}
                                onChange={(val) => updateInput(idx, 'actualFgQty', val || 0)}
                                placeholder="0.000"
                                size="large"
                                className={`w-full font-semibold ${overAllocated ? 'border-red-400' : ''}`}
                              />
                              <span className="text-sm font-bold text-muted-foreground whitespace-nowrap">{selectedEntry.targetUnit}</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                              <Trash2 size={12} className="text-amber-500" />
                              Byproduct Generated
                            </label>
                            <div className="flex items-center gap-2">
                              <InputNumber
                                min={0}
                                step={0.001}
                                precision={3}
                                value={alloc.actualByproduct || undefined}
                                onChange={(val) => updateInput(idx, 'actualByproduct', val || 0)}
                                placeholder="0.000"
                                size="large"
                                className="w-full font-semibold"
                              />
                              <span className="text-sm font-bold text-muted-foreground whitespace-nowrap">{selectedEntry.targetUnit}</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                              <AlertTriangle size={12} className="text-red-500" />
                              Scrap / Floor Sweep
                            </label>
                            <div className="flex items-center gap-2">
                              <InputNumber
                                min={0}
                                step={0.001}
                                precision={3}
                                value={alloc.actualScrap || undefined}
                                onChange={(val) => updateInput(idx, 'actualScrap', val || 0)}
                                placeholder="0.000"
                                size="large"
                                className="w-full font-semibold"
                              />
                              <span className="text-sm font-bold text-muted-foreground whitespace-nowrap">{selectedEntry.targetUnit}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ═══ STEP 2: Review & Submit ═══ */}
            {step === 2 && selectedEntry && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-6 md:p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/20">
                    <CheckCircle size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Review & Submit</h2>
                    <p className="text-sm text-muted-foreground">Verify all production data before final submission</p>
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                  {[
                    { label: 'Target FG', value: `${selectedEntry.targetQty} ${selectedEntry.targetUnit}`, color: 'from-blue-500 to-indigo-600', icon: <Scale size={16} /> },
                    { label: 'Actual FG', value: `${totalActualFg.toFixed(3)} ${selectedEntry.targetUnit}`, color: 'from-emerald-500 to-teal-600', icon: <Zap size={16} /> },
                    { label: 'Byproduct', value: `${totalByproduct.toFixed(3)} ${selectedEntry.targetUnit}`, color: 'from-amber-500 to-orange-600', icon: <Trash2 size={16} /> },
                    { label: 'Scrap', value: `${totalScrap.toFixed(3)} ${selectedEntry.targetUnit}`, color: 'from-red-500 to-rose-600', icon: <AlertTriangle size={16} /> },
                    { label: 'Actual Packets', value: totalActualPackets.toLocaleString(), color: 'from-violet-500 to-purple-600', icon: <Hash size={16} /> },
                  ].map((card, i) => (
                    <div key={i} className={`rounded-xl p-4 bg-gradient-to-br ${card.color} text-white shadow-lg relative overflow-hidden`}>
                      <div className="absolute -right-2 -top-2 w-12 h-12 bg-white/10 rounded-full blur-lg" />
                      <div className="relative z-10">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider opacity-80 mb-1">
                          {card.icon} {card.label}
                        </div>
                        <div className="text-lg font-black">{card.value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Detailed Table */}
                <div className="rounded-xl border border-border shadow-sm overflow-hidden bg-card mb-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-muted/50 border-b border-border">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Machine</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase">Allocated</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-emerald-600 uppercase">Actual FG</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-amber-600 uppercase">Byproduct</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-red-600 uppercase">Scrap</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-violet-600 uppercase">Packets</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {machineInputs.map((alloc, idx) => (
                          <tr key={idx} className="hover:bg-muted/20">
                            <td className="px-4 py-3">
                              <div className="font-bold text-foreground">{alloc.machine.name}</div>
                              <div className="text-[10px] text-muted-foreground font-mono">{alloc.machine.machineId}</div>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-muted-foreground">
                              {alloc.allocatedQty} {alloc.allocatedUnit}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-emerald-600">
                              {alloc.actualFgQty} {selectedEntry.targetUnit}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-amber-600">
                              {alloc.actualByproduct} {selectedEntry.targetUnit}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-red-600">
                              {alloc.actualScrap} {selectedEntry.targetUnit}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-violet-600">
                              {alloc.actualPackets.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-muted/40 border-t-2 border-border font-bold">
                        <tr>
                          <td className="px-4 py-3 text-foreground">TOTAL</td>
                          <td className="px-4 py-3 text-right text-muted-foreground">
                            {totalAllocated.toFixed(3)} {selectedEntry.targetUnit}
                          </td>
                          <td className="px-4 py-3 text-right text-emerald-600 text-base">
                            {totalActualFg.toFixed(3)} {selectedEntry.targetUnit}
                          </td>
                          <td className="px-4 py-3 text-right text-amber-600">
                            {totalByproduct.toFixed(3)} {selectedEntry.targetUnit}
                          </td>
                          <td className="px-4 py-3 text-right text-red-600">
                            {totalScrap.toFixed(3)} {selectedEntry.targetUnit}
                          </td>
                          <td className="px-4 py-3 text-right text-violet-600 text-base">
                            {totalActualPackets.toLocaleString()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Efficiency indicator */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-border p-4 bg-card">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Production Efficiency</div>
                    <div className="flex items-end gap-2">
                      <span className={`text-3xl font-black ${
                        totalActualFg / selectedEntry.targetQty >= 0.9 ? 'text-emerald-600' :
                        totalActualFg / selectedEntry.targetQty >= 0.7 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {selectedEntry.targetQty > 0 ? ((totalActualFg / selectedEntry.targetQty) * 100).toFixed(1) : 0}%
                      </span>
                      <span className="text-sm text-muted-foreground mb-1">of target production</span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border p-4 bg-card">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Wastage Rate</div>
                    <div className="flex items-end gap-2">
                      <span className={`text-3xl font-black ${
                        (totalByproduct + totalScrap) / totalActualFg <= 0.05 ? 'text-emerald-600' :
                        (totalByproduct + totalScrap) / totalActualFg <= 0.15 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {totalActualFg > 0 ? (((totalByproduct + totalScrap) / totalActualFg) * 100).toFixed(1) : 0}%
                      </span>
                      <span className="text-sm text-muted-foreground mb-1">byproduct + scrap as % of FG</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2 mb-6">
                  <label className="text-sm font-bold text-foreground">Production Remarks (optional)</label>
                  <Input.TextArea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes about this production run..."
                    autoSize={{ minRows: 2, maxRows: 4 }}
                    className="rounded-xl bg-muted/20 border-border/50"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          {step > 0 && (
            <div className="px-6 py-5 border-t border-border bg-muted/10 flex items-center justify-between mt-auto">
              <Button
                size="large"
                onClick={() => setStep(step - 1)}
                className="rounded-xl px-6 h-11 font-semibold"
                icon={<ArrowLeft size={16} />}
              >
                Back
              </Button>

              {step === 1 ? (
                <Button
                  type="primary"
                  size="large"
                  onClick={() => {
                    if (totalActualFg <= 0) {
                      message.warning('Please enter actual production quantities before proceeding');
                      return;
                    }
                    setStep(step + 1);
                  }}
                  className="rounded-xl px-6 h-11 font-bold shadow-lg shadow-blue-500/20 border-0"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #4f46e5)' }}
                >
                  Review Details <ArrowRight size={16} className="ml-1 inline" />
                </Button>
              ) : (
                <Button
                  type="primary"
                  size="large"
                  loading={submitting}
                  onClick={handleSubmit}
                  disabled={totalActualFg <= 0}
                  className="rounded-xl px-8 h-11 text-base font-bold shadow-lg shadow-emerald-500/30 border-0 transition-all hover:scale-105 active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                >
                  {!submitting && <CheckCircle size={18} className="mr-2 inline" />}
                  Submit Production Output
                </Button>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
