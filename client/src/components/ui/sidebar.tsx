import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Award, 
  ChevronLeft, 
  Menu,
  PackageOpen,
  Calendar,
  ChevronRight,
  GraduationCap,
  Shield,
  File,
  LucideLayoutDashboard,
  LayoutDashboardIcon,
  FileStack,
  ClipboardEdit,
  SwitchCamera,
  FileText
} from "lucide-react";
import { usePermissions } from "../../hooks/permission"; // Import the permissions hook

// Define props for Sidebar
interface SidebarProps {
  onToggle: (expanded: boolean) => void;
}

// Define menu item interface
interface MenuItem {
  path: string;
  name: string;
  icon: React.ReactNode;
  permissionKey: string;
}

// Define parent group interface
interface ParentGroup {
  key: string;
  name: string;
  icon: React.ReactNode;
  children: MenuItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ onToggle }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const location = useLocation();
  const { hasPermission } = usePermissions(); 
  const userRole = localStorage.getItem('userRole');
  const isAdmin = userRole === 'Admin';

  // Use useEffect to notify parent about initial state
  useEffect(() => {
    onToggle(isExpanded);
  }, []); // Empty dependency array means this runs once on mount

  const toggleSidebar = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    onToggle(newState); // Notify parent after state is updated
  };

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupKey) 
        ? prev.filter(key => key !== groupKey)
        : [...prev, groupKey]
    );
  };

  // Independent menu items
  const independentItems: MenuItem[] = [
    // { 
    //   path: "/dashboard", 
    //   name: "Dashboard", 
    //   icon: <LayoutDashboard size={20} />,
    //   permissionKey: "view_dashboard" 
    // },
    // { 
    //   path: "/access-control", 
    //   name: "User Management", 
    //   icon: <Book size={20} />,
    //   permissionKey: "manage_users" 
    // },
    // { 
    //   path: "/activity-logs", 
    //   name: "Activity Logs", 
    //   icon: <Activity size={20} />,
    //   permissionKey: "view_activity_logs" 
    // },
    // { 
    //   path: "/settings", 
    //   name: "Settings", 
    //   icon: <Settings size={20} />,
    //   permissionKey: "manage_settings" 
    // },
  ];

  // Parent groups with children

const parentGroups: ParentGroup[] = [
  {
    key: 'raw-material',
    name: 'Raw Material Man...',
    icon: <PackageOpen size={20} />,
    children: [
      {
        path: '/raw-dashboard',
        name: 'Dashboard',
        icon: <LayoutDashboardIcon size={18} />,
        permissionKey: 'manage_raw_dashboard', // updated
      },
      // {
      //   path: "/raw/purchase-order",
      //   name: "Order",
      //   icon: <FileStack size={18} />,
      //   permissionKey: "manage_purchase_order" // updated (if enabled)
      // },
      {
        path: '/raw/purchase-history',
        name: 'Order',
        icon: <FileStack size={18} />,
        permissionKey: 'manage_purchase_order', // updated
      },
      {
        path: '/raw/cleaning-raw-materials',
        name: 'Cleaning',
        icon: <ClipboardEdit size={18} />,
        permissionKey: 'manage_purchase_order', // updated
      },
      {
        path: '/raw/processing-list',
        name: 'Processing',
        icon: <SwitchCamera size={18} />,
        permissionKey: 'manage_purchase_order',
      },
      {
        path: '/raw/quality-report',
        name: 'RM Quality Report',
        icon: <FileText size={18} />,
        permissionKey: 'manage_rm_quality_report',
      },
      {
        path: '/stock-distribution',
        name: 'Stock Distribution',
        icon: <SwitchCamera size={18} />,
        permissionKey: 'view_stock_distribution', // updated
      },
    ],
  },
  {
    key: 'batch-management',
    name: 'FG Quality Report',
    icon: <PackageOpen size={20} />,
    children: [
      {
        path: '/operation-dashboard',
        name: 'Dashboard',
        icon: <LucideLayoutDashboard size={18} />,
        permissionKey: 'view_operation_dashboard', // updated
      },
      {
        path: '/batches',
        name: 'Batches',
        icon: <PackageOpen size={18} />,
        permissionKey: 'view_batches',
      },
      {
        path: '/standards',
        name: 'Standards',
        icon: <Award size={18} />,
        permissionKey: 'manage_standards',
      },
      // {
      //   path: "/compare-batch",
      //   name: "Compare Batch",
      //   icon: <Anchor size={18} />,
      //   permissionKey: "review_batches"
      // },
      {
        path: '/batches/verification',
        name: 'Batch Verification',
        icon: <Award size={18} />,
        permissionKey: 'verify_batches',
      },
    ],
  },
  {
    key: 'training',
    name: 'Training',
    icon: <GraduationCap size={20} />,
    children: [
      {
        path: '/trainings-dashboard',
        name: 'Dashboard',
        icon: <LucideLayoutDashboard size={18} />,
        permissionKey: 'view_training_dashboard', // updated
      },
      {
        path: '/trainings',
        name: 'Training',
        icon: <Award size={18} />,
        permissionKey: 'manage_trainings',
      },
      {
        path: '/training-calender',
        name: 'Training Calendar',
        icon: <Calendar size={18} />,
        permissionKey: 'view_training_calendar', // updated
      },
    ],
  },
  {
    key: 'audit-management',
    name: 'Audit Management',
    icon: <Shield size={20} />,
    children: [
      {
        path: '/audit-dashboard',
        name: 'Audit Dashboard',
        icon: <File size={18} />,
        permissionKey: 'view_audit_dashboard', // updated
      },
      {
        path: '/audits',
        name: 'Audit management',
        icon: <File size={18} />,
        permissionKey: 'manage_audits', // updated
      },
      {
        path: '/audit/calender',
        name: 'Audit Calendar',
        icon: <Calendar size={18} />,
        permissionKey: 'view_audit_calendar', // updated
      },
    ],
  },
];


  // Filter independent items based on permissions
  const authorizedIndependentItems = isAdmin 
    ? independentItems 
    : independentItems.filter(item => hasPermission(item.permissionKey));

  // Filter parent groups and their children based on permissions
  const authorizedParentGroups = parentGroups.map(group => ({
    ...group,
    children: isAdmin 
      ? group.children 
      : group.children.filter(child => hasPermission(child.permissionKey))
  })).filter(group => group.children.length > 0 || isAdmin);

  // Check if any child in a group is active
  const isGroupActive = (group: ParentGroup) => {
    return group.children.some(child => location.pathname === child.path);
  };

  // Auto-expand groups that contain the current active page
  useEffect(() => {
    const activeGroups = authorizedParentGroups
      .filter(group => isGroupActive(group))
      .map(group => group.key);
    
    setExpandedGroups(prev => {
      const newExpanded = [...new Set([...prev, ...activeGroups])];
      return newExpanded;
    });
  }, [location.pathname]);

  return (
    <motion.div 
      className="h-screen fixed transition-all z-10 overflow-hidden"
      style={{
        background: "linear-gradient(to bottom, #0f2b6b, #0b3a8d, #1155c5)",
        backgroundSize: "400% 400%",
        animation: "gradientAnimation 15s ease infinite",
        boxShadow: "0 0 25px rgba(17, 85, 197, 0.5)",
        borderRight: "1px solid rgba(131, 177, 255, 0.2)"
      }}
      animate={{ width: isExpanded ? '280px' : '80px' }}
      initial={{ width: '280px' }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Enhanced styles */}
      <style>{`
        @keyframes gradientAnimation {
          0% { background-position: 0% 0%; }
          50% { background-position: 100% 100%; }
          100% { background-position: 0% 0%; }
        }
        
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 5px rgba(77, 171, 245, 0.5); }
          50% { box-shadow: 0 0 15px rgba(77, 171, 245, 0.8); }
          100% { box-shadow: 0 0 5px rgba(77, 171, 245, 0.5); }
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        .menu-item-active {
          background: linear-gradient(90deg, rgba(77, 171, 245, 0.8), rgba(87, 192, 255, 0.4));
          box-shadow: 0 0 20px rgba(77, 171, 245, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2);
          border-left: 4px solid #83b1ff;
          border-radius: 12px;
        }
        
        .menu-group-active {
          background: linear-gradient(90deg, rgba(77, 171, 245, 0.5), rgba(87, 192, 255, 0.2));
          border-left: 3px solid #83b1ff;
          box-shadow: 0 0 15px rgba(77, 171, 245, 0.2);
        }
        
        .menu-group-header {
          position: relative;
          backdrop-filter: blur(8px);
          border: 1px solid rgba(131, 177, 255, 0.1);
        }
        
        .menu-group-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent);
          background-size: 200% 100%;
          animation: shimmer 3s infinite;
          pointer-events: none;
          border-radius: inherit;
        }
        
        .dropdown-container {
          background: rgba(15, 43, 107, 0.4);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(131, 177, 255, 0.15);
          border-radius: 12px;
          margin-top: 4px;
          position: relative;
        }
        
        .dropdown-container::before {
          content: '';
          position: absolute;
          top: -1px;
          left: 12px;
          right: 12px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(131, 177, 255, 0.3), transparent);
        }
        
        .child-item {
          position: relative;
          backdrop-filter: blur(4px);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .child-item:hover {
          background: rgba(77, 171, 245, 0.15);
          transform: translateX(4px);
        }
        
        .child-item::before {
          content: '';
          position: absolute;
          left: 12px;
          top: 50%;
          width: 6px;
          height: 6px;
          background: rgba(131, 177, 255, 0.4);
          border-radius: 50%;
          transform: translateY(-50%);
          transition: all 0.2s ease;
        }
        
        .child-item:hover::before {
          background: rgba(131, 177, 255, 0.8);
          box-shadow: 0 0 8px rgba(131, 177, 255, 0.5);
        }
        
        .child-item-active::before {
          background: #83b1ff;
          box-shadow: 0 0 12px rgba(131, 177, 255, 0.8);
        }
        
        .logo-container {
          background: linear-gradient(90deg, #4dabf5, #1e88e5);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .scrollbar-hide {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        .group-separator {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(131, 177, 255, 0.2), transparent);
          margin: 12px 16px;
        }
      `}</style>
      
      <div className="flex justify-between items-center p-5 border-b border-blue-400/20">
        <motion.div
          animate={{ opacity: isExpanded ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="logo-container"
        >
          {isExpanded && (
            <h2 className="text-2xl font-bold tracking-tight">TGAF</h2>
          )}
        </motion.div>
        <motion.button
          onClick={toggleSidebar}
          className="p-2 rounded-full bg-blue-400/10 hover:bg-blue-400/20 text-blue-100"
          whileHover={{ scale: 1.1, rotate: isExpanded ? 0 : 180 }}
          whileTap={{ scale: 0.9 }}
          style={{ 
            backdropFilter: "blur(8px)",
            animation: "pulseGlow 2s infinite"
          }}
        >
          {isExpanded ? <ChevronLeft size={20} /> : <Menu size={20} />}
        </motion.button>
      </div>
      
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <ul className="mt-6 px-3 space-y-3">
          {/* Independent menu items */}
          {authorizedIndependentItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <motion.li
                key={item.path}
                className={`rounded-xl overflow-hidden transition-all ${
                  isActive 
                    ? "menu-item-active" 
                    : "hover:bg-blue-400/10"
                }`}
                whileHover={{ x: 5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <Link to={item.path} className="flex items-center py-3 px-4">
                  <motion.div 
                    className={`${isActive ? "text-white" : "text-blue-200"}`}
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    {item.icon}
                  </motion.div>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.span
                        className={`ml-3 font-medium ${isActive ? "text-white" : "text-blue-100"}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ type: "spring", stiffness: 100, damping: 10 }}
                      >
                        {item.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </motion.li>
            );
          })}

          {/* Parent groups with children */}
          {authorizedParentGroups.map((group, index) => {
            const isGroupExpanded = expandedGroups.includes(group.key);
            const groupHasActiveChild = isGroupActive(group);
            
            return (
              <motion.li
                key={group.key}
                className="space-y-2"
                layout
              >
                {/* Group separator for visual distinction */}
                {index > 0 && <div className="group-separator" />}
                
                {/* Parent group header */}
                <motion.div
                  className={`menu-group-header rounded-xl overflow-hidden transition-all cursor-pointer ${
                    groupHasActiveChild 
                      ? "menu-group-active" 
                      : "hover:bg-blue-400/10"
                  }`}
                  whileHover={{ x: 5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  onClick={() => isExpanded && toggleGroup(group.key)}
                >
                  <div className="flex items-center justify-between py-3.5 px-4">
                    <div className="flex items-center">
                      <motion.div 
                        className={`${groupHasActiveChild ? "text-white" : "text-blue-200"}`}
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        {group.icon}
                      </motion.div>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.span
                            className={`ml-3 font-semibold text-sm tracking-wide ${groupHasActiveChild ? "text-white" : "text-blue-100"}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ type: "spring", stiffness: 100, damping: 10 }}
                          >
                            {group.name}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                    <AnimatePresence>
                      {isExpanded && group.children.length > 0 && (
                        <motion.div
                          className={`${groupHasActiveChild ? "text-white" : "text-blue-200"}`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ 
                            opacity: 1, 
                            scale: 1,
                            rotate: isGroupExpanded ? 90 : 0 
                          }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                          <ChevronRight size={16} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>

                {/* Children items in enhanced dropdown container */}
                <AnimatePresence>
                  {isExpanded && isGroupExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -10 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -10 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="dropdown-container ml-3 mr-1"
                    >
                      <div className="py-2 space-y-1">
                        {group.children.map((child, childIndex) => {
                          const isChildActive = location.pathname === child.path;
                          return (
                            <motion.div
                              key={child.path}
                              className={`child-item rounded-lg overflow-hidden transition-all ${
                                isChildActive 
                                  ? "menu-item-active child-item-active" 
                                  : ""
                              }`}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ 
                                delay: childIndex * 0.05,
                                type: "spring", 
                                stiffness: 400, 
                                damping: 20 
                              }}
                            >
                              <Link to={child.path} className="flex items-center py-2.5 px-6 ml-4">
                                <motion.div 
                                  className={`${isChildActive ? "text-white" : "text-blue-300"}`}
                                  whileHover={{ scale: 1.1 }}
                                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                >
                                  {child.icon}
                                </motion.div>
                                <motion.span
                                  className={`ml-3 font-medium text-sm ${isChildActive ? "text-white" : "text-blue-100"}`}
                                  whileHover={{ x: 2 }}
                                  transition={{ type: "spring", stiffness: 100, damping: 10 }}
                                >
                                  {child.name}
                                </motion.span>
                              </Link>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.li>
            );
          })}
        </ul>
      </div>
      
      {isExpanded && (
        <motion.div 
          className="p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.2 }}
        >
          <div className="p-4 rounded-xl bg-blue-400/10 backdrop-blur-md border border-blue-400/20 text-center">
            <motion.p 
              className="text-sm text-blue-100"
              whileHover={{ scale: 1.05 }}
            >
              TGAF v1.0
            </motion.p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Sidebar;