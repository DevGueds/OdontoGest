import React, { useState, useEffect } from 'react';
import { 
  UnidadeSaude, 
  Equipamento, 
  ChamadoManutencao, 
  StatusChamado,
  TipoChamado,
  PerfilUsuario 
} from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from '../ui/table';
import {
  Wrench,
  ShieldAlert,
  AlertTriangle,
  CalendarCheck,
  ChevronDown,
  ChevronUp,
  Plus,
  Edit2,
  Check,
  X,
  Clock,
  ThumbsUp,
  Building2,
  Calendar,
  Lock,
  Boxes,
  ClipboardList
} from 'lucide-react';

interface Props {
  unidades: UnidadeSaude[];
  equipamentos: Equipamento[];
  chamados: ChamadoManutencao[];
  perfilAtual: PerfilUsuario;
  onAddEquipamento: (dados: Omit<Equipamento, 'id'>) => void;
  onUpdateEquipamento: (id: number, dados: Partial<Equipamento>) => void;
  onAddChamado: (dados: Omit<ChamadoManutencao, 'id'>) => void;
  onUpdateStatusChamado: (chamadoId: number, status: StatusChamado, custoReparo?: number) => void;
  onAprovarChamado?: (chamadoId: number, aprovar: boolean) => void;
  formatarMoeda: (v: number) => string;
}

export const EquipamentosTab: React.FC<Props> = ({
  unidades,
  equipamentos,
  chamados,
  perfilAtual,
  onAddEquipamento,
  onUpdateEquipamento,
  onAddChamado,
  onUpdateStatusChamado,
  onAprovarChamado,
  formatarMoeda
}) => {
  const { user } = useAuth();
  const isSolicitante = perfilAtual === 'SOLICITANTE';
  const isGestor = perfilAtual === 'GESTOR';
  const isAdmin = perfilAtual === 'ADMINISTRADOR';
  const isTecnico = perfilAtual === 'TECNICO';

  const [unidadeFiltro, setUnidadeFiltro] = useState<number | 'TODAS'>('TODAS');
  const [equipamentoSelecionadoId, setEquipamentoSelecionadoId] = useState<number | 'TODOS'>('TODOS');

  useEffect(() => {
    if (isSolicitante && user?.unidade_id) {
      setUnidadeFiltro(user.unidade_id);
    }
  }, [isSolicitante, user]);

  // Modais
  const [modalEquipamentoOpen, setModalEquipamentoOpen] = useState(false);
  const [modalEditEquipamentoOpen, setModalEditEquipamentoOpen] = useState(false);
  const [modalChamadoOpen, setModalChamadoOpen] = useState(false);
  const [modalPreventivaOpen, setModalPreventivaOpen] = useState(false);
  const [, setEquipamentoPreventiva] = useState<Equipamento | null>(null);

  // Form Equipamento (Novo)
  const [eqUnidadeId, setEqUnidadeId] = useState<number>(unidades[0]?.id || 1);
  const [eqNome, setEqNome] = useState('');
  const [eqNumeroSerie, setEqNumeroSerie] = useState('');
  const [eqDataPreventiva, setEqDataPreventiva] = useState('');

  // Form Equipamento (Edição)
  const [equipamentoEdicao, setEquipamentoEdicao] = useState<Equipamento | null>(null);
  const [editUnidadeId, setEditUnidadeId] = useState<number | ''>('');
  const [editNome, setEditNome] = useState('');
  const [editNumeroSerie, setEditNumeroSerie] = useState('');
  const [editDataPreventiva, setEditDataPreventiva] = useState('');

  // Expandir alertas
  const [alertasExpandidos, setAlertasExpandidos] = useState(false);

  // Form Chamado
  const [chEquipamentoId, setChEquipamentoId] = useState<number>(equipamentos[0]?.id || 1);
  const [chTipo, setChTipo] = useState<TipoChamado>('CORRETIVA');
  const [chDescricaoDefeito, setChDescricaoDefeito] = useState('');
  const [chCustoReparo, setChCustoReparo] = useState('');
  const [, setChStatus] = useState<StatusChamado>('ABERTO');
  const [chDataAbertura, setChDataAbertura] = useState(new Date().toISOString().substring(0, 10));

  // Edit status modal
  const [chamadoEmEdicao, setChamadoEmEdicao] = useState<ChamadoManutencao | null>(null);
  const [novoStatus, setNovoStatus] = useState<StatusChamado>('EM_ANDAMENTO');
  const [novoCusto, setNovoCusto] = useState('');

  const equipamentosFiltrados = equipamentos.filter(eq => {
    if (isSolicitante && user?.unidade_id && eq.unidade_id !== user.unidade_id) return false;
    if (unidadeFiltro !== 'TODAS' && eq.unidade_id !== unidadeFiltro) return false;
    if (equipamentoSelecionadoId !== 'TODOS' && eq.id !== equipamentoSelecionadoId) return false;
    return true;
  });

  const chamadosFiltrados = chamados.filter(ch => {
    if (isSolicitante && user?.unidade_id && ch.unidade_id !== user.unidade_id) return false;
    if (unidadeFiltro !== 'TODAS' && ch.unidade_id !== unidadeFiltro) return false;
    if (equipamentoSelecionadoId !== 'TODOS' && ch.equipamento_id !== equipamentoSelecionadoId) return false;
    
    if (isTecnico) {
      return ch.status === 'APROVADO_ADM' || ch.status === 'EM_ANDAMENTO' || ch.status === 'CONCLUIDO' || ch.aprovado_adm === true;
    }
    return true;
  });

  const alertasPreventivaAutomated = React.useMemo(() => {
    const hoje = new Date();
    return equipamentosFiltrados.filter(eq => {
      const chamadosDoEq = chamados.filter(c => c.equipamento_id === eq.id && c.status !== 'CONCLUIDO' && c.status !== 'RECUSADO');
      if (chamadosDoEq.length > 0) return false;

      if (!eq.data_ultima_preventiva) return true;

      const dataPrev = new Date(eq.data_ultima_preventiva);
      const diffDias = Math.floor((hoje.getTime() - dataPrev.getTime()) / (1000 * 3600 * 24));
      return diffDias >= 180;
    }).map(eq => {
      const uni = unidades.find(u => u.id === eq.unidade_id);
      return {
        equipamento: eq,
        unidade: uni,
        mensagem: `O equipamento ${eq.nome}${eq.numero_serie ? ` (Patrimônio: ${eq.numero_serie})` : ''} na ${uni ? uni.nome : 'Unidade'} ${!eq.data_ultima_preventiva ? 'não possui preventiva registrada' : 'está há mais de 6 meses sem preventiva'}.`
      };
    });
  }, [equipamentosFiltrados, chamados, unidades]);

  const handleAbrirEditarEquipamento = (eq: Equipamento) => {
    setEquipamentoEdicao(eq);
    setEditUnidadeId(eq.unidade_id);
    setEditNome(eq.nome);
    setEditNumeroSerie(eq.numero_serie || '');
    setEditDataPreventiva(eq.data_ultima_preventiva || '');
    setModalEditEquipamentoOpen(true);
  };

  const handleConfirmarEdicaoEquipamento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipamentoEdicao) return;
    onUpdateEquipamento(equipamentoEdicao.id, {
      unidade_id: Number(editUnidadeId),
      nome: editNome,
      numero_serie: editNumeroSerie,
      data_ultima_preventiva: editDataPreventiva || null
    });
    setModalEditEquipamentoOpen(false);
    setEquipamentoEdicao(null);
  };

  const handleSubmitEquipamento = (e: React.FormEvent) => {
    e.preventDefault();
    onAddEquipamento({
      unidade_id: Number(eqUnidadeId),
      nome: eqNome,
      numero_serie: eqNumeroSerie,
      categoria: '',
      data_ultima_preventiva: eqDataPreventiva || null
    });
    setEqNome('');
    setEqNumeroSerie('');
    setEqDataPreventiva('');
    setModalEquipamentoOpen(false);
  };

  const handleSubmitChamado = (e: React.FormEvent) => {
    e.preventDefault();
    const eq = equipamentos.find(item => item.id === Number(chEquipamentoId));
    if (!eq) return;

    onAddChamado({
      unidade_id: eq.unidade_id,
      equipamento_id: eq.id,
      tipo: chTipo,
      descricao_defeito: chDescricaoDefeito,
      custo_reparo: parseFloat(chCustoReparo) || 0,
      status: 'ABERTO',
      aprovado_adm: false,
      data_abertura: chDataAbertura
    });

    setChDescricaoDefeito('');
    setChCustoReparo('');
    setModalChamadoOpen(false);
    setModalPreventivaOpen(false);
  };

  const handleAbrirAgendamentoPreventiva = (eq: Equipamento) => {
    setEquipamentoPreventiva(eq);
    setChEquipamentoId(eq.id);
    setChTipo('PREVENTIVA');
    setChDescricaoDefeito(`Manutenção Preventiva Periódica Programada - Calibração e revisão técnica do equipamento ${eq.nome}.`);
    setChCustoReparo('150.00');
    setChStatus('ABERTO');
    setModalPreventivaOpen(true);
  };

  const renderBadgeStatus = (st: StatusChamado) => {
    switch (st) {
      case 'ABERTO':
        return <Badge variant="warning"><Clock className="h-3 w-3" /> Aberto (Pendente ADM)</Badge>;
      case 'APROVADO_ADM':
        return <Badge variant="info"><ThumbsUp className="h-3 w-3" /> Aprovado Técnico</Badge>;
      case 'EM_ANDAMENTO':
        return <Badge variant="purple"><Wrench className="h-3 w-3" /> Em Execução</Badge>;
      case 'CONCLUIDO':
        return <Badge variant="success"><Check className="h-3 w-3" /> Concluído</Badge>;
      case 'RECUSADO':
        return <Badge variant="destructive"><X className="h-3 w-3" /> Recusado ADM</Badge>;
      default:
        return <Badge variant="outline">{st}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Alertas Automatizados de Preventiva */}
      {alertasPreventivaAutomated.length > 0 && (
        <Card className="border-l-4 border-l-cyan-600 bg-cyan-50/40 dark:bg-cyan-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="h-5 w-5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                <strong className="text-sm text-cyan-900 dark:text-cyan-200">
                  Sugestões de Manutenção Preventiva ({alertasPreventivaAutomated.length} equipamento{alertasPreventivaAutomated.length > 1 ? 's' : ''})
                </strong>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setAlertasExpandidos(!alertasExpandidos)}
                className="h-8 text-xs border-cyan-300 text-cyan-800 dark:border-cyan-800 dark:text-cyan-300"
              >
                {alertasExpandidos ? <ChevronUp className="h-3.5 w-3.5 mr-1" /> : <ChevronDown className="h-3.5 w-3.5 mr-1" />}
                {alertasExpandidos ? 'Ocultar' : 'Ver Sugestões'}
              </Button>
            </div>

            {alertasExpandidos && (
              <div className="mt-3 max-h-56 overflow-y-auto space-y-2 pr-1">
                {alertasPreventivaAutomated.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-cyan-200/80 bg-white dark:border-cyan-900/60 dark:bg-slate-900 text-xs gap-3">
                    <div>
                      <strong className="text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-cyan-600" />
                        {item.unidade?.nome} — {item.equipamento.nome} {item.equipamento.numero_serie ? `(Patr: ${item.equipamento.numero_serie})` : ''}
                      </strong>
                      <p className="text-slate-500 dark:text-slate-400 mt-0.5">{item.mensagem}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleAbrirAgendamentoPreventiva(item.equipamento)}
                      className="h-7 text-xs border-cyan-300 text-cyan-700 dark:border-cyan-800 dark:text-cyan-300 shrink-0"
                    >
                      <CalendarCheck className="h-3.5 w-3.5 mr-1" /> Agendar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Gestão de Equipamentos e Chamados */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <CardTitle className="text-xl font-bold">
              <Wrench className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              Gestão de Equipamentos & Chamados de Manutenção
            </CardTitle>
            <CardDescription>
              Controle de equipamentos odontológicos por Unidade de Saúde e registro de chamados.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {(isAdmin || isGestor) && (
              <Button size="sm" variant="outline" onClick={() => setModalEquipamentoOpen(true)} className="text-xs">
                <Plus className="h-3.5 w-3.5 mr-1" /> Novo Equipamento
              </Button>
            )}
            {!isTecnico && (
              <Button size="sm" onClick={() => setModalChamadoOpen(true)} className="text-xs">
                <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Abrir Chamado
              </Button>
            )}
            {isGestor && (
              <Badge variant="info">Modo Leitura</Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-5 space-y-6">
          {/* Filtros */}
          <div className="flex gap-4 flex-wrap">
            <div className="min-w-[220px] space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Filtrar por Unidade:</label>
              <select 
                className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                value={isSolicitante && user?.unidade_id ? user.unidade_id : unidadeFiltro}
                onChange={e => {
                  setUnidadeFiltro(e.target.value === 'TODAS' ? 'TODAS' : Number(e.target.value));
                  setEquipamentoSelecionadoId('TODOS');
                }}
                disabled={isSolicitante && Boolean(user?.unidade_id)}
              >
                {!isSolicitante && <option value="TODAS">Todas as Unidades de Saúde</option>}
                {unidades
                  .filter(u => !isSolicitante || !user?.unidade_id || u.id === user.unidade_id)
                  .map(u => (
                    <option key={u.id} value={u.id}>{u.nome} ({u.tipo})</option>
                  ))}
              </select>
            </div>

            <div className="min-w-[240px] space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Filtrar por Equipamento:</label>
              <select 
                className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                value={equipamentoSelecionadoId}
                onChange={e => setEquipamentoSelecionadoId(e.target.value === 'TODOS' ? 'TODOS' : Number(e.target.value))}
              >
                <option value="TODOS">Todos os Equipamentos</option>
                {equipamentos.filter(eq => unidadeFiltro === 'TODAS' || eq.unidade_id === unidadeFiltro).map(eq => (
                  <option key={eq.id} value={eq.id}>{eq.nome}{eq.numero_serie ? ` (Patr: ${eq.numero_serie})` : ''}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Chamados de Reparo Table */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-teal-600" />
              Histórico de Chamados de Manutenção
            </h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Equipamento</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Defeito / Serviço</TableHead>
                  <TableHead>Data</TableHead>
                  {!isSolicitante && <TableHead className="text-right">Custo (R$)</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chamadosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isSolicitante ? 8 : 9} className="text-center text-slate-500 py-6">
                      {isTecnico ? 'Nenhum chamado liberado para atendimento no momento.' : 'Nenhum chamado de manutenção registrado.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  chamadosFiltrados.map(ch => {
                    const uni = unidades.find(u => u.id === ch.unidade_id);
                    const eq = equipamentos.find(e => e.id === ch.equipamento_id);

                    return (
                      <TableRow key={ch.id}>
                        <TableCell className="font-mono text-xs font-bold">#{ch.id}</TableCell>
                        <TableCell className="font-medium text-xs">{uni ? uni.nome : `Unidade #${ch.unidade_id}`}</TableCell>
                        <TableCell className="text-xs">{eq ? eq.nome : `Equip. #${ch.equipamento_id}`}</TableCell>
                        <TableCell>
                          <Badge variant={ch.tipo === 'PREVENTIVA' ? 'info' : 'warning'}>
                            {ch.tipo === 'PREVENTIVA' ? 'Preventiva' : 'Corretiva'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs max-w-xs truncate">{ch.descricao_defeito}</TableCell>
                        <TableCell className="text-xs text-slate-500">{ch.data_abertura}</TableCell>
                        {!isSolicitante && (
                          <TableCell className="text-right font-mono text-xs font-semibold">
                            {formatarMoeda(ch.custo_reparo)}
                          </TableCell>
                        )}
                        <TableCell>{renderBadgeStatus(ch.status)}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {(isAdmin || isGestor) && ch.status === 'ABERTO' && (
                              <>
                                <Button 
                                  variant="emerald" 
                                  size="sm"
                                  onClick={() => onAprovarChamado && onAprovarChamado(ch.id, true)}
                                  className="h-7 text-xs"
                                >
                                  <Check className="h-3.5 w-3.5 mr-1" /> Aprovar
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => onAprovarChamado && onAprovarChamado(ch.id, false)}
                                  className="h-7 text-xs"
                                >
                                  <X className="h-3 w-3 mr-1" /> Recusar
                                </Button>
                              </>
                            )}

                            {(isTecnico || isAdmin || isGestor) && (ch.status === 'APROVADO_ADM' || ch.status === 'EM_ANDAMENTO') && (
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={() => {
                                  setChamadoEmEdicao(ch);
                                  setNovoStatus('EM_ANDAMENTO');
                                  setNovoCusto(String(ch.custo_reparo || ''));
                                }}
                                className="h-7 text-xs"
                              >
                                <Wrench className="h-3.5 w-3.5 mr-1" /> Atualizar
                              </Button>
                            )}

                            {ch.status === 'CONCLUIDO' && (
                              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                                <Check className="h-3.5 w-3.5" /> Concluído
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Equipamentos Instalados Table */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Boxes className="h-4 w-4 text-teal-600" />
              Equipamentos Instalados nas Unidades
            </h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unidade de Saúde</TableHead>
                  <TableHead>Equipamento</TableHead>
                  <TableHead>Patrimônio / Série</TableHead>
                  <TableHead>Última Preventiva</TableHead>
                  <TableHead>Status Operacional</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipamentosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500 py-6">
                      Nenhum equipamento cadastrado para os filtros selecionados.
                    </TableCell>
                  </TableRow>
                ) : (
                  equipamentosFiltrados.map(eq => {
                    const uni = unidades.find(u => u.id === eq.unidade_id);
                    const chamadosAbertosEq = chamados.filter(c => c.equipamento_id === eq.id && c.status !== 'CONCLUIDO');
                    
                    return (
                      <TableRow key={eq.id}>
                        <TableCell className="font-medium text-xs">{uni ? uni.nome : `Unidade #${eq.unidade_id}`}</TableCell>
                        <TableCell className="font-semibold text-xs text-slate-900 dark:text-slate-100">{eq.nome}</TableCell>
                        <TableCell><Badge variant="outline">{eq.numero_serie || 'Sem Patrimônio'}</Badge></TableCell>
                        <TableCell className="text-xs text-slate-500">{eq.data_ultima_preventiva || 'Não registrada'}</TableCell>
                        <TableCell>
                          {chamadosAbertosEq.length > 0 ? (
                            <Badge variant="destructive"><Wrench className="h-3 w-3" /> Chamado Ativo</Badge>
                          ) : (
                            <Badge variant="success"><Check className="h-3 w-3" /> Operacional</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {(isAdmin || isGestor) && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleAbrirEditarEquipamento(eq)}
                                className="h-7 text-xs"
                              >
                                <Edit2 className="h-3 w-3 mr-1" /> Editar
                              </Button>
                            )}
                            {!isGestor && !isTecnico && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleAbrirAgendamentoPreventiva(eq)}
                                className="h-7 text-xs border-cyan-200 text-cyan-700 dark:border-cyan-800 dark:text-cyan-300"
                              >
                                <CalendarCheck className="h-3.5 w-3.5 mr-1" /> Preventiva
                              </Button>
                            )}
                          </div>
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

      {/* Modal Novo Equipamento */}
      {modalEquipamentoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in-0 duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 relative">
            <button onClick={() => setModalEquipamentoOpen(false)} className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-base font-bold font-display text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Plus className="h-4 w-4 text-teal-600" /> Cadastrar Novo Equipamento
            </h3>
            <form onSubmit={handleSubmitEquipamento} className="mt-4 space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold">Unidade de Saúde Alocada *</label>
                <select 
                  className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs dark:border-slate-800 dark:bg-slate-900"
                  value={eqUnidadeId}
                  onChange={e => setEqUnidadeId(Number(e.target.value))}
                  required
                >
                  {unidades.map(u => (
                    <option key={u.id} value={u.id}>{u.nome} ({u.tipo})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold">Nome / Modelo do Equipamento *</label>
                <Input 
                  type="text" 
                  placeholder="Ex: Cadeira Odontológica Kavo Unik"
                  value={eqNome}
                  onChange={e => setEqNome(e.target.value)}
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold">Número de Patrimônio</label>
                <Input 
                  type="text" 
                  placeholder="Ex: PAT-2024-001 (Opcional)"
                  value={eqNumeroSerie}
                  onChange={e => setEqNumeroSerie(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold">Data da Última Preventiva</label>
                <Input 
                  type="date" 
                  value={eqDataPreventiva}
                  onChange={e => setEqDataPreventiva(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setModalEquipamentoOpen(false)}>Cancelar</Button>
                <Button type="submit" size="sm">Cadastrar Equipamento</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Equipamento */}
      {modalEditEquipamentoOpen && equipamentoEdicao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in-0 duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 relative">
            <button onClick={() => setModalEditEquipamentoOpen(false)} className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-base font-bold font-display text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Edit2 className="h-4 w-4 text-teal-600" /> Editar Equipamento #{equipamentoEdicao.id}
            </h3>
            <form onSubmit={handleConfirmarEdicaoEquipamento} className="mt-4 space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold">Unidade de Saúde Alocada *</label>
                <select 
                  className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs dark:border-slate-800 dark:bg-slate-900"
                  value={editUnidadeId}
                  onChange={e => setEditUnidadeId(Number(e.target.value))}
                  required
                >
                  {unidades.map(u => (
                    <option key={u.id} value={u.id}>{u.nome} ({u.tipo})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold">Nome / Modelo *</label>
                <Input 
                  type="text" 
                  value={editNome}
                  onChange={e => setEditNome(e.target.value)}
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold">Número de Patrimônio</label>
                <Input 
                  type="text" 
                  value={editNumeroSerie}
                  onChange={e => setEditNumeroSerie(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold">Data da Última Preventiva</label>
                <Input 
                  type="date" 
                  value={editDataPreventiva}
                  onChange={e => setEditDataPreventiva(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setModalEditEquipamentoOpen(false)}>Cancelar</Button>
                <Button type="submit" size="sm">Salvar Alterações</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Abrir Chamado */}
      {(modalChamadoOpen || modalPreventivaOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in-0 duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 relative">
            <button onClick={() => { setModalChamadoOpen(false); setModalPreventivaOpen(false); }} className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-base font-bold font-display text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              {chTipo === 'PREVENTIVA' ? (
                <><CalendarCheck className="h-4 w-4 text-cyan-600" /> Agendar Manutenção Preventiva</>
              ) : (
                <><AlertTriangle className="h-4 w-4 text-rose-600" /> Abrir Chamado de Reparo (Corretiva)</>
              )}
            </h3>
            <form onSubmit={handleSubmitChamado} className="mt-4 space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold">Equipamento Alvo *</label>
                <select 
                  className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs dark:border-slate-800 dark:bg-slate-900"
                  value={chEquipamentoId}
                  onChange={e => setChEquipamentoId(Number(e.target.value))}
                  required
                >
                  {equipamentos
                    .filter(eq => !isSolicitante || !user?.unidade_id || eq.unidade_id === user.unidade_id)
                    .map(eq => {
                      const uni = unidades.find(u => u.id === eq.unidade_id);
                      return (
                        <option key={eq.id} value={eq.id}>
                          {!isSolicitante && uni?.nome ? `[${uni.nome}] ` : ''}{eq.nome}{eq.numero_serie ? ` (Patr: ${eq.numero_serie})` : ''}
                        </option>
                      );
                    })}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold">Tipo de Chamado *</label>
                <select 
                  className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs dark:border-slate-800 dark:bg-slate-900"
                  value={chTipo}
                  onChange={e => setChTipo(e.target.value as TipoChamado)}
                  required
                >
                  <option value="CORRETIVA">Corretiva (Conserto de Defeito / Avaria)</option>
                  <option value="PREVENTIVA">Preventiva (Calibração, Revisão Periódica)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold">Descrição do Defeito ou Serviço *</label>
                <textarea 
                  rows={3}
                  placeholder="Descreva o problema ou solicitação técnica..."
                  value={chDescricaoDefeito}
                  onChange={e => setChDescricaoDefeito(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold">Data Abertura *</label>
                  <Input 
                    type="date" 
                    value={chDataAbertura} 
                    onChange={e => setChDataAbertura(e.target.value)}
                    required
                    className="h-9 text-xs"
                  />
                </div>
                {!isSolicitante && (
                  <div className="space-y-1">
                    <label className="font-semibold">Custo Estimado (R$)</label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      value={chCustoReparo} 
                      onChange={e => setChCustoReparo(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => { setModalChamadoOpen(false); setModalPreventivaOpen(false); }}>Cancelar</Button>
                <Button type="submit" size="sm">Registrar Chamado</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Atualizar Status */}
      {chamadoEmEdicao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in-0 duration-150">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 relative">
            <button onClick={() => setChamadoEmEdicao(null)} className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-base font-bold font-display text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Wrench className="h-4 w-4 text-teal-600" /> Atualizar Chamado #{chamadoEmEdicao.id}
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              onUpdateStatusChamado(chamadoEmEdicao.id, novoStatus, parseFloat(novoCusto) || 0);
              setChamadoEmEdicao(null);
            }} className="mt-4 space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold">Novo Status *</label>
                <select 
                  className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs dark:border-slate-800 dark:bg-slate-900"
                  value={novoStatus}
                  onChange={e => setNovoStatus(e.target.value as StatusChamado)}
                  required
                >
                  <option value="ABERTO">Aberto (Aguardando Atendimento)</option>
                  <option value="EM_ANDAMENTO">Em Andamento (Com Técnico)</option>
                  <option value="CONCLUIDO">Concluído (Reparo Finalizado)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold">Custo Final do Reparo (R$)</label>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00" 
                  value={novoCusto} 
                  onChange={e => setNovoCusto(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setChamadoEmEdicao(null)}>Cancelar</Button>
                <Button type="submit" size="sm">Salvar Status</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
