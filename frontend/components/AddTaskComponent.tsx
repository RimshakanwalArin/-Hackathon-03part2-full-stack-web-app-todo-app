'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { api } from '@/lib/api';
import { showNotification } from './Notification';
import { Task, TaskFormData } from './types';

interface AddTaskComponentProps {
  onTaskAdded?: (task: Task) => void;
  onClose?: () => void;
}

export function AddTaskComponent({ onTaskAdded, onClose }: AddTaskComponentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showNotification({ type: 'error', message: 'Please fix the errors below' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.task.createTask({
        title: formData.title,
        description: formData.description || undefined,
      });

      console.log('Backend Response:', response); // Debug ke liye

      // ✅ FIX: Backend se jo bhi format aaye, use handle karein
      let taskId: number;
      let taskData: Task;

      if (response.success && response.data) {
        // Agar response.data mein task_id hai (current backend format)
        if ('task_id' in response.data) {
          taskId = response.data.task_id;
          
          // Manual task object banayein
          taskData = {
            id: taskId,                          // task_id ko id mein convert
            title: formData.title,
            description: formData.description || null,
            completed: false,
            user_id: '',                         // Backend se milega eventually
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        } 
        // Agar response.data mein id hai (updated backend format)
        else if ('id' in response.data) {
          taskData = response.data as Task;
        } 
        else {
          throw new Error('Invalid response format from backend');
        }

        showNotification({
          type: 'success',
          message: `Task "${formData.title}" created successfully!`,
        });

        // Reset form
        setFormData({ title: '', description: '' });
        setErrors({});
        setIsOpen(false);

        // Call onTaskAdded callback with proper task data
        if (onTaskAdded) {
          onTaskAdded(taskData);
        }
      } else {
        throw new Error(response.error?.message || 'Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      showNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to create task',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setFormData({ title: '', description: '' });
    setErrors({});
    onClose?.();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  const contentVariants = {
    hidden: { scale: 0.95, opacity: 0, y: 10 },
    visible: { scale: 1, opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { scale: 0.95, opacity: 0, y: 10, transition: { duration: 0.2 } },
  };

  const formVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const fieldVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  };

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-md"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Task
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={handleClose}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
            />

            {/* Modal Content */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <motion.div
                variants={contentVariants}
                className="bg-white rounded-xl shadow-xl max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">Create New Task</h2>
                  <motion.button
                    onClick={handleClose}
                    whileHover={{ rotate: 90, scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <motion.div variants={formVariants} initial="hidden" animate="visible">
                    {/* Title Field */}
                    <motion.div variants={fieldVariants} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Task Title *
                      </label>
                      <motion.input
                        whileFocus={{ scale: 1.01 }}
                        type="text"
                        value={formData.title}
                        onChange={(e) => {
                          setFormData({ ...formData, title: e.target.value });
                          if (errors.title) setErrors({ ...errors, title: '' });
                        }}
                        placeholder="Enter task title"
                        maxLength={200}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                          errors.title
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                      />
                      {errors.title && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-sm text-red-600"
                        >
                          {errors.title}
                        </motion.p>
                      )}
                      <div className="text-xs text-gray-500">
                        {formData.title.length}/200
                      </div>
                    </motion.div>

                    {/* Description Field */}
                    <motion.div variants={fieldVariants} className="space-y-2 mt-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <motion.textarea
                        whileFocus={{ scale: 1.01 }}
                        value={formData.description}
                        onChange={(e) => {
                          setFormData({ ...formData, description: e.target.value });
                          if (errors.description) setErrors({ ...errors, description: '' });
                        }}
                        placeholder="Enter task description (optional)"
                        maxLength={1000}
                        rows={4}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all resize-none ${
                          errors.description
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                      />
                      {errors.description && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-sm text-red-600"
                        >
                          {errors.description}
                        </motion.p>
                      )}
                      <div className="text-xs text-gray-500">
                        {formData.description?.length || 0}/1000
                      </div>
                    </motion.div>
                  </motion.div>

                  {/* Action Buttons */}
                  <motion.div
                    variants={fieldVariants}
                    className="flex gap-3 mt-6 pt-4 border-t border-gray-200"
                  >
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={handleClose}
                      className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                          />
                          Creating...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Create Task
                        </>
                      )}
                    </motion.button>
                  </motion.div>
                </form>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}





