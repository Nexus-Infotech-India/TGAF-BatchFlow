import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Search, 
  MessageSquareText, 
  Users, 
  BookOpen, 
  Clock, 
  Calendar as CalendarIcon,
  EyeOff,
  RefreshCw,
  PieChart,
  ArrowLeft,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api, { API_ROUTES } from '../../../utils/api';
import { format, addMonths, subMonths, isToday } from 'date-fns';

// Type definitions
interface Training {
  id: string;
  title: string;
  status: string;
  trainingType: string;
  startDate: string;
  endDate: string;
  location: string;
  trainer: {
    id: string;
    name: string;
    email: string;
  };
  sessions: Session[];
  _count: {
    participants: number;
    sessions: number;
  };
}

interface Session {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  venue: string;
  trainingId?: string;
  trainingTitle?: string;
}

interface CalendarDay {
  day: number;
  date: Date;
  isWeekend: boolean;
  trainings: Training[];
  sessions: Session[];
}

interface CalendarResponse {
  calendarInfo: {
    id: string;
    month: number;
    year: number;
    description: string;
  };
  month: number;
  year: number;
  firstDayOfMonth: number;
  daysInMonth: number;
  days: CalendarDay[];
  trainings: Training[];
  statistics: {
    totalTrainings: number;
    scheduledTrainings: number;
    completedTrainings: number;
    inProgressTrainings: number;
    cancelledTrainings: number;
  };
}

interface DailyCalendarResponse {
  date: string;
  day: number;
  month: number;
  year: number;
  trainings: Training[];
  trainingsCount: number;
}

interface StatisticsResponse {
  calendar?: {
    id: string;
    month: number;
    year: number;
    description: string;
  };
  month: number;
  year: number;
  calendarExists: boolean;
  statistics: {
    totalTrainings: number;
    totalParticipants?: number;
    totalSessions?: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
  };
  recentTrainings?: any[];
  upcomingSessions?: any[];
}

// Calendar component
const TrainingCalendar: React.FC = () => {
  // State management
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'day' | 'stats'>('month');
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [calendarDescription, setCalendarDescription] = useState<string>('');
  const [isEditingDescription, setIsEditingDescription] = useState<boolean>(false);
  const [filters, setFilters] = useState({
    status: '',
    trainingType: '',
    search: '',
    detailLevel: 'overview' as 'overview' | 'detailed' | 'compact'
  });
  const [showFilters, setShowFilters] = useState<boolean>(false);
  
  const queryClient = useQueryClient();
  
  // Get auth token from local storage
  const authToken = localStorage.getItem('authToken');
  
  // API configuration with auth token
  const apiConfig = {
    headers: {
      Authorization: `Bearer ${authToken}`
    }
  };

  // Fetch monthly calendar data
  const { 
    data: monthlyData, 
    isLoading: isLoadingMonthly,
    isError: isErrorMonthly,
    refetch: refetchMonthly
  } = useQuery<CalendarResponse>({
    queryKey: ['monthlyCalendar', currentDate.getMonth() + 1, currentDate.getFullYear(), filters],
    queryFn: async () => {
      const response = await api.get(
        `${API_ROUTES.TRAINING.GET_MONTHLY_CALENDAR}`, {
          ...apiConfig,
          params: {
            month: currentDate.getMonth() + 1,
            year: currentDate.getFullYear(),
            detailLevel: filters.detailLevel,
            ...(filters.status && { status: filters.status }),
            ...(filters.trainingType && { trainingType: filters.trainingType })
          }
        }
      );
      return response.data;
    }
  });

  // Fetch daily calendar data when a day is selected
  const { 
    data: dailyData, 
    isLoading: isLoadingDaily,
    isError: isErrorDaily 
  } = useQuery<DailyCalendarResponse>({
    queryKey: ['dailyCalendar', selectedDay],
    queryFn: async () => {
      if (!selectedDay) return null;
      const dateString = format(selectedDay, 'yyyy-MM-dd');
      const response = await api.get(
        `${API_ROUTES.TRAINING.GET_DAILY_CALENDAR(dateString)}`,
        apiConfig
      );
      return response.data;
    },
    enabled: viewMode === 'day' && !!selectedDay
  });

  // Fetch calendar statistics
  const { 
    data: statsData, 
    isLoading: isLoadingStats,
    isError: isErrorStats 
  } = useQuery<StatisticsResponse>({
    queryKey: ['calendarStats', currentDate.getMonth() + 1, currentDate.getFullYear()],
    queryFn: async () => {
      const response = await api.get(
        `${API_ROUTES.TRAINING.GET_CALENDAR_STATISTICS}`,
        {
          ...apiConfig,
          params: {
            month: currentDate.getMonth() + 1,
            year: currentDate.getFullYear()
          }
        }
      );
      return response.data;
    },
    enabled: viewMode === 'stats'
  });

  // Update calendar description
  const updateDescription = async () => {
    try {
      await api.post(
        API_ROUTES.TRAINING.UPDATE_CALENDAR_DESCRIPTION(
          (currentDate.getMonth() + 1).toString(),
          currentDate.getFullYear().toString()
        ),
        { description: calendarDescription },
        apiConfig
      );
      setIsEditingDescription(false);
      queryClient.invalidateQueries({ queryKey: ['monthlyCalendar'] });
      queryClient.invalidateQueries({ queryKey: ['calendarStats'] });
    } catch (error) {
      console.error("Failed to update description:", error);
    }
  };

  // Navigation handlers
  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Filter handlers
  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Set initial description from API data
  useEffect(() => {
    if (monthlyData?.calendarInfo?.description) {
      setCalendarDescription(monthlyData.calendarInfo.description);
    }
  }, [monthlyData]);

  // Handle back to monthly view from daily view
  const handleBackToMonthly = () => {
    setViewMode('month');
    setSelectedDay(null);
  };

  // Day click handler
  const handleDayClick = (day: CalendarDay) => {
    setSelectedDay(day.date);
    setViewMode('day');
  };

  // Filter training items based on search term
  const filterTrainings = (trainings: Training[]) => {
    if (!filters.search) return trainings;
    
    return trainings.filter(training => 
      training.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      training.location?.toLowerCase().includes(filters.search.toLowerCase()) ||
      training.trainer?.name?.toLowerCase().includes(filters.search.toLowerCase())
    );
  };

  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'POSTPONED': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Training type color mapping
  const getTrainingTypeColor = (type: string) => {
    switch (type) {
      case 'TECHNICAL': return 'bg-indigo-100 text-indigo-800';
      case 'SAFETY': return 'bg-orange-100 text-orange-800';
      case 'COMPLIANCE': return 'bg-teal-100 text-teal-800';
      case 'ONBOARDING': return 'bg-pink-100 text-pink-800';
      case 'WORKSHOP': return 'bg-cyan-100 text-cyan-800';
      case 'SEMINAR': return 'bg-lime-100 text-lime-800';
      case 'PROFESSIONAL_DEVELOPMENT': return 'bg-violet-100 text-violet-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  };

  const cardVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.3 } }
  };

  // Loading indicator
  if (
    (viewMode === 'month' && isLoadingMonthly) || 
    (viewMode === 'day' && isLoadingDaily) || 
    (viewMode === 'stats' && isLoadingStats)
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-white to-blue-100">
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="text-blue-500"
        >
          <RefreshCw size={40} />
        </motion.div>
        <p className="ml-3 text-lg font-medium text-blue-800">Loading calendar...</p>
      </div>
    );
  }

  // Error handling
  if (
    (viewMode === 'month' && isErrorMonthly) || 
    (viewMode === 'day' && isErrorDaily) || 
    (viewMode === 'stats' && isErrorStats)
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-white to-blue-100">
        <div className="p-8 bg-white rounded-lg shadow-lg">
          <p className="text-red-600 text-xl font-semibold">Error loading calendar data</p>
          <button 
            onClick={() => {
              if (viewMode === 'month') refetchMonthly();
              else if (viewMode === 'day') setViewMode('month');
              else setViewMode('month');
            }}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-100">
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="container mx-auto py-8 px-4 sm:px-6"
        >
          {/* Header Section */}
          <header className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-blue-800 mb-2">Training Calendar</h1>
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => setViewMode('month')} 
                    className={`px-4 py-2 rounded-full flex items-center ${viewMode === 'month' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 hover:bg-blue-50'} transition-colors`}
                  >
                    <CalendarIcon size={18} className="mr-2" />
                    Monthly
                  </button>
                  <button 
                    onClick={() => setViewMode('stats')} 
                    className={`px-4 py-2 rounded-full flex items-center ${viewMode === 'stats' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 hover:bg-blue-50'} transition-colors`}
                  >
                    <PieChart size={18} className="mr-2" />
                    Statistics
                  </button>
                </div>
              </div>
              
              <div className="mt-4 sm:mt-0 flex flex-wrap gap-2 items-center">
  <button 
    onClick={goToPreviousMonth} 
    className="p-2 bg-white rounded-full shadow-sm hover:bg-blue-50 transition-colors"
  >
    <ChevronLeft size={20} className="text-blue-700" />
  </button>
  
  {/* Month selector */}
  <div className="relative">
    <select
      value={currentDate.getMonth()}
      onChange={(e) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(parseInt(e.target.value));
        setCurrentDate(newDate);
      }}
      className="appearance-none bg-white border border-blue-200 text-blue-700 font-medium py-1.5 pl-3 pr-8 rounded-lg shadow-sm hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
    >
      {Array.from({ length: 12 }, (_, i) => (
        <option key={i} value={i}>
          {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
        </option>
      ))}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-blue-600">
      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
      </svg>
    </div>
  </div>
  
  {/* Year selector */}
  <div className="relative">
    <select
      value={currentDate.getFullYear()}
      onChange={(e) => {
        const newDate = new Date(currentDate);
        newDate.setFullYear(parseInt(e.target.value));
        setCurrentDate(newDate);
      }}
      className="appearance-none bg-white border border-blue-200 text-blue-700 font-medium py-1.5 pl-3 pr-8 rounded-lg shadow-sm hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
    >
      {Array.from({ length: 10 }, (_, i) => {
        const year = new Date().getFullYear() - 5 + i;
        return (
          <option key={year} value={year}>
            {year}
          </option>
        );
      })}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-blue-600">
      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
      </svg>
    </div>
  </div>
  
  <button 
    onClick={goToToday} 
    className="px-4 py-2 bg-white rounded-full shadow-sm hover:bg-blue-50 transition-colors font-medium text-blue-700"
  >
    Today
  </button>
  
  <button 
    onClick={goToNextMonth} 
    className="p-2 bg-white rounded-full shadow-sm hover:bg-blue-50 transition-colors"
  >
    <ChevronRight size={20} className="text-blue-700" />
  </button>
</div>
            </div>
            
            <motion.div 
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="text-2xl font-semibold text-blue-900">
                {format(currentDate, 'MMMM yyyy')}
              </div>
              
              <div className="mt-4 sm:mt-0 flex space-x-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search trainings..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10 pr-4 py-2 border border-blue-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                  />
                  <Search size={18} className="absolute left-3 top-2.5 text-blue-400" />
                </div>
                
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className="p-2 bg-white rounded-full shadow-sm hover:bg-blue-50 transition-colors relative"
                >
                  {showFilters ? (
                    <EyeOff size={20} className="text-blue-700" />
                  ) : (
                    <Filter size={20} className="text-blue-700" />
                  )}
                  {(filters.status || filters.trainingType || filters.detailLevel !== 'overview') && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></span>
                  )}
                </button>
              </div>
            </motion.div>
            
            {/* Filters Section */}
            <AnimatePresence>
              {showFilters && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden mt-4"
                >
                  <div className="p-4 bg-white rounded-lg shadow-sm border border-blue-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Training Status</label>
                      <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">All Statuses</option>
                        <option value="SCHEDULED">Scheduled</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                        <option value="POSTPONED">Postponed</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Training Type</label>
                      <select
                        value={filters.trainingType}
                        onChange={(e) => handleFilterChange('trainingType', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">All Types</option>
                        <option value="TECHNICAL">Technical</option>
                        <option value="SAFETY">Safety</option>
                        <option value="COMPLIANCE">Compliance</option>
                        <option value="ONBOARDING">Onboarding</option>
                        <option value="WORKSHOP">Workshop</option>
                        <option value="SEMINAR">Seminar</option>
                        <option value="PROFESSIONAL_DEVELOPMENT">Professional Development</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Detail Level</label>
                      <select
                        value={filters.detailLevel}
                        onChange={(e) => handleFilterChange('detailLevel', e.target.value as any)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="overview">Overview</option>
                        <option value="detailed">Detailed</option>
                        <option value="compact">Compact</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </header>

          {/* Calendar Description Section */}
          

          {/* Main Content Area */}
          {viewMode === 'month' && monthlyData && (
            <motion.div 
              className="bg-white rounded-xl shadow-md overflow-hidden"
              variants={cardVariants}
              initial="initial"
              animate="animate"
            >
         
            {/* Calendar Grid */}
<div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
  {/* Calendar Header */}
  <div className="grid grid-cols-7 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
      <div 
        key={day} 
        className={`py-4 px-2 text-center font-semibold text-sm
          ${index === 0 || index === 6 
            ? 'text-red-600 bg-red-50/50' 
            : 'text-blue-800 bg-white/50'
          } border-r last:border-r-0 border-gray-200`}
      >
        <div className="hidden sm:block">{day}</div>
        <div className="sm:hidden">{day.slice(0, 3)}</div>
      </div>
    ))}
  </div>
  
  <div className="grid grid-cols-7">
    {/* Empty cells for days before the first day of month */}
    {Array.from({ length: monthlyData.firstDayOfMonth }).map((_, index) => (
      <div 
        key={`empty-${index}`} 
        className="h-24 sm:h-32 lg:h-36 border-b border-r border-gray-100 bg-gray-50/50 last:border-r-0"
      />
    ))}
    
    {/* Calendar days */}
    {monthlyData.days.map((day) => {
      const filteredTrainings = filterTrainings(day.trainings);
      const hasTrainings = filteredTrainings.length > 0;
      const hasSessions = day.sessions.length > 0;
      const isCurrentDay = isToday(day.date);
      const isWeekendDay = day.isWeekend;
      
      return (
        <motion.div 
          key={`day-${day.day}`}
          className={`relative h-24 sm:h-32 lg:h-36 border-b border-r border-gray-100 last:border-r-0 cursor-pointer group transition-all duration-200
            ${isWeekendDay 
              ? 'bg-gradient-to-br from-blue-50/50 to-indigo-50/50 hover:from-blue-50 hover:to-indigo-50' 
              : 'bg-white hover:bg-blue-50/30'
            }
            ${isCurrentDay 
              ? 'ring-2 ring-blue-400 ring-inset bg-gradient-to-br from-blue-100/70 to-indigo-100/70' 
              : ''
            }
            ${hasTrainings || hasSessions 
              ? 'hover:shadow-lg hover:z-10' 
              : 'hover:shadow-md'
            }
          `}
          whileHover={{ 
            scale: 1.02,
            transition: { type: "spring", stiffness: 400, damping: 17 }
          }}
          onClick={() => handleDayClick(day)}
        >
          {/* Day Number */}
          <div className="absolute top-2 right-2 flex items-center justify-center">
            <span className={`text-lg font-bold transition-colors
              ${isCurrentDay 
                ? 'text-white bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center shadow-md' 
                : isWeekendDay 
                  ? 'text-red-600' 
                  : 'text-gray-700 group-hover:text-blue-600'
              }
            `}>
              {day.day}
            </span>
          </div>
          
          {/* Activity Indicators */}
          {(hasTrainings || hasSessions) && (
            <div className="absolute top-2 left-2 flex gap-1">
              {hasTrainings && (
                <div className="w-2 h-2 bg-blue-500 rounded-full shadow-sm animate-pulse" />
              )}
              {hasSessions && (
                <div className="w-2 h-2 bg-green-500 rounded-full shadow-sm animate-pulse" />
              )}
            </div>
          )}
          
          {/* Training Items */}
          <div className="absolute inset-x-2 bottom-2 top-10 overflow-hidden">
            {hasTrainings && (
              <div className="space-y-1 h-full">
                {filteredTrainings.slice(0, 2).map((training, index) => (
                  <motion.div 
                    key={training.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`relative p-1.5 rounded-md text-xs font-medium border-l-3 shadow-sm
                      ${getStatusColor(training.status)} 
                      hover:shadow-md transition-all duration-200 group-hover:scale-105
                    `}
                    title={`${training.title} - ${training.status} - ${training.trainingType}`}
                  >
                    <div className="truncate">{training.title}</div>
                    <div className="flex items-center justify-between text-xs mt-0.5 opacity-75">
                      <span className="truncate">{training.trainingType.split('_')[0]}</span>
                      <div className="flex items-center gap-1">
                        <Users size={10} />
                        <span>{training._count?.participants || 0}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {/* More items indicator */}
                {filteredTrainings.length > 2 && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs font-semibold text-blue-600 bg-blue-50 rounded-md p-1 text-center border border-blue-200 hover:bg-blue-100 transition-colors"
                  >
                    +{filteredTrainings.length - 2} more
                  </motion.div>
                )}
              </div>
            )}
            
            {/* Sessions indicator */}
            {hasSessions && !hasTrainings && (
              <div className="flex items-center justify-center h-full">
                <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
                  <Clock size={16} className="text-green-600 mx-auto mb-1" />
                  <div className="text-xs font-medium text-green-800">
                    {day.sessions.length} session{day.sessions.length > 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            )}
            
            {/* Empty state */}
            {!hasTrainings && !hasSessions && (
              <div className="flex items-center justify-center h-full opacity-0 group-hover:opacity-30 transition-opacity">
                <div className="text-xs text-gray-400 font-medium">
                  No events
                </div>
              </div>
            )}
          </div>
          
          {/* Sessions count badge */}
          {hasSessions && hasTrainings && (
            <div className="absolute bottom-2 right-2">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-green-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md"
              >
                {day.sessions.length}
              </motion.div>
            </div>
          )}
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-md" />
        </motion.div>
      );
    })}
    
    {/* Empty cells after the last day of month */}
    {Array.from({ length: 42 - (monthlyData.firstDayOfMonth + monthlyData.daysInMonth) }).map((_, index) => (
      <div 
        key={`end-empty-${index}`} 
        className="h-24 sm:h-32 lg:h-36 border-b border-r border-gray-100 bg-gray-50/50 last:border-r-0"
      />
    ))}
  </div>
</div>
            </motion.div>
          )}
          {monthlyData?.calendarInfo && viewMode === 'month' && (
            <motion.div 
              className="mt-6 p-6 bg-white rounded-lg shadow-sm border border-blue-100"
              variants={cardVariants}
              initial="initial"
              animate="animate"
            >
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold text-blue-800 flex items-center">
                  <MessageSquareText size={18} className="mr-2" />
                  Calendar Notes
                </h3>
                <button 
                  onClick={() => setIsEditingDescription(!isEditingDescription)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {isEditingDescription ? 'Cancel' : 'Edit'}
                </button>
              </div>
              
              {isEditingDescription ? (
                <div className="mt-2">
                  <textarea
                    value={calendarDescription}
                    onChange={(e) => setCalendarDescription(e.target.value)}
                    className="w-full p-3 border border-blue-200 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    rows={3}
                    placeholder="Add description for this month's calendar..."
                  />
                  <div className="mt-2 flex justify-end">
                    <button 
                      onClick={updateDescription}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-gray-700">
                  {calendarDescription || "No description available for this month."}
                </p>
              )}
            </motion.div>
          )}

          {/* Daily View */}
         {viewMode === 'day' && dailyData && selectedDay && (
  <motion.div 
    variants={cardVariants}
    initial="initial"
    animate="animate"
    className="space-y-6"
  >
    {/* Header Section */}
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg p-6 text-white">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div className="flex items-center mb-4 md:mb-0">
          <motion.button 
            onClick={handleBackToMonthly}
            className="mr-4 flex items-center bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors backdrop-blur-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft size={20} />
          </motion.button>
          <div>
            <h2 className="text-3xl font-bold">
              {format(selectedDay, 'EEEE')}
            </h2>
            <p className="text-blue-100 text-lg">
              {format(selectedDay, 'MMMM d, yyyy')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{dailyData.trainingsCount}</div>
            <div className="text-blue-100 text-sm">Total Trainings</div>
          </div>
          <div className="w-px h-12 bg-white/30"></div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {dailyData.trainings.reduce((acc, t) => acc + (t.sessions?.length || 0), 0)}
            </div>
            <div className="text-blue-100 text-sm">Total Sessions</div>
          </div>
        </div>
      </div>
    </div>

    {dailyData.trainings.length > 0 ? (
      <div className="space-y-6">
        {/* Timeline View */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <Clock size={24} className="mr-3 text-blue-600" />
            Daily Timeline
          </h3>
          
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-indigo-300 to-purple-200"></div>
            
            <div className="space-y-6">
              {filterTrainings(dailyData.trainings)
                .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                .map((training, index) => (
                  <motion.div 
                    key={training.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative flex items-start"
                  >
                    {/* Timeline dot */}
                    <div className="absolute left-7 w-3 h-3 bg-blue-500 rounded-full shadow-lg border-2 border-white z-10"></div>
                    
                    {/* Training card */}
                    <div className="ml-16 flex-1">
                      <motion.div 
                        className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6 border border-blue-100"
                        whileHover={{ y: -2, scale: 1.01 }}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-xl font-bold text-gray-800 mb-2">{training.title}</h4>
                            <div className="flex flex-wrap gap-2">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(training.status)}`}>
                                {training.status.replace('_', ' ')}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTrainingTypeColor(training.trainingType)}`}>
                                {training.trainingType.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-gray-700">
                              {format(new Date(training.startDate), 'h:mm a')}
                            </div>
                            <div className="text-sm text-gray-500">
                              Duration: {training.endDate ? 
                                Math.round((new Date(training.endDate).getTime() - new Date(training.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1 + ' days' :
                                'TBD'
                              }
                            </div>
                          </div>
                        </div>
                        
                        {/* Training details grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center bg-white rounded-lg p-3 shadow-sm">
                            <Users size={18} className="text-blue-600 mr-2" />
                            <div>
                              <div className="text-sm text-gray-500">Participants</div>
                              <div className="font-semibold text-gray-800">
                                {training._count?.participants || 0}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center bg-white rounded-lg p-3 shadow-sm">
                            <BookOpen size={18} className="text-green-600 mr-2" />
                            <div>
                              <div className="text-sm text-gray-500">Sessions</div>
                              <div className="font-semibold text-gray-800">
                                {training._count?.sessions || 0}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center bg-white rounded-lg p-3 shadow-sm">
                            <Calendar size={18} className="text-purple-600 mr-2" />
                            <div>
                              <div className="text-sm text-gray-500">Location</div>
                              <div className="font-semibold text-gray-800 truncate">
                                {training.location || 'Not specified'}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Trainer info */}
                        {training.trainer && (
                          <div className="flex items-center bg-blue-50 rounded-lg p-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                              {training.trainer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-gray-800">{training.trainer.name}</div>
                              <div className="text-sm text-gray-600">{training.trainer.email}</div>
                            </div>
                          </div>
                        )}
                        
                        {/* Sessions for this training */}
                        {training.sessions && training.sessions.length > 0 && (
                          <div className="mt-4">
                            <h5 className="font-semibold text-gray-700 mb-3 flex items-center">
                              <Clock size={16} className="mr-2" />
                              Today's Sessions
                            </h5>
                            <div className="space-y-2">
                              {training.sessions.map((session, sessionIndex) => (
                                <motion.div 
                                  key={session.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: (index * 0.1) + (sessionIndex * 0.05) }}
                                  className="bg-white border-l-4 border-blue-400 rounded-r-lg p-3 shadow-sm hover:shadow-md transition-shadow"
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="font-medium text-gray-800">
                                        {session.title || 'Session ' + (sessionIndex + 1)}
                                      </div>
                                      {session.venue && (
                                        <div className="text-sm text-gray-600 mt-1">
                                          📍 {session.venue}
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <div className="font-semibold text-blue-600">
                                        {format(new Date(session.startTime), 'h:mm a')} - {format(new Date(session.endTime), 'h:mm a')}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60))} min
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              <BookOpen size={20} className="mr-2" />
              Add Session
            </motion.button>
          </div>
        </div>
      </div>
    ) : (
      /* Empty State */
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-12 text-center"
      >
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Calendar size={40} className="text-blue-500" />
          </motion.div>
          
          <h3 className="text-2xl font-bold text-gray-800 mb-3">No Trainings Scheduled</h3>
          <p className="text-gray-600 mb-8 leading-relaxed">
            There are no training activities scheduled for {format(selectedDay, 'EEEE, MMMM d, yyyy')}. 
            Why not schedule something productive?
          </p>
          
          <div className="space-y-3">
            <motion.button
              onClick={handleBackToMonthly}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="block w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all"
            >
              <ArrowLeft size={18} className="inline mr-2" />
              Back to Calendar
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="block w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all"
            >
              <BookOpen size={18} className="inline mr-2" />
              Schedule New Training
            </motion.button>
          </div>
        </div>
      </motion.div>
    )}
  </motion.div>
)}

          {/* Statistics View */}
          {viewMode === 'stats' && statsData && (
            <motion.div 
              variants={cardVariants}
              initial="initial"
              animate="animate"
              className="space-y-6"
            >
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div 
                  className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md p-6 text-white"
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 10 }}
                >
                  <h3 className="text-lg font-semibold opacity-90 mb-1">Total Trainings</h3>
                  <p className="text-3xl font-bold">{statsData.statistics.totalTrainings}</p>
                </motion.div>
                
                {statsData.statistics.totalParticipants !== undefined && (
                  <motion.div 
                    className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-md p-6 text-white"
                    whileHover={{ y: -5 }}
                    transition={{ type: "spring", stiffness: 300, damping: 10 }}
                  >
                    <h3 className="text-lg font-semibold opacity-90 mb-1">Total Participants</h3>
                    <p className="text-3xl font-bold">{statsData.statistics.totalParticipants}</p>
                  </motion.div>
                )}
                
                {statsData.statistics.totalSessions !== undefined && (
                  <motion.div 
                    className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md p-6 text-white"
                    whileHover={{ y: -5 }}
                    transition={{ type: "spring", stiffness: 300, damping: 10 }}
                  >
                    <h3 className="text-lg font-semibold opacity-90 mb-1">Total Sessions</h3>
                    <p className="text-3xl font-bold">{statsData.statistics.totalSessions}</p>
                  </motion.div>
                )}
                
                <motion.div 
                  className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-md p-6 text-white"
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 10 }}
                >
                  <h3 className="text-lg font-semibold opacity-90 mb-1">Month/Year</h3>
                  <p className="text-3xl font-bold">{format(currentDate, 'MMM yyyy')}</p>
                </motion.div>
              </div>
              
              {/* Statistics Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div 
                  className="bg-white rounded-xl shadow-md p-6"
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  <h3 className="text-lg font-semibold text-blue-800 mb-4">Training Status Breakdown</h3>
                  
                  <div className="space-y-3">
                    {Object.entries(statsData.statistics.byStatus).map(([status, count]) => (
                      <div key={status} className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${getStatusColor(status).replace('text-', 'bg-').replace('bg-blue-100', 'bg-blue-500')}`}></div>
                        <span className="flex-1 text-gray-700">{status.replace('_', ' ')}</span>
                        <span className="font-semibold">{count}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
                
                <motion.div 
                  className="bg-white rounded-xl shadow-md p-6"
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  <h3 className="text-lg font-semibold text-blue-800 mb-4">Training Type Breakdown</h3>
                  
                  <div className="space-y-3">
                    {Object.entries(statsData.statistics.byType)
                      .filter(([_, count]) => count > 0)
                      .map(([type, count]) => (
                        <div key={type} className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 ${getTrainingTypeColor(type).replace('text-', 'bg-').replace('bg-indigo-100', 'bg-indigo-500')}`}></div>
                          <span className="flex-1 text-gray-700">{type.replace('_', ' ')}</span>
                          <span className="font-semibold">{count}</span>
                        </div>
                      ))
                    }
                  </div>
                </motion.div>
              </div>
              
              {/* Recent Items */}
              {statsData.recentTrainings && statsData.upcomingSessions && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.div 
                    className="bg-white rounded-xl shadow-md p-6"
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  >
                    <h3 className="text-lg font-semibold text-blue-800 mb-4">Recent Trainings</h3>
                    
                    {statsData.recentTrainings.length > 0 ? (
                      <div className="space-y-3">
                        {statsData.recentTrainings.map(training => (
                          <div 
                            key={training.id}
                            className="p-3 border border-blue-100 rounded-lg"
                          >
                            <div className="flex justify-between items-start">
                              <h4 className="font-medium text-blue-900">{training.title}</h4>
                              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(training.status)}`}>
                                {training.status}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 mt-2">
                              {format(new Date(training.startDate), 'MMM d')} - {format(new Date(training.endDate), 'MMM d, yyyy')}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        No recent trainings found
                      </div>
                    )}
                  </motion.div>
                  
                  <motion.div 
                    className="bg-white rounded-xl shadow-md p-6"
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  >
                    <h3 className="text-lg font-semibold text-blue-800 mb-4">Upcoming Sessions</h3>
                    
                    {statsData.upcomingSessions.length > 0 ? (
                      <div className="space-y-3">
                        {statsData.upcomingSessions.map(session => (
                          <div 
                            key={session.id}
                            className="p-3 border-l-4 border-blue-400 bg-blue-50 rounded-r-lg"
                          >
                            <div className="font-medium">{session.title || 'Untitled Session'}</div>
                            <div className="text-sm text-gray-700 mt-1">
                              Training: {session.training.title}
                            </div>
                            <div className="text-sm text-gray-600 mt-1 flex items-center">
                              <Clock size={14} className="mr-1" />
                              {format(new Date(session.startTime), 'MMM d, h:mm a')}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        No upcoming sessions found
                      </div>
                    )}
                  </motion.div>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default TrainingCalendar;