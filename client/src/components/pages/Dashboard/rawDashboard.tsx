"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  Package,
  Truck,
  Search,
  Settings,
  AlertTriangle,
  Recycle,
  TrendingUp,
  Eye,
  Loader2,
  Warehouse,
  Factory,
} from "lucide-react"
import api, { API_ROUTES } from "../../../utils/api"

interface LowStockAlert {
  skuCode: string
  name: string
  available: number
  minReorderLevel: number
  details: any[]
}

interface WasteStock {
  afterCleaning: {
    total: number
    details: any[]
  }
  afterProcessing: {
    total: number
    details: any[]
  }
  total: number
}

const RawDashboard: React.FC = () => {
  const [totalStock, setTotalStock] = useState<number>(0)
  const [totalStockDetails, setTotalStockDetails] = useState<any[]>([])
  const [pendingPOs, setPendingPOs] = useState<number>(0)
  const [pendingPODetails, setPendingPODetails] = useState<any[]>([])
  const [stockUnderCleaning, setStockUnderCleaning] = useState<number>(0)
  const [cleaningDetails, setCleaningDetails] = useState<any[]>([])
  const [stockInProcessing, setStockInProcessing] = useState<number>(0)
  const [processingDetails, setProcessingDetails] = useState<any[]>([])
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([])
  const [wasteStock, setWasteStock] = useState<WasteStock>({
    afterCleaning: { total: 0, details: [] },
    afterProcessing: { total: 0, details: [] },
    total: 0,
  })
  const [loading, setLoading] = useState(true)

  const authToken = localStorage.getItem("authToken")

  useEffect(() => {
    setLoading(true)
    const headers = { Authorization: `Bearer ${authToken}` }

    Promise.all([
      api.get(API_ROUTES.RAW.GET_TOTAL_RAW_MATERIAL_STOCK, { headers }),
      api.get(API_ROUTES.RAW.GET_PENDING_PO_COUNT, { headers }),
      api.get(API_ROUTES.RAW.GET_STOCK_UNDER_CLEANING, { headers }),
      api.get(API_ROUTES.RAW.GET_STOCK_IN_PROCESSING, { headers }),
      api.get(API_ROUTES.RAW.GET_LOW_STOCK_ALERTS, { headers }),
      api.get(API_ROUTES.RAW.GET_WASTE_STOCK, { headers }),
    ])
      .then((responses) => {
        const [totalStockRes, pendingPOsRes, cleaningRes, processingRes, lowStockRes, wasteRes] = responses
        setTotalStock(totalStockRes.data.totalRawMaterialStock || 0)
        setTotalStockDetails(totalStockRes.data.details || [])
        setPendingPOs(pendingPOsRes.data.pendingPOs || 0)
        setPendingPODetails(pendingPOsRes.data.details || [])
        setStockUnderCleaning(cleaningRes.data.stockUnderCleaning || 0)
        setCleaningDetails(cleaningRes.data.details || [])
        setStockInProcessing(processingRes.data.stockInProcessing || 0)
        setProcessingDetails(processingRes.data.details || [])
        setLowStockAlerts(lowStockRes.data.lowStockAlerts || [])
        setWasteStock(
          wasteRes.data.wasteStock || {
            afterCleaning: { total: 0, details: [] },
            afterProcessing: { total: 0, details: [] },
            total: 0,
          },
        )
      })
      .finally(() => setLoading(false))
  }, [authToken])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white shadow-sm border-b border-gray-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Factory className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Raw Material Dashboard</h1>
                <p className="text-gray-600">Monitor your inventory and operations</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <TrendingUp className="h-4 w-4" />
              <span>Real-time data</span>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8"
        >
          <StatCard
            icon={<Package className="h-6 w-6" />}
            label="Total Raw Material Stock"
            value={totalStock}
            unit="kg/litre"
            color="blue"
            details={totalStockDetails}
            detailsFormatter={(details) =>
              details.map(
                (s) =>
                  `${s.rawMaterial?.name || ""} (${s.rawMaterial?.skuCode || ""}): ${s.currentQuantity} in ${s.warehouse?.name || ""}`,
              )
            }
          />

          <StatCard
            icon={<Truck className="h-6 w-6" />}
            label="POs Pending Delivery"
            value={pendingPOs}
            unit="orders"
            color="orange"
            details={pendingPODetails}
            detailsFormatter={(details) =>
              details.map((po) => `PO#${po.id} (${po.vendor?.name || ""}): ${po.items?.length || 0} items`)
            }
          />

          <StatCard
            icon={<Search className="h-6 w-6" />}
            label="Stock Under Cleaning"
            value={stockUnderCleaning}
            unit="kg/litre"
            color="purple"
            details={cleaningDetails}
            detailsFormatter={(details) =>
              details.map((c) => `${c.rawMaterial?.name || ""}: ${c.quantity} (${c.status})`)
            }
          />

          <StatCard
            icon={<Settings className="h-6 w-6" />}
            label="In Processing"
            value={stockInProcessing}
            unit="kg/litre"
            color="green"
            details={processingDetails}
            detailsFormatter={(details) =>
              details.map((p) => `${p.inputRawMaterial?.name || ""}: ${p.quantityInput} (${p.status})`)
            }
          />

          <StatCard
            icon={<Recycle className="h-6 w-6" />}
            label="Unusable/Waste Stock"
            value={wasteStock.total}
            unit="kg/litre"
            color="red"
            tooltip={`After Cleaning: ${wasteStock.afterCleaning.total}, After Processing: ${wasteStock.afterProcessing.total}`}
          />
        </motion.div>

        {/* Low Stock Alerts */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h3>
              {lowStockAlerts.length > 0 && (
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                  {lowStockAlerts.length} alerts
                </span>
              )}
            </div>
          </div>

          <div className="p-6">
            {lowStockAlerts.length === 0 ? (
              <div className="text-center py-8">
                <div className="p-3 bg-green-100 rounded-full w-fit mx-auto mb-4">
                  <Package className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-gray-600">No SKUs below minimum reorder levels.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">SKU Code</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Available</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Min Reorder Level</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Stock Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockAlerts.map((alert, index) => (
                      <motion.tr
                        key={alert.skuCode}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4 font-mono text-sm">{alert.skuCode}</td>
                        <td className="py-3 px-4 font-medium">{alert.name}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-sm font-medium rounded">
                            {alert.available}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{alert.minReorderLevel}</td>
                        <td className="py-3 px-4">
                          {alert.details && alert.details.length > 0 ? (
                            <ul className="text-sm text-gray-600 space-y-1">
                              {alert.details.map((d, idx) => (
                                <li key={idx} className="flex items-center gap-2">
                                  <Warehouse className="h-3 w-3" />
                                  {d.currentQuantity} in {d.warehouse?.name || "N/A"}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>

        {/* Waste Stock Details */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200 bg-orange-50">
            <div className="flex items-center gap-3">
              <Recycle className="h-5 w-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">Waste Stock Details</h3>
            </div>
          </div>

          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* After Cleaning */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Search className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">After Cleaning</h4>
                    <p className="text-2xl font-bold text-blue-600">{wasteStock.afterCleaning.total}</p>
                  </div>
                </div>

                {wasteStock.afterCleaning.details.length > 0 && (
                  <div className="space-y-2">
                    {wasteStock.afterCleaning.details.map((w, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-600 p-2 bg-gray-50 rounded">
                        <Warehouse className="h-3 w-3" />
                        <span>
                          {w.quantity} in {w.warehouse?.name || "N/A"}
                        </span>
                        {w.remarks && <span className="text-gray-500">({w.remarks})</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* After Processing */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Settings className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">After Processing</h4>
                    <p className="text-2xl font-bold text-green-600">{wasteStock.afterProcessing.total}</p>
                  </div>
                </div>

                {wasteStock.afterProcessing.details.length > 0 && (
                  <div className="space-y-2">
                    {wasteStock.afterProcessing.details.map((w, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-600 p-2 bg-gray-50 rounded">
                        <Factory className="h-3 w-3" />
                        <span>
                          {w.quantity} in {w.warehouse?.name || "N/A"}
                        </span>
                        {w.processingJob?.id && <span className="text-gray-500">(Job: {w.processingJob.id})</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number
  unit?: string
  color: "blue" | "orange" | "purple" | "green" | "red"
  tooltip?: string
  details?: any[]
  detailsFormatter?: (details: any[]) => string[]
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, unit, color, tooltip, details, detailsFormatter }) => {
  const [showDetails, setShowDetails] = useState(false)

  const colorClasses = {
    blue: {
      bg: "bg-blue-50",
      icon: "text-blue-600",
      value: "text-blue-600",
      border: "border-blue-200",
    },
    orange: {
      bg: "bg-orange-50",
      icon: "text-orange-600",
      value: "text-orange-600",
      border: "border-orange-200",
    },
    purple: {
      bg: "bg-purple-50",
      icon: "text-purple-600",
      value: "text-purple-600",
      border: "border-purple-200",
    },
    green: {
      bg: "bg-green-50",
      icon: "text-green-600",
      value: "text-green-600",
      border: "border-green-200",
    },
    red: {
      bg: "bg-red-50",
      icon: "text-red-600",
      value: "text-red-600",
      border: "border-red-200",
    },
  }

  const classes = colorClasses[color]

  return (
    <motion.div
      variants={{
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 },
      }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative"
    >
      <div
        className={`bg-white rounded-xl p-6 shadow-sm border ${classes.border} hover:shadow-md transition-all duration-200 cursor-pointer`}
        title={tooltip}
        onClick={() => details && setShowDetails(!showDetails)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className={`inline-flex p-2 rounded-lg ${classes.bg} mb-4`}>
              <div className={classes.icon}>{icon}</div>
            </div>

            <h3 className="text-sm font-medium text-gray-600 mb-2">{label}</h3>

            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${classes.value}`}>{value.toLocaleString()}</span>
              {unit && <span className="text-sm text-gray-500">{unit}</span>}
            </div>
          </div>

          {details && details.length > 0 && (
            <button className="p-1 hover:bg-gray-100 rounded">
              <Eye className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>

        {showDetails && details && detailsFormatter && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-gray-200"
          >
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {detailsFormatter(details)
                .slice(0, 3)
                .map((detail, idx) => (
                  <div key={idx} className="text-xs text-gray-600 p-1 bg-gray-50 rounded">
                    {detail}
                  </div>
                ))}
              {detailsFormatter(details).length > 3 && (
                <div className="text-xs text-gray-500 italic">+{detailsFormatter(details).length - 3} more items</div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default RawDashboard
