
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import api, { API_ROUTES } from "../../../utils/api";

import LoadingState from "../../ui/User/LoadingState";
import ErrorState from "../../ui/User/ErrorState";
import ProfileHeader from "../../ui/User/ProfileHeader";
import RecentActivities from "../../ui/User/RecentActivities";
import BatchList from "../../ui/User/BatchList";
import NotificationPanel from "../../ui/User/NotificationPanel";
import StandardsList from "../../ui/User/StandardList";
import AccountInfo from "../../ui/User/AccountInfo";

// Import components


const Profile = () => {
  const { data: userData, isLoading, isError, refetch } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      const response = await api.get(API_ROUTES.AUTH.CURRENT_USER, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.user;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  // Format dates for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "PPP");
  };
  
  const timeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  // Activity color mapping
  const getActivityColor = (action: string) => {
    switch (action) {
      case "LOGIN": return "bg-green-100 text-green-700";
      case "CREATE_BATCH": return "bg-blue-100 text-blue-700";
      case "APPROVE_BATCH": return "bg-purple-100 text-purple-700";
      case "REJECT_BATCH": return "bg-red-100 text-red-700";
      case "CHANGE_PASSWORD": return "bg-amber-100 text-amber-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Top profile section */}
      <ProfileHeader userData={userData} formatDate={formatDate} />
      
      {/* Content sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent activities */}
          <RecentActivities 
            activities={userData.recentActivity || []} 
            timeAgo={timeAgo}
            getActivityColor={getActivityColor}
          />
          
          {/* Batches created */}
          <BatchList 
            title="Recent Batches Created" 
            icon="created"
            batches={userData.recentBatchesCreated || []} 
            timeAgo={timeAgo} 
          />
          
          {/* Batches reviewed */}
          <BatchList 
            title="Recent Batches Reviewed" 
            icon="reviewed"
            batches={userData.recentBatchesReviewed || []} 
            timeAgo={timeAgo} 
          />
        </div>
        
        {/* Right column */}
        <div className="space-y-6">
          {/* Notifications */}
          <NotificationPanel 
            notifications={userData.unreadNotifications || []} 
            timeAgo={timeAgo}
          />
          
          {/* Standards Created */}
          <StandardsList standards={userData.recentStandardsCreated || []} />
          
          {/* Account Info */}
          <AccountInfo userData={userData} formatDate={formatDate} />
        </div>
      </div>
    </div>
  );
};

export default Profile;