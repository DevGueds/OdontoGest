import React, { useState, useEffect } from 'react';
import { PedidoPBS } from '../../types';

interface Props {
  pedido: PedidoPBS | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (pedidoId: number, apontador: string, dataRec: string) => void;
}

export const ModalRecebimento: React.FC<Props> = ({ pedido, isOpen, onClose, onConfirm }) => {
  const [apontador, setApontador] = useState('');
  const [dataRec, setDataRec] = useState(new Date().toISOString().substring(0, 10));

  useEffect(() => {
    if (isOpen) {
      setApontador('');
      setDataRec(new Date().toISOString().substring(0, 10));
    }
  }, [isOpen]);

  if (!isOpen || !pedido) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(pedido.id, apontador, dataRec);
  };

  return (
    <div className={`modal ${isOpen ? 'active' : ''}`}>
      <div className="modal-content">
        <div className="modal-header">
          <h3><i className="fa-solid fa-clipboard-check"></i> Registrar Recepção da Solicitação</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <p>O Gestor do Almoxarifado Central irá confirmar o recebimento do pedido <strong>{pedido.numero_pbs}</strong>.</p>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group margin-top-sm">
              <label htmlFor="apontador_recebimento_nome">Nome do Recebedor / Almoxarife *</label>
              <input 
                type="text" 
                id="apontador_recebimento_nome" 
                className="form-control" 
                placeholder="Ex: Carlos Eduardo - Gestor Almoxarifado" 
                value={apontador}
                onChange={(e) => setApontador(e.target.value)}
                required 
              />
            </div>

            <div className="form-group margin-top-sm">
              <label htmlFor="data_recebimento">Data do Recebimento *</label>
              <input 
                type="date" 
                id="data_recebimento" 
                className="form-control" 
                value={dataRec}
                onChange={(e) => setDataRec(e.target.value)}
                required 
              />
            </div>

            <div className="form-actions margin-top-md">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-success">
                <i className="fa-solid fa-check-double"></i> Confirmar como RECEBIDO
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
