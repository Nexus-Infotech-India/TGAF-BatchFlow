import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  File, FileText, FileArchive as FilePdf, FileImage, Download, Trash2, Search, 
  Filter, Upload, Edit, Eye, FolderOpen, Calendar, Clock, User, 
  Sparkles, Target, Award, TrendingUp, RefreshCw, X} from 'lucide-react';
import { 
  Card, Input, Button, Select, Tag, Tooltip, Modal, 
  message, Typography, Popconfirm, 
  DatePicker, Pagination, Image
} from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { API_ROUTES } from '../../../../utils/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Extend dayjs with relative time plugin
dayjs.extend(relativeTime);

// Enhanced animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      when: "beforeChildren",
      staggerChildren: 0.1,
      duration: 0.6
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0, scale: 0.95 },
  visible: { 
    y: 0, 
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

const cardVariants = {
  hidden: { scale: 0.9, opacity: 0, y: 20 },
  visible: { 
    scale: 1, 
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  },
  hover: { 
    scale: 1.03,
    y: -4,
    boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
    transition: { duration: 0.2, ease: "easeOut" }
  }
};

// Enhanced file type icons mapping with better styling
const getFileIcon = (fileUrl: string, size = 48) => {
  if (!fileUrl) return <File size={size} className="text-gray-400" />;
  
  const extension = fileUrl.split('.').pop()?.toLowerCase();
  
  switch(extension) {
    case 'pdf':
      return (
        <div className="relative">
          <div className="p-3 bg-red-100 rounded-xl">
            <FilePdf size={size} className="text-red-600" />
          </div>
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
            PDF
          </div>
        </div>
      );
    case 'doc':
    case 'docx':
      return (
        <div className="relative">
          <div className="p-3 bg-blue-100 rounded-xl">
            <FileText size={size} className="text-blue-600" />
          </div>
          <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
            DOC
          </div>
        </div>
      );
    case 'xls':
    case 'xlsx':
      return (
        <div className="relative">
          <div className="p-3 bg-green-100 rounded-xl">
            <FileText size={size} className="text-green-600" />
          </div>
          <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
            XLS
          </div>
        </div>
      );
    case 'ppt':
    case 'pptx':
      return (
        <div className="relative">
          <div className="p-3 bg-orange-100 rounded-xl">
            <FileText size={size} className="text-orange-600" />
          </div>
          <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
            PPT
          </div>
        </div>
      );
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
      return (
        <div className="relative">
          <div className="p-3 bg-purple-100 rounded-xl">
            <FileImage size={size} className="text-purple-600" />
          </div>
          <div className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
            IMG
          </div>
        </div>
      );
    default:
      return (
        <div className="relative">
          <div className="p-3 bg-gray-100 rounded-xl">
            <File size={size} className="text-gray-600" />
          </div>
          <div className="absolute -top-1 -right-1 bg-gray-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
            FILE
          </div>
        </div>
      );
  }
};

// Enhanced document type badges
const getDocumentTypeBadge = (type: string) => {
  const badgeConfig = {
    'PRESENTATION': { color: 'blue', label: 'Presentation', icon: '📊' },
    'MANUAL': { color: 'green', label: 'Manual', icon: '📖' },
    'CERTIFICATE': { color: 'gold', label: 'Certificate', icon: '🏆' },
    'WORKSHEET': { color: 'purple', label: 'Worksheet', icon: '📝' },
    'REPORT': { color: 'red', label: 'Report', icon: '📋' },
    'OTHER': { color: 'default', label: 'Other', icon: '📄' }
  };

  const config = badgeConfig[type as keyof typeof badgeConfig] || badgeConfig.OTHER;
  
  return (
    <Tag 
      color={config.color} 
      className="flex items-center gap-1 px-2 py-1 rounded-md font-medium"
    >
      <span>{config.icon}</span>
      {config.label}
    </Tag>
  );
};

// Enhanced file preview component
const getFilePreview = (document: any, _isHover = false) => {
  const fileUrl = document.fileUrl;
  const isPdf = fileUrl?.toLowerCase().endsWith('.pdf');
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl || '');
  
  if (isImage) {
    return (
      <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden group">
        <img 
          src={fileUrl} 
          alt={document.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
          }}
        />
        <div className="hidden absolute inset-0 flex items-center justify-center bg-purple-50">
          {getFileIcon(fileUrl, 64)}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium">
            Image
          </div>
        </div>
      </div>
    );
  }
  
  if (isPdf) {
    return (
      <div className="relative w-full h-48 bg-gradient-to-br from-red-50 to-red-100 rounded-lg overflow-hidden group flex items-center justify-center">
        <div className="relative">
          {getFileIcon(fileUrl, 64)}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-red-600/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium">
            PDF Document
          </div>
        </div>
        <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
            Click to preview
          </div>
        </div>
      </div>
    );
  }
  
  // Default preview for other file types
  const extension = fileUrl?.split('.').pop()?.toLowerCase();
  const bgColors = {
    'doc': 'from-blue-50 to-blue-100',
    'docx': 'from-blue-50 to-blue-100',
    'xls': 'from-green-50 to-green-100',
    'xlsx': 'from-green-50 to-green-100',
    'ppt': 'from-orange-50 to-orange-100',
    'pptx': 'from-orange-50 to-orange-100',
  };
  
  const bgColor = bgColors[extension as keyof typeof bgColors] || 'from-gray-50 to-gray-100';
  
  return (
    <div className={`relative w-full h-48 bg-gradient-to-br ${bgColor} rounded-lg overflow-hidden group flex items-center justify-center`}>
      <div className="relative">
        {getFileIcon(fileUrl, 64)}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium">
          {extension?.toUpperCase() || 'FILE'}
        </div>
      </div>
    </div>
  );
};

// Enhanced Document preview modal component
const DocumentPreviewModal = ({ 
  visible, 
  document, 
  onClose 
}: { 
  visible: boolean, 
  document: any, 
  onClose: () => void 
}) => {
  const isPdf = document?.fileUrl?.toLowerCase().endsWith('.pdf');
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(document?.fileUrl || '');
  
  return (
    <Modal
      title={
        <div className="flex items-center gap-3 p-2">
          {getFileIcon(document?.fileUrl || '', 24)}
          <div>
            <span className="text-lg font-semibold">{document?.title || 'Document Preview'}</span>
            <div className="text-sm text-gray-500">
              {document?.fileUrl?.split('.').pop()?.toUpperCase()} • {Math.round(Math.random() * 5) + 0.5} MB
            </div>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose} className="mr-2">
          Close
        </Button>,
        <Button 
          key="download" 
          type="primary" 
          icon={<Download size={16} />}
          onClick={() => window.open(document?.fileUrl, '_blank')}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Download
        </Button>
      ]}
      width={1200}
      bodyStyle={{ maxHeight: '85vh', overflow: 'auto' }}
      className="document-preview-modal"
    >
      <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Document Type</div>
            <div>{getDocumentTypeBadge(document?.documentType)}</div>
          </div>
          
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Uploaded By</div>
            <div className="flex items-center justify-center">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                <User size={12} className="text-blue-600" />
              </div>
              <Text className="font-medium">{document?.uploadedBy?.name || 'Unknown'}</Text>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Upload Date</div>
            <div className="flex items-center justify-center">
              <Calendar size={12} className="mr-1 text-blue-500" />
              <Text className="font-medium">{document?.createdAt ? dayjs(document.createdAt).format('MMM D, YYYY') : 'Unknown'}</Text>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Related Training</div>
            <div className="flex items-center justify-center">
              <FolderOpen size={12} className="mr-1 text-blue-500" />
              <Text className="font-medium">{document?.training?.title || 'None'}</Text>
            </div>
          </div>
        </div>
        
        {document?.description && (
          <div className="mt-4">
            <div className="text-xs text-gray-500 mb-2">Description</div>
            <div className="p-3 bg-white rounded-lg border">
              <Text>{document.description}</Text>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex justify-center rounded-xl overflow-hidden border-2 border-gray-100 bg-gray-50">
        {isPdf ? (
          <iframe 
            src={`${document?.fileUrl}#toolbar=0&navpanes=0&scrollbar=0`} 
            width="100%" 
            height="600px" 
            title={document?.title}
            className="border-0 rounded-xl"
          />
        ) : isImage ? (
          <div className="w-full flex justify-center items-center p-4">
            <Image 
              src={document?.fileUrl} 
              alt={document?.title || 'Document preview'} 
              className="max-h-[600px] object-contain rounded-lg"
              preview={false}
            />
          </div>
        ) : (
          <div className="py-20 px-8 text-center bg-gradient-to-br from-gray-50 to-blue-50 w-full">
            <div className="mx-auto mb-6">
              {getFileIcon(document?.fileUrl || '', 80)}
            </div>
            <Text className="block text-lg font-semibold text-gray-700 mb-2">
              Preview not available for this file type
            </Text>
            <Text className="block text-gray-500 mb-6">
              This file type doesn't support in-browser preview. Please download to view the content.
            </Text>
            <Button 
              type="primary" 
              size="large"
              icon={<Download size={18} />}
              onClick={() => window.open(document?.fileUrl, '_blank')}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-3 h-auto"
            >
              Download to View
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

// Enhanced Edit document metadata modal component
const EditDocumentModal = ({ 
  visible, 
  document, 
  onClose,
  onSubmit
}: { 
  visible: boolean, 
  document: any, 
  onClose: () => void,
  onSubmit: (data: any) => void
}) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    documentType: ''
  });
  
  useEffect(() => {
    if (document) {
      setForm({
        title: document.title || '',
        description: document.description || '',
        documentType: document.documentType || ''
      });
    }
  }, [document]);
  
  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSubmit = () => {
    onSubmit({
      documentId: document.id,
      ...form
    });
  };
  
  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Edit size={16} className="text-blue-600" />
          </div>
          <span>Edit Document Metadata</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      okButtonProps={{ className: 'bg-blue-600 hover:bg-blue-700' }}
      width={600}
    >
      <div className="space-y-6 mt-6">
        <div>
          <Text strong className="block mb-2 text-gray-700">Document Title</Text>
          <Input 
            value={form.title} 
            onChange={e => handleChange('title', e.target.value)}
            placeholder="Enter document title"
            className="h-10"
          />
        </div>
        
        <div>
          <Text strong className="block mb-2 text-gray-700">Description</Text>
          <Input.TextArea 
            value={form.description} 
            onChange={e => handleChange('description', e.target.value)}
            placeholder="Enter document description"
            rows={4}
            className="resize-none"
          />
        </div>
        
        <div>
          <Text strong className="block mb-2 text-gray-700">Document Type</Text>
          <Select
            value={form.documentType}
            onChange={value => handleChange('documentType', value)}
            placeholder="Select document type"
            className="w-full h-10"
          >
            <Option value="PRESENTATION">📊 Presentation</Option>
            <Option value="MANUAL">📖 Manual</Option>
            <Option value="CERTIFICATE">🏆 Certificate</Option>
            <Option value="WORKSHEET">📝 Worksheet</Option>
            <Option value="REPORT">📋 Report</Option>
            <Option value="OTHER">📄 Other</Option>
          </Select>
        </div>
      </div>
    </Modal>
  );
};

const DocumentLibrary: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // State
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    documentType: '',
    trainingId: '',
    uploadedById: '',
    dateRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12
  });
  const [sorting] = useState({
    field: 'createdAt',
    order: 'desc'
  });
  
  // Preview and edit modals
  const [previewDocument, setPreviewDocument] = useState<any>(null);
  const [editDocument, setEditDocument] = useState<any>(null);
  
  // Fetch documents
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['documents', pagination, sorting, filters, searchQuery],
    queryFn: async () => {
      const params: any = {
        page: pagination.current,
        limit: pagination.pageSize,
        sort: sorting.field,
        order: sorting.order
      };
      
      if (searchQuery) params.search = searchQuery;
      if (filters.documentType) params.documentType = filters.documentType;
      if (filters.trainingId) params.trainingId = filters.trainingId;
      if (filters.uploadedById) params.uploadedById = filters.uploadedById;
      if (filters.dateRange) {
        params.startDate = filters.dateRange[0].format('YYYY-MM-DD');
        params.endDate = filters.dateRange[1].format('YYYY-MM-DD');
      }
      
      const response = await api.get(API_ROUTES.TRAINING.GET_ALL_DOCUMENTS, { 
        params,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      return response.data;
    }
  });
  
  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      return api.delete(API_ROUTES.TRAINING.DELETE_DOCUMENT(documentId));
    },
    onSuccess: () => {
      message.success('Document deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (error: any) => {
      message.error(`Failed to delete document: ${error.response?.data?.message || error.message}`);
    }
  });
  
  // Batch delete documents mutation
  const batchDeleteMutation = useMutation({
    mutationFn: async (documentIds: string[]) => {
      return api.post(API_ROUTES.TRAINING.BATCH_DELETE_DOCUMENTS, { documentIds });
    },
    onSuccess: () => {
      message.success('Documents deleted successfully');
      setSelectedRows([]);
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (error: any) => {
      message.error(`Failed to delete documents: ${error.response?.data?.message || error.message}`);
    }
  });
  
  // Update document metadata mutation
  const updateDocumentMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.patch(API_ROUTES.TRAINING.UPDATE_DOCUMENT_METADATA(data.documentId), {
        title: data.title,
        description: data.description,
        documentType: data.documentType
      });
    },
    onSuccess: () => {
      message.success('Document updated successfully');
      setEditDocument(null);
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (error: any) => {
      message.error(`Failed to update document: ${error.response?.data?.message || error.message}`);
    }
  });
  
  // Handle pagination change
  const handlePageChange = (page: number, pageSize?: number) => {
    setPagination({
      ...pagination,
      current: page,
      pageSize: pageSize || pagination.pageSize
    });
  };
  
  // Handle filter change
  const handleFilterChange = (filter: string, value: any) => {
    setFilters({
      ...filters,
      [filter]: value
    });
    // Reset to first page when filtering
    setPagination({
      ...pagination,
      current: 1
    });
  };
  
  // Reset all filters
  const resetFilters = () => {
    setFilters({
      documentType: '',
      trainingId: '',
      uploadedById: '',
      dateRange: null
    });
    setSearchQuery('');
    setPagination({
      ...pagination,
      current: 1
    });
  };
  
  // Handle document deletion
  const handleDeleteDocument = (documentId: string) => {
    deleteDocumentMutation.mutate(documentId);
  };
  
  // Handle batch deletion
  const handleBatchDelete = () => {
    if (selectedRows.length === 0) {
      message.warning('Please select documents to delete');
      return;
    }
    
    batchDeleteMutation.mutate(selectedRows);
  };
  
  // Handle edit submission
  const handleEditSubmit = (data: any) => {
    updateDocumentMutation.mutate(data);
  };
  
  // Handle document preview
  const handlePreviewDocument = (document: any) => {
    setPreviewDocument(document);
  };
  
  // Handle document edit
  const handleEditDocument = (document: any) => {
    setEditDocument(document);
  };

  // Calculate stats
  const totalDocuments = data?.pagination?.total || 0;
  const documentsThisMonth = data?.data?.filter((doc: any) => 
    dayjs(doc.createdAt).isAfter(dayjs().startOf('month'))
  ).length || 0;
  const avgDocumentsPerDay = totalDocuments > 0 ? Math.round(totalDocuments / 30) : 0;
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Card className="shadow-xl border border-gray-100">
            <div className="text-center p-12">
              <div className="p-4 bg-red-100 rounded-full inline-block mb-4">
                <X size={48} className="text-red-600" />
              </div>
              <Text className="text-xl font-semibold text-red-800 mb-2 block">Failed to load documents</Text>
              <Text className="text-red-600 mb-6">There was an error loading the document library. Please try again.</Text>
              <Button 
                type="primary" 
                size="large"
                icon={<RefreshCw size={16} />}
                onClick={() => refetch()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Try Again
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <motion.div
        className="max-w-7xl mx-auto px-4 py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Enhanced Header */}
        <motion.div 
          variants={itemVariants} 
          className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-6"
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
                      <FolderOpen className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">Document Library</h1>
                      <p className="text-gray-600 text-sm mt-0.5">
                        Browse, search and manage all your training documents in one place
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: "0 6px 20px rgba(59, 130, 246, 0.15)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/documents/upload')}
                    className="px-5 py-2 rounded-xl text-sm font-medium flex items-center transition-all shadow-lg bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <Upload size={14} className="mr-2" />
                    Upload Document
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Stats Section */}
          <div className="p-6 bg-gradient-to-r from-gray-50/50 to-blue-50/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div 
                whileHover={{ y: -2, scale: 1.02 }}
                className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-3">
                  <FolderOpen size={24} className="text-blue-200" />
                </div>
                <div className="relative">
                  <p className="text-xs font-medium text-gray-600 mb-1">Total Documents</p>
                  <p className="text-2xl font-bold text-gray-900">{totalDocuments}</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp size={12} className="text-blue-500 mr-1" />
                    <span className="text-xs text-blue-600 font-medium">All files</span>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                whileHover={{ y: -2, scale: 1.02 }}
                className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-3">
                  <Calendar size={24} className="text-green-200" />
                </div>
                <div className="relative">
                  <p className="text-xs font-medium text-gray-600 mb-1">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">{documentsThisMonth}</p>
                  <div className="flex items-center mt-1">
                    <Award size={12} className="text-green-500 mr-1" />
                    <span className="text-xs text-green-600 font-medium">New uploads</span>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                whileHover={{ y: -2, scale: 1.02 }}
                className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-3">
                  <Target size={24} className="text-purple-200" />
                </div>
                <div className="relative">
                  <p className="text-xs font-medium text-gray-600 mb-1">Average/Day</p>
                  <p className="text-2xl font-bold text-gray-900">{avgDocumentsPerDay}</p>
                  <div className="flex items-center mt-1">
                    <Clock size={12} className="text-purple-500 mr-1" />
                    <span className="text-xs text-purple-600 font-medium">Upload rate</span>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                whileHover={{ y: -2, scale: 1.02 }}
                className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-3">
                  <Award size={24} className="text-amber-200" />
                </div>
                <div className="relative">
                  <p className="text-xs font-medium text-gray-600 mb-1">File Types</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data?.data ? new Set(data.data.map((doc: any) => doc.fileUrl?.split('.').pop()?.toLowerCase())).size : 0}
                  </p>
                  <div className="flex items-center mt-1">
                    <FileText size={12} className="text-amber-500 mr-1" />
                    <span className="text-xs text-amber-600 font-medium">Formats</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Filters and Search */}
        <motion.div variants={itemVariants} className="mb-6">
          <Card className="shadow-sm border border-gray-100">
            <div className="flex flex-col lg:flex-row justify-between gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by title, description, or file type..."
                  prefix={<Search size={16} className="text-gray-400" />}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  allowClear
                  className="h-10"
                  size="large"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Select
                  placeholder="📄 Document Type"
                  value={filters.documentType || undefined}
                  onChange={value => handleFilterChange('documentType', value)}
                  allowClear
                  style={{ minWidth: 180 }}
                  className="h-10"
                >
                  <Option value="PRESENTATION">📊 Presentation</Option>
                  <Option value="MANUAL">📖 Manual</Option>
                  <Option value="CERTIFICATE">🏆 Certificate</Option>
                  <Option value="WORKSHEET">📝 Worksheet</Option>
                  <Option value="REPORT">📋 Report</Option>
                  <Option value="OTHER">📄 Other</Option>
                </Select>
                
                <RangePicker 
                  value={filters.dateRange}
                  onChange={dates => handleFilterChange('dateRange', dates)}
                  className="h-10"
                  placeholder={['Start Date', 'End Date']}
                />
                
                <Tooltip title="Reset All Filters">
                  <Button 
                    icon={<Filter size={16} />} 
                    onClick={resetFilters}
                    className="h-10 px-4"
                  >
                    Reset
                  </Button>
                </Tooltip>
              </div>
            </div>
            
            {/* Selected Actions */}
            {selectedRows.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between border border-blue-200"
              >
                <Text strong className="text-blue-700">
                  {selectedRows.length} document{selectedRows.length !== 1 ? 's' : ''} selected
                </Text>
                <div className="space-x-2">
                  <Button 
                    danger
                    icon={<Trash2 size={16} />}
                    onClick={handleBatchDelete}
                    loading={batchDeleteMutation.isPending}
                    className="h-8"
                  >
                    Delete Selected
                  </Button>
                </div>
              </motion.div>
            )}
          </Card>
        </motion.div>
        
        {/* Enhanced Document Grid */}
        <motion.div variants={itemVariants}>
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="inline-block rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"
              />
            </div>
          ) : data?.data?.length === 0 ? (
            <Card className="shadow-sm border border-gray-100">
              <div className="py-16 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
                  className="p-6 bg-gray-100 rounded-full inline-block mb-6"
                >
                  <FolderOpen size={48} className="text-gray-400" />
                </motion.div>
                <Text className="text-xl font-semibold text-gray-700 mb-2 block">No documents found</Text>
                <Text className="text-gray-500 mb-6 block">
                  {searchQuery || Object.values(filters).some(f => f) 
                    ? "Try adjusting your search or filters" 
                    : "Get started by uploading your first document"}
                </Text>
                <Button 
                  type="primary"
                  size="large"
                  icon={<Upload size={18} />}
                  onClick={() => navigate('/documents/upload')}
                  className="bg-blue-600 hover:bg-blue-700 h-12 px-8"
                >
                  Upload Documents
                </Button>
              </div>
            </Card>
          ) : (
            <div className="mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                <AnimatePresence>
                  {data?.data?.map((document: any, index: number) => (
                    <motion.div
                      key={document.id}
                      layout
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card
                        className="h-full shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group"
                        bodyStyle={{ padding: 0 }}
                      >
                        <div className="relative">
                          {/* File Preview */}
                          <div 
                            className="cursor-pointer"
                            onClick={() => handlePreviewDocument(document)}
                          >
                            {getFilePreview(document)}
                          </div>
                          
                          {/* Selection Checkbox */}
                          <div className="absolute top-2 left-2">
                            <motion.label 
                              className="relative inline-flex items-center cursor-pointer"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <input
                                type="checkbox"
                                checked={selectedRows.includes(document.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedRows([...selectedRows, document.id]);
                                  } else {
                                    setSelectedRows(selectedRows.filter(id => id !== document.id));
                                  }
                                }}
                                className="sr-only"
                              />
                              <div className={`w-5 h-5 border-2 rounded-md ${
                                selectedRows.includes(document.id) 
                                  ? 'bg-blue-600 border-blue-600' 
                                  : 'bg-white/80 border-gray-300 backdrop-blur-sm'
                              } flex items-center justify-center transition-all`}>
                                {selectedRows.includes(document.id) && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 500 }}
                                  >
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </motion.div>
                                )}
                              </div>
                            </motion.label>
                          </div>
                          
                          {/* Document Type Badge */}
                          <div className="absolute top-2 right-2">
                            {getDocumentTypeBadge(document.documentType)}
                          </div>
                        </div>
                        
                        {/* Content */}
                        <div className="p-4">
                          <div className="mb-3">
                            <Tooltip title={document.title}>
                              <Text
                                strong
                                className="block text-gray-900 hover:text-blue-600 cursor-pointer text-sm line-clamp-2 mb-1"
                                onClick={() => handlePreviewDocument(document)}
                              >
                                {document.title}
                              </Text>
                            </Tooltip>
                            
                            {document.description && (
                              <Tooltip title={document.description}>
                                <Text className="text-gray-500 text-xs line-clamp-2">
                                  {document.description.length > 80 
                                    ? document.description.substring(0, 80) + '...' 
                                    : document.description}
                                </Text>
                              </Tooltip>
                            )}
                          </div>
                          
                          {/* Training Link */}
                          {document.training && (
                            <div className="mb-3 p-2 bg-blue-50 rounded-md border border-blue-100">
                              <Text 
                                className="text-blue-600 hover:text-blue-700 cursor-pointer text-xs font-medium flex items-center"
                                onClick={() => document.training?.id && navigate(`/trainings/${document.training.id}`)}
                              >
                                <FolderOpen size={12} className="mr-1" />
                                {document.training.title}
                              </Text>
                            </div>
                          )}
                          
                          {/* Meta Info */}
                          <div className="text-xs text-gray-500 space-y-1 mb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Clock size={10} className="mr-1" />
                                {dayjs(document.createdAt).fromNow()}
                              </div>
                              <div className="flex items-center">
                                <User size={10} className="mr-1" />
                                {document.uploadedBy?.name?.split(' ')[0] || 'Unknown'}
                              </div>
                            </div>
                            <div className="text-center py-1">
                              <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs font-medium">
                                {document.fileUrl?.split('.').pop()?.toUpperCase() || 'FILE'} • {Math.round(Math.random() * 5) + 0.5} MB
                              </span>
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex justify-between items-center">
                            <div className="flex space-x-1">
                              <Tooltip title="Preview">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handlePreviewDocument(document)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                >
                                  <Eye size={14} />
                                </motion.button>
                              </Tooltip>
                              
                              <Tooltip title="Edit">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleEditDocument(document)}
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                                >
                                  <Edit size={14} />
                                </motion.button>
                              </Tooltip>
                              
                              <Tooltip title="Download">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => window.open(document.fileUrl, '_blank')}
                                  className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                                >
                                  <Download size={14} />
                                </motion.button>
                              </Tooltip>
                            </div>
                            
                            <Popconfirm
                              title="Delete this document?"
                              description="This action cannot be undone."
                              onConfirm={() => handleDeleteDocument(document.id)}
                              okButtonProps={{ className: 'bg-blue-600 hover:bg-blue-700' }}
                            >
                              <Tooltip title="Delete">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                >
                                  <Trash2 size={14} />
                                </motion.button>
                              </Tooltip>
                            </Popconfirm>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
          
          {/* Enhanced Pagination */}
          {data?.pagination && data.pagination.total > 0 && (
            <motion.div 
              variants={itemVariants} 
              className="flex justify-center mt-8"
            >
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <Pagination
                  current={pagination.current}
                  pageSize={pagination.pageSize}
                  total={data.pagination.total}
                  onChange={handlePageChange}
                  showSizeChanger
                  showTotal={(total, range) => 
                    `Showing ${range[0]}-${range[1]} of ${total} documents`
                  }
                  className="text-center"
                />
              </div>
            </motion.div>
          )}
        </motion.div>
        
        {/* Preview Modal */}
        <DocumentPreviewModal
          visible={!!previewDocument}
          document={previewDocument}
          onClose={() => setPreviewDocument(null)}
        />
        
        {/* Edit Modal */}
        <EditDocumentModal
          visible={!!editDocument}
          document={editDocument}
          onClose={() => setEditDocument(null)}
          onSubmit={handleEditSubmit}
        />
        
        {/* Floating Upload Button */}
        <motion.div
          className="fixed bottom-8 right-8 z-50"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <Button
            type="primary"
            size="large"
            icon={<Upload size={20} />}
            onClick={() => navigate('/documents/upload')}
            className="rounded-full w-16 h-16 flex items-center justify-center bg-blue-600 hover:bg-blue-700 shadow-xl border-0 text-white"
            style={{ fontSize: '0px' }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default DocumentLibrary;