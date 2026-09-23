import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { PerfilUsuario } from '../types';
import { dbService } from '../services/db';

export interface User { id: number; email: string; nome: string; funcao: string; registro: string; perfil: PerfilUsuario; unidade_id: number | null; senha_requer_troca: boolean }
interface AuthContextType {
  user: User | null; authenticated: boolean; loading: boolean; csrfToken: string | null;
  login: (email: string, senha: string) => Promise<void>; logout: () => Promise<void>;
  changePassword: (current: string, next: string) => Promise<void>;
  csrfFetch: (url: string, options?: RequestInit) => Promise<Response>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const channel = useRef<BroadcastChannel | null>(null);
  const generation = useRef(0);
  const clear = useCallback(() => { generation.current++; dbService.clearCache(); setUser(null); setCsrfToken(null); }, []);
  useEffect(() => {
    const controller = new AbortController(); const epoch = generation.current;
    fetch('/api/auth/me', { credentials: 'include', cache: 'no-store', signal: controller.signal }).then(async res => {
      if (res.ok) { const data = await res.json(); if (epoch === generation.current && !controller.signal.aborted) { dbService.clearCache(); setUser(data.user); setCsrfToken(data.csrfToken); } }
    }).catch(() => {}).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    const onUnauthorized = () => { clear(); setLoading(false); };
    window.addEventListener('odontogest:unauthorized', onUnauthorized);
    channel.current = new BroadcastChannel('odontogest-auth');
    channel.current.onmessage = onUnauthorized;
    return () => { window.removeEventListener('odontogest:unauthorized', onUnauthorized); channel.current?.close(); };
  }, [clear]);
  const csrfFetch = useCallback((url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers); if (csrfToken) headers.set('X-CSRF-Token', csrfToken);
    if (options.body) headers.set('Content-Type', 'application/json');
    return fetch(url, { ...options, headers, credentials: 'include', cache: 'no-store', signal: AbortSignal.timeout(20_000) });
  }, [csrfToken]);
  const accept = async (response: Response) => {
    const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Não foi possível autenticar.');
    dbService.clearCache(); setUser(data.user); setCsrfToken(data.csrfToken);
  };
  const login = async (email: string, senha: string) => {
    clear();
    try {
      const tokenResponse = await fetch('/api/auth/csrf', { credentials: 'include', cache: 'no-store', signal: AbortSignal.timeout(15_000) });
      if (!tokenResponse.ok) throw new Error('Não foi possível iniciar o acesso. Tente novamente.');
      const token = (await tokenResponse.json()).csrfToken;
      await accept(await fetch('/api/auth/login', { method: 'POST', credentials: 'include', cache: 'no-store', signal: AbortSignal.timeout(20_000), headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token }, body: JSON.stringify({ email, senha }) }));
      channel.current?.postMessage('session-changed');
    } finally { setLoading(false); }
  };
  const logout = async () => {
    try {
      const response = await csrfFetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok && response.status !== 401) throw new Error('Não foi possível encerrar a sessão no servidor. Tente novamente.');
      clear(); channel.current?.postMessage('logout');
    } catch (error) { window.alert(error instanceof Error ? error.message : 'Falha ao sair. Tente novamente.'); }
  };
  const changePassword = async (current: string, next: string) => {
    await accept(await csrfFetch('/api/auth/password', { method: 'POST', body: JSON.stringify({ senha_atual: current, nova_senha: next }) }));
    channel.current?.postMessage('session-changed');
  };
  return <AuthContext.Provider value={{ user, authenticated: !!user, loading, csrfToken, login, logout, changePassword, csrfFetch }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => { const context = useContext(AuthContext); if (!context) throw new Error('AuthProvider ausente.'); return context; };
