import React, { useState } from 'react';
import { 
  UnidadeSaude, 
  EntradaRecurso, 
  NaturezaDespesa, 
  TipoRecorrencia, 
  PedidoPBS, 
  Material, 
  HonorarioOdontologo, 
  ChamadoManutencao,
  PerfilUsuario 
} from '../../types';
import { dbService } from '../../services/db';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  Landmark, 
  Wallet, 
  Receipt, 
  TrendingUp, 
  TrendingDown, 
  PlusCircle, 
  Check, 
  Trash2, 
  Lock, 
  Filter, 
  RotateCw, 
  Zap, 
  Building2,
  DollarSign
} from 'lucide-react';

interface Props {
  unidades: UnidadeSaude[];
  entradas: EntradaRecurso[];
  pedidos: PedidoPBS[];
  materiais: Material[];
  honorarios: HonorarioOdontologo[];
  chamados: ChamadoManutencao[];
  perfilAtual?: PerfilUsuario;
  onAddEntrada: (dados: Omit<EntradaRecurso, 'id'>) => void;
  onDeleteEntrada: (id: number) => void;
  formatarMoeda: (val: number) => string;
  formatarData: (d?: string | null) => string;
}

export const OrcamentoTab: React.FC<Props> = ({
  unidades,
  entradas,
  pedidos,
  materiais,
  honorarios,
  chamados,
  perfilAtual = 'ADMINISTRADOR',
  onAddEntrada,
  onDeleteEntrada,
  formatarMoeda,
  formatarData
}) => {
  const isReadOnly = perfilAtual === 'GESTOR';
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [natureza, setNatureza] = useState<NaturezaDespesa>('CUSTEIO');
  const [tipoRecorrencia, setTipoRecorrencia] = useState<TipoRecorrencia>('RECORRENTE');
  const [unidadeId, setUnidadeId] = useState<string>('');
  const [dataCredito, setDataCredito] = useState(new Date().toISOString().substring(0, 10));
  const [mesReferencia, setMesReferencia] = useState(new Date().toISOString().substring(0, 7));
  const [observacoes, setObservacoes] = useState('');

  const [filtroNatureza, setFiltroNatureza] = useState<'TODOS' | NaturezaDespesa>('TODOS');

  const saldos = dbService.getSaldosNaturezaRecursos(unidades, pedidos, materiais, honorarios, chamados, entradas);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim() || !valor || parseFloat(valor) <= 0) return;

    onAddEntrada({
      unidade_id: unidadeId ? parseInt(unidadeId) : null,
      natureza,
      tipo_recorrencia: tipoRecorrencia,
      descricao: descricao.trim(),
      valor: parseFloat(valor),
      data_credito: dataCredito,
      mes_referencia: mesReferencia,
      observacoes: observacoes.trim() || undefined
    });

    setDescricao('');
    setValor('');
    setObservacoes('');
  };

  const entradasFiltradas = entradas.filter(e => {
    if (filtroNatureza !== 'TODOS' && e.natureza !== filtroNatureza) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Resumo de Saldos e Fluxo Orçamentário */}
      <Card className="border-l-4 border-l-primary shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
          <div className="space-y-1">
            <CardTitle className="text-xl flex items-center gap-2">
              <Landmark className="w-5 h-5 text-primary" />
              Visão Geral das Entradas & Saldos Segregados
            </CardTitle>
            <CardDescription>
              Entradas de recursos cadastrados (Aportes/Repasses) deduzidos das saídas reais consolidadas (Insumos + RH + Manutenção).
            </CardDescription>
          </div>
          <Badge variant="info" className="flex items-center gap-1.5 self-start sm:self-auto py-1 px-3">
            <Building2 className="w-3.5 h-3.5" />
            Gestão de Recursos SMS
          </Badge>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card Custeio */}
            <div className="bg-muted/40 dark:bg-muted/20 border border-border rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-primary" />
                  <span className="font-bold text-sm tracking-wide text-foreground">
                    FLUXO DE RECURSOS DE CUSTEIO
                  </span>
                </div>
                <Badge variant="info">
                  {saldos.percentualCusteioComprometido.toFixed(1)}% Comprometido
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>(+) Entradas Cadastradas (Custeio):</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatarMoeda(saldos.orcamentoCusteioTotal)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>(-) Total Saídas (Pedidos + RH + Manut.):</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400">
                    {formatarMoeda(saldos.gastoCusteioTotal)}
                  </span>
                </div>
              </div>

              <div className="h-px bg-border my-2" />

              <div className="flex justify-between items-center text-base font-bold">
                <span className="text-foreground text-sm">(=) SALDO DE CUSTEIO DISPONÍVEL:</span>
                <span className={saldos.saldoCusteioDisponivel >= 0 ? 'text-emerald-600 dark:text-emerald-400 text-lg' : 'text-rose-600 dark:text-rose-400 text-lg'}>
                  {formatarMoeda(saldos.saldoCusteioDisponivel)}
                </span>
              </div>
            </div>

            {/* Card Investimento */}
            <div className="bg-muted/40 dark:bg-muted/20 border border-border rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="font-bold text-sm tracking-wide text-foreground">
                    FLUXO DE RECURSOS DE INVESTIMENTO
                  </span>
                </div>
                <Badge variant="purple">
                  {saldos.percentualInvestimentoComprometido.toFixed(1)}% Comprometido
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>(+) Entradas Cadastradas (Investimento):</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatarMoeda(saldos.orcamentoInvestimentoTotal)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>(-) Total Saídas (Equipamentos Permanentes):</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400">
                    {formatarMoeda(saldos.gastoInvestimentoTotal)}
                  </span>
                </div>
              </div>

              <div className="h-px bg-border my-2" />

              <div className="flex justify-between items-center text-base font-bold">
                <span className="text-foreground text-sm">(=) SALDO DE INVESTIMENTO DISPONÍVEL:</span>
                <span className={saldos.saldoInvestimentoDisponivel >= 0 ? 'text-purple-600 dark:text-purple-400 text-lg' : 'text-rose-600 dark:text-rose-400 text-lg'}>
                  {formatarMoeda(saldos.saldoInvestimentoDisponivel)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário de Novo Lançamento de Entrada */}
      {!isReadOnly && (
        <Card className="shadow-sm">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Cadastrar Nova Entrada / Aporte Financeiro
            </CardTitle>
            <CardDescription>
              Informe os dados de novos aportes para compor o orçamento das unidades ou fundo geral.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5 lg:col-span-2">
                  <label htmlFor="ent_descricao" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Descrição do Aporte / Repasse *
                  </label>
                  <Input 
                    type="text" 
                    id="ent_descricao" 
                    placeholder="Ex: Repasse FNS Custeio Atenção Primária"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    required 
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="ent_valor" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Valor Total do Aporte (R$) *
                  </label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    id="ent_valor" 
                    placeholder="0.00"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    required 
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="ent_natureza" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Natureza do Saldo / Recurso *
                  </label>
                  <select 
                    id="ent_natureza" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={natureza}
                    onChange={(e) => setNatureza(e.target.value as NaturezaDespesa)}
                    required
                  >
                    <option value="CUSTEIO">💳 Custeio (Consumo / Operacional / RH / Manutenção)</option>
                    <option value="INVESTIMENTO">🏗️ Investimento (Bens Permanentes / Capital)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="ent_recorrencia" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Tipo de Entrada *
                  </label>
                  <select 
                    id="ent_recorrencia" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={tipoRecorrencia}
                    onChange={(e) => setTipoRecorrencia(e.target.value as TipoRecorrencia)}
                    required
                  >
                    <option value="RECORRENTE">🔄 Recorrente (Repasse Mensal Ordinário)</option>
                    <option value="PARCELA_UNICA">⚡ Parcela Única (Emenda / Aporte Extra)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="ent_unidade" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Destino / Unidade Beneficiada
                  </label>
                  <select 
                    id="ent_unidade" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={unidadeId}
                    onChange={(e) => setUnidadeId(e.target.value)}
                  >
                    <option value="">🌐 GLOBAL / Todas as Unidades (Fundo SMS)</option>
                    {unidades.map(u => (
                      <option key={u.id} value={u.id}>{u.nome} ({u.tipo})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="ent_data" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Data do Crédito / Depósito *
                  </label>
                  <Input 
                    type="date" 
                    id="ent_data" 
                    value={dataCredito}
                    onChange={(e) => setDataCredito(e.target.value)}
                    required 
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="ent_mes" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Mês de Referência (YYYY-MM) *
                  </label>
                  <Input 
                    type="month" 
                    id="ent_mes" 
                    value={mesReferencia}
                    onChange={(e) => setMesReferencia(e.target.value)}
                    required 
                  />
                </div>

                <div className="space-y-1.5 lg:col-span-4">
                  <label htmlFor="ent_obs" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Observações / N° da Portaria
                  </label>
                  <Input 
                    type="text" 
                    id="ent_obs" 
                    placeholder="Ex: Portaria FNS N° 1.204/2026"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" variant="emerald" className="gap-2">
                  <Check className="w-4 h-4" />
                  Registrar Entrada de Recursos
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Histórico de Entradas Cadastradas */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              Histórico de Entradas & Repasses Registrados
            </CardTitle>
            <CardDescription>
              Entradas de capital que compõem os orçamentos de Custeio e Investimento
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground">Natureza:</span>
            <select 
              className="h-9 rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={filtroNatureza}
              onChange={(e) => setFiltroNatureza(e.target.value as any)}
            >
              <option value="TODOS">Todas as Naturezas</option>
              <option value="CUSTEIO">Apenas Custeio</option>
              <option value="INVESTIMENTO">Apenas Investimento</option>
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>Descrição do Repasse / Aporte</TableHead>
                  <TableHead>Natureza</TableHead>
                  <TableHead>Recorrência</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Data Crédito</TableHead>
                  <TableHead>Mês Ref.</TableHead>
                  <TableHead className="text-right">Valor Aporte (R$)</TableHead>
                  <TableHead className="text-center w-20">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entradasFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-10">
                      Nenhum aporte financeiro registrado para o filtro selecionado.
                    </TableCell>
                  </TableRow>
                ) : (
                  entradasFiltradas.map(ent => {
                    const uni = unidades.find(u => u.id === ent.unidade_id);
                    return (
                      <TableRow key={ent.id}>
                        <TableCell className="font-semibold text-muted-foreground">#{ent.id}</TableCell>
                        <TableCell>
                          <div className="font-medium text-foreground">{ent.descricao}</div>
                          {ent.observacoes && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {ent.observacoes}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {ent.natureza === 'INVESTIMENTO' ? (
                            <Badge variant="purple" className="flex items-center gap-1 w-fit">
                              <Landmark className="w-3 h-3" /> Investimento
                            </Badge>
                          ) : (
                            <Badge variant="info" className="flex items-center gap-1 w-fit">
                              <Receipt className="w-3 h-3" /> Custeio
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {ent.tipo_recorrencia === 'RECORRENTE' ? (
                            <Badge variant="success" className="flex items-center gap-1 w-fit">
                              <RotateCw className="w-3 h-3" /> Recorrente
                            </Badge>
                          ) : (
                            <Badge variant="warning" className="flex items-center gap-1 w-fit">
                              <Zap className="w-3 h-3" /> Parcela Única
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {uni ? (
                            <Badge variant="secondary" className="w-fit">{uni.nome}</Badge>
                          ) : (
                            <Badge variant="info" className="w-fit">GLOBAL (SMS)</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatarData(ent.data_credito)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="purple">{ent.mes_referencia}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {formatarMoeda(ent.valor)}
                        </TableCell>
                        <TableCell className="text-center">
                          {!isReadOnly ? (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 h-8 w-8"
                              title="Remover Entrada"
                              onClick={() => {
                                if (confirm(`Deseja remover o aporte "${ent.descricao}" no valor de ${formatarMoeda(ent.valor)}?`)) {
                                  onDeleteEntrada(ent.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-xs flex items-center justify-center gap-1">
                              <Lock className="w-3 h-3" />
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
