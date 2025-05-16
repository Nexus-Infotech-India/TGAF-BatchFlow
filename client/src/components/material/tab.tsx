import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Tab {
  title: string;
  content: React.ReactNode;
  icon?: React.ReactNode; // Optional icon to display with tab
}

interface TabsProps {
  tabs: Tab[];
  activeTab: number;
  onTabChange?: (index: number) => void;
  children?: React.ReactNode;
  variant?: "default" | "pills" | "underlined" | "boxed";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

const Tabs: React.FC<TabsProps> = ({ 
  tabs, 
  activeTab, 
  onTabChange, 
  children, 
  variant = "default",
  size = "md",
  fullWidth = false,
}) => {
  const handleTabChange = (index: number) => {
    if (onTabChange) {
      onTabChange(index);
    }
  };

  // Size classes
  const sizeClasses = {
    sm: "py-2 px-3 text-xs",
    md: "py-3.5 px-5 text-sm",
    lg: "py-4 px-6 text-base",
  };

  // Get the appropriate classes based on the variant
  const getTabClasses = (isActive: boolean) => {
    const baseClasses = `font-medium transition-all flex items-center gap-2 ${sizeClasses[size]} ${fullWidth ? 'flex-1 justify-center' : ''}`;
    
    switch (variant) {
      case "pills":
        return `${baseClasses} rounded-full ${
          isActive 
            ? "bg-blue-600 text-white shadow-sm" 
            : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
        }`;
      case "boxed":
        return `${baseClasses} rounded-t-lg border-t border-l border-r ${
          isActive 
            ? "bg-white border-blue-200 text-blue-600" 
            : "border-transparent text-gray-500 hover:text-gray-700"
        }`;
      case "underlined":
        return `${baseClasses} ${
          isActive 
            ? "text-blue-600" 
            : "text-gray-500 hover:text-gray-700"
        }`;
      default: // default underline style
        return `${baseClasses} ${
          isActive 
            ? "text-blue-600" 
            : "text-gray-500 hover:text-gray-700"
        }`;
    }
  };

  // Get container classes based on variant
  const getContainerClasses = () => {
    switch (variant) {
      case "pills":
        return "p-1 bg-blue-50 rounded-full flex";
      case "boxed":
        return "flex bg-blue-50 rounded-t-lg";
      case "underlined":
        return "flex bg-white border-b border-blue-100";
      default:
        return "flex bg-white border-b border-blue-100";
    }
  };

  return (
    <div className="w-full overflow-hidden">
      <div className={fullWidth ? "w-full" : "inline-block"}>
        <nav className={getContainerClasses()}>
          {tabs.map((tab, index) => (
            <div key={index} className={`relative ${fullWidth ? "flex-1" : ""}`}>
              <motion.button
                onClick={() => handleTabChange(index)}
                className={getTabClasses(activeTab === index)}
                whileHover={{ 
                  scale: variant === "default" || variant === "underlined" ? 1 : 1.03,
                }}
                whileTap={{ 
                  scale: variant === "default" || variant === "underlined" ? 0.98 : 0.95,
                }}
              >
                {tab.icon && <span className="tab-icon">{tab.icon}</span>}
                {tab.title}
                
                {/* Indicator line for default and underlined variants */}
                {(variant === "default" || variant === "underlined") && activeTab === index && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className={`absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 ${variant === "underlined" ? "h-[3px]" : ""}`}
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            </div>
          ))}
        </nav>
      </div>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className={`py-4 ${variant === "boxed" ? "border-l border-r border-b rounded-b-lg border-blue-100 bg-white p-5" : ""}`}
        >
          {tabs[activeTab]?.content || children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};


export default Tabs;