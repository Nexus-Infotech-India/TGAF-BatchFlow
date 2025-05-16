// components/common/TopBar.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { NavStack } from '../../store/global'; // Adjust import path as needed

interface TopBarProps {
  title?: string;
  navStack: NavStack[];
  onNavigate: (index: number) => void;
  actionButton?: {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
  };
}

const TopBar: React.FC<TopBarProps> = ({ 
 
  navStack, 
  onNavigate, 
  actionButton 
}) => {
  return (
    <div className="w-full bg-white shadow-sm border-b border-gray-100 rounded-t-lg">
      <div className="px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center text-sm">
            {navStack.map((item, index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <span className="mx-2 text-gray-300">/</span>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onNavigate(index)}
                  className={`${
                    index === navStack.length - 1
                      ? 'font-semibold text-gray-800'
                      : 'text-gray-500 hover:text-gray-700'
                  } transition-all`}
                >
                  {item.title}
                </motion.button>
              </React.Fragment>
            ))}
          </div>

          {/* Action Button */}
          {actionButton && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={actionButton.onClick}
              className="py-2 px-4 bg-[#00fac8] text-white text-sm font-medium rounded-full flex gap-2 items-center justify-between"
            >
              {actionButton.icon}
              {actionButton.label}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopBar;