import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, CheckCircle2, X, Plus, Save, 
  RefreshCw, AlertCircle, 
  User, Search, ClipboardList,
  ExternalLink, 
  TrendingUp, 
  Sparkles} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_ROUTES } from '../../../utils/api';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

// Types
interface Finding {
  id: string;
  auditId: string;
  title: string;
  description: string;
  findingType: 'OBSERVATION' | 'NONCONFORMITY' | 'OPPORTUNITY';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'DEFERRED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  dueDate?: string;
  evidence?: string;
  assignedToId?: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuditFindingsProps {
  auditId?: string;
}

const AuditFindings: React.FC<AuditFindingsProps> = ({ auditId: propAuditId }) => {
  const { auditId: paramAuditId } = useParams<{ auditId: string }>();
  const auditId = propAuditId || paramAuditId;
  
  const queryClient = useQueryClient();
  
  const [isCreating, setIsCreating] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<File | null>(null);
  const [filters, setFilters] = useState({ type: '', status: '', search: '', assignee: '' });
  
  const [findingForm, setFindingForm] = useState({
    title: '',
    description: '',
    findingType: 'OBSERVATION' as const,
    status: 'OPEN' as const,
    priority: 'MEDIUM' as const,
    dueDate: '',
    assignedToId: '',
  });

  // Enhanced animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, duration: 0.6 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0, scale: 0.95 },
    visible: { y: 0, opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 100, damping: 15 } }
  };

  // Reset form
  useEffect(() => {
    if (!isCreating) {
      setFindingForm({
        title: '', description: '', findingType: 'OBSERVATION', status: 'OPEN',
        priority: 'MEDIUM',  dueDate: '', assignedToId: ''
      });
      setSelectedEvidence(null);
    }
  }, [isCreating]);

  // Fetch findings
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['auditFindings', auditId, filters],
    queryFn: async () => {
      if (!auditId) return { count: 0, findings: [] };
      let url = API_ROUTES.AUDIT.GET_FINDINGS(auditId);
      const queryParams = [];
      if (filters.type) queryParams.push(`type=${filters.type}`);
      if (filters.status) queryParams.push(`status=${filters.status}`);
      if (filters.assignee) queryParams.push(`assignee=${filters.assignee}`);
      if (queryParams.length > 0) url += `?${queryParams.join('&')}`;
      
      const response = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      });
      return response.data;
    },
    enabled: !!auditId,
  });

  // Filter findings
  const filteredFindings = data?.findings?.filter((finding: Finding) => {
    if (!filters.search) return true;
    const searchTerm = filters.search.toLowerCase();
    return finding.title.toLowerCase().includes(searchTerm) ||
           finding.description.toLowerCase().includes(searchTerm) ||
           finding.assignedTo?.name.toLowerCase().includes(searchTerm);
  }) || [];

  // Fetch users
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await axios.get(API_ROUTES.AUTH.GET_ALL_USERS, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      });
      return response.data;
    },
  });

  // Quick update mutations
  const updateStatusMutation = useMutation({
    mutationFn: async ({ findingId, status }: { findingId: string, status: string }) => {
      const formData = new FormData();
      formData.append('status', status);
      return axios.put(API_ROUTES.AUDIT.UPDATE_FINDING(findingId), formData, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auditFindings', auditId] });
      toast.success('Status updated');
    },
    onError: () => toast.error('Failed to update status')
  });

  const updateAssigneeMutation = useMutation({
    mutationFn: async ({ findingId, assignedToId }: { findingId: string, assignedToId: string }) => {
      const formData = new FormData();
      formData.append('assignedToId', assignedToId);
      return axios.put(API_ROUTES.AUDIT.UPDATE_FINDING(findingId), formData, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auditFindings', auditId] });
      toast.success('Assignee updated');
    },
    onError: () => toast.error('Failed to update assignee')
  });

  // Create finding mutation
  const createFindingMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!auditId) throw new Error('Audit ID is required');
      return axios.post(API_ROUTES.AUDIT.CREATE_FINDING(auditId), formData, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}`, 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auditFindings', auditId] });
      setIsCreating(false);
      toast.success('Finding created successfully');
    },
    onError: (err: any) => toast.error(`Failed to create finding: ${err.response?.data?.error || err.message}`)
  });

  // Handle form submission
  const handleSubmitFinding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!findingForm.title.trim() || !findingForm.description.trim()) {
      toast.error('Title and description are required');
      return;
    }
    
    const formData = new FormData();
    Object.entries(findingForm).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });
    formData.append('auditId', auditId || '');
    if (selectedEvidence) formData.append('evidence', selectedEvidence);
    
    createFindingMutation.mutate(formData);
  };

  // Helper functions
  const getStatusConfig = (status: string) => {
    const configs = {
      OPEN: { bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-500' },
      IN_PROGRESS: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
      RESOLVED: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
      CLOSED: { bg: 'bg-gray-100', text: 'text-gray-800', dot: 'bg-gray-500' },
      DEFERRED: { bg: 'bg-purple-100', text: 'text-purple-800', dot: 'bg-purple-500' },
    };
    return configs[status as keyof typeof configs] || configs.OPEN;
  };

  const getTypeConfig = (type: string) => {
    const configs = {
      OBSERVATION: { bg: 'bg-blue-100', text: 'text-blue-800', icon: '👁️' },
      NON_CONFORMITY: { bg: 'bg-red-100', text: 'text-red-800', icon: '⚠️' },
      OPPORTUNITY_FOR_IMPROVEMENT: { bg: 'bg-green-100', text: 'text-green-800', icon: '💡' },
    };
    return configs[type as keyof typeof configs] || configs.OBSERVATION;
  };

  const getPriorityConfig = (priority: string) => {
    const configs = {
      LOW: { bg: 'bg-gray-100', text: 'text-gray-800' },
      MEDIUM: { bg: 'bg-amber-100', text: 'text-amber-800' },
      HIGH: { bg: 'bg-orange-100', text: 'text-orange-800' },
      CRITICAL: { bg: 'bg-red-100', text: 'text-red-800' },
    };
    return configs[priority as keyof typeof configs] || configs.MEDIUM;
  };

  // Calculate stats
  const stats = {
    total: data?.findings?.length || 0,
    open: data?.findings?.filter((f: Finding) => f.status === 'OPEN').length || 0,
    nonconformities: data?.findings?.filter((f: Finding) => f.findingType === 'NONCONFORMITY').length || 0,
    resolved: data?.findings?.filter((f: Finding) => ['RESOLVED', 'CLOSED'].includes(f.status)).length || 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-4 py-8"
      >
        {/* Main Container */}
        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
        >
          {/* Header Section */}
          <div className="relative bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-6 border-b border-gray-100">
            <div className="absolute top-0 right-0 -mt-2 -mr-2">
              <Sparkles size={60} className="text-blue-100 opacity-50" />
            </div>
            <div className="relative">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-3 lg:space-y-0">
                <div>
                  <div className="flex items-center space-x-3 mb-1">
                    <div className="p-2 bg-blue-100 rounded-xl">
                      <AlertTriangle className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">Audit Findings</h1>
                      <p className="text-gray-600 text-sm mt-0.5">
                        Track and manage nonconformities, observations, and improvement opportunities
                      </p>
                    </div>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: "0 6px 20px rgba(59, 130, 246, 0.15)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsCreating(!isCreating)}
                  className={`px-5 py-2 rounded-xl text-sm font-medium flex items-center transition-all shadow-lg ${
                    isCreating ? "bg-red-500 text-white hover:bg-red-600" : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {isCreating ? <><X size={14} className="mr-2" />Cancel</> : <><Plus size={14} className="mr-2" />New Finding</>}
                </motion.button>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50/50 to-blue-50/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Findings', value: stats.total, icon: ClipboardList, color: 'blue' },
                { label: 'Open Issues', value: stats.open, icon: AlertCircle, color: 'amber' },
                { label: 'Nonconformities', value: stats.nonconformities, icon: AlertTriangle, color: 'red' },
                { label: 'Resolved', value: stats.resolved, icon: CheckCircle2, color: 'green' }
              ].map((stat) => (
                <motion.div 
                  key={stat.label}
                  whileHover={{ y: -2, scale: 1.02 }}
                  className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-3">
                    <stat.icon size={24} className={`text-${stat.color}-200`} />
                  </div>
                  <div className="relative">
                    <p className="text-xs font-medium text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <div className="flex items-center mt-1">
                      <TrendingUp size={12} className={`text-${stat.color}-500 mr-1`} />
                      <span className={`text-xs text-${stat.color}-600 font-medium`}>Active</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Create Form */}
          <AnimatePresence>
            {isCreating && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-b border-gray-100"
              >
                <div className="p-6 bg-gradient-to-r from-gray-50/50 to-blue-50/50">
                  <form onSubmit={handleSubmitFinding} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Title*</label>
                        <input
                          type="text"
                          value={findingForm.title}
                          onChange={(e) => setFindingForm({...findingForm, title: e.target.value})}
                          className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Type*</label>
                        <select
                          value={findingForm.findingType}
                          onChange={(e) => setFindingForm({...findingForm, findingType: e.target.value as any})}
                          className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="OBSERVATION">Observation</option>
                          <option value="NON_CONFORMITY">Nonconformity</option>
                          <option value="OPPORTUNITY_FOR_IMPROVEMENT">Opportunity</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Description*</label>
                      <textarea
                        value={findingForm.description}
                        onChange={(e) => setFindingForm({...findingForm, description: e.target.value})}
                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        rows={3}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Priority</label>
                        <select
                          value={findingForm.priority}
                          onChange={(e) => setFindingForm({...findingForm, priority: e.target.value as any})}
                          className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="CRITICAL">Critical</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Due Date</label>
                        <input
                          type="date"
                          value={findingForm.dueDate}
                          onChange={(e) => setFindingForm({...findingForm, dueDate: e.target.value})}
                          className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Assign To</label>
                        <select
                          value={findingForm.assignedToId}
                          onChange={(e) => setFindingForm({...findingForm, assignedToId: e.target.value})}
                          className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="">Unassigned</option>
                          {usersData?.users?.map((user: User) => (
                            <option key={user.id} value={user.id}>{user.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setIsCreating(false)}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                      >
                        Cancel
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={createFindingMutation.isPending}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center text-sm"
                      >
                        {createFindingMutation.isPending ? (
                          <><RefreshCw size={14} className="mr-1 animate-spin" />Saving...</>
                        ) : (
                          <><Save size={14} className="mr-1" />Save Finding</>
                        )}
                      </motion.button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Filters Section */}
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50/50 to-blue-50/50">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search findings..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="w-full pl-10 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <select
                value={filters.type}
                onChange={(e) => setFilters({...filters, type: e.target.value})}
                className="p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">All Types</option>
                <option value="OBSERVATION">Observations</option>
                <option value="NONCONFORMITY">Nonconformities</option>
                <option value="OPPORTUNITY">Opportunities</option>
              </select>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
              <select
                value={filters.assignee}
                onChange={(e) => setFilters({...filters, assignee: e.target.value})}
                className="p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">All Assignees</option>
                {usersData?.users?.map((user: User) => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table View */}
          <div>
            {isLoading ? (
              <div className="flex justify-center items-center py-16">
                <motion.div 
                  animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, ease: "linear", repeat: Infinity }}
                  className="rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"
                />
              </div>
            ) : isError ? (
              <div className="p-12 text-center">
                <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
                <h3 className="text-lg font-semibold text-red-800 mb-2">Error loading findings</h3>
                <p className="text-red-600">{(error as any)?.message || "Please try again later"}</p>
              </div>
            ) : filteredFindings.length === 0 ? (
              <div className="p-12 text-center">
                <ClipboardList size={48} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No findings found</h3>
                <p className="text-gray-600 mb-6">Start by creating your first finding</p>
                {!isCreating && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setIsCreating(true)}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center"
                  >
                    <Plus size={14} className="mr-1" />Create Finding
                  </motion.button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Finding</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Priority</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Assigned To</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Due Date</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Evidence</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredFindings.map((finding: Finding, index: number) => (
                      <motion.tr 
                        key={finding.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="hover:bg-gray-50 transition-all"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{finding.title}</div>
                            <div className="text-xs text-gray-500 mt-1 line-clamp-2">{finding.description}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getTypeConfig(finding.findingType).bg} ${getTypeConfig(finding.findingType).text}`}>
                            {getTypeConfig(finding.findingType).icon} {finding.findingType}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="relative">
                            <select
                              value={finding.status}
                              onChange={(e) => updateStatusMutation.mutate({ findingId: finding.id, status: e.target.value })}
                              className={`text-xs font-medium border-0 rounded-full px-2.5 py-1 ${getStatusConfig(finding.status).bg} ${getStatusConfig(finding.status).text} cursor-pointer`}
                              disabled={updateStatusMutation.isPending}
                            >
                              <option value="OPEN">Open</option>
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="RESOLVED">Resolved</option>
                              <option value="CLOSED">Closed</option>
                              <option value="DEFERRED">Deferred</option>
                            </select>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {finding.priority && (
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityConfig(finding.priority).bg} ${getPriorityConfig(finding.priority).text}`}>
                              {finding.priority}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={finding.assignedToId || ''}
                            onChange={(e) => updateAssigneeMutation.mutate({ findingId: finding.id, assignedToId: e.target.value })}
                            className="text-xs border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500"
                            disabled={updateAssigneeMutation.isPending}
                          >
                            <option value="">Unassigned</option>
                            {usersData?.users?.map((user: User) => (
                              <option key={user.id} value={user.id}>{user.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {finding.dueDate ? format(new Date(finding.dueDate), 'MMM d, yyyy') : '-'}
                        </td>
                        <td className="px-6 py-4">
                          {finding.evidence ? (
                            <a 
                              href={finding.evidence} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <ExternalLink size={16} />
                            </a>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AuditFindings;