import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
} from "@tanstack/react-table";
import api, { API_ROUTES } from "../../../../utils/api";
import { motion } from "framer-motion";
import { 
  ArrowUpDown, 
  Calendar, 
  Info, 
  Package,
  Tag, 
  Type, 
  RefreshCw,
  AlertCircle,
  Search,
  X,
  Filter
} from "lucide-react";

// Define the type for unit data
interface Unit {
  id: string;
  name: string;
  symbol: string;
  description: string;
  createdAt: string;
}

const ViewUnit: React.FC = () => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch units using Tanstack Query
  const { data, error, isLoading, isError } = useQuery({
    queryKey: ["units"],
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No token provided");
      }
      
      const response = await api.get(API_ROUTES.UNIT.GET_UNITS, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.units as Unit[];
    },
  });

  // Filter data based on search query
  const filteredData = React.useMemo(() => {
    if (!data) return [];
    if (!searchQuery) return data;
    
    return data.filter(unit => 
      unit.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      unit.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data, searchQuery]);

  // Column definition for Tanstack Table
  const columnHelper = createColumnHelper<Unit>();
  const columns = [
    columnHelper.accessor("name", {
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <Type size={16} className="text-blue-500" />
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1 font-medium"
          >
            Name
            <ArrowUpDown size={14} className="text-blue-500" />
          </button>
        </div>
      ),
      cell: ({ row }) => <div className="font-medium text-gray-800">{row.original.name}</div>,
    }),
    columnHelper.accessor("symbol", {
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <Tag size={16} className="text-blue-500" />
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1 font-medium"
          >
            Symbol
            <ArrowUpDown size={14} className="text-blue-500" />
          </button>
        </div>
      ),
      cell: ({ row }) => (
        <div className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md inline-block font-mono border border-blue-100">
          {row.original.symbol}
        </div>
      ),
    }),
    columnHelper.accessor("description", {
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <Info size={16} className="text-blue-500" />
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1 font-medium"
          >
            Description
            <ArrowUpDown size={14} className="text-blue-500" />
          </button>
        </div>
      ),
      cell: ({ row }) => <div className="max-w-md truncate">{row.original.description}</div>,
    }),
    columnHelper.accessor("createdAt", {
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-blue-500" />
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1 font-medium"
          >
            Created At
            <ArrowUpDown size={14} className="text-blue-500" />
          </button>
        </div>
      ),
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
        return (
          <div className="flex items-center gap-1 text-gray-600">
            <Calendar size={14} className="text-blue-400" />
            <span>
              {date.toLocaleDateString(undefined, {
                year: "numeric",
                month: "short", 
                day: "numeric"
              })}
            </span>
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: filteredData || [],
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
          <Package className="h-6 w-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-gray-700 font-medium">Loading measurement units...</p>
      </motion.div>
    );
  }

  // Render error state
  if (isError) {
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
            <h3 className="text-lg font-semibold mb-2">Error fetching units</h3>
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

  // Render data table
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
                <Package className="h-6 w-6 text-blue-600" />
                <span>Measurement Units</span>
              </h2>
              <p className="text-gray-600">
                Units used for measurement specifications and standards tracking.
              </p>
            </div>

            {/* Search Box */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-blue-400" />
              </div>
              <input
                type="text"
                placeholder="Search units..."
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
              <Package className="h-10 w-10" />
            </motion.div>
            <h3 className="text-xl font-medium text-gray-800 mb-2">No Units Found</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              There are no measurement units available. Create a new unit to get started with measuring your standards.
            </p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="h-20 w-20 mx-auto mb-4 bg-blue-50 text-blue-400 rounded-full flex items-center justify-center">
              <Filter className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-medium text-gray-800 mb-2">No Matching Units</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              No units match your search criteria. Try different keywords or clear the search.
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
                <Tag size={14} className="mr-2 text-blue-500" />
                Showing {filteredData.length} {filteredData.length === 1 ? 'unit' : 'units'}
                {searchQuery && data && data.length !== filteredData.length && (
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

export default ViewUnit;