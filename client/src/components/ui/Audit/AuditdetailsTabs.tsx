import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface SectionCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
  iconColor?: string;
  actions?: React.ReactNode;
}

const AuditDetailCard: React.FC<SectionCardProps> = ({ 
  title, 
  icon, 
  children, 
  delay = 0, 
  iconColor = "text-indigo-600", 
  actions 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.3 }}
      className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-gray-50 to-gray-100">
        <div 
          className="flex items-center cursor-pointer flex-1"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className={`p-2.5 rounded-full mr-3 ${iconColor.replace('text-', 'bg-').replace('600', '100')}`}>
            {icon}
          </div>
          <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        </div>
        
        <div className="flex items-center gap-2">
          {actions}
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
          >
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AuditDetailCard;