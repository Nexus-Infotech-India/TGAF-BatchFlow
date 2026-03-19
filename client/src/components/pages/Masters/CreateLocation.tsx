import React, { useEffect, useState } from 'react';
import api, { API_ROUTES } from '../../../utils/api';

type Location = {
  id: string;
  code?: string;
  name: string;
  type: string;
  address?: string;
  description?: string;
  enabled?: boolean;
};

const LOCATION_TYPES = [
  { value: 'WAREHOUSE', label: 'Warehouse' },
  { value: 'CLEANING', label: 'Cleaning' },
  { value: 'GRINDING', label: 'Grinding' },
  { value: 'SFG_WAREHOUSE', label: 'SFG Warehouse' },
  { value: 'OTHER', label: 'Other' },
];

/* ───── tiny inline icons ───── */
const IconMapPin = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
);
const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
);
const IconEdit = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
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
const IconToggle = ({ on }: { on: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {on ? <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></> : <><line x1="1" y1="1" x2="23" y2="23" /><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /></>}
  </svg>
);

const emptyForm = {
  name: '',
  type: 'WAREHOUSE',
  address: '',
  description: '',
};

/* ── Styled input helper ── */
const StyledInput: React.FC<{
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  icon?: React.ReactNode;
}> = ({ label, name, value, onChange, placeholder, required, type = 'text', icon }) => (
  <div>
    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
      {label}
    </label>
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }}>
          {icon}
        </span>
      )}
      <input
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        type={type}
        placeholder={placeholder}
        className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all duration-200"
        style={{
          background: 'color-mix(in srgb, var(--card) 96%, var(--primary) 4%)',
          border: '1px solid var(--border)',
          color: 'var(--foreground)',
          paddingLeft: icon ? '2.25rem' : undefined,
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
  </div>
);

const StyledSelect: React.FC<{
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  required?: boolean;
}> = ({ label, name, value, onChange, options, required }) => (
  <div>
    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
      {label}
    </label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all duration-200 cursor-pointer"
      style={{
        background: 'color-mix(in srgb, var(--card) 96%, var(--primary) 4%)',
        border: '1px solid var(--border)',
        color: 'var(--foreground)',
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

const getTypeColor = (type: string) => {
  switch (type) {
    case 'WAREHOUSE': return '#3b82f6';
    case 'CLEANING': return '#8b5cf6';
    case 'GRINDING': return '#f59e0b';
    case 'SFG_WAREHOUSE': return '#10b981';
    default: return '#6b7280';
  }
};

const getTypeLabel = (type: string) => {
  return LOCATION_TYPES.find(t => t.value === type)?.label || type;
};

const CreateLocationPage: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await api.get(API_ROUTES.RAW.GET_LOCATIONS);
      setLocations(res.data || []);
    } catch {
      setLocations([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchLocations(); }, []);

  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); }
  }, [success]);
  useEffect(() => {
    if (error) { const t = setTimeout(() => setError(''), 5000); return () => clearTimeout(t); }
  }, [error]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => { setForm({ ...emptyForm }); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      await api.post(API_ROUTES.RAW.CREATE_LOCATION, form);
      setSuccess('Location created successfully');
      resetForm();
      fetchLocations();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to create location');
    }
    setSaving(false);
  };

  const startEdit = (loc: Location) => {
    setEditingId(loc.id);
    setForm({
      name: loc.name,
      type: loc.type || 'WAREHOUSE',
      address: loc.address || '',
      description: loc.description || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => { setEditingId(null); resetForm(); };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      await api.put(API_ROUTES.RAW.UPDATE_LOCATION(editingId), form);
      setSuccess('Location updated successfully');
      setEditingId(null);
      resetForm();
      fetchLocations();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to update location');
    }
    setSaving(false);
  };

  const handleToggleStatus = async (loc: Location) => {
    try {
      await api.patch(API_ROUTES.RAW.SET_LOCATION_STATUS(loc.id), { enabled: !loc.enabled });
      setSuccess(`Location ${loc.enabled ? 'disabled' : 'enabled'} successfully`);
      fetchLocations();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to update status');
    }
  };

  const totalPages = Math.max(1, Math.ceil(locations.length / pageSize));
  const paginated = locations.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Page Header ── */}
        <div className="bg-brand-header rounded-2xl px-6 py-5 flex items-center gap-4">
          <div
            className="flex items-center justify-center w-11 h-11 rounded-xl shadow-md"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            <IconMapPin />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
              Location Master
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              Manage physical locations &middot; <span className="font-medium" style={{ color: 'var(--primary)' }}>{locations.length}</span> location{locations.length !== 1 ? 's' : ''}
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
                {editingId ? 'Edit Location' : 'Add New Location'}
              </h2>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {editingId ? 'Modify the details below and save' : 'Register a new physical location'}
              </p>
            </div>
          </div>

          <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-3">
                
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-4">
                <StyledInput label="Location Name" name="name" value={form.name} onChange={handleChange} placeholder="e.g. RM Warehouse" required icon={<IconMapPin />} />
                <StyledSelect label="Location Type" name="type" value={form.type} onChange={handleChange} options={LOCATION_TYPES} required />
                <StyledInput label="Address" name="address" value={form.address} onChange={handleChange} placeholder="Physical address (optional)" />
                <div className="md:col-span-3">
                  <StyledInput label="Description" name="description" value={form.description} onChange={handleChange} placeholder="Notes about this location (optional)" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
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
                  <><IconCheck /> Update Location</>
                ) : (
                  <><IconPlus /> Create Location</>
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
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{
              background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 8%, var(--card)), color-mix(in srgb, var(--secondary) 6%, var(--card)))',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>All Locations</h2>
              <span
                className="px-2 py-0.5 text-xs font-bold rounded-full"
                style={{
                  background: 'color-mix(in srgb, var(--primary) 14%, transparent)',
                  color: 'var(--primary)',
                }}
              >
                {locations.length}
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

          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  {['Location', 'Type', 'Address', 'Status', 'Actions'].map((h) => (
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
                    <td colSpan={5} className="px-5 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <span
                          className="inline-block w-8 h-8 border-[3px] rounded-full animate-spin"
                          style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }}
                        />
                        <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading locations…</span>
                      </div>
                    </td>
                  </tr>
                ) : locations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div style={{ color: 'var(--muted-foreground)', opacity: 0.5 }}>
                          <IconMapPin />
                        </div>
                        <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No locations found</span>
                        <span className="text-xs" style={{ color: 'var(--muted-foreground)', opacity: 0.7 }}>Use the form above to register your first location</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginated.map((loc, idx) => (
                    <tr
                      key={loc.id}
                      className="group transition-colors duration-150"
                      style={{
                        borderBottom: idx < paginated.length - 1 ? '1px solid color-mix(in srgb, var(--border) 50%, transparent)' : undefined,
                        background: editingId === loc.id ? 'color-mix(in srgb, var(--secondary) 8%, var(--card))' : 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (editingId !== loc.id) e.currentTarget.style.background = 'var(--muted)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = editingId === loc.id
                          ? 'color-mix(in srgb, var(--secondary) 8%, var(--card))' : 'transparent';
                      }}
                    >
                      {/* Location */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
                            style={{
                              background: `color-mix(in srgb, ${getTypeColor(loc.type)} 12%, transparent)`,
                              color: getTypeColor(loc.type),
                            }}
                          >
                            <IconMapPin />
                          </div>
                          <div>
                            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{loc.name}</div>
                            {loc.code && (
                              <span
                                className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded"
                                style={{
                                  background: 'color-mix(in srgb, var(--secondary) 10%, transparent)',
                                  color: 'var(--secondary)',
                                }}
                              >
                                {loc.code}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-5 py-3.5">
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold"
                          style={{
                            background: `color-mix(in srgb, ${getTypeColor(loc.type)} 12%, transparent)`,
                            color: getTypeColor(loc.type),
                          }}
                        >
                          {getTypeLabel(loc.type)}
                        </span>
                      </td>

                      {/* Address */}
                      <td className="px-5 py-3.5 text-sm max-w-[200px] truncate" style={{ color: 'var(--muted-foreground)' }}>
                        {loc.address || '-'}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{
                            background: loc.enabled
                              ? 'color-mix(in srgb, #16a34a 12%, transparent)'
                              : 'color-mix(in srgb, var(--destructive) 12%, transparent)',
                            color: loc.enabled ? '#16a34a' : 'var(--destructive)',
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'currentColor' }} />
                          {loc.enabled ? 'Active' : 'Disabled'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => startEdit(loc)}
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
                            onClick={() => handleToggleStatus(loc)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:shadow-sm active:scale-95"
                            style={{
                              background: loc.enabled
                                ? 'color-mix(in srgb, var(--destructive) 10%, transparent)'
                                : 'color-mix(in srgb, #16a34a 10%, transparent)',
                              color: loc.enabled ? 'var(--destructive)' : '#16a34a',
                              border: `1px solid ${loc.enabled ? 'color-mix(in srgb, var(--destructive) 20%, transparent)' : 'color-mix(in srgb, #16a34a 20%, transparent)'}`,
                            }}
                          >
                            <IconToggle on={!loc.enabled} /> {loc.enabled ? 'Disable' : 'Enable'}
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
              Showing {locations.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, locations.length)} of {locations.length}
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
                        background: currentPage === item ? 'var(--primary)' : 'var(--card)',
                        color: currentPage === item ? 'var(--primary-foreground)' : 'var(--foreground)',
                        border: currentPage === item ? '1px solid var(--primary)' : '1px solid var(--border)',
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

export default CreateLocationPage;
