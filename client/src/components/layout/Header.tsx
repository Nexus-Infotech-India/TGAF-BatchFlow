import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, User, Search, Menu, X, ChevronDown, Shield, Settings, LogOut } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api , { API_ROUTES } from "../../utils/api";

interface HeaderBarProps {
  pageTitle: string;
  activeNavStack?: Array<{ title: string; path: string }>;
}

const HeaderBar: React.FC<HeaderBarProps> = ({ pageTitle, activeNavStack = [] }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchBar, setShowSearchBar] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Notifications data fetch
  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      // In a real app, you'd fetch real notifications here
      return [
        { id: 1, type: "info", message: "New batch was processed", time: "30m ago", read: false },
        { id: 2, type: "alert", message: "Quality check failed for batch B-2023-089", time: "2h ago", read: false },
        { id: 3, type: "success", message: "All standards updated successfully", time: "5h ago", read: true }
      ];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });

  const { data: user, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const token = localStorage.getItem("authToken"); // Retrieve token from localStorage
      const response = await api.get(API_ROUTES.AUTH.CURRENT_USER, {
        headers: {
          Authorization: `Bearer ${token}`, // Include token in Authorization header
        },
      });
      return response.data.user;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });
  
  const unreadCount = notifications.filter(n => !n.read).length;

  // Hide dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowUserMenu(false);
      setShowNotifications(false);
    };
    
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Toggle user menu without bubbling
  const toggleUserMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowUserMenu(prev => !prev);
    setShowNotifications(false);
  };

  // Toggle notifications without bubbling
  const toggleNotifications = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowNotifications(prev => !prev);
    setShowUserMenu(false);
  };

  // Toggle search bar
  const toggleSearchBar = () => {
    setShowSearchBar(prev => !prev);
    if (showSearchBar) {
      setSearchQuery("");
    }
  };

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement your search navigation logic here
      console.log(`Searching for: ${searchQuery}`);
      // navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Generate breadcrumb navigation
  const renderBreadcrumbs = () => {
    if (!activeNavStack || activeNavStack.length <= 1) return null;
    
    return (
      <div className="hidden md:flex items-center text-sm text-gray-500 space-x-2">
        {activeNavStack.map((item, index) => (
          <React.Fragment key={item.path}>
            {index > 0 && (
              <motion.span 
                className="text-blue-300"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 * index }}
              >
                /
              </motion.span>
            )}
            <motion.span
              className={`hover:text-blue-400 cursor-pointer transition-all duration-300 ${
                index === activeNavStack.length - 1 ? "text-blue-500 font-medium" : ""
              }`}
              onClick={() => navigate(item.path)}
              whileHover={{ scale: 1.05, textShadow: "0 0 8px rgba(59, 130, 246, 0.5)" }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.3 }}
            >
              {item.title}
            </motion.span>
          </React.Fragment>
        ))}
      </div>
    );
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("authToken");
    navigate("/login");
  };

  // Notification type styling
  const getNotificationStyles = (type: string) => {
    switch(type) {
      case 'alert': 
        return "bg-gradient-to-r from-red-50 to-red-100 border-red-200 text-red-700";
      case 'success': 
        return "bg-gradient-to-r from-green-50 to-green-100 border-green-200 text-green-700";
      case 'info':
      default:
        return "bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 text-blue-700";
    }
  };

  // Shimmering animation for title
  const titleVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5,
        ease: "easeOut"
      }
    },
    exit: { 
      opacity: 0, 
      y: 20,
      transition: { 
        duration: 0.3
      }
    }
  };

  return (
 
    <motion.header 
  className="sticky top-0 z-40 backdrop-blur-xl rounded-xl overflow-visible shadow-md"
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, ease: "easeOut" }}
>
      {/* Glassmorphism effect with metallic gradient */}
      <div className="bg-gradient-to-r from-blue-50/80 via-white/70 to-indigo-50/80 border border-blue-100/40 backdrop-blur-md relative">
        {/* Reflective highlights */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none overflow-hidden">
          <div className="absolute -inset-1/2 bg-gradient-to-r from-blue-300/10 via-indigo-300/20 to-purple-300/10 transform rotate-12 blur-2xl"></div>
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent"></div>
        </div>

        {/* Content container */}
        <div className="px-4 md:px-8 py-4 relative z-10">
          {/* Top row: Title and actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Page title with animation */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={pageTitle}
                  variants={titleVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="relative"
                >
                  <h1 className="text-xl md:text-2xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-800 via-blue-700 to-indigo-800">
                    {pageTitle}
                  </h1>
                  <motion.div 
                    className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent"
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-4">
              {/* Search toggle */}
              <motion.button 
                className="p-2 rounded-full text-gray-600 hover:text-blue-600 bg-white/40 hover:bg-blue-50/80 backdrop-blur-sm border border-blue-100/30 shadow-sm transition-all duration-300"
                onClick={toggleSearchBar}
                whileHover={{ scale: 1.1, boxShadow: "0 0 15px rgba(59, 130, 246, 0.3)" }}
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                title="Search"
              >
                {showSearchBar ? <X size={18} /> : <Search size={18} />}
              </motion.button>

              {/* Notifications */}
              <div className="relative">
                <motion.button 
                  className="p-2 rounded-full text-gray-600 hover:text-blue-600 bg-white/40 hover:bg-blue-50/80 backdrop-blur-sm border border-blue-100/30 shadow-sm transition-all duration-300"
                  onClick={toggleNotifications}
                  whileHover={{ scale: 1.1, boxShadow: "0 0 15px rgba(59, 130, 246, 0.3)" }}
                  whileTap={{ scale: 0.9 }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  title="Notifications"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <motion.span 
                      className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-[10px] font-medium text-white border border-white"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    >
                      {unreadCount}
                    </motion.span>
                  )}
                </motion.button>

                {/* Notifications dropdown */}
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div 
                      className="absolute right-0 mt-3 w-80 rounded-2xl shadow-xl border border-blue-100/50 overflow-hidden z-30"
                      initial={{ opacity: 0, y: -10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.9 }}
                      transition={{ duration: 0.3, type: "spring", stiffness: 400, damping: 25 }}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        backdropFilter: "blur(16px)",
                        background: "linear-gradient(145deg, rgba(255,255,255,0.9), rgba(240,249,255,0.85))"
                      }}
                    >
                      <div className="p-4 border-b border-blue-100/50 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 flex items-center justify-between">
                        <motion.h3 
                          className="font-medium bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600"
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.1 }}
                        >
                          Notifications
                        </motion.h3>
                        {unreadCount > 0 && (
                          <motion.div 
                            className="text-xs py-1 px-3 rounded-full bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-700 border border-blue-200/30"
                            initial={{ x: 10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                          >
                            {unreadCount} unread
                          </motion.div>
                        )}
                      </div>
                      
                      <div className="max-h-80 overflow-y-auto bg-white/70">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-gray-500">
                            No notifications
                          </div>
                        ) : (
                          notifications.map((notification, index) => (
                            <motion.div 
                              key={notification.id}
                              className={`p-3 border-b border-blue-50/60 hover:bg-blue-50/50 backdrop-blur-sm transition-colors cursor-pointer ${notification.read ? 'bg-white/50' : 'bg-blue-50/40'}`}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 * index, duration: 0.3 }}
                              whileHover={{ 
                                backgroundColor: "rgba(239, 246, 255, 0.7)",
                                transition: { duration: 0.1 }
                              }}
                            >
                              <div className="flex items-start gap-3">
                                <motion.div 
                                  className={`w-2 h-2 rounded-full mt-1.5 ${notification.read ? 'bg-gray-300' : 'bg-blue-500'}`}
                                  animate={notification.read ? {} : { 
                                    scale: [1, 1.2, 1],
                                    opacity: [1, 0.7, 1] 
                                  }}
                                  transition={{ 
                                    repeat: Infinity, 
                                    repeatType: "reverse", 
                                    duration: 2 
                                  }}
                                />
                                <div className="flex-1">
                                  <p className="text-sm text-gray-800">{notification.message}</p>
                                  <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                                </div>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                      
                      <div className="p-2 border-t border-blue-100/50 bg-gradient-to-r from-blue-50/60 to-indigo-50/60">
                        <motion.button 
                          className="w-full py-1.5 text-xs font-medium bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          View all notifications
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User profile */}
              <div className="relative ml-1">
                <motion.div 
                  className="flex items-center gap-2 border border-white/50 rounded-full pl-3 pr-1.5 py-1.5 bg-gradient-to-r from-white/70 to-blue-50/70 hover:from-blue-50/70 hover:to-indigo-50/70 backdrop-blur-sm cursor-pointer shadow-sm transition-all duration-300"
                  onClick={toggleUserMenu}
                  whileHover={{ 
                    scale: 1.05, 
                    boxShadow: "0 0 20px rgba(59, 130, 246, 0.3)",
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                >
                 <span className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-gray-700 to-blue-800 hidden sm:block">
  {isLoading ? "Loading..." : user?.name || "User"}
</span>
                  <ChevronDown size={14} className="text-blue-500 hidden sm:block" />
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-md">
                    <User size={16} />
                  </div>
                </motion.div>

                {/* User dropdown menu */}
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div 
                      className="absolute right-0 mt-3 w-60 rounded-2xl shadow-xl border border-blue-100/50 overflow-hidden z-30"
                      initial={{ opacity: 0, y: -10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.9 }}
                      transition={{ duration: 0.3, type: "spring", stiffness: 400, damping: 25 }}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        backdropFilter: "blur(16px)",
                        background: "linear-gradient(145deg, rgba(255,255,255,0.9), rgba(240,249,255,0.85))"
                      }}
                    >
                      <div className="p-5 border-b border-blue-50/50 bg-gradient-to-br from-blue-50/80 via-indigo-50/70 to-purple-50/80">
                        <motion.p 
                          className="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600"
                          initial={{ y: -10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.1 }}
                        >
                         {isLoading ? "Loading..." : user?.name || "Guest"}
                        </motion.p>
                        <motion.p 
                          className="text-xs text-gray-500 mt-1"
                          initial={{ y: -10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                         {isLoading ? "Loading..." : user?.email || "guest@example.com"}
                        </motion.p>
                      </div>
                      
                      <div className="py-1 bg-white/70">
                        <motion.button 
                          className="flex items-center gap-3 w-full px-5 py-3 text-sm text-gray-700 hover:bg-blue-50/70 transition-colors group"
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.1 }}
                          whileHover={{ x: 3 }}
                          onClick={() => navigate("/profile")}
                        >
                          <motion.span 
                            className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100/50 text-blue-600 group-hover:bg-blue-200/80 transition-colors"
                            whileHover={{ rotate: 15 }}
                          >
                            <User size={16} />
                          </motion.span>
                          <span>Profile</span>
                        </motion.button>
                        
                        <motion.button 
                          className="flex items-center gap-3 w-full px-5 py-3 text-sm text-gray-700 hover:bg-blue-50/70 transition-colors group"
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          whileHover={{ x: 3 }}
                          onClick={() => navigate("/settings")}
                        >
                          <motion.span 
                            className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100/50 text-blue-600 group-hover:bg-blue-200/80 transition-colors"
                            whileHover={{ rotate: 90 }}
                            transition={{ duration: 0.5 }}
                          >
                            <Settings size={16} />
                          </motion.span>
                          <span>Settings</span>
                        </motion.button>
                        
                        <motion.button 
                          className="flex items-center gap-3 w-full px-5 py-3 text-sm text-gray-700 hover:bg-blue-50/70 transition-colors group"
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          whileHover={{ x: 3 }}
                          onClick={() => navigate("/access-control")}
                          
                        >
                          <motion.span 
                            className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100/50 text-blue-600 group-hover:bg-blue-200/80 transition-colors"
                            whileHover={{ scale: 1.2 }}
                          >
                            <Shield size={16} />
                          </motion.span>
                          <span>Access Control</span>
                        </motion.button>
                      </div>
                      
                      <div className="py-1 border-t border-blue-50/50 bg-gradient-to-r from-blue-50/60 to-indigo-50/60">
                        <motion.button 
                          className="flex items-center gap-3 w-full px-5 py-3 text-sm text-red-600 hover:bg-red-50/50 transition-colors group"
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          whileHover={{ x: 3 }}
                          onClick={handleLogout}
                        >
                          <motion.span 
                            className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100/50 text-red-600 group-hover:bg-red-200/80 transition-colors"
                            whileHover={{ x: 5 }}
                          >
                            <LogOut size={16} />
                          </motion.span>
                          <span>Logout</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
          
          {/* Bottom row: Breadcrumbs and search */}
          <div className="flex items-center justify-between mt-2">
            {/* Breadcrumb navigation */}
            {renderBreadcrumbs()}
            
            {/* Search bar */}
            <AnimatePresence>
              {showSearchBar && (
                <motion.form
                  className="flex-1 max-w-2xl mx-auto"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, type: "spring", stiffness: 500, damping: 30 }}
                  onSubmit={handleSearch}
                >
                  <div className="relative">
                    <motion.div
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 500 }}
                    >
                      <Search size={16} />
                    </motion.div>
                    <motion.input
                      type="text"
                      className="w-full py-2.5 pl-11 pr-10 border border-blue-100/70 rounded-full bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-300/50 focus:border-blue-300/50 outline-none text-sm shadow-inner transition-all duration-300"
                      placeholder="Search batches, standards, units..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                      initial={{ width: "80%" }}
                      animate={{ width: "100%" }}
                      transition={{ delay: 0.1, duration: 0.3 }}
                      style={{
                        boxShadow: "inset 0 2px 4px rgba(37, 99, 235, 0.05)"
                      }}
                    />
                    {searchQuery && (
                      <motion.button
                        type="button"
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => setSearchQuery("")}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.2, type: "spring" }}
                      >
                        <X size={16} />
                      </motion.button>
                    )}
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default HeaderBar;