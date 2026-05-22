import React, { useEffect, useState, useCallback } from 'react';
import api, { API_ROUTES } from '../../../utils/api';
import { Button, message, Select, InputNumber, Modal } from 'antd';
import { motion } from 'framer-motion';
import { Package, RefreshCw, Layers, MapPin, ArrowRight, History } from 'lucide-react';

interface LooseStockRow {
  locationId: string;
  locationName: string;
  rawMaterialId: string | null;
  skuCode: string | null;
  productName: string | null;
  unit: string;
  available: number;
}

interface RebagHistoryRow {
  id: string;
  locationName: string;
  productName: string | null;
  skuCode: string | null;
  consumedKg: number;
  unit: string;
  bagsFormed: number | null;
  bagSizeKg: number | null;
  transferNumber: string | null;
  rebagAt: string;
  notes: string | null;
}

interface LocationOption {
  id: string;
  name: string;
  code: string;
  type: string;
  enabled: boolean;
}

const LooseStockPage: React.FC = () => {
  const [rows, setRows] = useState<LooseStockRow[]>([]);
  const [history, setHistory] = useState<RebagHistoryRow[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [locationFilter, setLocationFilter] = useState<string | undefined>();
  const [rebagModal, setRebagModal] = useState<{ open: boolean; row: LooseStockRow | null; bags: number | null; bagSizeKg: number; submitting: boolean }>({
    open: false,
    row: null,
    bags: null,
    bagSizeKg: 25,
    submitting: false,
  });

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(API_ROUTES.RAW.GET_LOOSE_STOCK, {
        params: locationFilter ? { locationId: locationFilter } : undefined,
      });
      setRows(res.data?.data || []);
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to load loose stock');
    } finally {
      setLoading(false);
    }
  }, [locationFilter]);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await api.get(API_ROUTES.RAW.GET_REBAG_HISTORY, {
        params: locationFilter ? { locationId: locationFilter } : undefined,
      });
      setHistory(res.data?.data || []);
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to load re-bag history');
    } finally {
      setHistoryLoading(false);
    }
  }, [locationFilter]);

  const fetchLocations = async () => {
    try {
      const res = await api.get(API_ROUTES.RAW.GET_LOCATIONS);
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setLocations((data as LocationOption[]).filter((l) => l.enabled !== false));
    } catch {
      setLocations([]);
    }
  };

  useEffect(() => { fetchLocations(); }, []);
  useEffect(() => { fetchRows(); fetchHistory(); }, [fetchRows, fetchHistory]);

  const openRebag = (row: LooseStockRow) => {
    const maxBags = Math.floor(row.available / 25);
    setRebagModal({ open: true, row, bags: maxBags > 0 ? maxBags : null, bagSizeKg: 25, submitting: false });
  };

  const handleRebag = async () => {
    if (!rebagModal.row || !rebagModal.bags || rebagModal.bags <= 0) {
      message.error('Enter a positive number of bags');
      return;
    }
    setRebagModal((p) => ({ ...p, submitting: true }));
    try {
      const res = await api.post(API_ROUTES.RAW.REBAG_LOOSE_STOCK, {
        locationId: rebagModal.row.locationId,
        rawMaterialId: rebagModal.row.rawMaterialId,
        skuCode: rebagModal.row.skuCode,
        productName: rebagModal.row.productName,
        bagsToForm: rebagModal.bags,
        bagSizeKg: rebagModal.bagSizeKg,
      });
      const consumed = res.data?.data?.consumedKg || 0;
      const newAvail = res.data?.data?.newAvailable ?? 0;
      message.success(`Re-bagged ${rebagModal.bags} × ${rebagModal.bagSizeKg} KG = ${consumed} KG. Remaining loose: ${newAvail} KG`);
      setRebagModal({ open: false, row: null, bags: null, bagSizeKg: 25, submitting: false });
      fetchRows();
      fetchHistory();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Re-bag failed');
      setRebagModal((p) => ({ ...p, submitting: false }));
    }
  };

  const maxBagsForRow = rebagModal.row ? Math.floor(rebagModal.row.available / (rebagModal.bagSizeKg || 25)) : 0;

  return (
    <motion.div
      className="min-h-screen"
      style={{ background: 'var(--background)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Header */}
        <div className="bg-brand-header rounded-2xl px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div
              className="flex items-center justify-center w-11 h-11 rounded-xl shadow-md"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              <Layers size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Loose SFG Stock</h1>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Reusable loose powder accumulated at each warehouse — re-bag when ≥ 1 full bag is available.
              </p>
            </div>
          </div>
          <Button
            icon={<RefreshCw size={14} />}
            onClick={() => { fetchRows(); fetchHistory(); }}
            loading={loading || historyLoading}
          >
            Refresh
          </Button>
        </div>

        {/* Filter */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MapPin size={14} className="text-muted-foreground" />
            <span className="text-muted-foreground">Location:</span>
          </div>
          <Select
            allowClear
            placeholder="All locations"
            value={locationFilter}
            onChange={(v) => setLocationFilter(v)}
            options={locations.map((l) => ({ value: l.id, label: `${l.code} — ${l.name}` }))}
            style={{ minWidth: 280 }}
            size="middle"
          />
        </div>

        {/* Table */}
        <div className="bg-card border border-border/30 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b border-border/30">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Location</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">SFG Material</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Loose Available</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Bags Possible</th>
                <th className="px-4 py-3 w-32"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {loading && (
                <tr><td colSpan={5} className="py-12 text-center text-muted-foreground">Loading…</td></tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    <Package className="mx-auto mb-3 opacity-30" size={32} />
                    <p className="text-sm font-semibold">No loose stock recorded yet</p>
                    <p className="text-xs mt-1">Loose remainders from outbound-from-grinding transfers will appear here once accepted.</p>
                  </td>
                </tr>
              )}
              {rows.map((row, idx) => {
                const fullBags = Math.floor(row.available / 25);
                return (
                  <tr key={`${row.locationId}-${row.rawMaterialId || row.skuCode || idx}`} className="hover:bg-muted/10">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{row.locationName}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{row.productName || '—'}</div>
                      <div className="text-xs text-muted-foreground font-mono">{row.skuCode || '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-extrabold text-emerald-600 text-base">{row.available}</span>{' '}
                      <span className="text-xs text-muted-foreground">{row.unit}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold ${fullBags > 0 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-muted/30 text-muted-foreground'}`}>
                        {fullBags}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        type="primary"
                        size="small"
                        disabled={fullBags <= 0}
                        onClick={() => openRebag(row)}
                        icon={<ArrowRight size={12} />}
                      >
                        Re-bag
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Re-bag History */}
        <div className="bg-card border border-border/30 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border/30 flex items-center gap-2">
            <History size={16} className="text-primary" />
            <span className="text-sm font-bold uppercase tracking-wider text-foreground">Re-bag History</span>
            <span className="text-xs text-muted-foreground">— past re-bags shown newest first</span>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b border-border/30">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Location</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Material</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">Bags Formed</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Qty Bagged</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Re-bag Transfer #</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {historyLoading && (
                <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">Loading…</td></tr>
              )}
              {!historyLoading && history.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-muted-foreground">
                    <History className="mx-auto mb-2 opacity-30" size={28} />
                    <p className="text-sm font-semibold">No re-bag events yet</p>
                    <p className="text-xs mt-1">When you re-bag loose stock above, the action will be recorded here.</p>
                  </td>
                </tr>
              )}
              {history.map((h) => (
                <tr key={h.id} className="hover:bg-muted/10">
                  <td className="px-4 py-3 text-xs text-foreground whitespace-nowrap">
                    {new Date(h.rebagAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground">{h.locationName}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-foreground">{h.productName || '—'}</div>
                    <div className="text-xs text-muted-foreground font-mono">{h.skuCode || '—'}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {h.bagsFormed != null ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
                        {h.bagsFormed} × {h.bagSizeKg ?? 25} KG
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-extrabold text-indigo-600">{h.consumedKg}</span>{' '}
                    <span className="text-xs text-muted-foreground">{h.unit}</span>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-primary">{h.transferNumber || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Re-bag Modal */}
      <Modal
        open={rebagModal.open}
        title={<div className="flex items-center gap-2"><Package size={16} className="text-amber-500" /><span>Re-bag Loose Stock</span></div>}
        footer={null}
        onCancel={() => setRebagModal({ open: false, row: null, bags: null, bagSizeKg: 25, submitting: false })}
        width={460}
      >
        {rebagModal.row && (
          <div className="space-y-4 mt-2">
            <div className="rounded-lg bg-muted/20 border border-border p-3 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Location:</span><span className="font-semibold">{rebagModal.row.locationName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Material:</span><span className="font-semibold">{rebagModal.row.productName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Loose Available:</span><span className="font-bold text-emerald-600">{rebagModal.row.available} {rebagModal.row.unit}</span></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">Bags to Form</label>
                <InputNumber
                  min={1}
                  max={maxBagsForRow}
                  value={rebagModal.bags}
                  onChange={(v) => setRebagModal((p) => ({ ...p, bags: v || 0 }))}
                  style={{ width: '100%' }}
                  size="large"
                />
                <div className="text-[11px] text-muted-foreground mt-1">Max: {maxBagsForRow}</div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">Bag Size (KG)</label>
                <InputNumber
                  min={1}
                  value={rebagModal.bagSizeKg}
                  onChange={(v) => setRebagModal((p) => ({ ...p, bagSizeKg: v || 25 }))}
                  style={{ width: '100%' }}
                  size="large"
                />
              </div>
            </div>

            {rebagModal.bags && rebagModal.bagSizeKg && (
              <div className="rounded-lg border-2 border-emerald-500/30 bg-emerald-50/40 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-emerald-700 font-semibold">Will consume:</span>
                  <span className="font-bold text-emerald-700">{rebagModal.bags * rebagModal.bagSizeKg} KG</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Remaining loose after re-bag:</span>
                  <span>{Math.round((rebagModal.row.available - rebagModal.bags * rebagModal.bagSizeKg) * 1000) / 1000} {rebagModal.row.unit}</span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button onClick={() => setRebagModal({ open: false, row: null, bags: null, bagSizeKg: 25, submitting: false })} disabled={rebagModal.submitting}>Cancel</Button>
              <Button type="primary" onClick={handleRebag} loading={rebagModal.submitting} disabled={!rebagModal.bags || rebagModal.bags <= 0}>
                Confirm Re-bag
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

export default LooseStockPage;
