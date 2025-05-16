import React, { useEffect, useState } from 'react';
import { dashboardService } from '../dashboard/service';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface BatchSummary {
  month: string;
  totalBatches: number;
  approved: number;
  rejected: number;
  pending: number;
  draft: number;
  productDistribution: Record<string, number>;
  timeToApproval: number;
  batches: Array<{
    id: string;
    batchNumber: string;
    productName: string;
    status: string;
    createdAt: string;
    createdBy: string;
    reviewedBy: string | null;
  }>;
}

const COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'];
const STATUS_COLORS = {
  APPROVED: '#10b981',
  REJECTED: '#ef4444',
  SUBMITTED: '#f59e0b',
  DRAFT: '#6b7280',
};

const MonthlyBatchSummary: React.FC = () => {
  const [summary, setSummary] = useState<BatchSummary | null>(null);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1); // 1-12
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setIsLoading(true);
        const response = await dashboardService.getMonthlyBatchSummary(month, year);
        setSummary(response.data.summary);
      } catch (err: any) {
        setError(err.message || 'Failed to load monthly summary');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, [month, year]);

  const handleMonthChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setMonth(parseInt(event.target.value));
  };

  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setYear(parseInt(event.target.value));
  };
  
  // Convert product distribution to chart data
  const getPieChartData = () => {
    if (!summary) return [];
    
    return Object.entries(summary.productDistribution).map(([name, value]) => ({
      name,
      value,
    }));
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl shadow-sm">
      <motion.div 
        className="w-16 h-16 border-4 border-blue-500 rounded-full border-t-transparent"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
  
  if (error) return (
    <div className="p-6 bg-red-50 rounded-xl shadow-sm border border-red-100 text-red-500">
      {error}
    </div>
  );
  
  if (!summary) return (
    <div className="p-6 bg-blue-50 rounded-xl shadow-sm border border-blue-100">
      No summary data available
    </div>
  );

  return (
    <motion.div 
      className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-400 text-white flex justify-between items-center">
        <motion.h2 
          className="text-2xl font-bold"
          initial={{ x: -20 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.5 }}
        >
          Monthly Batch Summary
        </motion.h2>
        
        <div className="flex space-x-2">
          <select 
            value={month}
            onChange={handleMonthChange}
            className="bg-white/20 backdrop-blur-sm border-0 rounded px-3 py-2 text-white"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>
                {new Date(0, m - 1).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
          
          <select 
            value={year}
            onChange={handleYearChange}
            className="bg-white/20 backdrop-blur-sm border-0 rounded px-3 py-2 text-white"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4 p-6">
        {[
          { label: "Total Batches", value: summary.totalBatches, color: "blue" },
          { label: "Approved", value: summary.approved, color: "green" },
          { label: "Rejected", value: summary.rejected, color: "red" },
          { label: "Pending", value: summary.pending, color: "yellow" },
          { label: "Avg Approval Time", value: `${summary.timeToApproval} hrs`, color: "indigo" }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            className={`bg-white shadow rounded-lg p-4 flex flex-col items-center justify-center text-${stat.color}-600`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3)" }}
          >
            <h3 className="text-sm font-medium text-gray-500">{stat.label}</h3>
            <p className="text-2xl font-bold">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 p-6">
        <motion.div 
          className="bg-white shadow rounded-lg p-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3 className="text-lg font-medium text-gray-700 mb-4">Product Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getPieChartData()}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {getPieChartData().map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white shadow rounded-lg p-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3 className="text-lg font-medium text-gray-700 mb-4">Status Distribution</h3>
          <div className="space-y-4">
            {['APPROVED', 'REJECTED', 'SUBMITTED', 'DRAFT'].map(status => {
              const value = summary[status.toLowerCase() as keyof BatchSummary] as number;
              const percentage = summary.totalBatches > 0 
                ? Math.round((value / summary.totalBatches) * 100) 
                : 0;
                
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm">
                    <span>{status}</span>
                    <span>{value} ({percentage}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full"
                      style={{ backgroundColor: STATUS_COLORS[status as keyof typeof STATUS_COLORS] }}
                      initial={{ width: '0%' }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      <motion.div 
        className="p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <h3 className="text-lg font-medium text-gray-700 mb-4">Recent Batches ({summary.month})</h3>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Batch Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reviewed By
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {summary.batches.map((batch, index) => (
                  <motion.tr 
                    key={batch.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: 0.6 + (index * 0.05) }}
                    className="hover:bg-blue-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {batch.batchNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {batch.productName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${batch.status === 'APPROVED' ? 'bg-green-100 text-green-800' : ''}
                          ${batch.status === 'REJECTED' ? 'bg-red-100 text-red-800' : ''}
                          ${batch.status === 'SUBMITTED' ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${batch.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' : ''}
                        `}
                      >
                        {batch.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(batch.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {batch.createdBy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {batch.reviewedBy || '-'}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MonthlyBatchSummary;