import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpFromLine } from 'lucide-react';
import OutboundTransfers from './OutboundTransfers';

const OutboundToSFGPage: React.FC = () => {
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
              <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                <ArrowUpFromLine className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Outbound to SFG Warehouse</h1>
                <p className="text-muted-foreground text-sm">
                  Dispatch finished SFG, byproducts & scrap from grinding to SFG warehouse
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            <OutboundTransfers />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default OutboundToSFGPage;
