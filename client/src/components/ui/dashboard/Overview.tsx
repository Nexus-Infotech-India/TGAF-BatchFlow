import React, { useEffect, useState } from 'react';
import { dashboardService } from '../dashboard/service';
import { motion } from 'framer-motion';

interface OverviewStatsData {
  batches: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  products: number;
  standards: number;
  users: number;
  recentActivities: any[];
}

const OverviewStats: React.FC = () => {
  const [stats, setStats] = useState<OverviewStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await dashboardService.getOverviewStats();
        setStats(response.data.stats);
      } catch (err: any) {
        setError(err.message || 'Failed to load overview statistics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
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
  
  if (!stats) return (
    <div className="p-6 bg-blue-50 rounded-xl shadow-sm border border-blue-100">
      No statistics available
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
          Overview
        </motion.h2>
      </div>
      
      <div className="p-6 grid grid-cols-4 gap-4">
        <motion.div 
          className="bg-white p-4 rounded-lg shadow-md overflow-hidden relative"
          whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3)" }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="absolute top-0 right-0 w-20 h-20 -mr-6 -mt-6 bg-blue-500 opacity-10 rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 -ml-4 -mb-4 bg-blue-500 opacity-10 rounded-full"></div>
          
          <h3 className="text-gray-500 text-sm font-medium">Batches</h3>
          <div className="text-3xl font-bold text-blue-600 mt-1">{stats.batches.total}</div>
          
          <div className="mt-3 space-y-1">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Pending:</span> 
              <motion.span 
                className="font-medium text-yellow-600"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {stats.batches.pending}
              </motion.span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Approved:</span> 
              <motion.span 
                className="font-medium text-green-600"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {stats.batches.approved}
              </motion.span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Rejected:</span> 
              <motion.span 
                className="font-medium text-red-600"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                {stats.batches.rejected}
              </motion.span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white p-4 rounded-lg shadow-md overflow-hidden relative"
          whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3)" }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="absolute top-0 right-0 w-20 h-20 -mr-6 -mt-6 bg-indigo-500 opacity-10 rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 -ml-4 -mb-4 bg-indigo-500 opacity-10 rounded-full"></div>
          
          <h3 className="text-gray-500 text-sm font-medium">Products</h3>
          <motion.div 
            className="text-3xl font-bold text-indigo-600 mt-1"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            {stats.products}
          </motion.div>
        </motion.div>

        <motion.div 
          className="bg-white p-4 rounded-lg shadow-md overflow-hidden relative"
          whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3)" }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <div className="absolute top-0 right-0 w-20 h-20 -mr-6 -mt-6 bg-cyan-500 opacity-10 rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 -ml-4 -mb-4 bg-cyan-500 opacity-10 rounded-full"></div>
          
          <h3 className="text-gray-500 text-sm font-medium">Standards</h3>
          <motion.div 
            className="text-3xl font-bold text-cyan-600 mt-1"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            {stats.standards}
          </motion.div>
        </motion.div>

        <motion.div 
          className="bg-white p-4 rounded-lg shadow-md overflow-hidden relative"
          whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3)" }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <div className="absolute top-0 right-0 w-20 h-20 -mr-6 -mt-6 bg-sky-500 opacity-10 rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 -ml-4 -mb-4 bg-sky-500 opacity-10 rounded-full"></div>
          
          <h3 className="text-gray-500 text-sm font-medium">Users</h3>
          <motion.div 
            className="text-3xl font-bold text-sky-600 mt-1"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            {stats.users}
          </motion.div>
        </motion.div>
      </div>

      <motion.div 
        className="p-6 border-t border-blue-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h3 className="text-lg font-medium text-gray-700 mb-4">Recent Activities</h3>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {stats.recentActivities.map((activity, index) => (
              <motion.li 
                key={index}
                className="p-4 hover:bg-blue-50 transition-colors duration-150"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.5 + (index * 0.1) }}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      {activity.User.name.charAt(0)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.User.name}
                    </p>
                    <p className="text-sm text-gray-600 truncate">
                      {activity.action}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {activity.Batch && (
                    <div className="flex-shrink-0">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                        ${activity.Batch.status === 'APPROVED' ? 'bg-green-100 text-green-800' : ''}
                        ${activity.Batch.status === 'REJECTED' ? 'bg-red-100 text-red-800' : ''}
                        ${activity.Batch.status === 'SUBMITTED' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${activity.Batch.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' : ''}
                      `}>
                        {activity.Batch.status}
                      </span>
                    </div>
                  )}
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default OverviewStats;