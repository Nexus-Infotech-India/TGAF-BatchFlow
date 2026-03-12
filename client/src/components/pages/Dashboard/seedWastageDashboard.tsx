import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Package, Hash, CalendarDays, FileText, Loader2 } from 'lucide-react';
import axios from 'axios';
import { API_ROUTES } from '../../../utils/api';

interface SeedWastageRecord {
    id: string;
    skuCode: string;
    rawMaterialSkuCode: string;
    quantity: number;
    unit: string;
    source: 'cleaning' | 'batch';
    grnNumber: string;
    lotNumber: string;
    cleaningJobId?: string;
    batchId: string | null;
    batchNumber: string;
    productName: string;
    rawMaterialName: string;
    supplier: string;
    dateOfGeneration: string;
    dateOfProduction: string | null;
}

const SeedWastageDashboard: React.FC = () => {
    const [records, setRecords] = useState<SeedWastageRecord[]>([]);
    const [totalWastage, setTotalWastage] = useState<number>(0);
    const [uniqueSkus, setUniqueSkus] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const authToken = localStorage.getItem('authToken');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    useEffect(() => {
        const fetchSeedWastage = async () => {
            try {
                setLoading(true);
                const response = await axios.get(API_ROUTES.BATCH.GET_SEED_WASTAGE, {
                    headers: { Authorization: `Bearer ${authToken}` },
                });
                setRecords(response.data.data || []);
                setTotalWastage(response.data.totalWastage || 0);
                setUniqueSkus(response.data.uniqueSkus || []);
            } catch (err) {
                console.error('Error fetching seed wastage:', err);
                setError('Failed to load seed wastage records');
            } finally {
                setLoading(false);
            }
        };

        if (authToken) {
            fetchSeedWastage();
        }
    }, [authToken]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, ease: 'linear', repeat: Infinity }}
                >
                    <Loader2 size={24} className="text-primary" />
                </motion.div>
                <span className="ml-3 text-sm text-muted-foreground">Loading seed wastage data...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg text-sm">
                {error}
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                    <Leaf className="text-amber-500" size={22} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-foreground">Seed Wastage</h2>
                    <p className="text-xs text-muted-foreground">
                        Track waste generated during processing
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-xl p-5"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Leaf size={16} className="text-amber-500" />
                        <span className="text-xs font-medium text-amber-600 uppercase tracking-wide">
                            Total Seed Wastage
                        </span>
                    </div>
                    <div className="text-3xl font-bold text-foreground">
                        {totalWastage.toFixed(2)}
                        <span className="text-sm font-normal text-muted-foreground ml-1">kg</span>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15 }}
                    className="bg-card border border-border rounded-xl p-5"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Hash size={16} className="text-primary" />
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Total Records
                        </span>
                    </div>
                    <div className="text-3xl font-bold text-foreground">
                        {records.length}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-card border border-border rounded-xl p-5"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Package size={16} className="text-primary" />
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            SKU{uniqueSkus.length > 1 ? 's' : ''}
                        </span>
                    </div>
                    <div className="text-sm font-bold text-foreground">
                        {uniqueSkus.length > 0 ? uniqueSkus.join(', ') : 'N/A'}
                    </div>
                </motion.div>
            </div>

            {/* Wastage Records Table */}
            {records.length > 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className="bg-card border border-border rounded-xl overflow-hidden"
                >
                    <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                        <FileText size={14} className="text-primary" />
                        <h3 className="text-sm font-semibold text-foreground">
                            Seed Wastage Records
                        </h3>
                    </div>

                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-muted/50 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        <div className="col-span-2 flex items-center gap-1">
                            <Package size={11} /> Seed Wastage SKU
                        </div>
                        <div className="col-span-3 flex items-center gap-1">
                            Raw Material
                        </div>
                        <div className="col-span-2 flex items-center gap-1">
                            Seed Wastage Qty
                        </div>
                        <div className="col-span-3 flex items-center gap-1">
                            Cleaning Job ID
                        </div>
                        <div className="col-span-2 flex items-center gap-1">
                            <CalendarDays size={11} /> Date
                        </div>
                    </div>

                    {/* Table Rows */}
                    {records.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((record, index) => (
                        <motion.div
                            key={record.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.03 * Math.min(index, 20) }}
                            className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border hover:bg-muted/30 transition-colors items-center text-sm"
                        >
                            <div className="col-span-2">
                                <span className="inline-flex items-center px-2 py-0.5 bg-amber-500/10 text-amber-700 text-xs font-medium rounded">
                                    {record.skuCode}
                                </span>
                            </div>
                            <div className="col-span-3 text-foreground text-xs font-medium">
                                {record.rawMaterialName || '-'}
                            </div>
                            <div className="col-span-2 font-semibold text-foreground">
                                {record.quantity.toFixed(2)}
                                <span className="text-xs font-normal text-muted-foreground ml-1">{record.unit}</span>
                            </div>
                            <div className="col-span-3 flex items-center gap-3">
                                <div className="flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-card text-primary shadow-sm">
                                    <Package size={16} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-foreground text-sm">
                                        {record.cleaningJobId ? `LOT-${record.cleaningJobId}` : record.lotNumber || '-'}
                                    </span>
                                    {record.source === 'cleaning' && (
                                        <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, #10b981 14%, transparent)', color: '#059669' }}>
                                            Cleaned
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="col-span-2 text-muted-foreground text-xs">
                                {new Date(record.dateOfGeneration).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                })}
                            </div>
                        </motion.div>
                    ))}

                    {/* Pagination Controls */}
                    {records.length > 0 && (
                        <div
                            className="px-5 py-3 flex items-center justify-between"
                            style={{ borderTop: '1px solid var(--border)', background: 'var(--muted)' }}
                        >
                            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                                Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, records.length)}–{Math.min(currentPage * ITEMS_PER_PAGE, records.length)} of {records.length}
                            </span>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 disabled:opacity-40"
                                    style={{ background: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
                                >
                                    ← Prev
                                </button>
                                {Array.from({ length: Math.ceil(records.length / ITEMS_PER_PAGE) }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className="w-8 h-8 rounded-lg text-xs font-bold transition-all active:scale-95"
                                        style={{
                                            background: page === currentPage ? 'var(--primary)' : 'var(--card)',
                                            color: page === currentPage ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                                            border: page === currentPage ? 'none' : '1px solid var(--border)',
                                        }}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setCurrentPage((p) => Math.min(Math.ceil(records.length / ITEMS_PER_PAGE), p + 1))}
                                    disabled={currentPage === Math.ceil(records.length / ITEMS_PER_PAGE)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 disabled:opacity-40"
                                    style={{ background: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            ) : (
                <div className="bg-muted/30 border border-border rounded-xl p-8 text-center">
                    <Leaf size={32} className="text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-sm text-muted-foreground">
                        No seed wastage records found. Seed wastage will appear here once recorded during cleaning or batch creation.
                    </p>
                </div>
            )}
        </motion.div>
    );
};

export default SeedWastageDashboard;
