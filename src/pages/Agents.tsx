import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Play,
  Pause,
  Trash2,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Zap,
} from 'lucide-react'
import { supabase, type Agent } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Header from '../components/Layout/Header'
import type { RealtimeChannel } from '@supabase/supabase-js'

type AgentType = 'explorer' | 'builder' | 'analyzer' | 'coordinator' | 'monitor'
type AgentStatus = 'active' | 'idle' | 'error' | 'paused' | 'maintenance'

const agentTypeConfig: Record<AgentType, { color: string; gradient: string; icon: typeof Bot }> = {
  explorer: { color: 'text-blue-600', gradient: 'from-blue-500 to-blue-600', icon: Search },
  builder: { color: 'text-emerald-600', gradient: 'from-emerald-500 to-emerald-600', icon: Plus },
  analyzer: { color: 'text-primary-600', gradient: 'from-primary-500 to-primary-600', icon: Activity },
  coordinator: { color: 'text-warning-600', gradient: 'from-warning-500 to-amber-600', icon: Zap },
  monitor: { color: 'text-accent-600', gradient: 'from-accent-500 to-teal-600', icon: Eye },
}

const statusConfig: Record<AgentStatus, { color: string; bg: string; label: string }> = {
  active: { color: 'text-success-600', bg: 'bg-success-500', label: 'Active' },
  idle: { color: 'text-slate-500', bg: 'bg-slate-400', label: 'Idle' },
  error: { color: 'text-error-600', bg: 'bg-error-500', label: 'Error' },
  paused: { color: 'text-warning-600', bg: 'bg-warning-500', label: 'Paused' },
  maintenance: { color: 'text-slate-600', bg: 'bg-slate-500', label: 'Maintenance' },
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1 },
}

export default function Agents() {
  const { user } = useAuth()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<AgentStatus | 'all'>('all')
  const [filterType, setFilterType] = useState<AgentType | 'all'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)

  useEffect(() => {
    if (!user) return

    const fetchAgents = async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setAgents(data as Agent[])
      }
      setLoading(false)
    }

    fetchAgents()

    const channel: RealtimeChannel = supabase
      .channel('agents-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agents' },
        () => {
          fetchAgents()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const handleCreateAgent = async (agentData: Partial<Agent>) => {
    if (!user) return

    const { data, error } = await supabase
      .from('agents')
      .insert({
        user_id: user.id,
        name: agentData.name || 'New Agent',
        type: agentData.type || 'explorer',
        status: 'idle',
        config: agentData.config || {},
        capabilities: agentData.capabilities || [],
        description: agentData.description,
      })
      .select()
      .single()

    if (!error && data) {
      setAgents([data as Agent, ...agents])
      setShowCreateModal(false)
    }
  }

  const handleUpdateAgentStatus = async (agentId: string, status: AgentStatus) => {
    const { error } = await supabase
      .from('agents')
      .update({ status, last_active_at: new Date().toISOString() })
      .eq('id', agentId)

    if (!error) {
      setAgents(agents.map(a => a.id === agentId ? { ...a, status } : a))
    }
  }

  const handleDeleteAgent = async (agentId: string) => {
    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', agentId)

    if (!error) {
      setAgents(agents.filter(a => a.id !== agentId))
    }
  }

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || agent.status === filterStatus
    const matchesType = filterType === 'all' || agent.type === filterType
    return matchesSearch && matchesStatus && matchesType
  })

  return (
    <div className="min-h-screen">
      <Header
        title="Agents"
        subtitle="Manage and monitor your agent fleet"
        action={{ label: 'New Agent', onClick: () => setShowCreateModal(true) }}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="p-6"
      >
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
                  placeholder="Search agents..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as AgentStatus | 'all')}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="idle">Idle</option>
                <option value="paused">Paused</option>
                <option value="error">Error</option>
                <option value="maintenance">Maintenance</option>
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as AgentType | 'all')}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="all">All Types</option>
                <option value="explorer">Explorer</option>
                <option value="builder">Builder</option>
                <option value="analyzer">Analyzer</option>
                <option value="coordinator">Coordinator</option>
                <option value="monitor">Monitor</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </motion.div>

        {/* Agent Grid/List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
          </div>
        ) : filteredAgents.length === 0 ? (
          <motion.div
            variants={itemVariants}
            className="card p-12 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No agents found</h3>
            <p className="text-slate-500 mb-4">Create your first agent to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              <Plus className="w-5 h-5" />
              Create Agent
            </button>
          </motion.div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {filteredAgents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onSelect={() => setSelectedAgent(agent)}
                  onUpdateStatus={handleUpdateAgentStatus}
                  onDelete={handleDeleteAgent}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredAgents.map((agent) => (
                <AgentListItem
                  key={agent.id}
                  agent={agent}
                  onSelect={() => setSelectedAgent(agent)}
                  onUpdateStatus={handleUpdateAgentStatus}
                  onDelete={handleDeleteAgent}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Create Agent Modal */}
      <AgentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateAgent}
      />

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <AgentDetailModal
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
          onUpdateStatus={handleUpdateAgentStatus}
          onDelete={handleDeleteAgent}
        />
      )}
    </div>
  )
}

function AgentCard({
  agent,
  onSelect,
  onUpdateStatus,
  onDelete,
}: {
  agent: Agent
  onSelect: () => void
  onUpdateStatus: (id: string, status: AgentStatus) => void
  onDelete: (id: string) => void
}) {
  const [showMenu, setShowMenu] = useState(false)
  const typeConfig = agentTypeConfig[agent.type]
  const statusConf = statusConfig[agent.status]
  const Icon = typeConfig.icon

  return (
    <motion.div
      layoutId={`agent-${agent.id}`}
      variants={itemVariants}
      whileHover={{ y: -4 }}
      onClick={onSelect}
      className="card p-5 cursor-pointer group relative"
    >
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowMenu(!showMenu)
          }}
          className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all"
        >
          <MoreVertical className="w-5 h-5" />
        </button>

        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-10"
            >
              <button
                onClick={() => {
                  onUpdateStatus(agent.id, agent.status === 'active' ? 'paused' : 'active')
                  setShowMenu(false)
                }}
                className="w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                {agent.status === 'active' ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Pause Agent
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Activate Agent
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  onDelete(agent.id)
                  setShowMenu(false)
                }}
                className="w-full px-4 py-2 text-sm text-error-600 hover:bg-error-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Agent
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-start gap-4 mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${typeConfig.gradient} flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 truncate">{agent.name}</h3>
          <p className="text-sm text-slate-500 capitalize">{agent.type}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className={`status-dot ${statusConf.bg}`} />
        <span className={`text-sm font-medium ${statusConf.color}`}>
          {statusConf.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-success-500" />
          <span className="text-slate-600">{agent.total_tasks_completed}</span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="w-4 h-4 text-error-500" />
          <span className="text-slate-600">{agent.total_tasks_failed}</span>
        </div>
        <div className="flex items-center gap-2 col-span-2">
          <Clock className="w-4 h-4 text-slate-400" />
          <span className="text-slate-600">
            {agent.avg_completion_time_seconds > 0
              ? `${Math.floor(agent.avg_completion_time_seconds / 60)}m avg`
              : 'No data'}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

function AgentListItem({
  agent,
  onSelect,
  onUpdateStatus,
  onDelete,
}: {
  agent: Agent
  onSelect: () => void
  onUpdateStatus: (id: string, status: AgentStatus) => void
  onDelete: (id: string) => void
}) {
  const typeConfig = agentTypeConfig[agent.type]
  const statusConf = statusConfig[agent.status]
  const Icon = typeConfig.icon

  return (
    <motion.div
      layoutId={`agent-${agent.id}`}
      variants={itemVariants}
      whileHover={{ x: 4 }}
      onClick={onSelect}
      className="card p-4 cursor-pointer flex items-center gap-4"
    >
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${typeConfig.gradient} flex items-center justify-center shadow-lg`}>
        <Icon className="w-5 h-5 text-white" />
      </div>

      <div className="flex-1 min-w-0 grid grid-cols-12 gap-4 items-center">
        <div className="col-span-3">
          <h3 className="font-semibold text-slate-900 truncate">{agent.name}</h3>
          <p className="text-sm text-slate-500 capitalize">{agent.type}</p>
        </div>

        <div className="col-span-2 flex items-center gap-2">
          <div className={`status-dot ${statusConf.bg}`} />
          <span className={`text-sm font-medium ${statusConf.color}`}>
            {statusConf.label}
          </span>
        </div>

        <div className="col-span-2">
          <p className="text-sm text-slate-900 font-medium">{agent.total_tasks_completed}</p>
          <p className="text-xs text-slate-500">Completed</p>
        </div>

        <div className="col-span-2">
          <p className="text-sm text-slate-900 font-medium">
            {agent.total_tasks_failed > 0
              ? `${((agent.total_tasks_failed / (agent.total_tasks_completed + agent.total_tasks_failed)) * 100).toFixed(1)}%`
              : '0%'}
          </p>
          <p className="text-xs text-slate-500">Error rate</p>
        </div>

        <div className="col-span-2">
          <p className="text-sm text-slate-900 font-medium font-mono">
            {agent.avg_completion_time_seconds > 0
              ? `${Math.floor(agent.avg_completion_time_seconds / 60)}m ${agent.avg_completion_time_seconds % 60}s`
              : '-'}
          </p>
          <p className="text-xs text-slate-500">Avg duration</p>
        </div>

        <div className="col-span-1 flex items-center gap-2 justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onUpdateStatus(agent.id, agent.status === 'active' ? 'paused' : 'active')
            }}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              agent.status === 'active'
                ? 'bg-warning-100 text-warning-600 hover:bg-warning-200'
                : 'bg-success-100 text-success-600 hover:bg-success-200'
            }`}
          >
            {agent.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(agent.id)
            }}
            className="w-8 h-8 rounded-lg bg-error-100 text-error-600 hover:bg-error-200 flex items-center justify-center transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function AgentModal({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Partial<Agent>) => void
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState<AgentType>('explorer')
  const [description, setDescription] = useState('')
  const [capabilities, setCapabilities] = useState<string[]>([])
  const [capabilityInput, setCapabilityInput] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ name, type, description, capabilities })
    setName('')
    setType('explorer')
    setDescription('')
    setCapabilities([])
  }

  const addCapability = () => {
    if (capabilityInput.trim() && !capabilities.includes(capabilityInput.trim())) {
      setCapabilities([...capabilities, capabilityInput.trim()])
      setCapabilityInput('')
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
      >
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Create New Agent</h2>
          <p className="text-sm text-slate-500">Configure your agent's properties</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Agent Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Data Explorer Pro"
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Agent Type
            </label>
            <div className="grid grid-cols-5 gap-2">
              {(Object.keys(agentTypeConfig) as AgentType[]).map((t) => {
                const config = agentTypeConfig[t]
                const Icon = config.icon
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                      type === t
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${config.color}`} />
                    <span className="text-xs capitalize text-slate-600">{t}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this agent does..."
              className="input min-h-20 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Capabilities
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={capabilityInput}
                onChange={(e) => setCapabilityInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCapability())}
                placeholder="Add capability..."
                className="input flex-1"
              />
              <button
                type="button"
                onClick={addCapability}
                className="btn btn-secondary"
              >
                Add
              </button>
            </div>
            {capabilities.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {capabilities.map((cap) => (
                  <span
                    key={cap}
                    className="px-2 py-1 bg-primary-100 text-primary-700 rounded-lg text-sm flex items-center gap-1"
                  >
                    {cap}
                    <button
                      type="button"
                      onClick={() => setCapabilities(capabilities.filter((c) => c !== cap))}
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
              Create Agent
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

function AgentDetailModal({
  agent,
  onClose,
  onUpdateStatus,
  onDelete,
}: {
  agent: Agent
  onClose: () => void
  onUpdateStatus: (id: string, status: AgentStatus) => void
  onDelete: (id: string) => void
}) {
  const typeConfig = agentTypeConfig[agent.type]
  const statusConf = statusConfig[agent.status]
  const Icon = typeConfig.icon

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
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${typeConfig.gradient} flex items-center justify-center shadow-lg`}>
              <Icon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{agent.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <div className={`status-dot ${statusConf.bg}`} />
                <span className={`text-sm font-medium ${statusConf.color}`}>
                  {statusConf.label}
                </span>
                <span className="text-slate-400">|</span>
                <span className="text-sm text-slate-500 capitalize">{agent.type}</span>
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
          {agent.description && (
            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-2">Description</h3>
              <p className="text-slate-700">{agent.description}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-success-600">{agent.total_tasks_completed}</p>
              <p className="text-sm text-slate-500">Tasks Completed</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-error-600">{agent.total_tasks_failed}</p>
              <p className="text-sm text-slate-500">Tasks Failed</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-primary-600 font-mono">
                {agent.avg_completion_time_seconds > 0
                  ? `${Math.floor(agent.avg_completion_time_seconds / 60)}m`
                  : '-'}
              </p>
              <p className="text-sm text-slate-500">Avg. Duration</p>
            </div>
          </div>

          {agent.capabilities.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-2">Capabilities</h3>
              <div className="flex flex-wrap gap-2">
                {agent.capabilities.map((cap) => (
                  <span
                    key={cap}
                    className="px-3 py-1.5 bg-primary-100 text-primary-700 rounded-lg text-sm"
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-slate-500 mb-2">Configuration</h3>
            <div className="bg-slate-900 rounded-xl p-4 overflow-auto">
              <pre className="text-sm text-slate-100 font-mono">
                {JSON.stringify(agent.config, null, 2)}
              </pre>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Model</span>
              <span className="font-medium text-slate-900 font-mono">{agent.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Created</span>
              <span className="font-medium text-slate-900">
                {new Date(agent.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Last Active</span>
              <span className="font-medium text-slate-900">
                {agent.last_active_at
                  ? new Date(agent.last_active_at).toLocaleString()
                  : 'Never'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Public</span>
              <span className="font-medium text-slate-900">{agent.is_public ? 'Yes' : 'No'}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={() => onUpdateStatus(agent.id, agent.status === 'active' ? 'paused' : 'active')}
              className={`btn flex-1 ${agent.status === 'active' ? 'btn-secondary' : 'btn-success'}`}
            >
              {agent.status === 'active' ? (
                <>
                  <Pause className="w-4 h-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Activate
                </>
              )}
            </button>
            <button
              onClick={() => {
                onDelete(agent.id)
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
