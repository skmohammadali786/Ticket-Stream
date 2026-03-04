# TicketStream

A modern SaaS helpdesk mobile app for managing support tickets, live chat, and knowledge base.

## App Overview

TicketStream is a role-based support ticket management platform with:
- **Customer** role: Submit tickets, track status, chat with agents
- **Agent** role: Manage ticket queue, respond to customers, add internal notes, resolve tickets

## Tech Stack

- **Frontend**: Expo Router (React Native), TypeScript
- **Backend**: Express.js + TypeScript
- **Storage**: AsyncStorage (local persistence, Supabase integration planned)
- **State**: React Context (Auth, Tickets, Knowledge)
- **UI**: expo-linear-gradient, expo-haptics, @expo/vector-icons

## Color Palette

- Primary: #0EA5E9 (Sky Blue)
- Accent: #F97316 (Orange)
- Background: #F0F9FF (Light Blue)
- Text: #0F172A

## App Structure

```
app/
  _layout.tsx           # Root layout with providers
  index.tsx             # Auth redirect
  (auth)/
    _layout.tsx
    login.tsx           # Role-based login (customer/agent)
  (tabs)/
    _layout.tsx         # Native tabs with liquid glass (iOS 26+)
    dashboard.tsx       # Metrics dashboard
    tickets.tsx         # Ticket queue with filters
    chats.tsx           # Chat conversation list
    knowledge.tsx       # Knowledge base browser
    profile.tsx         # Profile & settings
  ticket/[id].tsx       # Ticket detail with status/priority management
  chat/[id].tsx         # Live chat with internal notes
  article/[id].tsx      # Knowledge base article viewer

context/
  AuthContext.tsx       # Auth state with role-based login
  TicketContext.tsx     # Tickets and messages state
  KnowledgeContext.tsx  # Knowledge base articles and categories
```

## Demo Credentials

- **Customer**: customer@demo.com / demo123
- **Agent**: agent@demo.com / demo123

## Features

- Role-based login (customer vs agent flows)
- Dashboard with ticket volume metrics, priority breakdown
- Ticket queue with priority tags (urgent/high/medium/low), status filters, assignee filters
- Conversation thread with internal notes (agent-only)
- Knowledge base with category browser and article search
- Live chat between customers and agents
- Footer with integration/API docs links
- NativeTabs with liquid glass on iOS 26+

## Replit Environment

- **Database**: PostgreSQL via Replit's built-in DB (DATABASE_URL auto-configured)
- **Backend workflow**: `npm run server:dev` — Express server on port 5000 (webview)
- **Frontend**: Expo app previewed via Expo Go (scan QR code from the landing page)
- Schema managed with Drizzle ORM — run `npm run db:push` to sync schema changes

## Planned

- Real backend integration (currently uses React Context / AsyncStorage for state)
- Real-time updates
