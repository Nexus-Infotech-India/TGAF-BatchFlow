import React from "react";
import { motion } from "framer-motion";
import { Activity, ArrowRight } from "lucide-react";

interface RecentActivitiesProps {
  activities: any[];
  timeAgo: (dateString: string) => string;
  getActivityColor: (action: string) => string;
}

const RecentActivities: React.FC<RecentActivitiesProps> = ({ 
  activities, 
  timeAgo, 
  getActivityColor 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100"
    >
      <div className="bg-gradient-to-r from-gray-50 to-white p-5 border-b border-gray-100">
        <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-800">
          <Activity size={20} className="text-blue-600" />
          Recent Activities
        </h2>
      </div>
      <div className="p-5">
        {activities?.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity: any, index: number) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex gap-4 items-start p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className={`flex-shrink-0 w-10 h-10 rounded-full ${getActivityColor(activity.action)} flex items-center justify-center`}>
                  <Activity size={16} />
                </div>
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <h4 className="font-medium text-gray-800">{activity.action.replace("_", " ")}</h4>
                    <span className="text-xs text-gray-500">{timeAgo(activity.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{activity.details}</p>
                  {activity.batchId && (
                    <a 
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1"
                      href={`/batches/${activity.batchId}`}
                    >
                      <span>View Batch</span>
                      <ArrowRight size={12} />
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No recent activities found</p>
        )}
      </div>
    </motion.div>
  );
};

export default RecentActivities;