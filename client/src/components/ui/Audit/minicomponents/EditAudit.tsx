import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Save,
  X,
  AlertTriangle,
  Calendar,
  Users,
  Building,
  Target,
  List,
  Briefcase,
  Tag
} from 'lucide-react';
import axios from 'axios';
import { API_ROUTES } from '../../../../utils/api';
import { toast } from 'react-hot-toast';

interface EditAuditFormProps {
  auditId: string;
  onCancel: () => void;
  onSaveSuccess: () => void;
}

// FormField component for consistent styling
const FormField = ({ label, id, error, children }: {
  label: string;
  id: string;
  error?: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

const EditAuditForm: React.FC<EditAuditFormProps> = ({ auditId, onCancel, onSaveSuccess }) => {
  const queryClient = useQueryClient();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    auditType: '',
    startDate: '',
    endDate: '',
    auditorId: '',
    auditeeId: '',
    firmName: '',
    departmentId: '',
    objectives: '',
    scope: '',
    summary: ''
  });
  
  // Form errors
  const [errors, setErrors] = useState<{
    name?: string;
    auditType?: string;
    startDate?: string;
    endDate?: string;
    auditorId?: string;
    auditeeId?: string;
    firmName?: string;
    departmentId?: string;
    objectives?: string;
    scope?: string;
    summary?: string;
    form?: string;
  }>({});
  
  // Fetch audit data
  const { data: auditData, isLoading: isLoadingAudit, isError: isErrorAudit } = useQuery({
    queryKey: ['audit', auditId],
    queryFn: async () => {
      const response = await axios.get(API_ROUTES.AUDIT.GET_AUDIT_BY_ID(auditId), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      return response.data;
    },
  });
  
 // Update the users query function to handle the nested structure
const { data: usersData, isLoading: isLoadingUsers } = useQuery({
  queryKey: ['users'],
  queryFn: async () => {
    const response = await axios.get(API_ROUTES.AUTH.GET_ALL_USERS, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    });
    
    // Extract users array from the response
    return response.data.users || response.data;
  },
});
  
  // Fetch departments
  const { data: departmentsData, isLoading: isLoadingDepartments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await axios.get(API_ROUTES.AUDIT.GET_ALL_DEPARTMENTS, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      return response.data;
    },
  });
  
  // Set initial form data when audit data is loaded
  useEffect(() => {
    if (auditData) {
      setFormData({
        name: auditData.name || '',
        auditType: auditData.auditType || '',
        startDate: auditData.startDate ? new Date(auditData.startDate).toISOString().split('T')[0] : '',
        endDate: auditData.endDate ? new Date(auditData.endDate).toISOString().split('T')[0] : '',
        auditorId: auditData.auditorId || '',
        auditeeId: auditData.auditeeId || '',
        firmName: auditData.firmName || '',
        departmentId: auditData.departmentId || '',
        objectives: auditData.objectives || '',
        scope: auditData.scope || '',
        summary: auditData.summary || ''
      });
    }
  }, [auditData]);
  
  // Update audit mutation
  const updateAuditMutation = useMutation({
    mutationFn: (data: any) =>
      axios.put(API_ROUTES.AUDIT.UPDATE_AUDIT(auditId), data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      }),
    onSuccess: () => {
      toast.success('Audit updated successfully');
      queryClient.invalidateQueries({ queryKey: ['audits'] });
      queryClient.invalidateQueries({ queryKey: ['audit', auditId] });
      onSaveSuccess();
    },
    onError: (error: any) => {
      console.error('Error updating audit:', error);
      toast.error('Failed to update audit');
      if (error.response?.data?.message) {
        setErrors({ form: error.response.data.message });
      } else {
        setErrors({ form: 'An unexpected error occurred. Please try again.' });
      }
    },
  });
  
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  
  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Audit name is required';
    }
    
    if (!formData.auditType) {
      newErrors.auditType = 'Audit type is required';
    }
    
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    
    if (!formData.departmentId) {
      newErrors.departmentId = 'Department is required';
    }
    
    if (!formData.objectives.trim()) {
      newErrors.objectives = 'Objectives are required';
    }
    
    if (!formData.scope.trim()) {
      newErrors.scope = 'Scope is required';
    }
    
    // Check if end date is after start date
    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please correct the errors in the form');
      return;
    }
    
    updateAuditMutation.mutate(formData);
  };
  
  if (isLoadingAudit) {
    return (
      <div className="p-12 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
        <p className="ml-3 text-gray-600">Loading audit data...</p>
      </div>
    );
  }
  
  if (isErrorAudit) {
    return (
      <div className="p-12 flex items-center justify-center text-red-500">
        <AlertTriangle size={24} className="mr-2" />
        <p>Error loading audit data. Please try again.</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <div className="flex justify-between items-center">
          <motion.h2 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-2xl font-bold text-gray-800"
          >
            Edit Audit
          </motion.h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
            title="Cancel"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6">
        {errors.form && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <p>{errors.form}</p>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <FormField label="Audit Name" id="name" error={errors.name}>
              <div className="relative">
                <Tag className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Annual Quality Compliance Audit 2025"
                />
              </div>
            </FormField>
            
            <FormField label="Audit Type" id="auditType" error={errors.auditType}>
              <div className="relative">
                <Briefcase className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <select
                  id="auditType"
                  name="auditType"
                  value={formData.auditType}
                  onChange={handleChange}
                  className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Audit Type</option>
                  <option value="INTERNAL">Internal</option>
                  <option value="EXTERNAL">External</option>
                  <option value="COMPLIANCE">Compliance</option>
                  <option value="PROCESS">Process</option>
                </select>
              </div>
            </FormField>
            
            <FormField label="Firm Name" id="firmName" error={errors.firmName}>
              <div className="relative">
                <Building className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input
                  type="text"
                  id="firmName"
                  name="firmName"
                  value={formData.firmName}
                  onChange={handleChange}
                  className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Internal Audit Team"
                />
              </div>
            </FormField>
            
            <FormField label="Department" id="departmentId" error={errors.departmentId}>
              <div className="relative">
                <Building className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <select
                  id="departmentId"
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={handleChange}
                  className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoadingDepartments}
                >
                  <option value="">Select Department</option>
                  {departmentsData?.map((dept: any) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            </FormField>
          </div>
          
          <div>
            <FormField label="Start Date" id="startDate" error={errors.startDate}>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </FormField>
            
            <FormField label="End Date" id="endDate" error={errors.endDate}>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </FormField>
            
            <FormField label="Auditor" id="auditorId" error={errors.auditorId}>
              <div className="relative">
                <Users className="absolute left-3 top-2.5 text-gray-400" size={16} />
               <select
  id="auditorId"
  name="auditorId"
  value={formData.auditorId}
  onChange={handleChange}
  className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
  disabled={isLoadingUsers}
>
  <option value="">Select Auditor</option>
  {Array.isArray(usersData) && usersData.map((user: any) => (
    <option key={user.id} value={user.id}>
      {user.name}
    </option>
  ))}
</select>
              </div>
            </FormField>
            
            <FormField label="Auditee" id="auditeeId" error={errors.auditeeId}>
              <div className="relative">
                <Users className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <select
                  id="auditeeId"
                  name="auditeeId"
                  value={formData.auditeeId}
                  onChange={handleChange}
                  className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoadingUsers}
                >
                  <option value="">Select Auditee</option>
                  {usersData?.map((user: any) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
            </FormField>
          </div>
        </div>
        
        <div className="mt-6">
          <FormField label="Objectives" id="objectives" error={errors.objectives}>
            <div className="relative">
              <Target className="absolute left-3 top-3 text-gray-400" size={16} />
              <textarea
                id="objectives"
                name="objectives"
                value={formData.objectives}
                onChange={handleChange}
                rows={3}
                className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the objectives of this audit"
              />
            </div>
          </FormField>
          
          <FormField label="Scope" id="scope" error={errors.scope}>
            <div className="relative">
              <List className="absolute left-3 top-3 text-gray-400" size={16} />
              <textarea
                id="scope"
                name="scope"
                value={formData.scope}
                onChange={handleChange}
                rows={3}
                className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Define the scope of this audit"
              />
            </div>
          </FormField>
          
          <FormField label="Summary (optional)" id="summary" error={errors.summary}>
            <div className="relative">
              <List className="absolute left-3 top-3 text-gray-400" size={16} />
              <textarea
                id="summary"
                name="summary"
                value={formData.summary || ''}
                onChange={handleChange}
                rows={3}
                className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Provide a summary of the audit findings and results"
              />
            </div>
          </FormField>
        </div>
        
        <div className="mt-8 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            disabled={updateAuditMutation.isPending}
          >
            {updateAuditMutation.isPending ? (
              <>
                <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditAuditForm;