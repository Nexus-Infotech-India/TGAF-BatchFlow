import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './components/pages/Auth/Login';
import Home from './components/pages/Home';
import StandardPage from './components/pages/standard/standard';
import AppLayout from './components/layout/AppLayout';
import ActivityLog from './components/pages/ActivityLog/ActivityLog';
import NotFound from './components/common/not';
import BatchPage from './components/pages/Batch/batch';
import AddBatch from './components/ui/batch/addBatch';
import Profile from './components/pages/User/Profile';
import Settings from './components/pages/Settings/Settings';
import UserManagement from './components/pages/User/User-Management';
import BatchComplianceReview from './components/pages/Review/BatchList';
import PermissionedRoute from './hooks/Route/permissionedroute';
import SecureRoute from './components/layout/secureroute';
import { RouteProvider } from './context/RouteProvider';
import Unauthorized from './components/material/Unauthorized';
import TrainingManage from './components/pages/training/training-manage';
import TrainingRespond from './components/layout/TrainingRespond';
import TrainingCalendar from './components/pages/training/Calender';
import DocumentLibrary from './components/ui/training/Document/documentlibrary';
import Auditmanage from './components/pages/Audit/Auditmanage';
import TrainingDashboard from './components/pages/Dashboard/trainingdashboard';
import AuditCalendar from './components/pages/Audit/AuditCalender';
import EditTraining from './components/ui/training/EditTraining';
import Dashboard from './components/pages/Dashboard/batchdashboard';
import AuditFindingCreation from './components/ui/Audit/AuditFindings';
import AuditDashboard from './components/pages/Dashboard/auditdashboard';
import BatchVerification from './components/pages/Batch/batchverification';
import PurchaseOrder from './components/ui/Order/PurchaseOrder';
import PurchaseOrderList from './components/pages/Order/PurchaseOrder';
import Stock from './components/pages/Stock/Stock';
import CleaningRawMaterialList from './components/pages/cleanning/allItems';
import TransactionalLog from './components/pages/Order/TransactionalLog';
import ProcessingList from './components/pages/processing/processingList';
import RawDashboard from './components/pages/Dashboard/rawDashboard';
import RMQualityReport from './components/pages/QualityReport/RMQualityReport';

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
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Home />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/training/respond" element={<TrainingRespond />} />

          <Route element={<AppLayout />}>
            {/* ==================== COMMON ROUTES ==================== */}

            {/* Dashboards */}
            <Route
              path="/operation-dashboard"
              element={
                <PermissionedRoute
                  path="/operation-dashboard"
                  element={
                    <SecureRoute
                      element={<Dashboard />}
                      permissionKey="view_operation_dashboard"
                    />
                  }
                  name="Operation Dashboard"
                  description="View operation metrics and batch statistics"
                  permissionKey="view_operation_dashboard"
                />
              }
            />

            <Route
              path="/trainings-dashboard"
              element={
                <PermissionedRoute
                  path="/training-dashboard"
                  element={
                    <SecureRoute
                      element={<TrainingDashboard />}
                      permissionKey="view_training_dashboard"
                    />
                  }
                  name="Training Dashboard"
                  description="View training statistics and metrics"
                  permissionKey="view_training_dashboard"
                />
              }
            />

            <Route
              path="/audit-dashboard"
              element={
                <PermissionedRoute
                  path="/audit-dashboard"
                  element={
                    <SecureRoute
                      element={<AuditDashboard />}
                      permissionKey="view_audit_dashboard"
                    />
                  }
                  name="Audit Dashboard"
                  description="View audit statistics and metrics"
                  permissionKey="view_audit_dashboard"
                />
              }
            />

            {/* Standards and Documents */}
            <Route
              path="/standards"
              element={
                <PermissionedRoute
                  path="/standards"
                  element={
                    <SecureRoute
                      element={<StandardPage />}
                      permissionKey="manage_standards"
                    />
                  }
                  name="Standards Management"
                  description="View and manage product standards and specifications"
                  permissionKey="manage_standards"
                />
              }
            />

            <Route
              path="/document-library"
              element={
                <PermissionedRoute
                  path="/document-library"
                  element={
                    <SecureRoute
                      element={<DocumentLibrary />}
                      permissionKey="manage_documents"
                    />
                  }
                  name="Document Library"
                  description="View and manage training documents and resources"
                  permissionKey="manage_documents"
                />
              }
            />

            {/* System Management */}
            <Route
              path="/activity-logs"
              element={
                <PermissionedRoute
                  path="/activity-logs"
                  element={
                    <SecureRoute
                      element={<ActivityLog />}
                      permissionKey="view_activity_logs"
                    />
                  }
                  name="Activity Logs"
                  description="View system activity logs and user actions"
                  permissionKey="view_activity_logs"
                />
              }
            />

            <Route
              path="/profile"
              element={
                <PermissionedRoute
                  path="/profile"
                  element={
                    <SecureRoute
                      element={<Profile />}
                      permissionKey="view_profile"
                    />
                  }
                  name="User Profile"
                  description="View and manage personal profile information"
                  permissionKey="view_profile"
                />
              }
            />

            <Route
              path="/settings"
              element={
                <PermissionedRoute
                  path="/settings"
                  element={
                    <SecureRoute
                      element={<Settings />}
                      permissionKey="manage_settings"
                    />
                  }
                  name="System Settings"
                  description="Configure system settings and preferences"
                  permissionKey="manage_settings"
                />
              }
            />

            <Route
              path="/access-control"
              element={
                <PermissionedRoute
                  path="/access-control"
                  element={
                    <SecureRoute
                      element={<UserManagement />}
                      permissionKey="manage_users"
                    />
                  }
                  name="Access Control"
                  description="Manage users, roles and system permissions"
                  permissionKey="manage_users"
                />
              }
            />

            {/* ==================== BATCH ROUTES ==================== */}

            <Route
              path="/batches"
              element={
                <PermissionedRoute
                  path="/batches"
                  element={
                    <SecureRoute
                      element={<BatchPage />}
                      permissionKey="view_batches"
                    />
                  }
                  name="Batch Management"
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
                  element={
                    <SecureRoute
                      element={<AddBatch />}
                      permissionKey="create_batch"
                    />
                  }
                  name="Create Batch"
                  description="Create new product batches"
                  permissionKey="create_batch"
                />
              }
            />

            <Route
              path="/batches/verification"
              element={
                <PermissionedRoute
                  path="/batches/verification"
                  element={
                    <SecureRoute
                      element={<BatchVerification />}
                      permissionKey="verify_batches"
                    />
                  }
                  name="Batch Verification"
                  description="Verify and validate batch compliance"
                  permissionKey="verify_batches"
                />
              }
            />

            <Route
              path="/compare-batch"
              element={
                <PermissionedRoute
                  path="/compare-batch"
                  element={
                    <SecureRoute
                      element={<BatchComplianceReview />}
                      permissionKey="review_batches"
                    />
                  }
                  name="Batch Compliance Review"
                  description="Review and approve batch compliance standards"
                  permissionKey="review_batches"
                />
              }
            />
            <Route
              path="/raw/quality-report"
              element={
                <PermissionedRoute
                  path="/raw/quality-report"
                  element={
                    <SecureRoute
                      element={<RMQualityReport />}
                      permissionKey="manage_rm_quality_report"
                    />
                  }
                  name="RM Quality Report"
                  description="Manage raw material quality reports"
                  permissionKey="manage_rm_quality_report"
                />
              }
            />

            {/* ==================== TRAINING ROUTES ==================== */}

            <Route
              path="/trainings"
              element={
                <PermissionedRoute
                  path="/trainings"
                  element={
                    <SecureRoute
                      element={<TrainingManage />}
                      permissionKey="manage_trainings"
                    />
                  }
                  name="Training Management"
                  description="Manage training sessions and participants"
                  permissionKey="manage_trainings"
                />
              }
            />

            <Route
              path="/trainings/create"
              element={
                <PermissionedRoute
                  path="/trainings/create"
                  element={
                    <SecureRoute
                      element={<TrainingManage />}
                      permissionKey="create_training"
                    />
                  }
                  name="Create Training"
                  description="Create new training sessions"
                  permissionKey="create_training"
                />
              }
            />

            <Route
              path="/trainings/:id"
              element={
                <PermissionedRoute
                  path="/trainings/:id"
                  element={
                    <SecureRoute
                      element={<TrainingManage />}
                      permissionKey="view_training_details"
                    />
                  }
                  name="Training Details"
                  description="View training session details and progress"
                  permissionKey="view_training_details"
                />
              }
            />

            <Route
              path="/trainings/edit/:trainingId"
              element={
                <PermissionedRoute
                  path="/trainings/edit/:trainingId"
                  element={
                    <SecureRoute
                      element={<EditTraining />}
                      permissionKey="edit_training"
                    />
                  }
                  name="Edit Training"
                  description="Edit training session details"
                  permissionKey="edit_training"
                />
              }
            />

            <Route
              path="/training-calender"
              element={
                <PermissionedRoute
                  path="/training-calender"
                  element={
                    <SecureRoute
                      element={<TrainingCalendar />}
                      permissionKey="view_training_calendar"
                    />
                  }
                  name="Training Calendar"
                  description="View training schedule and calendar"
                  permissionKey="view_training_calendar"
                />
              }
            />

            {/* ==================== AUDIT ROUTES ==================== */}

            <Route
              path="/audits"
              element={
                <PermissionedRoute
                  path="/audits"
                  element={
                    <SecureRoute
                      element={<Auditmanage />}
                      permissionKey="manage_audits"
                    />
                  }
                  name="Audit Management"
                  description="View and manage audit processes"
                  permissionKey="manage_audits"
                />
              }
            />

            <Route
              path="/audits/new"
              element={
                <PermissionedRoute
                  path="/audits/new"
                  element={
                    <SecureRoute
                      element={<Auditmanage />}
                      permissionKey="create_audit"
                    />
                  }
                  name="Create Audit"
                  description="Create a new audit process"
                  permissionKey="create_audit"
                />
              }
            />

            <Route
              path="/audits/:id"
              element={
                <PermissionedRoute
                  path="/audits/:id"
                  element={
                    <SecureRoute
                      element={<Auditmanage />}
                      permissionKey="view_audit_details"
                    />
                  }
                  name="Audit Details"
                  description="View audit details and progress"
                  permissionKey="view_audit_details"
                />
              }
            />

            <Route
              path="/audits/edit/:id"
              element={
                <PermissionedRoute
                  path="/audits/edit/:id"
                  element={
                    <SecureRoute
                      element={<Auditmanage />}
                      permissionKey="edit_audit"
                    />
                  }
                  name="Edit Audit"
                  description="Edit audit details and settings"
                  permissionKey="edit_audit"
                />
              }
            />

            <Route
              path="/audits/statistics"
              element={
                <PermissionedRoute
                  path="/audits/statistics"
                  element={
                    <SecureRoute
                      element={<Auditmanage />}
                      permissionKey="view_audit_statistics"
                    />
                  }
                  name="Audit Statistics"
                  description="View audit statistics and analytics"
                  permissionKey="view_audit_statistics"
                />
              }
            />

            <Route
              path="/audits/checklist"
              element={
                <PermissionedRoute
                  path="/audits/checklist"
                  element={
                    <SecureRoute
                      element={<Auditmanage />}
                      permissionKey="manage_audit_checklist"
                    />
                  }
                  name="Pre-Audit Checklist"
                  description="Create and manage pre-audit checklists"
                  permissionKey="manage_audit_checklist"
                />
              }
            />

            <Route
              path="/audits/checklist/:auditId"
              element={
                <PermissionedRoute
                  path="/audits/checklist/:auditId"
                  element={
                    <SecureRoute
                      element={<Auditmanage />}
                      permissionKey="view_audit_checklist"
                    />
                  }
                  name="Audit Checklist"
                  description="View and manage audit-specific checklist"
                  permissionKey="view_audit_checklist"
                />
              }
            />

            <Route
              path="/audits/findings"
              element={
                <PermissionedRoute
                  path="/audits/findings"
                  element={
                    <SecureRoute
                      element={<AuditFindingCreation auditId={''} />}
                      permissionKey="manage_audit_findings"
                    />
                  }
                  name="Audit Findings"
                  description="Create and manage audit findings"
                  permissionKey="manage_audit_findings"
                />
              }
            />

            <Route
              path="/audit/calender"
              element={
                <PermissionedRoute
                  path="/audit/calender"
                  element={
                    <SecureRoute
                      element={<AuditCalendar />}
                      permissionKey="view_audit_calendar"
                    />
                  }
                  name="Audit Calendar"
                  description="View audit schedule and calendar"
                  permissionKey="view_audit_calendar"
                />
              }
            />

            {/* Inspection Checklist Routes */}
            <Route
              path="/audits/inspection-checklist"
              element={
                <PermissionedRoute
                  path="/audits/inspection-checklist"
                  element={
                    <SecureRoute
                      element={<Auditmanage />}
                      permissionKey="manage_inspection_checklist"
                    />
                  }
                  name="Inspection Checklists"
                  description="View and manage inspection checklists"
                  permissionKey="manage_inspection_checklist"
                />
              }
            />

            <Route
              path="/audits/inspection-checklist/create"
              element={
                <PermissionedRoute
                  path="/audits/inspection-checklist/create"
                  element={
                    <SecureRoute
                      element={<Auditmanage />}
                      permissionKey="create_inspection_checklist"
                    />
                  }
                  name="Create Inspection Checklist"
                  description="Create new inspection checklist"
                  permissionKey="create_inspection_checklist"
                />
              }
            />

            <Route
              path="/audits/:auditId/inspection-checklist/create"
              element={
                <PermissionedRoute
                  path="/audits/:auditId/inspection-checklist/create"
                  element={
                    <SecureRoute
                      element={<Auditmanage />}
                      permissionKey="create_audit_inspection_checklist"
                    />
                  }
                  name="Create Audit Inspection Checklist"
                  description="Create inspection checklist for specific audit"
                  permissionKey="create_audit_inspection_checklist"
                />
              }
            />

            {/* ==================== RAW MATERIAL ROUTES ==================== */}

            <Route
              path="/raw/purchase-order"
              element={
                <PermissionedRoute
                  path="/raw/purchase-order"
                  element={
                    <SecureRoute
                      element={<PurchaseOrder />}
                      permissionKey="manage_purchase_order" // unified
                    />
                  }
                  name="Purchase order"
                  description="View and manage purchase orders for raw materials"
                  permissionKey="manage_purchase_order" // unified
                />
              }
            />

            <Route
              path="/raw/purchase-history"
              element={
                <PermissionedRoute
                  path="/purchase-history"
                  element={
                    <SecureRoute
                      element={<PurchaseOrderList />}
                      permissionKey="manage_purchase_history"
                    />
                  }
                  name="Purchase History"
                  description="View and manage all purchase history"
                  permissionKey="manage_purchase_history"
                />
              }
            />

            <Route
              path="/stock-distribution"
              element={
                <PermissionedRoute
                  path="/stock-distribution"
                  element={
                    <SecureRoute
                      element={<Stock />}
                      permissionKey="view_stock_distribution"
                    />
                  }
                  name="Stock Distribution"
                  description="Visualize current stock distribution across warehouses"
                  permissionKey="view_stock_distribution"
                />
              }
            />

            <Route
              path="/raw/cleaning-raw-materials"
              element={
                <PermissionedRoute
                  path="/raw/cleaning-raw-materials"
                  element={
                    <SecureRoute
                      element={<CleaningRawMaterialList />}
                      permissionKey="manage_cleaning_rawmaterials"
                    />
                  }
                  name="Cleaning Raw Materials"
                  description="View all received raw materials for cleaning"
                  permissionKey="manage_cleaning_rawmaterials"
                />
              }
            />

            <Route
              path="/raw/transaction-logs"
              element={
                <PermissionedRoute
                  path="/transaction-logs"
                  element={
                    <SecureRoute
                      element={<TransactionalLog />}
                      permissionKey="view_activity_logs"
                    />
                  }
                  name="Transactional Logs"
                  description="View all transactional logs in the system"
                  permissionKey="view_activity_logs"
                />
              }
            />

            <Route
              path="/raw-dashboard"
              element={
                <PermissionedRoute
                  path="/raw-dashboard"
                  element={
                    <SecureRoute
                      element={<RawDashboard />}
                      permissionKey="manage_raw_dashboard"
                    />
                  }
                  name="Raw Dashboard"
                  description="View all cleaned raw materials ready for processing"
                  permissionKey="manage_raw_dashboard"
                />
              }
            />

            <Route
              path="/raw/processing-list"
              element={
                <PermissionedRoute
                  path="/raw/processing-list"
                  element={
                    <SecureRoute
                      element={<ProcessingList />}
                      permissionKey="manage_processing_list"
                    />
                  }
                  name="Processing List"
                  description="View all processing raw materials ready for processing"
                  permissionKey="process_raw_materials"
                />
              }
            />

            {/* 404 Not Found */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Router>
    </RouteProvider>
  );
};

export default App;
