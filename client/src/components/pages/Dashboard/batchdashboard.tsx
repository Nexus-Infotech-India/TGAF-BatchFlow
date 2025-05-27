import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  Layers,
  Clipboard,
  FileBox,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpCircle,
  CalendarRange,
  Download,
  BarChart4,
  CheckCheck,
  Droplets,
  Factory,
  Award
} from 'lucide-react';
import {
  Bar,
  Line,
  Pie,
  Doughnut
} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { format } from 'date-fns';
import api, { API_ROUTES } from '../../../utils/api';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'quarterly'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'MM'));
  const [selectedYear, setSelectedYear] = useState(format(new Date(), 'yyyy'));

  // Fetch overview statistics
  const { 
    data: overviewData, 
    isLoading: overviewLoading, 
    error: overviewError 
  } = useQuery({
    queryKey: ['dashboardOverview'],
    queryFn: async () => {
      const res = await api.get(API_ROUTES.DASHBOARD.OVERVIEW, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      return res.data.stats;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Fetch batch trends
  const { 
    data: trendData, 
    isLoading: trendLoading, 
    error: trendError 
  } = useQuery({
    queryKey: ['batchTrends', timeframe],
    queryFn: async () => {
      const res = await api.get(API_ROUTES.DASHBOARD.BATCH_TRENDS, {
        params: { period: timeframe },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      return res.data;
    },
    staleTime: 5 * 60 * 1000
  });

  // Fetch product performance
  const { 
    data: productData, 
    isLoading: productLoading, 
    error: productError 
  } = useQuery({
    queryKey: ['productPerformance'],
    queryFn: async () => {
      const res = await api.get(API_ROUTES.DASHBOARD.PRODUCT_PERFORMANCE, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      return res.data.products;
    },
    staleTime: 5 * 60 * 1000
  });

  // Fetch user activity
  const { 
    data: userData, 
    isLoading: userLoading, 
    error: userError 
  } = useQuery({
    queryKey: ['userActivity'],
    queryFn: async () => {
      const res = await api.get(API_ROUTES.DASHBOARD.USER_ACTIVITY, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      return res.data.users;
    },
    staleTime: 5 * 60 * 1000
  });

  // Fetch quality metrics
  const { 
    data: qualityData, 
    isLoading: qualityLoading, 
    error: qualityError 
  } = useQuery({
    queryKey: ['qualityMetrics'],
    queryFn: async () => {
      const res = await api.get(API_ROUTES.DASHBOARD.QUALITY_METRICS, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      return res.data.qualityMetrics;
    },
    staleTime: 5 * 60 * 1000
  });

  // Fetch monthly batch summary
  const { 
    data: monthlySummaryData, 
    isLoading: monthlySummaryLoading, 
    error: monthlySummaryError 
  } = useQuery({
    queryKey: ['monthlySummary', selectedMonth, selectedYear],
    queryFn: async () => {
      const res = await api.get(API_ROUTES.DASHBOARD.MONTHLY_SUMMARY, {
        params: { month: selectedMonth, year: selectedYear },
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      return res.data.summary;
    },
    staleTime: 5 * 60 * 1000
  });

  // Fetch standard usage
  const { 
    data: standardData, 
    isLoading: standardLoading, 
    error: standardError 
  } = useQuery({
    queryKey: ['standardUsage'],
    queryFn: async () => {
      const res = await api.get(API_ROUTES.DASHBOARD.STANDARD_USAGE, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      return res.data.standards;
    },
    staleTime: 5 * 60 * 1000
  });

  // Prepare chart data based on API responses
  const batchTrendChartData = React.useMemo(() => {
    if (!trendData?.trends) return null;
    
    return {
      labels: trendData.trends.map((item: any) => item.date),
      datasets: [
        {
          label: 'Approved',
          data: trendData.trends.map((item: any) => item.approved),
          borderColor: 'rgba(34, 197, 94, 1)',
          backgroundColor: 'rgba(34, 197, 94, 0.5)',
          tension: 0.3,
        },
        {
          label: 'Submitted',
          data: trendData.trends.map((item: any) => item.submitted),
          borderColor: 'rgba(59, 130, 246, 1)',
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          tension: 0.3,
        },
        {
          label: 'Rejected',
          data: trendData.trends.map((item: any) => item.rejected),
          borderColor: 'rgba(239, 68, 68, 1)',
          backgroundColor: 'rgba(239, 68, 68, 0.5)',
          tension: 0.3,
        },
        {
          label: 'Draft',
          data: trendData.trends.map((item: any) => item.draft),
          borderColor: 'rgba(161, 161, 170, 1)',
          backgroundColor: 'rgba(161, 161, 170, 0.5)',
          tension: 0.3,
        }
      ]
    };
  }, [trendData]);

  // Prepare product performance chart data
  const productPerformanceChartData = React.useMemo(() => {
    if (!productData || productData.length === 0) return null;
    
    // Sort products by total batches
    const topProducts = [...productData].sort((a, b) => b.totalBatches - a.totalBatches).slice(0, 5);
    
    return {
      labels: topProducts.map(product => product.name),
      datasets: [
        {
          label: 'Approved',
          data: topProducts.map(product => product.approvedBatches),
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
        },
        {
          label: 'Rejected',
          data: topProducts.map(product => product.rejectedBatches),
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
        },
        {
          label: 'Pending',
          data: topProducts.map(product => product.pendingBatches),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
        }
      ]
    };
  }, [productData]);

  // Prepare quality metrics chart data
  const qualityMetricsChartData = React.useMemo(() => {
    if (!qualityData || qualityData.length === 0) return null;
    
    // Take top 5 products by batch count
    const topProducts = [...qualityData].sort((a, b) => b.totalBatches - a.totalBatches).slice(0, 5);
    
    return {
      labels: topProducts.map(product => product.productName),
      datasets: [
        {
          label: 'Moisture (%)',
          data: topProducts.map(product => product.avgMoisture),
          backgroundColor: 'rgba(147, 51, 234, 0.7)',
          borderColor: 'rgba(147, 51, 234, 1)',
          borderWidth: 1,
          borderRadius: 5,
        },
        {
          label: 'Total Ash (%)',
          data: topProducts.map(product => product.avgTotalAsh),
          backgroundColor: 'rgba(249, 115, 22, 0.7)',
          borderColor: 'rgba(249, 115, 22, 1)',
          borderWidth: 1,
          borderRadius: 5,
        }
      ]
    };
  }, [qualityData]);

  // Prepare water activity chart (separate from other metrics due to scale difference)
  const waterActivityChartData = React.useMemo(() => {
    if (!qualityData || qualityData.length === 0) return null;
    
    // Take top 5 products by batch count
    const topProducts = [...qualityData].sort((a, b) => b.totalBatches - a.totalBatches).slice(0, 5);
    
    return {
      labels: topProducts.map(product => product.productName),
      datasets: [
        {
          label: 'Water Activity',
          data: topProducts.map(product => product.avgWaterActivity),
          backgroundColor: 'rgba(6, 182, 212, 0.7)',
          borderColor: 'rgba(6, 182, 212, 1)',
          borderWidth: 1,
          borderRadius: 5,
        }
      ]
    };
  }, [qualityData]);

  

  // Prepare status distribution doughnut chart
  const statusDistributionChartData = React.useMemo(() => {
    if (!overviewData) return null;
    
    return {
      labels: ['Approved', 'Pending', 'Rejected', 'Draft'],
      datasets: [
        {
          data: [
            overviewData.batches.approved,
            overviewData.batches.pending,
            overviewData.batches.rejected,
            overviewData.batches.total - (overviewData.batches.approved + overviewData.batches.pending + overviewData.batches.rejected)
          ],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(161, 161, 170, 0.8)'
          ],
          borderColor: [
            'rgba(34, 197, 94, 1)',
            'rgba(59, 130, 246, 1)',
            'rgba(239, 68, 68, 1)',
            'rgba(161, 161, 170, 1)'
          ],
          borderWidth: 1,
        }
      ]
    };
  }, [overviewData]);
  
  // Standard usage chart
  const standardUsageChartData = React.useMemo(() => {
    if (!standardData || standardData.length === 0) return null;
    
    // Take top 7 standards by usage
    const topStandards = [...standardData].sort((a, b) => b.usageCount - a.usageCount).slice(0, 7);
    
    return {
      labels: topStandards.map(std => std.name),
      datasets: [
        {
          data: topStandards.map(std => std.usageCount),
          backgroundColor: [
            'rgba(59, 130, 246, 0.7)',
            'rgba(147, 51, 234, 0.7)',
            'rgba(249, 115, 22, 0.7)',
            'rgba(16, 185, 129, 0.7)',
            'rgba(239, 68, 68, 0.7)',
            'rgba(245, 158, 11, 0.7)',
            'rgba(6, 182, 212, 0.7)'
          ],
          borderWidth: 0,
          hoverOffset: 10
        }
      ]
    };
  }, [standardData]);

  // Page animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        damping: 15
      }
    }
  };

  // Generate month options for dropdown
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1).padStart(2, '0'),
    label: format(new Date(2000, i, 1), 'MMMM')
  }));

  // Generate year options for dropdown
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => ({
    value: String(currentYear - i),
    label: String(currentYear - i)
  }));

  return (
    <motion.div 
      className="px-6 py-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Dashboard Header */}
      <motion.div variants={itemVariants} className="mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-blue-800">Batch Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of batch processing performance and metrics</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Time frame selector */}
          <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow-sm p-1">
            <button
              onClick={() => setTimeframe('weekly')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${timeframe === 'weekly' 
                ? 'bg-blue-50 text-blue-600' 
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50/50'}`}
            >
              Weekly
            </button>
            <button
              onClick={() => setTimeframe('monthly')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${timeframe === 'monthly' 
                ? 'bg-blue-50 text-blue-600' 
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50/50'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setTimeframe('quarterly')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${timeframe === 'quarterly' 
                ? 'bg-blue-50 text-blue-600' 
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50/50'}`}
            >
              Quarterly
            </button>
          </div>
          
          {/* Month and Year selector */}
          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-1.5 text-sm text-gray-700"
            >
              {monthOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-1.5 text-sm text-gray-700"
            >
              {yearOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            
            <button className="bg-white border border-gray-200 hover:bg-gray-50 rounded-lg shadow-sm p-2">
              <Download size={18} className="text-gray-500" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Batches */}
        <motion.div 
          variants={itemVariants}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-6 rounded-xl shadow-sm"
        >
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <Layers size={28} className="text-blue-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-blue-600">TOTAL BATCHES</h2>
              <div className="flex items-baseline mt-1">
                <span className="text-2xl font-bold text-gray-800">
                  {overviewLoading ? "..." : overviewData?.batches?.total || 0}
                </span>
                <span className="ml-2 text-xs font-medium text-green-600 flex items-center">
                  <ArrowUpCircle size={12} className="mr-0.5" />
                  {trendData?.trends && trendData.trends.length > 1 
                    ? `${Math.round(((trendData.trends[trendData.trends.length-1].approved +
                                      trendData.trends[trendData.trends.length-1].submitted +
                                      trendData.trends[trendData.trends.length-1].rejected +
                                      trendData.trends[trendData.trends.length-1].draft) /
                                     (trendData.trends[trendData.trends.length-2].approved +
                                      trendData.trends[trendData.trends.length-2].submitted +
                                      trendData.trends[trendData.trends.length-2].rejected +
                                      trendData.trends[trendData.trends.length-2].draft || 1) - 1) * 100)}%`
                    : "0%"
                  }
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center">
              <div className="h-2 w-2 rounded-full bg-green-500 mr-1"></div>
              <span>Approved: {overviewData?.batches?.approved || 0}</span>
            </div>
            <div className="flex items-center">
              <div className="h-2 w-2 rounded-full bg-blue-500 mr-1"></div>
              <span>Pending: {overviewData?.batches?.pending || 0}</span>
            </div>
            <div className="flex items-center">
              <div className="h-2 w-2 rounded-full bg-red-500 mr-1"></div>
              <span>Rejected: {overviewData?.batches?.rejected || 0}</span>
            </div>
          </div>
        </motion.div>

        {/* Products */}
        <motion.div 
          variants={itemVariants}
          className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 p-6 rounded-xl shadow-sm"
        >
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <FileBox size={28} className="text-green-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-green-600">PRODUCTS</h2>
              <div className="flex items-baseline mt-1">
                <span className="text-2xl font-bold text-gray-800">
                  {overviewLoading ? "..." : overviewData?.products || 0}
                </span>
                {productData && (
                  <span className="ml-2 text-xs font-medium text-green-600">
                    {productData.length} active
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div 
                className="bg-green-500 h-1 rounded-full" 
                style={{ width: `${productData ? Math.min(100, Math.round((productData.length / (overviewData?.products || 1)) * 100)) : 0}%` }}
              ></div>
            </div>
          </div>
        </motion.div>

        {/* Standards */}
        <motion.div 
          variants={itemVariants}
          className="bg-gradient-to-br from-purple-50 to-fuchsia-50 border border-purple-100 p-6 rounded-xl shadow-sm"
        >
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-full">
              <Clipboard size={28} className="text-purple-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-purple-600">STANDARDS</h2>
              <div className="flex items-baseline mt-1">
                <span className="text-2xl font-bold text-gray-800">
                  {overviewLoading ? "..." : overviewData?.standards || 0}
                </span>
                {standardData && (
                  <span className="ml-2 text-xs font-medium text-purple-600">
                    {standardData.filter((s: { status: string; }) => s.status === 'ACTIVE').length} active
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center">
              <Award size={14} className="text-amber-500 mr-1" />
              <span>Top: {standardData && standardData.length > 0 ? standardData[0].name : 'N/A'}</span>
            </div>
            <span>{standardData && standardData.length > 0 ? `${standardData[0].usageCount} uses` : ''}</span>
          </div>
        </motion.div>

        {/* Users */}
        <motion.div 
          variants={itemVariants}
          className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 p-6 rounded-xl shadow-sm"
        >
          <div className="flex items-center">
            <div className="bg-amber-100 p-3 rounded-full">
              <Users size={28} className="text-amber-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-amber-600">USERS</h2>
              <div className="flex items-baseline mt-1">
                <span className="text-2xl font-bold text-gray-800">
                  {overviewLoading ? "..." : overviewData?.users || 0}
                </span>
                {userData && (
                  <span className="ml-2 text-xs font-medium text-amber-600">
                    {userData.filter((u: { totalActivities: number; }) => u.totalActivities > 0).length} active
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center">
              <Users size={14} className="text-amber-500 mr-1" />
              <span>Most active: {userData && userData.length > 0 ? userData[0].name : 'N/A'}</span>
            </div>
            <span>{userData && userData.length > 0 ? `${userData[0].totalActivities} actions` : ''}</span>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-12 gap-6 mb-8">
        {/* Batch Trends Chart */}
        <motion.div 
          variants={itemVariants} 
          className="col-span-12 lg:col-span-8 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <TrendingUp size={18} className="text-blue-500 mr-2" />
                Batch Processing Trends
              </h2>
              <div className="text-xs text-gray-500">
                {timeframe === 'weekly' ? 'Last 7 days' : 
                 timeframe === 'monthly' ? 'Last 30 days' : 'Last 3 months'}
              </div>
            </div>
          </div>
          <div className="p-6">
            {trendLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            ) : trendError ? (
              <div className="h-64 flex items-center justify-center text-red-500">
                Failed to load trend data
              </div>
            ) : !batchTrendChartData ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No trend data available
              </div>
            ) : (
              <div className="h-64">
                <Line 
                  data={batchTrendChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: 'rgba(0, 0, 0, 0.05)',
                        }
                      },
                      x: {
                        grid: {
                          display: false
                        }
                      }
                    },
                    plugins: {
                      legend: {
                        position: 'top' as const,
                        align: 'end' as const,
                        labels: {
                          boxWidth: 8,
                          usePointStyle: true,
                          pointStyle: 'circle'
                        }
                      }
                    },
                    interaction: {
                      mode: 'index' as const,
                      intersect: false,
                    }
                  }}
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* Status Distribution */}
        <motion.div 
          variants={itemVariants} 
          className="col-span-12 lg:col-span-4 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <PieChart size={18} className="text-blue-500 mr-2" />
                Batch Status Distribution
              </h2>
            </div>
          </div>
          <div className="p-6">
            {overviewLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            ) : overviewError ? (
              <div className="h-64 flex items-center justify-center text-red-500">
                Failed to load overview data
              </div>
            ) : !statusDistributionChartData ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No status data available
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <div className="w-56">
                  <Doughnut 
                    data={statusDistributionChartData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      cutout: '65%',
                      plugins: {
                        legend: {
                          position: 'bottom' as const,
                          labels: {
                            boxWidth: 12,
                            usePointStyle: true,
                            pointStyle: 'circle'
                          }
                        }
                      }
                    }}
                  />
                  {overviewData && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                      <div className="text-3xl font-bold text-gray-800">{overviewData.batches.total}</div>
                      <div className="text-xs text-gray-500">Total Batches</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-12 gap-6 mb-8">
        {/* Product Performance */}
        <motion.div 
          variants={itemVariants} 
          className="col-span-12 lg:col-span-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <BarChart3 size={18} className="text-blue-500 mr-2" />
                Product Performance
              </h2>
              <button className="text-xs text-blue-500 hover:text-blue-700">View All</button>
            </div>
          </div>
          <div className="p-6">
            {productLoading ? (
              <div className="h-80 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            ) : productError ? (
              <div className="h-80 flex items-center justify-center text-red-500">
                Failed to load product data
              </div>
            ) : !productPerformanceChartData ? (
              <div className="h-80 flex items-center justify-center text-gray-500">
                No product data available
              </div>
            ) : (
              <div className="h-80">
                <Bar 
                  data={{
                    ...productPerformanceChartData,
                    datasets: productPerformanceChartData.datasets.map(ds => ({
                      ...ds,
                      barThickness: 20
                    }))
                  }} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: {
                        stacked: true,
                        grid: {
                          display: false
                        }
                      },
                      y: {
                        stacked: true,
                        beginAtZero: true,
                        grid: {
                          color: 'rgba(0, 0, 0, 0.05)',
                        }
                      }
                    },
                    plugins: {
                      legend: {
                        position: 'top' as const,
                        labels: {
                          boxWidth: 12,
                          usePointStyle: true,
                          pointStyle: 'circle'
                        }
                      },
                      tooltip: {
                        callbacks: {
                          footer: (tooltipItems) => {
                            // Add approval rate to the tooltip
                            if (tooltipItems.length > 0) {
                            
                              const label = tooltipItems[0].label;
                              const matchingProduct = productData?.find((p: { name: string; }) => p.name === label);
                              if (matchingProduct) {
                                return `Approval Rate: ${matchingProduct.approvalRate}%`;
                              }
                            }
                            return '';
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* Quality Metrics */}
        <motion.div 
          variants={itemVariants} 
          className="col-span-12 lg:col-span-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <BarChart4 size={18} className="text-blue-500 mr-2" />
                Quality Metrics
              </h2>
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-purple-500 mr-1"></div>
                  <span className="text-xs text-gray-500">Moisture</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-orange-500 mr-1"></div>
                  <span className="text-xs text-gray-500">Total Ash</span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6">
            {qualityLoading ? (
              <div className="h-80 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            ) : qualityError ? (
              <div className="h-80 flex items-center justify-center text-red-500">
                Failed to load quality data
              </div>
            ) : !qualityMetricsChartData ? (
              <div className="h-80 flex items-center justify-center text-gray-500">
                No quality metrics available
              </div>
            ) : (
              <div className="h-80">
                <Bar 
                  data={{
                    ...qualityMetricsChartData,
                    datasets: qualityMetricsChartData.datasets.map(ds => ({
                      ...ds,
                      barThickness: 20
                    }))
                  }} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: {
                        grid: {
                          display: false
                        }
                      },
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: 'rgba(0, 0, 0, 0.05)',
                        },
                        title: {
                          display: true,
                          text: 'Percentage (%)'
                        }
                      }
                    },
                    plugins: {
                      legend: {
                        position: 'top' as const,
                        align: 'end' as const,
                        labels: {
                          boxWidth: 12,
                          usePointStyle: true,
                          pointStyle: 'circle'
                        }
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y + '%';
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-12 gap-6 mb-8">
        {/* Water Activity Chart */}
        <motion.div 
          variants={itemVariants} 
          className="col-span-12 lg:col-span-4 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <Droplets size={18} className="text-blue-500 mr-2" />
                Water Activity
              </h2>
            </div>
          </div>
          <div className="p-6">
            {qualityLoading ? (
              <div className="h-60 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            ) : qualityError ? (
              <div className="h-60 flex items-center justify-center text-red-500">
                Failed to load quality data
              </div>
            ) : !waterActivityChartData ? (
              <div className="h-60 flex items-center justify-center text-gray-500">
                No water activity data available
              </div>
            ) : (
              <div className="h-60">
                <Bar 
                  data={{
                    ...waterActivityChartData,
                    datasets: waterActivityChartData.datasets.map(ds => ({
                      ...ds,
                      barThickness: 16
                    }))
                  }} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y' as const,
                    scales: {
                      x: {
                        beginAtZero: true,
                        grid: {
                          color: 'rgba(0, 0, 0, 0.05)',
                        },
                        title: {
                          display: true,
                          text: 'Water Activity (Aw)'
                        }
                      },
                      y: {
                        grid: {
                          display: false
                        }
                      }
                    },
                    plugins: {
                      legend: {
                        display: false
                      }
                    }
                  }}
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* Standard Usage */}
        <motion.div 
          variants={itemVariants} 
          className="col-span-12 lg:col-span-4 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <CheckCheck size={18} className="text-blue-500 mr-2" />
                Standard Usage
              </h2>
            </div>
          </div>
          <div className="p-6">
            {standardLoading ? (
              <div className="h-60 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            ) : standardError ? (
              <div className="h-60 flex items-center justify-center text-red-500">
                Failed to load standard data
              </div>
            ) : !standardUsageChartData ? (
              <div className="h-60 flex items-center justify-center text-gray-500">
                No standard data available
              </div>
            ) : (
              <div className="h-60">
                <Pie 
                  data={standardUsageChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right' as const,
                        labels: {
                          boxWidth: 12,
                          font: {
                            size: 11
                          }
                        }
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const label = context.label || '';
                            const value = context.raw as number;
                            return `${label}: ${value} batches`;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* Monthly Summary */}
        <motion.div 
          variants={itemVariants} 
          className="col-span-12 lg:col-span-4 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <CalendarRange size={18} className="text-blue-500 mr-2" />
                Monthly Summary
              </h2>
              <div className="text-xs text-gray-500">
                {monthlySummaryData?.month || format(new Date(), 'MMMM yyyy')}
              </div>
            </div>
          </div>
          <div className="p-6">
            {monthlySummaryLoading ? (
              <div className="h-60 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            ) : monthlySummaryError ? (
              <div className="h-60 flex items-center justify-center text-red-500">
                Failed to load monthly data
              </div>
            ) : !monthlySummaryData ? (
              <div className="h-60 flex items-center justify-center text-gray-500">
                No monthly data available
              </div>
            ) : (
              <div className="h-60 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-500">Total Batches</div>
                    <div className="text-xl font-bold">{monthlySummaryData.totalBatches}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-500">Approval Time</div>
                    <div className="text-xl font-bold">{monthlySummaryData.timeToApproval}h</div>
                    <div className="text-xs text-gray-400">average</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 flex items-center">
                      <CheckCircle2 size={14} className="text-green-500 mr-1.5" />
                      Approved
                    </div>
                    <div className="text-sm font-semibold">
                      {monthlySummaryData.approved}
                      <span className="text-xs text-gray-400 ml-1">
                        ({Math.round((monthlySummaryData.approved / monthlySummaryData.totalBatches || 0) * 100)}%)
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 flex items-center">
                      <Clock size={14} className="text-amber-500 mr-1.5" />
                      Pending
                    </div>
                    <div className="text-sm font-semibold">
                      {monthlySummaryData.pending}
                      <span className="text-xs text-gray-400 ml-1">
                        ({Math.round((monthlySummaryData.pending / monthlySummaryData.totalBatches || 0) * 100)}%)
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 flex items-center">
                      <XCircle size={14} className="text-red-500 mr-1.5" />
                      Rejected
                    </div>
                    <div className="text-sm font-semibold">
                      {monthlySummaryData.rejected}
                      <span className="text-xs text-gray-400 ml-1">
                        ({Math.round((monthlySummaryData.rejected / monthlySummaryData.totalBatches || 0) * 100)}%)
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">Top Products</div>
                  <div className="text-sm">
                    {monthlySummaryData.productDistribution && 
                      (Object.entries(monthlySummaryData.productDistribution) as [string, number][])
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 2)
                        .map(([name, count], idx) => (
                          <div key={idx} className="flex justify-between items-center">
                            <span className="truncate">{name}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))
                    }
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* User Activity */}
      <motion.div variants={itemVariants} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <Users size={18} className="text-blue-500 mr-2" />
              User Activity
            </h2>
            <button className="text-xs text-blue-500 hover:text-blue-700">View All</button>
          </div>
        </div>
        <div className="p-6">
          {userLoading ? (
            <div className="h-12 flex items-center justify-center">
              <div className="animate-spin h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          ) : userError ? (
            <div className="h-12 flex items-center justify-center text-red-500">
              Failed to load user data
            </div>
          ) : !userData || userData.length === 0 ? (
            <div className="h-12 flex items-center justify-center text-gray-500">
              No user activity data available
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Batches Created
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Batches Reviewed
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Activities
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {userData.slice(0, 5).map((user: { id: React.Key | null | undefined; name: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; email: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; role: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; batchesCreated: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; batchesReviewed: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; totalActivities: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; }) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            {(user.name?.toString().charAt(0).toUpperCase() ?? '')}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-800">{user.name}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                        {user.batchesCreated}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                        {user.batchesReviewed}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <div className="text-sm font-medium">{user.totalActivities}</div>
                        <div className="w-16 bg-gray-200 rounded-full h-1.5 mx-auto mt-1">
                          <div 
                            className="bg-blue-500 h-1.5 rounded-full" 
                            style={{ 
                              width: `${Math.min(
                                100, 
                                Math.round(
                                  ((Number(user.totalActivities ?? 0) / Number(userData[0]?.totalActivities ?? 1)) * 100)
                                )
                              )}%` 
                            }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
      
      {/* Footer Stats */}
      <motion.div 
        variants={itemVariants}
        className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg overflow-hidden text-white p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="bg-white/10 rounded-lg p-3 mb-3 inline-block">
              <CheckCircle2 size={24} />
            </div>
            <div className="text-2xl font-bold">
              {overviewLoading ? "..." : 
                overviewData?.batches?.total ? 
                Math.round((overviewData.batches.approved / overviewData.batches.total) * 100) : 0}%
            </div>
            <div className="text-sm text-blue-100">Approval Rate</div>
          </div>
          
          <div className="text-center">
            <div className="bg-white/10 rounded-lg p-3 mb-3 inline-block">
              <Clock size={24} />
            </div>
            <div className="text-2xl font-bold">
              {monthlySummaryData?.timeToApproval || "N/A"}
            </div>
            <div className="text-sm text-blue-100">Avg. Processing Time (hours)</div>
          </div>
          
          <div className="text-center">
            <div className="bg-white/10 rounded-lg p-3 mb-3 inline-block">
              <FileBox size={24} />
            </div>
            <div className="text-2xl font-bold">
              {productData?.length ? 
                productData.reduce((sum: any, p: { totalBatches: any; }) => sum + p.totalBatches, 0) / productData.length : 0}
            </div>
            <div className="text-sm text-blue-100">Avg. Batches per Product</div>
          </div>
          
          <div className="text-center">
            <div className="bg-white/10 rounded-lg p-3 mb-3 inline-block">
              <Factory size={24} />
            </div>
            <div className="text-2xl font-bold">
              {qualityData?.length || 0}
            </div>
            <div className="text-sm text-blue-100">Products Monitored</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;