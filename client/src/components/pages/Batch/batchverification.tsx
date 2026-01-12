import React, { useState } from 'react';
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
  Target,
  Star,
  ChevronDown,
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
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          icon: Clock,
          border: 'border-yellow-200',
        };
      case 'in_progress':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-800',
          icon: RefreshCw,
          border: 'border-blue-200',
        };
      case 'completed':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          icon: CheckCircle,
          border: 'border-green-200',
        };
      case 'submitted':
        return {
          bg: 'bg-purple-100',
          text: 'text-purple-800',
          icon: Clock,
          border: 'border-purple-200',
        };
      case 'approved':
        return {
          bg: 'bg-[#5317AA]',
          text: 'text-white',
          icon: CheckCircle,
          border: 'border-[#5317AA]',
        };
      case 'rejected':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          icon: XCircle,
          border: 'border-red-200',
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          icon: Clock,
          border: 'border-gray-200',
        };
    }
  };

  const config = getStatusConfig(status);
  const IconComponent = config.icon;

  return (
    <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border ${config.bg} ${config.text} ${config.border}`}>
      <IconComponent size={12} className="mr-1.5" />
      {status.replace('_', ' ').toUpperCase()}
    </div>
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
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white">
            <thead>
              <tr className="bg-[#5317AA] border-b border-gray-200">
                <th className="text-left p-4 font-bold text-white border-r border-gray-200">
                  <div className="flex items-center space-x-2">
                    <Target size={16} className="text-white" />
                    <span>Parameter</span>
                  </div>
                </th>
                <th className="text-left p-4 font-bold text-white border-r border-gray-200">
                  <div className="flex items-center space-x-2">
                    <Star size={16} className="text-white" />
                    <span>Standard Value</span>
                  </div>
                </th>
                <th className="text-left p-4 font-bold text-white border-r border-gray-200">
                  <div className="flex items-center space-x-2">
                    <Activity size={16} className="text-white" />
                    <span>Unit</span>
                  </div>
                </th>
                <th className="text-left p-4 font-bold text-white border-r border-gray-200">
                  <div className="flex items-center space-x-2">
                    <FileText size={16} className="text-white" />
                    <span>Test Result</span>
                  </div>
                </th>
                <th className="text-left p-4 font-bold text-white">
                  <div className="flex items-center space-x-2">
                    <FileText size={16} className="text-white" />
                    <span>Remarks</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {parameters.map((parameter, index) => (
                <tr
                  key={parameter.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
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
                      <span className="font-bold text-gray-900">
                        {parameter.standardDefinition?.standardValue ||
                          parameter.currentValue}
                      </span>
                    </div>
                  </td>

                  <td className="p-4 border-r border-gray-100">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded">
                      {parameter.standardDefinition?.unit?.symbol ||
                        parameter.currentUnit?.symbol ||
                        '-'}
                    </span>
                  </td>

                  <td className="p-4 border-r border-gray-100">
                    <input
                      type="text"
                      placeholder={
                        isDisabled ? 'No result entered' : 'Enter test result...'
                      }
                      value={verificationData[parameter.id]?.result || ''}
                      onChange={(e) =>
                        handleResultChange(parameter.id, e.target.value)
                      }
                      disabled={isDisabled}
                      className={`w-full p-2 border rounded text-sm ${isDisabled
                        ? 'bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed'
                        : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#5317AA] focus:border-[#5317AA] bg-white'
                        }`}
                    />
                  </td>

                  <td className="p-4">
                    <input
                      type="text"
                      placeholder={isDisabled ? 'No remarks' : 'Add remarks...'}
                      value={verificationData[parameter.id]?.remark || ''}
                      onChange={(e) =>
                        handleRemarkChange(parameter.id, e.target.value)
                      }
                      disabled={isDisabled}
                      className={`w-full p-2 border rounded text-sm ${isDisabled
                        ? 'bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed'
                        : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#5317AA] focus:border-[#5317AA] bg-white'
                        }`}
                    />
                  </td>
                </tr>
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg border border-red-200 max-w-md text-center">
          <AlertTriangle size={48} className="mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Error Loading Batches
          </h3>
          <p className="text-gray-600 mb-4">
            Failed to load batches for verification
          </p>
          <button
            onClick={() => refetch()}
            className="px-6 py-3 bg-[#5317AA] text-white rounded hover:bg-[#178EC8] transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Show details view if selected */}
        {selectedBatchId ? (
          <div>
            {parametersLoading ? (
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-lg p-8 animate-pulse"
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
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="p-4 bg-[#5317AA] border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={handleBackToList}
                          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors text-sm"
                        >
                          <ArrowLeft size={14} className="text-gray-600" />
                          <span className="text-gray-700 font-medium">
                            Back
                          </span>
                        </button>
                        <div className="p-2 bg-white rounded">
                          <Package className="text-[#5317AA]" size={18} />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-white">
                            {parametersData.batch.batchNumber}
                          </h2>
                          <p className="text-gray-200 text-sm font-medium">
                            {parametersData.batch.product.name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-200 font-medium">
                          Total Parameters
                        </p>
                        <p className="text-2xl font-bold text-white">
                          {parametersData.totalParameters}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div className="flex items-center space-x-2 p-3 bg-green-50 rounded border border-green-200">
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

                      <div className="flex items-center space-x-2 p-3 bg-orange-50 rounded border border-orange-200">
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

                      <div className="flex items-center space-x-2 p-3 bg-purple-50 rounded border border-purple-200">
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

                      <div className="flex items-center space-x-2 p-3 bg-cyan-50 rounded border border-cyan-200">
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

                      <div className="flex items-center space-x-2 p-3 bg-indigo-50 rounded border border-indigo-200">
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

                      <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded border border-blue-200">
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
                            <button
                              onClick={handleExportCOA}
                              className="flex items-center gap-2 px-4 py-2 bg-[#178EC8] text-white rounded hover:bg-[#5317AA] transition-colors"
                            >
                              <Download size={16} />
                              <span>Export Certificate of Analysis</span>
                            </button>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>

                {/* Show verification status if batch is verified */}
                {(() => {
                  const selectedBatch = batches.find(
                    (b) => b.id === selectedBatchId
                  );
                  const isVerified =
                    selectedBatch && isBatchVerified(selectedBatch);

                  if (isVerified) {
                    return (
                      <div className={`rounded border overflow-hidden ${selectedBatch?.status === 'APPROVED'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                        }`}>
                        <div className="p-4">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`p-2 rounded ${selectedBatch?.status === 'APPROVED'
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
                                className={`text-lg font-bold ${selectedBatch?.status === 'APPROVED'
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
                                className={`text-sm ${selectedBatch?.status === 'APPROVED'
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
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Enhanced Parameters by Category */}
                {Object.entries(parametersData.parametersByCategory).map(
                  ([category, parameters]) => {
                    const selectedBatch = batches.find(
                      (b) => b.id === selectedBatchId
                    );
                    const isVerified =
                      selectedBatch && isBatchVerified(selectedBatch);

                    return (
                      <div
                        key={category}
                        className="bg-white rounded border border-gray-200 overflow-hidden"
                      >
                        <div className="p-6 bg-[#5317AA] border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="p-3 bg-white rounded">
                                <Beaker className="text-[#5317AA]" size={20} />
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-white">
                                  {category}
                                </h3>
                                <p className="text-gray-200">
                                  {(parameters as any[]).length} parameters
                                  {isVerified ? ' (verified)' : ' to verify'}
                                </p>
                              </div>
                            </div>
                            <div className={`px-4 py-2 rounded border font-bold ${isVerified
                              ? 'bg-white text-gray-800 border-gray-300'
                              : 'bg-[#178EC8] text-white border-[#178EC8]'
                              }`}>
                              <span className="font-bold">
                                {(parameters as any[]).length}
                              </span>
                              <span className="text-sm ml-1">tests</span>
                            </div>
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
                      </div>
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
                      <div className="bg-white rounded border border-gray-200 overflow-hidden">
                        <div className="p-6 bg-[#5317AA] border-b border-gray-200">
                          <div className="flex items-center space-x-3">
                            <div className="p-3 bg-white rounded">
                              <Award className="text-[#5317AA]" size={20} />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-white">
                                Complete Verification
                              </h3>
                              <p className="text-gray-200">
                                Save test results and make final decision
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="p-6">
                          <div className="flex flex-wrap items-center justify-center gap-4">
                            <button
                              onClick={handleSaveVerifications}
                              disabled={updateParametersMutation.isPending}
                              className="px-8 py-4 bg-[#178EC8] text-white rounded hover:bg-[#5317AA] disabled:opacity-50 transition-colors flex items-center gap-3 font-semibold text-lg"
                            >
                              <Save size={20} />
                              Save Progress
                            </button>

                            <button
                              onClick={() => {
                                const remarks = prompt(
                                  'Enter rejection remarks:'
                                );
                                if (remarks)
                                  handleCompleteBatch('REJECT', remarks);
                              }}
                              disabled={completeBatchMutation.isPending}
                              className="px-8 py-4 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-3 font-semibold text-lg"
                            >
                              <X size={20} />
                              Reject Batch
                            </button>

                            <button
                              onClick={() => handleCompleteBatch('APPROVE')}
                              disabled={completeBatchMutation.isPending}
                              className="px-8 py-4 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-3 font-semibold text-lg"
                            >
                              <Check size={20} />
                              Approve Batch
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            ) : null}
          </div>
        ) : (
          /* Main Container */
          <div className="bg-white rounded border border-gray-200 overflow-hidden">
            {/* Header Section */}
            <div className="bg-[#5317AA] p-6 border-b border-gray-200">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-3 lg:space-y-0">
                <div>
                  <div className="flex items-center space-x-3 mb-1">
                    <div className="p-2 bg-white rounded">
                      <Shield className="text-[#5317AA]" size={20} />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-white">
                        Batch Verification
                      </h1>
                      <p className="text-gray-200 text-sm mt-0.5">
                        Review and verify quality parameters for submitted
                        batches
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filters Section */}
            <div className="p-6 border-b border-gray-100 bg-gray-50">
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-[#5317AA]" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by batch number or product..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2.5 w-full border border-gray-200 rounded focus:ring-2 focus:ring-[#5317AA] focus:border-[#5317AA] outline-none transition-colors shadow-sm text-sm"
                  />
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white rounded hover:bg-gray-50 transition-colors text-sm"
                  >
                    <Filter className="h-4 w-4 text-gray-600" />
                    <span className="text-gray-700">Filters</span>
                    <ChevronDown size={14} className="text-gray-600" />
                  </button>

                  <button
                    onClick={() => refetch()}
                    className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white rounded hover:bg-gray-50 transition-colors text-sm"
                  >
                    <RefreshCw className="h-4 w-4 text-gray-600" />
                    <span className="text-gray-700">Refresh</span>
                  </button>
                </div>
              </div>

              {/* Updated Filter Section */}
              {isFilterOpen && (
                <div className="p-4 border border-gray-200 rounded bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Verification Status
                      </label>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full p-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#5317AA] focus:border-[#5317AA] outline-none text-sm"
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
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setFilterStatus('all');
                      }}
                      className="px-4 py-2 border border-gray-200 text-gray-700 rounded hover:bg-gray-50 transition-colors text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <RefreshCw size={14} />
                        <span>Clear</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setIsFilterOpen(false)}
                      className="px-4 py-2 bg-[#5317AA] text-white rounded hover:bg-[#178EC8] transition-colors text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Filter size={14} />
                        <span>Apply</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Table Section */}
            <div>
              {isLoading ? (
                <div className="flex justify-center items-center py-16">
                  <div className="rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#5317AA] animate-spin" />
                </div>
              ) : filteredBatches.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="p-3 bg-[#5317AA] rounded inline-block mb-4">
                    <Shield size={36} className="text-white" />
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
                      <tr className="bg-[#5317AA]">
                        <th
                          scope="col"
                          className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider"
                        >
                          Batch Number
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider"
                        >
                          Product
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider"
                        >
                          Production Date
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider"
                        >
                          Maker
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider"
                        >
                          Verification Status
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider"
                        >
                          Parameters
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-right text-xs font-semibold text-white uppercase tracking-wider"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredBatches.map(
                        (batch: BatchForVerification) => (
                          <tr
                            key={batch.id}
                            className="hover:bg-gray-50 transition-colors"
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
                              <button
                                onClick={() => setSelectedBatchId(batch.id)}
                                className={`px-3 py-2 rounded transition-colors flex items-center gap-1 ml-auto ${isBatchVerified(batch)
                                  ? 'text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-100'
                                  : 'text-[#5317AA] hover:text-[#178EC8] bg-[#5317AA]/10 hover:bg-[#178EC8]/10'
                                  }`}
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
                              </button>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchVerification;
