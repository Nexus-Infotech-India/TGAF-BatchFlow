import React, { useEffect, useState } from 'react';
import { dashboardService } from '../dashboard/service';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TrendDataPoint {
  date: string;
  approved: number;
  rejected: number;
  submitted: number;
  draft: number;
}

interface BatchTrendsData {
  period: string;
  trends: TrendDataPoint[];
}

const BatchTrends: React.FC = () => {
  const [trendsData, setTrendsData] = useState<BatchTrendsData | null>(null);
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'quarterly'>('weekly');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        setIsLoading(true);
        const response = await dashboardService.getBatchTrends(period);
        setTrendsData(response.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load batch trends');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrends();
  }, [period]);

  const handlePeriodChange = (newPeriod: 'weekly' | 'monthly' | 'quarterly') => {
    setPeriod(newPeriod);
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl shadow-sm">
      <motion.div 
        className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
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
  
  if (!trendsData || !trendsData.trends || trendsData.trends.length === 0) {
    return (
      <div className="p-6 bg-blue-50 rounded-xl shadow-sm border border-blue-100 text-blue-500">
        No trend data available
      </div>
    );
  }

  return (
    <motion.div 
      className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-400 text-white flex justify-between items-center flex-wrap gap-4">
        <motion.h2 
          className="text-2xl font-bold"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          Batch Trends
        </motion.h2>
        
        <motion.div 
          className="inline-flex rounded-md shadow-sm bg-white/20 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <button
            type="button"
            onClick={() => handlePeriodChange('weekly')}
            className={`px-4 py-2 text-sm font-medium rounded-l-md ${
              period === 'weekly'
                ? 'bg-white text-blue-600'
                : 'text-white hover:bg-white/10'
            } focus:outline-none transition-colors duration-200`}
          >
            Weekly
          </button>
          <button
            type="button"
            onClick={() => handlePeriodChange('monthly')}
            className={`px-4 py-2 text-sm font-medium border-x border-white/20 ${
              period === 'monthly'
                ? 'bg-white text-blue-600'
                : 'text-white hover:bg-white/10'
            } focus:outline-none transition-colors duration-200`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => handlePeriodChange('quarterly')}
            className={`px-4 py-2 text-sm font-medium rounded-r-md ${
              period === 'quarterly'
                ? 'bg-white text-blue-600'
                : 'text-white hover:bg-white/10'
            } focus:outline-none transition-colors duration-200`}
          >
            Quarterly
          </button>
        </motion.div>
      </div>

      <div className="p-6">
        <motion.div 
          className="bg-white rounded-lg shadow-md p-4 h-80"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trendsData.trends}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickMargin={10}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}
              />
              <Legend wrapperStyle={{ paddingTop: 10 }} />
              <Line 
                type="monotone" 
                dataKey="approved" 
                stroke="#10b981" 
                strokeWidth={2}
                activeDot={{ r: 8 }}
                animationDuration={1500}
              />
              <Line 
                type="monotone" 
                dataKey="rejected" 
                stroke="#ef4444" 
                strokeWidth={2}
                animationDuration={1500}
                animationBegin={300}
              />
              <Line 
                type="monotone" 
                dataKey="submitted" 
                stroke="#f59e0b" 
                strokeWidth={2}
                animationDuration={1500}
                animationBegin={600}
              />
              <Line 
                type="monotone" 
                dataKey="draft" 
                stroke="#6b7280" 
                strokeWidth={2}
                animationDuration={1500}
                animationBegin={900}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div 
          className="mt-6 bg-white rounded-lg shadow-md overflow-hidden"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-500 to-blue-400 text-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Approved
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Rejected
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Draft
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {trendsData.trends.map((point, index) => {
                  const total = point.approved + point.rejected + point.submitted + point.draft;
                  
                  return (
                    <motion.tr 
                      key={index}
                      className="hover:bg-blue-50 transition-colors duration-150"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 + (index * 0.05) }}
                    >
                      <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-blue-600">
                        {point.date}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {point.approved}
                        </span>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          {point.rejected}
                        </span>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          {point.submitted}
                        </span>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          {point.draft}
                        </span>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {total}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default BatchTrends;