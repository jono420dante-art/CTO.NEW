# CTO.NEW - Agent Orchestration Platform

A modern multi-layer dashboard and platform for managing and orchestrating autonomous agents at scale.

## Features

### Layer 1: Executive Dashboard
- High-level KPIs and metrics overview
- Task completion trends and real-time activity monitoring
- Agent performance rankings and leaderboards
- Task distribution and status breakdowns

### Layer 2: Agent Management
- Create and configure agents with custom capabilities
- Monitor agent status (active, idle, error, paused, maintenance)
- Manage agent configurations and settings
- Track task history and performance metrics

### Layer 3: Task Orchestration
- Create and dispatch tasks to specific agents
- Monitor task execution in real-time
- Manage task priorities (low, medium, high, critical)
- Track task dependencies and retry logic

### Layer 4: Analytics & Insights
- Performance trends and trend analysis
- Agent leaderboard and rankings
- Export reports and analytics data
- Hourly activity and task distribution charts

### Layer 5: Settings & Configuration
- Profile management
- Theme customization (light, dark, system)
- Notification preferences
- Integration management (Slack, webhooks)
- Security settings

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS with custom design system
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Routing**: React Router v6

## Getting Started

The development server runs automatically. Open the preview to see the application.

## Database Schema

The platform uses the following tables:
- **agents**: Agent configurations and status
- **tasks**: Task definitions and execution status
- **agent_metrics**: Time-series performance data
- **task_dependencies**: Task relationship mappings
- **workflow_executions**: Multi-agent workflow tracking
- **notifications**: User notification system
- **user_settings**: User preferences and configurations

All tables have Row Level Security (RLS) enabled for data isolation.

## Architecture

```
src/
├── components/
│   ├── Auth.tsx           # Authentication UI
│   └── Layout/
│       ├── Layout.tsx     # Main layout wrapper
│       ├── Sidebar.tsx    # Navigation sidebar
│       └── Header.tsx      # Page header
├── hooks/
│   └── useAuth.tsx       # Authentication hook
├── lib/
│   └── supabase.ts       # Supabase client & types
├── pages/
│   ├── Dashboard.tsx     # Executive dashboard
│   ├── Agents.tsx        # Agent management
│   ├── Tasks.tsx         # Task orchestration
│   ├── Analytics.tsx     # Analytics & insights
│   ├── Settings.tsx      # Settings & config
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

## License

MIT
