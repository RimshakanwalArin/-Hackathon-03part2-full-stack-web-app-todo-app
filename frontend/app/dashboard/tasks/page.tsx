'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Filter, SortAsc, Edit2, Trash2, CheckCircle2, Circle, Calendar } from 'lucide-react'
import { NotificationContainer } from '@/components'
import { api } from '@/lib/api'

interface Task {
  id: number
  title: string
  description: string | null
  completed: boolean
  created_at: string
  updated_at: string
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({ title: '', description: '' })
  const [addLoading, setAddLoading] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  // Load tasks on mount
  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    setLoading(true)
    try {
      const response = await api.task.listTasks()
      if (response.success && response.data?.tasks) {
        setTasks(response.data.tasks)
      }
    } catch (error) {
      console.error('Failed to load tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    setAddLoading(true)
    try {
      const response = await api.task.createTask(formData)
      if (response.success) {
        await loadTasks()
        setFormData({ title: '', description: '' })
        setShowAddModal(false)
      }
    } catch (error) {
      console.error('Failed to create task:', error)
    } finally {
      setAddLoading(false)
    }
  }

  const handleToggleTask = async (task: Task) => {
    try {
      await api.task.updateTask(task.id, { completed: !task.completed })
      await loadTasks()
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  const handleDeleteTask = async (taskId: number) => {
    try {
      await api.task.deleteTask(taskId)
      await loadTasks()
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  }

  const taskVariants = {
    hidden: { opacity: 0, x: -20, y: 20 },
    visible: { opacity: 1, x: 0, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, x: 20, y: -20, transition: { duration: 0.2 } },
    hover: { scale: 1.02, y: -4, transition: { duration: 0.2 } },
  }

  return (
    <>
      <NotificationContainer />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              All Tasks
            </h1>
            <p className="text-gray-400 mt-2">
              {tasks.length} tasks • {tasks.filter(t => !t.completed).length} pending
            </p>
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddModal(true)}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-cyan-500/50 hover:shadow-cyan-500/75 transition-all w-fit"
          >
            <Plus className="w-5 h-5" />
            Add Task
          </motion.button>
        </div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400 z-10" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:bg-white/10 transition-all backdrop-blur-sm"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:border-cyan-500/50 hover:text-cyan-400 transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <Filter className="w-5 h-5" />
            Filter
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:border-cyan-500/50 hover:text-cyan-400 transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <SortAsc className="w-5 h-5" />
            Sort
          </motion.button>
        </motion.div>

        {/* Tasks Grid */}
        <AnimatePresence>
          {loading ? (
            <motion.div className="flex items-center justify-center py-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-12 h-12 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full"
              />
            </motion.div>
          ) : filteredTasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-10 h-10 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No tasks yet</h3>
              <p className="text-gray-400 mb-6">Create your first task to get started</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold"
              >
                Create Task
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredTasks.map((task) => (
                <motion.div
                  key={task.id}
                  variants={taskVariants}
                  whileHover="hover"
                  exit="exit"
                  className="group relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/0 to-purple-500/0 group-hover:from-cyan-500/20 group-hover:via-cyan-500/10 group-hover:to-purple-500/20 rounded-2xl blur-xl transition-all duration-300" />

                  <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-3xl border border-white/20 group-hover:border-cyan-500/50 rounded-2xl p-6 transition-all">
                    {/* Status Checkbox */}
                    <div className="flex items-start justify-between mb-4">
                      <motion.button
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleToggleTask(task)}
                        className="flex-shrink-0 mt-1"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-6 h-6 text-green-400" />
                        ) : (
                          <Circle className="w-6 h-6 text-gray-400 hover:text-cyan-400" />
                        )}
                      </motion.button>

                      {/* Action Buttons */}
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setEditingTaskId(task.id)}
                          className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setDeleteConfirm(task.id)}
                          className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className={`text-lg font-semibold mb-2 line-clamp-2 transition-all ${
                      task.completed
                        ? 'text-gray-500 line-through'
                        : 'text-white'
                    }`}>
                      {task.title}
                    </h3>

                    {/* Description */}
                    {task.description && (
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(task.created_at).toLocaleDateString()}
                      </span>
                      {task.completed && (
                        <span className="text-green-400">Completed</span>
                      )}
                    </div>
                  </div>

                  {/* Delete Confirmation */}
                  <AnimatePresence>
                    {deleteConfirm === task.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute inset-0 rounded-2xl bg-red-500/20 border border-red-500/50 backdrop-blur-sm flex items-center justify-center gap-2 z-50"
                      >
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDeleteTask(task.id)}
                          className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600"
                        >
                          Delete
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setDeleteConfirm(null)}
                          className="px-3 py-1.5 rounded-lg border border-white/20 text-white text-sm font-medium hover:bg-white/10"
                        >
                          Cancel
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Task Modal */}
        <AnimatePresence>
          {showAddModal && (
            <>
              <motion.div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAddModal(false)}
              />

              <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
                <motion.div
                  className="w-full max-w-md"
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ duration: 0.3, type: 'spring', damping: 25 }}
                >
                  <div className="relative glass rounded-3xl p-8 border border-white/20">
                    <h2 className="text-2xl font-bold text-white mb-1">Create Task</h2>
                    <p className="text-gray-400 text-sm mb-6">Add a new task to your list</p>

                    <form onSubmit={handleAddTask} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Title *
                        </label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="What do you want to accomplish?"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:bg-white/10 transition-all"
                        />
                        <span className="text-xs text-gray-500 mt-1 block">
                          {formData.title.length}/200
                        </span>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Description
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Add more details..."
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:bg-white/10 transition-all resize-none"
                          rows={3}
                        />
                        <span className="text-xs text-gray-500 mt-1 block">
                          {formData.description.length}/1000
                        </span>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setShowAddModal(false)}
                          className="flex-1 py-3 rounded-xl border border-white/20 text-gray-300 font-semibold hover:bg-white/5 transition-all"
                        >
                          Cancel
                        </motion.button>
                        <motion.button
                          type="submit"
                          disabled={addLoading}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/50 hover:shadow-cyan-500/75 transition-all disabled:opacity-50"
                        >
                          {addLoading ? (
                            <>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity }}
                                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                              />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Plus className="w-5 h-5" />
                              Create
                            </>
                          )}
                        </motion.button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}
