import React, { useState, useMemo } from 'react';
import { UnidadeConsolidacaoFinanceira } from '../../types';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface UnidadesBarChartProps {
  unidades: UnidadeConsolidacaoFinanceira[];
  formatarMoeda: (v: number) => string;
}

export const UnidadesBarChart: React.FC<UnidadesBarChartProps> = ({
  unidades,
  formatarMoeda
}) => {
  const [showAll, setShowAll] = useState(false);
  const [hoveredUnitId, setHoveredUnitId] = useState<number | null>(null);

  const sortedUnidades = useMemo(() => {
    return [...unidades].sort((a, b) => b.custoTotalGeral - a.custoTotalGeral);
  }, [unidades]);

  const maxTotal = useMemo(() => {
    return Math.max(...sortedUnidades.map(u => u.custoTotalGeral), 1);
  }, [sortedUnidades]);

  const totalGeralMunicipal = useMemo(() => {
    return sortedUnidades.reduce((acc, curr) => acc + curr.custoTotalGeral, 0);
  }, [sortedUnidades]);

  const displayedUnidades = showAll ? sortedUnidades : sortedUnidades.slice(0, 5);

  return (
    <div className="space-y-3.5">
      <div className="space-y-3">
        {displayedUnidades.map((u) => {
          const isHovered = hoveredUnitId === u.unidadeId;
          const pctOfMax = Math.round((u.custoTotalGeral / maxTotal) * 100);
          const pctOfMunicipal = totalGeralMunicipal > 0 
            ? ((u.custoTotalGeral / totalGeralMunicipal) * 100).toFixed(1)
            : '0.0';

          const pctInsumos = u.custoTotalGeral > 0 ? (u.custoInsumosAtendidos / u.custoTotalGeral) * 100 : 0;
          const pctHonorarios = u.custoTotalGeral > 0 ? (u.custoHonorariosDentistas / u.custoTotalGeral) * 100 : 0;
          const pctManut = u.custoTotalGeral > 0 ? (u.custoManutencaoEquipamentos / u.custoTotalGeral) * 100 : 0;

          return (
            <div
              key={u.unidadeId}
              onMouseEnter={() => setHoveredUnitId(u.unidadeId)}
              onMouseLeave={() => setHoveredUnitId(null)}
              className={`p-2.5 rounded-lg border transition-all duration-200 ${
                isHovered
                  ? 'border-border bg-muted/60 shadow-xs'
                  : 'border-border/40 bg-muted/15 hover:bg-muted/30'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-semibold text-foreground truncate">{u.nome}</span>
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 shrink-0 font-mono">
                    {u.tipo}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
                  <span className="font-semibold text-foreground">
                    {formatarMoeda(u.custoTotalGeral)}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    ({pctOfMunicipal}%)
                  </span>
                </div>
              </div>

              {/* Segmented Stacked Bar for Insumos / Honorários / Manutenção */}
              <div className="h-2 w-full rounded-full bg-muted/70 overflow-hidden flex">
                {pctInsumos > 0 && (
                  <div
                    style={{ width: `${(pctInsumos * pctOfMax) / 100}%` }}
                    className="h-full bg-emerald-500 transition-all duration-300"
                    title={`Insumos: ${formatarMoeda(u.custoInsumosAtendidos)}`}
                  />
                )}
                {pctHonorarios > 0 && (
                  <div
                    style={{ width: `${(pctHonorarios * pctOfMax) / 100}%` }}
                    className="h-full bg-blue-500 transition-all duration-300"
                    title={`Folha / Honorários: ${formatarMoeda(u.custoHonorariosDentistas)}`}
                  />
                )}
                {pctManut > 0 && (
                  <div
                    style={{ width: `${(pctManut * pctOfMax) / 100}%` }}
                    className="h-full bg-amber-500 transition-all duration-300"
                    title={`Manutenção: ${formatarMoeda(u.custoManutencaoEquipamentos)}`}
                  />
                )}
              </div>

              {/* Sub-breakdown details on hover */}
              {isHovered && (
                <div className="mt-2 pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground animate-in fade-in-0 duration-150">
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Insumos: {formatarMoeda(u.custoInsumosAtendidos)}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    Folha: {formatarMoeda(u.custoHonorariosDentistas)}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    Reparos: {formatarMoeda(u.custoManutencaoEquipamentos)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {sortedUnidades.length > 5 && (
        <div className="pt-1 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="text-xs h-8 text-muted-foreground hover:text-foreground gap-1"
          >
            {showAll ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" /> Mostrar Menos
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" /> Ver Todas as {sortedUnidades.length} Unidades
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
