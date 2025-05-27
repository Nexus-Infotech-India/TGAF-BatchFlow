import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  ChevronDown,
  Shield,
  Settings,
  LogOut,
  History,
  FileText,
  Clock,
  ExternalLink,
  Library,
  Search,
  Zap,
  Activity,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api, { API_ROUTES } from '../../utils/api';

interface HeaderBarProps {
  pageTitle: string;
  activeNavStack?: Array<{ title: string; path: string }>;
}

type ActivityLogType = {
  id: string;
  User: { name: string; email: string } | null;
  action: string;
  details: string;
  createdAt: string;
};

const HeaderBar: React.FC<HeaderBarProps> = ({
  pageTitle,
  activeNavStack = [],
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showActivityLogs, setShowActivityLogs] = useState(false);
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      const response = await api.get(API_ROUTES.AUTH.CURRENT_USER, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.user;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: activityLogs = [], isLoading: isLoadingLogs } = useQuery({
    queryKey: ['recentActivityLogs'],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      const response = await api.get(API_ROUTES.BATCH.GET_ACTIVITY_LOGS, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 6 },
      });
      return response.data.activityLogs || [];
    },
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const handleClickOutside = () => {
      setShowUserMenu(false);
      setShowActivityLogs(false);
      setShowSearchPanel(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Toggle functions
  const toggleUserMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowUserMenu((prev) => !prev);
    setShowActivityLogs(false);
    setShowSearchPanel(false);
  };

  const toggleActivityLogs = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowActivityLogs((prev) => !prev);
    setShowUserMenu(false);
    setShowSearchPanel(false);
  };

  const toggleSearchPanel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSearchPanel((prev) => !prev);
    setShowUserMenu(false);
    setShowActivityLogs(false);
  };

  const navigateToMediaLibrary = () => {
    navigate('/document-library');
  };

  // Enhanced quick search suggestions
  const quickSearchSuggestions = [
    { icon: '📊', title: 'Audit Dashboard', path: '/audits', category: 'Audits' },
    { icon: '📚', title: 'Training Modules', path: '/trainings', category: 'Training' },
    { icon: '📋', title: 'Batch Records', path: '/batches', category: 'Production' },
    { icon: '👥', title: 'Team Management', path: '/access-control', category: 'Admin' },
    { icon: '📁', title: 'Document Library', path: '/document-library', category: 'Resources' },
    { icon: '⚙️', title: 'System Settings', path: '/settings', category: 'Settings' },
  ];

  const filteredSuggestions = quickSearchSuggestions.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Enhanced breadcrumb rendering
  const renderBreadcrumbs = () => {
    if (!activeNavStack || activeNavStack.length <= 1) return null;
    
    return (
      <motion.div 
        className="hidden md:flex items-center text-sm space-x-2 py-1 px-2.5 bg-white/40 backdrop-blur-md rounded-lg border border-white/30 shadow-md"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {activeNavStack.map((item, index) => (
          <React.Fragment key={item.path}>
            {index > 0 && (
              <motion.div
                className="text-blue-400/70 flex items-center"
                initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.3 }}
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.div>
            )}
            
            <motion.button
              className={`relative px-2.5 py-1 rounded-md transition-all duration-300 group ${
                index === activeNavStack.length - 1 
                  ? "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-700 font-semibold shadow-sm border border-blue-200/50" 
                  : "hover:bg-white/60 text-gray-700 hover:text-blue-600 hover:shadow-sm"
              }`}
              onClick={() => navigate(item.path)}
              whileHover={{ 
                scale: 1.05, 
                y: -1,
                boxShadow: "0 6px 20px rgba(59, 130, 246, 0.25)"
              }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: -10, x: -20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.4 }}
            >
              {index === 0 && (
                <span className="inline-block mr-1.5 text-blue-500">
                  🏠
                </span>
              )}
              
              <span className="relative z-10">{item.title}</span>
              
              {index === activeNavStack.length - 1 && (
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-md -z-10"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                />
              )}
              
              <motion.div 
                className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-md opacity-0 group-hover:opacity-20 transition-opacity duration-300 -z-20"
                initial={false}
              />
            </motion.button>
          </React.Fragment>
        ))}
      </motion.div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  // Enhanced title animations
  const titleVariants = {
    hidden: { opacity: 0, y: -30, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
        type: 'spring',
        stiffness: 200,
      },
    },
    exit: {
      opacity: 0,
      y: 30,
      scale: 0.9,
      transition: {
        duration: 0.4,
      },
    },
  };

  const getActivityIcon = (action: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'BATCH_CREATED': <Zap size={12} className="text-green-600" />,
      'AUDIT_COMPLETED': <Shield size={12} className="text-blue-600" />,
      'TRAINING_ENROLLED': <FileText size={12} className="text-purple-600" />,
      'DOCUMENT_UPLOADED': <Library size={12} className="text-orange-600" />,
      'USER_LOGIN': <User size={12} className="text-indigo-600" />,
      'default': <Activity size={12} className="text-gray-600" />,
    };
    
    return iconMap[action] || iconMap['default'];
  };

  return (
    <motion.header 
      className="sticky top-0 z-50 backdrop-blur-2xl overflow-visible"
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Enhanced glassmorphism effect with premium gradient */}
      <div className="relative bg-gradient-to-r from-white/70 via-blue-50/80 to-indigo-50/70 border-b border-white/30 backdrop-blur-2xl">
        {/* Premium reflective highlights */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/20 to-transparent pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-300/60 to-transparent"></div>
          <div className="absolute top-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"></div>
        </div>

        {/* Content container */}
        <div className="px-4 md:px-8 py-2 relative z-10">
          {/* Main header row */}
          <div className="flex items-center justify-between">
            {/* Enhanced page title section */}
            <div className="flex items-center gap-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={pageTitle}
                  variants={titleVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="relative"
                >
                  {/* Title with enhanced gradient */}
                  <h1 className="text-lg md:text-xl lg:text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-800 via-blue-700 to-indigo-800 relative">
                    {pageTitle}
                  </h1>
                  
                  {/* Enhanced underline with gradient */}
                  <motion.div 
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent rounded-full"
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                  />
                  
                  {/* Glow effect */}
                  <motion.div 
                    className="absolute -inset-4 bg-gradient-to-r from-blue-400/20 via-transparent to-indigo-400/20 rounded-xl blur-xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 1 }}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
            
            {/* Enhanced action buttons */}
            <div className="flex items-center gap-1.5">
              {/* Enhanced Search Button */}
              <div className="relative">
                <motion.button 
                  className="p-2 rounded-lg text-gray-600 hover:text-blue-600 bg-white/50 hover:bg-white/80 backdrop-blur-md border border-white/40 shadow-md hover:shadow-lg transition-all duration-300 group"
                  onClick={toggleSearchPanel}
                  whileHover={{ 
                    scale: 1.05, 
                    boxShadow: "0 6px 20px rgba(59, 130, 246, 0.3)" 
                  }}
                  whileTap={{ scale: 0.95 }}
                  title="Quick Search"
                >
                  <Search size={16} className="group-hover:text-blue-600 transition-colors" />
                </motion.button>

                {/* Compact Search Panel */}
                <AnimatePresence>
                  {showSearchPanel && (
                    <motion.div
                      className="absolute right-0 mt-2 w-80 rounded-xl shadow-xl border border-white/30 overflow-hidden z-40"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        backdropFilter: 'blur(20px)',
                        background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(240,249,255,0.9))',
                      }}
                    >
                      {/* Search Header */}
                      <div className="p-3 border-b border-blue-100/50 bg-gradient-to-r from-blue-50/80 to-indigo-50/80">
                        <div className="relative">
                          <Search size={16} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search anything..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 bg-white/70 border border-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 transition-all text-sm"
                            autoFocus
                          />
                        </div>
                      </div>

                      {/* Quick Suggestions */}
                      <div className="max-h-64 overflow-y-auto">
                        <div className="p-1">
                          <p className="text-xs font-semibold text-gray-500 mb-1 px-2">Quick Access</p>
                          {filteredSuggestions.map((item, index) => (
                            <motion.button
                              key={item.path}
                              className="w-full flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-blue-50/70 transition-all group text-left"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.03 }}
                              whileHover={{ x: 3, scale: 1.01 }}
                              onClick={() => {
                                navigate(item.path);
                                setShowSearchPanel(false);
                                setSearchQuery('');
                              }}
                            >
                              <span className="text-sm">{item.icon}</span>
                              <div className="flex-1">
                                <p className="font-medium text-gray-800 group-hover:text-blue-700 transition-colors text-sm">
                                  {item.title}
                                </p>
                                <p className="text-xs text-gray-500">{item.category}</p>
                              </div>
                              <ExternalLink size={12} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Enhanced Media Library */}
              <motion.button 
                className="p-2 rounded-lg text-gray-600 hover:text-purple-600 bg-white/50 hover:bg-white/80 backdrop-blur-md border border-white/40 shadow-md hover:shadow-lg transition-all duration-300 group"
                onClick={navigateToMediaLibrary}
                whileHover={{ 
                  scale: 1.05, 
                  boxShadow: "0 6px 20px rgba(147, 51, 234, 0.3)" 
                }}
                whileTap={{ scale: 0.95 }}
                title="Media Library"
              >
                <Library size={16} className="group-hover:text-purple-600 transition-colors" />
              </motion.button>

              {/* Enhanced Activity Logs */}
              <div className="relative">
                <motion.button 
                  className="p-2 rounded-lg text-gray-600 hover:text-green-600 bg-white/50 hover:bg-white/80 backdrop-blur-md border border-white/40 shadow-md hover:shadow-lg transition-all duration-300 group relative"
                  onClick={toggleActivityLogs}
                  whileHover={{ 
                    scale: 1.05, 
                    boxShadow: "0 6px 20px rgba(34, 197, 94, 0.3)" 
                  }}
                  whileTap={{ scale: 0.95 }}
                  title="Recent Activity"
                >
                  <History size={16} className="group-hover:text-green-600 transition-colors" />
                  
                  {/* Activity indicator */}
                  <motion.div
                    className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.7, 1, 0.7] 
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.button>

                {/* Compact Activity logs dropdown */}
                <AnimatePresence>
                  {showActivityLogs && (
                    <motion.div
                      className="absolute right-0 mt-2 w-80 rounded-xl shadow-xl border border-white/30 overflow-hidden z-40"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        backdropFilter: 'blur(20px)',
                        background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(240,249,255,0.9))',
                      }}
                    >
                      {/* Compact Header */}
                      <div className="p-3 border-b border-green-100/50 bg-gradient-to-r from-green-50/80 to-emerald-50/80">
                        <motion.h3
                          className="font-semibold text-md bg-clip-text text-transparent bg-gradient-to-r from-green-700 to-emerald-600 flex items-center"
                        >
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="mr-2 p-1.5 bg-green-100 rounded-lg"
                          >
                            <Activity size={14} className="text-green-600" />
                          </motion.div>
                          Recent Activity
                        </motion.h3>
                        <p className="text-xs text-gray-600 mt-0.5">Latest system activities</p>
                      </div>

                      {/* Compact Activity List */}
                      <div className="max-h-64 overflow-y-auto">
                        {isLoadingLogs ? (
                          <div className="p-6 text-center">
                            <motion.div 
                              className="animate-spin h-6 w-6 border-2 border-green-500 border-t-transparent rounded-full mx-auto"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                            <p className="text-xs text-gray-500 mt-2">Loading activities...</p>
                          </div>
                        ) : activityLogs.length === 0 ? (
                          <div className="p-8 text-center text-gray-500">
                            <History size={24} className="text-gray-300 mx-auto mb-2" />
                            <p className="text-sm font-medium">No recent activities</p>
                            <p className="text-xs mt-1">Activities will appear here when available</p>
                          </div>
                        ) : (
                          <div className="p-1">
                            {activityLogs.map((log: ActivityLogType, index: number) => (
                              <motion.div
                                key={log.id}
                                className="p-2.5 mb-1 rounded-lg border border-green-100/50 hover:bg-green-50/70 backdrop-blur-sm transition-all cursor-pointer group"
                                initial={{ opacity: 0, y: 10, x: -5 }}
                                animate={{ opacity: 1, y: 0, x: 0 }}
                                transition={{
                                  delay: 0.03 * index,
                                  duration: 0.3,
                                }}
                                whileHover={{ 
                                  scale: 1.01, 
                                  x: 2,
                                  boxShadow: "0 4px 15px rgba(34, 197, 94, 0.15)" 
                                }}
                              >
                                <div className="flex items-start gap-2.5">
                                  <motion.div 
                                    className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg p-1.5 shrink-0 group-hover:shadow-sm transition-shadow"
                                    whileHover={{ scale: 1.05 }}
                                  >
                                    {getActivityIcon(log.action)}
                                  </motion.div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                      <p className="text-xs font-semibold text-green-700 group-hover:text-green-800 transition-colors">
                                        {log.action.replace(/_/g, ' ')}
                                      </p>
                                      <div className="flex items-center text-xs text-gray-500 bg-gray-100/50 px-1.5 py-0.5 rounded-full">
                                        <Clock size={8} className="mr-0.5" />
                                        {formatDate(log.createdAt)}
                                      </div>
                                    </div>
                                    
                                    <p className="text-xs text-gray-700 line-clamp-2 mb-1 group-hover:text-gray-800 transition-colors">
                                      {log.details}
                                    </p>
                                    
                                    <div className="flex items-center text-xs text-gray-500">
                                      <div className="flex items-center bg-blue-50 px-1.5 py-0.5 rounded-full">
                                        <User size={8} className="mr-0.5 text-blue-500" />
                                        {log.User?.name || 'System'}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Compact Footer */}
                      <div className="p-2 border-t border-green-100/50 bg-gradient-to-r from-green-50/60 to-emerald-50/60">
                        <motion.button
                          className="w-full py-2 px-3 text-xs font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => navigate('/activity-logs')}
                        >
                          <span>View All Activities</span>
                          <ExternalLink size={12} />
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Compact User profile */}
              <div className="relative ml-1">
                <motion.div 
                  className="flex items-center gap-2 border border-white/50 rounded-xl pl-3 pr-1.5 py-1.5 bg-gradient-to-r from-white/70 to-blue-50/70 hover:from-blue-50/70 hover:to-indigo-50/70 backdrop-blur-md cursor-pointer shadow-md hover:shadow-lg transition-all duration-300 group"
                  onClick={toggleUserMenu}
                  whileHover={{ 
                    scale: 1.02, 
                    boxShadow: "0 8px 25px rgba(59, 130, 246, 0.4)",
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="hidden sm:block">
                    <p className="text-xs font-semibold bg-clip-text text-transparent bg-gradient-to-r from-gray-700 to-blue-800">
                      {isLoading ? "Loading..." : user?.name || "User"}
                    </p>
                    <p className="text-xs text-gray-500 truncate max-w-20">
                      {isLoading ? "..." : user?.email?.split('@')[0] || "guest"}
                    </p>
                  </div>
                  
                  <motion.div
                    animate={{ rotate: showUserMenu ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown size={12} className="text-blue-500 hidden sm:block" />
                  </motion.div>
                  
                  <motion.div 
                    className="relative w-8 h-8 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-md group-hover:shadow-lg transition-shadow overflow-hidden"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <User size={14} />
                    
                    {/* Online indicator */}
                    <motion.div
                      className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 border border-white rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </motion.div>
                </motion.div>

                {/* Compact User dropdown menu */}
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      className="absolute right-0 mt-2 w-60 rounded-xl shadow-xl border border-white/30 overflow-hidden z-40"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        backdropFilter: 'blur(20px)',
                        background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(240,249,255,0.9))',
                      }}
                    >
                      {/* Compact User Info Header */}
                      <div className="p-4 border-b border-blue-50/50 bg-gradient-to-br from-blue-50/80 via-indigo-50/70 to-purple-50/80 relative overflow-hidden">
                        <div className="relative flex items-center gap-3">
                          <motion.div 
                            className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg relative overflow-hidden"
                            whileHover={{ scale: 1.05 }}
                          >
                            <User size={18} />
                          </motion.div>
                          
                          <div className="flex-1">
                            <p className="font-semibold text-md bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600">
                              {isLoading ? 'Loading...' : user?.name || 'Guest User'}
                            </p>
                            <p className="text-xs text-gray-600 font-medium">
                              {isLoading ? 'Loading...' : user?.email || 'guest@example.com'}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Compact Menu Items */}
                      <div className="py-1">
                        {[
                          { icon: User, label: 'Profile', path: '/profile', color: 'blue' },
                          { icon: Settings, label: 'Settings', path: '/settings', color: 'purple' },
                          { icon: Shield, label: 'Access Control', path: '/access-control', color: 'green' },
                          
                        ].map((item, index) => (
                          <motion.button
                            key={item.path}
                            className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-${item.color}-50/70 transition-all group relative overflow-hidden`}
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.05 * (index + 1) }}
                            whileHover={{ x: 3, scale: 1.01 }}
                            onClick={() => navigate(item.path)}
                          >
                            <motion.div
                              className={`flex items-center justify-center w-8 h-8 rounded-lg bg-${item.color}-100/50 text-${item.color}-600 group-hover:bg-${item.color}-200/80 transition-all shadow-sm`}
                              whileHover={{ scale: 1.05 }}
                            >
                              <item.icon size={14} />
                            </motion.div>
                            
                            <span className="font-medium group-hover:text-gray-800 transition-colors">
                              {item.label}
                            </span>
                            
                            <motion.div
                              className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                              whileHover={{ x: 2 }}
                            >
                              <ExternalLink size={12} className="text-gray-400" />
                            </motion.div>
                          </motion.button>
                        ))}
                      </div>

                      {/* Compact Logout Section */}
                      <div className="py-1 border-t border-gray-100/50 bg-gradient-to-r from-red-50/30 to-pink-50/30">
                        <motion.button
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50/70 transition-all group relative overflow-hidden"
                          whileHover={{ x: 3, scale: 1.01 }}
                          onClick={handleLogout}
                        >
                          <motion.div
                            className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-100/50 text-red-600 group-hover:bg-red-200/80 transition-all shadow-sm"
                            whileHover={{ scale: 1.05 }}
                          >
                            <LogOut size={14} />
                          </motion.div>
                          
                          <span className="font-semibold group-hover:text-red-700 transition-colors">
                            Logout
                          </span>
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Enhanced Breadcrumb Section */}
          <div className="flex items-center justify-between mt-2">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="relative"
            >
              {renderBreadcrumbs()}
              
              {/* Enhanced decorative line */}
              {activeNavStack && activeNavStack.length > 1 && (
                <motion.div
                  className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-300/40 to-transparent"
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                />
              )}
            </motion.div>
            
           
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default HeaderBar;