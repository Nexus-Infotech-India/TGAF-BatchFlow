import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_ROUTES } from '../../../utils/api';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Download,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Calendar,
  Package,
  ChevronDown,
  RefreshCw,
  X,
  Beaker,
  FlaskConical,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  Target,
  Award,
  Star,
  Users,
  Activity,
  BarChart3,
  Gauge,
  Zap,
  Shield,
  Microscope,
  Edit2,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { generatePDF } from '../../../utils/exportPdf';
import { exportToCertificateOfAnalysis } from '../../../utils/export';

interface BatchFilter {
  batchNumber?: string;
  status?: string;
  productId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

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
  REJECTED: <XCircle className="w-4 h-4 mr-1" />,
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  return format(new Date(dateString), 'MMM dd, yyyy');
};

// Enhanced animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

const ParameterDetailsTable: React.FC<{
  parameters: any[];
  isVerified: boolean;
}> = ({ parameters, isVerified }) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-lg">
      {/* Verification Status Header */}
      <div
        className={`p-4 border-b border-gray-200 ${
          isVerified
            ? 'bg-gradient-to-r from-green-50 to-emerald-50'
            : 'bg-gradient-to-r from-yellow-50 to-amber-50'
        }`}
      >
        <div className="flex items-center space-x-3">
          <div
            className={`p-2 rounded-lg ${
              isVerified ? 'bg-green-100' : 'bg-yellow-100'
            }`}
          >
            {isVerified ? (
              <CheckCircle className="text-green-600" size={18} />
            ) : (
              <Clock className="text-yellow-600" size={18} />
            )}
          </div>
          <div>
            <h4
              className={`font-bold ${
                isVerified ? 'text-green-900' : 'text-yellow-900'
              }`}
            >
              {isVerified
                ? 'Verification Completed'
                : 'Verification Not Completed Yet'}
            </h4>
            <p
              className={`text-sm ${
                isVerified ? 'text-green-700' : 'text-yellow-700'
              }`}
            >
              {isVerified
                ? 'All parameters have been verified and test results are available'
                : 'Parameters are awaiting verification - test results will be shown once completed'}
            </p>
          </div>
        </div>
      </div>

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
            {parameters.map((parameter, index) => {
              // Check if this specific parameter has any value or verification data
              const hasValue = parameter.value && parameter.value.trim() !== '';
              const hasVerificationResult =
                parameter.verificationResult &&
                parameter.verificationResult.trim() !== '';
              const hasVerificationRemark =
                parameter.verificationRemark &&
                parameter.verificationRemark.trim() !== '';

              return (
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
                        {parameter.parameter?.name}
                      </p>
                      {parameter.parameter?.description && (
                        <p className="text-xs text-gray-500 leading-relaxed">
                          {parameter.parameter.description}
                        </p>
                      )}
                    </div>
                  </td>

                  <td className="p-4 border-r border-gray-100">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        {parameter.standardDefinition?.standardValue ||
                          parameter.value ||
                          'N/A'}
                      </span>
                    </div>
                  </td>

                  <td className="p-4 border-r border-gray-200">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg">
                      {parameter.standardDefinition?.unit?.symbol ||
                        parameter.unit?.symbol ||
                        '-'}
                    </span>
                  </td>

                  <td className="p-4 border-r border-gray-200">
                    <div
                      className={`p-3 rounded-xl text-sm font-medium ${
                        hasVerificationResult
                          ? 'bg-green-50 border border-green-200 text-green-900'
                          : hasValue
                            ? 'bg-yellow-50 border border-yellow-200 text-yellow-900'
                            : 'bg-gray-50 border border-gray-200 text-gray-500'
                      }`}
                    >
                      {hasVerificationResult
                        ? parameter.verificationResult
                        : hasValue
                          ? 'Awaiting verification'
                          : 'No test data'}
                    </div>
                  </td>

                  <td className="p-4">
                    <div
                      className={`p-3 rounded-xl text-sm ${
                        hasVerificationRemark
                          ? 'bg-blue-50 border border-blue-200 text-blue-900'
                          : hasValue
                            ? 'bg-yellow-50 border border-yellow-200 text-yellow-700'
                            : 'bg-gray-50 border border-gray-200 text-gray-500'
                      }`}
                    >
                      {hasVerificationRemark
                        ? parameter.verificationRemark
                        : hasValue
                          ? 'No remarks yet'
                          : 'No data available'}
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const BatchDetails = ({
  batch,
  onBack,
}: {
  batch: any;
  onBack: () => void;
}) => {
  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName.toLowerCase()) {
      case 'physical':
        return <Gauge className="text-blue-600" size={18} />;
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
      sampleAnalysisStarted: batch.createdAt, // Using creation date as analysis start
      sampleAnalysisCompleted: batch.updatedAt, // Using update date as analysis completion
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

export default function ViewBatches() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<BatchFilter>({
    page: 1,
    limit: 10,
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [products, setProducts] = useState<any[]>([]);

  const authToken = localStorage.getItem('authToken');

  // Fetch products for filter dropdown
  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      try {
        const response = await axios.get(API_ROUTES.PRODUCT.GET_PRODUCTS, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        return response.data?.products || [];
      } catch (error) {
        console.error('Error fetching products:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (productsQuery.data) {
      setProducts(productsQuery.data);
    }
  }, [productsQuery.data]);

  // TanStack Query hook to fetch batches
  const {
    data: batchesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['batches', filters],
    queryFn: async () => {
      const queryParams = new URLSearchParams();

      if (filters.batchNumber)
        queryParams.append('batchNumber', filters.batchNumber);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.productId) queryParams.append('productId', filters.productId);
      if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);
      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());

      // Update the query to use the new endpoint (around line 777)
      const response = await axios.get(
        `${API_ROUTES.BATCH.GET_BATCHES_WITH_DRAFTS}?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      return response.data;
    },
    refetchOnWindowFocus: false,
    enabled: !showDetails,
  });

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({
      ...prev,
      page,
    }));
  };

  const handleDeleteDraft = async (draftId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this draft? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      await axios.delete(API_ROUTES.DRAFT.DELETE_BATCH(draftId), {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      // Refetch to update the list
      refetch();
    } catch (error) {
      console.error('Error deleting draft:', error);
      alert('Failed to delete draft');
    }
  };

  const handleViewDetails = (batch: any) => {
    setSelectedBatch(batch);
    setShowDetails(true);
  };

  const handleBackToList = () => {
    setShowDetails(false);
    setSelectedBatch(null);
    // Trigger a refetch to ensure data is fresh
    refetch();
  };

  const handleExportToPDF = () => {
    if (!batchesData || !batchesData.batches) {
      return;
    }

    const detailedBatchData = batchesData.batches.map((batch: any) => {
      const parameterCategories: Record<string, any[]> = {};

      if (batch.parameterValuesByCategory) {
        Object.entries(batch.parameterValuesByCategory).forEach(
          ([categoryName, parameters]) => {
            parameterCategories[categoryName] = (parameters as any[]).map(
              (param) => ({
                name: param.parameter.name,
                value: param.value || 'N/A',
                unit: param.unit ? param.unit.symbol : '',
                methodology: param.methodology ? param.methodology.name : 'N/A',
              })
            );
          }
        );
      }

      const uniqueMethodologies = batch.parameterValuesByCategory
        ? Array.from(
            new Set(
              Object.values(batch.parameterValuesByCategory)
                .flat()
                .filter((param: any) => param.methodology)
                .map((param: any) => param.methodology.name)
            )
          )
        : [];

      const activities =
        batch.recentActivities && batch.recentActivities.length > 0
          ? batch.recentActivities.map((activity: any) => ({
              details: activity.details,
              by: activity.User?.name || 'System',
              date: formatDate(activity.createdAt),
            }))
          : [];

      return {
        batchNumber: batch.batchNumber,
        product: batch.productName,
        productionDate: formatDate(batch.dateOfProduction),
        bestBefore: formatDate(batch.bestBeforeDate),
        status: batch.status,
        createdBy: batch.maker?.name || 'N/A',
        checkedBy: batch.checker?.name || 'Not checked yet',
        analysisStatus: batch.sampleAnalysisStatus,
        createdAt: formatDate(batch.createdAt),
        updatedAt: formatDate(batch.updatedAt),
        parameterCategories,
        standards: batch.standards?.map((std: any) => std.name) || [],
        methodologies: uniqueMethodologies,
        activities,
      };
    });

    const appliedFilters: Record<string, string> = {};
    if (filters.batchNumber)
      appliedFilters['Batch Number'] = filters.batchNumber;
    if (filters.status) appliedFilters['Status'] = filters.status;
    if (filters.productId) {
      const productName = products.find(
        (p) => p.id === filters.productId
      )?.name;
      appliedFilters['Product'] = productName || filters.productId;
    }
    if (filters.dateFrom) appliedFilters['Date From'] = filters.dateFrom;
    if (filters.dateTo) appliedFilters['Date To'] = filters.dateTo;

    generatePDF({
      title: 'Detailed Batch Records Report',
      subtitle: 'Complete Analysis and Parameters',
      filename: `detailed_batch_records_${new Date().toISOString().split('T')[0]}`,
      data: detailedBatchData,
      orientation: 'portrait',
      filters: appliedFilters,
      footer: 'Confidential - Batchflow System',
      customSections: [
        {
          title: 'Export Information',
          content: `This report contains detailed information for ${detailedBatchData.length} batch records, including all parameter values, methodologies, and activities. Generated from the Batchflow management system on ${new Date().toLocaleDateString()}.`,
        },
      ],
      isDetailedBatchReport: true,
    });
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
    });
  };

  // Calculate stats
  const totalBatches = batchesData?.pagination?.totalCount || 0;
  const approvedBatches =
    batchesData?.batches?.filter((b: any) => b.status === 'APPROVED').length ||
    0;
  const pendingBatches =
    batchesData?.batches?.filter((b: any) => b.status === 'SUBMITTED').length ||
    0;
  const draftBatches =
    batchesData?.batches?.filter((b: any) => b.status === 'DRAFT').length || 0;

  // Show details view if selected
  if (showDetails && selectedBatch) {
    return (
      <motion.div
        className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-7xl mx-auto px-4 py-8">
          <BatchDetails batch={selectedBatch} onBack={handleBackToList} />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="min-h-screen "
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Main Container */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
        >
          {/* Header Section */}
          <div className="relative bg-gradient-to-r from-blue-500 via-blue-400 to-blue-300 p-6 border-b border-gray-100">
            <div className="absolute top-0 right-0 -mt-2 -mr-2">
              <Sparkles size={60} className="text-blue-100 opacity-50" />
            </div>

            <div className="relative">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-3 lg:space-y-0">
                <div>
                  <div className="flex items-center space-x-3 mb-1">
                    <div className="p-2 bg-blue-100 rounded-xl">
                      <Package className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">
                        Batch Management
                      </h1>
                      <p className="text-gray-600 text-sm mt-0.5">
                        View and manage all batch records with comprehensive
                        filtering and export options
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{
                      scale: 1.02,
                      boxShadow: '0 6px 20px rgba(59, 130, 246, 0.15)',
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/create-batch')}
                    className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center font-medium shadow-lg transition-all text-sm"
                  >
                    <Plus size={14} className="mr-2" />
                    New Batch
                  </motion.button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50/50 to-blue-50/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div
                whileHover={{ y: -2, scale: 1.02 }}
                className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-3">
                  <Package size={20} className="text-blue-200" />
                </div>
                <div className="relative">
                  <p className="text-xs font-medium text-gray-600 mb-1">
                    Total Batches
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalBatches}
                  </p>
                  <div className="flex items-center mt-1">
                    <TrendingUp size={10} className="text-blue-500 mr-1" />
                    <span className="text-xs text-blue-600 font-medium">
                      All records
                    </span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ y: -2, scale: 1.02 }}
                className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-3">
                  <CheckCircle size={20} className="text-green-200" />
                </div>
                <div className="relative">
                  <p className="text-xs font-medium text-gray-600 mb-1">
                    Approved
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {approvedBatches}
                  </p>
                  <div className="flex items-center mt-1">
                    <Award size={10} className="text-green-500 mr-1" />
                    <span className="text-xs text-green-600 font-medium">
                      Completed
                    </span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ y: -2, scale: 1.02 }}
                className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-3">
                  <Clock size={20} className="text-amber-200" />
                </div>
                <div className="relative">
                  <p className="text-xs font-medium text-gray-600 mb-1">
                    Pending
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {pendingBatches}
                  </p>
                  <div className="flex items-center mt-1">
                    <Target size={10} className="text-amber-500 mr-1" />
                    <span className="text-xs text-amber-600 font-medium">
                      In review
                    </span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ y: -2, scale: 1.02 }}
                className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-3">
                  <FileText size={20} className="text-purple-200" />
                </div>
                <div className="relative">
                  <p className="text-xs font-medium text-gray-600 mb-1">
                    Drafts
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {draftBatches}
                  </p>
                  <div className="flex items-center mt-1">
                    <Star size={10} className="text-purple-500 mr-1" />
                    <span className="text-xs text-purple-600 font-medium">
                      In progress
                    </span>
                  </div>
                </div>
              </motion.div>
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
                  placeholder="Search by batch number..."
                  value={filters.batchNumber || ''}
                  onChange={(e) =>
                    handleFilterChange('batchNumber', e.target.value)
                  }
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
                  onClick={handleExportToPDF}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 transition-colors duration-200 shadow-sm text-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Download className="h-4 w-4 text-gray-600" />
                  <span className="text-gray-700">Export</span>
                </motion.button>
              </div>
            </div>

            {/* Filter Section */}
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
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <select
                          value={filters.status || ''}
                          onChange={(e) =>
                            handleFilterChange('status', e.target.value)
                          }
                          className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                        >
                          <option value="">All Statuses</option>
                          <option value="DRAFT">Draft</option>
                          <option value="SUBMITTED">Submitted</option>
                          <option value="APPROVED">Approved</option>
                          <option value="REJECTED">Rejected</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Product
                        </label>
                        <select
                          value={filters.productId || ''}
                          onChange={(e) =>
                            handleFilterChange('productId', e.target.value)
                          }
                          className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                        >
                          <option value="">All Products</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Date From
                        </label>
                        <input
                          type="date"
                          value={filters.dateFrom || ''}
                          onChange={(e) =>
                            handleFilterChange('dateFrom', e.target.value)
                          }
                          className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Date To
                        </label>
                        <input
                          type="date"
                          value={filters.dateTo || ''}
                          onChange={(e) =>
                            handleFilterChange('dateTo', e.target.value)
                          }
                          className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2 justify-end">
                      <motion.button
                        onClick={clearFilters}
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
                        onClick={() => {
                          refetch();
                          setIsFilterOpen(false);
                        }}
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

            {/* Active Filters */}
            {(filters.status ||
              filters.productId ||
              filters.dateFrom ||
              filters.dateTo) && (
              <div className="flex flex-wrap gap-2 mt-4">
                {filters.status && (
                  <div className="flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs border border-blue-200">
                    Status: {filters.status}
                    <button
                      onClick={() => handleFilterChange('status', '')}
                      className="ml-2 hover:text-blue-900"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
                {filters.productId && (
                  <div className="flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs border border-blue-200">
                    Product:{' '}
                    {products.find((p) => p.id === filters.productId)?.name ||
                      filters.productId}
                    <button
                      onClick={() => handleFilterChange('productId', '')}
                      className="ml-2 hover:text-blue-900"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
                {filters.dateFrom && (
                  <div className="flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs border border-blue-200">
                    From: {filters.dateFrom}
                    <button
                      onClick={() => handleFilterChange('dateFrom', '')}
                      className="ml-2 hover:text-blue-900"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
                {filters.dateTo && (
                  <div className="flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs border border-blue-200">
                    To: {filters.dateTo}
                    <button
                      onClick={() => handleFilterChange('dateTo', '')}
                      className="ml-2 hover:text-blue-900"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            )}
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
            ) : error ? (
              <div className="p-12 text-center">
                <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  Error loading batches
                </h3>
                <p className="text-red-600">
                  {(error as any)?.message || 'Please try again later'}
                </p>
              </div>
            ) : batchesData?.batches?.length === 0 ? (
              <div className="p-12 text-center">
                <div className="p-3 bg-blue-100 rounded-full inline-block mb-4">
                  <Package size={36} className="text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No batches found
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto text-sm">
                  No batches match your current search criteria. Try adjusting
                  your filters or create a new batch.
                </p>
                <motion.button
                  onClick={() => navigate('/create-batch')}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center font-medium shadow-lg text-sm"
                  whileHover={{
                    scale: 1.02,
                    boxShadow: '0 6px 20px rgba(59, 130, 246, 0.15)',
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Plus size={14} className="mr-1" />
                  Create New Batch
                </motion.button>
              </div>
            ) : (
              <>
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
                          Best Before
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                        >
                          Status
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                        >
                          Created By
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
                      {batchesData.batches.map((batch: any, index: number) => (
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
                            {batch.productName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatDate(batch.dateOfProduction)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatDate(batch.bestBeforeDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <span
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                                  statusColors[
                                    batch.status as keyof typeof statusColors
                                  ]
                                }`}
                              >
                                {
                                  statusIcons[
                                    batch.status as keyof typeof statusIcons
                                  ]
                                }
                                {batch.status}
                              </span>
                              {/* {batch.isDraft && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
                                  Draft
                                </span>
                              )} */}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {batch.maker?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex space-x-2">
                              {batch.isDraft ? (
                                <>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() =>
                                      navigate(
                                        `/create-batch?draftId=${batch.id}` // Changed from /batches/add to /create-batch
                                      )
                                    }
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all border border-blue-200 text-sm font-medium"
                                  >
                                    <Edit2 size={14} />
                                    Continue Editing
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleDeleteDraft(batch.id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-all border border-red-200 text-sm font-medium"
                                  >
                                    <Trash2 size={14} />
                                    Delete
                                  </motion.button>
                                </>
                              ) : (
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleViewDetails(batch)}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg text-sm font-medium"
                                >
                                  <Eye size={16} />
                                  View Details
                                </motion.button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {batchesData.pagination &&
                  batchesData.pagination.totalPages > 1 && (
                    <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-100 flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Showing{' '}
                        <span className="font-medium">
                          {(batchesData.pagination.page - 1) *
                            batchesData.pagination.limit +
                            1}
                        </span>{' '}
                        to{' '}
                        <span className="font-medium">
                          {Math.min(
                            batchesData.pagination.page *
                              batchesData.pagination.limit,
                            batchesData.pagination.totalCount
                          )}
                        </span>{' '}
                        of{' '}
                        <span className="font-medium">
                          {batchesData.pagination.totalCount}
                        </span>{' '}
                        results
                      </div>
                      <div className="flex space-x-2">
                        <motion.button
                          onClick={() =>
                            handlePageChange(Math.max(1, filters.page! - 1))
                          }
                          disabled={filters.page === 1}
                          className={`p-2 rounded-md ${
                            filters.page === 1
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-gray-600 hover:bg-gray-200/50'
                          }`}
                          whileHover={filters.page !== 1 ? { scale: 1.1 } : {}}
                          whileTap={filters.page !== 1 ? { scale: 0.9 } : {}}
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </motion.button>

                        {Array.from(
                          { length: batchesData.pagination.totalPages },
                          (_, i) => i + 1
                        )
                          .filter((page) => {
                            const currentPage = filters.page || 1;
                            return (
                              page === 1 ||
                              page === batchesData.pagination.totalPages ||
                              Math.abs(page - currentPage) <= 1
                            );
                          })
                          .map((page, i, filteredPages) => {
                            const currentPage = filters.page || 1;

                            if (i > 0 && filteredPages[i - 1] !== page - 1) {
                              return (
                                <span
                                  key={`ellipsis-${page}`}
                                  className="px-3 py-1.5 text-gray-500"
                                >
                                  ...
                                </span>
                              );
                            }

                            return (
                              <motion.button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`px-3 py-1 rounded-md ${
                                  currentPage === page
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                transition={{
                                  type: 'spring',
                                  stiffness: 400,
                                  damping: 15,
                                }}
                              >
                                {page}
                              </motion.button>
                            );
                          })}

                        <motion.button
                          onClick={() =>
                            handlePageChange(
                              Math.min(
                                batchesData.pagination.totalPages,
                                filters.page! + 1
                              )
                            )
                          }
                          disabled={
                            filters.page === batchesData.pagination.totalPages
                          }
                          className={`p-2 rounded-md ${
                            filters.page === batchesData.pagination.totalPages
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-gray-600 hover:bg-gray-200/50'
                          }`}
                          whileHover={
                            filters.page !== batchesData.pagination.totalPages
                              ? { scale: 1.1 }
                              : {}
                          }
                          whileTap={
                            filters.page !== batchesData.pagination.totalPages
                              ? { scale: 0.9 }
                              : {}
                          }
                        >
                          <ChevronRight className="h-5 w-5" />
                        </motion.button>
                      </div>
                    </div>
                  )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
