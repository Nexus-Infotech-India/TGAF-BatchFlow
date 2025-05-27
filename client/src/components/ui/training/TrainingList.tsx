import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiEye,
  FiEdit,
  FiTrash2,
  FiCalendar,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiUsers,
  FiMapPin,
  FiPlus,
  FiX,
  FiCheck,
  FiClock,
  FiAlertCircle,
} from 'react-icons/fi';
import api from '../../../utils/api';
import { API_ROUTES } from '../../../utils/api';
import { format } from 'date-fns';
import TrainingDetails from './Trainingdetails';
import {
  Tooltip,
  Button,
  Table,
  message,
  Dropdown,
  Space,
  Spin,
  Empty,
  Tag,
} from 'antd';
import type { MenuProps } from 'antd';
import { 
  Sparkles, 
  BookOpen,
  ChevronDown,
  Calendar as CalendarIcon} from 'lucide-react';

// Enhanced status configuration with gradients and animations
const statusConfig: Record<
  string,
  { 
    color: string; 
    bgColor: string; 
    textColor: string; 
    gradient: string;
    icon: React.ReactNode;
    borderColor: string;
  }
> = {
  SCHEDULED: { 
    color: 'blue', 
    bgColor: '#EFF6FF', 
    textColor: '#1D4ED8',
    gradient: 'from-blue-400 to-blue-600',
    icon: <CalendarIcon size={12} />,
    borderColor: '#DBEAFE'
  },
  COMPLETED: { 
    color: 'green', 
    bgColor: '#ECFDF5', 
    textColor: '#047857',
    gradient: 'from-green-400 to-green-600',
    icon: <FiCheck size={12} />,
    borderColor: '#D1FAE5'
  },
  CANCELLED: { 
    color: 'red', 
    bgColor: '#FEF2F2', 
    textColor: '#B91C1C',
    gradient: 'from-red-400 to-red-600',
    icon: <FiX size={12} />,
    borderColor: '#FECACA'
  },
  IN_PROGRESS: { 
    color: 'orange', 
    bgColor: '#FFF7ED', 
    textColor: '#C2410C',
    gradient: 'from-orange-400 to-orange-600',
    icon: <FiClock size={12} />,
    borderColor: '#FED7AA'
  },
  POSTPONED: { 
    color: 'purple', 
    bgColor: '#F5F3FF', 
    textColor: '#6D28D9',
    gradient: 'from-purple-400 to-purple-600',
    icon: <FiAlertCircle size={12} />,
    borderColor: '#E9D5FF'
  },
};

// Enhanced animation variants

const itemVariants = {
  hidden: { y: 20, opacity: 0, scale: 0.95 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 80,
      damping: 12,
    },
  },
};



// Enhanced Stats Card Component - Made smaller

const TrainingList: React.FC = () => {
  const [trainings, setTrainings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTraining, setSelectedTraining] = useState<any>(null);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [, setIsTransitioning] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [trainingIdToDelete, setTrainingIdToDelete] = useState<string | null>(null);
  const [filters, setFilters] = useState<any>({
    status: null,
    trainingType: null,
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchTrainings = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
      });

      if (searchText) {
        params.append('search', searchText);
      }

      if (filters.status) {
        params.append('status', filters.status);
      }

      if (filters.trainingType) {
        params.append('trainingType', filters.trainingType);
      }

      const response = await api.get(
        `${API_ROUTES.TRAINING.GET_ALL_TRAININGS}?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );

      setTrainings(response.data.data);
      setPagination({
        ...pagination,
        current: page,
        pageSize,
        total: response.data.pagination.total,
      });
      return true;
    } catch (error) {
      message.error('Failed to fetch trainings');
      console.error('Error fetching trainings:', error);
      return false;
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTrainings(pagination.current, pagination.pageSize);
  }, [filters, searchText]);

  const handleTableChange = (pagination: any) => {
    fetchTrainings(pagination.current, pagination.pageSize);
  };

  const handleViewDetails = (training: any) => {
    setSelectedTraining(training);
    setShowDetails(true);
  };

  const handleDeleteTraining = (id: string) => {
    setTrainingIdToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!trainingIdToDelete) return;

    try {
      setLoading(true);

      await api.delete(
        API_ROUTES.TRAINING.DELETE_TRAINING(trainingIdToDelete),
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );

      message.success('Training deleted successfully');
      fetchTrainings(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Error deleting training:', error);
      message.error('Failed to delete training');
    } finally {
      setLoading(false);
      setIsDeleteModalOpen(false);
      setTrainingIdToDelete(null);
    }
  };

  const handleEditTraining = (id: string) => {
    window.location.href = `/trainings/edit/${id}`;
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters({
      ...filters,
      [key]: value,
    });
  };

  const handleSearch = () => {
    fetchTrainings(1, pagination.pageSize);
  };

  const handleReset = () => {
    setSearchText('');
    setFilters({
      status: null,
      trainingType: null,
    });
    setIsRefreshing(true);
    fetchTrainings(1, pagination.pageSize);
  };

  const statusFilterMenu: MenuProps['items'] = [
    { key: 'all', label: 'All Statuses' },
    { key: 'SCHEDULED', label: 'Scheduled' },
    { key: 'IN_PROGRESS', label: 'In Progress' },
    { key: 'COMPLETED', label: 'Completed' },
    { key: 'CANCELLED', label: 'Cancelled' },
    { key: 'POSTPONED', label: 'Postponed' },
  ];

  const typeFilterMenu: MenuProps['items'] = [
    { key: 'all', label: 'All Types' },
    { key: 'WORKSHOP', label: 'Workshop' },
    { key: 'SEMINAR', label: 'Seminar' },
    { key: 'COURSE', label: 'Course' },
    { key: 'CERTIFICATION', label: 'Certification' },
    { key: 'WEBINAR', label: 'Webinar' },
  ];

  // Calculate stats

  const columns = [
    {
      title: 'Training Title',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: any) => (
        <motion.div
          className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
          whileHover={{ scale: 1.01 }}
          onClick={() => handleViewDetails(record)}
        >
          {title}
        </motion.div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'trainingType',
      key: 'trainingType',
      render: (type: string) => (
        <Tag
          color="blue"
          className="rounded-full px-3 py-1 bg-blue-50 text-blue-700 border-blue-200 capitalize text-xs"
        >
          {type?.toLowerCase().replace('_', ' ')}
        </Tag>
      ),
    },
    {
      title: 'Participants',
      key: 'participants',
      render: (_: any, record: any) => (
        <div className="flex items-center text-sm text-gray-700">
          <FiUsers className="mr-2 text-blue-500" size={14} />
          <span>
            {record._count?.participants || 0}
            {record.maxParticipants && ` / ${record.maxParticipants}`}
          </span>
        </div>
      ),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      render: (location: string) => (
        <div className="flex items-center text-sm text-gray-700">
          <FiMapPin className="mr-2 text-blue-500" size={14} />
          <span className="truncate max-w-[150px]">{location}</span>
        </div>
      ),
    },
    {
      title: 'Schedule',
      key: 'schedule',
      render: (_: any, record: any) => (
        <div className="flex items-center text-sm text-gray-700">
          <FiCalendar className="mr-2 text-blue-500" size={14} />
          <div>
            <div>{format(new Date(record.startDate), 'MMM dd, yyyy')}</div>
            <div className="text-xs text-gray-500">
              to {format(new Date(record.endDate), 'MMM dd, yyyy')}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = statusConfig[status] || {
          color: 'default',
          bgColor: '#F3F4F6',
          textColor: '#4B5563',
          icon: <FiAlertCircle size={12} />,
          borderColor: '#D1D5DB'
        };
        return (
          <motion.div whileHover={{ scale: 1.05 }} className="inline-block">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border"
              style={{
                backgroundColor: config.bgColor,
                color: config.textColor,
                borderColor: config.borderColor,
              }}
            >
              {config.icon}
              <span className="capitalize">{status.replace('_', ' ')}</span>
            </div>
          </motion.div>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space size="small" className="flex flex-row">
          <Tooltip title="View Details">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                type="primary"
                shape="circle"
                icon={<FiEye />}
                onClick={() => handleViewDetails(record)}
                className="flex items-center justify-center bg-blue-500 hover:bg-blue-600 border-none shadow-md"
                size="small"
              />
            </motion.div>
          </Tooltip>

          <Tooltip title={record.status === "SCHEDULED" ? "Edit Training" : "Only scheduled trainings can be edited"}>
            <motion.div whileHover={record.status === "SCHEDULED" ? { scale: 1.1 } : {}} whileTap={record.status === "SCHEDULED" ? { scale: 0.95 } : {}}>
              <Button 
                shape="circle" 
                icon={<FiEdit />} 
                onClick={() => record.status === "SCHEDULED" && handleEditTraining(record.id)}
                className={`flex items-center justify-center shadow-md ${
                  record.status === "SCHEDULED"
                    ? "text-blue-500 hover:text-white hover:bg-blue-500 border-blue-500" 
                    : "text-gray-400 border-gray-300 cursor-not-allowed"
                }`}
                disabled={record.status !== "SCHEDULED"}
                size="small"
              />
            </motion.div>
          </Tooltip>

          <Tooltip title="Delete Training">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                danger
                shape="circle"
                icon={<FiTrash2 />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTraining(record.id);
                }}
                className="flex items-center justify-center shadow-md"
                size="small"
              />
            </motion.div>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <>
        <AnimatePresence mode="wait">
          {!showDetails ? (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="max-w-7xl mx-auto px-4 py-8">
              {/* Single unified component - no gaps */}
              <motion.div
                variants={itemVariants}
                className=" rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
              >
                {/* Header Section */}
                <div className="relative bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-6 border-b border-gray-100">
                  <div className="absolute top-0 right-0 -mt-2 -mr-2">
                    <Sparkles size={60} className="text-blue-100 opacity-50" />
                  </div>

                  <div className="relative">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-3 lg:space-y-0">
                      <div>
                        <div className="flex items-center space-x-3 mb-1">
                          <div className="p-2 bg-blue-100 rounded-xl">
                            <BookOpen className="text-blue-600" size={20} />
                          </div>
                          <div>
                            <h1 className="text-2xl font-bold text-gray-900">Training Management</h1>
                            <p className="text-gray-600 text-sm mt-0.5">
                              Manage and track all training programs and sessions
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg text-sm"
                        >
                          <FiPlus size={14} />
                          New Training
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>


                {/* Search and Filters Section */}
                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50/50 to-blue-50/50">
                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex-1 min-w-[300px] relative">
                      <div className="relative">
                        <FiSearch 
                          className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${
                            isSearchFocused ? 'text-blue-600' : 'text-gray-400'
                          }`} 
                          size={18}
                        />
                        <input
                          type="text"
                          placeholder="Search trainings by title, type, or location..."
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          onFocus={() => setIsSearchFocused(true)}
                          onBlur={() => setIsSearchFocused(false)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                          className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 hover:bg-white"
                        />
                        {searchText && (
                          <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={() => setSearchText('')}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <FiX size={16} />
                          </motion.button>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Dropdown
                        menu={{
                          items: statusFilterMenu,
                          onClick: ({ key }) =>
                            handleFilterChange('status', key === 'all' ? null : key),
                        }}
                        trigger={['click']}
                      >
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all bg-white shadow-sm"
                        >
                          <FiFilter className="text-blue-500" />
                          <span className="text-gray-700 font-medium">
                            Status: {filters.status || 'All'}
                          </span>
                          <ChevronDown size={14} className="text-gray-400" />
                        </motion.button>
                      </Dropdown>

                      <Dropdown
                        menu={{
                          items: typeFilterMenu,
                          onClick: ({ key }) =>
                            handleFilterChange('trainingType', key === 'all' ? null : key),
                        }}
                        trigger={['click']}
                      >
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all bg-white shadow-sm"
                        >
                          <FiFilter className="text-blue-500" />
                          <span className="text-gray-700 font-medium">
                            Type: {filters.trainingType || 'All'}
                          </span>
                          <ChevronDown size={14} className="text-gray-400" />
                        </motion.button>
                      </Dropdown>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleReset}
                        className="flex items-center gap-2 px-4 py-3 text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-all shadow-sm"
                      >
                        <FiRefreshCw className={isRefreshing ? 'animate-spin' : ''} />
                        <span className="font-medium">Reset</span>
                      </motion.button>
                    </div>
                  </div>

                  {/* Active Filters Display */}
                  {(filters.status || filters.trainingType || searchText) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 pt-4 border-t border-gray-100"
                    >
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-sm font-medium text-gray-600">Active filters:</span>
                        {filters.status && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                          >
                            Status: {filters.status}
                            <button 
                              onClick={() => handleFilterChange('status', null)}
                              className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                            >
                              <FiX size={12} />
                            </button>
                          </motion.div>
                        )}
                        {filters.trainingType && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex items-center gap-1 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm"
                          >
                            Type: {filters.trainingType}
                            <button 
                              onClick={() => handleFilterChange('trainingType', null)}
                              className="ml-1 hover:bg-indigo-200 rounded-full p-0.5"
                            >
                              <FiX size={12} />
                            </button>
                          </motion.div>
                        )}
                        {searchText && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex items-center gap-1 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm"
                          >
                            Search: "{searchText}"
                            <button 
                              onClick={() => setSearchText('')}
                              className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
                            >
                              <FiX size={12} />
                            </button>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Table Section */}
                <div>
                  <Table
                    columns={columns}
                    dataSource={trainings}
                    rowKey="id"
                    loading={{
                      spinning: loading,
                      indicator: <Spin size="large" />,
                    }}
                    pagination={{
                      ...pagination,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) => 
                        `${range[0]}-${range[1]} of ${total} trainings`,
                      className: 'px-6 py-4',
                      size: 'default',
                    }}
                    onChange={handleTableChange}
                    className="w-full"
                    rowClassName={(_record, index) => 
                      `hover:bg-blue-50 transition-all duration-200 ${
                        index % 2 === 0 ? 'bg-gray-50/30' : 'bg-white'
                      }`
                    }
                    locale={{
                      emptyText: (
                        <div className="py-16">
                          <Empty
                            image={
                              <div className="flex justify-center mb-4">
                                <BookOpen size={64} className="text-gray-300" />
                              </div>
                            }
                            description={
                              <div className="text-center">
                                <p className="text-gray-500 font-medium text-lg mb-2">
                                  No trainings found
                                </p>
                                <p className="text-gray-400 text-sm">
                                  {searchText || filters.status || filters.trainingType
                                    ? 'Try adjusting your search criteria'
                                    : 'Create your first training to get started'
                                  }
                                </p>
                              </div>
                            }
                          />
                        </div>
                      ),
                    }}
                  />
                </div>
              </motion.div>
              </div>
            </motion.div>
          ) : (
            <TrainingDetails
              training={selectedTraining}
              onClose={async () => {
                setIsTransitioning(true);
                await fetchTrainings(pagination.current, pagination.pageSize);
                setShowDetails(false);
                setSelectedTraining(null);
                setIsTransitioning(false);
              }}
              onRefresh={() => {
                fetchTrainings(pagination.current, pagination.pageSize);
              }}
            />
          )}
        </AnimatePresence>

        {/* Enhanced Delete Modal */}
        <AnimatePresence>
          {isDeleteModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] overflow-y-auto bg-black bg-opacity-50 backdrop-blur-sm"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setTrainingIdToDelete(null);
              }}
            >
              <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 50 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 50 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="inline-block align-middle bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="bg-gradient-to-r from-red-50 to-pink-50 px-6 pt-6 pb-4 border-b border-red-100">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                        <FiTrash2 className="h-6 w-6 text-red-600" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-xl font-bold text-gray-900">
                          Delete Training
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          This action cannot be undone
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white px-6 py-4">
                    <p className="text-gray-700">
                      Are you sure you want to delete this training? All sessions, 
                      participants, documents, and related data will be permanently removed.
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 px-6 py-4 flex flex-row-reverse gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={confirmDelete}
                      className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium transition-all shadow-lg"
                    >
                      Delete Training
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setIsDeleteModalOpen(false);
                        setTrainingIdToDelete(null);
                      }}
                      className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all"
                    >
                      Cancel
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
     </>
  );
};

export default TrainingList;