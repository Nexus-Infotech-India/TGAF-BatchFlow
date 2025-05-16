import { Plus, ArrowLeft } from "lucide-react";
import Tabs from "../../material/tab";
import useInitNavStackOnce from "../../../hooks/useSafeSetNavStack";
import ViewUnit from "../../ui/standard/unit/viewUnit";
import ViewMethodologies from "../../ui/standard/methodology/viewMethodologies";
import React, { useState } from "react";
import AddUnit from "../../ui/standard/unit/AddUnit";
import AddMethodology from "../../ui/standard/methodology/AddMethodology";
import StandardCategory from "../../ui/standard/stanadardCategory/StandardCategory";
import AddStandardCategory from "../../ui/standard/stanadardCategory/AddCategory";
import StandardParameterList from "../../ui/standard/standardParameters/standardParamlist";
import AddStandardParameter from "../../ui/standard/standardParameters/AddStandardParameter";
import { motion } from "framer-motion";
import { Award, Folder, FileText, Package, Tag } from "lucide-react";

interface TabConfig {
  title: string;
  content: React.ReactNode;
  addComponent: React.ReactNode;
  icon: React.ReactNode;
}

// Wrapper to add elements between tab headers and content
const TabContentWrapper: React.FC<{
  children: React.ReactNode;
  title: string;
  showAddButton?: boolean;
  onAddClick?: () => void;
  showBackButton?: boolean;
  onBackClick?: () => void;
}> = ({ 
  children, 
  title, 
  showAddButton, 
  onAddClick, 
  showBackButton, 
  onBackClick 
}) => {
  return (
    <div>
      <div className="px-2 pt-2 pb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          {title === "Standard Category" && <Folder className="h-6 w-6 text-blue-600" />}
          {title === "Standards" && <Award className="h-6 w-6 text-blue-600" />}
          {title === "Parameters" && <Tag className="h-6 w-6 text-blue-600" />}
          {title === "Unit" && <Package className="h-6 w-6 text-blue-600" />}
          {title === "Methodologies" && <FileText className="h-6 w-6 text-blue-600" />}
          <span>{title}</span>
        </h2>
        {showAddButton && (
          <motion.button
            onClick={onAddClick}
            className="py-2 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 shadow-sm"
            whileHover={{ scale: 1.03, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" }}
            whileTap={{ scale: 0.97 }}
          >
            <Plus size={16} />
            Add {title}
          </motion.button>
        )}
        {showBackButton && (
          <motion.button
            onClick={onBackClick}
            className="py-2 px-4 bg-white border border-blue-200 text-blue-700 text-sm font-medium rounded-lg flex items-center gap-2 shadow-sm"
            whileHover={{ scale: 1.03, backgroundColor: "#f0f7ff" }}
            whileTap={{ scale: 0.97 }}
          >
            <ArrowLeft size={16} />
            Back to {title} List
          </motion.button>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
};

export default function Standard() {
  useInitNavStackOnce([{ title: "Standard", path: "/" }])

  const [activeTab, setActiveTab] = useState(0);
  const [showAddComponent, setShowAddComponent] = useState(false);
  const [, setSelectedCategoryId] = useState<{ id: string; name: string } | null>(null);

  const handleCategorySelect = (categoryId: string, categoryName: string) => {
    setSelectedCategoryId({ id: categoryId, name: categoryName });
    setActiveTab(1);
  };

  const handleAddClick = () => {
    setShowAddComponent(true);
  };

  const handleBackToList = () => {
    setShowAddComponent(false);
  };

 

  // Define the tab icons
  const tabIcons = {
    category: <Folder size={18} />,
    standards: <Award size={18} />,
    parameters: <Tag size={18} />,
    unit: <Package size={18} />,
    methodologies: <FileText size={18} />
  };

  const tabs: TabConfig[] = [
    {
      title: "Standard Category",
      content: <StandardCategory onCategorySelect={handleCategorySelect} onAddCategoryClick={handleAddClick} />,
      addComponent: <AddStandardCategory onSuccess={handleBackToList} onCancel={handleBackToList} />,
      icon: tabIcons.category
    },
    {
      title: "Parameters",
      content: <StandardParameterList onAddParameterClick={handleAddClick} />,
      addComponent: <AddStandardParameter onSuccess={handleBackToList} onCancel={handleBackToList} />,
      icon: tabIcons.parameters
    },
    {
      title: "Unit",
      content: <ViewUnit />,
      addComponent: <AddUnit onSuccess={handleBackToList} onCancel={handleBackToList} />, 
      icon: tabIcons.unit
    },
    {
      title: "Methodologies",
      content: <ViewMethodologies />,
      addComponent: <AddMethodology onSuccess={handleBackToList} onCancel={handleBackToList} />,
      icon: tabIcons.methodologies
    },
  ];

  // Prepare tab data for the Tabs component, now including icons
  const tabsData = tabs.map((tab) => ({
    title: tab.title,
    content: showAddComponent ? (
      <TabContentWrapper
        title={tab.title}
        showBackButton={true}
        onBackClick={handleBackToList}
      >
        {tab.addComponent}
      </TabContentWrapper>
    ) : (
      <TabContentWrapper
        title={tab.title}
        showAddButton={true}
        onAddClick={handleAddClick}
      >
        {tab.content}
      </TabContentWrapper>
    ),
    icon: tab.icon
  }));

  return (
    <div className="flex flex-col h-full">
      {/* Main Content with Tabs */}
      <div>
        <Tabs
          tabs={tabsData}
          activeTab={activeTab}
          onTabChange={(index) => {
            setActiveTab(index);
            setShowAddComponent(false);
          }}
          variant="underlined" // Using the underlined variant which looks best for this use case
          // Other options: "default", "pills", "boxed"
        />
      </div>
    </div>
  );
}