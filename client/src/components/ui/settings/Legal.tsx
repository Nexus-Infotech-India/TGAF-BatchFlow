import React from 'react';
import { ArrowUpRight, Download, FileCheck, FileText, Globe, Scale } from 'lucide-react';

const Legal: React.FC = () => {
  // Current year for copyright
  const currentYear = new Date().getFullYear();
  
  // Mock legal documents
  const legalDocuments = [
    {
      id: 'compliance',
      title: 'Compliance Certificate',
      description: 'ISO 27001 Information Security Management',
      date: 'Valid until December 31, 2025',
      icon: <FileCheck className="text-green-600" size={24} />,
      downloadable: true
    },
    {
      id: 'dpa',
      title: 'Data Processing Agreement',
      description: 'Standard contractual clauses for data processing',
      date: 'Last updated March 15, 2025',
      icon: <FileText className="text-blue-600" size={24} />,
      downloadable: true
    },
    {
      id: 'gdpr',
      title: 'GDPR Compliance Statement',
      description: 'Our commitment to EU data protection regulations',
      date: 'Last updated January 10, 2025',
      icon: <Globe className="text-indigo-600" size={24} />,
      downloadable: true
    },
    {
      id: 'license',
      title: 'Software License Agreement',
      description: 'Terms of software usage and distribution',
      date: 'Version 3.2 - April 5, 2025',
      icon: <Scale className="text-amber-600" size={24} />,
      downloadable: true
    },
  ];
  
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Legal Information</h2>
      <p className="text-gray-600 mb-8">View important legal documents and compliance information.</p>
      
      <h3 className="text-lg font-medium text-gray-700 mb-4">Legal Documents</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {legalDocuments.map(doc => (
          <div 
            key={doc.id}
            className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 bg-gray-100 rounded-lg">
                {doc.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-800">{doc.title}</h4>
                <p className="text-gray-600 text-sm mt-1">{doc.description}</p>
                <p className="text-gray-500 text-xs mt-2">{doc.date}</p>
                
                <div className="mt-4 flex items-center gap-4">
                  {doc.downloadable && (
                    <button className="flex items-center gap-1 text-blue-600 text-sm hover:text-blue-800 transition-colors">
                      <Download size={16} />
                      <span>Download PDF</span>
                    </button>
                  )}
                  <button className="flex items-center gap-1 text-gray-600 text-sm hover:text-gray-800 transition-colors">
                    <ArrowUpRight size={16} />
                    <span>View</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <h3 className="text-lg font-medium text-gray-700 mb-4">Company Information</h3>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-gray-600">
              <span className="font-medium text-gray-700">Legal Name:</span> Batchflow Technologies, Inc.
            </p>
            <p className="text-gray-600 mt-2">
              <span className="font-medium text-gray-700">Registration Number:</span> US-84729301
            </p>
            <p className="text-gray-600 mt-2">
              <span className="font-medium text-gray-700">VAT ID:</span> VAT-478293012
            </p>
            <p className="text-gray-600 mt-2">
              <span className="font-medium text-gray-700">Date of Incorporation:</span> January 15, 2020
            </p>
          </div>
          
          <div>
            <p className="text-gray-600">
              <span className="font-medium text-gray-700">Registered Address:</span>
            </p>
            <p className="text-gray-600">
              1234 Innovation Way<br />
              Suite 500<br />
              San Francisco, CA 94103<br />
              United States
            </p>
            <p className="text-gray-600 mt-2">
              <span className="font-medium text-gray-700">Contact Email:</span> legal@batchflow.com
            </p>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-medium text-gray-700 mb-3">Legal Representatives</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="font-medium text-gray-700">John Smith</p>
              <p className="text-gray-600 text-sm">Chief Executive Officer</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="font-medium text-gray-700">Jane Doe</p>
              <p className="text-gray-600 text-sm">Chief Legal Officer</p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            © {currentYear} Batchflow Technologies, Inc. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Legal;