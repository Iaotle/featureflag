'use client';

import { useState, useEffect } from 'react';
import { User, LoginCredentials } from '@/types/auth';
import * as authLib from '@/lib/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    setLoading(true);
    try {
      const currentUser = await authLib.getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function loginUser(credentials: LoginCredentials): Promise<void> {
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

  async function logoutUser(): Promise<void> {
    setLoading(true);
    try {
      await authLib.logout();
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  }

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login: loginUser,
    logout: logoutUser,
    checkAuth,
  };
}
