import React, { useState, useEffect } from 'react';
import { UnidadeSaude } from '../../types';

interface Props {
  unidade: UnidadeSaude | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: number, nome: string, tipo?: string) => void;
}

export const ModalEditarUnidade: React.FC<Props> = ({ unidade, isOpen, onClose, onConfirm }) => {
  const [nome, setNome] = useState('');

  useEffect(() => {
    if (isOpen && unidade) {
      setNome(unidade.nome);
    }
  }, [isOpen, unidade]);

  if (!isOpen || !unidade) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    onConfirm(unidade.id, nome.trim(), unidade.tipo || 'UNIDADE');
  };

  return (
    <div className={`modal ${isOpen ? 'active' : ''}`}>
      <div className="modal-content">
        <div className="modal-header">
          <h3><i className="fa-solid fa-pen-to-square"></i> Editar Nome do Estabelecimento de Saúde</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="edit_uni_nome">Nome do Estabelecimento *</label>
              <input 
                type="text" 
                id="edit_uni_nome" 
                className="form-control" 
                placeholder="Ex: USF BAIRRO NOVO" 
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required 
              />
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
