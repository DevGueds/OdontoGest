import React, { useState, useEffect } from 'react';
import { PedidoPBS, Material } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from '../ui/table';
import { Boxes, Save, X, AlertTriangle } from 'lucide-react';

interface Props {
  pedido: PedidoPBS | null;
  materiais: Material[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (pedidoId: number, itensAtendidos: { item_id: number; material_id: number; qtd_atendida: number }[]) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const ModalAtendimento: React.FC<Props> = ({
  pedido,
  materiais,
  isOpen,
  onClose,
  onConfirm,
  showToast
}) => {
  const [qtds, setQtds] = useState<Record<number, number>>({});

  useEffect(() => {
    if (isOpen && pedido) {
      const initialQtds: Record<number, number> = {};
      pedido.itens.forEach(it => {
        initialQtds[it.id] = it.qtd_atendida || 0;
      });
      setQtds(initialQtds);
    }
  }, [isOpen, pedido]);

  if (!isOpen || !pedido) return null;

  const handleQtdChange = (itemId: number, val: number) => {
    setQtds(prev => ({ ...prev, [itemId]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let excessoDetectado = false;
    const itensAtendidos = pedido.itens.map(it => {
      const qAtendida = Number(qtds[it.id]) || 0;
      const mat = materiais.find(m => m.id === it.material_id);
      const estAtual = mat ? (mat.qtd_estoque ?? 0) : 0;
      const estMax = estAtual + (it.qtd_atendida || 0);

      if (qAtendida > estMax) {
        excessoDetectado = true;
        const desc = mat ? mat.descricao : `Material #${it.material_id}`;
        showToast(`Quantidade liberada de "${desc}" (${qAtendida}) é maior que o estoque disponível (${estMax}).`, 'error');
      }

      return {
        item_id: it.id,
        material_id: it.material_id,
        qtd_atendida: qAtendida
      };
    });

    if (excessoDetectado) return;
    onConfirm(pedido.id, itensAtendidos);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/60 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in-0 duration-150">
      <div className="min-h-full flex justify-center items-start">
        <div className="w-full max-w-3xl my-auto rounded-[12px] border border-[#E8E8EC] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:border-zinc-800 dark:bg-[#121215] relative max-h-[90vh] flex flex-col">
        <button 
          onClick={onClose} 
          className="absolute right-4 top-4 rounded-[6px] p-1 text-[#9C9C9C] hover:text-[#0A0A0A] dark:hover:text-zinc-200 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2.5 pb-4 border-b border-[#E8E8EC] dark:border-zinc-800 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-[6px] bg-[#6366F1]/10 text-[#6366F1]">
            <Boxes className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0A0A0A] dark:text-zinc-100 font-display">
              Conferência e Atendimento de Itens - {pedido.numero_pbs}
            </h3>
            <p className="text-xs text-[#6B6B6B] dark:text-zinc-400">
              Informe a quantidade efetivamente atendida e liberada para o pedido
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden mt-4">
          <div className="flex-1 overflow-y-auto pr-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Material / Insumo</TableHead>
                  <TableHead className="w-20">Unidade</TableHead>
                  <TableHead className="w-28 text-center">Solicitado</TableHead>
                  <TableHead className="w-32">Estoque Atual</TableHead>
                  <TableHead className="w-32 text-center">Qtd. Liberada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pedido.itens.map((it, idx) => {
                  const mat = materiais.find(m => m.id === it.material_id);
                  const desc = mat ? mat.descricao : `Material #${it.material_id}`;
                  const un = mat ? mat.unidade_medida : 'un';
                  const estAtual = mat ? (mat.qtd_estoque ?? 0) : 0;
                  const qtdAtend = qtds[it.id] ?? (it.qtd_atendida || 0);
                  const estMax = estAtual + (it.qtd_atendida || 0);

                  let badgeEstoque = <Badge variant="success">{estAtual} {un}</Badge>;
                  if (estAtual === 0) {
                    badgeEstoque = <Badge variant="destructive">Esgotado</Badge>;
                  } else if (estAtual < 20) {
                    badgeEstoque = <Badge variant="warning">{estAtual} {un}</Badge>;
                  }

                  return (
                    <TableRow key={it.id}>
                      <TableCell className="font-mono text-xs font-bold text-[#6B6B6B]">{idx + 1}</TableCell>
                      <TableCell className="font-semibold text-xs text-[#0A0A0A] dark:text-zinc-100">{desc}</TableCell>
                      <TableCell><Badge variant="outline">{un}</Badge></TableCell>
                      <TableCell className="text-center font-bold text-xs">{it.qtd_pedida}</TableCell>
                      <TableCell>{badgeEstoque}</TableCell>
                      <TableCell className="text-center">
                        <Input 
                          type="number" 
                          min="0" 
                          max={estMax} 
                          value={qtdAtend}
                          onChange={(e) => handleQtdChange(it.id, parseInt(e.target.value) || 0)}
                          className="h-8 w-24 mx-auto text-center font-semibold text-xs"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8E8EC] dark:border-zinc-800 shrink-0 mt-4">
            <Button type="button" variant="outline" onClick={onClose} size="sm">
              Cancelar
            </Button>
            <Button type="submit" size="sm" className="text-xs">
              <Save className="h-3.5 w-3.5 mr-1" /> Salvar Quantidades Atendidas
            </Button>
          </div>
        </form>
      </div>
    </div>
  </div>
);
};
