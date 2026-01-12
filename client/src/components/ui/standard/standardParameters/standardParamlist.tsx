import React, { useEffect, useState } from 'react';
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
        <button
          onClick={() => column.toggleSorting()}
          className="flex items-center gap-2 font-semibold text-gray-900 hover:text-[#5317AA] transition-colors group"
        >
          <div className="p-1.5 rounded-lg bg-[#5317AA]/10 text-[#5317AA] group-hover:bg-[#5317AA]/20 transition-colors">
            <Tag size={14} />
          </div>
          Name
          <ArrowUpDown
            size={12}
            className="text-gray-500 group-hover:text-[#5317AA] transition-colors"
          />
        </button>
      ),
      cell: ({ getValue }) => (
        <div className="font-medium text-gray-900">{getValue()}</div>
      ),
    }),
    columnHelper.accessor('category.name', {
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting()}
          className="flex items-center gap-2 font-semibold text-gray-900 hover:text-[#5317AA] transition-colors group"
        >
          <div className="p-1.5 rounded-lg bg-[#178EC8]/10 text-[#178EC8] group-hover:bg-[#178EC8]/20 transition-colors">
            <List size={14} />
          </div>
          Category
          <ArrowUpDown
            size={12}
            className="text-gray-500 group-hover:text-[#5317AA] transition-colors"
          />
        </button>
      ),
      cell: ({ getValue }) => (
        <div className="bg-[#178EC8]/10 text-gray-900 px-3 py-1.5 rounded-lg inline-block text-sm font-medium border border-[#178EC8]/20">
          {getValue()}
        </div>
      ),
    }),
    columnHelper.accessor('dataType', {
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting()}
          className="flex items-center gap-2 font-semibold text-gray-900 hover:text-[#5317AA] transition-colors group"
        >
          <div className="p-1.5 rounded-lg bg-green-100 text-green-600 group-hover:bg-green-200 transition-colors">
            <Database size={14} />
          </div>
          Data Type
          <ArrowUpDown
            size={12}
            className="text-gray-500 group-hover:text-[#5317AA] transition-colors"
          />
        </button>
      ),
      cell: ({ getValue }) => (
        <div className="bg-green-100 text-green-800 px-3 py-1.5 rounded-lg inline-block text-sm font-medium border border-green-200">
          {formatDataType(getValue())}
        </div>
      ),
    }),
    columnHelper.accessor('description', {
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting()}
          className="flex items-center gap-2 font-semibold text-gray-900 hover:text-[#5317AA] transition-colors group"
        >
          <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-200 transition-colors">
            <FileText size={14} />
          </div>
          Description
          <ArrowUpDown
            size={12}
            className="text-gray-500 group-hover:text-[#5317AA] transition-colors"
          />
        </button>
      ),
      cell: ({ getValue }) => (
        <div className="text-gray-600 max-w-md">
          {getValue() || (
            <span className="italic text-gray-400">
              No description provided
            </span>
          )}
        </div>
      ),
    }),
    columnHelper.display({
      id: 'delete',
      header: () => (
        <div className="flex items-center gap-2 font-semibold text-gray-900">
          <div className="p-1.5 rounded-lg bg-red-100 text-red-600">
            <Trash2 size={14} />
          </div>
          Delete
        </div>
      ),
      cell: ({ row }) => (
        <button
          onClick={() => {
            setParameterToDelete(row.original);
            setShowDeleteModal(true);
          }}
          className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-sm hover:shadow-md"
        >
          <Trash2 size={14} />
          Delete
        </button>
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
      <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#5317AA] mb-6"></div>
        <p className="text-gray-900 font-medium text-lg">
          Loading parameters...
        </p>
        <p className="text-gray-600 text-sm mt-2">
          Please wait while we fetch your data
        </p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 shadow-sm">
        <div className="flex items-start">
          <div className="mr-4 p-2 bg-red-100 rounded-xl">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Unable to load parameters
            </h3>
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <button
              className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg shadow-sm flex items-center gap-2 hover:bg-red-50 transition-colors"
              onClick={() => fetchParameters()}
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render data table
  return (
    <div className="h-full">
      {parameters.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-2xl p-12">
          <div className="h-24 w-24 mx-auto mb-6 bg-[#5317AA]/10 text-[#5317AA] rounded-2xl flex items-center justify-center shadow-lg">
            <Tag className="h-12 w-12" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            No Parameters Found
          </h3>
          <p className="text-gray-600 max-w-md mx-auto text-center mb-8 leading-relaxed">
            Create parameters to define what can be measured in your standards.
            Parameters help establish the criteria for quality control.
          </p>

          <button
            className="px-6 py-3 bg-[#5317AA] text-white rounded-xl shadow-lg inline-flex items-center gap-3 font-medium hover:bg-[#178EC8] transition-colors"
            onClick={onAddParameterClick}
          >
            <Plus size={18} />
            Create Your First Parameter
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden h-full flex flex-col">
          <div className="flex-1 overflow-hidden">
            <div className="overflow-x-auto h-full">
              <table className="min-w-full h-full">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-6 py-4 text-left text-base font-bold text-gray-900"
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
                <tbody className="bg-white divide-y divide-gray-200">
                  {table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-gray-50 transition-colors duration-200"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-6 py-4 text-base text-gray-900"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Enhanced Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#5317AA]/10 rounded-lg">
                <Tag size={14} className="text-[#5317AA]" />
              </div>
              <p className="text-base font-semibold text-gray-900">
                Showing{' '}
                <span className="text-[#5317AA] font-bold">
                  {table.getRowModel().rows.length}
                </span>{' '}
                parameters
              </p>
            </div>

            <button
              onClick={fetchParameters}
              className="text-base text-gray-600 flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all"
            >
              <RefreshCw size={14} />
              <span className="font-semibold">Refresh</span>
            </button>
          </div>
        </div>
      )
      }

      {/* Delete Confirmation Modal */}
      {
        showDeleteModal && parameterToDelete && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 shadow-xl max-w-md w-full mx-4 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Confirm Deletion
                </h3>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </div>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete the parameter{' '}
                <strong>"{parameterToDelete.name}"</strong>? This action cannot
                be undone if the parameter is being used in products or batches.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};
export default StandardParameterList;
