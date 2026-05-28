import { useEffect, useMemo, useState } from 'react';
import { Input, message, Empty, Spin } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Recycle,
  Package,
  Factory,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Search,
  Layers,
  MapPin,
} from 'lucide-react';
import api, { API_ROUTES } from '../../../utils/api';

const PAGE_SIZE = 8;

/* Combine the same packaging material (same material + unit) into one line so the
   report shows a single total allocated / total wastage per material. */
const groupPackaging = (rows: any[]) => {
  const map = new Map<string, any>();
  (rows || []).forEach((w) => {
    const key = `${w.rawMaterialId || w.skuCode || w.productName}__${w.unitOfMeasurement || ''}`;
    let g = map.get(key);
    if (!g) {
      g = { key, productName: w.productName, skuCode: w.skuCode, unit: w.unitOfMeasurement, allocatedQty: 0, wastageQty: 0, hasWaste: false };
      map.set(key, g);
    }
    g.allocatedQty += Number(w.quantity) || 0;
    if (w.wastageQty != null) {
      g.wastageQty += Number(w.wastageQty);
      g.hasWaste = true;
    }
  });
  return Array.from(map.values()).map((g) => ({
    ...g,
    allocatedQty: Math.round(g.allocatedQty * 1000) / 1000,
    wastageQty: Math.round(g.wastageQty * 1000) / 1000,
    wastagePercentage: g.hasWaste && g.allocatedQty > 0 ? Number(((g.wastageQty / g.allocatedQty) * 100).toFixed(2)) : null,
  }));
};

const fmt = (v: any) => (v == null || v === '' ? '-' : v);

export default function FGProductionLeftoutsPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  // The production-floor Location's name (FG production always runs here). Shown
  // instead of the machine's free-text location field.
  const [floorLocationName, setFloorLocationName] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [entriesRes, locRes] = await Promise.all([
          api.get(API_ROUTES.RAW.GET_FG_PRODUCTION_ENTRIES),
          api.get(API_ROUTES.RAW.GET_LOCATIONS),
        ]);
        if (entriesRes.data?.success) {
          setEntries((entriesRes.data.data || []).filter((e: any) => e.status === 'COMPLETED'));
        }
        const locData = locRes.data;
        const allLoc = Array.isArray(locData) ? locData : locData?.data || [];
        const floor = allLoc.find((l: any) => (l?.name || '').toLowerCase().trim() === 'production floor');
        setFloorLocationName(floor?.name || '');
      } catch {
        message.error('Failed to load FG production entries');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => {
      const hay = [
        e.entryNumber,
        e.fgProductName,
        e.fgBatch?.batchNumber,
        ...(e.machineEntries || []).map((m: any) => m.machineName || m.machine?.name),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [entries, search]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  // Powder wastage stays per-product (different products = different powder), but
  // packaging materials are totalled by material across ALL products — a shared
  // material like Stricker (SKU-015) shows as one combined quantity, not split.
  const summary = useMemo(() => {
    const powderMap = new Map<string, number>();
    const pkgMap = new Map<string, any>();
    filtered.forEach((entry) => {
      const product = entry.fgProductName || '—';
      (entry.machineEntries || []).forEach((m: any) => {
        powderMap.set(product, (powderMap.get(product) || 0) + (Number(m.powderWastageKg) || 0));
        (m.packagingConsumptions || []).forEach((pc: any) => {
          if (pc.wastageQty == null) return;
          const key = `${pc.rawMaterialId || pc.skuCode || pc.productName}__${pc.unitOfMeasurement || ''}`;
          let p = pkgMap.get(key);
          if (!p) { p = { name: pc.productName, sku: pc.skuCode, unit: pc.unitOfMeasurement, qty: 0 }; pkgMap.set(key, p); }
          p.qty += Number(pc.wastageQty) || 0;
        });
      });
    });
    return {
      powder: Array.from(powderMap.entries()).map(([product, kg]) => ({ product, powderKg: Math.round(kg * 1000) / 1000 })),
      packaging: Array.from(pkgMap.values()).map((p) => ({ ...p, qty: Math.round(p.qty * 1000) / 1000 })),
    };
  }, [filtered]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <Recycle className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">FG Production Leftouts</h1>
            <p className="text-muted-foreground text-sm">Machine-wise wastage recorded during FG production output</p>
          </div>
        </div>
        <Input
          allowClear
          prefix={<Search size={14} className="text-muted-foreground" />}
          placeholder="Search entry, product, batch, machine…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="max-w-xs"
        />
      </div>

      {loading && (
        <div className="text-center py-16 text-muted-foreground">
          <Spin />
          <p className="text-sm mt-3">Loading…</p>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="bg-card rounded-2xl border border-border py-16">
          <Empty description="No completed FG production entries" />
        </div>
      )}

      {!loading && (summary.powder.length > 0 || summary.packaging.length > 0) && (
        <div className="mb-5 bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Layers size={15} className="text-primary" />
            <span className="text-sm font-bold text-foreground uppercase tracking-wider">Product-wise Leftout Summary</span>
            <span className="text-[11px] text-muted-foreground">total wastage across all entries{search.trim() ? ' (filtered)' : ''}</span>
          </div>

          {/* Powder wastage — per product */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {summary.powder.map((p) => (
              <div key={p.product} className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-50/30 px-3 py-2">
                <div>
                  <div className="font-semibold text-foreground text-sm">{p.product}</div>
                  <div className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">Powder Wastage</div>
                </div>
                <span className="text-base font-bold text-amber-600">{p.powderKg} KG</span>
              </div>
            ))}
          </div>

          {/* Packaging materials — combined total across all products */}
          <div className="rounded-lg border border-blue-100 overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50/60 border-b border-blue-100">
              <Package size={13} className="text-blue-700" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Packaging Materials Wastage — Total (all products)</span>
            </div>
            {summary.packaging.length === 0 ? (
              <div className="px-3 py-3 text-xs text-muted-foreground">No packaging wastage recorded.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-blue-50/40 border-b border-blue-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-700">Material</th>
                    <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-blue-700">Total Wastage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-100/70">
                  {summary.packaging.map((m: any, i: number) => (
                    <tr key={i} className="hover:bg-blue-50/30">
                      <td className="px-3 py-2">
                        <span className="font-semibold text-foreground">{fmt(m.name)}</span>{' '}
                        {m.sku && <span className="text-[10px] text-muted-foreground font-mono">({m.sku})</span>}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span className="font-bold text-amber-700">{m.qty}</span>{' '}
                        <span className="text-muted-foreground text-xs">{m.unit}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {!loading && paginated.map((entry) => {
          const isOpen = expandedId === entry.id;
          const machines = entry.machineEntries || [];
          return (
            <motion.div key={entry.id} className="bg-card rounded-xl border border-border overflow-hidden" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedId(isOpen ? null : entry.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Factory size={16} className="text-amber-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold font-mono text-primary">{fmt(entry.entryNumber)}</span>
                      <span className="text-xs text-muted-foreground">· {fmt(entry.fgProductName)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Batch {fmt(entry.fgBatch?.batchNumber)} · {machines.length} machine{machines.length !== 1 ? 's' : ''} · {new Date(entry.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                {isOpen ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronRight size={16} className="text-muted-foreground" />}
              </div>

              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                    <div className="border-t border-border p-4 bg-muted/10 space-y-4">
                      {machines.length === 0 && (
                        <div className="text-sm text-muted-foreground">No machine entries.</div>
                      )}
                      {machines.map((m: any) => {
                        const pkg = groupPackaging(m.packagingConsumptions);
                        return (
                          <div key={m.id} className="rounded-xl border border-border bg-card p-4">
                            {/* Machine header */}
                            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                              <div className="flex items-center gap-2">
                                <Factory size={14} className="text-primary" />
                                <span className="font-semibold text-foreground text-sm">{fmt(m.machineName || m.machine?.name)}</span>
                                {m.machine?.machineId && (
                                  <span className="text-[11px] text-muted-foreground font-mono">({m.machine.machineId})</span>
                                )}
                                {(floorLocationName || m.machine?.location) && (
                                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                                    <MapPin size={10} /> {floorLocationName || m.machine?.location}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                Achieved {fmt(m.todayAchieve)} cartons · FG {fmt(m.actualFgQty)} {m.actualFgUnit || ''}
                              </div>
                            </div>

                            {/* Wastage summary chips */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                              <div className="rounded-lg border border-amber-500/20 bg-amber-50/30 p-3">
                                <div className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">Powder Wastage</div>
                                <div className="text-lg font-bold text-amber-600">
                                  {m.powderWastageKg != null ? `${m.powderWastageKg} KG` : '-'}
                                </div>
                                {m.powderWastagePercentage != null && (
                                  <div className="text-[11px] text-amber-600/80">{m.powderWastagePercentage}%</div>
                                )}
                              </div>
                            </div>

                            {/* Packaging materials wastage */}
                            <div className="rounded-lg border border-blue-100 overflow-hidden">
                              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50/60 border-b border-blue-100">
                                <Package size={13} className="text-blue-700" />
                                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Packaging Materials Wastage</span>
                              </div>
                              {pkg.length === 0 ? (
                                <div className="px-3 py-3 text-xs text-muted-foreground">No packaging materials recorded.</div>
                              ) : (
                                <table className="w-full text-sm">
                                  <thead className="bg-blue-50/40 border-b border-blue-100">
                                    <tr>
                                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-blue-700">Material</th>
                                      <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-blue-700">Allocated</th>
                                      <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-blue-700">Wastage</th>
                                      <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-blue-700">Wastage %</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-blue-100/70">
                                    {pkg.map((w: any) => (
                                      <tr key={w.key} className="hover:bg-blue-50/30">
                                        <td className="px-3 py-2">
                                          <div className="font-semibold text-foreground">{fmt(w.productName)}</div>
                                          <div className="text-[10px] text-muted-foreground font-mono">{w.skuCode || ''}</div>
                                        </td>
                                        <td className="px-3 py-2 text-right text-xs">
                                          <span className="font-semibold text-foreground">{w.allocatedQty}</span>{' '}
                                          <span className="text-muted-foreground">{w.unit}</span>
                                        </td>
                                        <td className="px-3 py-2 text-right text-xs">
                                          <span className="font-semibold text-amber-700">{w.hasWaste ? w.wastageQty : '-'}</span>{' '}
                                          <span className="text-muted-foreground">{w.hasWaste ? w.unit : ''}</span>
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                          {w.wastagePercentage != null ? (
                                            <span className={`font-bold ${w.wastagePercentage > 5 ? 'text-red-600' : 'text-blue-700'}`}>{w.wastagePercentage}%</span>
                                          ) : (
                                            <span className="text-muted-foreground text-xs">—</span>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>

                            {/* Downtime (if any) */}
                            {Array.isArray(m.downtimeRecords) && m.downtimeRecords.length > 0 && (
                              <div className="mt-3 flex items-start gap-2 text-[11px] text-red-600">
                                <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                                <span>{m.downtimeRecords.length} downtime record{m.downtimeRecords.length !== 1 ? 's' : ''}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between p-4 mt-3 bg-card rounded-xl border border-border">
          <span className="text-xs text-muted-foreground">Page {page} of {totalPages} · {filtered.length} entries</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-xs rounded-md border border-border disabled:opacity-40" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</button>
            <button className="px-3 py-1 text-xs rounded-md border border-border disabled:opacity-40" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
