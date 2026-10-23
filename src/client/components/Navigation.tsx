import React from 'react';
import { PerfilUsuario } from '../types';
import { Badge } from './ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './ui/tooltip';
import { cn } from '../lib/utils';
import {
  LayoutDashboard,
  ClipboardList,
  FilePlus2,
  Wrench,
  Wallet,
  Users,
  Boxes,
  UserCog,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  perfilAtual: PerfilUsuario;
  pendentesCount: number;
  onSelectTab: (tabName: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  perfilAtual,
  pendentesCount,
  onSelectTab,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const isTecnico = perfilAtual === 'TECNICO';
  const isGestor = perfilAtual === 'GESTOR';
  const isAdmin = perfilAtual === 'ADMINISTRADOR';

  const podeVerGestaoCompleta = isGestor || isAdmin;

  interface NavItem {
    id: string;
    label: string;
    icon: React.ElementType;
    badgeCount?: number;
    visible: boolean;
  }

  const items: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard & Indicadores',
      icon: LayoutDashboard,
      visible: podeVerGestaoCompleta,
    },
    {
      id: 'triagem',
      label: podeVerGestaoCompleta ? 'Central de Atendimento' : 'Meus Pedidos & Status',
      icon: ClipboardList,
      badgeCount: pendentesCount,
      visible: !isTecnico,
    },
    {
      id: 'novo-pedido',
      label: 'Novo Pedido (PBS)',
      icon: FilePlus2,
      visible: !isTecnico,
    },
    {
      id: 'equipamentos',
      label: isTecnico ? 'Atendimento Técnico' : 'Equipamentos & Manutenção',
      icon: Wrench,
      visible: true,
    },
    {
      id: 'orcamento',
      label: 'Aportes & Orçamento',
      icon: Wallet,
      visible: podeVerGestaoCompleta,
    },
    {
      id: 'honorarios',
      label: 'Honorários & Salários',
      icon: Users,
      visible: podeVerGestaoCompleta,
    },
    {
      id: 'catalogo',
      label: 'Materiais & Unidades',
      icon: Boxes,
      visible: podeVerGestaoCompleta,
    },
    {
      id: 'usuarios',
      label: 'Usuários & Acessos',
      icon: UserCog,
      visible: isAdmin,
    },
  ];

  return (
    <TooltipProvider delayDuration={150}>
      <aside
        className={cn(
          "relative flex flex-col border-r border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 transition-all duration-200 select-none z-30 shrink-0",
          isCollapsed ? "w-16" : "w-64"
        )}
        aria-label="Navegação Lateral"
      >
        {/* Navigation list */}
        <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto">
          {!isCollapsed && (
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Menu Principal
            </div>
          )}

          {items
            .filter((item) => item.visible)
            .map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              const buttonContent = (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={cn(
                    "group relative flex w-full items-center rounded-xl font-medium transition-all duration-150 text-sm",
                    isCollapsed ? "h-11 justify-center px-0" : "h-11 px-3.5 gap-3",
                    isActive
                      ? "bg-teal-50 text-teal-900 font-semibold shadow-sm ring-1 ring-teal-500/20 dark:bg-teal-950/60 dark:text-teal-200 dark:ring-teal-400/30"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100"
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {/* Left active marker indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-teal-600 dark:bg-teal-400" />
                  )}

                  <Icon
                    className={cn(
                      "h-5 w-5 shrink-0 transition-transform duration-150 group-hover:scale-105",
                      isActive
                        ? "text-teal-600 dark:text-teal-400"
                        : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300"
                    )}
                  />

                  {!isCollapsed && (
                    <span className="truncate flex-1 text-left">
                      {item.label}
                    </span>
                  )}

                  {/* Badge counter */}
                  {item.badgeCount !== undefined && item.badgeCount > 0 && (
                    <Badge
                      variant="warning"
                      className={cn(
                        "h-5 min-w-[20px] px-1.5 justify-center font-bold text-[11px] shrink-0",
                        isCollapsed ? "absolute -top-1 -right-1" : "ml-auto"
                      )}
                    >
                      {item.badgeCount}
                    </Badge>
                  )}
                </button>
              );

              if (isCollapsed) {
                return (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
                    <TooltipContent side="right" className="flex items-center gap-2">
                      <span>{item.label}</span>
                      {item.badgeCount !== undefined && item.badgeCount > 0 && (
                        <span className="rounded bg-amber-500 px-1 py-0.2 text-[10px] text-white">
                          {item.badgeCount}
                        </span>
                      )}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return buttonContent;
            })}
        </nav>

        {/* Collapse / Expand Toggle Button Footer */}
        {onToggleCollapse && (
          <div className="p-3 border-t border-slate-100 dark:border-slate-800/80">
            <button
              onClick={onToggleCollapse}
              className={cn(
                "flex w-full items-center rounded-xl p-2.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors",
                isCollapsed ? "justify-center" : "gap-3"
              )}
              title={isCollapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4" />
                  <span>Recolher Menu</span>
                </>
              )}
            </button>
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
};
