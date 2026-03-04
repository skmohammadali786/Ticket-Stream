import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const MOCK_USERS: Record<string, AuthUser & { password: string }> = {
  'customer@demo.com': {
    id: 'cust-001',
    name: 'Alex Johnson',
    email: 'customer@demo.com',
    password: 'demo123',
    role: 'customer',
  },
  'agent@demo.com': {
    id: 'agent-001',
    name: 'Sarah Chen',
    email: 'agent@demo.com',
    password: 'demo123',
    role: 'agent',
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('ts_user').then((stored) => {
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {}
      }
      setIsLoading(false);
    });
  }, []);

  const login = async (email: string, password: string, role: UserRole) => {
    const found = MOCK_USERS[email.toLowerCase()];
    if (!found || found.password !== password || found.role !== role) {
      throw new Error('Invalid credentials');
    }
    const { password: _, ...userData } = found;
    setUser(userData);
    await AsyncStorage.setItem('ts_user', JSON.stringify(userData));
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('ts_user');
  };

  const value = useMemo(() => ({ user, isLoading, login, logout }), [user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
