import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Users,
  Building,
  FileText,
  ClipboardList,
  Target,
  List,
  Tag,
  Clock,
  AlertTriangle,
  CheckCircle,
  Play,
  Download,
  Eye,
  Edit,
  ExternalLink,
  Upload,
  X,
  Paperclip,
  Plus,
  ClipboardCheck,
  Layers,
  Award,
  Shield,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_ROUTES } from '../../../utils/api';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import InspectionChecklistCreation from './AuditInspectionlist';
import AuditFindingCreation from './AuditFindings';
import PreAuditChecklistCreator from './AuditChecklist';

interface AuditDetailsProps {
  auditId: string | null;
  onBack: () => void;
}

// Enhanced animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
      staggerChildren: 0.1,
    },
  },
};

const tabContentVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.98,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
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

// Improved Audit status badge component with animation
interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let color = '';
  let bgColor = '';
  let label = '';
  let icon = null;

  switch (status) {
    case 'PLANNED':
      color = 'text-blue-700';
      bgColor = 'bg-blue-100 border-blue-200';
      label = 'Planned';
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

// Enhanced section card component
interface SectionCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
  iconColor?: string;
  actions?: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({
  title,
  icon,
  children,
  delay = 0,
  iconColor = '',
  actions,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: delay * 0.1, duration: 0.4, ease: 'easeOut' }}
      className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300"
    >
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                delay: delay * 0.1 + 0.2,
                type: 'spring',
                stiffness: 300,
              }}
              className={`inline-flex items-center justify-center rounded-xl bg-white p-3 shadow-sm border ${iconColor}`}
            >
              {icon}
            </motion.div>
            <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          </div>
          {actions && <div>{actions}</div>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </motion.div>
  );
};

// New Timeline component for audit history
interface AuditTimelineProps {
  audit: any;
}

const AuditTimeline: React.FC<AuditTimelineProps> = ({ audit }) => {
  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-200"
      >
        <div className="w-3 h-3 bg-blue-500 rounded-full mr-3 shadow-lg"></div>
        <div>
          <span className="font-semibold text-blue-800">Created:</span>{' '}
          <span className="text-blue-700">
            {audit?.createdAt
              ? new Date(audit.createdAt).toLocaleString()
              : 'N/A'}
          </span>
        </div>
      </motion.div>

      {audit?.updatedAt && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center p-3 bg-green-50 rounded-lg border border-green-200"
        >
          <div className="w-3 h-3 bg-green-500 rounded-full mr-3 shadow-lg"></div>
          <div>
            <span className="font-semibold text-green-800">Last Updated:</span>{' '}
            <span className="text-green-700">
              {new Date(audit.updatedAt).toLocaleString()}
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Updated Document card component with download and view functionality
interface DocumentCardProps {
  document: any;
  onDelete: (documentId: string) => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ document }) => {
  const [showPreview, setShowPreview] = useState(false);

  const handleDownload = () => {
    // Create a proper download link with the document URL
    const link = document.createElement('a');
    link.href = document.url || document.fileUrl || '#';
    link.download = document.title || document.name || 'document';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = () => {
    // Open in new tab for viewing
    if (document.url || document.fileUrl) {
      window.open(document.url || document.fileUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  const isImageFile = (filename: string) => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
    const extension = filename.split('.').pop()?.toLowerCase();
    return extension && imageExtensions.includes(extension);
  };

  const isPdfFile = (filename: string) => {
    return filename.toLowerCase().endsWith('.pdf');
  };

  const getFileIcon = () => {
    const filename = document.title || document.name || '';
    if (isImageFile(filename)) {
      return <FileText size={20} className="text-green-600" />;
    } else if (isPdfFile(filename)) {
      return <FileText size={20} className="text-red-600" />;
    } else {
      return <Paperclip size={20} className="text-blue-600" />;
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              {getFileIcon()}
            </div>
            <div>
              <div className="font-semibold text-gray-800">
                {document.title || document.name || 'Untitled Document'}
              </div>
              <div className="text-sm text-gray-500">
                {document.uploadedBy?.name || 'Unknown'} •{' '}
                {document.uploadedAt || document.createdAt
                  ? new Date(document.uploadedAt || document.createdAt).toLocaleDateString()
                  : 'Unknown date'}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={togglePreview}
              className="inline-flex items-center px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm font-medium transition-colors"
            >
              <Eye size={14} className="mr-1" />
              {showPreview ? 'Hide' : 'Preview'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleView}
              className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
            >
              <ExternalLink size={14} className="mr-1" />
              View
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownload}
              className="inline-flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium transition-colors"
            >
              <Download size={14} className="mr-1" />
              Download
            </motion.button>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-200 bg-gray-50 overflow-hidden"
          >
            <div className="p-4">
              {document.url || document.fileUrl ? (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {isImageFile(document.title || document.name || '') ? (
                    // Image Preview
                    <div className="aspect-video bg-gray-100 flex items-center justify-center">
                      <img
                        src={document.url || document.fileUrl}
                        alt={document.title || document.name}
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden text-gray-500 text-center p-8">
                        <FileText size={48} className="mx-auto mb-2 text-gray-400" />
                        <p>Cannot preview this image</p>
                      </div>
                    </div>
                  ) : isPdfFile(document.title || document.name || '') ? (
                    // PDF Preview
                    <div className="aspect-video">
                      <iframe
                        src={`${document.url || document.fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                        className="w-full h-full border-0"
                        title={document.title || document.name}
                        onError={() => {
                          console.log('PDF preview failed');
                        }}
                      />
                    </div>
                  ) : (
                    // Generic file preview
                    <div className="aspect-video bg-gray-100 flex items-center justify-center text-gray-500">
                      <div className="text-center p-8">
                        <FileText size={48} className="mx-auto mb-4 text-gray-400" />
                        <p className="font-medium mb-2">Preview not available</p>
                        <p className="text-sm">Click "View" to open this document</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Document Info */}
                  <div className="p-3 bg-gray-50 border-t border-gray-200">
                    <div className="flex justify-between items-center text-xs text-gray-600">
                      <span>File Type: {(document.title || document.name || '').split('.').pop()?.toUpperCase() || 'Unknown'}</span>
                      <span>Size: {document.size ? `${(document.size / 1024).toFixed(1)} KB` : 'Unknown'}</span>
                    </div>
                    {document.description && (
                      <p className="text-sm text-gray-700 mt-2">{document.description}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText size={48} className="mx-auto mb-4 text-gray-400" />
                  <p>Document URL not available</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Finding card component
interface FindingCardProps {
  finding: any;
}

const FindingCard: React.FC<FindingCardProps> = ({ finding }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -1 }}
      className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-center mb-3">
        <div className="p-2 bg-yellow-100 rounded-lg mr-3">
          <AlertTriangle size={18} className="text-yellow-600" />
        </div>
        <span className="font-bold text-yellow-800">
          {finding.title || 'Finding'}
        </span>
      </div>
      <div className="text-gray-700 text-sm whitespace-pre-line pl-12">
        {finding.description || 'No description provided.'}
      </div>
      {finding.severity && (
        <div className="mt-3 pl-12">
          <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
            <Award size={12} className="mr-1" />
            Severity: {finding.severity}
          </span>
        </div>
      )}
    </motion.div>
  );
};

// Document upload component
interface DocumentUploaderProps {
  auditId: string;
  onUploadSuccess: () => void;
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  auditId,
  onUploadSuccess,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [description, setDescription] = useState('');
  const [documentType, setDocumentType] = useState('GENERAL');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!documentName) {
        setDocumentName(file.name.split('.')[0]); // Default to filename without extension
      }
    }
  };
  
  const uploadDocument = async () => {
    if (!selectedFile || !auditId) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('auditId', auditId); // Important! Add the auditId to the form data
    formData.append('title', documentName || selectedFile.name); // Using 'title' instead of 'name' to match backend
    formData.append('description', description || 'Uploaded from audit details'); // Add description
    formData.append('documentType', documentType); // Add document type
    
    try {
      await axios.post(API_ROUTES.AUDIT.UPLOAD_DOCUMENT(auditId), formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success('Document uploaded successfully');
      setSelectedFile(null);
      setDocumentName('');
      setDescription('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      onUploadSuccess();
    } catch (error) {
      console.error('Error uploading document:', error);
      let errorMessage = 'Unknown error';
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const err = error as { response?: { data?: { error?: string } } };
        errorMessage = err.response?.data?.error || 'Unknown error';
      }
      toast.error('Failed to upload document: ' + errorMessage);
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="p-5 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Upload New Document</h3>
      
      <div className="mb-3">
        <label htmlFor="documentName" className="block text-xs font-medium text-gray-500 mb-1">Document Title *</label>
        <input 
          type="text"
          id="documentName"
          value={documentName}
          onChange={(e) => setDocumentName(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md text-sm"
          placeholder="Enter document title"
        />
      </div>
      
      <div className="mb-3">
        <label htmlFor="documentDescription" className="block text-xs font-medium text-gray-500 mb-1">Description</label>
        <textarea 
          id="documentDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md text-sm"
          placeholder="Enter document description (optional)"
          rows={2}
        />
      </div>
      
      <div className="mb-3">
        <label htmlFor="documentType" className="block text-xs font-medium text-gray-500 mb-1">Document Type</label>
        <select
          id="documentType"
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="GENERAL">General</option>
          <option value="CHECKLIST">Checklist</option>
          <option value="PROCEDURE">Procedure</option>
          <option value="CERTIFICATE">Certificate</option>
          <option value="EVIDENCE">Evidence</option>
          <option value="REPORT">Report</option>
          <option value="OTHER">Other</option>
        </select>
      </div>
      
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-500 mb-1">Document File *</label>
        
        {selectedFile ? (
          <div className="flex items-center bg-blue-50 rounded-md p-2 border border-blue-200">
            <Paperclip size={16} className="text-blue-500 mr-2" />
            <span className="text-sm truncate flex-1">{selectedFile.name}</span>
            <button 
              className="p-1 hover:bg-blue-100 rounded-full"
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
            >
              <X size={14} className="text-gray-500" />
            </button>
          </div>
        ) : (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-md p-3 text-center cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <Upload className="mx-auto h-5 w-5 text-gray-400 mb-1" />
            <p className="text-xs font-medium text-gray-500">Click to select a file</p>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <div className="flex justify-end">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={!selectedFile || !documentName || isUploading}
          onClick={uploadDocument}
          className={`px-4 py-2 rounded-md text-sm font-medium flex items-center ${
            !selectedFile || !documentName ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              Uploading...
            </>
          ) : (
            <>
              <Upload size={16} className="mr-1.5" />
              Upload Document
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
};

// Tab type definition
type TabType = 'overview' | 'inspection' | 'findings' | 'reports' | 'checklist';

const AuditDetails: React.FC<AuditDetailsProps> = ({ auditId, onBack }) => {
  const queryClient = useQueryClient();
  const [isShowingUploader, setIsShowingUploader] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');


  // Fetch audit details with included documents
  const {
    data: audit,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['audit', auditId],
    queryFn: async () => {
      if (!auditId) return null;
      try {
        const response = await axios.get(
          API_ROUTES.AUDIT.GET_AUDIT_BY_ID(auditId),
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            },
          }
        );
        return response.data;
      } catch (error) {
        toast.error('Failed to fetch audit details');
        console.error('Error fetching audit details:', error);
        throw error;
      }
    },
    enabled: !!auditId,
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      if (!auditId) return;
      await axios.delete(
        API_ROUTES.AUDIT.DELETE_DOCUMENT(auditId, documentId),
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit', auditId] });
      toast.success('Document deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete document');
    },
  });

  const handleDeleteDocument = (documentId: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      deleteDocumentMutation.mutate(documentId);
    }
  };

  const refreshAudit = () => {
    queryClient.invalidateQueries({ queryKey: ['audit', auditId] });
    setIsShowingUploader(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Hero background gradient based on audit status
  const getHeroGradient = () => {
    if (!audit) return 'from-gray-800 via-gray-900 to-black';

    switch (audit.status) {
      case 'PLANNED':
        return 'from-blue-600 via-blue-700 to-indigo-800';
      case 'IN_PROGRESS':
        return 'from-amber-500 via-orange-600 to-red-700';
      case 'COMPLETED':
        return 'from-emerald-600 via-green-700 to-teal-800';
      case 'CANCELLED':
        return 'from-rose-600 via-red-700 to-red-800';
      default:
        return 'from-gray-700 via-gray-800 to-gray-900';
    }
  };

  // Enhanced tabs configuration
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <Layers size={18} />,
      description: 'Audit summary and details',
      color: 'text-blue-600',
    },
    {
      id: 'checklist',
      label: 'Pre-Audit Checklist',
      icon: <ClipboardList size={18} />,
      description: 'Preparation checklist',
      color: 'text-purple-600',
    },
    {
      id: 'inspection',
      label: 'Inspection Checklist',
      icon: <ClipboardCheck size={18} />,
      description: 'Inspection items and results',
      color: 'text-green-600',
    },
    {
      id: 'findings',
      label: 'Findings',
      icon: <AlertTriangle size={18} />,
      description: 'Issues and observations',
      color: 'text-orange-600',
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <FileText size={18} />,
      description: 'Generated reports',
      color: 'text-indigo-600',
    },
  ];

  // Render overview tab content (existing audit details)
  const renderOverviewTab = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          <SectionCard
            title="Objectives"
            icon={<Target size={20} className="text-indigo-600" />}
            delay={0}
            iconColor="text-indigo-600"
          >
            <div className="prose prose-sm max-w-none text-gray-700">
              <p className="whitespace-pre-line leading-relaxed">
                {audit.objectives}
              </p>
            </div>
          </SectionCard>

          <SectionCard
            title="Scope"
            icon={<List size={20} className="text-purple-600" />}
            delay={1}
            iconColor="text-purple-600"
          >
            <div className="prose prose-sm max-w-none text-gray-700">
              <p className="whitespace-pre-line leading-relaxed">
                {audit.scope}
              </p>
            </div>
          </SectionCard>

          {audit.summary && (
            <SectionCard
              title="Summary"
              icon={<FileText size={20} className="text-emerald-600" />}
              delay={2}
              iconColor="text-emerald-600"
            >
              <div className="prose prose-sm max-w-none text-gray-700">
                <p className="whitespace-pre-line leading-relaxed">
                  {audit.summary}
                </p>
              </div>
            </SectionCard>
          )}

          <SectionCard
            title={`Findings (${audit.findings?.length || 0})`}
            icon={<AlertTriangle size={20} className="text-amber-600" />}
            delay={3}
            iconColor="text-amber-600"
          >
            {audit.findings && audit.findings.length > 0 ? (
              <div className="space-y-4">
                {audit.findings.map((finding: any, index: number) => (
                  <motion.div
                    key={finding.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <FindingCard finding={finding} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border-2 border-dashed border-gray-300">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
                  className="p-4 bg-white rounded-full shadow-lg mb-4"
                >
                  <CheckCircle size={32} className="text-green-500" />
                </motion.div>
                <p className="text-gray-700 font-semibold text-lg mb-2">
                  No findings recorded
                </p>
                <p className="text-gray-500 text-sm">
                  All clear! No issues were found during this audit.
                </p>
              </div>
            )}
          </SectionCard>

          <SectionCard
            title={`Documents (${audit.documents?.length || 0})`}
            icon={<ClipboardList size={20} className="text-blue-600" />}
            delay={4}
            iconColor="text-blue-600"
            actions={
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsShowingUploader(!isShowingUploader)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium shadow-lg flex items-center"
              >
                <Plus size={16} className="mr-2" />
                Upload
              </motion.button>
            }
          >
            <AnimatePresence>
              {isShowingUploader && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <DocumentUploader
                    auditId={auditId as string}
                    onUploadSuccess={refreshAudit}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {audit.documents && audit.documents.length > 0 ? (
              <div className="space-y-3">
                {audit.documents.map((doc: any, index: number) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <DocumentCard
                      document={doc}
                      onDelete={handleDeleteDocument}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border-2 border-dashed border-gray-300">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
                  className="p-4 bg-white rounded-full shadow-lg mb-4"
                >
                  <ClipboardList size={32} className="text-blue-500" />
                </motion.div>
                <p className="text-gray-700 font-semibold text-lg mb-2">
                  No documents attached
                </p>
                <p className="text-gray-500 text-sm mb-6">
                  Upload documents to share findings and evidence.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsShowingUploader(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium shadow-lg flex items-center"
                >
                  <Upload size={16} className="mr-2" />
                  Upload Document
                </motion.button>
              </div>
            )}
          </SectionCard>
        </div>

        {/* Sidebar - 1/3 width */}
        <div className="space-y-6">
          <SectionCard
            title="Audit Details"
            icon={<FileText size={20} className="text-gray-600" />}
            delay={0}
            iconColor="text-gray-600"
          >
            <div className="space-y-6">
              <div>
                <h4 className="text-xs text-gray-500 uppercase font-bold mb-3 tracking-wider">
                  Audit Period
                </h4>
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex items-start mb-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm mr-3">
                      <Calendar size={16} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        Start Date
                      </p>
                      <p className="text-xs text-gray-600">
                        {formatDate(audit.startDate)}
                      </p>
                    </div>
                  </div>
                  {audit.endDate && (
                    <div className="flex items-start">
                      <div className="p-2 bg-white rounded-lg shadow-sm mr-3">
                        <Calendar size={16} className="text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          End Date
                        </p>
                        <p className="text-xs text-gray-600">
                          {formatDate(audit.endDate)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs text-gray-500 uppercase font-bold mb-3 tracking-wider">
                  Audit Type
                </h4>
                <div className="bg-gradient-to-r from-gray-50 to-purple-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex items-center mb-2">
                    <div className="p-2 bg-white rounded-lg shadow-sm mr-3">
                      <Tag size={16} className="text-purple-600" />
                    </div>
                    <p className="text-sm font-semibold text-gray-800">
                      {audit.auditType}
                    </p>
                  </div>
                  {audit.firmName && (
                    <div className="flex items-center">
                      <div className="p-2 bg-white rounded-lg shadow-sm mr-3">
                        <Building size={16} className="text-purple-600" />
                      </div>
                      <p className="text-sm text-gray-600">{audit.firmName}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs text-gray-500 uppercase font-bold mb-3 tracking-wider">
                  Personnel
                </h4>
                <div className="bg-gradient-to-r from-gray-50 to-green-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex items-center mb-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm mr-3">
                      <Users size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">
                        Auditor
                      </p>
                      <p className="text-sm font-semibold text-gray-800">
                        {audit.auditor?.name || 'Not assigned'}
                      </p>
                    </div>
                  </div>
                  {audit.auditee && (
                    <div className="flex items-center">
                      <div className="p-2 bg-white rounded-lg shadow-sm mr-3">
                        <Users size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">
                          Auditee
                        </p>
                        <p className="text-sm font-semibold text-gray-800">
                          {audit.auditee?.name || 'Not assigned'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Timeline"
            icon={<Clock size={20} className="text-emerald-600" />}
            delay={1}
            iconColor="text-emerald-600"
          >
            <AuditTimeline audit={audit} />
          </SectionCard>

         
        </div>
      </div>
    );
  };

  // Render tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'checklist':
        return <PreAuditChecklistCreator auditId={auditId || ''} />;
      case 'inspection':
        return <InspectionChecklistCreation auditId={auditId || ''} />;
      case 'findings':
        return <AuditFindingCreation auditId={auditId || ''} />;
      case 'reports':
        return (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="p-6 bg-blue-100 rounded-full inline-block mb-6"
            >
              <FileText size={48} className="text-blue-600" />
            </motion.div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              Reports Tab
            </h3>
            <p className="text-gray-600 text-lg">
              Audit reports and templates will appear here.
            </p>
          </div>
        );
      default:
        return renderOverviewTab();
    }
  };

  // ...existing code...

// ...existing code...

return (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
    <div className="max-w-7xl mx-auto px-4 py-2">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {isLoading ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-16 flex flex-col items-center justify-center bg-white rounded-3xl shadow-xl border border-gray-100"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="inline-block rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mb-6"
            />
            <p className="text-xl text-gray-700 font-semibold">Loading audit details...</p>
            <p className="text-gray-500 mt-2">Please wait while we fetch the information</p>
          </motion.div>
        ) : isError ? (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-16 flex flex-col items-center justify-center text-red-600 bg-red-50 rounded-3xl border border-red-200 shadow-xl"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
            >
              <AlertTriangle size={64} className="mb-6" />
            </motion.div>
            <p className="text-2xl font-bold mb-2">Error loading audit details</p>
            <p className="text-red-500 mb-8">Please try again or contact support</p>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              className="px-8 py-3 bg-white text-red-600 rounded-xl border border-red-200 hover:bg-red-50 shadow-lg font-semibold"
            >
              Return to Audit List
            </motion.button>
          </motion.div>
        ) : audit ? (
          <div className="space-y-4">
          
{/* Compact Hero Section with Back Button */}
<motion.div 
  variants={heroVariants}
  className={`bg-gradient-to-r ${getHeroGradient()} rounded-xl shadow-lg overflow-hidden text-white relative`}
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
          onClick={onBack}
          className="inline-flex items-center text-white/90 hover:text-white cursor-pointer font-medium bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/30 hover:bg-white/30 transition-all text-sm"
          whileHover={{ x: -2, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Audits
        </motion.button>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center space-x-2 mb-1"
      >
        <StatusBadge status={audit.status} />
        <span className="text-white/80 text-xs font-medium bg-white/20 backdrop-blur-sm px-2 py-1 rounded-md">
          ID: {audit.id ? audit.id.substring(0, 8) : 'N/A'}
        </span>
      </motion.div>
      
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-xl lg:text-2xl font-bold mb-1 drop-shadow-lg"
      >
        {audit.name}
      </motion.h1>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex flex-wrap items-center gap-x-4 gap-y-1 text-white/90 text-xs mb-3"
      >
        <div className="flex items-center bg-white/20 backdrop-blur-sm px-2 py-1 rounded-md">
          <Calendar size={12} className="mr-1" />
          <span>Created: {new Date(audit.createdAt).toLocaleDateString()}</span>
        </div>
        
        <div className="flex items-center bg-white/20 backdrop-blur-sm px-2 py-1 rounded-md">
          <Building size={12} className="mr-1" />
          <span>{audit.department?.name || 'No Department'}</span>
        </div>
        
        <div className="flex items-center bg-white/20 backdrop-blur-sm px-2 py-1 rounded-md">
          <Tag size={12} className="mr-1" />
          <span>{audit.auditType}</span>
        </div>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-wrap gap-2"
      >
        <Link
          to={`/audits/edit/${audit.id}`}
          className="inline-flex items-center px-3 py-1.5 bg-white text-gray-800 rounded-lg hover:bg-gray-100 transition-all font-medium shadow-md hover:shadow-lg transform hover:scale-105 text-sm"
        >
          <Edit size={14} className="mr-1" />
          Edit Audit
        </Link>
      </motion.div>
    </div>
  </div>
</motion.div>


            {/* Enhanced Tab Navigation */}
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

            {/* Enhanced Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {renderTabContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-16 text-center text-gray-500 bg-white rounded-3xl shadow-xl border border-gray-200"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
              className="p-6 bg-gray-100 rounded-full inline-block mb-6"
            >
              <FileText size={48} className="text-gray-400" />
            </motion.div>
            <p className="text-xl font-semibold">No audit selected</p>
            <p className="text-gray-400 mt-2">Please select an audit to view its details</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  </div>
);

// ...existing code...

// ...existing code...
};

export default AuditDetails;
