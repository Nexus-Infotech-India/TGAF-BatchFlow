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
  Calendar, 
  Info, 
  Tag, 
  Type, 
  Clipboard, 
  ChevronRight, 
  Folder, 
  RefreshCw, 
  AlertCircle,
  Check,
  Plus
} from "lucide-react";
import EditableCell from "../../../common/EditableCell";
import { toast } from "react-toastify"; 

interface StandardCategory {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface StandardCategoryProps {
  onCategorySelect: (categoryId: string, categoryName: string) => void;
  onAddCategoryClick?: () => void;
}

const StandardCategory: React.FC<StandardCategoryProps> = ({ onCategorySelect, onAddCategoryClick }) => {
  const [categories, setCategories] = useState<StandardCategory[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const authToken = localStorage.getItem("authToken");
      const response = await api.get(API_ROUTES.STANDARD.GET_STANDARD_CATEGORIES, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      setCategories(response.data.categories);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch categories.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleGoToStandards = (categoryId: string, categoryName: string) => {
    onCategorySelect(categoryId, categoryName);
  };

  const handleSave = async (id: string, field: string, newValue: string) => {
    try {
      const authToken = localStorage.getItem("authToken");
      await api.put(
        API_ROUTES.STANDARD.UPDATE_STANDARD_CATEGORY(id),
        { [field]: newValue },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      setCategories((prev) =>
        prev.map((category) =>
          category.id === id ? { ...category, [field]: newValue } : category
        )
      );
      toast.success("Category updated successfully!", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (err) {
      console.error("Failed to save changes:", err);
      toast.error("Failed to update category. Please try again.", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  // Column definition for TanStack Table
  const columnHelper = createColumnHelper<StandardCategory>();
  const columns = [
    columnHelper.accessor("id", {
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <Tag size={16} className="text-blue-500" />
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1 font-medium"
          >
            ID
            <ArrowUpDown size={14} className="text-blue-500" />
          </button>
        </div>
      ),
      cell: ({ row }) => {
        const id = row.original.id;
        const shortId = `${id.slice(0, 6)}...`; // Shorten the ID
        const handleCopy = () => {
          navigator.clipboard.writeText(id);
          toast.info("ID copied to clipboard!", {
            position: "bottom-right",
            autoClose: 2000,
            hideProgressBar: true,
          });
        };
        return (
          <motion.div
            className="flex items-center gap-2 cursor-pointer text-blue-600 hover:text-blue-800"
            onClick={handleCopy}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Click to copy full ID"
          >
            <span className="font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-100 text-xs">
              {shortId}
            </span>
            <Clipboard size={14} />
          </motion.div>
        );
      },
    }),
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
      cell: ({ row }) => (
        <div className="font-medium">
          <EditableCell
            value={row.original.name}
            onSave={(newValue) => handleSave(row.original.id, "name", newValue)}
            className="border border-blue-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-300 rounded px-2 py-1"
          />
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
      cell: ({ row }) => (
        <div className="max-w-md truncate">
          <EditableCell
            value={row.original.description || "No description provided"}
            onSave={(newValue) =>
              handleSave(row.original.id, "description", newValue)
            }
            className="border border-blue-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-300 rounded px-2 py-1"
          />
        </div>
      ),
    }),
    columnHelper.accessor("updatedAt", {
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-blue-500" />
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1 font-medium"
          >
            Last Updated
            <ArrowUpDown size={14} className="text-blue-500" />
          </button>
        </div>
      ),
      cell: ({ row }) => {
        const date = new Date(row.original.updatedAt);
        return (
          <div className="flex items-center gap-1 text-gray-700">
            <Calendar size={14} className="text-blue-400" />
            <span>
              {date.toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        );
      },
    }),
    columnHelper.display({
      id: "goTo",
      header: "Standards",
      cell: ({ row }) => (
        <motion.button
          onClick={() => handleGoToStandards(row.original.id, row.original.name)}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span>View Standards</span>
          <ChevronRight size={16} />
        </motion.button>
      ),
    }),
  ];

  const table = useReactTable({
    data: categories || [],
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
        <p className="text-gray-700 font-medium">Loading categories...</p>
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
            <h3 className="text-lg font-semibold mb-2">Error fetching categories</h3>
            <p className="text-sm text-red-700 mb-4">
              {error}
            </p>
            <motion.button
              className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg shadow-sm flex items-center gap-2"
              onClick={() => fetchCategories()}
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
                <Folder className="h-6 w-6 text-blue-600" />
                <span>Standard Categories</span>
              </h2>
              <p className="text-gray-600">
                Organize your standards into logical categories for better management and retrieval.
              </p>
            </div>

            <motion.button
              onClick={onAddCategoryClick}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-md flex items-center gap-2"
              whileHover={{ 
                scale: 1.03, 
                boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3), 0 4px 6px -2px rgba(59, 130, 246, 0.15)" 
              }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <Plus size={18} />
              <span>Add Category</span>
            </motion.button>
          </div>
        </div>

        {categories.length === 0 ? (
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
              <Folder className="h-10 w-10" />
            </motion.div>
            <h3 className="text-xl font-medium text-gray-800 mb-2">No Categories Found</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              Create categories to organize your standards and improve searchability.
            </p>
            
            <motion.button 
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-md inline-flex items-center gap-2"
              onClick={onAddCategoryClick}
              whileHover={{ 
                scale: 1.03, 
                boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3), 0 4px 6px -2px rgba(59, 130, 246, 0.15)" 
              }}
              whileTap={{ scale: 0.97 }}
            >
              <Plus size={16} />
              Create First Category
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
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 border-t border-blue-100 flex items-center justify-between">
              <p className="text-sm text-blue-700 font-medium flex items-center">
                <Tag size={14} className="mr-2 text-blue-500" />
                Showing {table.getRowModel().rows.length} categories
              </p>

              <motion.button 
                onClick={fetchCategories}
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

export default StandardCategory;