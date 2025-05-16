import React from "react";
import { motion } from "framer-motion";
import { FileSpreadsheet, ArrowRight } from "lucide-react";

interface StandardsListProps {
  standards: any[];
}

const StandardsList: React.FC<StandardsListProps> = ({ standards }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100"
    >
      <div className="p-5 bg-gradient-to-r from-purple-50 to-white border-b border-gray-100">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
          <FileSpreadsheet size={18} className="text-purple-600" />
          Recent Standards Created
        </h2>
      </div>
      
      <div className="p-3">
        {standards?.length > 0 ? (
          <div className="space-y-2">
            {standards.map((standard: any, index: number) => (
              <motion.div
                key={standard.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="p-3 rounded-lg hover:bg-gray-50 border border-gray-100 transition-colors"
              >
                <div className="flex justify-between">
                  <h4 className="font-medium text-gray-800">{standard.name}</h4>
                  <span className={`text-xs px-2 rounded-full ${
                    standard.status === 'ACTIVE' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {standard.status}
                  </span>
                </div>
                <div className="mt-1 flex justify-between text-sm">
                  <span className="text-gray-500">{standard.code}</span>
                  <span className="text-purple-500">{standard.category}</span>
                </div>
                <a 
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-2"
                  href={`/standards/${standard.id}`}
                >
                  <span>View Standard</span>
                  <ArrowRight size={10} />
                </a>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-6">No standards created yet</p>
        )}
      </div>
    </motion.div>
  );
};

export default StandardsList;