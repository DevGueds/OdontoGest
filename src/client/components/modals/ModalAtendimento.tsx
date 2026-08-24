import React, { useState, useEffect } from 'react';
import { PedidoPBS, Material } from '../../types';

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
    <div className={`modal ${isOpen ? 'active' : ''}`}>
      <div className="modal-content modal-lg">
        <div className="modal-header">
          <h3><i className="fa-solid fa-boxes-packing"></i> Conferência e Atendimento de Itens - {pedido.numero_pbs}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <p>Informe a quantidade efetivamente atendida/entregue para cada item solicitado.</p>

          <form onSubmit={handleSubmit}>
            <div className="table-responsive margin-top-sm">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Material / Insumo</th>
                    <th>Unidade</th>
                    <th>Qtd. Solicitada</th>
                    <th>Estoque Atual</th>
                    <th>Qtd. Liberada / Atendida</th>
                  </tr>
                </thead>
                <tbody>
                  {pedido.itens.map((it, idx) => {
                    const mat = materiais.find(m => m.id === it.material_id);
                    const desc = mat ? mat.descricao : `Material #${it.material_id}`;
                    const un = mat ? mat.unidade_medida : 'un';
                    const estAtual = mat ? (mat.qtd_estoque ?? 0) : 0;
                    const qtdAtend = qtds[it.id] ?? (it.qtd_atendida || 0);
                    const estMax = estAtual + (it.qtd_atendida || 0);

                    let badgeEstoque = <span className="badge badge-emerald"><i className="fa-solid fa-boxes-stacked"></i> {estAtual} {un}</span>;
                    if (estAtual === 0) {
                      badgeEstoque = <span className="badge badge-rose"><i className="fa-solid fa-triangle-exclamation"></i> Esgotado</span>;
                    } else if (estAtual < 20) {
                      badgeEstoque = <span className="badge badge-amber"><i className="fa-solid fa-box-open"></i> {estAtual} {un}</span>;
                    }

                    return (
                      <tr key={it.id}>
                        <td><strong>{idx + 1}</strong></td>
                        <td>{desc}</td>
                        <td><span className="badge badge-blue">{un}</span></td>
                        <td><strong>{it.qtd_pedida}</strong></td>
                        <td>{badgeEstoque}</td>
                        <td>
                          <input 
                            type="number" 
                            min="0" 
                            max={estMax} 
                            value={qtdAtend}
                            onChange={(e) => handleQtdChange(it.id, parseInt(e.target.value) || 0)}
                            className="form-control" 
                            style={{ width: '110px' }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="form-actions margin-top-md">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary">
                <i className="fa-solid fa-save"></i> Salvar Quantidades Atendidas
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
