import { useMemo } from 'react';
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
  const isAdmin = userRole === 'Admin';
  
  const { data, isLoading: queryLoading, error } = useQuery({
    queryKey: ['permissions', userRole],
    queryFn: async () => {
      if (!userRole || !authToken) return { permissions: [], permissionMap: {} };
      
      try {
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
    enabled: !!userRole && !!authToken && !isAdmin, // Skip API call for Admin
    staleTime: 5 * 60 * 1000,
  });

  // Derive the permission map - for admins, always-granted only (admin check bypasses map)
  // For non-admins, use the fetched data or fall back to always-granted
  const permissionMap = useMemo(() => {
    if (isAdmin) {
      return { admin_access: true };
    }
    if (data?.permissionMap) {
      return data.permissionMap;
    }
    // Fallback: return always-granted permissions
    const fallback: Record<string, boolean> = {};
    ALWAYS_GRANTED_PERMISSIONS.forEach(perm => {
      fallback[perm] = true;
    });
    return fallback;
  }, [data, isAdmin]);

  // isLoading is false for admins (they never wait for API)
  // For non-admins, it's the actual query loading state
  const isLoading = isAdmin ? false : queryLoading;
  
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
    permissionMap,
    isLoading,
    error: error as Error | null,
    hasPermission,
  };
};