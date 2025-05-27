import React, { useState } from 'react';
import { Radar, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_ROUTES } from '../../../../utils/api';
import { Loader2, Star, AlertCircle, Award, ThumbsUp, MessageCircle, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Register ChartJS components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

// Animation variants
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

// Distribution categories with their colors
const ratingCategories = [
  { key: 'excellent', label: 'Excellent', color: 'rgba(75, 192, 192, 0.7)', borderColor: 'rgba(75, 192, 192, 1)' },
  { key: 'good', label: 'Good', color: 'rgba(54, 162, 235, 0.7)', borderColor: 'rgba(54, 162, 235, 1)' },
  { key: 'average', label: 'Average', color: 'rgba(255, 206, 86, 0.7)', borderColor: 'rgba(255, 206, 86, 1)' },
  { key: 'poor', label: 'Poor', color: 'rgba(255, 159, 64, 0.7)', borderColor: 'rgba(255, 159, 64, 1)' },
  { key: 'veryPoor', label: 'Very Poor', color: 'rgba(255, 99, 132, 0.7)', borderColor: 'rgba(255, 99, 132, 1)' }
];

// Star rating component
const StarRating = ({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  return (
    <div className="flex">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
      ))}
      {hasHalfStar && (
        <div className="relative">
          <Star className="h-4 w-4 text-yellow-400" />
          <div className="absolute top-0 left-0 overflow-hidden" style={{ width: '50%' }}>
            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
          </div>
        </div>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className="h-4 w-4 text-yellow-400" />
      ))}
    </div>
  );
};

const FeedbackRatings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ratings' | 'distribution'>('ratings');
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['feedbackStats'],
    queryFn: async () => {
      const response = await axios.get(API_ROUTES.TRAINING.GET_TRAINING_FEEDBACK_STATS, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      return response.data.data;
    },
  });

  if (isLoading) {
    return (
      <motion.div 
        className="bg-white rounded-xl shadow-lg min-h-[400px] flex flex-col items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Loading feedback data...</p>
      </motion.div>
    );
  }

  if (error || !data) {
    return (
      <motion.div 
        className="bg-white rounded-xl shadow-lg min-h-[400px] flex flex-col items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <AlertCircle className="h-16 w-16 text-red-400 mb-4" />
        <h3 className="text-lg font-bold text-gray-800 mb-2">Failed to Load Data</h3>
        <p className="text-gray-600">Unable to retrieve feedback statistics</p>
      </motion.div>
    );
  }

  const hasTrainingRatings = data.trainingRatings && data.trainingRatings.length > 0;

  // Radar chart data for overall averages
  const radarData = {
    labels: ['Content', 'Trainer', 'Material', 'Venue', 'Overall'],
    datasets: [
      {
        label: 'Average Ratings',
        data: [
          data.overallAverages.content,
          data.overallAverages.trainer,
          data.overallAverages.material,
          data.overallAverages.venue,
          data.overallAverages.overall,
        ],
        backgroundColor: 'rgba(99, 102, 241, 0.25)',
        borderColor: 'rgba(99, 102, 241, 0.8)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(99, 102, 241, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(99, 102, 241, 1)',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const radarOptions = {
    scales: {
      r: {
        angleLines: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        suggestedMin: 0,
        suggestedMax: 5,
        ticks: {
          stepSize: 1,
          backdropColor: 'transparent',
          font: {
            size: 10
          }
        },
        pointLabels: {
          font: {
            size: 12,
            family: "'Inter', sans-serif",
            weight: 600
          },
          color: 'rgba(55, 65, 81, 1)',
        },
      },
    },
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
        bodyFont: {
          size: 12,
        },
        callbacks: {
          label: function(context: any) {
            return `Rating: ${context.raw.toFixed(1)} / 5`;
          }
        }
      }
    },
    maintainAspectRatio: false,
  };

  // Bar chart data for rating distribution
  const distributionData = {
    labels: ratingCategories.map(cat => cat.label),
    datasets: [
      {
        label: 'Number of Trainings',
        data: ratingCategories.map(cat => data.ratingDistribution[cat.key] || 0),
        backgroundColor: ratingCategories.map(cat => cat.color),
        borderRadius: 6,
        maxBarThickness: 50,
      },
    ],
  };

  const distributionOptions = {
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          font: {
            size: 11
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        title: {
          display: true,
          text: 'Number of Trainings',
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          },
          color: 'rgba(107, 114, 128, 1)'
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11
          }
        }
      },
    },
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
      }
    },
    maintainAspectRatio: false,
    barPercentage: 0.7,
  };

  // Get top trainings by overall rating
  const topTrainings = hasTrainingRatings
    ? [...data.trainingRatings]
        .sort((a, b) => b.ratings.overall - a.ratings.overall)
        .slice(0, 4)
    : [];

  // Calculate highest rating aspect
  let highestAspect = { key: 'overall', value: 0 };
  Object.entries(data.overallAverages).forEach(([key, value]) => {
    if (Number(value) > highestAspect.value) {
      highestAspect = { key, value: Number(value) };
    }
  });

  // Calculate total feedback count
  const totalFeedback = hasTrainingRatings
    ? data.trainingRatings.reduce((total: any, training: { feedbackCount: any; }) => total + training.feedbackCount, 0)
    : 0;

  return (
    <motion.div 
      className="bg-white rounded-xl shadow-lg overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header with tabs */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-5">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Feedback Analysis</h2>
            <p className="text-indigo-100 text-sm">
              {totalFeedback} feedback entries across all trainings
            </p>
          </div>
          <div className="flex items-center bg-white/20 rounded-lg p-1">
            <button
              className={`px-4 py-1.5 text-sm rounded-md flex items-center ${
                activeTab === 'ratings' 
                  ? 'bg-white text-indigo-700 shadow-sm' 
                  : 'text-white hover:bg-white/10'
              }`}
              onClick={() => setActiveTab('ratings')}
            >
              <Star className={`h-3.5 w-3.5 mr-1.5 ${activeTab === 'ratings' ? 'fill-yellow-400 text-yellow-400' : ''}`} />
              Ratings
            </button>
            <button
              className={`px-4 py-1.5 text-sm rounded-md flex items-center ${
                activeTab === 'distribution' 
                  ? 'bg-white text-indigo-700 shadow-sm' 
                  : 'text-white hover:bg-white/10'
              }`}
              onClick={() => setActiveTab('distribution')}
            >
              <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
              Distribution
            </button>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-5">
        <AnimatePresence mode="wait">
          {activeTab === 'ratings' ? (
            <motion.div
              key="ratings"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {/* Radar chart */}
              <motion.div variants={itemVariants} className="relative">
                <div className="h-64">
                  <Radar data={radarData} options={radarOptions} />
                </div>
                
                {/* Highlight badge */}
                <motion.div
                  className="absolute -top-2 right-0 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-1 rounded-full text-xs font-semibold flex items-center shadow-md"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                >
                  <Award className="h-3.5 w-3.5 mr-1.5" />
                  Highest: {highestAspect.key.charAt(0).toUpperCase() + highestAspect.key.slice(1)}
                </motion.div>
                
                {/* Average ratings stats */}
                <motion.div variants={itemVariants} className="grid grid-cols-5 gap-1 mt-3">
                  {Object.entries(data.overallAverages).map(([key, value], index) => (
                    <motion.div 
                      key={key} 
                      className="flex flex-col items-center p-2 rounded-lg"
                      style={{ 
                        backgroundColor: key === highestAspect.key ? 'rgba(99, 102, 241, 0.1)' : 'rgba(249, 250, 251, 1)',
                        border: key === highestAspect.key ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent'
                      }}
                      whileHover={{ scale: 1.03, backgroundColor: 'rgba(99, 102, 241, 0.1)' }}
                    >
                      <div className="text-xs font-medium capitalize text-gray-600 mb-1">{key}</div>
                      <motion.div 
                        className="flex items-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 + index * 0.1 }}
                      >
                        <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400 mr-0.5" />
                        <span className="text-sm font-bold">{Number(value).toFixed(1)}</span>
                      </motion.div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
              
              {/* Top rated trainings */}
              <motion.div variants={itemVariants} className="flex flex-col">
                <div className="flex items-center mb-3 text-gray-800 font-semibold">
                  <ThumbsUp className="h-4 w-4 mr-2 text-indigo-500" />
                  <h3 className="text-base">Top Rated Trainings</h3>
                </div>
                
                <div className="space-y-3 overflow-y-auto max-h-80 pr-1">
                  {hasTrainingRatings ? (
                    topTrainings.map((training, index) => (
                      <motion.div 
                        key={training.id} 
                        className="bg-gradient-to-br from-white to-slate-50 p-3 rounded-lg border border-gray-100 shadow-sm"
                        variants={itemVariants}
                        whileHover={{ 
                          y: -2, 
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" 
                        }}
                      >
                        <div className="flex justify-between items-center mb-1.5">
                          <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-inner ${
                              index === 0 ? 'bg-yellow-400' : 
                              index === 1 ? 'bg-gray-400' :
                              index === 2 ? 'bg-amber-600' : 'bg-indigo-400'
                            }`}>
                              {index + 1}
                            </div>
                            <span className="font-medium ml-2 line-clamp-1" title={training.title}>
                              {training.title}
                            </span>
                          </div>
                          
                          <div className="flex items-center">
                            <div className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-sm font-bold flex items-center">
                              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 mr-1" />
                              {training.ratings.overall.toFixed(1)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-500 mb-2">
                          <MessageCircle className="h-3.5 w-3.5 mr-1" />
                          <span>
                            {training.feedbackCount} {training.feedbackCount === 1 ? 'feedback' : 'feedbacks'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(training.ratings).map(([key, value]) => 
                            key !== 'overall' && (
                              <div key={key} className="flex items-center justify-between bg-white px-2 py-1 rounded border border-gray-100">
                                <span className="text-xs font-medium capitalize text-gray-700">{key}:</span>
                                <div className="flex items-center">
                                  <Star className="h-3 w-3 text-yellow-400 fill-yellow-400 mr-0.5" />
                                  <span className="text-xs font-semibold">{Number(value).toFixed(1)}</span>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div 
                      className="bg-gray-50 p-6 rounded-lg text-center h-64 flex flex-col items-center justify-center"
                      variants={itemVariants}
                    >
                      <MessageCircle className="h-12 w-12 text-gray-300 mb-3" />
                      <p className="text-gray-600 font-medium">No feedback data available</p>
                      <p className="text-gray-400 text-sm mt-1">Collect feedback from training participants to see ratings</p>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="distribution"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div variants={itemVariants} className="mb-4">
                <div className="flex items-center mb-3 text-gray-800 font-semibold">
                  <BarChart3 className="h-4 w-4 mr-2 text-indigo-500" />
                  <h3 className="text-base">Rating Distribution</h3>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="h-64">
                    <Bar data={distributionData} options={distributionOptions} />
                  </div>
                </div>
              </motion.div>
              
              <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-6">
                {ratingCategories.map((category, index) => {
                  const count = data.ratingDistribution[category.key] || 0;
                  const percentage = totalFeedback > 0 
                    ? Math.round((count / totalFeedback) * 100) 
                    : 0;
                  
                  return (
                    <motion.div
                      key={category.key}
                      className="bg-white rounded-lg border p-3 flex flex-col items-center"
                      style={{ borderColor: category.borderColor }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                    >
                      <div 
                        className="w-8 h-8 rounded-full mb-1 flex items-center justify-center"
                        style={{ backgroundColor: category.color }}
                      >
                        <span className="text-white font-bold text-xs">{count}</span>
                      </div>
                      <h4 className="text-sm font-medium">{category.label}</h4>
                      <div className="text-xs text-gray-500 mt-1">{percentage}%</div>
                      
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                        <motion.div
                          className="h-1.5 rounded-full"
                          style={{ backgroundColor: category.borderColor }}
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
              
              <motion.div
                className="mt-6 px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-lg"
                variants={itemVariants}
              >
                <div className="flex items-center">
                  <div className="mr-4">
                    <div className="text-xs text-indigo-600 font-medium mb-1">Overall Sentiment</div>
                    <div className="flex items-center">
                      <StarRating rating={data.overallAverages.overall || 0} />
                      <span className="ml-2 font-bold text-indigo-700">
                        {data.overallAverages.overall.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="text-xs text-indigo-600 font-medium mb-1">Distribution</div>
                    <div className="w-full h-2 bg-gray-200 rounded-full flex overflow-hidden">
                      {ratingCategories.map((category, index) => {
                        const count = data.ratingDistribution[category.key] || 0;
                        const percentage = totalFeedback > 0 
                          ? (count / totalFeedback) * 100 
                          : 0;
                        
                        return (
                          <motion.div
                            key={category.key}
                            style={{ 
                              width: `${percentage}%`, 
                              backgroundColor: category.borderColor,
                              display: percentage > 0 ? 'block' : 'none'
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ delay: 0.3 + index * 0.1, duration: 0.8 }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default FeedbackRatings;