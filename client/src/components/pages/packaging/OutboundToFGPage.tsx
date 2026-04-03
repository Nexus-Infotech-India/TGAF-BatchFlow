import React, { useEffect, useState } from 'react';
import api, { API_ROUTES } from '../../../utils/api';
import { Button, Modal, Select, Input, message } from 'antd';
import { motion } from 'framer-motion';
import {
  ArrowUpFromLine,
  CheckCircle,
  Clock,
  Send,
  Package,
  MapPin,
  Truck,
  ChevronLeft,
  ChevronRight,
  XCircle,
} from 'lucide-react';

const { Option } = Select;
const PAGE_SIZE = 10;

/* ─── Types ─── */
interface Location {
  id: string;
  code: string;
  name: string;
  type: string;
}

interface Verification {
  id: string;
  verificationNumber: string;
  entryNumber: string;
  fgProductName: string;
  totalPackets: number;
  totalCartons?: number;
  packetSize?: number;
  packetUnit?: string;
  toLocationName?: string;
  status: string;
  notes?: string;
  rejectionReason?: string;
  dispatchedAt: string;
  verifiedAt?: string;
}

/* ─── Component ─── */
const OutboundToFGPage: React.FC = () => {
  const [dispatches, setDispatches] = useState<Verification[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [productionEntries, setProductionEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const [sendModal, setSendModal] = useState<{
    visible: boolean;
    productionEntryId: string;
    toLocationId: string;
    notes: string;
    loading: boolean;
  }>({
    visible: false,
    productionEntryId: '',
    toLocationId: '',
    notes: '',
    loading: false,
  });

  const fetchDispatches = async () => {
    setLoading(true);
    try {
      const res = await api.get(API_ROUTES.RAW.GET_FG_VERIFICATIONS);
      setDispatches(res.data?.data || []);
    } catch {
      message.error('Failed to fetch FG dispatches');
    }
    setLoading(false);
  };

  const fetchLocations = async () => {
    try {
      const res = await api.get(API_ROUTES.RAW.GET_LOCATIONS);
      setLocations(res.data || []);
    } catch { /* silently */ }
  };

  const fetchProductionEntries = async () => {
    try {
      const [entriesRes, verificationsRes] = await Promise.all([
        api.get(API_ROUTES.RAW.GET_FG_PRODUCTION_ENTRIES),
        api.get(API_ROUTES.RAW.GET_FG_VERIFICATIONS),
      ]);
      const allCompleted = (entriesRes.data?.data || []).filter((e: any) => e.status === 'COMPLETED');
      const dispatchedEntryIds = new Set(
        (verificationsRes.data?.data || []).map((v: any) => v.productionEntryId)
      );
      setProductionEntries(allCompleted.filter((e: any) => !dispatchedEntryIds.has(e.id)));
    } catch { /* silently */ }
  };

  useEffect(() => {
    fetchDispatches();
    fetchLocations();
    fetchProductionEntries();
  }, []);

  const openSendModal = () => {
    setSendModal({ visible: true, productionEntryId: '', toLocationId: '', notes: '', loading: false });
  };

  const handleSend = async () => {
    if (!sendModal.productionEntryId || !sendModal.toLocationId) {
      message.error('Select a Production Entry and a To Location');
      return;
    }
    setSendModal(p => ({ ...p, loading: true }));
    try {
      await api.post(API_ROUTES.RAW.DISPATCH_FG_VERIFICATION, {
        productionEntryId: sendModal.productionEntryId,
        toLocationId: sendModal.toLocationId,
        notes: sendModal.notes,
      });
      message.success('FG packets dispatched successfully');
      setSendModal(p => ({ ...p, visible: false, loading: false }));
      fetchDispatches();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to dispatch');
      setSendModal(p => ({ ...p, loading: false }));
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

  const pendingCount = dispatches.filter(d => d.status === 'PENDING').length;
  const acceptedCount = dispatches.filter(d => d.status === 'ACCEPTED').length;
  const totalPages = Math.max(1, Math.ceil(dispatches.length / PAGE_SIZE));
  const paged = dispatches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selectedEntry = productionEntries.find(e => e.id === sendModal.productionEntryId);

  return (
    <motion.div className="min-h-screen bg-background" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div className="bg-card rounded-2xl border border-border overflow-hidden" initial={{ y: -12 }} animate={{ y: 0 }}>
          {/* Header */}
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                <ArrowUpFromLine className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Outbound to FG Warehouse</h1>
                <p className="text-muted-foreground text-sm">Dispatch finished goods packets to warehouse locations</p>
              </div>
            </div>
            <Button type="primary" icon={<Send size={14} />} onClick={openSendModal} className="rounded-lg" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', border: 'none', fontWeight: 600 }}>
              Dispatch to FG Warehouse
            </Button>
          </div>

          <div className="p-5 space-y-5">
            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-card rounded-xl p-4 border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1">Total Dispatches</p>
                <p className="text-2xl font-bold text-violet-600">{dispatches.length}</p>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1">Pending Verification</p>
                <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
                <div className="flex items-center mt-1"><Clock size={12} className="text-amber-500 mr-1" /><span className="text-xs text-amber-500 font-medium">Awaiting verification</span></div>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1">Accepted</p>
                <p className="text-2xl font-bold text-emerald-600">{acceptedCount}</p>
                <div className="flex items-center mt-1"><CheckCircle size={12} className="text-emerald-500 mr-1" /><span className="text-xs text-emerald-500 font-medium">Successfully received</span></div>
              </div>
            </div>

            {/* Table */}
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="min-w-full table-fixed">
                <colgroup>
                  <col className="w-[22%]" />
                  <col className="w-[24%]" />
                  <col className="w-[14%]" />
                  <col className="w-[18%]" />
                  <col className="w-[22%]" />
                </colgroup>
                <thead>
                  <tr className="bg-muted/40">
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">FG Batch ID</th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Product</th>
                    <th className="px-5 py-3.5 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Cartons</th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Destination</th>
                    <th className="px-5 py-3.5 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading && (
                    <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                      <div className="inline-block w-6 h-6 border-[3px] rounded-full animate-spin mb-2" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} />
                      <p className="text-sm">Loading…</p>
                    </td></tr>
                  )}
                  {!loading && paged.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                      <Truck className="mx-auto mb-2 opacity-40" size={28} />
                      <p className="text-sm font-medium">No dispatches yet</p>
                    </td></tr>
                  )}
                  {!loading && paged.map((d, idx) => (
                    <tr key={d.id} className={`hover:bg-muted/20 transition-colors ${idx % 2 === 0 ? 'bg-card' : 'bg-muted/5'}`}>
                      <td className="px-5 py-3.5">
                        <div className="text-sm font-mono font-bold text-primary">{d.verificationNumber}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{new Date(d.dispatchedAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-sm font-semibold text-foreground truncate">{d.fgProductName}</div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-sm font-bold text-amber-600">{d.totalCartons ? d.totalCartons.toLocaleString() : '-'}</span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-foreground">
                        <span className="inline-flex items-center gap-1.5"><MapPin size={13} className="text-muted-foreground shrink-0" />{d.toLocationName}</span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusBadge(d.status)}`}>
                          {d.status === 'PENDING' && <Clock size={10} />}
                          {d.status === 'ACCEPTED' && <CheckCircle size={10} />}
                          {d.status === 'REJECTED' && <XCircle size={10} />}
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {dispatches.length > PAGE_SIZE && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, dispatches.length)} of {dispatches.length}
                </p>
                <div className="flex gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg border border-border hover:bg-muted/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                    <button key={n} onClick={() => setPage(n)} className={`w-8 h-8 rounded-lg text-xs font-semibold border transition-colors ${page === n ? 'bg-violet-600 text-white border-violet-600' : 'border-border hover:bg-muted/40 text-foreground'}`}>
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

      {/* Send Modal */}
      <Modal
        open={sendModal.visible}
        title={<div className="flex items-center gap-2"><div className="p-1.5 rounded-lg" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}><ArrowUpFromLine className="text-white" size={14} /></div><span className="text-lg font-semibold">Dispatch to FG Warehouse</span></div>}
        onCancel={() => setSendModal(p => ({ ...p, visible: false }))}
        width={620}
        footer={null}
      >
        <div className="space-y-5 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border hover:border-violet-300 transition-all">
              <div className="flex items-center gap-2 text-sm text-violet-700 mb-2 font-semibold">
                <div className="p-1.5 bg-violet-100 rounded-md"><Package className="w-4 h-4 text-violet-600" /></div>
                Completed FG Entry
              </div>
              <Select style={{ width: '100%' }} placeholder="Select completed production entry" value={sendModal.productionEntryId || undefined} onChange={val => setSendModal(p => ({ ...p, productionEntryId: val }))} showSearch filterOption={(input, option) => (option?.children?.toString() || '').toLowerCase().includes(input.toLowerCase())}>
                {productionEntries.map((e: any) => (<Option key={e.id} value={e.id}>{e.entryNumber} - {e.fgProductName}</Option>))}
              </Select>
            </div>
            <div className="p-4 rounded-xl border hover:border-emerald-300 transition-all">
              <div className="flex items-center gap-2 text-sm text-emerald-700 mb-2 font-semibold">
                <div className="p-1.5 bg-emerald-100 rounded-md"><MapPin className="w-4 h-4 text-emerald-600" /></div>
                To Location
              </div>
              <Select style={{ width: '100%' }} placeholder="Select location" value={sendModal.toLocationId || undefined} onChange={val => setSendModal(p => ({ ...p, toLocationId: val }))} showSearch filterOption={(input, option) => (option?.children?.toString() || '').toLowerCase().includes(input.toLowerCase())}>
                {locations.map(l => (<Option key={l.id} value={l.id}>{l.name} ({l.code})</Option>))}
              </Select>
            </div>
          </div>

          {selectedEntry && (
            <div className="bg-muted/20 rounded-xl border border-border p-4">
              <div className="text-sm font-semibold text-foreground mb-3">Dispatch Summary</div>
              <div className="flex justify-between items-center p-3 bg-card rounded-lg border border-border">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/10 text-violet-600">PACKETS</span>
                  <span className="text-sm font-medium">{selectedEntry.fgProductName}</span>
                </div>
                <span className="font-bold text-lg text-violet-600">
                  {(selectedEntry.totalActualPackets || 0).toLocaleString()}
                  <span className="text-xs font-normal text-muted-foreground ml-1">packets</span>
                </span>
              </div>
              {selectedEntry.packetSize && (
                <div className="text-xs text-muted-foreground mt-2">Packet size: {selectedEntry.packetSize} {selectedEntry.packetUnit}</div>
              )}
            </div>
          )}

          <div>
            <div className="text-xs text-muted-foreground mb-1 font-medium">Notes (optional)</div>
            <Input value={sendModal.notes} onChange={e => setSendModal(p => ({ ...p, notes: e.target.value }))} placeholder="Transfer remarks" />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/80">
            <Button size="large" className="rounded-lg" onClick={() => setSendModal(p => ({ ...p, visible: false }))}>Cancel</Button>
            <Button size="large" type="primary" loading={sendModal.loading} onClick={handleSend} className="rounded-lg shadow-md font-semibold px-6" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', border: 'none' }}>
              <Send className="w-4 h-4 mr-2 inline" /> Dispatch
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

export default OutboundToFGPage;
