import React, { useEffect, useState } from 'react';
import api, { API_ROUTES } from '../../../utils/api';

type Vendor = {
  id: string;
  vendorCode?: string;
  name: string;
  address?: string;
  contactPerson?: string;
  contactNumber?: string;
  email?: string;
  bankName?: string;
  accountHolder?: string;
  accountNo?: string;
};

/* ───── tiny inline icons ───── */
const IconBuilding = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M12 10h.01" /><path d="M12 14h.01" /><path d="M16 10h.01" /><path d="M16 14h.01" /><path d="M8 10h.01" /><path d="M8 14h.01" /></svg>
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
const IconUser = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);
const IconMail = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
);
const IconPhone = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
);
const IconChevronLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
);
const IconChevronRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
);
const IconBank = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="22" x2="21" y2="22" /><line x1="6" y1="18" x2="6" y2="11" /><line x1="10" y1="18" x2="10" y2="11" /><line x1="14" y1="18" x2="14" y2="11" /><line x1="18" y1="18" x2="18" y2="11" /><polygon points="12 2 20 7 4 7" /></svg>
);

const emptyForm = {
  name: '',
  address: '',
  contactPerson: '',
  contactNumber: '',
  email: '',
  bankName: '',
  accountHolder: '',
  accountNo: '',
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

const CreateVendorPage: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await api.get(API_ROUTES.RAW.GET_VENDORS);
      setVendors(res.data || []);
    } catch {
      setVendors([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchVendors(); }, []);

  // auto-dismiss alerts
  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); }
  }, [success]);
  useEffect(() => {
    if (error) { const t = setTimeout(() => setError(''), 5000); return () => clearTimeout(t); }
  }, [error]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => { setForm({ ...emptyForm }); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      await api.post(API_ROUTES.RAW.CREATE_VENDOR, form);
      setSuccess('Vendor created successfully');
      resetForm();
      fetchVendors();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to create vendor');
    }
    setSaving(false);
  };

  const startEdit = (v: Vendor) => {
    setEditingId(v.id);
    setForm({
      name: v.name,
      address: v.address || '',
      contactPerson: v.contactPerson || '',
      contactNumber: v.contactNumber || '',
      email: v.email || '',
      bankName: (v as any).bankName || '',
      accountHolder: (v as any).accountHolder || '',
      accountNo: (v as any).accountNo || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => { setEditingId(null); resetForm(); };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      await api.put(API_ROUTES.RAW.UPDATE_VENDOR(editingId), form);
      setSuccess('Vendor updated successfully');
      setEditingId(null);
      resetForm();
      fetchVendors();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to update vendor');
    }
    setSaving(false);
  };

  // Note: No backend delete endpoint exists; vendors can be deactivated via status

  const totalPages = Math.max(1, Math.ceil(vendors.length / pageSize));
  const paginated = vendors.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Page Header ── */}
        <div className="bg-brand-header rounded-2xl px-6 py-5 flex items-center gap-4">
          <div
            className="flex items-center justify-center w-11 h-11 rounded-xl shadow-md"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            <IconBuilding />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
              Vendor Master
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              Manage your vendor directory &middot; <span className="font-medium" style={{ color: 'var(--primary)' }}>{vendors.length}</span> vendor{vendors.length !== 1 ? 's' : ''}
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
                {editingId ? 'Edit Vendor' : 'Add New Vendor'}
              </h2>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {editingId ? 'Modify the details below and save' : 'Fill in the vendor details to register a new supplier'}
              </p>
            </div>
          </div>

          <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-5">
            {/* ── Contact Info Section ── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--primary)' }}>Contact Information</span>
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-4">
                <StyledInput label="Vendor Name" name="name" value={form.name} onChange={handleChange} placeholder="Company / Individual name" required icon={<IconBuilding />} />
                <StyledInput label="Contact Person" name="contactPerson" value={form.contactPerson} onChange={handleChange} placeholder="Primary contact" icon={<IconUser />} />
                <StyledInput label="Contact Number" name="contactNumber" value={form.contactNumber} onChange={handleChange} placeholder="+91 XXXXX XXXXX" icon={<IconPhone />} />
                <StyledInput label="Email" name="email" value={form.email} onChange={handleChange} placeholder="vendor@example.com" type="email" icon={<IconMail />} />
                <div className="md:col-span-2">
                  <StyledInput label="Address" name="address" value={form.address} onChange={handleChange} placeholder="Full address" />
                </div>
              </div>
            </div>

            {/* ── Bank Details Section ── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--secondary)' }}>Bank Details</span>
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-4">
                <StyledInput label="Bank Name" name="bankName" value={form.bankName} onChange={handleChange} placeholder="e.g. State Bank" icon={<IconBank />} />
                <StyledInput label="Account Holder" name="accountHolder" value={form.accountHolder} onChange={handleChange} placeholder="Name on account" />
                <StyledInput label="Account Number" name="accountNo" value={form.accountNo} onChange={handleChange} placeholder="XXXX XXXX XXXX" />
              </div>
            </div>

            {/* ── Action Buttons ── */}
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
                  <><IconCheck /> Update Vendor</>
                ) : (
                  <><IconPlus /> Create Vendor</>
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
              <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>All Vendors</h2>
              <span
                className="px-2 py-0.5 text-xs font-bold rounded-full"
                style={{
                  background: 'color-mix(in srgb, var(--primary) 14%, transparent)',
                  color: 'var(--primary)',
                }}
              >
                {vendors.length}
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
                <tr style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  {['Vendor', 'Contact', 'Email', 'Address', 'Actions'].map((h) => (
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
                        <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading vendors…</span>
                      </div>
                    </td>
                  </tr>
                ) : vendors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div style={{ color: 'var(--muted-foreground)', opacity: 0.5 }}>
                          <IconBuilding />
                        </div>
                        <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No vendors found</span>
                        <span className="text-xs" style={{ color: 'var(--muted-foreground)', opacity: 0.7 }}>Use the form above to register your first vendor</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginated.map((v, idx) => (
                    <tr
                      key={v.id}
                      className="group transition-colors duration-150"
                      style={{
                        borderBottom: idx < paginated.length - 1 ? '1px solid color-mix(in srgb, var(--border) 50%, transparent)' : undefined,
                        background: editingId === v.id ? 'color-mix(in srgb, var(--secondary) 8%, var(--card))' : 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (editingId !== v.id) e.currentTarget.style.background = 'var(--muted)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = editingId === v.id
                          ? 'color-mix(in srgb, var(--secondary) 8%, var(--card))' : 'transparent';
                      }}
                    >
                      {/* Vendor */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
                            style={{
                              background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
                              color: 'var(--primary)',
                            }}
                          >
                            <IconBuilding />
                          </div>
                          <div>
                            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{v.name}</div>
                            {v.vendorCode && (
                              <span
                                className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded"
                                style={{
                                  background: 'color-mix(in srgb, var(--secondary) 10%, transparent)',
                                  color: 'var(--secondary)',
                                }}
                              >
                                {v.vendorCode}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-5 py-3.5">
                        <div className="space-y-0.5">
                          {v.contactPerson && (
                            <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--foreground)' }}>
                              <IconUser /> {v.contactPerson}
                            </div>
                          )}
                          {v.contactNumber && (
                            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                              <IconPhone /> {v.contactNumber}
                            </div>
                          )}
                          {!v.contactPerson && !v.contactNumber && (
                            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>-</span>
                          )}
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-5 py-3.5">
                        {v.email ? (
                          <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                            <IconMail /> {v.email}
                          </div>
                        ) : (
                          <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>-</span>
                        )}
                      </td>

                      {/* Address */}
                      <td className="px-5 py-3.5 text-sm max-w-[200px] truncate" style={{ color: 'var(--muted-foreground)' }}>
                        {v.address || '-'}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => startEdit(v)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:shadow-sm active:scale-95"
                            style={{
                              background: 'color-mix(in srgb, var(--secondary) 12%, transparent)',
                              color: 'var(--secondary)',
                              border: '1px solid color-mix(in srgb, var(--secondary) 20%, transparent)',
                            }}
                          >
                            <IconEdit /> Edit
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
              Showing {vendors.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, vendors.length)} of {vendors.length}
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

export default CreateVendorPage;
