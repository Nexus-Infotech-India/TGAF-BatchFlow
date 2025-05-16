import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { registerRoute, getRegisteredRoutes, RouteConfig } from '../hooks/Route/routeregistery';
import { syncRoutePermissions } from '../hooks/Route/sync';

interface RouteContextType {
  registerPageRoute: (route: Omit<RouteConfig, 'resource'>) => void;
  routes: RouteConfig[];
  syncRoutes: () => Promise<void>;
  isInitialized: boolean;
}

const RouteContext = createContext<RouteContextType | undefined>(undefined);

export const RouteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [routes, setRoutes] = useState<RouteConfig[]>([]);
  const registeredRoutesRef = useRef<Set<string>>(new Set());

  // Use useCallback to ensure this function doesn't change on every render
  const registerPageRoute = useCallback((route: Omit<RouteConfig, 'resource'>) => {
    // Check if this route path has already been registered to avoid duplicate registrations
    const routePath = route.path;
    
    if (!registeredRoutesRef.current.has(routePath)) {
      registeredRoutesRef.current.add(routePath);
      
      registerRoute({
        ...route,
        resource: 'page'
      });
      
      // Update routes state (but only when a new route is actually added)
      setRoutes(getRegisteredRoutes());
    }
  }, []);

  const syncRoutes = useCallback(async () => {
    await syncRoutePermissions();
  }, []);

  useEffect(() => {
    // Set initialized after first render
    setIsInitialized(true);
    
    // Initial routes setup - this runs only once on mount
    setRoutes(getRegisteredRoutes());
  }, []);

  return (
    <RouteContext.Provider value={{ registerPageRoute, routes, syncRoutes, isInitialized }}>
      {children}
    </RouteContext.Provider>
  );
};

export const useRoutes = (): RouteContextType => {
  const context = useContext(RouteContext);
  if (!context) {
    throw new Error('useRoutes must be used within a RouteProvider');
  }
  return context;
};