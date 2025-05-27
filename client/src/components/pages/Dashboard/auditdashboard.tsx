import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  FileText,
  AlertCircle,
  RefreshCw,
  Download,
  Activity,
  Target,
  ArrowUp,
  ArrowDown,
  Settings,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import axios from 'axios';
import { API_ROUTES } from '../../../utils/api';

// Types
interface OverviewData {
  totalAudits: number;
  activeAudits: number;
  completedAudits: number;
  plannedAudits: number;
  totalFindings: number;
  openFindings: number;
  criticalFindings: number;
  overdueActions: number;
  auditCompletionRate: string;
}

interface StatusDistribution {
  status: string;
  count: number;
}

interface FindingsDistribution {
  type: string;
  count: number;
}

interface RecentAudit {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  auditor: { name: string; email: string };
  department: { name: string };
  _count: { findings: number; actions: number };
}

interface OverdueAction {
  id: string;
  title: string;
  dueDate: string;
  status: string;
  audit: { name: string; id: string };
  finding: { title: string; priority: string };
  assignedTo: { name: string; email: string };
}

interface CriticalFinding {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  createdAt: string;
  audit: { name: string; id: string };
  assignedTo: { name: string; email: string };
  actions: Array<{
    id: string;
    title: string;
    dueDate: string;
    status: string;
  }>;
}

// API Service
const auditDashboardService = {
  getOverview: async (): Promise<OverviewData> => {
    const token = localStorage.getItem('authToken');
    const response = await axios.get(API_ROUTES.AUDIT_DASHBOARD.OVERVIEW, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  },

  getStatusDistribution: async (): Promise<StatusDistribution[]> => {
    const token = localStorage.getItem('authToken');
    const response = await axios.get(`${API_ROUTES.AUDIT_DASHBOARD.OVERVIEW.replace('/overview', '/status-distribution')}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  },

  getFindingsDistribution: async (): Promise<FindingsDistribution[]> => {
    const token = localStorage.getItem('authToken');
    const response = await axios.get(`${API_ROUTES.AUDIT_DASHBOARD.OVERVIEW.replace('/overview', '/findings-distribution')}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  },

  getRecentAudits: async (): Promise<RecentAudit[]> => {
    const token = localStorage.getItem('authToken');
    const response = await axios.get(`${API_ROUTES.AUDIT_DASHBOARD.OVERVIEW.replace('/overview', '/recent-audits')}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  },

  getOverdueActions: async (): Promise<OverdueAction[]> => {
    const token = localStorage.getItem('authToken');
    const response = await axios.get(`${API_ROUTES.AUDIT_DASHBOARD.OVERVIEW.replace('/overview', '/overdue-actions')}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  },

  getCriticalFindings: async (): Promise<CriticalFinding[]> => {
    const token = localStorage.getItem('authToken');
    const response = await axios.get(`${API_ROUTES.AUDIT_DASHBOARD.OVERVIEW.replace('/overview', '/critical-findings')}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  },

  getDashboardData: async () => {
    const token = localStorage.getItem('authToken');
    const response = await axios.get(`${API_ROUTES.AUDIT_DASHBOARD.OVERVIEW.replace('/overview', '/all')}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  }
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100
    }
  }
};

const cardVariants = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100
    }
  },
  hover: {
    scale: 1.02,
    transition: { duration: 0.2 }
  }
};

// Status color mapping
const getStatusColor = (status: string) => {
  const colors = {
    'COMPLETED': 'text-green-600 bg-green-100',
    'IN_PROGRESS': 'text-blue-600 bg-blue-100',
    'PLANNED': 'text-yellow-600 bg-yellow-100',
    'DRAFT': 'text-gray-600 bg-gray-100',
    'CANCELLED': 'text-red-600 bg-red-100'
  };
  return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-100';
};

const getPriorityColor = (priority: string) => {
  const colors = {
    'CRITICAL': 'text-red-600 bg-red-100',
    'HIGH': 'text-orange-600 bg-orange-100',
    'MEDIUM': 'text-yellow-600 bg-yellow-100',
    'LOW': 'text-green-600 bg-green-100'
  };
  return colors[priority as keyof typeof colors] || 'text-gray-600 bg-gray-100';
};

// Components
const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  changeType?: 'increase' | 'decrease';
  color: string;
}> = ({ title, value, icon, change, changeType, color }) => (
  <motion.div
    variants={cardVariants}
    whileHover="hover"
    className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${color} relative overflow-hidden group`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <div className="relative z-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <div className={`flex items-center mt-2 text-sm ${
              changeType === 'increase' ? 'text-green-600' : 'text-red-600'
            }`}>
              {changeType === 'increase' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
              <span className="ml-1">{change}</span>
            </div>
          )}
        </div>
        <div className="text-gray-400 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
      </div>
    </div>
  </motion.div>
);

const ChartCard: React.FC<{
  title: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, children, className = '' }) => (
  <motion.div
    variants={cardVariants}
    whileHover="hover"
    className={`bg-white rounded-xl shadow-lg p-6 ${className}`}
  >
    <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
    {children}
  </motion.div>
);

const ListCard: React.FC<{
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}> = ({ title, children, action }) => (
  <motion.div
    variants={cardVariants}
    whileHover="hover"
    className="bg-white rounded-xl shadow-lg p-6"
  >
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {action}
    </div>
    {children}
  </motion.div>
);

const AuditDashboard: React.FC = () => {
  const [] = useState('overview');
  const [refreshKey, setRefreshKey] = useState(0);

  // Queries
  const { data: overview, isLoading: overviewLoading, error: overviewError } = useQuery({
    queryKey: ['audit-overview', refreshKey],
    queryFn: auditDashboardService.getOverview,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: statusDistribution, isLoading: statusLoading } = useQuery({
    queryKey: ['audit-status-distribution', refreshKey],
    queryFn: auditDashboardService.getStatusDistribution,
  });

  const { data: findingsDistribution, isLoading: findingsLoading } = useQuery({
    queryKey: ['audit-findings-distribution', refreshKey],
    queryFn: auditDashboardService.getFindingsDistribution,
  });

  const { data: recentAudits, isLoading: recentLoading } = useQuery({
    queryKey: ['recent-audits', refreshKey],
    queryFn: auditDashboardService.getRecentAudits,
  });

  const { data: overdueActions } = useQuery({
    queryKey: ['overdue-actions', refreshKey],
    queryFn: auditDashboardService.getOverdueActions,
  });

  const { data: criticalFindings } = useQuery({
    queryKey: ['critical-findings', refreshKey],
    queryFn: auditDashboardService.getCriticalFindings,
  });

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isLoading = overviewLoading || statusLoading || findingsLoading || recentLoading;

  if (overviewError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading dashboard</h3>
          <p className="text-gray-600 mb-4">Please try refreshing the page</p>
          <button
            onClick={handleRefresh}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white shadow-sm border-b border-gray-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Audit Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isLoading}
              >
                <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Download className="h-5 w-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Settings className="h-5 w-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-64"
            >
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="inline-block"
                >
                  <RefreshCw className="h-8 w-8 text-blue-600" />
                </motion.div>
                <p className="mt-2 text-gray-600">Loading dashboard...</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-8"
            >
              {/* Overview Stats */}
              {overview && (
                <motion.div variants={itemVariants}>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Overview</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                      title="Total Audits"
                      value={overview.totalAudits}
                      icon={<FileText size={24} />}
                      color="border-blue-500"
                    />
                    <StatCard
                      title="Active Audits"
                      value={overview.activeAudits}
                      icon={<Activity size={24} />}
                      color="border-green-500"
                    />
                    <StatCard
                      title="Completion Rate"
                      value={`${overview.auditCompletionRate}%`}
                      icon={<Target size={24} />}
                      color="border-purple-500"
                    />
                    <StatCard
                      title="Critical Findings"
                      value={overview.criticalFindings}
                      icon={<AlertTriangle size={24} />}
                      color="border-red-500"
                    />
                  </div>
                </motion.div>
              )}

              {/* Status Distribution */}
              {statusDistribution && (
                <motion.div variants={itemVariants}>
                  <ChartCard title="Audit Status Distribution">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {statusDistribution.map((item, index) => (
                        <motion.div
                          key={item.status}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className="text-center p-4 rounded-lg bg-gray-50"
                        >
                          <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium mb-2 ${getStatusColor(item.status)}`}>
                            {item.status.replace('_', ' ')}
                          </div>
                          <p className="text-2xl font-bold text-gray-900">{item.count}</p>
                        </motion.div>
                      ))}
                    </div>
                  </ChartCard>
                </motion.div>
              )}

              {/* Findings Distribution */}
              {findingsDistribution && (
                <motion.div variants={itemVariants}>
                  <ChartCard title="Findings by Type">
                    <div className="space-y-3">
                      {findingsDistribution.map((item, index) => (
                        <motion.div
                          key={item.type}
                          initial={{ x: -50, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                        >
                          <span className="font-medium text-gray-900">{item.type.replace('_', ' ')}</span>
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                            {item.count}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </ChartCard>
                </motion.div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Audits */}
                {recentAudits && (
                  <motion.div variants={itemVariants}>
                    <ListCard
                      title="Recent Audits"
                      action={
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center"
                        >
                          View All
                          <ChevronRight size={16} className="ml-1" />
                        </motion.button>
                      }
                    >
                      <div className="space-y-3">
                        {recentAudits.slice(0, 5).map((audit, index) => (
                          <motion.div
                            key={audit.id}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors group"
                          >
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                {audit.name}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {audit.department.name} • {audit.auditor.name}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDate(audit.createdAt)}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(audit.status)}`}>
                                {audit.status.replace('_', ' ')}
                              </span>
                              <ExternalLink size={16} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </ListCard>
                  </motion.div>
                )}

                {/* Critical Findings */}
                {criticalFindings && (
                  <motion.div variants={itemVariants}>
                    <ListCard
                      title="Critical Findings"
                      action={
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="text-red-600 hover:text-red-800 font-medium text-sm flex items-center"
                        >
                          View All
                          <ChevronRight size={16} className="ml-1" />
                        </motion.button>
                      }
                    >
                      <div className="space-y-3">
                        {criticalFindings.slice(0, 5).map((finding, index) => (
                          <motion.div
                            key={finding.id}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-4 rounded-lg border-l-4 border-red-500 bg-red-50 hover:bg-red-100 transition-colors group"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{finding.title}</h4>
                                <p className="text-sm text-gray-600 mt-1">{finding.audit.name}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Assigned to: {finding.assignedTo.name}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(finding.priority)}`}>
                                  {finding.priority}
                                </span>
                                <AlertTriangle size={16} className="text-red-500" />
                              </div>
                            </div>
                            {finding.actions.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-red-200">
                                <p className="text-xs text-gray-600">
                                  {finding.actions.length} action(s) • Due: {formatDate(finding.actions[0].dueDate)}
                                </p>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </ListCard>
                  </motion.div>
                )}
              </div>

              {/* Overdue Actions */}
              {overdueActions && overdueActions.length > 0 && (
                <motion.div variants={itemVariants}>
                  <ListCard
                    title={`Overdue Actions (${overdueActions.length})`}
                    action={
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                      >
                        Manage All
                      </motion.button>
                    }
                  >
                    <div className="space-y-3">
                      {overdueActions.slice(0, 3).map((action, index) => (
                        <motion.div
                          key={action.id}
                          initial={{ x: -50, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-4 rounded-lg bg-yellow-50 border border-yellow-200 hover:bg-yellow-100 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{action.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{action.audit.name}</p>
                              <p className="text-sm text-gray-600">Finding: {action.finding.title}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-red-600">
                                Overdue by {Math.ceil((new Date().getTime() - new Date(action.dueDate).getTime()) / (1000 * 60 * 60 * 24))} days
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Assigned to: {action.assignedTo.name}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ListCard>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default AuditDashboard;