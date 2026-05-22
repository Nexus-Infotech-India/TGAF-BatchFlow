import React, { useEffect, useState, useMemo } from 'react';
import api, { API_ROUTES } from '../../../utils/api';
import { Button, Modal, Input, Select, message } from 'antd';
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
  Recycle,
  AlertTriangle,
  Truck,
  Check,
} from 'lucide-react';

const { Option } = Select;

/* ─── Types ─── */
interface Location {
  id: string;
  code: string;
  name: string;
  type: string;
}

interface ProductionOutput {
  id: string;
  outputType: string; // SFG | BYPRODUCT | SCRAP
  productName: string;
  skuCode?: string;
  quantity: number;
  unit: string;
  batchNumber?: string;
}

interface CompletedPosting {
  id: string;
  postingNumber: string;
  sfgProductId: string;
  bomId: string;
  locationId: string;
  shiftDate: string;
  productionQty: number;
  productionUnit: string;
  status: string;
  createdAt: string;
  outputs: ProductionOutput[];
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
  looseQty?: number;
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

/* line types for outbound */
const LINE_TYPES = [
  { value: 'SFG', label: 'SFG', color: '#10b981', icon: <Package size={12} /> },
  { value: 'BYPRODUCT', label: 'Byproduct', color: '#f59e0b', icon: <Recycle size={12} /> },
  { value: 'SCRAP', label: 'Scrap', color: '#ef4444', icon: <AlertTriangle size={12} /> },
];

/* ─── Component ─── */
const OutboundTransfers: React.FC = () => {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [completedPostings, setCompletedPostings] = useState<CompletedPosting[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Send modal state
  const [sendModal, setSendModal] = useState<{
    visible: boolean;
    step: number;
    fromLocationId: string;
    toLocationId: string;
    selectedPostingId: string;
    lines: {
      lineType: string;
      productName: string;
      skuCode: string;
      quantity: number;
      unitOfMeasurement: string;
      batchNumber: string;
      numberOfBags?: number;
      bagSizeKg?: number;
      looseQty?: number;
      totalPackedQty?: number;
      totalPackedUnit?: string;
    }[];
    notes: string;
    loading: boolean;
  }>({
    visible: false,
    step: 0,
    fromLocationId: '',
    toLocationId: '',
    selectedPostingId: '',
    lines: [],
    notes: '',
    loading: false,
  });


  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const res = await api.get(API_ROUTES.RAW.GET_TRANSFERS, {
        params: { direction: 'OUTBOUND_FROM_GRINDING' },
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
    } catch {
      /* silently */
    }
  };

  const fetchCompletedPostings = async () => {
    try {
      const res = await api.get(API_ROUTES.RAW.GET_COMPLETED_FOR_OUTBOUND);
      setCompletedPostings(res.data?.data || []);
    } catch {
      message.error('Failed to fetch completed production postings');
    }
  };

  useEffect(() => {
    fetchTransfers();
    fetchLocations();
    fetchCompletedPostings();
  }, []);


  // Open send modal
  const openSendModal = () => {
    setSendModal({
      visible: true,
      step: 0,
      fromLocationId: '',
      toLocationId: '',
      selectedPostingId: '',
      lines: [],
      notes: '',
      loading: false,
    });
  };

  /* ─── Unit conversion helper: convert any qty+unit to KG ─── */
  const UNIT_TO_KG: Record<string, number> = {
    g: 0.001, gram: 0.001, grams: 0.001, G: 0.001,
    kg: 1, KG: 1, Kg: 1,
    ton: 1000, Ton: 1000, TON: 1000, tonne: 1000,
    quintal: 100, Quintal: 100,
    lb: 0.453592, oz: 0.0283495,
  };
  const toKg = (qty: number, unit: string) => qty * (UNIT_TO_KG[unit] ?? UNIT_TO_KG[unit.toLowerCase()] ?? 1);

  // When a completed posting is selected, auto-populate lines from its outputs
  // ONLY SFG items go to SFG warehouse — byproduct/scrap are excluded
  const handleSelectPosting = (postingId: string) => {
    const posting = completedPostings.find((p) => p.id === postingId);
    if (!posting) return;

    // Filter ONLY SFG outputs for dispatch to SFG warehouse
    const sfgOutputs = posting.outputs.filter((o) => o.outputType === 'SFG');

    const lines = sfgOutputs.map((o) => {
      const qtyInKg = toKg(o.quantity, o.unit);
      const BAG_SIZE_KG = 25;
      const numberOfBags = Math.floor(qtyInKg / BAG_SIZE_KG);
      const totalPackedQty = numberOfBags * BAG_SIZE_KG; // in KG
      const looseQty = Math.round(Math.max(0, qtyInKg - totalPackedQty) * 1000) / 1000; // KG loose remainder

      return {
        lineType: o.outputType,
        productName: o.productName,
        skuCode: o.skuCode || '',
        quantity: o.quantity,
        unitOfMeasurement: o.unit,
        batchNumber: posting.postingNumber,
        numberOfBags,
        bagSizeKg: BAG_SIZE_KG,
        looseQty,
        totalPackedQty,
        totalPackedUnit: 'KG',
      };
    });

    setSendModal((prev) => ({
      ...prev,
      selectedPostingId: postingId,
      lines,
    }));
  };

  const handleNextStep = () => {
    if (sendModal.step === 0) {
      if (!sendModal.selectedPostingId) {
        message.error('Please select a completed production posting');
        return;
      }
    }
    if (sendModal.step === 1) {
      if (!sendModal.fromLocationId || !sendModal.toLocationId) {
        message.error('Select both From and To locations');
        return;
      }
      if (sendModal.fromLocationId === sendModal.toLocationId) {
        message.error('From and To locations must be different');
        return;
      }
    }
    setSendModal((prev) => ({ ...prev, step: prev.step + 1 }));
  };

  const handlePrevStep = () => {
    setSendModal((prev) => ({ ...prev, step: Math.max(0, prev.step - 1) }));
  };

  // Submit outbound transfer — only SFG items with packing info
  const handleSendTransfer = async () => {
    const validLines = sendModal.lines.filter((l) => l.productName && l.quantity > 0);
    if (validLines.length === 0) {
      message.error('No valid SFG line items to dispatch');
      return;
    }
    // Allow lines with 0 bags as long as some loose qty is being transferred —
    // this still flows the material to the destination as reusable loose stock.
    const linesWithNothing = validLines.filter(
      (l) => (!l.numberOfBags || l.numberOfBags <= 0) && (!l.looseQty || l.looseQty <= 0)
    );
    if (linesWithNothing.length > 0) {
      message.error('Each SFG line must have either bagged qty or loose qty');
      return;
    }
    setSendModal((p) => ({ ...p, loading: true }));
    try {
      await api.post(API_ROUTES.RAW.CREATE_OUTBOUND_TRANSFER, {
        fromLocationId: sendModal.fromLocationId,
        toLocationId: sendModal.toLocationId,
        notes: sendModal.notes,
        lines: validLines.map((l) => ({
          lineType: l.lineType,
          productName: l.productName,
          skuCode: l.skuCode,
          quantity: l.quantity,
          unitOfMeasurement: l.unitOfMeasurement,
          batchNumber: l.batchNumber,
          numberOfBags: l.numberOfBags,
          bagSizeKg: l.bagSizeKg,
          looseQty: l.looseQty,
          totalPackedQty: l.totalPackedQty,
          totalPackedUnit: l.totalPackedUnit,
        })),
      });
      message.success('SFG dispatch with packing details sent successfully!');
      setSendModal((p) => ({ ...p, visible: false, loading: false }));
      fetchTransfers();
      fetchCompletedPostings();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to dispatch transfer');
      setSendModal((p) => ({ ...p, loading: false }));
    }
  };

  const grindingLocations = locations.filter((l) => l.type === 'GRINDING');
  const sfgWarehouses = locations.filter((l) => l.type === 'SFG_WAREHOUSE' || l.type === 'WAREHOUSE');

  const statusColor = (status: string) => {
    switch (status) {
      case 'SENT': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'ACCEPTED': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'REJECTED': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-muted/50 text-muted-foreground border-border';
    }
  };

  const lineTypeColor = (type: string) => {
    const lt = LINE_TYPES.find((l) => l.value === type);
    return lt ? `color-mix(in srgb, ${lt.color} 12%, transparent)` : 'var(--muted)';
  };

  const sentCount = transfers.filter((t) => t.status === 'SENT').length;
  const acceptedCount = transfers.filter((t) => t.status === 'ACCEPTED').length;

  const selectedPosting = completedPostings.find((p) => p.id === sendModal.selectedPostingId);

  // Helper for mixed-unit quantity summation
  // Sums the BAGGED quantity per line (totalPackedQty when set, else raw quantity).
  const calculateTotalQuantity = (lines: { quantity: number; unitOfMeasurement: string; lineType?: string; totalPackedQty?: number; totalPackedUnit?: string }[]) => {
    if (!lines || lines.length === 0) return { qty: 0, unit: '' };

    const UNIT_TO_GRAMS: Record<string, number> = {
      kg: 1000, KG: 1000, Kg: 1000, gram: 1, g: 1, G: 1,
      ton: 1_000_000, Ton: 1_000_000, TON: 1_000_000, tonne: 1_000_000,
      quintal: 100_000, Quintal: 100_000,
    };
    const toG = (q: number, u: string) => q * (UNIT_TO_GRAMS[u] ?? UNIT_TO_GRAMS[u.toLowerCase()] ?? 1);
    const fromG = (g: number, u: string) => g / (UNIT_TO_GRAMS[u] ?? UNIT_TO_GRAMS[u.toLowerCase()] ?? 1);

    const sfgLine = lines.find((l) => l.lineType === 'SFG');
    const targetUnit = sfgLine?.totalPackedUnit || sfgLine?.unitOfMeasurement || lines[0]?.totalPackedUnit || lines[0]?.unitOfMeasurement || 'KG';
    const totalGrams = lines.reduce((s, l) => {
      const qty = l.totalPackedQty != null ? l.totalPackedQty : l.quantity;
      const unit = l.totalPackedQty != null ? (l.totalPackedUnit || 'KG') : l.unitOfMeasurement;
      return s + toG(qty, unit);
    }, 0);

    return { qty: Number(fromG(totalGrams, targetUnit).toFixed(3)), unit: targetUnit };
  };

  const totalDispatchInfo = calculateTotalQuantity(sendModal.lines);

  // Calculate total bags for the dispatch summary
  const totalBags = useMemo(() => sendModal.lines.reduce((sum, l) => sum + (l.numberOfBags || 0), 0), [sendModal.lines]);
  const totalPackedKg = useMemo(() => sendModal.lines.reduce((sum, l) => sum + (l.totalPackedQty || 0), 0), [sendModal.lines]);

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-xs font-medium text-muted-foreground mb-1">Ready to Dispatch</p>
          <p className="text-2xl font-bold text-indigo-600">{completedPostings.length}</p>
          <div className="flex items-center mt-1">
            <Package size={12} className="text-indigo-500 mr-1" />
            <span className="text-xs text-indigo-500 font-medium">Completed postings</span>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-xs font-medium text-muted-foreground mb-1">Dispatched (Pending)</p>
          <p className="text-2xl font-bold text-amber-600">{sentCount}</p>
          <div className="flex items-center mt-1">
            <Clock size={12} className="text-amber-500 mr-1" />
            <span className="text-xs text-amber-500 font-medium">Awaiting warehouse acceptance</span>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-xs font-medium text-muted-foreground mb-1">Received at SFG Warehouse</p>
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
          icon={<ArrowUpFromLine size={14} />}
          onClick={openSendModal}
          className="rounded-lg"
          disabled={completedPostings.length === 0}
          style={{
            background: completedPostings.length === 0 ? undefined : 'linear-gradient(135deg, #f59e0b, #d97706)',
            border: 'none',
            fontWeight: 600,
          }}
        >
          Dispatch to SFG Warehouse
        </Button>
      </div>

      {/* Transfers list */}
      <div className="space-y-3">
        {loading && (
          <div className="text-center py-12 text-muted-foreground">
            <div className="inline-block w-8 h-8 border-[3px] rounded-full animate-spin mb-3" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} />
            <p className="text-sm">Loading outbound transfers…</p>
          </div>
        )}

        {!loading && transfers.length === 0 && (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
            <Truck className="mx-auto mb-3 opacity-40" size={36} />
            <p className="text-lg font-medium">No outbound transfers</p>
            <p className="text-sm">Dispatch finished SFG products from grinding to SFG warehouse.</p>
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
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedId(expandedId === transfer.id ? null : transfer.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <ArrowUpFromLine size={16} className="text-amber-600" />
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
                  {/* Show total qty */}
                  <span className="text-sm font-semibold text-foreground">
                    {calculateTotalQuantity(transfer.lines).qty} {calculateTotalQuantity(transfer.lines).unit}
                  </span>
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
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Line Items ({transfer.lines.length})
                      </div>
                      <table className="min-w-full">
                        <thead>
                          <tr className="bg-muted/40">
                            <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Type</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Product</th>
                            <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">Quantity</th>
                            <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">Bags Packed</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Production Batch</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {transfer.lines.map((line) => {
                            const lt = LINE_TYPES.find((l) => l.value === line.lineType);
                            return (
                              <tr key={line.id} className="hover:bg-muted/30 transition-colors">
                                <td className="px-3 py-2">
                                  <span
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                                    style={{
                                      background: lineTypeColor(line.lineType),
                                      color: lt?.color || 'var(--foreground)',
                                      borderColor: `color-mix(in srgb, ${lt?.color || '#888'} 30%, transparent)`,
                                    }}
                                  >
                                    {lt?.icon} {line.lineType}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-sm font-medium text-foreground">{line.productName || '-'}</td>
                                <td className="px-3 py-2 text-sm text-foreground text-right font-semibold">
                                  {line.totalPackedQty != null
                                    ? `${line.totalPackedQty} ${line.totalPackedUnit || 'KG'}`
                                    : `${line.quantity} ${line.unitOfMeasurement}`}
                                </td>
                                <td className="px-3 py-2 text-sm text-right">
                                  <div className="flex flex-col items-end gap-0.5">
                                    {line.numberOfBags ? (
                                      <span className="inline-flex items-center gap-1">
                                        <span className="font-bold text-amber-600">{line.numberOfBags}</span>
                                        <span className="text-muted-foreground">× {line.bagSizeKg || 25} KG</span>
                                        <span className="text-xs text-indigo-600 ml-1">({line.totalPackedQty} KG)</span>
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">-</span>
                                    )}
                                    {(line.looseQty || 0) > 0 && (
                                      <span className="text-[11px] text-emerald-700 font-semibold">
                                        + {line.looseQty} KG loose
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-sm text-primary font-mono">{line.batchNumber || '-'}</td>
                              </tr>
                            );
                          })}
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

      {/* ─── Dispatch Modal (Multi-step) ─── */}
      <Modal
        open={sendModal.visible}
        title={
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
              <ArrowUpFromLine className="text-white" size={14} />
            </div>
            <span className="text-lg font-semibold">Dispatch to SFG Warehouse</span>
          </div>
        }
        onCancel={() => setSendModal((p) => ({ ...p, visible: false }))}
        width={800}
        footer={null}
      >
        <div className="space-y-5 mt-4">
          {/* Step indicator */}
          <div className="flex items-center justify-center mb-6 bg-muted/20 p-4 rounded-xl border border-border/50">
            {['Select Batch', 'Locations', 'Review & Dispatch'].map((label, idx) => (
              <React.Fragment key={label}>
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-all duration-300 ${
                    sendModal.step >= idx
                      ? 'bg-gradient-to-br from-amber-400 to-orange-600 text-white scale-110 shadow-amber-200'
                      : 'bg-white border-2 border-muted text-muted-foreground'
                  }`}>
                    {sendModal.step > idx ? <Check size={16} /> : idx + 1}
                  </div>
                  <span className={`text-xs font-semibold tracking-wide uppercase ${sendModal.step >= idx ? 'text-amber-600' : 'text-muted-foreground'}`}>
                    {label}
                  </span>
                </div>
                {idx < 2 && (
                  <div className={`w-24 h-1 mx-4 rounded-full transition-all duration-300 ${
                    sendModal.step > idx ? 'bg-amber-500' : 'bg-muted'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step 0: Select Completed Posting */}
          {sendModal.step === 0 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="text-center mb-4">
                <div className="inline-flex p-3 bg-amber-100 rounded-2xl text-amber-600 mb-2">
                  <Package size={28} />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Select Completed Production Batch</h3>
                <p className="text-sm text-muted-foreground mt-1">Choose a completed production posting to dispatch</p>
              </div>

              {completedPostings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground bg-muted/10 rounded-xl border border-dashed border-border">
                  <Package className="mx-auto mb-3 opacity-40" size={40} />
                  <p className="font-medium">No completed production postings available</p>
                  <p className="text-sm mt-1">Complete a production posting first from SFG Processing.</p>
                </div>
              ) : (
                <div className="max-h-[350px] overflow-y-auto space-y-3 pr-1">
                  {completedPostings.map((posting) => {
                    const sfgOutput = posting.outputs.find((o) => o.outputType === 'SFG');
                    const isSelected = sendModal.selectedPostingId === posting.id;
                    return (
                      <div
                        key={posting.id}
                        onClick={() => handleSelectPosting(posting.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'border-amber-500 ring-1 ring-amber-500/20 bg-amber-500/[0.03] shadow-sm'
                            : 'border-border bg-card hover:border-amber-500/40 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 flex-shrink-0 rounded-full border flex items-center justify-center transition-colors ${
                              isSelected ? 'bg-amber-500 border-amber-500 text-white' : 'border-gray-300 bg-white'
                            }`}>
                              {isSelected && <Check size={12} strokeWidth={3} />}
                            </div>
                            <div>
                              <div className="text-sm font-bold font-mono text-primary">{posting.postingNumber}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {new Date(posting.shiftDate).toLocaleDateString()} • {posting.status}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            {posting.outputs.map((o) => (
                              <div key={o.id} className="flex items-center gap-2 justify-end">
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                  o.outputType === 'SFG' ? 'bg-emerald-500/10 text-emerald-600'
                                    : o.outputType === 'BYPRODUCT' ? 'bg-amber-500/10 text-amber-600'
                                    : 'bg-red-500/10 text-red-600'
                                }`}>{o.outputType}</span>
                                <span className="text-sm font-semibold">{o.quantity} {o.unit}</span>
                              </div>
                            ))}
                            {sfgOutput && (
                              <div className="text-xs text-muted-foreground mt-1">{sfgOutput.productName}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* Step 1: From/To Location */}
          {sendModal.step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-xl border bg-gradient-to-b from-white to-gray-50/50 shadow-sm hover:border-amber-300 hover:shadow-md transition-all">
                  <div className="flex items-center gap-2 text-sm text-amber-700 mb-3 font-semibold pb-2 border-b border-amber-100">
                    <div className="p-1.5 bg-amber-100 rounded-md"><MapPin className="w-4 h-4 text-amber-600" /></div>
                    From Location (Grinding)
                  </div>
                  <Select
                    style={{ width: '100%' }}
                    placeholder="Select grinding location"
                    size="large"
                    value={sendModal.fromLocationId || undefined}
                    onChange={(val) => setSendModal((p) => ({ ...p, fromLocationId: val }))}
                    showSearch
                    filterOption={(input, option) => (option?.children?.toString() || '').toLowerCase().includes(input.toLowerCase())}
                  >
                    {grindingLocations.map((l) => (
                      <Option key={l.id} value={l.id}>
                        <MapPin size={12} className="inline mr-1 text-amber-500" /> {l.name} ({l.code})
                      </Option>
                    ))}
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2 px-1">Where the SFG output currently resides.</p>
                </div>

                <div className="p-5 rounded-xl border bg-gradient-to-b from-white to-emerald-50/30 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all">
                  <div className="flex items-center gap-2 text-sm text-emerald-700 mb-3 font-semibold pb-2 border-b border-emerald-100">
                    <div className="p-1.5 bg-emerald-100 rounded-md"><ArrowUpFromLine className="w-4 h-4 text-emerald-600" /></div>
                    To Location (SFG Warehouse)
                  </div>
                  <Select
                    style={{ width: '100%' }}
                    placeholder="Select SFG warehouse"
                    size="large"
                    value={sendModal.toLocationId || undefined}
                    onChange={(val) => setSendModal((p) => ({ ...p, toLocationId: val }))}
                    showSearch
                    filterOption={(input, option) => (option?.children?.toString() || '').toLowerCase().includes(input.toLowerCase())}
                  >
                    {sfgWarehouses.map((l) => (
                      <Option key={l.id} value={l.id}>
                        <MapPin size={12} className="inline mr-1 text-emerald-500" /> {l.name} ({l.code})
                      </Option>
                    ))}
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2 px-1">The SFG warehouse destination.</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Review & Dispatch — SFG Packing */}
          {sendModal.step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              {/* Compact summary bar */}
              <div className="bg-muted/20 p-4 rounded-xl border border-border/50">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Production Batch</div>
                    <div className="text-sm font-mono font-bold text-primary">{selectedPosting?.postingNumber || '-'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">From → To</div>
                    <div className="text-sm font-semibold text-foreground">
                      {locations.find((l) => l.id === sendModal.fromLocationId)?.name || '-'} → {locations.find((l) => l.id === sendModal.toLocationId)?.name || '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Total SFG Quantity</div>
                    <div className="text-sm font-bold text-foreground">{totalDispatchInfo?.qty} {totalDispatchInfo?.unit}</div>
                  </div>
                </div>
              </div>

              {/* ─── Single clean table with packing info ─── */}
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-muted/40">
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">SFG Product</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quantity</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">In KG</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">25 KG Bags</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Packed</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Loose</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Batch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sendModal.lines.map((line, idx) => {
                      const qtyInKg = toKg(line.quantity, line.unitOfMeasurement);
                      const remainder = Math.round((qtyInKg - (line.totalPackedQty || 0)) * 1000) / 1000;
                      return (
                        <tr key={idx} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600">
                                <Package size={10} /> SFG
                              </span>
                              <span className="text-sm font-medium text-foreground">{line.productName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-foreground">
                            {line.quantity} {line.unitOfMeasurement}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-muted-foreground">
                            {line.unitOfMeasurement.toLowerCase() !== 'kg'
                              ? <span>{qtyInKg.toFixed(2)} KG</span>
                              : <span className="text-muted-foreground/50">—</span>
                            }
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center justify-center min-w-[48px] px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-700 text-sm font-bold">
                              {line.numberOfBags || 0}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-emerald-600">
                            {line.totalPackedQty || 0} KG
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            {remainder > 0
                              ? <span className="text-amber-600 font-medium">{remainder} KG</span>
                              : <span className="text-muted-foreground/50">—</span>
                            }
                          </td>
                          <td className="px-4 py-3 text-sm font-mono text-primary">{line.batchNumber}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Packing summary footer row */}
                <div className="bg-emerald-50 dark:bg-emerald-950/20 px-4 py-3 border-t border-emerald-200 dark:border-emerald-800/30 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                    <Package size={14} />
                    <span className="font-semibold">Packing Summary</span>
                    <span className="text-xs text-emerald-600 dark:text-emerald-500">(auto-calculated @ 25 KG/bag)</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span>
                      <span className="font-bold text-amber-700 dark:text-amber-400 text-base">{totalBags}</span>
                      <span className="text-muted-foreground ml-1">bags</span>
                    </span>
                    <span className="text-muted-foreground">·</span>
                    <span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 text-base">{totalPackedKg}</span>
                      <span className="text-muted-foreground ml-1">KG packed</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <div className="text-xs text-muted-foreground mb-1 font-medium">Notes (optional)</div>
                <Input
                  value={sendModal.notes}
                  onChange={(e) => setSendModal((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Transfer remarks"
                />
              </div>
            </motion.div>
          )}

          {/* Modal Footer */}
          <div className="flex justify-between items-center pt-4 mt-2 border-t border-border/80">
            <Button size="large" className="rounded-lg font-medium" disabled={sendModal.step === 0} onClick={handlePrevStep}>Back</Button>
            <div className="flex gap-3">
              <Button size="large" className="rounded-lg text-muted-foreground" onClick={() => setSendModal((p) => ({ ...p, visible: false }))}>Cancel</Button>
              {sendModal.step < 2 ? (
                <Button
                  size="large"
                  type="primary"
                  onClick={handleNextStep}
                  className="rounded-lg shadow-md font-semibold px-8"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none' }}
                >
                  Next Step
                </Button>
              ) : (
                <Button
                  size="large"
                  type="primary"
                  loading={sendModal.loading}
                  onClick={handleSendTransfer}
                  className="rounded-lg shadow-md font-semibold px-6"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}
                >
                  <Send className="w-4 h-4 mr-2 inline" /> Dispatch
                </Button>
              )}
            </div>
          </div>
        </div>
      </Modal>


    </div>
  );
};

export default OutboundTransfers;
