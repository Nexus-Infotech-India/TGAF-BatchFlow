import { ReactNode } from 'react';

export interface RouteConfig {
  path: string;
  element: ReactNode;
  name: string;
  description?: string;
  permissionKey: string;
  resource?: string;
}

// Registry of all app routes that require permissions
const routeRegistry: RouteConfig[] = [];

/**
 * Register a route with the permission system
 */
export const registerRoute = (config: RouteConfig): void => {
  // Check if route is already registered by path or permission key to prevent duplicates
  const existingRouteIndex = routeRegistry.findIndex(
    route => route.path === config.path || route.permissionKey === config.permissionKey
  );
  
  // Set default resource to 'page' if not specified
  const routeConfig = {
    ...config,
    resource: config.resource || 'page'
  };
  
  if (existingRouteIndex >= 0) {
    // Update existing route instead of adding duplicate
    routeRegistry[existingRouteIndex] = routeConfig;
  } else {
    // Add new route
    routeRegistry.push(routeConfig);
  }
};

/**
 * Get all registered routes
 */
export const getRegisteredRoutes = (): RouteConfig[] => {
  return [...routeRegistry];
};

/**
 * Clear the registry (useful for testing)
 */
export const clearRegistry = (): void => {
  routeRegistry.length = 0;
};