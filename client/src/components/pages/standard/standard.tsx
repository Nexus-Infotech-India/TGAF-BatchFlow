import { Plus, ArrowLeft } from 'lucide-react';
import useInitNavStackOnce from '../../../hooks/useSafeSetNavStack';
import ViewUnit from '../../ui/standard/unit/viewUnit';
import React, { useState } from 'react';
import AddUnit from '../../ui/standard/unit/AddUnit';
import StandardCategory from '../../ui/standard/stanadardCategory/StandardCategory';
import AddStandardCategory from '../../ui/standard/stanadardCategory/AddCategory';
import StandardParameterList from '../../ui/standard/standardParameters/standardParamlist';
import AddStandardParameter from '../../ui/standard/standardParameters/AddStandardParameter';
import { motion } from 'framer-motion';
import { Folder, Package, Tag } from 'lucide-react';

interface TabConfig {
  title: string;
  content: React.ReactNode;
  addComponent: React.ReactNode;
  icon: React.ReactNode;
  description: string;
  gradient: string;
  shadow: string;
}

// Minimalistic, bold, slightly larger Tabs with border
const SimpleTabs: React.FC<{
  tabs: {
    title: string;
    content: React.ReactNode;
    icon?: React.ReactNode;
  }[];
  activeTab: number;
  onTabChange: (index: number) => void;
}> = ({ tabs, activeTab, onTabChange }) => (
  <div className="w-full bg-[var(--background)]">
    <div className="flex space-x-3 px-0 pb-2">
      {tabs.map((tab, idx) => (
        <button
          key={tab.title}
          onClick={() => onTabChange(idx)}
          className={`flex items-center gap-2 px-5 py-3 text-base font-extrabold rounded-t-lg transition-all duration-150 relative
            ${
              activeTab === idx
                ? 'text-[var(--primary)]'
                : 'text-[var(--muted-foreground)] hover:text-[var(--primary)]'
            }
          `}
        >
          {tab.icon && <span className="w-5 h-5">{tab.icon}</span>}
          {tab.title}
          {activeTab === idx && (
            <span
              className="absolute left-0 right-0 -bottom-1 h-1 rounded-full bg-[var(--primary)]"
              style={{}}
            />
          )}
        </button>
      ))}
    </div>
  </div>
);

export default function Standard() {
  useInitNavStackOnce([{ title: 'Standard', path: '/' }]);

  const [activeTab, setActiveTab] = useState(0);
  const [showAddComponent, setShowAddComponent] = useState(false);
  const [, setSelectedCategoryId] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const handleCategorySelect = (categoryId: string, categoryName: string) => {
    setSelectedCategoryId({ id: categoryId, name: categoryName });
    setActiveTab(1);
  };

  const handleAddClick = () => setShowAddComponent(true);
  const handleBackToList = () => setShowAddComponent(false);

  const tabIcons = {
    category: <Folder className="h-5 w-5" />,
    parameters: <Tag className="h-5 w-5" />,
    unit: <Package className="h-5 w-5" />,
  };

  const tabs: TabConfig[] = [
    {
      title: 'Categories',
      description: 'Manage standard categories',
      content: (
        <StandardCategory
          onCategorySelect={handleCategorySelect}
          onAddCategoryClick={handleAddClick}
        />
      ),
      addComponent: (
        <AddStandardCategory
          onSuccess={handleBackToList}
          onCancel={handleBackToList}
        />
      ),
      icon: tabIcons.category,
      gradient: '',
      shadow: '',
    },
    {
      title: 'Parameters',
      description: 'Configure parameters',
      content: <StandardParameterList onAddParameterClick={handleAddClick} />,
      addComponent: (
        <AddStandardParameter
          onSuccess={handleBackToList}
          onCancel={handleBackToList}
        />
      ),
      icon: tabIcons.parameters,
      gradient: '',
      shadow: '',
    },
    {
      title: 'Units',
      description: 'Measurement units',
      content: <ViewUnit />,
      addComponent: (
        <AddUnit onSuccess={handleBackToList} onCancel={handleBackToList} />
      ),
      icon: tabIcons.unit,
      gradient: '',
      shadow: '',
    },
  ];

  const tabContent = showAddComponent ? (
    <motion.div
      className="h-full bg-[var(--background)]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="border-b border-[var(--border)] p-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-[var(--primary)]/10">
            {tabs[activeTab].icon}
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-[var(--foreground)]">
              Add {tabs[activeTab].title.slice(0, -1)}
            </h2>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Create a new {tabs[activeTab].title.toLowerCase().slice(0, -1)}{' '}
              entry
            </p>
          </div>
        </div>
        <button
          onClick={handleBackToList}
          className="py-2 px-5 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] text-base font-semibold rounded-lg flex items-center gap-2 hover:bg-[var(--muted)] transition-all"
        >
          <ArrowLeft size={18} />
          Back to List
        </button>
      </div>
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {tabs[activeTab].addComponent}
        </motion.div>
      </div>
    </motion.div>
  ) : (
    <div className="relative h-full">
      <div className="h-full bg-[var(--background)]">
        {tabs[activeTab].content}
      </div>
      <motion.button
        onClick={handleAddClick}
        className="fixed bottom-8 right-8 z-50 h-14 w-14 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl flex items-center justify-center shadow-lg hover:bg-[var(--primary)]/90 transition-all text-2xl"
        whileHover={{ scale: 1.07 }}
        whileTap={{ scale: 0.96 }}
      >
        <Plus size={28} />
      </motion.button>
    </div>
  );

  const tabsData = tabs.map((tab) => ({
    title: tab.title,
    content: tabContent,
    icon: tab.icon,
  }));

 return (
   <div className="flex flex-col h-full bg-[var(--background)]">
     <SimpleTabs
       tabs={tabsData}
       activeTab={activeTab}
       onTabChange={(index) => {
         setActiveTab(index);
         setShowAddComponent(false);
       }}
     />
     <div className="flex-1 flex justify-start">
       {' '}
       {/* <-- justify-start to align left */}
       <div className="w-full max-w-6xl">{tabContent}</div>
     </div>
   </div>
 );
}
