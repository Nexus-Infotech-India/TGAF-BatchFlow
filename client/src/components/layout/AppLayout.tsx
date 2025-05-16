import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from '../ui/sidebar';
import HeaderBar from './Header';

const AppLayout = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [pageTitle, setPageTitle] = useState('Dashboard');
  const [navStack, setNavStack] = useState<
    Array<{ title: string; path: string }>
  >([]);
  const location = useLocation();
  const navigate = useNavigate();

  // This function will be passed to Sidebar to communicate its state
  const handleSidebarToggle = (
    expanded: boolean | ((prevState: boolean) => boolean)
  ) => {
    setIsSidebarExpanded(expanded);
  };

  // Update page title based on route
  useEffect(() => {
    const path = location.pathname;
    let title = 'BatchFlow';
    let currentNavStack = [{ title: 'Home', path: '/' }];

    if (path.includes('/dashboard')) {
      title = 'Dashboard';
      currentNavStack = [
        { title: 'Home', path: '/' },
        { title: 'Dashboard', path: '/dashboard' },
      ];
    } else if (path.includes('/batches')) {
      title = 'Batch Management';
      currentNavStack = [
        { title: 'Home', path: '/' },
        { title: 'Batches', path: '/batches' },
      ];
    } else if (path.includes('/standards')) {
      title = 'Standards';
      currentNavStack = [
        { title: 'Home', path: '/' },
        { title: 'Standards', path: '/standards' },
      ];
    } else if (path.includes('/units')) {
      title = 'Units';
      currentNavStack = [
        { title: 'Home', path: '/' },
        { title: 'Units', path: '/units' },
      ];
    } else if (path.includes('/activity-logs')) {
      title = 'Activity Logs';
      currentNavStack = [
        { title: 'Home', path: '/' },
        { title: 'Activity Logs', path: '/activity-logs' },
      ];
    } else if (path.includes('/settings')) {
      title = 'Settings';
      currentNavStack = [
        { title: 'Home', path: '/' },
        { title: 'Settings', path: '/settings' },
      ];
    }

    setPageTitle(title);
    setNavStack(currentNavStack);
  }, [location]);

  return (
    <div className="flex min-h-screen">
      {/* Background with subtle pattern */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: `
            radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.2) 2px, transparent 0),
            radial-gradient(circle at 75px 75px, rgba(255, 255, 255, 0.2) 2px, transparent 0)
          `,
          backgroundSize: '100px 100px',
          backgroundColor: '#f0f4ff',
        }}
      />

      {/* Sidebar */}
      <Sidebar onToggle={handleSidebarToggle} />

     {/* Main Content */}
<motion.div 
  className="flex-1 transition-all relative"
  animate={{ 
    marginLeft: isSidebarExpanded ? '260px' : '80px',
  }}
  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
>
  {/* Fixed position header - REMOVED TOP PADDING */}
  <div className="sticky top-0 z-40 px-5 lg:px-6">
    <HeaderBar pageTitle={pageTitle} activeNavStack={navStack} />
  </div>
  
  {/* Content area with padding - ADJUSTED TOP PADDING */}
  <div className="px-5 lg:px-6 pb-5 lg:pb-6 pt-3">
    {/* Main Content Container */}
    <motion.div 
      className="rounded-xl shadow-md p-6  border border-blue-100"
      // style={{
      //   backgroundColor: "rgba(255, 255, 255, 0.8)",
      //   backdropFilter: "blur(10px)"
      // }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      key={location.pathname}
    >
      <Outlet />
    </motion.div>
  </div>
</motion.div>
    </div>
  );
};

export default AppLayout;
