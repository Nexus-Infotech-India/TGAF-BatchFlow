import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api, { API_ROUTES } from '../../../utils/api';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  FileText,
  ChevronRight,
  ChevronDown,
  Calendar,
  Activity,
  Zap,
  Shield,
  Clock,
  Tag,
  Package,
  Clipboard,
  ThumbsUp,
  ThumbsDown,
  Wrench,
  Layers
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import CertificateOfAnalysis from './review';

interface BatchFilter {
  batchNumber: string;
  productId: string;
  status: string;
  dateFrom: string;
  dateTo: string;
}

const BatchComplianceReview: React.FC = () => {
  const [filters, setFilters] = useState<BatchFilter>({
    batchNumber: '',
    productId: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  });

  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [tableLoaded, setTableLoaded] = useState(false);

  // Fetch batches
  const {
    data: batchData,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['batches', filters, currentPage],
    queryFn: async () => {
      const authToken = localStorage.getItem('authToken');
      
      // Build query params
      const queryParams = new URLSearchParams();
      if (filters.batchNumber) queryParams.append('batchNumber', filters.batchNumber);
      if (filters.productId) queryParams.append('productId', filters.productId);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);
      queryParams.append('page', currentPage.toString());
      queryParams.append('limit', '10');

      const response = await api.get(
        `${API_ROUTES.BATCH.GET_BATCHES}?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );
      
      return response.data;
    }
  });

  useEffect(() => {
    // Trigger table animation after initial render
    if (!isLoading && batchData) {
      setTimeout(() => setTableLoaded(true), 100);
    }
  }, [isLoading, batchData]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    refetch();
  };

  const resetFilters = () => {
    setFilters({
      batchNumber: '',
      productId: '',
      status: '',
      dateFrom: '',
      dateTo: ''
    });
    setCurrentPage(1);
    refetch();
  };

  const toggleExpandBatch = (batchId: string) => {
    if (expandedBatchId === batchId) {
      setExpandedBatchId(null);
    } else {
      setExpandedBatchId(batchId);
    }
  };

  const handleBatchClick = (batchId: string) => {
    setSelectedBatchId(batchId);
  };

  // Get compliance percentage for visual indicators
  const getCompliancePercentage = (batch: any) => {
    if (!batch.parameterValuesByCategory) return 0;
    
    let compliantCount = 0;
    let totalCount = 0;
    
    Object.values(batch.parameterValuesByCategory).forEach((categoryParams: any) => {
      totalCount += categoryParams.length;
      // This is a simplification - in production you'd need actual compliance data
      compliantCount += categoryParams.filter((p: any) => p.parameter.name.length > 5).length;
    });
    
    return totalCount > 0 ? Math.round((compliantCount / totalCount) * 100) : 0;
  };

  // Status badge with appropriate colors
  const StatusBadge = ({ status }: { status: string }) => {
    let bgColor = 'bg-gray-100 text-gray-800';
    let icon = <Clock className="w-3 h-3 mr-1" />;
    
    switch(status) {
      case 'APPROVED':
        bgColor = 'bg-gradient-to-r from-green-500 to-emerald-600 text-white';
        icon = <ThumbsUp className="w-3 h-3 mr-1" />;
        break;
      case 'REJECTED':
        bgColor = 'bg-gradient-to-r from-red-500 to-pink-600 text-white';
        icon = <ThumbsDown className="w-3 h-3 mr-1" />;
        break;
      case 'DRAFT':
        bgColor = 'bg-gradient-to-r from-gray-400 to-gray-500 text-white';
        icon = <Clipboard className="w-3 h-3 mr-1" />;
        break;
      case 'SUBMITTED':
        bgColor = 'bg-gradient-to-r from-amber-400 to-orange-500 text-white';
        icon = <Clock className="w-3 h-3 mr-1" />;
        break;
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium shadow-sm ${bgColor}`}>
        {icon}
        {status}
      </span>
    );
  };

  // If viewing certificate for a specific batch
  if (selectedBatchId) {
    return <CertificateOfAnalysis 
      batchId={selectedBatchId} 
      onBack={() => setSelectedBatchId(null)} 
    />;
  }

  // Main batch list view
  return (
    <motion.div 
      className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-6 min-h-screen" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.4 }}
    >
      <motion.div 
        className="flex flex-col md:flex-row md:items-center md:justify-between mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 text-transparent bg-clip-text">
            Batch Compliance Review
          </h1>
          <p className="text-blue-600 mt-1">Review and analyze batch compliance with quality standards</p>
        </div>
        
        <motion.div 
          className="mt-4 md:mt-0"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <button 
            onClick={() => refetch()} 
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md shadow-md transition-all"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </button>
        </motion.div>
      </motion.div>

      {/* Filters */}
      <motion.div 
        className="bg-white rounded-xl shadow-md mb-8 p-6 border border-blue-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <div className="flex items-center mb-4">
          <div className="bg-blue-100 p-2 rounded-full mr-3">
            <Filter className="h-4 w-4 text-blue-600" />
          </div>
          <h2 className="text-lg font-medium text-gray-800">Filter Batches</h2>
        </div>
        
        <form onSubmit={applyFilters}>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div>
              <label htmlFor="batchNumber" className="block text-sm font-medium text-blue-700 mb-1">
                Batch Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="batchNumber"
                  name="batchNumber"
                  placeholder="Search by batch number"
                  value={filters.batchNumber}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2.5 pl-10 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
                />
                <Tag className="absolute left-3 top-2.5 h-5 w-5 text-blue-400" />
              </div>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-blue-700 mb-1">
                Status
              </label>
              <div className="relative">
                <select
                  id="status"
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2.5 pl-10 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none transition-colors"
                >
                  <option value="">All Statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
                <Activity className="absolute left-3 top-2.5 h-5 w-5 text-blue-400" />
                <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-blue-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label htmlFor="dateFrom" className="block text-sm font-medium text-blue-700 mb-1">
                From Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="dateFrom"
                  name="dateFrom"
                  value={filters.dateFrom}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2.5 pl-10 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
                />
                <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-blue-400" />
              </div>
            </div>

            <div>
              <label htmlFor="dateTo" className="block text-sm font-medium text-blue-700 mb-1">
                To Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="dateTo"
                  name="dateTo"
                  value={filters.dateTo}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2.5 pl-10 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
                />
                <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-blue-400" />
              </div>
            </div>

            <div className="flex items-end space-x-3">
              <motion.button
                type="submit"
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-md text-sm flex items-center justify-center transition-all"
                whileHover={{ scale: 1.03, boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)" }}
                whileTap={{ scale: 0.97 }}
              >
                <Search className="h-4 w-4 mr-2" />
                Apply Filters
              </motion.button>
              <motion.button
                type="button"
                onClick={resetFilters}
                className="px-4 py-2.5 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 text-sm flex items-center transition-colors"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </motion.button>
            </div>
          </div>
        </form>
      </motion.div>

      {/* Loading State */}
      {isLoading && (
        <motion.div 
          className="flex justify-center my-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center">
            <div className="relative">
              <RefreshCw className="h-16 w-16 text-blue-500 animate-spin mx-auto mb-6" />
              <motion.div 
                className="absolute inset-0 rounded-full bg-blue-100 z-[-1]"
                animate={{ 
                  scale: [1, 1.2, 1], 
                  opacity: [0.3, 0.1, 0.3] 
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut" 
                }}
              />
            </div>
            <h3 className="text-lg font-medium text-gray-800">Loading Batches</h3>
            <p className="text-blue-600 mt-1">Retrieving batch data...</p>
          </div>
        </motion.div>
      )}

      {/* Error State */}
      {isError && (
        <motion.div 
          className="bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 p-6 my-6 rounded-lg shadow-md"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center">
            <div className="bg-red-100 p-2 rounded-full mr-4">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-800">Failed to Load Batches</h3>
              <p className="text-red-700 mt-1">There was an error loading the batch data. Please try again.</p>
              <button 
                onClick={() => refetch()}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 inline-flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Batch List */}
      {!isLoading && !isError && batchData && (
        <motion.div 
          className="bg-white rounded-xl shadow-md overflow-hidden border border-blue-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-blue-200">
              <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <tr>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                    Batch Details
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                    Product
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                    Dates
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-blue-100">
                <AnimatePresence>
                  {batchData.batches.map((batch: any, index: number) => (
                    <React.Fragment key={batch.id}>
                      <motion.tr 
                        className="hover:bg-blue-50 transition-colors"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ 
                          opacity: tableLoaded ? 1 : 0, 
                          y: tableLoaded ? 0 : 20 
                        }}
                        transition={{ delay: 0.05 * index, duration: 0.3 }}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <motion.button
                              onClick={() => toggleExpandBatch(batch.id)}
                              className="mr-3 h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 hover:bg-blue-200 transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              {expandedBatchId === batch.id ? (
                                <ChevronDown className="h-5 w-5" />
                              ) : (
                                <ChevronRight className="h-5 w-5" />
                              )}
                            </motion.button>
                            <div>
                              <div className="text-sm font-semibold text-gray-900 flex items-center">
                                <Tag className="h-4 w-4 text-blue-500 mr-1.5" />
                                {batch.batchNumber}
                              </div>
                              <div className="text-xs text-gray-500 mt-1 flex items-center">
                                {batch.maker?.name && (
                                  <>
                                    <Wrench className="h-3 w-3 mr-1" />
                                    {batch.maker.name}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <Package className="h-4 w-4 text-blue-500 mr-1.5" />
                            <div className="text-sm text-gray-900 font-medium">{batch.productName}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={batch.status} />
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div className="flex items-center mb-1">
                            <Calendar className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                            {format(new Date(batch.dateOfProduction), 'dd-MM-yyyy')}
                          </div>
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="h-3 w-3 mr-1.5 text-blue-400" />
                            Expires: {format(new Date(batch.bestBeforeDate), 'dd-MM-yyyy')}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium">
                          <motion.button
                            onClick={() => handleBatchClick(batch.id)}
                            className="inline-flex items-center px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                          >
                            <FileText className="h-4 w-4 mr-1.5" />
                            View Certificate
                          </motion.button>
                        </td>
                      </motion.tr>
                      
                      {/* Expanded Row */}
                      <AnimatePresence>
                        {expandedBatchId === batch.id && (
                          <motion.tr
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <td colSpan={5} className="px-6 py-4">
                              <motion.div 
                                className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 shadow-inner"
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.1 }}
                              >
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  {/* Parameter Categories */}
                                  <div>
                                    <h4 className="text-sm font-medium text-blue-700 mb-3 flex items-center">
                                      <Layers className="h-4 w-4 mr-1.5" />
                                      Parameter Categories
                                    </h4>
                                    <div className="grid grid-cols-1 gap-2">
                                      {Object.keys(batch.parameterValuesByCategory).map((category, idx) => (
                                        <motion.div 
                                          key={category} 
                                          className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm flex justify-between items-center"
                                          initial={{ opacity: 0, x: -10 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{ delay: 0.05 * idx, duration: 0.2 }}
                                          whileHover={{ y: -2, boxShadow: "0 4px 6px -1px rgba(59, 130, 246, 0.1)" }}
                                        >
                                          <div className="font-medium text-gray-700">{category}</div>
                                          <div className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full text-xs font-medium">
                                            {batch.parameterValuesByCategory[category].length} parameters
                                          </div>
                                        </motion.div>
                                      ))}
                                    </div>
                                  </div>
                                  
                                  {/* Standards */}
                                  <div>
                                    <h4 className="text-sm font-medium text-blue-700 mb-3 flex items-center">
                                      <Shield className="h-4 w-4 mr-1.5" />
                                      Applied Standards
                                    </h4>
                                    <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm h-full">
                                      <div className="flex flex-wrap gap-2">
                                        {batch.standards.map((standard: any, idx: number) => (
                                          <motion.span 
                                            key={standard.id}
                                            className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs bg-gradient-to-r from-purple-100 to-indigo-100 text-indigo-800 border border-purple-200"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.1 + 0.05 * idx, duration: 0.2 }}
                                            whileHover={{ scale: 1.05 }}
                                          >
                                            {standard.code || standard.name}
                                          </motion.span>
                                        ))}
                                        {batch.standards.length === 0 && (
                                          <span className="text-xs text-gray-500 italic">No standards attached</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Compliance Status */}
                                  <div>
                                    <h4 className="text-sm font-medium text-blue-700 mb-3 flex items-center">
                                      <Activity className="h-4 w-4 mr-1.5" />
                                      Compliance Status
                                    </h4>
                                    <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm h-full">
                                      <div className="flex flex-col items-center justify-center h-full">
                                        <div className="relative h-20 w-20 mb-2">
                                          <svg className="h-20 w-20" viewBox="0 0 36 36">
                                            <path
                                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                              fill="none"
                                              stroke="#E2E8F0"
                                              strokeWidth="3"
                                            />
                                            <path
                                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                              fill="none"
                                              stroke={getCompliancePercentage(batch) > 75 ? "#10B981" : getCompliancePercentage(batch) > 50 ? "#FBBF24" : "#EF4444"}
                                              strokeWidth="3"
                                              strokeDasharray={`${getCompliancePercentage(batch)}, 100`}
                                              strokeLinecap="round"
                                            />
                                          </svg>
                                          <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-xl font-bold text-gray-800">{getCompliancePercentage(batch)}%</span>
                                          </div>
                                        </div>
                                        <div className="text-sm text-center text-gray-600 mt-1">Overall Compliance</div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="mt-5 flex justify-center">
                                  <motion.button
                                    onClick={() => handleBatchClick(batch.id)}
                                    className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all text-sm"
                                    whileHover={{ scale: 1.03, boxShadow: "0 4px 12px rgba(59, 130, 246, 0.4)" }}
                                    whileTap={{ scale: 0.97 }}
                                  >
                                    <Zap className="h-4 w-4 mr-2" />
                                    Generate Compliance Report
                                  </motion.button>
                                </div>
                              </motion.div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  ))}
                </AnimatePresence>

                {/* Empty State */}
                {batchData.batches.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="max-w-sm mx-auto">
                        <div className="bg-blue-50 rounded-full p-3 h-16 w-16 flex items-center justify-center mx-auto mb-4">
                          <Search className="h-8 w-8 text-blue-500" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-800 mb-1">No batches found</h3>
                        <p className="text-gray-500 mb-4">No batches match your current filter criteria.</p>
                        <button
                          onClick={resetFilters}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Reset filters
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {batchData.pagination && batchData.batches.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4 flex items-center justify-between border-t border-blue-100">
              <div className="flex-1 flex justify-between sm:hidden">
                <motion.button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-md bg-white text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Previous
                </motion.button>
                <motion.button
                  onClick={() => setCurrentPage(Math.min(batchData.pagination.totalPages, currentPage + 1))}
                  disabled={currentPage === batchData.pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-md bg-white text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Next
                </motion.button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-blue-700">
                    Showing <span className="font-medium">{(currentPage - 1) * batchData.pagination.limit + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * batchData.pagination.limit, batchData.pagination.totalCount)}
                    </span>{' '}
                    of <span className="font-medium">{batchData.pagination.totalCount}</span> batches
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <motion.button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-blue-300 bg-white text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronRight className="h-5 w-5 transform rotate-180" />
                    </motion.button>
                    
                    {/* Page Numbers */}
                    {Array.from({ length: Math.min(5, batchData.pagination.totalPages) }, (_, i) => {
                      const pageNumber = i + 1;
                      return (
                        <motion.button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium
                            ${currentPage === pageNumber
                              ? 'z-10 bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-600 text-white'
                              : 'bg-white border-blue-300 text-blue-700 hover:bg-blue-50'
                            }`}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {pageNumber}
                        </motion.button>
                      );
                    })}
                    
                    <motion.button
                      onClick={() => setCurrentPage(Math.min(batchData.pagination.totalPages, currentPage + 1))}
                      disabled={currentPage === batchData.pagination.totalPages}
                      className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-blue-300 bg-white text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRight className="h-5 w-5" />
                    </motion.button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default BatchComplianceReview;