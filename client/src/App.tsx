import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Login from "./components/pages/Auth/Login";
import Home from "./components/pages/Home";
import StandardPage from "./components/pages/standard/standard";
import AppLayout from "./components/layout/AppLayout";
import ActivityLog from "./components/pages/ActivityLog/ActivityLog";
import NotFound from "./components/common/not"; 
import BatchPage from "./components/pages/Batch/batch";
import AddBatch from "./components/ui/batch/addBatch";
import Profile from "./components/pages/User/Profile";
import Settings from "./components/pages/Settings/Settings";
import Dashboard from "./components/pages/Dashboard/dashboard";
import UserManagement from "./components/pages/User/User-Management";
import BatchComplianceReview from "./components/pages/Review/BatchList";
import PermissionedRoute from "./hooks/Route/permissionedroute";
import SecureRoute from "./components/layout/secureroute";
import { RouteProvider } from "./context/RouteProvider";
import Unauthorized from "./components/material/Unauthorized";

const App = () => {
  return (
    <RouteProvider>
    <Router>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Home />} />
        <Route path="/unauthorized" element={<Unauthorized />} /> 
        
        <Route element={<AppLayout />}>
          <Route 
            path="/dashboard" 
            element={
              <PermissionedRoute
                path="/dashboard"
                element={<SecureRoute element={<Dashboard />} permissionKey="view_dashboard" />}
                name="Dashboard"
                permissionKey="view_dashboard"
              />
            }
          />
          <Route
            path="/standards"
            element={
              <PermissionedRoute
                path="/standards"
                element={<SecureRoute element={<StandardPage />} permissionKey="manage_standards" />}
                name="Standards Management"
                description="View and manage product standards"
                permissionKey="manage_standards"
              />
            }
          />
          <Route
            path="/activity-logs" 
            element={
              <PermissionedRoute
                path="/activity-logs"
                element={<SecureRoute element={<ActivityLog />} permissionKey="view_activity_logs" />}
                name="Activity Logs"
                description="View system activity logs"
                permissionKey="view_activity_logs"
              />
            }
          />
          <Route
            path="/batches"
            element={
              <PermissionedRoute
                path="/batches"
                element={<SecureRoute element={<BatchPage />} permissionKey="view_batches" />}
                name="Batches"
                description="View and manage product batches"
                permissionKey="view_batches"
              />
            }
          />
          <Route
            path="/create-batch"
            element={
              <PermissionedRoute
                path="/create-batch"
                element={<SecureRoute element={<AddBatch />} permissionKey="create_batch" />}
                name="Create Batch"
                description="Create new product batches"
                permissionKey="create_batch"
              />
            }
          />
          <Route
            path="/profile"
            element={
              <PermissionedRoute
                path="/profile"
                element={<SecureRoute element={<Profile/>} permissionKey="view_profile" />}
                name="User Profile"
                permissionKey="view_profile"
              />
            }
          />
          <Route
            path="/settings"
            element={
              <PermissionedRoute
                path="/settings"
                element={<SecureRoute element={<Settings />} permissionKey="manage_settings" />}
                name="System Settings" 
                permissionKey="manage_settings"
              />
            }
          />
          <Route
            path="/access-control"
            element={
              <PermissionedRoute
                path="/access-control"
                element={<SecureRoute element={<UserManagement />} permissionKey="manage_users" />}
                name="User Management"
                description="Manage users and permissions"
                permissionKey="manage_users"
              />
            }
          />
          <Route
            path="/compare-batch"
            element={
              <PermissionedRoute
                path="/compare-batch"
                element={<SecureRoute element={<BatchComplianceReview />} permissionKey="review_batches" />}
                name="Batch Review"
                description="Review and approve batch compliance"
                permissionKey="review_batches"
              />
            }
          />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
    </RouteProvider>
  );
};

export default App;