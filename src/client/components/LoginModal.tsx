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
  AlertCircle
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

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-50 dark:bg-zinc-950 selection:bg-sky-500 selection:text-white">
      {/* 60% Lado da Imagem (Desktop) / Top Banner (Mobile) - Nitidez 100% Original */}
      <div className="relative w-full lg:w-[60%] h-60 sm:h-80 lg:h-screen shrink-0 overflow-hidden bg-slate-100 dark:bg-zinc-900 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-zinc-800">
        <img 
          src={loginWallpaper} 
          alt="OdontoGest - Sistema de Gestão de Almoxarifado para Odontologia" 
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* 40% Lado do Formulário de Login - Sólido, Limpo e Focado */}
      <div className="flex-1 w-full lg:w-[40%] min-h-[calc(100vh-15rem)] lg:min-h-screen flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12 xl:p-16 bg-white dark:bg-zinc-900">
        <div className="w-full max-w-[380px] my-auto">
          {/* Cabeçalho da Marca */}
          <div className="text-left mb-6">
            <div className="flex items-center gap-3 mb-2.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm">
                <ToothIcon className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                  OdontoGest
                </h1>
                <p className="text-xs text-sky-600 dark:text-sky-400 font-medium">
                  Almoxarifado & Gestão Odontológica
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Acesse com suas credenciais para gerenciar estoques e pedidos.
            </p>
          </div>

          {/* Mensagem de Erro Semântica */}
          {errorMsg && (
            <div 
              role="alert"
              className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-900 p-3 text-xs text-red-600 dark:text-red-300"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          {/* Formulário de Acesso */}
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
                  className="absolute right-1 top-1 h-9 w-9 flex items-center justify-center rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  title={showSenha ? 'Ocultar senha' : 'Ver senha'}
                  aria-label={showSenha ? 'Ocultar senha' : 'Ver senha'}
                >
                  {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
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

          {/* Rodapé Institucional Limpo */}
          <div className="mt-8 pt-4 border-t border-slate-100 dark:border-zinc-800 text-center">
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Acesso monitorado em conformidade com a LGPD e resoluções SMS.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
