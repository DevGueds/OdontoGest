import React, { useState, useEffect } from 'react';
import { PedidoPBS } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Truck, Calendar, User, X } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in-0 duration-150">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 relative">
        <button 
          onClick={onClose} 
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950/80 dark:text-teal-300">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
              Registrar Envio / Despacho
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Confirmar despacho para a USF do pedido <strong>{pedido.numero_pbs}</strong>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="apontador_envio_nome" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-teal-600" /> Responsável pelo Envio / Motorista *
            </label>
            <Input 
              type="text" 
              id="apontador_envio_nome" 
              placeholder="Ex: João Pedro - Despachante / Motorista" 
              value={apontador}
              onChange={(e) => setApontador(e.target.value)}
              required 
              className="h-10 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="data_envio" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-teal-600" /> Data do Despacho *
            </label>
            <Input 
              type="date" 
              id="data_envio" 
              value={dataEnv}
              onChange={(e) => setDataEnv(e.target.value)}
              required 
              className="h-10 text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={onClose} size="sm">
              Cancelar
            </Button>
            <Button type="submit" variant="emerald" size="sm" className="font-semibold text-xs">
              <Truck className="h-3.5 w-3.5 mr-1" /> Confirmar Status ENVIADO
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
