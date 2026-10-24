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
          "relative flex flex-col border-r border-[#E8E8EC] bg-white dark:border-zinc-800 dark:bg-[#121215] transition-all duration-200 select-none z-30 shrink-0",
          isCollapsed ? "w-16" : "w-64"
        )}
        aria-label="Navegação Lateral"
      >
        {/* Navigation list */}
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          {!isCollapsed && (
            <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#9C9C9C] dark:text-zinc-500">
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
                    "group relative flex w-full items-center rounded-[6px] font-medium transition-all duration-150 text-xs",
                    isCollapsed ? "h-9 justify-center px-0" : "h-9 px-3 gap-2.5",
                    isActive
                      ? "bg-[#6366F1] text-white shadow-[0_2px_8px_rgba(99,102,241,0.25)]"
                      : "text-[#6B6B6B] dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 hover:text-[#0A0A0A] dark:hover:text-zinc-100"
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive
                        ? "text-white"
                        : "text-[#6B6B6B] dark:text-zinc-400 group-hover:text-[#0A0A0A] dark:group-hover:text-zinc-100"
                    )}
                  />

                  {!isCollapsed && (
                    <span className="truncate flex-1 text-left">
                      {item.label}
                    </span>
                  )}

                  {/* Badge counter */}
                  {item.badgeCount !== undefined && item.badgeCount > 0 && (
                    <span
                      className={cn(
                        "flex items-center justify-center font-mono text-[10px] font-semibold rounded-full px-1.5 py-0.5 min-w-[18px]",
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30",
                        isCollapsed ? "absolute -top-1 -right-1" : "ml-auto"
                      )}
                    >
                      {item.badgeCount}
                    </span>
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
          <div className="p-3 border-t border-[#E8E8EC] dark:border-zinc-800">
            <button
              onClick={onToggleCollapse}
              className={cn(
                "flex w-full items-center rounded-[6px] p-2 text-xs font-medium text-[#6B6B6B] hover:bg-zinc-100 hover:text-[#0A0A0A] dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors",
                isCollapsed ? "justify-center" : "gap-2.5"
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
