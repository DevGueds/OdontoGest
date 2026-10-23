import React, { useState, useEffect } from 'react';
import { Material } from '../../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Boxes, Check } from 'lucide-react';

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

  if (!material) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(material.id, parseInt(novaQtd) || 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-primary" />
            Ajustar / Repor Estoque
          </DialogTitle>
          <DialogDescription>
            Altere a quantidade total disponível em estoque para <strong className="text-foreground">{material.descricao}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label htmlFor="modalAjusteNovaQtd" className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Nova Quantidade em Estoque ({material.unidade_medida}) *
            </label>
            <Input 
              type="number" 
              min="0" 
              id="modalAjusteNovaQtd" 
              value={novaQtd}
              onChange={(e) => setNovaQtd(e.target.value)}
              required 
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="emerald" className="gap-2">
              <Check className="w-4 h-4" />
              Salvar Estoque
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
