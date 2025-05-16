import api from '../../utils/api';
import { API_ROUTES } from '../../utils/api';
import { getRegisteredRoutes } from './routeregistery';

/**
 * Sanitize route data to remove React elements and circular references
 */
const sanitizeRouteData = (routes: any[]) => {
  return routes.map(route => ({
    path: route.path,
    name: route.name,
    description: route.description || '',
    permissionKey: route.permissionKey,
    resource: route.resource || 'page',
  }));
};

/**
 * Synchronize registered routes as permissions with the backend
 */
export const syncRoutePermissions = async (): Promise<void> => {
  try {
    const routes = getRegisteredRoutes();
    
    if (!routes || routes.length === 0) {
      console.warn('No routes found to synchronize');
      return;
    }
    
    console.log(`Syncing ${routes.length} routes`);
    
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error('Authentication token not found, cannot sync permissions');
      return;
    }
    
    // Sanitize the routes to remove React elements causing circular references
    const sanitizedRoutes = sanitizeRouteData(routes);
    
    // Call the API to sync permissions using the constant from API_ROUTES
    const response = await api.post(
      API_ROUTES.AUTH.SYNC_PAGE_PERMISSIONS, 
      { routes: sanitizedRoutes },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    console.log('Permission sync results:', response.data.results);
  } catch (error) {
    console.error('Failed to synchronize permissions:', error);
  }
};