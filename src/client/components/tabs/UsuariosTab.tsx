import React, { useState } from 'react';
import { UnidadeSaude, UserSistema, PerfilUsuario } from '../../types';
import { useSortableData } from '../../hooks/useSortableData';

interface Props {
  unidades: UnidadeSaude[];
  usuarios: UserSistema[];
  onAddUsuario: (dados: Omit<UserSistema, 'id'>) => void;
  onUpdateUsuario: (id: number, dados: Partial<UserSistema>) => void;
  onDeleteUsuario: (id: number) => void;
}

export const UsuariosTab: React.FC<Props> = ({
  unidades,
  usuarios,
  onAddUsuario,
  onUpdateUsuario,
  onDeleteUsuario
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [usuarioEdicao, setUsuarioEdicao] = useState<UserSistema | null>(null);

  const { items: sortedUsuarios, requestSort, getSortIndicator } = useSortableData(usuarios, { key: 'nome', direction: 'asc' });

  // Form State
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [funcao, setFuncao] = useState('');
  const [registro, setRegistro] = useState('');
  const [perfil, setPerfil] = useState<PerfilUsuario>('SOLICITANTE');
  const [unidadeId, setUnidadeId] = useState<number>(unidades[0]?.id || 1);

  // Toggles de visibilidade de senha
  const [senhasVisiveis, setSenhasVisiveis] = useState<Record<number, boolean>>({});
  const [showModalSenha, setShowModalSenha] = useState(false);
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);

  const toggleSenhaVisivel = (id: number) => {
    setSenhasVisiveis(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAbrirNovo = () => {
    setUsuarioEdicao(null);
    setNome('');
    setEmail('');
    setSenha('123456');
    setFuncao('Cirurgião Dentista');
    setRegistro('');
    setPerfil('SOLICITANTE');
    setUnidadeId(unidades[0]?.id || 1);
    setShowModalSenha(false);
    setShowSenhaAtual(false);
    setModalOpen(true);
  };

  const handleAbrirEditar = (u: UserSistema) => {
    setUsuarioEdicao(u);
    setNome(u.nome);
    setEmail(u.email);
    setSenha('');
    setFuncao(u.funcao || '');
    setRegistro(u.registro || '');
    setPerfil(u.perfil);
    setUnidadeId(u.unidade_id || 1);
    setShowModalSenha(false);
    setShowSenhaAtual(false);
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim()) return;

    if (usuarioEdicao) {
      onUpdateUsuario(usuarioEdicao.id, {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        ...(senha && { senha }),
        funcao: funcao.trim() || 'Profissional de Saúde',
        registro: registro.trim(),
        perfil,
        unidade_id: Number(unidadeId)
      });
    } else {
      onAddUsuario({
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        senha: senha || '123456',
        funcao: funcao.trim() || 'Profissional de Saúde',
        registro: registro.trim(),
        perfil,
        unidade_id: Number(unidadeId)
      });
    }

    setModalOpen(false);
  };

  const renderPerfilBadge = (p: PerfilUsuario) => {
    switch (p) {
      case 'ADMINISTRADOR':
        return <span className="badge badge-purple"><i className="fa-solid fa-crown"></i> Administrador</span>;
      case 'GESTOR':
        return <span className="badge badge-cyan"><i className="fa-solid fa-eye"></i> Gestor (Leitura)</span>;
      case 'SOLICITANTE':
        return <span className="badge badge-emerald"><i className="fa-solid fa-user-doctor"></i> Solicitante (PBS)</span>;
      case 'TECNICO':
        return <span className="badge badge-amber"><i className="fa-solid fa-wrench"></i> Técnico Manutenção</span>;
      default:
        return <span className="badge badge-secondary">{p}</span>;
    }
  };

  return (
    <div className="panel-stack">
      {/* Header & Controls */}
      <div className="card">
        <div className="card-header flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3><i className="fa-solid fa-users-gear text-primary"></i> Gestão de Usuários & Controle de Acesso (RBAC)</h3>
            <p className="text-muted text-sm">
              Cadastre e gerencie usuários vinculando-os às Unidades de Saúde do banco de dados, CRO/Registro e Perfil de permissões.
            </p>
          </div>

          <button className="btn btn-primary" onClick={handleAbrirNovo}>
            <i className="fa-solid fa-user-plus"></i> Novo Usuário
          </button>
        </div>

        <div className="card-body">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th onClick={() => requestSort('id')} style={{ cursor: 'pointer' }}>ID {getSortIndicator('id')}</th>
                  <th onClick={() => requestSort('nome')} style={{ cursor: 'pointer' }}>Nome Completo {getSortIndicator('nome')}</th>
                  <th onClick={() => requestSort('funcao')} style={{ cursor: 'pointer' }}>Cargo / Função {getSortIndicator('funcao')}</th>
                  <th onClick={() => requestSort('email')} style={{ cursor: 'pointer' }}>E-mail Corporativo {getSortIndicator('email')}</th>
                  <th>Senha Cadastrada</th>
                  <th onClick={() => requestSort('registro')} style={{ cursor: 'pointer' }}>Registro Profissional / CRO {getSortIndicator('registro')}</th>
                  <th onClick={() => requestSort('perfil')} style={{ cursor: 'pointer' }}>Perfil de Acesso {getSortIndicator('perfil')}</th>
                  <th onClick={() => requestSort('unidade_id')} style={{ cursor: 'pointer' }}>Unidade de Saúde Alocada {getSortIndicator('unidade_id')}</th>
                  <th className="text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsuarios.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center text-muted" style={{ padding: '2rem' }}>
                      Nenhum usuário cadastrado.
                    </td>
                  </tr>
                ) : (
                  sortedUsuarios.map(u => {
                    const uni = unidades.find(un => un.id === u.unidade_id);
                    return (
                      <tr key={u.id}>
                        <td><strong>#{u.id}</strong></td>
                        <td><strong>{u.nome}</strong></td>
                        <td>
                          <span className="badge badge-purple">{u.funcao || 'Profissional de Saúde'}</span>
                        </td>
                        <td>{u.email}</td>
                        <td>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-app)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)' }}>
                            <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 600, color: senhasVisiveis[u.id] ? 'var(--primary)' : 'var(--text-muted)' }}>
                              {senhasVisiveis[u.id] ? (u.senha || '123456') : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleSenhaVisivel(u.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.1rem 0.2rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}
                              title={senhasVisiveis[u.id] ? "Ocultar senha" : "Ver senha cadastrada"}
                            >
                              <i className={`fa-solid ${senhasVisiveis[u.id] ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                          </div>
                        </td>
                        <td>
                          {u.registro ? (
                            <span className="badge badge-blue">{u.registro}</span>
                          ) : (
                            <span className="text-muted text-sm">Não informado</span>
                          )}
                        </td>
                        <td>{renderPerfilBadge(u.perfil)}</td>
                        <td>
                          <strong>{uni ? uni.nome : `Unidade #${u.unidade_id}`}</strong>
                        </td>
                        <td className="text-center">
                          <div className="btn-group">
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleAbrirEditar(u)}
                              title="Editar Usuário"
                            >
                              <i className="fa-solid fa-pen"></i> Editar
                            </button>
                            <button
                              className="btn btn-rose btn-sm"
                              onClick={() => {
                                if (confirm(`Deseja realmente apagar o usuário "${u.nome}" (${u.email})?`)) {
                                  onDeleteUsuario(u.id);
                                }
                              }}
                              title="Apagar Usuário"
                            >
                              <i className="fa-solid fa-trash"></i> Apagar
                            </button>
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

      {/* Modal Novo/Editar Usuário */}
      {modalOpen && (
        <div className="modal active">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                <i className={`fa-solid ${usuarioEdicao ? 'fa-pen-to-square' : 'fa-user-plus'}`}></i>{' '}
                {usuarioEdicao ? 'Editar Usuário do Sistema' : 'Cadastrar Novo Usuário (Administrador)'}
              </h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="usr_nome">Nome Completo *</label>
                  <input
                    type="text"
                    id="usr_nome"
                    className="form-control"
                    placeholder="Ex: Dra. Ana Beatriz Ferreira"
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    required
                  />
                </div>

                <div className="form-grid margin-top-sm">
                  <div className="form-group">
                    <label htmlFor="usr_email">E-mail Corporativo (Login) *</label>
                    <input
                      type="email"
                      id="usr_email"
                      className="form-control"
                      placeholder="usuario@saude.gov.br"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="usr_senha">
                      {usuarioEdicao ? 'Nova Senha (deixe em branco p/ manter)' : 'Senha de Acesso *'}
                    </label>
                    {usuarioEdicao && (
                      <div style={{ marginBottom: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Senha Atual: {' '}
                        <strong style={{ fontFamily: 'monospace', color: showSenhaAtual ? 'var(--primary)' : 'inherit' }}>
                          {showSenhaAtual ? (usuarioEdicao.senha || '123456') : '••••••••'}
                        </strong>
                        <button
                          type="button"
                          onClick={() => setShowSenhaAtual(!showSenhaAtual)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '0.4rem', color: 'var(--primary)', fontSize: '0.8rem' }}
                          title={showSenhaAtual ? "Ocultar senha atual" : "Ver senha atual cadastrada"}
                        >
                          <i className={`fa-solid ${showSenhaAtual ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                      </div>
                    )}
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type={showModalSenha ? 'text' : 'password'}
                        id="usr_senha"
                        className="form-control"
                        placeholder={usuarioEdicao ? "•••••••• (ou digite a nova)" : "••••••••"}
                        value={senha}
                        onChange={e => setSenha(e.target.value)}
                        required={!usuarioEdicao}
                        style={{ paddingRight: '2.5rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowModalSenha(!showModalSenha)}
                        style={{
                          position: 'absolute',
                          right: '0.5rem',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-muted)',
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.9rem'
                        }}
                        title={showModalSenha ? "Ocultar senha" : "Ver senha"}
                      >
                        <i className={`fa-solid ${showModalSenha ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-grid margin-top-sm">
                  <div className="form-group">
                    <label htmlFor="usr_funcao">Cargo / Função do Usuário *</label>
                    <input
                      type="text"
                      id="usr_funcao"
                      className="form-control"
                      placeholder="Ex: Cirurgião Dentista, Auxiliar de Saúde Bucal, Farmacêutico..."
                      value={funcao}
                      onChange={e => setFuncao(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="usr_registro">Registro Profissional / CRO (Opcional)</label>
                    <input
                      type="text"
                      id="usr_registro"
                      className="form-control"
                      placeholder="Ex: CRO/PA 0592 ou SMS-1020"
                      value={registro}
                      onChange={e => setRegistro(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group margin-top-sm">
                  <label htmlFor="usr_perfil">Perfil de Acesso (Nível de Permissão) *</label>
                  <select
                    id="usr_perfil"
                    className="form-control"
                    value={perfil}
                    onChange={e => setPerfil(e.target.value as PerfilUsuario)}
                    required
                  >
                    <option value="SOLICITANTE">🩺 Solicitante (Fazer Pedidos e Reparos)</option>
                    <option value="GESTOR">👁️ Gestor Executivo (Somente Leitura)</option>
                    <option value="ADMINISTRADOR">👑 Administrador (Acesso Total / Gestão)</option>
                    <option value="TECNICO">🔧 Técnico de Manutenção (Manutenções Aprovadas)</option>
                  </select>
                </div>

                <div className="form-group margin-top-sm">
                  <label htmlFor="usr_unidade">Unidade de Saúde Alocada (Banco de Dados) *</label>
                  <select
                    id="usr_unidade"
                    className="form-control"
                    value={unidadeId}
                    onChange={e => setUnidadeId(Number(e.target.value))}
                    required
                  >
                    {unidades.map(u => (
                      <option key={u.id} value={u.id}>
                        🏥 #{u.id} — {u.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-actions margin-top-md">
                  <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">
                    <i className="fa-solid fa-floppy-disk"></i> Salvar Usuário
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
