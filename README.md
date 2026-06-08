# CTO.NEW - Autonomous AI Agency Platform

A fully autonomous AI agency that finds local businesses without websites, builds them custom demos, pitches them, negotiates, closes deals, and collects payments - all 24/7 without lifting a finger.

## Features

### Autonomous Lead Finding
- Automatically scans for businesses without websites
- Scores leads based on Google ratings, reviews, and industry
- Prioritizes high-value opportunities
- Real-time lead pipeline monitoring

### AI Demo Builder
- Generates custom demo websites for each lead
- Industry-specific templates (restaurant, medical, auto, etc.)
- Preview with responsive device switcher
- Tracks views and engagement

### Automated Outreach
- Personalized email campaigns using AI
- Open/click/reply tracking
- Auto-optimizing subject lines and content
- Follow-up scheduling

### AI Negotiation Agent
- Handles objections autonomously
- Negotiates pricing within configured bounds
- Conversation history and analysis
- Escalation detection

### Payment Collection
- Stripe integration for payments
- Auto-generated payment links
- Deal tracking dashboard
- Revenue analytics

### Core Platform Features

**Lead Management** (`/leads`):
- Lead scoring and prioritization
- Status tracking (new, contacted, demo_sent, negotiating, won)
- Business details and AI analysis
- One-click demo generation

**Demo Management** (`/demos`):
- Real-time demo generation status
- Responsive preview (desktop/tablet/mobile)
- Send demos to leads
- View tracking

**Outreach Center** (`/outreach`):
- Email tracking with open rates
- AI-powered personalization
- Follow-up automation
- Reply detection

**Deals Dashboard** (`/deals`):
- Pipeline visualization
- Revenue tracking
- Payment link generation
- Win rate analytics

**Agency Settings** (`/agency-settings`):
- Configure autonomous mode
- Set pricing and packages
- Target industries and cities
- Notification preferences

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS with custom design system
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Edge Functions)
- **Routing**: React Router v6

## Database Schema

The platform uses 15+ tables:
- **leads**: Business information and scoring
- **demos**: Generated website demos
- **outreach_messages**: Email campaigns
- **negotiations**: Conversation history
- **deals**: Payment tracking
- **agency_tasks**: Autonomous worker queue
- **agency_settings**: User configuration

All tables have Row Level Security (RLS) enabled.

## Edge Functions

The `agency-worker` function handles autonomous tasks:
- `scan_leads`: Find new businesses
- `generate_demo`: Create demo websites
- `send_outreach`: Send emails
- `handle_reply`: Process responses
- `close_deal`: Create deals

## Architecture

```
src/
├── components/
│   ├── Auth.tsx           # Authentication UI
│   └── Layout/
│       ├── Layout.tsx     # Main layout wrapper
│       ├── Sidebar.tsx    # Navigation sidebar
│       └── Header.tsx     # Page header
├── hooks/
│   └── useAuth.tsx       # Authentication hook
├── lib/
│   └── supabase.ts       # Supabase client & types
├── types/
│   └── agency.ts         # Agency type definitions
├── pages/
│   ├── Dashboard.tsx     # Executive dashboard
│   ├── Leads.tsx         # Lead management
│   ├── Demos.tsx         # Demo builder
│   ├── Outreach.tsx      # Email campaigns
│   ├── Deals.tsx         # Payment tracking
│   ├── Agents.tsx        # Agent management
│   ├── Tasks.tsx         # Task orchestration
│   ├── Analytics.tsx     # Analytics & insights
│   ├── Settings.tsx      # User settings
│   ├── AgencySettings.tsx # Agency configuration
│   └── Notifications.tsx # Notification center
└── App.tsx               # Main application
```

## Design System

The platform uses a comprehensive design system with:
- 6 color ramps (primary, secondary, accent, success, warning, error)
- 8px spacing system
- Consistent component styling
- Responsive breakpoints (mobile, tablet, desktop)
- Smooth animations and micro-interactions

## Getting Started

The development server runs automatically in the preview environment.

## License

MIT
