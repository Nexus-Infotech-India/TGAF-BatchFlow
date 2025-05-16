import React, { useEffect, useState } from 'react';
import { dashboardService } from '../dashboard/service';
import { motion } from 'framer-motion';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  totalActivities: number;
  batchesCreated: number;
  batchesReviewed: number;
}

const UserActivity: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserActivity = async () => {
      try {
        const response = await dashboardService.getUserActivity();
        setUsers(response.data.users);
      } catch (err: any) {
        setError(err.message || 'Failed to load user activity data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserActivity();
  }, []);

  if (isLoading) return (
    <div className="flex items-center justify-center h-64 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl shadow-sm">
      <motion.div 
        className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
  
  if (error) return (
    <div className="p-6 bg-red-50 rounded-xl shadow-sm border border-red-100 text-red-500">
      {error}
    </div>
  );
  
  if (!users || users.length === 0) return (
    <div className="p-6 bg-blue-50 rounded-xl shadow-sm border border-blue-100">
      No user activity data available
    </div>
  );

  return (
    <motion.div 
      className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-400 text-white">
        <motion.h2 
          className="text-2xl font-bold"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          User Activity
        </motion.h2>
      </div>
      
      <div className="p-6">
        <motion.div 
          className="bg-white rounded-lg shadow-md overflow-hidden"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-500 to-blue-400 text-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Activities
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Reviewed
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user, index) => (
                  <motion.tr 
                    key={user.id}
                    className="hover:bg-blue-50 transition-colors duration-150"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 + (index * 0.05) }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                          {user.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : ''}
                        ${user.role === 'MANAGER' ? 'bg-blue-100 text-blue-800' : ''}
                        ${user.role === 'OPERATOR' ? 'bg-green-100 text-green-800' : ''}
                        ${user.role === 'VIEWER' ? 'bg-gray-100 text-gray-800' : ''}
                      `}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <motion.div 
                          className="h-2 bg-blue-500 rounded-full mr-2"
                          style={{ width: `${Math.min(user.totalActivities * 5, 100)}px` }}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(user.totalActivities * 5, 100)}px` }}
                          transition={{ duration: 0.8, delay: 0.3 + (index * 0.05) }}
                        />
                        <span className="text-sm text-gray-900">{user.totalActivities}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        <span className="text-indigo-600 font-medium">{user.batchesCreated}</span>
                        {user.batchesCreated > 0 && (
                          <svg className="w-4 h-4 ml-1 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v4H5a1 1 0 100 2h4v4a1 1 0 102 0v-4h4a1 1 0 100-2h-4V4a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        <span className="text-blue-600 font-medium">{user.batchesReviewed}</span>
                        {user.batchesReviewed > 0 && (
                          <svg className="w-4 h-4 ml-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default UserActivity;