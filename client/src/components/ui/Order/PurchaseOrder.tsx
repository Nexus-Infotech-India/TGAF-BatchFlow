import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  AlertCircle,
  Trash2,
  Building2,
  Package,
  CheckCircle,
  X,
  ShoppingCart,
} from 'lucide-react';
import api, { API_ROUTES } from '../../../utils/api';
import { toast } from 'react-toastify';
import VendorModal from './VendorModal';
import RawMaterialModal from './RawMaterialModal';
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
    <label htmlFor={id} className="block text-sm font-medium text-foreground">
      {label}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </label>
    {description && (
      <p className="text-xs text-muted-foreground">{description}</p>
    )}
    {children}
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg border border-destructive/30"
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
  const MATERIAL_CATEGORIES = [
    { value: 'RAW_MATERIAL', label: 'Raw Material' },
    { value: 'PACKAGING_MATERIAL', label: 'Packaging Material' },
  ];
  const [vendorId, setVendorId] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [orderDate, setOrderDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [expectedDate, setExpectedDate] = useState('');
  const [items, setItems] = useState([
    { rawMaterialId: '', quantityOrdered: 1, quantityUnit: 'KG', rate: 0 },
  ]);
  const [selectedRawMaterials, setSelectedRawMaterials] = useState<
    Record<number, RawMaterial | null>
  >({});
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  // Selection modal states
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [rawMaterialModalOpen, setRawMaterialModalOpen] = useState(false);
  const [rawMaterialModalIdx, setRawMaterialModalIdx] = useState<number>(0);

  // NOTE: create actions moved to Masters section in sidebar; no inline create modals here

  // Fetch data functions
  const fetchVendors = async () => {
    try {
      const res = await api.get(API_ROUTES.RAW.GET_VENDORS, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      setVendors(res.data);
    } catch {
      setVendors([]);
    }
  };

  const fetchRawMaterials = async () => {
    try {
      const res = await api.get(API_ROUTES.RAW.GET_PRODUCTS, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      setRawMaterials(res.data);
    } catch {
      setRawMaterials([]);
    }
  };

  useEffect(() => {
    fetchVendors();
    fetchRawMaterials();
  }, []);

  const handleVendorSelect = (vendor: Vendor) => {
    setVendorId(vendor.id);
    setSelectedVendor(vendor);
    setVendorModalOpen(false);
  };

  const handleRawMaterialSelect = (rawMaterial: RawMaterial) => {
    const materialUnit = rawMaterial.unitOfMeasurement;
    setItems((prev) =>
      prev.map((item, i) =>
        i === rawMaterialModalIdx
          ? {
              ...item,
              rawMaterialId: rawMaterial.id,
              // Lock unit to material's UOM if it's Piece (non-weight); otherwise default to KG
              quantityUnit: materialUnit === 'Piece' ? 'Piece' : (item.quantityUnit || 'KG'),
            }
          : item
      )
    );
    setSelectedRawMaterials((prev) => ({
      ...prev,
      [rawMaterialModalIdx]: rawMaterial,
    }));
    setRawMaterialModalOpen(false);
  };

  const handleItemChange = (
    idx: number,
    field: string,
    value: string | number
  ) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const addItem = () => {
    setItems([...items, { rawMaterialId: '', quantityOrdered: 1, quantityUnit: 'KG', rate: 0 }]);
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
    setSelectedRawMaterials((prev) => {
      const copy = { ...prev };
      delete copy[idx];
      return copy;
    });
  };

  // Convert quantity to KG for pricing
  const toKG = (qty: number, unit: string) => {
    switch (unit) {
      case 'gram': return qty / 1000;
      case 'Ton': return qty * 1000;
      default: return qty; // KG
    }
  };

  // Subtotal for an item: Piece-priced items charge per Piece; weight-priced items charge per KG.
  const itemSubtotal = (qty: number, unit: string, rate: number) => {
    if (unit === 'Piece') return qty * rate;
    return toKG(qty, unit) * rate;
  };

  const calculateTotal = () => {
    return items.reduce(
      (sum, item) => sum + itemSubtotal(item.quantityOrdered, item.quantityUnit, item.rate),
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
      setSelectedVendor(null);
      setOrderDate('');
      setExpectedDate('');
      setItems([{ rawMaterialId: '', quantityOrdered: 1, quantityUnit: 'KG', rate: 0 }]);
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
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Topbar Buttons */}
        <div className="mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center justify-center w-12 h-12 bg-primary rounded-xl">
              <ShoppingCart className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Create Purchase Order
              </h1>
              <p className="text-sm text-muted-foreground">
                Generate a new purchase order for raw materials
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2 flex-wrap">
              {/* Create actions moved to Masters in sidebar - removed inline buttons */}

              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-input bg-background text-foreground rounded-xl hover:bg-accent transition text-sm"
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
              className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">Error</p>
                  <p className="text-sm text-destructive">{errorMsg}</p>
                </div>
                <button
                  onClick={() => setErrorMsg('')}
                  className="ml-auto text-destructive/70 hover:text-destructive"
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
              className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Success</p>
                  <p className="text-sm text-foreground/80">{successMsg}</p>
                </div>
                <button
                  onClick={() => setSuccessMsg('')}
                  className="ml-auto text-foreground/50 hover:text-foreground/80"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Form */}
        <form className="space-y-8" onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 text-primary-foreground" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Order Information
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Vendor Selection Button */}
              <FormField label="Vendor" id="vendor" required>
                <button
                  type="button"
                  onClick={() => setVendorModalOpen(true)}
                  className={`w-full text-left border rounded-xl px-4 py-3 transition-all duration-200 flex items-center gap-3 ${selectedVendor
                    ? 'bg-primary/5 border-primary/30 hover:bg-primary/10'
                    : 'bg-background border-input hover:bg-accent hover:border-primary/30'
                    }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedVendor
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                      }`}
                  >
                    {selectedVendor ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Building2 className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {selectedVendor ? (
                      <>
                        <p className="text-sm font-medium text-foreground truncate">
                          {selectedVendor.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {selectedVendor.vendorCode}
                          {selectedVendor.contactPerson &&
                            ` · ${selectedVendor.contactPerson}`}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Click to select a vendor
                      </p>
                    )}
                  </div>
                  <Plus className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </button>
                {/* Hidden input for form validation */}
                <input
                  type="text"
                  value={vendorId}
                  required
                  className="sr-only"
                  tabIndex={-1}
                  onChange={() => { }}
                />
              </FormField>

              <FormField label="Order Date" id="orderDate" required>
                <input
                  type="date"
                  id="orderDate"
                  className="w-full bg-card/100 text-foreground border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  required
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
                  className="w-full bg-card/100 text-foreground border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  required
                />
              </FormField>
            </div>

            {/* Category Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Category <span className="text-destructive ml-0.5">*</span>
              </label>
              <div className="flex items-center gap-3 mb-4">
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    // Reset selected raw materials when category changes
                    setItems((prev) => prev.map((item) => ({ ...item, rawMaterialId: '' })));
                    setSelectedRawMaterials({});
                  }}
                  className="rounded-xl px-3.5 py-2.5 text-sm border border-border bg-card text-foreground"
                  required
                >
                  <option value="">Select a category</option>
                  {MATERIAL_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <div className="text-xs text-muted-foreground">
                  Select a category to filter the materials available below.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                  <Package className="w-4 h-4 text-foreground" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">
                  Order Items
                </h2>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-muted/50 rounded-xl border border-border"
                >                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Items
                      </label>
                      {/* Raw Material Selection Button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (!selectedCategory) {
                            toast.error('Please select a category first to filter raw materials');
                            return;
                          }
                          setRawMaterialModalIdx(idx);
                          setRawMaterialModalOpen(true);
                        }}
                        className={`w-full text-left border rounded-xl px-4 py-2.5 transition-all duration-200 flex items-center gap-3 ${selectedRawMaterials[idx]
                          ? 'bg-primary/5 border-primary/30 hover:bg-primary/10'
                          : 'bg-card border-border hover:bg-accent hover:border-primary/30'
                          }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedRawMaterials[idx]
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                            }`}
                        >
                          {selectedRawMaterials[idx] ? (
                            <CheckCircle className="w-3.5 h-3.5" />
                          ) : (
                            <Package className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          {selectedRawMaterials[idx] ? (
                            <>
                              <p className="text-sm font-medium text-foreground truncate">
                                {selectedRawMaterials[idx]!.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {selectedRawMaterials[idx]!.skuCode} ·{' '}
                                {MATERIAL_CATEGORIES.find(c => c.value === selectedRawMaterials[idx]!.category)?.label || selectedRawMaterials[idx]!.category}
                              </p>
                            </>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              Search & select items
                            </p>
                          )}
                        </div>
                        <Plus className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      </button>
                      {/* Hidden input for form validation */}
                      <input
                        type="text"
                        value={item.rawMaterialId}
                        required
                        className="sr-only"
                        tabIndex={-1}
                        onChange={() => { }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Quantity
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min={0.01}
                          step="0.01"
                          className="w-full bg-card border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-foreground"
                          value={
                            item.quantityOrdered === 0
                              ? ''
                              : item.quantityOrdered
                          }
                          onChange={(e) =>
                            handleItemChange(
                              idx,
                              'quantityOrdered',
                              Number(e.target.value)
                            )
                          }
                          required
                        />
                        <select
                          className="bg-card border border-border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-foreground min-w-[80px] disabled:cursor-not-allowed disabled:opacity-70"
                          value={item.quantityUnit}
                          onChange={(e) =>
                            handleItemChange(idx, 'quantityUnit', e.target.value)
                          }
                          disabled={selectedRawMaterials[idx]?.unitOfMeasurement === 'Piece'}
                          title={selectedRawMaterials[idx]?.unitOfMeasurement === 'Piece' ? 'This material is sold per Piece — unit cannot be changed' : ''}
                        >
                          {selectedRawMaterials[idx]?.unitOfMeasurement === 'Piece' ? (
                            <option value="Piece">Piece</option>
                          ) : (
                            <>
                              <option value="gram">Gram</option>
                              <option value="KG">KG</option>
                              <option value="Ton">Ton</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Rate per {item.quantityUnit === 'Piece' ? 'Piece' : 'KG'}(₦)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          className="w-full bg-card border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-foreground"
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
                            className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {item.quantityOrdered > 0 && item.rate > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">
                          {item.quantityUnit === 'Piece'
                            ? `Subtotal (${item.quantityOrdered} Piece × ₦${item.rate}/Piece):`
                            : `Subtotal (${item.quantityOrdered} ${item.quantityUnit} = ${toKG(item.quantityOrdered, item.quantityUnit).toFixed(2)} KG × ₦${item.rate}/KG):`}
                        </span>
                        <span className="font-medium text-foreground">
                          ₦{itemSubtotal(item.quantityOrdered, item.quantityUnit, item.rate).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Total */}
            {calculateTotal() > 0 && (
              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span className="text-foreground">Total Amount:</span>
                  <span className="text-primary">
                    ₦{calculateTotal().toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-xl font-semibold text-base hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                  className="w-5 h-5 border-2 border-primary-foreground/70 border-t-transparent rounded-full"
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

      {/* Selection Modals (Select only, no create) */}
      <VendorModal
        isOpen={vendorModalOpen}
        onClose={() => setVendorModalOpen(false)}
        onSelect={handleVendorSelect}
        selectedVendorId={vendorId}
        vendors={vendors}
      />

      <RawMaterialModal
        isOpen={rawMaterialModalOpen}
        onClose={() => setRawMaterialModalOpen(false)}
        onSelect={handleRawMaterialSelect}
        selectedRawMaterialId={items[rawMaterialModalIdx]?.rawMaterialId}
        rawMaterials={rawMaterials.filter((rm) => rm.category === selectedCategory)}
      />

      {/* Create modals removed from this page - use Masters section */}
    </div>
  );
};

export default PurchaseOrder;
