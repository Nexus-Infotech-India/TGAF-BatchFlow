import React, { useEffect, useState } from 'react';
import api, { API_ROUTES } from '../../../utils/api';
import { Button, Modal, Input, message } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  MapPin,
  Clock,
  ChevronDown,
  ChevronRight,
  Package,
  Truck,
  ClipboardCheck,
  Database,
  BoxIcon,
} from 'lucide-react';

const { TextArea } = Input;

/* ─── Types ─── */
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
const ReceiveMaterialsPage: React.FC = () => {
  const [fgBatches, setFgBatches] = useState<FGBatchRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedFgId, setExpandedFgId] = useState<string | null>(null);

  const [fgRejectModal, setFgRejectModal] = useState<{
    visible: boolean;
    batchId: string;
    reason: string;
    loading: boolean;
  }>({
    visible: false,
    batchId: '',
    reason: '',
    loading: false,
  });

  const fetchData = async () => {
    setLoading(true);
    // Fetch FG Batches
    try {
      const fgBatchesRes = await api.get(API_ROUTES.RAW.GET_FG_BATCHES);
      console.log('FG Batches response:', fgBatchesRes.data);
      setFgBatches(fgBatchesRes.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch FG batches:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const statusColor = (status: string) => {
    switch (status) {
      case 'SENT': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'CREATED': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'ACCEPTED': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'REJECTED': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-muted/50 text-muted-foreground border-border';
    }
  };

  const handleAcceptFg = async (id: string) => {
    try {
      await api.put(API_ROUTES.RAW.ACCEPT_FG_BATCH(id));
      message.success('FG Batch accepted');
      fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to accept FG Batch');
    }
  };

  const handleRejectFg = async () => {
    if (!fgRejectModal.reason.trim()) {
      message.error('Please enter a rejection reason');
      return;
    }
    setFgRejectModal(p => ({ ...p, loading: true }));
    try {
      await api.put(API_ROUTES.RAW.REJECT_FG_BATCH(fgRejectModal.batchId), {
        reason: fgRejectModal.reason,
      });
      message.success('FG Batch rejected');
      setFgRejectModal({ visible: false, batchId: '', reason: '', loading: false });
      fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to reject FG Batch');
      setFgRejectModal(p => ({ ...p, loading: false }));
    }
  };

  const sentCount = fgBatches.filter(b => b.status === 'CREATED').length;
  const acceptedCount = fgBatches.filter(b => b.status === 'ACCEPTED').length;

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
              <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                <ClipboardCheck className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Receive Materials & Approvals</h1>
                <p className="text-muted-foreground text-sm">
                  Accept or reject incoming warehouse shipments and produced FG batches at packaging production
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-card rounded-xl p-4 border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1">Incoming (Pending)</p>
                <p className="text-2xl font-bold text-amber-600">{sentCount}</p>
                <div className="flex items-center mt-1">
                  <Clock size={12} className="text-amber-500 mr-1" />
                  <span className="text-xs text-amber-500 font-medium">Awaiting supervisor acceptance</span>
                </div>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1">Received</p>
                <p className="text-2xl font-bold text-emerald-600">{acceptedCount}</p>
                <div className="flex items-center mt-1">
                  <CheckCircle size={12} className="text-emerald-500 mr-1" />
                  <span className="text-xs text-emerald-500 font-medium">Available for production</span>
                </div>
              </div>
            </div>

            {/* ─── FG Batch Approvals ─── */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
                  <BoxIcon size={14} className="text-white" />
                </div>
                <h2 className="text-lg font-bold text-foreground">FG Batch Approvals</h2>
                <span className="text-xs text-muted-foreground ml-1">
                  ({fgBatches.filter(b => b.status === 'CREATED').length} pending)
                </span>
              </div>

              <div className="space-y-3">
                {!loading && fgBatches.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground bg-card rounded-xl border border-border">
                    <Package className="mx-auto mb-2 opacity-40" size={32} />
                    <p className="text-sm font-medium">No FG batches to review</p>
                    <p className="text-xs">FG batches created from production will appear here for approval.</p>
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
                      onClick={() => setExpandedFgId(expandedFgId === batch.id ? null : batch.id)}
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

                        {batch.status === 'CREATED' && (
                          <div className="flex gap-1.5">
                            <Button
                              type="primary"
                              size="small"
                              onClick={e => { e.stopPropagation(); handleAcceptFg(batch.id); }}
                              style={{ background: '#10b981', border: 'none' }}
                              className="rounded-lg font-semibold"
                            >
                              <CheckCircle size={12} className="mr-1 inline" /> Accept
                            </Button>
                            <Button
                              danger
                              size="small"
                              onClick={e => {
                                e.stopPropagation();
                                setFgRejectModal({ visible: true, batchId: batch.id, reason: '', loading: false });
                              }}
                              className="rounded-lg font-semibold"
                            >
                              <XCircle size={12} className="mr-1 inline" /> Reject
                            </Button>
                          </div>
                        )}

                        {expandedFgId === batch.id ? (
                          <ChevronDown size={16} className="text-muted-foreground" />
                        ) : (
                          <ChevronRight size={16} className="text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedFgId === batch.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-border p-4 bg-muted/20">
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
                              <div className="mt-3 p-2.5 bg-muted/40 rounded-lg text-sm border border-border">
                                <strong className="text-muted-foreground text-xs">Notes:</strong>{' '}
                                <span className="text-foreground">{batch.notes}</span>
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
          </div>
        </motion.div>
      </div>

      {/* Reject FG Batch Modal */}
      <Modal
        open={fgRejectModal.visible}
        title={
          <div className="flex items-center gap-2">
            <XCircle className="text-red-500" size={18} />
            <span>Reject FG Batch</span>
          </div>
        }
        onCancel={() => setFgRejectModal({ visible: false, batchId: '', reason: '', loading: false })}
        onOk={handleRejectFg}
        confirmLoading={fgRejectModal.loading}
        okText="Reject Batch"
        okButtonProps={{ danger: true }}
      >
        <div className="text-xs text-muted-foreground mb-2 mt-4 font-medium">
          Reason for rejection <span className="text-red-500">*</span>
        </div>
        <TextArea
          rows={4}
          value={fgRejectModal.reason}
          onChange={e => setFgRejectModal(p => ({ ...p, reason: e.target.value }))}
          placeholder="Enter why this FG batch should be rejected..."
        />
      </Modal>
    </motion.div>
  );
};

export default ReceiveMaterialsPage;
