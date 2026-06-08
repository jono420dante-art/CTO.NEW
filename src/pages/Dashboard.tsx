import { motion } from 'framer-motion'
import {
  Activity,
  TrendingUp,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Globe,
  DollarSign,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import Header from '../components/Layout/Header'

const taskCompletionData = [
  { name: 'Mon', completed: 45, failed: 5 },
  { name: 'Tue', completed: 52, failed: 3 },
  { name: 'Wed', completed: 61, failed: 8 },
  { name: 'Thu', completed: 48, failed: 4 },
  { name: 'Fri', completed: 67, failed: 6 },
  { name: 'Sat', completed: 35, failed: 2 },
  { name: 'Sun', completed: 28, failed: 1 },
]

const agentActivityData = [
  { name: 'Explorer', active: 12, idle: 5 },
  { name: 'Builder', active: 8, idle: 3 },
  { name: 'Analyzer', active: 15, idle: 2 },
  { name: 'Coordinator', active: 5, idle: 2 },
  { name: 'Monitor', active: 10, idle: 4 },
]

const taskDistribution = [
  { name: 'Pending', value: 35, color: '#94a3b8' },
  { name: 'Running', value: 28, color: '#3b82f6' },
  { name: 'Completed', value: 145, color: '#10b981' },
  { name: 'Failed', value: 12, color: '#ef4444' },
]

const metrics = [
  {
    label: 'Active Leads',
    value: '24',
    change: '+12',
    changeType: 'positive',
    icon: Target,
    color: 'from-blue-500 to-blue-600',
  },
  {
    label: 'Demos Generated',
    value: '18',
    change: '+8',
    changeType: 'positive',
    icon: Globe,
    color: 'from-purple-500 to-purple-600',
  },
  {
    label: 'Revenue',
    value: '$12.4k',
    change: '+$3.2k',
    changeType: 'positive',
    icon: DollarSign,
    color: 'from-green-500 to-emerald-600',
  },
  {
    label: 'Win Rate',
    value: '34%',
    change: '+5%',
    changeType: 'positive',
    icon: TrendingUp,
    color: 'from-amber-500 to-orange-600',
  },
]

const recentTasks = [
  { id: 1, title: 'Analyze codebase dependencies', agent: 'Explorer-7', status: 'running', duration: '2m 34s' },
  { id: 2, title: 'Generate API documentation', agent: 'Builder-3', status: 'completed', duration: '5m 12s' },
  { id: 3, title: 'Optimize database queries', agent: 'Analyzer-1', status: 'completed', duration: '8m 45s' },
  { id: 4, title: 'Deploy to production', agent: 'Coordinator-2', status: 'failed', duration: '1m 20s' },
  { id: 5, title: 'Monitor performance metrics', agent: 'Monitor-5', status: 'running', duration: '12m 8s' },
]

const topAgents = [
  { name: 'Analyzer-1', tasks: 145, success: 98.2, type: 'analyzer' },
  { name: 'Builder-3', tasks: 132, success: 95.5, type: 'builder' },
  { name: 'Explorer-7', tasks: 128, success: 94.8, type: 'explorer' },
  { name: 'Monitor-5', tasks: 115, success: 99.1, type: 'monitor' },
  { name: 'Coordinator-2', tasks: 89, success: 91.2, type: 'coordinator' },
]

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function Dashboard() {
  return (
    <div className="min-h-screen">
      <Header
        title="Dashboard"
        subtitle="Monitor your agent fleet performance"
        action={{ label: 'Quick Task', onClick: () => {} }}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="p-6 space-y-6"
      >
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric) => (
            <motion.div
              key={metric.label}
              variants={itemVariants}
              className="card p-5 relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${metric.color} flex items-center justify-center shadow-lg`}>
                  <metric.icon className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  metric.changeType === 'positive' ? 'text-success-600' : 'text-error-600'
                }`}>
                  {metric.changeType === 'positive' ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  {metric.change}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-slate-900">{metric.value}</p>
                <p className="text-sm text-slate-500">{metric.label}</p>
              </div>
              <div
                className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r"
                style={{ background: `linear-gradient(to right, var(--tw-gradient-stops))` }}
              />
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Task Completion Trend */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-2 card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Task Completion Trends</h3>
                <p className="text-sm text-slate-500">Weekly performance overview</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-success-500" />
                  <span className="text-slate-600">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-error-500" />
                  <span className="text-slate-600">Failed</span>
                </div>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={taskCompletionData}>
                  <defs>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorCompleted)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="failed"
                    stroke="#ef4444"
                    fillOpacity={1}
                    fill="url(#colorFailed)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Task Distribution */}
          <motion.div variants={itemVariants} className="card p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Task Distribution</h3>
              <p className="text-sm text-slate-500">Current status breakdown</p>
            </div>
            <div className="h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {taskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {taskDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-slate-600">{item.name}</span>
                  <span className="text-sm font-medium text-slate-900 ml-auto">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agent Activity */}
          <motion.div variants={itemVariants} className="card p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Agent Activity</h3>
              <p className="text-sm text-slate-500">By agent type</p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agentActivityData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Bar dataKey="active" stackId="a" fill="#10b981" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="idle" stackId="a" fill="#94a3b8" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Recent Tasks */}
          <motion.div variants={itemVariants} className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Recent Tasks</h3>
                <p className="text-sm text-slate-500">Latest activity</p>
              </div>
              <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                View All
              </button>
            </div>
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <motion.div
                  key={task.id}
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      task.status === 'running'
                        ? 'bg-primary-100 text-primary-600'
                        : task.status === 'completed'
                        ? 'bg-success-100 text-success-600'
                        : 'bg-error-100 text-error-600'
                    }`}
                  >
                    {task.status === 'running' ? (
                      <Activity className="w-4 h-4 animate-pulse" />
                    ) : task.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {task.title}
                    </p>
                    <p className="text-xs text-slate-500">{task.agent}</p>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{task.duration}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Top Agents */}
          <motion.div variants={itemVariants} className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Top Agents</h3>
                <p className="text-sm text-slate-500">By performance</p>
              </div>
              <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Leaderboard
              </button>
            </div>
            <div className="space-y-3">
              {topAgents.map((agent, index) => (
                <motion.div
                  key={agent.name}
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                      index === 0
                        ? 'bg-warning-100 text-warning-600'
                        : index === 1
                        ? 'bg-slate-200 text-slate-600'
                        : index === 2
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{agent.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{agent.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">{agent.success}%</p>
                    <p className="text-xs text-slate-500">{agent.tasks} tasks</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
