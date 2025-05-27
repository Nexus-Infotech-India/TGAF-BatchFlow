import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
} from "@tanstack/react-table";
import api, { API_ROUTES } from "../../../../utils/api";
import { 
  ArrowUpDown, 
  Tag, 
  RefreshCw, 
  AlertCircle,
  List,
  Plus,
  Database,
  FileText,
  Hash
} from "lucide-react";

interface StandardParameter {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  dataType: string;
  category: {
    id: string;
    name: string;
  };
}

interface StandardParameterListProps {
  onAddParameterClick?: () => void;
}

const StandardParameterList: React.FC<StandardParameterListProps> = ({ onAddParameterClick }) => {
  const [parameters, setParameters] = useState<StandardParameter[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchParameters = async () => {
    setIsLoading(true);
    try {
      const authToken = localStorage.getItem("authToken");
      const response = await api.get(API_ROUTES.STANDARD.GET_STANDARD_PARAMETERS, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      setParameters(response.data.parameters);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch parameters.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchParameters();
  }, []);

  // Format data type for display
  const formatDataType = (dataType: string) => {
    return dataType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  };

  // Column definition for TanStack Table
  const columnHelper = createColumnHelper<StandardParameter>();
  const columns = [
    columnHelper.accessor("id", {
      header: ({ column }) => (
        <motion.button
          onClick={() => column.toggleSorting()}
          className="flex items-center gap-2 font-semibold text-gray-700 hover:text-blue-600 transition-colors group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
            <Hash size={14} />
          </div>
          ID
          <ArrowUpDown size={12} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
        </motion.button>
      ),
      cell: ({ row }) => {
        const id = row.original.id;
        const shortId = `${id.slice(0, 8)}...`;
        return (
          <div className="flex items-center">
            <span className="font-mono bg-gradient-to-r from-gray-50 to-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 shadow-sm">
              {shortId}
            </span>
          </div>
        );
      },
    }),
    columnHelper.accessor("name", {
      header: ({ column }) => (
        <motion.button
          onClick={() => column.toggleSorting()}
          className="flex items-center gap-2 font-semibold text-gray-700 hover:text-blue-600 transition-colors group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="p-1.5 rounded-lg bg-green-50 text-green-600 group-hover:bg-green-100 transition-colors">
            <Tag size={14} />
          </div>
          Name
          <ArrowUpDown size={12} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
        </motion.button>
      ),
      cell: ({ getValue }) => (
        <div className="font-medium text-gray-800">{getValue()}</div>
      ),
    }),
    columnHelper.accessor("category.name", {
      header: ({ column }) => (
        <motion.button
          onClick={() => column.toggleSorting()}
          className="flex items-center gap-2 font-semibold text-gray-700 hover:text-blue-600 transition-colors group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
            <List size={14} />
          </div>
          Category
          <ArrowUpDown size={12} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
        </motion.button>
      ),
      cell: ({ getValue }) => (
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 px-3 py-1.5 rounded-lg inline-block text-sm font-medium border border-blue-200">
          {getValue()}
        </div>
      ),
    }),
    columnHelper.accessor("dataType", {
      header: ({ column }) => (
        <motion.button
          onClick={() => column.toggleSorting()}
          className="flex items-center gap-2 font-semibold text-gray-700 hover:text-blue-600 transition-colors group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600 group-hover:bg-orange-100 transition-colors">
            <Database size={14} />
          </div>
          Data Type
          <ArrowUpDown size={12} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
        </motion.button>
      ),
      cell: ({ getValue }) => (
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 px-3 py-1.5 rounded-lg inline-block text-sm font-medium border border-orange-200">
          {formatDataType(getValue())}
        </div>
      ),
    }),
    columnHelper.accessor("description", {
      header: ({ column }) => (
        <motion.button
          onClick={() => column.toggleSorting()}
          className="flex items-center gap-2 font-semibold text-gray-700 hover:text-blue-600 transition-colors group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors">
            <FileText size={14} />
          </div>
          Description
          <ArrowUpDown size={12} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
        </motion.button>
      ),
      cell: ({ getValue }) => (
        <div className="text-gray-600 max-w-md">
          {getValue() || (
            <span className="italic text-gray-400">No description provided</span>
          )}
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: parameters || [],
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
        className="flex flex-col items-center justify-center py-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="relative h-16 w-16 mb-6">
          <motion.div 
            className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-t-blue-500 border-r-blue-300 border-b-blue-100 border-l-blue-300"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <p className="text-gray-700 font-medium text-lg">Loading parameters...</p>
        <p className="text-gray-500 text-sm mt-2">Please wait while we fetch your data</p>
      </motion.div>
    );
  }

  // Render error state
  if (error) {
    return (
      <motion.div 
        className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-2xl p-8 shadow-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-start">
          <div className="mr-4 p-2 bg-red-100 rounded-xl">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Unable to load parameters</h3>
            <p className="text-sm text-red-700 mb-4">
              {error}
            </p>
            <motion.button
              className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg shadow-sm flex items-center gap-2 hover:bg-red-50 transition-colors"
              onClick={() => fetchParameters()}
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
      className="h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {parameters.length === 0 ? (
        <motion.div 
          className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <motion.div 
            className="h-24 w-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-blue-200 text-blue-500 rounded-2xl flex items-center justify-center shadow-lg"
            animate={{ scale: [0.9, 1.1, 1] }}
            transition={{ duration: 2, times: [0, 0.5, 1], repeat: Infinity, repeatType: "reverse" }}
          >
            <Tag className="h-12 w-12" />
          </motion.div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">No Parameters Found</h3>
          <p className="text-gray-600 max-w-md mx-auto text-center mb-8 leading-relaxed">
            Create parameters to define what can be measured in your standards. Parameters help establish the criteria for quality control.
          </p>
          
          <motion.button 
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-lg inline-flex items-center gap-3 font-medium"
            onClick={onAddParameterClick}
            whileHover={{ 
              scale: 1.05, 
              boxShadow: "0 20px 25px -5px rgba(59, 130, 246, 0.3), 0 10px 10px -5px rgba(59, 130, 246, 0.15)" 
            }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus size={18} />
            Create Your First Parameter
          </motion.button>
        </motion.div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden h-full flex flex-col">
          <div className="flex-1 overflow-hidden">
            <div className="overflow-x-auto h-full">
              <table className="min-w-full h-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 sticky top-0 z-10">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-6 py-4 text-left text-sm font-medium text-gray-700"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  <AnimatePresence>
                    {table.getRowModel().rows.map((row, i) => (
                      <motion.tr 
                        key={row.id} 
                        className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: i * 0.05 }}
                        whileHover={{ scale: 1.01 }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-6 py-4 text-sm text-gray-700">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>

          {/* Enhanced Footer */}
          <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Tag size={14} className="text-blue-600" />
              </div>
              <p className="text-sm font-medium text-gray-700">
                Showing <span className="text-blue-600 font-semibold">{table.getRowModel().rows.length}</span> parameters
              </p>
            </div>

            <motion.button 
              onClick={fetchParameters}
              className="text-sm text-gray-600 flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all"
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw size={14} />
              <span className="font-medium">Refresh</span>
            </motion.button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default StandardParameterList;