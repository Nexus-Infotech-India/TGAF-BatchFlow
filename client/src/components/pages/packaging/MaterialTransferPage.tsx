import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { API_ROUTES } from '../../../utils/api';
import { Button, message } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Plus,
  CheckCircle,
  Layers,
  ChevronDown,
  ChevronRight,
  Database,
  Truck,
  BoxIcon,
  XCircle,
  Clock,
} from 'lucide-react';


/* ─── Types ─── */
interface BOM {
  id: string;
  bomCode: string;
  productName: string;
  unitOfMeasurement: string;
  outputQuantity: number;
  items: {
    id: string;
    rawMaterialId: string;
    quantity: number;
    unitOfMeasurement: string;
    rawMaterial: {
      id: string;
      name: string;
      skuCode: string;
      category: string;
      unitOfMeasurement: string;
    };
  }[];
}

interface FGBatchRecord {
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
  consumptions: {
    id: string;
    rawMaterialId: string;
    rawMaterialName?: string;
    expectedQuantity: number;
    actualQuantity: number;
    unit?: string;
    sourceType?: string;
    batchNumber?: string;
  }[];
}

/* ─── Component ─── */
const MaterialTransferPage: React.FC = () => {
  const [boms, setBoms] = useState<BOM[]>([]);
  const [fgBatches, setFgBatches] = useState<FGBatchRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bomRes, batchRes] = await Promise.all([
        api.get(API_ROUTES.RAW.GET_FG_BOMS),
        api.get(API_ROUTES.RAW.GET_FG_BATCHES),
      ]);
      setBoms(bomRes.data?.data || []);
      setFgBatches(batchRes.data?.data || []);
    } catch {
      message.error('Failed to load data');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const statusColor = (status: string) => {
    switch (status) {
      case 'CREATED': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'ACCEPTED': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'REJECTED': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-muted/50 text-muted-foreground border-border';
    }
  };

  const createdCount = fgBatches.filter(b => b.status === 'CREATED').length;

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
              <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
                <Package className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">FG Batch Production</h1>
                <p className="text-muted-foreground text-sm">
                  Create FG batches from BOM recipes — SFG from warehouse transfers + stock items
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-card rounded-xl p-4 border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1">Active BOMs</p>
                <p className="text-2xl font-bold text-violet-600">{boms.length}</p>
                <div className="flex items-center mt-1">
                  <Layers size={12} className="text-violet-500 mr-1" />
                  <span className="text-xs text-violet-500 font-medium">FG recipes available</span>
                </div>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1">Total FG Batches</p>
                <p className="text-2xl font-bold text-indigo-600">{fgBatches.length}</p>
                <div className="flex items-center mt-1">
                  <BoxIcon size={12} className="text-indigo-500 mr-1" />
                  <span className="text-xs text-indigo-500 font-medium">All batches</span>
                </div>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1">Created</p>
                <p className="text-2xl font-bold text-emerald-600">{createdCount}</p>
                <div className="flex items-center mt-1">
                  <CheckCircle size={12} className="text-emerald-500 mr-1" />
                  <span className="text-xs text-emerald-500 font-medium">Batches produced</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-end">
              <Button
                type="primary"
                icon={<Plus size={14} />}
                onClick={() => navigate('/packaging/create-fg-batch')}
                className="rounded-lg"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                  border: 'none',
                  fontWeight: 600,
                }}
              >
                Create FG Batch
              </Button>
            </div>

            {/* FG Batches List */}
            <div className="space-y-3">
              {loading && (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="inline-block w-8 h-8 border-[3px] rounded-full animate-spin mb-3" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} />
                  <p className="text-sm">Loading FG batches…</p>
                </div>
              )}

              {!loading && fgBatches.length === 0 && (
                <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
                  <Package className="mx-auto mb-3 opacity-40" size={36} />
                  <p className="text-lg font-medium">No FG batches yet</p>
                  <p className="text-sm">Create an FG batch to start finished goods production.</p>
                </div>
              )}

              {!loading && fgBatches.map(batch => (
                <motion.div
                  key={batch.id}
                  className="bg-card rounded-xl border border-border overflow-hidden"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedId(expandedId === batch.id ? null : batch.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-violet-500/10">
                        <Package size={16} className="text-violet-600" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold font-mono text-primary">{batch.batchNumber}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {batch.fgProductName} • {new Date(batch.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-bold text-foreground">{batch.productionQty} {batch.productionUnit}</div>
                        <div className="text-[10px] text-muted-foreground">FG Output</div>
                      </div>
                      {batch.totalPackets > 0 && (
                        <div className="text-right">
                          <div className="text-sm font-bold text-violet-600">{batch.totalPackets.toLocaleString()}</div>
                          <div className="text-[10px] text-muted-foreground">Packets</div>
                        </div>
                      )}
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusColor(batch.status)}`}>
                        {batch.status === 'CREATED' && <Clock size={10} className="mr-1" />}
                        {batch.status === 'ACCEPTED' && <CheckCircle size={10} className="mr-1" />}
                        {batch.status === 'REJECTED' && <XCircle size={10} className="mr-1" />}
                        {batch.status === 'CREATED' ? 'PENDING' : batch.status}
                      </span>

                      {expandedId === batch.id ? (
                        <ChevronDown size={16} className="text-muted-foreground ml-2" />
                      ) : (
                        <ChevronRight size={16} className="text-muted-foreground ml-2" />
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedId === batch.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-border p-4 bg-muted/20">
                          {/* Summary */}
                          <div className="grid grid-cols-4 gap-4 mb-4">
                            <div className="bg-violet-500/5 rounded-lg p-3 border border-violet-500/10">
                              <div className="text-[10px] uppercase tracking-widest text-violet-600 font-semibold mb-1">Production</div>
                              <div className="text-lg font-bold text-violet-700">{batch.productionQty} {batch.productionUnit}</div>
                            </div>
                            {batch.totalPackets > 0 && (
                              <div className="bg-indigo-500/5 rounded-lg p-3 border border-indigo-500/10">
                                <div className="text-[10px] uppercase tracking-widest text-indigo-600 font-semibold mb-1">Packets</div>
                                <div className="text-lg font-bold text-indigo-700">{batch.totalPackets.toLocaleString()}</div>
                                {batch.packetSize && (
                                  <div className="text-xs text-indigo-500">{batch.packetSize} {batch.packetUnit} each</div>
                                )}
                              </div>
                            )}
                            <div className="bg-emerald-500/5 rounded-lg p-3 border border-emerald-500/10">
                              <div className="text-[10px] uppercase tracking-widest text-emerald-600 font-semibold mb-1">Status</div>
                              <div className="text-lg font-bold text-emerald-700">{batch.status}</div>
                            </div>
                          </div>

                          {/* Consumption Table */}
                          {batch.consumptions && batch.consumptions.length > 0 && (
                            <div>
                              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                Materials Consumed ({batch.consumptions.length})
                              </div>
                              <table className="min-w-full">
                                <thead>
                                  <tr className="bg-muted/40">
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Material</th>
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground uppercase">Source</th>
                                    <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">Expected</th>
                                    <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">Actual</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Transfer / Batch</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                  {batch.consumptions.map(c => (
                                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                                      <td className="px-3 py-2 text-sm font-medium text-foreground">{c.rawMaterialName || c.rawMaterialId}</td>
                                      <td className="px-3 py-2 text-center">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                          c.sourceType === 'SFG_BATCH'
                                            ? 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                                            : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                        }`}>
                                          {c.sourceType === 'SFG_BATCH' ? <Truck size={10} /> : <Database size={10} />}
                                          {c.sourceType === 'SFG_BATCH' ? 'SFG TRANSFER' : 'STOCK'}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2 text-sm text-right text-muted-foreground">{c.expectedQuantity} {c.unit}</td>
                                      <td className="px-3 py-2 text-sm text-right font-semibold text-foreground">{c.actualQuantity} {c.unit}</td>
                                      <td className="px-3 py-2 text-sm text-primary font-mono">{c.batchNumber || '-'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {batch.notes && (
                            <div className="mt-4 p-3 bg-muted/40 rounded-xl text-sm border border-border">
                              <span className="font-semibold flex items-center gap-1.5 mb-1 text-muted-foreground">
                                Notes
                              </span>
                              {batch.notes}
                            </div>
                          )}

                          <div className="mt-3 text-xs text-muted-foreground">
                            Created: {new Date(batch.createdAt).toLocaleString()}
                          </div>
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

export default MaterialTransferPage;
