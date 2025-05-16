import React, { useEffect, useState } from 'react';
import { dashboardService } from '../dashboard/service';
import { motion } from 'framer-motion';

interface ProductStat {
  id: string;
  name: string;
  code: string;
  totalBatches: number;
  approvedBatches: number;
  rejectedBatches: number;
  pendingBatches: number;
  approvalRate: number;
  lastActivity: string;
}

const ProductPerformance: React.FC = () => {
  const [products, setProducts] = useState<ProductStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProductPerformance = async () => {
      try {
        const response = await dashboardService.getProductPerformance();
        setProducts(response.data.products);
      } catch (err: any) {
        setError(err.message || 'Failed to load product performance data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductPerformance();
  }, []);

  if (isLoading) return (
    <div className="flex items-center justify-center h-64 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl shadow-sm">
      <motion.div 
        className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
  
  if (error) return (
    <div className="p-6 bg-red-50 rounded-xl shadow-sm border border-red-100 text-red-500">
      {error}
    </div>
  );
  
  if (!products || products.length === 0) return (
    <div className="p-6 bg-blue-50 rounded-xl shadow-sm border border-blue-100">
      No product data available
    </div>
  );

  return (
    <motion.div 
      className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-400 text-white">
        <motion.h2 
          className="text-2xl font-bold"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          Product Performance
        </motion.h2>
      </div>
      
      <div className="p-6">
        <motion.div 
          className="bg-white rounded-lg shadow-md overflow-hidden"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-500 to-blue-400 text-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Total Batches
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Approval Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Last Activity
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product, index) => (
                  <motion.tr 
                    key={product.id}
                    className="hover:bg-blue-50 transition-colors duration-150"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 + (index * 0.05) }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-400 rounded-md flex items-center justify-center text-white font-bold">
                          {product.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{product.code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">{product.totalBatches}</div>
                        <div className="ml-2 flex items-center space-x-1 text-xs">
                          <span className="inline-flex px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                            {product.approvedBatches}
                          </span>
                          <span className="inline-flex px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                            {product.rejectedBatches}
                          </span>
                          <span className="inline-flex px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                            {product.pendingBatches}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div 
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-400"
                          style={{ width: `${product.approvalRate}%` }}
                          initial={{ width: '0%' }}
                          animate={{ width: `${product.approvalRate}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                        />
                      </div>
                      <div className="text-xs font-medium text-gray-900 mt-1">
                        {product.approvalRate}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(product.lastActivity).toLocaleDateString()}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ProductPerformance;