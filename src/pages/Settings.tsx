import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  User,
  Bell,
  Palette,
  Shield,
  Code,
  Globe,
  Moon,
  Sun,
  Monitor,
  Check,
  Eye,
  Grid,
  List,
  Slack,
  Mail,
  Webhook,
  Save,
  RefreshCw,
} from 'lucide-react'
import { supabase, type UserSettings } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Header from '../components/Layout/Header'

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

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'integrations', label: 'Integrations', icon: Code },
  { id: 'security', label: 'Security', icon: Shield },
]

export default function Settings() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    company: '',
    role: '',
  })

  const [appearanceData, setAppearanceData] = useState({
    theme: 'system' as 'light' | 'dark' | 'system',
    defaultView: 'grid' as 'grid' | 'list',
    compactMode: false,
  })

  const [notificationData, setNotificationData] = useState({
    emailAlerts: true,
    pushNotifications: true,
    taskCompletion: true,
    taskFailure: true,
    agentIdle: false,
    weeklyDigest: true,
  })

  const [integrationData, setIntegrationData] = useState({
    slackWebhook: '',
    customWebhook: '',
    apiKey: '',
  })

  useEffect(() => {
    if (!user) return

    const fetchSettings = async () => {
      const { data } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setSettings(data as UserSettings)
        setAppearanceData({
          theme: data.theme as 'light' | 'dark' | 'system',
          defaultView: data.default_agent_view as 'grid' | 'list',
          compactMode: false,
        })
        setNotificationData({
          emailAlerts: data.email_alerts,
          pushNotifications: data.notifications_enabled,
          taskCompletion: true,
          taskFailure: true,
          agentIdle: false,
          weeklyDigest: true,
        })
        setIntegrationData({
          slackWebhook: data.slack_webhook_url || '',
          customWebhook: '',
          apiKey: '',
        })
      } else {
        const { data: newSettings } = await supabase
          .from('user_settings')
          .insert({ user_id: user.id })
          .select()
          .single()
        if (newSettings) setSettings(newSettings as UserSettings)
      }

      setProfileData({
        name: user.user_metadata?.name || '',
        email: user.email || '',
        company: user.user_metadata?.company || '',
        role: user.user_metadata?.role || '',
      })
      setLoading(false)
    }

    fetchSettings()
  }, [user])

  const handleSave = async () => {
    if (!user || !settings) return

    setSaving(true)
    const { error } = await supabase
      .from('user_settings')
      .update({
        theme: appearanceData.theme,
        default_agent_view: appearanceData.defaultView,
        notifications_enabled: notificationData.pushNotifications,
        email_alerts: notificationData.emailAlerts,
        slack_webhook_url: integrationData.slackWebhook || null,
      })
      .eq('id', settings.id)

    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  return (
    <div className="min-h-screen">
      <Header
        title="Settings"
        subtitle="Configure your preferences and integrations"
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="p-6"
      >
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <div className="card p-2 sticky top-24">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === tab.id
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Content */}
          <motion.div variants={itemVariants} className="lg:col-span-3 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
              </div>
            ) : (
              <>
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="card p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-6">Profile Settings</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={profileData.email}
                          disabled
                          className="input bg-slate-50 text-slate-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Company
                          </label>
                          <input
                            type="text"
                            value={profileData.company}
                            onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                            className="input"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Role
                          </label>
                          <input
                            type="text"
                            value={profileData.role}
                            onChange={(e) => setProfileData({ ...profileData, role: e.target.value })}
                            className="input"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Appearance Tab */}
                {activeTab === 'appearance' && (
                  <div className="card p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-6">Appearance Settings</h2>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-3">
                          Theme
                        </label>
                        <div className="grid grid-cols-3 gap-4">
                          {[
                            { value: 'light', label: 'Light', icon: Sun },
                            { value: 'dark', label: 'Dark', icon: Moon },
                            { value: 'system', label: 'System', icon: Monitor },
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() => setAppearanceData({ ...appearanceData, theme: option.value as typeof appearanceData.theme })}
                              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                                appearanceData.theme === option.value
                                  ? 'border-primary-500 bg-primary-50'
                                  : 'border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <option.icon className={`w-6 h-6 ${
                                appearanceData.theme === option.value ? 'text-primary-600' : 'text-slate-400'
                              }`} />
                              <span className="text-sm font-medium text-slate-700">{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-3">
                          Default Agent View
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                          {[
                            { value: 'grid', label: 'Grid', icon: Grid },
                            { value: 'list', label: 'List', icon: List },
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() => setAppearanceData({ ...appearanceData, defaultView: option.value as 'grid' | 'list' })}
                              className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                                appearanceData.defaultView === option.value
                                  ? 'border-primary-500 bg-primary-50'
                                  : 'border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <option.icon className={`w-5 h-5 ${
                                appearanceData.defaultView === option.value ? 'text-primary-600' : 'text-slate-400'
                              }`} />
                              <span className="font-medium text-slate-700">{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div>
                          <p className="font-medium text-slate-900">Compact Mode</p>
                          <p className="text-sm text-slate-500">Show more content with smaller spacing</p>
                        </div>
                        <button
                          onClick={() => setAppearanceData({ ...appearanceData, compactMode: !appearanceData.compactMode })}
                          className={`w-12 h-6 rounded-full transition-all relative ${
                            appearanceData.compactMode ? 'bg-primary-500' : 'bg-slate-300'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-all ${
                            appearanceData.compactMode ? 'left-6' : 'left-0.5'
                          }`} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <div className="card p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-6">Notification Preferences</h2>
                    <div className="space-y-4">
                      {[
                        { key: 'emailAlerts', label: 'Email Alerts', description: 'Receive email notifications', icon: Mail },
                        { key: 'pushNotifications', label: 'Push Notifications', description: 'Browser push notifications', icon: Bell },
                        { key: 'taskCompletion', label: 'Task Completion', description: 'When a task completes successfully', icon: Check },
                        { key: 'taskFailure', label: 'Task Failure', description: 'When a task fails', icon: Shield },
                        { key: 'agentIdle', label: 'Agent Idle', description: 'When an agent goes idle', icon: Moon },
                        { key: 'weeklyDigest', label: 'Weekly Digest', description: 'Weekly summary of activity', icon: Globe },
                      ].map((option) => (
                        <div key={option.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center">
                              <option.icon className="w-5 h-5 text-slate-600" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{option.label}</p>
                              <p className="text-sm text-slate-500">{option.description}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setNotificationData({
                              ...notificationData,
                              [option.key]: !notificationData[option.key as keyof typeof notificationData]
                            })}
                            className={`w-12 h-6 rounded-full transition-all relative ${
                              notificationData[option.key as keyof typeof notificationData] ? 'bg-primary-500' : 'bg-slate-300'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-all ${
                              notificationData[option.key as keyof typeof notificationData] ? 'left-6' : 'left-0.5'
                            }`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Integrations Tab */}
                {activeTab === 'integrations' && (
                  <div className="space-y-6">
                    <div className="card p-6">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-[#4A154B] flex items-center justify-center">
                          <Slack className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-slate-900">Slack Integration</h2>
                          <p className="text-sm text-slate-500">Receive notifications in Slack channels</p>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Webhook URL
                        </label>
                        <input
                          type="url"
                          value={integrationData.slackWebhook}
                          onChange={(e) => setIntegrationData({ ...integrationData, slackWebhook: e.target.value })}
                          placeholder="https://hooks.slack.com/services/..."
                          className="input"
                        />
                      </div>
                    </div>

                    <div className="card p-6">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                          <Webhook className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-slate-900">Custom Webhook</h2>
                          <p className="text-sm text-slate-500">Send events to your own endpoint</p>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Webhook URL
                        </label>
                        <input
                          type="url"
                          value={integrationData.customWebhook}
                          onChange={(e) => setIntegrationData({ ...integrationData, customWebhook: e.target.value })}
                          placeholder="https://your-domain.com/webhook"
                          className="input"
                        />
                      </div>
                    </div>

                    <div className="card p-6">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center">
                          <Code className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-slate-900">API Access</h2>
                          <p className="text-sm text-slate-500">Manage API keys for programmatic access</p>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          API Key
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="password"
                            value={integrationData.apiKey}
                            onChange={(e) => setIntegrationData({ ...integrationData, apiKey: e.target.value })}
                            placeholder="sk-..."
                            className="input flex-1"
                          />
                          <button className="btn btn-secondary whitespace-nowrap">
                            <Eye className="w-4 h-4" />
                            Show
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <div className="card p-6">
                      <h2 className="text-lg font-semibold text-slate-900 mb-6">Account Security</h2>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                          <div>
                            <p className="font-medium text-slate-900">Change Password</p>
                            <p className="text-sm text-slate-500">Update your account password</p>
                          </div>
                          <button className="btn btn-secondary">Update</button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                          <div>
                            <p className="font-medium text-slate-900">Two-Factor Authentication</p>
                            <p className="text-sm text-slate-500">Add an extra layer of security</p>
                          </div>
                          <button className="btn btn-secondary">Enable</button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                          <div>
                            <p className="font-medium text-slate-900">Active Sessions</p>
                            <p className="text-sm text-slate-500">Manage your active sessions</p>
                          </div>
                          <button className="btn btn-secondary">View</button>
                        </div>
                      </div>
                    </div>

                    <div className="card p-6 border-error-200 bg-error-50">
                      <h2 className="text-lg font-semibold text-error-900 mb-4">Danger Zone</h2>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">Delete Account</p>
                          <p className="text-sm text-slate-600">Permanently delete your account and all data</p>
                        </div>
                        <button className="btn btn-danger">Delete Account</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="fixed bottom-6 right-6 flex gap-3"
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
                        Save Changes
                      </>
                    )}
                  </button>
                </motion.div>
              </>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
