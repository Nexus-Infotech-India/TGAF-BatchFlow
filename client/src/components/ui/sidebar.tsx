import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Award, 
  ChevronLeft, 
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
    setExpandedGroups((prev) =>
      prev.includes(groupKey)
        ? prev.filter((key) => key !== groupKey)
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
    : independentItems.filter((item) => hasPermission(item.permissionKey));

  // Filter parent groups and their children based on permissions
  const authorizedParentGroups = parentGroups
    .map((group) => ({
      ...group,
      children: isAdmin
        ? group.children
        : group.children.filter((child) => hasPermission(child.permissionKey)),
    }))
    .filter((group) => group.children.length > 0 || isAdmin);

  // Check if any child in a group is active
  const isGroupActive = (group: ParentGroup) => {
    return group.children.some((child) => location.pathname === child.path);
  };

  // Auto-expand groups that contain the current active page
  useEffect(() => {
    const activeGroups = authorizedParentGroups
      .filter((group) => isGroupActive(group))
      .map((group) => group.key);

    setExpandedGroups((prev) => {
      const newExpanded = [...new Set([...prev, ...activeGroups])];
      return newExpanded;
    });
  }, [location.pathname]);

  // ...existing code...

  return (
    <motion.div
      className="h-screen fixed transition-all z-10 overflow-hidden flex flex-col"
      style={{
        background: 'var(--background)',
        boxShadow: '0 0 8px oklch(from var(--sidebar-primary) l s h / 0.08)',
        borderRight: '1px solid var(--sidebar-border)',
      }}
      animate={{ width: isExpanded ? '260px' : '80px' }}
      initial={{ width: '220px' }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      <style>{`
      .menu-item-active {
        background: var(--sidebar-accent);
        color: var(--sidebar-accent-foreground) !important;
        border-left: 4px solid var(--primary);
        border-radius: 12px;
      }
      .menu-item {
        color: var(--sidebar-foreground);
        transition: background 0.15s, color 0.15s;
      }
      .menu-item:hover {
        background: var(--sidebar-accent);
        color: var(--primary);
      }
      .menu-group-header {
        color: var(--sidebar-foreground);
        transition: background 0.15s, color 0.15s;
      }
      .menu-group-header:hover {
        background: var(--sidebar-accent);
        color: var(--primary);
      }
      .menu-group-active {
        background: var(--sidebar-accent);
        color: var(--primary);
        border-left: 3px solid var(--primary);
      }
      .child-item {
        color: var(--sidebar-foreground);
        transition: background 0.15s, color 0.15s;
      }
      .child-item:hover {
        background: var(--sidebar-accent);
        color: var(--primary);
      }
      .child-item-active {
        background: var(--sidebar-accent);
        color: var(--primary) !important;
        border-left: 3px solid var(--primary);
      }
      .logo-container {
        color: var(--primary);
      }
      .sidebar-button {
        background: none;
        color: var(--primary);
        border: 1px solid var(--sidebar-border);
        transition: background 0.15s, color 0.15s;
      }
      .sidebar-button:hover {
        background: var(--sidebar-accent);
        color: var(--primary);
      }
      .group-separator {
        height: 1px;
        background: var(--sidebar-border);
        margin: 12px 16px;
      }
      .sidebar-bg-primary {
        background: var(--sidebar-accent);
      }
      .sidebar-border {
        border: 1px solid var(--sidebar-border);
      }
      .sidebar-text {
        color: var(--sidebar-foreground);
      }
    `}</style>

      <div
        className="flex flex-col items-center justify-center pt-3 pb-8 relative"
        style={{ minHeight: '60px' }}
      >
        <div className="flex items-center justify-between w-full px-2">
          {isExpanded ? (
            <div className="flex flex-col items-center w-full">
              <div className="flex items-center w-full justify-center">
                <div className="relative flex flex-col items-center">
                  {/* Use inline-block and after pseudo-element for underline */}
                  <span className="relative inline-block">
                    <h2
                      className="text-4xl font-extrabold tracking-tight text-center"
                      style={{
                        letterSpacing: '0.05em',
                        color: 'var(--primary)',
                        display: 'inline-block',
                      }}
                    >
                      TGAF
                    </h2>
                    <motion.span
                      layoutId="tgaf-underline"
                      className="block absolute left-0 right-0 -bottom-2 h-1 rounded-full bg-[var(--primary)]"
                      style={{
                        width: '100%',
                      }}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      exit={{ scaleX: 0 }}
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 20,
                      }}
                    />
                  </span>
                </div>
                {/* Arrow button, always visible, aligned right */}
                <button
                  onClick={toggleSidebar}
                  className="ml-3 p-2 rounded-full hover:bg-[var(--primary)]/10 transition-colors"
                  title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
                  type="button"
                  style={{ color: 'var(--primary)' }}
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              </div>
            </div>
          ) : (
            // Collapsed: show only arrow, centered
            <button
              onClick={toggleSidebar}
              className="mx-auto p-2 rounded-full hover:bg-[var(--primary)]/10 transition-colors"
              title="Expand sidebar"
              type="button"
              style={{ color: 'var(--primary)' }}
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <ul className="mt-0 px-3 space-y-3">
          {/* Independent menu items */}
          {authorizedIndependentItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <motion.li
                key={item.path}
                className={`rounded-xl overflow-hidden transition-all menu-item ${
                  isActive ? 'menu-item-active' : ''
                }`}
                whileHover={{ x: 5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <Link to={item.path} className="flex items-center py-3 px-4">
                  <motion.div
                    style={{
                      color: isActive
                        ? 'var(--primary)'
                        : 'var(--sidebar-foreground)',
                    }}
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  >
                    {item.icon}
                  </motion.div>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.span
                        style={{
                          color: isActive
                            ? 'var(--primary)'
                            : 'var(--sidebar-foreground)',
                        }}
                        className="ml-3 font-medium"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{
                          type: 'spring',
                          stiffness: 100,
                          damping: 10,
                        }}
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
          {authorizedParentGroups.map((group) => {
            const isGroupExpanded = expandedGroups.includes(group.key);
            const groupHasActiveChild = isGroupActive(group);

            return (
              <motion.li key={group.key} className="space-y-2" layout>
                {/* Group separator for visual distinction */}

                {/* Parent group header */}
                <motion.div
                  className={`menu-group-header rounded-xl overflow-hidden transition-all cursor-pointer ${
                    groupHasActiveChild ? 'menu-group-active' : ''
                  }`}
                  whileHover={{ x: 5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  onClick={() => isExpanded && toggleGroup(group.key)}
                >
                  <div className="flex items-center justify-between py-3.5 px-4">
                    <div className="flex items-center">
                      <motion.div
                        style={{
                          color: groupHasActiveChild
                            ? 'var(--primary)'
                            : 'var(--sidebar-foreground)',
                        }}
                        whileHover={{ scale: 1.1 }}
                        transition={{
                          type: 'spring',
                          stiffness: 400,
                          damping: 10,
                        }}
                      >
                        {group.icon}
                      </motion.div>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.span
                            style={{
                              color: groupHasActiveChild
                                ? 'var(--primary)'
                                : 'var(--sidebar-foreground)',
                            }}
                            className="ml-3 font-semibold text-sm tracking-wide"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{
                              type: 'spring',
                              stiffness: 100,
                              damping: 10,
                            }}
                          >
                            {group.name}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                    <AnimatePresence>
                      {isExpanded && group.children.length > 0 && (
                        <motion.div
                          style={{
                            color: groupHasActiveChild
                              ? 'var(--primary)'
                              : 'var(--sidebar-foreground)',
                          }}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                            rotate: isGroupExpanded ? 90 : 0,
                          }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 20,
                          }}
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
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -10 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="ml-3 mr-1"
                    >
                      <div className="py-2 space-y-1">
                        {group.children.map((child, childIndex) => {
                          const isChildActive =
                            location.pathname === child.path;
                          return (
                            <motion.div
                              key={child.path}
                              className={`child-item rounded-lg overflow-hidden transition-all ${
                                isChildActive
                                  ? 'menu-item-active child-item-active'
                                  : ''
                              }`}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{
                                delay: childIndex * 0.05,
                                type: 'spring',
                                stiffness: 400,
                                damping: 20,
                              }}
                            >
                              <Link
                                to={child.path}
                                className="flex items-center py-2.5 px-6 ml-4"
                              >
                                <motion.div
                                  style={{
                                    color: isChildActive
                                      ? 'var(--primary)'
                                      : 'var(--sidebar-foreground)',
                                  }}
                                  whileHover={{ scale: 1.1 }}
                                  transition={{
                                    type: 'spring',
                                    stiffness: 400,
                                    damping: 10,
                                  }}
                                >
                                  {child.icon}
                                </motion.div>
                                <motion.span
                                  style={{
                                    color: isChildActive
                                      ? 'var(--primary)'
                                      : 'var(--sidebar-foreground)',
                                  }}
                                  className="ml-3 font-medium text-sm"
                                  whileHover={{ x: 2 }}
                                  transition={{
                                    type: 'spring',
                                    stiffness: 100,
                                    damping: 10,
                                  }}
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
      <div className="w-full text-center py-3 text-xs text-[var(--muted-foreground)] border-t border-[var(--sidebar-border)] mt-auto">
        Developed by{' '}
        <span className="font-semibold text-[var(--primary)]">
          Nexus InfoTech
        </span>
      </div>
    </motion.div>
  );

};

export default Sidebar;