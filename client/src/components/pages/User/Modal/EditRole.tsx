import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldPlus, X, Tag, FileText, Loader2, Check } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { API_ROUTES } from "../../../../utils/api";
import PermissionSelector from "../../../../hooks/Route/permissionselection";

interface RoleFormData {
  name: string;
  description: string;
}

interface EditRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleId: string | null;
}

const EditRoleModal: React.FC<EditRoleModalProps> = ({ isOpen, onClose, roleId }) => {
  const [roleFormData, setRoleFormData] = useState<RoleFormData>({
    name: "",
    description: ""
  });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const queryClient = useQueryClient();
  const authToken = localStorage.getItem("authToken");

  // Fetch the role to edit
  const { data: roleData, isLoading: isLoadingRole } = useQuery({
    queryKey: ["role", roleId],
    queryFn: async () => {
      if (!roleId) return null;
      const response = await axios.get(API_ROUTES.AUTH.GET_ROLE_BY_ID(roleId), {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      return response.data;
    },
    enabled: !!roleId && isOpen,
  });

  // Effect to populate form when data is loaded
  useEffect(() => {
    if (roleData && roleData.role) {
      setRoleFormData({
        name: roleData.role.name || "",
        description: roleData.role.description || ""
      });
      
      // Extract permission IDs
      if (roleData.role.Permission && Array.isArray(roleData.role.Permission)) {
        setSelectedPermissions(roleData.role.Permission.map((p: any) => p.id));
      } else {
        setSelectedPermissions([]);
      }
    }
  }, [roleData]);

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async () => {
      if (!roleId) throw new Error("No role ID selected");
      
      const updateData = {
        ...roleFormData,
        permissions: selectedPermissions.map(id => ({ id }))
      };
      
      const response = await axios.put(
        API_ROUTES.AUTH.UPDATE_ROLE(roleId),
        updateData,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["role", roleId] });
      // Invalidate permissions to force reload if the current user's role was updated
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      onClose();
    }
  });

  // Handle role form input changes
  const handleRoleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setRoleFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle edit role form submission
  const handleEditRole = (e: React.FormEvent) => {
    e.preventDefault();
    updateRoleMutation.mutate();
  };

  // Handle permission selection
  const handlePermissionsChange = (permissionIds: string[]) => {
    setSelectedPermissions(permissionIds);
  };

  // Reset form when closed
  useEffect(() => {
    if (!isOpen) {
      setRoleFormData({ name: "", description: "" });
      setSelectedPermissions([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", duration: 0.5 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <ShieldPlus className="h-5 w-5 text-blue-600" />
              Edit Role
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 rounded-full p-1 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {isLoadingRole ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
          ) : (
            <form onSubmit={handleEditRole}>
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Role Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Tag className="h-5 w-5 text-blue-400" />
                      </div>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={roleFormData.name}
                        onChange={handleRoleFormChange}
                        className="pl-10 pr-4 py-3 w-full border border-blue-100 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-300 outline-none"
                        placeholder="Enter role name"
                        disabled={roleData?.role?.name === "Admin"} // Prevent changing Admin role name
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <div className="relative">
                      <div className="absolute top-3 left-3 pointer-events-none">
                        <FileText className="h-5 w-5 text-blue-400" />
                      </div>
                      <textarea
                        id="description"
                        name="description"
                        value={roleFormData.description}
                        onChange={handleRoleFormChange}
                        className="pl-10 pr-4 py-3 w-full border border-blue-100 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-300 outline-none"
                        placeholder="Describe role permissions and responsibilities"
                        rows={3}
                        required
                      ></textarea>
                    </div>
                  </div>
                </div>
                
                {/* Permissions Selector */}
                <div className="border-t border-gray-200 pt-5">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Assign Permissions</h3>
                  {roleData?.role?.name === "Admin" ? (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-blue-700">
                      The Admin role inherently has access to all permissions. Modifications here are not necessary.
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <PermissionSelector 
                        selectedPermissions={selectedPermissions}
                        onChange={handlePermissionsChange}
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2"
                    disabled={updateRoleMutation.isPending}
                  >
                    {updateRoleMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    {updateRoleMutation.isPending ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default EditRoleModal;
