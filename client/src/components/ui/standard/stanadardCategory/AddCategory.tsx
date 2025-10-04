import React, { useState } from 'react';
import { motion } from 'framer-motion';
import api, { API_ROUTES } from '../../../../utils/api';
import { toast } from 'react-toastify';
import { Save, X, AlertCircle, RefreshCw } from 'lucide-react';

interface AddStandardCategoryProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const AddStandardCategory: React.FC<AddStandardCategoryProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const authToken = localStorage.getItem('authToken');
      await api.post(
        API_ROUTES.STANDARD.CREATE_STANDARD_CATEGORY,
        { name, description },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      toast.success('Category created successfully!', {
        position: 'bottom-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      setName('');
      setDescription('');

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message || 'Failed to create category';
      setError(errorMsg);

      toast.error(errorMsg, {
        position: 'bottom-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className="bg-[var(--background)] rounded-xl shadow-md border border-[var(--border)] overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {error && (
        <motion.div
          className="mx-6 my-4 p-4 bg-[var(--destructive)]/10 border border-[var(--destructive)]/30 rounded-lg flex items-start"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertCircle className="h-5 w-5 text-[var(--destructive)] mr-3 mt-0.5" />
          <div>
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

      <div className="p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
              Category Name*
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-[var(--border)] rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none transition-all duration-200 bg-[var(--background)] text-[var(--foreground)]"
              placeholder="Enter category name"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-[var(--border)] rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none transition-all duration-200 min-h-[120px] bg-[var(--background)] text-[var(--foreground)]"
              placeholder="Provide a description of this category (optional)"
            />
          </div>

          <div className="flex justify-end gap-3">
            {onCancel && (
              <motion.button
                type="button"
                onClick={onCancel}
                className="px-5 py-2.5 border border-[var(--border)] text-[var(--primary)] rounded-lg hover:bg-[var(--primary)]/10 transition-colors flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isSubmitting}
              >
                <X size={16} />
                Cancel
              </motion.button>
            )}

            <motion.button
              type="submit"
              className="px-5 py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg shadow-md flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              whileHover={
                !isSubmitting
                  ? {
                      scale: 1.02,
                      boxShadow:
                        '0 10px 15px -3px var(--primary)/0.3, 0 4px 6px -2px var(--primary)/0.15',
                    }
                  : {}
              }
              whileTap={!isSubmitting ? { scale: 0.98 } : {}}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Create Category</span>
                </>
              )}
            </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default AddStandardCategory;
