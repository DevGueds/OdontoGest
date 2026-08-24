import React from 'react';
import { UnidadeSaude, Material, PerfilUsuario } from '../../types';

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
                  <th>ID</th>
                  <th>Nome do Estabelecimento</th>
                  <th>Data Cadastro</th>
                  <th className="text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {unidades.map(u => (
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
                  <th>ID</th>
                  <th>Descrição do Material / Insumo</th>
                  <th>Natureza</th>
                  <th>Fornecedor / Distribuidor</th>
                  <th>Unidade Medida</th>
                  <th>Val. Estimado</th>
                  <th>Estoque Atual</th>
                  <th>Limite Máx. p/ Pedido</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {materiais.map(m => {
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
