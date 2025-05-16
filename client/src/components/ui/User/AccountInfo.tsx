import React from "react";
import { motion } from "framer-motion";
import { User, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AccountInfoProps {
  userData: any;
  formatDate: (dateString: string) => string;
}

const AccountInfo: React.FC<AccountInfoProps> = ({ userData, formatDate }) => {
  const navigate = useNavigate();
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100"
    >
      <div className="p-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
          <User size={18} className="text-gray-600" />
          Account Information
        </h2>
      </div>
      
      <div className="p-5 space-y-4">
        <div>
          <label className="text-xs text-gray-500">Email Address</label>
          <p className="text-gray-800 mt-1">{userData?.email}</p>
        </div>
        
        <div>
          <label className="text-xs text-gray-500">Role</label>
          <p className="text-gray-800 mt-1">{userData?.role?.name}</p>
        </div>
        
        <div>
          <label className="text-xs text-gray-500">Role Description</label>
          <p className="text-gray-700 text-sm mt-1">{userData?.role?.description}</p>
        </div>
        
        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <div>
            <label className="text-xs text-gray-500">Account Created</label>
            <p className="text-gray-800 mt-1">{formatDate(userData?.createdAt)}</p>
          </div>
          
          <div>
            <label className="text-xs text-gray-500">Last Updated</label>
            <p className="text-gray-800 mt-1">{formatDate(userData?.updatedAt)}</p>
          </div>
        </div>
        
        <div className="pt-4">
          <button
            onClick={() => navigate("/change-password")}
            className="w-full py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm flex items-center justify-center gap-2"
          >
            <Clock size={14} />
            <span>Change Password</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default AccountInfo;