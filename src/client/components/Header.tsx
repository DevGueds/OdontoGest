import React from 'react';
import { PerfilUsuario } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from './ui/button';
import { 
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
import { ToothIcon } from './icons/ToothIcon';

interface HeaderProps {
  perfilAtual: PerfilUsuario;
  onExportarSQL: () => void;
  onAbrirModalRelatorios?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ perfilAtual, onExportarSQL, onAbrirModalRelatorios }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/95 backdrop-blur-md transition-colors select-none">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563EB] text-white shadow-xs">
            <ToothIcon className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight text-foreground">
              Odonto<span className="text-muted-foreground font-normal">Gest</span>
            </span>
            <span className="rounded border border-border/80 bg-muted/40 px-1.5 py-0.2 font-mono text-[10px] text-muted-foreground">
              v2.0
            </span>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* User Profile Pill */}
          <div className="flex items-center gap-2 rounded-full border border-border/70 bg-muted/20 py-1 pl-1.5 pr-3 shadow-xs">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 text-[11px] font-semibold text-foreground">
              {user?.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
            </div>

            <div className="flex flex-col text-left leading-none">
              <span className="text-xs font-medium text-foreground max-w-[120px] sm:max-w-[160px] truncate">
                {user?.nome || 'Usuário'}
              </span>
              <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                {perfilAtual === 'ADMINISTRADOR' && (
                  <span className="flex items-center gap-1">
                    <Crown className="h-2.5 w-2.5" /> Admin
                  </span>
                )}
                {perfilAtual === 'GESTOR' && (
                  <span className="flex items-center gap-1">
                    <Eye className="h-2.5 w-2.5" /> Gestor
                  </span>
                )}
                {perfilAtual === 'SOLICITANTE' && (
                  <span className="flex items-center gap-1">
                    <Stethoscope className="h-2.5 w-2.5" /> {user?.funcao || 'USF'}
                  </span>
                )}
                {perfilAtual === 'TECNICO' && (
                  <span className="flex items-center gap-1">
                    <Wrench className="h-2.5 w-2.5" /> Técnico
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
            className="text-muted-foreground hover:text-foreground h-8 w-8"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-zinc-200" />
            ) : (
              <Moon className="h-4 w-4 text-zinc-700" />
            )}
          </Button>

          {/* Reports button (Gestor and Admin only - hidden for Solicitante) */}
          {(perfilAtual === 'GESTOR' || perfilAtual === 'ADMINISTRADOR') && onAbrirModalRelatorios && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAbrirModalRelatorios}
              title="Gerar e Exportar Relatórios PDF e Excel"
              className="hidden sm:inline-flex text-xs h-8 gap-1.5"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Relatórios</span>
            </Button>
          )}

          {/* SQL dump button (Admin only) */}
          {perfilAtual === 'ADMINISTRADOR' && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExportarSQL}
              title="Exportar DUMP MySQL do Almoxarifado"
              className="hidden md:inline-flex text-xs h-8 gap-1.5"
            >
              <Database className="h-3.5 w-3.5 text-muted-foreground" />
              <span>SQL Dump</span>
            </Button>
          )}

          {/* Logout button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            title="Encerrar Sessão"
            className="text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 h-8 px-2 text-xs"
          >
            <LogOut className="h-3.5 w-3.5 sm:mr-1" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
