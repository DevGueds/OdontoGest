import React, { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (nome: string, tipo?: string) => void;
}

export const ModalUnidade: React.FC<Props> = ({ isOpen, onClose, onConfirm }) => {
  const [nome, setNome] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    onConfirm(nome.trim(), 'UNIDADE');
    setNome('');
  };

  return (
    <div className={`modal ${isOpen ? 'active' : ''}`}>
      <div className="modal-content">
        <div className="modal-header">
          <h3><i className="fa-solid fa-hospital"></i> Cadastrar Novo Estabelecimento de Saúde (Gestor)</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="uni_nome">Nome do Estabelecimento *</label>
              <input 
                type="text" 
                id="uni_nome" 
                className="form-control" 
                placeholder="Ex: USF BAIRRO NOVO" 
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required 
              />
            </div>
            <div className="form-actions margin-top-md">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Cadastrar Estabelecimento</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
