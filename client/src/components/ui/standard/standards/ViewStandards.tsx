import React, { useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
} from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import api, { API_ROUTES } from '../../../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpDown,
  Tag,
  Clipboard,
  ExternalLink,
  ChevronDown,
 
  Info,
  Award,
  FileText,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  X
} from 'lucide-react';

interface Standard {
  id: string;
  name: string;
  code: string;
  description: string;
  categoryId: string;
  createdById: string;
  modifiedById: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  Category: {
    id: string;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
  };
  CreatedBy: {
    id: string;
    name: string;
    email: string;
  };
  ModifiedBy: {
    id: string;
    name: string;
    email: string;
  } | null;
}

const fetchStandards = async (categoryId?: string | null, searchTerm?: string) => {
  const authToken = localStorage.getItem('authToken');
  const params: Record<string, string> = {};
  
  if (categoryId) params.categoryId = categoryId;
  if (searchTerm) params.search = searchTerm;
  
  const response = await api.get(API_ROUTES.STANDARD.GET_STANDARDS, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    params
  });
  return response.data.standards;
};

const ViewStandards: React.FC<{ 
  categoryId: string | null; 
  categoryName: string | null; 
  onClearFilter: () => void 
}> = ({
  categoryId,
  categoryName,
  onClearFilter,
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');

  // Debounce search term
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Using TanStack Query for data fetching
  const {
    data: standards = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['standards', categoryId, debouncedSearchTerm],
    queryFn: () => fetchStandards(categoryId, debouncedSearchTerm),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Column definition with optimized display for space-efficiency
  const columnHelper = createColumnHelper<Standard>();
  const columns = [
    // Primary column with expandable details
    columnHelper.accessor('name', {
      header: ({ column }) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1 font-semibold"
          >
            Name
            <ArrowUpDown size={14} className="text-blue-500" />
          </button>
        </div>
      ),
      cell: ({ row }) => {
        const isExpanded = expandedRowId === row.original.id;

        return (
          <div>
            <motion.div
              className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer flex items-center"
              onClick={() => setExpandedRowId(isExpanded ? null : row.original.id)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {row.original.name}
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="ml-1"
              >
                <ChevronDown size={14} />
              </motion.div>
            </motion.div>

            <AnimatePresence>
              {isExpanded && (
                <motion.div 
                  className="mt-2 bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-100 text-sm"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* ID */}
                    <div className="flex items-center">
                      <Tag size={16} className="text-blue-500 mr-2" />
                      <span className="text-blue-700 font-medium">ID:</span>
                      <span className="ml-2 text-gray-700 bg-white px-2 py-0.5 rounded border border-blue-100 text-xs font-mono">
                        {row.original.id}
                      </span>
                    </div>

                    {/* Code */}
                    <div className="flex items-center">
                      <Clipboard size={16} className="text-blue-500 mr-2" />
                      <span className="text-blue-700 font-medium">Code:</span>
                      <span className="ml-2 text-gray-700 bg-white px-2 py-0.5 rounded border border-blue-100">
                        {row.original.code || 'N/A'}
                      </span>
                    </div>

                    {/* Description */}
                    <div className="col-span-2 flex items-start">
                      <Info size={16} className="text-blue-500 mr-2 mt-0.5" />
                      <div>
                        <span className="text-blue-700 font-medium">Description:</span>
                        <p className="mt-1 text-gray-700 bg-white p-2 rounded border border-blue-100">
                          {row.original.description || 'No description provided.'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Category */}
                    <div className="flex items-center">
                      <FileText size={16} className="text-blue-500 mr-2" />
                      <span className="text-blue-700 font-medium">Category:</span>
                      <span className="ml-2 text-gray-700">{row.original.Category?.name || 'N/A'}</span>
                    </div>
                    
                    {/* Details Button */}
                    <div className="col-span-2 mt-2 flex justify-end">
                      <motion.button
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1.5 shadow-sm"
                        whileHover={{ scale: 1.03, backgroundColor: '#1e40af' }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <ExternalLink size={14} />
                        View Full Details
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      },
    }),

    // Category column
    columnHelper.accessor('Category.name', {
      header: 'Category',
      cell: ({ row }) => (
        <motion.div 
          className="px-2.5 py-1 rounded-full text-xs font-medium border border-blue-100 bg-blue-50 text-blue-700 inline-block"
          whileHover={{ scale: 1.05 }}
        >
          {row.original.Category?.name || 'N/A'}
        </motion.div>
      ),
    }),

    // People columns combined into one
    columnHelper.accessor('CreatedBy.name', {
      header: 'People',
      cell: ({ row }) => (
        <div className="space-y-1.5">
          <div className="text-xs flex items-center">
            <span className="font-medium text-blue-700 mr-1">Created:</span>{' '}
            <span className="text-gray-700">{row.original.CreatedBy?.name || 'N/A'}</span>
          </div>
          <div className="text-xs flex items-center">
            <span className="font-medium text-blue-700 mr-1">Modified:</span>{' '}
            <span className="text-gray-700">{row.original.ModifiedBy?.name || 'N/A'}</span>
          </div>
        </div>
      ),
    }),

    // Status column
    columnHelper.accessor('status', {
      header: 'Status',
      cell: ({ row }) => (
        <motion.div
          className={`px-2.5 py-1 rounded-full text-xs font-medium text-center inline-block ${
            row.original.status === 'ACTIVE'
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          {row.original.status}
        </motion.div>
      ),
    }),

    // Dates combined
    columnHelper.accessor('updatedAt', {
      header: 'Dates',
      cell: ({ row }) => {
        const createdDate = new Date(row.original.createdAt);
        const updatedDate = new Date(row.original.updatedAt);

        return (
          <div className="space-y-1.5 text-xs text-gray-600">
            <div className="flex items-center">
              <Calendar size={12} className="text-blue-500 mr-1" />
              <span className="font-medium text-blue-700 mr-1">Created:</span>{' '}
              {createdDate.toLocaleDateString()}
            </div>
            <div className="flex items-center">
              <Calendar size={12} className="text-blue-500 mr-1" />
              <span className="font-medium text-blue-700 mr-1">Updated:</span>{' '}
              {updatedDate.toLocaleDateString()}
            </div>
          </div>
        );
      },
    }),

    // Actions column
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const id = row.original.id;
        const handleCopy = () => {
          navigator.clipboard.writeText(id);
          // Toast notification would be better here
          alert('ID copied to clipboard!');
        };

        return (
          <div className="flex space-x-2 justify-end">
            <motion.button
              onClick={handleCopy}
              className="p-1.5 rounded-full hover:bg-blue-100 transition-colors"
              title="Copy ID"
              whileHover={{ scale: 1.1, backgroundColor: "#dbeafe" }}
              whileTap={{ scale: 0.9 }}
            >
              <Clipboard size={16} className="text-blue-600" />
            </motion.button>
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: standards,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg shadow-md">
        <motion.div
          className="relative h-16 w-16 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div 
            className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-t-blue-500 border-r-blue-300 border-b-blue-100 border-l-blue-300"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          ></motion.div>
        </motion.div>
        <motion.p 
          className="text-gray-700 font-medium"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Loading standards...
        </motion.p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <motion.div 
        className="mt-4 text-red-600 bg-red-50 border border-red-100 rounded-lg p-6 shadow-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-start">
          <div className="mr-4 p-1.5 bg-red-100 rounded-full">
            <svg
              className="h-6 w-6 text-red-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Error fetching standards</h3>
            <p className="text-sm text-red-700 mb-4">
              {(error as Error).message || 'An unknown error occurred'}
            </p>
            <motion.button
              className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg shadow-sm flex items-center gap-2"
              onClick={() => refetch()}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <RefreshCw size={16} />
              Try Again
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="mt-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header with search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
        <motion.div 
          className="flex items-center gap-2 flex-shrink-0"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Award className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800 border-b-4 border-blue-400 pb-1">
            Standards
          </h2>
        </motion.div>
        
        <div className="flex-grow max-w-lg relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-blue-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search standards by name or code..."
            className="pl-10 pr-4 py-2 w-full border border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-300 outline-none transition-all duration-200 shadow-sm"
          />
        </div>
      </div>
      
      {/* Applied filter badge */}
      <AnimatePresence>
        {categoryName && (
          <motion.div 
            className="mb-4 flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-3 rounded-lg border border-blue-200 shadow-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Filter size={16} className="text-blue-500" />
            <span className="font-medium">Category Filter:</span>
            <span>{categoryName}</span>
            <motion.button
              onClick={onClearFilter}
              className="ml-2 p-1 rounded-full hover:bg-blue-100 text-blue-700"
              whileHover={{ scale: 1.1, backgroundColor: "#dbeafe" }}
              whileTap={{ scale: 0.9 }}
            >
              <X size={16} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main data table */}
      <motion.div 
        className="bg-white border border-blue-100 rounded-xl shadow-md overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="p-5 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Standards Database
              </h2>
              <p className="text-sm text-gray-600">
                Managing {standards.length} standards and specifications
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <motion.span 
                className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full flex items-center border border-blue-200"
                whileHover={{ scale: 1.05 }}
              >
                <Tag size={12} className="mr-1" />
                {standards.length} Total
              </motion.span>
            </div>
          </div>
        </div>

        {/* No data state */}
        {standards.length === 0 ? (
          <motion.div 
            className="text-center py-16 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <motion.div 
              className="h-20 w-20 mx-auto mb-4 bg-blue-50 text-blue-400 rounded-full flex items-center justify-center"
              animate={{ scale: [0.9, 1.1, 1] }}
              transition={{ duration: 1.5, times: [0, 0.5, 1], repeat: Infinity, repeatType: "reverse" }}
            >
              <Award className="h-10 w-10" />
            </motion.div>
            <h3 className="text-xl font-medium text-gray-800 mb-2">No Standards Found</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              {debouncedSearchTerm 
                ? `No standards match your search term "${debouncedSearchTerm}". Try a different search.` 
                : categoryId 
                  ? "No standards found in this category. Try selecting a different category."
                  : "There are no standards available. Create a new standard to get started."
              }
            </p>
            
            <motion.button 
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-md inline-flex items-center gap-2"
              whileHover={{ 
                scale: 1.03, 
                boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3), 0 4px 6px -2px rgba(59, 130, 246, 0.15)" 
              }}
              whileTap={{ scale: 0.97 }}
            >
              <Tag size={16} />
              Create New Standard
            </motion.button>
          </motion.div>
        ) : (
          <div className="overflow-hidden">
            <table className="w-full divide-y divide-blue-100">
              <thead className="bg-blue-50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3.5 text-left text-xs font-medium text-blue-700 uppercase tracking-wider"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-white divide-y divide-blue-50">
                {table.getRowModel().rows.map((row, i) => (
                  <motion.tr 
                    key={row.id} 
                    className="hover:bg-blue-50 transition-colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.05 }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 py-4 text-sm text-gray-700"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 border-t border-blue-100 flex justify-between items-center">
          <p className="text-sm text-blue-700">
            Showing {table.getRowModel().rows.length} of {standards.length} standards
          </p>

          <div className="flex items-center space-x-2">
            <motion.button
              className="px-4 py-2 bg-white hover:bg-blue-50 text-blue-700 text-sm rounded-lg border border-blue-200 transition-colors shadow-sm flex items-center gap-2"
              onClick={() => refetch()}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <RefreshCw size={14} />
              <span>Refresh</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ViewStandards;