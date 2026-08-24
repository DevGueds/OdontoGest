import React, { useState, useEffect } from 'react';
import { Material } from '../../types';

interface Props {
  material: Material | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (materialId: number, novaQtd: number) => void;
}

export const ModalAjusteEstoque: React.FC<Props> = ({ material, isOpen, onClose, onConfirm }) => {
  const [novaQtd, setNovaQtd] = useState('');

  useEffect(() => {
    if (isOpen && material) {
      setNovaQtd(String(material.qtd_estoque ?? 100));
    }
  }, [isOpen, material]);

  if (!isOpen || !material) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(material.id, parseInt(novaQtd) || 0);
  };

  return (
    <div className={`modal ${isOpen ? 'active' : ''}`}>
      <div className="modal-content">
        <div className="modal-header">
          <h3><i className="fa-solid fa-boxes-stacked"></i> Ajustar / Repor Estoque</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <p>Altere a quantidade total disponível em estoque para <strong>{material.descricao}</strong>.</p>
          <form onSubmit={handleSubmit}>
            <div className="form-group margin-top-sm">
              <label htmlFor="modalAjusteNovaQtd">Nova Quantidade em Estoque *</label>
              <input 
                type="number" 
                min="0" 
                id="modalAjusteNovaQtd" 
                className="form-control" 
                value={novaQtd}
                onChange={(e) => setNovaQtd(e.target.value)}
                required 
              />
            </div>
            <div className="form-actions margin-top-md">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-success">
                <i className="fa-solid fa-check"></i> Salvar Estoque
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
