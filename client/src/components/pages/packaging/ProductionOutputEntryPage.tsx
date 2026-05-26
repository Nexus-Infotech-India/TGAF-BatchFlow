import { useEffect, useState } from 'react';
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

    // Carton math is derived from the BOM (1 BOM execution = 1 carton).
    const bomOutputQty = Number(entry.bom?.outputQuantity || 0); // in BOM unit (gram/KG)
    const bomOutputUnit = entry.bom?.unitOfMeasurement || entry.targetUnit || 'KG';

    // Convert a qty in `unit` into the BOM's outputUnit so we can divide safely.
    const toBomUnit = (qty: number, unit: string): number => {
      if (!qty) return 0;
      const u = (unit || '').toUpperCase();
      const b = (bomOutputUnit || 'KG').toUpperCase();
      const factor: Record<string, number> = { GRAM: 1, G: 1, KG: 1000, TON: 1_000_000 };
      const q_g = qty * (factor[u] ?? 1);
      const out = q_g / (factor[b] ?? 1);
      return out;
    };

    // Initialize machine inputs mapping
    const initInputs = entry.machineEntries.map((me: any) => {
      // Allocated cartons for THIS machine (rounded — allocations are always whole cartons).
      const allocatedCartons = bomOutputQty > 0
        ? Math.round(toBomUnit(Number(me.allocatedQty) || 0, me.allocatedUnit) / bomOutputQty)
        : 0;
      // Allocated SFG (KG) for this machine
      const sfgKg = me.sfgConsumptionQty != null ? Number(me.sfgConsumptionQty) : 0;
      const sfgPerCartonKg = allocatedCartons > 0 ? sfgKg / allocatedCartons : 0;

      // Build packaging-wastage rows from the machine's pre-allocated packaging consumptions.
      // Each row mirrors a single FGProductionMachinePackaging record.
      const packagingWastages = (me.packagingConsumptions || []).map((pc: any) => ({
        id: pc.id,
        rawMaterialId: pc.rawMaterialId,
        productName: pc.productName,
        skuCode: pc.skuCode,
        allocatedQty: Number(pc.quantity) || 0,
        unit: pc.unitOfMeasurement || 'KG',
        wastageQty: pc.wastageQty ?? null,
        wastagePercentage: pc.wastagePercentage ?? null,
      }));

      return {
        id: me.id,
        machineBatchId: me.machineBatchId || null,
        machine: me.machine,
        allocatedQty: me.allocatedQty,
        allocatedUnit: me.allocatedUnit,
        allocatedCartons,
        sfgPerCartonKg,
        actualFgQty: me.allocatedQty,
        actualByproduct: 0,
        actualScrap: 0,
        machineSpeed: me.machine?.machineSpeed || null,
        todayAchieve: null,                // in CARTONS now
        laminateConsumption: me.laminateConsumptionQty || null,
        laminateConsumptionUnit: me.laminateConsumptionUnit || null,
        sfgConsumption: me.sfgConsumptionQty || null,
        sfgConsumptionUnit: me.sfgConsumptionUnit || 'KG',
        // Legacy laminate fields kept so existing payload/audit paths still work.
        laminateWastageKg: null,
        laminateWastageQty: null,
        laminateWastageUnit: 'KG',
        laminateWastagePercentage: 0,
        noManPower: me.manPower === false,
        powderWastageKg: null,
        powderWastagePercentage: null,
        manPowerCount: null,
        shift: null,
        machineUtilizedHrs: null,
        machineNotUtilizedHrs: 720,
        downtimeRecords: [] as { startTime: string; stopTime: string; breakdownReason: string; remark: string }[],
        // New per-packaging wastage rows
        packagingWastages,
      };
    });
    setMachineInputs(initInputs);
    setStep(1);
  };

  const updateInput = (index: number, field: string, value: any) => {
    setMachineInputs((prev) => {
      const next = [...prev];
      (next[index] as any)[field] = value;

      // When operator types Today Achievement (in CARTONS), derive powder wastage
      // from the gap and either zero-fill or clear packaging wastages.
      if (field === 'todayAchieve') {
        const row = next[index];
        const target = Number(row.allocatedCartons) || 0;
        const achieved = Number(value) || 0;
        const shortfall = Math.max(0, target - achieved);
        const sfgPerCarton = Number(row.sfgPerCartonKg) || 0;
        const totalSfgKg = Number(row.sfgConsumption) || (sfgPerCarton * target);

        // Powder wastage in KG
        const powderKg = Number((shortfall * sfgPerCarton).toFixed(3));
        row.powderWastageKg = powderKg;
        row.powderWastagePercentage = totalSfgKg > 0
          ? Number(((powderKg / totalSfgKg) * 100).toFixed(2))
          : 0;

        // Target met → auto-zero all packaging wastages (editable later).
        if (achieved === target && target > 0) {
          row.packagingWastages = (row.packagingWastages || []).map((w: any) => ({
            ...w,
            wastageQty: 0,
            wastagePercentage: 0,
          }));
        }

        // Legacy laminate fields kept in sync for any downstream readers.
        row.laminateWastageKg = 0;
        row.laminateWastagePercentage = 0;
        row.laminateWastageQty = 0;
      }

      // Manual override of powder wastage (operator types a value directly)
      if (field === 'powderWastageKg') {
        const sfgCons = convertToKg(next[index].sfgConsumption || 0, next[index].sfgConsumptionUnit || 'KG');
        if (sfgCons > 0) {
          next[index].powderWastagePercentage = Number(((Number(value) / sfgCons) * 100).toFixed(2));
        }
      }

      // Auto-calculate Machine Not Utilized = 720 (12hrs) - Utilized
      if (field === 'machineUtilizedHrs') {
        const utilized = Number(value) || 0;
        const totalShiftMinutes = 720; // 12 hours per shift
        next[index].machineNotUtilizedHrs = Math.max(0, totalShiftMinutes - utilized);
      }

      return next;
    });
  };

  // Update one packaging-wastage cell on a machine row, auto-compute %.
  const updatePackagingWastage = (machineIdx: number, pkgIdx: number, qty: number | null) => {
    setMachineInputs((prev) => {
      const next = [...prev];
      const rows = [...(next[machineIdx].packagingWastages || [])];
      const w = { ...rows[pkgIdx] };
      const qtyNum = qty != null ? Number(qty) : null;
      w.wastageQty = qtyNum;
      const allocated = Number(w.allocatedQty) || 0;
      if (qtyNum != null && allocated > 0) {
        w.wastagePercentage = Number(((qtyNum / allocated) * 100).toFixed(2));
      } else {
        w.wastagePercentage = qtyNum != null ? 0 : null;
      }
      rows[pkgIdx] = w;
      next[machineIdx] = { ...next[machineIdx], packagingWastages: rows };
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

    // Hard validations before submission
    for (let i = 0; i < machineInputs.length; i++) {
      const a = machineInputs[i];
      const machineName = a.machine?.name || `Row ${i + 1}`;
      // Allow zero achievement (full shift loss is valid), but require a value
      if (a.todayAchieve == null) {
        message.error(`${machineName}: enter today's achievement in cartons.`);
        return;
      }
      if (a.allocatedCartons > 0 && a.todayAchieve > a.allocatedCartons) {
        message.error(`${machineName}: achievement (${a.todayAchieve}) cannot exceed allocated cartons (${a.allocatedCartons}).`);
        return;
      }
      // Block any packaging wastage exceeding the allocated qty for that line
      for (const w of a.packagingWastages || []) {
        if (w.wastageQty != null && w.allocatedQty > 0 && w.wastageQty > w.allocatedQty) {
          message.error(`${machineName} — ${w.productName}: wastage (${w.wastageQty} ${w.unit}) exceeds allocated (${w.allocatedQty} ${w.unit}).`);
          return;
        }
      }
    }

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
          // New per-packaging wastages stored on FGProductionMachinePackaging rows.
          packagingWastages: (a.packagingWastages || []).map((w: any) => ({
            id: w.id,
            rawMaterialId: w.rawMaterialId,
            wastageQty: w.wastageQty,
            wastagePercentage: w.wastagePercentage,
          })),
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
                            <th className="px-5 py-4 text-center text-xs font-bold text-muted-foreground uppercase">Machines 
                              (In Use)</th>
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
                                {(() => {
                                  const bomOut = Number(entry.bom?.outputQuantity || 0);
                                  if (bomOut > 0) {
                                    const cartons = Math.round((Number(entry.targetQty) || 0) / bomOut);
                                    return `${cartons} cartons`;
                                  }
                                  return `${entry.targetQty} ${entry.targetUnit}`;
                                })()}
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
                              {alloc.machineBatchId && (
                                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500/10 text-violet-700 border border-violet-200 font-mono">
                                  {alloc.machineBatchId}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground font-semibold">Allocated</div>
                            <div className="font-bold text-foreground">
                              {alloc.allocatedCartons || 0} <span className="text-xs font-medium text-muted-foreground">cartons</span>
                            </div>
                          </div>
                        </div>

                        {/* Read-Only Machine Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5 p-3 rounded-lg bg-muted/20 border border-border">
                          <div>
                            <div className="text-[10px] font-bold text-muted-foreground uppercase">Installation Capacity</div>
                            <div className="font-semibold text-foreground">{alloc.machine?.capacityQty || '-'} {alloc.machine?.capacityUnit === 'BOXES_PER_SHIFT' ? 'Cartons / Shift' : alloc.machine?.capacityUnit}</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-muted-foreground uppercase">Machine Speed</div>
                            <div className="font-semibold text-foreground">{alloc.machineSpeed || alloc.machine?.machineSpeed || '-'}</div>
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
                              <InputNumber
                                min={0}
                                max={alloc.allocatedCartons || undefined}
                                step={1}
                                precision={0}
                                value={alloc.todayAchieve}
                                onChange={(val) => updateInput(idx, 'todayAchieve', val == null ? null : Math.floor(Number(val)))}
                                placeholder="0"
                                size="large"
                                className="w-full font-bold text-emerald-600"
                              />
                              <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap shrink-0">
                                / {alloc.allocatedCartons || 0} cartons
                              </span>
                            </div>
                            {alloc.todayAchieve != null && alloc.allocatedCartons > 0 && alloc.todayAchieve > alloc.allocatedCartons && (
                              <div className="text-[10px] text-red-600 font-medium">Cannot exceed allocated cartons</div>
                            )}
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
                                { value: 'DAY', label: ' Day Shift' },
                                { value: 'NIGHT', label: 'Night Shift' },
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

                        {/* Row 2A: Powder Wastage — auto-filled from achievement shortfall, editable */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4 p-4 rounded-xl border border-amber-200 bg-amber-50/30">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-amber-700 uppercase tracking-wider">Powder Wastage (auto)</label>
                            <div className="flex items-center gap-2">
                              <InputNumber min={0} step={0.001} value={alloc.powderWastageKg} onChange={(val) => updateInput(idx, 'powderWastageKg', val)} placeholder="0.000" size="large" className="w-full font-semibold" />
                              <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap shrink-0">KG</span>
                            </div>
                            <div className="text-[10px] text-amber-700/80">
                              Computed from (target − achieved) × {alloc.sfgPerCartonKg ? alloc.sfgPerCartonKg.toFixed(3) : '0'} KG/carton. Editable.
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-amber-700 uppercase tracking-wider">Powder Wastage %</label>
                            <div className="flex items-center gap-2">
                              <InputNumber min={0} step={0.01} value={alloc.powderWastagePercentage} disabled placeholder="Auto" size="large" className="w-full font-semibold bg-muted/30" />
                              <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap shrink-0">%</span>
                            </div>
                          </div>
                        </div>

                        {/* Row 2B: Packaging Materials Wastage — one row per allocated packaging material */}
                        {alloc.packagingWastages?.length > 0 && (
                          <div className="mb-4 p-4 rounded-xl border border-blue-200 bg-blue-50/30">
                            <div className="flex items-center gap-2 mb-3">
                              <Package size={14} className="text-blue-700" />
                              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Packaging Materials Wastage</span>
                              <span className="text-[10px] text-muted-foreground">Enter wastage per material — % auto-calculated from allocated qty</span>
                            </div>
                            <div className="overflow-x-auto rounded-sm border border-blue-100 bg-white">
                              <table className="w-full text-sm">
                                <thead className="bg-blue-50 border-b border-blue-100">
                                  <tr>
                                    <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-700">Material</th>
                                    <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-blue-700">Allocated</th>
                                    <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-blue-700">Wastage</th>
                                    <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-blue-700">Wastage %</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-blue-100/70">
                                  {alloc.packagingWastages.map((w: any, pkgIdx: number) => {
                                    const exceeds = w.wastageQty != null && w.allocatedQty > 0 && w.wastageQty > w.allocatedQty;
                                    const isPiece = String(w.unit || '').toLowerCase().includes('piece') || String(w.unit || '').toLowerCase() === 'pcs';
                                    return (
                                      <tr key={w.id || pkgIdx} className="hover:bg-blue-50/40">
                                        <td className="px-3 py-2">
                                          <div className="font-semibold text-foreground">{w.productName || '—'}</div>
                                          <div className="text-[10px] text-muted-foreground font-mono">{w.skuCode || ''}</div>
                                        </td>
                                        <td className="px-3 py-2 text-right text-xs">
                                          <span className="font-semibold text-foreground">{w.allocatedQty}</span>{' '}
                                          <span className="text-muted-foreground">{w.unit}</span>
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                          <div className="flex items-center gap-1 justify-end">
                                            <InputNumber
                                              min={0}
                                              max={w.allocatedQty || undefined}
                                              step={isPiece ? 1 : 0.001}
                                              precision={isPiece ? 0 : 3}
                                              value={w.wastageQty}
                                              onChange={(val) => updatePackagingWastage(idx, pkgIdx, val as number | null)}
                                              placeholder={isPiece ? '0' : '0.000'}
                                              size="small"
                                              className={`w-24 font-semibold ${exceeds ? 'border-red-400' : ''}`}
                                            />
                                            <span className="text-[10px] text-muted-foreground font-medium shrink-0 min-w-[28px]">{w.unit}</span>
                                          </div>
                                          {exceeds && (
                                            <div className="text-[10px] text-red-600 font-medium mt-0.5">Exceeds allocated</div>
                                          )}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                          {w.wastagePercentage != null ? (
                                            <span className={`font-bold ${(w.wastagePercentage || 0) > 5 ? 'text-red-600' : 'text-blue-700'}`}>
                                              {w.wastagePercentage}%
                                            </span>
                                          ) : (
                                            <span className="text-muted-foreground text-xs">—</span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Row 3: Machine Utilization (Hours + Minutes) — 12hr shift */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4 p-4 rounded-xl border border-emerald-200 bg-emerald-50/30">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                              <Clock size={12} /> Machine Utilized Time <span className="text-[10px] text-muted-foreground font-normal">(of 12 hrs)</span>
                            </label>
                            <div className="flex items-center gap-2">
                              <Select
                                value={Math.floor((alloc.machineUtilizedHrs || 0) / 60)}
                                onChange={(val) => {
                                  const mins = (alloc.machineUtilizedHrs || 0) % 60;
                                  const total = Math.min(720, (val * 60) + mins);
                                  updateInput(idx, 'machineUtilizedHrs', total);
                                }}
                                size="large"
                                className="flex-1 font-semibold"
                                placeholder="Hrs"
                                options={Array.from({ length: 13 }, (_, i) => ({ value: i, label: `${i} hr${i !== 1 ? 's' : ''}` }))}
                              />
                              <Select
                                value={(alloc.machineUtilizedHrs || 0) % 60}
                                onChange={(val) => {
                                  const hrs = Math.floor((alloc.machineUtilizedHrs || 0) / 60);
                                  const total = Math.min(720, (hrs * 60) + val);
                                  updateInput(idx, 'machineUtilizedHrs', total);
                                }}
                                size="large"
                                className="flex-1 font-semibold"
                                placeholder="Min"
                                options={Array.from({ length: 60 }, (_, i) => ({ value: i, label: `${i} min` }))}
                              />
                              <span className="text-xs font-bold text-emerald-700 whitespace-nowrap">
                                = {alloc.machineUtilizedHrs || 0} min
                              </span>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-1">
                              <AlertTriangle size={12} /> Machine Not Utilized Time <span className="text-[10px] text-muted-foreground font-normal">(auto)</span>
                            </label>
                            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200">
                              <span className="text-sm font-bold text-red-700">
                                {Math.floor((alloc.machineNotUtilizedHrs || 0) / 60)} hrs {(alloc.machineNotUtilizedHrs || 0) % 60} min
                              </span>
                              <span className="text-xs font-bold text-red-500 whitespace-nowrap">
                                = {alloc.machineNotUtilizedHrs || 0} min
                              </span>
                              {(alloc.machineNotUtilizedHrs || 0) > 0 && (
                                <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600 border border-red-200">
                                  ⚠ Downtime
                                </span>
                              )}
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
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        <div><span className="text-muted-foreground">Achievement:</span> <span className="font-bold text-emerald-600">{alloc.todayAchieve ?? '-'} cartons</span></div>
                        <div><span className="text-muted-foreground">Man Power:</span> <span className="font-bold">{alloc.manPowerCount || '-'} persons</span></div>
                        <div><span className="text-muted-foreground">Powder Wastage:</span> <span className="font-bold text-amber-600">{alloc.powderWastageKg ?? '-'} KG ({alloc.powderWastagePercentage ?? 0}%)</span></div>
                        <div><span className="text-muted-foreground">Utilized:</span> <span className="font-bold text-emerald-600">{alloc.machineUtilizedHrs ? `${Math.floor(alloc.machineUtilizedHrs / 60)}h ${alloc.machineUtilizedHrs % 60}m (${alloc.machineUtilizedHrs} min)` : '-'}</span></div>
                        <div><span className="text-muted-foreground">Not Utilized:</span> <span className="font-bold text-red-600">{alloc.machineNotUtilizedHrs ? `${Math.floor(alloc.machineNotUtilizedHrs / 60)}h ${alloc.machineNotUtilizedHrs % 60}m (${alloc.machineNotUtilizedHrs} min)` : '-'}</span></div>
                      </div>

                      {/* Packaging Materials Wastage — review */}
                      {alloc.packagingWastages?.length > 0 && (
                        <div className="mt-3 border-t border-border pt-3">
                          <h4 className="text-xs font-bold text-blue-700 uppercase mb-2 flex items-center gap-1.5">
                            <Package size={12} /> Packaging Materials Wastage
                          </h4>
                          <div className="overflow-x-auto rounded-sm border border-blue-100/70">
                            <table className="min-w-full text-xs">
                              <thead className="bg-blue-50/60">
                                <tr className="text-blue-700">
                                  <th className="text-left py-1.5 px-2 font-bold uppercase tracking-wider">Material</th>
                                  <th className="text-right py-1.5 px-2 font-bold uppercase tracking-wider">Allocated</th>
                                  <th className="text-right py-1.5 px-2 font-bold uppercase tracking-wider">Wastage</th>
                                  <th className="text-right py-1.5 px-2 font-bold uppercase tracking-wider">Wastage %</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-blue-100/40">
                                {alloc.packagingWastages.map((w: any, pi: number) => (
                                  <tr key={w.id || pi} className="hover:bg-blue-50/30">
                                    <td className="py-1.5 px-2">
                                      <div className="font-semibold text-foreground">{w.productName || '—'}</div>
                                      <div className="text-[10px] text-muted-foreground font-mono">{w.skuCode || ''}</div>
                                    </td>
                                    <td className="py-1.5 px-2 text-right">
                                      <span className="font-semibold">{w.allocatedQty}</span>{' '}
                                      <span className="text-muted-foreground">{w.unit}</span>
                                    </td>
                                    <td className="py-1.5 px-2 text-right">
                                      <span className="font-semibold text-amber-700">{w.wastageQty ?? '-'}</span>{' '}
                                      <span className="text-muted-foreground">{w.unit}</span>
                                    </td>
                                    <td className="py-1.5 px-2 text-right">
                                      <span className={`font-bold ${(w.wastagePercentage || 0) > 5 ? 'text-red-600' : 'text-blue-700'}`}>
                                        {w.wastagePercentage != null ? `${w.wastagePercentage}%` : '—'}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
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
