import React, { useState } from 'react';
import api, { API_ROUTES } from '../../../../utils/api';
import { motion } from 'framer-motion';
import {
  Save,
  X,
  AlertCircle,
  Info,
  Tag,
  Type,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'react-toastify';

interface AddUnitProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const AddUnit: React.FC<AddUnitProps> = ({ onSuccess, onCancel }) => {
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const authToken = localStorage.getItem('authToken');
      await api.post(
        API_ROUTES.UNIT.CREATE_UNIT,
        { name, symbol, description },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      setSuccess(true);
      toast.success('Unit created successfully!', {
        position: 'bottom-right',
        autoClose: 3000,
      });

      // Clear form
      setName('');
      setSymbol('');
      setDescription('');

      // Slight delay before redirecting
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || 'Failed to create unit.';
      setError(errorMessage);
      toast.error(errorMessage, {
        position: 'bottom-right',
        autoClose: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className="bg-[var(--background)] rounded-xl border border-[var(--border)] shadow-md overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Error Message */}
      {error && (
        <motion.div
          className="mx-6 my-4 p-4 bg-[var(--destructive)]/10 border border-[var(--destructive)]/30 rounded-lg flex items-start"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertCircle className="h-5 w-5 text-[var(--destructive)] mr-3 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-[var(--destructive)]">Error</p>
            <p className="text-sm text-[var(--destructive)]/80">{error}</p>
          </div>
          <button
            onClick={() => setError('')}
            className="ml-auto p-1 text-[var(--destructive)] hover:text-[var(--destructive)]/80"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}

      {/* Form */}
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name field */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                Unit Name*
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Type className="h-4 w-4 text-[var(--primary)]" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-[var(--primary)]/20 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none transition-all duration-200 bg-[var(--background)] text-[var(--foreground)]"
                  placeholder="E.g., Kilogram, Meter, Liter"
                  required
                />
              </div>
            </div>

            {/* Symbol field */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                Symbol*
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Tag className="h-4 w-4 text-[var(--primary)]" />
                </div>
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="w-full border border-[var(--primary)]/20 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none transition-all duration-200 bg-[var(--background)] text-[var(--primary)] font-semibold"
                  placeholder="E.g., kg, m, L"
                  required
                />
              </div>
            </div>
          </div>

          {/* Description field */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
              Description
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                <Info className="h-4 w-4 text-[var(--primary)]" />
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-[var(--primary)]/20 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none transition-all duration-200 min-h-[120px] bg-[var(--background)] text-[var(--foreground)]"
                placeholder="Provide additional details about this unit of measurement..."
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <motion.button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 border border-[var(--primary)]/20 text-[var(--primary)] rounded-lg hover:bg-[var(--primary)]/10 transition-colors flex items-center gap-2 shadow-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitting}
            >
              <X size={16} />
              Cancel
            </motion.button>

            <motion.button
              type="submit"
              className={`px-5 py-2.5 rounded-lg shadow-md flex items-center gap-2 ${
                success
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                  : 'bg-[var(--primary)]  text-[var(--primary-foreground)]'
              }`}
              whileHover={
                !isSubmitting && !success
                  ? {
                      scale: 1.02,
                      boxShadow:
                        '0 10px 15px -3px var(--primary)/0.3, 0 4px 6px -2px var(--primary)/0.15',
                    }
                  : {}
              }
              whileTap={!isSubmitting && !success ? { scale: 0.98 } : {}}
              disabled={isSubmitting || success}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Creating...</span>
                </>
              ) : success ? (
                <>
                  <CheckCircle size={16} />
                  <span>Created</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Create Unit</span>
                </>
              )}
            </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default AddUnit;
