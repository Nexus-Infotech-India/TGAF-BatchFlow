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
  ShieldCheck,
} from 'lucide-react';

const { TextArea } = Input;

/* ─── Types ─── */
interface Location {
  id: string;
  code: string;
  name: string;
  type: string;
}

interface TransferLine {
  id: string;
  lineType: string;
  productName?: string;
  skuCode?: string;
  quantity: number;
  unitOfMeasurement: string;
  batchNumber?: string;
}

interface Transfer {
  id: string;
  transferNumber: string;
  direction: string;
  status: string;
  sentAt: string;
  acceptedAt?: string;
  rejectionReason?: string;
  notes?: string;
  fromLocation: Location;
  toLocation: Location;
  lines: TransferLine[];
}

/* ─── Component ─── */
const FGVerificationPage: React.FC = () => {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [rejectModal, setRejectModal] = useState<{
    visible: boolean;
    transferId: string;
    reason: string;
    loading: boolean;
  }>({
    visible: false,
    transferId: '',
    reason: '',
    loading: false,
  });

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const res = await api.get(API_ROUTES.RAW.GET_TRANSFERS, {
        params: { direction: 'PACKAGING_TO_FG_WAREHOUSE' },
      });
      setTransfers(res.data?.data || []);
    } catch {
      message.error('Failed to fetch incoming FG transfers');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  const handleAccept = async (id: string) => {
    try {
      await api.put(API_ROUTES.RAW.ACCEPT_TRANSFER(id));
      message.success('FG accepted at warehouse');
      fetchTransfers();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to accept');
    }
  };

  const handleReject = async () => {
    if (!rejectModal.reason.trim()) {
      message.error('Please enter a rejection reason');
      return;
    }
    setRejectModal(p => ({ ...p, loading: true }));
    try {
      await api.put(API_ROUTES.RAW.REJECT_TRANSFER(rejectModal.transferId), {
        rejectionReason: rejectModal.reason,
      });
      message.success('Transfer rejected');
      setRejectModal({ visible: false, transferId: '', reason: '', loading: false });
      fetchTransfers();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to reject');
      setRejectModal(p => ({ ...p, loading: false }));
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'SENT': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'ACCEPTED': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'REJECTED': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-muted/50 text-muted-foreground border-border';
    }
  };

  const sentCount = transfers.filter(t => t.status === 'SENT').length;
  const acceptedCount = transfers.filter(t => t.status === 'ACCEPTED').length;

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
                <ShieldCheck className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">FG Warehouse Verification</h1>
                <p className="text-muted-foreground text-sm">
                  Accept or reject incoming FG &amp; scrap at the FG warehouse
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
                  <span className="text-xs text-amber-500 font-medium">Awaiting warehouse verification</span>
                </div>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1">Received</p>
                <p className="text-2xl font-bold text-emerald-600">{acceptedCount}</p>
                <div className="flex items-center mt-1">
                  <CheckCircle size={12} className="text-emerald-500 mr-1" />
                  <span className="text-xs text-emerald-500 font-medium">Verified and accepted</span>
                </div>
              </div>
            </div>

            {/* Transfers List */}
            <div className="space-y-3">
              {loading && (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="inline-block w-8 h-8 border-[3px] rounded-full animate-spin mb-3" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} />
                  <p className="text-sm">Loading incoming FG transfers…</p>
                </div>
              )}

              {!loading && transfers.length === 0 && (
                <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
                  <Truck className="mx-auto mb-3 opacity-40" size={36} />
                  <p className="text-lg font-medium">No incoming FG transfers</p>
                  <p className="text-sm">No finished goods waiting for verification at the FG warehouse.</p>
                </div>
              )}

              {!loading && transfers.map(transfer => (
                <motion.div
                  key={transfer.id}
                  className="bg-card rounded-xl border border-border overflow-hidden"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedId(expandedId === transfer.id ? null : transfer.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/10">
                        <Package size={16} className="text-emerald-600" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold font-mono text-primary">{transfer.transferNumber}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          <MapPin size={10} className="inline mr-1" />
                          {transfer.fromLocation?.name} → {transfer.toLocation?.name}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusColor(transfer.status)}`}>
                        {transfer.status === 'SENT' && <Clock size={10} className="mr-1" />}
                        {transfer.status === 'ACCEPTED' && <CheckCircle size={10} className="mr-1" />}
                        {transfer.status === 'REJECTED' && <XCircle size={10} className="mr-1" />}
                        {transfer.status}
                      </span>

                      {transfer.status === 'SENT' && (
                        <div className="flex gap-1.5">
                          <Button
                            type="primary"
                            size="small"
                            onClick={e => { e.stopPropagation(); handleAccept(transfer.id); }}
                            style={{ background: '#10b981', border: 'none' }}
                            className="rounded-lg"
                          >
                            <CheckCircle size={12} className="mr-1 inline" /> Accept
                          </Button>
                          <Button
                            danger
                            size="small"
                            onClick={e => {
                              e.stopPropagation();
                              setRejectModal({ visible: true, transferId: transfer.id, reason: '', loading: false });
                            }}
                            className="rounded-lg"
                          >
                            <XCircle size={12} className="mr-1 inline" /> Reject
                          </Button>
                        </div>
                      )}

                      {expandedId === transfer.id ? (
                        <ChevronDown size={16} className="text-muted-foreground" />
                      ) : (
                        <ChevronRight size={16} className="text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedId === transfer.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-border p-4 bg-muted/20">
                          <table className="min-w-full">
                            <thead>
                              <tr className="bg-muted/40">
                                <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Type</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Product</th>
                                <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">Quantity</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Batch</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {transfer.lines.map(line => (
                                <tr key={line.id} className="hover:bg-muted/30">
                                  <td className="px-3 py-2">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                      line.lineType === 'FG' ? 'bg-violet-500/10 text-violet-600 border-violet-500/20'
                                        : 'bg-red-500/10 text-red-600 border-red-500/20'
                                    }`}>
                                      {line.lineType}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-sm font-medium text-foreground">{line.productName || '-'}</td>
                                  <td className="px-3 py-2 text-sm text-foreground text-right font-semibold">{line.quantity} {line.unitOfMeasurement}</td>
                                  <td className="px-3 py-2 text-sm text-primary font-mono">{line.batchNumber || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {transfer.notes && (
                            <div className="mt-3 text-xs text-muted-foreground bg-muted/40 rounded-lg p-2">
                              <strong>Notes:</strong> {transfer.notes}
                            </div>
                          )}
                          {transfer.rejectionReason && (
                            <div className="mt-3 text-xs text-red-600 bg-red-500/5 rounded-lg p-2 border border-red-500/10">
                              <strong>Rejection Reason:</strong> {transfer.rejectionReason}
                            </div>
                          )}
                          <div className="mt-3 text-xs text-muted-foreground">
                            Sent: {new Date(transfer.sentAt).toLocaleString()}
                            {transfer.acceptedAt && <span className="ml-4">Accepted: {new Date(transfer.acceptedAt).toLocaleString()}</span>}
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

      {/* Reject Modal */}
      <Modal
        open={rejectModal.visible}
        title={
          <div className="flex items-center gap-2">
            <XCircle className="text-red-500" size={18} />
            <span>Reject FG Transfer</span>
          </div>
        }
        onCancel={() => setRejectModal({ visible: false, transferId: '', reason: '', loading: false })}
        onOk={handleReject}
        confirmLoading={rejectModal.loading}
        okText="Reject"
        okButtonProps={{ danger: true }}
      >
        <div className="text-xs text-muted-foreground mb-1 font-medium">
          Rejection Reason <span className="text-red-500">*</span>
        </div>
        <TextArea
          rows={3}
          value={rejectModal.reason}
          onChange={e => setRejectModal(p => ({ ...p, reason: e.target.value }))}
          placeholder="Enter the reason for rejecting this FG transfer"
        />
      </Modal>
    </motion.div>
  );
};

export default FGVerificationPage;
