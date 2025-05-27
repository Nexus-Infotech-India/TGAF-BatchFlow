import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calendar, Users, Building, FileText, ClipboardList, Target, 
  List, Tag, Clock, AlertTriangle, CheckCircle, Play, Download, Eye, Edit, 
  ChevronDown, ChevronUp, ExternalLink, Upload, X, Paperclip, Plus, 
  ClipboardCheck} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_ROUTES } from '../../../utils/api';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

interface AuditDetailsProps {
  auditId: string | null;
  onBack: () => void;
}

// Improved Audit status badge component with animation
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNED':
        return 'bg-blue-600 text-white';
      case 'IN_PROGRESS':
        return 'bg-amber-500 text-white';
      case 'COMPLETED':
        return 'bg-emerald-600 text-white';
      case 'CANCELLED':
        return 'bg-rose-600 text-white';
      default:
        return 'bg-slate-600 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PLANNED':
        return <Clock size={14} className="mr-1.5" />;
      case 'IN_PROGRESS':
        return <Play size={14} className="mr-1.5" />;
      case 'COMPLETED':
        return <CheckCircle size={14} className="mr-1.5" />;
      case 'CANCELLED':
        return <AlertTriangle size={14} className="mr-1.5" />;
      default:
        return null;
    }
  };

  return (
    <motion.span 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)} shadow-sm`}
    >
      {getStatusIcon(status)}
      {status.replace('_', ' ')}
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

const SectionCard: React.FC<SectionCardProps> = ({ title, icon, children, delay = 0, iconColor = "text-indigo-600", actions }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.3 }}
      className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-gray-50 to-gray-100">
        <div 
          className="flex items-center cursor-pointer flex-1"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className={`p-2.5 rounded-full mr-3 ${iconColor.replace('text-', 'bg-').replace('600', '100')}`}>
            {icon}
          </div>
          <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        </div>
        
        <div className="flex items-center gap-2">
          {actions}
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
          >
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// New Timeline component for audit history
const AuditTimeline = ({ audit }: { audit: any }) => {
  const timelineEvents = [
    { date: audit.createdAt, label: 'Audit Created' },
    { date: audit.startDate, label: 'Audit Started' },
    ...(audit.status === 'COMPLETED' || audit.status === 'CANCELLED' 
      ? [{ date: audit.endDate, label: `Audit ${audit.status.toLowerCase().replace('_', ' ')}` }] 
      : [])
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="relative pl-8 mt-3 space-y-8 before:absolute before:left-4 before:top-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-blue-500 before:via-purple-500 before:to-indigo-600">
      {timelineEvents.map((event, index) => (
        <motion.div 
          key={index}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.2 }}
          className="relative"
        >
          <div className="absolute left-[-2.45rem] top-1 h-5 w-5 rounded-full border-2 border-white bg-gradient-to-r from-blue-500 to-indigo-600 shadow-md"></div>
          <div>
            <p className="text-xs font-medium text-indigo-600 mb-1">
              {new Date(event.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
            <p className="text-sm font-medium text-gray-700">{event.label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Updated Document card component with download and view functionality
const DocumentCard = ({ document, onDelete }: { document: any; onDelete?: (id: string) => void }) => {
  return (
    <motion.div 
      whileHover={{ y: -4, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-lg border border-gray-200 p-4 flex items-start shadow-sm"
    >
      <div className="p-2 bg-blue-100 rounded-lg mr-3">
        <FileText className="text-blue-600" size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-800 truncate">{document.title || document.name || document.fileName}</h4>
        <p className="text-xs text-gray-500 mt-1">
          {new Date(document.createdAt).toLocaleDateString()}
        </p>
      </div>
      <div className="flex space-x-1">
        <a 
          href={document.fileUrl || document.url || '#'} 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
        >
          <Eye size={16} className="text-gray-600" />
        </a>
        <a 
          href={document.fileUrl || document.url || '#'} 
          download
          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
        >
          <Download size={16} className="text-gray-600" />
        </a>
        {onDelete && (
          <button 
            onClick={() => onDelete(document.id)}
            className="p-1.5 hover:bg-rose-100 rounded-full transition-colors"
          >
            <X size={16} className="text-rose-600" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

// Finding card component
const FindingCard = ({ finding }: { finding: any }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-sm font-medium text-gray-800 flex-1">{finding.title}</h4>
        {finding.severity && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${getSeverityColor(finding.severity)}`}>
            {finding.severity}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-600 mb-3">{finding.description}</p>
      {finding.remediation && (
        <div className="bg-indigo-50 p-2 rounded text-xs text-indigo-700 mt-2">
          <span className="font-medium">Remediation: </span>
          {finding.remediation}
        </div>
      )}
    </motion.div>
  );
};

// Document upload component
const DocumentUploader = ({ auditId, onUploadSuccess }: { auditId: string; onUploadSuccess: () => void }) => {
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

const AuditDetails: React.FC<AuditDetailsProps> = ({ auditId, onBack }) => {
  const queryClient = useQueryClient();
  const [isShowingUploader, setIsShowingUploader] = useState(false);
   const navigate = useNavigate();

   const handleCreateInspectionChecklist = () => {
    navigate(`/audits/${auditId}/inspection-checklist/create`);
  };

  // Fetch audit details with included documents
  const { data: audit, isLoading, isError } = useQuery({
    queryKey: ['audit', auditId],
    queryFn: async () => {
      if (!auditId) return null;
      try {
        const response = await axios.get(API_ROUTES.AUDIT.GET_AUDIT_BY_ID(auditId), {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
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
      await axios.delete(API_ROUTES.AUDIT.DELETE_DOCUMENT(auditId, documentId), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
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
      minute: '2-digit'
    });
  };

  // Hero background gradient based on audit status
  const getHeroGradient = () => {
    if (!audit) return 'from-gray-800 to-gray-900';
    
    switch (audit.status) {
      case 'PLANNED':
        return 'from-blue-800 to-indigo-900';
      case 'IN_PROGRESS':
        return 'from-amber-600 to-orange-800';
      case 'COMPLETED':
        return 'from-emerald-700 to-teal-900';
      case 'CANCELLED':
        return 'from-rose-700 to-red-900';
      default:
        return 'from-gray-800 to-gray-900';
    }
  };

  return (
    <motion.div
      key="details-view"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-7xl mx-auto"
    >
      <div className="mb-6">
        <motion.button 
          onClick={onBack}
          className="inline-flex items-center text-indigo-600 hover:text-indigo-800 cursor-pointer font-medium"
          whileHover={{ x: -3 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <ArrowLeft size={18} className="mr-1.5" />
          Back to Audits
        </motion.button>
      </div>
      
      {isLoading ? (
        <div className="p-12 flex flex-col items-center justify-center bg-white rounded-2xl shadow-lg">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading audit details...</p>
        </div>
      ) : isError ? (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="p-12 flex flex-col items-center justify-center text-red-500 bg-red-50 rounded-2xl border border-red-100"
        >
          <AlertTriangle size={48} className="mb-4" />
          <p className="text-lg font-medium">Error loading audit details</p>
          <p className="text-sm text-red-400 mt-2">Please try again or contact support</p>
          <button 
            onClick={onBack}
            className="mt-6 px-5 py-2 bg-white text-red-600 rounded-lg border border-red-200 hover:bg-red-50 shadow-sm"
          >
            Return to Audit List
          </button>
        </motion.div>
      ) : audit ? (
        <div className="space-y-6">
          {/* Hero Section */}
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={`bg-gradient-to-r ${getHeroGradient()} rounded-2xl shadow-xl overflow-hidden text-white p-8 mb-8`}
          >
            <div className="max-w-4xl">
<div className="flex items-center space-x-3 mb-2">
  <StatusBadge status={audit.status} />
  <span className="text-gray-200 text-sm">
    ID: {audit.id ? audit.id.substring(0, 8) : 'N/A'}
  </span>
</div>
              
              <h1 className="text-3xl font-bold mb-3">{audit.name}</h1>
              
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-gray-200 text-sm mb-4">
                <div className="flex items-center">
                  <Calendar size={16} className="mr-1.5" />
                  <span>Created: {new Date(audit.createdAt).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center">
                  <Building size={16} className="mr-1.5" />
                  <span>{audit.department?.name || 'No Department'}</span>
                </div>
                
                <div className="flex items-center">
                  <Tag size={16} className="mr-1.5" />
                  <span>{audit.auditType}</span>
                </div>
              </div>
              
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to={`/audits/edit/${audit.id}`}
                  className="inline-flex items-center px-4 py-2 bg-white text-indigo-700 rounded-lg hover:bg-indigo-50 transition-colors font-medium shadow-md"
                >
                  <Edit size={16} className="mr-1.5" />
                  Edit Audit
                </Link>
                {audit.status === 'IN_PROGRESS' && (
                  <button
                    onClick={handleCreateInspectionChecklist}
                    className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-md"
                  >
                    <ClipboardCheck size={16} className="mr-1.5" />
                    Create Inspection Checklist
                  </button>
                )}
                
                <button className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-md">
                  <FileText size={16} className="mr-1.5" />
                  Export Report
                </button>
              </div>
            </div>
          </motion.div>

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
                  <p className="whitespace-pre-line">{audit.objectives}</p>
                </div>
              </SectionCard>
              
              <SectionCard 
                title="Scope" 
                icon={<List size={20} className="text-purple-600" />} 
                delay={1}
                iconColor="text-purple-600"
              >
                <div className="prose prose-sm max-w-none text-gray-700">
                  <p className="whitespace-pre-line">{audit.scope}</p>
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
                    <p className="whitespace-pre-line">{audit.summary}</p>
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
                  <div className="grid grid-cols-1 gap-4">
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
                  <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50 rounded-lg">
                    <div className="p-3 bg-amber-100 rounded-full mb-3">
                      <AlertTriangle size={24} className="text-amber-600" />
                    </div>
                    <p className="text-gray-600 font-medium">No findings recorded</p>
                    <p className="text-gray-500 text-sm mt-1">All clear! No issues were found during this audit.</p>
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
                    className="px-2.5 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium shadow-sm flex items-center"
                  >
                    <Plus size={14} className="mr-1" />
                    Upload
                  </motion.button>
                }
              >
                {isShowingUploader && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-5"
                  >
                    <DocumentUploader 
                      auditId={auditId as string} 
                      onUploadSuccess={refreshAudit} 
                    />
                  </motion.div>
                )}
                
                {audit.documents && audit.documents.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
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
                  <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50 rounded-lg">
                    <div className="p-3 bg-blue-100 rounded-full mb-3">
                      <ClipboardList size={24} className="text-blue-600" />
                    </div>
                    <p className="text-gray-600 font-medium">No documents attached</p>
                    <p className="text-gray-500 text-sm mt-1">Upload documents to share findings and evidence.</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsShowingUploader(true)}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium flex items-center"
                    >
                      <Upload size={14} className="mr-1.5" />
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
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs text-gray-500 uppercase font-semibold mb-2">Audit Period</h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-start mb-2">
                        <Calendar size={16} className="text-indigo-600 mt-0.5 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">Start Date</p>
                          <p className="text-xs text-gray-600">{formatDate(audit.startDate)}</p>
                        </div>
                      </div>
                      {audit.endDate && (
                        <div className="flex items-start">
                          <Calendar size={16} className="text-indigo-600 mt-0.5 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-gray-800">End Date</p>
                            <p className="text-xs text-gray-600">{formatDate(audit.endDate)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-xs text-gray-500 uppercase font-semibold mb-2">Audit Type</h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center">
                        <Tag size={16} className="text-purple-600 mr-2 flex-shrink-0" />
                        <p className="text-sm font-medium text-gray-800">{audit.auditType}</p>
                      </div>
                      {audit.firmName && (
                        <div className="flex items-center mt-2">
                          <Building size={16} className="text-purple-600 mr-2 flex-shrink-0" />
                          <p className="text-sm text-gray-600">{audit.firmName}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-xs text-gray-500 uppercase font-semibold mb-2">Personnel</h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center mb-2">
                        <Users size={16} className="text-blue-600 mr-2 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Auditor</p>
                          <p className="text-sm font-medium text-gray-800">
                            {audit.auditor?.name || 'Not assigned'}
                          </p>
                        </div>
                      </div>
                      {audit.auditee && (
                        <div className="flex items-center">
                          <Users size={16} className="text-blue-600 mr-2 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500">Auditee</p>
                            <p className="text-sm font-medium text-gray-800">
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
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-5 shadow-sm border border-indigo-100"
              >
                <h3 className="text-base font-medium text-indigo-700 mb-2">Need Help?</h3>
                <p className="text-sm text-indigo-600 mb-4">Have questions about this audit or need support?</p>
                <div className="flex flex-wrap gap-2">
                  <button className="inline-flex items-center px-3 py-1.5 bg-white text-indigo-700 rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-colors text-sm font-medium">
                    <ExternalLink size={14} className="mr-1.5" />
                    Documentation
                  </button>
                  <button className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
                    Contact Support
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-gray-500 bg-white rounded-xl shadow-md">
          <p>No audit selected</p>
        </div>
      )}
    </motion.div>
  );
};

export default AuditDetails;