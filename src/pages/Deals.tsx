import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DollarSign,
  TrendingUp,
  CheckCircle2,
  CreditCard,
  Send,
  ExternalLink,
  MessageSquare,
  User,
  Sparkles,
  Bot,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Header from '../components/Layout/Header'
import type { Deal, Negotiation, Lead } from '../types/agency'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { formatDistanceToNow, format } from 'date-fns'

const statusConfig = {
  pending: { color: 'text-slate-600', bg: 'bg-slate-100', label: 'Pending' },
  negotiating: { color: 'text-purple-600', bg: 'bg-purple-100', label: 'Negotiating' },
  awaiting_payment: { color: 'text-amber-600', bg: 'bg-amber-100', label: 'Awaiting Payment' },
  paid: { color: 'text-green-600', bg: 'bg-green-100', label: 'Paid' },
  cancelled: { color: 'text-red-600', bg: 'bg-red-100', label: 'Cancelled' },
  refunded: { color: 'text-slate-600', bg: 'bg-slate-100', label: 'Refunded' },
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function Deals() {
  const { user } = useAuth()
  const [deals, setDeals] = useState<(Deal & { lead?: Lead })[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedDeal, setSelectedDeal] = useState<typeof deals[0] | null>(null)

  useEffect(() => {
    if (!user) return

    const fetchDeals = async () => {
      const { data } = await supabase
        .from('deals')
        .select(`
          *,
          lead:leads(*)
        `)
        .order('created_at', { ascending: false })

      if (data) {
        setDeals(data as typeof deals)
      }
      setLoading(false)
    }

    fetchDeals()

    const channel: RealtimeChannel = supabase
      .channel('deals-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deals' }, fetchDeals)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  const stats = {
    total: deals.reduce((sum, d) => sum + d.value, 0),
    paid: deals.filter(d => d.status === 'paid').reduce((sum, d) => sum + d.value, 0),
    pending: deals.filter(d => ['pending', 'negotiating', 'awaiting_payment'].includes(d.status)).reduce((sum, d) => sum + d.value, 0),
    won: deals.filter(d => d.status === 'paid').length,
    conversionRate: deals.length > 0
      ? ((deals.filter(d => d.status === 'paid').length / deals.length) * 100).toFixed(1)
      : '0',
  }

  const filteredDeals = deals.filter(d => filterStatus === 'all' || d.status === filterStatus)

  return (
    <div className="min-h-screen">
      <Header
        title="Deals & Payments"
        subtitle="Track negotiations and collect payments automatically"
      />

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="p-6">
        {/* Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="card p-5 bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <DollarSign className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-3xl font-bold">${stats.paid.toLocaleString()}</p>
            <p className="text-sm text-white/80">Collected</p>
          </div>
          <div className="card p-5">
            <TrendingUp className="w-8 h-8 mb-3 text-amber-500" />
            <p className="text-2xl font-bold text-slate-900">${stats.pending.toLocaleString()}</p>
            <p className="text-sm text-slate-500">Pending</p>
          </div>
          <div className="card p-5">
            <CheckCircle2 className="w-8 h-8 mb-3 text-green-500" />
            <p className="text-2xl font-bold text-slate-900">{stats.won}</p>
            <p className="text-sm text-slate-500">Closed Won</p>
          </div>
          <div className="card p-5">
            <CreditCard className="w-8 h-8 mb-3 text-primary-500" />
            <p className="text-2xl font-bold text-slate-900">{deals.length}</p>
            <p className="text-sm text-slate-500">Total Deals</p>
          </div>
          <div className="card p-5">
            <Sparkles className="w-8 h-8 mb-3 text-purple-500" />
            <p className="text-2xl font-bold text-slate-900">{stats.conversionRate}%</p>
            <p className="text-sm text-slate-500">Win Rate</p>
          </div>
        </motion.div>

        {/* Status Tabs */}
        <motion.div variants={itemVariants} className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {Object.entries(statusConfig).map(([key, config]) => {
            const count = deals.filter(d => d.status === key).length
            return (
              <button
                key={key}
                onClick={() => setFilterStatus(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                  filterStatus === key
                    ? 'bg-primary-500 text-white shadow-lg'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {config.label}
                {count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    filterStatus === key ? 'bg-white/20' : 'bg-slate-200'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </motion.div>

        {/* Deals List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
          </div>
        ) : filteredDeals.length === 0 ? (
          <motion.div variants={itemVariants} className="card p-12 text-center">
            <DollarSign className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No deals yet</h3>
            <p className="text-slate-500">Deals will appear here when leads are won</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredDeals.map((deal) => {
                const config = statusConfig[deal.status]
                return (
                  <motion.div
                    key={deal.id}
                    variants={itemVariants}
                    whileHover={{ x: 4 }}
                    onClick={() => setSelectedDeal(deal)}
                    className="card p-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center`}>
                        <DollarSign className={`w-6 h-6 ${config.color}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-slate-900">{deal.lead?.business_name}</h3>
                            <p className="text-sm text-slate-500">{deal.package}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-slate-900">${deal.value.toLocaleString()}</p>
                            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${config.bg} ${config.color}`}>
                              {config.label}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                          <span>Created {formatDistanceToNow(new Date(deal.created_at), { addSuffix: true })}</span>
                          {deal.paid_at && (
                            <span className="text-green-600">Paid {formatDistanceToNow(new Date(deal.paid_at), { addSuffix: true })}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Deal Detail Modal */}
        <AnimatePresence>
          {selectedDeal && (
            <DealDetailModal deal={selectedDeal} onClose={() => setSelectedDeal(null)} />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

function DealDetailModal({ deal, onClose }: { deal: Deal & { lead?: Lead }; onClose: () => void }) {
  useAuth()
  const [negotiation, setNegotiation] = useState<Negotiation | null>(null)
  const [newMessage, setNewMessage] = useState('')

  useEffect(() => {
    const fetchNegotiation = async () => {
      if (deal.negotiation_id) {
        const { data } = await supabase
          .from('negotiations')
          .select('*')
          .eq('id', deal.negotiation_id)
          .single()
        if (data) setNegotiation(data as Negotiation)
      }
    }
    fetchNegotiation()
  }, [deal.negotiation_id])

  const sendPaymentLink = async () => {
    // In production, this would create a Stripe payment link
    await supabase.from('deals')
      .update({ status: 'awaiting_payment' })
      .eq('id', deal.id)

    alert('Payment link sent to ' + deal.lead?.email)
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !negotiation) return

    const updatedConversation = [
      ...negotiation.conversation,
      { role: 'user' as const, content: newMessage, timestamp: new Date().toISOString() }
    ]

    await supabase.from('negotiations')
      .update({
        conversation: updatedConversation,
        last_message_at: new Date().toISOString()
      })
      .eq('id', negotiation.id)

    setNegotiation({ ...negotiation, conversation: updatedConversation })
    setNewMessage('')
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{deal.lead?.business_name}</h2>
            <p className="text-sm text-slate-500">{deal.package} - ${deal.value.toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${statusConfig[deal.status].bg} ${statusConfig[deal.status].color}`}>
              {statusConfig[deal.status].label}
            </span>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
              &times;
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-3 divide-x divide-slate-200 h-full">
            {/* Deal Info */}
            <div className="p-6 space-y-6">
              <div>
                <h4 className="font-medium text-slate-900 mb-3">Deal Details</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Package</span>
                    <span className="font-medium">{deal.package}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Value</span>
                    <span className="font-bold text-xl">${deal.value.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Currency</span>
                    <span className="font-medium">{deal.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Created</span>
                    <span className="font-medium text-sm">{format(new Date(deal.created_at), 'PP')}</span>
                  </div>
                  {deal.paid_at && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Paid</span>
                      <span className="font-medium text-green-600">{format(new Date(deal.paid_at), 'PP')}</span>
                    </div>
                  )}
                </div>
              </div>

              {deal.status !== 'paid' && (
                <button onClick={sendPaymentLink} className="btn btn-success w-full">
                  <CreditCard className="w-4 h-4" />
                  Send Payment Link
                </button>
              )}

              {deal.payment_link && (
                <a
                  href={deal.payment_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary w-full"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Payment Page
                </a>
              )}
            </div>

            {/* Negotiation Chat */}
            <div className="p-6 border-l border-slate-200 col-span-2 flex flex-col">
              <h4 className="font-medium text-slate-900 mb-4 flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary-500" />
                AI Negotiation {deal.lead?.email ? `(${deal.lead.email})` : ''}
              </h4>

              <div className="flex-1 overflow-auto space-y-3 mb-4">
                {negotiation?.conversation?.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[70%] rounded-xl p-3 ${
                      msg.role === 'user'
                        ? 'bg-primary-500 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs opacity-60 mt-1">
                        {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-slate-500" />
                      </div>
                    )}
                  </div>
                ))}

                {!negotiation && (
                  <div className="text-center py-12 text-slate-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>No negotiation conversation yet</p>
                    <p className="text-sm">AI will handle objections automatically</p>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message to lead..."
                  className="input flex-1"
                />
                <button onClick={sendMessage} className="btn btn-primary">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
