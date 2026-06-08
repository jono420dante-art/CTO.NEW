import { createClient, type User } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

export type { User }

export type Agent = {
  id: string
  user_id: string
  name: string
  description: string | null
  type: 'explorer' | 'builder' | 'analyzer' | 'coordinator' | 'monitor'
  status: 'active' | 'idle' | 'error' | 'paused' | 'maintenance'
  config: Record<string, unknown>
  capabilities: string[]
  model: string
  created_at: string
  updated_at: string
  last_active_at: string | null
  total_tasks_completed: number
  total_tasks_failed: number
  avg_completion_time_seconds: number
  is_public: boolean
}

export type Task = {
  id: string
  user_id: string
  agent_id: string | null
  parent_task_id: string | null
  title: string
  description: string | null
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  input_data: Record<string, unknown>
  output_data: Record<string, unknown> | null
  error_message: string | null
  tags: string[]
  created_at: string
  started_at: string | null
  completed_at: string | null
  estimated_duration_seconds: number | null
  actual_duration_seconds: number | null
  retry_count: number
  max_retries: number
}

export type Notification = {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  data: Record<string, unknown>
  read_at: string | null
  created_at: string
}

export type UserSettings = {
  id: string
  user_id: string
  theme: string
  notifications_enabled: boolean
  email_alerts: boolean
  slack_webhook_url: string | null
  default_agent_view: string
  dashboard_layout: Record<string, unknown>
  created_at: string
  updated_at: string
}
