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
  Calendar,
  Info,
  Tag,
  Type,
  Folder,
  RefreshCw,
  AlertCircle,
  Plus,
  Trash2,
  X,
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] =
    useState<StandardCategory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Column definition for TanStack Table (ID column removed)
  const columnHelper = createColumnHelper<StandardCategory>();
  const columns = [
    columnHelper.accessor('name', {
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting()}
          className="flex items-center gap-2 font-semibold text-gray-900 hover:text-[#5317AA] transition-colors group"
        >
          <div className="p-1.5 rounded-lg bg-[#5317AA]/10 text-[#5317AA] group-hover:bg-[#5317AA]/20 transition-colors">
            <Type size={14} />
          </div>
          Name
          <ArrowUpDown
            size={12}
            className="text-gray-500 group-hover:text-[#5317AA] transition-colors"
          />
        </button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">
          <EditableCell
            value={row.original.name}
            onSave={(newValue) => handleSave(row.original.id, 'name', newValue)}
            className="border-2 border-transparent hover:border-[#5317AA]/30 focus:border-[#5317AA] focus:ring-2 focus:ring-[#5317AA]/10 rounded-lg px-3 py-2 bg-white transition-all"
          />
        </div>
      ),
    }),
    columnHelper.accessor('description', {
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting()}
          className="flex items-center gap-2 font-semibold text-gray-900 hover:text-[#5317AA] transition-colors group"
        >
          <div className="p-1.5 rounded-lg bg-[#178EC8]/10 text-[#178EC8] group-hover:bg-[#178EC8]/20 transition-colors">
            <Info size={14} />
          </div>
          Description
          <ArrowUpDown
            size={12}
            className="text-gray-500 group-hover:text-[#5317AA] transition-colors"
          />
        </button>
      ),
      cell: ({ row }) => (
        <div className="max-w-md">
          <EditableCell
            value={row.original.description || 'No description provided'}
            onSave={(newValue) =>
              handleSave(row.original.id, 'description', newValue)
            }
            className="border-2 border-transparent hover:border-[#5317AA]/30 focus:border-[#5317AA] focus:ring-2 focus:ring-[#5317AA]/10 rounded-lg px-3 py-2 bg-white transition-all"
          />
        </div>
      ),
    }),
    columnHelper.accessor('updatedAt', {
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting()}
          className="flex items-center gap-2 font-semibold text-gray-900 hover:text-[#5317AA] transition-colors group"
        >
          <div className="p-1.5 rounded-lg bg-gray-100 text-gray-600 group-hover:bg-gray-200 transition-colors">
            <Calendar size={14} />
          </div>
          Last Updated
          <ArrowUpDown
            size={12}
            className="text-gray-500 group-hover:text-[#5317AA] transition-colors"
          />
        </button>
      ),
      cell: ({ row }) => {
        const date = new Date(row.original.updatedAt);
        return (
          <div className="flex items-center gap-2">
            <div className="p-1 bg-gray-100 rounded-full">
              <Calendar size={12} className="text-gray-600" />
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
            setCategoryToDelete(row.original);
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
      <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#5317AA] mb-6"></div>
        <p className="text-gray-900 font-medium text-lg">
          Loading categories...
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
              Unable to load categories
            </h3>
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <button
              className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg shadow-sm flex items-center gap-2 hover:bg-red-50 transition-colors"
              onClick={() => fetchCategories()}
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
      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-2xl p-12">
          <div className="h-24 w-24 mx-auto mb-6 bg-[#5317AA]/10 text-[#5317AA] rounded-2xl flex items-center justify-center shadow-lg">
            <Folder className="h-12 w-12" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            No Categories Found
          </h3>
          <p className="text-gray-600 max-w-md mx-auto text-center mb-8 leading-relaxed">
            Start organizing your standards by creating your first category.
            Categories help you group related standards for better management.
          </p>

          <button
            className="px-6 py-3 bg-[#5317AA] text-white rounded-xl shadow-lg inline-flex items-center gap-3 font-medium hover:bg-[#178EC8] transition-colors"
            onClick={onAddCategoryClick}
          >
            <Plus size={18} />
            Create Your First Category
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
                      className="hover:bg-gray-50 transition-all duration-200"
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
                categories
              </p>
            </div>

            <button
              onClick={fetchCategories}
              className="text-base text-gray-600 flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all"
            >
              <RefreshCw size={14} />
              <span className="font-semibold">Refresh</span>
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && categoryToDelete && (
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
              Are you sure you want to delete the category{' '}
              <strong>"{categoryToDelete.name}"</strong>? This will also
              delete all associated parameters under this category.
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

export default StandardCategory;
