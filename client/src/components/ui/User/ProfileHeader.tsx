import React from "react";
import { motion } from "framer-motion";
import { User, Shield, Calendar, Edit, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProfileHeaderProps {
  userData: any;
  formatDate: (dateString: string) => string;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ userData, formatDate }) => {
  const navigate = useNavigate();
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="overflow-hidden rounded-2xl shadow-lg mb-8 bg-gradient-to-br from-white/95 to-blue-50/90 backdrop-blur-md border border-blue-100/50"
    >
      <div className="relative">
        {/* Decorative header with adjusted height */}
        <div className="absolute inset-0 h-48 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-500">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        </div>
        
        {/* Profile content with improved padding */}
        <div className="relative pt-24 pb-8 px-6 md:px-10">
          <div className="flex flex-col md:flex-row md:items-end gap-6">
            {/* Avatar */}
            <div className="flex justify-center md:justify-start">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white border-4 border-white shadow-xl">
                <User size={48} />
              </div>
            </div>
            
            {/* User info */}
            <div className="flex flex-col md:flex-row items-center md:items-end justify-between flex-grow">
              <div className="text-center md:text-left mb-4 md:mb-0">
                <motion.h1 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-blue-800"
                >
                  {userData?.name}
                </motion.h1>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-gray-600 flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mt-2"
                >
                  <div className="flex items-center justify-center md:justify-start gap-1">
                    <Shield size={14} className="text-blue-600" />
                    <span>{userData?.role?.name}</span>
                  </div>
                  <div className="flex items-center justify-center md:justify-start gap-1">
                    <Calendar size={14} className="text-blue-600" />
                    <span>Member since {formatDate(userData?.createdAt)}</span>
                  </div>
                </motion.div>
              </div>
              
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg flex items-center gap-2 hover:bg-blue-200 transition-colors"
                onClick={() => navigate("/settings")}
              >
                <Edit size={16} />
                <span>Edit Profile</span>
              </motion.button>
            </div>
          </div>
          
          {/* Permissions section with improved colors */}
          <Permissions permissions={userData?.role?.permissions} />
        </div>
      </div>
    </motion.div>
  );
};

interface PermissionsProps {
  permissions: any[];
}

const Permissions: React.FC<PermissionsProps> = ({ permissions }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="mt-8 bg-white/70 rounded-xl p-5 shadow-sm border border-blue-100"
    >
      <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-4">
        <Shield size={18} className="text-blue-600" />
        Permissions & Access
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {permissions?.map((permission: any, index: number) => (
          <motion.div
            key={`${permission.action}-${permission.resource}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index }}
            className="bg-blue-50/80 text-blue-900 px-4 py-2 rounded-lg border border-blue-100 flex items-center gap-2"
          >
            <div className="bg-blue-200/60 rounded-full p-1">
              <CheckCircle size={14} className="text-blue-700" />
            </div>
            <span className="text-sm capitalize">
              {permission.action.toLowerCase().replace("_", " ")} {permission.resource.toLowerCase()}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default ProfileHeader;