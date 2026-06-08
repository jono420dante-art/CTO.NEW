-- Lead status enum
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'responded', 'negotiating', 'demo_sent', 'closed_won', 'closed_lost', 'unsubscribed');
CREATE TYPE lead_priority AS ENUM ('high', 'medium', 'low');
CREATE TYPE demo_status AS ENUM ('generating', 'ready', 'sent', 'viewed', 'approved', 'rejected');
CREATE TYPE outreach_status AS ENUM ('pending', 'sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced');
CREATE TYPE deal_status AS ENUM ('pending', 'negotiating', 'awaiting_payment', 'paid', 'cancelled', 'refunded');

-- Leads table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Business info
  business_name VARCHAR(255) NOT NULL,
  business_type VARCHAR(100),
  industry VARCHAR(100),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip VARCHAR(20),
  country VARCHAR(50) DEFAULT 'USA',
  phone VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(500),
  
  -- Lead metadata
  status lead_status NOT NULL DEFAULT 'new',
  priority lead_priority NOT NULL DEFAULT 'medium',
  score DECIMAL(5,2) DEFAULT 50.00,
  
  -- Discovery info
  source VARCHAR(100) DEFAULT 'auto_scan',
  google_place_id VARCHAR(200),
  google_rating DECIMAL(3,2),
  review_count INTEGER DEFAULT 0,
  has_website BOOLEAN DEFAULT false,
  
  -- AI analysis
  ai_analysis JSONB DEFAULT '{}'::jsonb,
  recommended_offering TEXT,
  estimated_value DECIMAL(12,2),
  
  -- Timestamps
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  first_contacted_at TIMESTAMPTZ,
  last_contacted_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Tags
  tags TEXT[] DEFAULT '{}',
  notes TEXT
);

-- Demo websites table
CREATE TABLE demos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  
  -- Demo content
  title VARCHAR(255) NOT NULL,
  subdomain VARCHAR(100) UNIQUE,
  template VARCHAR(100) NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  preview_url VARCHAR(500),
  
  -- Status
  status demo_status NOT NULL DEFAULT 'generating',
  generation_progress INTEGER DEFAULT 0,
  
  -- Tracking
  viewed_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

-- Outreach campaigns table
CREATE TABLE outreach_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template TEXT NOT NULL,
  subject_template VARCHAR(500) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  auto_followup BOOLEAN DEFAULT true,
  max_followups INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Outreach messages table
CREATE TABLE outreach_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES outreach_campaigns(id) ON DELETE SET NULL,
  demo_id UUID REFERENCES demos(id) ON DELETE SET NULL,
  
  -- Message content
  subject VARCHAR(500),
  body TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'initial', -- initial, followup_1, followup_2, etc.
  
  -- Status tracking
  status outreach_status NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  bounce_reason TEXT,
  
  -- Tracking pixels
  tracking_id VARCHAR(100) UNIQUE,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  scheduled_for TIMESTAMPTZ
);

-- Negotiations table
CREATE TABLE negotiations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  
  -- Conversation
  conversation JSONB DEFAULT '[]'::jsonb,
  current_offer DECIMAL(12,2),
  original_ask DECIMAL(12,2),
  final_agreed_price DECIMAL(12,2),
  
  -- Objection handling
  objections_raised TEXT[] DEFAULT '{}',
  objections_resolved TEXT[] DEFAULT '{}',
  
  -- Status
  status VARCHAR(50) DEFAULT 'active', -- active, completed, abandoned
  outcome VARCHAR(50), -- won, lost, pending
  ai_confidence DECIMAL(5,2),
  
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ
);

-- Deals table
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  demo_id UUID REFERENCES demos(id) ON DELETE SET NULL,
  negotiation_id UUID REFERENCES negotiations(id) ON DELETE SET NULL,
  
  -- Deal details
  package VARCHAR(100) NOT NULL,
  description TEXT,
  value DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Payment
  status deal_status NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id VARCHAR(200),
  stripe_customer_id VARCHAR(200),
  payment_link VARCHAR(500),
  paid_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Agent tasks for autonomous operation
CREATE TABLE agency_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Task definition
  task_type VARCHAR(100) NOT NULL, -- 'scan_leads', 'generate_demo', 'send_outreach', 'handle_reply', 'close_deal'
  target_id UUID, -- lead_id, demo_id, etc.
  target_type VARCHAR(50), -- 'lead', 'demo', 'message', 'deal'
  
  -- Execution
  status VARCHAR(50) DEFAULT 'pending', -- pending, running, completed, failed, retrying
  priority INTEGER DEFAULT 5,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  
  -- Results
  result JSONB,
  error_message TEXT,
  
  -- Scheduling
  scheduled_for TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agency settings
CREATE TABLE agency_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Business info
  agency_name VARCHAR(255) DEFAULT 'AI Agency',
  agency_email VARCHAR(255),
  agency_phone VARCHAR(50),
  
  -- Targeting
  target_industries TEXT[] DEFAULT '{}',
  target_cities TEXT[] DEFAULT '{}',
  min_lead_score DECIMAL(5,2) DEFAULT 50.00,
  skip_with_websites BOOLEAN DEFAULT true,
  
  -- Pricing
  package_name VARCHAR(100) DEFAULT 'Professional Website',
  base_price DECIMAL(12,2) DEFAULT 1500.00,
  min_price DECIMAL(12,2) DEFAULT 750.00,
  currency VARCHAR(3) DEFAULT 'USD',
  packages JSONB DEFAULT '[]'::jsonb,
  
  -- Outreach settings
  email_from_name VARCHAR(100),
  email_signature TEXT,
  followup_delay_days INTEGER DEFAULT 3,
  max_followups INTEGER DEFAULT 3,
  
  -- Auto-pilot
  autonomous_mode BOOLEAN DEFAULT true,
  auto_generate_demos BOOLEAN DEFAULT true,
  auto_send_outreach BOOLEAN DEFAULT true,
  auto_negotiate BOOLEAN DEFAULT true,
  auto_close_deals BOOLEAN DEFAULT true,
  
  -- Notifications
  notify_on_new_lead BOOLEAN DEFAULT true,
  notify_on_response BOOLEAN DEFAULT true,
  notify_on_payment BOOLEAN DEFAULT true,
  notify_on_demo_view BOOLEAN DEFAULT true,
  
  -- Stripe integration
  stripe_connected BOOLEAN DEFAULT false,
  stripe_account_id VARCHAR(200),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_leads_user_id ON leads(user_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_priority ON leads(priority);
CREATE INDEX idx_leads_score ON leads(score DESC);
CREATE INDEX idx_demos_lead_id ON demos(lead_id);
CREATE INDEX idx_demos_status ON demos(status);
CREATE INDEX idx_outreach_messages_lead_id ON outreach_messages(lead_id);
CREATE INDEX idx_outreach_messages_status ON outreach_messages(status);
CREATE INDEX idx_negotiations_lead_id ON negotiations(lead_id);
CREATE INDEX idx_deals_lead_id ON deals(lead_id);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_agency_tasks_status ON agency_tasks(status);
CREATE INDEX idx_agency_tasks_scheduled_for ON agency_tasks(scheduled_for);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE demos ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE negotiations ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "select_own_leads" ON leads FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_leads" ON leads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_leads" ON leads FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_leads" ON leads FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "select_own_demos" ON demos FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_demos" ON demos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_demos" ON demos FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_demos" ON demos FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "select_own_campaigns" ON outreach_campaigns FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_campaigns" ON outreach_campaigns FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_campaigns" ON outreach_campaigns FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_campaigns" ON outreach_campaigns FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "select_own_messages" ON outreach_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_messages" ON outreach_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_messages" ON outreach_messages FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_messages" ON outreach_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "select_own_negotiations" ON negotiations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_negotiations" ON negotiations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_negotiations" ON negotiations FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_negotiations" ON negotiations FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "select_own_deals" ON deals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_deals" ON deals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_deals" ON deals FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_deals" ON deals FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "select_own_tasks" ON agency_tasks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_tasks" ON agency_tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_tasks" ON agency_tasks FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_tasks" ON agency_tasks FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "select_own_settings" ON agency_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_settings" ON agency_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_settings" ON agency_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_demos_updated_at BEFORE UPDATE ON demos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agency_settings_updated_at BEFORE UPDATE ON agency_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
