import axios from "axios";

// Create an Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL as string,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;

// Define the base URL for all APIs
const BASE_URL = import.meta.env.VITE_API_URL as string;

export const API_ROUTES = {
  AUTH: {
    LOGIN: `${BASE_URL}/auth/login`,
    REGISTER: `${BASE_URL}/auth/register`,
    CURRENT_USER: `${BASE_URL}/auth/me`,
    CHANGE_PASSWORD: `${BASE_URL}/auth/change-password`,
    GET_ALL_USERS: `${BASE_URL}/auth/users`,
    
    // Role management endpoints
    CREATE_ROLE: `${BASE_URL}/auth/roles`,
    GET_ROLES: `${BASE_URL}/auth/roles`,
    GET_ROLE_BY_ID: (id: string) => `${BASE_URL}/auth/roles/${id}`,
    UPDATE_ROLE: (id: string) => `${BASE_URL}/auth/roles/${id}`,
    DELETE_ROLE: (id: string) => `${BASE_URL}/auth/roles/${id}`,
    
    // Permission management endpoints
    GET_PERMISSIONS: `${BASE_URL}/auth/permissions`,
    GET_PERMISSIONS_BY_ROLE: (roleName: string) => `${BASE_URL}/auth/permissions/${roleName}`,
    SYNC_PAGE_PERMISSIONS: `${BASE_URL}/auth/sync-page-permissions`,
  },

  BATCH: {
    CREATE_BATCH: `${BASE_URL}/batch/batches`,
    GET_BATCHES: `${BASE_URL}/batch/batches`,
    GET_BATCH_BY_ID: (id: string) => `${BASE_URL}/batch/batches/${id}`,
    SUBMIT_BATCH: (id: string) => `${BASE_URL}/batch/batches/${id}/submit`,
    APPROVE_BATCH: (id: string) => `${BASE_URL}/batch/batches/${id}/approve`,
    REJECT_BATCH: (id: string) => `${BASE_URL}/batch/batches/${id}/reject`,
    EXPORT_BATCHES: `${BASE_URL}/batch/batches/export`,
    GET_ACTIVITY_LOGS: `${BASE_URL}/batch/logs`,
    GENERATE_CERTIFICATE: (id: string) => `${BASE_URL}/batch/batches/${id}/certificate`,

    GET_BATCHES_FOR_VERIFICATION: `${BASE_URL}/batch/verification/batches`,
    GET_BATCH_PARAMETERS_FOR_VERIFICATION: (batchId: string) => 
      `${BASE_URL}/batch/verification/batches/${batchId}/parameters`,
    UPDATE_PARAMETER_VERIFICATION: (batchId: string) => 
      `${BASE_URL}/batch/verification/batches/${batchId}/parameters`,
    COMPLETE_BATCH_VERIFICATION: (batchId: string) => 
      `${BASE_URL}/batch/verification/batches/${batchId}/complete`,
  },

  PRODUCT: {
    CREATE_PRODUCT: `${BASE_URL}/product/products`,
    GET_PRODUCTS: `${BASE_URL}/product`,
    GET_PRODUCT_BY_ID: (id: string) => `${BASE_URL}/product/products/${id}`,
    UPDATE_PRODUCT: (id: string) => `${BASE_URL}/product/products/${id}`,
    DELETE_PRODUCT: (id: string) => `${BASE_URL}/product/products/${id}`,
    GET_PARAMETERS_BY_PRODUCT_ID: (productId: string) => `${BASE_URL}/batch/parameters/product/${productId}`,
  },

  STANDARD: {
    CREATE_STANDARD: `${BASE_URL}/standard/standards`,
    GET_STANDARDS: `${BASE_URL}/standard/standards`,
    GET_STANDARD_BY_ID: (id: string) => `${BASE_URL}/standard/standards/${id}`,
    UPDATE_STANDARD: (id: string) => `${BASE_URL}/standard/standards/${id}`,
    DELETE_STANDARD: (id: string) => `${BASE_URL}/standard/standards/${id}`,
    CREATE_STANDARD_CATEGORY: `${BASE_URL}/standard/standards/categories`,
    GET_STANDARD_CATEGORIES: `${BASE_URL}/standard/categoriess`,
    UPDATE_STANDARD_CATEGORY: (id: string) => `${BASE_URL}/standard/categories/${id}`,
    CREATE_STANDARD_PARAMETER: `${BASE_URL}/standard/parameter`, // Added BASE_URL
    GET_STANDARD_PARAMETERS: `${BASE_URL}/standard/parameters`, // Ad
  },

  UNIT: {
    CREATE_UNIT: `${BASE_URL}/standard/units`,
    GET_UNITS: `${BASE_URL}/standard/unit`,
    UPDATE_UNIT: (id: string) => `${BASE_URL}/standard/units/${id}`,
    DELETE_UNIT: (id: string) => `${BASE_URL}/standard/units/${id}`,
  },
  METHODOLOGY: {
    CREATE_METHODOLOGY: `${BASE_URL}/standard/methodologies`,
    GET_METHODOLOGIES: `${BASE_URL}/standard/methodologies`,
    GET_METHODOLOGY_BY_ID: (id: string) => `${BASE_URL}/standard/methodologies/${id}`,
    UPDATE_METHODOLOGY: (id: string) => `${BASE_URL}/standard/methodologies/${id}`,
    DELETE_METHODOLOGY: (id: string) => `${BASE_URL}/standard/methodologies/${id}`,
  },
  DASHBOARD: {
    OVERVIEW: `${BASE_URL}/dashboard/overview`,
    BATCH_TRENDS: `${BASE_URL}/dashboard/batch-trends`,
    PRODUCT_PERFORMANCE: `${BASE_URL}/dashboard/product-performance`,
    USER_ACTIVITY: `${BASE_URL}/dashboard/user-activity`,
    QUALITY_METRICS: `${BASE_URL}/dashboard/quality-metrics`,
    MONTHLY_SUMMARY: `${BASE_URL}/dashboard/monthly-summary`,
    STANDARD_USAGE: `${BASE_URL}/dashboard/standard-usage`,
  },
  TRAINING: {
    CREATE_TRAINING: `${BASE_URL}/training`,
    SUBMIT_FEEDBACK: (trainingId: string) => `${BASE_URL}/training/${trainingId}/feedback`,
    GET_ALL_TRAININGS: `${BASE_URL}/training/get`,
    GET_TRAINING_BY_ID: (trainingId: string) => `${BASE_URL}/training/${trainingId}`,
    GET_TRAINING_PARTICIPANTS: (trainingId: string) => `${BASE_URL}/training/${trainingId}/participants`,
    UPDATE_TRAINING_STATUS: (trainingId: string) => `${BASE_URL}/training/${trainingId}/status`,
    UPDATE_TRAINING: (trainingId: string) => `${BASE_URL}/training/${trainingId}`,
    DELETE_TRAINING: (trainingId: string) => `${BASE_URL}/training/${trainingId}`,

    UPLOAD_DOCUMENT: (trainingId: string) => `${BASE_URL}/training/${trainingId}/documents`,
    GET_TRAINING_DOCUMENTS: (trainingId: string) => `${BASE_URL}/training/${trainingId}/documents`,
    GET_ALL_DOCUMENTS: `${BASE_URL}/training/documents/all`,
    GET_DOCUMENT_BY_ID: (documentId: string) => `${BASE_URL}/training/documents/${documentId}`,
    UPDATE_DOCUMENT_METADATA: (documentId: string) => `${BASE_URL}/training/documents/${documentId}`,
    DELETE_DOCUMENT: (documentId: string) => `${BASE_URL}/training/documents/${documentId}`,
    BATCH_DELETE_DOCUMENTS: `${BASE_URL}/training/documents/batch-delete`,

    ADD_PARTICIPANTS: (trainingId: string) => `${BASE_URL}/training/${trainingId}/participants`,
    REMOVE_PARTICIPANT: (trainingId: string, participantId: string) => `${BASE_URL}/training/${trainingId}/participants/${participantId}`,
    UPDATE_PARTICIPANT_STATUS: (trainingId: string, participantId: string) => `${BASE_URL}/training/${trainingId}/participants/${participantId}`,
    RESEND_PARTICIPANT_INVITE: (trainingId: string, participantId: string) => `${BASE_URL}/training/${trainingId}/participants/${participantId}/resend-invite`,
    GET_PARTICIPANTS: (trainingId: string) => `${BASE_URL}/training/${trainingId}/participants`,
    HANDLE_INVITATION_RESPONSE: `${BASE_URL}/training/respond`,

    ADD_TRAINING_SESSION: (trainingId: string) => `${BASE_URL}/training/${trainingId}/sessions`,
    GET_TRAINING_SESSIONS: (trainingId: string) => `${BASE_URL}/training/${trainingId}/sessions`,
    GET_SESSION_BY_ID: ( sessionId: string) => `${BASE_URL}/training/sessions/${sessionId}`,
    UPDATE_TRAINING_SESSION: (sessionId: string) => `${BASE_URL}/training/sessions/${sessionId}`,
    DELETE_TRAINING_SESSION: (sessionId: string) => `${BASE_URL}/training/sessions/${sessionId}`,
    RECORD_ATTENDANCE: (sessionId: string) => `${BASE_URL}/training/sessions/${sessionId}/attendance`,
    GET_SESSION_ATTENDANCE: (sessionId: string) => `${BASE_URL}/training/sessions/${sessionId}/attendance`,
    UPDATE_SESSION_STATUS: (sessionId: string) => `${BASE_URL}/training/sessions/${sessionId}/status`,
    UPLOAD_SESSION_DOCUMENT: (sessionId: string) => `${BASE_URL}/training/sessions/${sessionId}/documents`,
    GET_SESSION_DOCUMENTS: (sessionId: string) => `${BASE_URL}/training/sessions/${sessionId}/documents`,
    DELETE_SESSION_DOCUMENT: (documentId: string) => `${BASE_URL}/training/documents/${documentId}/session`,

    GET_MONTHLY_CALENDAR: `${BASE_URL}/training/calendar/monthly`,
    GET_DAILY_CALENDAR: (date: string)=>`${BASE_URL}/training/calendar/daily/${date}`,
    UPDATE_CALENDAR_DESCRIPTION: (month: string, year: string) => `${BASE_URL}/training/calender/${month}/${year}/description`,
    GET_CALENDAR_STATISTICS: `${BASE_URL}/training/calendar/statistics`,

    GET_TRAINING_SUMMARY_STATS: `${BASE_URL}/dashboard/summaryy`,
    GET_TRAINING_FEEDBACK_STATS: `${BASE_URL}/dashboard/feedback`,
    GET_TRAINING_PARTICIPANT_ENGAGEMENT_STATS: `${BASE_URL}/dashboard/engagement`,
    GET_TRAINING_ATTENDANCE_STATS: `${BASE_URL}/dashboard/attendance`,
    GET_TRAINING_TRAINER_STATS: `${BASE_URL}/dashboard/trainers`,
    GET_TRAINING_MONTHLY_STATS: `${BASE_URL}/dashboard/monthly`,
    GET_TRAINING_DASHBOARD_STATS: `${BASE_URL}/dashboard`,

    UPLOAD_SESSION_PHOTO: (sessionId: string) => `${BASE_URL}/training/sessions/${sessionId}/photos`,
    GET_SESSION_PHOTOS: (sessionId: string) => `${BASE_URL}/training/sessions/${sessionId}/photos`,
    DELETE_SESSION_PHOTO: (photoId: string) => `${BASE_URL}/training/photos/${photoId}`,
    UPDATE_SESSION_PHOTO_CAPTION: (photoId: string) => `${BASE_URL}/training/photos/${photoId}`,

    UPLOAD_FEEDBACK_FORM: (sessionId: string, participantId: string) => 
      `${BASE_URL}/training/sessions/${sessionId}/participants/${participantId}/feedback`,
    GET_SESSION_FEEDBACK_FORMS: (sessionId: string) => 
      `${BASE_URL}/training/sessions/${sessionId}/feedback-forms`,
    GET_TRAINING_FEEDBACK_FORMS: (trainingId: string) => 
      `${BASE_URL}/training/trainings/${trainingId}/feedback-forms`,
  },
  AUDIT: {
    // ===== Audit Base Routes =====
    CREATE_AUDIT: `${BASE_URL}/audit`,
    GET_AUDITS: `${BASE_URL}/audit`,
    GET_AUDIT_STATISTICS: `${BASE_URL}/audit/statistics`,
    GET_AUDIT_BY_ID: (id: string) => `${BASE_URL}/audit/${id}`,
    UPDATE_AUDIT: (id: string) => `${BASE_URL}/audit/${id}`,
    DELETE_AUDIT: (id: string) => `${BASE_URL}/audit/${id}`,
    CHANGE_AUDIT_STATUS: (id: string) => `${BASE_URL}/audit/${id}/status`,
    
    // ===== Preparation Phase =====
    SEND_NOTIFICATIONS: (auditId: string) => `${BASE_URL}/audit/${auditId}/notifications`,
    UPLOAD_DOCUMENT: (auditId: string) => `${BASE_URL}/audit/${auditId}/documents`,
    GET_DOCUMENTS: (auditId: string) => `${BASE_URL}/audit/${auditId}/documents`,
    CREATE_CHECKLIST: (auditId: string) => `${BASE_URL}/audit/${auditId}/checklist`,
    GET_CHECKLIST: (auditId: string) => `${BASE_URL}/audit/${auditId}/checklist`,
    UPDATE_CHECKLIST_ITEM: (id: string) => `${BASE_URL}/audit/checklist/${id}`,
    GET_PREVIOUS_ACTIONS: (auditId: string) => `${BASE_URL}/audit/${auditId}/previous-actions`,
    
    // ===== Execution Phase =====
    START_EXECUTION: (auditId: string) => `${BASE_URL}/audit/${auditId}/execution/start`,
    CREATE_FINDING: (auditId: string) => `${BASE_URL}/audit/${auditId}/findings`,
    GET_FINDINGS: (auditId: string) => `${BASE_URL}/audit/${auditId}/findings`,
    GET_FINDING_BY_ID: (id: string) => `${BASE_URL}/audit/findings/${id}`,
    UPDATE_FINDING: (id: string) => `${BASE_URL}/audit/findings/${id}`,
    CREATE_INSPECTION_CHECKLIST: (auditId: string) => `${BASE_URL}/audit/${auditId}/inspection-checklist`,
    GET_INSPECTION_CHECKLISTS: (auditId: string) => `${BASE_URL}/audit/${auditId}/inspection-checklists`,
    COMPLETE_EXECUTION: (auditId: string) => `${BASE_URL}/audit/${auditId}/execution/complete`,
    GET_INSPECTION_ITEM: (itemId: string) => `${BASE_URL}/audit/inspection-items/${itemId}`,
    UPDATE_INSPECTION_ITEM: (itemId: string) => `${BASE_URL}/audit/inspection-items/${itemId}`,
    
    // ===== Report Generation =====
    GENERATE_REPORT: (auditId: string) => `${BASE_URL}/audit/${auditId}/report`,
    GET_REPORTS: (auditId: string) => `${BASE_URL}/audit/${auditId}/reports`,
    
    // ===== Follow-up Phase =====
    CREATE_CORRECTIVE_ACTION: (auditId: string) => `${BASE_URL}/audit/${auditId}/corrective-actions`,
    GET_CORRECTIVE_ACTIONS: (auditId: string) => `${BASE_URL}/audit/${auditId}/corrective-actions`,
    UPDATE_CORRECTIVE_ACTION: (id: string) => `${BASE_URL}/audit/corrective-actions/${id}`,
    CLOSE_AUDIT: (auditId: string) => `${BASE_URL}/audit/${auditId}/close`,
    GET_AUDITS_FOR_CALENDAR: `${BASE_URL}/audit/calendar/events`,

    GET_ALL_DEPARTMENTS: `${BASE_URL}/audit/departments`,
    CREATE_DEPARTMENT: `${BASE_URL}/audit/departments`,

    DELETE_DOCUMENT: (auditId: string, documentId: string) => 
      `${BASE_URL}audit/${auditId}/documents/${documentId}`,
  },
  AUDIT_DASHBOARD: {
    OVERVIEW: `${BASE_URL}/audit/dashboard/overview`,
    BATCH_TRENDS: `${BASE_URL}/audit/dashboard/batch-trends`,
    PRODUCT_PERFORMANCE: `${BASE_URL}/audit/dashboard/product-performance`,
    USER_ACTIVITY: `${BASE_URL}/audit/dashboard/user-activity`,
    QUALITY_METRICS: `${BASE_URL}/audit/dashboard/quality-metrics`,
    MONTHLY_SUMMARY: `${BASE_URL}/audit/dashboard/monthly-summary`,
    STANDARD_USAGE: `${BASE_URL}/audit/dashboard/standard-usage`,
  },
  // ...existing code...
  RAW: {
    // Cleaning Jobs
    CREATE_CLEANING_JOB: `${BASE_URL}/raw/cleaning`,
    GET_CLEANING_JOBS: `${BASE_URL}/raw/cleaning`,
    GET_CLEANING_JOB_BY_ID: (id: string) => `${BASE_URL}/raw/cleaning/${id}`,
    UPDATE_CLEANING_JOB: (id: string) => `${BASE_URL}/raw/cleaning/${id}`,

    // Processing Jobs
    CREATE_PROCESSING_JOB: `${BASE_URL}/raw/processing`,
    GET_PROCESSING_JOBS: `${BASE_URL}/raw/processing`,
    GET_PROCESSING_JOB_BY_ID: (id: string) => `${BASE_URL}/raw/processing/${id}`,
    UPDATE_PROCESSING_JOB: (id: string) => `${BASE_URL}/raw/processing/${id}`,

    // Raw Material Products
    CREATE_PRODUCT: `${BASE_URL}/raw/product`,
    GET_PRODUCTS: `${BASE_URL}/raw/product`,
    GET_PRODUCT_BY_ID: (id: string) => `${BASE_URL}/raw/product/${id}`,
    UPDATE_PRODUCT: (id: string) => `${BASE_URL}/raw/product/${id}`,
    DELETE_PRODUCT: (id: string) => `${BASE_URL}/raw/product/${id}`,

    // Purchase Orders
    CREATE_PURCHASE_ORDER: `${BASE_URL}/raw/purchase`,
    GET_PURCHASE_ORDERS: `${BASE_URL}/raw/purchase`,
    GET_PURCHASE_ORDER_BY_ID: (id: string) => `${BASE_URL}/raw/purchase/${id}`,
    UPDATE_PURCHASE_ORDER: (id: string) => `${BASE_URL}/raw/purchase/${id}`,
    UPDATE_PURCHASE_ORDER_ITEM: (itemId: string) => `${BASE_URL}/raw/purchase/item/${itemId}`,

    // Stock Entries
    CREATE_STOCK_ENTRY: `${BASE_URL}/raw/stock`,
    GET_STOCK_ENTRIES: `${BASE_URL}/raw/stock`,
    GET_STOCK_ENTRY_BY_ID: (id: string) => `${BASE_URL}/raw/stock/${id}`,
    UPDATE_STOCK_ENTRY: (id: string) => `${BASE_URL}/raw/stock/${id}`,

    // Unfinished Stock
    CREATE_UNFINISHED_STOCK: `${BASE_URL}/raw/unfinished`,
    GET_UNFINISHED_STOCKS: `${BASE_URL}/raw/unfinished`,
    GET_UNFINISHED_STOCK_BY_ID: (id: string) => `${BASE_URL}/raw/unfinished/${id}`,
    UPDATE_UNFINISHED_STOCK: (id: string) => `${BASE_URL}/raw/unfinished/${id}`,

    // Vendors
    CREATE_VENDOR: `${BASE_URL}/raw/vendor`,
    GET_VENDORS: `${BASE_URL}/raw/vendor`,
    GET_VENDOR_BY_ID: (id: string) => `${BASE_URL}/raw/vendor/${id}`,
    UPDATE_VENDOR: (id: string) => `${BASE_URL}/raw/vendor/${id}`,
    SET_VENDOR_STATUS: (id: string) => `${BASE_URL}/raw/vendor/${id}/status`,

    // Warehouses
    CREATE_WAREHOUSE: `${BASE_URL}/raw/warehouse`,
    GET_WAREHOUSES: `${BASE_URL}/raw/warehouse`,
    GET_WAREHOUSE_BY_ID: (id: string) => `${BASE_URL}/raw/warehouse/${id}`,
    UPDATE_WAREHOUSE: (id: string) => `${BASE_URL}/raw/warehouse/${id}`,
    DELETE_WAREHOUSE: (id: string) => `${BASE_URL}/raw/warehouse/${id}`,

    // Stock Distribution
    GET_CURRENT_STOCK_DISTRIBUTION: `${BASE_URL}/raw/stock`,
    GET_ALL_PURCHASE_ORDER_ITEMS: `${BASE_URL}/raw/purchase-order-items`,
    GET_ALL_TRANSACTION_LOGS: `${BASE_URL}/raw/transaction-logs`,
    GET_CLEANED_MATERIALS: `${BASE_URL}/raw/cleaned-materials`,
  },

};