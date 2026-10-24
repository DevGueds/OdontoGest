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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/60 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in-0 duration-150">
      <div className="min-h-full flex justify-center items-start">
        <div className="w-full max-w-lg my-auto rounded-[12px] border border-[#E8E8EC] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:border-zinc-800 dark:bg-[#121215] relative">
        <button 
          onClick={onClose} 
          className="absolute right-4 top-4 rounded-[6px] p-1 text-[#9C9C9C] hover:text-[#0A0A0A] dark:hover:text-zinc-200 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2.5 pb-4 border-b border-[#E8E8EC] dark:border-zinc-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-[6px] bg-[#2563EB]/10 text-[#2563EB]">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0A0A0A] dark:text-zinc-100 font-display">
              Registrar Envio / Despacho
            </h3>
            <p className="text-xs text-[#6B6B6B] dark:text-zinc-400">
              Confirmar despacho para a USF do pedido <strong>{pedido.numero_pbs}</strong>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="apontador_envio_nome" className="text-xs font-medium text-[#0A0A0A] dark:text-zinc-300 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-[#6B6B6B]" /> Responsável pelo Envio / Motorista *
            </label>
            <Input 
              type="text" 
              id="apontador_envio_nome" 
              placeholder="Ex: João Pedro - Despachante / Motorista" 
              value={apontador}
              onChange={(e) => setApontador(e.target.value)}
              required 
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="data_envio" className="text-xs font-medium text-[#0A0A0A] dark:text-zinc-300 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-[#6B6B6B]" /> Data do Despacho *
            </label>
            <Input 
              type="date" 
              id="data_envio" 
              value={dataEnv}
              onChange={(e) => setDataEnv(e.target.value)}
              required 
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8E8EC] dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={onClose} size="sm">
              Cancelar
            </Button>
            <Button type="submit" variant="default" size="sm" className="text-xs">
              <Truck className="h-3.5 w-3.5 mr-1" /> Confirmar Envio
            </Button>
          </div>
        </form>
      </div>
    </div>
  </div>
);
};
