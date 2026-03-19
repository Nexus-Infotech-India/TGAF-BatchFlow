import React from 'react';
import { motion } from 'framer-motion';
import { Factory } from 'lucide-react';
import ProductionEntry from './ProductionEntry';

const SFGProcessingPage: React.FC = () => {
  return (
    <motion.div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          className="bg-card rounded-2xl border border-border overflow-hidden"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                <Factory className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">SFG Processing</h1>
                <p className="text-muted-foreground text-sm">
                  Record shift production entries driven by BOM and output Semi-Finished Goods
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            <ProductionEntry />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SFGProcessingPage;
