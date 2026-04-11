import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Factory, Package, Send, CheckCircle, XCircle, Check, X, ChevronDown, Eye, MapPin, Scale, Hash, CalendarDays, Layers } from 'lucide-react';
import { Button, Modal, Input, message, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import api, { API_ROUTES } from '../../../utils/api';
import ProductionEntry from './ProductionEntry';

const { TextArea } = Input;

/* ─── Types ─── */
interface GrindingDispatch {
  id: string;
  batchNumber: string;
  totalQuantity: number;
  status: string;
  sentAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  notes?: string;
  inputRawMaterial?: {
    id: string;
    name: string;
    skuCode: string;
    unitOfMeasurement: string;
  };
  fromLocation?: { id: string; name: string; code: string };
  toLocation?: { id: string; name: string; code: string };
  lots?: {
    id: string;
    cleaningLotId: string;
    allocatedQuantity: number;
    seedWastageAllocated: number;
    cleaningLot?: {
      lotNumber: string;
      cleaningJobId?: string;
      cleanedQuantity?: number;
      cleanedQuantityUnit?: string;
      seedWastageUnit?: string;
      rawMaterial?: { name: string; unitOfMeasurement: string };
    };
  }[];
}

const SFGProcessingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'incoming' | 'production'>('incoming');
  const [dispatches, setDispatches] = useState<GrindingDispatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const paginatedDispatches = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return dispatches.slice(startIndex, startIndex + itemsPerPage);
  }, [dispatches, currentPage]);

  // Reject Modal
  const [rejectModal, setRejectModal] = useState<{
    visible: boolean;
    dispatch?: GrindingDispatch;
    reason: string;
    loading: boolean;
  }>({
    visible: false,
    dispatch: undefined,
    reason: '',
    loading: false,
  });

  const fetchDispatches = async () => {
    setLoading(true);
    try {
      const res = await api.get(API_ROUTES.RAW.GET_GRINDING_DISPATCHES);
      setDispatches(res.data?.data || res.data || []);
    } catch {
      message.error('Failed to load incoming dispatches');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDispatches();
  }, []);

  /* ─── Accept / Reject Handlers ─── */
  const handleAcceptDispatch = async (dispatch: GrindingDispatch) => {
    setAcceptingId(dispatch.id);
    try {
      await api.put(API_ROUTES.RAW.ACCEPT_GRINDING_DISPATCH(dispatch.id));
      message.success(`Dispatch ${dispatch.batchNumber} accepted!`);
      await fetchDispatches();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to accept dispatch');
    } finally {
      setAcceptingId(null);
    }
  };

  const openRejectModal = (dispatch: GrindingDispatch) => {
    setRejectModal({ visible: true, dispatch, reason: '', loading: false });
  };

  const handleRejectDispatch = async () => {
    if (!rejectModal.dispatch) return;
    if (!rejectModal.reason.trim()) { message.error('Please enter a rejection reason'); return; }
    setRejectModal((prev) => ({ ...prev, loading: true }));
    try {
      await api.put(API_ROUTES.RAW.REJECT_GRINDING_DISPATCH(rejectModal.dispatch.id), {
        rejectionReason: rejectModal.reason,
      });
      message.success(`Dispatch ${rejectModal.dispatch.batchNumber} rejected. Quantities restored.`);
      setRejectModal({ visible: false, dispatch: undefined, reason: '', loading: false });
      fetchDispatches();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to reject dispatch');
      setRejectModal((prev) => ({ ...prev, loading: false }));
    }
  };

  /* ─── Status Badge ─── */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-blue-500/10 text-blue-600 border-blue-500/20">
            <Send className="w-3 h-3 mr-1" /> Sent
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
            <CheckCircle className="w-3 h-3 mr-1" /> Accepted
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-red-500/10 text-red-600 border-red-500/20">
            <XCircle className="w-3 h-3 mr-1" /> Rejected
          </span>
        );
      default:
        return <span className="text-xs text-muted-foreground">{status}</span>;
    }
  };

  const pendingCount = dispatches.filter(d => d.status === 'SENT').length;
  const acceptedCount = dispatches.filter(d => d.status === 'ACCEPTED').length;

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
                <Factory className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">SFG Processing</h1>
                <p className="text-muted-foreground text-sm">
                  Manage incoming material dispatches and record production entries
                </p>
              </div>
            </div>
          </div>

          {/* Tab Bar */}
          <div className="flex border-b border-border bg-muted/30">
            <button
              className={`flex items-center gap-2 px-6 py-3.5 text-sm font-semibold transition-all border-b-2 ${
                activeTab === 'incoming'
                  ? 'text-primary border-primary bg-white/50'
                  : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/20'
              }`}
              onClick={() => setActiveTab('incoming')}
            >
              <Package size={16} />
              Incoming Dispatches
              {pendingCount > 0 && (
                <span className="ml-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              className={`flex items-center gap-2 px-6 py-3.5 text-sm font-semibold transition-all border-b-2 ${
                activeTab === 'production'
                  ? 'text-primary border-primary bg-white/50'
                  : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/20'
              }`}
              onClick={() => setActiveTab('production')}
            >
              <Factory size={16} />
              Production Postings
            </button>
          </div>

          {/* Content */}
          <div className="p-5">
            {activeTab === 'incoming' ? (
              <div className="space-y-5">
                {/* Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-card rounded-xl p-4 border border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Total Incoming</p>
                    <p className="text-2xl font-bold text-foreground">{dispatches.length}</p>
                  </div>
                  <div className="bg-card rounded-xl p-4 border border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Pending Approval</p>
                    <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
                    <div className="flex items-center mt-1">
                      <Send size={12} className="text-blue-500 mr-1" />
                      <span className="text-xs text-blue-500 font-medium">Awaiting your action</span>
                    </div>
                  </div>
                  <div className="bg-card rounded-xl p-4 border border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Accepted</p>
                    <p className="text-2xl font-bold text-emerald-600">{acceptedCount}</p>
                    <div className="flex items-center mt-1">
                      <CheckCircle size={12} className="text-emerald-500 mr-1" />
                      <span className="text-xs text-emerald-500 font-medium">Ready for production</span>
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="min-w-full divide-y divide-border">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="px-4 py-3"></th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          <div className="inline-flex items-center gap-2"><Hash className="w-3.5 h-3.5" /> Batch No.</div>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          <div className="inline-flex items-center gap-2"><Package className="w-3.5 h-3.5" /> Material</div>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          <div className="inline-flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> From → To</div>
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          <div className="inline-flex items-center gap-2"><Scale className="w-3.5 h-3.5" /> Qty</div>
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          <div className="inline-flex items-center gap-2"><CalendarDays className="w-3.5 h-3.5" /> Sent</div>
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {loading && (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                            <Spin indicator={<LoadingOutlined style={{ fontSize: 36, color: '#10b981' }} spin />} />
                            <p className="text-lg font-medium mt-4">Loading dispatches...</p>
                          </td>
                        </tr>
                      )}
                      {!loading && dispatches.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                            <Package className="mx-auto mb-3 opacity-40" size={36} />
                            <p className="text-lg font-medium">No incoming dispatches</p>
                            <p className="text-sm">Material dispatches from Cleaning will appear here.</p>
                          </td>
                        </tr>
                      )}
                      {!loading && paginatedDispatches.map((dispatch, idx) => (
                        <React.Fragment key={dispatch.id}>
                          <motion.tr
                            className="hover:bg-muted/50 transition-colors duration-150"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: idx * 0.04 }}
                          >
                            <td className="px-2 py-3 text-center">
                              <Button type="text" size="small"
                                icon={expandedId === dispatch.id ? <ChevronDown className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                onClick={() => setExpandedId(expandedId === dispatch.id ? null : dispatch.id)}
                              />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-primary font-semibold">
                              {dispatch.batchNumber}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-foreground">
                              {dispatch.inputRawMaterial?.name || '-'}
                              {dispatch.inputRawMaterial?.skuCode && (
                                <span className="ml-1 text-xs text-muted-foreground">({dispatch.inputRawMaterial.skuCode})</span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground/80">
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-medium">{dispatch.fromLocation?.name || '-'}</span>
                                <span className="text-muted-foreground">→</span>
                                <span className="text-xs font-medium">{dispatch.toLocation?.name || '-'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground text-right font-semibold">
                              {dispatch.totalQuantity} {dispatch.lots?.[0]?.cleaningLot?.cleanedQuantityUnit || dispatch.inputRawMaterial?.unitOfMeasurement || ''}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {getStatusBadge(dispatch.status)}
                            </td>
                            <td className="px-4 py-3 text-center text-xs text-foreground/70">
                              {dispatch.sentAt && !isNaN(Date.parse(dispatch.sentAt)) ? new Date(dispatch.sentAt).toLocaleString() : '-'}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex justify-center min-h-[28px] items-center overflow-hidden">
                                <AnimatePresence mode="wait">
                                  {dispatch.status === 'SENT' ? (
                                    acceptingId === dispatch.id ? (
                                      <motion.div
                                        key="accepting"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-lg text-xs font-semibold"
                                      >
                                        <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-emerald-600 rounded-full animate-spin" />
                                        Accepting...
                                      </motion.div>
                                    ) : (
                                      <motion.div
                                        key="actions"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="flex gap-1 justify-center"
                                      >
                                        <Button type="primary" size="small"
                                          icon={<Check className="w-3 h-3" />}
                                          onClick={() => handleAcceptDispatch(dispatch)}
                                          className="rounded-lg shadow-sm"
                                          disabled={acceptingId !== null}
                                          style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}
                                        >Accept</Button>
                                        <Button size="small" danger
                                          icon={<X className="w-3 h-3" />}
                                          onClick={() => openRejectModal(dispatch)}
                                          className="rounded-lg"
                                          disabled={acceptingId !== null}
                                        >Reject</Button>
                                      </motion.div>
                                    )
                                  ) : dispatch.status === 'ACCEPTED' ? (
                                    <motion.div
                                      key="accepted"
                                      initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                      className="flex justify-center"
                                    >
                                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-bold bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20 shadow-sm">
                                        <CheckCircle className="w-3 h-3" /> Received
                                      </span>
                                    </motion.div>
                                  ) : dispatch.status === 'REJECTED' && dispatch.rejectionReason ? (
                                    <motion.span
                                      key="rejected"
                                      initial={{ opacity: 0, scale: 0.9 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      className="text-xs text-red-500 italic block"
                                      title={dispatch.rejectionReason}
                                    >
                                      {dispatch.rejectionReason.length > 20 ? dispatch.rejectionReason.slice(0, 20) + '…' : dispatch.rejectionReason}
                                    </motion.span>
                                  ) : null}
                                </AnimatePresence>
                              </div>
                            </td>
                          </motion.tr>

                          {/* Expanded Row */}
                          <AnimatePresence>
                            {expandedId === dispatch.id && (
                              <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-muted/30">
                                <td colSpan={8} className="px-6 py-4 space-y-3">
                                  {/* Transfer Info */}
                                  <div className="rounded-xl border border-border bg-card p-4 flex flex-wrap gap-6">
                                    <div>
                                      <div className="text-xs text-muted-foreground font-medium">From Location</div>
                                      <div className="text-sm font-semibold text-foreground flex items-center gap-1 mt-1">
                                        <MapPin className="w-3.5 h-3.5 text-primary" />
                                        {dispatch.fromLocation?.name || '-'}
                                        <span className="text-xs text-muted-foreground ml-1">({dispatch.fromLocation?.code})</span>
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-xs text-muted-foreground font-medium">To Location</div>
                                      <div className="text-sm font-semibold text-foreground flex items-center gap-1 mt-1">
                                        <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                                        {dispatch.toLocation?.name || '-'}
                                        <span className="text-xs text-muted-foreground ml-1">({dispatch.toLocation?.code})</span>
                                      </div>
                                    </div>
                                    {dispatch.notes && (
                                      <div>
                                        <div className="text-xs text-muted-foreground font-medium">Notes</div>
                                        <div className="text-sm text-foreground/80 mt-1">{dispatch.notes}</div>
                                      </div>
                                    )}
                                    {dispatch.rejectionReason && (
                                      <div>
                                        <div className="text-xs text-red-500 font-medium">Rejection Reason</div>
                                        <div className="text-sm text-red-600 mt-1">{dispatch.rejectionReason}</div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Lot Allocation Table */}
                                  {dispatch.lots && dispatch.lots.filter(l => l.allocatedQuantity > 0 || l.seedWastageAllocated > 0).length > 0 && (
                                    <div className="rounded-xl border border-border bg-card overflow-hidden">
                                      <div className="p-3 border-b border-border">
                                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                          <Layers className="w-4 h-4 text-primary" /> Lot Allocation
                                        </h4>
                                      </div>
                                      <table className="min-w-full">
                                        <thead><tr className="bg-muted/40">
                                          <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Lot</th>
                                          <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Material</th>
                                          <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">Allocated</th>
                                          <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">Seed Wastage</th>
                                        </tr></thead>
                                        <tbody className="divide-y divide-border">
                                          {dispatch.lots.filter(bl => bl.allocatedQuantity > 0 || bl.seedWastageAllocated > 0).map(bl => (
                                            <tr key={bl.id} className="hover:bg-muted/30">
                                              <td className="px-3 py-2 text-sm font-mono text-primary">{bl.cleaningLot?.cleaningJobId ? `LOT-${bl.cleaningLot.cleaningJobId}` : (bl.cleaningLot?.lotNumber || bl.cleaningLotId)}</td>
                                              <td className="px-3 py-2 text-sm text-foreground">{bl.cleaningLot?.rawMaterial?.name || '-'}</td>
                                              <td className="px-3 py-2 text-sm text-right font-semibold text-foreground">{bl.allocatedQuantity} {bl.cleaningLot?.cleanedQuantityUnit || bl.cleaningLot?.rawMaterial?.unitOfMeasurement || ''}</td>
                                              <td className="px-3 py-2 text-sm text-right text-amber-600">{bl.seedWastageAllocated > 0 ? `${bl.seedWastageAllocated} ${bl.cleaningLot?.seedWastageUnit || bl.cleaningLot?.rawMaterial?.unitOfMeasurement || ''}` : '-'}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </td>
                              </motion.tr>
                            )}
                          </AnimatePresence>
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {dispatches.length > itemsPerPage && (
                  <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border">
                    <span className="text-xs text-muted-foreground">
                      Page {currentPage} of {Math.ceil(dispatches.length / itemsPerPage)} · {dispatches.length} total
                    </span>
                    <div className="flex gap-2">
                      <Button size="small" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>Previous</Button>
                      <Button size="small" disabled={currentPage >= Math.ceil(dispatches.length / itemsPerPage)} onClick={() => setCurrentPage((p) => p + 1)}>Next</Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <ProductionEntry />
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Reject Modal ── */}
      <Modal
        open={rejectModal.visible}
        title={<div className="flex items-center gap-2"><XCircle className="text-red-500" size={18} /><span>Reject Dispatch</span></div>}
        onCancel={() => setRejectModal((p) => ({ ...p, visible: false }))}
        footer={null} width={450}
      >
        <div className="space-y-4 mt-4">
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
            <p className="text-sm text-red-600 font-medium">
              Rejecting dispatch <span className="font-mono">{rejectModal.dispatch?.batchNumber}</span> will restore all allocated quantities back to the cleaning lots.
            </p>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1 font-medium">Rejection Reason *</div>
            <TextArea rows={3} value={rejectModal.reason}
              onChange={(e) => setRejectModal((p) => ({ ...p, reason: e.target.value }))}
              placeholder="Enter reason for rejecting this dispatch" />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button onClick={() => setRejectModal((p) => ({ ...p, visible: false }))}>Cancel</Button>
            <Button type="primary" danger loading={rejectModal.loading} onClick={handleRejectDispatch}>
              <XCircle size={12} className="mr-1 inline" /> Reject Dispatch
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

export default SFGProcessingPage;
