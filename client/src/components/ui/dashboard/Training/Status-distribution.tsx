import React, { useState } from 'react';
import { Pie, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_ROUTES } from '../../../../utils/api';
import { Loader2, PieChart, AlertCircle, Calendar, ClipboardCheck, Clock, XCircle, CalendarX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

// Color palette for status types
const statusColors = {
  SCHEDULED: 'rgba(54, 162, 235, 0.8)',
  IN_PROGRESS: 'rgba(255, 206, 86, 0.8)',
  COMPLETED: 'rgba(75, 192, 192, 0.8)',
  CANCELLED: 'rgba(255, 99, 132, 0.8)',
  POSTPONED: 'rgba(153, 102, 255, 0.8)',
};

// Border colors (slightly darker versions)
const statusBorderColors = {
  SCHEDULED: 'rgba(54, 162, 235, 1)',
  IN_PROGRESS: 'rgba(255, 206, 86, 1)',
  COMPLETED: 'rgba(75, 192, 192, 1)',
  CANCELLED: 'rgba(255, 99, 132, 1)',
  POSTPONED: 'rgba(153, 102, 255, 1)',
};

// Status icons
const statusIcons = {
  SCHEDULED: <Calendar className="h-4 w-4 text-blue-500" />,
  IN_PROGRESS: <Clock className="h-4 w-4 text-yellow-500" />,
  COMPLETED: <ClipboardCheck className="h-4 w-4 text-green-500" />,
  CANCELLED: <XCircle className="h-4 w-4 text-red-500" />,
  POSTPONED: <CalendarX className="h-4 w-4 text-purple-500" />,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100 }
  }
};

const StatusDistributionChart: React.FC = () => {
  const [chartType, setChartType] = useState<'pie' | 'doughnut'>('doughnut');
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['trainingStatusDistribution'],
    queryFn: async () => {
      const response = await axios.get(API_ROUTES.TRAINING.GET_TRAINING_SUMMARY_STATS, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      return response.data.data.statusDistribution;
    },
  });

  if (isLoading) {
    return (
      <motion.div 
        className="bg-white rounded-xl shadow-lg h-[380px] flex flex-col items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Loading status distribution...</p>
      </motion.div>
    );
  }

  if (error || !data) {
    return (
      <motion.div 
        className="bg-white rounded-xl shadow-lg h-[380px] flex flex-col items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <p className="text-gray-700 font-medium">Failed to load status data</p>
        <p className="text-gray-500 text-sm mt-1">Please try again later</p>
      </motion.div>
    );
  }

  const chartData = {
    labels: data.map((item: any) => item.status),
    datasets: [
      {
        data: data.map((item: any) => item.count),
        backgroundColor: data.map((item: any) => statusColors[item.status as keyof typeof statusColors] || 'rgba(201, 203, 207, 0.8)'),
        borderColor: data.map((item: any) => statusBorderColors[item.status as keyof typeof statusBorderColors] || 'rgba(201, 203, 207, 1)'),
        borderWidth: 2,
        hoverOffset: 15,
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#333',
        bodyColor: '#666',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 10,
        boxPadding: 5,
        usePointStyle: true,
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    maintainAspectRatio: false,
    cutout: chartType === 'doughnut' ? '65%' : 0,
  };

  // Calculate total
  const total = data.reduce((sum: number, item: any) => sum + item.count, 0);

  // Sort data by count (descending)
  const sortedData = [...data].sort((a, b) => b.count - a.count);
  
  // Find dominant status
  const dominantStatus = sortedData[0]?.status || 'NONE';
  const dominantCount = sortedData[0]?.count || 0;
  const dominantPercentage = total > 0 ? Math.round((dominantCount / total) * 100) : 0;

  return (
    <motion.div 
      className="bg-white rounded-xl shadow-lg overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-700 to-gray-800 p-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Training Status Distribution</h2>
          <p className="text-gray-300 text-sm">Overview of {total} trainings by status</p>
        </div>
        
        <div className="flex items-center space-x-1 bg-white/10 rounded-lg p-1">
          <motion.button
            className={`p-1.5 rounded-md ${chartType === 'doughnut' ? 'bg-white text-gray-800' : 'text-white'}`}
            onClick={() => setChartType('doughnut')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <PieChart className="h-4 w-4" />
          </motion.button>
          <motion.button
            className={`p-1.5 rounded-md ${chartType === 'pie' ? 'bg-white text-gray-800' : 'text-white'}`}
            onClick={() => setChartType('pie')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 2a10 10 0 0 1 10 10"></path>
              <path d="m12 12 8.5-5"></path>
            </svg>
          </motion.button>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Chart */}
          <motion.div 
            className="col-span-1 md:col-span-3 relative"
            variants={itemVariants}
          >
            <div className="h-[220px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={chartType}
                  className="w-full h-full"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                >
                  {chartType === 'doughnut' ? (
                    <Doughnut data={chartData} options={options} />
                  ) : (
                    <Pie data={chartData} options={options} />
                  )}
                </motion.div>
              </AnimatePresence>
              
              {chartType === 'doughnut' && (
                <motion.div 
                  className="absolute inset-0 flex flex-col items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-2xl font-bold">{total}</p>
                  <p className="text-xs text-gray-500">Total Trainings</p>
                </motion.div>
              )}
            </div>
            
            <motion.div 
              className="absolute top-0 right-0 bg-gradient-to-r from-gray-700 to-gray-800 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center shadow-md"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {statusIcons[dominantStatus as keyof typeof statusIcons] || <div className="h-4 w-4" />}
              <span className="ml-1">{dominantStatus}: {dominantPercentage}%</span>
            </motion.div>
          </motion.div>
          
          {/* Stats */}
          <motion.div 
            className="col-span-1 md:col-span-2 flex flex-col"
            variants={itemVariants}
          >
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
              <PieChart className="h-4 w-4 mr-1.5 text-gray-600" />
              Status Breakdown
            </h3>
            
            <div className="space-y-3 flex-grow">
              {sortedData.map((item: any, index: number) => {
                const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
                
                return (
                  <motion.div
                    key={item.status}
                    className="bg-gray-50 p-3 rounded-lg border border-gray-100"
                    variants={itemVariants}
                    whileHover={{ 
                      scale: 1.02, 
                      boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                      backgroundColor: `${statusColors[item.status as keyof typeof statusColors]}15`
                    }}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <div 
                          className="p-1 rounded-md mr-2"
                          style={{ backgroundColor: `${statusColors[item.status as keyof typeof statusColors]}20` }}
                        >
                          {statusIcons[item.status as keyof typeof statusIcons] || <div className="h-4 w-4" />}
                        </div>
                        <span className="font-medium text-sm">{item.status}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm font-semibold">{item.count}</span>
                        <span className="text-xs text-gray-500 ml-1">({percentage}%)</span>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                      <motion.div
                        className="h-1.5 rounded-full"
                        style={{ 
                          backgroundColor: statusColors[item.status as keyof typeof statusColors] || 'rgba(201, 203, 207, 0.8)'
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: 0.2 + index * 0.1, duration: 0.6 }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
            
            {data.length === 0 && (
              <div className="flex-grow flex items-center justify-center text-center">
                <div>
                  <AlertCircle className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No status data available</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default StatusDistributionChart;