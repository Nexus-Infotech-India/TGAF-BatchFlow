import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // Added AnimatePresence for modal
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
} from '@tanstack/react-table';
import api, { API_ROUTES } from '../../../../utils/api';
import {
  ArrowUpDown,
  Calendar,
  Info,
  Tag,
  Type,
  Folder,
  RefreshCw,
  AlertCircle,
  Plus,
  Trash2, // Added for delete icon
  X, // Added for modal close
} from 'lucide-react';
import EditableCell from '../../../common/EditableCell';
import { toast } from 'react-toastify';

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

const StandardCategory: React.FC<StandardCategoryProps> = ({
  onAddCategoryClick,
}) => {
  const [categories, setCategories] = useState<StandardCategory[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false); // For modal visibility
  const [categoryToDelete, setCategoryToDelete] =
    useState<StandardCategory | null>(null); // Category to delete
  const [isDeleting, setIsDeleting] = useState(false); // Loading state for delete

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const authToken = localStorage.getItem('authToken');
      const response = await api.get(
        API_ROUTES.STANDARD.GET_STANDARD_CATEGORIES,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      setCategories(response.data.categories);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch categories.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);


  const handleSave = async (id: string, field: string, newValue: string) => {
    try {
      const authToken = localStorage.getItem('authToken');
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
      toast.success('Category updated successfully!', {
        position: 'bottom-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (err) {
      console.error('Failed to save changes:', err);
      toast.error('Failed to update category. Please try again.', {
        position: 'bottom-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    try {
      const authToken = localStorage.getItem('authToken');
      await api.delete(
        API_ROUTES.STANDARD.DELETE_STANDARD_CATEGORY(categoryToDelete.id),
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      setCategories((prev) =>
        prev.filter((cat) => cat.id !== categoryToDelete.id)
      );
      toast.success(
        'Category and associated parameters deleted successfully!',
        {
          position: 'bottom-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
      setShowDeleteModal(false);
      setCategoryToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete category:', err);
      toast.error(
        err.response?.data?.message ||
          'Failed to delete category. Please try again.',
        {
          position: 'bottom-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Column definition for TanStack Table
  const columnHelper = createColumnHelper<StandardCategory>();
  const columns = [
    columnHelper.accessor('id', {
      header: ({ column }) => (
        <motion.button
          onClick={() => column.toggleSorting()}
          className="flex items-center gap-2 font-semibold text-gray-700 hover:text-blue-600 transition-colors group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
            <Tag size={14} />
          </div>
          ID
          <ArrowUpDown
            size={12}
            className="text-gray-400 group-hover:text-blue-500 transition-colors"
          />
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
    columnHelper.accessor('name', {
      header: ({ column }) => (
        <motion.button
          onClick={() => column.toggleSorting()}
          className="flex items-center gap-2 font-semibold text-gray-700 hover:text-blue-600 transition-colors group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="p-1.5 rounded-lg bg-green-50 text-green-600 group-hover:bg-green-100 transition-colors">
            <Type size={14} />
          </div>
          Name
          <ArrowUpDown
            size={12}
            className="text-gray-400 group-hover:text-blue-500 transition-colors"
          />
        </motion.button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">
          <EditableCell
            value={row.original.name}
            onSave={(newValue) => handleSave(row.original.id, 'name', newValue)}
            className="border-2 border-transparent hover:border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-lg px-3 py-2 bg-white transition-all"
          />
        </div>
      ),
    }),
    columnHelper.accessor('description', {
      header: ({ column }) => (
        <motion.button
          onClick={() => column.toggleSorting()}
          className="flex items-center gap-2 font-semibold text-gray-700 hover:text-blue-600 transition-colors group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-100 transition-colors">
            <Info size={14} />
          </div>
          Description
          <ArrowUpDown
            size={12}
            className="text-gray-400 group-hover:text-blue-500 transition-colors"
          />
        </motion.button>
      ),
      cell: ({ row }) => (
        <div className="max-w-md">
          <EditableCell
            value={row.original.description || 'No description provided'}
            onSave={(newValue) =>
              handleSave(row.original.id, 'description', newValue)
            }
            className="border-2 border-transparent hover:border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-lg px-3 py-2 bg-white transition-all"
          />
        </div>
      ),
    }),
    columnHelper.accessor('updatedAt', {
      header: ({ column }) => (
        <motion.button
          onClick={() => column.toggleSorting()}
          className="flex items-center gap-2 font-semibold text-gray-700 hover:text-blue-600 transition-colors group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600 group-hover:bg-orange-100 transition-colors">
            <Calendar size={14} />
          </div>
          Last Updated
          <ArrowUpDown
            size={12}
            className="text-gray-400 group-hover:text-blue-500 transition-colors"
          />
        </motion.button>
      ),
      cell: ({ row }) => {
        const date = new Date(row.original.updatedAt);
        return (
          <div className="flex items-center gap-2">
            <div className="p-1 bg-gray-50 rounded-full">
              <Calendar size={12} className="text-gray-500" />
            </div>
            <span className="text-gray-600 text-sm font-medium">
              {date.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        );
      },
    }),
    columnHelper.display({
      id: 'delete',
      header: () => (
        <div className="flex items-center gap-2 font-semibold text-gray-700">
          <div className="p-1.5 rounded-lg bg-red-50 text-red-600">
            <Trash2 size={14} />
          </div>
          Delete
        </div>
      ),
      cell: ({ row }) => (
        <motion.button
          onClick={() => {
            setCategoryToDelete(row.original);
            setShowDeleteModal(true);
          }}
          className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all shadow-sm hover:shadow-md"
          whileHover={{ scale: 1.05, y: -1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Trash2 size={14} />
          Delete
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
        className="flex flex-col items-center justify-center py-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="relative h-16 w-16 mb-6">
          <motion.div
            className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-t-blue-500 border-r-blue-300 border-b-blue-100 border-l-blue-300"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
        </div>
        <p className="text-gray-700 font-medium text-lg">
          Loading categories...
        </p>
        <p className="text-gray-500 text-sm mt-2">
          Please wait while we fetch your data
        </p>
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
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Unable to load categories
            </h3>
            <p className="text-sm text-red-700 mb-4">{error}</p>
            <motion.button
              className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg shadow-sm flex items-center gap-2 hover:bg-red-50 transition-colors"
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
      className="h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {categories.length === 0 ? (
        <motion.div
          className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <motion.div
            className="h-24 w-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-blue-200 text-blue-500 rounded-2xl flex items-center justify-center shadow-lg"
            animate={{ scale: [0.9, 1.1, 1] }}
            transition={{
              duration: 2,
              times: [0, 0.5, 1],
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          >
            <Folder className="h-12 w-12" />
          </motion.div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">
            No Categories Found
          </h3>
          <p className="text-gray-600 max-w-md mx-auto text-center mb-8 leading-relaxed">
            Start organizing your standards by creating your first category.
            Categories help you group related standards for better management.
          </p>

          <motion.button
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-lg inline-flex items-center gap-3 font-medium"
            onClick={onAddCategoryClick}
            whileHover={{
              scale: 1.05,
              boxShadow:
                '0 20px 25px -5px rgba(59, 130, 246, 0.3), 0 10px 10px -5px rgba(59, 130, 246, 0.15)',
            }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus size={18} />
            Create Your First Category
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
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
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
                        <td
                          key={cell.id}
                          className="px-6 py-4 text-sm text-gray-700"
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
          </div>

          {/* Enhanced Footer */}
          <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Tag size={14} className="text-blue-600" />
              </div>
              <p className="text-sm font-medium text-gray-700">
                Showing{' '}
                <span className="text-blue-600 font-semibold">
                  {table.getRowModel().rows.length}
                </span>{' '}
                categories
              </p>
            </div>

            <motion.button
              onClick={fetchCategories}
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

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && categoryToDelete && (
          <motion.div
            className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 shadow-xl max-w-md w-full mx-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Confirm Deletion
                </h3>
                <motion.button
                  onClick={() => setShowDeleteModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-full"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={20} className="text-gray-500" />
                </motion.button>
              </div>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete the category{' '}
                <strong>"{categoryToDelete.name}"</strong>? This will also
                delete all associated parameters under this category.
              </p>
              <div className="flex gap-3">
                <motion.button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StandardCategory;
