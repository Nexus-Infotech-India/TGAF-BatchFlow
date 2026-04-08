import React, { useEffect, useState } from 'react';
import api, { API_ROUTES } from '../../../utils/api';
import { Button, Modal, Input, message } from 'antd';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  MapPin,
  Clock,
  Package,
  Truck,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const { TextArea } = Input;
const PAGE_SIZE = 10;

/* ─── Types ─── */
interface Verification {
  id: string;
  verificationNumber: string;
  entryNumber: string;
  fgProductName: string;
  totalAchievedBoxes?: number;
  totalPackets: number;
  packetSize?: number;
  packetUnit?: string;
  cartonCapacity?: number;
  toLocationName?: string;
  status: string;
  notes?: string;
  rejectionReason?: string;
  dispatchedAt: string;
  verifiedAt?: string;
  productionEntry?: any;
}

/* ─── Component ─── */
const FGVerificationPage: React.FC = () => {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const [rejectModal, setRejectModal] = useState<{
    visible: boolean;
    verificationId: string;
    reason: string;
    loading: boolean;
  }>({
    visible: false,
    verificationId: '',
    reason: '',
    loading: false,
  });

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const res = await api.get(API_ROUTES.RAW.GET_FG_VERIFICATIONS);
      setVerifications(res.data?.data || []);
    } catch {
      message.error('Failed to fetch FG verifications');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  const handleAccept = async (id: string) => {
    try {
      await api.put(API_ROUTES.RAW.ACCEPT_FG_VERIFICATION(id));
      message.success('FG batch accepted at warehouse');
      fetchVerifications();
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
      await api.put(API_ROUTES.RAW.REJECT_FG_VERIFICATION(rejectModal.verificationId), {
        rejectionReason: rejectModal.reason,
      });
      message.success('FG batch rejected');
      setRejectModal({ visible: false, verificationId: '', reason: '', loading: false });
      fetchVerifications();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to reject');
      setRejectModal(p => ({ ...p, loading: false }));
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      PENDING: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      ACCEPTED: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      REJECTED: 'bg-red-500/10 text-red-600 border-red-500/20',
    };
    return map[status] || 'bg-muted/50 text-muted-foreground border-border';
  };

  const pendingCount = verifications.filter(v => v.status === 'PENDING').length;
  const acceptedCount = verifications.filter(v => v.status === 'ACCEPTED').length;
  const totalPages = Math.max(1, Math.ceil(verifications.length / PAGE_SIZE));
  const paged = verifications.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <motion.div className="min-h-screen bg-background" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div className="bg-card rounded-2xl border border-border overflow-hidden" initial={{ y: -12 }} animate={{ y: 0 }}>
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                <ShieldCheck className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">FG Warehouse Verification</h1>
                <p className="text-muted-foreground text-sm">Accept or reject incoming FG packet batches at the warehouse</p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-card rounded-xl p-4 border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1">Incoming (Pending)</p>
                <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
                <div className="flex items-center mt-1"><Clock size={12} className="text-amber-500 mr-1" /><span className="text-xs text-amber-500 font-medium">Awaiting verification</span></div>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1">Received</p>
                <p className="text-2xl font-bold text-emerald-600">{acceptedCount}</p>
                <div className="flex items-center mt-1"><CheckCircle size={12} className="text-emerald-500 mr-1" /><span className="text-xs text-emerald-500 font-medium">Verified and accepted</span></div>
              </div>
            </div>

            {/* Table */}
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="min-w-full table-fixed">
                <colgroup>
                  <col className="w-[18%]" />
                  <col className="w-[20%]" />
                  <col className="w-[12%]" />
                  <col className="w-[15%]" />
                  <col className="w-[13%]" />
                  <col className="w-[22%]" />
                </colgroup>
                <thead>
                  <tr className="bg-muted/40">
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">FG Batch ID</th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Product</th>
                    <th className="px-5 py-3.5 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Boxes / Shift</th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Destination</th>
                    <th className="px-5 py-3.5 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3.5 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading && (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      <div className="inline-block w-6 h-6 border-[3px] rounded-full animate-spin mb-2" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} />
                      <p className="text-sm">Loading…</p>
                    </td></tr>
                  )}
                  {!loading && paged.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      <Truck className="mx-auto mb-2 opacity-40" size={28} />
                      <p className="text-sm font-medium">No incoming FG batches</p>
                    </td></tr>
                  )}
                  {!loading && paged.map((v, idx) => (
                    <tr key={v.id} className={`hover:bg-muted/20 transition-colors ${idx % 2 === 0 ? 'bg-card' : 'bg-muted/5'}`}>
                      <td className="px-5 py-3.5">
                        <div className="text-sm font-mono font-bold text-primary">{v.verificationNumber}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{new Date(v.dispatchedAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-sm font-semibold text-foreground truncate">{v.fgProductName}</div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-sm font-bold text-amber-600">
                          {v.totalAchievedBoxes?.toLocaleString() ?? 
                            (v.productionEntry?.machineEntries 
                              ? v.productionEntry.machineEntries.reduce((sum: number, m: any) => sum + (Number(m.todayAchieve) || 0), 0).toLocaleString() 
                              : '-')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-foreground">
                        <span className="inline-flex items-center gap-1.5"><MapPin size={13} className="text-muted-foreground shrink-0" />{v.toLocationName}</span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusBadge(v.status)}`}>
                          {v.status === 'PENDING' && <Clock size={10} />}
                          {v.status === 'ACCEPTED' && <CheckCircle size={10} />}
                          {v.status === 'REJECTED' && <XCircle size={10} />}
                          {v.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {v.status === 'PENDING' ? (
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            <Button
                              type="primary"
                              size="small"
                              onClick={() => handleAccept(v.id)}
                              style={{ background: '#10b981', border: 'none' }}
                              className="rounded-lg font-semibold min-w-[80px]"
                            >
                              <CheckCircle size={12} className="mr-1 inline" /> Accept
                            </Button>
                            <Button
                              danger
                              size="small"
                              onClick={() => setRejectModal({ visible: true, verificationId: v.id, reason: '', loading: false })}
                              className="rounded-lg font-semibold min-w-[80px]"
                            >
                              <XCircle size={12} className="mr-1 inline" /> Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {verifications.length > PAGE_SIZE && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, verifications.length)} of {verifications.length}
                </p>
                <div className="flex gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg border border-border hover:bg-muted/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                    <button key={n} onClick={() => setPage(n)} className={`w-8 h-8 rounded-lg text-xs font-semibold border transition-colors ${page === n ? 'bg-emerald-600 text-white border-emerald-600' : 'border-border hover:bg-muted/40 text-foreground'}`}>
                      {n}
                    </button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg border border-border hover:bg-muted/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Reject Modal */}
      <Modal
        open={rejectModal.visible}
        title={<div className="flex items-center gap-2"><XCircle className="text-red-500" size={18} /><span>Reject FG Batch</span></div>}
        onCancel={() => setRejectModal({ visible: false, verificationId: '', reason: '', loading: false })}
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
          placeholder="Enter the reason for rejecting this FG batch"
        />
      </Modal>
    </motion.div>
  );
};

export default FGVerificationPage;
