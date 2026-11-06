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
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { ToothIcon } from './icons/ToothIcon';

const loginWallpaper = '/login-wallpaper.jpg';

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

  const fillCredentials = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setSenha(userPass);
    setErrorMsg(null);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center lg:justify-end lg:pr-16 xl:pr-28 p-4 sm:p-6 overflow-hidden selection:bg-sky-500 selection:text-white">
      {/* Imagem de Fundo (Wallpaper Oficial OdontoGest) - Nitidez 100% Original, Sem Blur, Sem Filtros Escuros */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${loginWallpaper})` }}
        aria-hidden="true"
      />

      {/* Card de Login: Sólido, Limpo, Nítido (Sem Glassmorphism) */}
      <div className="relative z-10 w-full max-w-[390px] rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-7 shadow-2xl">
        
        {/* Selo Institucional */}
        <div className="flex items-center justify-between mb-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-[11px] font-semibold text-sky-700 dark:text-sky-300">
            <ShieldCheck className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
            <span>Ambiente SUS • Acesso Seguro</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">v2.0</span>
        </div>

        {/* Cabeçalho */}
        <div className="text-left mb-5">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-600 text-white shadow-sm">
              <ToothIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                OdontoGest
              </h1>
              <p className="text-xs text-sky-600 dark:text-sky-400 font-medium">
                Almoxarifado & Gestão Odontológica
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Acesse com suas credenciais para gerenciar estoques e pedidos.
          </p>
        </div>

        {/* Mensagem de Erro */}
        {errorMsg && (
          <div 
            role="alert"
            className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-900 p-2.5 text-xs text-red-600 dark:text-red-300"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label 
              htmlFor="loginEmail" 
              className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
            >
              <Mail className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
              E-mail institucional
            </label>
            <Input
              type="email"
              id="loginEmail"
              placeholder="exemplo@saude.gov.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="h-11 px-3.5 text-sm rounded-lg border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          <div className="space-y-1.5">
            <label 
              htmlFor="loginSenha" 
              className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
            >
              <KeyRound className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
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
                className="h-11 pl-3.5 pr-10 text-sm rounded-lg border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
              <button
                type="button"
                onClick={() => setShowSenha(!showSenha)}
                className="absolute right-1 top-1 h-9 w-9 flex items-center justify-center rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title={showSenha ? 'Ocultar senha' : 'Ver senha'}
                aria-label={showSenha ? 'Ocultar senha' : 'Ver senha'}
              >
                {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="pt-1">
            <Button
              type="submit"
              className="h-11 w-full rounded-lg bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-medium text-sm shadow-sm transition-colors gap-2 flex items-center justify-center"
              disabled={loading}
              title="Autenticar e entrar no sistema OdontoGest"
              aria-label="Entrar no Sistema"
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

        {/* Acesso Rápido de Testes (Homologação) */}
        <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-sky-500" />
              Acesso Rápido para Testes:
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => fillCredentials('admin@saude.gov.br', '123456')}
              className="px-2 py-1.5 rounded border border-slate-200 dark:border-zinc-700 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-[11px] font-medium text-slate-700 dark:text-slate-200 transition-colors text-center"
              title="Preencher credenciais do Administrador Geral"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('solicitante@saude.gov.br', '123456')}
              className="px-2 py-1.5 rounded border border-slate-200 dark:border-zinc-700 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-[11px] font-medium text-slate-700 dark:text-slate-200 transition-colors text-center"
              title="Preencher credenciais do Solicitante de USF"
            >
              Solicitante
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('gestor@saude.gov.br', '123456')}
              className="px-2 py-1.5 rounded border border-slate-200 dark:border-zinc-700 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-[11px] font-medium text-slate-700 dark:text-slate-200 transition-colors text-center"
              title="Preencher credenciais do Gestor de Almoxarifado"
            >
              Gestor
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
