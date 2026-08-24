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
    <div className="panel-stack">
      {/* Resumo de Saldos e Fluxo Orçamentário */}
      <div className="card" style={{ borderLeft: '5px solid var(--primary)' }}>
        <div className="card-header flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3><i className="fa-solid fa-sack-dollar text-primary"></i> Visão Geral das Entradas & Saldos Segregados</h3>
            <p className="text-muted text-sm">Entradas de recursos cadastrados (Aportes/Repasses) deduzidos das saídas reais consolidadas (Insumos + RH + Manutenção).</p>
          </div>
          <span className="badge badge-cyan"><i className="fa-solid fa-building-columns"></i> Gestão de Recursos SMS</span>
        </div>

        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.2rem' }}>
            {/* Card Custeio */}
            <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '1.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                <strong style={{ color: 'var(--primary)', fontSize: '1.05rem' }}>
                  💳 FLUXO DE RECURSOS DE CUSTEIO
                </strong>
                <span className="badge badge-cyan">{saldos.percentualCusteioComprometido.toFixed(1)}% Comprometido</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0.4rem 0', fontSize: '0.9rem' }}>
                <span className="text-muted">(+) Entradas Cadastradas (Custeio):</span>
                <strong style={{ color: 'var(--emerald)' }}>{formatarMoeda(saldos.orcamentoCusteioTotal)}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0.4rem 0', fontSize: '0.9rem' }}>
                <span className="text-muted">(-) Total Saídas (Pedidos + RH + Manut.):</span>
                <strong style={{ color: 'var(--rose)' }}>{formatarMoeda(saldos.gastoCusteioTotal)}</strong>
              </div>

              <div style={{ height: '1px', background: '#cbd5e1', margin: '0.75rem 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.1rem', fontWeight: 800 }}>
                <span>(=) SALDO DE CUSTEIO DISPONÍVEL:</span>
                <span style={{ color: saldos.saldoCusteioDisponivel >= 0 ? 'var(--emerald)' : 'var(--rose)' }}>
                  {formatarMoeda(saldos.saldoCusteioDisponivel)}
                </span>
              </div>
            </div>

            {/* Card Investimento */}
            <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '1.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                <strong style={{ color: 'var(--purple)', fontSize: '1.05rem' }}>
                  🏗️ FLUXO DE RECURSOS DE INVESTIMENTO
                </strong>
                <span className="badge badge-purple">{saldos.percentualInvestimentoComprometido.toFixed(1)}% Comprometido</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0.4rem 0', fontSize: '0.9rem' }}>
                <span className="text-muted">(+) Entradas Cadastradas (Investimento):</span>
                <strong style={{ color: 'var(--emerald)' }}>{formatarMoeda(saldos.orcamentoInvestimentoTotal)}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0.4rem 0', fontSize: '0.9rem' }}>
                <span className="text-muted">(-) Total Saídas (Equipamentos Permanentes):</span>
                <strong style={{ color: 'var(--rose)' }}>{formatarMoeda(saldos.gastoInvestimentoTotal)}</strong>
              </div>

              <div style={{ height: '1px', background: '#cbd5e1', margin: '0.75rem 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.1rem', fontWeight: 800 }}>
                <span>(=) SALDO DE INVESTIMENTO DISPONÍVEL:</span>
                <span style={{ color: saldos.saldoInvestimentoDisponivel >= 0 ? 'var(--purple)' : 'var(--rose)' }}>
                  {formatarMoeda(saldos.saldoInvestimentoDisponivel)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Formulário de Novo Lançamento de Entrada */}
      {!isReadOnly && (
        <div className="card">
          <div className="card-header">
            <h3><i className="fa-solid fa-plus-circle text-emerald"></i> Cadastrar Nova Entrada / Aporte Financeiro</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="ent_descricao">Descrição do Aporte / Repasse *</label>
                <input 
                  type="text" 
                  id="ent_descricao" 
                  className="form-control" 
                  placeholder="Ex: Repasse FNS Custeio Atenção Primária"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label htmlFor="ent_valor">Valor Total do Aporte (R$) *</label>
                <input 
                  type="number" 
                  step="0.01" 
                  id="ent_valor" 
                  className="form-control" 
                  placeholder="0.00"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label htmlFor="ent_natureza">Natureza do Saldo / Recurso *</label>
                <select 
                  id="ent_natureza" 
                  className="form-control"
                  value={natureza}
                  onChange={(e) => setNatureza(e.target.value as NaturezaDespesa)}
                  required
                >
                  <option value="CUSTEIO">💳 Custeio (Consumo / Operacional / RH / Manutenção)</option>
                  <option value="INVESTIMENTO">🏗️ Investimento (Bens Permanentes / Capital)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="ent_recorrencia">Tipo de Entrada *</label>
                <select 
                  id="ent_recorrencia" 
                  className="form-control"
                  value={tipoRecorrencia}
                  onChange={(e) => setTipoRecorrencia(e.target.value as TipoRecorrencia)}
                  required
                >
                  <option value="RECORRENTE">🔄 Recorrente (Repasse Mensal Ordinário)</option>
                  <option value="PARCELA_UNICA">⚡ Parcela Única (Emenda / Aporte Extra)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="ent_unidade">Destino / Unidade Beneficiada</label>
                <select 
                  id="ent_unidade" 
                  className="form-control"
                  value={unidadeId}
                  onChange={(e) => setUnidadeId(e.target.value)}
                >
                  <option value="">🌐 GLOBAL / Todas as Unidades (Fundo SMS)</option>
                  {unidades.map(u => (
                    <option key={u.id} value={u.id}>{u.nome} ({u.tipo})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="ent_data">Data do Crédito / Depósito *</label>
                <input 
                  type="date" 
                  id="ent_data" 
                  className="form-control"
                  value={dataCredito}
                  onChange={(e) => setDataCredito(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label htmlFor="ent_mes">Mês de Referência (YYYY-MM) *</label>
                <input 
                  type="month" 
                  id="ent_mes" 
                  className="form-control"
                  value={mesReferencia}
                  onChange={(e) => setMesReferencia(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label htmlFor="ent_obs">Observações / N° da Portaria</label>
                <input 
                  type="text" 
                  id="ent_obs" 
                  className="form-control"
                  placeholder="Ex: Portaria FNS N° 1.204/2026"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginTop: '1rem', textAlign: 'right' }}>
              <button type="submit" className="btn btn-emerald">
                <i className="fa-solid fa-check"></i> Registrar Entrada de Recursos
              </button>
            </div>
          </form>
        </div>
      </div>
      )}

      {/* Tabela de Histórico de Entradas Cadastradas */}
      <div className="card">
        <div className="card-header flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3><i className="fa-solid fa-list-check"></i> Histórico de Entradas & Repasses Registrados</h3>
            <p className="text-muted text-sm">Entradas de capital que compõem os orçamentos de Custeio e Investimento</p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Filtrar Natureza:</span>
            <select 
              className="form-control" 
              style={{ width: 'auto', padding: '4px 10px', fontSize: '0.85rem' }}
              value={filtroNatureza}
              onChange={(e) => setFiltroNatureza(e.target.value as any)}
            >
              <option value="TODOS">Todas as Naturezas</option>
              <option value="CUSTEIO">Apenas Custeio</option>
              <option value="INVESTIMENTO">Apenas Investimento</option>
            </select>
          </div>
        </div>

        <div className="card-body">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Descrição do Repasse / Aporte</th>
                  <th>Natureza</th>
                  <th>Recorrência</th>
                  <th>Destino</th>
                  <th>Data Crédito</th>
                  <th>Mês Ref.</th>
                  <th className="text-right">Valor Aporte (R$)</th>
                  <th className="text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {entradasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center text-muted" style={{ padding: '2rem' }}>
                      Nenhum aporte financeiro registrado para o filtro selecionado.
                    </td>
                  </tr>
                ) : (
                  entradasFiltradas.map(ent => {
                    const uni = unidades.find(u => u.id === ent.unidade_id);
                    return (
                      <tr key={ent.id}>
                        <td><strong>#{ent.id}</strong></td>
                        <td>
                          <strong>{ent.descricao}</strong>
                          {ent.observacoes && (
                            <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                              {ent.observacoes}
                            </div>
                          )}
                        </td>
                        <td>
                          {ent.natureza === 'INVESTIMENTO' ? (
                            <span className="badge badge-purple"><i className="fa-solid fa-building-columns"></i> Investimento</span>
                          ) : (
                            <span className="badge badge-cyan"><i className="fa-solid fa-receipt"></i> Custeio</span>
                          )}
                        </td>
                        <td>
                          {ent.tipo_recorrencia === 'RECORRENTE' ? (
                            <span className="badge badge-emerald"><i className="fa-solid fa-rotate"></i> Recorrente</span>
                          ) : (
                            <span className="badge badge-amber"><i className="fa-solid fa-bolt"></i> Parcela Única</span>
                          )}
                        </td>
                        <td>
                          {uni ? (
                            <span className="badge badge-blue">{uni.nome}</span>
                          ) : (
                            <span className="badge badge-cyan">GLOBAL (SMS)</span>
                          )}
                        </td>
                        <td>{formatarData(ent.data_credito)}</td>
                        <td><span className="badge badge-purple">{ent.mes_referencia}</span></td>
                        <td className="text-right" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--emerald)' }}>
                          {formatarMoeda(ent.valor)}
                        </td>
                        <td className="text-center">
                          {!isReadOnly ? (
                            <button 
                              className="btn btn-rose btn-sm" 
                              title="Remover Entrada"
                              onClick={() => {
                                if (confirm(`Deseja remover o aporte "${ent.descricao}" no valor de ${formatarMoeda(ent.valor)}?`)) {
                                  onDeleteEntrada(ent.id);
                                }
                              }}
                            >
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          ) : (
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
    </div>
  );
};
