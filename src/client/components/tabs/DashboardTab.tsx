import React, { useMemo, useState } from 'react';
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
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, TableFooter } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { CusteioDonutChart } from '../dashboard/CusteioDonutChart';
import { UnidadesBarChart } from '../dashboard/UnidadesBarChart';
import { PedidoPipelineChart } from '../dashboard/PedidoPipelineChart';
import {
  Clock,
  PackageCheck,
  Truck,
  Check,
  Ban,
  Boxes,
  Search,
  ArrowRight,
  PlusCircle,
  Pencil,
  FileSpreadsheet,
  FileText,
  Wallet,
  Building2,
  AlertCircle,
  Activity,
  BarChart3,
  PieChart,
  GitCommit,
  ClipboardList,
  Sparkles
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
  onAbrirAjusteEstoque: (m: Material) => void;
  onAbrirEditarMaterial: (m: Material) => void;
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
  const [detalhesTab, setDetalhesTab] = useState<'insumos' | 'unidades' | 'recentes'>('insumos');

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

  const recentes = useMemo(() => pedidos.slice(0, 6), [pedidos]);

  // Renderização semântica de badges de status
  const renderBadgeStatus = (status: StatusPedido) => {
    switch (status) {
      case 'SOLICITADO':
        return <Badge variant="warning"><Clock className="h-3 w-3" /> Solicitado</Badge>;
      case 'RECEBIDO':
        return <Badge variant="info"><PackageCheck className="h-3 w-3" /> Recebido</Badge>;
      case 'ATENDIDO_PARCIAL':
        return <Badge variant="purple"><Boxes className="h-3 w-3" /> Parcial</Badge>;
      case 'ATENDIDO_TOTAL':
        return <Badge variant="success"><Check className="h-3 w-3" /> Atendido</Badge>;
      case 'ENVIADO':
        return <Badge variant="default"><Truck className="h-3 w-3" /> Enviado</Badge>;
      case 'CANCELADO':
        return <Badge variant="destructive"><Ban className="h-3 w-3" /> Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" /> Painel de Controle Executivo
            </span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span className="text-[11px] text-muted-foreground font-mono">
              {unidades.length} Clínicas Conectadas
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Visão Geral de Recursos & Operações
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitoramento em tempo real de saldos orçamentários, abastecimento e fluxo de pedidos.
          </p>
        </div>
      </div>

      {/* Top Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* KPI 1: Saldo Custeio */}
        <Card className="hover:border-border transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wider">
                Saldo Custeio Disponível
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Wallet className="h-4 w-4" />
              </div>
            </div>

            <div className="text-2xl font-bold tracking-tight text-foreground font-mono mt-2">
              {formatarMoeda(saldosNatureza.saldoCusteioDisponivel)}
            </div>

            <div className="mt-3 space-y-1.5">
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-500 rounded-full"
                  style={{ width: `${Math.min(100, saldosNatureza.percentualCusteioComprometido)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>{saldosNatureza.percentualCusteioComprometido.toFixed(1)}% comprometido</span>
                <span>Teto: {formatarMoeda(saldosNatureza.orcamentoCusteioTotal)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Saldo Investimento */}
        <Card className="hover:border-border transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wider">
                Saldo Investimento
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Building2 className="h-4 w-4" />
              </div>
            </div>

            <div className="text-2xl font-bold tracking-tight text-foreground font-mono mt-2">
              {formatarMoeda(saldosNatureza.saldoInvestimentoDisponivel)}
            </div>

            <div className="mt-3 space-y-1.5">
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-500 rounded-full"
                  style={{ width: `${Math.min(100, saldosNatureza.percentualInvestimentoComprometido)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>{saldosNatureza.percentualInvestimentoComprometido.toFixed(1)}% comprometido</span>
                <span>Teto: {formatarMoeda(saldosNatureza.orcamentoInvestimentoTotal)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Pedidos Pendentes em Triagem */}
        <Card
          onClick={() => onSwitchTab('triagem')}
          className="hover:border-border cursor-pointer transition-all hover:bg-muted/10"
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wider">
                Pedidos em Triagem
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Clock className="h-4 w-4" />
              </div>
            </div>

            <div className="text-2xl font-bold tracking-tight text-foreground font-mono mt-2 flex items-baseline justify-between">
              <span>{pendentesCount}</span>
              <span className="text-[11px] font-normal text-amber-600 dark:text-amber-400 flex items-center gap-1">
                Ver triagem <ArrowRight className="h-3 w-3" />
              </span>
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              {pendentesCount > 0 ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />
                  <span>Aguardando despacho pelo Almoxarifado</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  <span>Nenhum pedido represado</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Insumos em Alerta */}
        <Card
          onClick={() => setDetalhesTab('insumos')}
          className="hover:border-border cursor-pointer transition-all hover:bg-muted/10"
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wider">
                Insumos em Alerta
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-4 w-4" />
              </div>
            </div>

            <div className="text-2xl font-bold tracking-tight text-foreground font-mono mt-2 flex items-baseline justify-between">
              <span>{materiaisCriticos.length}</span>
              <span className="text-[11px] font-normal text-rose-600 dark:text-rose-400">
                {esgotadosCount} zerados
              </span>
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              {esgotadosCount > 0 ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                  <span className="text-rose-600 dark:text-rose-400 font-medium">Reposição imediata recomendada</span>
                </>
              ) : (
                <span>Itens com volume baixo (&lt; 20 un)</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Visual Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Gráfico 1: Donut Chart de Composição de Custeio */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="pb-2 border-b border-border/40">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <PieChart className="h-4 w-4 text-emerald-500" />
                Composição das Saídas de Custeio
              </CardTitle>
              <Badge variant="outline" className="font-mono text-[10px]">
                {formatarMoeda(saldosNatureza.gastoCusteioTotal)}
              </Badge>
            </div>
            <CardDescription>
              Distribuição percentual dos recursos operacionais liquidados
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4 flex-1 flex flex-col justify-center">
            <CusteioDonutChart
              insumos={saldosNatureza.detalhamentoCusteio.insumos}
              rhHonorarios={saldosNatureza.detalhamentoCusteio.rhHonorarios}
              manutencao={saldosNatureza.detalhamentoCusteio.manutencao}
              totalGasto={saldosNatureza.gastoCusteioTotal}
              formatarMoeda={formatarMoeda}
            />
          </CardContent>
        </Card>

        {/* Gráfico 2: Ranking de Consumo por Unidade de Saúde */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="pb-2 border-b border-border/40">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-500" />
                Consumo Financeiro por Unidade de Saúde
              </CardTitle>
              <span className="text-xs text-muted-foreground font-mono">
                {consolidacaoUnidades.length} Estabelecimentos
              </span>
            </div>
            <CardDescription>
              Comparativo consolidado de gastos (Insumos, Folha e Manutenções)
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4 flex-1 flex flex-col justify-center">
            <UnidadesBarChart
              unidades={consolidacaoUnidades}
              formatarMoeda={formatarMoeda}
            />
          </CardContent>
        </Card>
      </div>

      {/* Gráfico 3: Pipeline Operacional de Pedidos */}
      <Card>
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <GitCommit className="h-4 w-4 text-primary" />
                Fluxo Operacional de Pedidos (PBS)
              </CardTitle>
              <CardDescription>
                Distribuição dos pedidos ao longo de todo o ciclo de atendimento no almoxarifado
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSwitchTab('triagem')}
              className="text-xs h-7 gap-1 text-muted-foreground hover:text-foreground self-start sm:self-auto"
            >
              Abrir Triagem <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <PedidoPipelineChart pedidos={pedidos} />
        </CardContent>
      </Card>

      {/* Ergonomic Detailed Data Section with Radix Tabs */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
              <Boxes className="h-4 w-4 text-primary" />
              Detalhamento Operacional & Analítico
            </h2>
            <p className="text-xs text-muted-foreground">
              Selecione a visualização desejada para consultar estoques, orçamentos ou histórico.
            </p>
          </div>

          {/* Segmented View Switcher */}
          <Tabs value={detalhesTab} onValueChange={(v) => setDetalhesTab(v as any)}>
            <TabsList className="h-9">
              <TabsTrigger value="insumos" className="gap-1.5 text-xs">
                <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                Insumos Críticos
                {materiaisCriticos.length > 0 && (
                  <span className="ml-1 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 px-1.5 py-0.2 text-[10px] font-mono">
                    {materiaisCriticos.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="unidades" className="gap-1.5 text-xs">
                <Building2 className="h-3.5 w-3.5 text-blue-500" />
                Consolidação por Unidade
              </TabsTrigger>
              <TabsTrigger value="recentes" className="gap-1.5 text-xs">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                Atividade Recente
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Tab 1: Insumos Críticos */}
        {detalhesTab === 'insumos' && (
          <Card className="animate-in fade-in-50 duration-150">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-4">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Boxes className="h-4 w-4 text-amber-500" />
                  Insumos em Alerta de Estoque
                </CardTitle>
                <CardDescription>
                  Insumos com volume abaixo da margem de segurança (menos de 20 unidades)
                </CardDescription>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative w-48 sm:w-56">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Buscar insumo..."
                    value={buscaAlerta}
                    onChange={(e) => setBuscaAlerta(e.target.value)}
                    className="h-8 pl-8 text-xs"
                  />
                </div>

                <div className="flex rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setFiltroAlerta('todos')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${filtroAlerta === 'todos'
                      ? 'bg-background text-foreground shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    Todos ({materiaisCriticos.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroAlerta('esgotados')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${filtroAlerta === 'esgotados'
                      ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 font-semibold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    Zerados ({esgotadosCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroAlerta('baixo')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${filtroAlerta === 'baixo'
                      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    Baixos ({baixoCount})
                  </button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead>Insumo / Material</TableHead>
                    <TableHead>Natureza</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Estoque Atual</TableHead>
                    <TableHead className="text-right">Valor Est.</TableHead>
                    <TableHead className="text-center w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materiaisExibidos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-10 text-xs">
                        <div className="flex flex-col items-center gap-1.5">
                          <Check className="h-6 w-6 text-emerald-500 mb-1" />
                          <span className="font-semibold text-foreground">Estoque Regularizado</span>
                          <span>Nenhum insumo necessita de reposição para o filtro selecionado.</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    materiaisExibidos.map((m) => {
                      const est = m.qtd_estoque ?? 0;
                      return (
                        <TableRow key={m.id}>
                          <TableCell className="font-mono text-xs text-muted-foreground">#{m.id}</TableCell>
                          <TableCell className="font-medium text-foreground">{m.descricao}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{m.natureza}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {m.fornecedor || 'Padrão'}
                          </TableCell>
                          <TableCell>
                            {est <= 0 ? (
                              <Badge variant="destructive">0 {m.unidade_medida} (Esgotado)</Badge>
                            ) : (
                              <Badge variant="warning">{est} {m.unidade_medida} (Baixo)</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {formatarMoeda(m.valor_estimado || 0)}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onAbrirAjusteEstoque(m)}
                                title="Repor Estoque"
                                aria-label="Repor Estoque"
                                className="h-8 w-8 p-0 text-amber-600 bg-amber-50/80 hover:bg-amber-100 hover:text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 dark:hover:bg-amber-900/50 transition-colors"
                              >
                                <PlusCircle className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onAbrirEditarMaterial(m)}
                                title="Editar Insumo"
                                aria-label="Editar Insumo"
                                className="h-8 w-8 p-0 text-blue-600 bg-blue-50/80 hover:bg-blue-100 hover:text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
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
        )}

        {/* Tab 2: Consolidação Multiclínica */}
        {detalhesTab === 'unidades' && (
          <Card className="animate-in fade-in-50 duration-150">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 pb-4">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-500" />
                  Consolidação Orçamentária por Unidade de Saúde
                </CardTitle>
                <CardDescription>
                  Detalhamento de insumos atendidos, remuneração de profissionais e manutenções
                </CardDescription>
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                {consolidacaoUnidades.length} unidades registradas
              </span>
            </CardHeader>

            <CardContent className="p-0">
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
                      <TableCell className="font-medium text-foreground">{c.nome}</TableCell>
                      <TableCell><Badge variant="outline">{c.tipo}</Badge></TableCell>
                      <TableCell className="text-right font-mono text-xs">{formatarMoeda(c.custoInsumosAtendidos)}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{formatarMoeda(c.custoHonorariosDentistas)}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{formatarMoeda(c.custoManutencaoEquipamentos)}</TableCell>
                      <TableCell className="text-right font-mono text-xs font-semibold text-foreground">
                        {formatarMoeda(c.custoTotalGeral)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="bg-muted/40 font-semibold">
                    <TableCell colSpan={2}>TOTAL MUNICIPAL CONSOLIDADO</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatarMoeda(consolidacaoUnidades.reduce((a, b) => a + b.custoInsumosAtendidos, 0))}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatarMoeda(consolidacaoUnidades.reduce((a, b) => a + b.custoHonorariosDentistas, 0))}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatarMoeda(consolidacaoUnidades.reduce((a, b) => a + b.custoManutencaoEquipamentos, 0))}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-foreground">
                      {formatarMoeda(consolidacaoUnidades.reduce((a, b) => a + b.custoTotalGeral, 0))}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Tab 3: Atividade Recente */}
        {detalhesTab === 'recentes' && (
          <Card className="animate-in fade-in-50 duration-150">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 pb-4">
              <div>
                <CardTitle className="text-sm font-semibold">
                  Solicitações Recentes de Insumos (PBS)
                </CardTitle>
                <CardDescription>
                  Últimos pedidos emitidos pelas Unidades de Saúde da Família
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSwitchTab('triagem')}
                className="text-xs gap-1"
              >
                Ver Todos <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">N° PBS</TableHead>
                    <TableHead>Unidade Emitente</TableHead>
                    <TableHead>Solicitante</TableHead>
                    <TableHead>Data Pedido</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor Estimado</TableHead>
                    <TableHead className="text-center w-28">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-10 text-xs">
                        Nenhuma solicitação registrada até o momento.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentes.map((p) => {
                      const uni = unidades.find((u) => u.id === p.unidade_emitente_id);
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono text-xs font-semibold text-foreground">
                            {p.numero_pbs}
                          </TableCell>
                          <TableCell className="font-medium text-xs">{uni?.nome || 'Unidade N/D'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{p.responsavel_nome}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{formatarData(p.data_pedido)}</TableCell>
                          <TableCell>{renderBadgeStatus(p.status)}</TableCell>
                          <TableCell className="text-right font-mono text-xs font-semibold">
                            {formatarMoeda(p.valor_total_estimado || 0)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onAbrirFicha(p)}
                              className="h-7 text-xs gap-1"
                            >
                              <FileText className="h-3 w-3" /> Ficha
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
        )}
      </div>

    </div>
  );
};
