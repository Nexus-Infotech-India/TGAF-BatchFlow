import { useEffect, useMemo, useState } from 'react';
import { Input, message, Empty, Spin } from 'antd';
import { motion } from 'framer-motion';
import { Recycle, Search, MapPin, Factory, AlertTriangle } from 'lucide-react';
import api, { API_ROUTES } from '../../../utils/api';

const PAGE_SIZE = 10;

const UNIT_TO_GRAMS: Record<string, number> = {
  gram: 1, grams: 1, g: 1, kg: 1000, ton: 1_000_000, tonne: 1_000_000, quintal: 100_000,
};
const toKg = (qty: number, unit: string) => {
  const f = UNIT_TO_GRAMS[(unit || 'kg').toLowerCase()] ?? 1000;
  return (Number(qty) || 0) * f / 1000;
};
const round = (v: number) => Math.round(v * 1000) / 1000;

export default function SFGProductionLeftoutsPage() {
  const [postings, setPostings] = useState<any[]>([]);
  const [locationMap, setLocationMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [postRes, locRes] = await Promise.all([
          api.get(API_ROUTES.RAW.GET_PRODUCTION_POSTINGS),
          api.get(API_ROUTES.RAW.GET_LOCATIONS),
        ]);
        setPostings(postRes.data?.data || []);
        const locData = locRes.data;
        const allLoc = Array.isArray(locData) ? locData : locData?.data || [];
        const map: Record<string, string> = {};
        for (const l of allLoc) map[l.id] = l.name;
        setLocationMap(map);
      } catch {
        message.error('Failed to load production postings');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Per-posting byproduct/scrap (summed to KG), keeping only postings that have any.
  const batches = useMemo(() => {
    return postings
      .map((p) => {
        const outputs = p.outputs || [];
        const byproductKg = outputs
          .filter((o: any) => o.outputType === 'BYPRODUCT')
          .reduce((s: number, o: any) => s + toKg(o.quantity, o.unit), 0);
        const scrapKg = outputs
          .filter((o: any) => o.outputType === 'SCRAP')
          .reduce((s: number, o: any) => s + toKg(o.quantity, o.unit), 0);
        return {
          id: p.id,
          postingNumber: p.postingNumber,
          shiftDate: p.shiftDate,
          locationName: locationMap[p.locationId] || '-',
          byproductKg: round(byproductKg),
          scrapKg: round(scrapKg),
        };
      })
      .filter((b) => b.byproductKg > 0 || b.scrapKg > 0);
  }, [postings, locationMap]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return batches;
    return batches.filter((b) =>
      [b.postingNumber, b.locationName].filter(Boolean).join(' ').toLowerCase().includes(q)
    );
  }, [batches, search]);

  const totals = useMemo(() => ({
    byproduct: round(filtered.reduce((s, b) => s + b.byproductKg, 0)),
    scrap: round(filtered.reduce((s, b) => s + b.scrapKg, 0)),
  }), [filtered]);

  const paginated = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <Recycle className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">SFG Production Leftouts</h1>
            <p className="text-muted-foreground text-sm">Byproduct &amp; scrap from SFG production — totals and batch-wise with location</p>
          </div>
        </div>
        <Input
          allowClear
          prefix={<Search size={14} className="text-muted-foreground" />}
          placeholder="Search batch or location…"
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

      {!loading && batches.length === 0 && (
        <div className="bg-card rounded-2xl border border-border py-16">
          <Empty description="No byproduct or scrap recorded in SFG production" />
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <>
          {/* Grand totals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div className="rounded-2xl border border-amber-500/20 bg-amber-50/30 p-5">
              <div className="text-[11px] uppercase font-bold text-amber-700 tracking-wider mb-1">Total Byproduct (all batches)</div>
              <div className="text-3xl font-black text-amber-600">{totals.byproduct} <span className="text-lg font-semibold">KG</span></div>
            </div>
            <div className="rounded-2xl border border-red-500/20 bg-red-50/30 p-5">
              <div className="text-[11px] uppercase font-bold text-red-700 tracking-wider mb-1">Total Scrap (all batches)</div>
              <div className="text-3xl font-black text-red-600">{totals.scrap} <span className="text-lg font-semibold">KG</span></div>
            </div>
          </div>

          {/* Batch-wise breakdown */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/20">
              <span className="text-sm font-bold text-foreground uppercase tracking-wider">Batch-wise Byproduct &amp; Scrap</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Batch</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Location</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-amber-700">Byproduct</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-red-700">Scrap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginated.map((b) => (
                    <tr key={b.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="font-mono font-semibold text-primary text-sm">{b.postingNumber}</div>
                        <div className="text-[11px] text-muted-foreground">{b.shiftDate ? new Date(b.shiftDate).toLocaleDateString() : ''}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                          <MapPin size={11} /> {b.locationName}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-amber-600">{b.byproductKg}</span> <span className="text-muted-foreground text-xs">KG</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-red-600">{b.scrapKg}</span> <span className="text-muted-foreground text-xs">KG</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-border">
                <span className="text-xs text-muted-foreground">Page {page} of {totalPages} · {filtered.length} batches</span>
                <div className="flex gap-2">
                  <button className="px-3 py-1 text-xs rounded-md border border-border disabled:opacity-40" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</button>
                  <button className="px-3 py-1 text-xs rounded-md border border-border disabled:opacity-40" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {!loading && batches.length > 0 && filtered.length === 0 && (
        <div className="bg-card rounded-2xl border border-border py-12 mt-3 flex flex-col items-center text-muted-foreground">
          <AlertTriangle size={28} className="mb-2 opacity-50" />
          <p className="text-sm">No batches match “{search}”.</p>
        </div>
      )}
    </motion.div>
  );
}
