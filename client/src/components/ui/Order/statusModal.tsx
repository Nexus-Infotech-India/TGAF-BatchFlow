import React, { useEffect, useState } from "react";
import api, { API_ROUTES } from "../../../utils/api";
import { Package, Scale, Hash, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";

type Warehouse = {
    id: string;
    name: string;
    location?: string;
};

type BagEntry = {
    bagNo: number;
    bagWeight: number;
};

type ReceivalEntry = {
    id: string;
    warehouseId: string;
    warehouse: { name: string };
    weightMode: "INDIVIDUAL" | "TOTAL";
    totalWeight: number;
    bags: { bagNo: number; bagWeight: number }[];
    notes?: string;
    receivedDate: string;
};

type Props = {
    open: boolean;
    onClose: () => void;
    onConfirm: (data: {
        status: string;
        warehouseId: string;
        weightMode: string;
        bags?: BagEntry[];
        totalWeight?: number;
        numberOfBags?: number;
        notes?: string;
    }) => Promise<void>;
    defaultQuantity?: number;
    currentReceived?: number;
    currentStatus?: string;
    itemId?: string;
    receivals?: ReceivalEntry[];
};

const ReceiveModal: React.FC<Props> = ({
    open,
    onClose,
    onConfirm,
    defaultQuantity = 0,
    currentReceived = 0,
    currentStatus = "PENDING",
    receivals = [],
}) => {
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<"PARTIALLY_RECEIVED" | "RECEIVED">("PARTIALLY_RECEIVED");
    const [weightMode, setWeightMode] = useState<"INDIVIDUAL" | "TOTAL">("TOTAL");
    const [totalWeight, setTotalWeight] = useState<number>(0);
    const [numberOfBags, setNumberOfBags] = useState<number>(0);
    const [bags, setBags] = useState<BagEntry[]>([{ bagNo: 1, bagWeight: 0 }]);
    const [notes, setNotes] = useState("");
    const [showHistory, setShowHistory] = useState(false);

    const remaining = defaultQuantity - currentReceived;

    useEffect(() => {
        if (open) {
            fetchWarehouses();
            setShowForm(false);
            setSelectedWarehouseId("");
            setTotalWeight(0);
            setNumberOfBags(0);
            setBags([{ bagNo: 1, bagWeight: 0 }]);
            setNotes("");
            setStatus("PARTIALLY_RECEIVED");
            setWeightMode("TOTAL");
            setShowHistory(false);
        }
    }, [open, defaultQuantity]);

    const fetchWarehouses = async () => {
        try {
            const authToken = localStorage.getItem("authToken");
            const res = await api.get(API_ROUTES.RAW.GET_WAREHOUSES, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setWarehouses(res.data);
        } catch {
            setWarehouses([]);
        }
    };

    const handleAddBag = () => {
        setBags((prev) => [...prev, { bagNo: prev.length + 1, bagWeight: 0 }]);
    };

    const handleRemoveBag = (idx: number) => {
        setBags((prev) => {
            const updated = prev.filter((_, i) => i !== idx);
            return updated.map((b, i) => ({ ...b, bagNo: i + 1 }));
        });
    };

    const handleBagWeightChange = (idx: number, weight: number) => {
        setBags((prev) =>
            prev.map((b, i) => (i === idx ? { ...b, bagWeight: weight } : b))
        );
    };

    const computedTotalFromBags = bags.reduce((sum, b) => sum + (b.bagWeight || 0), 0);

    const handleConfirm = async () => {
        if (!selectedWarehouseId) {
            window.alert("Please select a warehouse.");
            return;
        }

        if (weightMode === "TOTAL") {
            if (!totalWeight || totalWeight <= 0) {
                window.alert("Please enter a valid total weight.");
                return;
            }
        } else {
            if (bags.length === 0 || bags.some((b) => !b.bagWeight || b.bagWeight <= 0)) {
                window.alert("Please enter valid weight for all bags.");
                return;
            }
        }

        setLoading(true);
        try {
            await onConfirm({
                status,
                warehouseId: selectedWarehouseId,
                weightMode,
                bags: weightMode === "INDIVIDUAL" ? bags : undefined,
                totalWeight: weightMode === "TOTAL" ? totalWeight : undefined,
                numberOfBags: weightMode === "TOTAL" && numberOfBags > 0 ? numberOfBags : undefined,
                notes: notes || undefined,
            });
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    const isFullyReceived = currentStatus === "RECEIVED";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-card border border-border/30 rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-border/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/8 rounded-lg">
                            <Package className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">Receive Item</h2>
                            <p className="text-xs text-muted-foreground">
                                Ordered: <span className="font-medium text-foreground">{defaultQuantity}</span>
                                {' · '}Received: <span className="font-medium text-green-400">{currentReceived}</span>
                                {' · '}Remaining: <span className="font-medium text-amber-400">{remaining > 0 ? remaining : 0}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        className="text-muted-foreground hover:text-foreground transition p-1 rounded-lg hover:bg-muted/30"
                        onClick={onClose}
                        disabled={loading}
                    >
                        ✕
                    </button>
                </div>

                {isFullyReceived ? (
                    <div className="p-6 text-center">
                        <div className="w-12 h-12 bg-green-500/15 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Package className="w-6 h-6 text-green-400" />
                        </div>
                        <h3 className="text-foreground font-semibold mb-1">Fully Received</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            This item has been fully received. No further receiving is allowed.
                        </p>
                        {receivals.length > 0 && (
                            <div className="mt-4 text-left">
                                <ReceivalHistory receivals={receivals} />
                            </div>
                        )}
                        <button
                            className="mt-4 px-4 py-2 rounded-lg bg-muted/50 text-muted-foreground hover:bg-muted/70 transition text-sm"
                            onClick={onClose}
                        >
                            Close
                        </button>
                    </div>
                ) : !showForm ? (
                    <div className="p-5 space-y-4">
                        {/* Receival History Toggle */}
                        {receivals.length > 0 && (
                            <div>
                                <button
                                    onClick={() => setShowHistory(!showHistory)}
                                    className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition font-medium"
                                >
                                    {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    Previous Receivals ({receivals.length})
                                </button>
                                {showHistory && <ReceivalHistory receivals={receivals} />}
                            </div>
                        )}

                        {/* Status Info — auto-determined by backend */}
                        <div className="bg-muted/10 border border-border/20 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">
                                <span className="font-medium text-foreground">Status is auto-determined:</span>{' '}
                                {remaining <= 0
                                    ? 'This item is already fully received.'
                                    : `Enter the weight received below. If total received reaches ${defaultQuantity}, the item will be automatically marked as Fully Received.`
                                }
                            </p>
                        </div>

                        {/* Warehouse Selection */}
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                                Warehouse
                            </label>
                            <div className="flex gap-2">
                                <select
                                    className="flex-1 bg-muted/20 border border-border/30 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 transition"
                                    value={selectedWarehouseId}
                                    onChange={(e) => setSelectedWarehouseId(e.target.value)}
                                >
                                    <option value="">Choose warehouse</option>
                                    {warehouses.map((w) => (
                                        <option key={w.id} value={w.id}>
                                            {w.name}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    className="px-3 py-2 bg-primary/8 text-primary rounded-lg text-xs font-medium hover:bg-primary/15 transition"
                                    onClick={() => setShowForm(true)}
                                    type="button"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Weight Mode Toggle */}
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                                Weight Entry Mode
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setWeightMode("TOTAL")}
                                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium border transition-all ${weightMode === "TOTAL"
                                        ? "bg-primary/8 border-primary/30 text-primary"
                                        : "bg-muted/20 border-border/30 text-muted-foreground hover:border-border/50"
                                        }`}
                                >
                                    <Scale className="w-3.5 h-3.5" />
                                    Total Weight
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setWeightMode("INDIVIDUAL")}
                                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium border transition-all ${weightMode === "INDIVIDUAL"
                                        ? "bg-primary/8 border-primary/30 text-primary"
                                        : "bg-muted/20 border-border/30 text-muted-foreground hover:border-border/50"
                                        }`}
                                >
                                    <Hash className="w-3.5 h-3.5" />
                                    Individual Bags
                                </button>
                            </div>
                        </div>

                        {/* Weight Input - Total Mode */}
                        {weightMode === "TOTAL" ? (
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                                        Total Weight Received
                                    </label>
                                    <input
                                        type="number"
                                        min={0.01}
                                        step="0.01"
                                        className="w-full bg-muted/20 border border-border/30 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 transition"
                                        value={totalWeight || ""}
                                        onChange={(e) => setTotalWeight(Number(e.target.value))}
                                        placeholder="Enter total weight"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                                        Number of Bags (optional, for splitting)
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        className="w-full bg-muted/20 border border-border/30 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 transition"
                                        value={numberOfBags || ""}
                                        onChange={(e) => setNumberOfBags(Number(e.target.value))}
                                        placeholder="Leave empty if not splitting"
                                    />
                                </div>
                            </div>
                        ) : (
                            /* Weight Input - Individual Bags Mode */
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Individual Bag Weights
                                    </label>
                                    <span className="text-xs text-primary font-medium">
                                        Total: {computedTotalFromBags.toFixed(2)}
                                    </span>
                                </div>
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                    {bags.map((bag, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground w-14 shrink-0">
                                                Bag {bag.bagNo}
                                            </span>
                                            <input
                                                type="number"
                                                min={0.01}
                                                step="0.01"
                                                className="flex-1 bg-muted/20 border border-border/30 rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary/50 transition"
                                                value={bag.bagWeight || ""}
                                                onChange={(e) =>
                                                    handleBagWeightChange(idx, Number(e.target.value))
                                                }
                                                placeholder="Weight"
                                            />
                                            {bags.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveBag(idx)}
                                                    className="p-1.5 text-destructive/60 hover:text-destructive hover:bg-destructive/10 rounded-lg transition"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddBag}
                                    className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Add Bag
                                </button>
                            </div>
                        )}

                        {/* Notes */}
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">
                                Notes (optional)
                            </label>
                            <textarea
                                className="w-full bg-muted/20 border border-border/30 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 transition resize-none"
                                rows={2}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Any remarks about this receival..."
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                className="px-4 py-2 rounded-lg bg-muted/30 text-muted-foreground hover:bg-muted/50 transition text-sm font-medium"
                                onClick={onClose}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition text-sm font-medium disabled:opacity-50"
                                onClick={handleConfirm}
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                        </svg>
                                        Saving...
                                    </span>
                                ) : (
                                    "Confirm Receival"
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-5">
                        <WarehouseForm
                            onCreated={(w) => {
                                setWarehouses((ws) => [...ws, w]);
                                setSelectedWarehouseId(w.id);
                                setShowForm(false);
                            }}
                            onCancel={() => setShowForm(false)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

// Receival History sub-component
const ReceivalHistory: React.FC<{ receivals: ReceivalEntry[] }> = ({ receivals }) => (
    <div className="mt-3 space-y-2">
        {receivals.map((r, idx) => (
            <div
                key={r.id || idx}
                className="bg-muted/15 border border-border/20 rounded-lg p-3 text-xs"
            >
                <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-foreground">
                        {r.totalWeight} received
                    </span>
                    <span className="text-muted-foreground">
                        {new Date(r.receivedDate).toLocaleDateString()}
                    </span>
                </div>
                <div className="text-muted-foreground">
                    Warehouse: <span className="text-foreground/80">{r.warehouse?.name || '-'}</span>
                    {' · '}Mode: <span className="text-foreground/80">{r.weightMode}</span>
                    {r.bags && r.bags.length > 0 && (
                        <span> · {r.bags.length} bag(s)</span>
                    )}
                </div>
                {r.notes && (
                    <p className="text-muted-foreground mt-1">Note: {r.notes}</p>
                )}
            </div>
        ))}
    </div>
);

type WarehouseFormProps = {
    onCreated: (w: Warehouse) => void;
    onCancel: () => void;
};

const WarehouseForm: React.FC<WarehouseFormProps> = ({ onCreated, onCancel }) => {
    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        setLoading(true);
        try {
            const authToken = localStorage.getItem("authToken");
            const res = await api.post(
                API_ROUTES.RAW.CREATE_WAREHOUSE,
                { name, location },
                { headers: { Authorization: `Bearer ${authToken}` } }
            );
            onCreated(res.data);
        } catch {
            // handle error
        }
        setLoading(false);
    };

    return (
        <div>
            <h3 className="text-base font-semibold text-foreground mb-3">Add Warehouse</h3>
            <div className="space-y-3">
                <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Name</label>
                    <input
                        className="w-full bg-muted/20 border border-border/30 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 transition"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Warehouse name"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Location</label>
                    <input
                        className="w-full bg-muted/20 border border-border/30 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 transition"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Location"
                    />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                    <button
                        className="px-4 py-2 rounded-lg bg-muted/30 text-muted-foreground hover:bg-muted/50 transition text-sm font-medium"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition text-sm font-medium"
                        onClick={handleCreate}
                        disabled={!name || loading}
                    >
                        {loading ? "Adding..." : "Add"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReceiveModal;

// Edit Purchase Order Modal
type EditOrderModalProps = {
    open: boolean;
    onClose: () => void;
    onSave: (data: { expectedDate: string }) => void;
    defaultExpectedDate: string;
};

export const EditOrderModal: React.FC<EditOrderModalProps> = ({
    open,
    onClose,
    onSave,
    defaultExpectedDate,
}) => {
    const [expectedDate, setExpectedDate] = useState(defaultExpectedDate);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setExpectedDate(defaultExpectedDate);
    }, [defaultExpectedDate, open]);

    const handleSave = async () => {
        setLoading(true);
        await onSave({ expectedDate });
        setLoading(false);
    };

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-card border border-border/30 rounded-xl shadow-2xl max-w-sm w-full mx-4 p-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-foreground">Edit Purchase Order</h2>
                    <button
                        className="text-muted-foreground hover:text-foreground transition p-1 rounded-lg hover:bg-muted/30"
                        onClick={onClose}
                        disabled={loading}
                    >
                        ✕
                    </button>
                </div>
                <div className="mb-4">
                    <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">
                        Expected Date
                    </label>
                    <input
                        type="date"
                        className="w-full bg-muted/20 border border-border/30 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 transition"
                        value={expectedDate}
                        onChange={(e) => setExpectedDate(e.target.value)}
                    />
                </div>
                <div className="flex justify-end gap-2">
                    <button
                        className="px-4 py-2 rounded-lg bg-muted/30 text-muted-foreground hover:bg-muted/50 transition text-sm font-medium"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        className="px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition text-sm font-medium"
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {loading ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Delete Purchase Order Modal
type DeleteOrderModalProps = {
    open: boolean;
    onClose: () => void;
    onDelete: () => void;
    poNumber: string;
};

export const DeleteOrderModal: React.FC<DeleteOrderModalProps> = ({
    open,
    onClose,
    onDelete,
    poNumber,
}) => {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        setLoading(true);
        await onDelete();
        setLoading(false);
    };

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-card border border-border/30 rounded-xl shadow-2xl max-w-sm w-full mx-4 p-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-foreground">Delete Purchase Order</h2>
                    <button
                        className="text-muted-foreground hover:text-foreground transition p-1 rounded-lg hover:bg-muted/30"
                        onClick={onClose}
                        disabled={loading}
                    >
                        ✕
                    </button>
                </div>
                <p className="mb-4 text-sm text-muted-foreground">
                    Are you sure you want to delete <span className="font-semibold text-foreground">{poNumber}</span>?
                </p>
                <div className="flex justify-end gap-2">
                    <button
                        className="px-4 py-2 rounded-lg bg-muted/30 text-muted-foreground hover:bg-muted/50 transition text-sm font-medium"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        className="px-5 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition text-sm font-medium"
                        onClick={handleDelete}
                        disabled={loading}
                    >
                        {loading ? "Deleting..." : "Delete"}
                    </button>
                </div>
            </div>
        </div>
    );
};
