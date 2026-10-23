import React from 'react';
import { PerfilUsuario } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Activity, 
  Crown, 
  Eye, 
  Stethoscope, 
  Wrench, 
  FileSpreadsheet, 
  Database, 
  LogOut, 
  Sun, 
  Moon 
} from 'lucide-react';

interface HeaderProps {
  perfilAtual: PerfilUsuario;
  onExportarSQL: () => void;
  onAbrirModalRelatorios?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ perfilAtual, onExportarSQL, onAbrirModalRelatorios }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-md transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900/85">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 text-white shadow-md shadow-teal-500/20">
            <Activity className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                ODONTO<span className="text-teal-600 dark:text-teal-400">GEST</span>
              </span>
              <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700 dark:bg-teal-950/80 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60">
                v2.0
              </span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline-block">
              Gestão Odontológica, Insumos & Manutenção
            </span>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* User Profile Pill */}
          <div className="flex items-center gap-2.5 rounded-full border border-slate-200/80 bg-slate-50/80 py-1 pl-1.5 pr-3 dark:border-slate-800 dark:bg-slate-800/60 shadow-sm">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white shadow-sm">
              {user?.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
            </div>

            <div className="flex flex-col text-left leading-none">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 max-w-[120px] sm:max-w-[160px] truncate">
                {user?.nome || 'Usuário'}
              </span>
              <div className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                {perfilAtual === 'ADMINISTRADOR' && (
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                    <Crown className="h-3 w-3" /> Admin
                  </span>
                )}
                {perfilAtual === 'GESTOR' && (
                  <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400 font-medium">
                    <Eye className="h-3 w-3" /> Gestor
                  </span>
                )}
                {perfilAtual === 'SOLICITANTE' && (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <Stethoscope className="h-3 w-3" /> {user?.funcao || 'USF'}
                  </span>
                )}
                {perfilAtual === 'TECNICO' && (
                  <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium">
                    <Wrench className="h-3 w-3" /> Técnico
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Theme Toggle (Dark / Light) */}
          <Button
            variant="ghost"
            size="iconSm"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
            className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400 transition-transform duration-200 rotate-0 hover:rotate-45" />
            ) : (
              <Moon className="h-4 w-4 text-slate-600 transition-transform duration-200 hover:-rotate-12" />
            )}
          </Button>

          {/* Reports button */}
          {onAbrirModalRelatorios && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAbrirModalRelatorios}
              title="Gerar e Exportar Relatórios PDF e Excel"
              className="hidden sm:inline-flex text-xs font-semibold border-teal-200 text-teal-700 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-300 dark:hover:bg-teal-950/60"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1 text-teal-600 dark:text-teal-400" />
              Relatórios
            </Button>
          )}

          {/* SQL dump button (Admin only) */}
          {perfilAtual === 'ADMINISTRADOR' && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExportarSQL}
              title="Exportar DUMP MySQL do Almoxarifado"
              className="hidden md:inline-flex text-xs"
            >
              <Database className="h-3.5 w-3.5 mr-1 text-slate-500" />
              SQL Dump
            </Button>
          )}

          {/* Logout button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            title="Encerrar Sessão"
            className="text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 px-2 sm:px-3 text-xs"
          >
            <LogOut className="h-3.5 w-3.5 sm:mr-1" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
