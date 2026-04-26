import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from '../config/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('iteachu_token'));
  const [loading, setLoading] = useState(true);

  // Validate existing token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('iteachu_token');
    if (!storedToken) {
      setLoading(false);
      return;
    }

    const validateToken = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setToken(storedToken);
        } else {
          // Token invalid — clear it
          localStorage.removeItem('iteachu_token');
          setToken(null);
          setUser(null);
        }
      } catch (error) {
        console.error('Token validation failed:', error);
        localStorage.removeItem('iteachu_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, []);

  const login = useCallback(async (googleCredential, role, action) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: googleCredential, role, action }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(err.error || 'Login failed');
    }

    const data = await response.json();
    if (data.existing) {
      localStorage.setItem('iteachu_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { user: data.user, token: data.token, existing: true };
    }
    localStorage.setItem('iteachu_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return { user: data.user, token: data.token, existing: false };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('iteachu_token');
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    token,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
