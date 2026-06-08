import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Bot,
  Target,
  DollarSign,
  Bell,
  Sparkles,
  Save,
  RefreshCw,
  Check,
  Globe,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Header from '../components/Layout/Header'
import type { AgencySettings } from '../types/agency'

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function AgencySettings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<AgencySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [formData, setFormData] = useState({
    agency_name: 'AI Agency',
    agency_email: '',
    agency_phone: '',
    target_industries: [] as string[],
    target_cities: [] as string[],
    min_lead_score: 50,
    skip_with_websites: true,
    package_name: 'Professional Website',
    base_price: 1500,
    min_price: 750,
    email_from_name: '',
    email_signature: '',
    followup_delay_days: 3,
    max_followups: 3,
    autonomous_mode: true,
    auto_generate_demos: true,
    auto_send_outreach: true,
    auto_negotiate: true,
    auto_close_deals: true,
    notify_on_new_lead: true,
    notify_on_response: true,
    notify_on_payment: true,
    notify_on_demo_view: true,
  })

  useEffect(() => {
    if (!user) return

    const fetchSettings = async () => {
      const { data } = await supabase
        .from('agency_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setSettings(data as AgencySettings)
        setFormData({
          agency_name: data.agency_name || 'AI Agency',
          agency_email: data.agency_email || '',
          agency_phone: data.agency_phone || '',
          target_industries: data.target_industries || [],
          target_cities: data.target_cities || [],
          min_lead_score: data.min_lead_score || 50,
          skip_with_websites: data.skip_with_websites ?? true,
          package_name: data.package_name || 'Professional Website',
          base_price: data.base_price || 1500,
          min_price: data.min_price || 750,
          email_from_name: data.email_from_name || '',
          email_signature: data.email_signature || '',
          followup_delay_days: data.followup_delay_days || 3,
          max_followups: data.max_followups || 3,
          autonomous_mode: data.autonomous_mode ?? true,
          auto_generate_demos: data.auto_generate_demos ?? true,
          auto_send_outreach: data.auto_send_outreach ?? true,
          auto_negotiate: data.auto_negotiate ?? true,
          auto_close_deals: data.auto_close_deals ?? true,
          notify_on_new_lead: data.notify_on_new_lead ?? true,
          notify_on_response: data.notify_on_response ?? true,
          notify_on_payment: data.notify_on_payment ?? true,
          notify_on_demo_view: data.notify_on_demo_view ?? true,
        })
      } else {
        // Create default settings
        const { data: newSettings } = await supabase
          .from('agency_settings')
          .insert({ user_id: user.id })
          .select()
          .single()
        if (newSettings) setSettings(newSettings as AgencySettings)
      }
      setLoading(false)
    }

    fetchSettings()
  }, [user])

  const handleSave = async () => {
    if (!user || !settings) return

    setSaving(true)
    await supabase
      .from('agency_settings')
      .update(formData)
      .eq('id', settings.id)

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setSaving(false)
  }

  const toggleArrayItem = (field: 'target_industries' | 'target_cities', value: string) => {
    const current = formData[field]
    setFormData({
      ...formData,
      [field]: current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value]
    })
  }

  const industries = ['Restaurant', 'Healthcare', 'Automotive', 'Fitness', 'Beauty', 'Legal', 'Real Estate', 'Home Services', 'Retail', 'Professional Services']
  const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose']

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header
        title="Agency Settings"
        subtitle="Configure your autonomous AI agency"
        action={{ label: 'Save Settings', onClick: handleSave }}
      />

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Autopilot Master Switch */}
        <motion.div variants={itemVariants} className={`card p-6 ${formData.autonomous_mode ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white' : 'bg-slate-100'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                formData.autonomous_mode ? 'bg-white/20' : 'bg-slate-200'
              }`}>
                <Bot className={`w-7 h-7 ${formData.autonomous_mode ? 'text-white' : 'text-slate-500'}`} />
              </div>
              <div>
                <h2 className={`text-xl font-semibold ${formData.autonomous_mode ? 'text-white' : 'text-slate-900'}`}>
                  Autonomous Mode
                </h2>
                <p className={`text-sm ${formData.autonomous_mode ? 'text-white/80' : 'text-slate-500'}`}>
                  {formData.autonomous_mode
                    ? 'AI is running your agency 24/7'
                    : 'Manual mode - you control every step'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setFormData({ ...formData, autonomous_mode: !formData.autonomous_mode })}
              className={`w-16 h-8 rounded-full transition-all relative ${
                formData.autonomous_mode ? 'bg-white/30' : 'bg-slate-300'
              }`}
            >
              <div className={`w-7 h-7 rounded-full bg-white shadow-lg absolute top-0.5 transition-all ${
                formData.autonomous_mode ? 'left-8' : 'left-0.5'
              }`} />
            </button>
          </div>
        </motion.div>

        {/* Business Info */}
        <motion.div variants={itemVariants} className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-5 h-5 text-primary-500" />
            <h3 className="font-semibold text-slate-900">Agency Information</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Agency Name</label>
              <input
                type="text"
                value={formData.agency_name}
                onChange={(e) => setFormData({ ...formData, agency_name: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.agency_email}
                onChange={(e) => setFormData({ ...formData, agency_email: e.target.value })}
                className="input"
                placeholder="agency@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
              <input
                type="tel"
                value={formData.agency_phone}
                onChange={(e) => setFormData({ ...formData, agency_phone: e.target.value })}
                className="input"
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email From Name</label>
              <input
                type="text"
                value={formData.email_from_name}
                onChange={(e) => setFormData({ ...formData, email_from_name: e.target.value })}
                className="input"
                placeholder="Your Name or Agency"
              />
            </div>
          </div>
        </motion.div>

        {/* Lead Targeting */}
        <motion.div variants={itemVariants} className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-5 h-5 text-primary-500" />
            <h3 className="font-semibold text-slate-900">Lead Targeting</h3>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">Target Industries</label>
              <div className="flex flex-wrap gap-2">
                {industries.map((ind) => (
                  <button
                    key={ind}
                    onClick={() => toggleArrayItem('target_industries', ind)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      formData.target_industries.includes(ind)
                        ? 'bg-primary-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {ind}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">Target Cities</label>
              <div className="flex flex-wrap gap-2">
                {cities.map((city) => (
                  <button
                    key={city}
                    onClick={() => toggleArrayItem('target_cities', city)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      formData.target_cities.includes(city)
                        ? 'bg-primary-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Minimum Lead Score</label>
                <input
                  type="number"
                  value={formData.min_lead_score}
                  onChange={(e) => setFormData({ ...formData, min_lead_score: parseInt(e.target.value) })}
                  className="input"
                  min={0}
                  max={100}
                />
                <p className="text-xs text-slate-500 mt-1">Only pursue leads with score above this threshold</p>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl mt-6">
                <div>
                  <p className="font-medium text-slate-900">Skip Businesses with Websites</p>
                  <p className="text-sm text-slate-500">Focus on businesses without web presence</p>
                </div>
                <button
                  onClick={() => setFormData({ ...formData, skip_with_websites: !formData.skip_with_websites })}
                  className={`w-12 h-6 rounded-full transition-all relative ${
                    formData.skip_with_websites ? 'bg-primary-500' : 'bg-slate-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-all ${
                    formData.skip_with_websites ? 'left-6' : 'left-0.5'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Pricing */}
        <motion.div variants={itemVariants} className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <DollarSign className="w-5 h-5 text-primary-500" />
            <h3 className="font-semibold text-slate-900">Pricing & Packages</h3>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Package Name</label>
              <input
                type="text"
                value={formData.package_name}
                onChange={(e) => setFormData({ ...formData, package_name: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Asking Price ($)</label>
              <input
                type="number"
                value={formData.base_price}
                onChange={(e) => setFormData({ ...formData, base_price: parseInt(e.target.value) })}
                className="input"
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Minimum Price ($)</label>
              <input
                type="number"
                value={formData.min_price}
                onChange={(e) => setFormData({ ...formData, min_price: parseInt(e.target.value) })}
                className="input"
                min={0}
              />
              <p className="text-xs text-slate-500 mt-1">Lowest AI will negotiate down to</p>
            </div>
          </div>
        </motion.div>

        {/* Auto Actions */}
        <motion.div variants={itemVariants} className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-5 h-5 text-primary-500" />
            <h3 className="font-semibold text-slate-900">Autonomous Actions</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'auto_generate_demos', label: 'Auto-generate Demo Websites', desc: 'Create demos for new leads' },
              { key: 'auto_send_outreach', label: 'Auto-send Outreach Emails', desc: 'Contact leads automatically' },
              { key: 'auto_negotiate', label: 'Auto-negotiate Pricing', desc: 'AI handles price discussions' },
              { key: 'auto_close_deals', label: 'Auto-close Deals', desc: 'Send payment links when approved' },
            ].map((action) => (
              <div key={action.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-medium text-slate-900">{action.label}</p>
                  <p className="text-sm text-slate-500">{action.desc}</p>
                </div>
                <button
                  onClick={() => setFormData({ ...formData, [action.key]: !formData[action.key as keyof typeof formData] })}
                  className={`w-12 h-6 rounded-full transition-all relative ${
                    formData[action.key as keyof typeof formData] ? 'bg-primary-500' : 'bg-slate-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-all ${
                    formData[action.key as keyof typeof formData] ? 'left-6' : 'left-0.5'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div variants={itemVariants} className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-5 h-5 text-primary-500" />
            <h3 className="font-semibold text-slate-900">Notifications</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'notify_on_new_lead', label: 'New Lead Discovered', desc: 'Receive an alert when a lead is found' },
              { key: 'notify_on_response', label: 'Lead Responds', desc: 'Be notified of lead replies' },
              { key: 'notify_on_payment', label: 'Payment Received', desc: 'Instant payment alerts' },
              { key: 'notify_on_demo_view', label: 'Demo Viewed', desc: 'Know when leads see your demo' },
            ].map((action) => (
              <div key={action.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-medium text-slate-900">{action.label}</p>
                  <p className="text-sm text-slate-500">{action.desc}</p>
                </div>
                <button
                  onClick={() => setFormData({ ...formData, [action.key]: !formData[action.key as keyof typeof formData] })}
                  className={`w-12 h-6 rounded-full transition-all relative ${
                    formData[action.key as keyof typeof formData] ? 'bg-primary-500' : 'bg-slate-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-all ${
                    formData[action.key as keyof typeof formData] ? 'left-6' : 'left-0.5'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Save Button Fixed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 right-6"
        >
          <button
            onClick={handleSave}
            disabled={saving}
            className={`btn ${saved ? 'btn-success' : 'btn-primary'} shadow-xl`}
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                Saved!
              </>
            ) : saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}
