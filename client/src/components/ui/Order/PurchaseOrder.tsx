import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  AlertCircle,
  Info,
  Trash2,
  Building2,
  Package,
  CheckCircle,
  X,
  ChevronDown,
  ShoppingCart,
} from 'lucide-react';
import api, { API_ROUTES } from '../../../utils/api';
import VendorBox from './vendor';
import RawMaterialBox from './RawMaterial';
import { useNavigate } from 'react-router-dom';

type Vendor = {
  id: string;
  vendorCode: string;
  name: string;
  address?: string;
  contactPerson?: string;
  contactNumber?: string;
  email?: string;
  gstin?: string;
  bankDetails?: string;
  enabled?: boolean;
};

type RawMaterial = {
  id: string;
  skuCode: string;
  name: string;
  category: string;
  unitOfMeasurement: string;
  minReorderLevel: number;
  vendorId: string;
};


type FormFieldProps = {
  label: React.ReactNode;
  id: string;
  error?: string;
  required?: boolean;
  description?: React.ReactNode;
  children: React.ReactNode;
};

const FormField: React.FC<FormFieldProps> = ({
  label,
  id,
  error,
  required,
  description,
  children,
}) => (
  <div className="space-y-2">
    <label htmlFor={id} className="block text-sm font-medium text-gray-900">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {description && (
      <p className="text-xs text-gray-500 flex items-center gap-1">
        <Info size={12} />
        {description}
      </p>
    )}
    {children}
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200"
        >
          <AlertCircle size={14} />
          {error}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const PurchaseOrder = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [vendorId, setVendorId] = useState('');
  const [orderDate, setOrderDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [expectedDate, setExpectedDate] = useState('');
  const [items, setItems] = useState([
    { rawMaterialId: '', quantityOrdered: 1, rate: 0 },
  ]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [sidebarBox, setSidebarBox] = useState<
    null | 'vendor' | { type: 'rawMaterial'; idx: number }
  >(null);
  const [, setShowVendorBox] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showRawMaterialBoxIdx] = useState<
    number | null
  >(null);
  const [selectedRawMaterials, setSelectedRawMaterials] = useState<
    Record<number, RawMaterial | null>
  >({});
  const navigate = useNavigate();
  // Fetch vendors and raw materials
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const res = await api.get(API_ROUTES.RAW.GET_VENDORS, {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        });
        setVendors(res.data);
      } catch {
        setVendors([]);
      }
    };
    const fetchRawMaterials = async () => {
      try {
        const res = await api.get(API_ROUTES.RAW.GET_PRODUCTS,{
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        });
        setRawMaterials(res.data);
      } catch {
        setRawMaterials([]);
      }
    };
    fetchVendors();
    fetchRawMaterials();
  }, []);

  useEffect(() => {
    if (vendorId === 'new') {
      setSidebarBox('vendor');
      setSelectedVendor(null);
    } else if (vendorId) {
      const v = vendors.find((v) => v.id === vendorId) || null;
      setSelectedVendor(v);
      setSidebarBox('vendor');
    } else {
      setSidebarBox(null);
      setSelectedVendor(null);
    }
  }, [vendorId, vendors]);

  const handleVendorCreated = (vendor: Vendor) => {
    setVendors((prev) => [...prev, vendor]);
    setVendorId(vendor.id);
    setSelectedVendor(vendor);
    setShowVendorBox(true);
  };

 const handleRawMaterialCreated = (
  rawMaterial: {
    id: any;
    skuCode?: string;
    name?: string;
    category?: string;
    unitOfMeasurement?: string;
    minReorderLevel?: number;
    vendorId?: string;
  },
  idx: number
) => {
  const normalizedRawMaterial: RawMaterial = {
    id: rawMaterial.id,
    skuCode: rawMaterial.skuCode ?? '',
    name: rawMaterial.name ?? '',
    category: rawMaterial.category ?? '',
    unitOfMeasurement: rawMaterial.unitOfMeasurement ?? '',
    minReorderLevel: rawMaterial.minReorderLevel ?? 0,
    vendorId: rawMaterial.vendorId ?? '',
  };
  setRawMaterials((prev) => [...prev, normalizedRawMaterial]);
  setItems((prev) =>
    prev.map((item, i) =>
      i === idx ? { ...item, rawMaterialId: normalizedRawMaterial.id } : item
    )
  );
  setSelectedRawMaterials((prev) => ({
    ...prev,
    [idx]: normalizedRawMaterial,
  }));
  setSidebarBox({ type: 'rawMaterial', idx }); // <-- Always show details after creation
};

 const handleItemChange = (
  idx: number,
  field: string,
  value: string | number
) => {
  setItems((prev) =>
    prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
  );
  if (field === 'rawMaterialId') {
    setSidebarBox({ type: 'rawMaterial', idx }); // <-- Always set sidebar
    if (value === 'new') {
      // Do not set selectedRawMaterials for new
      setSelectedRawMaterials((prev) => ({
        ...prev,
        [idx]: null,
      }));
    } else {
      const found = rawMaterials.find((rm) => rm.id === value) || null;
      setSelectedRawMaterials((prev) => ({
        ...prev,
        [idx]: found,
      }));
    }
  }
};

  const addItem = () => {
    setItems([...items, { rawMaterialId: '', quantityOrdered: 1, rate: 0 }]);
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
    setSelectedRawMaterials((prev) => {
      const copy = { ...prev };
      delete copy[idx];
      return copy;
    });
  };

  const calculateTotal = () => {
    return items.reduce(
      (sum, item) => sum + item.quantityOrdered * item.rate,
      0
    );
  };

 const handleSubmit = async (e: { preventDefault: () => void }) => {
  e.preventDefault();
  setLoading(true);
  setSuccessMsg('');
  setErrorMsg('');
  try {
    const authToken = localStorage.getItem('authToken');
    await api.post(
      API_ROUTES.RAW.CREATE_PURCHASE_ORDER,
      {
        vendorId,
        orderDate,
        expectedDate,
        items,
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    setSuccessMsg('Purchase order created successfully!');
    setVendorId('');
    setOrderDate('');
    setExpectedDate('');
    setItems([{ rawMaterialId: '', quantityOrdered: 1, rate: 0 }]);
    setSelectedRawMaterials({});
    setTimeout(() => {
      navigate('/raw/purchase-history');
    }, 1000);
  } catch (err: any) {
    setErrorMsg(
      err?.response?.data?.error || 'Failed to create purchase order'
    );
  }
  setLoading(false);
};

  return (
    <div className="min-h-screen bg-gray-50 rounded-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Create Purchase Order
              </h1>
              <p className="text-gray-600 mt-1">
                Generate a new purchase order for raw materials
              </p>
            </div>
            <div className="ml-auto">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-lg shadow hover:bg-gray-300 transition"
                onClick={() => navigate('/raw/purchase-history')}
              >
                Back to List
              </button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900">Error</p>
                  <p className="text-sm text-red-700">{errorMsg}</p>
                </div>
                <button
                  onClick={() => setErrorMsg('')}
                  className="ml-auto text-red-400 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">Success</p>
                  <p className="text-sm text-green-700">{successMsg}</p>
                </div>
                <button
                  onClick={() => setSuccessMsg('')}
                  className="ml-auto text-green-400 hover:text-green-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <form className="space-y-8" onSubmit={handleSubmit}>
              {/* Basic Information */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Order Information
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <FormField label="Vendor" id="vendor" required>
                    <div className="relative">
                      <select
                        id="vendor"
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                        value={vendorId}
                        onChange={(e) => setVendorId(e.target.value)}
                        required
                      >
                        <option value="">Select Vendor</option>
                        {vendors.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name}
                          </option>
                        ))}
                        <option value="new">+ New Vendor</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </FormField>

                  <FormField label="Order Date" id="orderDate" required>
                    <input
                      type="date"
                      id="orderDate"
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={orderDate}
                      disabled
                      readOnly
                    />
                  </FormField>

                  <FormField
                    label="Expected Delivery Date"
                    id="expectedDate"
                    required
                  >
                    <input
                      type="date"
                      id="expectedDate"
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={expectedDate}
                      onChange={(e) => setExpectedDate(e.target.value)}
                      required
                    />
                  </FormField>
                </div>

                {/* Order Items */}

                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <Package className="w-4 h-4 text-green-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Order Items
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </button>
                </div>

                <div className="space-y-4">
                  {items.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-gray-50 rounded-xl border border-gray-200"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Raw Material
                          </label>
                          <div className="relative">
                            <select
                              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                              value={
                                showRawMaterialBoxIdx === idx
                                  ? 'new'
                                  : item.rawMaterialId
                              }
                              onChange={(e) =>
                                handleItemChange(
                                  idx,
                                  'rawMaterialId',
                                  e.target.value
                                )
                              }
                              required
                            >
                              <option value="">Select Raw Material</option>
                              {rawMaterials.map((rm) => (
                                <option key={rm.id} value={rm.id}>
                                  {rm.name}
                                </option>
                              ))}
                              <option value="new">+ New Raw Material</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quantity
                          </label>
                         <input
  type="number"
  min={1}
  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  value={item.quantityOrdered === 0 ? '' : item.quantityOrdered}
  onChange={(e) =>
    handleItemChange(
      idx,
      'quantityOrdered',
      Number(e.target.value)
    )
  }
  required
/>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Rate (₹)
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              value={item.rate === 0 ? '' : item.rate}
                              onChange={(e) =>
                                handleItemChange(
                                  idx,
                                  'rate',
                                  Number(e.target.value)
                                )
                              }
                              required
                            />
                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeItem(idx)}
                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {item.quantityOrdered > 0 && item.rate > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="font-medium text-gray-900">
                              ₹{(item.quantityOrdered * item.rate).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Total */}
                {calculateTotal() > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span className="text-gray-900">Total Amount:</span>
                      <span className="text-blue-600">
                        ₹{calculateTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                whileTap={{ scale: 0.98 }}
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                    Creating Purchase Order...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Create Purchase Order
                  </div>
                )}
              </motion.button>
            </form>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {sidebarBox === 'vendor' && (
              <VendorBox
                vendor={selectedVendor}
                onCreated={handleVendorCreated}
              />
            )}
            {sidebarBox &&
              typeof sidebarBox === 'object' &&
              sidebarBox.type === 'rawMaterial' && (
                <RawMaterialBox
                  rawMaterial={selectedRawMaterials[sidebarBox.idx] ?? null}
                  onCreated={(rm) =>
                    handleRawMaterialCreated(rm, sidebarBox.idx)
                  }
                />
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrder;
