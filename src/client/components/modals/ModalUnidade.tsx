import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Building2, Plus } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (nome: string, tipo?: string) => void;
}

export const ModalUnidade: React.FC<Props> = ({ isOpen, onClose, onConfirm }) => {
  const [nome, setNome] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    onConfirm(nome.trim(), 'UNIDADE');
    setNome('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Cadastrar Estabelecimento de Saúde
          </DialogTitle>
          <DialogDescription>
            Insira o nome da nova unidade de saúde básica ou especializada.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label htmlFor="uni_nome" className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Nome do Estabelecimento *
            </label>
            <Input 
              type="text" 
              id="uni_nome" 
              placeholder="Ex: USF BAIRRO NOVO" 
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required 
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="gap-2">
              <Plus className="w-4 h-4" />
              Cadastrar Estabelecimento
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
