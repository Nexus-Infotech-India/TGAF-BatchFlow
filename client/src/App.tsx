import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './components/pages/Auth/Login';

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
import { registerRoute } from './hooks/Route/routeregistery';
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
import CreateVendorPage from './components/pages/Masters/CreateVendor';
import CreateRawMaterialPage from './components/pages/Masters/CreateRawMaterial';
import Stock from './components/pages/Stock/Stock';
import CleaningRawMaterialList from './components/pages/cleanning/allItems';
import TransactionalLog from './components/pages/Order/TransactionalLog';
import DispatchToGrinding from './components/pages/processing/DispatchToGrinding';
import SFGProcessingPage from './components/pages/processing/SFGProcessingPage';
import OutboundToSFGPage from './components/pages/processing/OutboundToSFGPage';
import StockVerificationPage from './components/pages/processing/StockVerificationPage';
import MaterialTransferPage from './components/pages/packaging/MaterialTransferPage';
import CreateMaterialTransferPage from './components/pages/packaging/CreateMaterialTransferPage';
import CreateFGBatchPage from './components/pages/packaging/CreateFGBatchPage';
import ReceiveMaterialsPage from './components/pages/packaging/ReceiveMaterialsPage';
import FGProductionPage from './components/pages/packaging/FGProductionPage';
import NewFGProductionEntryPage from './components/pages/packaging/NewFGProductionEntryPage';
import ProductionOutputEntryPage from './components/pages/packaging/ProductionOutputEntryPage';
import OutboundToFGPage from './components/pages/packaging/OutboundToFGPage';
import FGVerificationPage from './components/pages/packaging/FGVerificationPage';
import RawDashboard from './components/pages/Dashboard/rawDashboard';
import RMQualityReport from './components/pages/QualityReport/RMQualityReport';
import GenerateGRN from './components/pages/GenerateGRN/GenerateGRN';
import CreateBOMPage from './components/pages/Masters/CreateBOM';
import CreateLocationPage from './components/pages/Masters/CreateLocation';
import MachineMasterPage from './components/pages/Masters/MachineMaster';
import CreateFGPackaging from './components/pages/Masters/CreateFGPackaging';

const App = () => {
  // Pre-register permissioned routes so they appear in the permission selector
  // even when those routes haven't been visited/mounted yet.
  // registerRoute is idempotent (it updates existing entries), so calling
  // here is safe and ensures the backend sync sees all pages.
  const staticRoutes = [
    { path: '/operation-dashboard', name: 'Operation Dashboard', description: 'View operation metrics and batch statistics', permissionKey: 'view_operation_dashboard' },
    { path: '/training-dashboard', name: 'Training Dashboard', description: 'View training statistics and metrics', permissionKey: 'view_training_dashboard' },
    { path: '/audit-dashboard', name: 'Audit Dashboard', description: 'View audit statistics and metrics', permissionKey: 'view_audit_dashboard' },
    { path: '/standards', name: 'Standards Management', description: 'View and manage product standards and specifications', permissionKey: 'manage_standards' },
    { path: '/document-library', name: 'Document Library', description: 'View and manage training documents and resources', permissionKey: 'manage_documents' },
    { path: '/activity-logs', name: 'Activity Logs', description: 'View system activity logs and user actions', permissionKey: 'view_activity_logs' },
    { path: '/profile', name: 'User Profile', description: 'View and manage personal profile information', permissionKey: 'view_profile' },
    { path: '/settings', name: 'System Settings', description: 'Configure system settings and preferences', permissionKey: 'manage_settings' },
    { path: '/access-control', name: 'Access Control', description: 'Manage users, roles and system permissions', permissionKey: 'manage_users' },
    { path: '/batches', name: 'Batch Management', description: 'View and manage product batches', permissionKey: 'view_batches' },
    { path: '/create-batch', name: 'Create Batch', description: 'Create new product batches', permissionKey: 'create_batch' },
    { path: '/batches/verification', name: 'Batch Verification', description: 'Verify and validate batch compliance', permissionKey: 'verify_batches' },
    { path: '/compare-batch', name: 'Batch Compliance Review', description: 'Review and approve batch compliance standards', permissionKey: 'review_batches' },
    { path: '/raw/quality-report', name: 'RM Quality Report', description: 'Manage raw material quality reports', permissionKey: 'manage_rm_quality_report' },
    { path: '/raw/generate-grn', name: 'Generate GRN', description: 'Generate GRN numbers against quality reports', permissionKey: 'manage_generate_grn' },
    { path: '/trainings', name: 'Training Management', description: 'Manage training sessions and participants', permissionKey: 'manage_trainings' },
    { path: '/trainings/create', name: 'Create Training', description: 'Create new training sessions', permissionKey: 'create_training' },
    { path: '/trainings/:id', name: 'Training Details', description: 'View training session details and progress', permissionKey: 'view_training_details' },
    { path: '/trainings/edit/:trainingId', name: 'Edit Training', description: 'Edit training session details', permissionKey: 'edit_training' },
    { path: '/training-calender', name: 'Training Calendar', description: 'View training schedule and calendar', permissionKey: 'view_training_calendar' },
    { path: '/audits', name: 'Audit Management', description: 'View and manage audit processes', permissionKey: 'manage_audits' },
    { path: '/audits/new', name: 'Create Audit', description: 'Create a new audit process', permissionKey: 'create_audit' },
    { path: '/audits/:id', name: 'Audit Details', description: 'View audit details and progress', permissionKey: 'view_audit_details' },
    { path: '/audits/edit/:id', name: 'Edit Audit', description: 'Edit audit details and settings', permissionKey: 'edit_audit' },
    { path: '/audits/statistics', name: 'Audit Statistics', description: 'View audit statistics and analytics', permissionKey: 'view_audit_statistics' },
    { path: '/audits/checklist', name: 'Pre-Audit Checklist', description: 'Create and manage pre-audit checklists', permissionKey: 'manage_audit_checklist' },
    { path: '/audits/checklist/:auditId', name: 'Audit Checklist', description: 'View and manage audit-specific checklist', permissionKey: 'view_audit_checklist' },
    { path: '/audits/findings', name: 'Audit Findings', description: 'Create and manage audit findings', permissionKey: 'manage_audit_findings' },
    { path: '/audit/calender', name: 'Audit Calendar', description: 'View audit schedule and calendar', permissionKey: 'view_audit_calendar' },
    { path: '/audits/inspection-checklist', name: 'Inspection Checklists', description: 'View and manage inspection checklists', permissionKey: 'manage_inspection_checklist' },
    { path: '/audits/inspection-checklist/create', name: 'Create Inspection Checklist', description: 'Create new inspection checklist', permissionKey: 'create_inspection_checklist' },
    { path: '/audits/:auditId/inspection-checklist/create', name: 'Create Audit Inspection Checklist', description: 'Create inspection checklist for specific audit', permissionKey: 'create_audit_inspection_checklist' },
    { path: '/raw/purchase-order', name: 'Purchase order', description: 'View and manage purchase orders for raw materials', permissionKey: 'manage_purchase_order' },
    { path: '/raw/purchase-history', name: 'Purchase History', description: 'View and manage all purchase history', permissionKey: 'manage_purchase_history' },
    { path: '/masters/vendors/create', name: 'Create Vendor', description: 'Create new vendors (master data)', permissionKey: 'manage_vendors' },
    { path: '/masters/raw-materials/create', name: 'Create Raw Material', description: 'Create raw material master data', permissionKey: 'manage_raw_materials' },
    { path: '/stock-distribution', name: 'Stock Distribution', description: 'Visualize current stock distribution across warehouses', permissionKey: 'view_stock_distribution' },
    { path: '/raw/cleaning-raw-materials', name: 'Cleaning Raw Materials', description: 'View all received raw materials for cleaning', permissionKey: 'manage_cleaning_rawmaterials' },
    { path: '/raw/transaction-logs', name: 'Transactional Logs', description: 'View all transactional logs in the system', permissionKey: 'view_activity_logs' },
    { path: '/raw-dashboard', name: 'Raw Dashboard', description: 'View all cleaned raw materials ready for processing', permissionKey: 'manage_raw_dashboard' },
    { path: '/raw/processing-list', name: 'Processing List', description: 'View all processing raw materials ready for processing', permissionKey: 'process_raw_materials' },
    { path: '/grinding/dispatch', name: 'Dispatch to Grinding', description: 'Send cleaned RM batches to grinding unit', permissionKey: 'send_cleaned_to_grinding' },
    { path: '/grinding/sfg-processing', name: 'SFG Processing', description: 'Manage processing batches and production entries', permissionKey: 'manage_processing_list' },
    { path: '/grinding/outbound-sfg', name: 'Outbound to SFG WH', description: 'Dispatch SFG output to warehouse', permissionKey: 'dispatch_to_sfg' },
    { path: '/grinding/stock-verification', name: 'Stock Verification', description: 'Verify and accept or reject incoming stock dispatches', permissionKey: 'manage_stock_verification' },
    { path: '/packaging/material-transfer', name: 'Material Transfer', description: 'Transfer SFG & packing materials to packaging production', permissionKey: 'manage_pkg_material_transfer' },
    { path: '/packaging/create-fg-batch', name: 'Create FG Batch', description: 'Create new FG batches from transferring materials', permissionKey: 'manage_pkg_material_transfer' },
    { path: '/packaging/receive-materials', name: 'Receive Materials', description: 'Accept or reject incoming materials at packaging', permissionKey: 'manage_pkg_receive_materials' },
    { path: '/packaging/fg-production', name: 'FG Production Entry', description: 'Machine-wise FG production with BOM-based input tracking', permissionKey: 'manage_fg_production' },
    { path: '/packaging/new-production-entry', name: 'New Production Entry', description: 'Create new machine-wise FG production entry', permissionKey: 'manage_fg_production' },
    { path: '/packaging/production-output-entry', name: 'Production Output Entry', description: 'Record actual machine-wise FG output', permissionKey: 'manage_fg_production' },
    { path: '/packaging/outbound-fg', name: 'Outbound to FG WH', description: 'Dispatch FG from machine locations to FG warehouse', permissionKey: 'manage_pkg_outbound_fg' },
    { path: '/packaging/fg-verification', name: 'FG Verification', description: 'Accept or reject FG and scrap at FG warehouse', permissionKey: 'manage_fg_verification' },
    { path: '/masters/bom/create', name: 'Bill of Material', description: 'Create and manage Bill of Materials', permissionKey: 'manage_bom' },
    { path: '/masters/locations/create', name: 'Location Master', description: 'Manage physical locations (warehouses, cleaning, grinding)', permissionKey: 'manage_locations' },
    { path: '/masters/machine', name: 'Machine Master', description: 'Manage machine capacities', permissionKey: 'manage_locations' },
    { path: '/masters/fg-packaging', name: 'FG Packaging Master', description: 'Manage FG packaging specifications', permissionKey: 'manage_raw_materials' },
  ];

  staticRoutes.forEach(r => registerRoute({ ...r, element: <></>, resource: 'page' }));
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
          <Route path="/" element={<Navigate to="/login" replace />} />
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
            <Route
              path="/raw/generate-grn"
              element={
                <PermissionedRoute
                  path="/raw/generate-grn"
                  element={
                    <SecureRoute
                      element={<GenerateGRN />}
                      permissionKey="manage_generate_grn"
                    />
                  }
                  name="Generate GRN"
                  description="Generate GRN numbers against quality reports"
                  permissionKey="manage_generate_grn"
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
              path="/masters/vendors/create"
              element={
                <PermissionedRoute
                  path="/masters/vendors/create"
                  element={
                    <SecureRoute
                      element={<CreateVendorPage />}
                      permissionKey="manage_vendors"
                    />
                  }
                  name="Create Vendor"
                  description="Create new vendors (master data)"
                  permissionKey="manage_vendors"
                />
              }
            />

            <Route
              path="/masters/raw-materials/create"
              element={
                <PermissionedRoute
                  path="/masters/raw-materials/create"
                  element={
                    <SecureRoute
                      element={<CreateRawMaterialPage />}
                      permissionKey="manage_raw_materials"
                    />
                  }
                  name="Create Raw Material"
                  description="Create raw material master data"
                  permissionKey="manage_raw_materials"
                />
              }
            />

            <Route
              path="/masters/fg-packaging"
              element={
                <PermissionedRoute
                  path="/masters/fg-packaging"
                  element={
                    <SecureRoute
                      element={<CreateFGPackaging />}
                      permissionKey="manage_raw_materials"
                    />
                  }
                  name="FG UOM Master"
                  description="Manage FG packaging specifications"
                  permissionKey="manage_raw_materials"
                />
              }
            />

            <Route
              path="/masters/bom/create"
              element={
                <PermissionedRoute
                  path="/masters/bom/create"
                  element={
                    <SecureRoute
                      element={<CreateBOMPage />}
                      permissionKey="manage_bom"
                    />
                  }
                  name="Bill of Material"
                  description="Create and manage Bill of Materials"
                  permissionKey="manage_bom"
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
                      element={<SFGProcessingPage />}
                      permissionKey="process_raw_materials"
                    />
                  }
                  name="Processing List"
                  description="View all processing raw materials ready for processing"
                  permissionKey="process_raw_materials"
                />
              }
            />

            {/* ==================== GRINDING & PRODUCTION ROUTES ==================== */}

            <Route
              path="/grinding/dispatch"
              element={
                <PermissionedRoute
                  path="/grinding/dispatch"
                  element={
                    <SecureRoute
                      element={<DispatchToGrinding />}
                      permissionKey="send_cleaned_to_grinding"
                    />
                  }
                  name="Dispatch to Grinding"
                  description="Send cleaned RM batches to grinding unit"
                  permissionKey="send_cleaned_to_grinding"
                />
              }
            />

            <Route
              path="/grinding/sfg-processing"
              element={
                <PermissionedRoute
                  path="/grinding/sfg-processing"
                  element={
                    <SecureRoute
                      element={<SFGProcessingPage />}
                      permissionKey="manage_processing_list"
                    />
                  }
                  name="SFG Processing"
                  description="Manage processing batches and production entries"
                  permissionKey="manage_processing_list"
                />
              }
            />

            <Route
              path="/grinding/outbound-sfg"
              element={
                <PermissionedRoute
                  path="/grinding/outbound-sfg"
                  element={
                    <SecureRoute
                      element={<OutboundToSFGPage />}
                      permissionKey="dispatch_to_sfg"
                    />
                  }
                  name="Outbound to SFG WH"
                  description="Dispatch SFG output to warehouse"
                  permissionKey="dispatch_to_sfg"
                />
              }
            />

            <Route
              path="/grinding/stock-verification"
              element={
                <PermissionedRoute
                  path="/grinding/stock-verification"
                  element={
                    <SecureRoute
                      element={<StockVerificationPage />}
                      permissionKey="manage_stock_verification"
                    />
                  }
                  name="Stock Verification"
                  description="Verify and accept or reject incoming stock dispatches"
                  permissionKey="manage_stock_verification"
                />
              }
            />

            <Route
              path="/masters/locations/create"
              element={
                <PermissionedRoute
                  path="/masters/locations/create"
                  element={
                    <SecureRoute
                      element={<CreateLocationPage />}
                      permissionKey="manage_locations"
                    />
                  }
                  name="Location Master"
                  description="Manage physical locations"
                  permissionKey="manage_locations"
                />
              }
            />

            <Route
              path="/masters/machine"
              element={
                <PermissionedRoute
                  path="/masters/machine"
                  element={
                    <SecureRoute
                      element={<MachineMasterPage />}
                      permissionKey="manage_locations"
                    />
                  }
                  name="Machine Master"
                  description="Manage machine master data"
                  permissionKey="manage_locations"
                />
              }
            />

            {/* ==================== FG PRODUCTION (PACKAGING) ROUTES ==================== */}

            <Route
              path="/packaging/material-transfer"
              element={
                <PermissionedRoute
                  path="/packaging/material-transfer"
                  element={
                    <SecureRoute
                      element={<MaterialTransferPage />}
                      permissionKey="manage_pkg_material_transfer"
                    />
                  }
                  name="Material Transfer"
                  description="Transfer SFG & packing materials to packaging production"
                  permissionKey="manage_pkg_material_transfer"
                />
              }
            />

            <Route
              path="/packaging/material-transfer/create"
              element={
                <PermissionedRoute
                  path="/packaging/material-transfer/create"
                  element={
                    <SecureRoute
                      element={<CreateMaterialTransferPage />}
                      permissionKey="manage_pkg_material_transfer"
                    />
                  }
                  name="Create Transfer"
                  description="Create new material transfer for production"
                  permissionKey="manage_pkg_material_transfer"
                />
              }
            />

            <Route
              path="/packaging/create-fg-batch"
              element={
                <PermissionedRoute
                  path="/packaging/create-fg-batch"
                  element={
                    <SecureRoute
                      element={<CreateFGBatchPage />}
                      permissionKey="manage_pkg_material_transfer"
                    />
                  }
                  name="Create FG Batch"
                  description="Create new FG batches from transferring materials"
                  permissionKey="manage_pkg_material_transfer"
                />
              }
            />

            <Route
              path="/packaging/receive-materials"
              element={
                <PermissionedRoute
                  path="/packaging/receive-materials"
                  element={
                    <SecureRoute
                      element={<ReceiveMaterialsPage />}
                      permissionKey="manage_pkg_receive_materials"
                    />
                  }
                  name="Receive Materials"
                  description="Accept or reject incoming materials at packaging"
                  permissionKey="manage_pkg_receive_materials"
                />
              }
            />

            <Route
              path="/packaging/fg-production"
              element={
                <PermissionedRoute
                  path="/packaging/fg-production"
                  element={
                    <SecureRoute
                      element={<FGProductionPage />}
                      permissionKey="manage_fg_production"
                    />
                  }
                  name="FG Production Entry"
                  description="Machine-wise FG production with BOM-based input tracking"
                  permissionKey="manage_fg_production"
                />
              }
            />

            <Route
              path="/packaging/new-production-entry"
              element={
                <PermissionedRoute
                  path="/packaging/new-production-entry"
                  element={
                    <SecureRoute
                      element={<NewFGProductionEntryPage />}
                      permissionKey="manage_fg_production"
                    />
                  }
                  name="New Production Entry"
                  description="Create new machine-wise FG production entry"
                  permissionKey="manage_fg_production"
                />
              }
            />

            <Route
              path="/packaging/production-output-entry"
              element={
                <PermissionedRoute
                  path="/packaging/production-output-entry"
                  element={
                    <SecureRoute
                      element={<ProductionOutputEntryPage />}
                      permissionKey="manage_fg_production"
                    />
                  }
                  name="Production Output Entry"
                  description="Record actual machine-wise FG output"
                  permissionKey="manage_fg_production"
                />
              }
            />

            <Route
              path="/packaging/outbound-fg"
              element={
                <PermissionedRoute
                  path="/packaging/outbound-fg"
                  element={
                    <SecureRoute
                      element={<OutboundToFGPage />}
                      permissionKey="manage_pkg_outbound_fg"
                    />
                  }
                  name="Outbound to FG WH"
                  description="Dispatch FG from machine locations to FG warehouse"
                  permissionKey="manage_pkg_outbound_fg"
                />
              }
            />

            <Route
              path="/packaging/fg-verification"
              element={
                <PermissionedRoute
                  path="/packaging/fg-verification"
                  element={
                    <SecureRoute
                      element={<FGVerificationPage />}
                      permissionKey="manage_fg_verification"
                    />
                  }
                  name="FG Verification"
                  description="Accept or reject FG and scrap at FG warehouse"
                  permissionKey="manage_fg_verification"
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
