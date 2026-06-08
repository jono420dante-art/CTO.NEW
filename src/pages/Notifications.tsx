import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  Check,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-react'
import { supabase, type Notification } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { formatDistanceToNow } from 'date-fns'
import type { RealtimeChannel } from '@supabase/supabase-js'

const typeConfig = {
  success: { icon: CheckCircle2, color: 'text-success-600', bg: 'bg-success-100' },
  error: { icon: AlertCircle, color: 'text-error-600', bg: 'bg-error-100' },
  info: { icon: Info, color: 'text-primary-600', bg: 'bg-primary-100' },
  warning: { icon: AlertCircle, color: 'text-warning-600', bg: 'bg-warning-100' },
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 },
}

export default function Notifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    if (!user) return

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (!error && data) {
        setNotifications(data as Notification[])
      }
      setLoading(false)
    }

    fetchNotifications()

    const channel: RealtimeChannel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)

    if (!error) {
      setNotifications(notifications.map(n =>
        n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
      ))
    }
  }

  const markAllAsRead = async () => {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .is('read_at', null)

    if (!error) {
      setNotifications(notifications.map(n => ({ ...n, read_at: new Date().toISOString() })))
    }
  }

  const deleteNotification = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (!error) {
      setNotifications(notifications.filter(n => n.id !== notificationId))
    }
  }

  const unreadCount = notifications.filter(n => !n.read_at).length

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read_at)
    : notifications

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 flex items-center justify-between px-6 sticky top-0 z-40">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-slate-900"
          >
            Notifications
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-sm text-slate-500"
          >
            Stay updated on your agent activities
          </motion.p>
        </div>

        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="btn btn-secondary text-sm"
            >
              <Check className="w-4 h-4" />
              Mark all as read
            </button>
          )}
        </div>
      </header>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="p-6 max-w-3xl mx-auto"
      >
        {/* Tabs */}
        <motion.div variants={itemVariants} className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
              filter === 'all'
                ? 'bg-primary-500 text-white shadow-lg'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              filter === 'all' ? 'bg-white/20' : 'bg-slate-200'
            }`}>
              {notifications.length}
            </span>
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
              filter === 'unread'
                ? 'bg-primary-500 text-white shadow-lg'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Unread
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              filter === 'unread' ? 'bg-white/20' : 'bg-slate-200'
            }`}>
              {unreadCount}
            </span>
          </button>
        </motion.div>

        {/* Notifications List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <motion.div
            variants={itemVariants}
            className="card p-12 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </h3>
            <p className="text-slate-500">
              {filter === 'unread'
                ? 'You\'re all caught up!'
                : 'Notifications will appear here when agents complete tasks'}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredNotifications.map((notification) => {
                const config = typeConfig[notification.type as keyof typeof typeConfig] || typeConfig.info
                const Icon = config.icon

                return (
                  <motion.div
                    key={notification.id}
                    layoutId={notification.id}
                    variants={itemVariants}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={`card p-4 ${!notification.read_at ? 'border-l-4 border-l-primary-500' : ''}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-slate-900">{notification.title}</h3>
                            <p className="text-sm text-slate-600 mt-0.5">{notification.message}</p>
                          </div>
                          <span className="text-xs text-slate-400 whitespace-nowrap">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                          {!notification.read_at && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                            >
                              Mark as read
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-xs text-slate-400 hover:text-error-600 font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  )
}
