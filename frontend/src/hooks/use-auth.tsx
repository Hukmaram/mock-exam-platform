'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '@/lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  createdAt?: string;
  entitlements?: Array<{
    id: string;
    productId: string;
    certificationId?: string;
    examId?: string;
    isPlatformAccess?: boolean;
    isActive: boolean;
    product?: {
      name: string;
      priceInr: number;
    };
  }>;
  _count?: {
    attempts: number;
    orders: number;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  hasPlatformAccess: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasEntitlement: (certificationId?: string, examId?: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch (err) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.token) {
      localStorage.setItem('access_token', res.data.token);
    }
    await fetchCurrentUser();
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await api.post('/auth/register', { name, email, password });
    if (res.data.token) {
      localStorage.setItem('access_token', res.data.token);
    }
    await fetchCurrentUser();
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore
    } finally {
      localStorage.removeItem('access_token');
      setUser(null);
      window.location.href = '/';
    }
  };

  const hasPlatformAccess = Boolean(
    user?.role === 'ADMIN' ||
    user?.entitlements?.some(
      (ent) =>
        ent.isActive &&
        (ent.isPlatformAccess || (!ent.certificationId && !ent.examId))
    )
  );

  const hasEntitlement = (certificationId?: string, examId?: string): boolean => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true; // Admins have master access
    if (hasPlatformAccess) return true; // Platform all-access pass unlocks all mock exams

    if (!user.entitlements || user.entitlements.length === 0) return false;

    return user.entitlements.some((ent) => {
      if (!ent.isActive) return false;
      if (ent.isPlatformAccess || (!ent.certificationId && !ent.examId)) return true;
      if (certificationId && ent.certificationId === certificationId) return true;
      if (examId && ent.examId === examId) return true;
      return false;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        hasPlatformAccess,
        login,
        register,
        logout,
        refreshUser: fetchCurrentUser,
        hasEntitlement,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
