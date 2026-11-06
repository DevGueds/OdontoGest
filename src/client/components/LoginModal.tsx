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
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-x-hidden selection:bg-sky-500 selection:text-white">
      {/* Imagem de Fundo (Wallpaper Oficial OdontoGest) com Overlay de Luminosidade */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 ease-out"
        style={{ backgroundImage: `url(${loginWallpaper})` }}
        aria-hidden="true"
      />
      
      {/* Overlay suave para garantir contraste WCAG AAA da área de trabalho */}
      <div 
        className="fixed inset-0 bg-gradient-to-tr from-slate-950/60 via-slate-900/30 to-sky-950/40 backdrop-blur-[2px]" 
        aria-hidden="true" 
      />

      {/* Slogan flutuante sutil no rodapé direito conforme identidade da marca */}
      <div className="hidden lg:block fixed bottom-6 right-8 z-10 pointer-events-none select-none text-right">
        <span className="font-serif italic text-white/90 text-lg drop-shadow-md tracking-wide">
          Organização que cuida do seu trabalho.
        </span>
      </div>

      {/* Card Central Glassmorphism Clínico (Laws of UX: Aesthetic-Usability, Common Region, Prägnanz) */}
      <div className="relative z-20 w-full max-w-[430px] rounded-2xl border border-white/60 dark:border-white/10 bg-white/92 dark:bg-slate-900/92 backdrop-blur-xl p-6 sm:p-8 shadow-[0_24px_60px_-15px_rgba(8,112,184,0.30)] dark:shadow-[0_24px_60px_-15px_rgba(0,0,0,0.60)] animate-in fade-in zoom-in-95 duration-300">
        
        {/* Badge de Confiança e Segurança Institucional */}
        <div className="flex items-center justify-between mb-5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200/80 dark:border-sky-800/80 text-[11px] font-semibold text-sky-700 dark:text-sky-300">
            <ShieldCheck className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
            <span>Ambiente SUS • Acesso Seguro</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">v2.0</span>
        </div>

        {/* Cabeçalho da Marca OdontoGest */}
        <div className="text-left mb-6">
          <div className="flex items-center gap-3 mb-2.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 via-sky-600 to-blue-700 text-white shadow-md shadow-sky-500/25">
              <ToothIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                OdontoGest
              </h1>
              <p className="text-xs text-sky-700 dark:text-sky-300 font-medium">
                Almoxarifado & Gestão Odontológica
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Informe suas credenciais institucionais para acessar pedidos, insumos e relatórios.
          </p>
        </div>

        {/* Caixa de Erro Semântica (Law of Proximity & Prägnanz) */}
        {errorMsg && (
          <div 
            role="alert"
            className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-500/25 bg-red-50 dark:bg-red-950/30 p-3 text-xs text-red-600 dark:text-red-400 animate-in fade-in slide-in-from-top-1 duration-200"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
            <span className="font-medium leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* Formulário de Acesso */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Campo E-mail (Fitts's Law & Similarity: altura ergonômica de 44px) */}
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
              className="h-11 px-3.5 text-sm rounded-xl border-slate-200/90 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all shadow-sm"
            />
          </div>

          {/* Campo Senha (Fitts's Law & Jakob's Law) */}
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
                className="h-11 pl-3.5 pr-11 text-sm rounded-xl border-slate-200/90 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowSenha(!showSenha)}
                className="absolute right-1 top-1 h-9 w-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors"
                title={showSenha ? 'Ocultar senha' : 'Ver senha'}
                aria-label={showSenha ? 'Ocultar senha' : 'Ver senha'}
              >
                {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Botão de Ação Primária (Von Restorff Effect & Doherty Threshold) */}
          <div className="pt-2">
            <Button
              type="submit"
              className="h-11 w-full rounded-xl bg-gradient-to-r from-sky-600 via-blue-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 active:scale-[0.99] text-white font-medium text-sm shadow-md shadow-sky-500/25 hover:shadow-lg hover:shadow-sky-500/30 transition-all gap-2 flex items-center justify-center"
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

        {/* Acelerador de Teste para Ambientes de Homologação (Hick's Law & Parkinson's Law) */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-sky-500" />
              Acesso Rápido para Testes:
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => fillCredentials('admin@saude.gov.br', '123456')}
              className="px-2 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-700 bg-slate-50/80 hover:bg-sky-50 hover:border-sky-300 dark:bg-slate-800/50 dark:hover:bg-sky-950/50 text-[11px] font-medium text-slate-700 dark:text-slate-200 transition-all text-center hover:shadow-sm"
              title="Preencher credenciais do Administrador Geral (admin@saude.gov.br)"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('solicitante@saude.gov.br', '123456')}
              className="px-2 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-700 bg-slate-50/80 hover:bg-sky-50 hover:border-sky-300 dark:bg-slate-800/50 dark:hover:bg-sky-950/50 text-[11px] font-medium text-slate-700 dark:text-slate-200 transition-all text-center hover:shadow-sm"
              title="Preencher credenciais do Solicitante de USF (solicitante@saude.gov.br)"
            >
              Solicitante
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('gestor@saude.gov.br', '123456')}
              className="px-2 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-700 bg-slate-50/80 hover:bg-sky-50 hover:border-sky-300 dark:bg-slate-800/50 dark:hover:bg-sky-950/50 text-[11px] font-medium text-slate-700 dark:text-slate-200 transition-all text-center hover:shadow-sm"
              title="Preencher credenciais do Gestor de Almoxarifado (gestor@saude.gov.br)"
            >
              Gestor
            </button>
          </div>
        </div>

        {/* Rodapé de Informação de Segurança */}
        <div className="mt-5 text-center">
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Acesso monitorado em conformidade com a LGPD e resoluções SMS.
          </p>
        </div>

      </div>
    </div>
  );
};
