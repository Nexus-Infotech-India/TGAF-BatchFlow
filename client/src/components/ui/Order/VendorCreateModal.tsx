import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Building2,
    AlertCircle,
    CheckCircle,
    Loader2,
} from "lucide-react";
import api, { API_ROUTES } from "../../../utils/api";

type VendorCreateModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
};

const VendorCreateModal: React.FC<VendorCreateModalProps> = ({
    isOpen,
    onClose,
    onCreated,
}) => {
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
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const resetForm = () => {
        setForm({
            name: "",
            address: "",
            contactPerson: "",
            contactNumber: "",
            email: "",
            bankName: "",
            accountHolder: "",
            accountNo: "",
        });
        setError("");
        setSuccess(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess(false);
        try {
            const authToken = localStorage.getItem("authToken");
            await api.post(API_ROUTES.RAW.CREATE_VENDOR, form, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setSuccess(true);
            onCreated();
            setTimeout(() => {
                handleClose();
            }, 1200);
        } catch (err: any) {
            setError(err?.response?.data?.error || "Failed to create vendor");
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
                                    <Building2 className="w-5 h-5 text-primary-foreground" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">
                                        Add New Vendor
                                    </h2>
                                    <p className="text-xs text-muted-foreground">
                                        Fill in the details to create a new vendor
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
                                        Vendor created successfully!
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">
                                    Vendor Name <span className="text-destructive">*</span>
                                </label>
                                <input
                                    name="name"
                                    placeholder="Enter vendor name"
                                    className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring placeholder:text-muted-foreground"
                                    value={form.name}
                                    onChange={handleChange}
                                    required
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">
                                    Address
                                </label>
                                <input
                                    name="address"
                                    placeholder="Enter address"
                                    className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring placeholder:text-muted-foreground"
                                    value={form.address}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">
                                        Contact Person
                                    </label>
                                    <input
                                        name="contactPerson"
                                        placeholder="Contact person"
                                        className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring placeholder:text-muted-foreground"
                                        value={form.contactPerson}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">
                                        Contact Number
                                    </label>
                                    <input
                                        name="contactNumber"
                                        placeholder="Contact number"
                                        className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring placeholder:text-muted-foreground"
                                        value={form.contactNumber}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">
                                    Email
                                </label>
                                <input
                                    name="email"
                                    type="email"
                                    placeholder="Enter email address"
                                    className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring placeholder:text-muted-foreground"
                                    value={form.email}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="border-t border-border pt-4">
                                <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                                    Bank Details
                                </p>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1.5">
                                            Bank Name
                                        </label>
                                        <input
                                            name="bankName"
                                            placeholder="Enter bank name"
                                            className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring placeholder:text-muted-foreground"
                                            value={form.bankName}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                                Account Holder
                                            </label>
                                            <input
                                                name="accountHolder"
                                                placeholder="Account holder"
                                                className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring placeholder:text-muted-foreground"
                                                value={form.accountHolder}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                                Account No.
                                            </label>
                                            <input
                                                name="accountNo"
                                                placeholder="Account number"
                                                className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring placeholder:text-muted-foreground"
                                                value={form.accountNo}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                </div>
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
                                        "Create Vendor"
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

export default VendorCreateModal;
