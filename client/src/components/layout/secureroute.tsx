import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/permission';

interface SecureRouteProps {
  element: React.ReactNode;
  permissionKey: string;
}

const SecureRoute: React.FC<SecureRouteProps> = ({ element, permissionKey }) => {
  const { hasPermission, isLoading, permissionMap } = usePermissions();
  const isAuthenticated = !!localStorage.getItem('authToken');
  const userRole = localStorage.getItem('userRole');
  const isAdmin = userRole === 'Admin';
  const [permissionChecked, setPermissionChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  // For Admin users, we can skip permission checks completely
  useEffect(() => {
    if (isAdmin) {
      setHasAccess(true);
      setPermissionChecked(true);
      return;
    }
    
    // For non-admin users, check permissions when data is loaded
    if (!isLoading && Object.keys(permissionMap).length > 0) {
      const access = hasPermission(permissionKey);
      console.log(`Permission check for ${permissionKey}: ${access}`);
      console.log('Available permissions:', permissionMap);
      setHasAccess(access);
      setPermissionChecked(true);
    }
  }, [isLoading, permissionKey, hasPermission, permissionMap, isAdmin]);
  
  // Skip loading state for admin users
  if (!isAdmin && (isLoading || !permissionChecked)) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-blue-500">Loading permissions...</p>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Redirect to unauthorized page if missing permission (admins always have access)
  if (!hasAccess && !isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  // Render the protected component
  return <>{element}</>;
};

export default SecureRoute;