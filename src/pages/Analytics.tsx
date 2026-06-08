import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Bot,
  ListTodo,
  Target,
  Download,
  Filter,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts'
import { supabase, type Agent, type Task } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Header from '../components/Layout/Header'
import { format, subDays } from 'date-fns'

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

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function Analytics() {
  const { user } = useAuth()
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d' | '90d'>('30d')
  const [agents, setAgents] = useState<Agent[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [_loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      const daysAgo = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : timeRange === '30d' ? 30 : 90
      const startDate = subDays(new Date(), daysAgo)

      const [agentsRes, tasksRes] = await Promise.all([
        supabase
          .from('agents')
          .select('*'),
        supabase
          .from('tasks')
          .select('*')
          .gte('created_at', startDate.toISOString()),
      ])

      if (agentsRes.data) setAgents(agentsRes.data as Agent[])
      if (tasksRes.data) setTasks(tasksRes.data as Task[])
      setLoading(false)
    }

    fetchData()
  }, [user, timeRange])

  const taskTrendData = [
    { date: 'Jun 1', completed: 45, failed: 3, pending: 12 },
    { date: 'Jun 2', completed: 52, failed: 5, pending: 8 },
    { date: 'Jun 3', completed: 38, failed: 2, pending: 15 },
    { date: 'Jun 4', completed: 61, failed: 4, pending: 9 },
    { date: 'Jun 5', completed: 55, failed: 6, pending: 11 },
    { date: 'Jun 6', completed: 48, failed: 3, pending: 14 },
    { date: 'Jun 7', completed: 67, failed: 2, pending: 7 },
  ]

  const agentPerformanceData = agents.slice(0, 5).map(agent => ({
    name: agent.name.split('-')[0],
    tasks: agent.total_tasks_completed,
    successRate: agent.total_tasks_completed > 0
      ? ((agent.total_tasks_completed / (agent.total_tasks_completed + agent.total_tasks_failed)) * 100).toFixed(1)
      : 0,
    avgTime: agent.avg_completion_time_seconds / 60,
  }))

  const taskTypeDistribution = [
    { name: 'Explorer', value: agents.filter(a => a.type === 'explorer').reduce((sum, a) => sum + a.total_tasks_completed, 0) },
    { name: 'Builder', value: agents.filter(a => a.type === 'builder').reduce((sum, a) => sum + a.total_tasks_completed, 0) },
    { name: 'Analyzer', value: agents.filter(a => a.type === 'analyzer').reduce((sum, a) => sum + a.total_tasks_completed, 0) },
    { name: 'Coordinator', value: agents.filter(a => a.type === 'coordinator').reduce((sum, a) => sum + a.total_tasks_completed, 0) },
    { name: 'Monitor', value: agents.filter(a => a.type === 'monitor').reduce((sum, a) => sum + a.total_tasks_completed, 0) },
  ].filter(d => d.value > 0)

  const hourlyActivityData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, '0')}:00`,
    tasks: Math.floor(Math.random() * 20) + 5,
  }))

  const radarData = [
    { metric: 'Speed', value: 85 },
    { metric: 'Accuracy', value: 92 },
    { metric: 'Reliability', value: 88 },
    { metric: 'Scalability', value: 78 },
    { metric: 'Efficiency', value: 90 },
    { metric: 'Coverage', value: 82 },
  ]

  const metrics = [
    {
      label: 'Total Tasks',
      value: tasks.length.toString(),
      change: '+12%',
      trend: 'up',
      icon: ListTodo,
      color: 'from-primary-500 to-blue-600',
    },
    {
      label: 'Success Rate',
      value: `${tasks.filter(t => t.status === 'completed').length > 0
        ? ((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100).toFixed(1)
        : 0}%`,
      change: '+2.4%',
      trend: 'up',
      icon: Target,
      color: 'from-success-500 to-emerald-600',
    },
    {
      label: 'Active Agents',
      value: agents.filter(a => a.status === 'active').length.toString(),
      change: '-1',
      trend: 'down',
      icon: Bot,
      color: 'from-accent-500 to-teal-600',
    },
    {
      label: 'Avg. Duration',
      value: agents.length > 0
        ? `${Math.round(agents.reduce((sum, a) => sum + a.avg_completion_time_seconds, 0) / agents.length / 60)}m`
        : '0m',
      change: '-18%',
      trend: 'up',
      icon: Clock,
      color: 'from-warning-500 to-amber-600',
    },
  ]

  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Agent,Type,Status,TasksCompleted,TasksFailed,SuccessRate,AvgDuration\n"
      + agents.map(a =>
        `${a.name},${a.type},${a.status},${a.total_tasks_completed},${a.total_tasks_failed},${
          a.total_tasks_completed > 0
            ? ((a.total_tasks_completed / (a.total_tasks_completed + a.total_tasks_failed)) * 100).toFixed(1)
            : 0
        }%,${a.avg_completion_time_seconds}s`
      ).join("\n")

    const link = document.createElement("a")
    link.setAttribute("href", encodeURI(csvContent))
    link.setAttribute("download", `cto-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen">
      <Header
        title="Analytics"
        subtitle="Performance insights and trends"
        action={{ label: 'Export Report', onClick: exportData }}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="p-6 space-y-6"
      >
        {/* Time Range Filter */}
        <motion.div variants={itemVariants} className="card p-4 flex items-center gap-4">
          <Filter className="w-5 h-5 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Time Range:</span>
          <div className="flex gap-2">
            {(['7d', '14d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  timeRange === range
                    ? 'bg-primary-500 text-white shadow-lg'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '14d' ? '14 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric) => (
            <motion.div
              key={metric.label}
              variants={itemVariants}
              className="card p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${metric.color} flex items-center justify-center shadow-lg`}>
                  <metric.icon className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  metric.trend === 'up' ? 'text-success-600' : 'text-error-600'
                }`}>
                  {metric.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {metric.change}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-slate-900">{metric.value}</p>
                <p className="text-sm text-slate-500">{metric.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Task Completion Trend */}
          <motion.div variants={itemVariants} className="card p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Task Completion Trend</h3>
              <p className="text-sm text-slate-500">Daily task status breakdown</p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={taskTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="pending" stroke="#94a3b8" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Agent Performance */}
          <motion.div variants={itemVariants} className="card p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Agent Performance</h3>
              <p className="text-sm text-slate-500">Top performing agents</p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agentPerformanceData} layout="vertical">
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
                  <Bar dataKey="tasks" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Task Type Distribution */}
          <motion.div variants={itemVariants} className="card p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Task Type Distribution</h3>
              <p className="text-sm text-slate-500">By agent type</p>
            </div>
            <div className="h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskTypeDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name }) => name}
                  >
                    {taskTypeDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Hourly Activity */}
          <motion.div variants={itemVariants} className="card p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Hourly Activity</h3>
              <p className="text-sm text-slate-500">Task execution by hour</p>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyActivityData}>
                  <defs>
                    <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} interval={2} />
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
                    dataKey="tasks"
                    stroke="#0ea5e9"
                    fillOpacity={1}
                    fill="url(#colorTasks)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Performance Radar */}
          <motion.div variants={itemVariants} className="card p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Performance Metrics</h3>
              <p className="text-sm text-slate-500">Overall system health</p>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="metric" stroke="#94a3b8" fontSize={12} />
                  <PolarRadiusAxis stroke="#94a3b8" fontSize={10} />
                  <Radar name="Performance" dataKey="value" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Leaderboard */}
        <motion.div variants={itemVariants} className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Agent Leaderboard</h3>
              <p className="text-sm text-slate-500">Performance rankings by key metrics</p>
            </div>
            <button className="btn btn-secondary text-sm">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Rank</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Agent</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Tasks</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Success Rate</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Avg. Duration</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Score</th>
                </tr>
              </thead>
              <tbody>
                {agents
                  .sort((a, b) => {
                    const scoreA = a.total_tasks_completed * (a.total_tasks_completed / (a.total_tasks_completed + a.total_tasks_failed || 1))
                    const scoreB = b.total_tasks_completed * (b.total_tasks_completed / (b.total_tasks_completed + b.total_tasks_failed || 1))
                    return scoreB - scoreA
                  })
                  .slice(0, 10)
                  .map((agent, index) => {
                    const successRate = agent.total_tasks_completed > 0
                      ? ((agent.total_tasks_completed / (agent.total_tasks_completed + agent.total_tasks_failed)) * 100).toFixed(1)
                      : 0
                    const score = Math.round(
                      agent.total_tasks_completed * (parseFloat(successRate as string) / 100)
                    )

                    return (
                      <motion.tr
                        key={agent.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                            index === 0
                              ? 'bg-warning-100 text-warning-600'
                              : index === 1
                              ? 'bg-slate-200 text-slate-600'
                              : index === 2
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {index + 1}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white text-sm font-bold">
                              {agent.name[0]}
                            </div>
                            <span className="font-medium text-slate-900">{agent.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600 capitalize">{agent.type}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                            agent.status === 'active'
                              ? 'bg-success-100 text-success-600'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {agent.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-900">
                          {agent.total_tasks_completed}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`font-medium ${parseFloat(successRate as string) >= 95 ? 'text-success-600' : parseFloat(successRate as string) >= 80 ? 'text-warning-600' : 'text-error-600'}`}>
                            {successRate}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-600">
                          {agent.avg_completion_time_seconds > 0
                            ? `${Math.floor(agent.avg_completion_time_seconds / 60)}m`
                            : '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-xl font-bold text-primary-600">{score}</span>
                        </td>
                      </motion.tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
