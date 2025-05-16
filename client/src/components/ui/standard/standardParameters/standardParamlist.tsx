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
  FileText
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
    columnHelper.accessor("name", {
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <Tag size={16} className="text-blue-500" />
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1 font-medium"
          >
            Name
            <ArrowUpDown size={14} className="text-blue-500" />
          </button>
        </div>
      ),
      cell: ({ getValue }) => <div className="font-medium text-blue-700">{getValue()}</div>,
    }),
    columnHelper.accessor("category.name", {
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <List size={16} className="text-blue-500" />
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1 font-medium"
          >
            Category
            <ArrowUpDown size={14} className="text-blue-500" />
          </button>
        </div>
      ),
      cell: ({ getValue }) => (
        <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md inline-block text-sm">
          {getValue()}
        </div>
      ),
    }),
    columnHelper.accessor("dataType", {
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <Database size={16} className="text-blue-500" />
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1 font-medium"
          >
            Data Type
            <ArrowUpDown size={14} className="text-blue-500" />
          </button>
        </div>
      ),
      cell: ({ getValue }) => (
        <div className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md inline-block text-sm">
          {formatDataType(getValue())}
        </div>
      ),
    }),
    columnHelper.accessor("description", {
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-blue-500" />
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1 font-medium"
          >
            Description
            <ArrowUpDown size={14} className="text-blue-500" />
          </button>
        </div>
      ),
      cell: ({ getValue }) => <div className="text-gray-600 max-w-md truncate">{getValue() || "No description provided"}</div>,
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
        className="flex flex-col items-center justify-center py-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="relative h-16 w-16 mb-4">
          <motion.div 
            className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-t-blue-500 border-r-blue-300 border-b-blue-100 border-l-blue-300"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          ></motion.div>
        </div>
        <p className="text-gray-700 font-medium">Loading parameters...</p>
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
            <h3 className="text-lg font-semibold mb-2">Error fetching parameters</h3>
            <p className="text-sm text-red-700 mb-4">
              {error}
            </p>
            <motion.button
              className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg shadow-sm flex items-center gap-2"
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
                <Tag className="h-6 w-6 text-blue-600" />
                <span>Standard Parameters</span>
              </h2>
              <p className="text-gray-600">
                Manage the parameters used to define quality standards for your products.
              </p>
            </div>

            <motion.button
              onClick={onAddParameterClick}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-md flex items-center gap-2"
              whileHover={{ 
                scale: 1.03, 
                boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3), 0 4px 6px -2px rgba(59, 130, 246, 0.15)" 
              }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <Plus size={18} />
              <span>Add Parameter</span>
            </motion.button>
          </div>
        </div>

        {parameters.length === 0 ? (
          <motion.div 
            className="text-center py-16 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <motion.div 
              className="h-20 w-20 mx-auto mb-4 bg-blue-50 text-blue-400 rounded-full flex items-center justify-center"
              animate={{ scale: [0.9, 1.1, 1] }}
              transition={{ duration: 1.5, times: [0, 0.5, 1], repeat: Infinity, repeatType: "reverse" }}
            >
              <Tag className="h-10 w-10" />
            </motion.div>
            <h3 className="text-xl font-medium text-gray-800 mb-2">No Parameters Found</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              Create parameters to define what can be measured in your standards.
            </p>
            
            <motion.button 
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-md inline-flex items-center gap-2"
              onClick={onAddParameterClick}
              whileHover={{ 
                scale: 1.03, 
                boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3), 0 4px 6px -2px rgba(59, 130, 246, 0.15)" 
              }}
              whileTap={{ scale: 0.97 }}
            >
              <Plus size={16} />
              Create First Parameter
            </motion.button>
          </motion.div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-blue-100">
                <thead className="bg-blue-50">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-6 py-3.5 text-left text-xs font-medium text-blue-700 uppercase tracking-wider"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="bg-white divide-y divide-blue-50">
                  <AnimatePresence>
                    {table.getRowModel().rows.map((row, i) => (
                      <motion.tr 
                        key={row.id} 
                        className="hover:bg-blue-50 transition-colors"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: i * 0.05 }}
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

            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 border-t border-blue-100 flex items-center justify-between">
              <p className="text-sm text-blue-700 font-medium flex items-center">
                <Tag size={14} className="mr-2 text-blue-500" />
                Showing {table.getRowModel().rows.length} parameters
              </p>

              <motion.button 
                onClick={fetchParameters}
                className="text-sm text-blue-600 flex items-center gap-1 px-3 py-1.5 bg-white rounded-lg border border-blue-200 shadow-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RefreshCw size={14} />
                <span>Refresh</span>
              </motion.button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default StandardParameterList;