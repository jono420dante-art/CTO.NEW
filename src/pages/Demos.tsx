import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Globe,
  Eye,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Send,
  Copy,
  Monitor,
  Smartphone,
  Tablet,
  ExternalLink,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Header from '../components/Layout/Header'
import type { Demo, Lead } from '../types/agency'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { formatDistanceToNow } from 'date-fns'

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  generating: { color: 'text-amber-600', bg: 'bg-amber-100', label: 'Generating' },
  ready: { color: 'text-blue-600', bg: 'bg-blue-100', label: 'Ready' },
  sent: { color: 'text-purple-600', bg: 'bg-purple-100', label: 'Sent' },
  viewed: { color: 'text-cyan-600', bg: 'bg-cyan-100', label: 'Viewed' },
  approved: { color: 'text-green-600', bg: 'bg-green-100', label: 'Approved' },
  rejected: { color: 'text-red-600', bg: 'bg-red-100', label: 'Rejected' },
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function Demos() {
  const { user } = useAuth()
  const [demos, setDemos] = useState<(Demo & { lead?: Lead })[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedDemo, setSelectedDemo] = useState<typeof demos[0] | null>(null)
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')

  useEffect(() => {
    if (!user) return

    const fetchDemos = async () => {
      const { data: demosData } = await supabase
        .from('demos')
        .select(`
          *,
          lead:leads(*)
        `)
        .order('created_at', { ascending: false })

      if (demosData) {
        setDemos(demosData as typeof demos)
      }
      setLoading(false)
    }

    fetchDemos()

    const channel: RealtimeChannel = supabase
      .channel('demos-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'demos' }, fetchDemos)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  const filteredDemos = demos.filter(d => filterStatus === 'all' || d.status === filterStatus)

  const statusCounts = {
    all: demos.length,
    generating: demos.filter(d => d.status === 'generating').length,
    ready: demos.filter(d => d.status === 'ready').length,
    sent: demos.filter(d => d.status === 'sent').length,
    viewed: demos.filter(d => d.status === 'viewed').length,
    approved: demos.filter(d => d.status === 'approved').length,
  }

  const generateNewDemo = async () => {
    const { data: leads } = await supabase
      .from('leads')
      .select('id')
      .eq('status', 'new')
      .limit(1)
      .single()

    if (leads) {
      await supabase.from('agency_tasks').insert({
        user_id: user?.id,
        task_type: 'generate_demo',
        target_id: leads.id,
        target_type: 'lead',
        status: 'pending',
        priority: 1,
      })
    }
  }

  const sendDemo = async (demoId: string) => {
    await supabase.from('demos')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', demoId)

    await supabase.from('agency_tasks').insert({
      user_id: user?.id,
      task_type: 'send_outreach',
      target_id: demoId,
      target_type: 'demo',
      status: 'pending',
    })
  }

  const copyLink = (subdomain: string) => {
    navigator.clipboard.writeText(`https://${subdomain}.demo.cto.new`)
  }

  return (
    <div className="min-h-screen">
      <Header
        title="Demo Builder"
        subtitle="AI-generated demo websites for your leads"
        action={{ label: 'Generate Demo', onClick: generateNewDemo }}
      />

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="p-6">
        {/* Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          {Object.entries(statusCounts).map(([key, value]) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`card p-4 text-center transition-all ${
                filterStatus === key ? 'ring-2 ring-primary-500' : ''
              }`}
            >
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-sm text-slate-500 capitalize">{key === 'all' ? 'Total' : key}</p>
            </button>
          ))}
        </motion.div>

        {/* Demo Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
          </div>
        ) : filteredDemos.length === 0 ? (
          <motion.div variants={itemVariants} className="card p-12 text-center">
            <Globe className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No demos yet</h3>
            <p className="text-slate-500 mb-4">Demos will be auto-generated when leads are found</p>
            <button onClick={generateNewDemo} className="btn btn-primary">
              <Sparkles className="w-4 h-4" />
              Generate First Demo
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredDemos.map((demo) => (
                <motion.div
                  key={demo.id}
                  variants={itemVariants}
                  layoutId={demo.id}
                  className="card overflow-hidden"
                >
                  {/* Preview Area */}
                  <div
                    onClick={() => setSelectedDemo(demo)}
                    className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 cursor-pointer group"
                  >
                    {demo.status === 'generating' ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <RefreshCw className="w-10 h-10 text-primary-500 animate-spin mx-auto mb-2" />
                          <p className="text-sm text-slate-600">Generating...</p>
                          <div className="w-32 h-2 bg-slate-200 rounded-full mt-2 overflow-hidden">
                            <div
                              className="h-full bg-primary-500 rounded-full transition-all"
                              style={{ width: `${demo.generation_progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center p-4">
                            <Globe className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                            <p className="font-medium text-slate-700">{demo.title}</p>
                            <p className="text-xs text-slate-500 mt-1">{demo.lead?.business_name}</p>
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <button className="btn bg-white text-slate-900 hover:bg-slate-100">
                            <Eye className="w-4 h-4" />
                            Preview
                          </button>
                        </div>
                      </>
                    )}

                    {/* Status Badge */}
                    <div className={`absolute top-3 right-3 px-2 py-1 rounded-lg text-xs font-medium ${
                      statusConfig[demo.status]?.bg || 'bg-slate-100'
                    } ${statusConfig[demo.status]?.color || 'text-slate-600'}`}>
                      {statusConfig[demo.status]?.label || demo.status}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-slate-900">{demo.lead?.business_name}</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {demo.template.charAt(0).toUpperCase() + demo.template.slice(1)} Template
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                      {demo.view_count > 0 && (
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {demo.view_count} views
                        </span>
                      )}
                      <span>
                        Created {formatDistanceToNow(new Date(demo.created_at), { addSuffix: true })}
                      </span>
                    </div>

                    {/* Actions */}
                    {demo.status === 'ready' && (
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => sendDemo(demo.id)}
                          className="btn btn-primary flex-1 text-sm"
                        >
                          <Send className="w-4 h-4" />
                          Send to Lead
                        </button>
                        <button
                          onClick={() => copyLink(demo.subdomain || 'demo')}
                          className="btn btn-secondary"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {demo.status === 'sent' && (
                      <div className="mt-4 p-3 bg-purple-50 rounded-lg text-sm text-purple-700">
                        Demo sent - waiting for lead to view
                      </div>
                    )}

                    {demo.status === 'viewed' && (
                      <div className="mt-4 p-3 bg-cyan-50 rounded-lg text-sm text-cyan-700">
                        Lead has viewed this demo {demo.view_count}x
                      </div>
                    )}

                    {demo.status === 'approved' && (
                      <div className="mt-4 p-3 bg-green-50 rounded-lg text-sm text-green-700 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Lead approved - ready to close deal
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Preview Modal */}
        <AnimatePresence>
          {selectedDemo && selectedDemo.status !== 'generating' && (
            <DemoPreviewModal
              demo={selectedDemo}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onClose={() => setSelectedDemo(null)}
              onSend={() => sendDemo(selectedDemo.id)}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

function DemoPreviewModal({
  demo,
  viewMode,
  onViewModeChange,
  onClose,
  onSend,
}: {
  demo: Demo & { lead?: Lead }
  viewMode: 'desktop' | 'tablet' | 'mobile'
  onViewModeChange: (mode: 'desktop' | 'tablet' | 'mobile') => void
  onClose: () => void
  onSend: () => void
}) {
  const viewModes = [
    { id: 'desktop', icon: Monitor, width: 'w-full' },
    { id: 'tablet', icon: Tablet, width: 'w-[768px]' },
    { id: 'mobile', icon: Smartphone, width: 'w-[375px]' },
  ] as const

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="font-semibold text-slate-900">{demo.title}</h2>
            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
              statusConfig[demo.status]?.bg || 'bg-slate-100'
            } ${statusConfig[demo.status]?.color || 'text-slate-600'}`}>
              {statusConfig[demo.status]?.label || demo.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {viewModes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => onViewModeChange(mode.id)}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === mode.id ? 'bg-white shadow-sm' : 'hover:bg-slate-200'
                  }`}
                >
                  <mode.icon className="w-4 h-4 text-slate-600" />
                </button>
              ))}
            </div>

            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
              &times;
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 bg-slate-100 p-8 overflow-auto">
          <div className={`mx-auto transition-all duration-300 ${
            viewMode === 'desktop' ? 'w-full h-full' :
            viewMode === 'tablet' ? 'w-[768px] h-full' : 'w-[375px] h-[812px] mx-auto'
          }`}>
            <div className="bg-white rounded-lg shadow-xl h-full overflow-hidden">
              {/* Mock Website Preview */}
              <div className="h-full flex flex-col">
                {/* Hero Section */}
                <div className="relative h-48 bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-center p-6">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{demo.lead?.business_name}</h1>
                    <p className="text-white/80">{demo.lead?.industry}</p>
                  </div>
                </div>

                {/* Content Preview */}
                <div className="flex-1 p-6 space-y-4">
                  <div className="h-24 bg-slate-100 rounded-lg animate-pulse" />
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-32 bg-slate-100 rounded-lg animate-pulse" />
                    <div className="h-32 bg-slate-100 rounded-lg animate-pulse" />
                    <div className="h-32 bg-slate-100 rounded-lg animate-pulse" />
                  </div>
                  <div className="h-12 bg-primary-500/20 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-sm text-slate-500">
            {demo.subdomain && (
              <span>demo.cto.new/{demo.subdomain}</span>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn btn-secondary">
              Close
            </button>
            {demo.status === 'ready' && (
              <button onClick={onSend} className="btn btn-primary">
                <Send className="w-4 h-4" />
                Send to Lead
              </button>
            )}
            <button className="btn btn-secondary">
              <ExternalLink className="w-4 h-4" />
              Open Live
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
