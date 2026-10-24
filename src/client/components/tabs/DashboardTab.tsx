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
  Edit2, 
  FileSpreadsheet, 
  FileText, 
  Wallet, 
  Building2, 
  AlertCircle,
  Activity,
  Layers,
  BarChart2
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

  const totalCusteio = saldosNatureza.gastoCusteioTotal || 1;
  const pctInsumos = Math.round((saldosNatureza.detalhamentoCusteio.insumos / totalCusteio) * 100);
  const pctRh = Math.round((saldosNatureza.detalhamentoCusteio.rhHonorarios / totalCusteio) * 100);
  const pctManutencao = Math.round((saldosNatureza.detalhamentoCusteio.manutencao / totalCusteio) * 100);

  const maxGastoUnidade = useMemo(() => {
    return Math.max(...consolidacaoUnidades.map(u => u.custoTotalGeral), 1);
  }, [consolidacaoUnidades]);

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Painel Estratégico
            </span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span className="text-xs text-muted-foreground font-mono">
              Consolidação Multiclínica
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Visão Geral de Recursos & Operações
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitoramento de saldos por natureza, reposição de insumos e despesas de pessoal.
          </p>
        </div>

        {onAbrirModalRelatorios && (
          <Button 
            variant="outline" 
            onClick={onAbrirModalRelatorios} 
            className="gap-2 h-9 text-xs font-medium self-start sm:self-auto"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-muted-foreground" />
            Exportar Relatórios
          </Button>
        )}
      </div>

      {/* Modern Clean KPI Cards (Linear / Vercel style - no tacky rainbow borders) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Saldo Custeio */}
        <Card className="hover:border-border transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wider">
                Saldo Custeio Disponível
              </span>
              <Wallet className="h-4 w-4 text-muted-foreground/70" />
            </div>
            
            <div className="text-2xl font-bold tracking-tight text-foreground font-mono mt-2">
              {formatarMoeda(saldosNatureza.saldoCusteioDisponivel)}
            </div>

            <div className="mt-3 space-y-1.5">
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full bg-foreground/80 dark:bg-foreground/70 transition-all duration-500 rounded-full"
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
        <Card className="hover:border-border transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wider">
                Saldo Investimento
              </span>
              <Building2 className="h-4 w-4 text-muted-foreground/70" />
            </div>

            <div className="text-2xl font-bold tracking-tight text-foreground font-mono mt-2">
              {formatarMoeda(saldosNatureza.saldoInvestimentoDisponivel)}
            </div>

            <div className="mt-3 space-y-1.5">
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full bg-foreground/80 dark:bg-foreground/70 transition-all duration-500 rounded-full"
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

        {/* KPI 3: Pedidos Pendentes */}
        <Card className="hover:border-border transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wider">
                Pedidos em Triagem
              </span>
              <Clock className="h-4 w-4 text-muted-foreground/70" />
            </div>

            <div className="text-2xl font-bold tracking-tight text-foreground font-mono mt-2">
              {pendentesCount}
            </div>

            <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5">
              {pendentesCount > 0 ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                  <span>Aguardando despacho pelo Almoxarifado</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  <span>Nenhuma solicitação pendente</span>
                </>
              )}
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Insumos Críticos */}
        <Card className="hover:border-border transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wider">
                Insumos em Alerta
              </span>
              <AlertCircle className="h-4 w-4 text-muted-foreground/70" />
            </div>

            <div className="text-2xl font-bold tracking-tight text-foreground font-mono mt-2">
              {materiaisCriticos.length}
            </div>

            <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5">
              {esgotadosCount > 0 ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                  <span className="text-rose-600 dark:text-rose-400 font-medium">{esgotadosCount} com estoque zerado</span>
                </>
              ) : (
                <span>Itens com volume baixo (menos de 20 un)</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Composição das Despesas de Custeio */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-semibold">
                Composição das Saídas de Custeio
              </CardTitle>
              <CardDescription>
                Distribuição percentual dos gastos operacionais liquidados
              </CardDescription>
            </div>
            <span className="font-mono text-xs font-semibold text-foreground">
              {formatarMoeda(saldosNatureza.gastoCusteioTotal)}
            </span>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            {/* Multi-Segmented Progress Bar */}
            <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-muted">
              <div style={{ width: `${pctInsumos}%` }} className="bg-zinc-800 dark:bg-zinc-200 transition-all duration-300" title={`Insumos: ${pctInsumos}%`} />
              <div style={{ width: `${pctRh}%` }} className="bg-zinc-500 dark:bg-zinc-400 transition-all duration-300" title={`RH: ${pctRh}%`} />
              <div style={{ width: `${pctManutencao}%` }} className="bg-zinc-300 dark:bg-zinc-600 transition-all duration-300" title={`Manutenção: ${pctManutencao}%`} />
            </div>

            {/* Clean Neutral Legends */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <span className="h-2 w-2 rounded-full bg-zinc-800 dark:bg-zinc-200" />
                  Insumos (PBS)
                </div>
                <div className="text-sm font-semibold text-foreground font-mono mt-1">
                  {formatarMoeda(saldosNatureza.detalhamentoCusteio.insumos)}
                </div>
                <span className="text-[11px] text-muted-foreground">{pctInsumos}% do total</span>
              </div>

              <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <span className="h-2 w-2 rounded-full bg-zinc-500 dark:bg-zinc-400" />
                  Folha & RH
                </div>
                <div className="text-sm font-semibold text-foreground font-mono mt-1">
                  {formatarMoeda(saldosNatureza.detalhamentoCusteio.rhHonorarios)}
                </div>
                <span className="text-[11px] text-muted-foreground">{pctRh}% do total</span>
              </div>

              <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <span className="h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                  Manutenção
                </div>
                <div className="text-sm font-semibold text-foreground font-mono mt-1">
                  {formatarMoeda(saldosNatureza.detalhamentoCusteio.manutencao)}
                </div>
                <span className="text-[11px] text-muted-foreground">{pctManutencao}% do total</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comparativo de Gastos Por Unidade de Saúde */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-semibold">
                Consumo por Unidade de Saúde
              </CardTitle>
              <CardDescription>
                Consumo financeiro consolidado por estabelecimento
              </CardDescription>
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {unidades.length} unidades
            </span>
          </CardHeader>

          <CardContent className="space-y-3.5 max-h-[250px] overflow-y-auto pr-1 pt-2">
            {consolidacaoUnidades.map((u) => {
              const pct = Math.round((u.custoTotalGeral / maxGastoUnidade) * 100);
              return (
                <div key={u.unidadeId} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-foreground flex items-center gap-1.5">
                      {u.nome}
                      <span className="text-[10px] text-muted-foreground font-mono">
                        ({u.tipo})
                      </span>
                    </span>
                    <span className="font-mono font-medium text-foreground">
                      {formatarMoeda(u.custoTotalGeral)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div 
                      className="h-full bg-foreground/60 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Painel de Insumos Críticos */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-4">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Boxes className="h-4 w-4 text-muted-foreground" />
              Gestão de Insumos em Alerta de Estoque
            </CardTitle>
            <CardDescription>
              Insumos que atingiram ponto de reposição ou estoque crítico
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-48">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Filtrar por nome..."
                value={buscaAlerta}
                onChange={(e) => setBuscaAlerta(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>

            {/* Segmented Filter Control */}
            <div className="flex rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setFiltroAlerta('todos')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  filtroAlerta === 'todos'
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Todos ({materiaisCriticos.length})
              </button>
              <button
                type="button"
                onClick={() => setFiltroAlerta('esgotados')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  filtroAlerta === 'esgotados'
                    ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Zerados ({esgotadosCount})
              </button>
              <button
                type="button"
                onClick={() => setFiltroAlerta('baixo')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  filtroAlerta === 'baixo'
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
                <TableHead className="text-center w-40">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materiaisExibidos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8 text-xs">
                    Nenhum insumo necessita de reposição para o filtro selecionado.
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
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onAbrirAjusteEstoque(m)}
                            title="Repor Estoque"
                            className="h-7 text-xs px-2 gap-1"
                          >
                            <PlusCircle className="h-3 w-3" /> Repor
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onAbrirEditarMaterial(m)}
                            title="Editar Insumo"
                            className="h-7 text-xs px-2 gap-1 text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 className="h-3 w-3" /> Editar
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
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 pb-4">
          <div>
            <CardTitle className="text-sm font-semibold">
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

      {/* Pedidos Recentes */}
      <Card>
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
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8 text-xs">
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

    </div>
  );
};
