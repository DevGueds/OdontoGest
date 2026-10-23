import React, { useState } from 'react';
import { NaturezaDespesa } from '../../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { PackagePlus, Save } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (desc: string, un: string, val: number, est: number, limiteMax?: number | null, fornecedor?: string | null, natureza?: NaturezaDespesa) => void;
}

export const ModalMaterial: React.FC<Props> = ({ isOpen, onClose, onConfirm }) => {
  const [desc, setDesc] = useState('');
  const [fornecedor, setFornecedor] = useState('');
  const [un, setUn] = useState('');
  const [val, setVal] = useState('');
  const [est, setEst] = useState('100');
  const [limiteMax, setLimiteMax] = useState('');
  const [natureza, setNatureza] = useState<NaturezaDespesa>('CUSTEIO');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lMax = limiteMax.trim() !== '' ? parseInt(limiteMax) : null;
    const forn = fornecedor.trim() !== '' ? fornecedor.trim() : null;
    onConfirm(desc, un, parseFloat(val) || 0, parseInt(est) || 100, lMax, forn, natureza);
    setDesc('');
    setFornecedor('');
    setUn('');
    setVal('');
    setEst('100');
    setLimiteMax('');
    setNatureza('CUSTEIO');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-primary" />
            Cadastrar Novo Material (Gestor)
          </DialogTitle>
          <DialogDescription>
            Adicione um novo insumo odontológico ao catálogo geral.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label htmlFor="mat_descricao" className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Descrição do Insumo / Material *
            </label>
            <Input 
              type="text" 
              id="mat_descricao" 
              placeholder="Ex: Luvas de Procedimento (P)" 
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              required 
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="mat_fornecedor" className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Fornecedor / Distribuidor (Gestor)
            </label>
            <Input 
              type="text" 
              id="mat_fornecedor" 
              placeholder="Ex: MedLab Distribuidora Ltda" 
              value={fornecedor}
              onChange={(e) => setFornecedor(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">
              O solicitante verá apenas a descrição ("{desc || 'Insumo'}").
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="mat_natureza" className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Natureza da Despesa / Recursos *
            </label>
            <select 
              id="mat_natureza"
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
              <label htmlFor="mat_unidade_medida" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Unidade Medida *
              </label>
              <Input 
                type="text" 
                id="mat_unidade_medida" 
                placeholder="Ex: cx, un, pct" 
                value={un}
                onChange={(e) => setUn(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="mat_valor_estimado" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Valor Estimado (R$)
              </label>
              <Input 
                type="number" 
                step="0.01" 
                id="mat_valor_estimado" 
                placeholder="0.00"
                value={val}
                onChange={(e) => setVal(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="mat_qtd_estoque" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Estoque Inicial *
              </label>
              <Input 
                type="number" 
                min="0" 
                id="mat_qtd_estoque" 
                value={est}
                onChange={(e) => setEst(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="mat_limite_max" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Limite Máx./Pedido
              </label>
              <Input 
                type="number" 
                min="1" 
                id="mat_limite_max" 
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
              Cadastrar Material
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
