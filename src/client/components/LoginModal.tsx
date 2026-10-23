import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  Lock, 
  Mail, 
  KeyRound, 
  Eye, 
  EyeOff, 
  LogIn, 
  Loader2, 
  AlertTriangle,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in-0 duration-200">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-tr from-teal-600 via-teal-700 to-cyan-600 p-6 text-white text-center relative">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-md mb-3 border border-white/20">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-xl font-bold font-display tracking-tight">
            Acesso ao OdontoGest
          </h2>
          <p className="mt-1 text-xs text-teal-100 font-medium">
            Sistema de Gestão Odontológica & Almoxarifado
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-8 space-y-5">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center leading-relaxed">
            Informe suas credenciais para acessar o painel. O perfil <strong>Administrador</strong> possui permissão para gerenciar cadastros e estoques.
          </p>

          {errorMsg && (
            <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/50 dark:text-rose-300">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="loginEmail" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                E-mail institucional *
              </label>
              <Input
                type="email"
                id="loginEmail"
                placeholder="seu.email@saude.gov.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="loginSenha" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                Senha de Acesso *
              </label>
              <div className="relative">
                <Input
                  type={showSenha ? 'text' : 'password'}
                  id="loginSenha"
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  className="h-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(!showSenha)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  title={showSenha ? 'Ocultar senha' : 'Ver senha'}
                >
                  {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                size="lg"
                className="w-full text-sm font-semibold"
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
    </div>
  );
};
