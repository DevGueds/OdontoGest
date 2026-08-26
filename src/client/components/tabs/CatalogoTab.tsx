import React from 'react';
import { UnidadeSaude, Material, PerfilUsuario } from '../../types';
import { useSortableData } from '../../hooks/useSortableData';

interface Props {
  unidades: UnidadeSaude[];
  materiais: Material[];
  perfilAtual?: PerfilUsuario;
  onAbrirModalUnidade: () => void;
  onAbrirEditarUnidade: (u: UnidadeSaude) => void;
  onDeletarUnidade: (id: number) => void;
  onAbrirModalMaterial: () => void;
  onAbrirEditarMaterial: (m: Material) => void;
  onAbrirAjusteEstoque: (m: Material) => void;
  formatarData: (d?: string | null) => string;
  formatarMoeda: (v: number) => string;
}

export const CatalogoTab: React.FC<Props> = ({
  unidades,
  materiais,
  perfilAtual = 'ADMINISTRADOR',
  onAbrirModalUnidade,
  onAbrirEditarUnidade,
  onDeletarUnidade,
  onAbrirModalMaterial,
  onAbrirEditarMaterial,
  onAbrirAjusteEstoque,
  formatarData,
  formatarMoeda
}) => {
  const isReadOnly = perfilAtual === 'GESTOR';

  const { items: sortedUnidades, requestSort: requestSortUnidades, getSortIndicator: getSortUnidades } = useSortableData(unidades, { key: 'id', direction: 'asc' });
  const { items: sortedMateriais, requestSort: requestSortMateriais, getSortIndicator: getSortMateriais } = useSortableData(materiais, { key: 'descricao', direction: 'asc' });

  return (
    <div className="panel-stack">
      {/* Unidades / Estabelecimentos de Saúde */}
      <div className="card">
        <div className="card-header flex-between">
          <div>
            <h3><i className="fa-solid fa-hospital-user"></i> Estabelecimentos / Postos de Saúde</h3>
            <p className="text-muted text-sm">{isReadOnly ? 'Visualização em Modo Somente Leitura (Gestor)' : 'Gerenciamento do Administrador'}</p>
          </div>
          {!isReadOnly && (
            <button className="btn btn-primary btn-sm" onClick={onAbrirModalUnidade}>
              <i className="fa-solid fa-plus"></i> Novo Estabelecimento
            </button>
          )}
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th onClick={() => requestSortUnidades('id')} style={{cursor: 'pointer'}}>ID{getSortUnidades('id')}</th>
                  <th onClick={() => requestSortUnidades('nome')} style={{cursor: 'pointer'}}>Nome do Estabelecimento{getSortUnidades('nome')}</th>
                  <th onClick={() => requestSortUnidades('criado_em')} style={{cursor: 'pointer'}}>Data Cadastro{getSortUnidades('criado_em')}</th>
                  <th className="text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {sortedUnidades.map(u => (
                  <tr key={u.id}>
                    <td><strong>#{u.id}</strong></td>
                    <td><strong>{u.nome}</strong></td>
                    <td>{formatarData(u.criado_em)}</td>
                    <td className="text-center">
                      {!isReadOnly ? (
                        <div className="btn-group">
                          <button 
                            className="btn btn-primary btn-sm" 
                            onClick={() => onAbrirEditarUnidade(u)}
                            title="Editar Estabelecimento"
                          >
                            <i className="fa-solid fa-pen"></i> Editar
                          </button>
                          <button 
                            className="btn btn-rose btn-sm" 
                            onClick={() => {
                              if (confirm(`Deseja realmente apagar o estabelecimento "${u.nome}"?`)) {
                                onDeletarUnidade(u.id);
                              }
                            }}
                            title="Apagar Estabelecimento"
                          >
                            <i className="fa-solid fa-trash"></i> Apagar
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted text-sm"><i className="fa-solid fa-lock"></i> Somente Leitura</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Catálogo de Materiais / Insumos */}
      <div className="card">
        <div className="card-header flex-between">
          <div>
            <h3><i className="fa-solid fa-boxes-stacked"></i> Catálogo de Materiais & Insumos</h3>
            <p className="text-muted text-sm">Insumos disponíveis para solicitação</p>
          </div>
          {!isReadOnly && (
            <button className="btn btn-primary btn-sm" onClick={onAbrirModalMaterial}>
              <i className="fa-solid fa-plus"></i> Novo Insumo/Material
            </button>
          )}
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th onClick={() => requestSortMateriais('id')} style={{cursor: 'pointer'}}>ID{getSortMateriais('id')}</th>
                  <th onClick={() => requestSortMateriais('descricao')} style={{cursor: 'pointer'}}>Descrição do Material / Insumo{getSortMateriais('descricao')}</th>
                  <th onClick={() => requestSortMateriais('natureza')} style={{cursor: 'pointer'}}>Natureza{getSortMateriais('natureza')}</th>
                  <th onClick={() => requestSortMateriais('fornecedor')} style={{cursor: 'pointer'}}>Fornecedor / Distribuidor{getSortMateriais('fornecedor')}</th>
                  <th onClick={() => requestSortMateriais('unidade_medida')} style={{cursor: 'pointer'}}>Unidade Medida{getSortMateriais('unidade_medida')}</th>
                  <th onClick={() => requestSortMateriais('valor_estimado')} style={{cursor: 'pointer'}}>Val. Estimado{getSortMateriais('valor_estimado')}</th>
                  <th onClick={() => requestSortMateriais('qtd_estoque')} style={{cursor: 'pointer'}}>Estoque Atual{getSortMateriais('qtd_estoque')}</th>
                  <th onClick={() => requestSortMateriais('limite_max_pedido')} style={{cursor: 'pointer'}}>Limite Máx. p/ Pedido{getSortMateriais('limite_max_pedido')}</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {sortedMateriais.map(m => {
                  const est = m.qtd_estoque ?? 0;
                  let badgeEstoque = <span className="badge badge-emerald"><i className="fa-solid fa-circle-check"></i> {est} {m.unidade_medida}</span>;
                  if (est <= 0) {
                    badgeEstoque = <span className="badge badge-rose"><i className="fa-solid fa-circle-xmark"></i> 0 {m.unidade_medida} (Esgotado)</span>;
                  } else if (est < 20) {
                    badgeEstoque = <span className="badge badge-amber"><i className="fa-solid fa-triangle-exclamation"></i> {est} {m.unidade_medida} (Baixo)</span>;
                  }

                  const txtLimite = m.limite_max_pedido ? (
                    <span className="badge badge-amber">
                      <i className="fa-solid fa-hand-halved"></i> Máx. {m.limite_max_pedido} {m.unidade_medida}
                    </span>
                  ) : (
                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>Sem limite</span>
                  );

                  return (
                    <tr key={m.id}>
                      <td><strong>#{m.id}</strong></td>
                      <td><strong>{m.descricao}</strong></td>
                      <td>
                        {m.natureza === 'INVESTIMENTO' ? (
                          <span className="badge badge-purple"><i className="fa-solid fa-building-columns"></i> Investimento</span>
                        ) : (
                          <span className="badge badge-cyan"><i className="fa-solid fa-receipt"></i> Custeio</span>
                        )}
                      </td>
                      <td>
                        {m.fornecedor ? (
                          <span className="badge badge-cyan"><i className="fa-solid fa-truck-field"></i> {m.fornecedor}</span>
                        ) : (
                          <span className="text-muted" style={{ fontSize: '0.8rem' }}>Padrão / Não inf.</span>
                        )}
                      </td>
                      <td><span className="badge badge-blue">{m.unidade_medida}</span></td>
                      <td>{formatarMoeda(m.valor_estimado || 0)}</td>
                      <td>{badgeEstoque}</td>
                      <td>{txtLimite}</td>
                      <td>
                        {!isReadOnly ? (
                          <div className="btn-group">
                            <button className="btn btn-primary btn-sm" onClick={() => onAbrirEditarMaterial(m)}>
                              <i className="fa-solid fa-pen"></i> Editar Insumo
                            </button>
                            <button className="btn btn-outline btn-sm" onClick={() => onAbrirAjusteEstoque(m)}>
                              <i className="fa-solid fa-boxes-stacked"></i> Repor Estoque
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted text-sm"><i className="fa-solid fa-lock"></i> Somente Leitura</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
