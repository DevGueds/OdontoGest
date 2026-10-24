import React, { useState } from 'react';

interface CusteioDonutChartProps {
  insumos: number;
  rhHonorarios: number;
  manutencao: number;
  totalGasto: number;
  formatarMoeda: (v: number) => string;
}

export const CusteioDonutChart: React.FC<CusteioDonutChartProps> = ({
  insumos,
  rhHonorarios,
  manutencao,
  totalGasto,
  formatarMoeda
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = totalGasto > 0 ? totalGasto : (insumos + rhHonorarios + manutencao);
  const safeTotal = total > 0 ? total : 1;

  const pctInsumos = total > 0 ? (insumos / safeTotal) * 100 : 0;
  const pctRh = total > 0 ? (rhHonorarios / safeTotal) * 100 : 0;
  const pctManut = total > 0 ? (manutencao / safeTotal) * 100 : 0;

  const sectors = [
    {
      id: 'insumos',
      label: 'Insumos (PBS)',
      valor: insumos,
      pct: pctInsumos,
      color: '#10B981', // emerald-500
      hoverColor: '#059669',
      bgClass: 'bg-emerald-500',
      badgeClass: 'text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/10'
    },
    {
      id: 'rh',
      label: 'Folha & RH',
      valor: rhHonorarios,
      pct: pctRh,
      color: '#3B82F6', // blue-500
      hoverColor: '#2563EB',
      bgClass: 'bg-blue-500',
      badgeClass: 'text-blue-600 dark:text-blue-400 border-blue-500/20 bg-blue-500/10'
    },
    {
      id: 'manutencao',
      label: 'Manutenção',
      valor: manutencao,
      pct: pctManut,
      color: '#F59E0B', // amber-500
      hoverColor: '#D97706',
      bgClass: 'bg-amber-500',
      badgeClass: 'text-amber-600 dark:text-amber-400 border-amber-500/20 bg-amber-500/10'
    }
  ];

  // SVG circle calculations
  const size = 180;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2; // (180 - 20) / 2 = 80
  const circumference = 2 * Math.PI * radius; // ~502.65

  let accumulatedPct = 0;

  const activeSector = hoveredIndex !== null ? sectors[hoveredIndex] : null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
      {/* Donut Graphic */}
      <div className="relative flex items-center justify-center shrink-0">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90 drop-shadow-xs"
        >
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/30"
          />

          {total === 0 ? (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-muted/50"
            />
          ) : (
            sectors.map((sector, index) => {
              if (sector.pct <= 0) return null;

              const strokeDasharray = `${(sector.pct / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((accumulatedPct / 100) * circumference);
              accumulatedPct += sector.pct;

              const isHovered = hoveredIndex === index;

              return (
                <circle
                  key={sector.id}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={isHovered ? sector.hoverColor : sector.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-300 cursor-pointer origin-center"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            })
          )}
        </svg>

        {/* Center metrics display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
          {activeSector ? (
            <>
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                {activeSector.label}
              </span>
              <span className="text-sm font-bold font-mono text-foreground mt-0.5">
                {formatarMoeda(activeSector.valor)}
              </span>
              <span className="text-[11px] font-semibold text-muted-foreground font-mono">
                {activeSector.pct.toFixed(1)}%
              </span>
            </>
          ) : (
            <>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Total Custeio
              </span>
              <span className="text-sm font-bold font-mono text-foreground mt-0.5">
                {formatarMoeda(total)}
              </span>
              <span className="text-[10px] text-muted-foreground">
                3 categorias
              </span>
            </>
          )}
        </div>
      </div>

      {/* Interactive Legend Cards */}
      <div className="flex-1 w-full space-y-2">
        {sectors.map((s, idx) => {
          const isSelected = hoveredIndex === idx;
          return (
            <div
              key={s.id}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`flex items-center justify-between p-2.5 rounded-lg border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'border-border bg-muted/60 shadow-xs translate-x-1'
                  : 'border-border/50 bg-muted/20 hover:bg-muted/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0 transition-transform"
                  style={{
                    backgroundColor: s.color,
                    transform: isSelected ? 'scale(1.3)' : 'scale(1)'
                  }}
                />
                <div>
                  <div className="text-xs font-medium text-foreground">{s.label}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {s.pct.toFixed(1)}% do orçamento liquidado
                  </div>
                </div>
              </div>

              <div className="text-right font-mono">
                <div className="text-xs font-semibold text-foreground">
                  {formatarMoeda(s.valor)}
                </div>
                <div className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-medium border ${s.badgeClass}`}>
                  {s.pct.toFixed(0)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
