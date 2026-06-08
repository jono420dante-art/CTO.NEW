export type LeadStatus = 'new' | 'contacted' | 'responded' | 'negotiating' | 'demo_sent' | 'closed_won' | 'closed_lost' | 'unsubscribed'
export type LeadPriority = 'high' | 'medium' | 'low'
export type DemoStatus = 'generating' | 'ready' | 'sent' | 'viewed' | 'approved' | 'rejected'
export type OutreachStatus = 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'bounced'
export type DealStatus = 'pending' | 'negotiating' | 'awaiting_payment' | 'paid' | 'cancelled' | 'refunded'

export interface Lead {
  id: string
  user_id: string
  business_name: string
  business_type: string | null
  industry: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  country: string
  phone: string | null
  email: string | null
  website: string | null
  status: LeadStatus
  priority: LeadPriority
  score: number
  source: string
  google_place_id: string | null
  google_rating: number | null
  review_count: number
  has_website: boolean
  ai_analysis: Record<string, unknown>
  recommended_offering: string | null
  estimated_value: number | null
  discovered_at: string
  first_contacted_at: string | null
  last_contacted_at: string | null
  responded_at: string | null
  closed_at: string | null
  created_at: string
  updated_at: string
  tags: string[]
  notes: string | null
}

export interface Demo {
  id: string
  user_id: string
  lead_id: string
  title: string
  subdomain: string | null
  template: string
  content: Record<string, unknown>
  preview_url: string | null
  status: DemoStatus
  generation_progress: number
  viewed_at: string | null
  view_count: number
  approved_at: string | null
  rejected_at: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
  sent_at: string | null
}

export interface OutreachMessage {
  id: string
  user_id: string
  lead_id: string
  campaign_id: string | null
  demo_id: string | null
  subject: string | null
  body: string
  message_type: string
  status: OutreachStatus
  sent_at: string | null
  delivered_at: string | null
  opened_at: string | null
  clicked_at: string | null
  replied_at: string | null
  bounce_reason: string | null
  tracking_id: string | null
  open_count: number
  click_count: number
  created_at: string
  scheduled_for: string | null
}

export interface Negotiation {
  id: string
  user_id: string
  lead_id: string
  conversation: Array<{ role: 'user' | 'assistant', content: string, timestamp: string }>
  current_offer: number | null
  original_ask: number | null
  final_agreed_price: number | null
  objections_raised: string[]
  objections_resolved: string[]
  status: string
  outcome: string | null
  ai_confidence: number | null
  started_at: string
  completed_at: string | null
  last_message_at: string | null
}

export interface Deal {
  id: string
  user_id: string
  lead_id: string
  demo_id: string | null
  negotiation_id: string | null
  package: string
  description: string | null
  value: number
  currency: string
  status: DealStatus
  stripe_payment_intent_id: string | null
  stripe_customer_id: string | null
  payment_link: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
  expires_at: string | null
}

export interface AgencyTask {
  id: string
  user_id: string
  task_type: string
  target_id: string | null
  target_type: string | null
  status: string
  priority: number
  attempts: number
  max_attempts: number
  result: Record<string, unknown> | null
  error_message: string | null
  scheduled_for: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}

export interface AgencySettings {
  id: string
  user_id: string
  agency_name: string
  agency_email: string | null
  agency_phone: string | null
  target_industries: string[]
  target_cities: string[]
  min_lead_score: number
  skip_with_websites: boolean
  package_name: string
  base_price: number
  min_price: number
  currency: string
  packages: Array<{ name: string; price: number; features: string[] }>
  email_from_name: string | null
  email_signature: string | null
  followup_delay_days: number
  max_followups: number
  autonomous_mode: boolean
  auto_generate_demos: boolean
  auto_send_outreach: boolean
  auto_negotiate: boolean
  auto_close_deals: boolean
  notify_on_new_lead: boolean
  notify_on_response: boolean
  notify_on_payment: boolean
  notify_on_demo_view: boolean
  stripe_connected: boolean
  stripe_account_id: string | null
  created_at: string
  updated_at: string
}
