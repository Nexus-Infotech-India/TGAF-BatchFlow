'use client';

import type React from 'react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  Truck,
  Search,
  Settings,
  AlertTriangle,
  Recycle,
  TrendingUp,
  Loader2,
  Warehouse,
  Factory,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import api, { API_ROUTES } from '../../../utils/api';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

interface LowStockAlert {
  skuCode: string;
  name: string;
  available: number;
  minReorderLevel: number;
  details: any[];
}

interface WasteStock {
  afterCleaning: {
    total: number;
    details: any[];
  };
  afterProcessing: {
    total: number;
    details: any[];
  };
  total: number;
}

const RawDashboard: React.FC = () => {
  const [totalStock, setTotalStock] = useState<number>(0);
  const [totalStockDetails, setTotalStockDetails] = useState<any[]>([]);
  const [pendingPOs, setPendingPOs] = useState<number>(0);
  const [pendingPODetails, setPendingPODetails] = useState<any[]>([]);
  const [stockUnderCleaning, setStockUnderCleaning] = useState<number>(0);
  const [cleaningDetails, setCleaningDetails] = useState<any[]>([]);
  const [stockInProcessing, setStockInProcessing] = useState<number>(0);
  const [processingDetails, setProcessingDetails] = useState<any[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([]);
  const [wasteStock, setWasteStock] = useState<WasteStock>({
    afterCleaning: { total: 0, details: [] },
    afterProcessing: { total: 0, details: [] },
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [totalVendors, setTotalVendors] = useState<number>(0);
  const [totalPurchaseOrders, setTotalPurchaseOrders] = useState<number>(0);
  const [productWiseWaste, setProductWiseWaste] = useState<any[]>([]);
  //const [productWiseWaste, setProductWiseWaste] = useState<any>({ afterCleaning: [], afterProcessing: [] })
  const [stockDistribution, setStockDistribution] = useState<any[]>([]);
  const [productWiseConversion, setProductWiseConversion] = useState<any[]>([]);

  const authToken = localStorage.getItem('authToken');

  useEffect(() => {
    setLoading(true);
    const headers = { Authorization: `Bearer ${authToken}` };

    Promise.all([
      api.get(API_ROUTES.RAW.GET_TOTAL_RAW_MATERIAL_STOCK, { headers }),
      api.get(API_ROUTES.RAW.GET_PENDING_PO_COUNT, { headers }),
      api.get(API_ROUTES.RAW.GET_STOCK_UNDER_CLEANING, { headers }),
      api.get(API_ROUTES.RAW.GET_STOCK_IN_PROCESSING, { headers }),
      api.get(API_ROUTES.RAW.GET_LOW_STOCK_ALERTS, { headers }),
      api.get(API_ROUTES.RAW.GET_WASTE_STOCK, { headers }),
      api.get(API_ROUTES.RAW.GET_TOTAL_VENDORS, { headers }),
      api.get(API_ROUTES.RAW.GET_TOTAL_PURCHASE_ORDERS, { headers }),
      api.get(API_ROUTES.RAW.GET_PRODUCT_WISE_WASTE, { headers }),
      api.get(API_ROUTES.RAW.GET_STOCK_DISTRIBUTION, { headers }),
      api.get(API_ROUTES.RAW.GET_PRODUCT_WISE_CONVERSION, { headers }),
    ])
      .then((responses) => {
        const [
          totalStockRes,
          pendingPOsRes,
          cleaningRes,
          processingRes,
          lowStockRes,
          wasteRes,
          vendorsRes,
          poRes,
          productWiseWasteRes,
          stockDistributionRes,
          productWiseConversionRes,
        ] = responses;

        setTotalStock(totalStockRes.data.totalRawMaterialStock || 0);
        setTotalStockDetails(totalStockRes.data.details || []);
        setPendingPOs(pendingPOsRes.data.pendingPOs || 0);
        setPendingPODetails(pendingPOsRes.data.details || []);
        setStockUnderCleaning(cleaningRes.data.stockUnderCleaning || 0);
        setCleaningDetails(cleaningRes.data.details || []);
        setStockInProcessing(processingRes.data.stockInProcessing || 0);
        setProcessingDetails(processingRes.data.details || []);
        setLowStockAlerts(lowStockRes.data.lowStockAlerts || []);
        setWasteStock(
          wasteRes.data.wasteStock || {
            afterCleaning: { total: 0, details: [] },
            afterProcessing: { total: 0, details: [] },
            total: 0,
          }
        );
        setTotalVendors(vendorsRes.data.totalVendors || 0);
        setTotalPurchaseOrders(poRes.data.totalPurchaseOrders || 0);
        // ...existing code...
        setProductWiseWaste(
          productWiseWasteRes.data.productWiseWasteStock || []
        );
        // ...existing code...
        //setProductWiseWaste(productWiseWasteRes.data || []);
        //setProductWiseWaste(productWiseWasteRes.data.productWiseWaste || { afterCleaning: [], afterProcessing: [] })
        setStockDistribution(stockDistributionRes.data.stockDistribution || []);
        setProductWiseConversion(
          productWiseConversionRes.data.productWiseConversionRatio || []
        );
      })
      .finally(() => setLoading(false));
  }, [authToken]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  const warehouseLabels = stockDistribution.map(
    (w) => w.warehouse?.name || 'N/A'
  );
  const warehouseTotals = stockDistribution.map((w) =>
    w.items.reduce((sum: number, i: any) => sum + (i.quantity || 0), 0)
  );

  const warehousePieData = {
    labels: warehouseLabels,
    datasets: [
      {
        label: 'Stock Distribution',
        data: warehouseTotals,
        backgroundColor: [
          '#3B82F6',
          '#10B981',
          '#F59E0B',
          '#EF4444',
          '#8B5CF6',
          '#06B6D4',
          '#84CC16',
          '#F97316',
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const conversionLabels = productWiseConversion.map((p) => p.skuCode);
  const conversionData = productWiseConversion.map(
    (p) => Math.round((p.conversionPercentage || 0) * 100) / 100
  );

  const conversionBarData = {
    labels: conversionLabels,
    datasets: [
      {
        label: 'Conversion %',
        data: conversionData,
        backgroundColor: 'rgba(251, 191, 36, 0.8)',
        borderColor: 'rgba(251, 191, 36, 1)',
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6 bg-white p-8 rounded-2xl shadow-lg"
        >
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <div className="absolute inset-0 h-12 w-12 animate-ping rounded-full bg-blue-200 opacity-20"></div>
          </div>
          <div className="text-center">
            <p className="text-gray-800 font-semibold text-lg">
              Loading Dashboard
            </p>
            <p className="text-gray-500 text-sm">Fetching real-time data...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Enhanced Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200/50 sticky top-0 z-10"
      >
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg">
                <Factory className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Raw Material Dashboard
                </h1>
                <p className="text-gray-600 mt-1">
                  Real-time inventory monitoring and analytics
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-green-50 px-4 py-2 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-700 font-medium text-sm">
                Live Data
              </span>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Enhanced Stats Grid - Better 4-column layout */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <div className="lg:col-span-2">
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
                    `${s.rawMaterial?.name || ''} (${s.rawMaterial?.skuCode || ''}): ${s.currentQuantity} in ${s.warehouse?.name || ''}`
                )
              }
              large={true}
            />
          </div>
          <StatCard
            icon={<Truck className="h-6 w-6" />}
            label="POs Pending Delivery"
            value={pendingPOs}
            unit="orders"
            color="orange"
            details={pendingPODetails}
            detailsFormatter={(details) =>
              details.map(
                (po) =>
                  `PO#${po.id} (${po.vendor?.name || ''}): ${po.items?.length || 0} items`
              )
            }
          />
          <StatCard
            icon={<Recycle className="h-6 w-6" />}
            label="Waste Stock"
            value={wasteStock.total}
            unit="kg/litre"
            color="red"
            tooltip={`After Cleaning: ${wasteStock.afterCleaning.total}, After Processing: ${wasteStock.afterProcessing.total}`}
          />
          <StatCard
            icon={<Search className="h-6 w-6" />}
            label="Under Cleaning"
            value={stockUnderCleaning}
            unit="kg/litre"
            color="purple"
            details={cleaningDetails}
            detailsFormatter={(details) =>
              details.map(
                (c) =>
                  `${c.rawMaterial?.name || ''}: ${c.quantity} (${c.status})`
              )
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
              details.map(
                (p) =>
                  `${p.inputRawMaterial?.name || ''}: ${p.quantityInput} (${p.status})`
              )
            }
          />
          <StatCard
            icon={<Warehouse className="h-6 w-6" />}
            label="Total Vendors"
            value={totalVendors}
            unit="vendors"
            color="indigo"
          />
          <StatCard
            icon={<Factory className="h-6 w-6" />}
            label="Purchase Orders"
            value={totalPurchaseOrders}
            unit="orders"
            color="teal"
          />
        </motion.div>

        {/* Charts Section - Better Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Product-wise Waste Chart - Takes 2 columns */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Recycle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Product-wise Waste Table
                </h3>
                <p className="text-gray-500 text-sm">
                  Summary of raw material, cleaning, waste, and processing
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs md:text-sm border">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-blue-50">
                    <th className="border px-2 py-2 text-left font-semibold">
                      Metric
                    </th>
                    {productWiseWaste?.map((p: any) => (
                      <th
                        key={p.productId}
                        className="border px-2 py-2 font-semibold text-center"
                      >
                        {p.productName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Raw material', key: 'rawMaterial' },
                    { label: 'Cleaning', key: 'cleaning' },
                    {
                      label: 'Waste after cleaning',
                      key: 'wasteAfterCleaning',
                    },
                    { label: 'Cleaned', key: 'cleaned' },
                    { label: 'Processing', key: 'processing' },
                    {
                      label: 'Waste after processing',
                      key: 'wasteAfterProcessing',
                    },
                    { label: 'Processed', key: 'processed' },
                  ].map((row) => (
                    <tr key={row.key} className="even:bg-blue-50/30">
                      <td className="border px-2 py-2 font-medium">
                        {row.label}
                      </td>
                      {productWiseWaste?.map((p: any) => (
                        <td
                          key={p.productId + row.key}
                          className="border px-2 py-2 text-center"
                        >
                          {p[row.key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Stock Distribution Pie Chart - Takes 1 column */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-50 rounded-lg">
                <Warehouse className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Stock Distribution
                </h3>
                <p className="text-gray-500 text-sm">By warehouse</p>
              </div>
            </div>
            <div className="h-80 flex items-center justify-center">
              <Doughnut
                data={warehousePieData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: { size: 11 },
                      },
                    },
                  },
                  cutout: '60%',
                }}
              />
            </div>
          </motion.div>
        </div>

        {/* Conversion Ratio Chart - Full Width */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6 mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Product-wise Conversion Efficiency
              </h3>
              <p className="text-gray-500 text-sm">
                Conversion percentage by product SKU
              </p>
            </div>
          </div>
          <div className="h-80">
            <Bar
              data={conversionBarData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  x: {
                    grid: { display: false },
                    ticks: { font: { size: 12 } },
                  },
                  y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: 'rgba(0,0,0,0.05)' },
                    ticks: {
                      callback: (value) => value + '%',
                    },
                  },
                },
              }}
            />
          </div>
        </motion.div>

        {/* Alerts and Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Low Stock Alerts */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="bg-white rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden"
          >
            <div className="px-6 py-4 bg-gradient-to-r from-red-50 to-orange-50 border-b border-gray-200/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Low Stock Alerts
                    </h3>
                    <p className="text-gray-500 text-sm">
                      Items below minimum reorder level
                    </p>
                  </div>
                </div>
                {lowStockAlerts.length > 0 && (
                  <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                    {lowStockAlerts.length} alerts
                  </span>
                )}
              </div>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              {lowStockAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="p-4 bg-green-50 rounded-full w-fit mx-auto mb-4">
                    <Package className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-gray-600 font-medium">
                    All stock levels are healthy!
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    No items below minimum reorder levels
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {lowStockAlerts.map((alert, index) => (
                    <motion.div
                      key={alert.skuCode}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-red-50 rounded-xl border border-red-100"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {alert.name}
                          </p>
                          <p className="text-sm text-gray-500 font-mono">
                            {alert.skuCode}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Available</p>
                          <p className="text-lg font-bold text-red-600">
                            {alert.available}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          Min Level: {alert.minReorderLevel}
                        </span>
                        <span className="text-red-600 font-medium">
                          {alert.minReorderLevel - alert.available} units short
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Waste Stock Details */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="bg-white rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden"
          >
            <div className="px-6 py-4 bg-gradient-to-r from-orange-50 to-red-50 border-b border-gray-200/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Recycle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Waste Stock Breakdown
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Detailed waste analysis
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <Search className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-1">After Cleaning</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {wasteStock.afterCleaning.total}
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <Settings className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-1">After Processing</p>
                  <p className="text-2xl font-bold text-green-600">
                    {wasteStock.afterProcessing.total}
                  </p>
                </div>
              </div>

              <div className="space-y-4 max-h-48 overflow-y-auto">
                {wasteStock.afterCleaning.details.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      Cleaning Waste Details
                    </h4>
                    <div className="space-y-2">
                      {wasteStock.afterCleaning.details
                        .slice(0, 3)
                        .map((w, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 bg-blue-50 rounded-lg text-sm"
                          >
                            <span className="text-gray-700">
                              {w.warehouse?.name || 'N/A'}
                            </span>
                            <span className="font-medium text-blue-700">
                              {w.quantity}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {wasteStock.afterProcessing.details.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      Processing Waste Details
                    </h4>
                    <div className="space-y-2">
                      {wasteStock.afterProcessing.details
                        .slice(0, 3)
                        .map((w, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 bg-green-50 rounded-lg text-sm"
                          >
                            <span className="text-gray-700">
                              {w.warehouse?.name || 'N/A'}
                            </span>
                            <span className="font-medium text-green-700">
                              {w.quantity}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit?: string;
  color: 'blue' | 'orange' | 'purple' | 'green' | 'red' | 'indigo' | 'teal';
  tooltip?: string;
  details?: any[];
  detailsFormatter?: (details: any[]) => string[];
  large?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  unit,
  color,
  tooltip,
  details,
  detailsFormatter,
  large = false,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      value: 'text-blue-600',
      border: 'border-blue-200',
      gradient: 'from-blue-500 to-blue-600',
    },
    orange: {
      bg: 'bg-orange-50',
      icon: 'text-orange-600',
      value: 'text-orange-600',
      border: 'border-orange-200',
      gradient: 'from-orange-500 to-orange-600',
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      value: 'text-purple-600',
      border: 'border-purple-200',
      gradient: 'from-purple-500 to-purple-600',
    },
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      value: 'text-green-600',
      border: 'border-green-200',
      gradient: 'from-green-500 to-green-600',
    },
    red: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      value: 'text-red-600',
      border: 'border-red-200',
      gradient: 'from-red-500 to-red-600',
    },
    indigo: {
      bg: 'bg-indigo-50',
      icon: 'text-indigo-600',
      value: 'text-indigo-600',
      border: 'border-indigo-200',
      gradient: 'from-indigo-500 to-indigo-600',
    },
    teal: {
      bg: 'bg-teal-50',
      icon: 'text-teal-600',
      value: 'text-teal-600',
      border: 'border-teal-200',
      gradient: 'from-teal-500 to-teal-600',
    },
  };

  const classes = colorClasses[color];

  return (
    <motion.div
      variants={{
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 },
      }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative group"
    >
      <div
        className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 hover:shadow-lg transition-all duration-300 cursor-pointer h-full ${
          large ? 'lg:p-8' : ''
        }`}
        title={tooltip}
        onClick={() => details && setShowDetails(!showDetails)}
      >
        <div className="flex items-start justify-between mb-4">
          <div
            className={`p-3 rounded-xl bg-gradient-to-r ${classes.gradient} shadow-lg`}
          >
            <div className="text-white">{icon}</div>
          </div>
          {details && details.length > 0 && (
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              {showDetails ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </button>
          )}
        </div>

        <div className="space-y-2">
          <h3
            className={`text-sm font-medium text-gray-600 ${large ? 'lg:text-base' : ''}`}
          >
            {label}
          </h3>
          <div className="flex items-baseline gap-2">
            <span
              className={`font-bold ${classes.value} ${large ? 'text-4xl lg:text-5xl' : 'text-2xl'}`}
            >
              {value.toLocaleString()}
            </span>
            {unit && (
              <span
                className={`text-gray-500 ${large ? 'text-base' : 'text-sm'}`}
              >
                {unit}
              </span>
            )}
          </div>
        </div>

        {showDetails && details && detailsFormatter && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-gray-200"
          >
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {detailsFormatter(details)
                .slice(0, 3)
                .map((detail, idx) => (
                  <div
                    key={idx}
                    className="text-xs text-gray-600 p-2 bg-gray-50 rounded-lg"
                  >
                    {detail}
                  </div>
                ))}
              {detailsFormatter(details).length > 3 && (
                <div className="text-xs text-gray-500 italic text-center">
                  +{detailsFormatter(details).length - 3} more items
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default RawDashboard;
