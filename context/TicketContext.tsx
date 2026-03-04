import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { supabase } from '@/utils/supabase';

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

export function TicketProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchTickets();
        fetchMessages();
      }
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchTickets();
        fetchMessages();
      } else {
        setTickets([]);
        setMessages({});
      }
    });

    const ticketSubscription = supabase
      .channel('public:tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => {
        if (session) fetchTickets();
      })
      .subscribe();

    const messageSubscription = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        if (session) fetchMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ticketSubscription);
      supabase.removeChannel(messageSubscription);
    };
  }, [session]);

  const fetchTickets = async () => {
    const { data, error } = await supabase.from('tickets').select('*');
    if (data && !error) {
      setTickets(data);
    } else {
      console.log('Error fetching tickets, possibly table missing for demo', error);
    }
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase.from('messages').select('*');
    if (data && !error) {
      const messagesObj: Record<string, Message[]> = {};
      data.forEach((m: any) => {
        if (!messagesObj[m.ticketId]) {
          messagesObj[m.ticketId] = [];
        }
        messagesObj[m.ticketId].push(m);
      });
      setMessages(messagesObj);
    }
  };

  const addMessage = async (msg: Omit<Message, 'id' | 'timestamp'>) => {
    const newMsg = {
      ...msg,
      id: 'msg-' + Date.now() + Math.random().toString(36).substr(2, 6),
      timestamp: Date.now(),
    };

    // Optimistic UI update
    setMessages((prev) => ({
      ...prev,
      [msg.ticketId]: [...(prev[msg.ticketId] || []), newMsg as Message],
    }));

    // Update tickets updatedAt locally
    setTickets((prev) =>
      prev.map(t => t.id === msg.ticketId ? { ...t, updatedAt: Date.now() } : t)
    );

    const { error } = await supabase.from('messages').insert([newMsg]);
    if (error) {
      console.log('Inserting message to Supabase failed, using local fallback', error);
    }
    await supabase.from('tickets').update({ updatedAt: Date.now() }).eq('id', msg.ticketId);
  };

  const updateTicketStatus = async (id: string, status: TicketStatus) => {
    setTickets((prev) => prev.map(t => t.id === id ? { ...t, status, updatedAt: Date.now() } : t));
    const { error } = await supabase.from('tickets').update({ status, updatedAt: Date.now() }).eq('id', id);
    if (error) console.log('Update failed', error);
  };

  const updateTicketPriority = async (id: string, priority: Priority) => {
    setTickets((prev) => prev.map(t => t.id === id ? { ...t, priority, updatedAt: Date.now() } : t));
    const { error } = await supabase.from('tickets').update({ priority, updatedAt: Date.now() }).eq('id', id);
  };

  const assignTicket = async (id: string, agentId: string, agentName: string) => {
    setTickets((prev) => prev.map(t => t.id === id ? { ...t, assigneeId: agentId, assigneeName: agentName, updatedAt: Date.now() } : t));
    const { error } = await supabase.from('tickets').update({ assigneeId: agentId, assigneeName: agentName, updatedAt: Date.now() }).eq('id', id);
  };

  const createTicket = async (t: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>): Promise<Ticket> => {
    const newTicket: Ticket = {
      ...t,
      id: 'tkt-' + Date.now().toString(36),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setTickets((prev) => [...prev, newTicket]);

    const { error } = await supabase.from('tickets').insert([newTicket]);
    if (error) {
      console.log('Insert ticket failed', error);
    }

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
