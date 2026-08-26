import React, { useState, useEffect } from 'react';
import { UnidadeSaude, Material, PerfilUsuario } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface FormItem {
  id: number;
  material_id: number | '';
  unidade_medida: string;
  qtd_pedida: number;
  valor_unitario: number;
  valor_total: number;
}

interface Props {
  unidades: UnidadeSaude[];
  materiais: Material[];
  perfilAtual: PerfilUsuario;
  onSubmit: (dados: {
    unidade_emitente_id: number;
    data_pedido: string;
    responsavel_nome: string;
    responsavel_funcao?: string;
    responsavel_registro?: string;
    atividade_programa?: string;
    elemento_despesa?: string;
    observacoes?: string;
    itens: { material_id: number; qtd_pedida: number; valor_unitario: number }[];
  }) => void;
  onCancel: () => void;
  formatarMoeda: (v: number) => string;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const NovoPedidoTab: React.FC<Props> = ({
  unidades,
  materiais,
  perfilAtual,
  onSubmit,
  onCancel,
  formatarMoeda,
  showToast
}) => {
  const { user } = useAuth();
  const isGestor = perfilAtual === 'GESTOR';
  const [unidadeId, setUnidadeId] = useState<number | ''>(unidades[0]?.id || '');
  const [dataPedido, setDataPedido] = useState(new Date().toISOString().substring(0, 10));
  const [responsavelNome, setResponsavelNome] = useState('');
  const [responsavelFuncao, setResponsavelFuncao] = useState('');
  const [responsavelRegistro, setResponsavelRegistro] = useState('');


  useEffect(() => {
    if (user) {
      if (user.unidade_id && unidades.some(u => u.id === user.unidade_id)) {
        setUnidadeId(user.unidade_id);
      }
      if (user.nome) {
        setResponsavelNome(user.nome);
      }
      if (user.funcao) {
        setResponsavelFuncao(user.funcao);
      }
      if (user.registro) {
        setResponsavelRegistro(user.registro);
      }
    }
  }, [user, unidades]);

  const [itens, setItens] = useState<FormItem[]>([
    { id: 1, material_id: '', unidade_medida: '', qtd_pedida: 1, valor_unitario: 0, valor_total: 0 }
  ]);

  const handleAddLinha = () => {
    setItens(prev => [
      ...prev,
      { id: Date.now(), material_id: '', unidade_medida: '', qtd_pedida: 1, valor_unitario: 0, valor_total: 0 }
    ]);
  };

  const handleRemoveLinha = (id: number) => {
    if (itens.length <= 1) {
      showToast("O pedido deve ter no mínimo 1 item solicitado.", "error");
      return;
    }
    setItens(prev => prev.filter(item => item.id !== id));
  };

  const handleMaterialChange = (id: number, matIdStr: string) => {
    const matId = parseInt(matIdStr);
    const mat = materiais.find(m => m.id === matId);

    setItens(prev => prev.map(item => {
      if (item.id === id) {
        const vUnit = mat ? mat.valor_estimado : 0;
        const un = mat ? mat.unidade_medida : '';
        let novaQtd = item.qtd_pedida || 1;

        if (mat?.limite_max_pedido && novaQtd > mat.limite_max_pedido) {
          novaQtd = mat.limite_max_pedido;
          showToast(`Quantidade ajustada para o limite de ${mat.limite_max_pedido} ${mat.unidade_medida} em "${mat.descricao}".`, 'info');
        }

        const vTotal = novaQtd * vUnit;
        return {
          ...item,
          material_id: matId || '',
          unidade_medida: un,
          qtd_pedida: novaQtd,
          valor_unitario: vUnit,
          valor_total: vTotal
        };
      }
      return item;
    }));
  };

  const handleQtdChange = (id: number, qtd: number) => {
    setItens(prev => prev.map(item => {
      if (item.id === id) {
        const mat = materiais.find(m => m.id === item.material_id);
        let finalQtd = Math.max(1, qtd);

        if (mat?.limite_max_pedido && finalQtd > mat.limite_max_pedido) {
          finalQtd = mat.limite_max_pedido;
          showToast(`Limite máximo para "${mat?.descricao}" é de ${mat.limite_max_pedido} ${mat.unidade_medida} por pedido.`, 'info');
        }

        const vTotal = finalQtd * item.valor_unitario;
        return { ...item, qtd_pedida: finalQtd, valor_total: vTotal };
      }
      return item;
    }));
  };

  const handleValorUnitChange = (id: number, vUnit: number) => {
    setItens(prev => prev.map(item => {
      if (item.id === id) {
        const vTotal = item.qtd_pedida * vUnit;
        return { ...item, valor_unitario: vUnit, valor_total: vTotal };
      }
      return item;
    }));
  };

  const totalEstimado = itens.reduce((acc, item) => acc + item.valor_total, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!unidadeId) {
      showToast("Selecione o estabelecimento emitente.", "error");
      return;
    }

    const validItens = itens.filter(item => typeof item.material_id === 'number' && item.material_id > 0);
    if (validItens.length === 0) {
      showToast("Por favor, selecione os materiais do catálogo para o pedido.", "error");
      return;
    }

    // Validar limites máximos definidos pelo Gestor
    for (const item of validItens) {
      const mat = materiais.find(m => m.id === Number(item.material_id));
      if (mat?.limite_max_pedido && item.qtd_pedida > mat.limite_max_pedido) {
        showToast(`O item "${mat.descricao}" excede o limite máximo permitido de ${mat.limite_max_pedido} ${mat.unidade_medida}.`, "error");
        return;
      }
    }

    onSubmit({
      unidade_emitente_id: Number(unidadeId),
      data_pedido: dataPedido,
      responsavel_nome: responsavelNome,
      responsavel_funcao: responsavelFuncao,
      responsavel_registro: responsavelRegistro,
      atividade_programa: '',
      elemento_despesa: '',
      observacoes: '',
      itens: validItens.map(i => ({
        material_id: Number(i.material_id),
        qtd_pedida: i.qtd_pedida,
        valor_unitario: i.valor_unitario
      }))
    });

    // Reset Form
    setResponsavelNome(user?.nome || '');
    setResponsavelFuncao(user?.funcao || '');
    setResponsavelRegistro(user?.registro || '');

    if (user?.unidade_id && unidades.some(u => u.id === user.unidade_id)) {
      setUnidadeId(user.unidade_id);
    }
    setItens([{ id: Date.now(), material_id: '', unidade_medida: '', qtd_pedida: 1, valor_unitario: 0, valor_total: 0 }]);
  };

  const isAdmin = perfilAtual === 'ADMINISTRADOR';

  const listaMateriaisOpcoes = React.useMemo(() => {
    if (isGestor) {
      return materiais
        .filter(m => (m.qtd_estoque ?? 0) > 0)
        .map(m => ({
          id: m.id,
          descricaoLabel: m.fornecedor ? `${m.descricao} (${m.fornecedor})` : m.descricao,
          material: m,
          esgotado: false,
          txtComplemento: ` [Estoque: ${m.qtd_estoque} ${m.unidade_medida}${m.limite_max_pedido ? ` | Limite Máx: ${m.limite_max_pedido} ${m.unidade_medida}` : ''}]`
        }));
    } else {
      // Solicitante: Agrupar por descrição + unidade de medida
      const agrupadosMap = new Map<string, Material[]>();
      materiais.forEach(m => {
        const chave = `${m.descricao.trim().toLowerCase()}___${m.unidade_medida.trim().toLowerCase()}`;
        if (!agrupadosMap.has(chave)) {
          agrupadosMap.set(chave, []);
        }
        agrupadosMap.get(chave)!.push(m);
      });

      const resultado = [];
      for (const [, lista] of agrupadosMap.entries()) {
        const principal = lista.find(m => (m.qtd_estoque ?? 0) > 0) || lista[0];
        const estoqueTotal = lista.reduce((acc, curr) => acc + (curr.qtd_estoque ?? 0), 0);
        const esgotado = estoqueTotal <= 0;

        // Se estiver com estoque zerado, não exibe no select
        if (esgotado) continue;

        const limite = principal.limite_max_pedido;
        let txtComplemento = '';
        if (limite) {
          txtComplemento = ` [Limite máx: ${limite} ${principal.unidade_medida}]`;
        }

        resultado.push({
          id: principal.id,
          descricaoLabel: principal.descricao,
          material: principal,
          esgotado: false,
          txtComplemento
        });
      }
      return resultado;
    }
  }, [materiais, isGestor]);

  return (
    <div className="card form-card">
      <div className="card-header flex-between">
        <div>
          <h2><i className="fa-solid fa-file-pen"></i> Formular Novo Pedido de Bens e Serviços (PBS)</h2>
          <p>Preencha os dados da solicitação para emissão pelo posto de saúde.</p>
        </div>
        <span className="badge badge-blue">
          <i className="fa-solid fa-user"></i> Emitindo como:{' '}
          <strong>
            {perfilAtual === 'GESTOR' 
              ? 'Perfil Gestor (Almoxarifado)' 
              : perfilAtual === 'ADMINISTRADOR'
              ? 'Perfil Administrador'
              : 'Perfil Solicitante (Posto/USF)'}
          </strong>
        </span>
      </div>

      <div className="card-body">
        <form onSubmit={handleSubmit}>
          {/* 1. Identificação da Unidade e Responsável */}
          <div className="form-section-title">
            <i className="fa-solid fa-hospital"></i> 1. Identificação do Estabelecimento de Saúde e Responsável
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="unidade_emitente_id">Unidade Emitente / Posto de Saúde *</label>
              <select 
                id="unidade_emitente_id" 
                className="form-control" 
                value={unidadeId}
                onChange={(e) => setUnidadeId(Number(e.target.value))}
                disabled={!isAdmin && Boolean(user?.unidade_id)}
                required
              >
                {unidades.map(u => (
                  <option key={u.id} value={u.id}>{u.nome} ({u.tipo})</option>
                ))}
              </select>
              {!isAdmin && Boolean(user?.unidade_id) ? (
                <small className="form-text text-muted" style={{ display: 'block', marginTop: '4px' }}>
                  <i className="fa-solid fa-lock" style={{ marginRight: '4px' }}></i>
                  Unidade fixada automaticamente conforme seu cadastro de usuário.
                </small>
              ) : isAdmin ? (
                <small className="form-text text-muted" style={{ display: 'block', marginTop: '4px' }}>
                  <i className="fa-solid fa-user-shield" style={{ marginRight: '4px' }}></i>
                  Administrador: você pode alterar e selecionar qualquer unidade emitente.
                </small>
              ) : null}
            </div>

            <div className="form-group">
              <label htmlFor="data_pedido">Data da Solicitação *</label>
              <input 
                type="date" 
                id="data_pedido" 
                className="form-control" 
                value={dataPedido}
                onChange={(e) => setDataPedido(e.target.value)}
                required 
              />
            </div>

            <div className="form-group">
              <label htmlFor="responsavel_nome">Nome do Responsável pela Solicitação *</label>
              <input 
                type="text" 
                id="responsavel_nome" 
                className="form-control" 
                placeholder="Ex: Dra. Maria Fernanda Silva" 
                value={responsavelNome}
                onChange={(e) => setResponsavelNome(e.target.value)}
                required 
              />
            </div>

            <div className="form-group">
              <label htmlFor="responsavel_funcao">Função / Cargo</label>
              <input 
                type="text" 
                id="responsavel_funcao" 
                className="form-control" 
                placeholder="Ex: Cirurgiã Dentista / Enfermeira Chefe"
                value={responsavelFuncao}
                onChange={(e) => setResponsavelFuncao(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="responsavel_registro">Registro Profissional (Opcional)</label>
              <input 
                type="text" 
                id="responsavel_registro" 
                className="form-control" 
                placeholder="Ex: CRO/PA 0592 ou COREN/PA 12345"
                value={responsavelRegistro}
                onChange={(e) => setResponsavelRegistro(e.target.value)}
              />
            </div>
          </div>

          {/* 2. Itens do Pedido */}
          <div className="form-section-title flex-between">
            <span><i className="fa-solid fa-boxes-stacked"></i> 2. Materiais / Insumos Solicitados</span>
            <button type="button" className="btn btn-outline btn-sm" onClick={handleAddLinha}>
              <i className="fa-solid fa-plus"></i> Adicionar Insumo
            </button>
          </div>

          <div className="table-responsive margin-top-sm">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>Item</th>
                  <th>Material / Descrição do Catálogo</th>
                  <th style={{ width: '100px' }}>Un. Medida</th>
                  <th style={{ width: '140px' }}>Qtd. Pedida</th>
                  {isGestor && <th style={{ width: '130px' }}>Val. Unit. (Est.)</th>}
                  {isGestor && <th style={{ width: '130px' }}>Val. Total (Est.)</th>}
                  <th style={{ width: '60px' }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((item, index) => {
                  const selectedMat = materiais.find(m => m.id === item.material_id);
                  const limiteItem = selectedMat?.limite_max_pedido;

                  return (
                    <tr key={item.id}>
                      <td><strong>{index + 1}</strong></td>
                      <td>
                        <select 
                          className="form-control"
                          style={{ maxWidth: '380px', width: '100%' }}
                          value={item.material_id}
                          onChange={(e) => handleMaterialChange(item.id, e.target.value)}
                          required
                        >
                          <option value="">-- Selecione o Material --</option>
                          {listaMateriaisOpcoes.map(opt => (
                            <option key={opt.id} value={opt.id}>
                              {opt.descricaoLabel}{opt.txtComplemento}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td><input type="text" className="form-control" readOnly value={item.unidade_medida} placeholder="-" /></td>
                      <td>
                        <input 
                          type="number" 
                          min="1"
                          max={limiteItem || undefined} 
                          className="form-control" 
                          value={item.qtd_pedida}
                          onChange={(e) => handleQtdChange(item.id, parseInt(e.target.value) || 1)}
                          required 
                        />
                        {limiteItem ? (
                          <small style={{ fontSize: '0.72rem', color: 'var(--amber)', fontWeight: 600, display: 'block', marginTop: '3px' }}>
                            <i className="fa-solid fa-hand-halved"></i> Máx: {limiteItem} {selectedMat?.unidade_medida}
                          </small>
                        ) : null}
                      </td>
                      {isGestor && (
                        <td>
                          <input 
                            type="number" 
                            step="0.01" 
                            className="form-control" 
                            value={item.valor_unitario}
                            onChange={(e) => handleValorUnitChange(item.id, parseFloat(e.target.value) || 0)}
                          />
                        </td>
                      )}
                      {isGestor && (
                        <td><input type="text" className="form-control" readOnly value={formatarMoeda(item.valor_total)} /></td>
                      )}
                      <td>
                        <button type="button" className="btn btn-outline btn-sm text-rose" onClick={() => handleRemoveLinha(item.id)}>
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {isGestor && (
                <tfoot>
                  <tr>
                    <td colSpan={5} className="text-right"><strong>VALOR TOTAL ESTIMADO DO PEDIDO:</strong></td>
                    <td><strong>{formatarMoeda(totalEstimado)}</strong></td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          <div className="form-actions margin-top-md">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
            <button type="submit" className="btn btn-primary btn-lg">
              <i className="fa-solid fa-paper-plane"></i> Emitir Solicitação de PBS
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
