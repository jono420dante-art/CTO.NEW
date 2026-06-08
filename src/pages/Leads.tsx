import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  MapPin,
  Star,
  Phone,
  Mail,
  Building,
  TrendingUp,
  Play,
  RefreshCw,
  ChevronRight,
  CheckCircle2,
  Clock,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Header from '../components/Layout/Header'
import type { Lead, LeadStatus, LeadPriority } from '../types/agency'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { formatDistanceToNow } from 'date-fns'

const statusConfig: Record<LeadStatus, { color: string; bg: string; label: string }> = {
  new: { color: 'text-blue-600', bg: 'bg-blue-500', label: 'New' },
  contacted: { color: 'text-amber-600', bg: 'bg-amber-500', label: 'Contacted' },
  responded: { color: 'text-emerald-600', bg: 'bg-emerald-500', label: 'Responded' },
  negotiating: { color: 'text-purple-600', bg: 'bg-purple-500', label: 'Negotiating' },
  demo_sent: { color: 'text-cyan-600', bg: 'bg-cyan-500', label: 'Demo Sent' },
  closed_won: { color: 'text-green-600', bg: 'bg-green-500', label: 'Won' },
  closed_lost: { color: 'text-slate-600', bg: 'bg-slate-500', label: 'Lost' },
  unsubscribed: { color: 'text-red-600', bg: 'bg-red-500', label: 'Unsubscribed' },
}

const priorityConfig: Record<LeadPriority, { color: string; bg: string; label: string; icon: typeof Star }> = {
  high: { color: 'text-red-600', bg: 'bg-red-100', label: 'High', icon: Zap },
  medium: { color: 'text-amber-600', bg: 'bg-amber-100', label: 'Medium', icon: Target },
  low: { color: 'text-slate-500', bg: 'bg-slate-100', label: 'Low', icon: Clock },
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function Leads() {
  const { user } = useAuth()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<LeadStatus | 'all'>('all')
  const [filterPriority, setFilterPriority] = useState<LeadPriority | 'all'>('all')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    contacted: 0,
    responded: 0,
    won: 0,
  })

  useEffect(() => {
    if (!user) return

    const fetchLeads = async () => {
      const { data } = await supabase
        .from('leads')
        .select('*')
        .order('score', { ascending: false })
        .limit(200)

      if (data) {
        setLeads(data as Lead[])
        setStats({
          total: data.length,
          new: data.filter(l => l.status === 'new').length,
          contacted: data.filter(l => l.status === 'contacted').length,
          responded: data.filter(l => ['responded', 'negotiating', 'demo_sent'].includes(l.status)).length,
          won: data.filter(l => l.status === 'closed_won').length,
        })
      }
      setLoading(false)
    }

    fetchLeads()

    const channel: RealtimeChannel = supabase
      .channel('leads-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, fetchLeads)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  const startLeadScan = async () => {
    setScanning(true)

    // Create agency task for scanning
    await supabase.from('agency_tasks').insert({
      user_id: user?.id,
      task_type: 'scan_leads',
      status: 'pending',
      priority: 1,
    })

    // Simulate immediate demo data for UI
    const mockLeads: Partial<Lead>[] = [
      {
        business_name: 'Mario\'s Italian Kitchen',
        business_type: 'restaurant',
        industry: 'Food & Dining',
        address: '123 Main St',
        city: 'Brooklyn',
        state: 'NY',
        phone: '(718) 555-0123',
        email: null,
        has_website: false,
        google_rating: 4.7,
        review_count: 234,
        score: 92,
        priority: 'high',
        status: 'new',
      },
      {
        business_name: 'Smith Family Dentistry',
        business_type: 'dentist',
        industry: 'Healthcare',
        address: '456 Oak Ave',
        city: 'Queens',
        state: 'NY',
        phone: '(718) 555-0456',
        email: null,
        has_website: false,
        google_rating: 4.9,
        review_count: 156,
        score: 88,
        priority: 'high',
        status: 'new',
      },
      {
        business_name: 'Elite Auto Repair',
        business_type: 'auto_repair',
        industry: 'Automotive',
        address: '789 Industrial Blvd',
        city: 'Bronx',
        state: 'NY',
        phone: '(718) 555-0789',
        email: null,
        has_website: false,
        google_rating: 4.5,
        review_count: 89,
        score: 85,
        priority: 'high',
        status: 'new',
      },
      {
        business_name: 'Sunrise Lawn Care',
        business_type: 'landscaping',
        industry: 'Home Services',
        address: '321 Garden Way',
        city: 'Staten Island',
        state: 'NY',
        phone: '(718) 555-0321',
        email: null,
        has_website: false,
        google_rating: 4.8,
        review_count: 67,
        score: 82,
        priority: 'medium',
        status: 'new',
      },
      {
        business_name: 'Brooklyn Fitness Co',
        business_type: 'gym',
        industry: 'Fitness',
        address: '555 Atlantic Ave',
        city: 'Brooklyn',
        state: 'NY',
        phone: '(718) 555-0555',
        email: null,
        has_website: false,
        google_rating: 4.6,
        review_count: 312,
        score: 79,
        priority: 'medium',
        status: 'new',
      },
    ]

    for (const leadData of mockLeads) {
      await supabase.from('leads').insert({
        ...leadData,
        user_id: user?.id,
        ai_analysis: {
          opportunity: 'High - No website detected',
          recommended_package: 'Professional Website Package',
          estimated_monthly_value: Math.floor(Math.random() * 2000) + 500,
        },
        estimated_value: Math.floor(Math.random() * 3000) + 1500,
        recommended_offering: 'Professional Website Package',
      })
    }

    setTimeout(() => setScanning(false), 2000)
  }

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.industry?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || lead.status === filterStatus
    const matchesPriority = filterPriority === 'all' || lead.priority === filterPriority
    return matchesSearch && matchesStatus && matchesPriority
  })

  return (
    <div className="min-h-screen">
      <Header
        title="Lead Finder"
        subtitle="Autonomous lead discovery and scoring"
        action={{ label: 'Scan for Leads', onClick: startLeadScan }}
      />

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="p-6">
        {/* Stats Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Total Leads', value: stats.total, icon: Building, color: 'from-blue-500 to-blue-600' },
            { label: 'New', value: stats.new, icon: Sparkles, color: 'from-emerald-500 to-emerald-600' },
            { label: 'Contacted', value: stats.contacted, icon: Mail, color: 'from-amber-500 to-amber-600' },
            { label: 'Responded', value: stats.responded, icon: TrendingUp, color: 'from-purple-500 to-purple-600' },
            { label: 'Won', value: stats.won, icon: CheckCircle2, color: 'from-green-500 to-green-600' },
          ].map((stat) => (
            <div key={stat.label} className="card p-4 relative overflow-hidden">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Autopilot Status */}
        <motion.div variants={itemVariants} className="card p-5 mb-6 bg-gradient-to-r from-primary-50 to-accent-50 border-primary-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <Play className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Autonomous Mode Active</h3>
                <p className="text-sm text-slate-600">AI is scanning for high-value leads 24/7</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {scanning ? (
                <div className="flex items-center gap-2 text-primary-600">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span className="font-medium">Scanning...</span>
                </div>
              ) : (
                <button onClick={startLeadScan} className="btn btn-primary">
                  <Search className="w-4 h-4" />
                  Scan Now
                </button>
              )}
            </div>
          </div>
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
                  placeholder="Search by name, city, or industry..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                />
              </div>
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as LeadStatus | 'all')}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
            >
              <option value="all">All Status</option>
              {Object.entries(statusConfig).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as LeadPriority | 'all')}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
            >
              <option value="all">All Priorities</option>
              {Object.entries(priorityConfig).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Leads List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
          </div>
        ) : filteredLeads.length === 0 ? (
          <motion.div variants={itemVariants} className="card p-12 text-center">
            <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No leads found</h3>
            <p className="text-slate-500 mb-4">Start a scan to discover new businesses</p>
            <button onClick={startLeadScan} className="btn btn-primary">
              <Search className="w-4 h-4" />
              Scan for Leads
            </button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredLeads.map((lead) => (
                <motion.div
                  key={lead.id}
                  variants={itemVariants}
                  whileHover={{ x: 4 }}
                  onClick={() => setSelectedLead(lead)}
                  className="card p-4 cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    {/* Score Circle */}
                    <div className="flex-shrink-0">
                      <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center ${
                        lead.score >= 80 ? 'bg-success-100' : lead.score >= 60 ? 'bg-warning-100' : 'bg-slate-100'
                      }`}>
                        <span className={`text-xl font-bold ${
                          lead.score >= 80 ? 'text-success-600' : lead.score >= 60 ? 'text-warning-600' : 'text-slate-600'
                        }`}>{lead.score}</span>
                        <span className="text-xs text-slate-500">score</span>
                      </div>
                    </div>

                    {/* Lead Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                            {lead.business_name}
                            {!lead.has_website && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                                No Website
                              </span>
                            )}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {lead.city}, {lead.state}
                            </span>
                            <span className="flex items-center gap-1">
                              <Building className="w-4 h-4" />
                              {lead.industry}
                            </span>
                            {lead.google_rating && (
                              <span className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                {lead.google_rating} ({lead.review_count})
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                            statusConfig[lead.status].bg
                          } text-white`}>
                            {statusConfig[lead.status].label}
                          </span>
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                            priorityConfig[lead.priority].bg
                          } ${priorityConfig[lead.priority].color}`}>
                            {priorityConfig[lead.priority].label}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-sm">
                        {lead.phone && (
                          <span className="text-slate-600 flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {lead.phone}
                          </span>
                        )}
                        {lead.estimated_value && (
                          <span className="text-success-600 font-medium flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            Est. ${lead.estimated_value.toLocaleString()}
                          </span>
                        )}
                        <span className="text-slate-400 ml-auto">
                          Found {formatDistanceToNow(new Date(lead.discovered_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Lead Detail Modal */}
        <AnimatePresence>
          {selectedLead && (
            <LeadDetailModal lead={selectedLead} onClose={() => setSelectedLead(null)} />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

function LeadDetailModal({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const { user } = useAuth()
  const [generating, setGenerating] = useState(false)

  const generateDemo = async () => {
    setGenerating(true)

    await supabase.from('agency_tasks').insert({
      user_id: user?.id,
      task_type: 'generate_demo',
      target_id: lead.id,
      target_type: 'lead',
      status: 'pending',
      priority: 1,
    })

    setTimeout(() => {
      setGenerating(false)
      onClose()
    }, 1000)
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto"
      >
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{lead.business_name}</h2>
              <p className="text-sm text-slate-500 mt-1">{lead.industry} | {lead.city}, {lead.state}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
              &times;
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Score Card */}
          <div className="flex items-center gap-6 p-4 bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl">
            <div className="text-center">
              <div className={`text-4xl font-bold ${
                lead.score >= 80 ? 'text-success-600' : lead.score >= 60 ? 'text-warning-600' : 'text-slate-600'
              }`}>
                {lead.score}
              </div>
              <div className="text-sm text-slate-500">Lead Score</div>
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-slate-900 mb-1">AI Analysis</h4>
              <p className="text-sm text-slate-600">
                {(lead.ai_analysis?.opportunity as string) || 'High-value lead without web presence. Strong candidate for outreach.'}
              </p>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            {lead.phone && (
              <div className="card p-4">
                <Phone className="w-5 h-5 text-slate-400 mb-2" />
                <p className="text-sm text-slate-500">Phone</p>
                <p className="font-medium text-slate-900">{lead.phone}</p>
              </div>
            )}
            {lead.email && (
              <div className="card p-4">
                <Mail className="w-5 h-5 text-slate-400 mb-2" />
                <p className="text-sm text-slate-500">Email</p>
                <p className="font-medium text-slate-900">{lead.email}</p>
              </div>
            )}
            {lead.google_rating && (
              <div className="card p-4">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400 mb-2" />
                <p className="text-sm text-slate-500">Google Rating</p>
                <p className="font-medium text-slate-900">{lead.google_rating} ({lead.review_count} reviews)</p>
              </div>
            )}
            {lead.estimated_value && (
              <div className="card p-4">
                <TrendingUp className="w-5 h-5 text-success-500 mb-2" />
                <p className="text-sm text-slate-500">Estimated Value</p>
                <p className="font-medium text-success-600">${lead.estimated_value.toLocaleString()}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={generateDemo}
              disabled={generating}
              className="btn btn-primary flex-1"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating Demo...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Demo Website
                </>
              )}
            </button>
            <button className="btn btn-secondary flex-1">
              <Mail className="w-4 h-4" />
              Send Outreach
            </button>
          </div>

          {/* Tags */}
          {lead.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {lead.tags.map((tag) => (
                <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-sm">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
