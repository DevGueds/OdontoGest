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
import { ConfirmDeleteDialog } from '../ui/confirm-dialog';
import { 
  Landmark, 
  Wallet, 
  Receipt, 
  PlusCircle, 
  Check, 
  Trash2, 
  Lock, 
  Filter, 
  RotateCw, 
  Zap, 
  Building2
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
  const [entradaToDelete, setEntradaToDelete] = useState<EntradaRecurso | null>(null);
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
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/60">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Landmark className="w-4 h-4 text-muted-foreground" />
              Visão Geral de Entradas & Saldos Segregados
            </CardTitle>
            <CardDescription>
              Aportes cadastrados deduzidos das saídas operacionais consolidadas
            </CardDescription>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            Gestão de Recursos SMS
          </Badge>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fluxo Custeio */}
            <div className="border border-border/80 rounded-xl p-5 space-y-4 bg-muted/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Recursos de Custeio (Operacional)
                </span>
                <Badge variant="secondary" className="font-mono">
                  {saldos.percentualCusteioComprometido.toFixed(1)}% Comprometido
                </Badge>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>(+) Entradas Cadastradas:</span>
                  <span className="font-mono font-medium text-foreground">
                    {formatarMoeda(saldos.orcamentoCusteioTotal)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>(-) Saídas Realizadas (Insumos + RH + Manut.):</span>
                  <span className="font-mono font-medium text-foreground">
                    {formatarMoeda(saldos.gastoCusteioTotal)}
                  </span>
                </div>
              </div>

              <div className="h-px bg-border/80 my-2" />

              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-foreground">Saldo Custeio Disponível:</span>
                <span className="font-mono text-xl font-bold text-foreground">
                  {formatarMoeda(saldos.saldoCusteioDisponivel)}
                </span>
              </div>
            </div>

            {/* Fluxo Investimento */}
            <div className="border border-border/80 rounded-xl p-5 space-y-4 bg-muted/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Recursos de Investimento (Capital)
                </span>
                <Badge variant="secondary" className="font-mono">
                  {saldos.percentualInvestimentoComprometido.toFixed(1)}% Comprometido
                </Badge>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>(+) Entradas Cadastradas:</span>
                  <span className="font-mono font-medium text-foreground">
                    {formatarMoeda(saldos.orcamentoInvestimentoTotal)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>(-) Saídas Realizadas (Bens Permanentes):</span>
                  <span className="font-mono font-medium text-foreground">
                    {formatarMoeda(saldos.gastoInvestimentoTotal)}
                  </span>
                </div>
              </div>

              <div className="h-px bg-border/80 my-2" />

              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-foreground">Saldo Investimento Disponível:</span>
                <span className="font-mono text-xl font-bold text-foreground">
                  {formatarMoeda(saldos.saldoInvestimentoDisponivel)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário de Novo Lançamento de Entrada */}
      {!isReadOnly && (
        <Card>
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-muted-foreground" />
              Cadastrar Aporte ou Entrada de Recursos
            </CardTitle>
            <CardDescription>
              Informe os dados de novos repasses para compor os orçamentos municipais
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
                    Valor Total (R$) *
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
                    Natureza da Despesa *
                  </label>
                  <select 
                    id="ent_natureza" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={natureza}
                    onChange={(e) => setNatureza(e.target.value as NaturezaDespesa)}
                    required
                  >
                    <option value="CUSTEIO">Custeio (Insumos, RH e Manutenção)</option>
                    <option value="INVESTIMENTO">Investimento (Bens Permanentes e Equipamentos)</option>
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
                    <option value="RECORRENTE">Recorrente (Mensal Ordinário)</option>
                    <option value="PARCELA_UNICA">Parcela Única (Extraordinário)</option>
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
                    <option value="">Fundo Municipal de Saúde (Global)</option>
                    {unidades.map(u => (
                      <option key={u.id} value={u.id}>{u.nome} ({u.tipo})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="ent_data" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Data do Crédito *
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
                    Mês de Referência *
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
                <Button type="submit" className="gap-2">
                  <Check className="w-4 h-4" />
                  Registrar Entrada
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Histórico de Entradas Cadastradas */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-4">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Receipt className="w-4 h-4 text-muted-foreground" />
              Histórico de Aportes Registrados
            </CardTitle>
            <CardDescription>
              Entradas de recursos que compõem o saldo financeiro municipal
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Natureza:</span>
            <select 
              className="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8 text-xs">
                      Nenhum aporte financeiro registrado para o filtro selecionado.
                    </TableCell>
                  </TableRow>
                ) : (
                  entradasFiltradas.map(ent => {
                    const uni = unidades.find(u => u.id === ent.unidade_id);
                    return (
                      <TableRow key={ent.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">#{ent.id}</TableCell>
                        <TableCell>
                          <div className="font-medium text-foreground">{ent.descricao}</div>
                          {ent.observacoes && (
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              {ent.observacoes}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{ent.natureza}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px]">
                            {ent.tipo_recorrencia === 'RECORRENTE' ? 'Recorrente' : 'Parcela Única'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {uni ? uni.nome : 'Global (SMS)'}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {formatarData(ent.data_credito)}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {ent.mes_referencia}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-semibold text-foreground">
                          {formatarMoeda(ent.valor)}
                        </TableCell>
                        <TableCell className="text-center">
                          {!isReadOnly ? (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-muted-foreground hover:text-rose-600 h-7 w-7"
                              title="Remover Entrada"
                              onClick={() => setEntradaToDelete(ent)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-xs flex items-center justify-center">
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

      <ConfirmDeleteDialog
        open={Boolean(entradaToDelete)}
        onOpenChange={(open) => !open && setEntradaToDelete(null)}
        title="Remover Aporte Orçamentário"
        description={`Deseja realmente remover o aporte "${entradaToDelete?.descricao}" no valor de ${formatarMoeda(entradaToDelete?.valor || 0)}? O saldo disponível será recalculado imediatamente.`}
        confirmLabel="Sim, Remover Aporte"
        onConfirm={() => {
          if (entradaToDelete) {
            onDeleteEntrada(entradaToDelete.id);
            setEntradaToDelete(null);
          }
        }}
      />
    </div>
  );
};
