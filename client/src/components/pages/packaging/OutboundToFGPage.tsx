import React, { useEffect, useState } from 'react';
import api, { API_ROUTES } from '../../../utils/api';
import { Button, Modal, Select, Input, message } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpFromLine,
  CheckCircle,
  XCircle,
  MapPin,
  Clock,
  ChevronDown,
  ChevronRight,
  Send,
  Package,
  Truck,
  Cpu,
} from 'lucide-react';

const { Option } = Select;

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
  numberOfBags?: number;
  bagSizeKg?: number;
  totalPackedQty?: number;
  totalPackedUnit?: string;
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
const OutboundToFGPage: React.FC = () => {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Send modal
  const [sendModal, setSendModal] = useState<{
    visible: boolean;
    fromLocationId: string;
    toLocationId: string;
    lines: {
      lineType: string;
      productName: string;
      skuCode: string;
      quantity: number;
      unitOfMeasurement: string;
      batchNumber: string;
      numberOfBags?: number;
      bagSizeKg?: number;
    }[];
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

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const res = await api.get(API_ROUTES.RAW.GET_TRANSFERS, {
        params: { direction: 'PACKAGING_TO_FG_WAREHOUSE' },
      });
      setTransfers(res.data?.data || []);
    } catch {
      message.error('Failed to fetch outbound transfers');
    }
    setLoading(false);
  };

  const fetchLocations = async () => {
    try {
      const res = await api.get(API_ROUTES.RAW.GET_LOCATIONS);
      setLocations(res.data || []);
    } catch { /* silently */ }
  };

  useEffect(() => {
    fetchTransfers();
    fetchLocations();
  }, []);

  const machineLocations = locations.filter(l => l.type === 'MACHINE' || l.type === 'PACKAGING_MACHINE');
  const fgWarehouses = locations.filter(l => l.type === 'FG_WAREHOUSE' || l.type === 'WAREHOUSE');

  const openSendModal = () => {
    setSendModal({
      visible: true,
      fromLocationId: '',
      toLocationId: '',
      lines: [{ lineType: 'FG', productName: '', skuCode: '', quantity: 0, unitOfMeasurement: 'KG', batchNumber: '' }],
      notes: '',
      loading: false,
    });
  };

  const addLine = () => {
    setSendModal(p => ({
      ...p,
      lines: [...p.lines, { lineType: 'FG', productName: '', skuCode: '', quantity: 0, unitOfMeasurement: 'KG', batchNumber: '' }],
    }));
  };

  const removeLine = (idx: number) => {
    setSendModal(p => ({ ...p, lines: p.lines.filter((_, i) => i !== idx) }));
  };

  const updateLine = (idx: number, field: string, value: any) => {
    setSendModal(p => ({
      ...p,
      lines: p.lines.map((l, i) => i === idx ? { ...l, [field]: value } : l),
    }));
  };

  const handleSend = async () => {
    if (!sendModal.fromLocationId || !sendModal.toLocationId) {
      message.error('Select both From and To locations');
      return;
    }
    const validLines = sendModal.lines.filter(l => l.productName && l.quantity > 0);
    if (validLines.length === 0) {
      message.error('Add at least one valid line item');
      return;
    }
    setSendModal(p => ({ ...p, loading: true }));
    try {
      await api.post(API_ROUTES.RAW.CREATE_OUTBOUND_TRANSFER, {
        direction: 'PACKAGING_TO_FG_WAREHOUSE',
        fromLocationId: sendModal.fromLocationId,
        toLocationId: sendModal.toLocationId,
        notes: sendModal.notes,
        lines: validLines,
      });
      message.success('FG dispatch to warehouse sent successfully');
      setSendModal(p => ({ ...p, visible: false, loading: false }));
      fetchTransfers();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to create transfer');
      setSendModal(p => ({ ...p, loading: false }));
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
              <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                <ArrowUpFromLine className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Outbound to FG Warehouse</h1>
                <p className="text-muted-foreground text-sm">
                  Dispatch finished goods &amp; scrap from machine locations to FG warehouse
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-card rounded-xl p-4 border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1">Total Dispatches</p>
                <p className="text-2xl font-bold text-violet-600">{transfers.length}</p>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1">In Transit</p>
                <p className="text-2xl font-bold text-amber-600">{sentCount}</p>
                <div className="flex items-center mt-1">
                  <Clock size={12} className="text-amber-500 mr-1" />
                  <span className="text-xs text-amber-500 font-medium">Awaiting acceptance</span>
                </div>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1">Received at FG WH</p>
                <p className="text-2xl font-bold text-emerald-600">{acceptedCount}</p>
                <div className="flex items-center mt-1">
                  <CheckCircle size={12} className="text-emerald-500 mr-1" />
                  <span className="text-xs text-emerald-500 font-medium">Successfully received</span>
                </div>
              </div>
            </div>

            {/* Dispatch button */}
            <div className="flex justify-end">
              <Button
                type="primary"
                icon={<Send size={14} />}
                onClick={openSendModal}
                className="rounded-lg"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  border: 'none',
                  fontWeight: 600,
                }}
              >
                Dispatch to FG Warehouse
              </Button>
            </div>

            {/* Transfers List */}
            <div className="space-y-3">
              {loading && (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="inline-block w-8 h-8 border-[3px] rounded-full animate-spin mb-3" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} />
                  <p className="text-sm">Loading dispatches…</p>
                </div>
              )}

              {!loading && transfers.length === 0 && (
                <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
                  <Truck className="mx-auto mb-3 opacity-40" size={36} />
                  <p className="text-lg font-medium">No outbound dispatches yet</p>
                  <p className="text-sm">Dispatch FG batches from machine locations to FG warehouse.</p>
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
                      <div className="p-2 rounded-lg bg-violet-500/10">
                        <ArrowUpFromLine size={16} className="text-violet-600" />
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
                                        : line.lineType === 'SCRAP' ? 'bg-red-500/10 text-red-600 border-red-500/20'
                                        : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
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

      {/* Send Modal */}
      <Modal
        open={sendModal.visible}
        title={
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
              <ArrowUpFromLine className="text-white" size={14} />
            </div>
            <span className="text-lg font-semibold">Dispatch to FG Warehouse</span>
          </div>
        }
        onCancel={() => setSendModal(p => ({ ...p, visible: false }))}
        width={720}
        footer={null}
      >
        <div className="space-y-5 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border hover:border-violet-300 transition-all">
              <div className="flex items-center gap-2 text-sm text-violet-700 mb-2 font-semibold">
                <div className="p-1.5 bg-violet-100 rounded-md"><Cpu className="w-4 h-4 text-violet-600" /></div>
                From (Machine Location)
              </div>
              <Select
                style={{ width: '100%' }}
                placeholder="Select machine location"
                value={sendModal.fromLocationId || undefined}
                onChange={val => setSendModal(p => ({ ...p, fromLocationId: val }))}
                showSearch
                filterOption={(input, option) => (option?.children?.toString() || '').toLowerCase().includes(input.toLowerCase())}
              >
                {machineLocations.map(l => (
                  <Option key={l.id} value={l.id}>{l.name} ({l.code})</Option>
                ))}
              </Select>
            </div>
            <div className="p-4 rounded-xl border hover:border-emerald-300 transition-all">
              <div className="flex items-center gap-2 text-sm text-emerald-700 mb-2 font-semibold">
                <div className="p-1.5 bg-emerald-100 rounded-md"><Package className="w-4 h-4 text-emerald-600" /></div>
                To (FG Warehouse)
              </div>
              <Select
                style={{ width: '100%' }}
                placeholder="Select FG warehouse"
                value={sendModal.toLocationId || undefined}
                onChange={val => setSendModal(p => ({ ...p, toLocationId: val }))}
                showSearch
                filterOption={(input, option) => (option?.children?.toString() || '').toLowerCase().includes(input.toLowerCase())}
              >
                {fgWarehouses.map(l => (
                  <Option key={l.id} value={l.id}>{l.name} ({l.code})</Option>
                ))}
              </Select>
            </div>
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-foreground">Dispatch Items</div>
              <Button size="small" onClick={addLine}>+ Add Item</Button>
            </div>
            <div className="space-y-3">
              {sendModal.lines.map((line, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center p-3 bg-muted/20 rounded-lg border border-border">
                  <div className="col-span-2">
                    <Select value={line.lineType} onChange={val => updateLine(idx, 'lineType', val)} style={{ width: '100%' }} size="small">
                      <Option value="FG">FG</Option>
                      <Option value="SCRAP">Scrap</Option>
                    </Select>
                  </div>
                  <div className="col-span-3">
                    <Input size="small" placeholder="Product name" value={line.productName} onChange={e => updateLine(idx, 'productName', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <Input size="small" type="number" placeholder="Qty" value={line.quantity || ''} onChange={e => updateLine(idx, 'quantity', Number(e.target.value))} />
                  </div>
                  <div className="col-span-2">
                    <Select value={line.unitOfMeasurement} onChange={val => updateLine(idx, 'unitOfMeasurement', val)} style={{ width: '100%' }} size="small">
                      <Option value="KG">KG</Option>
                      <Option value="PCS">PCS</Option>
                      <Option value="Ton">Ton</Option>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Input size="small" placeholder="Batch #" value={line.batchNumber} onChange={e => updateLine(idx, 'batchNumber', e.target.value)} />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {sendModal.lines.length > 1 && (
                      <button onClick={() => removeLine(idx)} className="text-red-400 hover:text-red-600"><XCircle size={16} /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-1 font-medium">Notes (optional)</div>
            <Input value={sendModal.notes} onChange={e => setSendModal(p => ({ ...p, notes: e.target.value }))} placeholder="Transfer remarks" />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/80">
            <Button size="large" className="rounded-lg" onClick={() => setSendModal(p => ({ ...p, visible: false }))}>Cancel</Button>
            <Button
              size="large"
              type="primary"
              loading={sendModal.loading}
              onClick={handleSend}
              className="rounded-lg shadow-md font-semibold px-6"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', border: 'none' }}
            >
              <Send className="w-4 h-4 mr-2 inline" /> Dispatch
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

export default OutboundToFGPage;
