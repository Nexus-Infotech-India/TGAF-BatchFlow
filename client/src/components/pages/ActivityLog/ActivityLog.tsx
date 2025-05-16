import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
} from "@tanstack/react-table";
import api, { API_ROUTES } from "../../../utils/api";
import { Search, Calendar, User, ArrowUp, ArrowDown, Clock, FileText, RefreshCw, Activity, Filter, ChevronDown } from "lucide-react";
import { debounce } from "lodash";
import { motion, AnimatePresence } from "framer-motion";

// Define the type for our log data
type ActivityLogType = {
  id: string;
  User: { name: string; email: string } | null;
  action: string;
  details: string;
  createdAt: string;
};

const ActivityLog: React.FC = () => {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [showFilters, setShowFilters] = useState<boolean>(true);

  // Filter state with debounced search
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    searchTerm: "",
  });

  // Debounce search to avoid too many requests
  const debouncedSearch = debounce((value: string) => {
    setFilters(prev => ({ ...prev, searchTerm: value }));
  }, 300);

  // Update filters when search term changes
  useEffect(() => {
    debouncedSearch(searchTerm);
    return () => debouncedSearch.cancel();
  }, [searchTerm]);

  // Update date filters
  const applyDateFilters = () => {
    setFilters(prev => ({
      ...prev,
      startDate,
      endDate
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setSearchTerm("");
    setFilters({
      startDate: "",
      endDate: "",
      searchTerm: "",
    });
  };

  // Fetch activity logs using TanStack Query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["activityLogs", filters],
    queryFn: async () => {
      const authToken = localStorage.getItem("authToken");
      const response = await api.get(API_ROUTES.BATCH.GET_ACTIVITY_LOGS, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        params: {
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
          searchTerm: filters.searchTerm || undefined,
        },
      });
      return response.data.activityLogs || [];
    },
  });

  // Column definitions using columnHelper
  const columnHelper = createColumnHelper<ActivityLogType>();
  
  const columns = [
    columnHelper.accessor(row => row.User?.name || "N/A", {
      id: 'userName',
      header: () => (
        <div className="flex items-center gap-2">
          <User size={16} className="text-blue-500" />
          <span>User</span>
        </div>
      ),
      cell: info => (
        <div>
          <div className="font-medium">{info.getValue()}</div>
          <div className="text-xs text-gray-500">{info.row.original.User?.email || "N/A"}</div>
        </div>
      ),
    }),
    columnHelper.accessor('action', {
      header: () => (
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-blue-500" />
          <span>Action</span>
        </div>
      ),
      cell: info => (
        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('details', {
      header: 'Details',
      cell: info => <div className="max-w-sm truncate">{info.getValue()}</div>,
    }),
    columnHelper.accessor('createdAt', {
      header: () => (
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-blue-500" />
          <span>Date & Time</span>
        </div>
      ),
      cell: info => {
        const date = new Date(info.getValue());
        return (
          <div className="text-sm">
             <div>{date.toISOString().split("T")[0]}</div> 
            <div className="text-xs text-gray-500">{date.toLocaleTimeString()}</div>
          </div>
        );
      },
    }),
  ];

  // Set up the table
  const table = useReactTable({
    data: data || [],
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow-lg">
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="relative h-16 w-16">
            <motion.div 
              className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-t-blue-500 border-r-blue-300 border-b-blue-100 border-l-blue-300"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            ></motion.div>
          </div>
          <p className="text-gray-600 mt-4 font-medium">Loading activity logs...</p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <motion.div 
        className="p-6 bg-white rounded-lg shadow-lg"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-red-500 text-center p-8 bg-red-50 border border-red-100 rounded-lg">
          <p className="font-medium mb-2">Failed to load activity logs</p>
          <p className="text-sm">Please try again later or contact support if the issue persists.</p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2 mx-auto"
            onClick={() => refetch()}
          >
            <RefreshCw size={16} />
            <span>Try Again</span>
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className=" rounded-lg shadow-lg border border-gray-100 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-blue-100">
        <div className="flex justify-between items-center">
          <motion.h1 
            className="text-2xl font-semibold text-gray-800 flex items-center gap-3"
            initial={{ x: -20 }}
            animate={{ x: 0 }}
          >
            <Activity size={24} className="text-blue-500" />
            <span className="border-b-3 border-blue-500 pb-1">Activity Logs</span>
          </motion.h1>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800  px-3 py-2 rounded-lg shadow-sm border border-blue-100"
          >
            <Filter size={16} />
            <span>Filters</span>
            <motion.div
              animate={{ rotate: showFilters ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={16} />
            </motion.div>
          </motion.button>
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Search */}
                <div className="col-span-1 md:col-span-1">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search activity logs..."
                      className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Date filters */}
                <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar size={18} className="text-gray-400" />
                      </div>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        placeholder="Start Date"
                      />
                    </div>
                  </div>
                  <div className="col-span-1">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar size={18} className="text-gray-400" />
                      </div>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        placeholder="End Date"
                      />
                    </div>
                  </div>
                  <div className="col-span-1 flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={applyDateFilters}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Calendar size={16} />
                      <span>Apply Dates</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={clearFilters}
                      className="flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded-lg transition-colors"
                    >
                      <RefreshCw size={16} />
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="bg-blue-50 border-b border-gray-100">
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                  >
                    {header.isPlaceholder ? null : (
                      <motion.div
                        className={`flex items-center gap-1 ${header.column.getCanSort() ? 'cursor-pointer select-none' : ''}`}
                        onClick={header.column.getToggleSortingHandler()}
                        whileHover={{ color: "#2563EB" }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: <ArrowUp size={14} className="text-blue-500" />,
                          desc: <ArrowDown size={14} className="text-blue-500" />,
                        }[header.column.getIsSorted() as string] ?? null}
                      </motion.div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row, index) => (
                <motion.tr 
                  key={row.id}
                  className="hover:bg-blue-50 transition-colors duration-150 ease-in-out border-b border-gray-100"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  {row.getVisibleCells().map(cell => (
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
              ))
            ) : (
              <motion.tr
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center"
                >
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="bg-blue-50 p-4 rounded-full">
                      <Activity size={32} className="text-blue-400" />
                    </div>
                    <p className="text-lg font-medium text-gray-600">No activity logs found</p>
                    <p className="text-sm text-gray-500">
                      Try adjusting your search filters
                    </p>
                  </div>
                </td>
              </motion.tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer with stats */}
      <div className="p-4 border-t border-gray-100 bg-gradient-to-r from-blue-50 to-blue-100 text-xs text-gray-600 flex flex-wrap justify-between items-center">
        <div className="font-medium">
          {data?.length || 0} activities found
        </div>
        <div className="flex items-center gap-2">
          {filters.searchTerm && (
            <span className="px-2 py-1 bg-blue-100 rounded-full flex items-center gap-1">
              <Search size={12} className="text-blue-600" />
              <span>"{filters.searchTerm}"</span>
            </span>
          )}
          {filters.startDate && (
            <span className="px-2 py-1 bg-blue-100 rounded-full flex items-center gap-1">
              <Calendar size={12} className="text-blue-600" />
              <span>From: {filters.startDate}</span>
            </span>
          )}
          {filters.endDate && (
            <span className="px-2 py-1 bg-blue-100 rounded-full flex items-center gap-1">
              <Calendar size={12} className="text-blue-600" />
              <span>To: {filters.endDate}</span>
            </span>
          )}
          {!filters.searchTerm && !filters.startDate && !filters.endDate && (
            <span className="px-2 py-1 bg-blue-100 rounded-full">
              Showing all logs
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ActivityLog;