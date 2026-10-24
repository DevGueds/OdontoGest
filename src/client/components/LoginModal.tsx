import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  Mail, 
  KeyRound, 
  Eye, 
  EyeOff, 
  LogIn, 
  Loader2, 
  AlertCircle,
  Activity
} from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [senha, setSenha] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSenha, setShowSenha] = useState<boolean>(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !senha) {
      setErrorMsg('Por favor, informe seu e-mail e senha.');
      return;
    }

    try {
      await login(email, senha);
    } catch (err: any) {
      setErrorMsg(err.message || 'E-mail ou senha incorretos.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <div className="w-full max-w-sm rounded-[12px] border border-[#E8E8EC] bg-white p-7 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:border-zinc-800 dark:bg-[#121215]">
        {/* Header */}
        <div className="text-left mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-[6px] bg-[#6366F1]/10 text-[#6366F1] mb-3">
            <Activity className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-bold tracking-tight text-[#0A0A0A] dark:text-zinc-100">
            OdontoGest
          </h2>
          <p className="mt-0.5 text-xs text-[#6B6B6B] dark:text-zinc-400">
            Acesse sua conta para gerenciar estoques e pedidos.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-[6px] border border-red-500/20 bg-red-500/10 p-2.5 text-xs text-[#EF4444] dark:border-red-500/30 dark:bg-red-500/15">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="loginEmail" className="text-xs font-medium text-[#0A0A0A] dark:text-zinc-300 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-[#6B6B6B]" />
              E-mail institucional
            </label>
            <Input
              type="email"
              id="loginEmail"
              placeholder="seu.email@saude.gov.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="loginSenha" className="text-xs font-medium text-[#0A0A0A] dark:text-zinc-300 flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5 text-[#6B6B6B]" />
              Senha de Acesso
            </label>
            <div className="relative">
              <Input
                type={showSenha ? 'text' : 'password'}
                id="loginSenha"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowSenha(!showSenha)}
                className="absolute right-2.5 top-2.5 text-[#9C9C9C] hover:text-[#0A0A0A] dark:hover:text-zinc-100 transition-colors"
                title={showSenha ? 'Ocultar senha' : 'Ver senha'}
              >
                {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Entrar no Sistema</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
