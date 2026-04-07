import React, { useEffect, useState } from 'react';
import api, { API_ROUTES } from '../../../utils/api';
import { Button, Modal, Input, message } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Package,
  Calendar,
  Truck,
  ArrowRight,
  Loader2,
  Inbox,
  Boxes,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

const { TextArea } = Input;

interface Transfer {
  id: string;
  transferNumber: string;
  fromLocation: { id: string; name: string };
  toLocation: { id: string; name: string };
  status: string;
  createdAt: string;
  notes?: string;
  lines: {
    id: string;
    productName: string;
    skuCode: string;
    quantity: number;
    unitOfMeasurement: string;
    numberOfBags?: number;
    batchNumber?: string;
  }[];
}

const ReceiveMaterialsPage: React.FC = () => {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

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
        params: { direction: 'SFG_TO_PRODUCTION' }
      });
      setTransfers(res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch transfers:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  const handleAccept = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAcceptingId(id);
    try {
      await api.put(API_ROUTES.RAW.ACCEPT_TRANSFER(id));
      message.success('Stock transfer received successfully!');
      fetchTransfers();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to receive stock');
    }
    setAcceptingId(null);
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
      message.success('Stock transfer rejected');
      setRejectModal({ visible: false, transferId: '', reason: '', loading: false });
      fetchTransfers();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to reject stock transfer');
      setRejectModal(p => ({ ...p, loading: false }));
    }
  };

  const pendingTransfers = transfers.filter(t => t.status === 'SENT');
  const processedTransfers = transfers.filter(t => t.status !== 'SENT');
  const pendingCount = pendingTransfers.length;
  const acceptedCount = transfers.filter(t => t.status === 'ACCEPTED').length;
  const rejectedCount = transfers.filter(t => t.status === 'REJECTED').length;

  const statusConfig: Record<string, { bg: string; icon: React.ReactNode; label: string }> = {
    SENT: { bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Clock size={10} />, label: 'PENDING' },
    ACCEPTED: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle size={10} />, label: 'ACCEPTED' },
    REJECTED: { bg: 'bg-red-50 text-red-700 border-red-200', icon: <XCircle size={10} />, label: 'REJECTED' },
  };

  const renderTable = (transferList: Transfer[], showActions: boolean) => (
    <div className="bg-white dark:bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-muted/30 dark:to-muted/20 border-b border-border">
          <tr>
            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Transfer #</th>
            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Route</th>
            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Product</th>
            <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Bags</th>
            <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Qty (KG)</th>
            <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</th>
            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Date</th>
            {showActions && <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Actions</th>}
            <th className="px-4 py-3 w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {transferList.length === 0 && (
            <tr>
              <td colSpan={showActions ? 9 : 8} className="py-12 text-center text-muted-foreground">
                <Inbox className="mx-auto mb-3 opacity-30" size={36} />
                <p className="text-sm font-semibold">No transfers in this category</p>
              </td>
            </tr>
          )}
          {transferList.map(t => {
            const isExpanded = expandedId === t.id;
            const totalBags = t.lines.reduce((s, l) => s + (l.numberOfBags || 0), 0);
            const totalQty = t.lines.reduce((s, l) => s + l.quantity, 0);
            const unit = t.lines[0]?.unitOfMeasurement || 'KG';
            const productNames = [...new Set(t.lines.map(l => l.productName).filter(Boolean))];
            const sc = statusConfig[t.status] || statusConfig.SENT;

            return (
              <React.Fragment key={t.id}>
                <tr
                  className={`cursor-pointer transition-colors ${isExpanded ? 'bg-emerald-50/30 dark:bg-emerald-900/5' : 'hover:bg-muted/30'}`}
                  onClick={() => setExpandedId(isExpanded ? null : t.id)}
                >
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-[13px] text-emerald-700">{t.transferNumber}</span>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                      <Calendar size={9} />
                      {new Date(t.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-muted-foreground truncate max-w-[100px]" title={t.fromLocation?.name}>{t.fromLocation?.name}</span>
                      <ArrowRight size={12} className="text-emerald-500 flex-shrink-0" />
                      <span className="font-semibold truncate max-w-[100px]" title={t.toLocation?.name}>{t.toLocation?.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-[13px]">{productNames.join(', ') || '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {totalBags > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-bold text-xs border border-emerald-200">
                        <Package size={10} /> {totalBags}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600 text-[13px]">
                    {totalQty.toLocaleString()} {unit}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${sc.bg}`}>
                      {sc.icon} {sc.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-muted-foreground">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  {showActions && (
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          type="primary"
                          size="small"
                          loading={acceptingId === t.id}
                          onClick={e => handleAccept(t.id, e)}
                          className="rounded-md font-semibold shadow-sm border-none px-3 text-xs"
                          style={{ background: '#059669' }}
                        >
                          <CheckCircle size={12} className="mr-1" /> Accept
                        </Button>
                        <Button
                          danger
                          size="small"
                          onClick={e => {
                            e.stopPropagation();
                            setRejectModal({ visible: true, transferId: t.id, reason: '', loading: false });
                          }}
                          className="rounded-md font-semibold shadow-sm px-3 text-xs"
                        >
                          <XCircle size={12} className="mr-1" /> Reject
                        </Button>
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isExpanded ? 'bg-emerald-100 text-emerald-600' : 'text-muted-foreground/40'}`}>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </td>
                </tr>

                {/* Expanded detail row */}
                {isExpanded && (
                  <tr>
                    <td colSpan={showActions ? 9 : 8} className="p-0">
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-gradient-to-b from-muted/15 to-transparent px-6 py-4 border-b border-emerald-100"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <Boxes size={13} className="text-emerald-600" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Transfer Items</span>
                          <span className="text-[10px] text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full">{t.lines.length} items</span>
                        </div>
                        <div className="rounded-lg border border-border overflow-hidden bg-white dark:bg-card">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-muted/20 border-b border-border">
                              <tr>
                                <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Source Batch</th>
                                <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Product</th>
                                <th className="px-4 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Bags</th>
                                <th className="px-4 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Quantity</th>
                                <th className="px-4 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Unit</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {t.lines.map((line, idx) => (
                                <tr key={line.id || idx} className="hover:bg-muted/10">
                                  <td className="px-4 py-2.5">
                                    <span className="font-mono text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                      {line.batchNumber || '—'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <div className="font-semibold text-[13px]">{line.productName || '—'}</div>
                                    {line.skuCode && <div className="text-[10px] text-muted-foreground">{line.skuCode}</div>}
                                  </td>
                                  <td className="px-4 py-2.5 text-center">
                                    {line.numberOfBags != null ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md font-bold text-xs border border-emerald-200">
                                        {line.numberOfBags}
                                      </span>
                                    ) : '—'}
                                  </td>
                                  <td className="px-4 py-2.5 text-right font-bold text-sm">{Number(line.quantity).toLocaleString()}</td>
                                  <td className="px-4 py-2.5 text-right text-xs text-muted-foreground font-medium uppercase">{line.unitOfMeasurement}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {t.notes && (
                          <div className="mt-3 p-3 bg-amber-50/60 border border-amber-100 rounded-lg text-sm text-foreground flex items-start gap-2">
                            <AlertTriangle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <strong className="text-amber-700 text-[10px] uppercase tracking-wider">Notes:</strong>
                              <span className="ml-1.5 text-xs">{t.notes}</span>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <motion.div
      className="p-6 md:p-8 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
          <ClipboardCheck className="text-emerald-600" />
          Receive Materials
        </h1>
        <p className="text-muted-foreground mt-1">Accept or reject incoming SFG transfers at production line</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-card rounded-xl p-4 border border-border shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-card rounded-xl p-4 border border-border shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Accepted</p>
            <p className="text-2xl font-bold text-emerald-600">{acceptedCount}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-card rounded-xl p-4 border border-border shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-50 text-red-600">
            <XCircle size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Rejected</p>
            <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && transfers.length === 0 && (
        <div className="py-16 flex justify-center items-center bg-white dark:bg-card rounded-xl border border-border">
          <Loader2 className="animate-spin text-emerald-500" size={32} />
        </div>
      )}

      {/* Empty State */}
      {!loading && transfers.length === 0 && (
        <div className="py-16 text-center text-muted-foreground bg-white dark:bg-card rounded-xl border border-border">
          <Inbox className="mx-auto mb-4 text-muted-foreground/30" size={48} />
          <p className="text-lg font-semibold">No incoming transfers</p>
          <p className="text-sm mt-1">Transfers will appear here once SFG dispatches are created.</p>
        </div>
      )}

      {/* Pending Transfers Section */}
      {pendingTransfers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-100"><Clock size={14} className="text-amber-600" /></div>
            <h2 className="text-base font-bold text-foreground">Awaiting Acceptance</h2>
            <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full font-bold">{pendingCount}</span>
          </div>
          {renderTable(pendingTransfers, true)}
        </div>
      )}

      {/* Processed Transfers Section */}
      {processedTransfers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100"><CheckCircle size={14} className="text-emerald-600" /></div>
            <h2 className="text-base font-bold text-foreground">Processed Transfers</h2>
            <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-bold">{processedTransfers.length}</span>
          </div>
          {renderTable(processedTransfers, false)}
        </div>
      )}

      {/* Reject Modal */}
      <Modal
        open={rejectModal.visible}
        title={
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-red-50"><XCircle className="text-red-500" size={18} /></div>
            <span className="font-bold">Reject Transfer</span>
          </div>
        }
        onCancel={() => setRejectModal({ visible: false, transferId: '', reason: '', loading: false })}
        onOk={handleReject}
        confirmLoading={rejectModal.loading}
        okText="Confirm Rejection"
        okButtonProps={{ danger: true, className: "rounded-lg shadow-sm font-semibold" }}
        cancelButtonProps={{ className: "rounded-lg" }}
      >
        <div className="text-sm text-muted-foreground mb-2 mt-4">
          Please provide a reason for rejecting this transfer <span className="text-red-500">*</span>
        </div>
        <TextArea
          rows={4}
          value={rejectModal.reason}
          onChange={e => setRejectModal(p => ({ ...p, reason: e.target.value }))}
          placeholder="e.g. Broken packaging, wrong quantity, mismatch..."
          className="rounded-lg shadow-sm"
        />
      </Modal>
    </motion.div>
  );
};

export default ReceiveMaterialsPage;
