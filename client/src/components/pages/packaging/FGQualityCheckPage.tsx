import { useEffect, useState } from 'react';
import { Button, Input, message, Empty, Spin, Select, Tag } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Beaker,
  FileCheck,
  CheckCircle,
  Factory,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleDashed,
} from 'lucide-react';
import api, { API_ROUTES } from '../../../utils/api';

const PAGE_SIZE = 10;

const FG_QUALITY_PARAMETERS = [
  { parameter: 'Appearance', standard: 'As per standard' },
  { parameter: 'Color', standard: 'As per standard' },
  { parameter: 'Odor', standard: 'Characteristic' },
  { parameter: 'Texture', standard: 'Fine powder / Granules' },
  { parameter: 'Moisture Content (%)', standard: '< 5%' },
  { parameter: 'Mesh Size', standard: 'As per specification' },
  { parameter: 'Bulk Density (g/ml)', standard: 'As per specification' },
  { parameter: 'Foreign Matter', standard: 'Absent' },
  { parameter: 'Packaging Integrity', standard: 'Intact, sealed properly' },
  { parameter: 'Label Accuracy', standard: 'Correct & legible' },
  { parameter: 'Net Weight Verification', standard: 'Within tolerance' },
];

export default function FGQualityCheckPage() {
  const [step, setStep] = useState(0);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [selectedMachineEntry, setSelectedMachineEntry] = useState<any>(null);

  // Machine-wise quality tracking: map machineEntryId -> results array
  const [machineQualityMap, setMachineQualityMap] = useState<Record<string, string[]>>({});
  // Track which machines already had reports submitted (in this session)
  const [submittedMachineIds, setSubmittedMachineIds] = useState<Set<string>>(new Set());

  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await api.get(API_ROUTES.RAW.GET_FG_PRODUCTION_ENTRIES);
      if (res.data?.success) {
        // Show COMPLETED entries that have at least one machine entry without a quality report
        const completed = res.data.data.filter((e: any) => {
          if (e.status !== 'COMPLETED') return false;
          const machineEntries = e.machineEntries || [];
          if (machineEntries.length === 0) return !e.qualityReports || e.qualityReports.length === 0;
          // Show if any machine entry is missing a quality report
          return machineEntries.some((me: any) => !me.qualityReport);
        });
        setEntries(completed);
      }
    } catch {
      message.error('Failed to load production entries');
    } finally {
      setLoading(false);
    }
  };

  /* Count how many machines are pending/done for a given entry */
  const getMachineQualityStatus = (entry: any) => {
    const machines = entry.machineEntries || [];
    if (machines.length === 0) return { total: 0, done: 0, pending: 0 };
    const done = machines.filter((me: any) => me.qualityReport).length;
    return { total: machines.length, done, pending: machines.length - done };
  };

  const handleSelectEntry = (entry: any) => {
    setSelectedEntry(entry);
    setSubmittedMachineIds(new Set());
    // Initialize quality map for all machines
    const qMap: Record<string, string[]> = {};
    for (const me of (entry.machineEntries || [])) {
      qMap[me.id] = Array(FG_QUALITY_PARAMETERS.length).fill('');
    }
    setMachineQualityMap(qMap);
    // Auto-select first machine that doesn't have a report yet
    const pending = (entry.machineEntries || []).find((me: any) => !me.qualityReport);
    setSelectedMachineEntry(pending || entry.machineEntries?.[0] || null);
    setStep(1);
  };

  const handleQualityResultChange = (index: number, value: string) => {
    if (!selectedMachineEntry) return;
    setMachineQualityMap(prev => {
      const next = { ...prev };
      const arr = [...(next[selectedMachineEntry.id] || Array(FG_QUALITY_PARAMETERS.length).fill(''))];
      arr[index] = value;
      next[selectedMachineEntry.id] = arr;
      return next;
    });
  };

  const currentResults = selectedMachineEntry
    ? machineQualityMap[selectedMachineEntry.id] || Array(FG_QUALITY_PARAMETERS.length).fill('')
    : Array(FG_QUALITY_PARAMETERS.length).fill('');

  const allCurrentFilled = currentResults.every((r: string) => r.trim() !== '');

  /* Check if the current machine already has a report (from DB or submitted this session) */
  const currentMachineHasReport = selectedMachineEntry
    ? !!(selectedMachineEntry.qualityReport || submittedMachineIds.has(selectedMachineEntry.id))
    : false;

  /* Submit quality check for the currently selected machine */
  const handleSubmitForMachine = async () => {
    if (!selectedEntry || !selectedMachineEntry) return;

    if (!allCurrentFilled) {
      message.warning('Please enter results for all quality parameters');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(API_ROUTES.RAW.SUBMIT_FG_QUALITY_CHECK(selectedEntry.id), {
        machineEntryId: selectedMachineEntry.id,
        parameters: FG_QUALITY_PARAMETERS.map((p, i) => ({
          parameter: p.parameter,
          standard: p.standard,
          result: currentResults[i],
        })),
      });
      message.success(`Quality check submitted for ${selectedMachineEntry.machineName}!`);

      // Track locally that this machine was submitted
      setSubmittedMachineIds(prev => new Set([...prev, selectedMachineEntry.id]));

      // Check if all machines are now done
      const allMachines = selectedEntry.machineEntries || [];
      const newSubmitted = new Set([...submittedMachineIds, selectedMachineEntry.id]);
      const allDone = allMachines.every(
        (me: any) => me.qualityReport || newSubmitted.has(me.id)
      );

      if (allDone) {
        message.success('All machine quality checks completed!');
        setStep(0);
        setSelectedEntry(null);
        setSelectedMachineEntry(null);
        setMachineQualityMap({});
        setSubmittedMachineIds(new Set());
        fetchEntries();
      } else {
        // Auto-advance to next pending machine
        const nextPending = allMachines.find(
          (me: any) => !me.qualityReport && !newSubmitted.has(me.id)
        );
        if (nextPending) {
          setSelectedMachineEntry(nextPending);
        }
      }
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to submit quality check');
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
          <h1 className="text-3xl font-black text-foreground">FG Quality Check</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Perform machine-wise quality checks on completed production batches
          </p>
        </div>
      </div>

      <div className="bg-card rounded-2xl shadow-xl shadow-black/5 border border-border overflow-hidden">
        {/* Stepper */}
        <div className="px-6 py-4 border-b border-border bg-muted/10">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 ${step >= 0 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 0 ? 'bg-primary text-white' : 'bg-primary/20'}`}>1</div>
              <span className="font-semibold text-sm">Select Production Entry</span>
            </div>
            <div className="flex-1 max-w-[100px] h-0.5 bg-border mx-4" />
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-amber-600' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 1 ? 'bg-amber-600 text-white' : 'bg-muted'}`}>2</div>
              <span className="font-semibold text-sm">Machine Quality Check</span>
            </div>
          </div>
        </div>

        <motion.div className="relative min-h-[400px]">
          <AnimatePresence mode="wait">
            {/* ═══ STEP 0: Select Production Entry ═══ */}
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
                    <Beaker size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Select Completed Production</h2>
                    <p className="text-sm text-muted-foreground">Choose a completed production entry to perform machine-wise quality check</p>
                  </div>
                </div>

                {loading ? (
                  <div className="py-20 flex justify-center"><Spin size="large" /></div>
                ) : entries.length === 0 ? (
                  <Empty description="No completed entries pending quality check" className="py-10" />
                ) : (
                  <div className="rounded-xl border border-border shadow-sm overflow-hidden bg-card">
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-muted/50 border-b border-border">
                          <tr>
                            <th className="px-5 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Entry No</th>
                            <th className="px-5 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Batch</th>
                            <th className="px-5 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Product</th>
                            <th className="px-5 py-4 text-center text-xs font-bold text-muted-foreground uppercase">Machines</th>
                            <th className="px-5 py-4 text-center text-xs font-bold text-muted-foreground uppercase">QC Progress</th>
                            <th className="px-5 py-4 text-center text-xs font-bold text-muted-foreground uppercase">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {entries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((entry) => {
                            const qcStatus = getMachineQualityStatus(entry);
                            return (
                              <tr key={entry.id} className="hover:bg-muted/20 transition-colors">
                                <td className="px-5 py-4 font-bold text-primary text-sm">{entry.entryNumber}</td>
                                <td className="px-5 py-4 text-sm font-mono">{entry.fgBatch?.batchNumber}</td>
                                <td className="px-5 py-4 font-semibold text-foreground text-sm">{entry.fgProductName}</td>
                                <td className="px-5 py-4 text-center text-sm">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <Factory size={14} className="text-blue-500" />
                                    <span className="font-bold">{qcStatus.total}</span>
                                  </div>
                                </td>
                                <td className="px-5 py-4 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <div className="flex items-center gap-1">
                                      <CircleCheck size={14} className="text-emerald-500" />
                                      <span className="text-xs font-bold text-emerald-600">{qcStatus.done}</span>
                                    </div>
                                    <span className="text-muted-foreground">/</span>
                                    <div className="flex items-center gap-1">
                                      <CircleDashed size={14} className="text-amber-500" />
                                      <span className="text-xs font-bold text-amber-600">{qcStatus.pending}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-5 py-4 text-center">
                                  <Button
                                    type="primary"
                                    onClick={() => handleSelectEntry(entry)}
                                    className="rounded-lg shadow-sm font-semibold"
                                  >
                                    Quality Check
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {entries.length > PAGE_SIZE && (
                      <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/10">
                        <p className="text-xs text-muted-foreground">
                          Showing {(page - 1) * PAGE_SIZE + 1}--{Math.min(page * PAGE_SIZE, entries.length)} of {entries.length}
                        </p>
                        <div className="flex gap-1">
                          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg border border-border hover:bg-muted/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                            <ChevronLeft size={16} />
                          </button>
                          {Array.from({ length: Math.ceil(entries.length / PAGE_SIZE) }, (_, i) => i + 1).map((n) => (
                            <button key={n} onClick={() => setPage(n)} className={`w-8 h-8 rounded-lg text-xs font-semibold border transition-colors ${page === n ? 'bg-primary text-white border-primary' : 'border-border hover:bg-muted/40 text-foreground'}`}>
                              {n}
                            </button>
                          ))}
                          <button onClick={() => setPage((p) => Math.min(Math.ceil(entries.length / PAGE_SIZE), p + 1))} disabled={page === Math.ceil(entries.length / PAGE_SIZE)} className="p-1.5 rounded-lg border border-border hover:bg-muted/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* ═══ STEP 1: Machine-wise Quality Parameters ═══ */}
            {step === 1 && selectedEntry && (
              <motion.div
                key="step-quality"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-6 md:p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20">
                    <Beaker size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">FG Quality Parameters</h2>
                    <p className="text-sm text-muted-foreground">
                      Entry: <span className="font-bold text-primary">{selectedEntry.entryNumber}</span> |
                      Product: <span className="font-bold">{selectedEntry.fgProductName}</span>
                    </p>
                  </div>
                </div>

                {/* Machine Selector — always visible for machine-wise QC */}
                <div className="mb-6 p-4 rounded-xl border border-blue-200 bg-blue-50/30">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Factory size={14} /> Select Machine
                    </label>
                    {/* Progress indicator */}
                    <div className="flex items-center gap-2">
                      {(selectedEntry.machineEntries || []).map((me: any) => {
                        const isDone = me.qualityReport || submittedMachineIds.has(me.id);
                        const isActive = selectedMachineEntry?.id === me.id;
                        return (
                          <div
                            key={me.id}
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all cursor-pointer ${
                              isDone
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : isActive
                                ? 'bg-amber-500 border-amber-500 text-white'
                                : 'bg-white border-border text-muted-foreground hover:border-blue-300'
                            }`}
                            title={me.machineName}
                            onClick={() => setSelectedMachineEntry(me)}
                          >
                            {isDone ? <CheckCircle size={14} /> : (selectedEntry.machineEntries || []).indexOf(me) + 1}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <Select
                    value={selectedMachineEntry?.id}
                    onChange={(val) => {
                      const me = selectedEntry.machineEntries.find((m: any) => m.id === val);
                      setSelectedMachineEntry(me);
                    }}
                    size="large"
                    className="w-full font-semibold"
                    options={(selectedEntry.machineEntries || []).map((me: any) => {
                      const isDone = me.qualityReport || submittedMachineIds.has(me.id);
                      return {
                        value: me.id,
                        label: `${me.machineName} (${me.machine?.machineId}) — ${me.actualFgQty} ${me.actualFgUnit}${isDone ? '  ✅ Done' : ''}`,
                      };
                    })}
                  />
                </div>

                {/* Production Summary Card */}
                {selectedMachineEntry && (
                  <div className="mb-6 p-4 rounded-xl border border-border bg-muted/20">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground text-xs font-bold uppercase">Batch</span>
                        <div className="font-bold font-mono">{selectedEntry.fgBatch?.batchNumber}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs font-bold uppercase">Actual FG Qty</span>
                        <div className="font-bold text-emerald-600">{selectedMachineEntry.actualFgQty} {selectedMachineEntry.actualFgUnit}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs font-bold uppercase">Achievement</span>
                        <div className="font-bold">{selectedMachineEntry.todayAchieve || '-'} Boxes</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs font-bold uppercase">Shift</span>
                        <div className="font-bold">{selectedMachineEntry.shift || '-'}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quality Parameters Form */}
                {selectedMachineEntry && (
                  <>
                    {currentMachineHasReport ? (
                      <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-8 text-center">
                        <CheckCircle size={40} className="text-emerald-500 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-emerald-700 mb-1">Quality Check Completed</h3>
                        <p className="text-sm text-emerald-600">
                          Quality parameters have been recorded for <span className="font-bold">{selectedMachineEntry.machineName}</span>.
                          Select another machine from the dropdown above.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                        <div className="px-5 py-4 bg-muted/30 border-b border-border flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileCheck size={16} className="text-primary" />
                            <h3 className="font-bold text-foreground text-sm">
                              Quality Parameters — {selectedMachineEntry.machineName}
                            </h3>
                          </div>
                          <Tag color="blue" className="font-semibold">
                            {selectedMachineEntry.machine?.machineId}
                          </Tag>
                        </div>

                        <div className="divide-y divide-border">
                          {FG_QUALITY_PARAMETERS.map((param, idx) => (
                            <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 items-center hover:bg-muted/10 transition-colors">
                              <div className="col-span-1 md:col-span-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Parameter</label>
                                <div className="font-semibold text-foreground">{param.parameter}</div>
                              </div>
                              <div className="col-span-1">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Standard</label>
                                <div className="text-sm text-primary font-medium">{param.standard}</div>
                              </div>
                              <div className="col-span-1">
                                <Input
                                  placeholder="Result *"
                                  value={currentResults[idx]}
                                  onChange={(e) => handleQualityResultChange(idx, e.target.value)}
                                  className="font-semibold"
                                  status={currentResults[idx].trim() === '' ? 'warning' : ''}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          {step > 0 && (
            <div className="px-6 py-5 border-t border-border bg-muted/10 flex items-center justify-between mt-auto">
              <Button
                size="large"
                onClick={() => {
                  setStep(0);
                  setSelectedEntry(null);
                  setSelectedMachineEntry(null);
                  setMachineQualityMap({});
                  setSubmittedMachineIds(new Set());
                }}
                className="rounded-xl px-6 h-11 font-semibold"
                icon={<ArrowLeft size={16} />}
              >
                Back
              </Button>

              {!currentMachineHasReport && (
                <Button
                  type="primary"
                  size="large"
                  loading={submitting}
                  disabled={!allCurrentFilled || !selectedMachineEntry}
                  onClick={handleSubmitForMachine}
                  className="rounded-xl px-8 h-11 text-base font-bold shadow-lg shadow-emerald-500/30 border-0 transition-all hover:scale-105 active:scale-95"
                  style={
                    allCurrentFilled
                      ? { background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }
                      : undefined
                  }
                >
                  {!submitting && <CheckCircle size={18} className="mr-2 inline" />}
                  Submit for {selectedMachineEntry?.machineName || 'Machine'}
                </Button>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
