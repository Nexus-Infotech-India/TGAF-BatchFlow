import React, { useEffect, useState } from 'react';
import api, { API_ROUTES } from '../../../utils/api';
import { CheckCircle, Clock, Package, Mail, ChevronUp, Eye, Trash2, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { Pagination } from 'antd';
import ReceiveModal, { DeleteOrderModal, EditOrderModal } from '../../ui/Order/statusModal';
import { useNavigate } from 'react-router-dom';

type Vendor = { id: string; name: string };
type ReceivalBag = { bagNo: number; bagWeight: number };
type ReceivalEntry = {
    id: string;
    warehouseId?: string;
    locationId?: string;
    warehouse?: { name: string };
    location?: { name: string };
    weightMode: 'INDIVIDUAL' | 'TOTAL';
    totalWeight: number;
    bags: ReceivalBag[];
    notes?: string;
    receivedDate: string;
};
type PurchaseOrderItem = {
    id: string;
    rawMaterialId: string;
    quantityOrdered: number;
    totalReceived: number;
    rate: number;
    status: string;
    rawMaterial?: { id: string; skuCode: string; name: string; unitOfMeasurement?: string };
    receivals?: ReceivalEntry[];
};
type PurchaseOrder = {
    id: string;
    poNumber: string;
    vendor: Vendor;
    orderDate: string;
    expectedDate: string;
    status: string;
    items: PurchaseOrderItem[];
};

const formatDate = (d: string) => {
    try {
        return new Date(d).toLocaleDateString();
    } catch {
        return 'N/A';
    }
};

const getStatusConfig = (status: string) => {
    switch (status) {
        case 'RECEIVED':
            return {
                label: 'Received',
                icon: <CheckCircle className="w-3.5 h-3.5" />,
                classes: 'bg-green-500/10 text-green-400 border-green-500/20',
            };
        case 'PARTIALLY_RECEIVED':
            return {
                label: 'Partial',
                icon: <Clock className="w-3.5 h-3.5" />,
                classes: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            };
        default:
            return {
                label: 'Pending',
                icon: <Clock className="w-3.5 h-3.5" />,
                classes: 'bg-muted/30 text-muted-foreground border-border/30',
            };
    }
};

// Format quantity: round to max 2 decimals and trim trailing .00
const formatQty = (n: number) => {
    const v = Math.max(0, Number(n) || 0);
    const rounded = parseFloat(v.toFixed(2));
    return rounded.toString();
};

const PurchaseOrderList: React.FC = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [showReceiveModal, setShowReceiveModal] = useState(false);
    const [receiveItem, setReceiveItem] = useState<PurchaseOrderItem | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
    const [sendingMail, setSendingMail] = useState(false);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const authToken = localStorage.getItem('authToken');
            const res = await api.get(API_ROUTES.RAW.GET_PURCHASE_ORDERS, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setOrders(res.data);
        } catch {
            toast.error('Failed to fetch orders');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const toggleExpanded = (itemId: string) => {
        setExpandedRows((prev) => {
            const next = new Set(prev);
            if (next.has(itemId)) next.delete(itemId);
            else next.add(itemId);
            return next;
        });
    };

    

    const handleReceiveConfirm = async (data: any) => {
        if (!receiveItem) return;
        try {
            const authToken = localStorage.getItem('authToken');
            await api.put(
                API_ROUTES.RAW.UPDATE_PURCHASE_ORDER_ITEM(receiveItem.id),
                data,
                { headers: { Authorization: `Bearer ${authToken}` } }
            );
            toast.success('Item received successfully!');
            setShowReceiveModal(false);
            setReceiveItem(null);
            await fetchOrders();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to receive item.');
        }
    };

    const handleEditSave = async (data: { expectedDate: string }) => {
        if (!selectedOrder) return;
        try {
            const authToken = localStorage.getItem('authToken');
            await api.put(
                API_ROUTES.RAW.UPDATE_PURCHASE_ORDER(selectedOrder.id),
                { expectedDate: data.expectedDate },
                { headers: { Authorization: `Bearer ${authToken}` } }
            );
            toast.success('Order updated.');
            setEditModalOpen(false);
            await fetchOrders();
        } catch {
            toast.error('Failed to update order.');
        }
    };

    const handleDeleteConfirm = async () => {
        if (!selectedOrder) return;
        try {
            const authToken = localStorage.getItem('authToken');
            await api.delete(API_ROUTES.RAW.DELETE_PURCHASE_ORDER(selectedOrder.id), {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            toast.success('Order deleted.');
            setDeleteModalOpen(false);
            await fetchOrders();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to delete order.');
        }
    };

    const handleSendMail = async () => {
        setSendingMail(true);
        try {
            const authToken = localStorage.getItem('authToken');
            await api.get(API_ROUTES.RAW.SEND_PRODUCT_MAIL, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            toast.success('Emails sent!');
        } catch {
            toast.error('Failed to send emails');
        }
        setSendingMail(false);
    };

    // Stats
    const allItems = orders.flatMap((o) => o.items);
    const totalOrders = orders.length;
    const fullyReceived = allItems.filter((i) => i.status === 'RECEIVED').length;
    const partiallyReceived = allItems.filter((i) => i.status === 'PARTIALLY_RECEIVED').length;
    const pending = allItems.filter((i) => i.status === 'PENDING').length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
            </div>
        );
    }

    const paginatedOrders = orders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <div className="p-6 max-w-[95vw] mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/8 rounded-xl">
                        <Package className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Purchase Orders</h1>
                        <p className="text-sm text-muted-foreground">Manage and track your purchase orders</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSendMail}
                        disabled={sendingMail}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-border/30 transition text-sm font-medium disabled:opacity-50"
                    >
                        <Mail className="w-4 h-4" />
                        {sendingMail ? 'Sending...' : 'Send All via Email'}
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/raw/purchase-order')}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition text-sm font-medium"
                    >
                        + Create Order
                    </motion.button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total Orders', value: totalOrders, color: 'text-primary' },
                    { label: 'Fully Received', value: fullyReceived, color: 'text-green-400' },
                    { label: 'Partially Received', value: partiallyReceived, color: 'text-amber-400' },
                    { label: 'Pending', value: pending, color: 'text-muted-foreground' },
                ].map((stat, i) => (
                    <div
                        key={i}
                        className="bg-card border border-border/30 rounded-xl p-4"
                        style={{
                            background: 'linear-gradient(90deg, rgba(83, 23, 170, 0.03) 0%, rgba(83, 23, 170, 0.01) 50%, transparent 100%)',
                        }}
                    >
                        <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div
                className="bg-card border border-border/30 rounded-xl overflow-hidden"
                style={{
                    background: 'linear-gradient(90deg, rgba(83, 23, 170, 0.03) 0%, rgba(83, 23, 170, 0.01) 50%, transparent 100%)',
                }}
            >
                <div className="overflow-x-auto" id="table-scroll-container">
                    <table className="w-full text-sm" id="purchase-order-table">
                        <thead>
                            <tr className="border-b border-border/30">
                                {['PO Number', 'Vendor', 'Product', 'Order Date', 'Expected Date', 'Ordered Quantity', 'Received Quantity', 'Remaining Quantity', 'Rate   (Per KG)', 'Status', 'Actions'].map(
                                    (h) => (
                                        <th key={h} className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                                            {h}
                                        </th>
                                    )
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedOrders.map((order) =>
                                order.items.map((item, itemIdx) => {
                                    const stConfig = getStatusConfig(item.status);
                                    const pct = item.quantityOrdered > 0 ? Math.min(100, (item.totalReceived / item.quantityOrdered) * 100) : 0;
                                    const isExpanded = expandedRows.has(item.id);

                                    // determine if order is editable/deletable: only when all items are pending (no receivals yet)
                                    const orderEditable = order.items.every((it) => it.status === 'PENDING');

                                    return (
                                        <React.Fragment key={item.id}>
                                            <motion.tr
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: itemIdx * 0.03 }}
                                                className="border-b border-border/15 hover:bg-muted/5 transition"
                                            >
                                                {itemIdx === 0 && (
                                                    <>
                                                        <td className="px-4 py-3 font-medium text-foreground" rowSpan={order.items.length}>
                                                            <div className="flex flex-col gap-1">
                                                                <span>{order.poNumber}</span>
                                                                {orderEditable ? (
                                                                    <div className="flex gap-1">
                                                                        <button
                                                                            onClick={() => {
                                                                                setSelectedOrder(order);
                                                                                setEditModalOpen(true);
                                                                            }}
                                                                            className="p-1 text-muted-foreground hover:text-primary rounded transition"
                                                                            title="Edit"
                                                                        >
                                                                            <Pencil className="w-3.5 h-3.5" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                setSelectedOrder(order);
                                                                                setDeleteModalOpen(true);
                                                                            }}
                                                                            className="p-1 text-muted-foreground hover:text-destructive rounded transition"
                                                                            title="Delete"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-xs text-muted-foreground">No actions</div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-foreground/80" rowSpan={order.items.length}>
                                                            {order.vendor?.name || '-'}
                                                        </td>
                                                    </>
                                                )}
                                                <td className="px-4 py-3 text-foreground/90">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{item.rawMaterial?.name || '-'}</span>
                                                        {item.rawMaterial?.skuCode ? (
                                                            <span className="text-xs text-muted-foreground mt-1">SKU code - {item.rawMaterial.skuCode}</span>
                                                        ) : null}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {formatDate(order.orderDate)}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {formatDate(order.expectedDate)}
                                                </td>
                                                <td className="px-4 py-3 text-foreground font-medium">
                                                    {item.quantityOrdered}
                                                    {item.rawMaterial?.unitOfMeasurement ? ` ${item.rawMaterial.unitOfMeasurement}` : ''}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <span className="text-xs text-foreground font-medium">
                                                            {item.totalReceived}/{item.quantityOrdered}
                                                        </span>
                                                        <div className="w-full max-w-[80px]">
                                                            <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-green-500' : 'bg-amber-500'}`}
                                                                    style={{ width: `${pct}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-foreground font-medium">
                                                    {formatQty(item.quantityOrdered - item.totalReceived)}
                                                    {item.rawMaterial?.unitOfMeasurement ? ` ${item.rawMaterial.unitOfMeasurement}` : ''}
                                                </td>
                                                <td className="px-4 py-3 text-foreground/80">
                                                    ₦{item.rate.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${stConfig.classes}`}>
                                                        {stConfig.icon}
                                                        {stConfig.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1">
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => {
                                                                setReceiveItem(item);
                                                                setShowReceiveModal(true);
                                                            }}
                                                            disabled={item.status === 'RECEIVED'}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${item.status === 'RECEIVED'
                                                                    ? 'bg-green-500/10 text-green-400 cursor-default'
                                                                    : item.status === 'PARTIALLY_RECEIVED'
                                                                        ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20'
                                                                        : 'bg-primary/8 text-primary hover:bg-primary/15 border border-primary/20'
                                                                }`}
                                                        >
                                                            {item.status === 'RECEIVED'
                                                                ? 'Received'
                                                                : item.status === 'PARTIALLY_RECEIVED'
                                                                    ? 'Add More'
                                                                    : 'Receive'}
                                                        </motion.button>
                                                        {item.receivals && item.receivals.length > 0 && (
                                                            <button
                                                                onClick={() => toggleExpanded(item.id)}
                                                                className="p-1.5 text-muted-foreground hover:text-primary rounded-lg hover:bg-muted/20 transition"
                                                                title="View receivals"
                                                            >
                                                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </motion.tr>

                                            {/* Expanded Receival History */}
                                            <AnimatePresence>
                                                {isExpanded && item.receivals && item.receivals.length > 0 && (
                                                    <motion.tr
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                    >
                                                        <td colSpan={11} className="px-4 py-3 bg-muted/5">
                                                            <div className="max-w-3xl">
                                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                                                    Receival History
                                                                </p>
                                                                <div className="overflow-x-auto">
                                                                    <table className="w-full text-sm">
                                                                        <thead>
                                                                            <tr className="text-left text-xs text-muted-foreground border-b border-border/20">
                                                                                <th className="px-3 py-2">Received Quantity</th>
                                                                                <th className="px-3 py-2">Location</th>
                                                                                <th className="px-3 py-2">Bags/Weight(No./KG)</th>
                                                                                <th className="px-3 py-2">Notes</th>
                                                                                <th className="px-3 py-2">Received Date</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-border">
                                                                            {item.receivals.map((r, ri) => (
                                                                                <tr key={r.id || ri} className="bg-muted/15">
                                                                                    <td className="px-3 py-3 text-sm font-medium">
                                                                                        {r.totalWeight}{item.rawMaterial?.unitOfMeasurement ? ` ${item.rawMaterial.unitOfMeasurement}` : ''}
                                                                                    </td>
                                                                                    <td className="px-3 py-3 text-sm text-foreground/80">{r.location?.name || r.warehouse?.name || '-'}</td>
                                                                                    <td className="px-3 py-3 text-sm text-muted-foreground">
                                                                                        {r.bags && r.bags.length > 0 ? (
                                                                                            <div className="flex flex-col gap-1">
                                                                                                <div className="text-xs font-medium">{r.bags.length} bag(s)</div>
                                                                                                <div className="flex gap-2 flex-wrap">
                                                                                                    {r.bags.map((b, bi) => (
                                                                                                        <span key={bi} className="px-2 py-0.5 bg-muted/20 rounded-full text-xs">
                                                                                                            {`${b.bagNo}: ${b.bagWeight}`}
                                                                                                        </span>
                                                                                                    ))}
                                                                                                </div>
                                                                                            </div>
                                                                                        ) : (
                                                                                            '-'
                                                                                        )}
                                                                                    </td>
                                                                                    <td className="px-3 py-3 text-sm text-muted-foreground">{r.notes || '-'}</td>
                                                                                    <td className="px-3 py-3 text-sm text-muted-foreground">{formatDate(r.receivedDate)}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                )}
                                            </AnimatePresence>
                                        </React.Fragment>
                                    );
                                })
                            )}
                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan={11} className="text-center py-12 text-muted-foreground">
                                        <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                        <p className="text-sm">No purchase orders found.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {orders.length > pageSize && (
                <div className="flex justify-end mt-4 px-2">
                    <Pagination
                        current={currentPage}
                        pageSize={pageSize}
                        total={orders.length}
                        onChange={(page) => setCurrentPage(page)}
                        showSizeChanger={false}
                    />
                </div>
            )}

            {/* Modals */}
            <ReceiveModal
                open={showReceiveModal}
                onClose={() => {
                    setShowReceiveModal(false);
                    setReceiveItem(null);
                }}
                onConfirm={handleReceiveConfirm}
                defaultQuantity={receiveItem?.quantityOrdered || 0}
                currentReceived={receiveItem?.totalReceived || 0}
                currentStatus={receiveItem?.status || 'PENDING'}
                itemId={receiveItem?.id}
                receivals={receiveItem?.receivals || []}
            />

            <EditOrderModal
                open={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                onSave={handleEditSave}
                defaultExpectedDate={
                    selectedOrder?.expectedDate
                        ? new Date(selectedOrder.expectedDate).toISOString().split('T')[0]
                        : ''
                }
            />

            <DeleteOrderModal
                open={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onDelete={handleDeleteConfirm}
                poNumber={selectedOrder?.poNumber || ''}
            />
        </div>
    );
};

export default PurchaseOrderList;
