import React, { useState, useEffect } from 'react';
import { Material, NaturezaDespesa } from '../../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Pencil, Save } from 'lucide-react';

interface Props {
  material: Material | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (materialId: number, dados: Partial<Material>) => void;
}

export const ModalEditarMaterial: React.FC<Props> = ({ material, isOpen, onClose, onConfirm }) => {
  const [desc, setDesc] = useState('');
  const [fornecedor, setFornecedor] = useState('');
  const [un, setUn] = useState('');
  const [val, setVal] = useState('');
  const [est, setEst] = useState('');
  const [limiteMax, setLimiteMax] = useState('');
  const [natureza, setNatureza] = useState<NaturezaDespesa>('CUSTEIO');

  useEffect(() => {
    if (isOpen && material) {
      setDesc(material.descricao);
      setFornecedor(material.fornecedor || '');
      setUn(material.unidade_medida);
      setVal((material.valor_estimado || 0).toFixed(2));
      setEst(String(material.qtd_estoque ?? 100));
      setLimiteMax(material.limite_max_pedido !== undefined && material.limite_max_pedido !== null ? String(material.limite_max_pedido) : '');
      setNatureza(material.natureza || 'CUSTEIO');
    }
  }, [isOpen, material]);

  if (!material) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lMax = limiteMax.trim() !== '' ? parseInt(limiteMax) : null;
    const forn = fornecedor.trim() !== '' ? fornecedor.trim() : null;
    onConfirm(material.id, {
      descricao: desc,
      fornecedor: forn,
      unidade_medida: un,
      valor_estimado: parseFloat(val) || 0,
      qtd_estoque: parseInt(est) || 0,
      limite_max_pedido: lMax,
      natureza
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-primary" />
            Editar Insumo & Configurações
          </DialogTitle>
          <DialogDescription>
            Atualize as especificações, custos ou limite por pedido do insumo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label htmlFor="edit_mat_descricao" className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Descrição do Insumo / Material *
            </label>
            <Input 
              type="text" 
              id="edit_mat_descricao" 
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              required 
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="edit_mat_fornecedor" className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Fornecedor / Distribuidor (Gestor)
            </label>
            <Input 
              type="text" 
              id="edit_mat_fornecedor" 
              placeholder="Ex: MedLab Ltda" 
              value={fornecedor}
              onChange={(e) => setFornecedor(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="edit_mat_natureza" className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Natureza da Despesa / Recursos *
            </label>
            <select 
              id="edit_mat_natureza"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={natureza}
              onChange={(e) => setNatureza(e.target.value as NaturezaDespesa)}
              required
            >
              <option value="CUSTEIO">💳 Custeio (Insumos de Consumo Operacional)</option>
              <option value="INVESTIMENTO">🏗️ Investimento (Bens Permanentes / Capital)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="edit_mat_unidade_medida" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Unidade Medida *
              </label>
              <Input 
                type="text" 
                id="edit_mat_unidade_medida" 
                placeholder="Ex: cx, un, pct" 
                value={un}
                onChange={(e) => setUn(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="edit_mat_valor_estimado" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Valor Estimado (R$)
              </label>
              <Input 
                type="number" 
                step="0.01" 
                id="edit_mat_valor_estimado" 
                placeholder="0.00"
                value={val}
                onChange={(e) => setVal(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="edit_mat_qtd_estoque" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Estoque Atual *
              </label>
              <Input 
                type="number" 
                min="0" 
                id="edit_mat_qtd_estoque" 
                value={est}
                onChange={(e) => setEst(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="edit_mat_limite_max" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Limite Máx./Pedido
              </label>
              <Input 
                type="number" 
                min="1" 
                id="edit_mat_limite_max" 
                placeholder="Sem limite"
                value={limiteMax}
                onChange={(e) => setLimiteMax(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="gap-2">
              <Save className="w-4 h-4" />
              Salvar Alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
