import React, { useState, useMemo } from 'react';
import { 
  PedidoPBS, 
  UnidadeSaude, 
  Material, 
  StatusPedido, 
  HonorarioOdontologo, 
  ChamadoManutencao, 
  EntradaRecurso 
} from '../../types';
import { dbService } from '../../services/db';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableFooter, 
  TableHead, 
  TableRow, 
  TableCell 
} from '../ui/table';
import { 
  TrendingUp, 
  CheckCircle2, 
  CreditCard, 
  Landmark, 
  Clock, 
  AlertTriangle, 
  PieChart, 
  BarChart3, 
  Boxes, 
  Calculator, 
  ClipboardList, 
  FileSpreadsheet, 
  PlusCircle, 
  Edit2, 
  ArrowRight, 
  FileText, 
  Check, 
  Truck, 
  Ban, 
  Search,
  PackageCheck
} from 'lucide-react';

interface Props {
  pedidos: PedidoPBS[];
  unidades: UnidadeSaude[];
  materiais: Material[];
  honorarios?: HonorarioOdontologo[];
  chamados?: ChamadoManutencao[];
  entradas?: EntradaRecurso[];
  onSwitchTab: (tabName: string) => void;
  onAbrirFicha: (pedido: PedidoPBS) => void;
  onAbrirAjusteEstoque: (material: Material) => void;
  onAbrirEditarMaterial: (material: Material) => void;
  onAbrirModalRelatorios?: () => void;
  formatarData: (d?: string | null) => string;
  formatarMoeda: (v: number) => string;
}

export const DashboardTab: React.FC<Props> = ({
  pedidos,
  unidades,
  materiais,
  honorarios = [],
  chamados = [],
  entradas = [],
  onSwitchTab,
  onAbrirFicha,
  onAbrirAjusteEstoque,
  onAbrirEditarMaterial,
  onAbrirModalRelatorios,
  formatarData,
  formatarMoeda
}) => {
  const [filtroAlerta, setFiltroAlerta] = useState<'todos' | 'esgotados' | 'baixo'>('todos');
  const [buscaAlerta, setBuscaAlerta] = useState('');

  // 1. Cálculos de Estatísticas e Saldos Segregados
  const pendentesCount = useMemo(() => 
    pedidos.filter(p => p.status === 'SOLICITADO' || p.status === 'RECEBIDO').length
  , [pedidos]);

  const saldosNatureza = useMemo(() => 
    dbService.getSaldosNaturezaRecursos(unidades, pedidos, materiais, honorarios, chamados, entradas)
  , [unidades, pedidos, materiais, honorarios, chamados, entradas]);

  const consolidacaoUnidades = useMemo(() => 
    dbService.getConsolidacaoFinanceiraLocal(unidades, pedidos, honorarios, chamados)
  , [unidades, pedidos, honorarios, chamados]);

  // 2. Filtragem de Insumos Críticos
  const materiaisCriticos = useMemo(() => {
    return materiais
      .filter(m => (m.qtd_estoque ?? 0) < 20)
      .sort((a, b) => (a.qtd_estoque ?? 0) - (b.qtd_estoque ?? 0));
  }, [materiais]);

  const esgotadosCount = useMemo(() => 
    materiaisCriticos.filter(m => (m.qtd_estoque ?? 0) <= 0).length
  , [materiaisCriticos]);

  const baixoCount = useMemo(() => 
    materiaisCriticos.filter(m => (m.qtd_estoque ?? 0) > 0).length
  , [materiaisCriticos]);

  const materiaisExibidos = useMemo(() => {
    return materiaisCriticos.filter(m => {
      const est = m.qtd_estoque ?? 0;
      if (filtroAlerta === 'esgotados' && est > 0) return false;
      if (filtroAlerta === 'baixo' && est <= 0) return false;
      if (buscaAlerta.trim()) {
        return m.descricao.toLowerCase().includes(buscaAlerta.toLowerCase());
      }
      return true;
    });
  }, [materiaisCriticos, filtroAlerta, buscaAlerta]);

  const recentes = useMemo(() => pedidos.slice(0, 5), [pedidos]);

  // Renderização semântica de badges de status
  const renderBadgeStatus = (status: StatusPedido) => {
    switch (status) {
      case 'SOLICITADO':
        return <Badge variant="warning"><Clock className="h-3 w-3" /> SOLICITADO</Badge>;
      case 'RECEBIDO':
        return <Badge variant="info"><PackageCheck className="h-3 w-3" /> RECEBIDO</Badge>;
      case 'ATENDIDO_PARCIAL':
        return <Badge variant="purple"><Boxes className="h-3 w-3" /> PARCIAL</Badge>;
      case 'ATENDIDO_TOTAL':
        return <Badge variant="success"><Check className="h-3 w-3" /> ATENDIDO</Badge>;
      case 'ENVIADO':
        return <Badge variant="default"><Truck className="h-3 w-3" /> ENVIADO</Badge>;
      case 'CANCELADO':
        return <Badge variant="destructive"><Ban className="h-3 w-3" /> CANCELADO</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalCusteio = saldosNatureza.gastoCusteioTotal || 1;
  const pctInsumos = Math.round((saldosNatureza.detalhamentoCusteio.insumos / totalCusteio) * 100);
  const pctRh = Math.round((saldosNatureza.detalhamentoCusteio.rhHonorarios / totalCusteio) * 100);
  const pctManutencao = Math.round((saldosNatureza.detalhamentoCusteio.manutencao / totalCusteio) * 100);

  const maxGastoUnidade = useMemo(() => {
    return Math.max(...consolidacaoUnidades.map(u => u.custoTotalGeral), 1);
  }, [consolidacaoUnidades]);

  return (
    <div className="space-y-6">
      
      {/* HEADER DE CONTEXTO E NÍVEL ESTRATÉGICO */}
      <Card className="border-l-4 border-l-teal-600 bg-gradient-to-r from-white via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/60">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="info">
                <TrendingUp className="h-3 w-3" />
                DASHBOARD ESTRATÉGICO
              </Badge>
              <Badge variant="success">
                <CheckCircle2 className="h-3 w-3" />
                Operação Ativa
              </Badge>
            </div>
            <CardTitle className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Consolidação Financeira & Gestão de Recursos de Saúde Bucal
            </CardTitle>
            <CardDescription className="mt-1">
              Visão consolidada dos aportes, saldos disponíveis por natureza, liquidez de insumos e despesas por unidade.
            </CardDescription>
          </div>

          {onAbrirModalRelatorios && (
            <Button 
              variant="emerald" 
              onClick={onAbrirModalRelatorios} 
              title="Gerar Relatórios em PDF e Excel"
              className="shrink-0"
            >
              <FileSpreadsheet className="h-4 w-4 mr-1" />
              Exportar Relatórios
            </Button>
          )}
        </CardHeader>
      </Card>

      {/* NÍVEL 1: MACRO KPIS DE ALTO IMPACTO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Saldo Custeio */}
        <Card className="border-t-4 border-t-teal-600 relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Saldo Custeio (Disponível)
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700 dark:bg-teal-950/80 dark:text-teal-300">
                <CreditCard className="h-5 w-5" />
              </div>
            </div>
            
            <div className={`text-2xl font-black mt-2 font-display ${saldosNatureza.saldoCusteioDisponivel >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatarMoeda(saldosNatureza.saldoCusteioDisponivel)}
            </div>

            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Comprometido: <strong className="text-slate-800 dark:text-slate-200">{saldosNatureza.percentualCusteioComprometido.toFixed(1)}%</strong></span>
                <span>Total: {formatarMoeda(saldosNatureza.orcamentoCusteioTotal)}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${
                    saldosNatureza.percentualCusteioComprometido > 85 
                      ? 'bg-rose-500' 
                      : saldosNatureza.percentualCusteioComprometido > 60 
                      ? 'bg-amber-500' 
                      : 'bg-teal-500'
                  }`}
                  style={{ width: `${Math.min(100, saldosNatureza.percentualCusteioComprometido)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Saldo Investimento */}
        <Card className="border-t-4 border-t-purple-600 relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Saldo Investimento (Disponível)
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300">
                <Landmark className="h-5 w-5" />
              </div>
            </div>

            <div className={`text-2xl font-black mt-2 font-display ${saldosNatureza.saldoInvestimentoDisponivel >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatarMoeda(saldosNatureza.saldoInvestimentoDisponivel)}
            </div>

            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Comprometido: <strong className="text-slate-800 dark:text-slate-200">{saldosNatureza.percentualInvestimentoComprometido.toFixed(1)}%</strong></span>
                <span>Total: {formatarMoeda(saldosNatureza.orcamentoInvestimentoTotal)}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-purple-500 transition-all duration-500 rounded-full"
                  style={{ width: `${Math.min(100, saldosNatureza.percentualInvestimentoComprometido)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Pedidos Pendentes */}
        <Card className="border-t-4 border-t-amber-500 relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Pedidos Pendentes
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300">
                <Clock className="h-5 w-5" />
              </div>
            </div>

            <div className="text-2xl font-black mt-2 font-display text-slate-900 dark:text-white">
              {pendentesCount}
            </div>

            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              {pendentesCount > 0 ? '⚠️ Requer atendimento pelo Almoxarifado' : '✅ Nenhuma solicitação pendente'}
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Insumos Críticos */}
        <Card className="border-t-4 border-t-rose-500 relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Insumos p/ Reabastecer
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>

            <div className={`text-2xl font-black mt-2 font-display ${materiaisCriticos.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {materiaisCriticos.length}
            </div>

            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              {esgotadosCount > 0 ? `🚨 ${esgotadosCount} com estoque esgotado` : 'Insumos com estoque baixo (<20 un)'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* NÍVEL 2: VISUALIZAÇÃO DE DADOS & COMPARAÇÕES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* GRÁFICO 1: Composição das Despesas de Custeio */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold">
                <PieChart className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                Composição das Saídas de Custeio
              </CardTitle>
              <CardDescription>
                Distribuição percentual dos gastos operacionais realizados
              </CardDescription>
            </div>
            <Badge variant="info">{formatarMoeda(saldosNatureza.gastoCusteioTotal)}</Badge>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Multi-Segmented Progress Bar */}
            <div className="flex h-3.5 w-full rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
              <div style={{ width: `${pctInsumos}%` }} className="bg-teal-600 transition-all duration-300" title={`Insumos: ${pctInsumos}%`} />
              <div style={{ width: `${pctRh}%` }} className="bg-purple-600 transition-all duration-300" title={`RH: ${pctRh}%`} />
              <div style={{ width: `${pctManutencao}%` }} className="bg-amber-500 transition-all duration-300" title={`Manutenção: ${pctManutencao}%`} />
            </div>

            {/* Visual Breakdown Legends */}
            <div className="grid grid-cols-3 gap-3 text-center pt-2">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span className="h-2 w-2 rounded-full bg-teal-600" />
                  Insumos (PBS)
                </div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">
                  {formatarMoeda(saldosNatureza.detalhamentoCusteio.insumos)}
                </div>
                <span className="text-[11px] text-slate-400">{pctInsumos}% do total</span>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span className="h-2 w-2 rounded-full bg-purple-600" />
                  Salários (RH)
                </div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">
                  {formatarMoeda(saldosNatureza.detalhamentoCusteio.rhHonorarios)}
                </div>
                <span className="text-[11px] text-slate-400">{pctRh}% do total</span>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Manutenções
                </div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">
                  {formatarMoeda(saldosNatureza.detalhamentoCusteio.manutencao)}
                </div>
                <span className="text-[11px] text-slate-400">{pctManutencao}% do total</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GRÁFICO 2: Comparativo de Gastos Por Unidade de Saúde */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold">
                <BarChart3 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                Comparativo de Gastos por Unidade
              </CardTitle>
              <CardDescription>
                Volume financeiro total consumido por cada posto/unidade
              </CardDescription>
            </div>
            <Badge variant="purple">{unidades.length} Unidades</Badge>
          </CardHeader>

          <CardContent className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
            {consolidacaoUnidades.map((u) => {
              const pct = Math.round((u.custoTotalGeral / maxGastoUnidade) * 100);
              return (
                <div key={u.unidadeId} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      {u.nome}
                      <span className="rounded bg-teal-50 px-1.5 py-0.2 text-[10px] font-semibold text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                        {u.tipo}
                      </span>
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {formatarMoeda(u.custoTotalGeral)}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-teal-500 to-purple-600 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* NÍVEL 3: DETALHAMENTO OPERACIONAL */}

      {/* Painel Alerta de Insumos Críticos */}
      <Card className="border-l-4 border-l-rose-500">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-base font-bold text-rose-700 dark:text-rose-400">
              <Boxes className="h-4 w-4" />
              Alertas de Reabastecimento de Insumos Críticos
            </CardTitle>
            <CardDescription>
              Ações rápidas para reposição de estoque e reordenamento
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-44">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                type="text"
                placeholder="Buscar insumo..."
                value={buscaAlerta}
                onChange={(e) => setBuscaAlerta(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>

            <div className="flex rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-100 dark:bg-slate-800/60">
              <button
                type="button"
                onClick={() => setFiltroAlerta('todos')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  filtroAlerta === 'todos'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Todos ({materiaisCriticos.length})
              </button>
              <button
                type="button"
                onClick={() => setFiltroAlerta('esgotados')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  filtroAlerta === 'esgotados'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Esgotados ({esgotadosCount})
              </button>
              <button
                type="button"
                onClick={() => setFiltroAlerta('baixo')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  filtroAlerta === 'baixo'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Baixo ({baixoCount})
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>Insumo / Material</TableHead>
                <TableHead>Natureza</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Estoque Atual</TableHead>
                <TableHead>Valor Est.</TableHead>
                <TableHead className="text-center">Ações de Reposição</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materiaisExibidos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-500 py-6">
                    ✅ Nenhum insumo necessita de reposição para o filtro selecionado.
                  </TableCell>
                </TableRow>
              ) : (
                materiaisExibidos.map((m) => {
                  const est = m.qtd_estoque ?? 0;
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="font-mono text-xs text-slate-500">#{m.id}</TableCell>
                      <TableCell className="font-semibold text-slate-900 dark:text-slate-100">{m.descricao}</TableCell>
                      <TableCell>
                        {m.natureza === 'INVESTIMENTO' ? (
                          <Badge variant="purple">Investimento</Badge>
                        ) : (
                          <Badge variant="info">Custeio</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {m.fornecedor || 'Não inf.'}
                      </TableCell>
                      <TableCell>
                        {est <= 0 ? (
                          <Badge variant="destructive">0 {m.unidade_medida} (Esgotado)</Badge>
                        ) : (
                          <Badge variant="warning">{est} {m.unidade_medida} (Baixo)</Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-xs">
                        {formatarMoeda(m.valor_estimado || 0)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            variant="emerald"
                            size="sm"
                            onClick={() => onAbrirAjusteEstoque(m)}
                            title="Repor Estoque"
                            className="h-7 text-xs"
                          >
                            <PlusCircle className="h-3.5 w-3.5 mr-1" /> Repor
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onAbrirEditarMaterial(m)}
                            title="Editar Insumo"
                            className="h-7 text-xs"
                          >
                            <Edit2 className="h-3 w-3 mr-1" /> Editar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Tabela de Consolidação Financeira Multiclínica por Unidade */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold">
              <Calculator className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              Consolidação Financeira por Unidade de Saúde
            </CardTitle>
            <CardDescription>
              Detalhamento por posto de saúde unindo Insumos, Salários e Manutenções
            </CardDescription>
          </div>
          <Badge variant="info">Tabela Executiva</Badge>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unidade de Saúde</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Insumos (R$)</TableHead>
                <TableHead className="text-right">Salários / Honorários (R$)</TableHead>
                <TableHead className="text-right">Manutenções (R$)</TableHead>
                <TableHead className="text-right">Total Geral (R$)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consolidacaoUnidades.map((c) => (
                <TableRow key={c.unidadeId}>
                  <TableCell className="font-semibold text-slate-900 dark:text-slate-100">{c.nome}</TableCell>
                  <TableCell><Badge variant="outline">{c.tipo}</Badge></TableCell>
                  <TableCell className="text-right font-mono text-xs">{formatarMoeda(c.custoInsumosAtendidos)}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{formatarMoeda(c.custoHonorariosDentistas)}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{formatarMoeda(c.custoManutencaoEquipamentos)}</TableCell>
                  <TableCell className="text-right font-mono text-xs font-bold text-teal-700 dark:text-teal-300">
                    {formatarMoeda(c.custoTotalGeral)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-slate-100/70 dark:bg-slate-800/70 font-bold">
                <TableCell colSpan={2}>TOTAL MUNICIPAL CONSOLIDADO:</TableCell>
                <TableCell className="text-right font-mono">
                  {formatarMoeda(consolidacaoUnidades.reduce((a, b) => a + b.custoInsumosAtendidos, 0))}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatarMoeda(consolidacaoUnidades.reduce((a, b) => a + b.custoHonorariosDentistas, 0))}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatarMoeda(consolidacaoUnidades.reduce((a, b) => a + b.custoManutencaoEquipamentos, 0))}
                </TableCell>
                <TableCell className="text-right font-mono text-base text-teal-600 dark:text-teal-400">
                  {formatarMoeda(consolidacaoUnidades.reduce((a, b) => a + b.custoTotalGeral, 0))}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      {/* Pedidos Recentes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold">
              <ClipboardList className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              Solicitações Recentes de Insumos (PBS)
            </CardTitle>
            <CardDescription>
              Clique para visualizar ou imprimir a Ficha PBS
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onSwitchTab('triagem')}
            className="text-xs"
          >
            Ver Todos <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° PBS</TableHead>
                <TableHead>Unidade Emitente</TableHead>
                <TableHead>Solicitante</TableHead>
                <TableHead>Data Pedido</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor Estimado</TableHead>
                <TableHead className="text-center">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-500 py-6">
                    Nenhuma solicitação registrada até o momento.
                  </TableCell>
                </TableRow>
              ) : (
                recentes.map((p) => {
                  const uni = unidades.find((u) => u.id === p.unidade_emitente_id);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                        {p.numero_pbs}
                      </TableCell>
                      <TableCell className="font-medium text-xs">{uni?.nome || 'Unidade N/D'}</TableCell>
                      <TableCell className="text-xs text-slate-500">{p.responsavel_nome}</TableCell>
                      <TableCell className="text-xs text-slate-500">{formatarData(p.data_pedido)}</TableCell>
                      <TableCell>{renderBadgeStatus(p.status)}</TableCell>
                      <TableCell className="text-right font-mono text-xs font-semibold">
                        {formatarMoeda(p.valor_total_estimado || 0)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => onAbrirFicha(p)}
                          className="h-7 text-xs text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800/80 hover:bg-teal-50 dark:hover:bg-teal-950/50"
                        >
                          <FileText className="h-3.5 w-3.5 mr-1" /> Ver Ficha
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
};
