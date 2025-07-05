"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import api, { API_ROUTES } from "../../../utils/api"

type PurchaseOrder = {
  id: string
  orderNumber: string
  orderDate: string
  vendor: { id: string; name: string }
  totalQuantity: number
  receivedQuantity: number
  status: string
}

type TimelineEvent = {
  type: string
  date: string
  details: string
}

type PurchaseOrderTimeline = {
  purchaseOrder: PurchaseOrder & { items: any[] }
  events: TimelineEvent[]
}

interface Props {
  onClose: () => void
  rawMaterialId: string | null
  rawMaterialName: string | null
}

const ProductPurchaseOrdersView: React.FC<Props> = ({ onClose, rawMaterialId, rawMaterialName }) => {
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null)
  const [timeline, setTimeline] = useState<PurchaseOrderTimeline | null>(null)
  const [timelineLoading, setTimelineLoading] = useState(false)

  useEffect(() => {
    if (rawMaterialId) {
      setLoading(true)
      setSelectedOrder(null)
      setTimeline(null)
      api
        .get(API_ROUTES.RAW.GET_PURCHASE_ORDERS_BY_PRODUCT(rawMaterialId), {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        })
        .then((res) => setOrders(res.data))
        .catch(() => setOrders([]))
        .finally(() => setLoading(false))
    }
  }, [rawMaterialId])

  const handleOrderClick = (order: PurchaseOrder) => {
    setSelectedOrder(order)
    setTimelineLoading(true)
    api
      .get(API_ROUTES.RAW.GET_PURCHASE_ORDER_TIMELINE(order.id), {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      })
      .then((res) => setTimeline(res.data))
      .catch(() => setTimeline(null))
      .finally(() => setTimelineLoading(false))
  }

  const handleBack = () => {
    setSelectedOrder(null)
    setTimeline(null)
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case "ORDER_PLACED":
        return "bg-blue-600 text-white"
      case "RECEIVED":
        return "bg-green-500 text-white"
      case "CLEANING":
      case "CLEANING_STARTED":
        return "bg-orange-500 text-white"
      case "CLEANED":
        return "bg-teal-500 text-white"
      case "PROCESSING":
      case "PROCESSING_STARTED":
        return "bg-purple-600 text-white"
      case "PROCESSED":
        return "bg-pink-500 text-white"
      case "FINISHED_GOOD":
        return "bg-yellow-500 text-white"
      default:
        return "bg-gray-400 text-white"
    }
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case "ORDER_PLACED":
        return "📋"
      case "RECEIVED":
        return "📦"
      case "CLEANING":
      case "CLEANING_STARTED":
        return "🧽"
      case "CLEANED":
        return "✨"
      case "PROCESSING":
      case "PROCESSING_STARTED":
        return "⚙️"
      case "PROCESSED":
        return "🔧"
      case "FINISHED_GOOD":
        return "✅"
      default:
        return "⭕"
    }
  }

  const SnakeTimeline = ({ events }: { events: TimelineEvent[] }) => {
    const timelineHeight = 320;
    return (
      <div className="relative w-full overflow-x-auto py-8">
      <div className="min-w-max px-8" style={{ position: "relative", height: `${timelineHeight}px` }}>
          {/* Snake Path SVG */}
           <svg
          className="absolute inset-0 pointer-events-none"
          width={events.length * 280}
          height={timelineHeight}
          style={{ minWidth: `${events.length * 280}px`, height: `${timelineHeight}px` }}
        >
            <defs>
              <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#1d4ed8" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            <motion.path
              d={`M 40 120 ${events
                .map((_, index) => {
                  const x = 40 + index * 280
                  const y = index % 2 === 0 ? 120 : 200
                  return `L ${x} ${y}`
                })
                .join(" ")}`}
              stroke="url(#pathGradient)"
              strokeWidth="3"
              fill="none"
              strokeDasharray="8,4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
          </svg>

          {/* Timeline Events */}
          <div className="relative flex" style={{ minWidth: `${events.length * 280}px` }}>
            {events.map((event, index) => {
              const isEven = index % 2 === 0
              const yPosition = isEven ? "top-16" : "top-32"

              return (
                <motion.div
                  key={index}
                  className={`absolute ${yPosition}`}
                  style={{ left: `${index * 280}px` }}
                  initial={{ opacity: 0, y: isEven ? -20 : 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2, duration: 0.6 }}
                >
                  {/* Event Card */}
                  <motion.div
                    className="relative bg-white rounded-xl shadow-lg border border-gray-100 p-4 w-64"
                    whileHover={{ scale: 1.05, y: -5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {/* Arrow pointing to timeline */}
                    <div
                      className={`absolute ${
                        isEven ? "bottom-[-8px]" : "top-[-8px]"
                      } left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-transparent ${
                        isEven ? "border-t-8 border-t-white" : "border-b-8 border-b-white"
                      }`}
                    />

                    {/* Event Icon */}
                    <motion.div
                      className={`w-12 h-12 rounded-full ${getEventColor(event.type)} flex items-center justify-center text-lg mb-3 mx-auto`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.2 + 0.3, type: "spring", stiffness: 400 }}
                    >
                      {getEventIcon(event.type)}
                    </motion.div>

                    {/* Event Content */}
                    <div className="text-center">
                      <h4 className="font-semibold text-gray-800 text-sm mb-2">{event.type.replace(/_/g, " ")}</h4>
                      <p className="text-xs text-gray-600 mb-3 leading-relaxed">{event.details}</p>
                      <div className="text-xs text-gray-500">
                        <div className="font-medium">{new Date(event.date).toLocaleDateString()}</div>
                        <div>{new Date(event.date).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Timeline Node */}
                  <motion.div
                    className={`absolute ${
                      isEven ? "top-full mt-2" : "bottom-full mb-2"
                    } left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow-lg z-10`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.2 + 0.5, type: "spring", stiffness: 400 }}
                  />
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8 flex items-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.button
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mr-6 font-medium shadow-md"
            onClick={onClose}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ← Back to Stock Heatmap
          </motion.button>
          <h2 className="text-3xl font-bold text-gray-800">
            {selectedOrder ? `Timeline: ${selectedOrder.orderNumber}` : `Purchase Orders for ${rawMaterialName}`}
          </h2>
        </motion.div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              className="flex justify-center py-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-blue-400 rounded-full animate-spin animation-delay-150"></div>
              </div>
            </motion.div>
          ) : !selectedOrder ? (
            <motion.div
              key="orders-list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              {orders.length === 0 ? (
                <motion.div
                  className="text-center py-20"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No Purchase Orders Found</h3>
                  <p className="text-gray-500">There are no purchase orders for this raw material.</p>
                </motion.div>
              ) : (
                <div className="grid gap-6">
                  {orders.map((order, index) => (
                    <motion.div
                      key={order.id}
                      className="bg-white rounded-xl shadow-md border border-gray-100 p-6 cursor-pointer hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-600"
                      onClick={() => handleOrderClick(order)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-800 mb-4">{order.orderNumber}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Vendor:</span>
                              <p className="text-gray-600 mt-1">{order.vendor.name}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Quantity:</span>
                              <p className="text-gray-600 mt-1">
                                Ordered: {order.totalQuantity} | Received: {order.receivedQuantity}
                              </p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Date:</span>
                              <p className="text-gray-600 mt-1">{new Date(order.orderDate).toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                        <div className="ml-6">
                          <span
                            className={`px-4 py-2 rounded-full text-sm font-medium ${
                              order.status === "COMPLETED"
                                ? "bg-green-100 text-green-800"
                                : order.status === "PENDING"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : timelineLoading ? (
            <motion.div
              key="timeline-loading"
              className="flex justify-center py-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-blue-400 rounded-full animate-spin animation-delay-150"></div>
              </div>
            </motion.div>
          ) : timeline ? (
            <motion.div
              key="timeline-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              {/* Order Summary Card */}
              <motion.div
                className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 mb-8 border border-blue-200"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div>
                      <span className="font-semibold text-gray-700">Vendor: </span>
                      <span className="text-gray-900">{timeline.purchaseOrder.vendor.name}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Ordered: </span>
                      <span className="text-gray-900">{timeline.purchaseOrder.totalQuantity}</span>
                      <span className="font-semibold text-gray-700"> | Received: </span>
                      <span className="text-gray-900">{timeline.purchaseOrder.receivedQuantity}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="font-semibold text-gray-700">Date: </span>
                      <span className="text-gray-900">
                        {new Date(timeline.purchaseOrder.orderDate).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Status: </span>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          timeline.purchaseOrder.status === "COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : timeline.purchaseOrder.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {timeline.purchaseOrder.status}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Snake Timeline */}
              <motion.div
                className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <h3 className="text-2xl font-bold mb-8 text-gray-800 text-center">Order Timeline</h3>
                <SnakeTimeline events={timeline.events} />
              </motion.div>

              {/* Back Button */}
              <motion.div
                className="flex justify-end"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <motion.button
                  className="px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium shadow-md"
                  onClick={handleBack}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Back to Orders
                </motion.button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="no-timeline"
              className="text-center py-20"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Timeline Data</h3>
              <p className="text-gray-500">Timeline information is not available for this order.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default ProductPurchaseOrdersView
