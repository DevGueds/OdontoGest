import React, { useState, useEffect } from 'react';
import { UnidadeSaude } from '../../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Pencil, Save, X } from 'lucide-react';

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

  if (!unidade) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    onConfirm(unidade.id, nome.trim(), unidade.tipo || 'UNIDADE');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-primary" />
            Editar Estabelecimento de Saúde
          </DialogTitle>
          <DialogDescription>
            Altere a denominação do posto de saúde ou unidade.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label htmlFor="edit_uni_nome" className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Nome do Estabelecimento *
            </label>
            <Input 
              type="text" 
              id="edit_uni_nome" 
              placeholder="Ex: USF BAIRRO NOVO" 
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required 
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="gap-1.5 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 dark:hover:border-rose-800 transition-colors"
              title="Cancelar e fechar formulário"
              aria-label="Cancelar"
            >
              <X className="w-4 h-4" />
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="gap-2 hover:shadow-md transition-all"
              title="Salvar alterações na unidade de saúde"
              aria-label="Salvar Alterações"
            >
              <Save className="w-4 h-4" />
              Salvar Alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
