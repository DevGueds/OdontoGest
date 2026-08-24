import React, { useState, useEffect } from 'react';
import { PedidoPBS } from '../../types';

interface Props {
  pedido: PedidoPBS | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (pedidoId: number, apontador: string, dataEnv: string) => void;
}

export const ModalEnvio: React.FC<Props> = ({ pedido, isOpen, onClose, onConfirm }) => {
  const [apontador, setApontador] = useState('');
  const [dataEnv, setDataEnv] = useState(new Date().toISOString().substring(0, 10));

  useEffect(() => {
    if (isOpen) {
      setApontador('');
      setDataEnv(new Date().toISOString().substring(0, 10));
    }
  }, [isOpen]);

  if (!isOpen || !pedido) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(pedido.id, apontador, dataEnv);
  };

  return (
    <div className={`modal ${isOpen ? 'active' : ''}`}>
      <div className="modal-content">
        <div className="modal-header">
          <h3><i className="fa-solid fa-truck-ramp-box"></i> Registrar Envio / Despacho dos Materiais</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <p>Confirmar que o pedido <strong>{pedido.numero_pbs}</strong> foi despachado para a USF.</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group margin-top-sm">
              <label htmlFor="apontador_envio_nome">Nome do Responsável pelo Envio / Transportador *</label>
              <input 
                type="text" 
                id="apontador_envio_nome" 
                className="form-control" 
                placeholder="Ex: João Pedro - Motorista / Despachante" 
                value={apontador}
                onChange={(e) => setApontador(e.target.value)}
                required 
              />
            </div>

            <div className="form-group margin-top-sm">
              <label htmlFor="data_envio">Data do Envio *</label>
              <input 
                type="date" 
                id="data_envio" 
                className="form-control" 
                value={dataEnv}
                onChange={(e) => setDataEnv(e.target.value)}
                required 
              />
            </div>

            <div className="form-actions margin-top-md">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-emerald">
                <i className="fa-solid fa-truck"></i> Confirmar Status ENVIADO
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
