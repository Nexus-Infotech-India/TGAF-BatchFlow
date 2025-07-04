import React, { useEffect, useState } from "react";
import api, { API_ROUTES } from "../../../utils/api";
import {
  CheckCircle, XCircle, Clock, FileText, TrendingUp, Package, AlertCircle, ChevronRight, ChevronUp, Edit2, Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReceiveModal from "../../ui/Order/statusModal";
import { useNavigate } from "react-router-dom";

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

const ITEM_STATUS_OPTIONS = ["Pending", "Received", "Cancelled"];

const statusColors: Record<string, string> = {
  Created: "bg-blue-50 text-blue-700 border-blue-200",
  Approved: "bg-green-50 text-green-700 border-green-200",
  Received: "bg-purple-50 text-purple-700 border-purple-200",
  Cancelled: "bg-red-50 text-red-700 border-red-200",
  Pending: "bg-yellow-50 text-yellow-700 border-yellow-200"
};

const statusIcons: Record<string, React.ReactNode> = {
  Created: <Clock className="w-4 h-4 mr-1" />,
  Approved: <CheckCircle className="w-4 h-4 mr-1" />,
  Received: <FileText className="w-4 h-4 mr-1" />,
  Cancelled: <XCircle className="w-4 h-4 mr-1" />,
  Pending: <AlertCircle className="w-4 h-4 mr-1" />
};

const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString();
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
  const navigate = useNavigate();
  // Cache for raw material details
  const [rawMaterialCache, setRawMaterialCache] = useState<Record<string, RawMaterial | null>>({});

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
  if (status === "Received") {
    // Find the item to get default quantity
    const orderItem = orders.flatMap(o => o.items).find(i => i.id === itemId);
    setReceiveItemId(itemId);
    setReceiveDefaultQty(orderItem?.quantityOrdered || 0);
    setShowReceiveModal(true);
    return;
  }
  setItemUpdatingId(itemId);
  try {
    const authToken = localStorage.getItem('authToken');
    await api.put(API_ROUTES.RAW.UPDATE_PURCHASE_ORDER_ITEM(itemId), { status }, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
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

  const handleReceiveConfirm = async (warehouseId: string, quantity: number) => {
  if (!receiveItemId) return;
  setItemUpdatingId(receiveItemId);
  try {
    const authToken = localStorage.getItem('authToken');
    await api.put(API_ROUTES.RAW.UPDATE_PURCHASE_ORDER_ITEM(receiveItemId), {
      status: "Received",
      warehouseId,
      quantityReceived: quantity,
    }, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    setOrders((prev) =>
      prev.map((order) => ({
        ...order,
        items: order.items.map((item) =>
          item.id === receiveItemId
            ? { ...item, status: "Received", quantityReceived: quantity }
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

  // Stats for header
  const totalOrders = orders.length;
  const approvedOrders = orders.filter((o) => o.status === "Approved").length;
  const receivedOrders = orders.filter((o) => o.status === "Received").length;
  const cancelledOrders = orders.filter((o) => o.status === "Cancelled").length;

  return (
    <motion.div className="min-h-screen ">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Package className="text-blue-600" size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
                <p className="text-gray-600 text-sm mt-0.5">
                  View and manage all purchase orders with status update options
                </p>
              </div>
              <div className="ml-auto">
                <button
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
                  onClick={() => navigate("/raw/purchase-order")}
                >
                  + Create New Order
                </button>
              </div>
            </div>
          </div>
          {/* Unified Stats + Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              {/* Stats Row */}
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-blue-50">
                  <th colSpan={6} className="p-0 border-b-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
                      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                        <p className="text-xs font-medium text-gray-600 mb-1">Total Orders</p>
                        <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
                        <div className="flex items-center mt-1">
                          <TrendingUp size={10} className="text-blue-500 mr-1" />
                          <span className="text-xs text-blue-600 font-medium">All records</span>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                        <p className="text-xs font-medium text-gray-600 mb-1">Approved</p>
                        <p className="text-2xl font-bold text-gray-900">{approvedOrders}</p>
                        <div className="flex items-center mt-1">
                          <CheckCircle size={10} className="text-green-500 mr-1" />
                          <span className="text-xs text-green-600 font-medium">Completed</span>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                        <p className="text-xs font-medium text-gray-600 mb-1">Received</p>
                        <p className="text-2xl font-bold text-gray-900">{receivedOrders}</p>
                        <div className="flex items-center mt-1">
                          <FileText size={10} className="text-purple-500 mr-1" />
                          <span className="text-xs text-purple-600 font-medium">Received</span>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                        <p className="text-xs font-medium text-gray-600 mb-1">Cancelled</p>
                        <p className="text-2xl font-bold text-gray-900">{cancelledOrders}</p>
                        <div className="flex items-center mt-1">
                          <XCircle size={10} className="text-red-500 mr-1" />
                          <span className="text-xs text-red-600 font-medium">Cancelled</span>
                        </div>
                      </div>
                    </div>
                  </th>
                </tr>
                <tr className="bg-gradient-to-r from-gray-50 to-blue-50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"></th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    PO Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Order Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Expected Date
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order, index) => (
                  <React.Fragment key={order.id}>
                    <motion.tr
                      className="hover:bg-gray-50 transition-colors duration-150"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <td className="px-2 py-4 whitespace-nowrap text-center">
                        <button
                          className="focus:outline-none"
                          onClick={() => toggleExpand(order.id)}
                          aria-label={expandedOrderIds.includes(order.id) ? "Collapse" : "Expand"}
                        >
                          {expandedOrderIds.includes(order.id) ? (
                            <ChevronUp className="w-5 h-5 text-gray-500 cursor-pointer" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-500 cursor-pointer" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.poNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {order.vendor?.name || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(order.orderDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(order.expectedDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="inline-flex items-center gap-2">
                          <button
                            className="p-1 rounded hover:bg-blue-100 text-blue-600"
                            title="Edit"
                            // onClick={() => handleEdit(order.id)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1 rounded hover:bg-red-100 text-red-600"
                            title="Delete"
                            // onClick={() => handleDelete(order.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                    {/* Expanded items row */}
                    <AnimatePresence>
                      {expandedOrderIds.includes(order.id) && (
                        <motion.tr
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="bg-gray-50"
                        >
                          <td colSpan={6} className="px-10 py-4">
                            <div>
                              <div className="mb-2 font-semibold text-gray-700 text-lg">Order Items</div>
                              <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead>
                                    <tr className="bg-gradient-to-r from-blue-50 to-indigo-50">
                                      <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-left">SKU Code</th>
                                      <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-left">Name</th>
                                      <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-left">Unit</th>
                                      <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-right">Quantity Ordered</th>
                                      <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-right">Rate</th>
                                      <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-center">Status</th>
                                      <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-center">Change Status</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {order.items.map((item) => {
                                      const raw = rawMaterialCache[item.rawMaterialId];
                                      return (
                                        <tr key={item.id} className="hover:bg-blue-50 transition">
                                          <td className="px-4 py-2 text-sm text-gray-900 font-mono">
                                            {raw ? raw.skuCode : <span className="text-gray-400 italic">Loading...</span>}
                                          </td>
                                          <td className="px-4 py-2 text-sm text-gray-900">
                                            {raw ? raw.name : <span className="text-gray-400 italic">Loading...</span>}
                                          </td>
                                         <td className="px-4 py-2 text-sm text-gray-900">
                                            {raw
                                              ? raw.unitOfMeasurement || raw.unit || <span className="text-gray-400 italic">N/A</span>
                                              : <span className="text-gray-400 italic">Loading...</span>}
                                          </td>
                                          <td className="px-4 py-2 text-sm text-gray-900 text-right">
                                            {item.quantityOrdered}
                                          </td>
                                          <td className="px-4 py-2 text-sm text-gray-900 text-right">
                                            {item.rate}
                                          </td>
                                          <td className="px-4 py-2 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[item.status] || "bg-gray-50 text-gray-700 border-gray-200"}`}>
                                              {statusIcons[item.status] || null}
                                              {item.status}
                                            </span>
                                          </td>
                                          <td className="px-4 py-2 text-center">
                                            <select
                                              className="border rounded px-2 py-1 text-xs cursor-pointer focus:ring-2 focus:ring-blue-200"
                                              value={item.status}
                                              disabled={itemUpdatingId === item.id}
                                              onChange={(e) =>
                                                handleItemStatusChange(item.id, e.target.value)
                                              }
                                            >
                                              {ITEM_STATUS_OPTIONS.map((status) => (
                                                <option key={status} value={status}>
                                                  {status}
                                                </option>
                                              ))}
                                            </select>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
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
    </motion.div>
  );
};

export default PurchaseOrderList;