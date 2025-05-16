import React, { useEffect, useState } from 'react';
import { dashboardService } from '../dashboard/service';
import { motion } from 'framer-motion';

interface QualityMetric {
  productName: string;
  totalBatches: number;
  avgMoisture: number;
  avgWaterActivity: number;
  avgTotalAsh: number;
}

const QualityMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<QualityMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQualityMetrics = async () => {
      try {
        const response = await dashboardService.getQualityMetrics();
        setMetrics(response.data.qualityMetrics);
      } catch (err: any) {
        setError(err.message || 'Failed to load quality metrics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQualityMetrics();
  }, []);

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
  
  if (!metrics || metrics.length === 0) return (
    <div className="p-6 bg-blue-50 rounded-xl shadow-sm border border-blue-100">
      No quality metrics available
    </div>
  );

  return (
    <motion.div 
      className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-400 text-white">
        <motion.h2 
          className="text-2xl font-bold"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          Quality Metrics
        </motion.h2>
      </div>
      
      <div className="p-6">
        <motion.div 
          className="bg-white rounded-lg shadow-md overflow-hidden"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-500 to-blue-400 text-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Batches
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Avg. Moisture (%)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Avg. Water Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Avg. Total Ash (%)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metrics.map((metric, index) => (
                  <motion.tr 
                    key={index}
                    className="hover:bg-blue-50 transition-colors duration-150"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 + (index * 0.05) }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-400 rounded-md flex items-center justify-center text-white font-bold">
                          {metric.productName.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{metric.productName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {metric.totalBatches}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-900">{metric.avgMoisture.toFixed(2)}%</span>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <motion.div 
                            className="bg-blue-500 h-1.5 rounded-full"
                            style={{ width: `${Math.min(metric.avgMoisture * 10, 100)}%` }}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(metric.avgMoisture * 10, 100)}%` }}
                            transition={{ duration: 1 }}
                          ></motion.div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-900">{metric.avgWaterActivity.toFixed(3)}</span>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <motion.div 
                            className="bg-cyan-500 h-1.5 rounded-full"
                            style={{ width: `${Math.min(metric.avgWaterActivity * 100, 100)}%` }}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(metric.avgWaterActivity * 100, 100)}%` }}
                            transition={{ duration: 1 }}
                          ></motion.div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-900">{metric.avgTotalAsh.toFixed(2)}%</span>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <motion.div 
                            className="bg-indigo-500 h-1.5 rounded-full"
                            style={{ width: `${Math.min(metric.avgTotalAsh * 5, 100)}%` }}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(metric.avgTotalAsh * 5, 100)}%` }}
                            transition={{ duration: 1 }}
                          ></motion.div>
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default QualityMetrics;