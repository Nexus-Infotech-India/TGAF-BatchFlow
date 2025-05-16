import React, { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, X, User, Mail, Key, Shield, ChevronDown, Loader2, Check } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { API_ROUTES } from "../../../../utils/api";

interface Role {
  id: string;
  name: string;
  description?: string;
}

interface UserFormData {
  name: string;
  email: string;
  password: string;
  roleId: string;
}

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  roles: Role[];
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose, roles }) => {
  const [userFormData, setUserFormData] = useState<UserFormData>({
    name: "",
    email: "",
    password: "",
    roleId: ""
  });

  const queryClient = useQueryClient();
  const authToken = localStorage.getItem("authToken");

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: UserFormData) => {
      const response = await axios.post(
        API_ROUTES.AUTH.REGISTER,
        userData,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onClose();
      setUserFormData({
        name: "",
        email: "",
        password: "",
        roleId: ""
      });
    }
  });

  // Handle user form input changes
  const handleUserFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle create user form submission
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(userFormData);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 backdrop-blur bg-opacity-50 flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-xl shadow-xl max-w-md w-full"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", duration: 0.5 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-600" />
              Create New User
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 rounded-full p-1 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleCreateUser}>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-blue-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={userFormData.name}
                    onChange={handleUserFormChange}
                    className="pl-10 pr-4 py-3 w-full border border-blue-100 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-300 outline-none"
                    placeholder="Enter user's full name"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-blue-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={userFormData.email}
                    onChange={handleUserFormChange}
                    className="pl-10 pr-4 py-3 w-full border border-blue-100 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-300 outline-none"
                    placeholder="Enter email address"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-5 w-5 text-blue-400" />
                  </div>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={userFormData.password}
                    onChange={handleUserFormChange}
                    className="pl-10 pr-4 py-3 w-full border border-blue-100 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-300 outline-none"
                    placeholder="Create a password"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="roleId" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Shield className="h-5 w-5 text-blue-400" />
                  </div>
                  <select
                    id="roleId"
                    name="roleId"
                    value={userFormData.roleId}
                    onChange={handleUserFormChange}
                    className="pl-10 pr-4 py-3 w-full border border-blue-100 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-300 outline-none"
                    required
                  >
                    <option value="">Select a role</option>
                    {roles?.map((role: Role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
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
                  disabled={createUserMutation.isPending}
                >
                  {createUserMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {createUserMutation.isPending ? "Creating..." : "Create User"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CreateUserModal;