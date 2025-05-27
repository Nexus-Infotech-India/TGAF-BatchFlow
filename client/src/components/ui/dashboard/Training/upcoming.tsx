import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_ROUTES } from '../../../../utils/api';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  CalendarDays,
  Loader2,
  Tag,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

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

const UpcomingTrainings: React.FC = () => {
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['upcomingTrainings'],
    queryFn: async () => {
      const response = await axios.get(API_ROUTES.TRAINING.GET_TRAINING_DASHBOARD_STATS, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      return response.data.data.upcomingTrainings || [];
    },
  });

  if (isLoading) {
    return (
      <motion.div 
        className="bg-white rounded-xl shadow-lg h-[450px] flex flex-col items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Loading upcoming trainings...</p>
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
        <Calendar className="h-16 w-16 text-gray-300 mb-4" />
        <p className="text-gray-700 font-medium">Failed to load upcoming trainings</p>
        <p className="text-gray-500 text-sm mt-1">Please try again later</p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="bg-white rounded-xl shadow-lg overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Upcoming Trainings</h2>
            <p className="text-blue-100 text-sm">Next {data.length} scheduled trainings</p>
          </div>
          <div className="bg-white/20 p-2 rounded-lg">
            <Calendar className="h-5 w-5 text-white" />
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {data.length === 0 ? (
          <motion.div 
            className="flex flex-col items-center justify-center py-12 text-center"
            variants={itemVariants}
          >
            <Calendar className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-700 font-medium">No upcoming trainings</p>
            <p className="text-gray-500 text-sm mt-1">Schedule new trainings to see them here</p>
            <motion.button
              className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium flex items-center hover:bg-blue-100 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/trainings/create')}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Training
            </motion.button>
          </motion.div>
        ) : (
          <motion.div 
            className="space-y-4" 
            variants={containerVariants}
          >
            <AnimatePresence>
              {data.map((training: any, index: number) => {
                const isStartingSoon = training.daysUntilStart <= 3;
                const startDate = new Date(training.startDate);
                
                return (
                  <motion.div
                    key={training.id}
                    className={`p-4 rounded-lg border shadow-sm cursor-pointer transition-all ${
                      isStartingSoon ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100 hover:border-blue-200'
                    }`}
                    onClick={() => navigate(`/trainings/${training.id}`)}
                    variants={itemVariants}
                    whileHover={{ 
                      y: -4,
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                      transition: { duration: 0.2 }
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-grow">
                        <div className="flex items-center">
                          {isStartingSoon && (
                            <div className="bg-amber-500/10 text-amber-600 text-xs px-2 py-0.5 rounded font-medium mr-2 border border-amber-300">
                              Starting Soon
                            </div>
                          )}
                          <h3 className={`text-base font-semibold ${isStartingSoon ? 'text-amber-700' : 'text-gray-800'}`}>
                            {training.title}
                          </h3>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <div className={`flex items-center ${isStartingSoon ? 'text-amber-600' : 'text-blue-600'}`}>
                            <CalendarDays className="h-3.5 w-3.5 mr-2" />
                            <span className="text-sm">
                              {startDate.toLocaleDateString(undefined, {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                          
                          {training.location && (
                            <div className="flex items-center text-gray-700">
                              <MapPin className="h-3.5 w-3.5 mr-2 text-red-500" />
                              <span className="text-sm truncate" title={training.location}>
                                {training.location}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center text-gray-700">
                            <Users className="h-3.5 w-3.5 mr-2 text-violet-500" />
                            <span className="text-sm">
                              {training.participantsCount} participants
                            </span>
                          </div>
                          
                          <div className="flex items-center text-gray-700">
                            <Tag className="h-3.5 w-3.5 mr-2 text-green-500" />
                            <span className="text-sm">
                              {training.trainingType}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center mt-3 text-gray-500 text-xs">
                          <Clock className="h-3.5 w-3.5 mr-1.5" />
                          <span>
                            Starts at {startDate.toLocaleTimeString(undefined, {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                      
                      <div className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-lg ${
                        isStartingSoon 
                          ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-inner' 
                          : 'bg-blue-50 text-blue-700'
                      }`}>
                        <span className="text-lg font-bold">{training.daysUntilStart}</span>
                        <span className="text-xs">days</span>
                      </div>
                    </div>
                    
                    <motion.div 
                      className={`flex items-center mt-2 pt-2 border-t text-sm ${
                        isStartingSoon ? 'border-amber-200 text-amber-700' : 'border-gray-100 text-blue-600'
                      }`}
                      initial="hidden"
                      animate="visible"
                      variants={{
                        hidden: { opacity: 0, x: -5 },
                        visible: { opacity: 1, x: 0, transition: { delay: 0.4 + index * 0.1 } }
                      }}
                    >
                      <span>View training details</span>
                      <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </motion.div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
      
      {/* Footer with navigation */}
      {data.length > 0 && (
        <motion.div 
          className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center"
          variants={itemVariants}
        >
          <span className="text-xs text-gray-500">
            Showing {Math.min(data.length, 5)} of {data.length} upcoming trainings
          </span>
          <motion.button
            className="text-sm text-blue-600 font-medium flex items-center hover:text-blue-800 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/trainings')}
          >
            View All
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default UpcomingTrainings;