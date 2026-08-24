import React, { useState, useEffect } from 'react';
import { Material, NaturezaDespesa } from '../../types';

interface Props {
  material: Material | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (materialId: number, dados: Partial<Material>) => void;
}

export const ModalEditarMaterial: React.FC<Props> = ({ material, isOpen, onClose, onConfirm }) => {
  const [desc, setDesc] = useState('');
  const [fornecedor, setFornecedor] = useState('');
  const [un, setUn] = useState('');
  const [val, setVal] = useState('');
  const [est, setEst] = useState('');
  const [limiteMax, setLimiteMax] = useState('');
  const [natureza, setNatureza] = useState<NaturezaDespesa>('CUSTEIO');

  useEffect(() => {
    if (isOpen && material) {
      setDesc(material.descricao);
      setFornecedor(material.fornecedor || '');
      setUn(material.unidade_medida);
      setVal((material.valor_estimado || 0).toFixed(2));
      setEst(String(material.qtd_estoque ?? 100));
      setLimiteMax(material.limite_max_pedido !== undefined && material.limite_max_pedido !== null ? String(material.limite_max_pedido) : '');
      setNatureza(material.natureza || 'CUSTEIO');
    }
  }, [isOpen, material]);

  if (!isOpen || !material) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lMax = limiteMax.trim() !== '' ? parseInt(limiteMax) : null;
    const forn = fornecedor.trim() !== '' ? fornecedor.trim() : null;
    onConfirm(material.id, {
      descricao: desc,
      fornecedor: forn,
      unidade_medida: un,
      valor_estimado: parseFloat(val) || 0,
      qtd_estoque: parseInt(est) || 0,
      limite_max_pedido: lMax,
      natureza
    });
  };

  return (
    <div className={`modal ${isOpen ? 'active' : ''}`}>
      <div className="modal-content">
        <div className="modal-header">
          <h3><i className="fa-solid fa-pen-to-square"></i> Editar Insumo & Configurar Limite de Pedido</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="edit_mat_descricao">Descrição do Insumo / Material *</label>
              <input 
                type="text" 
                id="edit_mat_descricao" 
                className="form-control" 
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                required 
              />
            </div>
            <div className="form-group margin-top-sm">
              <label htmlFor="edit_mat_fornecedor">Fornecedor / Distribuidor (Visível apenas ao Gestor)</label>
              <input 
                type="text" 
                id="edit_mat_fornecedor" 
                className="form-control" 
                placeholder="Ex: MedLab Ltda" 
                value={fornecedor}
                onChange={(e) => setFornecedor(e.target.value)}
              />
            </div>
            <div className="form-group margin-top-sm">
              <label htmlFor="edit_mat_natureza">Natureza da Despesa / Recursos *</label>
              <select 
                id="edit_mat_natureza"
                className="form-control"
                value={natureza}
                onChange={(e) => setNatureza(e.target.value as NaturezaDespesa)}
                required
              >
                <option value="CUSTEIO">💳 Custeio (Insumos de Consumo Operacional)</option>
                <option value="INVESTIMENTO">🏗️ Investimento (Bens Permanentes / Capital)</option>
              </select>
            </div>
            <div className="form-group margin-top-sm">
              <label htmlFor="edit_mat_unidade_medida">Unidade de Medida *</label>
              <input 
                type="text" 
                id="edit_mat_unidade_medida" 
                className="form-control" 
                placeholder="Ex: cx, un, pot, pct" 
                value={un}
                onChange={(e) => setUn(e.target.value)}
                required 
              />
            </div>
            <div className="form-group margin-top-sm">
              <label htmlFor="edit_mat_valor_estimado">Valor Unitário Estimado (R$)</label>
              <input 
                type="number" 
                step="0.01" 
                id="edit_mat_valor_estimado" 
                className="form-control" 
                placeholder="0.00"
                value={val}
                onChange={(e) => setVal(e.target.value)}
              />
            </div>
            <div className="form-group margin-top-sm">
              <label htmlFor="edit_mat_qtd_estoque">Quantidade Atual em Estoque *</label>
              <input 
                type="number" 
                min="0" 
                id="edit_mat_qtd_estoque" 
                className="form-control" 
                value={est}
                onChange={(e) => setEst(e.target.value)}
                required 
              />
            </div>
            <div className="form-group margin-top-sm">
              <label htmlFor="edit_mat_limite_max">
                <i className="fa-solid fa-hand-halved text-rose"></i> Limite Máximo por Pedido (Gestor)
              </label>
              <input 
                type="number" 
                min="1" 
                id="edit_mat_limite_max" 
                className="form-control" 
                placeholder="Ex: 10 (Deixe em branco para sem limite)"
                value={limiteMax}
                onChange={(e) => setLimiteMax(e.target.value)}
              />
              <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                O solicitante só poderá solicitar até esta quantidade limite por pedido.
              </small>
            </div>
            <div className="form-actions margin-top-md">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary">
                <i className="fa-solid fa-floppy-disk"></i> Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
