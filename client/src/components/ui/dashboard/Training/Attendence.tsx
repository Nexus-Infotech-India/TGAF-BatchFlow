import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_ROUTES } from '../../../../utils/api';
import { Loader2, UserCheck, UserX, Clock, AlertCircle, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

// Color palette for attendance status
const statusColors = {
  PRESENT: 'rgba(75, 192, 192, 0.8)',
  ABSENT: 'rgba(255, 99, 132, 0.8)',
  LATE: 'rgba(255, 206, 86, 0.8)',
  EXCUSED: 'rgba(153, 102, 255, 0.8)',
};

const statusBorderColors = {
  PRESENT: 'rgba(75, 192, 192, 1)',
  ABSENT: 'rgba(255, 99, 132, 1)',
  LATE: 'rgba(255, 206, 86, 1)',
  EXCUSED: 'rgba(153, 102, 255, 1)',
};

const statusIcons = {
  PRESENT: <UserCheck className="h-4 w-4 text-green-500" />,
  ABSENT: <UserX className="h-4 w-4 text-red-500" />,
  LATE: <Clock className="h-4 w-4 text-yellow-500" />,
  EXCUSED: <AlertCircle className="h-4 w-4 text-purple-500" />,
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

const AttendanceOverview: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['attendanceStats'],
    queryFn: async () => {
      const response = await axios.get(API_ROUTES.TRAINING.GET_TRAINING_ATTENDANCE_STATS, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      return response.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 w-full">
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          <p className="mt-4 text-gray-500 font-medium">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 w-full">
        <div className="flex flex-col items-center justify-center h-64">
          <AlertCircle className="h-12 w-12 text-red-400 mb-2" />
          <p className="text-gray-700 font-medium">Failed to load attendance data</p>
          <p className="text-gray-500 text-sm mt-1">Please try again later</p>
        </div>
      </div>
    );
  }

  // Check if any trainings have attendance data
  const hasTrainingData = data.trainingAttendanceRates && data.trainingAttendanceRates.length > 0;
  
  // Calculate average attendance rate
  const averageAttendanceRate = hasTrainingData
    ? Math.round(
        data.trainingAttendanceRates.reduce((sum: number, training: any) => sum + training.attendanceRate, 0) /
          data.trainingAttendanceRates.length
      )
    : 0;

  const chartData = {
    labels: data.statusDistribution.map((item: any) => item.status),
    datasets: [
      {
        data: data.statusDistribution.map((item: any) => item.count),
        backgroundColor: data.statusDistribution.map(
          (item: any) => statusColors[item.status as keyof typeof statusColors] || 'rgba(201, 203, 207, 0.8)'
        ),
        borderColor: data.statusDistribution.map(
          (item: any) => statusBorderColors[item.status as keyof typeof statusBorderColors] || 'rgba(201, 203, 207, 1)'
        ),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#333',
        bodyColor: '#666',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 10,
        boxPadding: 5,
        bodyFont: {
          size: 12,
        },
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
    cutout: '75%',
  };

  // Get top 3 trainings by attendance rate
  const topTrainings = [...(data.trainingAttendanceRates || [])]
    .sort((a, b) => b.attendanceRate - a.attendanceRate)
    .slice(0, 3);

  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-5">
        <h2 className="text-xl font-bold text-white">Attendance Overview</h2>
        <p className="text-blue-100 text-sm mt-1">Attendance rates and distribution by status</p>
      </div>
      
      {/* Content */}
      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column - Chart */}
          <motion.div 
            className="flex flex-col items-center"
            variants={itemVariants}
          >
            <div className="h-48 w-48 relative flex items-center justify-center">
              <Doughnut data={chartData} options={options} />
              <motion.div 
                className="absolute flex flex-col items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              >
                <span className="text-3xl font-bold">{data.totalAttendance}</span>
                <span className="text-xs text-gray-500">Records</span>
              </motion.div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-4 w-full">
              {data.statusDistribution.map((item: any) => (
                <motion.div 
                  key={item.status} 
                  className="flex items-center p-3 rounded-lg"
                  style={{ 
                    backgroundColor: `${statusColors[item.status as keyof typeof statusColors]}15` 
                  }}
                  variants={itemVariants}
                  whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                >
                  <div className="mr-2 p-1.5 rounded-full" style={{ 
                    backgroundColor: `${statusColors[item.status as keyof typeof statusColors]}30` 
                  }}>
                    {statusIcons[item.status as keyof typeof statusIcons] || <div className="h-4 w-4" />}
                  </div>
                  <div>
                    <div className="flex items-center">
                      <span className="text-xs font-medium">{item.status}</span>
                      <span className="text-xs ml-1">({item.percentage}%)</span>
                    </div>
                    <span className="text-xs text-gray-500">{item.count} records</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
          
          {/* Right column - Stats */}
          <motion.div variants={itemVariants}>
            {/* Progress Circle */}
            <motion.div 
              className="mb-6 flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <ProgressCircle value={averageAttendanceRate} size={100} strokeWidth={10}>
                <div className="flex flex-col items-center justify-center">
                  <motion.span 
                    className="text-2xl font-bold"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    {averageAttendanceRate}%
                  </motion.span>
                  <span className="text-xs text-gray-500">Average Attendance</span>
                </div>
              </ProgressCircle>
            </motion.div>
            
            {/* Top Trainings */}
            <div className="bg-gray-50 p-4 rounded-xl">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <Trophy className="h-4 w-4 text-amber-500 mr-1.5" />
                Top Trainings by Attendance
              </h4>
              
              <div className="space-y-3">
                {hasTrainingData ? (
                  topTrainings.map((training: any, index: number) => (
                    <motion.div 
                      key={training.id} 
                      className="bg-white p-3 rounded-lg shadow-sm"
                      variants={itemVariants}
                      whileHover={{ 
                        y: -2, 
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                          <span className="text-sm font-medium ml-2 truncate max-w-[140px]" title={training.title}>
                            {training.title}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm font-bold text-green-600">{training.attendanceRate}%</span>
                          <ChevronRight className="h-4 w-4 text-gray-400 ml-1" />
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>{training.attendanceCount}/{training.participantsCount} attendees</span>
                          <span className={`font-medium ${
                            training.attendanceRate >= 80 ? 'text-green-600' : 
                            training.attendanceRate >= 60 ? 'text-blue-600' : 
                            training.attendanceRate >= 40 ? 'text-amber-600' : 
                            'text-red-600'
                          }`}>
                            {training.attendanceRate >= 80 ? 'Excellent' : 
                             training.attendanceRate >= 60 ? 'Good' : 
                             training.attendanceRate >= 40 ? 'Average' : 
                             'Poor'}
                          </span>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ 
                              backgroundColor: 
                                training.attendanceRate >= 80 ? '#10b981' : 
                                training.attendanceRate >= 60 ? '#3b82f6' : 
                                training.attendanceRate >= 40 ? '#f59e0b' : 
                                '#ef4444'
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${training.attendanceRate}%` }}
                            transition={{ delay: 0.4 + index * 0.1, duration: 0.6, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <motion.div 
                    className="bg-white p-4 rounded-lg text-center"
                    variants={itemVariants}
                  >
                    <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No training attendance data available</p>
                    <p className="text-xs text-gray-500 mt-1">Complete some trainings to see attendance metrics</p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default AttendanceOverview;

// Create a helper component for the progress circle
const ProgressCircle = ({ 
  value, 
  size = 100, 
  strokeWidth = 8, 
  children 
}: { 
  value: number; 
  size?: number; 
  strokeWidth?: number; 
  children?: React.ReactNode;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  
  const colorMap = {
    excellent: '#10b981', // green for high values
    good: '#3b82f6',     // blue for medium values
    average: '#f59e0b',  // amber for low values
    poor: '#ef4444'      // red for very low values
  };
  
  const getColor = (value: number) => {
    if (value >= 80) return colorMap.excellent;
    if (value >= 60) return colorMap.good;
    if (value >= 40) return colorMap.average;
    return colorMap.poor;
  };

  return (
    <div style={{ width: size, height: size }} className="relative">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#eef2ff"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={getColor(value)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
      
      {/* Small indicator in the outer edge */}
      <div 
        className="absolute w-3 h-3 rounded-full border-2 border-white"
        style={{
          backgroundColor: getColor(value),
          left: `${size / 2 + (radius) * Math.cos(2 * Math.PI * value / 100 - Math.PI / 2)}px`,
          top: `${size / 2 + (radius) * Math.sin(2 * Math.PI * value / 100 - Math.PI / 2)}px`,
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
        }}
      />
    </div>
  );
};

// Trophy icon
const Trophy = (props: any) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
      <path d="M4 22h16"></path>
      <path d="M10 14.66V17c0 .55-.47.98-.97 1l-.03-.01A1 1 0 0 1 8 17v-2.34"></path>
      <path d="M14 14.66V17c0 .55.47.98.97 1l.03-.01a1 1 0 0 0 1-1v-2.34"></path>
      <path d="M8 14a5 5 0 1 1 8 0"></path>
      <path d="M18 9a5 5 0 0 1-8 0"></path>
      <path d="M6 9a5 5 0 0 0 8 0"></path>
    </svg>
  );
};