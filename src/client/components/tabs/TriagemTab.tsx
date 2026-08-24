import React, { useState } from 'react';
import { PedidoPBS, UnidadeSaude, PerfilUsuario, StatusPedido } from '../../types';

interface Props {
  pedidos: PedidoPBS[];
  unidades: UnidadeSaude[];
  perfilAtual: PerfilUsuario;
  onAbrirFicha: (pedido: PedidoPBS) => void;
  onAbrirRecebimento: (pedido: PedidoPBS) => void;
  onAbrirAtendimento: (pedido: PedidoPBS) => void;
  onAbrirEnvio: (pedido: PedidoPBS) => void;
  formatarData: (d?: string | null) => string;
}

export const TriagemTab: React.FC<Props> = ({
  pedidos,
  unidades,
  perfilAtual,
  onAbrirFicha,
  onAbrirRecebimento,
  onAbrirAtendimento,
  onAbrirEnvio,
  formatarData
}) => {
  const isGestor = perfilAtual === 'GESTOR';
  const isAdmin = perfilAtual === 'ADMINISTRADOR';
  const isPrivilegiado = isGestor || isAdmin;
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');
  const [search, setSearch] = useState<string>('');

  const renderBadgeStatus = (status: StatusPedido) => {
    switch (status) {
      case 'SOLICITADO': return <span className="badge badge-amber"><i className="fa-solid fa-clock"></i> SOLICITADO</span>;
      case 'RECEBIDO': return <span className="badge badge-cyan"><i className="fa-solid fa-box-archive"></i> RECEBIDO</span>;
      case 'ATENDIDO_PARCIAL': return <span className="badge badge-purple"><i className="fa-solid fa-boxes-stacked"></i> ATENDIDO PARCIAL</span>;
      case 'ATENDIDO_TOTAL': return <span className="badge badge-emerald"><i className="fa-solid fa-check"></i> ATENDIDO TOTAL</span>;
      case 'ENVIADO': return <span className="badge badge-blue"><i className="fa-solid fa-truck"></i> ENVIADO</span>;
      case 'CANCELADO': return <span className="badge badge-rose"><i className="fa-solid fa-ban"></i> CANCELADO</span>;
      default: return <span className="badge badge-blue">{status}</span>;
    }
  };

  const filtrados = pedidos.filter(p => {
    if (filterStatus !== 'TODOS' && p.status !== filterStatus) return false;
    const u = unidades.find(uni => uni.id === p.unidade_emitente_id);
    const nomeUnidade = u ? u.nome.toLowerCase() : '';

    if (search) {
      const query = search.toLowerCase();
      const numPbs = p.numero_pbs.toLowerCase();
      const resp = p.responsavel_nome.toLowerCase();
      return numPbs.includes(query) || nomeUnidade.includes(query) || resp.includes(query);
    }
    return true;
  });

  return (
    <div className="card">
      <div className="card-header flex-between">
        <div>
          <h2>
            <i className="fa-solid fa-boxes-packing"></i>{' '}
            {isPrivilegiado ? 'Central de Atendimento & Triagem de Pedidos' : 'Meus Pedidos & Acompanhamento'}
          </h2>
          <p>
            {isAdmin 
              ? 'Receba solicitações das USFs, faça a conferência de itens e confirme o envio.' 
              : isGestor
              ? 'Acompanhe as solicitações das USFs e visualize o status de atendimento.'
              : 'Acompanhe a situação dos pedidos emitidos pela sua unidade de saúde.'}
          </p>
        </div>

        <div className="filter-controls">
          <select 
            className="form-control" 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="TODOS">Todos os Status</option>
            <option value="SOLICITADO">SOLICITADO (Pendente Receber)</option>
            <option value="RECEBIDO">RECEBIDO (Em Separação)</option>
            <option value="ATENDIDO_PARCIAL">ATENDIDO PARCIAL</option>
            <option value="ATENDIDO_TOTAL">ATENDIDO TOTAL</option>
            <option value="ENVIADO">ENVIADO (Despachado)</option>
            <option value="CANCELADO">CANCELADO</option>
          </select>

          <input 
            type="text" 
            className="form-control" 
            placeholder="Buscar por Nº PBS, USF..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card-body">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nº PBS</th>
                <th>Unidade Emitente</th>
                <th>Data Pedido</th>
                <th>Responsável USF</th>
                <th>Status Atual</th>
                <th>Recepção Almox.</th>
                <th>Envio / Despacho</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-muted">
                    Nenhuma solicitação localizada com os filtros atuais.
                  </td>
                </tr>
              ) : (
                filtrados.map(p => {
                  const u = unidades.find(uni => uni.id === p.unidade_emitente_id);
                  const nomeUnidade = u ? u.nome : `Unidade #${p.unidade_emitente_id}`;

                  const recInfo = p.apontador_recebimento_nome ? (
                    <>
                      <strong>{p.apontador_recebimento_nome}</strong>
                      <br />
                      <small className="text-muted"><i className="fa-regular fa-calendar"></i> {formatarData(p.data_recebimento)}</small>
                    </>
                  ) : (
                    <span className="text-muted"><i>Não recebido</i></span>
                  );

                  const envInfo = p.apontador_envio_nome ? (
                    <>
                      <strong>{p.apontador_envio_nome}</strong>
                      <br />
                      <small className="text-muted"><i className="fa-regular fa-calendar"></i> {formatarData(p.data_envio)}</small>
                    </>
                  ) : (
                    <span className="text-muted"><i>Não enviado</i></span>
                  );

                  return (
                    <tr key={p.id}>
                      <td><strong>{p.numero_pbs}</strong></td>
                      <td>{nomeUnidade}</td>
                      <td>{formatarData(p.data_pedido)}</td>
                      <td>
                        {p.responsavel_nome}
                        <br />
                        <small className="text-muted">{p.responsavel_registro || ''}</small>
                      </td>
                      <td>{renderBadgeStatus(p.status)}</td>
                      <td>{recInfo}</td>
                      <td>{envInfo}</td>
                      <td>
                        <div className="btn-group">
                          <button className="btn btn-outline btn-sm" onClick={() => onAbrirFicha(p)}>
                            <i className="fa-solid fa-print"></i> Ver Ficha
                          </button>

                          {isAdmin ? (
                            <>
                              {p.status === 'SOLICITADO' && (
                                <button className="btn btn-success btn-sm" onClick={() => onAbrirRecebimento(p)}>
                                  <i className="fa-solid fa-clipboard-check"></i> 1. Confirmar Recebimento
                                </button>
                              )}

                              {p.status === 'RECEBIDO' && (
                                <>
                                  <button className="btn btn-primary btn-sm" onClick={() => onAbrirAtendimento(p)}>
                                    <i className="fa-solid fa-boxes-packing"></i> 2. Conferir/Atender
                                  </button>
                                  <button className="btn btn-emerald btn-sm" onClick={() => onAbrirEnvio(p)}>
                                    <i className="fa-solid fa-truck"></i> 3. Informar Envio
                                  </button>
                                </>
                              )}

                              {(p.status === 'ATENDIDO_PARCIAL' || p.status === 'ATENDIDO_TOTAL') && (
                                <>
                                  <button className="btn btn-primary btn-sm" onClick={() => onAbrirAtendimento(p)}>
                                    <i className="fa-solid fa-pen"></i> Editar Qtds
                                  </button>
                                  <button className="btn btn-emerald btn-sm" onClick={() => onAbrirEnvio(p)}>
                                    <i className="fa-solid fa-truck"></i> 3. Informar Envio
                                  </button>
                                </>
                              )}
                            </>
                          ) : (
                            <>
                              {p.status === 'SOLICITADO' && (
                                <span className="badge badge-amber"><i className="fa-solid fa-hourglass-half"></i> Aguardando Almoxarifado</span>
                              )}
                              {(p.status === 'RECEBIDO' || p.status === 'ATENDIDO_PARCIAL' || p.status === 'ATENDIDO_TOTAL') && (
                                <span className="badge badge-cyan"><i className="fa-solid fa-spinner fa-spin"></i> Em Separação</span>
                              )}
                              {p.status === 'ENVIADO' && (
                                <span className="badge badge-emerald"><i className="fa-solid fa-circle-check"></i> Despachado</span>
                              )}
                            </>
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
      </div>
    </div>
  );
};
