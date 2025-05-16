import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  createColumnHelper,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  flexRender,
} from "@tanstack/react-table";
import api, { API_ROUTES } from "../../../../utils/api";
import { motion } from "framer-motion";
import { 
  ArrowUpDown, 
  Calendar, 
  FileText, 
  ClipboardList,
  Book,
  RefreshCw,
  AlertCircle,
  Search,
  X,
  Filter
} from "lucide-react";

interface Methodology {
  id: string;
  name: string;
  description?: string;
  procedure?: string;
  createdAt?: string;
  updatedAt?: string;
}

const ViewMethodologies: React.FC = () => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data, isLoading, error } = useQuery({
    queryKey: ["methodologies"],
    queryFn: async () => {
      const authToken = localStorage.getItem("authToken");
      const response = await api.get(API_ROUTES.METHODOLOGY.GET_METHODOLOGIES, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.data && Array.isArray(response.data.methodologies)) {
        return response.data.methodologies as Methodology[];
      }
      throw new Error("Unexpected response format");
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
  
  // Filter data based on search query
  const methodologies = React.useMemo(() => {
    if (!data) return [];
    if (!searchQuery) return data;
    
    const lowercaseQuery = searchQuery.toLowerCase();
    return data.filter(methodology => 
      methodology.name?.toLowerCase().includes(lowercaseQuery) || 
      methodology.description?.toLowerCase().includes(lowercaseQuery) || 
      methodology.procedure?.toLowerCase().includes(lowercaseQuery)
    );
  }, [data, searchQuery]);

  // Define table columns using createColumnHelper
  const columnHelper = createColumnHelper<Methodology>();
  const columns = [
    columnHelper.accessor("name", {
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-blue-500" />
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1 font-medium"
          >
            Name
            <ArrowUpDown size={14} className="text-blue-500" />
          </button>
        </div>
      ),
      cell: (info) => <div className="font-medium text-gray-800">{info.getValue()}</div>,
    }),
    columnHelper.accessor("description", {
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <Book size={16} className="text-blue-500" />
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1 font-medium"
          >
            Description
            <ArrowUpDown size={14} className="text-blue-500" />
          </button>
        </div>
      ),
      cell: (info) => (
        <div className="max-w-sm truncate">
          {info.getValue() || <span className="text-gray-400 italic">No description</span>}
        </div>
      ),
    }),
    columnHelper.accessor("procedure", {
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <ClipboardList size={16} className="text-blue-500" />
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1 font-medium"
          >
            Procedure
            <ArrowUpDown size={14} className="text-blue-500" />
          </button>
        </div>
      ),
      cell: (info) => (
        <div className="max-w-sm truncate">
          {info.getValue() || <span className="text-gray-400 italic">No procedure defined</span>}
        </div>
      ),
    }),
    columnHelper.accessor("createdAt", {
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-blue-500" />
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1 font-medium"
          >
            Created
            <ArrowUpDown size={14} className="text-blue-500" />
          </button>
        </div>
      ),
      cell: (info) => {
        const date = info.getValue() ? new Date(info.getValue() as string) : null;
        return (
          <div className="flex items-center gap-1 text-gray-600">
            <Calendar size={14} className="text-blue-400" />
            <span>
              {date ? date.toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric"
              }) : 'N/A'}
            </span>
          </div>
        );
      },
    }),
  ];

  // Create table instance
  const table = useReactTable({
    data: methodologies,
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
      <motion.div 
        className="flex flex-col items-center justify-center py-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="relative h-16 w-16 mb-4">
          <motion.div 
            className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-t-blue-500 border-r-blue-300 border-b-blue-100 border-l-blue-300"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          ></motion.div>
          <FileText className="h-6 w-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-gray-700 font-medium">Loading methodologies...</p>
      </motion.div>
    );
  }

  // Render error state
  if (error) {
    return (
      <motion.div 
        className="mt-4 text-red-600 bg-red-50 border border-red-100 rounded-xl p-6 shadow-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-start">
          <div className="mr-4 p-1.5 bg-red-100 rounded-full">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">Error fetching methodologies</h3>
            <p className="text-sm text-red-700 mb-4">
              {error instanceof Error ? error.message : "Unknown error occurred"}
            </p>
            <motion.button
              className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg shadow-sm flex items-center gap-2"
              onClick={() => window.location.reload()}
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
      <motion.div 
        className="bg-white border border-blue-100 rounded-xl shadow-md overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="p-6 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-3 mb-1">
                <FileText className="h-6 w-6 text-blue-600" />
                <span>Methodologies</span>
              </h2>
              <p className="text-gray-600">
                Test and analysis procedures for quality standards.
              </p>
            </div>

            {/* Search Box */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-blue-400" />
              </div>
              <input
                type="text"
                placeholder="Search methodologies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none"
              />
              {searchQuery && (
                <button 
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4 text-blue-400" />
                </button>
              )}
            </div>
          </div>
        </div>

        {!data || data.length === 0 ? (
          <div className="text-center py-16 px-4">
            <motion.div 
              className="h-20 w-20 mx-auto mb-4 bg-blue-50 text-blue-400 rounded-full flex items-center justify-center"
              animate={{ scale: [0.9, 1.1, 1] }}
              transition={{ duration: 1.5, times: [0, 0.5, 1], repeat: Infinity, repeatType: "reverse" }}
            >
              <FileText className="h-10 w-10" />
            </motion.div>
            <h3 className="text-xl font-medium text-gray-800 mb-2">No Methodologies Found</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              There are no methodologies available. Create a new methodology to define testing and analysis procedures for your standards.
            </p>
          </div>
        ) : methodologies.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="h-20 w-20 mx-auto mb-4 bg-blue-50 text-blue-400 rounded-full flex items-center justify-center">
              <Filter className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-medium text-gray-800 mb-2">No Matching Methodologies</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              No methodologies match your search criteria. Try different keywords or clear the search.
            </p>
            <button 
              onClick={() => setSearchQuery('')}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg inline-flex items-center gap-2"
            >
              <X size={16} />
              Clear Search
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-blue-100">
                <thead className="bg-blue-50">
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th 
                          key={header.id} 
                          className="px-6 py-3.5 text-left text-xs font-medium text-blue-700 uppercase tracking-wider"
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
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="px-6 py-4 text-sm text-gray-700">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 border-t border-blue-100 flex items-center justify-between">
              <p className="text-sm text-blue-700 font-medium flex items-center">
                <FileText size={14} className="mr-2 text-blue-500" />
                Showing {methodologies.length} {methodologies.length === 1 ? 'methodology' : 'methodologies'}
                {searchQuery && data && data.length !== methodologies.length && (
                  <span className="ml-1">
                    (filtered from {data.length})
                  </span>
                )}
              </p>

              {searchQuery && (
                <motion.button 
                  onClick={() => setSearchQuery('')}
                  className="text-sm text-blue-600 flex items-center gap-1 px-3 py-1.5 bg-white rounded-lg border border-blue-200 shadow-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X size={14} />
                  <span>Clear filter</span>
                </motion.button>
              )}
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ViewMethodologies;