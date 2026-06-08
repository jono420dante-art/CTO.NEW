import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
}

interface AgencyTask {
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

// Simulated AI agent functions
async function processScanLeads(userId: string, supabaseUrl: string, supabaseKey: string): Promise<{ success: boolean; count?: number; error?: string }> {
  // In production, this would call Google Places API or similar
  // For now, we'll create mock leads
  const mockBusinesses = [
    { name: "Joe's Pizza Palace", type: "restaurant", city: "Brooklyn", rating: 4.6, reviews: 156 },
    { name: "Smile Dental Care", type: "dentist", city: "Queens", rating: 4.9, reviews: 89 },
    { name: "Quick Auto Service", type: "auto_repair", city: "Bronx", rating: 4.4, reviews: 67 },
  ]

  for (const biz of mockBusinesses) {
    const score = Math.min(100, Math.floor((biz.rating * 20) + (Math.log(biz.reviews) * 5)))

    await fetch(`${supabaseUrl}/rest/v1/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        user_id: userId,
        business_name: biz.name,
        business_type: biz.type,
        industry: biz.type === 'restaurant' ? 'Food & Dining' : biz.type === 'dentist' ? 'Healthcare' : 'Automotive',
        city: biz.city,
        state: 'NY',
        country: 'USA',
        google_rating: biz.rating,
        review_count: biz.reviews,
        has_website: false,
        score: score,
        priority: score > 80 ? 'high' : score > 60 ? 'medium' : 'low',
        status: 'new',
        source: 'auto_scan',
        ai_analysis: { opportunity: 'High - No website detected, strong reviews' },
        estimated_value: Math.floor(Math.random() * 2000) + 1000,
        recommended_offering: 'Professional Website Package'
      })
    })
  }

  return { success: true, count: mockBusinesses.length }
}

async function processGenerateDemo(task: AgencyTask, supabaseUrl: string, supabaseKey: string): Promise<{ success: boolean; demoId?: string; error?: string }> {
  if (!task.target_id) return { success: false, error: 'No lead ID' }

  // Get lead info
  const leadRes = await fetch(`${supabaseUrl}/rest/v1/leads?id=eq.${task.target_id}&select=*`, {
    headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
  })
  const leads = await leadRes.json()
  const lead = leads[0]

  if (!lead) return { success: false, error: 'Lead not found' }

  // Determine template based on business type
  const templateMap: Record<string, string> = {
    restaurant: 'restaurant',
    dentist: 'medical',
    auto_repair: 'auto',
    gym: 'fitness',
    salon: 'beauty',
    law: 'lawfirm',
    default: 'business'
  }
  const template = templateMap[lead.business_type] || templateMap.default

  // Create demo
  const demoRes = await fetch(`${supabaseUrl}/rest/v1/demos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      user_id: task.user_id,
      lead_id: task.target_id,
      title: `${lead.business_name} - Demo Website`,
      template: template,
      subdomain: `${lead.business_name.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now()}`,
      content: {
        hero: { title: lead.business_name, subtitle: lead.industry },
        features: ['Professional Design', 'Mobile Responsive', 'SEO Optimized', 'Contact Form'],
        cta: 'Get Started Today'
      },
      status: 'ready',
      generation_progress: 100
    })
  })

  const demos = await demoRes.json()
  const demo = demos[0]

  // Update lead status
  await fetch(`${supabaseUrl}/rest/v1/leads?id=eq.${task.target_id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    },
    body: JSON.stringify({ status: 'demo_sent' })
  })

  return { success: true, demoId: demo?.id }
}

async function processSendOutreach(task: AgencyTask, supabaseUrl: string, supabaseKey: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!task.target_id) return { success: false, error: 'No target ID' }

  // Get demo and lead info
  const demoRes = await fetch(`${supabaseUrl}/rest/v1/demos?id=eq.${task.target_id}&select=*,lead:leads(*)`, {
    headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
  })
  const demos = await demoRes.json()
  const demo = demos[0]
  const lead = demo?.lead

  if (!lead || !lead.email) {
    // Create initial outreach even without email (for demo)
    const messageRes = await fetch(`${supabaseUrl}/rest/v1/outreach_messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        user_id: task.user_id,
        lead_id: lead?.id || task.target_id,
        demo_id: task.target_id,
        subject: `A custom website demo for ${lead?.business_name || 'your business'}`,
        body: `Hi,\n\nI noticed ${lead?.business_name || 'your business'} doesn't have a website yet. I've created a custom demo website specifically for you.\n\nYou can view it here: https://demo.cto.new/${demo?.subdomain || 'demo'}\n\nLet me know what you think!\n\nBest regards`,
        message_type: 'initial',
        status: 'sent',
        sent_at: new Date().toISOString()
      })
    })
    const messages = await messageRes.json()

    // Update lead
    await fetch(`${supabaseUrl}/rest/v1/leads?id=eq.${lead?.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` },
      body: JSON.stringify({
        status: 'contacted',
        first_contacted_at: new Date().toISOString(),
        last_contacted_at: new Date().toISOString()
      })
    })

    return { success: true, messageId: messages[0]?.id }
  }

  return { success: true }
}

async function processHandleReply(task: AgencyTask, supabaseUrl: string, supabaseKey: string): Promise<{ success: boolean; error?: string }> {
  // AI negotiator would handle the reply here
  // For now, we'll just mark it as processed
  return { success: true }
}

async function processCloseDeal(task: AgencyTask, supabaseUrl: string, supabaseKey: string): Promise<{ success: boolean; dealId?: string; error?: string }> {
  if (!task.target_id) return { success: false, error: 'No lead ID' }

  // Get lead
  const leadRes = await fetch(`${supabaseUrl}/rest/v1/leads?id=eq.${task.target_id}&select=*`, {
    headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
  })
  const leads = await leadRes.json()
  const lead = leads[0]

  // Create deal
  const dealRes = await fetch(`${supabaseUrl}/rest/v1/deals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      user_id: task.user_id,
      lead_id: task.target_id,
      package: 'Professional Website Package',
      value: lead?.estimated_value || 1500,
      currency: 'USD',
      status: 'awaiting_payment'
    })
  })
  const deals = await dealRes.json()
  const deal = deals[0]

  // Update lead
  await fetch(`${supabaseUrl}/rest/v1/leads?id=eq.${task.target_id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` },
    body: JSON.stringify({ status: 'negotiating' })
  })

  return { success: true, dealId: deal?.id }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Get pending tasks
    const tasksRes = await fetch(`${supabaseUrl}/rest/v1/agency_tasks?status=eq.pending&order=priority.asc&limit=10`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    })
    const tasks: AgencyTask[] = await tasksRes.json()

    const results = []

    for (const task of tasks) {
      // Mark as running
      await fetch(`${supabaseUrl}/rest/v1/agency_tasks?id=eq.${task.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          status: 'running',
          started_at: new Date().toISOString(),
          attempts: task.attempts + 1
        })
      })

      let result
      try {
        switch (task.task_type) {
          case 'scan_leads':
            result = await processScanLeads(task.user_id, supabaseUrl, supabaseKey)
            break
          case 'generate_demo':
            result = await processGenerateDemo(task, supabaseUrl, supabaseKey)
            break
          case 'send_outreach':
            result = await processSendOutreach(task, supabaseUrl, supabaseKey)
            break
          case 'handle_reply':
            result = await processHandleReply(task, supabaseUrl, supabaseKey)
            break
          case 'close_deal':
            result = await processCloseDeal(task, supabaseUrl, supabaseKey)
            break
          default:
            result = { success: false, error: 'Unknown task type' }
        }
      } catch (err) {
        result = { success: false, error: String(err) }
      }

      // Update task status
      await fetch(`${supabaseUrl}/rest/v1/agency_tasks?id=eq.${task.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          status: result.success ? 'completed' : (task.attempts >= task.max_attempts - 1 ? 'failed' : 'retrying'),
          result: result,
          error_message: result.error || null,
          completed_at: result.success ? new Date().toISOString() : null
        })
      })

      results.push({ taskId: task.id, taskType: task.task_type, result })
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
