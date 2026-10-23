import React, { useState } from 'react';
import { UnidadeSaude, HonorarioOdontologo, PerfilUsuario } from '../../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { 
  UserCheck, 
  FileSpreadsheet, 
  Coins, 
  Vault, 
  Plus, 
  Eye, 
  Search, 
  Building2,
  Stethoscope,
  Calendar,
  Save,
  X
} from 'lucide-react';

interface Props {
  unidades: UnidadeSaude[];
  honorarios: HonorarioOdontologo[];
  perfilAtual?: PerfilUsuario;
  onAddHonorario: (dados: Omit<HonorarioOdontologo, 'id'>) => void;
  formatarMoeda: (v: number) => string;
}

export const HonorariosTab: React.FC<Props> = ({
  unidades,
  honorarios,
  perfilAtual = 'ADMINISTRADOR',
  onAddHonorario,
  formatarMoeda
}) => {
  const isReadOnly = perfilAtual === 'GESTOR';

  const [unidadeFiltro, setUnidadeFiltro] = useState<number | 'TODAS'>('TODAS');
  const [buscaDentista, setBuscaDentista] = useState('');
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [unidadeId, setUnidadeId] = useState<number>(unidades[0]?.id || 1);
  const [nomeDentista, setNomeDentista] = useState('');
  const [cro, setCro] = useState('');
  const [mesReferencia, setMesReferencia] = useState(new Date().toISOString().substring(0, 7));
  const [valorFixo, setValorFixo] = useState('');
  const [valorComissao, setValorComissao] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const honorariosFiltrados = honorarios.filter(h => {
    if (unidadeFiltro !== 'TODAS' && h.unidade_id !== unidadeFiltro) return false;
    if (buscaDentista.trim()) {
      return h.nome_dentista.toLowerCase().includes(buscaDentista.toLowerCase()) ||
             h.cro.toLowerCase().includes(buscaDentista.toLowerCase());
    }
    return true;
  });

  const totalFixos = honorariosFiltrados.reduce((acc, h) => acc + (h.valor_fixo || 0), 0);
  const totalComissoes = honorariosFiltrados.reduce((acc, h) => acc + (h.valor_comissao || 0), 0);
  const totalGeralHonorarios = honorariosFiltrados.reduce((acc, h) => acc + (h.valor_total || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddHonorario({
      unidade_id: Number(unidadeId),
      nome_dentista: nomeDentista,
      cro,
      tipo_contrato: 'FOLHA_FIXA',
      mes_referencia: mesReferencia,
      valor_fixo: parseFloat(valorFixo) || 0,
      valor_comissao: parseFloat(valorComissao) || 0,
      valor_total: (parseFloat(valorFixo) || 0) + (parseFloat(valorComissao) || 0),
      observacoes
    });

    setNomeDentista('');
    setCro('');
    setValorFixo('');
    setValorComissao('');
    setObservacoes('');
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards Honorários */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Dentistas Cadastrados
              </p>
              <h3 className="text-2xl font-bold text-foreground mt-0.5">
                {honorariosFiltrados.length}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Total Prestadores e Efetivos
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Salários Fixos
              </p>
              <h3 className="text-2xl font-bold text-foreground mt-0.5">
                {formatarMoeda(totalFixos)}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Folha Base de Pagamentos
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Comissões & Plantões
              </p>
              <h3 className="text-2xl font-bold text-foreground mt-0.5">
                {formatarMoeda(totalComissoes)}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Variável por Procedimento
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Vault className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Honorários
              </p>
              <h3 className="text-2xl font-bold text-foreground mt-0.5">
                {formatarMoeda(totalGeralHonorarios)}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Custo Total de Pessoal
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Honorários Panel */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-primary" />
              Gestão de Salários e Honorários dos Odontólogos
            </CardTitle>
            <CardDescription>
              {isReadOnly ? 'Visualização em Modo Somente Leitura (Gestor)' : 'Controle de despesas de pessoal e folha odontológica'}
            </CardDescription>
          </div>

          {!isReadOnly ? (
            <Button onClick={() => setModalOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Registrar Honorário / Salário
            </Button>
          ) : (
            <Badge variant="info" className="py-1 px-3 flex items-center gap-1.5 self-start sm:self-auto">
              <Eye className="w-3.5 h-3.5" />
              Somente Leitura
            </Badge>
          )}
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          {/* Controls & Filter bar */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Unidade:</span>
              <select 
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-w-[220px]"
                value={unidadeFiltro}
                onChange={e => setUnidadeFiltro(e.target.value === 'TODAS' ? 'TODAS' : Number(e.target.value))}
              >
                <option value="TODAS">🏥 Todas as Unidades de Saúde</option>
                {unidades.map(u => (
                  <option key={u.id} value={u.id}>{u.nome} ({u.tipo})</option>
                ))}
              </select>
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
              <Input 
                type="text" 
                placeholder="Pesquisar por dentista ou CRO..."
                value={buscaDentista}
                onChange={e => setBuscaDentista(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unidade de Saúde</TableHead>
                  <TableHead>Cirurgião Dentista</TableHead>
                  <TableHead>CRO</TableHead>
                  <TableHead>Mês Ref.</TableHead>
                  <TableHead className="text-right">Valor Fixo (R$)</TableHead>
                  <TableHead className="text-right">Comissões / Extra (R$)</TableHead>
                  <TableHead className="text-right">Total Honorário (R$)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {honorariosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                      Nenhum registro de honorário/salário encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  honorariosFiltrados.map(h => {
                    const uni = unidades.find(u => u.id === h.unidade_id);
                    return (
                      <TableRow key={h.id}>
                        <TableCell className="font-semibold text-foreground">
                          {uni ? uni.nome : `Unidade #${h.unidade_id}`}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-foreground">{h.nome_dentista}</div>
                          {h.observacoes && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {h.observacoes}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{h.cro || 'S/ CRO'}</Badge>
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {h.mes_referencia}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatarMoeda(h.valor_fixo)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatarMoeda(h.valor_comissao)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {formatarMoeda(h.valor_total)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
              {honorariosFiltrados.length > 0 && (
                <tfoot>
                  <TableRow className="bg-primary/5 font-bold hover:bg-primary/5">
                    <TableCell colSpan={4} className="text-foreground">
                      TOTAL DOS HONORÁRIOS CONSOLIDADO:
                    </TableCell>
                    <TableCell className="text-right text-foreground">
                      {formatarMoeda(totalFixos)}
                    </TableCell>
                    <TableCell className="text-right text-foreground">
                      {formatarMoeda(totalComissoes)}
                    </TableCell>
                    <TableCell className="text-right text-emerald-600 dark:text-emerald-400 text-base">
                      {formatarMoeda(totalGeralHonorarios)}
                    </TableCell>
                  </TableRow>
                </tfoot>
              )}
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Registrar Honorário */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-primary" />
              Registrar Honorário / Salário
            </DialogTitle>
            <DialogDescription>
              Informe os dados de pagamento ou comissão do cirurgião dentista.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Unidade de Saúde Alocada *
              </label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={unidadeId} 
                onChange={e => setUnidadeId(Number(e.target.value))}
                required
              >
                {unidades.map(u => (
                  <option key={u.id} value={u.id}>{u.nome} ({u.tipo})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Nome Completo do Cirurgião Dentista *
              </label>
              <Input 
                type="text" 
                placeholder="Ex: Dra. Maria Fernanda Silva"
                value={nomeDentista}
                onChange={e => setNomeDentista(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Registro Profissional (CRO) (Opcional)
              </label>
              <Input 
                type="text" 
                placeholder="Ex: CRO/PA 0592"
                value={cro}
                onChange={e => setCro(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Mês de Referência *
              </label>
              <Input 
                type="month" 
                value={mesReferencia}
                onChange={e => setMesReferencia(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Valor Fixo (R$)
                </label>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00"
                  value={valorFixo}
                  onChange={e => setValorFixo(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Comissão / Extra (R$)
                </label>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00"
                  value={valorComissao}
                  onChange={e => setValorComissao(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Observações / Procedimentos Atendidos
              </label>
              <textarea 
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                rows={2}
                placeholder="Detalhes sobre a produção, procedimentos efetuados..."
                value={observacoes}
                onChange={e => setObservacoes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="gap-2">
                <Save className="w-4 h-4" />
                Salvar Honorário
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
