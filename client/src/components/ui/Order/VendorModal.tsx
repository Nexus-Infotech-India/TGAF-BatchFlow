import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Building2, Check, ChevronRight } from "lucide-react";

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

type VendorModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (vendor: Vendor) => void;
    selectedVendorId?: string;
    vendors: Vendor[];
};

const VendorModal: React.FC<VendorModalProps> = ({
    isOpen,
    onClose,
    onSelect,
    selectedVendorId,
    vendors,
}) => {
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (!isOpen) {
            setSearchQuery("");
        }
    }, [isOpen]);

    const filteredVendors = vendors.filter(
        (v) =>
            v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.vendorCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (v.contactPerson &&
                v.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center"
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
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        className="relative w-full max-w-lg max-h-[85vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
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
                                        Select Vendor
                                    </h2>
                                    <p className="text-xs text-muted-foreground">
                                        {vendors.length} vendor{vendors.length !== 1 ? "s" : ""}{" "}
                                        available
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-accent rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="px-6 py-3 border-b border-border">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search vendors..."
                                    className="w-full bg-background border border-input rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring placeholder:text-muted-foreground"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Vendor List */}
                        <div className="flex-1 overflow-y-auto px-3 py-2 max-h-[55vh]">
                            {filteredVendors.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Building2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
                                    <p className="text-sm">No vendors found</p>
                                    <p className="text-xs mt-1">
                                        Try a different search or add a new vendor from the topbar
                                    </p>
                                </div>
                            ) : (
                                filteredVendors.map((vendor) => (
                                    <motion.button
                                        key={vendor.id}
                                        type="button"
                                        onClick={() => onSelect(vendor)}
                                        className={`w-full text-left px-4 py-3 rounded-xl mb-1 transition-all duration-150 flex items-center gap-3 group ${selectedVendorId === vendor.id
                                                ? "bg-primary/10 border border-primary/30"
                                                : "hover:bg-accent border border-transparent"
                                            }`}
                                        whileHover={{ x: 2 }}
                                        whileTap={{ scale: 0.99 }}
                                    >
                                        <div
                                            className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedVendorId === vendor.id
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                                                }`}
                                        >
                                            {selectedVendorId === vendor.id ? (
                                                <Check className="w-4 h-4" />
                                            ) : (
                                                <Building2 className="w-4 h-4" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">
                                                {vendor.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {vendor.vendorCode}
                                                {vendor.contactPerson &&
                                                    ` · ${vendor.contactPerson}`}
                                            </p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </motion.button>
                                ))
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default VendorModal;
