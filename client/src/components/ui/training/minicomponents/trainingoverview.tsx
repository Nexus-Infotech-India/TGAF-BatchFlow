import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  Card,
  Avatar,
  Descriptions,
  Tag,
  Progress,
  Tooltip} from 'antd';
import {
  Calendar,
  Users,
  Building,
  FileText,
  Target,
  Clock,
  Award,
  TrendingUp,
  Sparkles,
  Star,
  ChevronRight,
  MapPin,
  User} from 'lucide-react';

// Fixed interface with proper type
interface TrainingOverviewProps {
  training: any;
  onTabChange: (tab: 'overview' | 'sessions' | 'participants' | 'documents' | 'attendance') => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.08,
      duration: 0.6
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: { 
      type: "spring",
      damping: 15,
      stiffness: 100,
      duration: 0.4
    }
  }
};

const cardHoverVariants = {
  hover: { 
    y: -6,
    scale: 1.02,
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    transition: { duration: 0.3, ease: "easeOut" }
  }
};

// Enhanced Stats Card Component - Medium size
const StatsCard = ({ 
  title, 
  value, 
  icon, 
  gradient, 
  subtitle, 
  percentage, 
  trend,
  onClick,
  delay = 0 
}: any) => (
  <motion.div
    variants={itemVariants}
    initial="hidden"
    animate="visible"
    transition={{ delay }}
    whileHover="hover"
  >
    <motion.div 
      variants={cardHoverVariants}
      className="bg-white rounded-xl shadow-lg border border-gray-100 p-5 cursor-pointer relative overflow-hidden h-[140px]"
      onClick={onClick}
    >
      {/* Background gradient overlay */}
      <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${gradient} opacity-10 rounded-full -mr-4 -mt-4`} />
      
      <div className="relative h-full flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className={`p-2.5 rounded-lg bg-gradient-to-br ${gradient} shadow-lg`}>
            <div className="text-white">
              {React.cloneElement(icon, { size: 18 })}
            </div>
          </div>
          
          {trend && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              trend === 'up' 
                ? 'bg-green-100 text-green-700' 
                : trend === 'down'
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-700'
            }`}>
              {trend === 'up' && <TrendingUp size={8} />}
              <span>{percentage}%</span>
            </div>
          )}
        </div>
        
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-end justify-between mb-1">
            <div>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-sm font-medium text-gray-600">{title}</p>
            </div>
            <ChevronRight size={14} className="text-gray-400" />
          </div>
          
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        
        {percentage !== undefined && percentage > 0 && (
          <div className="mt-2">
            <Progress 
              percent={percentage} 
              strokeColor={{
                '0%': gradient.includes('blue') ? '#3B82F6' : 
                      gradient.includes('green') ? '#10B981' :
                      gradient.includes('purple') ? '#8B5CF6' :
                      gradient.includes('amber') ? '#F59E0B' : '#6B7280',
                '100%': gradient.includes('blue') ? '#1D4ED8' : 
                        gradient.includes('green') ? '#059669' :
                        gradient.includes('purple') ? '#7C3AED' :
                        gradient.includes('amber') ? '#D97706' : '#4B5563',
              }}
              size="small"
              showInfo={false}
              className="custom-progress"
            />
          </div>
        )}
      </div>
    </motion.div>
  </motion.div>
);

const TrainingOverview: React.FC<TrainingOverviewProps> = ({ training, onTabChange }) => {
  const sessions = training.sessions || [];
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  
  // Calculate training completion percentage
  const startDate = new Date(training.startDate).getTime();
  const endDate = new Date(training.endDate).getTime();
  const currentDate = new Date().getTime();
  
  if (training.status === 'COMPLETED') {
  } else if (training.status === 'CANCELLED') {
  } else if (currentDate > startDate) {
  }

  // Calculate attendance rate if available
  const attendanceRate = training._count?.attendances 
    ? Math.round((training._count.attendances / (sessions.length * (training._count.participants || 1))) * 100) 
    : 0;

  // Calculate capacity utilization
  const capacityUtilization = training.maxParticipants 
    ? Math.round((training._count?.participants || 0) / training.maxParticipants * 100)
    : 100;
  
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return isDescExpanded ? text : `${text.substring(0, maxLength)}...`;
  };
  
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Enhanced Stats Cards - All same medium size */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Participants"
          value={`${training._count?.participants || 0}${training.maxParticipants ? ` / ${training.maxParticipants}` : ''}`}
          icon={<Users />}
          gradient="from-blue-500 to-blue-600"
          subtitle={training.maxParticipants ? `${capacityUtilization}% capacity` : 'No limit set'}
          percentage={training.maxParticipants ? capacityUtilization : undefined}
          trend={capacityUtilization > 80 ? 'up' : capacityUtilization > 50 ? 'stable' : 'down'}
          onClick={() => onTabChange('participants')}
          delay={0}
        />
        
        <StatsCard
          title="Sessions"
          value={training.sessions?.length || 0}
          icon={<Calendar />}
          gradient="from-purple-500 to-purple-600"
          subtitle={sessions.length > 0 ? `Next: ${format(new Date(sessions[0]?.startTime), 'MMM dd')}` : 'No sessions scheduled'}
          onClick={() => onTabChange('sessions')}
          delay={0.1}
        />
        
        <StatsCard
          title="Documents"
          value={training._count?.documents || 0}
          icon={<FileText />}
          gradient="from-amber-500 to-orange-600"
          subtitle={training._count?.documents ? 'Materials available' : 'No materials yet'}
          onClick={() => onTabChange('documents')}
          delay={0.2}
        />
        
        <StatsCard
          title="Attendance Rate"
          value={`${attendanceRate}%`}
          icon={<Target />}
          gradient="from-green-500 to-emerald-600"
          subtitle={attendanceRate > 80 ? 'Excellent' : attendanceRate > 60 ? 'Good' : 'Needs improvement'}
          percentage={attendanceRate > 0 ? attendanceRate : undefined}
          trend={attendanceRate > 80 ? 'up' : attendanceRate > 60 ? 'stable' : 'down'}
          onClick={() => onTabChange('attendance')}
          delay={0.3}
        />
      </motion.div>
      
      {/* Enhanced Training Details Card */}
      <motion.div 
        variants={itemVariants}
        className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-lg"
      >
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 relative">
          <div className="absolute top-0 right-0 opacity-10">
            <Sparkles size={40} className="text-blue-600" />
          </div>
          <div className="relative flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <Award className="mr-3 text-blue-600" size={24} />
              Training Details
            </h2>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {training.trainingType?.replace('_', ' ')}
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <Descriptions 
            bordered 
            column={{ xxl: 3, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
            className="custom-descriptions"
            labelStyle={{ fontWeight: 600, backgroundColor: '#F8FAFC', color: '#374151' }}
            contentStyle={{ backgroundColor: '#FFFFFF', color: '#1F2937' }}
            size="middle"
          >
            <Descriptions.Item 
              label={
                <div className="flex items-center">
                  <Building size={14} className="mr-2 text-blue-500" />
                  Location
                </div>
              }
            >
              <Tooltip title={`Training location: ${training.location}`}>
                <span className="text-gray-700 font-medium">{training.location}</span>
              </Tooltip>
            </Descriptions.Item>
            
            <Descriptions.Item 
              label={
                <div className="flex items-center">
                  <Clock size={14} className="mr-2 text-blue-500" />
                  Duration
                </div>
              }
            >
              <span className="text-gray-700 font-medium">
                {Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))} days
              </span>
            </Descriptions.Item>
            
            <Descriptions.Item 
              label={
                <div className="flex items-center">
                  <User size={14} className="mr-2 text-blue-500" />
                  Trainer
                </div>
              }
            >
              <div className="flex items-center">
                <Avatar 
                  className="mr-2 bg-gradient-to-r from-blue-500 to-indigo-600"
                  size="small"
                >
                  {training.trainer?.name?.charAt(0) || 'T'}
                </Avatar>
                <span className="text-gray-700 font-medium">{training.trainer?.name || 'Not assigned'}</span>
              </div>
            </Descriptions.Item>
            
            <Descriptions.Item 
              label={
                <div className="flex items-center">
                  <Calendar size={14} className="mr-2 text-blue-500" />
                  Start Date
                </div>
              }
            >
              <span className="text-gray-700 font-medium">
                {format(new Date(training.startDate), 'EEEE, MMM dd, yyyy')}
              </span>
            </Descriptions.Item>
            
            <Descriptions.Item 
              label={
                <div className="flex items-center">
                  <Calendar size={14} className="mr-2 text-blue-500" />
                  End Date
                </div>
              }
            >
              <span className="text-gray-700 font-medium">
                {format(new Date(training.endDate), 'EEEE, MMM dd, yyyy')}
              </span>
            </Descriptions.Item>
            
            <Descriptions.Item 
              label={
                <div className="flex items-center">
                  <Users size={14} className="mr-2 text-blue-500" />
                  Capacity
                </div>
              }
            >
              <span className="text-gray-700 font-medium">
                {training.maxParticipants ? `${training.maxParticipants} participants` : 'Unlimited'}
              </span>
            </Descriptions.Item>
            
            {training.createdById && (
              <Descriptions.Item 
                label={
                  <div className="flex items-center">
                    <User size={14} className="mr-2 text-blue-500" />
                    Created By
                  </div>
                }
                span={2}
              >
                <div className="flex items-center">
                  <Avatar 
                    className="mr-2 bg-gradient-to-r from-purple-500 to-pink-600"
                    size="small"
                  >
                    {training.createdById.charAt(0).toUpperCase()}
                  </Avatar>
                  <span className="text-gray-700 font-medium">{training.createdById}</span>
                </div>
              </Descriptions.Item>
            )}
            
            <Descriptions.Item 
              label={
                <div className="flex items-center">
                  <Calendar size={14} className="mr-2 text-blue-500" />
                  Created On
                </div>
              }
              span={1}
            >
              <span className="text-gray-700 font-medium">
                {format(new Date(training.createdAt), 'MMM dd, yyyy hh:mm a')}
              </span>
            </Descriptions.Item>
          </Descriptions>
        </div>
      </motion.div>
      
      {/* Enhanced Description Section */}
      {training.description && (
        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-lg"
        >
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <FileText className="mr-3 text-green-600" size={24} />
              Training Description
            </h2>
          </div>
          <div className="p-6">
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-line leading-relaxed text-lg">
                {truncateText(training.description, 300)}
              </p>
              
              {training.description.length > 300 && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsDescExpanded(!isDescExpanded)}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium flex items-center transition-colors"
                >
                  {isDescExpanded ? 'Show less' : 'Read more'}
                  <ChevronRight 
                    size={16} 
                    className={`ml-1 transition-transform ${isDescExpanded ? 'rotate-90' : ''}`}
                  />
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Enhanced Upcoming Sessions - Grid Layout */}
      {sessions.length > 0 && (
        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-lg"
        >
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 via-violet-50 to-indigo-50 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <Clock className="mr-3 text-purple-600" size={24} />
              Training Sessions
              <span className="ml-3 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                {sessions.length} session{sessions.length !== 1 ? 's' : ''}
              </span>
            </h2>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onTabChange('sessions')}
              className="text-purple-600 hover:text-purple-700 font-medium flex items-center transition-colors"
            >
              View All Sessions
              <ChevronRight className="ml-1" size={16} />
            </motion.button>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions.slice(0, 6).map((session: any, index: number) => (
                <motion.div
                  key={session.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="relative"
                >
                  <Card 
                    className={`shadow-lg hover:shadow-xl transition-all border border-gray-200 rounded-xl relative overflow-hidden ${
                      index === 0 ? 'border-purple-200 bg-gradient-to-br from-purple-50/50 to-white' : 'bg-white'
                    }`}
                    bodyStyle={{ padding: '1.5rem' }}
                  >
                    {/* Session number badge */}
                    <div className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    
                    {/* Next session indicator */}
                    {index === 0 && (
                      <div className="absolute top-0 left-0 bg-purple-500 text-white px-2 py-1 text-xs font-medium rounded-br-lg">
                        <Star size={10} className="mr-1 inline" />
                        Next
                      </div>
                    )}
                    
                    <div className="mt-2">
                      <h3 className="font-bold text-lg text-gray-800 mb-3 pr-8">
                        {session.title || `Session ${index + 1}`}
                      </h3>
                      
                      <div className="space-y-3">
                        <div className="flex items-center text-gray-600">
                          <Calendar className="mr-2 text-purple-500 flex-shrink-0" size={16} />
                          <span className="font-medium text-sm">
                            {format(new Date(session.startTime), 'EEE, MMM dd, yyyy')}
                          </span>
                        </div>
                        
                        <div className="flex items-center text-gray-600">
                          <Clock className="mr-2 text-purple-500 flex-shrink-0" size={16} />
                          <span className="font-medium text-sm">
                            {format(new Date(session.startTime), 'hh:mm a')} - 
                            {format(new Date(session.endTime), 'hh:mm a')}
                          </span>
                        </div>
                        
                        <div className="flex items-center text-gray-600">
                          <MapPin className="mr-2 text-purple-500 flex-shrink-0" size={16} />
                          <span className="font-medium text-sm truncate">
                            {session.venue || training.location}
                          </span>
                        </div>
                      </div>
                      
                      {session.description && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                            {session.description}
                          </p>
                        </div>
                      )}
                      
                      {/* Session status if available */}
                      {session.status && (
                        <div className="mt-3 flex justify-end">
                          <Tag 
                            color={
                              session.status === 'COMPLETED' ? 'green' :
                              session.status === 'IN_PROGRESS' ? 'orange' :
                              session.status === 'CANCELLED' ? 'red' : 'blue'
                            }
                            className="rounded-full px-2 py-1 text-xs"
                          >
                            {session.status.toLowerCase().replace('_', ' ')}
                          </Tag>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
            
            {sessions.length > 6 && (
              <div className="mt-6 text-center">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onTabChange('sessions')}
                  className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium transition-all shadow-lg"
                >
                  View All {sessions.length} Sessions
                  <ChevronRight className="ml-2 inline" size={16} />
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default TrainingOverview;