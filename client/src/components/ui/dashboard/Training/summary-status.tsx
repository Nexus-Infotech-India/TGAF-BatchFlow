import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_ROUTES } from '../../../../utils/api';
import {
  Calendar,
  Users,
  Award,
  FileCheck,
  Clock,
  CheckCircle,
  CalendarClock,
  Loader2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  description?: string;
  trend?: number;
  loading?: boolean;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'pink';
}

const colorClasses = {
  blue: {
    gradient: 'from-blue-50 to-blue-100',
    border: 'border-blue-200',
    iconBg: 'bg-blue-500/10',
    icon: 'text-blue-700',
    text: 'text-blue-800',
    lightText: 'text-blue-700',
  },
  green: {
    gradient: 'from-green-50 to-green-100',
    border: 'border-green-200',
    iconBg: 'bg-green-500/10',
    icon: 'text-green-700',
    text: 'text-green-800',
    lightText: 'text-green-700',
  },
  orange: {
    gradient: 'from-amber-50 to-amber-100',
    border: 'border-amber-200',
    iconBg: 'bg-amber-500/10',
    icon: 'text-amber-700',
    text: 'text-amber-800',
    lightText: 'text-amber-700',
  },
  purple: {
    gradient: 'from-purple-50 to-purple-100',
    border: 'border-purple-200',
    iconBg: 'bg-purple-500/10',
    icon: 'text-purple-700',
    text: 'text-purple-800',
    lightText: 'text-purple-700',
  },
  pink: {
    gradient: 'from-pink-50 to-pink-100',
    border: 'border-pink-200',
    iconBg: 'bg-pink-500/10',
    icon: 'text-pink-700',
    text: 'text-pink-800',
    lightText: 'text-pink-700',
  },
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

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  description, 
  trend, 
  loading = false,
  color 
}) => {
  const colors = colorClasses[color];
  
  return (
    <motion.div
      className={`bg-gradient-to-br ${colors.gradient} rounded-xl border ${colors.border} shadow-sm overflow-hidden`}
      variants={itemVariants}
      whileHover={{ 
        y: -5,
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        transition: { duration: 0.2 }
      }}
    >
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
            
            {loading ? (
              <div className="flex items-center mt-2">
                <Loader2 className="h-4 w-4 text-gray-400 animate-spin mr-2" />
                <span className="text-gray-400 text-sm">Loading...</span>
              </div>
            ) : (
              <div className="flex items-baseline mt-1">
                <span className={`text-2xl font-bold ${colors.text}`}>{value}</span>
                {trend !== undefined && (
                  <div className={`flex items-center ml-2 text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trend >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-0.5" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-0.5" />
                    )} 
                    {Math.abs(trend)}%
                  </div>
                )}
              </div>
            )}
            
            {description && (
              <span className="text-xs text-gray-500 mt-1">{description}</span>
            )}
          </div>
          
          <div className={`rounded-lg p-2 ${colors.iconBg}`}>
            <div className={colors.icon}>{icon}</div>
          </div>
        </div>
        
        {!loading && trend !== undefined && (
          <div className="mt-3 pt-3 border-t border-gray-200/50">
            <div className="w-full bg-gray-200/60 h-1.5 rounded-full overflow-hidden">
              <motion.div 
                className={`h-full rounded-full ${trend >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(Math.abs(trend), 100)}%` }}
                transition={{ duration: 0.8, delay: 0.3 }}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const SummaryStats: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['trainingDashboardStats'],
    queryFn: async () => {
      const response = await axios.get(API_ROUTES.TRAINING.GET_TRAINING_DASHBOARD_STATS, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      return response.data.data.summary;
    },
  });

  return (
    <motion.div 
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <StatCard
        title="Total Trainings"
        value={isLoading ? '-' : data?.totalTrainings || 0}
        icon={<Calendar className="h-6 w-6" />}
        loading={isLoading}
        trend={data?.trainingsTrend}
        color="blue"
      />
      <StatCard
        title="Scheduled Trainings"
        value={isLoading ? '-' : data?.scheduledTrainings || 0}
        icon={<CalendarClock className="h-6 w-6" />}
        description="Upcoming trainings"
        loading={isLoading}
        color="purple"
      />
      <StatCard
        title="In Progress"
        value={isLoading ? '-' : data?.inProgressTrainings || 0}
        icon={<Clock className="h-6 w-6" />}
        loading={isLoading}
        color="orange"
      />
      <StatCard
        title="Completed Trainings"
        value={isLoading ? '-' : data?.completedTrainings || 0}
        icon={<CheckCircle className="h-6 w-6" />}
        loading={isLoading}
        trend={data?.completionsTrend}
        color="green"
      />
      <StatCard
        title="Total Participants"
        value={isLoading ? '-' : data?.totalParticipants || 0}
        icon={<Users className="h-6 w-6" />}
        loading={isLoading}
        trend={data?.participantsTrend}
        color="pink"
      />
      <StatCard
        title="Current Month Trainings"
        value={isLoading ? '-' : data?.currentMonthTrainings || 0}
        icon={<Calendar className="h-6 w-6" />}
        loading={isLoading}
        description="Trainings this month"
        color="blue"
      />
      <StatCard
        title="Recently Completed"
        value={isLoading ? '-' : data?.recentlyCompletedCount || 0}
        description="In the last 30 days"
        icon={<FileCheck className="h-6 w-6" />}
        loading={isLoading}
        color="green"
      />
      <StatCard
        title="Average Rating"
        value={isLoading ? '-' : `${data?.averageRating || 0}/5`}
        icon={<Award className="h-6 w-6" />}
        loading={isLoading}
        trend={data?.ratingTrend}
        color="orange"
      />
    </motion.div>
  );
};

export default SummaryStats;