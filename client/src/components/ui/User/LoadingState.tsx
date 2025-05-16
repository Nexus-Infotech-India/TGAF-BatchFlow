import React from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const LoadingState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center space-y-4"
      >
        <Loader2 size={40} className="text-blue-500 animate-spin" />
        <p className="text-gray-600 text-lg">Loading your profile data...</p>
      </motion.div>
    </div>
  );
};

export default LoadingState;