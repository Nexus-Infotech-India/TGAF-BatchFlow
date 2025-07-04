import React, { useEffect, useState } from "react";
import api, { API_ROUTES } from "../../../utils/api";
import { Building2 } from "lucide-react";

type Vendor = {
  id: string;
  vendorCode: string;
  name: string;
  address?: string;
  contactPerson?: string;
  contactNumber?: string;
  email?: string;
  bankName?: string;
  accountHolder?: string;
  accountNo?: string;
  enabled?: boolean;
};

type VendorBoxProps = {
  vendor: Vendor | null;
  onCreated: (vendor: Vendor) => void;
};

const VendorBox: React.FC<VendorBoxProps> = ({ vendor, onCreated }) => {
  const [showForm, setShowForm] = useState(!vendor);
  const [form, setForm] = useState({
    name: "",
    address: "",
    contactPerson: "",
    contactNumber: "",
    email: "",
    bankName: "",
    accountHolder: "",
    accountNo: "",
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    setShowForm(!vendor);
  }, [vendor]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const authToken = localStorage.getItem('authToken');
      const res = await api.post(
        API_ROUTES.RAW.CREATE_VENDOR,
        form,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      setMsg("Vendor created!");
      setShowForm(false);
      onCreated(res.data);
    } catch (err: any) {
      setMsg(err?.response?.data?.error || "Failed to create vendor");
    }
    setLoading(false);
  };

  if (showForm) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 w-80">
        <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-600" />
          Create New Vendor
        </h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Vendor Name<span className="text-red-500">*</span></label>
            <input
              name="name"
              placeholder="Vendor Name"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
            <input
              name="address"
              placeholder="Address"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.address}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Contact Person</label>
            <input
              name="contactPerson"
              placeholder="Contact Person"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.contactPerson}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Contact Number</label>
            <input
              name="contactNumber"
              placeholder="Contact Number"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.contactNumber}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
            <input
              name="email"
              placeholder="Email"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.email}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Bank Name</label>
            <input
              name="bankName"
              placeholder="Bank Name"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.bankName}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Account Holder Name</label>
            <input
              name="accountHolder"
              placeholder="Account Holder Name"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.accountHolder}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Account Number</label>
            <input
              name="accountNo"
              placeholder="Account Number"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.accountNo}
              onChange={handleChange}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Vendor"}
          </button>
          {msg && <div className="text-center text-xs text-blue-700 mt-2">{msg}</div>}
        </form>
      </div>
    );
  }

  if (vendor) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 w-80">
        <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-600" />
          Vendor Details
        </h3>
        <dl className="divide-y divide-gray-100">
          <div className="py-2 flex items-start gap-2">
            <dt className="text-xs font-medium text-gray-500 w-28">Vendor Code</dt>
            <dd className="text-sm text-gray-900">{vendor.vendorCode}</dd>
          </div>
          <div className="py-2 flex items-start gap-2">
            <dt className="text-xs font-medium text-gray-500 w-28">Name</dt>
            <dd className="text-sm text-gray-900">{vendor.name}</dd>
          </div>
          {vendor.address && (
            <div className="py-2 flex items-start gap-2">
              <dt className="text-xs font-medium text-gray-500 w-28">Address</dt>
              <dd className="text-sm text-gray-900">{vendor.address}</dd>
            </div>
          )}
          {vendor.contactPerson && (
            <div className="py-2 flex items-start gap-2">
              <dt className="text-xs font-medium text-gray-500 w-28">Contact Person</dt>
              <dd className="text-sm text-gray-900">{vendor.contactPerson}</dd>
            </div>
          )}
          {vendor.contactNumber && (
            <div className="py-2 flex items-start gap-2">
              <dt className="text-xs font-medium text-gray-500 w-28">Contact Number</dt>
              <dd className="text-sm text-gray-900">{vendor.contactNumber}</dd>
            </div>
          )}
          {vendor.email && (
            <div className="py-2 flex items-start gap-2">
              <dt className="text-xs font-medium text-gray-500 w-28">Email</dt>
              <dd className="text-sm text-gray-900">{vendor.email}</dd>
            </div>
          )}
          {vendor.bankName && (
            <div className="py-2 flex items-start gap-2">
              <dt className="text-xs font-medium text-gray-500 w-28">Bank Name</dt>
              <dd className="text-sm text-gray-900">{vendor.bankName}</dd>
            </div>
          )}
          {vendor.accountHolder && (
            <div className="py-2 flex items-start gap-2">
              <dt className="text-xs font-medium text-gray-500 w-28">Account Holder</dt>
              <dd className="text-sm text-gray-900">{vendor.accountHolder}</dd>
            </div>
          )}
          {vendor.accountNo && (
            <div className="py-2 flex items-start gap-2">
              <dt className="text-xs font-medium text-gray-500 w-28">Account Number</dt>
              <dd className="text-sm text-gray-900">{vendor.accountNo}</dd>
            </div>
          )}
          <div className="py-2 flex items-start gap-2">
            <dt className="text-xs font-medium text-gray-500 w-28">Enabled</dt>
            <dd className="text-sm text-gray-900">{vendor.enabled ? "Yes" : "No"}</dd>
          </div>
        </dl>
        <button
          className="mt-4 text-blue-700 underline text-xs"
          onClick={() => setShowForm(true)}
        >
          Create New Vendor
        </button>
      </div>
    );
  }

  return null;
};

export default VendorBox;