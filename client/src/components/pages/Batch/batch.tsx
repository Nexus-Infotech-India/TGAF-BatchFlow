import React from "react";
import ViewBatches from "../../ui/batch/ViewBatches";


const BatchPage: React.FC = () => {
 

  return (
    // Remove the outer flex wrapper with bg-gray-50 that adds the white background
    // Remove the shadow-sm and rounded-lg wrapper div that creates another white layer
    <ViewBatches />
  );
};

export default BatchPage;