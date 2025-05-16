import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { API_ROUTES } from '../../utils/api';
import { syncRoutePermissions } from '../Route/sync';

interface Permission {
  id: string;
  action: string;
  resource: string;
}

interface PermissionGroup {
  [resource: string]: Permission[];
}

interface PermissionSelectorProps {
  selectedPermissions: string[];
  onChange: (permissionIds: string[]) => void;
}

const PermissionSelector: React.FC<PermissionSelectorProps> = ({
  selectedPermissions,
  onChange
}) => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<PermissionGroup>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First sync the route permissions
      await syncRoutePermissions();
      
      // Then load all permissions using API_ROUTES constant
      const response = await api.get(API_ROUTES.AUTH.GET_PERMISSIONS, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      setPermissions(response.data.permissions);
      setGroupedPermissions(response.data.groupedPermissions || groupPermissions(response.data.permissions));
      
      // Expand the "page" resource group by default
      setExpandedGroups(prev => ({
        ...prev,
        page: true
      }));
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading permissions:', error);
      setError('Failed to load permissions. Please try again.');
      setLoading(false);
    }
  };
  
  const groupPermissions = (permissions: Permission[]): PermissionGroup => {
    return permissions.reduce((groups, permission) => {
      const { resource } = permission;
      if (!groups[resource]) {
        groups[resource] = [];
      }
      groups[resource].push(permission);
      return groups;
    }, {} as PermissionGroup);
  };

  const handlePermissionToggle = (permissionId: string) => {
    const updatedPermissions = selectedPermissions.includes(permissionId)
      ? selectedPermissions.filter(id => id !== permissionId)
      : [...selectedPermissions, permissionId];
    
    onChange(updatedPermissions);
  };
  
  const handleGroupToggle = (resource: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [resource]: !prev[resource]
    }));
  };
  
  const handleSelectAllInGroup = (resource: string, isSelected: boolean) => {
    const groupPermissionIds = groupedPermissions[resource].map(p => p.id);
    
    let updatedPermissions: string[];
    if (isSelected) {
      // Deselect all in group
      updatedPermissions = selectedPermissions.filter(id => !groupPermissionIds.includes(id));
    } else {
      // Select all in group
      const newIds = groupPermissionIds.filter(id => !selectedPermissions.includes(id));
      updatedPermissions = [...selectedPermissions, ...newIds];
    }
    
    onChange(updatedPermissions);
  };

  if (loading) {
    return <div className="text-center py-4">Loading permissions...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-500">
        {error}
        <button 
          onClick={loadPermissions}
          className="ml-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-medium mb-4">Permissions</h3>
      
      {Object.keys(groupedPermissions).length === 0 ? (
        <p className="text-gray-500">No permissions found.</p>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedPermissions).map(([resource, perms]) => {
            const isExpanded = expandedGroups[resource] || false;
            const allSelected = perms.every(p => selectedPermissions.includes(p.id));
            const someSelected = perms.some(p => selectedPermissions.includes(p.id));
            
            return (
              <div key={resource} className="border rounded-md overflow-hidden">
                <div 
                  className="flex items-center justify-between bg-gray-50 p-3 cursor-pointer"
                  onClick={() => handleGroupToggle(resource)}
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`group-${resource}`}
                      checked={allSelected}
                      className="h-4 w-4 text-blue-600 rounded"
                      onChange={(e) => {
                        e.stopPropagation();
                        handleSelectAllInGroup(resource, allSelected);
                      }}
                    />
                    <label 
                      htmlFor={`group-${resource}`}
                      className={`ml-2 font-medium ${someSelected && !allSelected ? 'text-blue-600' : ''}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {resource.charAt(0).toUpperCase() + resource.slice(1)} 
                      <span className="text-xs ml-1 text-gray-500">({perms.length})</span>
                    </label>
                  </div>
                  
                  <span className="text-gray-500">
                    {isExpanded ? '▲' : '▼'}
                  </span>
                </div>
                
                {isExpanded && (
                  <div className="divide-y">
                    {perms.map(permission => (
                      <div key={permission.id} className="flex items-center p-3 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          id={`perm-${permission.id}`}
                          checked={selectedPermissions.includes(permission.id)}
                          onChange={() => handlePermissionToggle(permission.id)}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <label htmlFor={`perm-${permission.id}`} className="ml-2 flex-1">
                          {permission.action}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PermissionSelector;