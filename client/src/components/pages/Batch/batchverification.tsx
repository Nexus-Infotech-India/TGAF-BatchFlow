import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Calendar,
  Package,
  User,
  BarChart3,
  AlertTriangle,
  RefreshCw,
  FileText,
  Shield,
  Beaker,
  ArrowLeft,
  Save,
  Check,
  X,
  Activity,
  Eye,
  Sparkles,
  Zap,
  Target,
  ChevronDown,
  Star,
  Award,
  Download,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_ROUTES } from '../../../utils/api';
import api from '../../../utils/api';
import { exportToCertificateOfAnalysis } from '../../../utils/export';

interface BatchForVerification {
  id: string;
  batchNumber: string;
  product: {
    id: string;
    name: string;
    code: string;
  };
  maker: {
    id: string;
    name: string;
    email: string;
  };
  checker?: {
    id: string;
    name: string;
    email: string;
  };
  dateOfProduction: string;
  sampleAnalysisStatus: string;
  status: string; // SUBMITTED, APPROVED, REJECTED
  rejectionRemarks?: string;
  bestBeforeDate?: string;
  sampleAnalysisStarted?: string;
  sampleAnalysisCompleted?: string;
  totalParameters: number;
  parametersByCategory: Record<string, number>;
  createdAt: string;
}

interface ParameterForVerification {
  id: string;
  parameterId: string;
  parameterName: string;
  parameterDescription: string;
  dataType: string;
  currentValue: string;
  currentUnit: any;
  currentMethodology: any;
  verificationResult: string | null;
  verificationRemark: string | null;
  standardDefinition?: {
    standardValue: string;
    unit: any;
    methodology: any;
  };
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.8,
      staggerChildren: 0.1,
      ease: 'easeOut',
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};


// Updated status colors to include batch status


const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return {
          bg: 'bg-gradient-to-r from-yellow-100 to-amber-100',
          text: 'text-yellow-800',
          icon: Clock,
          border: 'border-yellow-200',
          glow: 'shadow-yellow-200/50',
        };
      case 'in_progress':
        return {
          bg: 'bg-gradient-to-r from-blue-100 to-indigo-100',
          text: 'text-blue-800',
          icon: RefreshCw,
          border: 'border-blue-200',
          glow: 'shadow-blue-200/50',
        };
      case 'completed':
        return {
          bg: 'bg-gradient-to-r from-green-100 to-emerald-100',
          text: 'text-green-800',
          icon: CheckCircle,
          border: 'border-green-200',
          glow: 'shadow-green-200/50',
        };
      case 'submitted':
        return {
          bg: 'bg-gradient-to-r from-purple-100 to-violet-100',
          text: 'text-purple-800',
          icon: Clock,
          border: 'border-purple-200',
          glow: 'shadow-purple-200/50',
        };
      case 'approved':
        return {
          bg: 'bg-gradient-to-r from-green-100 to-emerald-100',
          text: 'text-green-800',
          icon: CheckCircle,
          border: 'border-green-200',
          glow: 'shadow-green-200/50',
        };
      case 'rejected':
        return {
          bg: 'bg-gradient-to-r from-red-100 to-rose-100',
          text: 'text-red-800',
          icon: XCircle,
          border: 'border-red-200',
          glow: 'shadow-red-200/50',
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-gray-100 to-slate-100',
          text: 'text-gray-800',
          icon: Clock,
          border: 'border-gray-200',
          glow: 'shadow-gray-200/50',
        };
    }
  };

  const config = getStatusConfig(status);
  const IconComponent = config.icon;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.2, type: 'spring', stiffness: 500 }}
      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border shadow-lg ${config.bg} ${config.text} ${config.border} ${config.glow}`}
    >
      <motion.div
        animate={{ rotate: status.toLowerCase() === 'in_progress' ? 360 : 0 }}
        transition={{
          duration: 2,
          repeat: status.toLowerCase() === 'in_progress' ? Infinity : 0,
          ease: 'linear',
        }}
      >
        <IconComponent size={12} className="mr-1.5" />
      </motion.div>
      {status.replace('_', ' ').toUpperCase()}
    </motion.div>
  );
};

// Updated ParameterVerificationTable with disabled state
const ParameterVerificationTable: React.FC<{
  parameters: ParameterForVerification[];
  onUpdate: (parameterId: string, result: string, remark: string) => void;
  isDisabled?: boolean;
  existingVerifications?: Record<string, { result: string; remark: string }>;
}> = ({
  parameters,
  onUpdate,
  isDisabled = false,
  existingVerifications = {},
}) => {
  const [verificationData, setVerificationData] = useState<
    Record<string, { result: string; remark: string }>
  >(
    // Initialize with existing verifications or saved verifications
    existingVerifications
  );

  // Update verification data when parameters change (for already verified batches)
  React.useEffect(() => {
    if (isDisabled) {
      const initialData: Record<string, { result: string; remark: string }> =
        {};
      parameters.forEach((param) => {
        if (param.verificationResult) {
          initialData[param.id] = {
            result: param.verificationResult,
            remark: param.verificationRemark || '',
          };
        }
      });
      setVerificationData(initialData);
    }
  }, [parameters, isDisabled]);

  const handleResultChange = (parameterId: string, result: string) => {
    if (isDisabled) return;

    const current = verificationData[parameterId] || { result: '', remark: '' };
    const updated = { ...current, result };
    setVerificationData((prev) => ({ ...prev, [parameterId]: updated }));
    onUpdate(parameterId, result, updated.remark);
  };

  const handleRemarkChange = (parameterId: string, remark: string) => {
    if (isDisabled) return;

    const current = verificationData[parameterId] || { result: '', remark: '' };
    const updated = { ...current, remark };
    setVerificationData((prev) => ({ ...prev, [parameterId]: updated }));
    onUpdate(parameterId, current.result, remark);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
              <th className="text-left p-4 font-bold text-gray-900 border-r border-gray-200">
                <div className="flex items-center space-x-2">
                  <Target size={16} className="text-gray-600" />
                  <span>Parameter</span>
                </div>
              </th>
              <th className="text-left p-4 font-bold text-gray-900 border-r border-gray-200">
                <div className="flex items-center space-x-2">
                  <Star size={16} className="text-gray-600" />
                  <span>Standard Value</span>
                </div>
              </th>
              <th className="text-left p-4 font-bold text-gray-900 border-r border-gray-200">
                <div className="flex items-center space-x-2">
                  <Activity size={16} className="text-gray-600" />
                  <span>Unit</span>
                </div>
              </th>
              <th className="text-left p-4 font-bold text-gray-900 border-r border-gray-200">
                <div className="flex items-center space-x-2">
                  <Zap size={16} className="text-gray-600" />
                  <span>Test Result</span>
                </div>
              </th>
              <th className="text-left p-4 font-bold text-gray-900">
                <div className="flex items-center space-x-2">
                  <FileText size={16} className="text-gray-600" />
                  <span>Remarks</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {parameters.map((parameter, index) => (
              <motion.tr
                key={parameter.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/30 transition-all duration-200 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                }`}
              >
                <td className="p-4 border-r border-gray-100">
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">
                      {parameter.parameterName}
                    </p>
                    {parameter.parameterDescription && (
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {parameter.parameterDescription}
                      </p>
                    )}
                  </div>
                </td>

                <td className="p-4 border-r border-gray-100">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {parameter.standardDefinition?.standardValue ||
                        parameter.currentValue}
                    </span>
                  </div>
                </td>

                <td className="p-4 border-r border-gray-100">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg">
                    {parameter.standardDefinition?.unit?.symbol ||
                      parameter.currentUnit?.symbol ||
                      '-'}
                  </span>
                </td>

                <td className="p-4 border-r border-gray-100">
                  <motion.input
                    type="text"
                    placeholder={
                      isDisabled ? 'No result entered' : 'Enter test result...'
                    }
                    value={verificationData[parameter.id]?.result || ''}
                    onChange={(e) =>
                      handleResultChange(parameter.id, e.target.value)
                    }
                    disabled={isDisabled}
                    className={`w-full p-3 border-2 rounded-xl text-sm font-medium transition-all shadow-sm ${
                      isDisabled
                        ? 'bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed'
                        : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:shadow-md'
                    }`}
                    whileFocus={isDisabled ? {} : { scale: 1.02 }}
                  />
                </td>

                <td className="p-4">
                  <motion.input
                    type="text"
                    placeholder={isDisabled ? 'No remarks' : 'Add remarks...'}
                    value={verificationData[parameter.id]?.remark || ''}
                    onChange={(e) =>
                      handleRemarkChange(parameter.id, e.target.value)
                    }
                    disabled={isDisabled}
                    className={`w-full p-3 border-2 rounded-xl text-sm transition-all shadow-sm ${
                      isDisabled
                        ? 'bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed'
                        : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:shadow-md'
                    }`}
                    whileFocus={isDisabled ? {} : { scale: 1.02 }}
                  />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const BatchVerification: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'verified', 'not_verified'
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [parameterVerifications, setParameterVerifications] = useState<
    Record<string, { result: string; remark: string }>
  >({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const queryClient = useQueryClient();

  // Fetch batches for verification
  const {
    data: batchesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['batches-for-verification'],
    queryFn: async () => {
      const response = await api.get(
        API_ROUTES.BATCH.GET_BATCHES_FOR_VERIFICATION,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );
      return response.data;
    },
  });

  // Fetch batch parameters when a batch is selected
  const { data: parametersData, isLoading: parametersLoading } = useQuery({
    queryKey: ['batch-parameters-verification', selectedBatchId],
    queryFn: async () => {
      if (!selectedBatchId) return null;
      const response = await api.get(
        API_ROUTES.BATCH.GET_BATCH_PARAMETERS_FOR_VERIFICATION(selectedBatchId),
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );
      return response.data;
    },
    enabled: !!selectedBatchId,
  });

  // Update parameter verification mutation
  const updateParametersMutation = useMutation({
    mutationFn: async ({
      batchId,
      verifications,
    }: {
      batchId: string;
      verifications: any[];
    }) => {
      const response = await api.put(
        API_ROUTES.BATCH.UPDATE_PARAMETER_VERIFICATION(batchId),
        { parameterVerifications: verifications },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['batch-parameters-verification'],
      });
    },
  });

  // Complete batch verification mutation
  const completeBatchMutation = useMutation({
    mutationFn: async ({
      batchId,
      action,
      remarks,
    }: {
      batchId: string;
      action: 'APPROVE' | 'REJECT';
      remarks?: string;
    }) => {
      const response = await api.put(
        API_ROUTES.BATCH.COMPLETE_BATCH_VERIFICATION(batchId),
        { action, remarks },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches-for-verification'] });
      queryClient.invalidateQueries({
        queryKey: ['batch-parameters-verification'],
      });
      setSelectedBatchId(null);
      setParameterVerifications({});
    },
  });

  const batches: BatchForVerification[] = batchesData?.batches || [];

  // Updated filter logic
  const filteredBatches = batches.filter((batch) => {
    const matchesSearch =
      batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.product.name.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesStatus = true;
    if (filterStatus === 'verified') {
      matchesStatus =
        batch.status === 'APPROVED' || batch.status === 'REJECTED';
    } else if (filterStatus === 'not_verified') {
      matchesStatus = batch.status === 'SUBMITTED';
    }

    return matchesSearch && matchesStatus;
  });

  const handleParameterUpdate = (
    parameterId: string,
    result: string,
    remark: string
  ) => {
    setParameterVerifications((prev) => ({
      ...prev,
      [parameterId]: { result, remark },
    }));
  };

  const handleSaveVerifications = async () => {
    if (!selectedBatchId) return;

    const verifications = Object.entries(parameterVerifications)
      .filter(([, data]) => data.result.trim())
      .map(([parameterId, data]) => ({
        parameterValueId: parameterId,
        verificationResult: data.result,
        verificationRemark: data.remark,
      }));

    if (verifications.length === 0) {
      alert('Please enter at least one test result before saving.');
      return;
    }

    updateParametersMutation.mutate({
      batchId: selectedBatchId,
      verifications,
    });
  };

  const handleCompleteBatch = async (
    action: 'APPROVE' | 'REJECT',
    remarks?: string
  ) => {
    if (!selectedBatchId) return;

    await handleSaveVerifications();

    completeBatchMutation.mutate({
      batchId: selectedBatchId,
      action,
      remarks,
    });
  };

  const handleBackToList = () => {
    setSelectedBatchId(null);
    setParameterVerifications({});
    refetch();
  };

  const handleExportCOA = () => {
    if (!selectedBatchId || !parametersData) return;

    // Format parameters for export
    const parameters: {
      category: string;
      name: string;
      standardValue: string;
      unit: any;
      result: string;
      remark: string;
    }[] = [];

    // Process parameters by category
    Object.entries(parametersData.parametersByCategory).forEach(
      ([category, params]) => {
        (params as ParameterForVerification[]).forEach((param) => {
          parameters.push({
            category,
            name: param.parameterName,
            standardValue:
              param.standardDefinition?.standardValue || param.currentValue,
            unit:
              param.standardDefinition?.unit?.symbol ||
              param.currentUnit?.symbol ||
              '',
            result: param.verificationResult || '',
            remark: param.verificationRemark || '',
          });
        });
      }
    );

    // Create export data object
    const exportData = {
      batchNumber: parametersData.batch.batchNumber,
      productName: parametersData.batch.product.name,
      dateOfProduction: parametersData.batch.dateOfProduction,
      bestBeforeDate: parametersData.batch.bestBeforeDate || '',
      sampleAnalysisStarted: parametersData.batch.sampleAnalysisStarted || '',
      sampleAnalysisCompleted:
        parametersData.batch.sampleAnalysisCompleted || '',
      parameters,
    };

    exportToCertificateOfAnalysis(exportData);
  };

  // Helper function to determine if batch is verified
  const isBatchVerified = (batch: BatchForVerification) => {
    return batch.status === 'APPROVED' || batch.status === 'REJECTED';
  };

  // Get status counts for filters
  const getStatusCounts = () => {
    const counts = {
      all: batches.length,
      verified: batches.filter((b) => isBatchVerified(b)).length,
      not_verified: batches.filter((b) => b.status === 'SUBMITTED').length,
    };
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-2xl shadow-xl border border-red-200 max-w-md text-center"
        >
          <AlertTriangle size={48} className="mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Error Loading Batches
          </h3>
          <p className="text-gray-600 mb-4">
            Failed to load batches for verification
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => refetch()}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium"
          >
            Try Again
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Show details view if selected */}
        {selectedBatchId ? (
          <div>
            {parametersLoading ? (
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl shadow-lg p-8 animate-pulse"
                  >
                    <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="space-y-4">
                      {[...Array(4)].map((_, j) => (
                        <div key={j} className="h-16 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : parametersData ? (
              <div className="space-y-6">
                {/* Enhanced Batch Info */}
                <motion.div
                  variants={itemVariants}
                  className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
                >
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleBackToList}
                          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all shadow-sm text-sm"
                        >
                          <ArrowLeft size={14} className="text-gray-600" />
                          <span className="text-gray-700 font-medium">
                            Back
                          </span>
                        </motion.button>
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                          <Package className="text-white" size={18} />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-gray-900">
                            {parametersData.batch.batchNumber}
                          </h2>
                          <p className="text-gray-600 text-sm font-medium">
                            {parametersData.batch.product.name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 font-medium">
                          Total Parameters
                        </p>
                        <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                          {parametersData.totalParameters}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div className="flex items-center space-x-2 p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                        <Calendar className="text-green-600" size={16} />
                        <div>
                          <span className="text-gray-500 text-xs font-medium">
                            Production Date
                          </span>
                          <p className="font-semibold text-gray-900 text-sm">
                            {new Date(
                              parametersData.batch.dateOfProduction
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 p-3 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                        <Calendar className="text-orange-600" size={16} />
                        <div>
                          <span className="text-gray-500 text-xs font-medium">
                            Best Before Date
                          </span>
                          <p className="font-semibold text-gray-900 text-sm">
                            {parametersData.batch.bestBeforeDate
                              ? new Date(
                                  parametersData.batch.bestBeforeDate
                                ).toLocaleDateString()
                              : 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 p-3 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg border border-purple-200">
                        <User className="text-purple-600" size={16} />
                        <div>
                          <span className="text-gray-500 text-xs font-medium">
                            Maker
                          </span>
                          <p className="font-semibold text-gray-900 text-sm">
                            {parametersData.batch.maker.name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 p-3 bg-gradient-to-br from-cyan-50 to-teal-50 rounded-lg border border-cyan-200">
                        <Clock className="text-cyan-600" size={16} />
                        <div>
                          <span className="text-gray-500 text-xs font-medium">
                            Sample Analysis Started
                          </span>
                          <p className="font-semibold text-gray-900 text-sm">
                            {parametersData.batch.sampleAnalysisStarted
                              ? new Date(
                                  parametersData.batch.sampleAnalysisStarted
                                ).toLocaleDateString()
                              : 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 p-3 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg border border-indigo-200">
                        <CheckCircle className="text-indigo-600" size={16} />
                        <div>
                          <span className="text-gray-500 text-xs font-medium">
                            Sample Analysis Completed
                          </span>
                          <p className="font-semibold text-gray-900 text-sm">
                            {parametersData.batch.sampleAnalysisCompleted
                              ? new Date(
                                  parametersData.batch.sampleAnalysisCompleted
                                ).toLocaleDateString()
                              : 'In Progress'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <Activity className="text-blue-600" size={16} />
                        <div>
                          <span className="text-gray-500 text-xs font-medium">
                            Status
                          </span>
                          <div className="mt-0.5">
                            <StatusBadge
                              status={parametersData.batch.sampleAnalysisStatus}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    {(() => {
                      const selectedBatch = batches.find(
                        (b) => b.id === selectedBatchId
                      );
                      const isVerified =
                        selectedBatch && isBatchVerified(selectedBatch);

                      if (isVerified) {
                        return (
                          <div className="mt-4 flex justify-end">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={handleExportCOA}
                              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all"
                            >
                              <Download size={16} />
                              <span>Export Certificate of Analysis</span>
                            </motion.button>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </motion.div>

                {/* Show verification status if batch is verified */}
                {(() => {
                  const selectedBatch = batches.find(
                    (b) => b.id === selectedBatchId
                  );
                  const isVerified =
                    selectedBatch && isBatchVerified(selectedBatch);

                  if (isVerified) {
                    return (
                      <motion.div
                        variants={itemVariants}
                        className={`rounded-xl shadow-lg border overflow-hidden ${
                          selectedBatch?.status === 'APPROVED'
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="p-4">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`p-2 rounded-lg ${
                                selectedBatch?.status === 'APPROVED'
                                  ? 'bg-green-100'
                                  : 'bg-red-100'
                              }`}
                            >
                              {selectedBatch?.status === 'APPROVED' ? (
                                <CheckCircle
                                  className="text-green-600"
                                  size={20}
                                />
                              ) : (
                                <XCircle className="text-red-600" size={20} />
                              )}
                            </div>
                            <div>
                              <h3
                                className={`text-lg font-bold ${
                                  selectedBatch?.status === 'APPROVED'
                                    ? 'text-green-900'
                                    : 'text-red-900'
                                }`}
                              >
                                Batch{' '}
                                {selectedBatch?.status === 'APPROVED'
                                  ? 'Approved'
                                  : 'Rejected'}
                              </h3>
                              <p
                                className={`text-sm ${
                                  selectedBatch?.status === 'APPROVED'
                                    ? 'text-green-700'
                                    : 'text-red-700'
                                }`}
                              >
                                This batch has been{' '}
                                {selectedBatch?.status?.toLowerCase()} and
                                cannot be modified.
                                {selectedBatch?.rejectionRemarks && (
                                  <span className="block mt-1 font-medium">
                                    Reason: {selectedBatch.rejectionRemarks}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  }
                  return null;
                })()}

                {/* Enhanced Parameters by Category */}
                {Object.entries(parametersData.parametersByCategory).map(
                  ([category, parameters], categoryIndex) => {
                    const selectedBatch = batches.find(
                      (b) => b.id === selectedBatchId
                    );
                    const isVerified =
                      selectedBatch && isBatchVerified(selectedBatch);

                    return (
                      <motion.div
                        key={category}
                        variants={itemVariants}
                        transition={{ delay: categoryIndex * 0.1 }}
                        className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
                      >
                        <div className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                                <Beaker className="text-white" size={20} />
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-gray-900">
                                  {category}
                                </h3>
                                <p className="text-gray-600">
                                  {(parameters as any[]).length} parameters
                                  {isVerified ? ' (verified)' : ' to verify'}
                                </p>
                              </div>
                            </div>
                            <motion.div
                              className={`px-4 py-2 rounded-xl border font-bold ${
                                isVerified
                                  ? 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300'
                                  : 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-200'
                              }`}
                              whileHover={{ scale: 1.05 }}
                            >
                              <span className="font-bold">
                                {(parameters as any[]).length}
                              </span>
                              <span className="text-sm ml-1">tests</span>
                            </motion.div>
                          </div>
                        </div>

                        <div className="p-6">
                          <ParameterVerificationTable
                            parameters={
                              parameters as ParameterForVerification[]
                            }
                            onUpdate={handleParameterUpdate}
                            isDisabled={isVerified}
                          />
                        </div>
                      </motion.div>
                    );
                  }
                )}

                {/* Enhanced Action Buttons - Only show for non-verified batches */}
                {(() => {
                  const selectedBatch = batches.find(
                    (b) => b.id === selectedBatchId
                  );
                  const isVerified =
                    selectedBatch && isBatchVerified(selectedBatch);

                  if (!isVerified) {
                    return (
                      <motion.div
                        variants={itemVariants}
                        className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
                      >
                        <div className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
                          <div className="flex items-center space-x-3">
                            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
                              <Award className="text-white" size={20} />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">
                                Complete Verification
                              </h3>
                              <p className="text-gray-600">
                                Save test results and make final decision
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="p-6">
                          <div className="flex flex-wrap items-center justify-center gap-4">
                            <motion.button
                              onClick={handleSaveVerifications}
                              disabled={updateParametersMutation.isPending}
                              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl flex items-center gap-3 font-semibold text-lg"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Save size={20} />
                              Save Progress
                            </motion.button>

                            <motion.button
                              onClick={() => {
                                const remarks = prompt(
                                  'Enter rejection remarks:'
                                );
                                if (remarks)
                                  handleCompleteBatch('REJECT', remarks);
                              }}
                              disabled={completeBatchMutation.isPending}
                              className="px-8 py-4 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl flex items-center gap-3 font-semibold text-lg"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <X size={20} />
                              Reject Batch
                            </motion.button>

                            <motion.button
                              onClick={() => handleCompleteBatch('APPROVE')}
                              disabled={completeBatchMutation.isPending}
                              className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl flex items-center gap-3 font-semibold text-lg"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Check size={20} />
                              Approve Batch
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  }
                  return null;
                })()}
              </div>
            ) : null}
          </div>
        ) : (
          /* Main Container */
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
          >
            {/* Header Section */}
            <div className="relative bg-gradient-to-r from-blue-100 via-blue-300 to-blue-300 p-6 border-b border-gray-100">
              <div className="absolute top-0 right-0 -mt-2 -mr-2">
                <Sparkles size={60} className="text-blue-100 opacity-50" />
              </div>

              <div className="relative">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-3 lg:space-y-0">
                  <div>
                    <div className="flex items-center space-x-3 mb-1">
                      <div className="p-2 bg-blue-100 rounded-xl">
                        <Shield className="text-blue-600" size={20} />
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                          Batch Verification
                        </h1>
                        <p className="text-gray-600 text-sm mt-0.5">
                          Review and verify quality parameters for submitted
                          batches
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filters Section */}
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50/50 to-blue-50/50">
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-blue-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by batch number or product..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2.5 w-full border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 shadow-sm text-sm"
                  />
                </div>

                <div className="flex gap-2 shrink-0">
                  <motion.button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 transition-colors duration-200 shadow-sm text-sm"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Filter className="h-4 w-4 text-gray-600" />
                    <span className="text-gray-700">Filters</span>
                    <motion.div
                      animate={{ rotate: isFilterOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown size={14} className="text-gray-600" />
                    </motion.div>
                  </motion.button>

                  <motion.button
                    onClick={() => refetch()}
                    className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 transition-colors duration-200 shadow-sm text-sm"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <RefreshCw className="h-4 w-4 text-gray-600" />
                    <span className="text-gray-700">Refresh</span>
                  </motion.button>
                </div>
              </div>

              {/* Updated Filter Section */}
              <AnimatePresence>
                {isFilterOpen && (
                  <motion.div
                    className="overflow-hidden"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <div className="p-4 border border-gray-200 rounded-lg bg-white">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Verification Status
                          </label>
                          <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                          >
                            <option value="all">
                              All Batches ({statusCounts.all})
                            </option>
                            <option value="not_verified">
                              Not Verified ({statusCounts.not_verified})
                            </option>
                            <option value="verified">
                              Verified ({statusCounts.verified})
                            </option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2 justify-end">
                        <motion.button
                          onClick={() => {
                            setSearchTerm('');
                            setFilterStatus('all');
                          }}
                          className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center gap-2">
                            <RefreshCw size={14} />
                            <span>Clear</span>
                          </div>
                        </motion.button>
                        <motion.button
                          onClick={() => setIsFilterOpen(false)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md text-sm"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center gap-2">
                            <Filter size={14} />
                            <span>Apply</span>
                          </div>
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Table Section */}
            <div>
              {isLoading ? (
                <div className="flex justify-center items-center py-16">
                  <motion.div
                    animate={{
                      rotate: 360,
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      ease: 'linear',
                      repeat: Infinity,
                    }}
                    className="rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"
                  />
                </div>
              ) : filteredBatches.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="p-3 bg-blue-100 rounded-full inline-block mb-4">
                    <Shield size={36} className="text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No batches found
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto text-sm">
                    No batches are currently available for verification or match
                    your search criteria.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-50 to-blue-50">
                        <th
                          scope="col"
                          className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                        >
                          Batch Number
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                        >
                          Product
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                        >
                          Production Date
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                        >
                          Maker
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                        >
                          Verification Status
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                        >
                          Parameters
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredBatches.map(
                        (batch: BatchForVerification, index: number) => (
                          <motion.tr
                            key={batch.id}
                            className="hover:bg-gray-50 transition-colors duration-150"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {batch.batchNumber}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              <div>
                                <div className="font-medium">
                                  {batch.product.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {batch.product.code}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {formatDate(batch.dateOfProduction)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {batch.maker.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <StatusBadge status={batch.status} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              <div className="flex items-center">
                                <BarChart3
                                  size={14}
                                  className="mr-1 text-gray-400"
                                />
                                {batch.totalParameters} parameters
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <motion.button
                                onClick={() => setSelectedBatchId(batch.id)}
                                className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1 ml-auto ${
                                  isBatchVerified(batch)
                                    ? 'text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-100'
                                    : 'text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100'
                                }`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                title={
                                  isBatchVerified(batch)
                                    ? 'View Details'
                                    : 'Start Verification'
                                }
                              >
                                {isBatchVerified(batch) ? (
                                  <>
                                    <Eye className="h-4 w-4" />
                                    <span className="text-xs font-medium">
                                      View
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <Shield className="h-4 w-4" />
                                    <span className="text-xs font-medium">
                                      Verify
                                    </span>
                                  </>
                                )}
                              </motion.button>
                            </td>
                          </motion.tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default BatchVerification;
