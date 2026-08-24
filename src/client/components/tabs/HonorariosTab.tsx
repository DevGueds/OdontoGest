import React, { useState } from 'react';
import { UnidadeSaude, HonorarioOdontologo, PerfilUsuario } from '../../types';

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
    <div className="panel-stack">
      {/* KPI Cards Honorários */}
      <div className="kpi-grid">
        <div className="kpi-card kpi-blue">
          <div className="kpi-icon"><i className="fa-solid fa-user-doctor"></i></div>
          <div className="kpi-info">
            <span className="kpi-title">Dentistas Cadastrados</span>
            <h3 className="kpi-value">{honorariosFiltrados.length}</h3>
            <span className="kpi-sub">Total de Prestadores e Efetivos</span>
          </div>
        </div>

        <div className="kpi-card kpi-purple">
          <div className="kpi-icon"><i className="fa-solid fa-file-invoice-dollar"></i></div>
          <div className="kpi-info">
            <span className="kpi-title">Total Salários Fixos</span>
            <h3 className="kpi-value">{formatarMoeda(totalFixos)}</h3>
            <span className="kpi-sub">Folha Base de Pagamentos</span>
          </div>
        </div>

        <div className="kpi-card kpi-emerald">
          <div className="kpi-icon"><i className="fa-solid fa-coins"></i></div>
          <div className="kpi-info">
            <span className="kpi-title">Comissões & Plantões</span>
            <h3 className="kpi-value">{formatarMoeda(totalComissoes)}</h3>
            <span className="kpi-sub">Variável por Procedimento</span>
          </div>
        </div>

        <div className="kpi-card kpi-rose">
          <div className="kpi-icon"><i className="fa-solid fa-vault"></i></div>
          <div className="kpi-info">
            <span className="kpi-title">Total Honorários Odontólogos</span>
            <h3 className="kpi-value">{formatarMoeda(totalGeralHonorarios)}</h3>
            <span className="kpi-sub">Custo Total de Pessoal</span>
          </div>
        </div>
      </div>

      {/* Main Honorários Panel */}
      <div className="card">
        <div className="card-header flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3><i className="fa-solid fa-user-doctor text-primary"></i> Gestão de Salários e Honorários dos Odontólogos</h3>
            <p className="text-muted text-sm">{isReadOnly ? 'Visualização em Modo Somente Leitura (Gestor)' : 'Controle de despesas de pessoal e folha odontológica'}</p>
          </div>

          {!isReadOnly ? (
            <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
              <i className="fa-solid fa-plus"></i> Registrar Honorário / Salário
            </button>
          ) : (
            <span className="badge badge-cyan" style={{ padding: '0.5rem 1rem' }}>
              <i className="fa-solid fa-eye"></i> Somente Leitura
            </span>
          )}
        </div>

        <div className="card-body">
          {/* Controls & Filter bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Filtrar por Unidade:</label>
              <select 
                className="form-control"
                value={unidadeFiltro}
                onChange={e => setUnidadeFiltro(e.target.value === 'TODAS' ? 'TODAS' : Number(e.target.value))}
                style={{ minWidth: '220px', padding: '0.45rem 0.85rem' }}
              >
                <option value="TODAS">🏥 Todas as Unidades de Saúde</option>
                {unidades.map(u => (
                  <option key={u.id} value={u.id}>{u.nome} ({u.tipo})</option>
                ))}
              </select>
            </div>

            <div style={{ minWidth: '220px' }}>
              <input 
                type="text" 
                className="form-control"
                placeholder="🔍 Pesquisar por dentista ou CRO..."
                value={buscaDentista}
                onChange={e => setBuscaDentista(e.target.value)}
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Unidade de Saúde</th>
                  <th>Cirurgião Dentista</th>
                  <th>CRO</th>
                  <th>Mês Ref.</th>
                  <th className="text-right">Valor Fixo (R$)</th>
                  <th className="text-right">Comissões / Extra (R$)</th>
                  <th className="text-right">Total Honorário (R$)</th>
                </tr>
              </thead>
              <tbody>
                {honorariosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-muted" style={{ padding: '2rem' }}>
                      Nenhum registro de honorário/salário encontrado.
                    </td>
                  </tr>
                ) : (
                  honorariosFiltrados.map(h => {
                    const uni = unidades.find(u => u.id === h.unidade_id);
                    return (
                      <tr key={h.id}>
                        <td><strong>{uni ? uni.nome : `Unidade #${h.unidade_id}`}</strong></td>
                        <td>
                          <strong>{h.nome_dentista}</strong>
                          {h.observacoes && <small className="text-muted" style={{ display: 'block' }}>{h.observacoes}</small>}
                        </td>
                        <td><span className="badge badge-blue">{h.cro}</span></td>
                        <td><strong>{h.mes_referencia}</strong></td>
                        <td className="text-right">{formatarMoeda(h.valor_fixo)}</td>
                        <td className="text-right">{formatarMoeda(h.valor_comissao)}</td>
                        <td className="text-right" style={{ color: 'var(--emerald)', fontWeight: 800 }}>
                          {formatarMoeda(h.valor_total)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr style={{ background: 'rgba(2, 132, 199, 0.08)', fontWeight: 'bold' }}>
                  <td colSpan={4}>TOTAL DOS HONORÁRIOS CONSOLIDADO:</td>
                  <td className="text-right">{formatarMoeda(totalFixos)}</td>
                  <td className="text-right">{formatarMoeda(totalComissoes)}</td>
                  <td className="text-right" style={{ fontSize: '1.05rem', color: 'var(--emerald)' }}>
                    {formatarMoeda(totalGeralHonorarios)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Registrar Honorário */}
      {modalOpen && (
        <div className="modal active">
          <div className="modal-content">
            <div className="modal-header">
              <h3><i className="fa-solid fa-user-doctor"></i> Registrar Salário / Honorário de Odontólogo</h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Unidade de Saúde Alocada *</label>
                  <select 
                    className="form-control" 
                    value={unidadeId} 
                    onChange={e => setUnidadeId(Number(e.target.value))}
                    required
                  >
                    {unidades.map(u => (
                      <option key={u.id} value={u.id}>{u.nome} ({u.tipo})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group margin-top-sm">
                  <label>Nome Completo do Cirurgião Dentista *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Ex: Dra. Maria Fernanda Silva"
                    value={nomeDentista}
                    onChange={e => setNomeDentista(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group margin-top-sm">
                  <label>Registro Profissional (CRO) (Opcional)</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Ex: CRO/PA 0592"
                    value={cro}
                    onChange={e => setCro(e.target.value)}
                  />
                </div>

                <div className="form-group margin-top-sm">
                  <label>Mês de Referência *</label>
                  <input 
                    type="month" 
                    className="form-control"
                    value={mesReferencia}
                    onChange={e => setMesReferencia(e.target.value)}
                    required
                  />
                </div>

                <div className="form-grid margin-top-sm">
                  <div className="form-group">
                    <label>Valor Fixo (R$)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      className="form-control" 
                      placeholder="0.00"
                      value={valorFixo}
                      onChange={e => setValorFixo(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Comissão / Horas Extras (R$)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      className="form-control" 
                      placeholder="0.00"
                      value={valorComissao}
                      onChange={e => setValorComissao(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group margin-top-sm">
                  <label>Observações / Procedimentos Atendidos</label>
                  <textarea 
                    className="form-control" 
                    rows={2}
                    placeholder="Detalhes sobre a produção, procedimentos efetuados ou plantões..."
                    value={observacoes}
                    onChange={e => setObservacoes(e.target.value)}
                  />
                </div>

                <div className="form-actions margin-top-md">
                  <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">Salvar Honorário</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
