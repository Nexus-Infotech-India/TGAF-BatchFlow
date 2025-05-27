import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardCheck, AlertCircle, Plus, Save, 
  RefreshCw, Trash2, CheckCircle2,
  User, Check, X, Filter, 
  MessageCircle, Building, List, BookOpen, 
  ChevronDown, Sparkles, TrendingUp,
  Award, Star, Eye
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_ROUTES } from '../../../utils/api';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import debounce from 'lodash/debounce';

// Types
interface InspectionItem {
  id: string;
  auditId: string;
  areaName: string;
  itemName: string;
  description: string;
  standardReference?: string;
  isCompliant: boolean | null;
  comments?: string;
  evidence?: string;
  inspectedById?: string;
  createdAt: string;
  updatedAt: string;
  inspectedBy?: {
    id: string;
    name: string;
  };
}

interface AreaChecklist {
  areaName: string;
  items: InspectionItem[];
  totalItems: number;
  compliantItems: number;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface InspectionChecklistProps {
  auditId?: string;
}

// Enhanced animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

// Enhanced Status Badge
interface StatusBadgeProps {
  status: 'compliant' | 'non-compliant' | 'pending';
  size?: 'sm' | 'md';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const configs = {
    compliant: {
      bg: 'bg-emerald-100',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      icon: <CheckCircle2 size={size === 'sm' ? 12 : 14} />,
      label: 'Compliant'
    },
    'non-compliant': {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-200',
      icon: <X size={size === 'sm' ? 12 : 14} />,
      label: 'Non-Compliant'
    },
    pending: {
      bg: 'bg-amber-100',
      text: 'text-amber-800',
      border: 'border-amber-200',
      icon: <AlertCircle size={size === 'sm' ? 12 : 14} />,
      label: 'Pending'
    }
  };

  const config = configs[status];
  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';

  return (
    <motion.span
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center rounded-full border font-medium ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      {config.icon}
      <span className="ml-1">{config.label}</span>
    </motion.span>
  );
};

const AuditInspectionlist: React.FC<InspectionChecklistProps> = ({ auditId: propAuditId }) => {
  const { auditId: paramAuditId } = useParams<{ auditId: string }>();
  const auditId = propAuditId || paramAuditId;
  
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [showAll, setShowAll] = useState(true);
  const [expandedArea, setExpandedArea] = useState<string | null>(null);
  const [, setInspectingItem] = useState<string | null>(null);
  const [] = useState<string | null>(null);
  const [area, setArea] = useState('');
  
  const [newItems, setNewItems] = useState<Array<{
    itemName: string;
    description: string;
    standardReference?: string;
  }>>([{ itemName: '', description: '', standardReference: '' }]);

  const [] = useState<{
    isCompliant: boolean | null;
    comments: string;
  }>({ isCompliant: null, comments: '' });

  const [editableComments, setEditableComments] = useState<Record<string, string>>({});

  const debouncedUpdateComment = useRef(
    debounce((id: string, comment: string) => {
      updateInspectionItemMutation.mutate({
        id,
        data: { comments: comment }
      });
    }, 1500)
  ).current;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['inspectionChecklists', auditId],
    queryFn: async () => {
      if (!auditId) return { count: 0, checklists: [] };
      const response = await axios.get(API_ROUTES.AUDIT.GET_INSPECTION_CHECKLISTS(auditId), {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
      });
      return response.data;
    },
    enabled: !!auditId,
  });

  useEffect(() => {
    if (data?.checklists) {
      const commentMap: Record<string, string> = {};
      data.checklists.forEach((area: AreaChecklist) => {
        area.items.forEach((item: InspectionItem) => {
          commentMap[item.id] = item.comments || '';
        });
      });
      setEditableComments(commentMap);
    }
  }, [data?.checklists]);

  const isAreaFullyInspected = (items: InspectionItem[]) => {
    return items.every(item => item.isCompliant !== null);
  };

  const getAreaCompliancePercentage = (area: AreaChecklist) => {
    if (area.totalItems === 0) return 0;
    return Math.round((area.compliantItems / area.totalItems) * 100);
  };

  const createInspectionMutation = useMutation({
    mutationFn: async ({ areaName, items }: { areaName: string, items: typeof newItems }) => {
      if (!auditId) throw new Error('Audit ID is required');
      console.log('Creating inspection checklist:', { areaName, items });
      
      try {
        const response = await axios.post(
          API_ROUTES.AUDIT.CREATE_INSPECTION_CHECKLIST(auditId),
          { areaName, items },
          { headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } }
        );
        console.log('Response received:', response.data);
        return response.data;
      } catch (error) {
        console.error('Error in API call:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Mutation successful:', data);
      queryClient.invalidateQueries({ queryKey: ['inspectionChecklists', auditId] });
      setIsCreating(false);
      setArea('');
      setNewItems([{ itemName: '', description: '', standardReference: '' }]);
      toast.success('Inspection checklist created successfully');
    },
    onError: (err: any) => {
      console.error('Mutation error details:', err);
      toast.error(`Failed to create inspection checklist: ${err.response?.data?.error || err.message}`);
    },
  });

  const updateInspectionItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<InspectionItem> }) => {
      console.log('Updating item:', id, data);
      const response = await axios.put(
        API_ROUTES.AUDIT.UPDATE_INSPECTION_ITEM(id),
        data,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspectionChecklists', auditId] });
      setInspectingItem(null);
      toast.success('Inspection item updated', { id: 'update-inspection-item', duration: 2000 });
    },
    onError: (err: any) => {
      toast.error(`Failed to update inspection item: ${err.response?.data?.error || err.message}`);
    },
  });

  const addNewItem = () => {
    setNewItems([...newItems, { itemName: '', description: '', standardReference: '' }]);
  };

  const removeNewItem = (index: number) => {
    setNewItems(newItems.filter((_, i) => i !== index));
  };

  const updateNewItem = (index: number, field: string, value: any) => {
    const updated = [...newItems];
    updated[index] = { ...updated[index], [field]: value };
    setNewItems(updated);
  };

  const handleSubmitNewItems = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!area.trim()) {
      toast.error('Area name is required');
      return;
    }
    
    if (newItems.some(item => !item.itemName.trim() || !item.description.trim())) {
      toast.error('All inspection items must have names and descriptions');
      return;
    }
    
    createInspectionMutation.mutate({ areaName: area, items: newItems });
  };




  const toggleAreaExpansion = (areaName: string) => {
    setExpandedArea(prev => prev === areaName ? null : areaName);
  };

  const quickUpdateStatus = (id: string, isCompliant: boolean) => {
    updateInspectionItemMutation.mutate({
      id,
      data: { isCompliant }
    });
  };

  const handleCommentChange = (id: string, value: string) => {
    setEditableComments({
      ...editableComments,
      [id]: value
    });
    debouncedUpdateComment(id, value);
  };

  const filteredAreas = data?.checklists?.filter((area: AreaChecklist) => 
    showAll || !isAreaFullyInspected(area.items)
  ) || [];

  const totalItems = data?.checklists?.reduce((acc: number, area: AreaChecklist) => acc + area.totalItems, 0) || 0;
  const inspectedItems = data?.checklists?.reduce((acc: number, area: AreaChecklist) => {
    return acc + area.items.filter(item => item.isCompliant !== null).length;
  }, 0) || 0;
  const compliantItems = data?.checklists?.reduce((acc: number, area: AreaChecklist) => acc + area.compliantItems, 0) || 0;
  const inspectionProgress = totalItems > 0 ? Math.round((inspectedItems / totalItems) * 100) : 0;
  const complianceRate = inspectedItems > 0 ? Math.round((compliantItems / inspectedItems) * 100) : 0;

  const getItemStatus = (item: InspectionItem): 'compliant' | 'non-compliant' | 'pending' => {
    if (item.isCompliant === true) return 'compliant';
    if (item.isCompliant === false) return 'non-compliant';
    return 'pending';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-4 py-8"
      >
        {/* Main Container with unified styling */}
        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
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
                      <ClipboardCheck className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">Inspection Checklist</h1>
                      <p className="text-gray-600 text-sm mt-0.5">
                        Document inspection findings and compliance status across all audit areas
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowAll(!showAll)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center transition-all shadow-sm ${
                      showAll
                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        : "bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200"
                    }`}
                  >
                    {showAll ? (
                      <>
                        <Filter size={14} className="mr-2" />
                        Show All
                      </>
                    ) : (
                      <>
                        <Eye size={14} className="mr-2" />
                        Pending Only
                      </>
                    )}
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: "0 6px 20px rgba(59, 130, 246, 0.15)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsCreating(!isCreating)}
                    className={`px-5 py-2 rounded-xl text-sm font-medium flex items-center transition-all shadow-lg ${
                      isCreating
                        ? "bg-red-500 text-white hover:bg-red-600"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {isCreating ? (
                      <>
                        <X size={14} className="mr-2" />
                        Cancel
                      </>
                    ) : (
                      <>
                        <Plus size={14} className="mr-2" />
                        Add Area
                      </>
                    )}
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
                  <ClipboardCheck size={24} className="text-blue-200" />
                </div>
                <div className="relative">
                  <p className="text-xs font-medium text-gray-600 mb-1">Total Items</p>
                  <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp size={12} className="text-blue-500 mr-1" />
                    <span className="text-xs text-blue-600 font-medium">Inspection items</span>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                whileHover={{ y: -2, scale: 1.02 }}
                className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-3">
                  <CheckCircle2 size={24} className="text-green-200" />
                </div>
                <div className="relative">
                  <p className="text-xs font-medium text-gray-600 mb-1">Compliant</p>
                  <p className="text-2xl font-bold text-gray-900">{compliantItems}</p>
                  <div className="flex items-center mt-1">
                    <Award size={12} className="text-green-500 mr-1" />
                    <span className="text-xs text-green-600 font-medium">Passed inspection</span>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                whileHover={{ y: -2, scale: 1.02 }}
                className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-3">
                  <AlertCircle size={24} className="text-amber-200" />
                </div>
                <div className="relative">
                  <p className="text-xs font-medium text-gray-600 mb-1">Progress</p>
                  <div className="flex items-center">
                    <p className="text-2xl font-bold text-gray-900">{inspectionProgress}%</p>
                    <span className="text-xs text-gray-500 ml-2">({inspectedItems}/{totalItems})</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <motion.div 
                      initial={{ width: "0%" }}
                      animate={{ width: `${inspectionProgress}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="bg-gradient-to-r from-amber-500 to-orange-600 h-1.5 rounded-full"
                    ></motion.div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                whileHover={{ y: -2, scale: 1.02 }}
                className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-3">
                  <Star size={24} className="text-purple-200" />
                </div>
                <div className="relative">
                  <p className="text-xs font-medium text-gray-600 mb-1">Compliance Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{complianceRate}%</p>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <motion.div 
                      initial={{ width: "0%" }}
                      animate={{ width: `${complianceRate}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className={`h-1.5 rounded-full ${
                        complianceRate >= 80 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                          : complianceRate >= 50 
                            ? 'bg-gradient-to-r from-amber-500 to-orange-600' 
                            : 'bg-gradient-to-r from-red-500 to-red-600'
                      }`}
                    ></motion.div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
          
          {/* Create Form Section */}
          <AnimatePresence>
            {isCreating && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="overflow-hidden border-b border-gray-100"
              >
                <div className="p-6 bg-gradient-to-r from-gray-50/50 to-blue-50/50">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <div className="p-1.5 bg-blue-100 rounded-lg mr-2">
                      <Building size={16} className="text-blue-600" />
                    </div>
                    Add New Inspection Area
                  </h3>
                  
                  <form onSubmit={handleSubmitNewItems} className="space-y-4">
                    <div className="p-4 bg-white rounded-xl border border-gray-200">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Area Name*
                        </label>
                        <input
                          type="text"
                          value={area}
                          onChange={(e) => setArea(e.target.value)}
                          placeholder="Enter area name (e.g., Production Floor, Lab Area, Storage Room)"
                          className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          The physical location or department being inspected
                        </p>
                      </div>
                    </div>
                    
                    <h4 className="font-semibold text-gray-800 flex items-center text-sm">
                      <List size={14} className="mr-1 text-blue-600" />
                      Inspection Items
                    </h4>
                    
                    {newItems.map((item, index) => (
                      <motion.div 
                        key={index} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 bg-white rounded-xl border border-gray-200"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                              {index + 1}
                            </div>
                            <h4 className="font-semibold text-gray-800 text-sm">Inspection Item</h4>
                          </div>
                          {newItems.length > 1 && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              type="button"
                              onClick={() => removeNewItem(index)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 size={14} />
                            </motion.button>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Item Name*
                            </label>
                            <input
                              type="text"
                              value={item.itemName}
                              onChange={(e) => updateNewItem(index, 'itemName', e.target.value)}
                              placeholder="Enter item name"
                              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Description*
                            </label>
                            <textarea
                              value={item.description}
                              onChange={(e) => updateNewItem(index, 'description', e.target.value)}
                              placeholder="Describe what to inspect for this item"
                              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                              rows={2}
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Standard Reference
                            </label>
                            <input
                              type="text"
                              value={item.standardReference || ''}
                              onChange={(e) => updateNewItem(index, 'standardReference', e.target.value)}
                              placeholder="Enter reference to relevant standard or regulation (optional)"
                              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Optional: Reference to standard, SOP, or regulation this item relates to
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    
                    <div className="flex justify-between items-center pt-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={addNewItem}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center font-medium transition-all text-sm"
                      >
                        <Plus size={14} className="mr-1" />
                        Add Another Item
                      </motion.button>
                      
                      <div className="flex gap-3">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => setIsCreating(false)}
                          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
                        >
                          Cancel
                        </motion.button>
                        
                        <motion.button
                          whileHover={{ scale: 1.02, boxShadow: "0 6px 20px rgba(59, 130, 246, 0.15)" }}
                          whileTap={{ scale: 0.98 }}
                          type="submit"
                          disabled={createInspectionMutation.isPending}
                          className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center font-medium shadow-lg transition-all text-sm ${
                            createInspectionMutation.isPending ? "opacity-70 cursor-not-allowed" : ""
                          }`}
                        >
                          {createInspectionMutation.isPending ? (
                            <>
                              <RefreshCw size={14} className="mr-1 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save size={14} className="mr-1" />
                              Save Area
                            </>
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Areas Section */}
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
                    ease: "linear", 
                    repeat: Infinity,
                  }}
                  className="rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"
                />
              </div>
            ) : isError ? (
              <div className="p-12 text-center">
                <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
                <h3 className="text-lg font-semibold text-red-800 mb-2">Error loading inspection checklists</h3>
                <p className="text-red-600">{(error as any)?.message || "Please try again later"}</p>
              </div>
            ) : filteredAreas.length === 0 ? (
              <div className="p-12 text-center">
                {data?.checklists?.length === 0 ? (
                  <>
                    <div className="p-3 bg-blue-100 rounded-full inline-block mb-4">
                      <ClipboardCheck size={36} className="text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Start Your Inspection</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto text-sm">
                      Create inspection areas and items to begin documenting compliance status and findings.
                    </p>
                    {!isCreating && (
                      <motion.button
                        whileHover={{ scale: 1.02, boxShadow: "0 6px 20px rgba(59, 130, 246, 0.15)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsCreating(true)}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center font-medium shadow-lg text-sm"
                      >
                        <Plus size={14} className="mr-1" />
                        Create First Area
                      </motion.button>
                    )}
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-green-100 rounded-full inline-block mb-4">
                      <CheckCircle2 size={36} className="text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {showAll ? "No areas match your filter" : "All areas inspected!"}
                    </h3>
                    <p className="text-gray-600 mb-6 text-sm">
                      {showAll ? "Try adjusting your filter settings" : "Congratulations on completing all inspections"}
                    </p>
                    {!showAll && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowAll(true)}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center font-medium shadow-lg text-sm"
                      >
                        <Eye size={14} className="mr-1" />
                        View All Areas
                      </motion.button>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="p-6 space-y-4">
                {filteredAreas.map((area: AreaChecklist, areaIndex: number) => (
                  <motion.div 
                    key={area.areaName}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: areaIndex * 0.1 }}
                    className="bg-gradient-to-r from-gray-50/50 to-blue-50/50 rounded-xl border border-gray-100 overflow-hidden"
                  >
                    <div 
                      onClick={() => toggleAreaExpansion(area.areaName)}
                      className={`p-4 flex justify-between items-center cursor-pointer border-b border-gray-100 transition-all hover:bg-gray-50/50 ${
                        isAreaFullyInspected(area.items) ? 'bg-gradient-to-r from-gray-50 to-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          isAreaFullyInspected(area.items) 
                            ? area.compliantItems === area.totalItems 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-amber-100 text-amber-600'
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          {isAreaFullyInspected(area.items) ? (
                            area.compliantItems === area.totalItems ? (
                              <CheckCircle2 size={16} />
                            ) : (
                              <AlertCircle size={16} />
                            )
                          ) : (
                            <Building size={16} />
                          )}
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">{area.areaName}</h3>
                          <div className="flex items-center text-xs text-gray-600 mt-0.5 space-x-3">
                            <span className="font-medium">
                              {area.compliantItems} / {area.totalItems} compliant
                            </span>
                            
                            <StatusBadge 
                              status={isAreaFullyInspected(area.items) ? 'compliant' : 'pending'} 
                              size="sm" 
                            />
                            
                            {area.compliantItems !== area.totalItems && isAreaFullyInspected(area.items) && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                                Issues Found
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="hidden sm:flex items-center">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden mr-2">
                            <motion.div 
                              initial={{ width: "0%" }}
                              animate={{ width: `${getAreaCompliancePercentage(area)}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className={`h-full rounded-full ${
                                getAreaCompliancePercentage(area) >= 80 
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                                  : getAreaCompliancePercentage(area) >= 50 
                                    ? 'bg-gradient-to-r from-amber-500 to-orange-600' 
                                    : 'bg-gradient-to-r from-red-500 to-red-600'
                              }`}
                            />
                          </div>
                          <span className="text-xs font-bold text-gray-700">
                            {getAreaCompliancePercentage(area)}%
                          </span>
                        </div>
                        
                        <motion.div
                          animate={{ rotate: expandedArea === area.areaName ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="text-gray-400" size={16} />
                        </motion.div>
                      </div>
                    </div>
                    
                    <AnimatePresence>
                      {expandedArea === area.areaName && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 bg-white/80">
                            <div className="space-y-3">
                              {area.items.map((item, itemIndex) => (
                                <motion.div
                                  key={item.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: itemIndex * 0.05 }}
                                  className={`bg-white rounded-lg border transition-all duration-300 hover:shadow-sm ${
                                    item.isCompliant === true 
                                      ? 'border-green-200 bg-green-50/30' 
                                      : item.isCompliant === false 
                                        ? 'border-red-200 bg-red-50/30' 
                                        : 'border-gray-200'
                                  }`}
                                >
                                  <div className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex-1">
                                        <h4 className="text-sm font-semibold text-gray-900 mb-1">{item.itemName}</h4>
                                        <p className="text-xs text-gray-600 mb-2 leading-relaxed">{item.description}</p>
                                        
                                        {item.standardReference && (
                                          <div className="flex items-center text-xs text-blue-600 mb-2">
                                            <BookOpen size={12} className="mr-1" />
                                            <span className="font-medium">{item.standardReference}</span>
                                          </div>
                                        )}
                                        
                                        {item.inspectedBy && (
                                          <div className="flex items-center text-xs text-gray-500">
                                            <User size={12} className="mr-1" />
                                            <span>Inspected by {item.inspectedBy.name}</span>
                                          </div>
                                        )}
                                      </div>
                                      
                                      <div className="flex flex-col items-end space-y-2">
                                        <StatusBadge status={getItemStatus(item)} size="sm" />
                                        
                                        <div className="flex space-x-1">
                                          {item.isCompliant !== true && (
                                            <motion.button
                                              whileHover={{ scale: 1.05 }}
                                              whileTap={{ scale: 0.95 }}
                                              onClick={() => quickUpdateStatus(item.id, true)}
                                              className="p-1.5 bg-green-100 text-green-600 rounded-md hover:bg-green-200 transition-all"
                                              title="Mark as compliant"
                                            >
                                              <Check size={12} />
                                            </motion.button>
                                          )}
                                          
                                          {item.isCompliant !== false && (
                                            <motion.button
                                              whileHover={{ scale: 1.05 }}
                                              whileTap={{ scale: 0.95 }}
                                              onClick={() => quickUpdateStatus(item.id, false)}
                                              className="p-1.5 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-all"
                                              title="Mark as non-compliant"
                                            >
                                              <X size={12} />
                                            </motion.button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="border-t border-gray-100 pt-3">
                                      <div className="flex items-center text-xs text-gray-700 mb-1">
                                        <MessageCircle size={12} className="mr-1 text-gray-400" />
                                        <span className="font-medium">Inspection Comments</span>
                                      </div>
                                      <div className="relative">
                                        <textarea
                                          value={editableComments[item.id] || ''}
                                          onChange={(e) => handleCommentChange(item.id, e.target.value)}
                                          placeholder="Add inspection comments and findings..."
                                          className="w-full p-2 text-xs border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:border-gray-300 transition-colors resize-none"
                                          rows={2}
                                        />
                                        {updateInspectionItemMutation.isPending && (
                                          <div className="absolute right-2 bottom-2 flex items-center text-blue-500 text-xs">
                                            <RefreshCw size={10} className="animate-spin mr-1" />
                                            Saving...
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AuditInspectionlist;