import React, { useEffect, useState } from 'react';
import { dashboardService } from '../dashboard/service';
import { motion } from 'framer-motion';

interface StandardData {
  id: string;
  name: string;
  code: string;
  category: string;
  status: string;
  usageCount: number;
}

const StandardUsageMetrics: React.FC = () => {
  const [standards, setStandards] = useState<StandardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStandardUsage = async () => {
      try {
        const response = await dashboardService.getStandardUsageMetrics();
        setStandards(response.data.standards);
      } catch (err: any) {
        setError(err.message || 'Failed to load standard usage metrics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStandardUsage();
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
  
  if (!standards || standards.length === 0) return (
    <div className="p-6 bg-blue-50 rounded-xl shadow-sm border border-blue-100">
      No standard usage data available
    </div>
  );

  // Find max usage count for scaling
  const maxUsage = Math.max(...standards.map(s => s.usageCount));

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
          Standard Usage Metrics
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
                    Standard
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Usage Count
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {standards.map((standard, index) => (
                  <motion.tr 
                    key={standard.id}
                    className="hover:bg-blue-50 transition-colors duration-150"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 + (index * 0.05) }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-indigo-500 to-blue-400 rounded-md flex items-center justify-center text-white font-bold">
                          {standard.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{standard.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {standard.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {standard.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${standard.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : ''}
                        ${standard.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' : ''}
                        ${standard.status === 'ARCHIVED' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${standard.status === 'DEPRECATED' ? 'bg-red-100 text-red-800' : ''}
                      `}>
                        {standard.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-900 mr-2">{standard.usageCount}</span>
                        <div className="w-full max-w-[100px] bg-gray-200 rounded-full h-2">
                          <motion.div 
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${(standard.usageCount / maxUsage) * 100}%` }}
                            transition={{ duration: 0.8, delay: 0.3 + (index * 0.05) }}
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

export default StandardUsageMetrics;