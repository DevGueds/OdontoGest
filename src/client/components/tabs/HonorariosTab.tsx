import React, { useState } from 'react';
import { UnidadeSaude, HonorarioOdontologo, PerfilUsuario, UserSistema } from '../../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { 
  Users, 
  FileText, 
  DollarSign, 
  Wallet, 
  Plus, 
  Eye, 
  Search, 
  Building2,
  Stethoscope,
  Save
} from 'lucide-react';

interface Props {
  unidades: UnidadeSaude[];
  honorarios: HonorarioOdontologo[];
  usuarios?: UserSistema[];
  perfilAtual?: PerfilUsuario;
  onAddHonorario: (dados: Omit<HonorarioOdontologo, 'id'>) => void;
  formatarMoeda: (v: number) => string;
}

export const HonorariosTab: React.FC<Props> = ({
  unidades,
  honorarios,
  usuarios = [],
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
  const [selectedProfissionalId, setSelectedProfissionalId] = useState<string>('');
  const [nomeDentista, setNomeDentista] = useState('');
  const [cro, setCro] = useState('');
  const [mesReferencia, setMesReferencia] = useState(new Date().toISOString().substring(0, 7));
  const [valorFixo, setValorFixo] = useState('');
  const [valorComissao, setValorComissao] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Profissionais da unidade selecionada no modal
  const profissionaisUnidade = usuarios.filter(u => u.unidade_id === Number(unidadeId));

  const handleAbrirModal = () => {
    const defaultUnidade = unidadeFiltro !== 'TODAS' ? Number(unidadeFiltro) : (unidades[0]?.id || 1);
    setUnidadeId(defaultUnidade);
    setSelectedProfissionalId('');
    setNomeDentista('');
    setCro('');
    setValorFixo('');
    setValorComissao('');
    setObservacoes('');
    setMesReferencia(new Date().toISOString().substring(0, 7));
    setModalOpen(true);
  };

  const handleUnidadeModalChange = (novoId: number) => {
    setUnidadeId(novoId);
    setSelectedProfissionalId('');
    setNomeDentista('');
    setCro('');
  };

  const handleProfissionalChange = (profId: string) => {
    setSelectedProfissionalId(profId);
    if (!profId) {
      setNomeDentista('');
      setCro('');
      return;
    }
    if (profId === 'MANUAL') {
      setNomeDentista('');
      setCro('');
      return;
    }
    const prof = profissionaisUnidade.find(u => String(u.id) === profId);
    if (prof) {
      setNomeDentista(prof.nome);
      setCro(prof.registro || '');
    }
  };

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
    if (!nomeDentista.trim()) {
      return;
    }
    onAddHonorario({
      unidade_id: Number(unidadeId),
      nome_dentista: nomeDentista.trim(),
      cro: cro.trim(),
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
    setSelectedProfissionalId('');
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Modern Metric Cards (No rainbow borders) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:border-border transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wider">
                Dentistas Ativos
              </span>
              <Users className="h-4 w-4 text-muted-foreground/70" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground font-mono mt-2">
              {honorariosFiltrados.length}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Total de prestadores e efetivos
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-border transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wider">
                Folha Base Fixa
              </span>
              <FileText className="h-4 w-4 text-muted-foreground/70" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground font-mono mt-2">
              {formatarMoeda(totalFixos)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Salários base contratados
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-border transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wider">
                Comissões & Plantões
              </span>
              <DollarSign className="h-4 w-4 text-muted-foreground/70" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground font-mono mt-2">
              {formatarMoeda(totalComissoes)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Variável por produção
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-border transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wider">
                Custo Total Pessoal
              </span>
              <Wallet className="h-4 w-4 text-muted-foreground/70" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground font-mono mt-2">
              {formatarMoeda(totalGeralHonorarios)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Custo total de folha odontológica
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Honorários Panel */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-4">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-muted-foreground" />
              Gestão de Folha e Honorários dos Cirurgiões Dentistas
            </CardTitle>
            <CardDescription>
              {isReadOnly ? 'Visualização em Modo Somente Leitura (Gestor)' : 'Controle de pagamentos de folha fixa e remunerações variáveis'}
            </CardDescription>
          </div>

          {!isReadOnly ? (
            <Button size="sm" onClick={handleAbrirModal} className="gap-2">
              <Plus className="w-4 h-4" />
              Registrar Honorário
            </Button>
          ) : (
            <Badge variant="outline" className="text-xs">
              Somente Leitura
            </Badge>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {/* Controls & Filter bar */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 p-4 border-b border-border/60">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Unidade:</span>
              <select 
                className="h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-w-[220px]"
                value={unidadeFiltro}
                onChange={e => setUnidadeFiltro(e.target.value === 'TODAS' ? 'TODAS' : Number(e.target.value))}
              >
                <option value="TODAS">Todas as Unidades de Saúde</option>
                {unidades.map(u => (
                  <option key={u.id} value={u.id}>{u.nome} ({u.tipo})</option>
                ))}
              </select>
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input 
                type="text" 
                placeholder="Filtrar por dentista ou CRO..."
                value={buscaDentista}
                onChange={e => setBuscaDentista(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unidade de Saúde</TableHead>
                  <TableHead>Cirurgião Dentista</TableHead>
                  <TableHead>CRO</TableHead>
                  <TableHead>Mês Ref.</TableHead>
                  <TableHead className="text-right">Valor Fixo (R$)</TableHead>
                  <TableHead className="text-right">Comissões (R$)</TableHead>
                  <TableHead className="text-right">Total Honorário (R$)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {honorariosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8 text-xs">
                      Nenhum registro de honorário/salário encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  honorariosFiltrados.map(h => {
                    const uni = unidades.find(u => u.id === h.unidade_id);
                    return (
                      <TableRow key={h.id}>
                        <TableCell className="font-medium text-foreground">
                          {uni ? uni.nome : `Unidade #${h.unidade_id}`}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-foreground">{h.nome_dentista}</div>
                          {h.observacoes && (
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              {h.observacoes}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-mono text-[10px]">
                            {h.cro || 'S/ CRO'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {h.mes_referencia}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground">
                          {formatarMoeda(h.valor_fixo)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground">
                          {formatarMoeda(h.valor_comissao)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-semibold text-foreground">
                          {formatarMoeda(h.valor_total)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
              {honorariosFiltrados.length > 0 && (
                <tfoot>
                  <TableRow className="bg-muted/40 font-semibold">
                    <TableCell colSpan={4} className="text-foreground">
                      TOTAL CONSOLIDADO
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-foreground">
                      {formatarMoeda(totalFixos)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-foreground">
                      {formatarMoeda(totalComissoes)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-bold text-foreground">
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
              Registrar Honorário Odontológico
            </DialogTitle>
            <DialogDescription>
              Lance o salário base e eventuais adicionais do profissional.
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
                onChange={e => handleUnidadeModalChange(Number(e.target.value))}
                required
              >
                {unidades.map(u => (
                  <option key={u.id} value={u.id}>{u.nome} ({u.tipo})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="select-nome-dentista" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Nome Completo do Cirurgião Dentista *
                </label>
                {profissionaisUnidade.length > 0 && (
                  <span className="text-[11px] font-medium text-primary">
                    {profissionaisUnidade.length} profissional(is) na unidade
                  </span>
                )}
              </div>

              {profissionaisUnidade.length > 0 ? (
                <div className="space-y-2">
                  <select
                    id="select-nome-dentista"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedProfissionalId}
                    onChange={e => handleProfissionalChange(e.target.value)}
                    required
                  >
                    <option value="">-- Selecione o profissional da unidade --</option>
                    {profissionaisUnidade.map(p => (
                      <option key={p.id} value={String(p.id)}>
                        {p.nome} {p.registro ? `(CRO: ${p.registro})` : '(Sem CRO)'}
                      </option>
                    ))}
                    <option value="MANUAL">-- Outro profissional (digitar nome manualmente) --</option>
                  </select>

                  {selectedProfissionalId === 'MANUAL' && (
                    <Input 
                      type="text" 
                      placeholder="Digite o nome completo do Cirurgião Dentista"
                      value={nomeDentista}
                      onChange={e => setNomeDentista(e.target.value)}
                      required
                      autoFocus
                    />
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <Input 
                    type="text" 
                    placeholder="Digite o nome completo do Cirurgião Dentista"
                    value={nomeDentista}
                    onChange={e => setNomeDentista(e.target.value)}
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Nenhum profissional vinculado a esta unidade. Digite o nome manualmente.
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    CRO
                  </label>
                  {selectedProfissionalId && selectedProfissionalId !== 'MANUAL' && cro && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Automático
                    </span>
                  )}
                </div>
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
                Observações
              </label>
              <textarea 
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                rows={2}
                placeholder="Detalhes ou justificativas..."
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
