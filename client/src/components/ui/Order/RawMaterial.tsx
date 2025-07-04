import React, { useState, useEffect } from "react";
import api, { API_ROUTES } from "../../../utils/api";

type RawMaterial = {
  id: string;
  skuCode: string;
  name: string;
  category: string;
  unitOfMeasurement: string;
  minReorderLevel: number;
  vendorId: string;
};

type RawMaterialBoxProps = {
  rawMaterial: RawMaterial | null;
  onCreated: (rawMaterial: RawMaterial) => void;
};

const RawMaterialBox: React.FC<RawMaterialBoxProps> = ({ rawMaterial, onCreated }) => {
  const [showForm, setShowForm] = useState(!rawMaterial);
  const [form, setForm] = useState({
    skuCode: "",
    name: "",
    category: "",
    unitOfMeasurement: "",
    minReorderLevel: "",
    vendorId: "",
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setShowForm(!rawMaterial);
  }, [rawMaterial]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const payload = { ...form, minReorderLevel: Number(form.minReorderLevel) };
      const authToken = localStorage.getItem('authToken');
      const res = await api.post(
        API_ROUTES.RAW.CREATE_PRODUCT,
        payload,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      setMsg("Raw material created!");
      setShowForm(false);
      onCreated(res.data);
    } catch (err: any) {
      setMsg(err?.response?.data?.error || "Failed to create raw material");
    }
    setLoading(false);
  };

  if (showForm) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 w-80">
        <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
          Create New Raw Material
        </h3>
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">SKU Code<span className="text-red-500">*</span></label>
            <input
              name="skuCode"
              placeholder="SKU Code"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.skuCode}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Raw Material Name<span className="text-red-500">*</span></label>
            <input
              name="name"
              placeholder="Raw Material Name"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Category<span className="text-red-500">*</span></label>
            <input
              name="category"
              placeholder="Category"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.category}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Unit of Measurement<span className="text-red-500">*</span></label>
            <input
              name="unitOfMeasurement"
              placeholder="Unit of Measurement"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.unitOfMeasurement}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Min Reorder Level<span className="text-red-500">*</span></label>
            <input
              name="minReorderLevel"
              placeholder="Min Reorder Level"
              type="number"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.minReorderLevel}
              onChange={handleChange}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Raw Material"}
          </button>
          {msg && <div className="text-center text-xs text-blue-700 mt-2">{msg}</div>}
        </form>
      </div>
    );
  }

  if (rawMaterial) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 w-80">
        <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
          Raw Material Details
        </h3>
        <dl className="divide-y divide-gray-100">
          <div className="py-2 flex items-start gap-2">
            <dt className="text-xs font-medium text-gray-500 w-28">SKU Code</dt>
            <dd className="text-sm text-gray-900">{rawMaterial.skuCode}</dd>
          </div>
          <div className="py-2 flex items-start gap-2">
            <dt className="text-xs font-medium text-gray-500 w-28">Name</dt>
            <dd className="text-sm text-gray-900">{rawMaterial.name}</dd>
          </div>
          <div className="py-2 flex items-start gap-2">
            <dt className="text-xs font-medium text-gray-500 w-28">Category</dt>
            <dd className="text-sm text-gray-900">{rawMaterial.category}</dd>
          </div>
          <div className="py-2 flex items-start gap-2">
            <dt className="text-xs font-medium text-gray-500 w-28">Unit of Measurement</dt>
            <dd className="text-sm text-gray-900">{rawMaterial.unitOfMeasurement}</dd>
          </div>
          <div className="py-2 flex items-start gap-2">
            <dt className="text-xs font-medium text-gray-500 w-28">Min Reorder Level</dt>
            <dd className="text-sm text-gray-900">{rawMaterial.minReorderLevel}</dd>
          </div>
        </dl>
        <button
          className="mt-4 text-blue-700 underline text-xs"
          onClick={() => setShowForm(true)}
        >
          Create New Raw Material
        </button>
      </div>
    );
  }

  return null;
};

export default RawMaterialBox;