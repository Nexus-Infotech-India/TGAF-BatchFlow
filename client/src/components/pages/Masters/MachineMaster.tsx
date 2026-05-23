import React, { useEffect, useState } from 'react';
import api, { API_ROUTES } from '../../../utils/api';

type Machine = {
  id: string;
  machineId: string;
  name: string;
  location: string;
  capacityQty: number;
  capacityUnit: string;
  machineSpeed?: string;
};

/* ───── tiny inline icons ───── */
const IconFactory = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M17 18h1" /><path d="M12 18h1" /><path d="M7 18h1" /></svg>
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
const IconTrash = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
  );

// Underlying enum value remains BOXES_PER_SHIFT for backward compat; UI label is "Cartons / Shift".
const CAPACITY_UNIT_OPTIONS = [
  { value: 'BOXES_PER_SHIFT', label: 'Cartons / Shift' },
];

const getCapacityUnitLabel = (value: string) => {
  const found = CAPACITY_UNIT_OPTIONS.find(o => o.value === value);
  if (found) return found.label;
  // Handle legacy values
  if (value === 'TON_PER_SHIFT') return 'Cartons / Shift';
  if (value === 'KG_PER_SHIFT') return 'Cartons / Shift';
  return 'Cartons / Shift';
};

const emptyForm = {
  machineId: '',
  name: '',
  location: '',
  capacityQty: '',
  capacityUnit: 'BOXES_PER_SHIFT',
  machineSpeed: '',
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

const MachineMasterPage: React.FC = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchMachines = async () => {
    setLoading(true);
    try {
      const res = await api.get(API_ROUTES.MACHINE.GET_MACHINES);
      setMachines(res.data?.data || []);
    } catch {
      setMachines([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchMachines(); }, []);

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
      await api.post(API_ROUTES.MACHINE.CREATE_MACHINE, form);
      setSuccess('Machine created successfully');
      resetForm();
      fetchMachines();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to create machine');
    }
    setSaving(false);
  };

  const startEdit = (machine: Machine) => {
    setEditingId(machine.id);
    setForm({
      machineId: machine.machineId,
      name: machine.name,
      location: machine.location,
      capacityQty: machine.capacityQty,
      capacityUnit: 'BOXES_PER_SHIFT',
      machineSpeed: machine.machineSpeed || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => { setEditingId(null); resetForm(); };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      await api.put(API_ROUTES.MACHINE.UPDATE_MACHINE(editingId), form);
      setSuccess('Machine updated successfully');
      setEditingId(null);
      resetForm();
      fetchMachines();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to update machine');
    }
    setSaving(false);
  };

  const handleDelete = async (machine: Machine) => {
    if (!window.confirm('Are you sure you want to delete this machine?')) return;
    try {
      await api.delete(API_ROUTES.MACHINE.DELETE_MACHINE(machine.id));
      setSuccess('Machine deleted successfully');
      fetchMachines();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to delete machine');
    }
  };

  const totalPages = Math.max(1, Math.ceil(machines.length / pageSize));
  const paginated = machines.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Page Header ── */}
        <div className="bg-brand-header rounded-2xl px-6 py-5 flex items-center gap-4">
          <div
            className="flex items-center justify-center w-11 h-11 rounded-xl shadow-md"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            <IconFactory />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
              Machine Master
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              Manage machine capacity and locations &middot; <span className="font-medium" style={{ color: 'var(--primary)' }}>{machines.length}</span> machine{machines.length !== 1 ? 's' : ''}
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
                {editingId ? 'Edit Machine' : 'Add New Machine'}
              </h2>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {editingId ? 'Modify the details below and save' : 'Register a new machine'}
              </p>
            </div>
          </div>

          <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                <StyledInput label="Machine Name" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Packing Machine 1" required icon={<IconFactory />} />
                <StyledInput label="Machine ID" name="machineId" value={form.machineId} onChange={handleChange} placeholder="e.g. MAC-001" required />
                <StyledInput label="Location" name="location" value={form.location} onChange={handleChange} placeholder="e.g. Packaging Area" required />
                <StyledInput label="Machine Speed (e.g. 60PPM)" name="machineSpeed" value={form.machineSpeed} onChange={handleChange} placeholder="e.g. 60PPM" />
                <div className="flex gap-2">
                  <div className="flex-1">
                    <StyledInput label="Instulation Capacity" type="number" name="capacityQty" value={form.capacityQty} onChange={handleChange} placeholder="e.g. 500" required />
                  </div>
                  <div className="w-1/3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
                        Unit
                      </label>
                      <select
                        name="capacityUnit"
                        value={form.capacityUnit}
                        onChange={handleChange}
                        required
                        className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all duration-200 cursor-pointer"
                        style={{
                          background: 'color-mix(in srgb, var(--card) 96%, var(--primary) 4%)',
                          border: '1px solid var(--border)',
                          color: 'var(--foreground)',
                          appearance: 'none',
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M2 4l4 4 4-4'/%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 12px center',
                          paddingRight: '2.25rem',
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
                        {CAPACITY_UNIT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
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
                  <><IconCheck /> Update Machine</>
                ) : (
                  <><IconPlus /> Create Machine</>
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
              <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>All Machines</h2>
              <span
                className="px-2 py-0.5 text-xs font-bold rounded-full"
                style={{
                  background: 'color-mix(in srgb, var(--primary) 14%, transparent)',
                  color: 'var(--primary)',
                }}
              >
                {machines.length}
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
                  {['Machine Details', 'Location', 'Instulation Capacity', 'Speed', 'Actions'].map((h) => (
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
                    <td colSpan={4} className="px-5 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <span
                          className="inline-block w-8 h-8 border-[3px] rounded-full animate-spin"
                          style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }}
                        />
                        <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading machines…</span>
                      </div>
                    </td>
                  </tr>
                ) : machines.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div style={{ color: 'var(--muted-foreground)', opacity: 0.5 }}>
                          <IconFactory />
                        </div>
                        <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No machines found</span>
                        <span className="text-xs" style={{ color: 'var(--muted-foreground)', opacity: 0.7 }}>Use the form above to register your first machine</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginated.map((machine, idx) => (
                    <tr
                      key={machine.id}
                      className="group transition-colors duration-150"
                      style={{
                        borderBottom: idx < paginated.length - 1 ? '1px solid color-mix(in srgb, var(--border) 50%, transparent)' : undefined,
                        background: editingId === machine.id ? 'color-mix(in srgb, var(--secondary) 8%, var(--card))' : 'transparent',
                      }}
                      onMouseEnter={(e) => {
                         if (editingId !== machine.id) e.currentTarget.style.background = 'var(--muted)';
                      }}
                      onMouseLeave={(e) => {
                         e.currentTarget.style.background = editingId === machine.id
                           ? 'color-mix(in srgb, var(--secondary) 8%, var(--card))' : 'transparent';
                      }}
                    >
                      {/* Name & ID */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
                            style={{
                              background: `color-mix(in srgb, var(--primary) 12%, transparent)`,
                              color: 'var(--primary)',
                            }}
                          >
                            <IconFactory />
                          </div>
                          <div>
                            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{machine.name}</div>
                            <span
                                className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded"
                                style={{
                                    background: 'color-mix(in srgb, var(--secondary) 10%, transparent)',
                                    color: 'var(--secondary)',
                                }}
                            >
                                {machine.machineId}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                        {machine.location}
                      </td>

                      {/* Capacity */}
                      <td className="px-5 py-3.5 text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                        {machine.capacityQty} <span className="text-xs opacity-80">{getCapacityUnitLabel(machine.capacityUnit)}</span>
                      </td>

                      {/* Speed */}
                      <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                        {machine.machineSpeed || '-'}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => startEdit(machine)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:shadow-sm active:scale-95"
                            style={{
                              background: 'color-mix(in srgb, var(--secondary) 12%, transparent)',
                              color: 'var(--secondary)',
                            }}
                          >
                            <IconEdit /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(machine)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:shadow-sm active:scale-95"
                            style={{
                              background: 'color-mix(in srgb, var(--destructive) 10%, transparent)',
                              color: 'var(--destructive)',
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
              Showing {machines.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, machines.length)} of {machines.length}
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

export default MachineMasterPage;
