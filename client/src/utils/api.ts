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
  },

  PRODUCT: {
    CREATE_PRODUCT: `${BASE_URL}/product/products`,
    GET_PRODUCTS: `${BASE_URL}/product`,
    GET_PRODUCT_BY_ID: (id: string) => `${BASE_URL}/product/products/${id}`,
    UPDATE_PRODUCT: (id: string) => `${BASE_URL}/product/products/${id}`,
    DELETE_PRODUCT: (id: string) => `${BASE_URL}/product/products/${id}`,
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
};