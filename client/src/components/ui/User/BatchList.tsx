import React from "react";
import { motion } from "framer-motion";
import { Package, ClipboardCheck, ArrowRight } from "lucide-react";

interface BatchListProps {
  title: string;
  icon: "created" | "reviewed";
  batches: any[];
  timeAgo: (dateString: string) => string;
}

const BatchList: React.FC<BatchListProps> = ({ title, icon, batches, timeAgo }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: icon === "created" ? 0.3 : 0.4 }}
      className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100"
    >
      <div className="tabs flex">
        <div className={`tab flex-1 p-5 bg-gradient-to-r ${
          icon === "created" 
            ? "from-blue-50 to-white border-b-2 border-blue-500" 
            : "from-indigo-50 to-white border-b-2 border-indigo-500"
        }`}>
          <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-800">
            {icon === "created" ? (
              <Package size={20} className="text-blue-600" />
            ) : (
              <ClipboardCheck size={20} className="text-indigo-600" />
            )}
            {title}
          </h2>
        </div>
      </div>
      
      <div className="p-5">
        {batches?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-full">
              <thead>
                <tr className="text-left bg-gray-50 text-gray-500 text-sm">
                  <th className="px-3 py-3 rounded-tl-lg">Batch #</th>
                  <th className="px-3 py-3">Product</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">{icon === "created" ? "Created" : "Reviewed"}</th>
                  <th className="px-3 py-3 rounded-tr-lg">Actions</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch: any, index: number) => (
                  <motion.tr 
                    key={batch.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className="border-b border-gray-100 text-gray-800"
                  >
                    <td className="px-3 py-3">{batch.batchNumber}</td>
                    <td className="px-3 py-3">{batch.productName}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        batch.status === 'APPROVED' 
                          ? 'bg-green-100 text-green-700' 
                          : batch.status === 'REJECTED' 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {batch.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-gray-500 text-sm">{timeAgo(batch.createdAt)}</td>
                    <td className="px-3 py-3">
                      <a 
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                        href={`/batches/${batch.id}`}
                      >
                        <span>View</span>
                        <ArrowRight size={12} />
                      </a>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-6">
            No batches {icon === "created" ? "created" : "reviewed"} yet
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default BatchList;