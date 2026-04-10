import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, InputNumber, Input, message, Empty, Spin, Select } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Package,
  Factory,
  ClipboardCheck,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Clock,
  Users,
  Sun,
  AlertTriangle,
} from 'lucide-react';
import api, { API_ROUTES } from '../../../utils/api';

const PAGE_SIZE = 10;

const convertToKg = (qty: number, unit: string) => {
  if (!qty) return 0;
  const u = (unit || '').toUpperCase();
  if (u === 'TON') return qty * 1000;
  if (u === 'KG') return qty;
  if (u === 'G' || u === 'GRAM' || u === 'GRAMS') return qty / 1000;
  if (u === 'MG') return qty / 1000000;
  return qty;
};

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
  const [page, setPage] = useState(1);


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
        actualFgQty: me.allocatedQty,
        actualByproduct: 0,
        actualScrap: 0,
        machineSpeed: me.machine?.machineSpeed || null,
        todayAchieve: null,
        laminateConsumption: me.laminateConsumptionQty || null,
        laminateConsumptionUnit: me.laminateConsumptionUnit || null,
        sfgConsumption: me.sfgConsumptionQty || null,
        sfgConsumptionUnit: me.sfgConsumptionUnit || 'KG',
        laminateWastageKg: null,
        laminateWastageQty: null,
        laminateWastageUnit: 'KG',
        laminateWastagePercentage: 0,
        noManPower: me.manPower === false,
        // New fields
        powderWastageKg: null,
        powderWastagePercentage: null,
        manPowerCount: null,
        shift: null,
        machineUtilizedHrs: null,
        machineNotUtilizedHrs: null,
        downtimeRecords: [] as { startTime: string; stopTime: string; breakdownReason: string; remark: string }[],
      };
    });
    setMachineInputs(initInputs);
    setStep(1);
  };

  const updateInput = (index: number, field: string, value: any) => {
    setMachineInputs((prev) => {
      const next = [...prev];
      (next[index] as any)[field] = value;

      if (['laminateWastageQty', 'laminateWastageUnit', 'laminateConsumption', 'laminateConsumptionUnit'].includes(field)) {
        const consQty = next[index].laminateConsumption || 0;
        const consUnit = next[index].laminateConsumptionUnit || 'KG';
        const wasteQty = next[index].laminateWastageQty || 0;
        const wasteUnit = next[index].laminateWastageUnit || 'KG';

        const consInKg = convertToKg(consQty, consUnit);
        const wasteInKg = convertToKg(wasteQty, wasteUnit);

        next[index].laminateWastageKg = wasteInKg;

        if (consInKg > 0) {
          next[index].laminateWastagePercentage = Number(((wasteInKg / consInKg) * 100).toFixed(2));
        } else {
          next[index].laminateWastagePercentage = 0;
        }
      } else if (field === 'laminateWastagePercentage') {
        const consQty = next[index].laminateConsumption || 0;
        const consUnit = next[index].laminateConsumptionUnit || 'KG';
        const wasteUnit = next[index].laminateWastageUnit || 'KG';

        const consInKg = convertToKg(consQty, consUnit);
        if (consInKg > 0) {
           const wasteInKg = (value / 100) * consInKg;
           next[index].laminateWastageKg = wasteInKg;

           if (wasteUnit.toUpperCase() === 'KG') next[index].laminateWastageQty = Number(wasteInKg.toFixed(4));
           else if (wasteUnit.toUpperCase() === 'G' || wasteUnit.toUpperCase() === 'GRAM' || wasteUnit.toUpperCase() === 'GRAMS') next[index].laminateWastageQty = Number((wasteInKg * 1000).toFixed(2));
           else next[index].laminateWastageQty = Number(wasteInKg.toFixed(4));
        }
      }

      // Auto-calculate powder wastage percentage from KG
      if (field === 'powderWastageKg') {
        const sfgCons = convertToKg(next[index].sfgConsumption || 0, next[index].sfgConsumptionUnit || 'KG');
        if (sfgCons > 0) {
          next[index].powderWastagePercentage = Number(((Number(value) / sfgCons) * 100).toFixed(2));
        }
      }

      return next;
    });
  };

  /* ─── Downtime record helpers ─── */
  const addDowntimeRecord = (machineIdx: number) => {
    setMachineInputs(prev => {
      const next = [...prev];
      next[machineIdx] = {
        ...next[machineIdx],
        downtimeRecords: [...(next[machineIdx].downtimeRecords || []), { startTime: '', stopTime: '', breakdownReason: '', remark: '' }],
      };
      return next;
    });
  };

  const updateDowntimeRecord = (machineIdx: number, dtIdx: number, field: string, value: string) => {
    setMachineInputs(prev => {
      const next = [...prev];
      const records = [...(next[machineIdx].downtimeRecords || [])];
      records[dtIdx] = { ...records[dtIdx], [field]: value };
      next[machineIdx] = { ...next[machineIdx], downtimeRecords: records };
      return next;
    });
  };

  const removeDowntimeRecord = (machineIdx: number, dtIdx: number) => {
    setMachineInputs(prev => {
      const next = [...prev];
      const records = [...(next[machineIdx].downtimeRecords || [])];
      records.splice(dtIdx, 1);
      next[machineIdx] = { ...next[machineIdx], downtimeRecords: records };
      return next;
    });
  };

  /* ─── Summary calculations ─── */
  const handleSubmit = async () => {
    if (!selectedEntry) return;

    // Removed strict allocation validations since values are implicitly set or driven by backend

    setSubmitting(true);
    try {
      await api.put(API_ROUTES.RAW.COMPLETE_FG_PRODUCTION_ENTRY(selectedEntry.id), {
        machineEntries: machineInputs.map((a) => ({
          id: a.id,
          actualFgQty: a.actualFgQty,
          actualByproduct: a.actualByproduct,
          actualScrap: a.actualScrap,
          actualUnit: a.actualUnit || selectedEntry?.targetUnit,
          actualByproductUnit: a.actualByproductUnit || selectedEntry?.targetUnit,
          actualScrapUnit: a.actualScrapUnit || selectedEntry?.targetUnit,
          machineSpeed: a.machineSpeed,
          todayAchieve: a.todayAchieve,
          laminateConsumption: a.laminateConsumption,
          sfgConsumption: a.sfgConsumption,
          laminateWastageKg: a.laminateWastageKg,
          laminateWastagePercentage: a.laminateWastagePercentage,
          noManPower: a.noManPower,
          powderWastageKg: a.powderWastageKg,
          powderWastagePercentage: a.powderWastagePercentage,
          manPowerCount: a.manPowerCount,
          shift: a.shift,
          machineUtilizedHrs: a.machineUtilizedHrs,
          machineNotUtilizedHrs: a.machineNotUtilizedHrs,
          downtimeRecords: a.downtimeRecords || [],
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
                          {entries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((entry) => (
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

                    {/* Pagination */}
                    {entries.length > PAGE_SIZE && (
                      <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/10">
                        <p className="text-xs text-muted-foreground">
                          Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, entries.length)} of {entries.length}
                        </p>
                        <div className="flex gap-1">
                          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg border border-border hover:bg-muted/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                            <ChevronLeft size={16} />
                          </button>
                          {Array.from({ length: Math.ceil(entries.length / PAGE_SIZE) }, (_, i) => i + 1).map(n => (
                            <button key={n} onClick={() => setPage(n)} className={`w-8 h-8 rounded-lg text-xs font-semibold border transition-colors ${page === n ? 'bg-primary text-white border-primary' : 'border-border hover:bg-muted/40 text-foreground'}`}>
                              {n}
                            </button>
                          ))}
                          <button onClick={() => setPage(p => Math.min(Math.ceil(entries.length / PAGE_SIZE), p + 1))} disabled={page === Math.ceil(entries.length / PAGE_SIZE)} className="p-1.5 rounded-lg border border-border hover:bg-muted/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* ═══ STEP 1: Output Entry ═══ */}
            {step === 1 && selectedEntry && (
              <motion.div
                key="step-output"
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
                                {alloc.machine.machineId} • Product: <span className="font-bold text-primary">{selectedEntry.fgProductName}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground font-semibold">Allocated</div>
                            <div className="font-bold text-foreground">{alloc.allocatedQty} {alloc.allocatedUnit}</div>
                          </div>
                        </div>

                        {/* Read-Only Machine Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5 p-3 rounded-lg bg-muted/20 border border-border">
                          <div>
                            <div className="text-[10px] font-bold text-muted-foreground uppercase">Installation Capacity</div>
                            <div className="font-semibold text-foreground">{alloc.machine?.capacityQty || '-'} {alloc.machine?.capacityUnit === 'BOXES_PER_SHIFT' ? 'Boxes / Shift' : alloc.machine?.capacityUnit}</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-muted-foreground uppercase">Machine Speed</div>
                            <div className="font-semibold text-foreground">{alloc.machineSpeed || alloc.machine?.machineSpeed || '-'}</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-muted-foreground uppercase">Laminate Cons.</div>
                            <div className="font-semibold text-foreground">
                              {alloc.laminateConsumption !== null ? `${alloc.laminateConsumption} ${alloc.laminateConsumptionUnit || 'KG'}` : '-'}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-muted-foreground uppercase">SFG Cons.</div>
                            <div className="font-semibold text-foreground">
                              {alloc.sfgConsumption !== null ? `${alloc.sfgConsumption} ${alloc.sfgConsumptionUnit || 'KG'}` : '-'}
                            </div>
                          </div>
                        </div>

                        {/* Row 1: Today Achievement + Shift + Man Power */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-4 p-4 rounded-xl border border-primary/20 bg-primary/5">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground uppercase tracking-wider">Today Achievement</label>
                            <div className="flex items-center gap-2">
                              <InputNumber min={0} step={0.01} value={alloc.todayAchieve} onChange={(val) => updateInput(idx, 'todayAchieve', val || 0)} placeholder="0.00" size="large" className="w-full font-bold text-emerald-600" />
                              <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap shrink-0">Boxes / Unit</span>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1">
                              <Sun size={12} /> Shift
                            </label>
                            <Select
                              value={alloc.shift || undefined}
                              onChange={(val) => updateInput(idx, 'shift', val)}
                              placeholder="Select shift..."
                              size="large"
                              className="w-full font-semibold"
                              options={[
                                { value: 'DAY', label: '☀️ Day Shift' },
                                { value: 'NOON', label: '🌤️ Noon Shift' },
                                { value: 'NIGHT', label: '🌙 Night Shift' },
                              ]}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1">
                              <Users size={12} /> Man Power (Persons)
                            </label>
                            <InputNumber min={0} step={1} value={alloc.manPowerCount} onChange={(val) => updateInput(idx, 'manPowerCount', val)} placeholder="No. of persons" size="large" className="w-full font-semibold" />
                          </div>
                        </div>

                        {/* Row 2: Powder Wastage + Laminate Wastage */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-4 p-4 rounded-xl border border-amber-200 bg-amber-50/30">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-amber-700 uppercase tracking-wider">Powder Wastage</label>
                            <div className="flex items-center gap-2">
                              <InputNumber min={0} step={0.001} value={alloc.powderWastageKg} onChange={(val) => updateInput(idx, 'powderWastageKg', val)} placeholder="0.000" size="large" className="w-full font-semibold" />
                              <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap shrink-0">KG</span>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-amber-700 uppercase tracking-wider">Powder Wastage %</label>
                            <div className="flex items-center gap-2">
                              <InputNumber min={0} step={0.01} value={alloc.powderWastagePercentage} disabled placeholder="Auto" size="large" className="w-full font-semibold bg-muted/30" />
                              <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap shrink-0">%</span>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-blue-700 uppercase tracking-wider">Laminate Wastage</label>
                            <div className="flex items-center gap-2">
                              <InputNumber min={0} step={0.001} value={alloc.laminateWastageQty} onChange={(val) => updateInput(idx, 'laminateWastageQty', val || 0)} placeholder="0.000" size="large" className="w-full font-semibold flex-1" />
                              <Select value={alloc.laminateWastageUnit} onChange={(val) => updateInput(idx, 'laminateWastageUnit', val)} size="large" options={[{ value: 'KG', label: 'KG' }, { value: 'G', label: 'G' }]} className="w-20 shrink-0 font-bold" />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-blue-700 uppercase tracking-wider">Laminate Wastage %</label>
                            <div className="flex items-center gap-2">
                              <InputNumber min={0} step={0.01} value={alloc.laminateWastagePercentage} onChange={(val) => updateInput(idx, 'laminateWastagePercentage', val || 0)} placeholder="0.00" size="large" className="w-full font-semibold" />
                              <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap shrink-0">%</span>
                            </div>
                          </div>
                        </div>

                        {/* Row 3: Machine Utilization (Hours + Minutes) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4 p-4 rounded-xl border border-emerald-200 bg-emerald-50/30">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                              <Clock size={12} /> Machine Utilized Time
                            </label>
                            <div className="flex items-center gap-2">
                              <Select
                                value={Math.floor((alloc.machineUtilizedHrs || 0) / 60)}
                                onChange={(val) => {
                                  const mins = (alloc.machineUtilizedHrs || 0) % 60;
                                  updateInput(idx, 'machineUtilizedHrs', (val * 60) + mins);
                                }}
                                size="large"
                                className="flex-1 font-semibold"
                                placeholder="Hrs"
                                options={Array.from({ length: 25 }, (_, i) => ({ value: i, label: `${i} hr${i !== 1 ? 's' : ''}` }))}
                              />
                              <Select
                                value={(alloc.machineUtilizedHrs || 0) % 60}
                                onChange={(val) => {
                                  const hrs = Math.floor((alloc.machineUtilizedHrs || 0) / 60);
                                  updateInput(idx, 'machineUtilizedHrs', (hrs * 60) + val);
                                }}
                                size="large"
                                className="flex-1 font-semibold"
                                placeholder="Min"
                                options={Array.from({ length: 60 }, (_, i) => ({ value: i, label: `${i} min` }))}
                              />
                              <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">
                                = {alloc.machineUtilizedHrs || 0} min
                              </span>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-1">
                              <AlertTriangle size={12} /> Machine Not Utilized Time
                            </label>
                            <div className="flex items-center gap-2">
                              <Select
                                value={Math.floor((alloc.machineNotUtilizedHrs || 0) / 60)}
                                onChange={(val) => {
                                  const mins = (alloc.machineNotUtilizedHrs || 0) % 60;
                                  updateInput(idx, 'machineNotUtilizedHrs', (val * 60) + mins);
                                }}
                                size="large"
                                className="flex-1 font-semibold"
                                placeholder="Hrs"
                                options={Array.from({ length: 25 }, (_, i) => ({ value: i, label: `${i} hr${i !== 1 ? 's' : ''}` }))}
                              />
                              <Select
                                value={(alloc.machineNotUtilizedHrs || 0) % 60}
                                onChange={(val) => {
                                  const hrs = Math.floor((alloc.machineNotUtilizedHrs || 0) / 60);
                                  updateInput(idx, 'machineNotUtilizedHrs', (hrs * 60) + val);
                                }}
                                size="large"
                                className="flex-1 font-semibold"
                                placeholder="Min"
                                options={Array.from({ length: 60 }, (_, i) => ({ value: i, label: `${i} min` }))}
                              />
                              <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">
                                = {alloc.machineNotUtilizedHrs || 0} min
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Downtime Records — shown when machine has not-utilized hours */}
                        {alloc.machineNotUtilizedHrs > 0 && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-4 p-4 rounded-xl border-2 border-red-200 bg-red-50/30">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-bold text-red-700 flex items-center gap-2">
                                <AlertTriangle size={14} /> Downtime Records
                              </h4>
                              <Button size="small" type="dashed" onClick={() => addDowntimeRecord(idx)} icon={<Plus size={14} />} className="rounded-lg font-semibold text-red-600 border-red-300">
                                Add Record
                              </Button>
                            </div>

                            {(!alloc.downtimeRecords || alloc.downtimeRecords.length === 0) && (
                              <p className="text-xs text-red-500 font-semibold">Please add at least one downtime record for the not-utilized hours.</p>
                            )}

                            <div className="space-y-3">
                              {(alloc.downtimeRecords || []).map((dt: any, dtIdx: number) => (
                                <div key={dtIdx} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 rounded-lg bg-white/60 border border-red-100 items-end">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-red-600 uppercase">Start Time</label>
                                    <Input type="time" value={dt.startTime} onChange={(e) => updateDowntimeRecord(idx, dtIdx, 'startTime', e.target.value)} size="large" className="font-semibold" />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-red-600 uppercase">Stop Time</label>
                                    <Input type="time" value={dt.stopTime} onChange={(e) => updateDowntimeRecord(idx, dtIdx, 'stopTime', e.target.value)} size="large" className="font-semibold" />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-red-600 uppercase">Breakdown Reason</label>
                                    <Input.TextArea value={dt.breakdownReason} onChange={(e) => updateDowntimeRecord(idx, dtIdx, 'breakdownReason', e.target.value)} placeholder="Reason..." autoSize={{ minRows: 1, maxRows: 2 }} className="font-semibold" />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Remark</label>
                                    <Input value={dt.remark} onChange={(e) => updateDowntimeRecord(idx, dtIdx, 'remark', e.target.value)} placeholder="Optional..." className="font-semibold" />
                                  </div>
                                  <div className="flex justify-end">
                                    <Button danger size="small" onClick={() => removeDowntimeRecord(idx, dtIdx)} icon={<Trash2 size={14} />} className="rounded-lg" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
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

                {/* Removed Summary Cards as requested */}

                {/* Detailed Review */}
                <div className="space-y-4 mb-6">
                  {machineInputs.map((alloc, idx) => (
                    <div key={idx} className="rounded-xl border border-border shadow-sm bg-card p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-bold text-foreground text-lg">{alloc.machine.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">{alloc.machine.machineId} • Allocated: {alloc.allocatedQty} {alloc.allocatedUnit}</div>
                        </div>
                        {alloc.shift && <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">{alloc.shift} Shift</span>}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div><span className="text-muted-foreground">Achievement:</span> <span className="font-bold text-emerald-600">{alloc.todayAchieve || '-'} Boxes</span></div>
                        <div><span className="text-muted-foreground">Man Power:</span> <span className="font-bold">{alloc.manPowerCount || '-'} persons</span></div>
                        <div><span className="text-muted-foreground">Powder Wastage:</span> <span className="font-bold text-amber-600">{alloc.powderWastageKg || '-'} KG ({alloc.powderWastagePercentage || 0}%)</span></div>
                        <div><span className="text-muted-foreground">Laminate Wastage:</span> <span className="font-bold text-amber-600">{alloc.laminateWastageQty || '-'} {alloc.laminateWastageUnit || 'KG'} ({alloc.laminateWastagePercentage || 0}%)</span></div>
                        <div><span className="text-muted-foreground">Utilized:</span> <span className="font-bold text-emerald-600">{alloc.machineUtilizedHrs ? `${Math.floor(alloc.machineUtilizedHrs / 60)}h ${alloc.machineUtilizedHrs % 60}m (${alloc.machineUtilizedHrs} min)` : '-'}</span></div>
                        <div><span className="text-muted-foreground">Not Utilized:</span> <span className="font-bold text-red-600">{alloc.machineNotUtilizedHrs ? `${Math.floor(alloc.machineNotUtilizedHrs / 60)}h ${alloc.machineNotUtilizedHrs % 60}m (${alloc.machineNotUtilizedHrs} min)` : '-'}</span></div>
                      </div>
                      {alloc.downtimeRecords?.length > 0 && (
                        <div className="mt-3 border-t border-border pt-3">
                          <h4 className="text-xs font-bold text-red-600 uppercase mb-2">Downtime Records</h4>
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-xs">
                              <thead>
                                <tr className="text-muted-foreground">
                                  <th className="text-left py-1 pr-3 font-bold">Start</th>
                                  <th className="text-left py-1 pr-3 font-bold">Stop</th>
                                  <th className="text-left py-1 pr-3 font-bold">Reason</th>
                                  <th className="text-left py-1 font-bold">Remark</th>
                                </tr>
                              </thead>
                              <tbody>
                                {alloc.downtimeRecords.map((dt: any, di: number) => (
                                  <tr key={di}>
                                    <td className="py-1 pr-3 font-mono font-semibold">{dt.startTime || '-'}</td>
                                    <td className="py-1 pr-3 font-mono font-semibold">{dt.stopTime || '-'}</td>
                                    <td className="py-1 pr-3 font-semibold">{dt.breakdownReason || '-'}</td>
                                    <td className="py-1 font-semibold text-muted-foreground">{dt.remark || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
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
                    const isValid = machineInputs.some(alloc => alloc.todayAchieve > 0 || alloc.noManPower);
                    if (!isValid) {
                      message.warning('Please enter Today Achievement for at least one active machine before proceeding');
                      return;
                    }
                    setStep(2);
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
                  disabled={false}
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
