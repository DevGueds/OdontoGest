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

  useEffect(() => {
    if (isSolicitante && user?.unidade_id) {
      setUnidadeFiltro(user.unidade_id);
    }
  }, [isSolicitante, user]);

  const [unidadeFiltro, setUnidadeFiltro] = useState<number | 'TODAS'>('TODAS');
  const [equipamentoSelecionadoId, setEquipamentoSelecionadoId] = useState<number | 'TODOS'>('TODOS');
  
  // Modais
  const [modalEquipamentoOpen, setModalEquipamentoOpen] = useState(false);
  const [modalEditEquipamentoOpen, setModalEditEquipamentoOpen] = useState(false);
  const [modalChamadoOpen, setModalChamadoOpen] = useState(false);
  const [modalPreventivaOpen, setModalPreventivaOpen] = useState(false);
  const [equipamentoPreventiva, setEquipamentoPreventiva] = useState<Equipamento | null>(null);

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

  // Estado para colapsar/expandir alertas de preventiva
  const [alertasExpandidos, setAlertasExpandidos] = useState(false);

  // Form Chamado Corretiva/Preventiva
  const [chEquipamentoId, setChEquipamentoId] = useState<number>(equipamentos[0]?.id || 1);
  const [chTipo, setChTipo] = useState<TipoChamado>('CORRETIVA');
  const [chDescricaoDefeito, setChDescricaoDefeito] = useState('');
  const [chCustoReparo, setChCustoReparo] = useState('');
  const [chStatus, setChStatus] = useState<StatusChamado>('ABERTO');
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
    
    // Regra Rígida de Negócio: Técnico de Manutenção só pode visualizar o chamado se o Administrador tiver aprovado
    if (isTecnico) {
      return ch.status === 'APROVADO_ADM' || ch.status === 'EM_ANDAMENTO' || ch.status === 'CONCLUIDO' || ch.aprovado_adm === true;
    }

    return true;
  });

  // Regra Automatizada de Manutenção Preventiva:
  // Alerta apenas equipamentos que não possuem chamados ativos E que nunca fizeram preventiva ou estão há mais de 180 dias sem preventiva
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
      case 'ABERTO': return <span className="badge badge-amber"><i className="fa-solid fa-clock"></i> Aberto (Aguardando ADM)</span>;
      case 'APROVADO_ADM': return <span className="badge badge-cyan"><i className="fa-solid fa-thumbs-up"></i> Aprovado p/ Técnico</span>;
      case 'EM_ANDAMENTO': return <span className="badge badge-purple"><i className="fa-solid fa-screwdriver-wrench"></i> Em Execução</span>;
      case 'CONCLUIDO': return <span className="badge badge-emerald"><i className="fa-solid fa-circle-check"></i> Concluído</span>;
      case 'RECUSADO': return <span className="badge badge-rose"><i className="fa-solid fa-xmark"></i> Recusado ADM</span>;
      default: return <span className="badge badge-secondary">{st}</span>;
    }
  };

  return (
    <div className="panel-stack">
      {/* Alertas Automatizados de Manutenção Preventiva (Compacto e Colapsável) */}
      {alertasPreventivaAutomated.length > 0 && (
        <div className="card" style={{ borderLeft: '4px solid var(--cyan)', background: 'rgba(6, 182, 212, 0.04)', padding: '0.8rem 1.2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <i className="fa-solid fa-shield-heart text-cyan" style={{ fontSize: '1.2rem' }}></i>
              <strong style={{ color: 'var(--cyan)', fontSize: '0.95rem' }}>
                Sugestões de Manutenção Preventiva ({alertasPreventivaAutomated.length} equipamento{alertasPreventivaAutomated.length > 1 ? 's' : ''})
              </strong>
            </div>
            <button 
              type="button" 
              className="btn btn-outline btn-sm"
              style={{ borderColor: 'var(--cyan)', color: 'var(--cyan)', padding: '0.3rem 0.8rem' }}
              onClick={() => setAlertasExpandidos(!alertasExpandidos)}
            >
              <i className={`fa-solid fa-chevron-${alertasExpandidos ? 'up' : 'down'}`}></i>{' '}
              {alertasExpandidos ? 'Ocultar Sugestões' : 'Ver Sugestões'}
            </button>
          </div>

          {alertasExpandidos && (
            <div style={{ marginTop: '0.8rem', maxHeight: '220px', overflowY: 'auto', display: 'grid', gap: '0.5rem', paddingRight: '4px' }}>
              {alertasPreventivaAutomated.map((item, idx) => (
                <div key={idx} style={{ 
                  background: 'var(--bg-card)', 
                  padding: '0.6rem 0.9rem', 
                  borderRadius: '6px', 
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.8rem',
                  flexWrap: 'wrap'
                }}>
                  <div>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      <i className="fa-solid fa-hospital text-muted"></i> {item.unidade?.nome} — {item.equipamento.nome}{item.equipamento.numero_serie ? ` (Patrimônio: ${item.equipamento.numero_serie})` : ''}
                    </strong>
                    <p style={{ margin: '0.1rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {item.mensagem}
                    </p>
                  </div>

                  <button 
                    className="btn btn-outline btn-sm"
                    style={{ borderColor: 'var(--cyan)', color: 'var(--cyan)', fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
                    onClick={() => handleAbrirAgendamentoPreventiva(item.equipamento)}
                  >
                    <i className="fa-solid fa-calendar-check"></i> Agendar Checkup
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Gestão de Equipamentos e Chamados */}
      <div className="card">
        <div className="card-header flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3><i className="fa-solid fa-tooth text-primary"></i> Gestão de Equipamentos & Chamados de Manutenção</h3>
            <p className="text-muted text-sm">Controle de equipamentos odontológicos por Unidade de Saúde, registro de chamados de reparo (corretiva) e preventiva periódica.</p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {(isAdmin || isGestor) && (
              <button className="btn btn-secondary" onClick={() => setModalEquipamentoOpen(true)}>
                <i className="fa-solid fa-plus"></i> Cadastrar Equipamento
              </button>
            )}
            {!isTecnico && (
              <button className="btn btn-primary" onClick={() => setModalChamadoOpen(true)}>
                <i className="fa-solid fa-triangle-exclamation"></i> Abrir Chamado de Reparo
              </button>
            )}
            {isGestor && (
              <span className="badge badge-cyan" style={{ padding: '0.5rem 1rem' }}>
                <i className="fa-solid fa-eye"></i> Visualização em Modo Somente Leitura
              </span>
            )}
          </div>
        </div>

        <div className="card-body">
          {/* Filtros */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
            <div style={{ minWidth: '220px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Filtrar por Unidade:</label>
              <select 
                className="form-control"
                value={isSolicitante && user?.unidade_id ? user.unidade_id : unidadeFiltro}
                onChange={e => {
                  setUnidadeFiltro(e.target.value === 'TODAS' ? 'TODAS' : Number(e.target.value));
                  setEquipamentoSelecionadoId('TODOS');
                }}
                disabled={isSolicitante && Boolean(user?.unidade_id)}
              >
                {!isSolicitante && <option value="TODAS">🏥 Todas as Unidades de Saúde</option>}
                {unidades
                  .filter(u => !isSolicitante || !user?.unidade_id || u.id === user.unidade_id)
                  .map(u => (
                    <option key={u.id} value={u.id}>{u.nome} ({u.tipo})</option>
                  ))}
              </select>
              {isSolicitante && Boolean(user?.unidade_id) && (
                <small className="text-muted" style={{ display: 'block', marginTop: '3px' }}>
                  <i className="fa-solid fa-lock" style={{ marginRight: '4px' }}></i>
                  Unidade fixada conforme seu cadastro.
                </small>
              )}
            </div>

            <div style={{ minWidth: '240px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Filtrar por Equipamento:</label>
              <select 
                className="form-control"
                value={equipamentoSelecionadoId}
                onChange={e => setEquipamentoSelecionadoId(e.target.value === 'TODOS' ? 'TODOS' : Number(e.target.value))}
              >
                <option value="TODOS">🛠️ Todos os Equipamentos</option>
                {equipamentos.filter(eq => unidadeFiltro === 'TODAS' || eq.unidade_id === unidadeFiltro).map(eq => (
                  <option key={eq.id} value={eq.id}>{eq.nome}{eq.numero_serie ? ` (Patrimônio: ${eq.numero_serie})` : ''}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabela de Equipamentos */}
          <h4 style={{ marginBottom: '0.8rem' }}><i className="fa-solid fa-boxes-stacked"></i> Equipamentos Instalados</h4>
          <div className="table-responsive margin-bottom-lg">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Unidade de Saúde</th>
                  <th>Equipamento</th>
                  <th>Número de Patrimônio</th>
                  <th>Última Preventiva</th>
                  <th>Status de Manutenção</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {equipamentosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-muted" style={{ padding: '1.5rem' }}>Nenhum equipamento cadastrado.</td>
                  </tr>
                ) : (
                  equipamentosFiltrados.map(eq => {
                    const uni = unidades.find(u => u.id === eq.unidade_id);
                    const chamadosAbertosEq = chamados.filter(c => c.equipamento_id === eq.id && c.status !== 'CONCLUIDO');
                    
                    return (
                      <tr key={eq.id}>
                        <td><strong>{uni ? uni.nome : `Unidade #${eq.unidade_id}`}</strong></td>
                        <td><strong>{eq.nome}</strong></td>
                        <td><span className="badge badge-secondary">{eq.numero_serie || 'Sem Patrimônio'}</span></td>
                        <td>{eq.data_ultima_preventiva || 'Não registrada'}</td>
                        <td>
                          {chamadosAbertosEq.length > 0 ? (
                            <span className="badge badge-rose"><i className="fa-solid fa-wrench"></i> Chamado Ativo</span>
                          ) : (
                            <span className="badge badge-emerald"><i className="fa-solid fa-check"></i> Operacional</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button 
                              className="btn btn-outline btn-sm"
                              title="Editar dados do equipamento / patrimônio"
                              onClick={() => handleAbrirEditarEquipamento(eq)}
                            >
                              <i className="fa-solid fa-pen-to-square"></i> Editar
                            </button>
                            {!isGestor && !isTecnico && (
                              <button 
                                className="btn btn-outline btn-sm"
                                title="Agendar manutenção preventiva"
                                onClick={() => handleAbrirAgendamentoPreventiva(eq)}
                              >
                                <i className="fa-solid fa-calendar-check"></i> Preventiva
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Tabela de Chamados de Manutenção */}
          <h4 style={{ marginBottom: '0.8rem' }}><i className="fa-solid fa-clipboard-list"></i> Histórico de Chamados de Reparo (Corretiva & Preventiva)</h4>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Unidade de Saúde</th>
                  <th>Equipamento</th>
                  <th>Tipo</th>
                  <th>Descrição do Defeito / Serviço</th>
                  <th>Data Abertura</th>
                  <th>Custo do Reparo (R$)</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {chamadosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center text-muted" style={{ padding: '1.5rem' }}>
                      {isTecnico 
                        ? 'Nenhum chamado de manutenção aprovado pela administração no momento.'
                        : 'Nenhum chamado de manutenção registrado.'}
                    </td>
                  </tr>
                ) : (
                  chamadosFiltrados.map(ch => {
                    const uni = unidades.find(u => u.id === ch.unidade_id);
                    const eq = equipamentos.find(e => e.id === ch.equipamento_id);

                    return (
                      <tr key={ch.id}>
                        <td><strong>#{ch.id}</strong></td>
                        <td><strong>{uni ? uni.nome : `Unidade #${ch.unidade_id}`}</strong></td>
                        <td>{eq ? eq.nome : `Equip. #${ch.equipamento_id}`}</td>
                        <td>
                          <span className={`badge ${ch.tipo === 'PREVENTIVA' ? 'badge-cyan' : 'badge-amber'}`}>
                            {ch.tipo === 'PREVENTIVA' ? 'Preventiva' : 'Corretiva'}
                          </span>
                        </td>
                        <td>{ch.descricao_defeito}</td>
                        <td>{ch.data_abertura}</td>
                        <td style={{ fontWeight: 700 }}>{formatarMoeda(ch.custo_reparo)}</td>
                        <td>{renderBadgeStatus(ch.status)}</td>
                        <td>
                          {/* Ações para ADMINISTRADOR (Aprovar chamados pendentes) */}
                          {isAdmin && ch.status === 'ABERTO' && (
                            <div className="btn-group">
                              <button 
                                className="btn btn-emerald btn-sm"
                                onClick={() => onAprovarChamado && onAprovarChamado(ch.id, true)}
                                title="Aprovar Manutenção e Liberar para Técnico"
                              >
                                <i className="fa-solid fa-check"></i> Aprovar (Liberar p/ Técnico)
                              </button>
                              <button 
                                className="btn btn-rose btn-sm"
                                onClick={() => onAprovarChamado && onAprovarChamado(ch.id, false)}
                                title="Recusar Chamado"
                              >
                                <i className="fa-solid fa-xmark"></i> Recusar
                              </button>
                            </div>
                          )}

                          {/* Ações para TÉCNICO ou ADMIN (Atualizar chamados aprovados) */}
                          {(isTecnico || isAdmin) && (ch.status === 'APROVADO_ADM' || ch.status === 'EM_ANDAMENTO') && (
                            <button 
                              className="btn btn-primary btn-sm"
                              onClick={() => {
                                setChamadoEmEdicao(ch);
                                setNovoStatus('EM_ANDAMENTO');
                                setNovoCusto(String(ch.custo_reparo || ''));
                              }}
                            >
                              <i className="fa-solid fa-wrench"></i> Atualizar Status / Concluir
                            </button>
                          )}

                          {ch.status === 'CONCLUIDO' && (
                            <span className="text-muted text-sm"><i className="fa-solid fa-check"></i> Reparo Finalizado</span>
                          )}

                          {isGestor && ch.status !== 'CONCLUIDO' && (
                            <span className="text-muted text-sm"><i className="fa-solid fa-lock"></i> Somente Leitura</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Novo Equipamento */}
      {modalEquipamentoOpen && (
        <div className="modal active">
          <div className="modal-content">
            <div className="modal-header">
              <h3><i className="fa-solid fa-tooth"></i> Cadastrar Novo Equipamento</h3>
              <button className="modal-close" onClick={() => setModalEquipamentoOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmitEquipamento}>
                <div className="form-group">
                  <label>Unidade de Saúde Alocada *</label>
                  <select 
                    className="form-control"
                    value={eqUnidadeId}
                    onChange={e => setEqUnidadeId(Number(e.target.value))}
                    required
                  >
                    {unidades.map(u => (
                      <option key={u.id} value={u.id}>{u.nome} ({u.tipo})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group margin-top-sm">
                  <label>Nome / Modelo do Equipamento *</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Ex: Cadeira Odontológica Kavo Unik, Autoclave Cristófoli 21L"
                    value={eqNome}
                    onChange={e => setEqNome(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group margin-top-sm">
                  <label>Número de Patrimônio</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Ex: PAT-2024-001 ou 09823 (Opcional)"
                    value={eqNumeroSerie}
                    onChange={e => setEqNumeroSerie(e.target.value)}
                  />
                </div>

                <div className="form-group margin-top-sm">
                  <label>Data da Última Manutenção Preventiva</label>
                  <input 
                    type="date" 
                    className="form-control"
                    value={eqDataPreventiva}
                    onChange={e => setEqDataPreventiva(e.target.value)}
                  />
                </div>

                <div className="form-actions margin-top-md">
                  <button type="button" className="btn btn-secondary" onClick={() => setModalEquipamentoOpen(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">Cadastrar Equipamento</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Equipamento */}
      {modalEditEquipamentoOpen && equipamentoEdicao && (
        <div className="modal active">
          <div className="modal-content">
            <div className="modal-header">
              <h3><i className="fa-solid fa-pen-to-square text-primary"></i> Editar Equipamento #{equipamentoEdicao.id}</h3>
              <button className="modal-close" onClick={() => setModalEditEquipamentoOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleConfirmarEdicaoEquipamento}>
                <div className="form-group">
                  <label>Unidade de Saúde Alocada *</label>
                  <select 
                    className="form-control"
                    value={editUnidadeId}
                    onChange={e => setEditUnidadeId(Number(e.target.value))}
                    required
                  >
                    {unidades.map(u => (
                      <option key={u.id} value={u.id}>{u.nome} ({u.tipo})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group margin-top-sm">
                  <label>Nome / Modelo do Equipamento *</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={editNome}
                    onChange={e => setEditNome(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group margin-top-sm">
                  <label>Número de Patrimônio (Opcional)</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Ex: PAT-2024-001 ou 09823 (Opcional)"
                    value={editNumeroSerie}
                    onChange={e => setEditNumeroSerie(e.target.value)}
                  />
                  <small className="text-muted" style={{ display: 'block', marginTop: '4px' }}>
                    Cadastre ou atualize o número de patrimônio deste equipamento.
                  </small>
                </div>

                <div className="form-group margin-top-sm">
                  <label>Data da Última Manutenção Preventiva</label>
                  <input 
                    type="date" 
                    className="form-control"
                    value={editDataPreventiva}
                    onChange={e => setEditDataPreventiva(e.target.value)}
                  />
                </div>

                <div className="form-actions margin-top-md">
                  <button type="button" className="btn btn-secondary" onClick={() => setModalEditEquipamentoOpen(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">Salvar Alterações</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Abrir Chamado de Reparo / Manutenção */}
      {(modalChamadoOpen || modalPreventivaOpen) && (
        <div className="modal active">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                <i className={`fa-solid ${chTipo === 'PREVENTIVA' ? 'fa-calendar-check text-cyan' : 'fa-triangle-exclamation text-rose'}`}></i>{' '}
                {chTipo === 'PREVENTIVA' ? 'Agendar Checagem / Manutenção Preventiva' : 'Abrir Chamado de Reparo (Manutenção Corretiva)'}
              </h3>
              <button className="modal-close" onClick={() => { setModalChamadoOpen(false); setModalPreventivaOpen(false); }}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmitChamado}>
                <div className="form-group">
                  <label>Equipamento Alvo *</label>
                  <select 
                    className="form-control"
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
                            [{uni?.nome}] {eq.nome}{eq.numero_serie ? ` (Patrimônio: ${eq.numero_serie})` : ''}
                          </option>
                        );
                      })}
                  </select>
                </div>

                <div className="form-group margin-top-sm">
                  <label>Tipo de Chamado *</label>
                  <select 
                    className="form-control"
                    value={chTipo}
                    onChange={e => setChTipo(e.target.value as TipoChamado)}
                    required
                  >
                    <option value="CORRETIVA">Corretiva (Conserto de Defeito / Avaria)</option>
                    <option value="PREVENTIVA">Preventiva (Calibração, Recrevisão & Lubrificação)</option>
                  </select>
                </div>

                <div className="form-group margin-top-sm">
                  <label>Descrição do Defeito ou Serviço Solicitado *</label>
                  <textarea 
                    className="form-control"
                    rows={3}
                    placeholder="Descreva o problema encontrado (ex: vazamento de ar no pedal, aquecimento no compressor...)"
                    value={chDescricaoDefeito}
                    onChange={e => setChDescricaoDefeito(e.target.value)}
                    required
                  />
                </div>

                <div className="form-grid margin-top-sm">
                  <div className="form-group">
                    <label>Data de Abertura *</label>
                    <input 
                      type="date"
                      className="form-control"
                      value={chDataAbertura}
                      onChange={e => setChDataAbertura(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Estimativa de Custo do Reparo (R$)</label>
                    <input 
                      type="number"
                      step="0.01"
                      className="form-control"
                      placeholder="0.00"
                      value={chCustoReparo}
                      onChange={e => setChCustoReparo(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-actions margin-top-md">
                  <button type="button" className="btn btn-secondary" onClick={() => { setModalChamadoOpen(false); setModalPreventivaOpen(false); }}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">Registrar Chamado</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Atualizar Status do Chamado */}
      {chamadoEmEdicao && (
        <div className="modal active">
          <div className="modal-content">
            <div className="modal-header">
              <h3><i className="fa-solid fa-pen"></i> Atualizar Status do Chamado #{chamadoEmEdicao.id}</h3>
              <button className="modal-close" onClick={() => setChamadoEmEdicao(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={(e) => {
                e.preventDefault();
                onUpdateStatusChamado(chamadoEmEdicao.id, novoStatus, parseFloat(novoCusto) || 0);
                setChamadoEmEdicao(null);
              }}>
                <div className="form-group">
                  <label>Novo Status do Chamado *</label>
                  <select 
                    className="form-control"
                    value={novoStatus}
                    onChange={e => setNovoStatus(e.target.value as StatusChamado)}
                    required
                  >
                    <option value="ABERTO">Aberto (Aguardando Atendimento)</option>
                    <option value="EM_ANDAMENTO">Em Andamento (Com Técnico/Oficina)</option>
                    <option value="CONCLUIDO">Concluído (Reparo Finalizado)</option>
                  </select>
                </div>

                <div className="form-group margin-top-sm">
                  <label>Custo Final do Reparo (R$)</label>
                  <input 
                    type="number"
                    step="0.01"
                    className="form-control"
                    placeholder="0.00"
                    value={novoCusto}
                    onChange={e => setNovoCusto(e.target.value)}
                  />
                </div>

                <div className="form-actions margin-top-md">
                  <button type="button" className="btn btn-secondary" onClick={() => setChamadoEmEdicao(null)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">Salvar Status</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
