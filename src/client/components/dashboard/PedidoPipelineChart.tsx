import React, { useMemo } from 'react';
import { PedidoPBS } from '../../types';
import { Clock, PackageCheck, Boxes, CheckCircle2, Ban } from 'lucide-react';

interface PedidoPipelineChartProps {
  pedidos: PedidoPBS[];
  onSelectStatusFilter?: (status: string) => void;
}

export const PedidoPipelineChart: React.FC<PedidoPipelineChartProps> = ({ pedidos }) => {
  const stats = useMemo(() => {
    const total = pedidos.length || 1;
    const solicitados = pedidos.filter(p => p.status === 'SOLICITADO').length;
    const recebidos = pedidos.filter(p => p.status === 'RECEBIDO').length;
    const parciais = pedidos.filter(p => p.status === 'ATENDIDO_PARCIAL').length;
    const concluidos = pedidos.filter(p => p.status === 'ATENDIDO_TOTAL' || p.status === 'ENVIADO').length;
    const cancelados = pedidos.filter(p => p.status === 'CANCELADO').length;

    return {
      total: pedidos.length,
      solicitados,
      recebidos,
      parciais,
      concluidos,
      cancelados,
      pctSolicitados: Math.round((solicitados / total) * 100),
      pctRecebidos: Math.round((recebidos / total) * 100),
      pctParciais: Math.round((parciais / total) * 100),
      pctConcluidos: Math.round((concluidos / total) * 100),
      pctCancelados: Math.round((cancelados / total) * 100)
    };
  }, [pedidos]);

  const stages = [
    {
      id: 'solicitado',
      label: '1. Solicitados',
      sublabel: 'Aguardando Despacho',
      count: stats.solicitados,
      pct: stats.pctSolicitados,
      icon: Clock,
      color: 'amber',
      bgClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      barClass: 'bg-amber-500'
    },
    {
      id: 'recebido',
      label: '2. Recebidos',
      sublabel: 'Em Triagem / Fila',
      count: stats.recebidos,
      pct: stats.pctRecebidos,
      icon: PackageCheck,
      color: 'blue',
      bgClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      barClass: 'bg-blue-500'
    },
    {
      id: 'parcial',
      label: '3. Parciais',
      sublabel: 'Separação Parcial',
      count: stats.parciais,
      pct: stats.pctParciais,
      icon: Boxes,
      color: 'purple',
      bgClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      barClass: 'bg-purple-500'
    },
    {
      id: 'concluido',
      label: '4. Concluídos / Enviados',
      sublabel: 'Atendimento Finalizado',
      count: stats.concluidos,
      pct: stats.pctConcluidos,
      icon: CheckCircle2,
      color: 'emerald',
      bgClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      barClass: 'bg-emerald-500'
    },
    {
      id: 'cancelado',
      label: '5. Cancelados',
      sublabel: 'Indeferidos / Anulados',
      count: stats.cancelados,
      pct: stats.pctCancelados,
      icon: Ban,
      color: 'rose',
      bgClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      barClass: 'bg-rose-500'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Consolidated Distribution Progress Track */}
      <div className="space-y-1.5">
        <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-muted/60">
          {stages.map((stage) => {
            if (stage.pct <= 0) return null;
            return (
              <div
                key={stage.id}
                style={{ width: `${stage.pct}%` }}
                className={`${stage.barClass} transition-all duration-300`}
                title={`${stage.label}: ${stage.count} (${stage.pct}%)`}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
          <span>{stats.total} pedidos totais no histórico</span>
          <span>
            {stats.solicitados + stats.recebidos > 0 
              ? `${stats.solicitados + stats.recebidos} ativos em triagem` 
              : 'Fluxo em dia'}
          </span>
        </div>
      </div>

      {/* Grid of Stages */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
        {stages.map((st) => {
          const Icon = st.icon;
          return (
            <div
              key={st.id}
              className="p-3 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className={`p-1.5 rounded-md border ${st.bgClass}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-bold font-mono text-foreground">
                  {st.count}
                </span>
              </div>

              <div>
                <div className="text-xs font-semibold text-foreground truncate">
                  {st.label}
                </div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {st.sublabel}
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                <span>Participação</span>
                <span className="font-semibold text-foreground">{st.pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
