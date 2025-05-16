import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldOff, Home, ArrowLeft } from 'lucide-react';

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <motion.div 
        className="max-w-md w-full bg-white rounded-2xl shadow-lg overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-red-50 p-6 border-b border-red-100">
          <motion.div 
            className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
          >
            <ShieldOff size={32} className="text-red-500" />
          </motion.div>
          
          <motion.h1 
            className="text-2xl font-bold text-center text-gray-800"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Access Denied
          </motion.h1>
        </div>
        
        <div className="p-6">
          <motion.p 
            className="text-gray-600 text-center mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </motion.p>
          
          <div className="flex justify-center space-x-4">
            <motion.button
              onClick={() => navigate(-1)}
              className="px-4 py-2 flex items-center justify-center border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft size={16} className="mr-2" />
              Go Back
            </motion.button>
            
            <motion.button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Home size={16} className="mr-2" />
              Dashboard
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Unauthorized;