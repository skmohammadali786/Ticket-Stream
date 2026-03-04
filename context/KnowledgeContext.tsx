import React, { createContext, useContext, useMemo, ReactNode } from 'react';

export interface KBArticle {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  readTime: number;
  helpful: number;
  tags: string[];
  updatedAt: number;
}

export interface KBCategory {
  id: string;
  name: string;
  icon: string;
  count: number;
}

interface KnowledgeContextValue {
  articles: KBArticle[];
  categories: KBCategory[];
  getArticlesByCategory: (category: string) => KBArticle[];
  searchArticles: (query: string) => KBArticle[];
}

const KnowledgeContext = createContext<KnowledgeContextValue | null>(null);

const ARTICLES: KBArticle[] = [
  {
    id: 'art-001',
    title: 'Getting Started with TicketStream API',
    category: 'API & Integrations',
    summary: 'Learn how to authenticate and make your first API call to TicketStream.',
    content: `## Overview\n\nThe TicketStream API is a RESTful API that allows you to integrate support ticket management into your application.\n\n## Authentication\n\nAll API requests require an API key passed in the Authorization header:\n\n\`\`\`\nAuthorization: Bearer YOUR_API_KEY\n\`\`\`\n\n## Your First Request\n\nFetch all open tickets:\n\n\`\`\`bash\ncurl -X GET https://api.ticketstream.io/v1/tickets \\\n  -H "Authorization: Bearer YOUR_API_KEY"\n\`\`\`\n\n## Rate Limits\n\n- Free: 1,000 req/hr\n- Pro: 10,000 req/hr\n- Enterprise: Unlimited`,
    readTime: 5,
    helpful: 142,
    tags: ['api', 'getting-started', 'auth'],
    updatedAt: Date.now() - 86400000,
  },
  {
    id: 'art-002',
    title: 'Setting Up Webhook Notifications',
    category: 'API & Integrations',
    summary: 'Configure webhooks to receive real-time ticket events in your application.',
    content: `## Webhook Overview\n\nWebhooks allow TicketStream to push event notifications to your server in real-time.\n\n## Supported Events\n\n- \`ticket.created\`\n- \`ticket.updated\`\n- \`ticket.resolved\`\n- \`message.received\`\n\n## Configuration\n\n1. Go to Settings > Integrations > Webhooks\n2. Click "Add Endpoint"\n3. Enter your endpoint URL\n4. Select the events you want to receive\n5. Save and test the connection\n\n## Payload Format\n\n\`\`\`json\n{\n  "event": "ticket.created",\n  "timestamp": "2024-01-15T10:30:00Z",\n  "data": { "ticketId": "tkt-001" }\n}\n\`\`\``,
    readTime: 7,
    helpful: 98,
    tags: ['webhooks', 'integration', 'events'],
    updatedAt: Date.now() - 172800000,
  },
  {
    id: 'art-003',
    title: 'Managing Team Members and Roles',
    category: 'Account Management',
    summary: 'Learn how to invite agents, set permissions, and manage your support team.',
    content: `## Team Management\n\nEffectively manage your support team within TicketStream.\n\n## Inviting Agents\n\n1. Go to Settings > Team\n2. Click "Invite Member"\n3. Enter their email address\n4. Assign a role\n\n## Available Roles\n\n**Agent**: Can view and respond to tickets assigned to them\n\n**Senior Agent**: Can view all tickets, reassign, and close\n\n**Admin**: Full access including billing and settings\n\n## Setting Up Queues\n\nCreate custom queues based on:\n- Product area\n- Language\n- Priority level\n- Customer tier`,
    readTime: 4,
    helpful: 76,
    tags: ['team', 'roles', 'permissions'],
    updatedAt: Date.now() - 259200000,
  },
  {
    id: 'art-004',
    title: 'Understanding Ticket Priority Levels',
    category: 'Ticket Management',
    summary: 'How priority levels work and best practices for triaging incoming tickets.',
    content: `## Priority Levels\n\nTicketStream uses four priority levels to help teams focus on what matters most.\n\n## Urgent\n\n- System down or critical business impact\n- Response SLA: 1 hour\n- Auto-escalation after 2 hours\n\n## High\n\n- Major functionality impaired\n- Response SLA: 4 hours\n\n## Medium\n\n- Feature degraded, workaround available\n- Response SLA: 24 hours\n\n## Low\n\n- General questions, feature requests\n- Response SLA: 72 hours\n\n## Auto-Priority Detection\n\nEnable AI-powered priority detection in Settings > Automation to automatically classify incoming tickets based on content analysis.`,
    readTime: 3,
    helpful: 201,
    tags: ['priority', 'sla', 'triage'],
    updatedAt: Date.now() - 432000000,
  },
  {
    id: 'art-005',
    title: 'Using Internal Notes for Team Collaboration',
    category: 'Ticket Management',
    summary: 'Keep your team in sync using internal notes that are hidden from customers.',
    content: `## Internal Notes\n\nInternal notes allow agents to communicate privately within a ticket thread without the customer seeing the conversation.\n\n## Adding an Internal Note\n\n1. Open a ticket\n2. Click the "Note" toggle in the reply box\n3. Type your note\n4. Click "Add Note"\n\n## Best Practices\n\n- Use notes to document investigation steps\n- Tag colleagues with @mentions\n- Share relevant links and screenshots\n- Summarize key findings before handoffs\n\n## Visibility\n\nInternal notes are only visible to agents with access to the ticket. They are marked with a distinct visual indicator.`,
    readTime: 3,
    helpful: 134,
    tags: ['notes', 'collaboration', 'agents'],
    updatedAt: Date.now() - 518400000,
  },
  {
    id: 'art-006',
    title: 'Setting Up Live Chat on Your Website',
    category: 'Live Chat',
    summary: 'Embed the TicketStream chat widget on your website in minutes.',
    content: `## Live Chat Widget\n\nAdd real-time chat support to any website with a single line of code.\n\n## Installation\n\nAdd this script to your HTML before the closing \`</body>\` tag:\n\n\`\`\`html\n<script>\n  window.TicketStream = { key: 'YOUR_SITE_KEY' };\n  (function(d,s,id){ /* loader */ })(document,'script','ts-chat');\n</script>\n\`\`\`\n\n## Customization\n\n\`\`\`js\nwindow.TicketStream = {\n  key: 'YOUR_SITE_KEY',\n  primaryColor: '#0EA5E9',\n  greeting: 'Hi! How can we help?',\n  position: 'bottom-right'\n};\n\`\`\`\n\n## Routing Rules\n\nConfigure which agents receive chats based on the page URL, customer attributes, or business hours.`,
    readTime: 6,
    helpful: 189,
    tags: ['live-chat', 'widget', 'installation'],
    updatedAt: Date.now() - 604800000,
  },
  {
    id: 'art-007',
    title: 'Billing and Plan Management',
    category: 'Account Management',
    summary: 'Understand your invoice, upgrade your plan, and manage payment methods.',
    content: `## Billing Overview\n\nManage your subscription and billing from Settings > Billing.\n\n## Plan Comparison\n\n**Free**: 2 agents, 100 tickets/month\n\n**Pro ($49/mo)**: 10 agents, unlimited tickets, API access\n\n**Enterprise**: Custom pricing, dedicated support, SLA guarantees\n\n## Understanding Your Invoice\n\nInvoices are generated on the 1st of each month and include:\n- Base plan cost\n- Overage charges (if applicable)\n- Add-on features\n\n## Updating Payment Method\n\n1. Go to Settings > Billing > Payment Methods\n2. Click "Add Card"\n3. Enter card details\n4. Set as default`,
    readTime: 4,
    helpful: 88,
    tags: ['billing', 'plans', 'pricing'],
    updatedAt: Date.now() - 691200000,
  },
  {
    id: 'art-008',
    title: 'Automating Ticket Routing with Rules',
    category: 'Automation',
    summary: 'Create rules to automatically assign, tag, and prioritize incoming tickets.',
    content: `## Automation Rules\n\nSave time by automating repetitive routing and tagging tasks.\n\n## Creating a Rule\n\n1. Go to Settings > Automation > Rules\n2. Click "New Rule"\n3. Define conditions (e.g., subject contains "billing")\n4. Add actions (e.g., assign to Billing team, set priority High)\n5. Save and enable\n\n## Example Rules\n\n**VIP Customer Fast Track**\n- Condition: Customer tier is Enterprise\n- Action: Set priority to High, assign to Senior Agent queue\n\n**After-Hours Auto-Reply**\n- Condition: Received outside business hours\n- Action: Send auto-reply, set status to Pending`,
    readTime: 5,
    helpful: 156,
    tags: ['automation', 'routing', 'rules'],
    updatedAt: Date.now() - 777600000,
  },
];

const CATEGORIES: KBCategory[] = [
  { id: 'cat-1', name: 'API & Integrations', icon: 'code-slash', count: 2 },
  { id: 'cat-2', name: 'Ticket Management', icon: 'ticket', count: 2 },
  { id: 'cat-3', name: 'Live Chat', icon: 'chatbubbles', count: 1 },
  { id: 'cat-4', name: 'Account Management', icon: 'person-circle', count: 2 },
  { id: 'cat-5', name: 'Automation', icon: 'flash', count: 1 },
];

export function KnowledgeProvider({ children }: { children: ReactNode }) {
  const getArticlesByCategory = (category: string) =>
    ARTICLES.filter((a) => a.category === category);

  const searchArticles = (query: string) => {
    const q = query.toLowerCase();
    return ARTICLES.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.tags.some((t) => t.includes(q))
    );
  };

  const value = useMemo(
    () => ({ articles: ARTICLES, categories: CATEGORIES, getArticlesByCategory, searchArticles }),
    []
  );

  return <KnowledgeContext.Provider value={value}>{children}</KnowledgeContext.Provider>;
}

export function useKnowledge() {
  const ctx = useContext(KnowledgeContext);
  if (!ctx) throw new Error('useKnowledge must be used within KnowledgeProvider');
  return ctx;
}
