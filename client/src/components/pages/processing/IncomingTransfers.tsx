import React, { useEffect, useState } from 'react';
import api, { API_ROUTES } from '../../../utils/api';
import { Button, Modal, Input, Select, message } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowDownToLine,
  CheckCircle,
  XCircle,
  MapPin,
  Clock,
  ChevronDown,
  ChevronRight,
  Truck,
  Send,
} from 'lucide-react';

const { Option } = Select;
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
const IncomingTransfers: React.FC = () => {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Send modal state
  const [sendModal, setSendModal] = useState<{
    visible: boolean;
    fromLocationId: string;
    toLocationId: string;
    lines: { productName: string; skuCode: string; quantity: number; unitOfMeasurement: string; batchNumber: string }[];
    notes: string;
    loading: boolean;
  }>({
    visible: false,
    fromLocationId: '',
    toLocationId: '',
    lines: [],
    notes: '',
    loading: false,
  });

  // Reject modal state
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
        params: { direction: 'INBOUND_TO_GRINDING' },
      });
      setTransfers(res.data?.data || []);
    } catch {
      message.error('Failed to fetch transfers');
    }
    setLoading(false);
  };

  const fetchLocations = async () => {
    try {
      const res = await api.get(API_ROUTES.RAW.GET_LOCATIONS);
      setLocations(res.data || []);
    } catch {
      /* silently */
    }
  };

  useEffect(() => {
    fetchTransfers();
    fetchLocations();
  }, []);

  // Accept transfer
  const handleAccept = async (id: string) => {
    try {
      await api.put(API_ROUTES.RAW.ACCEPT_TRANSFER(id));
      message.success('Transfer accepted successfully');
      fetchTransfers();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to accept transfer');
    }
  };

  // Reject transfer
  const handleReject = async () => {
    if (!rejectModal.reason.trim()) {
      message.error('Please enter a rejection reason');
      return;
    }
    setRejectModal((p) => ({ ...p, loading: true }));
    try {
      await api.put(API_ROUTES.RAW.REJECT_TRANSFER(rejectModal.transferId), {
        rejectionReason: rejectModal.reason,
      });
      message.success('Transfer rejected');
      setRejectModal({ visible: false, transferId: '', reason: '', loading: false });
      fetchTransfers();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to reject transfer');
      setRejectModal((p) => ({ ...p, loading: false }));
    }
  };

  // Send new transfer
  const openSendModal = () => {
    setSendModal({
      visible: true,
      fromLocationId: '',
      toLocationId: '',
      lines: [{ productName: '', skuCode: '', quantity: 0, unitOfMeasurement: 'kg', batchNumber: '' }],
      notes: '',
      loading: false,
    });
  };

  const addLine = () => {
    setSendModal((p) => ({
      ...p,
      lines: [...p.lines, { productName: '', skuCode: '', quantity: 0, unitOfMeasurement: 'kg', batchNumber: '' }],
    }));
  };

  const updateLine = (index: number, field: string, value: any) => {
    setSendModal((p) => {
      const lines = [...p.lines];
      (lines[index] as any)[field] = value;
      return { ...p, lines };
    });
  };

  const removeLine = (index: number) => {
    setSendModal((p) => ({
      ...p,
      lines: p.lines.filter((_, i) => i !== index),
    }));
  };

  const handleSendTransfer = async () => {
    if (!sendModal.fromLocationId || !sendModal.toLocationId) {
      message.error('Select both From and To locations');
      return;
    }
    const validLines = sendModal.lines.filter((l) => l.productName && l.quantity > 0);
    if (validLines.length === 0) {
      message.error('Add at least one valid line item');
      return;
    }
    setSendModal((p) => ({ ...p, loading: true }));
    try {
      await api.post(API_ROUTES.RAW.CREATE_TRANSFER, {
        fromLocationId: sendModal.fromLocationId,
        toLocationId: sendModal.toLocationId,
        notes: sendModal.notes,
        lines: validLines.map((l) => ({
          lineType: 'RAW_MATERIAL',
          productName: l.productName,
          skuCode: l.skuCode,
          quantity: l.quantity,
          unitOfMeasurement: l.unitOfMeasurement,
          batchNumber: l.batchNumber,
        })),
      });
      message.success('Transfer sent successfully!');
      setSendModal((p) => ({ ...p, visible: false, loading: false }));
      fetchTransfers();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to send transfer');
      setSendModal((p) => ({ ...p, loading: false }));
    }
  };

  const warehouseLocations = locations.filter((l) => l.type === 'WAREHOUSE' || l.type === 'CLEANING');
  const grindingLocations = locations.filter((l) => l.type === 'GRINDING');

  const statusColor = (status: string) => {
    switch (status) {
      case 'SENT':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'ACCEPTED':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'REJECTED':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-muted/50 text-muted-foreground border-border';
    }
  };

  const sentCount = transfers.filter((t) => t.status === 'SENT').length;
  const acceptedCount = transfers.filter((t) => t.status === 'ACCEPTED').length;
  const rejectedCount = transfers.filter((t) => t.status === 'REJECTED').length;

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-xs font-medium text-muted-foreground mb-1">Pending</p>
          <p className="text-2xl font-bold text-amber-600">{sentCount}</p>
          <div className="flex items-center mt-1">
            <Clock size={12} className="text-amber-500 mr-1" />
            <span className="text-xs text-amber-500 font-medium">Awaiting acceptance</span>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-xs font-medium text-muted-foreground mb-1">Accepted</p>
          <p className="text-2xl font-bold text-emerald-600">{acceptedCount}</p>
          <div className="flex items-center mt-1">
            <CheckCircle size={12} className="text-emerald-500 mr-1" />
            <span className="text-xs text-emerald-500 font-medium">Received at grinding</span>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-xs font-medium text-muted-foreground mb-1">Rejected</p>
          <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
          <div className="flex items-center mt-1">
            <XCircle size={12} className="text-red-500 mr-1" />
            <span className="text-xs text-red-500 font-medium">Returned / rejected</span>
          </div>
        </div>
      </div>

      {/* Send new transfer button */}
      <div className="flex justify-end">
        <Button
          type="primary"
          icon={<Send size={14} />}
          onClick={openSendModal}
          className="rounded-lg"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none',
            fontWeight: 600,
          }}
        >
          Send Transfer to Grinding
        </Button>
      </div>

      {/* Transfers list */}
      <div className="space-y-3">
        {loading && (
          <div className="text-center py-12 text-muted-foreground">
            <div className="inline-block w-8 h-8 border-[3px] rounded-full animate-spin mb-3" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} />
            <p className="text-sm">Loading transfers…</p>
          </div>
        )}

        {!loading && transfers.length === 0 && (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
            <Truck className="mx-auto mb-3 opacity-40" size={36} />
            <p className="text-lg font-medium">No inbound transfers</p>
            <p className="text-sm">Use "Send Transfer to Grinding" to create your first transfer.</p>
          </div>
        )}

        {!loading &&
          transfers.map((transfer) => (
            <motion.div
              key={transfer.id}
              className="bg-card rounded-xl border border-border overflow-hidden"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Transfer header */}
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedId(expandedId === transfer.id ? null : transfer.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <ArrowDownToLine size={16} className="text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold font-mono text-primary">
                      {transfer.transferNumber}
                    </div>
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAccept(transfer.id);
                        }}
                        style={{ background: '#10b981', border: 'none' }}
                        className="rounded-lg"
                      >
                        <CheckCircle size={12} className="mr-1 inline" /> Accept
                      </Button>
                      <Button
                        danger
                        size="small"
                        onClick={(e) => {
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

              {/* Expanded line items */}
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
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Line Items ({transfer.lines.length})
                      </div>
                      <table className="min-w-full">
                        <thead>
                          <tr className="bg-muted/40">
                            <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">
                              Product
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">
                              SKU
                            </th>
                            <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">
                              Quantity
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">
                              Batch
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {transfer.lines.map((line) => (
                            <tr key={line.id} className="hover:bg-muted/30 transition-colors">
                              <td className="px-3 py-2 text-sm font-medium text-foreground">
                                {line.productName || '-'}
                              </td>
                              <td className="px-3 py-2 text-sm text-muted-foreground font-mono">
                                {line.skuCode || '-'}
                              </td>
                              <td className="px-3 py-2 text-sm text-foreground text-right font-semibold">
                                {line.quantity} {line.unitOfMeasurement}
                              </td>
                              <td className="px-3 py-2 text-sm text-muted-foreground">
                                {line.batchNumber || '-'}
                              </td>
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

      {/* ─── Send Transfer Modal ─── */}
      <Modal
        open={sendModal.visible}
        title={
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Send className="text-white" size={14} />
            </div>
            <span className="text-lg font-semibold">Send Transfer to Grinding</span>
          </div>
        }
        onCancel={() => setSendModal((p) => ({ ...p, visible: false }))}
        width={700}
        footer={null}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1 font-medium">From Location (Warehouse)</div>
              <Select
                style={{ width: '100%' }}
                placeholder="Select source location"
                value={sendModal.fromLocationId || undefined}
                onChange={(val) => setSendModal((p) => ({ ...p, fromLocationId: val }))}
              >
                {warehouseLocations.map((l) => (
                  <Option key={l.id} value={l.id}>
                    <MapPin size={12} className="inline mr-1 text-primary" /> {l.name}
                  </Option>
                ))}
              </Select>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1 font-medium">To Location (Grinding)</div>
              <Select
                style={{ width: '100%' }}
                placeholder="Select destination"
                value={sendModal.toLocationId || undefined}
                onChange={(val) => setSendModal((p) => ({ ...p, toLocationId: val }))}
              >
                {grindingLocations.map((l) => (
                  <Option key={l.id} value={l.id}>
                    <MapPin size={12} className="inline mr-1 text-amber-500" /> {l.name}
                  </Option>
                ))}
              </Select>
            </div>
          </div>

          <div className="text-xs text-muted-foreground mb-1 font-medium">Notes (optional)</div>
          <Input
            value={sendModal.notes}
            onChange={(e) => setSendModal((p) => ({ ...p, notes: e.target.value }))}
            placeholder="Transfer remarks/notes"
          />

          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-2">
            Line Items
          </div>

          {sendModal.lines.map((line, idx) => (
            <div key={idx} className="flex items-end gap-2 p-3 rounded-lg border border-border bg-muted/20">
              <div className="flex-1">
                <div className="text-xs text-muted-foreground mb-0.5">Product Name</div>
                <Input
                  value={line.productName}
                  onChange={(e) => updateLine(idx, 'productName', e.target.value)}
                  placeholder="Material name"
                  size="small"
                />
              </div>
              <div className="w-24">
                <div className="text-xs text-muted-foreground mb-0.5">SKU</div>
                <Input
                  value={line.skuCode}
                  onChange={(e) => updateLine(idx, 'skuCode', e.target.value)}
                  placeholder="SKU"
                  size="small"
                />
              </div>
              <div className="w-20">
                <div className="text-xs text-muted-foreground mb-0.5">Qty</div>
                <Input
                  type="number"
                  value={line.quantity || ''}
                  onChange={(e) => updateLine(idx, 'quantity', Number(e.target.value))}
                  placeholder="0"
                  size="small"
                />
              </div>
              <div className="w-16">
                <div className="text-xs text-muted-foreground mb-0.5">Unit</div>
                <Input
                  value={line.unitOfMeasurement}
                  onChange={(e) => updateLine(idx, 'unitOfMeasurement', e.target.value)}
                  size="small"
                />
              </div>
              <div className="w-24">
                <div className="text-xs text-muted-foreground mb-0.5">Batch #</div>
                <Input
                  value={line.batchNumber}
                  onChange={(e) => updateLine(idx, 'batchNumber', e.target.value)}
                  placeholder="Batch"
                  size="small"
                />
              </div>
              {sendModal.lines.length > 1 && (
                <Button danger size="small" onClick={() => removeLine(idx)} className="mb-0.5">
                  ×
                </Button>
              )}
            </div>
          ))}

          <Button type="dashed" onClick={addLine} className="w-full">
            + Add Line Item
          </Button>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button onClick={() => setSendModal((p) => ({ ...p, visible: false }))}>Cancel</Button>
            <Button
              type="primary"
              loading={sendModal.loading}
              onClick={handleSendTransfer}
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', fontWeight: 600 }}
            >
              <Send size={12} className="mr-1 inline" /> Send Transfer
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Reject Modal ─── */}
      <Modal
        open={rejectModal.visible}
        title={
          <div className="flex items-center gap-2">
            <XCircle className="text-red-500" size={18} />
            <span>Reject Transfer</span>
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
          onChange={(e) => setRejectModal((p) => ({ ...p, reason: e.target.value }))}
          placeholder="Enter the reason for rejecting this transfer"
        />
      </Modal>
    </div>
  );
};

export default IncomingTransfers;
