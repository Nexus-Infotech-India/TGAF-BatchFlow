import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_ROUTES } from '../utils/api';

interface Permission {
  id: string;
  action: string;
  resource: string;
}

interface UsePermissionsResult {
  permissions: Permission[];
  permissionMap: Record<string, boolean>;
  isLoading: boolean;
  error: Error | null;
  hasPermission: (permissionKey: string) => boolean;
}

// Add these common permissions that should always be granted
const ALWAYS_GRANTED_PERMISSIONS = ['view_dashboard', 'view_profile'];

export const usePermissions = (): UsePermissionsResult => {
  const userRole = localStorage.getItem('userRole');
  const authToken = localStorage.getItem('authToken');
  const [permissionMap, setPermissionMap] = useState<Record<string, boolean>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Check if user is admin
  useEffect(() => {
    if (userRole === 'Admin') {
      setIsAdmin(true);
    }
  }, [userRole]);
  
  // Initialize with always-granted permissions
  useEffect(() => {
    const initialMap: Record<string, boolean> = {};
    ALWAYS_GRANTED_PERMISSIONS.forEach(perm => {
      initialMap[perm] = true;
    });
    setPermissionMap(initialMap);
  }, []);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['permissions', userRole],
    queryFn: async () => {
      if (!userRole || !authToken) return { permissions: [], permissionMap: {} };
      
      try {
        // For Admin users, we can skip the API call as they have all permissions
        if (userRole === 'Admin') {
          return {
            permissions: [],
            permissionMap: { admin_access: true }  // Just a placeholder since Admin has all permissions
          };
        }
        
        // Use the correct API route to fetch permissions by role name for non-admin users
        const response = await axios.get(
          API_ROUTES.AUTH.GET_PERMISSIONS_BY_ROLE(userRole),
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        
        // Transform the permissions array into a permission map for easy lookup
        const permissions = response.data.permissions || [];
        const permMap: Record<string, boolean> = {};
        
        // Include always-granted permissions
        ALWAYS_GRANTED_PERMISSIONS.forEach(perm => {
          permMap[perm] = true;
        });
        
        // Add role-specific permissions
        permissions.forEach((permission: Permission) => {
          permMap[permission.action] = true;
        });
        
        console.log('Loaded permissions:', permMap);
        
        return {
          permissions,
          permissionMap: permMap
        };
      } catch (err) {
        console.error('Error fetching permissions:', err);
        // Return always-granted permissions even on error
        const permMap: Record<string, boolean> = {};
        ALWAYS_GRANTED_PERMISSIONS.forEach(perm => {
          permMap[perm] = true;
        });
        return { permissions: [], permissionMap: permMap };
      }
    },
    enabled: !!userRole && !!authToken && userRole !== 'Admin', // Skip API call for Admin
    staleTime: 5 * 60 * 1000,
  });
  
  useEffect(() => {
    if (data?.permissionMap) {
      // Merge new permissions with always-granted ones
      const newMap = {...permissionMap, ...data.permissionMap};
      setPermissionMap(newMap);
    }
  }, [data]);
  
  const hasPermission = (permissionKey: string): boolean => {
    // Admin role always has access to everything
    if (isAdmin) {
      return true;
    }
    
    // Always grant access to certain common pages for any role
    if (ALWAYS_GRANTED_PERMISSIONS.includes(permissionKey)) {
      return true;
    }
    
    return !!permissionMap[permissionKey];
  };
  
  return {
    permissions: data?.permissions || [],
    permissionMap: permissionMap,
    isLoading: isLoading && !isAdmin, // Admin is never in loading state
    error: error as Error | null,
    hasPermission,
  };
};