import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  Book, 
  Award, 
 
  Settings, 
  ChevronLeft, 
  Menu,
  PackageOpen,
  Activity,
  Anchor
} from "lucide-react";
import { usePermissions } from "../../hooks/permission"; // Import the permissions hook

// Define props for Sidebar
interface SidebarProps {
  onToggle: (expanded: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onToggle }) => {
  const [isExpanded, setIsExpanded] = useState(true);
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

  const sidebarItems = [
    { 
      path: "/dashboard", 
      name: "Dashboard", 
      icon: <LayoutDashboard size={20} />,
      permissionKey: "view_dashboard" 
    },
    { 
      path: "/batches", 
      name: "Batches", 
      icon: <PackageOpen size={20} />,
      permissionKey: "view_batches" 
    },
   
    { 
      path: "/standards", 
      name: "Standards", 
      icon: <Award size={20} />,
      permissionKey: "manage_standards" 
    },
    { 
      path: "/activity-logs", 
      name: "Activities", 
      icon: <Activity size={20} />,
      permissionKey: "view_activity_logs" 
    },
    { 
      path: "/settings", 
      name: "Settings", 
      icon: <Settings size={20} />,
      permissionKey: "manage_settings" 
    },
    { 
      path: "/access-control", 
      name: "User Management", 
      icon: <Book size={20} />,
      permissionKey: "manage_users" 
    },
    { 
      path: "/compare-batch", 
      name: "Compare Batch", 
      icon: <Anchor size={20} />,
      permissionKey: "review_batches" 
    },
  ];

  // Filter the sidebar items based on permissions
  const authorizedItems = isAdmin ? sidebarItems : sidebarItems.filter(item => hasPermission(item.permissionKey));

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
      animate={{ width: isExpanded ? '260px' : '80px' }}
      initial={{ width: '260px' }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Keep styles */}
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
        
        .menu-item-active {
          background: linear-gradient(90deg, rgba(77, 171, 245, 0.7), rgba(87, 192, 255, 0.3));
          box-shadow: 0 0 15px rgba(77, 171, 245, 0.3);
          border-left: 3px solid #83b1ff;
        }
        
        .logo-container {
          background: linear-gradient(90deg, #4dabf5, #1e88e5);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
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
      
      <ul className="mt-8 px-3">
        {/* Only render items the user has permission to see */}
        {authorizedItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <motion.li
              key={item.path}
              className={`my-2 rounded-xl overflow-hidden transition-all ${
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
      </ul>
      
      {isExpanded && (
        <motion.div 
          className="absolute bottom-6 left-0 right-0 px-4"
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