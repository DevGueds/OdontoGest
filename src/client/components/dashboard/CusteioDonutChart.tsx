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
      badgeClass: 'text-emerald-600 dark:text-emerald-400 border-emerald-500/25 bg-emerald-500/10'
    },
    {
      id: 'rh',
      label: 'Folha & RH',
      valor: rhHonorarios,
      pct: pctRh,
      color: '#3B82F6', // blue-500
      hoverColor: '#2563EB',
      badgeClass: 'text-blue-600 dark:text-blue-400 border-blue-500/25 bg-blue-500/10'
    },
    {
      id: 'manutencao',
      label: 'Manutenção',
      valor: manutencao,
      pct: pctManut,
      color: '#F59E0B', // amber-500
      hoverColor: '#D97706',
      badgeClass: 'text-amber-600 dark:text-amber-400 border-amber-500/25 bg-amber-500/10'
    }
  ];

  // SVG circular dimensions
  const size = 160;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2; // (160 - 16) / 2 = 72
  const circumference = 2 * Math.PI * radius; // ~452.39

  // Pre-calculate cumulative offsets to avoid React render mutations
  const sectorData = sectors.map((s, i) => {
    const prevSum = sectors.slice(0, i).reduce((acc, curr) => acc + curr.pct, 0);
    return {
      ...s,
      offsetPct: prevSum
    };
  });

  const activeSector = hoveredIndex !== null ? sectors[hoveredIndex] : null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-1">
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
              className="text-muted/40"
            />
          ) : (
            sectorData.map((sector, index) => {
              if (sector.pct <= 0) return null;

              const isHovered = hoveredIndex === index;
              const arcLength = (sector.pct / 100) * circumference;
              // Clean 2px gap between arcs if multiple sectors exist
              const gap = sectors.filter(s => s.pct > 0).length > 1 ? 2 : 0;
              const strokeDasharray = `${Math.max(0, arcLength - gap)} ${circumference}`;
              const strokeDashoffset = -((sector.offsetPct / 100) * circumference) - (gap > 0 ? gap / 2 : 0);

              return (
                <circle
                  key={sector.id}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={isHovered ? sector.hoverColor : sector.color}
                  strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="butt"
                  className="transition-all duration-200 cursor-pointer origin-center"
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
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate max-w-[110px]">
                {activeSector.label}
              </span>
              <span className="text-xs font-bold font-mono text-foreground mt-0.5">
                {formatarMoeda(activeSector.valor)}
              </span>
              <span className="text-[10px] font-semibold text-muted-foreground font-mono">
                {activeSector.pct.toFixed(1)}%
              </span>
            </>
          ) : (
            <>
              <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">
                Total Custeio
              </span>
              <span className="text-xs font-bold font-mono text-foreground mt-0.5">
                {formatarMoeda(total)}
              </span>
              <span className="text-[9px] text-muted-foreground">
                100% liquidado
              </span>
            </>
          )}
        </div>
      </div>

      {/* Interactive Legend Items */}
      <div className="flex-1 w-full space-y-2.5">
        {sectors.map((s, idx) => {
          const isSelected = hoveredIndex === idx;
          return (
            <div
              key={s.id}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`p-2.5 rounded-lg border transition-all duration-150 cursor-pointer ${
                isSelected
                  ? 'border-border bg-muted/60 shadow-xs'
                  : 'border-border/40 bg-muted/15 hover:bg-muted/30'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0 transition-transform"
                    style={{
                      backgroundColor: s.color,
                      transform: isSelected ? 'scale(1.25)' : 'scale(1)'
                    }}
                  />
                  <span className="font-semibold text-foreground text-xs">{s.label}</span>
                </div>

                <div className="flex items-center gap-2 font-mono">
                  <span className="font-bold text-foreground text-xs">
                    {formatarMoeda(s.valor)}
                  </span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${s.badgeClass}`}>
                    {s.pct.toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Mini visual proportion bar */}
              <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                <div
                  style={{ width: `${s.pct}%`, backgroundColor: s.color }}
                  className="h-full rounded-full transition-all duration-300"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
