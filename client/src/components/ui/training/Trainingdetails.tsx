import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  Button,
  Modal,
  Form,
  Select,
  message,
  Tooltip,
  Divider,
} from 'antd';
import {
  FiRefreshCw,
} from 'react-icons/fi';
import {
  ArrowLeft,
  Calendar,
  Users,
  Building,
  FileText,
  Tag,
  Clock,
  AlertTriangle,
  CheckCircle,
  Play,
  Edit,
  X,
  ClipboardCheck,
  Layers,
  Shield,
} from 'lucide-react';
import api from '../../../utils/api';
import { API_ROUTES } from '../../../utils/api';
import { useNavigate } from 'react-router-dom';

// Import tab components
import TrainingOverview from './minicomponents/trainingoverview';
import TrainingSessions from './minicomponents/trainingsessions';
import TrainingParticipants from './minicomponents/trainingparticipants';
import TrainingDocuments from './minicomponents/trainingdocuments';
import TrainingAttendance from './minicomponents/trainingattendence';

interface TrainingDetailsProps {
  training: any;
  onClose: () => void;
  onRefresh: () => void;
}

// Enhanced animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.5,
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  },
  exit: { 
    opacity: 0,
    y: 20,
    transition: { 
      duration: 0.3
    } 
  }
};


const tabContentVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.4 }
  },
  exit: {
    opacity: 0,
    x: 10,
    transition: { duration: 0.3 }
  }
};

const heroVariants = {
  hidden: { opacity: 0, y: -30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: 'easeOut',
    },
  },
};

// Status Badge Component
interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let color = '';
  let bgColor = '';
  let label = '';
  let icon = null;

  switch (status) {
    case 'SCHEDULED':
      color = 'text-blue-700';
      bgColor = 'bg-blue-100 border-blue-200';
      label = 'Scheduled';
      icon = <Calendar size={14} />;
      break;
    case 'IN_PROGRESS':
      color = 'text-amber-700';
      bgColor = 'bg-amber-100 border-amber-200';
      label = 'In Progress';
      icon = <Play size={14} />;
      break;
    case 'COMPLETED':
      color = 'text-emerald-700';
      bgColor = 'bg-emerald-100 border-emerald-200';
      label = 'Completed';
      icon = <CheckCircle size={14} />;
      break;
    case 'CANCELLED':
      color = 'text-rose-700';
      bgColor = 'bg-rose-100 border-rose-200';
      label = 'Cancelled';
      icon = <X size={14} />;
      break;
    case 'POSTPONED':
      color = 'text-purple-700';
      bgColor = 'bg-purple-100 border-purple-200';
      label = 'Postponed';
      icon = <AlertTriangle size={14} />;
      break;
    default:
      color = 'text-gray-700';
      bgColor = 'bg-gray-100 border-gray-200';
      label = status;
      icon = <Shield size={14} />;
  }

  return (
    <motion.span
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
      className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border shadow-sm ${color} ${bgColor}`}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {label}
    </motion.span>
  );
};

// Tab type definition
type TabType = 'overview' | 'sessions' | 'participants' | 'documents' | 'attendance';

const TrainingDetails: React.FC<TrainingDetailsProps> = ({ training, onClose, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [statusUpdateModalVisible, setStatusUpdateModalVisible] = useState<boolean>(false);
  const [statusForm] = Form.useForm();
  const navigate = useNavigate();
  const [isClosing, setIsClosing] = useState(false);

  const handleStatusUpdate = async (values: any) => {
    try {
      await api.patch(
        API_ROUTES.TRAINING.UPDATE_TRAINING_STATUS(training.id), 
        { status: values.status },
        { 
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );
      
      message.success('Training status updated successfully');
      setStatusUpdateModalVisible(false);
      onRefresh();
    } catch (error) {
      console.error('Status update error:', error);
      message.error('Failed to update training status');
    }
  };

  const handleEditTraining = () => {
    navigate(`/trainings/edit/${training.id}`);
  };

  // Create the hero background gradient based on status
  const statusGradientMap: Record<'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'POSTPONED', string> = {
    SCHEDULED: 'from-blue-600 via-blue-700 to-indigo-800',
    IN_PROGRESS: 'from-amber-500 via-orange-600 to-red-700',
    COMPLETED: 'from-emerald-600 via-green-700 to-teal-800',
    CANCELLED: 'from-rose-600 via-red-700 to-red-800',
    POSTPONED: 'from-violet-500 via-purple-600 to-purple-800',
  };

  const statusGradient =
    statusGradientMap[training.status as keyof typeof statusGradientMap] ||
    'from-gray-700 via-gray-800 to-gray-900';

  // Enhanced tabs configuration
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <Layers size={18} />,
      description: 'Training summary and details',
      color: 'text-blue-600',
    },
    {
      id: 'sessions',
      label: 'Sessions',
      icon: <Clock size={18} />,
      description: 'Training sessions and schedule',
      color: 'text-purple-600',
    },
    {
      id: 'participants',
      label: 'Participants',
      icon: <Users size={18} />,
      description: 'Enrolled participants',
      color: 'text-green-600',
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: <FileText size={18} />,
      description: 'Training materials and resources',
      color: 'text-orange-600',
    },
    {
      id: 'attendance',
      label: 'Attendance',
      icon: <ClipboardCheck size={18} />,
      description: 'Attendance tracking',
      color: 'text-indigo-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="space-y-4">
            {/* Compact Hero Section with Back Button - Matching AuditDetails */}
            <motion.div 
              variants={heroVariants}
              className={`bg-gradient-to-r ${statusGradient} rounded-xl shadow-lg overflow-hidden text-white relative`}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: `radial-gradient(circle at 25% 25%, white 2px, transparent 2px), radial-gradient(circle at 75% 75%, white 2px, transparent 2px)`,
                  backgroundSize: '30px 30px'
                }}></div>
              </div>
              
              <div className="relative p-4 lg:p-5">
                <div className="max-w-4xl">
                  {/* Back Button at top */}
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-2"
                  >
                    <motion.button 
                      onClick={async () => {
                        if (isClosing) return;
                        setIsClosing(true);
                        
                        try {
                          await onRefresh();
                          setTimeout(() => {
                            onClose();
                          }, 100);
                        } catch (error) {
                          console.error("Error closing training details:", error);
                          onClose();
                        }
                      }}
                      className="inline-flex items-center text-white/90 hover:text-white cursor-pointer font-medium bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/30 hover:bg-white/30 transition-all text-sm"
                      whileHover={{ x: -2, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <ArrowLeft size={16} className="mr-2" />
                      Back to Trainings
                    </motion.button>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center space-x-2 mb-1"
                  >
                    <StatusBadge status={training.status} />
                    <span className="text-white/80 text-xs font-medium bg-white/20 backdrop-blur-sm px-2 py-1 rounded-md">
                      ID: {training.id ? training.id.substring(0, 8) : 'N/A'}
                    </span>
                  </motion.div>
                  
                  <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-xl lg:text-2xl font-bold mb-1 drop-shadow-lg"
                  >
                    {training.title}
                  </motion.h1>
                  
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-wrap items-center gap-x-4 gap-y-1 text-white/90 text-xs mb-3"
                  >
                    <div className="flex items-center bg-white/20 backdrop-blur-sm px-2 py-1 rounded-md">
                      <Calendar size={12} className="mr-1" />
                      <span>{format(new Date(training.startDate), 'MMM dd')} - {format(new Date(training.endDate), 'MMM dd, yyyy')}</span>
                    </div>
                    
                    <div className="flex items-center bg-white/20 backdrop-blur-sm px-2 py-1 rounded-md">
                      <Building size={12} className="mr-1" />
                      <span>{training.location}</span>
                    </div>
                    
                    <div className="flex items-center bg-white/20 backdrop-blur-sm px-2 py-1 rounded-md">
                      <Tag size={12} className="mr-1" />
                      <span>{training.trainingType?.replace('_', ' ')}</span>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-wrap gap-2"
                  >
                    <Tooltip title={training.status === "SCHEDULED" ? "Edit this training" : "Only scheduled trainings can be edited"}>
                      <motion.div whileHover={training.status === "SCHEDULED" ? { scale: 1.05 } : {}} whileTap={training.status === "SCHEDULED" ? { scale: 0.95 } : {}}>
                        <button 
                          onClick={training.status === "SCHEDULED" ? handleEditTraining : undefined}
                          disabled={training.status !== "SCHEDULED"}
                          className={`inline-flex items-center px-3 py-1.5 rounded-lg transition-all font-medium shadow-md hover:shadow-lg transform hover:scale-105 text-sm ${
                            training.status === "SCHEDULED" 
                              ? "bg-white text-gray-800 hover:bg-gray-100" 
                              : "bg-gray-200 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          <Edit size={14} className="mr-1" />
                          Edit Training
                        </button>
                      </motion.div>
                    </Tooltip>
                    
                    <Tooltip title="Update training status">
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <button 
                          onClick={() => setStatusUpdateModalVisible(true)}
                          className="inline-flex items-center px-3 py-1.5 bg-white/20 text-white hover:bg-white/30 border border-white/30 rounded-lg shadow-md font-medium transition-all text-sm"
                        >
                          <FiRefreshCw size={14} className="mr-1" />
                          Update Status
                        </button>
                      </motion.div>
                    </Tooltip>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Enhanced Tab Navigation - Matching AuditDetails */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
            >
              <div className="flex overflow-x-auto bg-gradient-to-r from-gray-50 to-blue-50">
                {tabs.map((tab) => (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`
                      relative flex items-center px-4 py-3 min-w-max transition-all duration-300
                      ${
                        activeTab === tab.id
                          ? 'bg-white text-gray-800 shadow-md border-b-2 border-blue-600'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                      }
                    `}
                    whileHover={{ y: activeTab === tab.id ? 0 : -1 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.div 
                      className={`p-1.5 rounded-lg mr-3 ${
                        activeTab === tab.id 
                          ? `bg-gradient-to-br from-blue-100 to-indigo-100 ${tab.color}` 
                          : 'bg-gray-100 text-gray-500'
                      }`}
                      animate={{
                        scale: activeTab === tab.id ? 1.05 : 1,
                        rotate: activeTab === tab.id ? 360 : 0
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      {React.cloneElement(tab.icon, { size: 16 })}
                    </motion.div>
                    <div className="flex flex-col items-start">
                      <span className="font-semibold text-sm">{tab.label}</span>
                      <span className="text-xs text-gray-500 hidden lg:block">{tab.description}</span>
                    </div>
                    
                    {/* Active tab indicator */}
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-t-xl"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Tab Content with animations */}
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeTab}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={tabContentVariants}
                className="min-h-[40vh]"
              >
                {activeTab === 'overview' && <TrainingOverview training={training} onTabChange={setActiveTab} />}
                {activeTab === 'sessions' && <TrainingSessions training={training} onRefresh={onRefresh} />}
                {activeTab === 'participants' && <TrainingParticipants training={training} onRefresh={onRefresh} />}
                {activeTab === 'documents' && <TrainingDocuments training={training} onRefresh={onRefresh} />}
                {activeTab === 'attendance' && <TrainingAttendance training={training} onRefresh={onRefresh} />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Enhanced modal with better styles */}
          <Modal
            title={<div className="text-xl font-semibold">Update Training Status</div>}
            open={statusUpdateModalVisible}
            onCancel={() => setStatusUpdateModalVisible(false)}
            footer={null}
            className="status-update-modal"
            destroyOnHidden={true}
            maskClosable={false}
            width={500}
            centered
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-gray-600 mb-4">
                Change the status of this training to reflect its current state.
              </p>
              
              <Form
                form={statusForm}
                layout="vertical"
                initialValues={{ status: training.status }}
                onFinish={handleStatusUpdate}
              >
                <Form.Item
                  name="status"
                  label={<span className="text-gray-700 font-medium">Status</span>}
                  rules={[{ required: true, message: 'Please select a status' }]}
                >
                  <Select className="w-full" size="large">
                    <Select.Option value="SCHEDULED">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-blue-600 mr-2"></div>
                        Scheduled
                      </div>
                    </Select.Option>
                    <Select.Option value="IN_PROGRESS">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                        In Progress
                      </div>
                    </Select.Option>
                    <Select.Option value="COMPLETED">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-green-600 mr-2"></div>
                        Completed
                      </div>
                    </Select.Option>
                    <Select.Option value="CANCELLED">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-red-600 mr-2"></div>
                        Cancelled
                      </div>
                    </Select.Option>
                    <Select.Option value="POSTPONED">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-purple-600 mr-2"></div>
                        Postponed
                      </div>
                    </Select.Option>
                  </Select>
                </Form.Item>
                
                <Divider />
                
                <div className="flex justify-end gap-3 mt-4">
                  <Button 
                    onClick={() => setStatusUpdateModalVisible(false)}
                    className="border-gray-300 hover:border-gray-400"
                    size="large"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="primary" 
                    htmlType="submit"
                    className="bg-blue-600 hover:bg-blue-700 border-none shadow"
                    size="large"
                    icon={<FiRefreshCw className="mr-1" />}
                  >
                    Update Status
                  </Button>
                </div>
              </Form>
            </motion.div>
          </Modal>
        </motion.div>
      </div>
    </div>
  );
};

export default TrainingDetails;