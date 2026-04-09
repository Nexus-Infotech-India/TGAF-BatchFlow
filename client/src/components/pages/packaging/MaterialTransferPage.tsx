import React, { useEffect, useState } from 'react';
import api, { API_ROUTES } from '../../../utils/api';
import { Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { Plus, Package, Truck, Calendar, Loader2, ChevronDown, ChevronUp, Boxes, Layers, Tag } from 'lucide-react';
import { motion } from 'framer-motion';

/* ═══════════════════════ Types ═══════════════════════ */

interface TransferLine {
  id: string;
  productName: string;
  skuCode: string;
  quantity: number;
  unitOfMeasurement: string;
  numberOfBags?: number;
  batchNumber?: string;
  lineType?: string;
}

interface Transfer {
  id: string;
  transferNumber: string;
  fromLocation: { id: string; name: string };
  toLocation: { id: string; name: string };
  status: string;
  createdAt: string;
  lines: TransferLine[];
}

/* ═══════════════════════ Component ═══════════════════════ */

const MaterialTransferPage: React.FC = () => {
  const navigate = useNavigate();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedTransferId, setExpandedTransferId] = useState<string | null>(null);

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const res = await api.get(API_ROUTES.RAW.GET_TRANSFERS, {
        params: { direction: 'SFG_TO_PRODUCTION' }
      });
      setTransfers(res.data?.data || []);
    } catch (e) {
      message.error('Failed to load transfers');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  /* ═══ Helpers ═══ */

  const statusBg: Record<string, string> = {
    SENT: 'bg-amber-50 text-amber-700 border-amber-200',
    ACCEPTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    REJECTED: 'bg-red-50 text-red-700 border-red-200',
  };

  const toggleExpand = (id: string) => {
    setExpandedTransferId(expandedTransferId === id ? null : id);
  };

  const lineTypeBadge = (lineType: string) => {
    if (lineType === 'PACKAGING_MATERIAL') {
      return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-bold border border-blue-200"><Tag size={8} /> PKG</span>;
    }
    return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-violet-50 text-violet-600 rounded text-[9px] font-bold border border-violet-200"><Layers size={8} /> SFG</span>;
  };

  /* ═══════════════════════ RENDER ═══════════════════════ */

  return (
    <motion.div className="p-6 md:p-8 space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
            <Truck className="text-violet-600" />
            Material Transfer
          </h1>
          <p className="text-muted-foreground mt-1">Transfer SFG & Packaging Materials to Production Lines</p>
        </div>
        <Button
          type="primary"
          icon={<Plus size={16} />}
          size="large"
          className="rounded-lg shadow-md"
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', border: 'none' }}
          onClick={() => navigate('/packaging/material-transfer/create')}
        >
          New Transfer
        </Button>
      </div>

      {/* ═══ Transfer Table ═══ */}
      <div className="bg-white dark:bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <Loader2 className="animate-spin text-violet-500" size={32} />
          </div>
        ) : transfers.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <Package className="mx-auto mb-4 text-muted-foreground/40" size={48} />
            <p className="text-lg font-semibold">No transfers found</p>
            <p className="text-sm mt-1">Click "New Transfer" to move materials to a production line</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-muted/30 dark:to-muted/20 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Transfer #</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">From</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">To</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Items</th>
                <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Lines</th>
                <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Date</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transfers.map((t) => {
                const isExpanded = expandedTransferId === t.id;
                const sfgLines = t.lines.filter(l => !l.lineType || l.lineType === 'SFG');
                const pkgLines = t.lines.filter(l => l.lineType === 'PACKAGING_MATERIAL');
                const productNames = [...new Set(t.lines.map(l => l.productName).filter(Boolean))];

                return (
                  <React.Fragment key={t.id}>
                    <tr
                      className={`cursor-pointer transition-colors ${isExpanded ? 'bg-violet-50/40 dark:bg-violet-900/10' : 'hover:bg-muted/30'}`}
                      onClick={() => toggleExpand(t.id)}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-[13px] text-violet-700">{t.transferNumber}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-medium text-[13px]">{t.fromLocation?.name}</td>
                      <td className="px-4 py-3 font-medium text-[13px]">{t.toLocation?.name}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-[12px] truncate max-w-[180px]">{productNames.join(', ') || '—'}</span>
                          <div className="flex gap-1">
                            {sfgLines.length > 0 && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-violet-50 text-violet-600 border border-violet-200 rounded">SFG ×{sfgLines.length}</span>
                            )}
                            {pkgLines.length > 0 && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 rounded">PKG ×{pkgLines.length}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-bold text-xs border border-emerald-200">
                          {t.lines.length}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusBg[t.status] || 'bg-gray-50 text-gray-600'}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar size={11} />
                          {new Date(t.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isExpanded ? 'bg-violet-100 text-violet-600' : 'text-muted-foreground/50'}`}>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} className="p-0">
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-gradient-to-b from-muted/15 to-transparent px-6 py-4 border-b border-violet-100"
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <Boxes size={13} className="text-violet-600" />
                              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Line Items</span>
                            </div>
                            <div className="rounded-lg border border-border overflow-hidden bg-white dark:bg-card">
                              <table className="w-full text-left text-sm">
                                <thead className="bg-muted/20 border-b border-border">
                                  <tr>
                                    <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Type</th>
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
                                      <td className="px-4 py-2.5">{lineTypeBadge(line.lineType || 'SFG')}</td>
                                      <td className="px-4 py-2.5">
                                        {line.batchNumber ? (
                                          <span className="font-mono text-xs font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded">
                                            {line.batchNumber}
                                          </span>
                                        ) : '—'}
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
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
};

export default MaterialTransferPage;
