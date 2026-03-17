import React, { useEffect, useState, useMemo } from 'react';
import api, { API_ROUTES } from '../../../utils/api';

/* ────── Types ────── */
type RawMaterial = {
    id: string;
    skuCode: string;
    name: string;
    category: string;
    unitOfMeasurement: string;
};

type BOMItemType = {
    id?: string;
    rawMaterialId: string;
    quantity: number;
    unitOfMeasurement: string;
    notes: string;
    rawMaterial?: RawMaterial;
};

type BOMType = {
    id: string;
    bomCode: string;
    productName: string;
    productCode: string;
    unitOfMeasurement: string;
    outputQuantity: number;
    description: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    items: BOMItemType[];
};

/* ────── Inline Icons ────── */
const IconBOM = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="2" /><path d="M9 14h.01" /><path d="M13 14h2" /><path d="M9 17h.01" /><path d="M13 17h2" /></svg>
);
const IconPlus = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
);
const IconEdit = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
);
const IconTrash = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
);
const IconCheck = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
);
const IconX = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
);
const IconChevronLeft = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
);
const IconChevronRight = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
);
const IconEye = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
);
const IconSearch = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
);

const EMPTY_ITEM: BOMItemType = { rawMaterialId: '', quantity: 0, unitOfMeasurement: '', notes: '' };

const CATEGORY_LABELS: Record<string, string> = {
    RAW_MATERIAL: 'Raw Materials',
    SEMI_FINISHED_GOOD: 'Semi-Finished Goods',
    FINISHED_GOOD: 'Finished Goods',
    PACKAGING_MATERIAL: 'Packaging Materials',
    BYPRODUCT: 'Byproducts',
    WASTAGE: 'Wastage',
};

/* ────── Main Component ────── */
const CreateBOMPage: React.FC = () => {
    // ── State ──
    const [boms, setBOMs] = useState<BOMType[]>([]);
    const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [viewBOM, setViewBOM] = useState<BOMType | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // BOM form
    const [form, setForm] = useState({
        bomCode: '',
        productName: '',
        productCode: '',
        unitOfMeasurement: '',
        outputQuantity: 1,
        description: '',
        status: 'DRAFT',
    });

    // BOM Items (dynamic rows)
    const [items, setItems] = useState<BOMItemType[]>([{ ...EMPTY_ITEM }]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // ── Fetch ──
    const fetchData = async () => {
        setLoading(true);
        try {
            const [bomRes, rmRes] = await Promise.all([
                api.get(API_ROUTES.RAW.GET_BOMS),
                api.get(API_ROUTES.RAW.GET_PRODUCTS),
            ]);
            setBOMs(bomRes.data || []);
            setRawMaterials(rmRes.data || []);
        } catch {
            setBOMs([]);
        }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);
    useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);
    useEffect(() => { if (error) { const t = setTimeout(() => setError(''), 5000); return () => clearTimeout(t); } }, [error]);

    // ── Derived lists ──
    const finishedGoods = useMemo(() =>
        rawMaterials.filter(rm => rm.category === 'FINISHED_GOOD' || rm.category === 'SEMI_FINISHED_GOOD'),
        [rawMaterials]
    );

    const selectedProduct = useMemo(() =>
        finishedGoods.find(fg => fg.name === form.productName),
        [finishedGoods, form.productName]
    );

    const rawMaterialItems = useMemo(() => {
        let allowedCategories = ['RAW_MATERIAL'];

        if (selectedProduct) {
            if (selectedProduct.category === 'FINISHED_GOOD') {
                allowedCategories = ['RAW_MATERIAL', 'SEMI_FINISHED_GOOD', 'PACKAGING_MATERIAL', 'BYPRODUCT'];
            } else if (selectedProduct.category === 'SEMI_FINISHED_GOOD') {
                allowedCategories = ['RAW_MATERIAL', 'PACKAGING_MATERIAL', 'BYPRODUCT'];
            }
        } else {
            // Default when no product is selected yet
            allowedCategories = ['RAW_MATERIAL', 'SEMI_FINISHED_GOOD', 'PACKAGING_MATERIAL', 'BYPRODUCT'];
        }

        return rawMaterials.filter(rm => allowedCategories.includes(rm.category));
    }, [rawMaterials, selectedProduct]);

    // ── Filtered BOMs ──
    const filteredBOMs = useMemo(() => {
        if (!searchTerm.trim()) return boms;
        const q = searchTerm.toLowerCase();
        return boms.filter(b =>
            b.bomCode.toLowerCase().includes(q) ||
            b.productName.toLowerCase().includes(q) ||
            (b.productCode || '').toLowerCase().includes(q) ||
            b.status.toLowerCase().includes(q)
        );
    }, [boms, searchTerm]);

    const totalPages = Math.max(1, Math.ceil(filteredBOMs.length / pageSize));
    const paginated = filteredBOMs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // ── Form handlers ──
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        // Auto-fill product details when a finished good is selected
        if (name === 'productName') {
            const selected = finishedGoods.find(fg => fg.name === value);
            if (selected) {
                setForm(prev => ({
                    ...prev,
                    productName: selected.name,
                    productCode: selected.skuCode,
                    unitOfMeasurement: selected.unitOfMeasurement,
                }));
                return;
            }
        }

        setForm({ ...form, [name]: value });
    };

    const handleItemChange = (idx: number, field: string, value: any) => {
        const updated = [...items];
        (updated[idx] as any)[field] = value;

        // Auto-fill unit from raw material
        if (field === 'rawMaterialId') {
            const rm = rawMaterials.find(r => r.id === value);
            if (rm) updated[idx].unitOfMeasurement = rm.unitOfMeasurement;
        }

        setItems(updated);
    };

    const addItemRow = () => setItems([...items, { ...EMPTY_ITEM }]);
    const removeItemRow = (idx: number) => {
        if (items.length <= 1) return;
        setItems(items.filter((_, i) => i !== idx));
    };

    const resetForm = () => {
        setForm({ bomCode: '', productName: '', productCode: '', unitOfMeasurement: '', outputQuantity: 1, description: '', status: 'DRAFT' });
        setItems([{ ...EMPTY_ITEM }]);
        setEditingId(null);
    };

    // ── Create / Update ──
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        // Validate items
        const validItems = items.filter(i => i.rawMaterialId && i.quantity > 0);
        if (validItems.length === 0) {
            setError('At least one item with a raw material and quantity is required');
            return;
        }
        setSaving(true); setError(''); setSuccess('');
        try {
            await api.post(API_ROUTES.RAW.CREATE_BOM, {
                ...form,
                outputQuantity: Number(form.outputQuantity),
                items: validItems,
            });
            setSuccess('BOM created successfully!');
            resetForm();
            fetchData();
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Failed to create BOM');
        }
        setSaving(false);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingId) return;
        const validItems = items.filter(i => i.rawMaterialId && i.quantity > 0);
        if (validItems.length === 0) {
            setError('At least one item with a raw material and quantity is required');
            return;
        }
        setSaving(true); setError(''); setSuccess('');
        try {
            await api.put(API_ROUTES.RAW.UPDATE_BOM(editingId), {
                ...form,
                outputQuantity: Number(form.outputQuantity),
                items: validItems,
            });
            setSuccess('BOM updated successfully!');
            resetForm();
            fetchData();
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Failed to update BOM');
        }
        setSaving(false);
    };

    const startEdit = (bom: BOMType) => {
        setEditingId(bom.id);
        setForm({
            bomCode: bom.bomCode,
            productName: bom.productName,
            productCode: bom.productCode || '',
            unitOfMeasurement: bom.unitOfMeasurement,
            outputQuantity: bom.outputQuantity,
            description: bom.description || '',
            status: bom.status,
        });
        setItems(bom.items.map(i => ({
            rawMaterialId: i.rawMaterialId,
            quantity: i.quantity,
            unitOfMeasurement: i.unitOfMeasurement,
            notes: i.notes || '',
        })));
        setViewBOM(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this BOM?')) return;
        try {
            await api.delete(API_ROUTES.RAW.DELETE_BOM(id));
            setSuccess('BOM deleted successfully');
            fetchData();
        } catch {
            setError('Failed to delete BOM');
        }
    };

    // ── Status badge color ──
    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'ACTIVE': return { bg: 'color-mix(in srgb, #16a34a 14%, transparent)', color: '#16a34a' };
            case 'INACTIVE': return { bg: 'color-mix(in srgb, var(--destructive) 14%, transparent)', color: 'var(--destructive)' };
            default: return { bg: 'color-mix(in srgb, var(--secondary) 14%, transparent)', color: 'var(--secondary)' };
        }
    };

    /* ─────────────────── Focused input style ─────────────────── */
    const inputStyle: React.CSSProperties = {
        background: 'color-mix(in srgb, var(--card) 96%, var(--primary) 4%)',
        border: '1px solid var(--border)',
        color: 'var(--foreground)',
    };

    const focusHandlers = {
        onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
            e.currentTarget.style.borderColor = 'var(--primary)';
            e.currentTarget.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--primary) 12%, transparent)';
        },
        onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.boxShadow = 'none';
        },
    };

    /* ═══════════════════════════ RENDER ═══════════════════════════ */
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

                {/* ── Page Header ── */}
                <div className="bg-brand-header rounded-2xl px-6 py-5 flex items-center gap-4">
                    <div
                        className="flex items-center justify-center w-11 h-11 rounded-xl shadow-md"
                        style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                    >
                        <IconBOM />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
                            Bill of Materials
                        </h1>
                        <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                            Manage product BOMs &middot; <span className="font-medium" style={{ color: 'var(--primary)' }}>{boms.length}</span> BOM{boms.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                {/* ── Toast Alerts ── */}
                {success && (
                    <div
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium animate__animated animate__fadeInDown"
                        style={{ background: 'color-mix(in srgb, #16a34a 12%, var(--card))', border: '1px solid color-mix(in srgb, #16a34a 30%, var(--border))', color: '#16a34a' }}
                    >
                        <IconCheck /> {success}
                    </div>
                )}
                {error && (
                    <div
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium animate__animated animate__fadeInDown"
                        style={{ background: 'color-mix(in srgb, var(--destructive) 12%, var(--card))', border: '1px solid color-mix(in srgb, var(--destructive) 30%, var(--border))', color: 'var(--destructive)' }}
                    >
                        <IconX /> {error}
                    </div>
                )}

                {/* ── Create / Edit Form Card ── */}
                <div
                    className="rounded-2xl border p-6 shadow-sm transition-all duration-300"
                    style={{
                        background: 'var(--card)',
                        borderColor: editingId ? 'var(--secondary)' : 'var(--border)',
                        boxShadow: editingId ? '0 0 0 2px color-mix(in srgb, var(--secondary) 18%, transparent)' : undefined,
                    }}
                >
                    {/* Form Header */}
                    <div className="flex items-center gap-3 mb-5">
                        <div
                            className="flex items-center justify-center w-9 h-9 rounded-lg"
                            style={{
                                background: editingId
                                    ? 'color-mix(in srgb, var(--secondary) 14%, transparent)'
                                    : 'color-mix(in srgb, var(--primary) 12%, transparent)',
                                color: editingId ? 'var(--secondary)' : 'var(--primary)',
                            }}
                        >
                            {editingId ? <IconEdit /> : <IconPlus />}
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                                {editingId ? 'Edit Bill of Material' : 'Create New BOM'}
                            </h2>
                            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                                {editingId ? 'Modify the details below and save changes' : 'Define output product and required raw materials'}
                            </p>
                        </div>
                    </div>

                    <form onSubmit={editingId ? handleUpdate : handleCreate}>
                        {/* ── Product Info Section ── */}
                        <div className="mb-5">
                            <h3 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: 'var(--primary)' }}>
                                <span className="w-5 h-0.5 rounded-full" style={{ background: 'var(--primary)' }} />
                                Product Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-x-5 gap-y-4">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted-foreground)' }}>BOM Code *</label>
                                    <input name="bomCode" value={form.bomCode} onChange={handleChange} required placeholder="e.g. BOM-001"
                                        className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all duration-200" style={inputStyle} {...focusHandlers} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Product Name *</label>
                                    <select name="productName" value={form.productName} onChange={handleChange} required
                                        className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all duration-200 cursor-pointer"
                                        style={{ ...inputStyle, color: form.productName ? 'var(--foreground)' : 'var(--muted-foreground)' }} {...focusHandlers}>
                                        <option value="">-- Select Output Product --</option>
                                        <optgroup label="Finished Goods">
                                            {finishedGoods.filter(fg => fg.category === 'FINISHED_GOOD').map(fg => (
                                                <option key={fg.id} value={fg.name}>{fg.name} ({fg.skuCode})</option>
                                            ))}
                                        </optgroup>
                                        <optgroup label="Semi-Finished Goods">
                                            {finishedGoods.filter(fg => fg.category === 'SEMI_FINISHED_GOOD').map(fg => (
                                                <option key={fg.id} value={fg.name}>{fg.name} ({fg.skuCode})</option>
                                            ))}
                                        </optgroup>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Product Code</label>
                                    <input name="productCode" value={form.productCode} onChange={handleChange} placeholder="e.g. FG-001"
                                        className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all duration-200" style={inputStyle} {...focusHandlers} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Unit of Measurement *</label>
                                    <input name="unitOfMeasurement" value={form.unitOfMeasurement} onChange={handleChange} required placeholder="e.g. kg"
                                        className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all duration-200" style={inputStyle} {...focusHandlers} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Output Quantity</label>
                                    <input name="outputQuantity" type="number" min={0.01} step="0.01" value={form.outputQuantity} onChange={handleChange} placeholder="1"
                                        className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all duration-200" style={inputStyle} {...focusHandlers} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Status</label>
                                    <select name="status" value={form.status} onChange={handleChange}
                                        className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all duration-200 cursor-pointer" style={inputStyle} {...focusHandlers}>
                                        <option value="DRAFT">Draft</option>
                                        <option value="ACTIVE">Active</option>
                                        <option value="INACTIVE">Inactive</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Description</label>
                                    <textarea name="description" value={form.description} onChange={handleChange} placeholder="BOM description (optional)" rows={1}
                                        className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all duration-200 resize-none" style={inputStyle} {...focusHandlers as any} />
                                </div>
                            </div>
                        </div>

                        {/* ── BOM Items Section ── */}
                        <div className="mb-5">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--secondary)' }}>
                                    <span className="w-5 h-0.5 rounded-full" style={{ background: 'var(--secondary)' }} />
                                    Input Materials
                                </h3>
                                <button type="button" onClick={addItemRow}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 hover:shadow-sm active:scale-[0.97]"
                                    style={{ background: 'color-mix(in srgb, var(--secondary) 14%, transparent)', color: 'var(--secondary)', border: '1px solid color-mix(in srgb, var(--secondary) 25%, transparent)' }}
                                >
                                    <IconPlus /> Add Row
                                </button>
                            </div>

                            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                                <table className="w-full table-auto">
                                    <thead>
                                        <tr style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                                            {['#', 'Material *', 'Quantity *', 'Unit', 'Notes', ''].map(h => (
                                                <th key={h} className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, idx) => (
                                            <tr key={idx} style={{ borderBottom: idx < items.length - 1 ? '1px solid color-mix(in srgb, var(--border) 50%, transparent)' : undefined }}>
                                                <td className="px-4 py-2.5 text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>{idx + 1}</td>
                                                <td className="px-4 py-2.5">
                                                    <select
                                                        value={item.rawMaterialId}
                                                        onChange={(e) => handleItemChange(idx, 'rawMaterialId', e.target.value)}
                                                        className="w-full rounded-lg px-2.5 py-2 text-sm outline-none transition-all duration-200 cursor-pointer"
                                                        style={inputStyle} {...focusHandlers}
                                                    >
                                                        <option value="">-- Select Material --</option>
                                                        {['RAW_MATERIAL', 'SEMI_FINISHED_GOOD', 'PACKAGING_MATERIAL', 'BYPRODUCT'].map(cat => {
                                                            const itemsInCategory = rawMaterialItems.filter(rm => rm.category === cat);
                                                            if (itemsInCategory.length === 0) return null;
                                                            return (
                                                                <optgroup key={cat} label={CATEGORY_LABELS[cat] || cat}>
                                                                    {itemsInCategory.map(rm => (
                                                                        <option key={rm.id} value={rm.id}>{rm.name} ({rm.skuCode})</option>
                                                                    ))}
                                                                </optgroup>
                                                            );
                                                        })}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <input type="number" min={0} step="0.01" value={item.quantity || ''} onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                                                        className="w-full rounded-lg px-2.5 py-2 text-sm outline-none transition-all duration-200" style={inputStyle} placeholder="0" {...focusHandlers} />
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <input value={item.unitOfMeasurement} onChange={(e) => handleItemChange(idx, 'unitOfMeasurement', e.target.value)}
                                                        className="w-full rounded-lg px-2.5 py-2 text-sm outline-none transition-all duration-200" style={inputStyle} placeholder="kg" {...focusHandlers} />
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <input value={item.notes} onChange={(e) => handleItemChange(idx, 'notes', e.target.value)}
                                                        className="w-full rounded-lg px-2.5 py-2 text-sm outline-none transition-all duration-200" style={inputStyle} placeholder="Optional" {...focusHandlers} />
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    {items.length > 1 && (
                                                        <button type="button" onClick={() => removeItemRow(idx)}
                                                            className="p-1.5 rounded-lg transition-all duration-200 hover:shadow-sm active:scale-95"
                                                            style={{ background: 'color-mix(in srgb, var(--destructive) 10%, transparent)', color: 'var(--destructive)' }}
                                                        >
                                                            <IconTrash />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* ── Action Buttons ── */}
                        <div className="flex items-center gap-3 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                            <button disabled={saving} type="submit"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all duration-200 hover:shadow-lg active:scale-[0.97] disabled:opacity-50"
                                style={{
                                    background: editingId
                                        ? 'linear-gradient(135deg, var(--secondary), color-mix(in srgb, var(--secondary) 80%, var(--primary)))'
                                        : 'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 80%, var(--secondary)))',
                                    color: 'var(--primary-foreground)',
                                }}
                            >
                                {saving ? (
                                    <><span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                                ) : editingId ? (
                                    <><IconCheck /> Update BOM</>
                                ) : (
                                    <><IconPlus /> Create BOM</>
                                )}
                            </button>
                            <button type="button" onClick={resetForm}
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-sm active:scale-[0.97]"
                                style={{ background: 'var(--muted)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}
                            >
                                <IconX /> {editingId ? 'Cancel' : 'Reset'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* ── View BOM Detail Modal Overlay ── */}
                {viewBOM && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
                        onClick={() => setViewBOM(null)}>
                        <div className="w-full max-w-3xl mx-4 rounded-2xl border shadow-2xl max-h-[80vh] overflow-auto animate__animated animate__fadeInUp"
                            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
                            onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 10%, var(--card)), color-mix(in srgb, var(--secondary) 8%, var(--card)))' }}>
                                <div>
                                    <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>{viewBOM.productName}</h2>
                                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{viewBOM.bomCode} · {viewBOM.items.length} item{viewBOM.items.length !== 1 ? 's' : ''}</p>
                                </div>
                                <button onClick={() => setViewBOM(null)} className="p-2 rounded-lg transition-colors duration-200 hover:bg-primary/10"><IconX /></button>
                            </div>
                            <div className="px-6 py-5 space-y-4">
                                {/* Detail grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { label: 'Product Code', value: viewBOM.productCode || '-' },
                                        { label: 'Unit', value: viewBOM.unitOfMeasurement },
                                        { label: 'Output Qty', value: viewBOM.outputQuantity },
                                        { label: 'Status', value: viewBOM.status },
                                    ].map(d => (
                                        <div key={d.label}>
                                            <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--muted-foreground)' }}>{d.label}</p>
                                            <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{d.value}</p>
                                        </div>
                                    ))}
                                </div>
                                {viewBOM.description && (
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--muted-foreground)' }}>Description</p>
                                        <p className="text-sm" style={{ color: 'var(--foreground)' }}>{viewBOM.description}</p>
                                    </div>
                                )}

                                {/* Items Table */}
                                <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                                    <div className="px-4 py-2.5" style={{ background: 'var(--muted)' }}>
                                        <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Raw Materials</h4>
                                    </div>
                                    <table className="w-full table-auto">
                                        <thead>
                                            <tr style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                                                {['#', 'Raw Material', 'SKU Code', 'Quantity', 'Unit', 'Notes'].map(h => (
                                                    <th key={h} className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {viewBOM.items.map((item, idx) => (
                                                <tr key={item.id || idx} style={{ borderBottom: idx < viewBOM.items.length - 1 ? '1px solid color-mix(in srgb, var(--border) 50%, transparent)' : undefined }}>
                                                    <td className="px-4 py-2.5 text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>{idx + 1}</td>
                                                    <td className="px-4 py-2.5 text-sm font-medium" style={{ color: 'var(--foreground)' }}>{item.rawMaterial?.name || '-'}</td>
                                                    <td className="px-4 py-2.5">
                                                        <span className="inline-block px-2 py-0.5 text-xs font-mono font-semibold rounded-md"
                                                            style={{ background: 'color-mix(in srgb, var(--primary) 10%, transparent)', color: 'var(--primary)' }}>
                                                            {item.rawMaterial?.skuCode || '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2.5 text-sm font-medium" style={{ color: 'var(--foreground)' }}>{item.quantity}</td>
                                                    <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--muted-foreground)' }}>{item.unitOfMeasurement}</td>
                                                    <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--muted-foreground)' }}>{item.notes || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── BOM List Table ── */}
                <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                    {/* Table Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4"
                        style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 8%, var(--card)), color-mix(in srgb, var(--secondary) 6%, var(--card)))', borderBottom: '1px solid var(--border)' }}>
                        <div className="flex items-center gap-2.5">
                            <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>All BOMs</h2>
                            <span className="px-2 py-0.5 text-xs font-bold rounded-full" style={{ background: 'color-mix(in srgb, var(--primary) 14%, transparent)', color: 'var(--primary)' }}>{filteredBOMs.length}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Search */}
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }}><IconSearch /></span>
                                <input value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    placeholder="Search BOMs…"
                                    className="pl-8 pr-3 py-1.5 rounded-lg text-sm outline-none transition-all duration-200 w-48"
                                    style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                                    {...focusHandlers}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Rows</span>
                                <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                                    className="rounded-lg px-2.5 py-1.5 text-sm outline-none cursor-pointer transition-colors duration-200"
                                    style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)' }}>
                                    {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full table-auto">
                            <thead>
                                <tr style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                                    {['BOM Code', 'Product Name', 'Product Code', 'Unit', 'Output Qty', 'Items', 'Status', 'Actions'].map(h => (
                                        <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="px-5 py-12 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <span className="inline-block w-8 h-8 border-[3px] rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} />
                                                <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading BOMs…</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredBOMs.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-5 py-12 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <div style={{ color: 'var(--muted-foreground)', opacity: 0.5 }}><IconBOM /></div>
                                                <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No BOMs found</span>
                                                <span className="text-xs" style={{ color: 'var(--muted-foreground)', opacity: 0.7 }}>Use the form above to create your first BOM</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginated.map((bom, idx) => {
                                        const ss = getStatusStyle(bom.status);
                                        return (
                                            <tr key={bom.id} className="group transition-colors duration-150"
                                                style={{
                                                    borderBottom: idx < paginated.length - 1 ? '1px solid color-mix(in srgb, var(--border) 50%, transparent)' : undefined,
                                                    background: editingId === bom.id ? 'color-mix(in srgb, var(--secondary) 8%, var(--card))' : 'transparent',
                                                }}
                                                onMouseEnter={(e) => { if (editingId !== bom.id) e.currentTarget.style.background = 'var(--muted)'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = editingId === bom.id ? 'color-mix(in srgb, var(--secondary) 8%, var(--card))' : 'transparent'; }}
                                            >
                                                <td className="px-5 py-3.5">
                                                    <span className="inline-block px-2 py-0.5 text-xs font-mono font-semibold rounded-md"
                                                        style={{ background: 'color-mix(in srgb, var(--primary) 10%, transparent)', color: 'var(--primary)' }}>
                                                        {bom.bomCode}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-sm font-medium" style={{ color: 'var(--foreground)' }}>{bom.productName}</td>
                                                <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--muted-foreground)' }}>{bom.productCode || '-'}</td>
                                                <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--muted-foreground)' }}>{bom.unitOfMeasurement}</td>
                                                <td className="px-5 py-3.5 text-sm font-medium" style={{ color: 'var(--foreground)' }}>{bom.outputQuantity}</td>
                                                <td className="px-5 py-3.5 text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
                                                        style={{ background: 'color-mix(in srgb, var(--secondary) 14%, transparent)', color: 'var(--secondary)' }}>
                                                        {bom.items.length}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className="px-2.5 py-1 text-[11px] font-bold uppercase rounded-full" style={{ background: ss.bg, color: ss.color }}>
                                                        {bom.status}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <button onClick={() => setViewBOM(bom)} title="View Details"
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:shadow-sm active:scale-95"
                                                            style={{ background: 'color-mix(in srgb, var(--primary) 12%, transparent)', color: 'var(--primary)', border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)' }}>
                                                            <IconEye /> View
                                                        </button>
                                                        <button onClick={() => startEdit(bom)} title="Edit"
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:shadow-sm active:scale-95"
                                                            style={{ background: 'color-mix(in srgb, var(--secondary) 12%, transparent)', color: 'var(--secondary)', border: '1px solid color-mix(in srgb, var(--secondary) 20%, transparent)' }}>
                                                            <IconEdit /> Edit
                                                        </button>
                                                        <button onClick={() => handleDelete(bom.id)} title="Delete"
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:shadow-sm active:scale-95"
                                                            style={{ background: 'color-mix(in srgb, var(--destructive) 10%, transparent)', color: 'var(--destructive)', border: '1px solid color-mix(in srgb, var(--destructive) 18%, transparent)' }}>
                                                            <IconTrash /> Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between px-6 py-3" style={{ borderTop: '1px solid var(--border)', background: 'var(--muted)' }}>
                        <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                            Showing {filteredBOMs.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredBOMs.length)} of {filteredBOMs.length}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <button disabled={currentPage <= 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 disabled:opacity-30 active:scale-95"
                                style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)' }}>
                                <IconChevronLeft />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                .reduce<(number | 'dots')[]>((acc, p, idx, arr) => {
                                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('dots');
                                    acc.push(p);
                                    return acc;
                                }, [])
                                .map((item, idx) =>
                                    item === 'dots' ? (
                                        <span key={`d-${idx}`} className="px-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>…</span>
                                    ) : (
                                        <button key={item} onClick={() => setCurrentPage(item as number)}
                                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-semibold transition-all duration-200 active:scale-95"
                                            style={{
                                                background: currentPage === item ? 'var(--primary)' : 'var(--card)',
                                                color: currentPage === item ? 'var(--primary-foreground)' : 'var(--foreground)',
                                                border: currentPage === item ? '1px solid var(--primary)' : '1px solid var(--border)',
                                            }}>
                                            {item}
                                        </button>
                                    )
                                )}
                            <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 disabled:opacity-30 active:scale-95"
                                style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)' }}>
                                <IconChevronRight />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateBOMPage;
