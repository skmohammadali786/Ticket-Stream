import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/utils/supabase';
import { Session } from '@supabase/supabase-js';

export type UserRole = 'customer' | 'agent';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id, session.user.email || '');
      } else {
        setIsLoading(false);
      }
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id, session.user.email || '');
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });
  }, []);

  const fetchProfile = async (userId: string, email: string) => {
    // For this simple implementation, we'll try to get the role from user metadata
    // Or default to 'customer'
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userMeta = user?.user_metadata || {};
      const role = (userMeta.role as UserRole) || 'customer';
      const name = userMeta.full_name || email.split('@')[0];

      setUser({
        id: userId,
        email,
        name,
        role,
        avatar: userMeta.avatar_url,
      });
    } catch (e) {
      console.error('Failed to fetch profile', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, role: UserRole) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    const currentRole = data.user.user_metadata?.role;
    if (currentRole !== role) {
      // If they chose the wrong role tab, throw an error
      // (or we can update their role, but typically you don't want to auto-switch roles on login if it's production)
      // For this app we'll let them update their role on login if they switch tabs.
      await supabase.auth.updateUser({
          data: { role: role }
      });
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const value = useMemo(() => ({ user, isLoading, login, logout }), [user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
