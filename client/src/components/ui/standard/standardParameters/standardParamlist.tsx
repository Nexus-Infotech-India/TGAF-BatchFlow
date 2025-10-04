import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Tag,
  RefreshCw,
  AlertCircle,
  List,
  Plus,
  Database,
  FileText,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'react-toastify';

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

const StandardParameterList: React.FC<StandardParameterListProps> = ({
  onAddParameterClick,
}) => {
  const [parameters, setParameters] = useState<StandardParameter[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [parameterToDelete, setParameterToDelete] =
    useState<StandardParameter | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchParameters = async () => {
    setIsLoading(true);
    try {
      const authToken = localStorage.getItem('authToken');
      const response = await api.get(
        API_ROUTES.STANDARD.GET_STANDARD_PARAMETERS,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      setParameters(response.data.parameters);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch parameters.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchParameters();
  }, []);

  const handleDelete = async () => {
    if (!parameterToDelete) return;
    setIsDeleting(true);
    try {
      const authToken = localStorage.getItem('authToken');
      await api.delete(
        API_ROUTES.STANDARD.DELETE_STANDARD_PARAMETER(parameterToDelete.id),
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      setParameters((prev) =>
        prev.filter((param) => param.id !== parameterToDelete.id)
      );
      toast.success('Parameter deleted successfully!', {
        position: 'bottom-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setShowDeleteModal(false);
      setParameterToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete parameter:', err);
      toast.error(
        err.response?.data?.message ||
          'Failed to delete parameter. Please try again.',
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

  // Format data type for display
  const formatDataType = (dataType: string) => {
    return dataType
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Column definition for TanStack Table (ID column removed)
  const columnHelper = createColumnHelper<StandardParameter>();
  const columns = [
    columnHelper.accessor('name', {
      header: ({ column }) => (
        <motion.button
          onClick={() => column.toggleSorting()}
          className="flex items-center gap-2 font-semibold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="p-1.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] group-hover:bg-[var(--primary)]/20 transition-colors">
            <Tag size={14} />
          </div>
          Name
          <ArrowUpDown
            size={12}
            className="text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors"
          />
        </motion.button>
      ),
      cell: ({ getValue }) => (
        <div className="font-medium text-[var(--foreground)]">{getValue()}</div>
      ),
    }),
    columnHelper.accessor('category.name', {
      header: ({ column }) => (
        <motion.button
          onClick={() => column.toggleSorting()}
          className="flex items-center gap-2 font-semibold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="p-1.5 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] group-hover:bg-[var(--accent)]/20 transition-colors">
            <List size={14} />
          </div>
          Category
          <ArrowUpDown
            size={12}
            className="text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors"
          />
        </motion.button>
      ),
      cell: ({ getValue }) => (
        <div className="bg-[var(--accent)]/10 text-[var(--accent-foreground)] px-3 py-1.5 rounded-lg inline-block text-sm font-medium border border-[var(--accent)]/20">
          {getValue()}
        </div>
      ),
    }),
    columnHelper.accessor('dataType', {
      header: ({ column }) => (
        <motion.button
          onClick={() => column.toggleSorting()}
          className="flex items-center gap-2 font-semibold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="p-1.5 rounded-lg bg-[var(--chart-3)]/10 text-[var(--chart-3)] group-hover:bg-[var(--chart-3)]/20 transition-colors">
            <Database size={14} />
          </div>
          Data Type
          <ArrowUpDown
            size={12}
            className="text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors"
          />
        </motion.button>
      ),
      cell: ({ getValue }) => (
        <div className="bg-[var(--chart-3)]/10 text-[var(--chart-3)] px-3 py-1.5 rounded-lg inline-block text-sm font-medium border border-[var(--chart-3)]/20">
          {formatDataType(getValue())}
        </div>
      ),
    }),
    columnHelper.accessor('description', {
      header: ({ column }) => (
        <motion.button
          onClick={() => column.toggleSorting()}
          className="flex items-center gap-2 font-semibold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="p-1.5 rounded-lg bg-[var(--chart-4)]/10 text-[var(--chart-4)] group-hover:bg-[var(--chart-4)]/20 transition-colors">
            <FileText size={14} />
          </div>
          Description
          <ArrowUpDown
            size={12}
            className="text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors"
          />
        </motion.button>
      ),
      cell: ({ getValue }) => (
        <div className="text-[var(--muted-foreground)] max-w-md">
          {getValue() || (
            <span className="italic text-[var(--muted-foreground)]/70">
              No description provided
            </span>
          )}
        </div>
      ),
    }),
    columnHelper.display({
      id: 'delete',
      header: () => (
        <div className="flex items-center gap-2 font-semibold text-[var(--foreground)]">
          <div className="p-1.5 rounded-lg bg-[var(--destructive)]/10 text-[var(--destructive)]">
            <Trash2 size={14} />
          </div>
          Delete
        </div>
      ),
      cell: ({ row }) => (
        <motion.button
          onClick={() => {
            setParameterToDelete(row.original);
            setShowDeleteModal(true);
          }}
          className="flex items-center gap-2 px-3 py-2 bg-[var(--destructive)] text-[var(--destructive-foreground)] rounded-lg hover:bg-[var(--destructive)]/90 transition-all shadow-sm hover:shadow-md"
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
        className="flex flex-col items-center justify-center py-20 bg-[var(--muted)] rounded-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="relative h-16 w-16 mb-6">
          <motion.div
            className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-t-[var(--primary)] border-r-[var(--muted)] border-b-[var(--background)] border-l-[var(--muted)]"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
        </div>
        <p className="text-[var(--foreground)] font-medium text-lg">
          Loading parameters...
        </p>
        <p className="text-[var(--muted-foreground)] text-sm mt-2">
          Please wait while we fetch your data
        </p>
      </motion.div>
    );
  }

  // Render error state
  if (error) {
    return (
      <motion.div
        className="bg-[var(--destructive)]/10 border border-[var(--destructive)]/30 rounded-2xl p-8 shadow-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-start">
          <div className="mr-4 p-2 bg-[var(--destructive)]/20 rounded-xl">
            <AlertCircle className="h-6 w-6 text-[var(--destructive)]" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-[var(--destructive)] mb-2">
              Unable to load parameters
            </h3>
            <p className="text-sm text-[var(--destructive)]/80 mb-4">{error}</p>
            <motion.button
              className="px-4 py-2 bg-[var(--background)] border border-[var(--destructive)]/30 text-[var(--destructive)] rounded-lg shadow-sm flex items-center gap-2 hover:bg-[var(--destructive)]/10 transition-colors"
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
          className="flex flex-col items-center justify-center h-full bg-[var(--muted)] rounded-2xl p-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <motion.div
            className="h-24 w-24 mx-auto mb-6 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl flex items-center justify-center shadow-lg"
            animate={{ scale: [0.9, 1.1, 1] }}
            transition={{
              duration: 2,
              times: [0, 0.5, 1],
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          >
            <Tag className="h-12 w-12" />
          </motion.div>
          <h3 className="text-2xl font-bold text-[var(--foreground)] mb-3">
            No Parameters Found
          </h3>
          <p className="text-[var(--muted-foreground)] max-w-md mx-auto text-center mb-8 leading-relaxed">
            Create parameters to define what can be measured in your standards.
            Parameters help establish the criteria for quality control.
          </p>

          <motion.button
            className="px-6 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl shadow-lg inline-flex items-center gap-3 font-medium"
            onClick={onAddParameterClick}
            whileHover={{
              scale: 1.05,
              boxShadow:
                '0 20px 25px -5px var(--primary)/0.3, 0 10px 10px -5px var(--primary)/0.15',
            }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus size={18} />
            Create Your First Parameter
          </motion.button>
        </motion.div>
      ) : (
        <div className="bg-[var(--background)] rounded-2xl shadow-lg border border-[var(--border)] overflow-hidden h-full flex flex-col">
          <div className="flex-1 overflow-hidden">
            <div className="overflow-x-auto h-full">
              <table className="min-w-full h-full">
                <thead className="bg-[var(--muted)] border-b border-[var(--border)] sticky top-0 z-10">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-6 py-4 text-left text-base font-bold text-[var(--foreground)]"
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
                <tbody className="bg-[var(--background)] divide-y divide-[var(--border)]">
                  <AnimatePresence>
                    {table.getRowModel().rows.map((row, i) => (
                      <motion.tr
                        key={row.id}
                        className="hover:bg-[var(--muted)] transition-colors duration-200"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: i * 0.05 }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className="px-6 py-4 text-base text-[var(--foreground)]"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
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
          <div className="px-6 py-4 bg-[var(--muted)] border-t border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--primary)]/10 rounded-lg">
                <Tag size={14} className="text-[var(--primary)]" />
              </div>
              <p className="text-base font-semibold text-[var(--foreground)]">
                Showing{' '}
                <span className="text-[var(--primary)] font-bold">
                  {table.getRowModel().rows.length}
                </span>{' '}
                parameters
              </p>
            </div>

            <motion.button
              onClick={fetchParameters}
              className="text-base text-[var(--muted-foreground)] flex items-center gap-2 px-4 py-2 bg-[var(--background)] rounded-lg border border-[var(--border)] shadow-sm hover:shadow-md hover:bg-[var(--muted)] transition-all"
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw size={14} />
              <span className="font-semibold">Refresh</span>
            </motion.button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && parameterToDelete && (
          <motion.div
            className="fixed inset-0 backdrop-blur-sm bg-[var(--background)]/60 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-[var(--background)] rounded-2xl p-6 shadow-xl max-w-md w-full mx-4 border border-[var(--border)]"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[var(--foreground)]">
                  Confirm Deletion
                </h3>
                <motion.button
                  onClick={() => setShowDeleteModal(false)}
                  className="p-1 hover:bg-[var(--muted)] rounded-full"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={20} className="text-[var(--muted-foreground)]" />
                </motion.button>
              </div>
              <p className="text-[var(--muted-foreground)] mb-4">
                Are you sure you want to delete the parameter{' '}
                <strong>"{parameterToDelete.name}"</strong>? This action cannot
                be undone if the parameter is being used in products or batches.
              </p>
              <div className="flex gap-3">
                <motion.button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 bg-[var(--muted)] text-[var(--foreground)] rounded-lg hover:bg-[var(--muted)]/80 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-[var(--destructive)] text-[var(--destructive-foreground)] rounded-lg hover:bg-[var(--destructive)]/90 transition-colors disabled:opacity-50"
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

export default StandardParameterList;
