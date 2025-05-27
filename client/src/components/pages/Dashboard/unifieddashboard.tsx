import React, { useState, useEffect } from 'react';
import { GaugeCircle, Repeat, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
// import TrainingDashboard from './training-dashboard';

const UnifiedDashboard: React.FC = () => {
  const [showTraining, setShowTraining] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Authentication required');
    }
  }, []);

  const toggleDashboard = () => {
    setShowTraining(prev => !prev);
  };

  if (error) {
    return <div className="p-6 bg-red-50 text-red-600 rounded-md">{error}</div>;
  }

  return (
    <div className="container mx-auto">
      {/* Enhanced blue theme header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-b-lg shadow-lg mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center"
          >
            <BarChart3 className="h-7 w-7 mr-3" />
            <div>
              <h1 className="text-2xl font-bold">
                {showTraining ? "Training Dashboard" : "Operations Dashboard"}
              </h1>
              <p className="text-blue-100 text-sm mt-1">
                {showTraining 
                  ? "Overview of training activities and performance metrics"
                  : "Overview of system metrics and performance indicators"}
              </p>
            </div>
          </motion.div>
          
          <div className="mt-4 md:mt-0 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full flex items-center space-x-3">
            <span className={`text-sm transition-colors duration-200 ${!showTraining ? "text-white font-medium" : "text-blue-200"}`}>
              <GaugeCircle className={`h-4 w-4 inline mr-1 ${!showTraining ? "text-white" : "text-blue-200"}`} />
              Operations
            </span>
            
            <button 
              onClick={toggleDashboard} 
              className="relative h-6 w-11 rounded-full bg-blue-900/30 flex items-center p-0.5 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-1 focus:ring-offset-blue-800 cursor-pointer"
              aria-label="Toggle dashboard view"
            >
              <motion.div 
                className="h-5 w-5 rounded-full bg-white shadow-md"
                initial={false}
                animate={{ 
                  x: showTraining ? 20 : 0
                }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
              <div 
                className={`absolute inset-0 rounded-full transition-colors ${showTraining ? 'bg-blue-400' : 'bg-blue-900/30'}`} 
                style={{ zIndex: -1 }}
              />
            </button>
            
            <span className={`text-sm transition-colors duration-200 ${showTraining ? "text-white font-medium" : "text-blue-200"}`}>
              Training
              <Repeat className={`h-4 w-4 inline ml-1 ${showTraining ? "text-white" : "text-blue-200"}`} />
            </span>
          </div>
        </div>
      </div>

      {/* Animate dashboard transitions */}
      <div className="px-6">
        <motion.div 
          className="dashboard-content"
          key={showTraining ? "training" : "operations"}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {/* {showTraining ? <TrainingDashboard /> : <Dashboard />} */}
        </motion.div>
      </div>
    </div>
  );
};

export default UnifiedDashboard;