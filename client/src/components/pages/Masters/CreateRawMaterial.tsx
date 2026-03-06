import React, { useEffect, useState } from 'react';
import api, { API_ROUTES } from '../../../utils/api';

const MATERIAL_CATEGORIES = [
  { value: 'RAW_MATERIAL', label: 'Raw Material' },
  { value: 'SEMI_FINISHED_GOOD', label: 'Semi-Finished Good' },
  { value: 'FINISHED_GOOD', label: 'Finished Good' },
] as const;

type RawMaterial = {
  id: string;
  skuCode: string;
  name: string;
  category?: string;
  subcategory?: string;
  variety?: string;
  unitOfMeasurement?: string;
  minReorderLevel?: number;
};

/* ───── tiny inline icons (no extra dep) ───── */
const IconPackage = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 9.4 7.55 4.24" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.29 7 12 12 20.71 7" /><line x1="12" y1="22" x2="12" y2="12" /></svg>
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

const CreateRawMaterialPage: React.FC = () => {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({ skuCode: '', name: '', category: '', subcategory: '', variety: '', unitOfMeasurement: '', minReorderLevel: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes] = await Promise.all([api.get(API_ROUTES.RAW.GET_PRODUCTS)]);
      setMaterials(pRes.data || []);
    } catch {
      setMaterials([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // auto-dismiss alerts
  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); }
  }, [success]);
  useEffect(() => {
    if (error) { const t = setTimeout(() => setError(''), 5000); return () => clearTimeout(t); }
  }, [error]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      await api.post(API_ROUTES.RAW.CREATE_PRODUCT, { ...form, minReorderLevel: Number(form.minReorderLevel) });
      setSuccess('Material created successfully');
      resetForm();
      fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to create material');
    }
    setSaving(false);
  };

  const resetForm = () => {
    setForm({ skuCode: '', name: '', category: '', subcategory: '', variety: '', unitOfMeasurement: '', minReorderLevel: 0 });
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editingId, setEditingId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(materials.length / pageSize));
  const paginated = materials.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const startEdit = (m: RawMaterial) => {
    setEditingId(m.id);
    setForm({
      skuCode: m.skuCode,
      name: m.name,
      category: m.category || '',
      subcategory: m.subcategory || '',
      variety: m.variety || '',
      unitOfMeasurement: m.unitOfMeasurement || '',
      minReorderLevel: m.minReorderLevel || 0,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => { setEditingId(null); resetForm(); };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      await api.put(API_ROUTES.RAW.UPDATE_PRODUCT(editingId), { ...form, minReorderLevel: Number(form.minReorderLevel) });
      setSuccess('Material updated successfully');
      setEditingId(null);
      resetForm();
      fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to update raw material');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this raw material?')) return;
    try {
      await api.delete(API_ROUTES.RAW.DELETE_PRODUCT(id));
      fetchData();
    } catch {
      // ignore for now
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Page Header ── */}
        <div className="bg-brand-header rounded-2xl px-6 py-5 flex items-center gap-4">
          <div
            className="flex items-center justify-center w-11 h-11 rounded-xl shadow-md"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            <IconPackage />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
            Materials
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              Manage your material inventory &middot; <span className="font-medium" style={{ color: 'var(--primary)' }}>{materials.length}</span> material{materials.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* ── Toast Alerts ── */}
        {success && (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium animate__animated animate__fadeInDown"
            style={{
              background: 'color-mix(in srgb, #16a34a 12%, var(--card))',
              border: '1px solid color-mix(in srgb, #16a34a 30%, var(--border))',
              color: '#16a34a',
            }}
          >
            <IconCheck /> {success}
          </div>
        )}
        {error && (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium animate__animated animate__fadeInDown"
            style={{
              background: 'color-mix(in srgb, var(--destructive) 12%, var(--card))',
              border: '1px solid color-mix(in srgb, var(--destructive) 30%, var(--border))',
              color: 'var(--destructive)',
            }}
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
                {editingId ? 'Edit Material' : 'Add New Material'}
              </h2>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {editingId ? 'Modify the details below and save' : 'Fill in the details to add a new material'}
              </p>
            </div>
          </div>

          <form onSubmit={editingId ? handleUpdate : handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-4">
            {/* SKU Code */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
                SKU Code
              </label>
              <input
                name="skuCode"
                value={form.skuCode}
                onChange={handleChange}
                required
                placeholder="e.g. RM-001"
                className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all duration-200"
                style={{
                  background: 'color-mix(in srgb, var(--card) 96%, var(--primary) 4%)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--primary) 12%, transparent)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
                Name
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Material name"
                className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all duration-200"
                style={{
                  background: 'color-mix(in srgb, var(--card) 96%, var(--primary) 4%)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--primary) 12%, transparent)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
                Category
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all duration-200"
                style={{
                  background: 'color-mix(in srgb, var(--card) 96%, var(--primary) 4%)',
                  border: '1px solid var(--border)',
                  color: form.category ? 'var(--foreground)' : 'var(--muted-foreground)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--primary) 12%, transparent)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <option value="">Select category</option>
                {MATERIAL_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Subcategory */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
                Subcategory
              </label>
              <input
                name="subcategory"
                value={form.subcategory}
                onChange={handleChange}
                placeholder="e.g. Chemicals"
                className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all duration-200"
                style={{
                  background: 'color-mix(in srgb, var(--card) 96%, var(--primary) 4%)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--primary) 12%, transparent)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Variety */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
                Variety
              </label>
              <input
                name="variety"
                value={form.variety}
                onChange={handleChange}
                placeholder="e.g. Grade A"
                className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all duration-200"
                style={{
                  background: 'color-mix(in srgb, var(--card) 96%, var(--primary) 4%)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--primary) 12%, transparent)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Unit of Measurement */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
                Unit of Measurement
              </label>
              <input
                name="unitOfMeasurement"
                value={form.unitOfMeasurement}
                onChange={handleChange}
                placeholder="e.g. kg, litre"
                className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all duration-200"
                style={{
                  background: 'color-mix(in srgb, var(--card) 96%, var(--primary) 4%)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--primary) 12%, transparent)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Min Reorder Level */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
                Min Reorder Level
              </label>
              <input
                name="minReorderLevel"
                type="number"
                min={0}
                value={form.minReorderLevel}
                onChange={handleChange}
                placeholder="0"
                className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all duration-200"
                style={{
                  background: 'color-mix(in srgb, var(--card) 96%, var(--primary) 4%)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--primary) 12%, transparent)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Action Buttons */}
            <div className="md:col-span-3 flex items-center gap-3 mt-1 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <button
                disabled={saving}
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all duration-200 hover:shadow-lg active:scale-[0.97] disabled:opacity-50"
                style={{
                  background: editingId
                    ? 'linear-gradient(135deg, var(--secondary), color-mix(in srgb, var(--secondary) 80%, var(--primary)))'
                    : 'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 80%, var(--secondary)))',
                  color: 'var(--primary-foreground)',
                }}
              >
                {saving ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving…
                  </>
                ) : editingId ? (
                  <>
                    <IconCheck /> Update Material
                  </>
                ) : (
                  <>
                    <IconPlus /> Create Material
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => { if (editingId) cancelEdit(); else resetForm(); }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-sm active:scale-[0.97]"
                style={{
                  background: 'var(--muted)',
                  color: 'var(--muted-foreground)',
                  border: '1px solid var(--border)',
                }}
              >
                <IconX /> {editingId ? 'Cancel' : 'Reset'}
              </button>
            </div>
          </form>
        </div>

        {/* ── Table Card ── */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          {/* Table Header Bar */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{
              background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 8%, var(--card)), color-mix(in srgb, var(--secondary) 6%, var(--card)))',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>All Materials</h2>
              <span
                className="px-2 py-0.5 text-xs font-bold rounded-full"
                style={{
                  background: 'color-mix(in srgb, var(--primary) 14%, transparent)',
                  color: 'var(--primary)',
                }}
              >
                {materials.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Rows per page</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="rounded-lg px-2.5 py-1.5 text-sm outline-none cursor-pointer transition-colors duration-200"
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
                }}
              >
                {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr
                  style={{
                    background: 'var(--muted)',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  {['SKU Code', 'Name', 'Category', 'Subcategory', 'Variety', 'Unit', 'Reorder Lvl', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <span
                          className="inline-block w-8 h-8 border-[3px] rounded-full animate-spin"
                          style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }}
                        />
                        <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading materials…</span>
                      </div>
                    </td>
                  </tr>
                ) : materials.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div style={{ color: 'var(--muted-foreground)', opacity: 0.5 }}>
                          <IconPackage />
                        </div>
                        <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No raw materials found</span>
                        <span className="text-xs" style={{ color: 'var(--muted-foreground)', opacity: 0.7 }}>Use the form above to add your first material</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginated.map((m, idx) => (
                    <tr
                      key={m.id}
                      className="group transition-colors duration-150"
                      style={{
                        borderBottom: idx < paginated.length - 1 ? '1px solid color-mix(in srgb, var(--border) 50%, transparent)' : undefined,
                        background: editingId === m.id ? 'color-mix(in srgb, var(--secondary) 8%, var(--card))' : 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (editingId !== m.id) e.currentTarget.style.background = 'var(--muted)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = editingId === m.id
                          ? 'color-mix(in srgb, var(--secondary) 8%, var(--card))'
                          : 'transparent';
                      }}
                    >
                      <td className="px-5 py-3.5">
                        <span
                          className="inline-block px-2 py-0.5 text-xs font-mono font-semibold rounded-md"
                          style={{
                            background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
                            color: 'var(--primary)',
                          }}
                        >
                          {m.skuCode}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm font-medium" style={{ color: 'var(--foreground)' }}>{m.name}</td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                        {m.category ? MATERIAL_CATEGORIES.find(c => c.value === m.category)?.label || m.category : '-'}
                      </td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--muted-foreground)' }}>{m.subcategory || '-'}</td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--muted-foreground)' }}>{m.variety || '-'}</td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--muted-foreground)' }}>{m.unitOfMeasurement || '-'}</td>
                      <td className="px-5 py-3.5 text-sm font-medium" style={{ color: 'var(--foreground)' }}>{m.minReorderLevel ?? '-'}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => startEdit(m)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:shadow-sm active:scale-95"
                            style={{
                              background: 'color-mix(in srgb, var(--secondary) 12%, transparent)',
                              color: 'var(--secondary)',
                              border: '1px solid color-mix(in srgb, var(--secondary) 20%, transparent)',
                            }}
                          >
                            <IconEdit /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(m.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:shadow-sm active:scale-95"
                            style={{
                              background: 'color-mix(in srgb, var(--destructive) 10%, transparent)',
                              color: 'var(--destructive)',
                              border: '1px solid color-mix(in srgb, var(--destructive) 18%, transparent)',
                            }}
                          >
                            <IconTrash /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div
            className="flex items-center justify-between px-6 py-3"
            style={{ borderTop: '1px solid var(--border)', background: 'var(--muted)' }}
          >
            <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
              Showing {materials.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, materials.length)} of {materials.length}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 disabled:opacity-30 active:scale-95"
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
                }}
              >
                <IconChevronLeft />
              </button>

              {/* Page number pills */}
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
                    <button
                      key={item}
                      onClick={() => setCurrentPage(item as number)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-semibold transition-all duration-200 active:scale-95"
                      style={{
                        background: currentPage === item
                          ? 'var(--primary)'
                          : 'var(--card)',
                        color: currentPage === item
                          ? 'var(--primary-foreground)'
                          : 'var(--foreground)',
                        border: currentPage === item
                          ? '1px solid var(--primary)'
                          : '1px solid var(--border)',
                      }}
                    >
                      {item}
                    </button>
                  )
                )}

              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 disabled:opacity-30 active:scale-95"
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
                }}
              >
                <IconChevronRight />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRawMaterialPage;
