import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  Clock,
  AlertTriangle,
  CheckCircle,
  Play,
  RefreshCcw,
  ArrowLeft,
  Plus,
  Calendar,
  X,
  Clipboard,
  Building} from 'lucide-react';
import axios from 'axios';
import { API_ROUTES } from '../../../utils/api';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import EditAuditForm from './minicomponents/EditAudit';
import AuditDetails from './AuditDetails';

// Enhanced Audit status badge component with animation
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = (status: any) => {
    switch (status) {
      case 'PLANNED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'IN_PROGRESS':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'CANCELLED':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusIcon = (status: any) => {
    switch (status) {
      case 'PLANNED':
        return <Clock size={14} className="mr-1.5" />;
      case 'IN_PROGRESS':
        return <Play size={14} className="mr-1.5" />;
      case 'COMPLETED':
        return <CheckCircle size={14} className="mr-1.5" />;
      case 'CANCELLED':
        return <AlertTriangle size={14} className="mr-1.5" />;
      default:
        return null;
    }
  };

  return (
    <motion.span 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}
    >
      {getStatusIcon(status)}
      {status.replace('_', ' ')}
    </motion.span>
  );
};

// Main component
const AuditList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    auditType: '',
    startDate: '',
    endDate: '',
  });
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const queryClient = useQueryClient();
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const [showDetailsView, setShowDetailsView] = useState(false);
  const [showEditView, setShowEditView] = useState(false);
  const [editingAuditId, setEditingAuditId] = useState<string | null>(null);

  // Fetch audits list
  const { data: auditsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['audits', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.auditType) params.append('auditType', filters.auditType);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await axios.get(API_ROUTES.AUDIT.GET_AUDITS, {
        params,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      return response.data;
    },
    enabled: !showDetailsView,
  });

  // Delete audit mutation
  const deleteMutation = useMutation<string, unknown, string>({
    mutationFn: (auditId: string) =>
      axios.delete(API_ROUTES.AUDIT.DELETE_AUDIT(auditId), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
      toast.success('Audit deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete audit');
      console.error('Delete error:', error);
    },
  });

  // Change status mutation

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this audit?')) {
      deleteMutation.mutate(id);
    }
  };

  const openAuditDetails = (id: string) => {
    setSelectedAuditId(id);
    setShowDetailsView(true);
  };

  const backToList = () => {
    setShowDetailsView(false);
    setSelectedAuditId(null);
  };


  const openEditAudit = (id: string) => {
    setEditingAuditId(id);
    setShowEditView(true);
    setShowDetailsView(false);
  };

  const closeEditAudit = () => {
    setShowEditView(false);
    setEditingAuditId(null);
    if (selectedAuditId) {
      setShowDetailsView(true);
    }
  };

  const handleFilterChange = (e: { target: { name: any; value: any; }; }) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      status: '',
      auditType: '',
      startDate: '',
      endDate: '',
    });
  };

  // Filter audits by search term
  const filteredAudits = auditsData?.audits?.filter((audit: { name: string; }) =>
    audit.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto px-4 py-8"
    >
      <AnimatePresence mode="wait">
        {!showDetailsView && !showEditView ? (
          <motion.div
            key="list-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden border border-blue-100"
            >
              {/* Table Header with Title and Actions */}
              <div className="bg-gradient-to-r from-blue-50 to-white p-6 border-b border-blue-100">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                  <div className="flex-1">
                    <motion.div 
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                    >
                      <h1 className="text-3xl font-bold text-gray-800 mb-2">Audit Management</h1>
                      <p className="text-gray-600">Track, manage and review all your audits in one place</p>
                    </motion.div>
                  </div>
                  
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Link 
                      to="/audits/new" 
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md flex items-center font-medium hover:shadow-lg transform hover:scale-105"
                    >
                      <Plus size={20} className="mr-2" />
                      Create New Audit
                    </Link>
                  </motion.div>
                </div>

                {/* Search and Filter Controls */}
                <div className="mt-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div className="relative w-full lg:w-80">
                    <input
                      type="text"
                      placeholder="Search audits..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                    />
                    <Search className="absolute left-4 top-3.5 text-blue-400" size={20} />
                  </div>
                  
                  <div className="flex items-center gap-3 flex-wrap">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsFilterVisible(!isFilterVisible)}
                      className="flex items-center px-4 py-3 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-all duration-200 shadow-sm text-blue-700 font-medium"
                    >
                      <Filter size={18} className="mr-2" />
                      {isFilterVisible ? 'Hide Filters' : 'Show Filters'}
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => refetch()}
                      className="flex items-center px-4 py-3 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-all duration-200 shadow-sm text-blue-700 font-medium"
                    >
                      <RefreshCcw size={18} className="mr-2" />
                      Refresh
                    </motion.button>
                  </div>
                </div>

                {/* Filter Panel with smooth animation */}
                <motion.div
                  initial={false}
                  animate={{ 
                    height: isFilterVisible ? 'auto' : 0,
                    opacity: isFilterVisible ? 1 : 0,
                    marginTop: isFilterVisible ? 24 : 0
                  }}
                  transition={{ 
                    duration: 0.4,
                    ease: [0.4, 0.0, 0.2, 1]
                  }}
                  style={{ overflow: 'hidden' }}
                >
                  <div className="p-6 bg-white rounded-xl border border-blue-100 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">Filter Options</h3>
                      <button 
                        onClick={() => setIsFilterVisible(false)}
                        className="p-1 rounded-full hover:bg-blue-50 transition-colors"
                      >
                        <X size={18} className="text-gray-500" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                          name="status"
                          value={filters.status}
                          onChange={handleFilterChange}
                          className="w-full p-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="">All Statuses</option>
                          <option value="PLANNED">Planned</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Audit Type</label>
                        <select
                          name="auditType"
                          value={filters.auditType}
                          onChange={handleFilterChange}
                          className="w-full p-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="">All Types</option>
                          <option value="INTERNAL">Internal</option>
                          <option value="EXTERNAL">External</option>
                          <option value="COMPLIANCE">Compliance</option>
                          <option value="PROCESS">Process</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                        <input
                          type="date"
                          name="startDate"
                          value={filters.startDate}
                          onChange={handleFilterChange}
                          className="w-full p-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                        <input
                          type="date"
                          name="endDate"
                          value={filters.endDate}
                          onChange={handleFilterChange}
                          className="w-full p-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end gap-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={resetFilters}
                        className="px-5 py-2.5 text-sm border border-blue-200 rounded-lg hover:bg-blue-50 bg-white shadow-sm font-medium text-blue-700"
                      >
                        Reset Filters
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          refetch();
                          setIsFilterVisible(false);
                        }}
                        className="px-5 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm font-medium"
                      >
                        Apply Filters
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Table Content */}
              {isLoading ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-16 flex flex-col items-center justify-center"
                >
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
                  <p className="mt-4 text-gray-600 font-medium">Loading audits...</p>
                </motion.div>
              ) : isError ? (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="p-16 flex flex-col items-center justify-center text-rose-600 bg-rose-50 m-6 rounded-lg"
                >
                  <AlertTriangle size={48} className="mb-4" />
                  <p className="text-lg font-medium">Error loading audits</p>
                  <p className="text-sm text-rose-500 mt-2">Please try refreshing the page</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => refetch()}
                    className="mt-4 px-5 py-2.5 bg-white text-rose-600 rounded-lg border border-rose-200 hover:bg-rose-50 shadow-sm"
                  >
                    Try Again
                  </motion.button>
                </motion.div>
              ) : filteredAudits.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-16 flex flex-col items-center justify-center text-gray-500 bg-blue-50 m-6 rounded-lg"
                >
                  <Clipboard size={48} className="mb-4 text-blue-400" />
                  <p className="text-lg font-medium text-gray-700">No audits found</p>
                  <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
                  <Link 
                    to="/audits/new" 
                    className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm font-medium"
                  >
                    <Plus size={18} className="mr-2" />
                    Create Your First Audit
                  </Link>
                </motion.div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-blue-100">
                    <thead className="bg-blue-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900 uppercase tracking-wider">Audit Name</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900 uppercase tracking-wider">Department</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900 uppercase tracking-wider">Schedule</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-blue-50">
                      {filteredAudits.map((audit: {
                        id: string;
                        name: string;
                        auditType: string;
                        department?: { name?: string };
                        status: string;
                        startDate: string;
                        endDate?: string;
                        _count?: { findings?: number };
                      }, index: number) => (
                        <motion.tr 
                          key={audit.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                          className="group hover:shadow-sm transition-all duration-200"
                        >
                          <td className="px-6 py-4">
                            <div 
                              className="text-sm font-semibold text-blue-700 cursor-pointer hover:text-blue-900 group-hover:underline transition-colors"
                              onClick={() => openAuditDetails(audit.id)}
                            >
                              {audit.name}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-700 font-medium">{audit.auditType}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center text-sm text-gray-700">
                              <Building size={16} className="mr-2 text-blue-500" />
                              {audit.department?.name || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={audit.status} />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center text-sm text-gray-700">
                              <Calendar size={16} className="mr-2 text-blue-500" />
                              <div>
                                {new Date(audit.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} 
                                {audit.endDate && (
                                  <div className="text-xs text-gray-500">
                                    to {new Date(audit.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              {/* View Details Button - Always visible */}
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => openAuditDetails(audit.id)}
                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                title="View Details"
                              >
                                <Eye size={16} />
                              </motion.button>
                              
                              {/* Edit Button - Only visible when status is PLANNED */}
                              {audit.status === 'PLANNED' && (
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => openEditAudit(audit.id)}
                                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-all duration-200"
                                  title="Edit"
                                >
                                  <Edit size={16} />
                                </motion.button>
                              )}
                              
                              {/* Delete Button - Only visible when status is PLANNED */}
                              {audit.status === 'PLANNED' && (
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleDelete(audit.id)}
                                  className="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-all duration-200"
                                  title="Delete"
                                >
                                  <Trash2 size={16} />
                                </motion.button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </motion.div>
        ) : showEditView ? (
          <motion.div
            key="edit-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-xl shadow-lg border border-blue-100"
          >
            <div className="p-6 border-b border-blue-100 bg-blue-50">
              <motion.button 
                whileHover={{ x: -3 }}
                onClick={closeEditAudit}
                className="inline-flex items-center text-blue-600 hover:text-blue-800 cursor-pointer font-medium mb-4"
              >
                <ArrowLeft size={18} className="mr-2" />
                Back to {selectedAuditId ? 'Details' : 'Audits'}
              </motion.button>
              
              <h1 className="text-2xl font-bold text-gray-800">Edit Audit</h1>
            </div>
            
            {editingAuditId && (
              <EditAuditForm
                auditId={editingAuditId}
                onCancel={closeEditAudit}
                onSaveSuccess={() => {
                  toast.success('Audit updated successfully');
                  closeEditAudit();
                }}
              />
            )}
          </motion.div>
        ) : (
          <AuditDetails 
            auditId={selectedAuditId}
            onBack={backToList}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AuditList;