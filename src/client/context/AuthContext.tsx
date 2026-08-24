import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PerfilUsuario } from '../types';

export interface User {
  id: number;
  email: string;
  nome: string;
  funcao: string;
  registro: string;
  perfil: PerfilUsuario;
  unidade_id: number;
}

interface AuthContextType {
  user: User | null;
  authenticated: boolean;
  loading: boolean;
  csrfToken: string | null;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
  csrfFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  // Helper fetch wrapping credentials & X-CSRF-Token
  const csrfFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    
    // Automatically attach X-CSRF-Token if available and request is mutative
    if (csrfToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes((options.method || 'GET').toUpperCase())) {
      headers.set('X-CSRF-Token', csrfToken);
    }

    if (options.body && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include' // Always include HttpOnly cookies
    });

    return response;
  }, [csrfToken]);

  // Check auth session on startup
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setUser(data.user);
          setAuthenticated(true);
          setCsrfToken(data.csrfToken);
        } else {
          setUser(null);
          setAuthenticated(false);
          setCsrfToken(null);
        }
      }
    } catch (err) {
      setUser(null);
      setAuthenticated(false);
      setCsrfToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login via Fastify API (sets HttpOnly cookie + CSRF token)
  const login = async (email: string, senha: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, senha })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'E-mail ou senha incorretos.');
      }

      const data = await res.json();
      setUser(data.user);
      setAuthenticated(true);
      setCsrfToken(data.csrfToken);
    } finally {
      setLoading(false);
    }
  };

  // Logout via Fastify API (clears HttpOnly cookie)
  const logout = async () => {
    try {
      await csrfFetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      setAuthenticated(false);
      setCsrfToken(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, authenticated, loading, csrfToken, login, logout, csrfFetch }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider.');
  }
  return context;
};
