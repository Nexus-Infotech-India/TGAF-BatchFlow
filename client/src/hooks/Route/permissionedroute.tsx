import React, { useEffect } from 'react';
import { useRoutes } from '../../context/RouteProvider';

// Define your own props interface
interface PermissionedRouteProps {
  name: string;
  description?: string;
  permissionKey: string;
  element: React.ReactNode;
  path: string;
  caseSensitive?: boolean;
}

const PermissionedRoute: React.FC<PermissionedRouteProps> = ({
  name,
  description,
  permissionKey,
  element,
  path,
  ...rest
}) => {
  const { registerPageRoute } = useRoutes();

  useEffect(() => {
    // Register this route with the permission system
    registerPageRoute({
      path,
      element,
      name,
      description,
      permissionKey,
    });
  }, []);

  // Instead of returning a Route, return the element itself
  return <>{element}</>;
};

export default PermissionedRoute;