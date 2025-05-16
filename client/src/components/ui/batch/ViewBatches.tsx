import {  useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { API_ROUTES } from "../../../utils/api";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {Search,Filter,Download,Plus,CheckCircle,XCircle,Clock,FileText,Eye,ChevronLeft,ChevronRight,AlertCircle,Calendar,Package,ChevronDown,RefreshCw,X,Beaker,FlaskConical} from "lucide-react";
import { format } from "date-fns";
import { generatePDF } from "../../../utils/exportPdf"

interface BatchFilter {
  batchNumber?: string;
  status?: string;
  productId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

const statusColors = {
  DRAFT: "bg-blue-50 text-blue-700 border-blue-200",
  SUBMITTED: "bg-purple-50 text-purple-700 border-purple-200",
  APPROVED: "bg-green-50 text-green-700 border-green-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200"
};

const statusIcons = {
  DRAFT: <Clock className="w-4 h-4 mr-1" />,
  SUBMITTED: <FileText className="w-4 h-4 mr-1" />,
  APPROVED: <CheckCircle className="w-4 h-4 mr-1" />,
  REJECTED: <XCircle className="w-4 h-4 mr-1" />
};

const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  return format(new Date(dateString), "MMM dd, yyyy");
};


export default function ViewBatches() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<BatchFilter>({
    page: 1,
    limit: 10
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);

  const authToken = localStorage.getItem("authToken");

  // Fetch products for filter dropdown
  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      try {
        const response = await axios.get(API_ROUTES.PRODUCT.GET_PRODUCTS, {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        });
        
        return response.data?.products || [];
      } catch (error) {
        console.error("Error fetching products:", error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: false
  });

  // Handle success for products query
  useEffect(() => {
    if (productsQuery.data) {
      setProducts(productsQuery.data);
    }
  }, [productsQuery.data]);

  // TanStack Query hook to fetch batches
  const { 
    data: batchesData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ["batches", filters],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      
      if (filters.batchNumber) queryParams.append("batchNumber", filters.batchNumber);
      if (filters.status) queryParams.append("status", filters.status);
      if (filters.productId) queryParams.append("productId", filters.productId);
      if (filters.dateFrom) queryParams.append("dateFrom", filters.dateFrom);
      if (filters.dateTo) queryParams.append("dateTo", filters.dateTo);
      if (filters.page) queryParams.append("page", filters.page.toString());
      if (filters.limit) queryParams.append("limit", filters.limit.toString());
      
      
      const response = await axios.get(`${API_ROUTES.BATCH.GET_BATCHES}?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      
      return response.data;
    },
    refetchOnWindowFocus: false
  });

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({
      ...prev,
      page
    }));
  };

  const handleViewDetails = (batch: any) => {
    setSelectedBatch(batch);
    setIsDetailsOpen(true);
  };

  const handleExportToPDF = () => {
    if (!batchesData || !batchesData.batches) {
      return;
    }
    
    // First, get detailed batch data for the PDF
    const detailedBatchData = batchesData.batches.map((batch: { parameterValuesByCategory: { [s: string]: unknown; } | ArrayLike<unknown>; recentActivities: any[]; batchNumber: any; productName: any; dateOfProduction: string; bestBeforeDate: string; status: any; maker: { name: any; }; checker: { name: any; }; sampleAnalysisStatus: any; createdAt: string; updatedAt: string; standards: any[]; }) => {
      // Format parameter values by category for each batch
      const parameterCategories: Record<string, any[]> = {};
      
      if (batch.parameterValuesByCategory) {
        Object.entries(batch.parameterValuesByCategory).forEach(([categoryName, parameters]) => {
          // Format each parameter with its value, unit, and methodology
          parameterCategories[categoryName] = (parameters as any[]).map(param => ({
            name: param.parameter.name,
            value: param.value || 'N/A',
            unit: param.unit ? param.unit.symbol : '',
            methodology: param.methodology ? param.methodology.name : 'N/A'
          }));
        });
      }
      
      // Get unique methodologies
      const uniqueMethodologies = batch.parameterValuesByCategory
        ? Array.from(new Set(
            Object.values(batch.parameterValuesByCategory)
              .flat()
              .filter((param: any) => param.methodology)
              .map((param: any) => param.methodology.name)
          ))
        : [];
      
      // Format batch activities
      const activities = batch.recentActivities && batch.recentActivities.length > 0
        ? batch.recentActivities.map((activity: any) => ({
            details: activity.details,
            by: activity.User?.name || 'System',
            date: formatDate(activity.createdAt)
          }))
        : [];
      
      // Return formatted batch data
      return {
        batchNumber: batch.batchNumber,
        product: batch.productName,
        productionDate: formatDate(batch.dateOfProduction),
        bestBefore: formatDate(batch.bestBeforeDate),
        status: batch.status,
        createdBy: batch.maker?.name || "N/A",
        checkedBy: batch.checker?.name || "Not checked yet",
        analysisStatus: batch.sampleAnalysisStatus,
        createdAt: formatDate(batch.createdAt),
        updatedAt: formatDate(batch.updatedAt),
        parameterCategories,
        standards: batch.standards?.map((std: any) => std.name) || [],
        methodologies: uniqueMethodologies,
        activities
      };
    });
    
    // Collect applied filters for the report
    const appliedFilters: Record<string, string> = {};
    if (filters.batchNumber) appliedFilters["Batch Number"] = filters.batchNumber;
    if (filters.status) appliedFilters["Status"] = filters.status;
    if (filters.productId) {
      const productName = products.find(p => p.id === filters.productId)?.name;
      appliedFilters["Product"] = productName || filters.productId;
    }
    if (filters.dateFrom) appliedFilters["Date From"] = filters.dateFrom;
    if (filters.dateTo) appliedFilters["Date To"] = filters.dateTo;
    
    // Generate PDF with detailed batch information
    generatePDF({
      title: "Detailed Batch Records Report",
      subtitle: "Complete Analysis and Parameters",
      filename: `detailed_batch_records_${new Date().toISOString().split('T')[0]}`,
      data: detailedBatchData,
      orientation: 'portrait',
      filters: appliedFilters,
      footer: "Confidential - Batchflow System",
      customSections: [
        {
          title: "Export Information",
          content: `This report contains detailed information for ${detailedBatchData.length} batch records, including all parameter values, methodologies, and activities. Generated from the Batchflow management system on ${new Date().toLocaleDateString()}.`
        }
      ],
      // Special flag to indicate this is a detailed batch report with complex structure
      isDetailedBatchReport: true
    });
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 10
    });
  };

  return (
    <motion.div 
      className="p-6 min-h-screen"
      style={{ 
        background: "linear-gradient(to bottom right, #f8faff, #edf2ff, #e6eeff)"
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <Package size={32} className="text-blue-600" />
            <span className="border-b-4 border-blue-400 pb-1">Batch Management</span>
          </h1>
          <p className="text-gray-600 max-w-2xl">
            View and manage all batch records. Filter, search, and export data as needed.
          </p>
        </motion.div>

        {/* Actions and Search Bar */}
        <motion.div 
          className="flex flex-col md:flex-row gap-4 mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-blue-400" />
            </div>
            <input
              type="text"
              placeholder="Search by batch number..."
              value={filters.batchNumber || ""}
              onChange={(e) => handleFilterChange("batchNumber", e.target.value)}
              className="pl-10 pr-4 py-3 w-full border border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-300 outline-none transition-all duration-200 shadow-sm"
            />
          </div>
          
          <div className="flex gap-3 shrink-0">
            <motion.button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 px-4 py-2.5 border border-blue-200 bg-white rounded-xl hover:bg-blue-50 transition-colors duration-200 shadow-sm"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Filter className="h-5 w-5 text-blue-600" />
              <span className="text-blue-700">Filters</span>
              <motion.div
                animate={{ rotate: isFilterOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown size={16} className="text-blue-600" />
              </motion.div>
            </motion.button>
            
            <motion.button
              onClick={handleExportToPDF}
              className="flex items-center gap-2 px-4 py-2.5 border border-blue-200 bg-white rounded-xl hover:bg-blue-50 transition-colors duration-200 shadow-sm"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Download className="h-5 w-5 text-blue-600" />
              <span className="text-blue-700">Export</span>
            </motion.button>
            
            <motion.button
              onClick={() => navigate("/create-batch")}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-md"
              whileHover={{ 
                scale: 1.03, 
                boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3), 0 4px 6px -2px rgba(59, 130, 246, 0.15)" 
              }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <Plus className="h-5 w-5" />
              <span>New Batch</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Filter Section - Collapsible */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div 
              className="mb-8 overflow-hidden"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="p-6 border border-blue-100 rounded-xl bg-white shadow-sm">
                <h3 className="text-lg font-medium text-gray-800 mb-4 pb-2 border-b border-blue-100 flex items-center gap-2">
                  <Filter size={18} className="text-blue-600" />
                  Filter Options
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <div className="relative">
                      <select
                        id="status"
                        value={filters.status || ""}
                        onChange={(e) => handleFilterChange("status", e.target.value)}
                        className="w-full p-3 pl-4 pr-10 border border-blue-100 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-300 outline-none"
                      >
                        <option value="">All Statuses</option>
                        <option value="DRAFT">Draft</option>
                        <option value="SUBMITTED">Submitted</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <ChevronDown size={16} className="text-gray-400" />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="productId" className="block text-sm font-medium text-gray-700 mb-1">
                      Product
                    </label>
                    <div className="relative">
                      <select
                        id="productId"
                        value={filters.productId || ""}
                        onChange={(e) => handleFilterChange("productId", e.target.value)}
                        className="w-full p-3 pl-4 pr-10 border border-blue-100 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-300 outline-none"
                      >
                        <option value="">All Products</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <ChevronDown size={16} className="text-gray-400" />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-1">
                      Production Date (From)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar size={16} className="text-blue-400" />
                      </div>
                      <input
                        type="date"
                        id="dateFrom"
                        value={filters.dateFrom || ""}
                        onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                        className="w-full p-3 pl-10 border border-blue-100 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-300 outline-none"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-1">
                      Production Date (To)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar size={16} className="text-blue-400" />
                      </div>
                      <input
                        type="date"
                        id="dateTo"
                        value={filters.dateTo || ""}
                        onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                        className="w-full p-3 pl-10 border border-blue-100 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-300 outline-none"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex gap-3 justify-end">
                  <motion.button
                    onClick={clearFilters}
                    className="px-4 py-2.5 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-2">
                      <RefreshCw size={16} />
                      <span>Clear Filters</span>
                    </div>
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      refetch();
                      setIsFilterOpen(false);
                    }}
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-lg shadow-md"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-2">
                      <Filter size={16} />
                      <span>Apply Filters</span>
                    </div>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Filters */}
        {(filters.status || filters.productId || filters.dateFrom || filters.dateTo) && (
          <motion.div
            className="flex flex-wrap gap-2 mb-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {filters.status && (
              <div className="flex items-center bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm border border-blue-200">
                Status: {filters.status}
                <button 
                  onClick={() => handleFilterChange("status", "")}
                  className="ml-2 hover:text-blue-900"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            {filters.productId && (
              <div className="flex items-center bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm border border-blue-200">
                Product: {products.find(p => p.id === filters.productId)?.name || filters.productId}
                <button 
                  onClick={() => handleFilterChange("productId", "")}
                  className="ml-2 hover:text-blue-900"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            {filters.dateFrom && (
              <div className="flex items-center bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm border border-blue-200">
                From: {filters.dateFrom}
                <button 
                  onClick={() => handleFilterChange("dateFrom", "")}
                  className="ml-2 hover:text-blue-900"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            {filters.dateTo && (
              <div className="flex items-center bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm border border-blue-200">
                To: {filters.dateTo}
                <button 
                  onClick={() => handleFilterChange("dateTo", "")}
                  className="ml-2 hover:text-blue-900"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Batches List */}
        <motion.div 
  className="bg-transparent rounded-xl shadow-md border border-blue-100 overflow-hidden"
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, delay: 0.3 }}
>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <motion.div
                className="flex flex-col items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="relative h-16 w-16">
                  <motion.div 
                    className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-t-blue-500 border-r-blue-300 border-b-blue-100 border-l-blue-300"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  ></motion.div>
                </div>
                <p className="text-gray-600 mt-4 font-medium">Loading batches...</p>
              </motion.div>
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 bg-red-50 text-red-700 p-6 rounded-lg m-4">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <div>
                <p className="font-medium">Error loading batches</p>
                <p className="text-sm mt-1">Please try again or check your connection</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="ml-auto bg-white text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-sm flex items-center gap-2"
                onClick={() => refetch()}
              >
                <RefreshCw size={14} />
                <span>Retry</span>
              </motion.button>
            </div>
          ) : batchesData?.batches?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <motion.div 
                className="h-24 w-24 mb-6 bg-blue-50 text-blue-400 rounded-full flex items-center justify-center"
                animate={{ scale: [0.9, 1.1, 1] }}
                transition={{ duration: 1.5, times: [0, 0.5, 1] }}
              >
                <Package className="h-12 w-12" />
              </motion.div>
              <h3 className="text-xl font-medium text-gray-800 mb-2">No batches found</h3>
              <p className="text-gray-500 max-w-md mb-6">
                No batches match your current search criteria. Try adjusting your filters or create a new batch.
              </p>
              <motion.button
                onClick={() => navigate("/create-batch")}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-md"
                whileHover={{ 
                  scale: 1.03, 
                  boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3), 0 4px 6px -2px rgba(59, 130, 246, 0.15)" 
                }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                <Plus className="h-5 w-5" />
                <span>Create New Batch</span>
              </motion.button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-blue-100">
                  <thead className="bg-blue-50">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                        Batch Number
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                        Product
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                        Production Date
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                        Best Before
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                        Created By
                      </th>
                      <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-blue-800 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-blue-50">
                    {batchesData.batches.map((batch: any, index: number) => (
                      <motion.tr 
                        key={batch.id} 
                        className="hover:bg-blue-50 transition-colors duration-150"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {batch.batchNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {batch.productName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(batch.dateOfProduction)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(batch.bestBeforeDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[batch.status as keyof typeof statusColors]}`}>
                            {statusIcons[batch.status as keyof typeof statusIcons]}
                            {batch.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {batch.maker?.name || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <motion.button
                            onClick={() => handleViewDetails(batch)}
                            className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors flex items-center gap-1"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="text-xs">View</span>
                          </motion.button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {batchesData.pagination && batchesData.pagination.totalPages > 1 && (
                <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 border-t border-blue-100 flex items-center justify-between">
                  <div className="text-sm text-blue-800">
                    Showing <span className="font-medium">{(batchesData.pagination.page - 1) * batchesData.pagination.limit + 1}</span> to{" "}
                    <span className="font-medium">
                      {Math.min(batchesData.pagination.page * batchesData.pagination.limit, batchesData.pagination.totalCount)}
                    </span>{" "}
                    of <span className="font-medium">{batchesData.pagination.totalCount}</span> results
                  </div>
                  <div className="flex space-x-2">
                    <motion.button
                      onClick={() => handlePageChange(Math.max(1, filters.page! - 1))}
                      disabled={filters.page === 1}
                      className={`p-2 rounded-md ${
                        filters.page === 1
                          ? "text-blue-300 cursor-not-allowed"
                          : "text-blue-600 hover:bg-blue-200/50"
                      }`}
                      whileHover={filters.page !== 1 ? { scale: 1.1 } : {}}
                      whileTap={filters.page !== 1 ? { scale: 0.9 } : {}}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </motion.button>
                    
                    {Array.from({ length: batchesData.pagination.totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        const currentPage = filters.page || 1;
                        return (
                          page === 1 ||
                          page === batchesData.pagination.totalPages ||
                          Math.abs(page - currentPage) <= 1
                        );
                      })
                      .map((page, i, filteredPages) => {
                        const currentPage = filters.page || 1;
                        
                        // Add ellipsis when needed
                        if (i > 0 && filteredPages[i - 1] !== page - 1) {
                          return (
                            <span
                              key={`ellipsis-${page}`}
                              className="px-3 py-1.5 text-blue-500"
                            >
                              ...
                            </span>
                          );
                        }
                        
                        return (
                          <motion.button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-1 rounded-md ${
                              currentPage === page
                                ? "bg-blue-600 text-white"
                                : "text-blue-600 hover:bg-blue-100"
                            }`}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                          >
                            {page}
                          </motion.button>
                        );
                      })}
                    
                    <motion.button
                      onClick={() =>
                        handlePageChange(Math.min(batchesData.pagination.totalPages, filters.page! + 1))
                      }
                      disabled={filters.page === batchesData.pagination.totalPages}
                      className={`p-2 rounded-md ${
                        filters.page === batchesData.pagination.totalPages
                          ? "text-blue-300 cursor-not-allowed"
                          : "text-blue-600 hover:bg-blue-200/50"
                      }`}
                      whileHover={filters.page !== batchesData.pagination.totalPages ? { scale: 1.1 } : {}}
                      whileTap={filters.page !== batchesData.pagination.totalPages ? { scale: 0.9 } : {}}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </motion.button>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>

      {/* Batch Details Slide-In */}
      <AnimatePresence>
        {isDetailsOpen && selectedBatch && (
          <motion.div
            className="fixed inset-0  bg-opacity-30 z-50 flex justify-end backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsDetailsOpen(false);
            }}
          >
            <motion.div 
              className="bg-white h-full w-full md:max-w-2xl overflow-y-auto shadow-xl"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex justify-between items-center shadow-md">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Batch Details
                </h2>
                <motion.button
                  onClick={() => setIsDetailsOpen(false)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-white"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </div>

              <div className="p-6 space-y-6">
                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${statusColors[selectedBatch.status as keyof typeof statusColors]}`}>
                    {statusIcons[selectedBatch.status as keyof typeof statusIcons]}
                    {selectedBatch.status}
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    Created: {formatDate(selectedBatch.createdAt)}
                  </div>
                </div>

                {/* Basic Info */}
                <motion.div 
                  className="bg-blue-50 border border-blue-100 rounded-xl p-5 shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <h3 className="text-lg font-medium text-gray-800 mb-4 border-b border-blue-200 pb-2 flex items-center gap-2">
                    <Package size={18} className="text-blue-600" />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <p className="text-sm text-blue-700 mb-1">Batch Number</p>
                      <p className="font-medium text-gray-800">{selectedBatch.batchNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-700 mb-1">Product Name</p>
                      <p className="font-medium text-gray-800">{selectedBatch.productName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-700 mb-1">Date of Production</p>
                      <p className="font-medium text-gray-800">{formatDate(selectedBatch.dateOfProduction)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-700 mb-1">Best Before Date</p>
                      <p className="font-medium text-gray-800">{formatDate(selectedBatch.bestBeforeDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-700 mb-1">Made By</p>
                      <p className="font-medium text-gray-800">{selectedBatch.maker?.name || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-700 mb-1">Checked By</p>
                      <p className="font-medium text-gray-800">{selectedBatch.checker?.name || "Not checked yet"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-700 mb-1">Analysis Status</p>
                      <p className="font-medium text-gray-800">{selectedBatch.sampleAnalysisStatus}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Parameter Values by Category */}
                {selectedBatch.parameterValuesByCategory && 
                  Object.entries(selectedBatch.parameterValuesByCategory as Record<string, any[]>).map(([categoryName, parameters], index) => (
                    <motion.div 
                      key={categoryName}
                      className="bg-blue-50 border border-blue-100 rounded-xl p-5 shadow-sm"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 + (index * 0.1) }}
                    >
                      <h3 className="text-lg font-medium text-gray-800 mb-4 border-b border-blue-200 pb-2 flex items-center gap-2">
                        <Beaker size={18} className="text-blue-600" />
                        {/* Format the category name for display (capitalize first letter) */}
                        {categoryName.charAt(0).toUpperCase() + categoryName.slice(1)} Parameters
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {parameters.map((param: any) => (
                          <div key={param.id} className="border border-blue-100 bg-white rounded-lg p-3 shadow-sm">
                            <p className="text-sm text-blue-700 mb-1">{param.parameter.name}</p>
                            <div className="flex items-center">
                              <p className="font-medium text-gray-800">{param.value || "N/A"}</p>
                              {param.unit && (
                                <span className="ml-1 text-sm text-gray-500">{param.unit.symbol}</span>
                              )}
                            </div>
                            {param.methodology && (
                              <div className="mt-1 flex items-center">
                                <FlaskConical size={14} className="text-gray-400 mr-1" />
                                <p className="text-xs text-gray-500">Method: {param.methodology.name}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))
                }

                {/* Standards & Methodologies */}
                <motion.div 
                  className="bg-blue-50 border border-blue-100 rounded-xl p-5 shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                >
                  <h3 className="text-lg font-medium text-gray-800 mb-4 border-b border-blue-200 pb-2">
                    Standards & Methodologies
                  </h3>
                  
                  <div className="mb-5">
                    <p className="text-sm text-blue-700 mb-2">Applied Standards</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedBatch.standards?.length > 0 ? (
                        selectedBatch.standards.map((standard: any) => (
                          <span
                            key={standard.id}
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200"
                          >
                            {standard.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500">No standards applied</span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-blue-700 mb-2">Methodologies</p>
                    <div className="flex flex-wrap gap-2">
                      {/* Get unique methodologies from parameter values */}
                      {selectedBatch.parameterValuesByCategory && 
                        Object.values(selectedBatch.parameterValuesByCategory)
                          .flat()
                          .filter((param: any) => param.methodology)
                          .filter((param: any, index: number, self: any[]) => 
                            index === self.findIndex((p: any) => p.methodology.id === param.methodology.id)
                          )
                          .map((param: any) => (
                            <span
                              key={param.methodology.id}
                              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200"
                            >
                              {param.methodology.name}
                            </span>
                          ))
                      }
                      {(!selectedBatch.parameterValuesByCategory || 
                        !Object.values(selectedBatch.parameterValuesByCategory)
                          .flat()
                          .some((param: any) => param.methodology)) && (
                        <span className="text-gray-500">No methodologies applied</span>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Recent Activities */}
                <motion.div 
                  className="bg-blue-50 border border-blue-100 rounded-xl p-5 shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.6 }}
                >
                  <h3 className="text-lg font-medium text-gray-800 mb-4 border-b border-blue-200 pb-2 flex items-center gap-2">
                    <Clock size={18} className="text-blue-600" />
                    Recent Activities
                  </h3>
                  {selectedBatch.recentActivities?.length > 0 ? (
                    <ul className="space-y-3">
                      {selectedBatch.recentActivities.map((activity: any, index: number) => (
                        <motion.li 
                          key={activity.id} 
                          className="py-2 px-3 bg-white rounded-lg border border-blue-100 shadow-sm"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.7 + (index * 0.1) }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                              <Clock size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">{activity.details}</p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                By {activity.User?.name} • {formatDate(activity.createdAt)}
                              </p>
                            </div>
                          </div>
                        </motion.li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No recent activities</p>
                  )}
                </motion.div>

                {/* Actions */}
                <div className="sticky bottom-0 py-4 border-t border-blue-100 flex justify-end bg-white">
                  <motion.button
                    onClick={() => setIsDetailsOpen(false)}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg shadow-md flex items-center gap-2"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  >
                    <CheckCircle size={16} />
                    <span>Done</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}