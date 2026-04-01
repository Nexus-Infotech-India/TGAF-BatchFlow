import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { API_ROUTES } from '../../utils/api';
import { syncRoutePermissions } from '../Route/sync';

interface Permission {
  id: string;
  action: string;
  resource: string;
}

interface PermissionSelectorProps {
  selectedPermissions: string[];
  onChange: (permissionIds: string[]) => void;
}

// ─── Section-based permission grouping that mirrors sidebar sections ────
// Each section maps to the sidebar group and contains all the permission keys
// that belong to that group. When creating a role (e.g. "Cleaning Manager"),
// just check the "Cleaning" section and all relevant permissions are assigned.
interface SidebarSection {
  key: string;
  label: string;
  description: string;
  permissionKeys: string[];
}

const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    key: 'masters',
    label: 'Masters',
    description: 'Vendor, Material, BOM, Location masters',
    permissionKeys: [
      'manage_vendors',
      'manage_raw_materials',
      'manage_bom',
      'manage_locations',
    ],
  },
  {
    key: 'material-management',
    label: 'Material Management',
    description: 'Dashboard, Orders, Quality Report, GRN, Cleaning, Stock',
    permissionKeys: [
      'manage_raw_dashboard',
      'manage_purchase_order',
      'manage_purchase_history',
      'manage_rm_quality_report',
      'manage_generate_grn',
      'manage_cleaning_rawmaterials',
      'view_stock_distribution',
      'view_activity_logs',
    ],
  },
  {
    key: 'cleaning',
    label: 'Cleaning',
    description: 'Transfer received RM to cleaning, view cleaning dashboard',
    permissionKeys: [
      'manage_cleaning_rawmaterials',
      'manage_raw_dashboard',
    ],
  },
  {
    key: 'grinding-production',
    label: 'Grinding & Production',
    description: 'Dispatch to grinding, SFG processing, Outbound to SFG WH, Stock Verification',
    permissionKeys: [
      'send_cleaned_to_grinding',
      'manage_processing_list',
      'dispatch_to_sfg',
      'process_raw_materials',
      'manage_stock_verification',
    ],
  },
  {
    key: 'fg-production',
    label: 'FG Production (Packaging)',
    description: 'Material transfer, receive, FG production, outbound, FG verification',
    permissionKeys: [
      'manage_pkg_material_transfer',
      'manage_pkg_receive_materials',
      'manage_fg_production',
      'manage_pkg_outbound_fg',
      'manage_fg_verification',
    ],
  },
  {
    key: 'fg-quality',
    label: 'FG Quality Report',
    description: 'Operation dashboard, Batches, Standards, Verification',
    permissionKeys: [
      'view_operation_dashboard',
      'view_batches',
      'create_batch',
      'manage_standards',
      'verify_batches',
      'review_batches',
    ],
  },
  {
    key: 'training',
    label: 'Training',
    description: 'Training dashboard, management, calendar, documents',
    permissionKeys: [
      'view_training_dashboard',
      'manage_trainings',
      'create_training',
      'view_training_details',
      'edit_training',
      'view_training_calendar',
      'manage_documents',
    ],
  },
  {
    key: 'audit',
    label: 'Audit Management',
    description: 'Audit dashboard, management, calendar, checklists, findings',
    permissionKeys: [
      'view_audit_dashboard',
      'manage_audits',
      'create_audit',
      'view_audit_details',
      'edit_audit',
      'view_audit_statistics',
      'manage_audit_checklist',
      'view_audit_checklist',
      'manage_audit_findings',
      'view_audit_calendar',
      'manage_inspection_checklist',
      'create_inspection_checklist',
      'create_audit_inspection_checklist',
    ],
  },
  {
    key: 'system',
    label: 'System & Admin',
    description: 'User management, settings, activity logs, profile',
    permissionKeys: [
      'manage_users',
      'manage_settings',
      'view_activity_logs',
      'view_profile',
    ],
  },
];

// Human-readable labels for permission action keys
const PERMISSION_LABELS: Record<string, string> = {
  manage_vendors: 'Vendor Master',
  manage_raw_materials: 'Material Master',
  manage_bom: 'Bill of Material',
  manage_locations: 'Location Master',
  manage_raw_dashboard: 'Raw Material Dashboard',
  manage_purchase_order: 'Create Purchase Order',
  manage_purchase_history: 'Purchase History',
  manage_rm_quality_report: 'RM Quality Report',
  manage_generate_grn: 'Generate GRN',
  manage_cleaning_rawmaterials: 'Cleaning Raw Materials',
  view_stock_distribution: 'Stock Distribution',
  view_activity_logs: 'Activity / Transaction Logs',
  send_cleaned_to_grinding: 'Dispatch to Grinding',
  manage_processing_list: 'SFG Processing',
  dispatch_to_sfg: 'Outbound to SFG Warehouse',
  process_raw_materials: 'Processing List',
  manage_stock_verification: 'Stock Verification',
  manage_pkg_material_transfer: 'Material Transfer to Packaging',
  manage_pkg_receive_materials: 'Receive Materials at Packaging',
  manage_fg_production: 'FG Production Entry',
  manage_pkg_outbound_fg: 'Outbound to FG Warehouse',
  manage_fg_verification: 'FG Warehouse Verification',
  view_operation_dashboard: 'Operation Dashboard',
  view_batches: 'View Batches',
  create_batch: 'Create Batch',
  manage_standards: 'Standards Management',
  verify_batches: 'Batch Verification',
  review_batches: 'Batch Compliance Review',
  view_training_dashboard: 'Training Dashboard',
  manage_trainings: 'Training Management',
  create_training: 'Create Training',
  view_training_details: 'View Training Details',
  edit_training: 'Edit Training',
  view_training_calendar: 'Training Calendar',
  manage_documents: 'Document Library',
  view_audit_dashboard: 'Audit Dashboard',
  manage_audits: 'Audit Management',
  create_audit: 'Create Audit',
  view_audit_details: 'View Audit Details',
  edit_audit: 'Edit Audit',
  view_audit_statistics: 'Audit Statistics',
  manage_audit_checklist: 'Pre-Audit Checklist',
  view_audit_checklist: 'View Audit Checklist',
  manage_audit_findings: 'Audit Findings',
  view_audit_calendar: 'Audit Calendar',
  manage_inspection_checklist: 'Inspection Checklists',
  create_inspection_checklist: 'Create Inspection Checklist',
  create_audit_inspection_checklist: 'Audit Inspection Checklist',
  manage_users: 'User & Role Management',
  manage_settings: 'System Settings',
  view_profile: 'User Profile',
};

const PermissionSelector: React.FC<PermissionSelectorProps> = ({
  selectedPermissions,
  onChange
}) => {
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await syncRoutePermissions();
      
      const response = await api.get(API_ROUTES.AUTH.GET_PERMISSIONS, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      setAllPermissions(response.data.permissions || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading permissions:', error);
      setError('Failed to load permissions. Please try again.');
      setLoading(false);
    }
  };

  // Find the DB permission object by its action key  
  const findPermByAction = (action: string): Permission | undefined =>
    allPermissions.find(p => p.action === action);

  // Check if a permission action's DB id is selected
  const isActionSelected = (action: string): boolean => {
    const perm = findPermByAction(action);
    return perm ? selectedPermissions.includes(perm.id) : false;
  };

  // Toggle a single permission by its action key
  const togglePermission = (action: string) => {
    const perm = findPermByAction(action);
    if (!perm) return;

    const updated = selectedPermissions.includes(perm.id)
      ? selectedPermissions.filter(id => id !== perm.id)
      : [...selectedPermissions, perm.id];
    onChange(updated);
  };

  // Toggle ALL permissions in a sidebar section
  const toggleSection = (section: SidebarSection) => {
    const sectionPermIds = section.permissionKeys
      .map(key => findPermByAction(key)?.id)
      .filter(Boolean) as string[];

    const allSelected = sectionPermIds.every(id => selectedPermissions.includes(id));
    
    let updated: string[];
    if (allSelected) {
      // Deselect all in section
      updated = selectedPermissions.filter(id => !sectionPermIds.includes(id));
    } else {
      // Select all in section
      const newIds = sectionPermIds.filter(id => !selectedPermissions.includes(id));
      updated = [...selectedPermissions, ...newIds];
    }
    onChange(updated);
  };

  const toggleSectionExpand = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Count how many permissions in a section are selected
  const getSectionStats = (section: SidebarSection) => {
    const sectionPermIds = section.permissionKeys
      .map(key => findPermByAction(key)?.id)
      .filter(Boolean) as string[];
    const selected = sectionPermIds.filter(id => selectedPermissions.includes(id)).length;
    return { selected, total: sectionPermIds.length };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 gap-2">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-500">Loading permissions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-500">
        {error}
        <button 
          onClick={loadPermissions}
          className="ml-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-700">
          Sidebar Section Permissions
        </h3>
        <span className="text-xs text-gray-400">
          {selectedPermissions.length} selected
        </span>
      </div>

      {SIDEBAR_SECTIONS.map(section => {
        const isExpanded = expandedSections[section.key] || false;
        const stats = getSectionStats(section);
        const allSelected = stats.selected === stats.total && stats.total > 0;
        const someSelected = stats.selected > 0 && !allSelected;

        return (
          <div
            key={section.key}
            className="border rounded-xl overflow-hidden transition-all"
            style={{ borderColor: allSelected ? '#3b82f6' : someSelected ? '#93c5fd' : '#e5e7eb' }}
          >
            {/* Section Header */}
            <div
              className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors"
              style={{
                background: allSelected
                  ? 'linear-gradient(135deg, #eff6ff, #dbeafe)'
                  : someSelected
                  ? '#f8fafc'
                  : '#fafafa'
              }}
              onClick={() => toggleSectionExpand(section.key)}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected; }}
                  className="h-4 w-4 text-blue-600 rounded cursor-pointer accent-blue-600"
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleSection(section);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <div>
                  <div className="font-semibold text-sm text-gray-800">{section.label}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">{section.description}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: allSelected ? '#dbeafe' : '#f1f5f9',
                    color: allSelected ? '#2563eb' : '#64748b'
                  }}
                >
                  {stats.selected}/{stats.total}
                </span>
                <span className="text-gray-400 text-xs">{isExpanded ? '▲' : '▼'}</span>
              </div>
            </div>

            {/* Section Items */}
            {isExpanded && (
              <div className="divide-y divide-gray-100">
                {section.permissionKeys.map(action => {
                  const perm = findPermByAction(action);
                  if (!perm) return null;
                  const label = PERMISSION_LABELS[action] || action.replace(/_/g, ' ');
                  const checked = isActionSelected(action);

                  return (
                    <div
                      key={perm.id}
                      className="flex items-center px-5 py-2.5 hover:bg-blue-50/50 transition-colors cursor-pointer"
                      onClick={() => togglePermission(action)}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => togglePermission(action)}
                        className="h-3.5 w-3.5 text-blue-600 rounded cursor-pointer accent-blue-600"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="ml-3 text-sm text-gray-700">{label}</span>
                      <span className="ml-auto text-[10px] text-gray-300 font-mono">{action}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PermissionSelector;