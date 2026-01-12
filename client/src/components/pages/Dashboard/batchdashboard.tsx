import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  Users,

  Clipboard,
  FileBox,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  PieChart,
} from 'lucide-react';
import {
  Line,
  Doughnut,
  Bar,
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
  } = useQuery({
    queryKey: ['batchTrends', 'monthly'],
    queryFn: async () => {
      const res = await api.get(API_ROUTES.DASHBOARD.BATCH_TRENDS, {
        params: { period: 'monthly' },
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

  // Prepare chart data
  const batchTrendChartData = React.useMemo(() => {
    if (!trendData?.trends) return null;

    return {
      labels: trendData.trends.slice(-6).map((item: any) => item.date),
      datasets: [
        {
          label: 'Approved',
          data: trendData.trends.slice(-6).map((item: any) => item.approved),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.3,
        },
        {
          label: 'Pending',
          data: trendData.trends.slice(-6).map((item: any) => item.submitted + item.draft),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.3,
        }
      ]
    };
  }, [trendData]);

  const statusDistributionChartData = React.useMemo(() => {
    if (!overviewData) return null;

    return {
      labels: ['Approved', 'Pending', 'Rejected'],
      datasets: [
        {
          data: [
            overviewData.batches.approved,
            overviewData.batches.pending,
            overviewData.batches.rejected
          ],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(239, 68, 68, 0.8)'
          ],
          borderColor: [
            'rgba(34, 197, 94, 1)',
            'rgba(59, 130, 246, 1)',
            'rgba(239, 68, 68, 1)'
          ],
          borderWidth: 1,
        }
      ]
    };
  }, [overviewData]);

  const productPerformanceChartData = React.useMemo(() => {
    if (!productData || productData.length === 0) return null;

    const topProducts = [...productData].sort((a, b) => b.totalBatches - a.totalBatches).slice(0, 5);

    return {
      labels: topProducts.map(product => product.name.length > 15 ? product.name.substring(0, 15) + '...' : product.name),
      datasets: [
        {
          label: 'Approved',
          data: topProducts.map(product => product.approvedBatches),
          backgroundColor: 'rgba(23, 142, 200, 0.8)',
          borderColor: 'rgba(23, 142, 200, 1)',
          borderWidth: 1,
          borderRadius: 4,
        }
      ]
    };
  }, [productData]);

  if (overviewLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (overviewError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center text-red-600">
          <XCircle size={48} />
          <p className="mt-2">Failed to load dashboard data</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Batches',
      value: overviewData?.batches?.total || 0,
      icon: BarChart3,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'Approved',
      value: overviewData?.batches?.approved || 0,
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'Pending',
      value: overviewData?.batches?.pending || 0,
      icon: Clock,
      color: 'text-secondary',
      bg: 'bg-secondary/10',
    },
    {
      title: 'Products',
      value: overviewData?.products || 0,
      icon: FileBox,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'Users',
      value: overviewData?.users || 0,
      icon: Users,
      color: 'text-secondary',
      bg: 'bg-secondary/10',
    },
    {
      title: 'Standards',
      value: overviewData?.standards || 0,
      icon: Clipboard,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
  ];

  return (
    <div style={{ background: 'var(--background)', color: 'var(--foreground)' }} className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Dashboard</h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>Batch processing overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              style={{ background: 'var(--card)', color: 'var(--foreground)', borderColor: 'var(--secondary)' }}
              className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>{stat.title}</p>
                  <p className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
                    {stat.value.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: 'var(--secondary)', color: 'var(--secondary-foreground)' }}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Batch Trends */}
          <div style={{ background: 'var(--card)', color: 'var(--foreground)', borderColor: 'var(--secondary)' }} className="border rounded-lg p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <TrendingUp className="w-5 h-5" style={{ color: 'var(--primary)' }} />
              <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Batch Trends</h2>
            </div>
            {trendLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : batchTrendChartData ? (
              <div className="h-64">
                <Line
                  data={batchTrendChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0, 0, 0, 0.05)' }
                      },
                      x: { grid: { display: false } }
                    },
                    plugins: {
                      legend: { display: false }
                    }
                  }}
                />
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No trend data available
              </div>
            )}
          </div>

          {/* Status Distribution */}
          <div style={{ background: 'var(--card)', color: 'var(--foreground)', borderColor: 'var(--secondary)' }} className="border rounded-lg p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <PieChart className="w-5 h-5" style={{ color: 'var(--secondary)' }} />
              <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Status Distribution</h2>
            </div>
            {statusDistributionChartData ? (
              <div className="h-64 flex items-center justify-center">
                <div className="w-48">
                  <Doughnut
                    data={statusDistributionChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      cutout: '60%',
                      plugins: {
                        legend: {
                          position: 'bottom' as const,
                          labels: { boxWidth: 12, usePointStyle: true }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No status data available
              </div>
            )}
          </div>
        </div>

        {/* Product Performance */}
        <div style={{ background: 'var(--card)', color: 'var(--foreground)', borderColor: 'var(--secondary)' }} className="border rounded-lg p-6 shadow-sm mb-8">
          <div className="flex items-center mb-4">
            <FileBox className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Top Products Performance</h2>
          </div>
          {productLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : productPerformanceChartData ? (
            <div className="h-64">
              <Bar
                data={productPerformanceChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: { color: 'rgba(0, 0, 0, 0.05)' }
                    },
                    x: { grid: { display: false } }
                  },
                  plugins: {
                    legend: { display: false }
                  }
                }}
              />
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No product data available
            </div>
          )}
        </div>

        {/* Summary Section */}
        <div style={{ background: 'var(--card)', color: 'var(--foreground)', borderColor: 'var(--secondary)' }} className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Quick Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium" style={{ color: 'var(--muted-foreground)' }}>Approval Rate: </span>
              <span style={{ color: 'var(--primary)' }} className="font-semibold">
                {overviewData?.batches?.total ?
                  Math.round((overviewData.batches.approved / overviewData.batches.total) * 100) : 0}%
              </span>
            </div>
            <div>
              <span className="font-medium" style={{ color: 'var(--muted-foreground)' }}>Active Products: </span>
              <span style={{ color: 'var(--secondary)' }} className="font-semibold">{overviewData?.products || 0}</span>
            </div>
            <div>
              <span className="font-medium" style={{ color: 'var(--muted-foreground)' }}>Total Standards: </span>
              <span style={{ color: 'var(--primary)' }} className="font-semibold">{overviewData?.standards || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
