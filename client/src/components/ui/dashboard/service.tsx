import api, { API_ROUTES } from '../../../utils/api';

/**
 * Dashboard service for fetching various dashboard data
 */
export const dashboardService = {
  /**
   * Get overview statistics for dashboard
   */
  async getOverviewStats() {
    const token = localStorage.getItem('authToken');
    
    return api.get(API_ROUTES.DASHBOARD.OVERVIEW, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  },

  /**
   * Get batch trend data for charts
   * @param period - 'weekly', 'monthly', or 'quarterly'
   */
  async getBatchTrends(period: 'weekly' | 'monthly' | 'quarterly' = 'weekly') {
    const token = localStorage.getItem('authToken');
    
    return api.get(`${API_ROUTES.DASHBOARD.BATCH_TRENDS}?period=${period}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  },

  /**
   * Get product performance data
   */
  async getProductPerformance() {
    const token = localStorage.getItem('authToken');
    
    return api.get(API_ROUTES.DASHBOARD.PRODUCT_PERFORMANCE, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  },

  /**
   * Get user activity statistics
   */
  async getUserActivity() {
    const token = localStorage.getItem('authToken');
    
    return api.get(API_ROUTES.DASHBOARD.USER_ACTIVITY, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  },

  /**
   * Get quality metrics
   */
  async getQualityMetrics() {
    const token = localStorage.getItem('authToken');
    
    return api.get(API_ROUTES.DASHBOARD.QUALITY_METRICS, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  },

  /**
   * Get monthly batch summary
   * @param month - Month number (1-12)
   * @param year - Year (e.g., 2025)
   */
  async getMonthlyBatchSummary(month?: number, year?: number) {
    const token = localStorage.getItem('authToken');
    
    let url = API_ROUTES.DASHBOARD.MONTHLY_SUMMARY;
    if (month !== undefined && year !== undefined) {
      url += `?month=${month}&year=${year}`;
    }
    
    return api.get(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  },

  /**
   * Get standard usage metrics
   */
  async getStandardUsageMetrics() {
    const token = localStorage.getItem('authToken');
    
    return api.get(API_ROUTES.DASHBOARD.STANDARD_USAGE, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }
};