import { Plus, ArrowLeft } from "lucide-react";
import useInitNavStackOnce from "../../../hooks/useSafeSetNavStack";
import ViewUnit from "../../ui/standard/unit/viewUnit";
import React, { useState } from "react";
import AddUnit from "../../ui/standard/unit/AddUnit";
import StandardCategory from "../../ui/standard/stanadardCategory/StandardCategory";
import AddStandardCategory from "../../ui/standard/stanadardCategory/AddCategory";
import StandardParameterList from "../../ui/standard/standardParameters/standardParamlist";
import AddStandardParameter from "../../ui/standard/standardParameters/AddStandardParameter";
import { motion, AnimatePresence } from "framer-motion";
import { Folder, FileText, Package, Tag } from "lucide-react";

interface TabConfig {
  title: string;
  content: React.ReactNode;
  addComponent: React.ReactNode;
  icon: React.ReactNode;
  description: string;
  gradient: string;
  shadow: string;
}

// Enhanced Custom Tab component with Audit-style design
const CustomTabs: React.FC<{
  tabs: { 
    title: string; 
    content: React.ReactNode;
    icon?: React.ReactNode;
    description?: string;
    gradient?: string;
    shadow?: string;
  }[];
  activeTab: number;
  onTabChange: (index: number) => void;
}> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="w-full h-full">
      {/* Beautiful Tab Navigation - Audit Style */}
      <div className="px-6 pt-4 pb-2">
        <div className="flex justify-center">
          <div className="relative bg-white/60 backdrop-blur-sm rounded-2xl p-2 shadow-xl border border-white/30">
            <div className="flex space-x-1">
              {tabs.map((tab, index) => (
                <motion.button
                  key={index}
                  onClick={() => onTabChange(index)}
                  className="relative px-6 py-4 rounded-xl transition-all duration-300 group overflow-hidden"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {/* Active tab background */}
                  {activeTab === index && (
                    <motion.div
                      layoutId="activeTabBackground"
                      className={`absolute inset-0 bg-gradient-to-r ${tab.gradient} rounded-xl ${tab.shadow} shadow-xl`}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  
                  {/* Hover effect */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-r ${tab.gradient} rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                  />
                  
                  {/* Tab content */}
                  <div className="relative flex items-center space-x-3">
                    <motion.div
                      className={`transition-all duration-300 ${
                        activeTab === index 
                          ? 'text-white drop-shadow-sm' 
                          : 'text-gray-600 group-hover:text-gray-800'
                      }`}
                      animate={{ 
                        rotate: activeTab === index ? [0, 10, 0] : 0,
                        scale: activeTab === index ? 1.1 : 1
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      {tab.icon}
                    </motion.div>
                    <div className="flex flex-col items-start">
                      <span
                        className={`font-semibold text-sm transition-all duration-300 ${
                          activeTab === index 
                            ? 'text-white drop-shadow-sm' 
                            : 'text-gray-700 group-hover:text-gray-900'
                        }`}
                      >
                        {tab.title}
                      </span>
                      {tab.description && (
                        <span
                          className={`text-xs font-normal transition-all duration-300 ${
                            activeTab === index 
                              ? 'text-white/80' 
                              : 'text-gray-500 group-hover:text-gray-600'
                          }`}
                        >
                          {tab.description}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Active indicator dots */}
                  {activeTab === index && (
                    <motion.div
                      className="absolute -bottom-1 left-1/2 transform -translate-x-1/2"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="w-2 h-2 bg-white rounded-full shadow-lg"></div>
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced Tab Content with better transitions */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 30
              }
            }}
            exit={{ 
              opacity: 0, 
              y: -20, 
              scale: 0.95,
              transition: { duration: 0.2 }
            }}
            className="h-full"
          >
            {tabs[activeTab].content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default function Standard() {
  useInitNavStackOnce([{ title: "Standard", path: "/" }])

  const [activeTab, setActiveTab] = useState(0);
  const [showAddComponent, setShowAddComponent] = useState(false);
  const [, setSelectedCategoryId] = useState<{ id: string; name: string } | null>(null);

  const handleCategorySelect = (categoryId: string, categoryName: string) => {
    setSelectedCategoryId({ id: categoryId, name: categoryName });
    setActiveTab(1);
  };

  const handleAddClick = () => {
    setShowAddComponent(true);
  };

  const handleBackToList = () => {
    setShowAddComponent(false);
  };

  // Enhanced tab icons with better styling
  const tabIcons = {
    category: <Folder className="h-5 w-5" />,
    parameters: <Tag className="h-5 w-5" />,
    unit: <Package className="h-5 w-5" />,
    methodologies: <FileText className="h-5 w-5" />
  };

  const tabs: TabConfig[] = [
    {
      title: "Categories",
      description: "Manage standard categories",
      content: <StandardCategory onCategorySelect={handleCategorySelect} onAddCategoryClick={handleAddClick} />,
      addComponent: <AddStandardCategory onSuccess={handleBackToList} onCancel={handleBackToList} />,
      icon: tabIcons.category,
      gradient: "from-blue-600 to-indigo-600",
      shadow: "shadow-blue-500/25"
    },
    {
      title: "Parameters",
      description: "Configure parameters",
      content: <StandardParameterList onAddParameterClick={handleAddClick} />,
      addComponent: <AddStandardParameter onSuccess={handleBackToList} onCancel={handleBackToList} />,
      icon: tabIcons.parameters,
      gradient: "from-purple-600 to-pink-600",
      shadow: "shadow-purple-500/25"
    },
    {
      title: "Units",
      description: "Measurement units",
      content: <ViewUnit />,
      addComponent: <AddUnit onSuccess={handleBackToList} onCancel={handleBackToList} />, 
      icon: tabIcons.unit,
      gradient: "from-emerald-600 to-teal-600",
      shadow: "shadow-emerald-500/25"
    },
  ];

  // Enhanced floating button colors based on active tab
  const getFloatingButtonColors = () => {
    const colorSchemes = [
      // Categories - Blue/Indigo
      {
        gradient: "from-blue-600 to-indigo-600",
        hoverGradient: "from-indigo-600 to-purple-600",
        shadow: "0 20px 25px -5px rgba(59, 130, 246, 0.3), 0 10px 10px -5px rgba(59, 130, 246, 0.15)"
      },
      // Parameters - Purple/Pink
      {
        gradient: "from-purple-600 to-pink-600",
        hoverGradient: "from-pink-600 to-rose-600",
        shadow: "0 20px 25px -5px rgba(147, 51, 234, 0.3), 0 10px 10px -5px rgba(147, 51, 234, 0.15)"
      },
      // Units - Green/Emerald
      {
        gradient: "from-emerald-600 to-teal-600",
        hoverGradient: "from-teal-600 to-cyan-600",
        shadow: "0 20px 25px -5px rgba(16, 185, 129, 0.3), 0 10px 10px -5px rgba(16, 185, 129, 0.15)"
      }
    ];

    return colorSchemes[activeTab] || colorSchemes[0];
  };

  // Enhanced tab content with better animations and styling
  const tabContent = showAddComponent ? (
    <motion.div 
      className="h-full bg-white"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-white to-blue-50/30 border-b border-blue-100/50 p-6">
        <div className="flex justify-between items-center">
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className={`p-2 rounded-xl ${
              tabs[activeTab].title === "Categories" ? "bg-blue-100" :
              tabs[activeTab].title === "Parameters" ? "bg-purple-100" :
              "bg-emerald-100"
            }`}>
              {tabs[activeTab].title === "Categories" && <Folder className="h-6 w-6 text-blue-600" />}
              {tabs[activeTab].title === "Parameters" && <Tag className="h-6 w-6 text-purple-600" />}
              {tabs[activeTab].title === "Units" && <Package className="h-6 w-6 text-emerald-600" />}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Add {tabs[activeTab].title.slice(0, -1)}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Create a new {tabs[activeTab].title.toLowerCase().slice(0, -1)} entry
              </p>
            </div>
          </motion.div>
          
          <motion.button
            onClick={handleBackToList}
            className="group py-3 px-5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl flex items-center gap-3 shadow-sm hover:shadow-md transition-all"
            whileHover={{ scale: 1.02, backgroundColor: "#f8fafc" }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to List
          </motion.button>
        </div>
      </div>
      
      {/* Form Content */}
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {tabs[activeTab].addComponent}
        </motion.div>
      </div>
    </motion.div>
  ) : (
    <div className="relative h-full">
      {/* Content with enhanced styling */}
      <div className="h-full bg-white">
        {tabs[activeTab].content}
      </div>
      
      {/* Enhanced Floating Add Button with dynamic colors */}
      <motion.div
        className="fixed bottom-8 right-8 z-50"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 260, 
          damping: 20,
          delay: 0.2 
        }}
      >
        <motion.button
          onClick={handleAddClick}
          className={`group relative h-14 w-14 bg-gradient-to-r ${getFloatingButtonColors().gradient} rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl text-white overflow-hidden`}
          whileHover={{ 
            scale: 1.05, 
            rotate: 5,
            boxShadow: getFloatingButtonColors().shadow
          }}
          whileTap={{ scale: 0.95, rotate: -5 }}
        >
          {/* Background gradient animation */}
          <motion.div
            className={`absolute inset-0 bg-gradient-to-r ${getFloatingButtonColors().hoverGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
            initial={false}
          />
          
          {/* Plus icon with rotation animation */}
          <motion.div
            animate={{ rotate: showAddComponent ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <Plus size={24} className="relative z-10" />
          </motion.div>
          
          {/* Ripple effect */}
          <motion.div
            className="absolute inset-0 bg-white/20 rounded-2xl scale-0 group-active:scale-100 transition-transform duration-150"
          />
        </motion.button>
        
        {/* Enhanced Dynamic Tooltip */}
        <motion.div
          className="absolute bottom-full right-0 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-0 translate-y-2"
          initial={{ y: 10, opacity: 0 }}
        >
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-gray-700 whitespace-nowrap backdrop-blur-sm">
            <div className="flex items-center gap-2">
              {/* Dynamic icon based on active tab */}
              <div className="p-1 bg-white/10 rounded-lg">
                {tabs[activeTab].title === "Categories" && <Folder className="h-3.5 w-3.5" />}
                {tabs[activeTab].title === "Parameters" && <Tag className="h-3.5 w-3.5" />}
                {tabs[activeTab].title === "Units" && <Package className="h-3.5 w-3.5" />}
              </div>
              <div className="text-sm font-medium">
                Add {tabs[activeTab].title === "Categories" ? "Category" : 
                     tabs[activeTab].title === "Parameters" ? "Parameter" : 
                     tabs[activeTab].title === "Units" ? "Unit" : "Item"}
              </div>
            </div>
            
            {/* Tooltip arrow */}
            <div className="absolute top-full right-4 w-0 h-0 border-l-3 border-r-3 border-t-6 border-transparent border-t-gray-800" />
            
            {/* Subtle glow effect */}
            <div className={`absolute inset-0 bg-gradient-to-r ${getFloatingButtonColors().gradient} opacity-20 rounded-xl blur-sm -z-10`} />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );

  // Map tabs data to format expected by CustomTabs
  const tabsData = tabs.map((tab) => ({
    title: tab.title,
    description: tab.description,
    content: tabContent,
    icon: tab.icon,
    gradient: tab.gradient,
    shadow: tab.shadow
  }));

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-blue-50">
      <CustomTabs
        tabs={tabsData}
        activeTab={activeTab}
        onTabChange={(index) => {
          setActiveTab(index);
          setShowAddComponent(false);
        }}
      />
    </div>
  );
}