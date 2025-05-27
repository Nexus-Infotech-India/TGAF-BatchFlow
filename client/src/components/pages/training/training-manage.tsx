import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, GraduationCap } from 'lucide-react';
import TrainingList from '../../ui/training/TrainingList';
import CreateTraining from '../../ui/training/Createtraining';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

type ActiveTab = 'list' | 'create';

const TrainingManage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isCreatePath = location.pathname.includes('/trainings/create');
  const [activeTab, setActiveTab] = useState<ActiveTab>(isCreatePath ? 'create' : 'list');

  useEffect(() => {
    const newTab = location.pathname.includes('/trainings/create') ? 'create' : 'list';
    setActiveTab(newTab);
  }, [location.pathname]);

  const handleTabChange = (tab: ActiveTab) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
      
      if (tab === 'create') {
        queryClient.invalidateQueries({ queryKey: ['users'] });
        navigate('/trainings/create');
      } else {
        queryClient.invalidateQueries({ queryKey: ['trainings'] });
        navigate('/trainings');
      }
    }
  };

  const containerVariants = {
    initial: { 
      opacity: 0,
      y: 20
    },
    animate: { 
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.1
      }
    }
  };

  const tabContainerVariants = {
    initial: { 
      opacity: 0,
      y: -10
    },
    animate: { 
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  const contentVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.98,
      filter: "blur(4px)"
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: { 
        duration: 0.5,
        ease: [0.23, 1, 0.32, 1],
        delay: 0.1
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      scale: 0.98,
      filter: "blur(4px)",
      transition: { 
        duration: 0.3,
        ease: "easeIn" 
      }
    }
  };

  const tabs = [
    {
      id: 'list',
      label: 'Training List',
      icon: <BookOpen size={16} />,
      gradient: 'from-blue-600 to-indigo-600',
      hoverGradient: 'from-blue-700 to-indigo-700',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      id: 'create',
      label: 'Create Training',
      icon: <GraduationCap size={16} />,
      gradient: 'from-emerald-600 to-teal-600',
      hoverGradient: 'from-emerald-700 to-teal-700',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600'
    }
  ];

  return (
    <motion.div 
      className=" min-h-screen"
      initial="initial"
      animate="animate"
      variants={containerVariants}
    >
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Enhanced Tab Navigation */}
        <motion.div 
          className="flex justify-center mb-8"
          variants={tabContainerVariants}
        >
          <div className="relative bg-white/80 backdrop-blur-xl rounded-xl p-1.5 shadow-lg border border-white/30">
            {/* Background indicator */}
            <motion.div
              className="absolute inset-1.5 rounded-lg"
              animate={{
                x: activeTab === 'list' ? 0 : '100%',
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                duration: 0.4
              }}
              style={{ width: 'calc(50% - 3px)' }}
            >
              <div className={`w-full h-full rounded-lg bg-gradient-to-r ${
                activeTab === 'list' 
                  ? tabs[0].gradient 
                  : tabs[1].gradient
              } shadow-md`} />
            </motion.div>
            
            {/* Tab buttons */}
            <div className="relative flex">
              {tabs.map((tab, index) => (
                <motion.button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as ActiveTab)}
                  className="relative px-5 py-2.5 rounded-lg transition-all duration-300 flex items-center space-x-2 min-w-[140px] justify-center"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                >
                  {/* Icon container */}
                  <motion.div
                    className={`p-1.5 rounded-md transition-all duration-300 ${
                      activeTab === tab.id 
                        ? 'bg-white/20 backdrop-blur-sm' 
                        : tab.iconBg
                    }`}
                    animate={{ 
                      rotate: activeTab === tab.id ? [0, 10, 0] : 0,
                      scale: activeTab === tab.id ? 1.05 : 1
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.div
                      className={`transition-all duration-300 ${
                        activeTab === tab.id 
                          ? 'text-white drop-shadow-sm' 
                          : tab.iconColor
                      }`}
                    >
                      {tab.icon}
                    </motion.div>
                  </motion.div>
                  
                  {/* Label */}
                  <span
                    className={`font-medium text-sm transition-all duration-300 ${
                      activeTab === tab.id 
                        ? 'text-white drop-shadow-sm' 
                        : 'text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </span>

                  {/* Active indicator dots */}
                  {activeTab === tab.id && (
                    <motion.div
                      className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
                    >
                      <div className="w-1.5 h-1.5 bg-white rounded-full shadow-md" />
                    </motion.div>
                  )}

                  {/* Hover glow effect */}
                  <motion.div
                    className={`absolute inset-0 rounded-lg bg-gradient-to-r ${tab.gradient} opacity-0`}
                    whileHover={{ opacity: activeTab !== tab.id ? 0.1 : 0 }}
                    transition={{ duration: 0.2 }}
                  />
                </motion.button>
              ))}
            </div>

            {/* Floating particles effect */}
            <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-0.5 h-0.5 bg-white/30 rounded-full"
                  animate={{
                    x: [0, 30, 0],
                    y: [0, -20, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 1,
                    ease: "easeInOut"
                  }}
                  style={{
                    left: `${20 + i * 30}%`,
                    top: `${50 + (i % 2) * 20}%`,
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Enhanced Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTab}-${location.key}`}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={contentVariants}
            className="relative"
          >
            {/* Content background with subtle animation */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-white/60 to-blue-50/60 rounded-2xl shadow-xl backdrop-blur-sm border border-white/30"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            />
            
            {/* Actual content */}
            <div className="relative z-10">
              {activeTab === 'list' ? (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <TrainingList />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <CreateTraining />
                </motion.div>
              )}
            </div>

            {/* Decorative elements */}
            <motion.div
              className="absolute top-4 right-4 w-32 h-32 bg-gradient-to-br from-blue-200/20 to-indigo-200/20 rounded-full blur-xl"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            <motion.div
              className="absolute bottom-4 left-4 w-24 h-24 bg-gradient-to-br from-emerald-200/20 to-teal-200/20 rounded-full blur-xl"
              animate={{
                scale: [1.2, 1, 1.2],
                rotate: [360, 180, 0],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default TrainingManage;