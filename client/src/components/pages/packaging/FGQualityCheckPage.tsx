import React, { useEffect, useState } from 'react';
import { Button, Input, message, Empty, Spin, Select } from 'antd';
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
  const [qualityResults, setQualityResults] = useState<string[]>(
    Array(FG_QUALITY_PARAMETERS.length).fill('')
  );
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
        // Show COMPLETED entries that don't have a quality report yet
        const completed = res.data.data.filter(
          (e: any) => e.status === 'COMPLETED' && !e.qualityReport
        );
        setEntries(completed);
      }
    } catch {
      message.error('Failed to load production entries');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEntry = (entry: any) => {
    setSelectedEntry(entry);
    // Auto-select first machine entry
    if (entry.machineEntries?.length > 0) {
      setSelectedMachineEntry(entry.machineEntries[0]);
    }
    setQualityResults(Array(FG_QUALITY_PARAMETERS.length).fill(''));
    setStep(1);
  };

  const handleQualityResultChange = (index: number, value: string) => {
    const next = [...qualityResults];
    next[index] = value;
    setQualityResults(next);
  };

  const handleSubmit = async () => {
    if (!selectedEntry) return;

    const allFilled = qualityResults.every((r) => r.trim() !== '');
    if (!allFilled) {
      message.warning('Please enter results for all quality parameters');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(API_ROUTES.RAW.SUBMIT_FG_QUALITY_CHECK(selectedEntry.id), {
        parameters: FG_QUALITY_PARAMETERS.map((p, i) => ({
          parameter: p.parameter,
          standard: p.standard,
          result: qualityResults[i],
        })),
      });
      message.success('Quality check submitted successfully!');
      setStep(0);
      setSelectedEntry(null);
      setSelectedMachineEntry(null);
      setQualityResults(Array(FG_QUALITY_PARAMETERS.length).fill(''));
      fetchEntries();
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
            Perform quality checks on completed production batches
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
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 1 ? 'bg-amber-600 text-white' : step > 1 ? 'bg-amber-600/20' : 'bg-muted'}`}>2</div>
              <span className="font-semibold text-sm">Quality Parameters</span>
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
                    <p className="text-sm text-muted-foreground">Choose a completed production entry to perform quality check</p>
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
                            <th className="px-5 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Machine</th>
                            <th className="px-5 py-4 text-right text-xs font-bold text-muted-foreground uppercase">Actual FG</th>
                            <th className="px-5 py-4 text-center text-xs font-bold text-muted-foreground uppercase">Completed</th>
                            <th className="px-5 py-4 text-center text-xs font-bold text-muted-foreground uppercase">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {entries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((entry) => (
                            <tr key={entry.id} className="hover:bg-muted/20 transition-colors">
                              <td className="px-5 py-4 font-bold text-primary text-sm">{entry.entryNumber}</td>
                              <td className="px-5 py-4 text-sm font-mono">{entry.fgBatch?.batchNumber}</td>
                              <td className="px-5 py-4 font-semibold text-foreground text-sm">{entry.fgProductName}</td>
                              <td className="px-5 py-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <Factory size={14} className="text-blue-500" />
                                  <span className="font-semibold">{entry.machineName || entry.machineEntries?.[0]?.machineName || '-'}</span>
                                </div>
                              </td>
                              <td className="px-5 py-4 text-right font-bold text-emerald-600 text-sm">
                                {entry.totalActualFg} {entry.targetUnit}
                              </td>
                              <td className="px-5 py-4 text-center text-xs text-muted-foreground">
                                {new Date(entry.updatedAt || entry.createdAt).toLocaleDateString()}
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
                          ))}
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

            {/* ═══ STEP 1: Quality Parameters ═══ */}
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
                      Product: <span className="font-bold">{selectedEntry.fgProductName}</span> |
                      Machine: <span className="font-bold">{selectedEntry.machineName || selectedEntry.machineEntries?.[0]?.machineName}</span>
                    </p>
                  </div>
                </div>

                {/* Machine Entry Selector (if multiple machines) */}
                {selectedEntry.machineEntries?.length > 1 && (
                  <div className="mb-6 p-4 rounded-xl border border-blue-200 bg-blue-50/30">
                    <label className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2 block">Select Machine</label>
                    <Select
                      value={selectedMachineEntry?.id}
                      onChange={(val) => {
                        const me = selectedEntry.machineEntries.find((m: any) => m.id === val);
                        setSelectedMachineEntry(me);
                      }}
                      size="large"
                      className="w-full font-semibold"
                      options={selectedEntry.machineEntries.map((me: any) => ({
                        value: me.id,
                        label: `${me.machineName} (${me.machine?.machineId}) — ${me.actualFgQty} ${me.actualFgUnit}`,
                      }))}
                    />
                  </div>
                )}

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
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                  <div className="px-5 py-4 bg-muted/30 border-b border-border flex items-center gap-2">
                    <FileCheck size={16} className="text-primary" />
                    <h3 className="font-bold text-foreground text-sm">Quality Parameters</h3>
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
                            value={qualityResults[idx]}
                            onChange={(e) => handleQualityResultChange(idx, e.target.value)}
                            className="font-semibold"
                            status={qualityResults[idx].trim() === '' ? 'warning' : ''}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══ STEP 2: Review & Submit ═══ */}
            {step === 2 && selectedEntry && (
              <motion.div
                key="step-review"
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
                    <h2 className="text-xl font-bold text-foreground">Review Quality Report</h2>
                    <p className="text-sm text-muted-foreground">
                      Verify all quality parameters before submission
                    </p>
                  </div>
                </div>

                {/* Entry Info */}
                <div className="mb-6 p-4 rounded-xl border border-border bg-muted/20">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground text-xs font-bold uppercase">Entry No</span>
                      <div className="font-bold text-primary">{selectedEntry.entryNumber}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs font-bold uppercase">Product</span>
                      <div className="font-bold">{selectedEntry.fgProductName}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs font-bold uppercase">Batch</span>
                      <div className="font-bold font-mono">{selectedEntry.fgBatch?.batchNumber}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs font-bold uppercase">Machine</span>
                      <div className="font-bold">{selectedMachineEntry?.machineName || selectedEntry.machineName}</div>
                    </div>
                  </div>
                </div>

                {/* Quality Report Review Table */}
                <div className="rounded-xl border border-border shadow-sm overflow-hidden bg-card mb-6">
                  <div className="px-5 py-3 bg-muted/40 border-b border-border flex items-center gap-2">
                    <Beaker size={16} className="text-amber-600" />
                    <h3 className="font-bold text-foreground text-sm">Quality Report Details</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-muted/20 border-b border-border">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Parameter</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Standard</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-primary uppercase">Result</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {FG_QUALITY_PARAMETERS.map((p, i) => (
                          <tr key={i} className="hover:bg-muted/10">
                            <td className="px-4 py-3 font-semibold text-foreground text-sm">{p.parameter}</td>
                            <td className="px-4 py-3 text-amber-600 text-sm">{p.standard}</td>
                            <td className="px-4 py-3 font-bold text-emerald-600 text-sm">{qualityResults[i]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
                    const allFilled = qualityResults.every((r) => r.trim() !== '');
                    if (!allFilled) {
                      message.warning('Please enter results for all quality parameters');
                      return;
                    }
                    setStep(2);
                  }}
                  className="rounded-xl px-6 h-11 font-bold shadow-lg shadow-amber-500/20 border-0"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                >
                  Review Report <ArrowRight size={16} className="ml-1 inline" />
                </Button>
              ) : (
                <Button
                  type="primary"
                  size="large"
                  loading={submitting}
                  onClick={handleSubmit}
                  className="rounded-xl px-8 h-11 text-base font-bold shadow-lg shadow-emerald-500/30 border-0 transition-all hover:scale-105 active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                >
                  {!submitting && <CheckCircle size={18} className="mr-2 inline" />}
                  Submit Quality Report
                </Button>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
