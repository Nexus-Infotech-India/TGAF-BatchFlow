import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  CalendarCheck,
  CalendarClock,
  Users,
  CheckCircle,
  BarChart3,
  PieChart,
  TrendingUp,
  Calendar,
  User,
  Star,
  BookOpen,
  Medal,
  ArrowUpRight,
  MapPin,
  Building,
  ChevronRight,
  Download,
  Activity,
  FileText,
  ArrowRight
} from 'lucide-react';
import {
  Bar,
  Line,
  Doughnut,
} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
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
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Define types
type TrainingSummary = {
  totalTrainings: number;
  scheduledTrainings: number;
  completedTrainings: number;
  inProgressTrainings: number;
  currentMonthTrainings: number;
  recentlyCompletedCount: number;
  totalParticipants: number;
  averageRating: number;
};

type UpcomingTraining = {
  id: string;
  title: string;
  startDate: string;
  location: string;
  trainingType: string;
  trainerName: string;
  participantsCount: number;
  daysUntilStart: number;
};

type MonthlyCount = {
  month: number;
  monthName: string;
  count: number;
};

type DashboardData = {
  summary: TrainingSummary;
  upcomingTrainings: UpcomingTraining[];
  monthlyTrainingCounts: MonthlyCount[];
};

type FeedbackStats = {
  overallAverages: {
    content: number;
    trainer: number;
    material: number;
    venue: number;
    overall: number;
  };
  trainingRatings: Array<{
    id: string;
    title: string;
    endDate: string;
    feedbackCount: number;
    ratings: {
      content: number;
      trainer: number;
      material: number;
      venue: number;
      overall: number;
    };
  }>;
  ratingDistribution: {
    excellent: number;
    good: number;
    average: number;
    poor: number;
    veryPoor: number;
  };
};

type TrainerStats = {
  trainers: Array<{
    id: string;
    name: string;
    email: string;
    trainingsCount: number;
    completedTrainings: number;
    feedbackCount: number;
    ratings: {
      trainer: number;
      content: number;
      overall: number;
    };
    completionRate: number;
  }>;
  totalTrainers: number;
};

type MonthlyTrainingStats = {
  year: number;
  months: Array<{
    month: number;
    monthName: string;
    trainingsCount: number;
    participantsCount: number;
    completedTrainings: number;
  }>;
};

type AttendanceStats = {
  statusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  totalAttendance: number;
  trainingAttendanceRates: Array<{
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    participantsCount: number;
    attendanceCount: number;
    attendanceRate: number;
  }>;
};

type ParticipantEngagement = {
  topParticipants: Array<{
    id: string;
    name: string;
    email: string;
    organization: string;
    trainingsCount: number;
    attendancesCount: number;
    feedbacksCount: number;
    attendanceRate: number;
    feedbackRate: number;
    engagementScore: number;
  }>;
  monthlyParticipation: Array<{
    month: number;
    year: number;
    label: string;
    participantsCount: number;
  }>;
};

const TrainingDashboard: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  
  // Fetch main dashboard statistics
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError
  } = useQuery<DashboardData>({
    queryKey: ['trainingDashboardStats'],
    queryFn: async () => {
      const res = await api.get(API_ROUTES.TRAINING.GET_TRAINING_DASHBOARD_STATS, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      return res.data.data;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
  
  // Fetch feedback statistics
  const {
    data: feedbackData,
    isLoading: feedbackLoading,
    error: feedbackError
  } = useQuery<FeedbackStats>({
    queryKey: ['trainingFeedbackStats'],
    queryFn: async () => {
      const res = await api.get(API_ROUTES.TRAINING.GET_TRAINING_FEEDBACK_STATS, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      return res.data.data;
    },
    staleTime: 5 * 60 * 1000
  });
  
  // Fetch trainer statistics
  const {
    data: trainerData,
    isLoading: trainerLoading,
    error: trainerError
  } = useQuery<TrainerStats>({
    queryKey: ['trainingTrainerStats'],
    queryFn: async () => {
      const res = await api.get(API_ROUTES.TRAINING.GET_TRAINING_TRAINER_STATS, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      return res.data.data;
    },
    staleTime: 5 * 60 * 1000
  });
  
  // Fetch monthly training statistics
  const {
    data: monthlyData,
    isLoading: monthlyLoading,
    error: monthlyError
  } = useQuery<MonthlyTrainingStats>({
    queryKey: ['trainingMonthlyStats', selectedYear],
    queryFn: async () => {
      const res = await api.get(API_ROUTES.TRAINING.GET_TRAINING_MONTHLY_STATS, {
        params: { year: selectedYear },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      return res.data.data;
    },
    staleTime: 5 * 60 * 1000
  });
  
  // Fetch attendance statistics
  const {
    data: attendanceData,
    isLoading: attendanceLoading,
    error: attendanceError
  } = useQuery<AttendanceStats>({
    queryKey: ['trainingAttendanceStats'],
    queryFn: async () => {
      const res = await api.get(API_ROUTES.TRAINING.GET_TRAINING_ATTENDANCE_STATS, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      return res.data.data;
    },
    staleTime: 5 * 60 * 1000
  });
  
  // Fetch participant engagement statistics
  const {
    data: engagementData,
    isLoading: engagementLoading,
    error: engagementError
  } = useQuery<ParticipantEngagement>({
    queryKey: ['trainingParticipantEngagementStats'],
    queryFn: async () => {
      const res = await api.get(API_ROUTES.TRAINING.GET_TRAINING_PARTICIPANT_ENGAGEMENT_STATS, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      return res.data.data;
    },
    staleTime: 5 * 60 * 1000
  });
  
  // Prepare monthly training data for charts
  const monthlyTrainingChartData = useMemo(() => {
    if (!monthlyData?.months) return null;
    
    return {
      labels: monthlyData.months.map(m => m.monthName),
      datasets: [
        {
          label: 'Total Trainings',
          data: monthlyData.months.map(m => m.trainingsCount),
          borderColor: 'rgba(99, 102, 241, 1)',
          backgroundColor: 'rgba(99, 102, 241, 0.2)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Completed Trainings',
          data: monthlyData.months.map(m => m.completedTrainings),
          borderColor: 'rgba(16, 185, 129, 1)',
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          fill: true,
          tension: 0.4
        }
      ]
    };
  }, [monthlyData]);
  
  
  
  // Training status distribution
  const statusDistributionData = useMemo(() => {
    if (!dashboardData?.summary) return null;
    
    return {
      labels: [
        'Scheduled', 
        'In Progress', 
        'Completed'
      ],
      datasets: [
        {
          data: [
            dashboardData.summary.scheduledTrainings,
            dashboardData.summary.inProgressTrainings,
            dashboardData.summary.completedTrainings
          ],
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)', // Blue
            'rgba(245, 158, 11, 0.8)', // Amber
            'rgba(16, 185, 129, 0.8)'  // Green
          ],
          borderWidth: 0
        }
      ]
    };
  }, [dashboardData]);
  
  
  
  // Monthly participation chart data
  const participationTrendData = useMemo(() => {
    if (!engagementData?.monthlyParticipation) return null;
    
    return {
      labels: engagementData.monthlyParticipation.map(item => item.label),
      datasets: [
        {
          label: 'Participants',
          data: engagementData.monthlyParticipation.map(item => item.participantsCount),
          borderColor: 'rgba(99, 102, 241, 1)',
          backgroundColor: 'rgba(99, 102, 241, 0.2)',
          fill: true,
          tension: 0.4
        }
      ]
    };
  }, [engagementData]);
  
 
  
  // Detailed feedback ratings data
  const detailedFeedbackData = useMemo(() => {
    if (!feedbackData?.overallAverages) return null;
    
    return {
      labels: ['Content', 'Trainer', 'Materials', 'Venue', 'Overall'],
      datasets: [
        {
          label: 'Average Rating',
          data: [
            feedbackData.overallAverages.content,
            feedbackData.overallAverages.trainer,
            feedbackData.overallAverages.material,
            feedbackData.overallAverages.venue,
            feedbackData.overallAverages.overall
          ],
          backgroundColor: [
            'rgba(99, 102, 241, 0.7)',
            'rgba(16, 185, 129, 0.7)',
            'rgba(245, 158, 11, 0.7)',
            'rgba(59, 130, 246, 0.7)',
            'rgba(139, 92, 246, 0.7)'
          ],
          borderWidth: 0,
          borderRadius: 4,
          maxBarThickness: 50
        }
      ]
    };
  }, [feedbackData]);
  
  // Generate year options for dropdown
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  }, []);
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
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
          <h1 className="text-3xl font-bold text-gray-800">Training Dashboard</h1>
          <p className="text-gray-500 mt-1">Comprehensive overview of training programs and metrics</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow-sm p-1">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-white border-none rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-0"
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <button 
              onClick={() => {/* Export functionality */}}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium"
            >
              <Download size={14} />
              <span>Export Report</span>
            </button>
          </div>
        </div>
      </motion.div>
      
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Trainings */}
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 p-6 rounded-xl shadow-sm"
        >
          <div className="flex items-center">
            <div className="bg-indigo-100 p-3 rounded-full">
              <BookOpen size={24} className="text-indigo-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-indigo-600">TOTAL TRAININGS</h2>
              <div className="flex items-baseline mt-1">
                <span className="text-2xl font-bold text-gray-800">
                  {dashboardLoading ? "..." : dashboardData?.summary.totalTrainings || 0}
                </span>
                <span className="ml-2 text-xs font-medium text-green-600 flex items-center">
                  <ArrowUpRight size={12} className="mr-0.5" />
                  {dashboardData?.summary.currentMonthTrainings 
                    ? `${dashboardData.summary.currentMonthTrainings} this month`
                    : "0 this month"
                  }
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center">
              <div className="h-2 w-2 rounded-full bg-blue-500 mr-1"></div>
              <span>Scheduled: {dashboardData?.summary.scheduledTrainings || 0}</span>
            </div>
            <div className="flex items-center">
              <div className="h-2 w-2 rounded-full bg-amber-500 mr-1"></div>
              <span>In Progress: {dashboardData?.summary.inProgressTrainings || 0}</span>
            </div>
            <div className="flex items-center">
              <div className="h-2 w-2 rounded-full bg-green-500 mr-1"></div>
              <span>Completed: {dashboardData?.summary.completedTrainings || 0}</span>
            </div>
          </div>
        </motion.div>
        
        {/* Total Participants */}
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 p-6 rounded-xl shadow-sm"
        >
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <Users size={24} className="text-blue-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-blue-600">PARTICIPANTS</h2>
              <div className="flex items-baseline mt-1">
                <span className="text-2xl font-bold text-gray-800">
                  {dashboardLoading ? "..." : dashboardData?.summary.totalParticipants || 0}
                </span>
                {engagementData && (
                  <span className="ml-2 text-xs font-medium text-blue-600">
                    {engagementData.topParticipants.length} active
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div 
                className="bg-blue-500 h-1 rounded-full" 
                style={{ 
                  width: `${engagementData?.topParticipants
                    ? Math.min(100, Math.round((engagementData.topParticipants
                      .filter(p => p.engagementScore > 70).length / 
                      engagementData.topParticipants.length) * 100))
                    : 0}%` 
                }}
              ></div>
            </div>
          </div>
        </motion.div>
        
        {/* Satisfaction Rate */}
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 p-6 rounded-xl shadow-sm"
        >
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <Star size={24} className="text-green-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-green-600">SATISFACTION RATE</h2>
              <div className="flex items-baseline mt-1">
                <span className="text-2xl font-bold text-gray-800">
                  {dashboardLoading ? "..." : `${dashboardData?.summary.averageRating.toFixed(1)}/5.0` || "0/5.0"}
                </span>
                {feedbackData?.ratingDistribution && (
                  <span className="ml-2 text-xs font-medium text-green-600">
                    {feedbackData.ratingDistribution.excellent + feedbackData.ratingDistribution.good} positive
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
            {feedbackData?.ratingDistribution && (
              <>
                <div className="flex items-center">
                  <Star size={12} className="text-amber-400 mr-1" />
                  <span>Excellent: {feedbackData.ratingDistribution.excellent}</span>
                </div>
                <div className="flex items-center">
                  <Star size={12} className="text-blue-400 mr-1" />
                  <span>Good: {feedbackData.ratingDistribution.good}</span>
                </div>
              </>
            )}
          </div>
        </motion.div>
        
        {/* Attendance Rate */}
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 p-6 rounded-xl shadow-sm"
        >
          <div className="flex items-center">
            <div className="bg-amber-100 p-3 rounded-full">
              <CheckCircle size={24} className="text-amber-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-amber-600">ATTENDANCE RATE</h2>
              <div className="flex items-baseline mt-1">
                <span className="text-2xl font-bold text-gray-800">
                  {attendanceLoading ? "..." : 
                    attendanceData?.statusDistribution ? 
                    `${Math.round((attendanceData.statusDistribution
                      .find(s => s.status === 'PRESENT')?.percentage || 0))}%` : 
                    "0%"
                  }
                </span>
                {attendanceData?.totalAttendance && (
                  <span className="ml-2 text-xs font-medium text-amber-600">
                    {attendanceData.totalAttendance} records
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
            {attendanceData?.statusDistribution && (
              attendanceData.statusDistribution.slice(0, 2).map((status, idx) => (
                <div key={idx} className="flex items-center">
                  <div className={`h-2 w-2 rounded-full ${
                    status.status === 'PRESENT' ? 'bg-green-500' : 
                    status.status === 'ABSENT' ? 'bg-red-500' : 
                    status.status === 'LATE' ? 'bg-amber-500' : 'bg-gray-500'
                  } mr-1`}></div>
                  <span>{status.status}: {status.percentage}%</span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
      
      <div className="grid grid-cols-12 gap-6 mb-8">
        {/* Monthly Training Trend */}
        <motion.div
          variants={itemVariants}
          className="col-span-12 lg:col-span-8 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <TrendingUp size={18} className="text-indigo-500 mr-2" />
                Monthly Training Trend
              </h2>
              <span className="text-xs text-gray-500">
                {selectedYear}
              </span>
            </div>
          </div>
          <div className="p-6">
            {monthlyLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
              </div>
            ) : monthlyError ? (
              <div className="h-64 flex items-center justify-center text-red-500">
                Failed to load monthly data
              </div>
            ) : !monthlyTrainingChartData ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No monthly data available
              </div>
            ) : (
              <div className="h-64">
                <Line
                  data={monthlyTrainingChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: 'rgba(0, 0, 0, 0.05)',
                        },
                        ticks: {
                          precision: 0
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
        
        {/* Training Status Distribution */}
        <motion.div
          variants={itemVariants}
          className="col-span-12 lg:col-span-4 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <PieChart size={18} className="text-indigo-500 mr-2" />
                Status Distribution
              </h2>
            </div>
          </div>
          <div className="p-6">
            {dashboardLoading ? (
              <div className="h-60 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
              </div>
            ) : dashboardError ? (
              <div className="h-60 flex items-center justify-center text-red-500">
                Failed to load status data
              </div>
            ) : !statusDistributionData ? (
              <div className="h-60 flex items-center justify-center text-gray-500">
                No status data available
              </div>
            ) : (
              <div className="h-60 flex items-center justify-center">
                <div className="w-48 relative">
                  <Doughnut
                    data={statusDistributionData}
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
                  {dashboardData?.summary && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                      <div className="text-2xl font-bold text-gray-800">{dashboardData.summary.totalTrainings}</div>
                      <div className="text-xs text-gray-500">Total</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
      
      <div className="grid grid-cols-12 gap-6 mb-8">
        {/* Upcoming Trainings */}
        <motion.div
          variants={itemVariants}
          className="col-span-12 lg:col-span-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <CalendarClock size={18} className="text-indigo-500 mr-2" />
                Upcoming Trainings
              </h2>
              <button className="text-xs text-blue-500 hover:text-blue-700">View All</button>
            </div>
          </div>
          <div className="p-1">
            {dashboardLoading ? (
              <div className="h-80 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
              </div>
            ) : dashboardError ? (
              <div className="h-80 flex items-center justify-center text-red-500">
                Failed to load upcoming trainings
              </div>
            ) : !dashboardData?.upcomingTrainings || dashboardData.upcomingTrainings.length === 0 ? (
              <div className="h-80 flex flex-col items-center justify-center text-gray-500">
                <Calendar size={36} className="text-gray-300 mb-3" />
                <p>No upcoming trainings scheduled</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {dashboardData.upcomingTrainings.map((training) => (
                  <div key={training.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div 
                        className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-medium ${
                          training.daysUntilStart <= 3 ? 'bg-red-500' :
                          training.daysUntilStart <= 7 ? 'bg-amber-500' :
                          'bg-blue-500'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-xs">
                            {format(new Date(training.startDate), 'MMM')}
                          </div>
                          <div className="text-lg font-bold leading-none">
                            {format(new Date(training.startDate), 'd')}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800">{training.title}</h3>
                        <div className="flex flex-wrap gap-y-1 gap-x-4 mt-1.5 text-xs text-gray-500">
                          <div className="flex items-center">
                            <User size={12} className="mr-1" />
                            {training.trainerName}
                          </div>
                          <div className="flex items-center">
                            <MapPin size={12} className="mr-1" />
                            {training.location}
                          </div>
                          <div className="flex items-center">
                            <Users size={12} className="mr-1" />
                            {training.participantsCount} participants
                          </div>
                        </div>
                        <div className="mt-2 flex items-center">
                          <span 
                            className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                              training.trainingType === 'INTERNAL' ? 'bg-blue-100 text-blue-800' :
                              training.trainingType === 'EXTERNAL' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {training.trainingType}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            {training.daysUntilStart > 0 ? 
                              `${training.daysUntilStart} day${training.daysUntilStart !== 1 ? 's' : ''} remaining` : 
                              'Today'
                            }
                          </span>
                        </div>
                      </div>
                      
                      <button className="text-gray-400 hover:text-indigo-500">
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
        
        {/* Trainer Performance */}
        <motion.div
          variants={itemVariants}
          className="col-span-12 lg:col-span-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <Medal size={18} className="text-indigo-500 mr-2" />
                Trainer Performance
              </h2>
              <button className="text-xs text-blue-500 hover:text-blue-700">View All</button>
            </div>
          </div>
          <div className="p-6">
            {trainerLoading ? (
              <div className="h-80 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
              </div>
            ) : trainerError ? (
              <div className="h-80 flex items-center justify-center text-red-500">
                Failed to load trainer data
              </div>
            ) : !trainerData?.trainers || trainerData.trainers.length === 0 ? (
              <div className="h-80 flex items-center justify-center text-gray-500">
                No trainer data available
              </div>
            ) : (
              <div className="h-80 overflow-y-auto pr-2">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trainer
                      </th>
                      <th className="px-3 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trainings
                      </th>
                      <th className="px-3 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rating
                      </th>
                      <th className="px-3 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Completion
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {trainerData.trainers.slice(0, 6).map((trainer) => (
                      <tr key={trainer.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                              {trainer.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-800">{trainer.name}</div>
                              <div className="text-xs text-gray-500">{trainer.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-center">
                          <div className="text-sm text-gray-800">{trainer.trainingsCount}</div>
                          <div className="text-xs text-gray-500">{trainer.completedTrainings} completed</div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center">
                            <span 
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                trainer.ratings.overall >= 4.5 ? 'bg-green-100 text-green-800' :
                                trainer.ratings.overall >= 3.5 ? 'bg-blue-100 text-blue-800' :
                                trainer.ratings.overall >= 2.5 ? 'bg-amber-100 text-amber-800' :
                                'bg-red-100 text-red-800'
                              }`}
                            >
                              {trainer.ratings.overall.toFixed(1)}
                              <Star size={12} className="ml-0.5" />
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-center">
                          <div className="text-sm text-gray-800">{trainer.completionRate}%</div>
                          <div className="w-16 bg-gray-200 rounded-full h-1.5 mx-auto">
                            <div 
                              className={`h-1.5 rounded-full ${
                                trainer.completionRate >= 80 ? 'bg-green-500' :
                                trainer.completionRate >= 60 ? 'bg-blue-500' :
                                trainer.completionRate >= 40 ? 'bg-amber-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${trainer.completionRate}%` }}
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
      </div>
      
      <div className="grid grid-cols-12 gap-6 mb-8">
        {/* Feedback Ratings Breakdown */}
        <motion.div
          variants={itemVariants}
          className="col-span-12 lg:col-span-8 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <BarChart3 size={18} className="text-indigo-500 mr-2" />
                Feedback Ratings Breakdown
              </h2>
            </div>
          </div>
          <div className="p-6">
            {feedbackLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
              </div>
            ) : feedbackError ? (
              <div className="h-64 flex items-center justify-center text-red-500">
                Failed to load feedback data
              </div>
            ) : !detailedFeedbackData ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No feedback data available
              </div>
            ) : (
              <div className="h-64">
                <Bar
                  data={{
                    ...detailedFeedbackData,
                    datasets: detailedFeedbackData.datasets.map(ds => ({
                      ...ds,
                      barThickness: 40
                    }))
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 5,
                        grid: {
                          color: 'rgba(0, 0, 0, 0.05)',
                        },
                        ticks: {
                          stepSize: 1
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
                        display: false
                      }
                    }
                  }}
                />
              </div>
            )}
          </div>
        </motion.div>
        
        {/* Participant Engagement */}
        <motion.div
          variants={itemVariants}
          className="col-span-12 lg:col-span-4 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <Activity size={18} className="text-indigo-500 mr-2" />
                Participant Engagement
              </h2>
            </div>
          </div>
          <div className="p-6">
            {engagementLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
              </div>
            ) : engagementError ? (
              <div className="h-64 flex items-center justify-center text-red-500">
                Failed to load engagement data
              </div>
            ) : !engagementData?.topParticipants || engagementData.topParticipants.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No engagement data available
              </div>
            ) : (
              <div className="h-64 overflow-y-auto">
                {engagementData.topParticipants.slice(0, 5).map((participant, idx) => (
                  <div 
                    key={participant.id}
                    className="mb-3 pb-3 border-b border-gray-100 last:mb-0 last:border-b-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                          idx === 0 ? 'bg-indigo-600' :
                          idx === 1 ? 'bg-blue-600' :
                          idx === 2 ? 'bg-green-600' :
                          'bg-gray-600'
                        }`}>
                          {participant.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-2">
                          <div className="text-sm font-medium text-gray-800">{participant.name}</div>
                          <div className="text-xs text-gray-500">{participant.organization}</div>
                        </div>
                      </div>
                      <div 
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          participant.engagementScore >= 80 ? 'bg-green-100 text-green-800' :
                          participant.engagementScore >= 60 ? 'bg-blue-100 text-blue-800' :
                          participant.engagementScore >= 40 ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}
                      >
                        {participant.engagementScore}%
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="flex justify-between text-gray-500">
                          <span>Attendance:</span>
                          <span className="font-medium">{participant.attendanceRate}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                          <div 
                            className={`h-1 rounded-full ${
                              participant.attendanceRate >= 80 ? 'bg-green-500' :
                              participant.attendanceRate >= 60 ? 'bg-blue-500' :
                              participant.attendanceRate >= 40 ? 'bg-amber-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${participant.attendanceRate}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-gray-500">
                          <span>Feedback:</span>
                          <span className="font-medium">{participant.feedbackRate}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                          <div 
                            className={`h-1 rounded-full ${
                              participant.feedbackRate >= 80 ? 'bg-green-500' :
                              participant.feedbackRate >= 60 ? 'bg-blue-500' :
                              participant.feedbackRate >= 40 ? 'bg-amber-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${participant.feedbackRate}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
      
      <div className="grid grid-cols-12 gap-6 mb-8">
        {/* Monthly Participation Trend */}
        <motion.div
          variants={itemVariants}
          className="col-span-12 lg:col-span-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <Users size={18} className="text-indigo-500 mr-2" />
                Monthly Participation
              </h2>
              <span className="text-xs text-gray-500">Last 6 months</span>
            </div>
          </div>
          <div className="p-6">
            {engagementLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
              </div>
            ) : engagementError ? (
              <div className="h-64 flex items-center justify-center text-red-500">
                Failed to load monthly participation data
              </div>
            ) : !participationTrendData ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No participation trend data available
              </div>
            ) : (
              <div className="h-64">
                <Line
                  data={participationTrendData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: 'rgba(0, 0, 0, 0.05)',
                        },
                        ticks: {
                          precision: 0
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
                        display: false
                      }
                    }
                  }}
                />
              </div>
            )}
          </div>
        </motion.div>
        
        {/* Attendance Rates */}
        <motion.div
          variants={itemVariants}
          className="col-span-12 lg:col-span-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <CalendarCheck size={18} className="text-indigo-500 mr-2" />
                Training Attendance Rates
              </h2>
            </div>
          </div>
          <div className="p-6">
            {attendanceLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
              </div>
            ) : attendanceError ? (
              <div className="h-64 flex items-center justify-center text-red-500">
                Failed to load attendance data
              </div>
            ) : !attendanceData?.trainingAttendanceRates || attendanceData.trainingAttendanceRates.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No attendance rate data available
              </div>
            ) : (
              <div className="h-64 overflow-y-auto">
                {attendanceData.trainingAttendanceRates.slice(0, 6).map((training) => (
                  <div key={training.id} className="mb-4 last:mb-0">
                    <div className="flex justify-between items-center mb-1">
                      <div className="text-sm font-medium text-gray-800 truncate pr-4 max-w-xs">
                        {training.title}
                      </div>
                      <div 
                        className={`text-sm font-medium ${
                          training.attendanceRate >= 80 ? 'text-green-600' :
                          training.attendanceRate >= 60 ? 'text-blue-600' :
                          training.attendanceRate >= 40 ? 'text-amber-600' :
                          'text-red-600'
                        }`}
                      >
                        {training.attendanceRate}%
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          training.attendanceRate >= 80 ? 'bg-green-500' :
                          training.attendanceRate >= 60 ? 'bg-blue-500' :
                          training.attendanceRate >= 40 ? 'bg-amber-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${training.attendanceRate}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>
                        {format(new Date(training.endDate), 'MMM d, yyyy')}
                      </span>
                      <span>
                        {training.attendanceCount} / {training.participantsCount} attended
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
      
      {/* Training Quality Score */}
      <motion.div
        variants={itemVariants}
        className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg overflow-hidden text-white p-6 mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="text-center">
            <div className="bg-white/10 rounded-lg p-3 mb-3 inline-block">
              <CalendarCheck size={24} />
            </div>
            <div className="text-2xl font-bold">
              {dashboardLoading ? "..." : 
                dashboardData?.summary ? 
                `${Math.round((dashboardData.summary.completedTrainings / dashboardData.summary.totalTrainings) * 100) || 0}%` : 
                "0%"
              }
            </div>
            <div className="text-sm text-blue-100">Completion Rate</div>
          </div>
          
          <div className="text-center">
            <div className="bg-white/10 rounded-lg p-3 mb-3 inline-block">
              <Star size={24} />
            </div>
            <div className="text-2xl font-bold">
              {feedbackLoading ? "..." : 
                feedbackData?.overallAverages ? 
                feedbackData.overallAverages.overall.toFixed(1) : 
                "0.0"
              }
            </div>
            <div className="text-sm text-blue-100">Overall Rating</div>
          </div>
          
          <div className="text-center">
            <div className="bg-white/10 rounded-lg p-3 mb-3 inline-block">
              <CheckCircle size={24} />
            </div>
            <div className="text-2xl font-bold">
              {attendanceLoading ? "..." : 
                attendanceData?.statusDistribution ? 
                `${attendanceData.statusDistribution.find(s => s.status === 'PRESENT')?.percentage || 0}%` : 
                "0%"
              }
            </div>
            <div className="text-sm text-blue-100">Attendance Rate</div>
          </div>
          
          <div className="text-center">
            <div className="bg-white/10 rounded-lg p-3 mb-3 inline-block">
              <Building size={24} />
            </div>
            <div className="text-2xl font-bold">
              {engagementData?.topParticipants ? 
                new Set(engagementData.topParticipants.map(p => p.organization)).size : 
                0
              }
            </div>
            <div className="text-sm text-blue-100">Organizations</div>
          </div>
          
          <div className="text-center">
            <div className="bg-white/10 rounded-lg p-3 mb-3 inline-block">
              <FileText size={24} />
            </div>
            <div className="text-2xl font-bold">
              {trainerLoading ? "..." : 
                trainerData?.trainers ? 
                trainerData.trainers.length : 
                0
              }
            </div>
            <div className="text-sm text-blue-100">Active Trainers</div>
          </div>
        </div>
      </motion.div>
      
      {/* CTA Section */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row items-center justify-between bg-white rounded-xl border border-gray-200 shadow-sm p-6"
      >
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">Need to schedule a new training?</h3>
          <p className="text-gray-500">Create a new training session for your team or organization.</p>
        </div>
        <div className="mt-4 md:mt-0">
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            onClick={() => {/* Create training functionality */}}
          >
            Create Training
            <ArrowRight size={16} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TrainingDashboard;