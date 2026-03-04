import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Priority = 'urgent' | 'high' | 'medium' | 'low';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface Message {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'agent';
  content: string;
  isInternal: boolean;
  timestamp: number;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: Priority;
  customerId: string;
  customerName: string;
  assigneeId?: string;
  assigneeName?: string;
  createdAt: number;
  updatedAt: number;
  tags: string[];
  responseTime?: number;
}

interface TicketContextValue {
  tickets: Ticket[];
  messages: Record<string, Message[]>;
  addMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => Promise<void>;
  updateTicketStatus: (id: string, status: TicketStatus) => Promise<void>;
  updateTicketPriority: (id: string, priority: Priority) => Promise<void>;
  assignTicket: (id: string, agentId: string, agentName: string) => Promise<void>;
  createTicket: (t: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Ticket>;
}

const TicketContext = createContext<TicketContextValue | null>(null);

const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'tkt-001',
    title: 'Cannot log into my account after password reset',
    description: 'After resetting my password, I get an "invalid credentials" error every time I try to login.',
    status: 'open',
    priority: 'urgent',
    customerId: 'cust-001',
    customerName: 'Alex Johnson',
    assigneeId: 'agent-001',
    assigneeName: 'Sarah Chen',
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 1800000,
    tags: ['auth', 'login'],
    responseTime: 12,
  },
  {
    id: 'tkt-002',
    title: 'API rate limit exceeded unexpectedly',
    description: 'Our integration is hitting rate limits even though we are well below our plan limits.',
    status: 'in_progress',
    priority: 'high',
    customerId: 'cust-002',
    customerName: 'Marcus Reid',
    assigneeId: 'agent-001',
    assigneeName: 'Sarah Chen',
    createdAt: Date.now() - 7200000,
    updatedAt: Date.now() - 900000,
    tags: ['api', 'rate-limit'],
    responseTime: 8,
  },
  {
    id: 'tkt-003',
    title: 'Billing invoice shows incorrect charges',
    description: 'My latest invoice shows a charge for a plan I downgraded from last month.',
    status: 'open',
    priority: 'high',
    customerId: 'cust-003',
    customerName: 'Priya Sharma',
    createdAt: Date.now() - 10800000,
    updatedAt: Date.now() - 10800000,
    tags: ['billing'],
    responseTime: undefined,
  },
  {
    id: 'tkt-004',
    title: 'Feature request: CSV export for reports',
    description: 'It would be very helpful to export dashboard reports to CSV format.',
    status: 'open',
    priority: 'medium',
    customerId: 'cust-001',
    customerName: 'Alex Johnson',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
    tags: ['feature-request', 'reports'],
    responseTime: undefined,
  },
  {
    id: 'tkt-005',
    title: 'Webhook notifications not firing',
    description: 'Webhooks stopped firing 2 days ago. No changes on our end.',
    status: 'in_progress',
    priority: 'urgent',
    customerId: 'cust-004',
    customerName: 'Jordan Lee',
    assigneeId: 'agent-002',
    assigneeName: 'David Park',
    createdAt: Date.now() - 172800000,
    updatedAt: Date.now() - 3600000,
    tags: ['webhooks', 'integration'],
    responseTime: 5,
  },
  {
    id: 'tkt-006',
    title: 'Dark mode not saving preference',
    description: 'Every time I reload the app, dark mode is turned off even though I saved it.',
    status: 'resolved',
    priority: 'low',
    customerId: 'cust-005',
    customerName: 'Emma Wilson',
    assigneeId: 'agent-001',
    assigneeName: 'Sarah Chen',
    createdAt: Date.now() - 259200000,
    updatedAt: Date.now() - 43200000,
    tags: ['ui', 'settings'],
    responseTime: 24,
  },
];

const INITIAL_MESSAGES: Record<string, Message[]> = {
  'tkt-001': [
    {
      id: 'msg-001',
      ticketId: 'tkt-001',
      senderId: 'cust-001',
      senderName: 'Alex Johnson',
      senderRole: 'customer',
      content: 'Hi, I reset my password but now I cannot log in at all. I keep getting an invalid credentials error. This is very urgent as I need access for work.',
      isInternal: false,
      timestamp: Date.now() - 3600000,
    },
    {
      id: 'msg-002',
      ticketId: 'tkt-001',
      senderId: 'agent-001',
      senderName: 'Sarah Chen',
      senderRole: 'agent',
      content: 'Hi Alex! I can see your account here. Let me check on the password reset status. Could you confirm which email address you used?',
      isInternal: false,
      timestamp: Date.now() - 3000000,
    },
    {
      id: 'msg-003',
      ticketId: 'tkt-001',
      senderId: 'agent-001',
      senderName: 'Sarah Chen',
      senderRole: 'agent',
      content: 'Checking the auth logs - looks like there may be a cache issue after the reset. Will investigate.',
      isInternal: true,
      timestamp: Date.now() - 2800000,
    },
    {
      id: 'msg-004',
      ticketId: 'tkt-001',
      senderId: 'cust-001',
      senderName: 'Alex Johnson',
      senderRole: 'customer',
      content: 'I used alex.johnson@company.com for the reset. Let me know what you find!',
      isInternal: false,
      timestamp: Date.now() - 1800000,
    },
  ],
  'tkt-002': [
    {
      id: 'msg-005',
      ticketId: 'tkt-002',
      senderId: 'cust-002',
      senderName: 'Marcus Reid',
      senderRole: 'customer',
      content: 'We are on the Pro plan with 10k requests/hr limit but started hitting 429s at around 2k requests. This is breaking our production pipeline.',
      isInternal: false,
      timestamp: Date.now() - 7200000,
    },
    {
      id: 'msg-006',
      ticketId: 'tkt-002',
      senderId: 'agent-001',
      senderName: 'Sarah Chen',
      senderRole: 'agent',
      content: 'Thank you for reaching out Marcus. I can see the rate limit discrepancy in our systems. This looks like an issue with our rate limiting service. Engineering is aware.',
      isInternal: false,
      timestamp: Date.now() - 900000,
    },
  ],
};

export function TicketProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [messages, setMessages] = useState<Record<string, Message[]>>(INITIAL_MESSAGES);

  useEffect(() => {
    AsyncStorage.getItem('ts_tickets').then((stored) => {
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) setTickets(parsed);
        } catch {}
      }
    });
    AsyncStorage.getItem('ts_messages').then((stored) => {
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === 'object') setMessages(parsed);
        } catch {}
      }
    });
  }, []);

  const saveTickets = async (t: Ticket[]) => {
    setTickets(t);
    await AsyncStorage.setItem('ts_tickets', JSON.stringify(t));
  };

  const saveMessages = async (m: Record<string, Message[]>) => {
    setMessages(m);
    await AsyncStorage.setItem('ts_messages', JSON.stringify(m));
  };

  const addMessage = async (msg: Omit<Message, 'id' | 'timestamp'>) => {
    const newMsg: Message = {
      ...msg,
      id: 'msg-' + Date.now() + Math.random().toString(36).substr(2, 6),
      timestamp: Date.now(),
    };
    const updated = {
      ...messages,
      [msg.ticketId]: [...(messages[msg.ticketId] || []), newMsg],
    };
    await saveMessages(updated);
    const updatedTickets = tickets.map((t) =>
      t.id === msg.ticketId ? { ...t, updatedAt: Date.now() } : t
    );
    await saveTickets(updatedTickets);
  };

  const updateTicketStatus = async (id: string, status: TicketStatus) => {
    const updated = tickets.map((t) =>
      t.id === id ? { ...t, status, updatedAt: Date.now() } : t
    );
    await saveTickets(updated);
  };

  const updateTicketPriority = async (id: string, priority: Priority) => {
    const updated = tickets.map((t) =>
      t.id === id ? { ...t, priority, updatedAt: Date.now() } : t
    );
    await saveTickets(updated);
  };

  const assignTicket = async (id: string, agentId: string, agentName: string) => {
    const updated = tickets.map((t) =>
      t.id === id ? { ...t, assigneeId: agentId, assigneeName: agentName, updatedAt: Date.now() } : t
    );
    await saveTickets(updated);
  };

  const createTicket = async (t: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>): Promise<Ticket> => {
    const newTicket: Ticket = {
      ...t,
      id: 'tkt-' + Date.now().toString(36),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await saveTickets([...tickets, newTicket]);
    return newTicket;
  };

  const value = useMemo(
    () => ({ tickets, messages, addMessage, updateTicketStatus, updateTicketPriority, assignTicket, createTicket }),
    [tickets, messages]
  );

  return <TicketContext.Provider value={value}>{children}</TicketContext.Provider>;
}

export function useTickets() {
  const ctx = useContext(TicketContext);
  if (!ctx) throw new Error('useTickets must be used within TicketProvider');
  return ctx;
}
