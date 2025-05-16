import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  User, 
  Bell, 
  Shield, 
  Paintbrush, 
  FileText, 
  Globe, 
  HelpCircle,
  Lock,
  ChevronRight
} from "lucide-react";
import TermsAndPolicies from '../../ui/settings/Terms';
import Legal from '../../ui/settings/Legal';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Define the settings sections
  const sections = [
    {
      id: 'profile',
      name: 'Profile Settings',
      icon: <User size={20} className="text-blue-600" />,
      description: 'Manage your personal information and preferences',
      path: '/settings/profile'
    },
    {
      id: 'notifications',
      name: 'Notification Settings',
      icon: <Bell size={20} className="text-amber-600" />,
      description: 'Control how and when you receive notifications',
      path: '/settings/notifications'
    },
    {
      id: 'security',
      name: 'Security',
      icon: <Lock size={20} className="text-green-600" />,
      description: 'Manage your password, two-factor authentication, and security settings',
      path: '/settings/security'
    },
    {
      id: 'permissions',
      name: 'Permissions',
      icon: <Shield size={20} className="text-purple-600" />,
      description: 'View and manage your role permissions',
      path: '/settings/permissions'
    },
    {
      id: 'appearance',
      name: 'Appearance',
      icon: <Paintbrush size={20} className="text-indigo-600" />,
      description: 'Customize the look and feel of the application',
      path: '/settings/appearance'
    },
    {
      id: 'terms',
      name: 'Terms & Policies',
      icon: <FileText size={20} className="text-gray-600" />,
      description: 'Review our terms of service and policies',
      path: '/settings/terms'
    },
    {
      id: 'legal',
      name: 'Legal',
      icon: <Globe size={20} className="text-blue-gray-600" />,
      description: 'View important legal documents and compliance information',
      path: '/settings/legal'
    },
    {
      id: 'help',
      name: 'Help & Support',
      icon: <HelpCircle size={20} className="text-red-600" />,
      description: 'Get help with using the application',
      path: '/settings/help'
    }
  ];

  // Check if we're on a specific settings page
  const isSpecificSettingPage = currentPath !== '/settings' && currentPath !== '/settings/';
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account preferences and application settings</p>
      </div>
      
      {!isSpecificSettingPage ? (
        // Settings overview page with all categories
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((section) => (
            <div 
              key={section.id}
              onClick={() => navigate(section.path)}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-start gap-4 cursor-pointer hover:shadow-md hover:border-blue-100 transition-all"
            >
              <div className="bg-gray-50 p-3 rounded-lg">
                {section.icon}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">{section.name}</h3>
                  <ChevronRight size={18} className="text-gray-400" />
                </div>
                <p className="text-gray-600 mt-1 text-sm">{section.description}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Display specific settings section based on URL
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-gray-100">
            <button 
              onClick={() => navigate('/settings')}
              className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg flex items-center gap-2 transition-colors"
            >
              <ChevronRight size={16} className="transform rotate-180" />
              <span>Back to Settings</span>
            </button>
          </div>
          
          <div className="p-6">
            {currentPath.includes('/terms') && <TermsAndPolicies />}
            {currentPath.includes('/legal') && <Legal />}
            
            {/* Placeholder content for other settings sections */}
            {currentPath.includes('/profile') && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Profile Settings</h2>
                <p className="text-gray-600">Manage your personal information and preferences.</p>
                <div className="mt-6 text-gray-500">Profile settings content to be implemented</div>
              </div>
            )}
            
            {currentPath.includes('/notifications') && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Notification Settings</h2>
                <p className="text-gray-600">Control how and when you receive notifications.</p>
                <div className="mt-6 text-gray-500">Notification settings content to be implemented</div>
              </div>
            )}
            
            {currentPath.includes('/security') && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Security Settings</h2>
                <p className="text-gray-600">Manage your password, two-factor authentication, and other security settings.</p>
                <div className="mt-6 text-gray-500">Security settings content to be implemented</div>
              </div>
            )}
            
            {currentPath.includes('/permissions') && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Permissions</h2>
                <p className="text-gray-600">View and manage your role permissions.</p>
                <div className="mt-6 text-gray-500">Permissions content to be implemented</div>
              </div>
            )}
            
            {currentPath.includes('/appearance') && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Appearance Settings</h2>
                <p className="text-gray-600">Customize the look and feel of the application.</p>
                <div className="mt-6 text-gray-500">Appearance settings content to be implemented</div>
              </div>
            )}
            
            {currentPath.includes('/help') && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Help & Support</h2>
                <p className="text-gray-600">Get help with using the application.</p>
                <div className="mt-6 text-gray-500">Help & support content to be implemented</div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Additional help information */}
      <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-100">
        <h3 className="text-lg font-medium text-blue-800 flex items-center gap-2">
          <HelpCircle size={20} />
          <span>Need Help?</span>
        </h3>
        <p className="mt-2 text-blue-700">
          If you need assistance with your settings or have any questions about your account, 
          our support team is here to help.
        </p>
        <div className="mt-4 flex gap-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Contact Support
          </button>
          <button className="px-4 py-2 bg-white text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
            View Documentation
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;