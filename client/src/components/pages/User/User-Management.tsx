import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { API_ROUTES } from "../../../utils/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  Shield,
  ShieldPlus,
  Search,
  RefreshCw,
  AlertCircle,
  FileText,
  User
} from "lucide-react";
import { format } from "date-fns";
import CreateUserModal from "./Modal/CreateUser";
import CreateRoleModal from "./Modal/CreateRole";

interface User {
  id: string;
  name: string;
  email: string;
  role: {
    name: string;
  };
  createdAt: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);
  
  const authToken = localStorage.getItem("authToken");

 // Fetch users
const { data: usersData, isLoading: isLoadingUsers, error: usersError, refetch: refetchUsers } = useQuery({
  queryKey: ["users"],
  queryFn: async () => {
    try {
      const response = await axios.get(`${API_ROUTES.AUTH.GET_ALL_USERS}`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      const users = response.data.users || response.data || [];
      return Array.isArray(users) ? users : [];
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  },
  staleTime: 60000, // 1 minute
});

// Fetch roles
const { data: rolesData, isLoading: isLoadingRoles, error: rolesError, refetch: refetchRoles } = useQuery({
  queryKey: ["roles"],
  queryFn: async () => {
    try {
      const response = await axios.get(API_ROUTES.AUTH.GET_ROLES, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      const roles = response.data.roles || response.data || [];
      return Array.isArray(roles) ? roles : [];
    } catch (error) {
      console.error("Error fetching roles:", error);
      throw error;
    }
  },
  staleTime: 60000, // 1 minute
});

  
  // Filter users based on search query
const filteredUsers = Array.isArray(usersData) ? usersData.filter((user: User) => 
  user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
  user.role.name.toLowerCase().includes(searchQuery.toLowerCase())
) : [];

// Filter roles based on search query
const filteredRoles = Array.isArray(rolesData) ? rolesData.filter((role: Role) => 
  role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  role.description.toLowerCase().includes(searchQuery.toLowerCase())
) : [];

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch (error) {
      return "Invalid Date";
    }
  };

  return (
    <motion.div 
      className="p-6 min-h-screen"
      style={{ 
        background: "linear-gradient(to bottom right, #f8faff, #edf2ff, #e6eeff)"
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <Users size={32} className="text-blue-600" />
            <span className="border-b-4 border-blue-400 pb-1">User & Role Management</span>
          </h1>
          <p className="text-gray-600 max-w-2xl">
            Manage users and roles in the system. Create new users, assign roles, and define role permissions.
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users size={18} />
              <span>Users</span>
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'roles'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Shield size={18} />
              <span>Roles</span>
            </button>
          </nav>
        </div>

        {/* Actions and Search Bar */}
        <motion.div 
          className="flex flex-col md:flex-row gap-4 mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-blue-400" />
            </div>
            <input
              type="text"
              placeholder={activeTab === 'users' ? "Search users by name, email, or role..." : "Search roles by name or description..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 w-full border border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-300 outline-none transition-all duration-200 shadow-sm"
            />
          </div>
          
          <div className="flex gap-3 shrink-0">
            {activeTab === 'users' ? (
              <motion.button
                onClick={() => setIsCreateUserModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-md"
                whileHover={{ 
                  scale: 1.03, 
                  boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3), 0 4px 6px -2px rgba(59, 130, 246, 0.15)" 
                }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                <UserPlus className="h-5 w-5" />
                <span>New User</span>
              </motion.button>
            ) : (
              <motion.button
                onClick={() => setIsCreateRoleModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-md"
                whileHover={{ 
                  scale: 1.03, 
                  boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3), 0 4px 6px -2px rgba(59, 130, 246, 0.15)" 
                }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                <ShieldPlus className="h-5 w-5" />
                <span>New Role</span>
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {activeTab === 'users' ? (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Users Table */}
              <div className="bg-white rounded-xl shadow-md border border-blue-100 overflow-hidden">
                {isLoadingUsers ? (
                  <div className="flex justify-center items-center h-64">
                    <motion.div
                      className="flex flex-col items-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="relative h-16 w-16">
                        <motion.div 
                          className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-t-blue-500 border-r-blue-300 border-b-blue-100 border-l-blue-300"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        ></motion.div>
                      </div>
                      <p className="text-gray-600 mt-4 font-medium">Loading users...</p>
                    </motion.div>
                  </div>
                ) : usersError ? (
                  <div className="flex items-center gap-3 bg-red-50 text-red-700 p-6 rounded-lg m-4">
                    <AlertCircle className="h-6 w-6 text-red-500" />
                    <div>
                      <p className="font-medium">Error loading users</p>
                      <p className="text-sm mt-1">Please try again or check your connection</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="ml-auto bg-white text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-sm flex items-center gap-2"
                      onClick={() => refetchUsers()}
                    >
                      <RefreshCw size={14} />
                      <span>Retry</span>
                    </motion.button>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <motion.div 
                      className="h-24 w-24 mb-6 bg-blue-50 text-blue-400 rounded-full flex items-center justify-center"
                      animate={{ scale: [0.9, 1.1, 1] }}
                      transition={{ duration: 1.5, times: [0, 0.5, 1] }}
                    >
                      <Users className="h-12 w-12" />
                    </motion.div>
                    <h3 className="text-xl font-medium text-gray-800 mb-2">No users found</h3>
                    <p className="text-gray-500 max-w-md mb-6">
                      {searchQuery 
                        ? `No users match your search query "${searchQuery}". Try a different search or create a new user.`
                        : "There are no users in the system yet. Start by creating a new user."}
                    </p>
                    <motion.button
                      onClick={() => setIsCreateUserModalOpen(true)}
                      className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-md"
                      whileHover={{ 
                        scale: 1.03, 
                        boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3), 0 4px 6px -2px rgba(59, 130, 246, 0.15)" 
                      }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    >
                      <UserPlus className="h-5 w-5" />
                      <span>Create New User</span>
                    </motion.button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-blue-100">
                      <thead className="bg-blue-50">
                        <tr>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                            Name
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                            Email
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                            Role
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                            Created At
                          </th>
                          <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-blue-800 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-blue-50">
                        {filteredUsers.map((user: User, index: number) => (
                          <motion.tr 
                            key={user.id} 
                            className="hover:bg-blue-50 transition-colors duration-150"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                <User className="h-4 w-4" />
                              </div>
                              {user.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {user.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                <Shield className="w-3 h-3 mr-1" />
                                {user.role.name}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {formatDate(user.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end gap-2">
                                <button 
                                  className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors"
                                  title="Edit User"
                                >
                                  <FileText className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="roles"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Roles Table */}
              <div className="bg-white rounded-xl shadow-md border border-blue-100 overflow-hidden">
                {isLoadingRoles ? (
                  <div className="flex justify-center items-center h-64">
                    <motion.div
                      className="flex flex-col items-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="relative h-16 w-16">
                        <motion.div 
                          className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-t-blue-500 border-r-blue-300 border-b-blue-100 border-l-blue-300"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        ></motion.div>
                      </div>
                      <p className="text-gray-600 mt-4 font-medium">Loading roles...</p>
                    </motion.div>
                  </div>
                ) : rolesError ? (
                  <div className="flex items-center gap-3 bg-red-50 text-red-700 p-6 rounded-lg m-4">
                    <AlertCircle className="h-6 w-6 text-red-500" />
                    <div>
                      <p className="font-medium">Error loading roles</p>
                      <p className="text-sm mt-1">Please try again or check your connection</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="ml-auto bg-white text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-sm flex items-center gap-2"
                      onClick={() => refetchRoles()}
                    >
                      <RefreshCw size={14} />
                      <span>Retry</span>
                    </motion.button>
                  </div>
                ) : filteredRoles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <motion.div 
                      className="h-24 w-24 mb-6 bg-blue-50 text-blue-400 rounded-full flex items-center justify-center"
                      animate={{ scale: [0.9, 1.1, 1] }}
                      transition={{ duration: 1.5, times: [0, 0.5, 1] }}
                    >
                      <Shield className="h-12 w-12" />
                    </motion.div>
                    <h3 className="text-xl font-medium text-gray-800 mb-2">No roles found</h3>
                    <p className="text-gray-500 max-w-md mb-6">
                      {searchQuery 
                        ? `No roles match your search query "${searchQuery}". Try a different search or create a new role.`
                        : "There are no roles in the system yet. Start by creating a new role."}
                    </p>
                    <motion.button
                      onClick={() => setIsCreateRoleModalOpen(true)}
                      className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-md"
                      whileHover={{ 
                        scale: 1.03, 
                        boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3), 0 4px 6px -2px rgba(59, 130, 246, 0.15)" 
                      }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    >
                      <ShieldPlus className="h-5 w-5" />
                      <span>Create New Role</span>
                    </motion.button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-blue-100">
                      <thead className="bg-blue-50">
                        <tr>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                            Role Name
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                            Description
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                            Created At
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                            Updated At
                          </th>
                          <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-blue-800 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-blue-50">
                        {filteredRoles.map((role: Role, index: number) => (
                          <motion.tr 
                            key={role.id} 
                            className="hover:bg-blue-50 transition-colors duration-150"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                <Shield className="h-4 w-4" />
                              </div>
                              {role.name}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                              {role.description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {formatDate(role.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {formatDate(role.updatedAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end gap-2">
                                <button 
                                  className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors"
                                  title="Edit Role"
                                >
                                  <FileText className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* User Modal */}
      <AnimatePresence>
        <CreateUserModal 
          isOpen={isCreateUserModalOpen}
          onClose={() => setIsCreateUserModalOpen(false)}
          roles={rolesData || []}
        />
      </AnimatePresence>

      {/* Role Modal */}
      <AnimatePresence>
        <CreateRoleModal 
          isOpen={isCreateRoleModalOpen}
          onClose={() => setIsCreateRoleModalOpen(false)}
        />
      </AnimatePresence>
    </motion.div>
  );
}