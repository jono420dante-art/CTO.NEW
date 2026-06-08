import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ListTodo,
  Plus,
  Search,
  Play,
  Pause,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  Calendar,
  Flag,
  Bot,
  RefreshCw,
} from 'lucide-react'
import { supabase, type Task, type Agent } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Header from '../components/Layout/Header'
import { formatDistanceToNow, format } from 'date-fns'
import type { RealtimeChannel } from '@supabase/supabase-js'

type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
type TaskPriority = 'low' | 'medium' | 'high' | 'critical'

const statusConfig: Record<TaskStatus, { color: string; bg: string; label: string; icon: typeof ListTodo }> = {
  pending: { color: 'text-slate-500', bg: 'bg-slate-400', label: 'Pending', icon: Clock },
  running: { color: 'text-primary-600', bg: 'bg-primary-500', label: 'Running', icon: Loader2 },
  completed: { color: 'text-success-600', bg: 'bg-success-500', label: 'Completed', icon: CheckCircle2 },
  failed: { color: 'text-error-600', bg: 'bg-error-500', label: 'Failed', icon: XCircle },
  cancelled: { color: 'text-slate-600', bg: 'bg-slate-500', label: 'Cancelled', icon: AlertCircle },
}

const priorityConfig: Record<TaskPriority, { color: string; bg: string; label: string }> = {
  low: { color: 'text-slate-500', bg: 'bg-slate-100', label: 'Low' },
  medium: { color: 'text-primary-600', bg: 'bg-primary-100', label: 'Medium' },
  high: { color: 'text-warning-600', bg: 'bg-warning-100', label: 'High' },
  critical: { color: 'text-error-600', bg: 'bg-error-100', label: 'Critical' },
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function Tasks() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all')
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      const [tasksRes, agentsRes] = await Promise.all([
        supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('agents')
          .select('id, name, type, status'),
      ])

      if (tasksRes.data) setTasks(tasksRes.data as Task[])
      if (agentsRes.data) setAgents(agentsRes.data as Agent[])
      setLoading(false)
    }

    fetchData()

    const channel: RealtimeChannel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => fetchData()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const handleCreateTask = async (taskData: Partial<Task>) => {
    if (!user) return

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        title: taskData.title || 'New Task',
        description: taskData.description,
        agent_id: taskData.agent_id,
        priority: taskData.priority || 'medium',
        input_data: taskData.input_data || {},
        tags: taskData.tags || [],
      })
      .select()
      .single()

    if (!error && data) {
      setTasks([data as Task, ...tasks])
      setShowCreateModal(false)
    }
  }

  const handleUpdateTaskStatus = async (taskId: string, status: TaskStatus) => {
    const updates: Partial<Task> = { status }
    if (status === 'running') updates.started_at = new Date().toISOString()
    if (status === 'completed' || status === 'failed') {
      updates.completed_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)

    if (!error) {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, ...updates } : t))
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (!error) {
      setTasks(tasks.filter(t => t.id !== taskId))
      setSelectedTask(null)
    }
  }

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority
    return matchesSearch && matchesStatus && matchesPriority
  })

  const getAgentName = (agentId: string | null) => {
    if (!agentId) return 'Unassigned'
    const agent = agents.find(a => a.id === agentId)
    return agent?.name || 'Unknown'
  }

  const statusCounts = {
    all: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    running: tasks.filter(t => t.status === 'running').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    failed: tasks.filter(t => t.status === 'failed').length,
  }

  return (
    <div className="min-h-screen">
      <Header
        title="Tasks"
        subtitle="Orchestrate and monitor task execution"
        action={{ label: 'New Task', onClick: () => setShowCreateModal(true) }}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="p-6"
      >
        {/* Status Tabs */}
        <motion.div variants={itemVariants} className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(['all', 'pending', 'running', 'completed', 'failed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                filterStatus === status
                  ? 'bg-primary-500 text-white shadow-lg'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                filterStatus === status ? 'bg-white/20' : 'bg-slate-200'
              }`}>
                {statusCounts[status]}
              </span>
            </button>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div variants={itemVariants} className="card p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-xs">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                />
              </div>
            </div>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as TaskPriority | 'all')}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </motion.div>

        {/* Tasks List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <motion.div
            variants={itemVariants}
            className="card p-12 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <ListTodo className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No tasks found</h3>
            <p className="text-slate-500 mb-4">Create your first task to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              <Plus className="w-5 h-5" />
              Create Task
            </button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  agentName={getAgentName(task.agent_id)}
                  onSelect={() => setSelectedTask(task)}
                  onUpdateStatus={handleUpdateTaskStatus}
                  onDelete={handleDeleteTask}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Create Task Modal */}
      <TaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTask}
        agents={agents}
      />

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          agentName={getAgentName(selectedTask.agent_id)}
          onClose={() => setSelectedTask(null)}
          onUpdateStatus={handleUpdateTaskStatus}
          onDelete={handleDeleteTask}
        />
      )}
    </div>
  )
}

function TaskItem({
  task,
  agentName,
  onSelect,
  onUpdateStatus,
  onDelete,
}: {
  task: Task
  agentName: string
  onSelect: () => void
  onUpdateStatus: (id: string, status: TaskStatus) => void
  onDelete: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const statusConf = statusConfig[task.status]
  const priorityConf = priorityConfig[task.priority]
  const StatusIcon = statusConf.icon

  return (
    <motion.div
      layoutId={`task-${task.id}`}
      variants={itemVariants}
      className="card overflow-hidden"
    >
      <div
        onClick={onSelect}
        className="p-4 cursor-pointer hover:bg-slate-50 transition-all"
      >
        <div className="flex items-start gap-4">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
            className="mt-1 w-6 h-6 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-all"
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            task.status === 'running' ? 'bg-primary-100' : statusConf.bg + '/10'
          }`}>
            <StatusIcon className={`w-4 h-4 ${
              task.status === 'running' ? 'text-primary-600 animate-spin' : statusConf.color
            }`} />
          </div>

          <div className="flex-1 min-w-0 grid grid-cols-12 gap-4 items-center">
            <div className="col-span-4">
              <h3 className="font-medium text-slate-900 truncate">{task.title}</h3>
              <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                <Bot className="w-4 h-4" />
                <span>{agentName}</span>
              </div>
            </div>

            <div className="col-span-2 flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${priorityConf.bg} ${priorityConf.color}`}>
                {priorityConf.label}
              </span>
              <Flag className={`w-4 h-4 ${priorityConf.color}`} />
            </div>

            <div className="col-span-2">
              <span className={`text-sm font-medium ${statusConf.color}`}>
                {statusConf.label}
              </span>
            </div>

            <div className="col-span-2 text-sm text-slate-500">
              {task.completed_at
                ? formatDistanceToNow(new Date(task.completed_at), { addSuffix: true })
                : task.started_at
                ? `Started ${formatDistanceToNow(new Date(task.started_at), { addSuffix: true })}`
                : formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
            </div>

            <div className="col-span-2 flex items-center gap-2 justify-end">
              {task.status === 'pending' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onUpdateStatus(task.id, 'running')
                  }}
                  className="w-8 h-8 rounded-lg bg-success-100 text-success-600 hover:bg-success-200 flex items-center justify-center transition-all"
                >
                  <Play className="w-4 h-4" />
                </button>
              )}
              {task.status === 'running' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onUpdateStatus(task.id, 'cancelled')
                  }}
                  className="w-8 h-8 rounded-lg bg-warning-100 text-warning-600 hover:bg-warning-200 flex items-center justify-center transition-all"
                >
                  <Pause className="w-4 h-4" />
                </button>
              )}
              {task.status === 'failed' && task.retry_count < task.max_retries && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onUpdateStatus(task.id, 'pending')
                  }}
                  className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 hover:bg-primary-200 flex items-center justify-center transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(task.id)
                }}
                className="w-8 h-8 rounded-lg bg-error-100 text-error-600 hover:bg-error-200 flex items-center justify-center transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-200 bg-slate-50"
          >
            <div className="p-4 grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-slate-500 mb-1">Description</p>
                <p className="text-slate-700">{task.description || 'No description'}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {task.tags.length > 0 ? (
                    task.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-slate-200 rounded text-xs text-slate-600">
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400">No tags</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Duration</p>
                <p className="text-slate-700 font-mono">
                  {task.actual_duration_seconds
                    ? `${Math.floor(task.actual_duration_seconds / 60)}m ${task.actual_duration_seconds % 60}s`
                    : task.estimated_duration_seconds
                    ? `~${Math.floor(task.estimated_duration_seconds / 60)}m (estimated)`
                    : 'Not available'}
                </p>
              </div>
              {task.error_message && (
                <div className="col-span-3">
                  <p className="text-slate-500 mb-1">Error</p>
                  <p className="text-error-600 bg-error-100 p-2 rounded-lg">{task.error_message}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function TaskModal({
  isOpen,
  onClose,
  onSubmit,
  agents,
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Partial<Task>) => void
  agents: Agent[]
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [agentId, setAgentId] = useState<string>('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ title, description, agent_id: agentId || null, priority, tags })
    setTitle('')
    setDescription('')
    setAgentId('')
    setPriority('medium')
    setTags([])
  }

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-auto"
      >
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Create New Task</h2>
          <p className="text-sm text-slate-500">Define a new task for your agents</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Task Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Analyze codebase performance"
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed task description..."
              className="input min-h-20 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Assign to Agent
            </label>
            <select
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              className="input"
            >
              <option value="">Auto-assign</option>
              <optgroup label="Active Agents">
                {agents.filter(a => a.status === 'active').map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} ({agent.type})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Idle Agents">
                {agents.filter(a => a.status === 'idle').map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} ({agent.type})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Priority
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(priorityConfig) as TaskPriority[]).map((p) => {
                const config = priorityConfig[p]
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`p-2.5 rounded-xl border-2 transition-all ${
                      priority === p
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Flag className={`w-5 h-5 mx-auto mb-1 ${config.color}`} />
                    <span className="text-xs text-slate-600">{config.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tags
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add tag..."
                className="input flex-1"
              />
              <button type="button" onClick={addTag} className="btn btn-secondary">
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-primary-100 text-primary-700 rounded-lg text-sm flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => setTags(tags.filter((t) => t !== tag))}
                      className="hover:text-primary-900"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary flex-1">
              <Plus className="w-4 h-4" />
              Create Task
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

function TaskDetailModal({
  task,
  agentName,
  onClose,
  onUpdateStatus,
  onDelete,
}: {
  task: Task
  agentName: string
  onClose: () => void
  onUpdateStatus: (id: string, status: TaskStatus) => void
  onDelete: (id: string) => void
}) {
  const statusConf = statusConfig[task.status]
  const priorityConf = priorityConfig[task.priority]
  const StatusIcon = statusConf.icon

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto"
      >
        <div className="p-6 border-b border-slate-200 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                task.status === 'running' ? 'bg-primary-100' : statusConf.bg + '/10'
              }`}>
                <StatusIcon className={`w-5 h-5 ${
                  task.status === 'running' ? 'text-primary-600 animate-spin' : statusConf.color
                }`} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{task.title}</h2>
                <div className="flex items-center gap-2 text-sm">
                  <span className={`font-medium ${statusConf.color}`}>{statusConf.label}</span>
                  <span className="text-slate-400">|</span>
                  <span className={`${priorityConf.color}`}>{priorityConf.label} priority</span>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"
          >
            &times;
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-medium text-slate-500">Assigned Agent</span>
              </div>
              <p className="text-slate-900 font-medium">{agentName}</p>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-medium text-slate-500">Created</span>
              </div>
              <p className="text-slate-900 font-medium">
                {format(new Date(task.created_at), 'PPp')}
              </p>
            </div>
          </div>

          {task.description && (
            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-2">Description</h3>
              <p className="text-slate-700">{task.description}</p>
            </div>
          )}

          {task.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-primary-600 font-mono">
                {task.actual_duration_seconds
                  ? `${Math.floor(task.actual_duration_seconds / 60)}m`
                  : task.estimated_duration_seconds
                  ? `~${Math.floor(task.estimated_duration_seconds / 60)}m`
                  : '-'}
              </p>
              <p className="text-sm text-slate-500">Duration</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-slate-900 font-mono">
                {task.retry_count}/{task.max_retries}
              </p>
              <p className="text-sm text-slate-500">Retries</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">
                {task.parent_task_id ? 'Yes' : 'No'}
              </p>
              <p className="text-sm text-slate-500">Subtask</p>
            </div>
          </div>

          {task.error_message && (
            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-2">Error Message</h3>
              <div className="bg-error-100 border border-error-200 rounded-xl p-4">
                <p className="text-error-700">{task.error_message}</p>
              </div>
            </div>
          )}

          {(task.input_data || task.output_data) && (
            <div className="grid grid-cols-2 gap-4">
              {task.input_data && Object.keys(task.input_data).length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-2">Input Data</h3>
                  <div className="bg-slate-900 rounded-xl p-4 overflow-auto max-h-48">
                    <pre className="text-sm text-slate-100 font-mono">
                      {JSON.stringify(task.input_data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              {task.output_data && Object.keys(task.output_data).length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-2">Output Data</h3>
                  <div className="bg-slate-900 rounded-xl p-4 overflow-auto max-h-48">
                    <pre className="text-sm text-slate-100 font-mono">
                      {JSON.stringify(task.output_data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-slate-200">
            {task.status === 'pending' && (
              <button
                onClick={() => onUpdateStatus(task.id, 'running')}
                className="btn btn-success flex-1"
              >
                <Play className="w-4 h-4" />
                Start Task
              </button>
            )}
            {task.status === 'running' && (
              <button
                onClick={() => onUpdateStatus(task.id, 'completed')}
                className="btn btn-success flex-1"
              >
                <CheckCircle2 className="w-4 h-4" />
                Complete
              </button>
            )}
            {task.status === 'failed' && task.retry_count < task.max_retries && (
              <button
                onClick={() => onUpdateStatus(task.id, 'pending')}
                className="btn btn-primary flex-1"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            )}
            <button
              onClick={() => {
                onDelete(task.id)
                onClose()
              }}
              className="btn btn-danger flex-1"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
