import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail,
  Send,
  Eye,
  MousePointer,
  Reply,
  AlertCircle,
  Clock,
  CheckCircle2,
  Sparkles,
  ChevronRight,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Header from '../components/Layout/Header'
import type { OutreachMessage, Lead } from '../types/agency'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { formatDistanceToNow } from 'date-fns'

const statusConfig = {
  pending: { color: 'text-slate-600', bg: 'bg-slate-100', icon: Clock, label: 'Pending' },
  sent: { color: 'text-blue-600', bg: 'bg-blue-100', icon: Send, label: 'Sent' },
  delivered: { color: 'text-emerald-600', bg: 'bg-emerald-100', icon: CheckCircle2, label: 'Delivered' },
  opened: { color: 'text-purple-600', bg: 'bg-purple-100', icon: Eye, label: 'Opened' },
  clicked: { color: 'text-cyan-600', bg: 'bg-cyan-100', icon: MousePointer, label: 'Clicked' },
  replied: { color: 'text-green-600', bg: 'bg-green-100', icon: Reply, label: 'Replied!' },
  bounced: { color: 'text-red-600', bg: 'bg-red-100', icon: AlertCircle, label: 'Bounced' },
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.03 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
}

export default function Outreach() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<(OutreachMessage & { lead?: Lead })[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedMessage, setSelectedMessage] = useState<typeof messages[0] | null>(null)

  useEffect(() => {
    if (!user) return

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('outreach_messages')
        .select(`
          *,
          lead:leads(*)
        `)
        .order('created_at', { ascending: false })
        .limit(200)

      if (data) {
        setMessages(data as typeof messages)
      }
      setLoading(false)
    }

    fetchMessages()

    const channel: RealtimeChannel = supabase
      .channel('messages-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'outreach_messages' }, fetchMessages)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  const stats = {
    sent: messages.filter(m => ['sent', 'delivered', 'opened', 'clicked', 'replied'].includes(m.status)).length,
    opened: messages.filter(m => ['opened', 'clicked', 'replied'].includes(m.status)).length,
    clicked: messages.filter(m => ['clicked', 'replied'].includes(m.status)).length,
    replied: messages.filter(m => m.status === 'replied').length,
  }

  const openRate = stats.sent > 0 ? ((stats.opened / stats.sent) * 100).toFixed(1) : '0'
  const replyRate = stats.opened > 0 ? ((stats.replied / stats.opened) * 100).toFixed(1) : '0'

  const filteredMessages = messages.filter(m => filterStatus === 'all' || m.status === filterStatus)

  return (
    <div className="min-h-screen">
      <Header
        title="Outreach"
        subtitle="Automated email campaigns with AI personalization"
      />

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="p-6">
        {/* Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="card p-4 relative overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-3">
              <Send className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.sent}</p>
            <p className="text-sm text-slate-500">Sent</p>
          </div>
          <div className="card p-4 relative overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-3">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.opened}</p>
            <p className="text-sm text-slate-500">Opened ({openRate}%)</p>
          </div>
          <div className="card p-4 relative overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center mb-3">
              <MousePointer className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.clicked}</p>
            <p className="text-sm text-slate-500">Clicked</p>
          </div>
          <div className="card p-4 relative overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-3">
              <Reply className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.replied}</p>
            <p className="text-sm text-slate-500">Replied ({replyRate}%)</p>
          </div>
          <div className="card p-4 bg-gradient-to-br from-primary-500 to-accent-500 text-white">
            <Sparkles className="w-10 h-10 mb-3" />
            <p className="text-2xl font-bold">AI</p>
            <p className="text-sm text-white/80">Auto-optimizing</p>
          </div>
        </motion.div>

        {/* AI Optimization Card */}
        <motion.div variants={itemVariants} className="card p-5 mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">AI-Powered Outreach Active</h3>
                <p className="text-sm text-slate-600">Personalizing emails based on lead data and behavior</p>
              </div>
            </div>
            <span className="text-sm text-amber-700 font-medium">
              {openRate}% open rate (above industry avg)
            </span>
          </div>
        </motion.div>

        {/* Status Tabs */}
        <motion.div variants={itemVariants} className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
              filterStatus === 'all' ? 'bg-primary-500 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All Messages
          </button>
          {Object.entries(statusConfig).map(([key, config]) => {
            const count = messages.filter(m => m.status === key).length
            if (count === 0) return null
            return (
              <button
                key={key}
                onClick={() => setFilterStatus(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                  filterStatus === key ? 'bg-primary-500 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <config.icon className="w-4 h-4" />
                {config.label}
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  filterStatus === key ? 'bg-white/20' : 'bg-slate-200'
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </motion.div>

        {/* Messages List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
          </div>
        ) : filteredMessages.length === 0 ? (
          <motion.div variants={itemVariants} className="card p-12 text-center">
            <Mail className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No outreach yet</h3>
            <p className="text-slate-500">Messages will appear here when leads are contacted</p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {filteredMessages.map((message) => {
                const config = statusConfig[message.status] || statusConfig.pending
                const Icon = config.icon
                return (
                  <motion.div
                    key={message.id}
                    variants={itemVariants}
                    whileHover={{ x: 4 }}
                    onClick={() => setSelectedMessage(message)}
                    className="card p-4 cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-medium text-slate-900">{message.subject || 'Personalized Outreach'}</h3>
                            <p className="text-sm text-slate-500 mt-0.5">To: {message.lead?.business_name}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${config.bg} ${config.color}`}>
                            {config.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                          <span className="capitalize">{message.message_type}</span>
                          {message.open_count > 0 && (
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" /> {message.open_count} opens
                            </span>
                          )}
                          <span>
                            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>

                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Message Detail Modal */}
        <AnimatePresence>
          {selectedMessage && (
            <MessageDetailModal
              message={selectedMessage}
              onClose={() => setSelectedMessage(null)}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

function MessageDetailModal({ message, onClose }: { message: OutreachMessage & { lead?: Lead }; onClose: () => void }) {
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-auto"
      >
        <div className="p-6 border-b border-slate-200 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{message.subject || 'Personalized Outreach'}</h2>
            <p className="text-sm text-slate-500 mt-1">
              To: {message.lead?.business_name} | {message.lead?.city}, {message.lead?.state}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
            &times;
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Opens', value: message.open_count, icon: Eye },
              { label: 'Clicks', value: message.click_count, icon: MousePointer },
              { label: 'Sent', value: message.sent_at ? new Date(message.sent_at).toLocaleDateString() : '-', icon: Send },
              { label: 'Last Event', value: message.opened_at || message.sent_at || message.created_at, icon: Clock, isDate: true },
            ].map((stat) => (
              <div key={stat.label} className="card p-3 text-center">
                <stat.icon className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                <p className="text-xl font-bold text-slate-900">
                  {stat.isDate ? formatDistanceToNow(new Date(stat.value), { addSuffix: true }) : stat.value}
                </p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Email Body */}
          <div className="card p-6 bg-slate-50">
            <h4 className="text-sm font-medium text-slate-600 mb-3">Email Content</h4>
            <div className="bg-white rounded-lg p-4 border border-slate-200 prose prose-sm max-w-none">
              <div dangerouslySetInnerHTML={{ __html: message.body.replace(/\n/g, '<br />') }} />
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h4 className="text-sm font-medium text-slate-600 mb-3">Delivery Timeline</h4>
            <div className="space-y-2">
              {message.created_at && (
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-500">Created</span>
                  <span className="text-slate-900 ml-auto">{new Date(message.created_at).toLocaleString()}</span>
                </div>
              )}
              {message.sent_at && (
                <div className="flex items-center gap-3 text-sm">
                  <Send className="w-4 h-4 text-blue-500" />
                  <span className="text-slate-500">Sent</span>
                  <span className="text-slate-900 ml-auto">{new Date(message.sent_at).toLocaleString()}</span>
                </div>
              )}
              {message.opened_at && (
                <div className="flex items-center gap-3 text-sm">
                  <Eye className="w-4 h-4 text-purple-500" />
                  <span className="text-slate-500">First Opened</span>
                  <span className="text-slate-900 ml-auto">{new Date(message.opened_at).toLocaleString()}</span>
                </div>
              )}
              {message.clicked_at && (
                <div className="flex items-center gap-3 text-sm">
                  <MousePointer className="w-4 h-4 text-cyan-500" />
                  <span className="text-slate-500">First Click</span>
                  <span className="text-slate-900 ml-auto">{new Date(message.clicked_at).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
