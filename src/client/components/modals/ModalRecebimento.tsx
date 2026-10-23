import React, { useState, useEffect } from 'react';
import { PedidoPBS } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ClipboardCheck, Calendar, User, X } from 'lucide-react';

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
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
              Registrar Recepção da Solicitação
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Confirmar o recebimento no Almoxarifado Central do pedido <strong>{pedido.numero_pbs}</strong>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="apontador_recebimento_nome" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-teal-600" /> Nome do Recebedor / Almoxarife *
            </label>
            <Input 
              type="text" 
              id="apontador_recebimento_nome" 
              placeholder="Ex: Carlos Eduardo - Almoxarifado Central" 
              value={apontador}
              onChange={(e) => setApontador(e.target.value)}
              required 
              className="h-10 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="data_recebimento" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-teal-600" /> Data do Recebimento *
            </label>
            <Input 
              type="date" 
              id="data_recebimento" 
              value={dataRec}
              onChange={(e) => setDataRec(e.target.value)}
              required 
              className="h-10 text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={onClose} size="sm">
              Cancelar
            </Button>
            <Button type="submit" variant="emerald" size="sm" className="font-semibold text-xs">
              <ClipboardCheck className="h-3.5 w-3.5 mr-1" /> Confirmar como RECEBIDO
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
