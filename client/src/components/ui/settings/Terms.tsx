import React, { useState } from 'react';
import { FileText, ShieldCheck, Eye, Users, Copy, ChevronDown, ChevronUp } from 'lucide-react';

const TermsAndPolicies: React.FC = () => {
  const [expandedSection, setExpandedSection] = useState<string | null>("terms");
  
  const toggleSection = (sectionId: string) => {
    if (expandedSection === sectionId) {
      setExpandedSection(null);
    } else {
      setExpandedSection(sectionId);
    }
  };
  
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Terms & Policies</h2>
      <p className="text-gray-600 mb-6">Review our terms of service and policies.</p>
      
      {/* Terms of Service */}
      <div className="border border-gray-200 rounded-lg mb-4 overflow-hidden">
        <div 
          className={`flex justify-between items-center p-4 cursor-pointer ${expandedSection === "terms" ? "bg-blue-50" : "bg-white hover:bg-gray-50"}`}
          onClick={() => toggleSection("terms")}
        >
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-blue-600" />
            <h3 className="font-medium text-gray-800">Terms of Service</h3>
            <span className="text-xs text-gray-500">Last updated: May 1, 2025</span>
          </div>
          <div>
            {expandedSection === "terms" ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
        
        {expandedSection === "terms" && (
          <div className="p-6 bg-white border-t border-gray-100">
            <div className="space-y-4 text-gray-600">
              <p>
                Welcome to Batchflow. By accessing or using our service, you agree to be bound by these Terms of Service.
              </p>
              
              <h4 className="font-medium text-gray-800">1. Use of Service</h4>
              <p>
                Batchflow provides batch processing and quality control tools for manufacturing. You agree to use the service only for its intended purposes and in compliance with all applicable laws and regulations.
              </p>
              
              <h4 className="font-medium text-gray-800">2. User Accounts</h4>
              <p>
                When you create an account with us, you must provide accurate and complete information. You are responsible for safeguarding your password and for all activities that occur under your account.
              </p>
              
              <h4 className="font-medium text-gray-800">3. Intellectual Property</h4>
              <p>
                The service and its original content, features, and functionality are owned by Batchflow and are protected by international copyright, trademark, and other intellectual property laws.
              </p>
              
              <h4 className="font-medium text-gray-800">4. Termination</h4>
              <p>
                We may terminate or suspend your account immediately, without prior notice, for any reason whatsoever, including without limitation if you breach the Terms of Service.
              </p>
              
              <h4 className="font-medium text-gray-800">5. Limitation of Liability</h4>
              <p>
                In no event shall Batchflow be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
              </p>
              
              <h4 className="font-medium text-gray-800">6. Changes</h4>
              <p>
                We reserve the right to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect.
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Privacy Policy */}
      <div className="border border-gray-200 rounded-lg mb-4 overflow-hidden">
        <div 
          className={`flex justify-between items-center p-4 cursor-pointer ${expandedSection === "privacy" ? "bg-blue-50" : "bg-white hover:bg-gray-50"}`}
          onClick={() => toggleSection("privacy")}
        >
          <div className="flex items-center gap-3">
            <ShieldCheck size={20} className="text-green-600" />
            <h3 className="font-medium text-gray-800">Privacy Policy</h3>
            <span className="text-xs text-gray-500">Last updated: April 28, 2025</span>
          </div>
          <div>
            {expandedSection === "privacy" ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
        
        {expandedSection === "privacy" && (
          <div className="p-6 bg-white border-t border-gray-100">
            <div className="space-y-4 text-gray-600">
              <p>
                At Batchflow, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
              </p>
              
              <h4 className="font-medium text-gray-800">1. Information We Collect</h4>
              <p>
                We collect information that you provide directly to us, such as when you create an account, update your profile, or communicate with us. We also automatically collect certain information about your device and how you interact with our service.
              </p>
              
              <h4 className="font-medium text-gray-800">2. How We Use Your Information</h4>
              <p>
                We use the information we collect to operate, maintain, and provide the features and functionality of the service, to communicate with you, and to improve our service.
              </p>
              
              <h4 className="font-medium text-gray-800">3. Information Sharing</h4>
              <p>
                We may share your information with third-party service providers who perform services on our behalf, such as hosting, data analysis, payment processing, and customer service.
              </p>
              
              <h4 className="font-medium text-gray-800">4. Data Security</h4>
              <p>
                We use reasonable measures to help protect your personal information from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction.
              </p>
              
              <h4 className="font-medium text-gray-800">5. Your Choices</h4>
              <p>
                You can access, update, or delete your account information at any time through your account settings. You may also request that we delete certain information about you.
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Data Usage */}
      <div className="border border-gray-200 rounded-lg mb-4 overflow-hidden">
        <div 
          className={`flex justify-between items-center p-4 cursor-pointer ${expandedSection === "data" ? "bg-blue-50" : "bg-white hover:bg-gray-50"}`}
          onClick={() => toggleSection("data")}
        >
          <div className="flex items-center gap-3">
            <Eye size={20} className="text-purple-600" />
            <h3 className="font-medium text-gray-800">Data Usage Policy</h3>
            <span className="text-xs text-gray-500">Last updated: April 15, 2025</span>
          </div>
          <div>
            {expandedSection === "data" ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
        
        {expandedSection === "data" && (
          <div className="p-6 bg-white border-t border-gray-100">
            <div className="space-y-4 text-gray-600">
              <p>
                This Data Usage Policy describes how Batchflow collects, processes, and stores data from its users and how this data is utilized to improve our services.
              </p>
              
              <h4 className="font-medium text-gray-800">1. Data Collection</h4>
              <p>
                We collect batch processing data, quality control metrics, user activity logs, and system usage statistics to operate our platform and provide analytics.
              </p>
              
              <h4 className="font-medium text-gray-800">2. Data Processing</h4>
              <p>
                Collected data is processed to generate insights, improve system performance, and provide personalized recommendations to users based on their usage patterns.
              </p>
              
              <h4 className="font-medium text-gray-800">3. Data Storage</h4>
              <p>
                All data is stored in secure, encrypted databases. Production data is retained according to your organization's retention policies, while system logs are kept for up to 90 days.
              </p>
              
              <h4 className="font-medium text-gray-800">4. Data Access</h4>
              <p>
                Access to data is restricted to authorized personnel only. We implement role-based access controls to ensure that users can only access data they are permitted to view.
              </p>
              
              <h4 className="font-medium text-gray-800">5. Data Exports</h4>
              <p>
                Users with appropriate permissions can export data in various formats. All exports are logged for security and compliance purposes.
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Cookie Policy */}
      <div className="border border-gray-200 rounded-lg mb-4 overflow-hidden">
        <div 
          className={`flex justify-between items-center p-4 cursor-pointer ${expandedSection === "cookie" ? "bg-blue-50" : "bg-white hover:bg-gray-50"}`}
          onClick={() => toggleSection("cookie")}
        >
          <div className="flex items-center gap-3">
            <Copy size={20} className="text-amber-600" />
            <h3 className="font-medium text-gray-800">Cookie Policy</h3>
            <span className="text-xs text-gray-500">Last updated: March 30, 2025</span>
          </div>
          <div>
            {expandedSection === "cookie" ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
        
        {expandedSection === "cookie" && (
          <div className="p-6 bg-white border-t border-gray-100">
            <div className="space-y-4 text-gray-600">
              <p>
                This Cookie Policy explains how Batchflow uses cookies and similar technologies to recognize you when you visit our application.
              </p>
              
              <h4 className="font-medium text-gray-800">1. What are cookies?</h4>
              <p>
                Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners to make their websites work efficiently and to provide reporting information.
              </p>
              
              <h4 className="font-medium text-gray-800">2. Cookies we use</h4>
              <p>
                We use essential cookies to authenticate users and prevent fraudulent use of user accounts. We also use functionality cookies to remember user preferences and settings.
              </p>
              
              <h4 className="font-medium text-gray-800">3. Third-party cookies</h4>
              <p>
                Some third-party services may place cookies on your device. These might include analytics services (to help us understand how users use our site) and embedded content (such as videos or charts).
              </p>
              
              <h4 className="font-medium text-gray-800">4. How to control cookies</h4>
              <p>
                Most browsers allow you to control cookies through their settings. However, disabling certain cookies may limit your ability to use some features of our application.
              </p>
              
              <h4 className="font-medium text-gray-800">5. Updates to this policy</h4>
              <p>
                We may update this Cookie Policy from time to time to reflect changes in technology, regulation, or our business practices.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TermsAndPolicies;