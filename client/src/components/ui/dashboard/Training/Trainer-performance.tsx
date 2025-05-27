import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_ROUTES } from '../../../../utils/api';
import { Loader2, Star, Medal, Trophy, Award, Users, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
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

const TrainerPerformance: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['trainerPerformance'],
    queryFn: async () => {
      const response = await axios.get(API_ROUTES.TRAINING.GET_TRAINING_TRAINER_STATS, {
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
        className="bg-white rounded-xl shadow-lg min-h-[450px] flex flex-col items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Loading trainer performance data...</p>
      </motion.div>
    );
  }

  if (error || !data) {
    return (
      <motion.div 
        className="bg-white rounded-xl shadow-lg min-h-[450px] flex flex-col items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Users className="h-16 w-16 text-gray-300 mb-4" />
        <p className="text-gray-700 font-medium">Failed to load trainer performance data</p>
        <p className="text-gray-500 text-sm mt-1">Please try again later</p>
      </motion.div>
    );
  }

  // Calculate averages if not provided by API
  const averages = data.averages || {
    trainer: data.trainers.reduce((sum: number, t: any) => sum + (t.ratings.trainer || 0), 0) / (data.trainers.length || 1),
    content: data.trainers.reduce((sum: number, t: any) => sum + (t.ratings.content || 0), 0) / (data.trainers.length || 1),
    overall: data.trainers.reduce((sum: number, t: any) => sum + (t.ratings.overall || 0), 0) / (data.trainers.length || 1)
  };

  // Limit to top 5 trainers by rating for chart
  // If all trainers have 0 ratings, sort by trainingsCount instead
  const sortedTrainers = [...data.trainers];
  const allZeroRatings = sortedTrainers.every((t: any) => t.ratings.overall === 0);
  
  if (allZeroRatings) {
    sortedTrainers.sort((a: any, b: any) => b.trainingsCount - a.trainingsCount);
  } else {
    sortedTrainers.sort((a: any, b: any) => b.ratings.overall - a.ratings.overall);
  }
  
  const topTrainers = sortedTrainers.slice(0, 5);

  const chartData = {
    labels: topTrainers.map((trainer: any) => trainer.name.split(' ')[0]), // Use first name only for chart clarity
    datasets: [
      {
        label: 'Trainer Rating',
        data: topTrainers.map((trainer: any) => trainer.ratings.trainer || 0),
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
        borderRadius: 6,
        barPercentage: 0.6,
      },
      {
        label: 'Content Rating',
        data: topTrainers.map((trainer: any) => trainer.ratings.content || 0),
        backgroundColor: 'rgba(255, 159, 64, 0.7)',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 1,
        borderRadius: 6,
        barPercentage: 0.6,
      },
      {
        label: 'Overall Rating',
        data: topTrainers.map((trainer: any) => trainer.ratings.overall || 0),
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        borderRadius: 6,
        barPercentage: 0.6,
      },
    ],
  };

  // Dynamically set y-axis max based on data
  // If all ratings are 0, set max to 1 to avoid empty chart
  const maxRating = allZeroRatings ? 1 : 5;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        min: 0,
        max: maxRating,
        ticks: {
          stepSize: 1,
          font: {
            size: 10
          }
        },
        title: {
          display: true,
          text: allZeroRatings ? 'No ratings yet' : 'Rating (out of 5)',
          font: {
            size: 11,
            family: "'Inter', sans-serif",
          },
          color: 'rgba(107, 114, 128, 1)'
        },
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          boxWidth: 12,
          padding: 15,
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
        padding: 10,
        boxPadding: 5,
        bodyFont: {
          size: 12,
        },
      },
    },
  };

  return (
    <motion.div 
      className="bg-white rounded-xl shadow-lg overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Trainer Performance</h2>
            <p className="text-indigo-100 text-sm">
              {allZeroRatings ? 'Training activity metrics' : 'Effectiveness metrics for top trainers'}
            </p>
          </div>
          <div className="bg-white/20 p-2 rounded-lg">
            <Trophy className="h-5 w-5 text-yellow-200" />
          </div>
        </div>
      </div>
      
      <motion.div className="p-5" variants={itemVariants}>
        <div className="h-64 mb-6">
          <Bar data={chartData} options={options} />
        </div>
        
        <div className="flex items-center mb-3">
          <BarChart3 className="h-4 w-4 text-indigo-500 mr-2" />
          <h4 className="text-sm font-semibold text-gray-700">
            {allZeroRatings ? 'Trainers by Activity' : 'Top Trainers by Rating'}
          </h4>
        </div>
        
        <div className="space-y-2.5 max-h-64 overflow-auto pr-2 custom-scrollbar">
          {data.trainers.slice(0, 8).map((trainer: any, index: number) => {
            // Determine badge type based on rank
            let BadgeIcon;
            let badgeColor = '';
            
            if (index === 0) {
              BadgeIcon = Trophy;
              badgeColor = 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white';
            } else if (index === 1) {
              BadgeIcon = Medal;
              badgeColor = 'bg-gradient-to-r from-gray-300 to-gray-400 text-white';
            } else if (index === 2) {
              BadgeIcon = Award;
              badgeColor = 'bg-gradient-to-r from-amber-500 to-amber-600 text-white';
            } else {
              BadgeIcon = Users;
              badgeColor = 'bg-blue-100 text-blue-700';
            }
            
            return (
              <motion.div 
                key={trainer.id} 
                className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg shadow-sm hover:bg-white hover:border-indigo-200 transition-colors"
                variants={itemVariants}
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              >
                <div className="flex items-center">
                  <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center ${badgeColor} rounded-full font-medium text-sm shadow-sm`}>
                    {index < 3 ? <BadgeIcon className="h-4 w-4" /> : index + 1}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-800">{trainer.name}</p>
                    <p className="text-xs text-gray-500">{trainer.trainingsCount} trainings</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="flex items-center bg-indigo-50 px-2 py-1 rounded-md mr-2">
                    <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400 mr-1" />
                    <span className="text-xs font-bold text-indigo-700">
                      {(trainer.ratings.overall || 0).toFixed(1)}
                    </span>
                  </div>
                  <div 
                    className={`text-xs px-2 py-1 rounded-md font-medium ${
                      trainer.completionRate >= 90 ? 'bg-green-50 text-green-700' :
                      trainer.completionRate >= 75 ? 'bg-blue-50 text-blue-700' :
                      trainer.completionRate >= 60 ? 'bg-amber-50 text-amber-700' :
                      'bg-red-50 text-red-700'
                    }`}
                  >
                    {trainer.completionRate}%
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {/* Legend */}
        <motion.div 
          className="flex items-center justify-end mt-4 text-xs text-gray-500 space-x-4"
          variants={itemVariants}
        >
          <div className="flex items-center">
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 mr-1.5"></div>
            <span>Rating</span>
          </div>
          <div className="flex items-center">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 mr-1.5"></div>
            <span>Completion Rate</span>
          </div>
        </motion.div>
      </motion.div>
      
      {/* Footer with stats */}
      <motion.div 
        className="bg-gray-50 border-t border-gray-100 p-4 grid grid-cols-3 gap-2"
        variants={itemVariants}
      >
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Average Rating</p>
          <p className="text-lg font-bold text-indigo-700">
            {averages.overall.toFixed(1)}
          </p>
        </div>
        <div className="text-center border-x border-gray-200">
          <p className="text-xs text-gray-500 mb-1">
            {allZeroRatings ? 'Most Active Trainer' : 'Top Trainer'}
          </p>
          <p className="text-sm font-semibold text-gray-800 truncate px-2">
            {topTrainers[0]?.name.split(' ')[0] || 'None'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Total Trainers</p>
          <p className="text-lg font-bold text-indigo-700">
            {data.totalTrainers || data.trainers?.length || 0}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TrainerPerformance;