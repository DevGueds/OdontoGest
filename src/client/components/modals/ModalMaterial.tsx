import { Modal } from '../Modal';
import React, { useState } from 'react';
import { NaturezaDespesa } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (desc: string, un: string, val: number, est: number, limiteMax?: number | null, fornecedor?: string | null, natureza?: NaturezaDespesa) => Promise<boolean | void>;
}

export const ModalMaterial: React.FC<Props> = ({ isOpen, onClose, onConfirm }) => {
  const [desc, setDesc] = useState('');
  const [fornecedor, setFornecedor] = useState('');
  const [un, setUn] = useState('');
  const [val, setVal] = useState('');
  const [est, setEst] = useState('0');
  const [limiteMax, setLimiteMax] = useState('');
  const [natureza, setNatureza] = useState<NaturezaDespesa>('CUSTEIO');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const lMax = limiteMax.trim() !== '' ? parseInt(limiteMax) : null;
    const forn = fornecedor.trim() !== '' ? fornecedor.trim() : null;
    if (!await onConfirm(desc, un, parseFloat(val) || 0, parseInt(est) || 0, lMax, forn, natureza)) return;
    setDesc('');
    setFornecedor('');
    setUn('');
    setVal('');
    setEst('0');
    setLimiteMax('');
    setNatureza('CUSTEIO');
  };

  return (
    <Modal onClose={onClose}>
      <div className="modal-content">
        <div className="modal-header">
          <h3><i className="fa-solid fa-box"></i> Cadastrar novo material</h3>
          <button type="button" aria-label="Fechar janela" className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="mat_descricao">Descrição do Insumo / Material *</label>
              <input 
                type="text" 
                id="mat_descricao" 
                className="form-control" 
                placeholder="Ex: Luvas (P)" 
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                required 
              />
            </div>
            <div className="form-group margin-top-sm">
              <label htmlFor="mat_fornecedor">Fornecedor / Distribuidor</label>
              <input 
                type="text" 
                id="mat_fornecedor" 
                className="form-control" 
                placeholder="Ex: MedLab Ltda, Distribuidora Saúde A" 
                value={fornecedor}
                onChange={(e) => setFornecedor(e.target.value)}
              />
              <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                Informe o fornecedor associado a este registro de estoque.
              </small>
            </div>
            <div className="form-group margin-top-sm">
              <label htmlFor="mat_natureza">Natureza da Despesa / Recursos *</label>
              <select 
                id="mat_natureza"
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
              <label htmlFor="mat_unidade_medida">Unidade de Medida *</label>
              <input 
                type="text" 
                id="mat_unidade_medida" 
                className="form-control" 
                placeholder="Ex: cx, un, pot, pct" 
                value={un}
                onChange={(e) => setUn(e.target.value)}
                required 
              />
            </div>
            <div className="form-group margin-top-sm">
              <label htmlFor="mat_valor_estimado">Valor Unitário Estimado (R$)</label>
              <input 
                type="number" 
                step="0.01" 
                id="mat_valor_estimado" 
                className="form-control" 
                placeholder="0.00"
                value={val}
                onChange={(e) => setVal(e.target.value)}
              />
            </div>
            <div className="form-group margin-top-sm">
              <label htmlFor="mat_qtd_estoque">Estoque Inicial (Quantidade) *</label>
              <input 
                type="number" 
                min="0" 
                id="mat_qtd_estoque" 
                className="form-control" 
                value={est}
                onChange={(e) => setEst(e.target.value)}
                required 
              />
            </div>
            <div className="form-group margin-top-sm">
              <label htmlFor="mat_limite_max">
                <i className="fa-solid fa-hand-halved text-rose"></i> Limite máximo por pedido
              </label>
              <input 
                type="number" 
                min="1" 
                id="mat_limite_max" 
                className="form-control" 
                placeholder="Ex: 10 (Deixe em branco para sem limite)"
                value={limiteMax}
                onChange={(e) => setLimiteMax(e.target.value)}
              />
              <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                O solicitante só poderá pedir até esta quantidade limite por pedido.
              </small>
            </div>
            <div className="form-actions margin-top-md">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Cadastrar Material</button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
};
