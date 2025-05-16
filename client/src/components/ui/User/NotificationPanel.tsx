import React from "react";
import { motion } from "framer-motion";
import { Bell, ArrowRight, CheckCircle, AlertTriangle, Info } from "lucide-react";

interface NotificationPanelProps {
  notifications: any[];
  timeAgo: (dateString: string) => string;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ notifications, timeAgo }) => {
  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success": return <CheckCircle size={18} className="text-green-500" />;
      case "alert": return <AlertTriangle size={18} className="text-amber-500" />;
      case "info": 
      default: return <Info size={18} className="text-blue-500" />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100"
    >
      <div className="p-5 bg-gradient-to-r from-amber-50 to-white border-b border-gray-100">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
            <Bell size={18} className="text-amber-600" />
            Unread Notifications
          </h2>
          <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
            {notifications?.length || 0} new
          </span>
        </div>
      </div>
      
      <div className="p-3">
        {notifications?.length > 0 ? (
          <div className="space-y-2">
            {notifications.map((notification: any, index: number) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="p-3 rounded-lg bg-amber-50/50 hover:bg-amber-50 border border-amber-100/50 transition-colors"
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div>
                    <p className="text-gray-700 text-sm">{notification.message}</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-500">{timeAgo(notification.createdAt)}</span>
                      {notification.batchId && (
                        <a 
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          href={`/batches/${notification.batchId}`}
                        >
                          <span>View</span>
                          <ArrowRight size={10} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-6">No unread notifications</p>
        )}
      </div>
    </motion.div>
  );
};

export default NotificationPanel;