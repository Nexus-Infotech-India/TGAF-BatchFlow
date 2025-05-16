import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api, { API_ROUTES } from '../../../utils/api';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Download,
  ArrowLeft,
  Shield,
  Tag,
  Clock,
  Package,
  Calendar,
  BarChart2,
  Layers,
  PieChart,
  Wrench,
  MessageSquare,
  ThumbsUp
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import generatePDF from '../../../utils/exportPdf';
import { toast } from 'react-toastify';

interface CertificateProps {
  batchId: string;
  onBack: () => void;
}

const CertificateOfAnalysis: React.FC<CertificateProps> = ({ batchId, onBack }) => {
  const [remarks, setRemarks] = useState('');
  const [reviewStatus, setReviewStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  
  // Fetch certificate data 
  const {
    data: certificateData,
    isLoading: isCertificateLoading,
    isError: isCertificateError,
    refetch
  } = useQuery({
    queryKey: ['certificate', batchId],
    queryFn: async () => {
      if (!batchId) return null;
      
      const authToken = localStorage.getItem('authToken');
      const response = await api.get(
        API_ROUTES.BATCH.GENERATE_CERTIFICATE(batchId),
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );
      
      return response.data.certificate;
    },
    enabled: !!batchId
  });


  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async () => {
      const authToken = localStorage.getItem('authToken');
      return await api.put(
        API_ROUTES.BATCH.APPROVE_BATCH(batchId),
        { remarks },
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );
    },
    onSuccess: () => {
      toast.success('Certificate approved successfully');
      setReviewStatus('approved');
      refetch();
    },
    onError: (error) => {
      console.error('Approve error:', error);
      toast.error('Failed to approve certificate');
    }
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async () => {
      const authToken = localStorage.getItem('authToken');
      return await api.put(
        API_ROUTES.BATCH.REJECT_BATCH(batchId),
        { rejectionRemarks: remarks },
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );
    },
    onSuccess: () => {
      toast.success('Certificate rejected');
      setReviewStatus('rejected');
      refetch();
    },
    onError: (error) => {
      console.error('Reject error:', error);
      toast.error('Failed to reject certificate');
    }
  });

  

  const handleApprove = () => {
    if (!remarks.trim()) {
      toast.warning('Please add remarks before approving');
      return;
    }
    approveMutation.mutate();
  };

  const handleReject = () => {
    if (!remarks.trim()) {
      toast.warning('Please add remarks before rejecting');
      return;
    }
    rejectMutation.mutate();
  };

  const handleExportCertificate = () => {
    if (!certificateData) {
      toast.error('No certificate data available to export');
      return;
    }

    try {
      const parametersArray: any[] = [];
      
      Object.keys(certificateData.parameters).forEach(category => {
        certificateData.parameters[category].forEach((param: any) => {
          parametersArray.push({
            category,
            parameterName: param.parameterName,
            standardValue: param.standardValue,
            actualValue: param.actualValue,
            standardUnit: param.standardUnit || '-',
            testMethodology: param.testMethodology || '-',
            compliance: param.complianceStatus === 'COMPLIANT' ? '✓' : 
                       param.complianceStatus === 'NON_COMPLIANT' ? '✗' : '-'
          });
        });
      });
      
      generatePDF({
        title: `Certificate of Analysis - ${certificateData.certificateNumber}`,
        subtitle: `Batch: ${certificateData.product.batchNumber} | Product: ${certificateData.product.name}`,
        filename: `certificate_${certificateData.product.batchNumber}`,
        data: parametersArray,
        columns: ['category', 'parameterName', 'standardValue', 'actualValue', 'standardUnit', 'testMethodology', 'compliance'],
        footer: `Approved by: ${certificateData.approvedBy} | Tested by: ${certificateData.testedBy}`,
        customSections: [
          {
            title: 'Product Information',
            content: `Date of Production: ${format(new Date(certificateData.product.dateOfProduction), 'dd-MM-yyyy')}\nBest Before: ${format(new Date(certificateData.product.bestBeforeDate), 'dd-MM-yyyy')}`
          },
          {
            title: 'Compliance Summary',
            content: `Compliant Parameters: ${certificateData.complianceSummary.compliantParameters}/${certificateData.complianceSummary.totalParameters}`
          }
        ]
      });
      
      toast.success('Certificate exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export certificate');
    }
  };

  return (
    <motion.div 
      className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-6 min-h-scr" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.4 }}
    >
      {/* Header with back button */}
      <div className="flex justify-between items-center mb-8">
        <motion.button 
          onClick={onBack}
          className="flex items-center text-blue-700 hover:text-blue-800 transition-colors group"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <ArrowLeft className="h-5 w-5 mr-2 transition-transform group-hover:translate-x-[-2px]" />
          <span className="font-medium">Back to Batches</span>
        </motion.button>
        
        <motion.button
          onClick={handleExportCertificate}
          disabled={isCertificateLoading || !certificateData}
          className="flex items-center px-4 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all group"
          whileHover={{ scale: 1.03, boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)" }}
          whileTap={{ scale: 0.97 }}
        >
          <Download className="h-4 w-4 mr-2 transition-transform group-hover:translate-y-[1px]" />
          Export Certificate
        </motion.button>
      </div>

      {/* Certificate Loading State */}
      {isCertificateLoading && (
        <motion.div 
          className="flex justify-center my-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center">
            <div className="relative">
              <RefreshCw className="h-16 w-16 text-blue-500 animate-spin mx-auto mb-4" />
              <motion.div 
                className="absolute inset-0 rounded-full bg-blue-100 z-[-1]"
                animate={{ 
                  scale: [1, 1.2, 1], 
                  opacity: [0.3, 0.1, 0.3] 
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut" 
                }}
              />
            </div>
            <p className="text-blue-600 font-medium">Generating certificate...</p>
            <p className="text-blue-400 text-sm mt-1">This may take a few moments</p>
          </div>
        </motion.div>
      )}

      {/* Certificate Error State */}
      {isCertificateError && (
        <motion.div 
          className="bg-blue-50 border-l-4 border-blue-500 p-6 my-6 rounded-lg shadow-md"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-full mr-4">
              <AlertCircle className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-800">Certificate Generation Failed</h3>
              <p className="text-blue-700 mt-1">We couldn't generate the certificate for this batch. Please try again or contact support.</p>
              <button 
                onClick={() => refetch()}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Certificate Data Display */}
      {certificateData && (
        <motion.div 
          className="bg-white rounded-xl shadow-xl overflow-hidden border border-blue-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Certificate Header - Improved with glassmorphism */}
          <div className="relative bg-blue-600 p-8 text-white overflow-hidden">
            {/* Glassmorphism elements */}
            <div className="absolute top-0 left-0 right-0 bottom-0 overflow-hidden">
              <div className="absolute -top-20 -left-20 w-60 h-60 rounded-full bg-blue-400 opacity-20 blur-2xl"></div>
              <div className="absolute top-10 right-10 w-40 h-40 rounded-full bg-indigo-400 opacity-20 blur-2xl"></div>
              <div className="absolute bottom-0 left-1/3 w-80 h-80 rounded-full bg-blue-300 opacity-10 blur-3xl"></div>
            </div>
            
            {/* Content */}
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <div className="flex items-center">
                  <Shield className="h-6 w-6 mr-2" />
                  <h1 className="text-2xl font-bold">Certificate of Analysis</h1>
                </div>
                <div className="text-blue-100 mt-2 flex items-center">
                  <Tag className="h-4 w-4 mr-2" />
                  {certificateData.certificateNumber}
                  <span className="mx-2">•</span>
                  <Clock className="h-4 w-4 mr-2" />
                  {format(new Date(certificateData.issuedDate), 'MMMM d, yyyy')}
                </div>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-3 text-center">
                <div className="text-xs uppercase tracking-wide text-blue-700">Overall Compliance</div>
                <div className="text-3xl font-bold mt-1 text-black">
                  {Math.round((certificateData.complianceSummary.compliantParameters / 
                   (certificateData.complianceSummary.totalParameters || 1)) * 100)}%
                </div>
              </div>
            </div>
            
            <motion.div 
              className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center text-blue-700">
                  <Package className="h-4 w-4 mr-2" />
                  <h3 className="text-sm uppercase tracking-wide">Product</h3>
                </div>
                <p className="font-medium text-lg mt-1 text-black">{certificateData.product.name}</p>
              </div>
              
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center text-blue-700">
                  <Tag className="h-4 w-4 mr-2" />
                  <h3 className="text-sm uppercase tracking-wide">Batch Number</h3>
                </div>
                <p className="font-medium text-lg mt-1 text-black">{certificateData.product.batchNumber}</p>
              </div>
              
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center text-blue-700">
                  <Calendar className="h-4 w-4 mr-2" />
                  <h3 className="text-sm uppercase tracking-wide ">Production Date</h3>
                </div>
                <p className="font-medium text-lg mt-1 text-black">
                  {format(new Date(certificateData.product.dateOfProduction), 'dd-MM-yyyy')}
                </p>
              </div>
            </motion.div>
          </div>
          
          {/* Review and Action Section */}
          <div className="p-6 border-b border-blue-100 bg-blue-50">
            <div className="flex items-center mb-4">
              <MessageSquare className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-blue-800">Review & Actions</h2>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
              <label className="block text-sm font-medium text-blue-700 mb-2">
                Remarks / Comments
              </label>
              <textarea 
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add your remarks or comments about this certificate..."
                className="w-full px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                rows={3}
              />
              
              <div className="flex flex-wrap gap-3 mt-4">
                
                
                <motion.button
                  onClick={handleApprove}
                  disabled={approveMutation.isPending}
                  className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Approve
                  {approveMutation.isPending && <RefreshCw className="ml-2 h-4 w-4 animate-spin" />}
                </motion.button>
                
                <motion.button
                  onClick={handleReject}
                  disabled={rejectMutation.isPending}
                  className="flex items-center px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 disabled:opacity-50 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                  {rejectMutation.isPending && <RefreshCw className="ml-2 h-4 w-4 animate-spin" />}
                </motion.button>
              </div>
              
              {reviewStatus === 'approved' && (
                <div className="mt-4 p-2 bg-blue-50 border border-blue-200 rounded flex items-center">
                  <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                  <p className="text-sm text-blue-700">Certificate has been approved successfully.</p>
                </div>
              )}
              
              {reviewStatus === 'rejected' && (
                <div className="mt-4 p-2 bg-blue-50 border border-blue-200 rounded flex items-center">
                  <XCircle className="h-5 w-5 text-blue-600 mr-2" />
                  <p className="text-sm text-blue-700">Certificate has been rejected.</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Compliance Summary */}
          <div className="p-8 border-b border-blue-100">
            <div className="flex items-center mb-6">
              <BarChart2 className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-800">Compliance Summary</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <motion.div 
                className="bg-blue-600 rounded-xl p-5 text-white shadow-md"
                whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.5)" }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="flex justify-between items-center">
                  <Layers className="h-6 w-6 text-blue-200" />
                  <div className="bg-white bg-opacity-20 rounded-full h-8 w-8 flex items-center justify-center">
                    <span className="text-sm font-bold">{certificateData.complianceSummary.totalParameters}</span>
                  </div>
                </div>
                <div className="text-2xl font-bold mt-4">
                  {certificateData.complianceSummary.totalParameters}
                </div>
                <div className="text-blue-100 mt-1">Total Parameters</div>
              </motion.div>
              
              <motion.div 
                className="bg-blue-500 rounded-xl p-5 text-white shadow-md"
                whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.5)" }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="flex justify-between items-center">
                  <CheckCircle className="h-6 w-6 text-blue-200" />
                  <div className="bg-white bg-opacity-20 rounded-full h-8 w-8 flex items-center justify-center">
                    <span className="text-sm font-bold">{certificateData.complianceSummary.compliantParameters}</span>
                  </div>
                </div>
                <div className="text-2xl font-bold mt-4">
                  {certificateData.complianceSummary.compliantParameters}
                </div>
                <div className="text-blue-100 mt-1">Compliant</div>
              </motion.div>
              
              <motion.div 
                className="bg-blue-700 rounded-xl p-5 text-white shadow-md"
                whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.5)" }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="flex justify-between items-center">
                  <XCircle className="h-6 w-6 text-blue-200" />
                  <div className="bg-white bg-opacity-20 rounded-full h-8 w-8 flex items-center justify-center">
                    <span className="text-sm font-bold">{certificateData.complianceSummary.nonCompliantParameters}</span>
                  </div>
                </div>
                <div className="text-2xl font-bold mt-4">
                  {certificateData.complianceSummary.nonCompliantParameters}
                </div>
                <div className="text-blue-100 mt-1">Non-Compliant</div>
              </motion.div>
              
              <motion.div 
                className="bg-blue-400 rounded-xl p-5 text-white shadow-md"
                whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.5)" }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="flex justify-between items-center">
                  <AlertCircle className="h-6 w-6 text-blue-100" />
                  <div className="bg-white bg-opacity-20 rounded-full h-8 w-8 flex items-center justify-center">
                    <span className="text-sm font-bold">{certificateData.complianceSummary.parametersWithoutStandards}</span>
                  </div>
                </div>
                <div className="text-2xl font-bold mt-4">
                  {certificateData.complianceSummary.parametersWithoutStandards}
                </div>
                <div className="text-blue-100 mt-1">No Standards</div>
              </motion.div>
            </div>
          </div>
          
          {/* Parameters by Category */}
          <div className="p-8">
            <div className="flex items-center mb-6">
              <PieChart className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-800">Parameter Analysis</h2>
            </div>
            
            <AnimatePresence>
              {Object.keys(certificateData.parameters).map((category, index) => (
                <motion.div 
                  key={category} 
                  className="mb-8 bg-white border border-blue-100 rounded-xl overflow-hidden shadow-md"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index, duration: 0.5 }}
                >
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                    <h3 className="font-medium text-blue-700">{category}</h3>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-blue-100">
                      <thead>
                        <tr className="bg-blue-50">
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Parameter</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Standard</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Result</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {certificateData.parameters[category].map((param: any, idx: number) => (
                          <motion.tr 
                            key={`${category}-${idx}`} 
                            className={idx % 2 === 0 ? 'bg-white' : 'bg-blue-50'}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 * idx, duration: 0.3 }}
                          >
                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                              {param.parameterName}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {param.standardValue !== 'Not defined' ? (
                                <div className="flex items-center">
                                  <span className="bg-blue-50 px-2 py-1 rounded text-blue-700">
                                    {param.standardValue} {param.standardUnit}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-500 italic">Not defined</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              <div className="bg-indigo-50 px-2 py-1 rounded inline-block text-indigo-700">
                                {param.actualValue} {param.actualUnit}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {param.complianceStatus === 'COMPLIANT' && (
                                <motion.span 
                                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500 text-white shadow-sm"
                                  whileHover={{ scale: 1.05 }}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Compliant
                                </motion.span>
                              )}
                              {param.complianceStatus === 'NON_COMPLIANT' && (
                                <motion.span 
                                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-700 text-white shadow-sm"
                                  whileHover={{ scale: 1.05 }}
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Non-Compliant
                                </motion.span>
                              )}
                              {param.complianceStatus === 'NOT_APPLICABLE' && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-400 text-white">
                                  N/A
                                </span>
                              )}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {/* Footer with signatures */}
          <div className="border-t border-blue-100 p-8 bg-gradient-to-b from-white to-blue-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                <p className="text-sm font-medium text-blue-600 mb-1">Tested by</p>
                <div className="flex items-center">
                  <div className="bg-blue-100 rounded-full p-2 mr-3">
                    <Wrench className="h-5 w-5 text-blue-700" />
                  </div>
                  <p className="font-medium text-gray-800">{certificateData.testedBy}</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                <p className="text-sm font-medium text-blue-600 mb-1">Approved by</p>
                <div className="flex items-center">
                  <div className="bg-blue-100 rounded-full p-2 mr-3">
                    <Shield className="h-5 w-5 text-blue-700" />
                  </div>
                  <p className="font-medium text-gray-800">{certificateData.approvedBy}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <div className="text-sm text-gray-500">
                This certificate was automatically generated on {format(new Date(), 'MMMM d, yyyy')} using BatchFlow QMS.
              </div>
              <div className="text-xs text-gray-400 mt-1">
                The results relate only to the items tested. This certificate shall not be reproduced except in full, without written approval.
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default CertificateOfAnalysis;