import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Package,
    AlertCircle,
    CheckCircle,
    Loader2,
    
} from "lucide-react";
import api, { API_ROUTES } from "../../../utils/api";



type RawMaterialCreateModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
};

const RawMaterialCreateModal: React.FC<RawMaterialCreateModalProps> = ({
    isOpen,
    onClose,
    onCreated,
}) => {
    const [form, setForm] = useState({
        skuCode: "",
        name: "",
        category: "",
        unitOfMeasurement: "",
        minReorderLevel: "",
        vendorId: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const resetForm = () => {
        setForm({
            skuCode: "",
            name: "",
            category: "",
            unitOfMeasurement: "",
            minReorderLevel: "",
            vendorId: "",
        });
        setError("");
        setSuccess(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    // const handleVendorSelect = (vendor: Vendor) => {
    //     setSelectedVendor(vendor);
    //     setForm({ ...form, vendorId: vendor.id });
    //     setShowVendorPicker(false);
    //     setVendorSearch("");
    // };

    // const filteredVendors = vendors.filter(
    //     (v) =>
    //         v.name.toLowerCase().includes(vendorSearch.toLowerCase()) ||
    //         v.vendorCode.toLowerCase().includes(vendorSearch.toLowerCase())
    // );

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess(false);
        try {
            const payload = {
                ...form,
                minReorderLevel: Number(form.minReorderLevel),
            };
            const authToken = localStorage.getItem("authToken");
            await api.post(API_ROUTES.RAW.CREATE_PRODUCT, payload, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setSuccess(true);
            onCreated();
            setTimeout(() => {
                handleClose();
            }, 1200);
        } catch (err: any) {
            setError(
                err?.response?.data?.error || "Failed to create raw material"
            );
        }
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[60] flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                    />

                    {/* Modal */}
                    <motion.div
                        className="relative w-full max-w-md max-h-[90vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
                                    <Package className="w-5 h-5 text-primary-foreground" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">
                                        Add New Raw Material
                                    </h2>
                                    <p className="text-xs text-muted-foreground">
                                        Fill in the details to create a raw material
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-2 hover:bg-accent rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </div>

                        {/* Form */}
                        <form
                            onSubmit={handleCreate}
                            className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
                        >
                            {/* Notifications */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg border border-destructive/30"
                                    >
                                        <AlertCircle size={14} />
                                        {error}
                                    </motion.div>
                                )}
                                {success && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="flex items-center gap-2 text-sm text-primary bg-primary/10 px-3 py-2 rounded-lg border border-primary/30"
                                    >
                                        <CheckCircle size={14} />
                                        Raw material created successfully!
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">
                                        SKU Code <span className="text-destructive">*</span>
                                    </label>
                                    <input
                                        name="skuCode"
                                        placeholder="e.g. RM-001"
                                        className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring placeholder:text-muted-foreground"
                                        value={form.skuCode}
                                        onChange={handleChange}
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">
                                        Material Name{" "}
                                        <span className="text-destructive">*</span>
                                    </label>
                                    <input
                                        name="name"
                                        placeholder="Material name"
                                        className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring placeholder:text-muted-foreground"
                                        value={form.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">
                                        Category <span className="text-destructive">*</span>
                                    </label>
                                    <select
                                        name="category"
                                        className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring placeholder:text-muted-foreground"
                                        value={form.category}
                                        onChange={handleChange as any}
                                        required
                                    >
                                        <option value="" disabled>Select category</option>
                                        <option value="RAW_MATERIAL">Raw Material</option>
                                        <option value="SEMI_FINISHED_GOOD">Semi-Finished Good</option>
                                        <option value="FINISHED_GOOD">Finished Good</option>
                                        <option value="PACKAGING_MATERIAL">Packaging Material</option>
                                        <option value="BYPRODUCT">Byproduct</option>
                                        <option value="WASTAGE">Wastage</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">
                                        Unit of Measurement{" "}
                                        <span className="text-destructive">*</span>
                                    </label>
                                    <select
                                        name="unitOfMeasurement"
                                        className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                                        value={form.unitOfMeasurement}
                                        onChange={handleChange as any}
                                        required
                                    >
                                        <option value="" disabled>Select unit</option>
                                        <option value="gram">Gram</option>
                                        <option value="KG">KG</option>
                                        <option value="Ton">Ton</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">
                                    Min Reorder Level{" "}
                                    <span className="text-destructive">*</span>
                                </label>
                                <input
                                    name="minReorderLevel"
                                    placeholder="Minimum reorder level"
                                    type="number"
                                    min={0}
                                    className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring placeholder:text-muted-foreground"
                                    value={form.minReorderLevel}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {/* Footer */}
                            <div className="flex gap-3 pt-2 pb-1">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-accent transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || success}
                                    className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : success ? (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            Created!
                                        </>
                                    ) : (
                                        "Create Raw Material"
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default RawMaterialCreateModal;
