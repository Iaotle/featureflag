'use client';

import { createContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials } from '@/types/auth';
import * as authLib from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    setLoading(true);
    try {
      const currentUser = await authLib.getCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(credentials: LoginCredentials): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const response = await authLib.login(credentials);
      setUser(response.user);
    } catch (err) { 
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function logout(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      await authLib.logout();
      setUser(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Logout failed';
      setError(errorMessage);
      console.error('Logout error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}
