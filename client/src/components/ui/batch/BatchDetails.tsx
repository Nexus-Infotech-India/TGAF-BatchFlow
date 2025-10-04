import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowLeft,
  Download,
  Package,
  Calendar,
  Clock,
  CheckCircle,
  Users,
  Award,
  Shield,
  BarChart3,
  Star,
  Activity,
  FileText,
  Beaker,
  FlaskConical,
  Microscope,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import ParameterDetailsTable from './ParameterDetails';
import { exportToCertificateOfAnalysis } from '../../../utils/export';

const statusColors = {
  DRAFT: 'bg-blue-50 text-blue-700 border-blue-200',
  SUBMITTED: 'bg-purple-50 text-purple-700 border-purple-200',
  APPROVED: 'bg-green-50 text-green-700 border-green-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
};

const statusIcons = {
  DRAFT: <Clock className="w-4 h-4 mr-1" />,
  SUBMITTED: <FileText className="w-4 h-4 mr-1" />,
  APPROVED: <CheckCircle className="w-4 h-4 mr-1" />,
  REJECTED: <AlertTriangle className="w-4 h-4 mr-1" />,
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  return format(new Date(dateString), 'MMM dd, yyyy');
};

const getCategoryIcon = (categoryName: string) => {
  switch (categoryName.toLowerCase()) {
    case 'physical':
      return <BarChart3 className="text-blue-600" size={18} />;
    case 'chemical':
      return <Beaker className="text-emerald-600" size={18} />;
    case 'microbiological':
      return <Microscope className="text-purple-600" size={18} />;
    case 'nutritional':
      return <Shield className="text-amber-600" size={18} />;
    case 'sensory':
      return <Star className="text-pink-600" size={18} />;
    case 'safety':
      return <AlertTriangle className="text-red-600" size={18} />;
    default:
      return <FlaskConical className="text-gray-600" size={18} />;
  }
};

const getCategoryGradient = (categoryName: string) => {
  switch (categoryName.toLowerCase()) {
    case 'physical':
      return 'from-blue-50 to-blue-100 border-blue-200';
    case 'chemical':
      return 'from-emerald-50 to-emerald-100 border-emerald-200';
    case 'microbiological':
      return 'from-purple-50 to-purple-100 border-purple-200';
    case 'nutritional':
      return 'from-amber-50 to-amber-100 border-amber-200';
    case 'sensory':
      return 'from-pink-50 to-pink-100 border-pink-200';
    case 'safety':
      return 'from-red-50 to-red-100 border-red-200';
    default:
      return 'from-gray-50 to-gray-100 border-gray-200';
  }
};

const BatchDetails = ({
  batch,
  onBack,
}: {
  batch: any;
  onBack: () => void;
}) => {
  const handleExportToCOA = async () => {
    if (!batch.parameterValuesByCategory) {
      alert('No parameter data available for export');
      return;
    }

    // Transform batch data to match COA export format
    const parameters: any[] = [];

    Object.entries(
      batch.parameterValuesByCategory as Record<string, any[]>
    ).forEach(([category, params]) => {
      (params as any[]).forEach((param) => {
        const hasValue = param.value && param.value.trim() !== '';
        const hasVerificationResult =
          param.verificationResult && param.verificationResult.trim() !== '';

        parameters.push({
          category: category,
          name: param.parameter?.name || 'Unknown Parameter',
          standardValue:
            param.standardDefinition?.standardValue || param.value || 'N/A',
          unit:
            param.standardDefinition?.unit?.symbol || param.unit?.symbol || '',
          result: hasVerificationResult
            ? param.verificationResult
            : hasValue
              ? param.value
              : 'No test data',
          remark:
            param.verificationRemark ||
            (hasValue ? 'No remarks' : 'No data available'),
        });
      });
    });

    const coaData = {
      batchNumber: batch.batchNumber,
      productName: batch.productName,
      dateOfProduction: batch.dateOfProduction,
      bestBeforeDate: batch.bestBeforeDate,
      sampleAnalysisStarted: batch.createdAt,
      sampleAnalysisCompleted: batch.updatedAt,
      parameters: parameters,
      customerInfo: {
        name: 'Unilever Nigeria Plc',
        address: '20, Agbara Industrial Estate road Wing B, Agbara, Nigeria',
      },
    };

    try {
      await exportToCertificateOfAnalysis(coaData);
    } catch (error) {
      console.error('Error exporting COA:', error);
      alert('Failed to export Certificate of Analysis');
    }
  };

  // Check if batch is verified (APPROVED or REJECTED status)
  const isVerified = batch.status === 'APPROVED' || batch.status === 'REJECTED';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="min-h-screen  py-6"
    >
      <div className="max-w-7xl mx-auto px-4 space-y-6">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
        >
          <div className="relative bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-6 border-b border-gray-100">
            <div className="absolute top-0 right-0 -mt-3 -mr-3 opacity-10">
              <Sparkles size={80} className="text-blue-600" />
            </div>

            <div className="relative">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex items-center gap-3">
                  <motion.button
                    whileHover={{
                      scale: 1.02,
                      boxShadow: '0 6px 20px rgba(59, 130, 246, 0.15)',
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-md font-medium text-sm"
                  >
                    <ArrowLeft size={16} className="text-gray-600" />
                    <span className="text-gray-700">Back to Batch List</span>
                  </motion.button>

                  {/* New Export to COA Button */}
                  <motion.button
                    whileHover={{
                      scale: 1.02,
                      boxShadow: '0 6px 20px rgba(34, 197, 94, 0.15)',
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleExportToCOA}
                    disabled={!isVerified}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all shadow-md font-medium text-sm ${
                      isVerified
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Download size={16} />
                    <span>Export COA</span>
                  </motion.button>
                </div>

                <div
                  className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold border shadow-md ${statusColors[batch.status as keyof typeof statusColors]}`}
                >
                  {statusIcons[batch.status as keyof typeof statusIcons]}
                  {batch.status}
                </div>
              </div>

              {/* Rest of the header content remains the same */}
              <div className="mt-6 flex flex-col lg:flex-row items-start lg:items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl shadow-md">
                  <Package className="text-blue-600" size={24} />
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Batch #{batch.batchNumber}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 text-gray-600">
                    <span className="flex items-center gap-2 bg-white/70 px-3 py-1.5 rounded-lg border border-gray-200 text-sm">
                      <Package size={14} />
                      {batch.productName}
                    </span>
                    <span className="flex items-center gap-2 bg-white/70 px-3 py-1.5 rounded-lg border border-gray-200 text-sm">
                      <Calendar size={14} />
                      Production: {formatDate(batch.dateOfProduction)}
                    </span>
                    <span className="flex items-center gap-2 bg-white/70 px-3 py-1.5 rounded-lg border border-gray-200 text-sm">
                      <Clock size={14} />
                      Best Before: {formatDate(batch.bestBeforeDate)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Key Metrics Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <motion.div
            whileHover={{
              y: -2,
              scale: 1.02,
              boxShadow: '0 12px 24px rgba(59, 130, 246, 0.1)',
            }}
            className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg p-4 border border-blue-200 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-3 opacity-20">
              <Package size={24} />
            </div>
            <div className="relative">
              <p className="text-xs font-bold text-blue-700 mb-1">
                Batch Number
              </p>
              <p className="text-2xl font-bold text-blue-900 mb-1">
                {batch.batchNumber}
              </p>
              <div className="flex items-center">
                <Activity size={10} className="text-blue-600 mr-1" />
                <span className="text-xs text-blue-700 font-medium">
                  Active Batch
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{
              y: -2,
              scale: 1.02,
              boxShadow: '0 12px 24px rgba(16, 185, 129, 0.1)',
            }}
            className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl shadow-lg p-4 border border-emerald-200 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-3 opacity-20">
              <Users size={24} />
            </div>
            <div className="relative">
              <p className="text-xs font-bold text-emerald-700 mb-1">
                Created By
              </p>
              <p className="text-xl font-bold text-emerald-900 mb-1">
                {batch.maker?.name || 'N/A'}
              </p>
              <div className="flex items-center">
                <Award size={10} className="text-emerald-600 mr-1" />
                <span className="text-xs text-emerald-700 font-medium">
                  Batch Maker
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{
              y: -2,
              scale: 1.02,
              boxShadow: '0 12px 24px rgba(139, 92, 246, 0.1)',
            }}
            className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg p-4 border border-purple-200 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-3 opacity-20">
              <CheckCircle size={24} />
            </div>
            <div className="relative">
              <p className="text-xs font-bold text-purple-700 mb-1">
                Verified By
              </p>
              <p className="text-xl font-bold text-purple-900 mb-1">
                {batch.checker?.name || 'Pending'}
              </p>
              <div className="flex items-center">
                <Shield size={10} className="text-purple-600 mr-1" />
                <span className="text-xs text-purple-700 font-medium">
                  Quality Check
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{
              y: -2,
              scale: 1.02,
              boxShadow: '0 12px 24px rgba(245, 158, 11, 0.1)',
            }}
            className={`bg-gradient-to-br rounded-xl shadow-lg p-4 border relative overflow-hidden ${
              isVerified
                ? 'from-green-50 to-green-100 border-green-200'
                : 'from-amber-50 to-amber-100 border-amber-200'
            }`}
          >
            <div className="absolute top-0 right-0 p-3 opacity-20">
              <BarChart3 size={24} />
            </div>
            <div className="relative">
              <p
                className={`text-xs font-bold mb-1 ${isVerified ? 'text-green-700' : 'text-amber-700'}`}
              >
                Verification Status
              </p>
              <p
                className={`text-xl font-bold mb-1 ${isVerified ? 'text-green-900' : 'text-amber-900'}`}
              >
                {isVerified ? 'Completed' : 'Pending'}
              </p>
              <div className="flex items-center">
                <Star
                  size={10}
                  className={`mr-1 ${isVerified ? 'text-green-600' : 'text-amber-600'}`}
                />
                <span
                  className={`text-xs font-medium ${isVerified ? 'text-green-700' : 'text-amber-700'}`}
                >
                  {isVerified ? 'All tests verified' : 'Awaiting verification'}
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Batch Information Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
                <FileText className="text-white" size={18} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Batch Information
                </h2>
                <p className="text-gray-600 text-sm">
                  Complete details and specifications
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200 shadow-md"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Package size={16} className="text-blue-600" />
                    <h3 className="text-base font-bold text-blue-900">
                      Product Details
                    </h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-700 font-medium text-sm">
                        Product Name:
                      </span>
                      <span className="text-blue-900 font-bold text-sm">
                        {batch.productName}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-700 font-medium text-sm">
                        Analysis Status:
                      </span>
                      <span className="text-blue-900 font-bold text-sm">
                        {batch.sampleAnalysisStatus || 'N/A'}
                      </span>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200 shadow-md"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar size={16} className="text-emerald-600" />
                    <h3 className="text-base font-bold text-emerald-900">
                      Production Timeline
                    </h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-emerald-700 font-medium text-sm">
                        Production Date:
                      </span>
                      <span className="text-emerald-900 font-bold text-sm">
                        {formatDate(batch.dateOfProduction)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-emerald-700 font-medium text-sm">
                        Best Before Date:
                      </span>
                      <span className="text-emerald-900 font-bold text-sm">
                        {formatDate(batch.bestBeforeDate)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="space-y-4">
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200 shadow-md"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Users size={16} className="text-purple-600" />
                    <h3 className="text-base font-bold text-purple-900">
                      Personnel Information
                    </h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-purple-700 font-medium text-sm">
                        Created By:
                      </span>
                      <span className="text-purple-900 font-bold text-sm">
                        {batch.maker?.name || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-purple-700 font-medium text-sm">
                        Checked By:
                      </span>
                      <span className="text-purple-900 font-bold text-sm">
                        {batch.checker?.name || 'Not checked yet'}
                      </span>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200 shadow-md"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Clock size={16} className="text-amber-600" />
                    <h3 className="text-base font-bold text-amber-900">
                      System Information
                    </h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-amber-700 font-medium text-sm">
                        Created Date:
                      </span>
                      <span className="text-amber-900 font-bold text-sm">
                        {formatDate(batch.createdAt)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-amber-700 font-medium text-sm">
                        Last Updated:
                      </span>
                      <span className="text-amber-900 font-bold text-sm">
                        {formatDate(batch.updatedAt)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quality Parameters Section */}
        {batch.parameterValuesByCategory &&
          Object.keys(batch.parameterValuesByCategory).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Quality Parameters Analysis
                </h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Comprehensive testing results and verification status for all
                  quality parameters
                </p>
              </div>

              {Object.entries(
                batch.parameterValuesByCategory as Record<string, any[]>
              ).map(([categoryName, parameters], index) => (
                <motion.div
                  key={categoryName}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                  className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
                >
                  <div
                    className={`p-6 bg-gradient-to-r ${getCategoryGradient(categoryName)} border-b border-gray-200`}
                  >
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-xl shadow-md">
                          {getCategoryIcon(categoryName)}
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-1">
                            {categoryName} Parameters
                          </h3>
                          <p className="text-gray-700">
                            {parameters.length} parameter
                            {parameters.length !== 1 ? 's' : ''} tested
                            {isVerified
                              ? ' • Verification completed'
                              : ' • Awaiting verification'}
                          </p>
                        </div>
                      </div>

                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className={`px-4 py-2 rounded-xl border-2 font-bold shadow-md ${
                          isVerified
                            ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300'
                            : 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isVerified ? (
                            <CheckCircle size={16} />
                          ) : (
                            <Clock size={16} />
                          )}
                          <span className="font-bold">{parameters.length}</span>
                          <span className="text-sm">
                            test{parameters.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  <div className="p-6">
                    <ParameterDetailsTable
                      parameters={parameters}
                      isVerified={isVerified}
                    />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

        {/* Recent Activities Section */}
        {batch.recentActivities && batch.recentActivities.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg shadow-md">
                  <Activity className="text-white" size={18} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Recent Activities
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Track all changes and updates to this batch
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-3">
                {batch.recentActivities.map((activity: any, index: number) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{
                      x: 4,
                      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)',
                    }}
                    className="bg-gradient-to-r from-white to-purple-50 rounded-xl p-4 border border-gray-200 shadow-md"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center shadow-md">
                        <Clock size={16} className="text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 mb-1">
                          {activity.details}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                          <span className="flex items-center gap-1 bg-white/70 px-2 py-1 rounded-lg border border-gray-200">
                            <Users size={12} />
                            {activity.User?.name}
                          </span>
                          <span className="flex items-center gap-1 bg-white/70 px-2 py-1 rounded-lg border border-gray-200">
                            <Calendar size={12} />
                            {formatDate(activity.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default BatchDetails;
