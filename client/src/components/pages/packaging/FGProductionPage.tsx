import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { API_ROUTES } from '../../../utils/api';
import { Button, message } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Cpu,
  Plus,
  CheckCircle,
  Layers,
  ChevronDown,
  ChevronRight,
  Settings2,
  Clock,
  PlayCircle
} from 'lucide-react';

/* ─── Component ─── */
const FGProductionPage: React.FC = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await api.get(API_ROUTES.RAW.GET_FG_PRODUCTION_ENTRIES);
      setEntries(res.data?.data || []);
    } catch {
      message.error('Failed to load production entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const totalEntries = entries.length;
  const pendingEntries = entries.filter((e) => e.status === 'PENDING').length;
  const completedEntries = entries.filter((e) => e.status === 'COMPLETED').length;

  return (
    <motion.div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          className="bg-card rounded-2xl border border-border overflow-hidden"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                <Settings2 className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">FG Production Allocation</h1>
                <p className="text-muted-foreground text-sm">
                  View and manage machine-wise FG production allocations
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-card rounded-xl p-4 border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1">Total Entries</p>
                <p className="text-2xl font-bold text-indigo-600">{totalEntries}</p>
                <div className="flex items-center mt-1">
                  <Layers size={12} className="text-indigo-500 mr-1" />
                  <span className="text-xs text-indigo-500 font-medium">All production allocations</span>
                </div>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1">Pending Allocations</p>
                <p className="text-2xl font-bold text-amber-600">{pendingEntries}</p>
                <div className="flex items-center mt-1">
                  <PlayCircle size={12} className="text-amber-500 mr-1" />
                  <span className="text-xs text-amber-500 font-medium">Awaiting output entry</span>
                </div>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1">Completed Entries</p>
                <p className="text-2xl font-bold text-emerald-600">{completedEntries}</p>
                <div className="flex items-center mt-1">
                  <CheckCircle size={12} className="text-emerald-500 mr-1" />
                  <span className="text-xs text-emerald-500 font-medium">Fully processed</span>
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="flex justify-end gap-3">
              <Button
                type="primary"
                icon={<Plus size={14} />}
                onClick={() => navigate('/packaging/new-production-entry')}
                className="rounded-lg"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  fontWeight: 600,
                }}
              >
                New Allocation Entry
              </Button>
            </div>

            {/* Entries List */}
            <div className="space-y-3">
              {loading && (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="inline-block w-8 h-8 border-[3px] rounded-full animate-spin mb-3" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} />
                  <p className="text-sm">Loading production entries…</p>
                </div>
              )}

              {!loading && entries.length === 0 && (
                <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
                  <Package className="mx-auto mb-3 opacity-40" size={36} />
                  <p className="text-lg font-medium">No production allocations found</p>
                  <p className="text-sm">Create a new allocation entry to assign machines.</p>
                </div>
              )}

              {!loading && entries.map(entry => (
                <motion.div
                  key={entry.id}
                  className="bg-card rounded-xl border border-border overflow-hidden"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${entry.status === 'COMPLETED' ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                        <Cpu size={16} className={entry.status === 'COMPLETED' ? 'text-emerald-600' : 'text-amber-600'} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold font-mono text-primary flex items-center gap-2">
                          {entry.entryNumber}
                          {entry.fgBatch?.batchNumber && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-700">
                              Batch: {entry.fgBatch.batchNumber}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {entry.fgProductName} • {new Date(entry.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {/* Target Indicator */}
                      <div className="text-right hidden sm:block">
                        <div className="text-sm font-bold text-foreground">{entry.targetQty} {entry.targetUnit}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest text-right">Target</div>
                      </div>

                      {/* Actual Indicator if completed */}
                      {entry.status === 'COMPLETED' && (
                        <div className="text-right hidden sm:block">
                          <div className={`text-sm font-bold ${entry.totalActualFg >= entry.targetQty * 0.95 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {entry.totalActualFg || 0} {entry.targetUnit}
                          </div>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-widest text-right">Actual</div>
                        </div>
                      )}

                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        entry.status === 'COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                      }`}>
                        {entry.status === 'COMPLETED' ? <CheckCircle size={10} className="mr-1" /> : <Clock size={10} className="mr-1" />}
                        {entry.status}
                      </span>
                      {expandedId === entry.id ? (
                        <ChevronDown size={16} className="text-muted-foreground" />
                      ) : (
                        <ChevronRight size={16} className="text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedId === entry.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-border p-4 bg-muted/20">
                          {entry.machineEntries && entry.machineEntries.length > 0 ? (
                            <div>
                              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Machine-wise Breakdown</div>
                              <div className="overflow-x-auto">
                                <table className="min-w-full">
                                  <thead>
                                    <tr className="bg-card">
                                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase rounded-tl-lg">Machine</th>
                                      <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">Allocated</th>
                                      <th className="px-3 py-2 text-right text-xs font-semibold text-emerald-600 uppercase">Actual FG</th>
                                      <th className="px-3 py-2 text-right text-xs font-semibold text-amber-600 uppercase">Byproduct</th>
                                      <th className="px-3 py-2 text-right text-xs font-semibold text-red-600 uppercase">Scrap</th>
                                      <th className="px-3 py-2 text-right text-xs font-semibold text-violet-600 uppercase rounded-tr-lg">Packets</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border bg-card">
                                    {entry.machineEntries.map((m: any, idx: number) => (
                                      <tr key={idx} className="hover:bg-muted/30">
                                        <td className="px-3 py-2 text-sm font-medium text-foreground">
                                          <Cpu size={12} className="inline mr-2 text-amber-500" />
                                          {m.machine?.name || 'Unknown'} <span className="text-[10px] text-muted-foreground ml-1">({m.machine?.machineId})</span>
                                        </td>
                                        <td className="px-3 py-2 text-sm text-right font-medium text-foreground">
                                          {m.allocatedQty || 0} <span className="text-xs text-muted-foreground">{m.allocatedUnit}</span>
                                        </td>
                                        <td className="px-3 py-2 text-sm text-right font-bold text-emerald-600">
                                          {m.actualFgQty || (entry.status === 'COMPLETED' ? '0' : '-')} <span className="text-xs text-emerald-600/50">{entry.targetUnit}</span>
                                        </td>
                                        <td className="px-3 py-2 text-sm text-right text-amber-600 font-semibold">
                                          {m.actualByproduct || (entry.status === 'COMPLETED' ? '0' : '-')}
                                        </td>
                                        <td className="px-3 py-2 text-sm text-right text-red-600 font-semibold">
                                          {m.actualScrap || (entry.status === 'COMPLETED' ? '0' : '-')}
                                        </td>
                                        <td className="px-3 py-2 text-sm text-right text-violet-600 font-bold">
                                          {m.actualPackets > 0 ? m.actualPackets.toLocaleString() : (entry.status === 'COMPLETED' ? '0' : '-')}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-4 text-muted-foreground text-sm">
                              No machine mapping found for this entry.
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
        </motion.div>
      </div>
    </motion.div>
  );
};

export default FGProductionPage;
