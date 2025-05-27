import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardList, Clock, AlertCircle, 
  User, Calendar, Plus, Save, 
  RefreshCw, Trash2, CheckCircle,
  Check, X, Filter, Star,
  TrendingUp, Target, Award, Sparkles, 
  Eye} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_ROUTES } from '../../../utils/api';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import debounce from 'lodash/debounce';

// Enhanced types
interface ChecklistItem {
  id: string;
  description: string;
  isCompleted: boolean;
  comments?: string;
  dueDate?: string;
  responsibleId?: string;
  createdAt: string;
  updatedAt: string;
  priority?: 'low' | 'medium' | 'high';
  responsible?: {
    id: string;
    name: string;
    email: string;
  };
  createdBy?: {
    id: string;
    name: string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface PreAuditChecklistProps {
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




// Enhanced Priority Badge
interface PriorityBadgeProps {
  priority: 'low' | 'medium' | 'high';
  size?: 'sm' | 'md';
}

const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'md' }) => {
  const configs = {
    low: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200', icon: '●' },
    medium: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', icon: '●●' },
    high: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', icon: '●●●' }
  };

  const config = configs[priority];
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2 py-1 text-xs';

  return (
    <span className={`inline-flex items-center rounded-md border font-medium ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}>
      <span className="mr-1">{config.icon}</span>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
};

const AuditChecklist: React.FC<PreAuditChecklistProps> = ({ auditId: propAuditId }) => {
  // Get auditId from props or URL params
  const { auditId: paramAuditId } = useParams<{ auditId: string }>();
  const auditId = propAuditId || paramAuditId;


  
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [showCompleted, setShowCompleted] = useState(true);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  
  // Form state for creating new items
  const [newItems, setNewItems] = useState<Array<{
    description: string;
    isCompleted: boolean;
    comments: string;
    responsibleId?: string;
    dueDate?: string;
    priority?: 'low' | 'medium' | 'high';
  }>>([{ description: '', isCompleted: false, comments: '', priority: 'medium' }]);

  // Comments map to store editable comments
  const [editableComments, setEditableComments] = useState<Record<string, string>>({});

  // Create debounced update function
  const debouncedUpdateComment = useRef(
    debounce((id: string, comment: string) => {
      updateChecklistItemMutation.mutate({
        id,
        data: { comments: comment }
      });
    }, 1500)
  ).current;

  // Fetch checklist items
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['auditChecklist', auditId],
    queryFn: async () => {
      if (!auditId) return { count: 0, items: [] };
      const response = await axios.get(API_ROUTES.AUDIT.GET_CHECKLIST(auditId), {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
      });
      return response.data;
    },
    enabled: !!auditId,
  });

  // Initialize editable comments when data changes
  useEffect(() => {
    if (data?.items) {
      const commentMap: Record<string, string> = {};
      data.items.forEach((item: ChecklistItem) => {
        commentMap[item.id] = item.comments || '';
      });
      setEditableComments(commentMap);
    }
  }, [data?.items]);

  // Fetch users for assigning responsibilities
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await axios.get(API_ROUTES.AUTH.GET_ALL_USERS, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
      });
      return response.data;
    },
  });

  // Create checklist items mutation
  const createChecklistMutation = useMutation({
    mutationFn: async (items: typeof newItems) => {
      if (!auditId) throw new Error('Audit ID is required');
      console.log('Submitting items:', items);
      
      try {
        const response = await axios.post(
          API_ROUTES.AUDIT.CREATE_CHECKLIST(auditId),
          { auditId, items },
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
      queryClient.invalidateQueries({ queryKey: ['auditChecklist', auditId] });
      setIsCreating(false);
      setNewItems([{ description: '', isCompleted: false, comments: '', priority: 'medium' }]);
      toast.success('Checklist items created successfully');
    },
    onError: (err: any) => {
      console.error('Mutation error details:', err);
      toast.error(`Failed to create checklist: ${err.response?.data?.error || err.message}`);
    },
  });

  // Update checklist item mutation
  const updateChecklistItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<ChecklistItem> }) => {
      const response = await axios.patch(
        API_ROUTES.AUDIT.UPDATE_CHECKLIST_ITEM(id),
        data,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auditChecklist', auditId] });
      toast.success('Checklist item updated', { id: 'update-checklist', duration: 2000 });
    },
    onError: (err: any) => {
      toast.error(`Failed to update checklist item: ${err.response?.data?.error || err.message}`);
    },
  });

  // Add new item field in create form
  const addNewItem = () => {
    setNewItems([...newItems, { description: '', isCompleted: false, comments: '', priority: 'medium' }]);
  };

  // Remove item from create form
  const removeNewItem = (index: number) => {
    setNewItems(newItems.filter((_, i) => i !== index));
  };

  // Update a new item in create form
  const updateNewItem = (index: number, field: string, value: any) => {
    const updated = [...newItems];
    updated[index] = { ...updated[index], [field]: value };
    setNewItems(updated);
  };

  // Handle form submission for new items
  const handleSubmitNewItems = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    if (newItems.some(item => !item.description.trim())) {
      toast.error('All checklist items must have descriptions');
      return;
    }
    
    createChecklistMutation.mutate(newItems);
  };

  // Quick toggle completion status
  const toggleCompletion = (item: ChecklistItem) => {
    updateChecklistItemMutation.mutate({
      id: item.id,
      data: { isCompleted: !item.isCompleted }
    });
  };

  // Handle comment changes with debounced updates
  const handleCommentChange = (id: string, value: string) => {
    setEditableComments({
      ...editableComments,
      [id]: value
    });
    debouncedUpdateComment(id, value);
  };

  // Filter items based on completion status
  const filteredItems = data?.items?.filter((item: ChecklistItem) => 
    showCompleted || !item.isCompleted
  ) || [];

  // Calculate stats
  const totalItems = data?.items?.length || 0;
  const completedItems = data?.items?.filter((item: ChecklistItem) => item.isCompleted).length || 0;
  const pendingItems = totalItems - completedItems;
  const completionRate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Calculate overdue items

  // Format date helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return format(new Date(dateString), "MMM d, yyyy");
  };

  // Get item status for badge

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
            {/* Background decoration */}
            <div className="absolute top-0 right-0 -mt-2 -mr-2">
              <Sparkles size={60} className="text-blue-100 opacity-50" />
            </div>

            <div className="relative">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-3 lg:space-y-0">
                <div>
                  <div className="flex items-center space-x-3 mb-1">
                    <div className="p-2 bg-blue-100 rounded-xl">
                      <ClipboardList className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">Pre-Audit Checklist</h1>
                      <p className="text-gray-600 text-sm mt-0.5">
                        Ensure audit readiness with comprehensive preparation tasks
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  {/* Filter button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCompleted(!showCompleted)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center transition-all shadow-sm ${
                      showCompleted
                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        : "bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200"
                    }`}
                  >
                    {showCompleted ? (
                      <>
                        <Filter size={14} className="mr-2" />
                        Show All
                      </>
                    ) : (
                      <>
                        <Clock size={14} className="mr-2" />
                        Pending Only
                      </>
                    )}
                  </motion.button>
                  
                  {/* Create button */}
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
                        Add Items
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
                  <ClipboardList size={24} className="text-blue-200" />
                </div>
                <div className="relative">
                  <p className="text-xs font-medium text-gray-600 mb-1">Total Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp size={12} className="text-blue-500 mr-1" />
                    <span className="text-xs text-blue-600 font-medium">Active checklist</span>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                whileHover={{ y: -2, scale: 1.02 }}
                className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-3">
                  <CheckCircle size={24} className="text-green-200" />
                </div>
                <div className="relative">
                  <p className="text-xs font-medium text-gray-600 mb-1">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{completedItems}</p>
                  <div className="flex items-center mt-1">
                    <Award size={12} className="text-green-500 mr-1" />
                    <span className="text-xs text-green-600 font-medium">Tasks done</span>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                whileHover={{ y: -2, scale: 1.02 }}
                className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-3">
                  <Clock size={24} className="text-amber-200" />
                </div>
                <div className="relative">
                  <p className="text-xs font-medium text-gray-600 mb-1">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingItems}</p>
                  <div className="flex items-center mt-1">
                    <Target size={12} className="text-amber-500 mr-1" />
                    <span className="text-xs text-amber-600 font-medium">In progress</span>
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
                  <p className="text-xs font-medium text-gray-600 mb-1">Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{completionRate}%</p>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <motion.div 
                      initial={{ width: "0%" }}
                      animate={{ width: `${completionRate}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-1.5 rounded-full"
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
                      <Plus size={16} className="text-blue-600" />
                    </div>
                    Add New Checklist Items
                  </h3>
                  
                  <form onSubmit={handleSubmitNewItems} className="space-y-4">
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
                            <h4 className="font-semibold text-gray-800 text-sm">Checklist Item</h4>
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
                              Description*
                            </label>
                            <textarea
                              value={item.description}
                              onChange={(e) => updateNewItem(index, 'description', e.target.value)}
                              placeholder="Describe what needs to be done for this checklist item..."
                              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                              rows={2}
                              required
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Responsible Person
                              </label>
                              <select
                                value={item.responsibleId || ''}
                                onChange={(e) => updateNewItem(index, 'responsibleId', e.target.value)}
                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                              >
                                <option value="">Select a person</option>
                                {usersData?.users?.map((user: User) => (
                                  <option key={user.id} value={user.id}>
                                    {user.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Priority Level
                              </label>
                              <select
                                value={item.priority || 'medium'}
                                onChange={(e) => updateNewItem(index, 'priority', e.target.value)}
                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                              >
                                <option value="low">Low Priority</option>
                                <option value="medium">Medium Priority</option>
                                <option value="high">High Priority</option>
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Due Date
                              </label>
                              <input
                                type="date"
                                value={item.dueDate || ''}
                                onChange={(e) => updateNewItem(index, 'dueDate', e.target.value)}
                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Initial Comments
                            </label>
                            <textarea
                              value={item.comments}
                              onChange={(e) => updateNewItem(index, 'comments', e.target.value)}
                              placeholder="Add any initial notes, context, or instructions..."
                              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                              rows={2}
                            />
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
                          disabled={createChecklistMutation.isPending}
                          className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center font-medium shadow-lg transition-all text-sm ${
                            createChecklistMutation.isPending ? "opacity-70 cursor-not-allowed" : ""
                          }`}
                        >
                          {createChecklistMutation.isPending ? (
                            <>
                              <RefreshCw size={14} className="mr-1 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save size={14} className="mr-1" />
                              Save All Items
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
                    ease: "linear", 
                    repeat: Infinity,
                  }}
                  className="rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"
                />
              </div>
            ) : isError ? (
              <div className="p-12 text-center">
                <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
                <h3 className="text-lg font-semibold text-red-800 mb-2">Error loading checklist</h3>
                <p className="text-red-600">{(error as any)?.message || "Please try again later"}</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-12 text-center">
                {totalItems === 0 ? (
                  <>
                    <div className="p-3 bg-blue-100 rounded-full inline-block mb-4">
                      <ClipboardList size={36} className="text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Start Your Checklist</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto text-sm">
                      Create your first checklist items to begin tracking pre-audit preparation tasks and ensure nothing is missed.
                    </p>
                    {!isCreating && (
                      <motion.button
                        whileHover={{ scale: 1.02, boxShadow: "0 6px 20px rgba(59, 130, 246, 0.15)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsCreating(true)}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center font-medium shadow-lg text-sm"
                      >
                        <Plus size={14} className="mr-1" />
                        Create First Item
                      </motion.button>
                    )}
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-green-100 rounded-full inline-block mb-4">
                      <CheckCircle size={36} className="text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {showCompleted ? "No items match your filter" : "All items completed!"}
                    </h3>
                    <p className="text-gray-600 mb-6 text-sm">
                      {showCompleted ? "Try adjusting your filter settings" : "Congratulations on completing all checklist items"}
                    </p>
                    {!showCompleted && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowCompleted(true)}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center font-medium shadow-lg text-sm"
                      >
                        <Eye size={14} className="mr-1" />
                        View All Items
                      </motion.button>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-blue-50">
                      <th scope="col" className="w-20 px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Description
                      </th>
                      <th scope="col" className="w-48 px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Responsible
                      </th>
                      <th scope="col" className="w-32 px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Priority
                      </th>
                      <th scope="col" className="w-36 px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Comments
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredItems.map((item: ChecklistItem, index: number) => (
                      <motion.tr 
                        key={item.id} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className={`hover:bg-gray-50 transition-all duration-200 ${
                          item.isCompleted ? 'bg-green-50/50' : ''
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div 
                            className="relative"
                            onMouseEnter={() => setShowTooltip(item.id)}
                            onMouseLeave={() => setShowTooltip(null)}
                          >
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={() => toggleCompletion(item)}
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                                item.isCompleted
                                  ? 'bg-green-500 border-green-500 text-white'
                                  : 'border-gray-300 hover:border-green-400'
                              }`}
                            >
                              {item.isCompleted && <Check size={14} />}
                            </motion.button>
                            
                            {showTooltip === item.id && (
                              <div className="absolute z-10 px-3 py-1 mt-1 -ml-8 text-xs font-medium text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap">
                                {item.isCompleted ? 'Mark as Pending' : 'Mark as Completed'}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`text-sm font-medium ${
                            item.isCompleted ? 'text-gray-600 line-through' : 'text-gray-900'
                          }`}>
                            {item.description}
                          </div>
                          {item.createdBy && (
                            <div className="text-xs text-gray-500 mt-1">
                              Created by {item.createdBy.name}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {item.responsible ? (
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                <User size={14} className="text-blue-600" />
                              </div>
                              <div>
                                <div className="font-medium">{item.responsible.name}</div>
                                <div className="text-xs text-gray-500">{item.responsible.email}</div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">Unassigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {item.priority && <PriorityBadge priority={item.priority} />}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {item.dueDate ? (
                            <div className="flex items-center">
                              <Calendar size={14} className="mr-2 text-gray-400" />
                              {formatDate(item.dueDate)}
                            </div>
                          ) : (
                            <span className="text-gray-400">No due date</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="relative w-full">
                            <textarea
                              value={editableComments[item.id] || ''}
                              onChange={(e) => handleCommentChange(item.id, e.target.value)}
                              placeholder="Add a comment..."
                              className="w-full p-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:border-gray-300 transition-colors resize-none"
                              rows={2}
                            />
                            {updateChecklistItemMutation.isPending && (
                              <div className="absolute right-3 bottom-3 flex items-center text-blue-500 text-xs">
                                <RefreshCw size={12} className="animate-spin mr-1" />
                                Saving...
                              </div>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AuditChecklist;