import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_ROUTES } from '../../../../utils/api';
import { Loader2, ChevronDown, ChevronUp, TrendingUp, CalendarDays, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

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

const MonthlyTrainingTrends: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [showYearDropdown, setShowYearDropdown] = useState<boolean>(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['trainingMonthlyStats', selectedYear],
    queryFn: async () => {
      const response = await axios.get(`${API_ROUTES.TRAINING.GET_TRAINING_MONTHLY_STATS}?year=${selectedYear}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      return response.data.data;
    },
  });

  // Available years for selection (last 3 years)
  const availableYears = [currentYear, currentYear - 1, currentYear - 2];

  if (isLoading) {
    return (
      <motion.div 
        className="bg-white rounded-xl shadow-lg h-[450px] flex flex-col items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Loading monthly trends...</p>
      </motion.div>
    );
  }

  if (error || !data) {
    return (
      <motion.div 
        className="bg-white rounded-xl shadow-lg h-[450px] flex flex-col items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <TrendingUp className="h-16 w-16 text-gray-300 mb-4" />
        <p className="text-gray-700 font-medium">Failed to load monthly training data</p>
        <p className="text-gray-500 text-sm mt-1">Please try again later</p>
      </motion.div>
    );
  }

  const chartData = {
    labels: data.months.map((month: any) => month.monthName),
    datasets: [
      {
        label: 'Total Trainings',
        data: data.months.map((month: any) => month.trainingsCount),
        borderColor: 'rgba(59, 130, 246, 1)', // More vibrant blue
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 1,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Completed Trainings',
        data: data.months.map((month: any) => month.completedTrainings),
        borderColor: 'rgba(16, 185, 129, 1)', // More vibrant green
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(16, 185, 129, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 1,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Participants',
        data: data.months.map((month: any) => month.participantsCount),
        borderColor: 'rgba(124, 58, 237, 1)', // More vibrant purple
        backgroundColor: 'rgba(124, 58, 237, 0.15)',
        borderDash: [5, 5],
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointBackgroundColor: 'rgba(124, 58, 237, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 1,
        pointRadius: 4,
        pointHoverRadius: 6,
        yAxisID: 'y1',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 10,
          }
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Trainings',
          font: {
            size: 11,
            family: "'Inter', sans-serif",
          },
          color: 'rgba(107, 114, 128, 1)'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        min: 0,
        ticks: {
          stepSize: 1,
          font: {
            size: 10
          }
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Participants',
          font: {
            size: 11,
            family: "'Inter', sans-serif",
          },
          color: 'rgba(107, 114, 128, 1)'
        },
        grid: {
          drawOnChartArea: false,
        },
        min: 0,
        ticks: {
          stepSize: 5,
          font: {
            size: 10
          }
        },
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          boxWidth: 10,
          padding: 10,
          font: {
            size: 11,
            family: "'Inter', sans-serif",
          },
          usePointStyle: true,
          pointStyleWidth: 8
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#333',
        bodyColor: '#666',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 8,
        boxPadding: 4,
        usePointStyle: true,
        bodyFont: {
          size: 11,
          family: "'Inter', sans-serif",
        },
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y;
            }
            return label;
          }
        }
      }
    },
  };

  // Calculate totals
  const totalTrainings = data.months.reduce((sum: number, month: any) => sum + month.trainingsCount, 0);
  const totalCompleted = data.months.reduce((sum: number, month: any) => sum + month.completedTrainings, 0);
  const totalParticipants = data.months.reduce((sum: number, month: any) => sum + month.participantsCount, 0);
  const completionRate = totalTrainings > 0 ? Math.round((totalCompleted / totalTrainings) * 100) : 0;

  // Find highest month for trainings and participants
  let peakTrainingsMonth = { name: '', value: 0 };
  let peakParticipantsMonth = { name: '', value: 0 };

  data.months.forEach((month: any) => {
    if (month.trainingsCount > peakTrainingsMonth.value) {
      peakTrainingsMonth = { name: month.monthName, value: month.trainingsCount };
    }
    if (month.participantsCount > peakParticipantsMonth.value) {
      peakParticipantsMonth = { name: month.monthName, value: month.participantsCount };
    }
  });

  return (
    <motion.div 
      className="bg-white rounded-xl shadow-lg overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Monthly Training Trends</h2>
          <p className="text-blue-100 text-sm">Training and participation metrics by month</p>
        </div>
        
        <div className="relative">
          <motion.button
            className="flex items-center bg-white/20 hover:bg-white/30 text-white rounded-lg px-3 py-1.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
            onClick={() => setShowYearDropdown(!showYearDropdown)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            {selectedYear}
            {showYearDropdown ? 
              <ChevronUp className="h-4 w-4 ml-2" /> : 
              <ChevronDown className="h-4 w-4 ml-2" />
            }
          </motion.button>
          
          <AnimatePresence>
            {showYearDropdown && (
              <motion.div 
                className="absolute right-0 mt-1 bg-white shadow-lg rounded-md overflow-hidden z-10"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {availableYears.map((year) => (
                  <div 
                    key={year} 
                    className={`px-4 py-2 cursor-pointer text-sm transition-colors ${
                      year === selectedYear ? 
                        'bg-blue-50 text-blue-700 font-medium' : 
                        'hover:bg-gray-50 text-gray-800'
                    }`}
                    onClick={() => {
                      setSelectedYear(year);
                      setShowYearDropdown(false);
                    }}
                  >
                    {year}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Chart area */}
      <motion.div 
        className="p-4"
        variants={itemVariants}
      >
        <div className="h-[280px]">
          <Line data={chartData} options={options} />
        </div>
      </motion.div>
      
      {/* Stats summary */}
      <motion.div 
        className="grid grid-cols-2 md:grid-cols-4 gap-2 p-4 pt-0"
        variants={itemVariants}
      >
        <div className="col-span-2 md:col-span-4 mb-2">
          <h3 className="text-sm font-medium text-gray-500">Year Summary</h3>
          <div className="h-1 w-12 bg-blue-500 rounded-full mt-1 mb-3"></div>
        </div>
        
        <motion.div 
          className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200"
          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Total Trainings</p>
              <p className="text-2xl font-bold text-blue-800 mt-2">{totalTrainings}</p>
            </div>
            <div className="bg-blue-200/50 p-2 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-700" />
            </div>
          </div>
          <p className="text-xs text-blue-700 mt-2">
            Peak: {peakTrainingsMonth.name} ({peakTrainingsMonth.value})
          </p>
        </motion.div>
        
        <motion.div 
          className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200"
          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Completed</p>
              <p className="text-2xl font-bold text-green-800 mt-2">{totalCompleted}</p>
            </div>
            <div className="bg-green-200/50 p-2 rounded-lg">
              <div className="relative h-5 w-5 flex items-center justify-center">
                <div className="absolute inset-0 bg-green-700 rounded-full opacity-20 animate-ping"></div>
                <div className="h-4 w-4 bg-green-700 rounded-full"></div>
              </div>
            </div>
          </div>
          <p className="text-xs text-green-700 mt-2">
            Completion Rate: {completionRate}%
          </p>
        </motion.div>
        
        <motion.div 
          className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200"
          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium">Participants</p>
              <p className="text-2xl font-bold text-purple-800 mt-2">{totalParticipants}</p>
            </div>
            <div className="bg-purple-200/50 p-2 rounded-lg">
              <Users className="h-5 w-5 text-purple-700" />
            </div>
          </div>
          <p className="text-xs text-purple-700 mt-2">
            Peak: {peakParticipantsMonth.name} ({peakParticipantsMonth.value})
          </p>
        </motion.div>
        
        <motion.div 
          className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200"
          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-amber-700 font-medium">Avg. Per Month</p>
              <p className="text-2xl font-bold text-amber-800 mt-2">
                {(totalTrainings / data.months.length).toFixed(1)}
              </p>
            </div>
            <div className="bg-amber-200/50 p-2 rounded-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-700">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-amber-700 mt-2">
            {(totalParticipants / totalTrainings).toFixed(1)} participants per training
          </p>
        </motion.div>
      </motion.div>
      
      {/* Monthly distribution - small bar indicators */}
      <motion.div 
        className="px-4 pb-4"
        variants={itemVariants}
      >
        <div className="bg-gray-50 rounded-xl p-3">
          <h3 className="text-xs font-medium text-gray-600 mb-3">Monthly Distribution</h3>
          <div className="grid grid-cols-12 gap-1 h-12">
            {data.months.map((month: any, index: number) => {
              // Calculate height percentage based on max value in the year
              const maxMonthlyTrainings = Math.max(...data.months.map((m: any) => m.trainingsCount));
              const heightPercentage = maxMonthlyTrainings > 0 
                ? (month.trainingsCount / maxMonthlyTrainings) * 100 
                : 0;
              
              return (
                <div key={index} className="flex flex-col items-center justify-end h-full">
                  <motion.div
                    className="w-full bg-blue-500 rounded-t-sm"
                    style={{ height: `${heightPercentage}%` }}
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPercentage}%` }}
                    transition={{ delay: 0.3 + index * 0.05, duration: 0.5 }}
                    whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.8)' }}
                  />
                  <span className="text-[9px] text-gray-500 mt-1 truncate w-full text-center">
                    {month.monthName.substring(0, 3)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MonthlyTrainingTrends;