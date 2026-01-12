import React, { useEffect, useState } from 'react';
import api, { API_ROUTES } from '../../../utils/api';
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  TrendingUp,
  Package,
  AlertCircle,
  ChevronRight,
  ChevronUp,
  Hash,
  Calendar as CalendarIcon,
  User2,
  Boxes,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReceiveModal, {
  DeleteOrderModal,
  EditOrderModal,
} from '../../ui/Order/statusModal';
import { useNavigate } from 'react-router-dom';

type Vendor = {
  id: string;
  name: string;
};

type PurchaseOrderItem = {
  id: string;
  rawMaterialId: string;
  quantityOrdered: number;
  rate: number;
  status: string;
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

type RawMaterial = {
  id: string;
  skuCode: string;
  name: string;
  unitOfMeasurement?: string; // <-- updated to match API
  unit?: string; // fallback for older data
};

const ITEM_STATUS_OPTIONS = ['Pending', 'Received', 'Cancelled'];

const statusColors: Record<string, string> = {
  Created: 'bg-muted text-foreground border-border',
  Approved: 'bg-primary/10 text-primary border-primary/20',
  Received: 'bg-accent text-foreground border-border',
  Cancelled: 'bg-destructive/10 text-destructive border-destructive/30',
  Pending: 'bg-muted text-foreground border-border',
};

const statusIcons: Record<string, React.ReactNode> = {
  Created: <Clock className="w-4 h-4 mr-1" />,
  Approved: <CheckCircle className="w-4 h-4 mr-1" />,
  Received: <FileText className="w-4 h-4 mr-1" />,
  Cancelled: <XCircle className="w-4 h-4 mr-1" />,
  Pending: <AlertCircle className="w-4 h-4 mr-1" />,
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
};

const calculateDaysToDeliver = (orderDate: string, expectedDate: string) => {
  if (!orderDate || !expectedDate) return 'N/A';
  try {
    const order = new Date(orderDate);
    const expected = new Date(expectedDate);

    // Check if dates are valid
    if (isNaN(order.getTime()) || isNaN(expected.getTime())) return 'N/A';

    const diffTime = Math.abs(expected.getTime() - order.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} days`;
  } catch (error) {
    return 'N/A';
  }
};

const PurchaseOrderList: React.FC = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [, setLoading] = useState(false);
  const [] = useState<string | null>(null);
  const [expandedOrderIds, setExpandedOrderIds] = useState<string[]>([]);
  const [itemUpdatingId, setItemUpdatingId] = useState<string | null>(null);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receiveItemId, setReceiveItemId] = useState<string | null>(null);
  const [receiveDefaultQty, setReceiveDefaultQty] = useState<number>(0);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(
    null
  );
  const navigate = useNavigate();
  // Cache for raw material details
  const [rawMaterialCache, setRawMaterialCache] = useState<
    Record<string, RawMaterial | null>
  >({});

  useEffect(() => {
    fetchOrders();
  }, []);

  // Fetch raw material details for all items in expanded orders
  useEffect(() => {
    const fetchRawMaterials = async () => {
      const idsToFetch = new Set<string>();
      expandedOrderIds.forEach((orderId) => {
        const order = orders.find((o) => o.id === orderId);
        order?.items.forEach((item) => {
          if (!(item.rawMaterialId in rawMaterialCache)) {
            idsToFetch.add(item.rawMaterialId);
          }
        });
      });
      if (idsToFetch.size === 0) return;
      const newCache: Record<string, RawMaterial | null> = {};
      const authToken = localStorage.getItem('authToken');
      await Promise.all(
        Array.from(idsToFetch).map(async (id) => {
          try {
            const res = await api.get(API_ROUTES.RAW.GET_PRODUCT_BY_ID(id), {
              headers: { Authorization: `Bearer ${authToken}` },
            });
            newCache[id] = res.data;
          } catch {
            newCache[id] = null;
          }
        })
      );
      setRawMaterialCache((prev) => ({ ...prev, ...newCache }));
    };
    if (expandedOrderIds.length > 0) fetchRawMaterials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedOrderIds, orders]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const authToken = localStorage.getItem('authToken');
      const res = await api.get(API_ROUTES.RAW.GET_PURCHASE_ORDERS, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setOrders(res.data);
    } catch {
      // handle error
    }
    setLoading(false);
  };

  // Item-level status change
  const handleItemStatusChange = async (itemId: string, status: string) => {
    if (status === 'Received') {
      // Find the item to get default quantity
      const orderItem = orders
        .flatMap((o) => o.items)
        .find((i) => i.id === itemId);
      setReceiveItemId(itemId);
      setReceiveDefaultQty(orderItem?.quantityOrdered || 0);
      setShowReceiveModal(true);
      return;
    }
    setItemUpdatingId(itemId);
    try {
      const authToken = localStorage.getItem('authToken');
      await api.put(
        API_ROUTES.RAW.UPDATE_PURCHASE_ORDER_ITEM(itemId),
        { status },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      setOrders((prev) =>
        prev.map((order) => ({
          ...order,
          items: order.items.map((item) =>
            item.id === itemId ? { ...item, status } : item
          ),
        }))
      );
    } catch {
      // handle error
    }
    setItemUpdatingId(null);
  };

  const handleReceiveConfirm = async (
    warehouseId: string,
    quantity: number
  ) => {
    if (!receiveItemId) return;
    setItemUpdatingId(receiveItemId);
    try {
      const authToken = localStorage.getItem('authToken');
      await api.put(
        API_ROUTES.RAW.UPDATE_PURCHASE_ORDER_ITEM(receiveItemId),
        {
          status: 'Received',
          warehouseId,
          quantityReceived: quantity,
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      setOrders((prev) =>
        prev.map((order) => ({
          ...order,
          items: order.items.map((item) =>
            item.id === receiveItemId
              ? { ...item, status: 'Received', quantityReceived: quantity }
              : item
          ),
        }))
      );
    } catch {
      // handle error
    }
    setItemUpdatingId(null);
    setShowReceiveModal(false);
    setReceiveItemId(null);
    setReceiveDefaultQty(0);
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrderIds((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleEditSave = async ({ expectedDate }: { expectedDate: string }) => {
    if (!selectedOrder) return;
    try {
      const authToken = localStorage.getItem('authToken');
      await api.put(
        API_ROUTES.RAW.UPDATE_PURCHASE_ORDER(selectedOrder.id),
        { expectedDate },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      setOrders((prev) =>
        prev.map((o) =>
          o.id === selectedOrder.id ? { ...o, expectedDate } : o
        )
      );
      setEditModalOpen(false);
      setSelectedOrder(null);
    } catch {
      // handle error
    }
  };

  // Delete handler
  const handleDeleteConfirm = async () => {
    if (!selectedOrder) return;
    try {
      const authToken = localStorage.getItem('authToken');
      await api.delete(API_ROUTES.RAW.UPDATE_PURCHASE_ORDER(selectedOrder.id), {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setOrders((prev) => prev.filter((o) => o.id !== selectedOrder.id));
      setDeleteModalOpen(false);
      setSelectedOrder(null);
    } catch {
      // handle error
    }
  };

  // Stats for header
  const totalOrders = orders.length;
  const receivedOrders = orders.filter((o) =>
    o.items.some((item) => item.status === 'Received')
  ).length;
  const cancelledOrders = orders.filter((o) => o.status === 'Cancelled').length;

  return (
    <motion.div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          className="bg-card rounded-2xl border border-border overflow-hidden"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-xl">
                <Package className="text-primary-foreground" size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Purchase Orders
                </h1>
                <p className="text-muted-foreground text-sm">
                  View and manage all purchase orders with status update options
                </p>
              </div>
              <div className="ml-auto">
                <button
                  className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
                  onClick={() => navigate('/raw/purchase-order')}
                >
                  + Create New Order
                </button>
              </div>
            </div>
          </div>
          {/* Unified Stats + Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              {/* Stats Row */}
              <thead>
                <tr>
                  <th colSpan={6} className="p-0 border-b-0">
                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-4 p-4 bg-muted/50">
                      <div className="bg-card rounded-xl p-4 border border-border">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Total Orders
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                          {totalOrders}
                        </p>
                        <div className="flex items-center mt-1">
                          <TrendingUp size={12} className="text-primary mr-1" />
                          <span className="text-xs text-primary font-medium">
                            All records
                          </span>
                        </div>
                      </div>

                      <div className="bg-card rounded-xl p-4 border border-border">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Received
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                          {receivedOrders}
                        </p>
                        <div className="flex items-center mt-1">
                          <FileText
                            size={12}
                            className="text-foreground mr-1"
                          />
                          <span className="text-xs text-foreground/80 font-medium">
                            Received
                          </span>
                        </div>
                      </div>
                      <div className="bg-card rounded-xl p-4 border border-border">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Cancelled
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                          {cancelledOrders}
                        </p>
                        <div className="flex items-center mt-1">
                          <XCircle
                            size={12}
                            className="text-destructive mr-1"
                          />
                          <span className="text-xs text-destructive font-medium">
                            Cancelled
                          </span>
                        </div>
                      </div>
                    </div>
                  </th>
                </tr>
                <tr className="bg-muted/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"></th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <div className="inline-flex items-center gap-2">
                      <Hash className="w-3.5 h-3.5" />
                      PO Number
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <div className="inline-flex items-center gap-2">
                      <User2 className="w-3.5 h-3.5" />
                      Vendor
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <div className="inline-flex items-center gap-2">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      Order Date
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <div className="inline-flex items-center gap-2">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      Expected Date
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <div className="inline-flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      Days to Deliver
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <div className="inline-flex items-center gap-2 justify-center">
                      <Boxes className="w-3.5 h-3.5" />
                      Items Ordered
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {orders.map((order, index) => (
                  <React.Fragment key={order.id}>
                    <motion.tr
                      className="hover:bg-muted/50 transition-colors duration-150"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <td className="px-2 py-4 whitespace-nowrap text-center">
                        <motion.button
                          className="p-2 rounded-lg hover:bg-primary/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 active:scale-95"
                          onClick={() => toggleExpand(order.id)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          aria-label={
                            expandedOrderIds.includes(order.id)
                              ? 'Collapse'
                              : 'Expand'
                          }
                        >
                          {expandedOrderIds.includes(order.id) ? (
                            <ChevronUp className="w-5 h-5 text-primary transition-colors duration-200" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-primary transition-colors duration-200" />
                          )}
                        </motion.button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                        {order.poNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground/80">
                        {order.vendor?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground/80">
                        {formatDate(order.orderDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground/80">
                        {formatDate(order.expectedDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground/80 font-medium">
                        {calculateDaysToDeliver(order.orderDate, order.expectedDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-primary">
                        {order.items.length}
                      </td>
                    </motion.tr>
                    {/* Expanded items row */}
                    <AnimatePresence>
                      {expandedOrderIds.includes(order.id) && (
                        <motion.tr
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="bg-gradient-to-b from-primary/5 to-transparent border-t-2 border-primary/20"
                        >
                          <td colSpan={7} className="px-6 py-6">
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.1 }}
                            >
                              <div className="mb-4">
                                <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                                  <Package className="w-5 h-5 text-primary" />
                                  Order Items ({order.items.length})
                                </h3>
                              </div>
                              <div className="rounded-lg border border-primary/20 bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <table className="w-full">
                                  <thead>
                                    <tr className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20">
                                      <th className="px-6 py-4 text-xs font-bold text-primary uppercase tracking-wider text-left">
                                        SKU Code
                                      </th>
                                      <th className="px-6 py-4 text-xs font-bold text-primary uppercase tracking-wider text-left">
                                        Product Name
                                      </th>
                                      <th className="px-6 py-4 text-xs font-bold text-primary uppercase tracking-wider text-left">
                                        Unit
                                      </th>
                                      <th className="px-6 py-4 text-xs font-bold text-primary uppercase tracking-wider text-right">
                                        Quantity
                                      </th>
                                      <th className="px-6 py-4 text-xs font-bold text-primary uppercase tracking-wider text-right">
                                        Rate
                                      </th>
                                      <th className="px-6 py-4 text-xs font-bold text-primary uppercase tracking-wider text-center">
                                        Status
                                      </th>
                                      <th className="px-6 py-4 text-xs font-bold text-primary uppercase tracking-wider text-center">
                                        Update
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border/50">
                                    {order.items.map((item, itemIndex) => {
                                      const raw =
                                        rawMaterialCache[item.rawMaterialId];
                                      return (
                                        <motion.tr
                                          key={item.id}
                                          initial={{ opacity: 0, x: -20 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{ delay: itemIndex * 0.05 }}
                                          className="hover:bg-primary/5 transition-colors duration-200"
                                        >
                                          <td className="px-6 py-4 text-sm font-mono text-foreground font-medium">
                                            {raw ? (
                                              <span className="bg-primary/10 text-primary px-3 py-1 rounded-md">
                                                {raw.skuCode}
                                              </span>
                                            ) : (
                                              <span className="text-muted-foreground italic">
                                                Loading...
                                              </span>
                                            )}
                                          </td>
                                          <td className="px-6 py-4 text-sm text-foreground">
                                            {raw ? (
                                              <span className="font-medium">{raw.name}</span>
                                            ) : (
                                              <span className="text-muted-foreground italic">
                                                Loading...
                                              </span>
                                            )}
                                          </td>
                                          <td className="px-6 py-4 text-sm text-foreground/80">
                                            {raw ? (
                                              raw.unitOfMeasurement ||
                                              raw.unit || (
                                                <span className="text-muted-foreground italic">
                                                  N/A
                                                </span>
                                              )
                                            ) : (
                                              <span className="text-muted-foreground italic">
                                                Loading...
                                              </span>
                                            )}
                                          </td>
                                          <td className="px-6 py-4 text-sm text-foreground text-right font-semibold">
                                            {item.quantityOrdered}
                                          </td>
                                          <td className="px-6 py-4 text-sm text-right font-semibold text-primary">
                                            {item.rate}
                                          </td>
                                          <td className="px-6 py-4 text-center">
                                            <span
                                              className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${statusColors[item.status] || 'bg-muted text-foreground border-border'}`}
                                            >
                                              {statusIcons[item.status] || null}
                                              {item.status}
                                            </span>
                                          </td>
                                          <td className="px-6 py-4 text-center">
                                            <div className="relative group inline-block">
                                              <select
                                                className={`border-2 border-primary/30 rounded-lg px-3 py-2 text-xs bg-background focus:border-primary focus:ring-2 focus:ring-primary/30 font-medium transition-all hover:border-primary/50 ${item.status === 'Received'
                                                  ? 'opacity-50 cursor-not-allowed'
                                                  : 'cursor-pointer'
                                                  }`}
                                                value={item.status}
                                                disabled={
                                                  itemUpdatingId === item.id ||
                                                  item.status === 'Received'
                                                }
                                                onChange={(e) =>
                                                  handleItemStatusChange(
                                                    item.id,
                                                    e.target.value
                                                  )
                                                }
                                              >
                                                {ITEM_STATUS_OPTIONS.map(
                                                  (status) => (
                                                    <option
                                                      key={status}
                                                      value={status}
                                                    >
                                                      {status}
                                                    </option>
                                                  )
                                                )}
                                              </select>
                                              {item.status === 'Received' && (
                                                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 bg-foreground text-background text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity duration-200 font-medium shadow-lg">
                                                  After receiving, you can't
                                                  update status
                                                </div>
                                              )}
                                            </div>
                                          </td>
                                        </motion.tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </motion.div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
      <ReceiveModal
        open={showReceiveModal}
        onClose={() => setShowReceiveModal(false)}
        onConfirm={handleReceiveConfirm}
        defaultQuantity={receiveDefaultQty}
      />
      <EditOrderModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleEditSave}
        defaultExpectedDate={selectedOrder?.expectedDate?.slice(0, 10) || ''}
      />
      <DeleteOrderModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onDelete={handleDeleteConfirm}
        poNumber={selectedOrder?.poNumber || ''}
      />
    </motion.div>
  );
};

export default PurchaseOrderList;
