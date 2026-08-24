import React from 'react';
import { PedidoPBS, UnidadeSaude, Material, PerfilUsuario } from '../../types';

interface Props {
  pedido: PedidoPBS | null;
  unidades: UnidadeSaude[];
  materiais: Material[];
  perfilAtual?: PerfilUsuario;
  isOpen: boolean;
  onClose: () => void;
  formatarData: (d?: string | null) => string;
  formatarMoeda: (v: number) => string;
}

export const ModalFichaPbs: React.FC<Props> = ({
  pedido,
  unidades,
  materiais,
  perfilAtual,
  isOpen,
  onClose,
  formatarData,
  formatarMoeda
}) => {
  if (!isOpen || !pedido) return null;

  const isGestor = perfilAtual === 'GESTOR';
  const u = unidades.find(uni => uni.id === pedido.unidade_emitente_id);
  const nomeUnidade = u ? u.nome : `Unidade #${pedido.unidade_emitente_id}`;

  // Calcular valor total solicitado e atendido a partir da soma exata dos itens da ficha
  const valorTotalSolicitado = (pedido.itens || []).reduce((acc, item) => {
    const vUnit = Number(item.valor_unitario) || 0;
    const qPed = Number(item.qtd_pedida) || 0;
    return acc + (qPed * vUnit);
  }, 0);

  const valorTotalAtendido = (pedido.itens || []).reduce((acc, item) => {
    const vUnit = Number(item.valor_unitario) || 0;
    const qAtend = Number(item.qtd_atendida) || 0;
    return acc + (qAtend * vUnit);
  }, 0);

  return (
    <div className={`modal ${isOpen ? 'active' : ''}`}>
      <div className="modal-content modal-xl print-container">
        <div className="modal-header no-print">
          <h3><i className="fa-solid fa-print"></i> Visualizador e Impressão de Ficha PBS</h3>
          <div>
            <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
              <i className="fa-solid fa-print"></i> Imprimir Ficha / Salvar PDF
            </button>
            <button className="modal-close" onClick={onClose} style={{ marginLeft: '10px' }}>&times;</button>
          </div>
        </div>

        <div className="modal-body print-area">
          <div className="pbs-print-sheet">
            <div className="pbs-print-header">
              <h2>SECRETARIA MUNICIPAL DE SAÚDE</h2>
              <h3>PEDIDO DE BENS E SERVIÇOS (PBS) - Nº {pedido.numero_pbs}</h3>
              <p style={{ fontSize: '9pt', marginTop: '5px' }}>
                Status do Ciclo: <strong>{pedido.status}</strong> | Emissão: {formatarData(pedido.data_pedido)}
              </p>
            </div>

            <table style={{ width: '100%', fontSize: '10pt', borderCollapse: 'collapse', marginBottom: '15px' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '4px', border: '1px solid #000' }}><strong>UNIDADE EMITENTE:</strong> {nomeUnidade}</td>
                  <td style={{ padding: '4px', border: '1px solid #000' }}><strong>DATA PEDIDO:</strong> {formatarData(pedido.data_pedido)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px', border: '1px solid #000' }}><strong>RESPONSÁVEL USF:</strong> {pedido.responsavel_nome}</td>
                  <td style={{ padding: '4px', border: '1px solid #000' }}><strong>FUNÇÃO/REGISTRO:</strong> {(pedido.responsavel_funcao || '')} - {(pedido.responsavel_registro || '')}</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px', border: '1px solid #000' }}><strong>ATIVIDADE/PROGRAMA:</strong> {pedido.atividade_programa || 'N/I'}</td>
                  <td style={{ padding: '4px', border: '1px solid #000' }}><strong>ELEMENTO DESPESA:</strong> {pedido.elemento_despesa || 'N/I'}</td>
                </tr>
              </tbody>
            </table>

            <h4 style={{ fontSize: '11pt', marginBottom: '5px', textTransform: 'uppercase' }}>1. ITENS E INSUMOS SOLICITADOS / ATENDIDOS</h4>
            <table className="pbs-print-table">
              <thead>
                <tr>
                  <th style={{ width: '35px' }}>ITEM</th>
                  <th>DESCRIÇÃO DO MATERIAL / INSUMO</th>
                  <th style={{ width: '50px' }}>UNID.</th>
                  <th style={{ width: '60px' }}>QTD. PED.</th>
                  <th style={{ width: '60px' }}>QTD. ATEND.</th>
                  {isGestor && <th style={{ width: '80px' }}>VALOR UNIT.</th>}
                  {isGestor && <th style={{ width: '85px' }}>TOT. SOLIC.</th>}
                  {isGestor && <th style={{ width: '85px' }}>TOT. ATEND.</th>}
                </tr>
              </thead>
              <tbody>
                {(pedido.itens || []).map(it => {
                  const mat = materiais.find(m => m.id === it.material_id);
                  const valSolicitado = (Number(it.qtd_pedida) || 0) * (Number(it.valor_unitario) || 0);
                  const valAtendido = (Number(it.qtd_atendida) || 0) * (Number(it.valor_unitario) || 0);
                  return (
                    <tr key={it.id}>
                      <td style={{ textAlign: 'center' }}>{it.numero_item}</td>
                      <td>{mat ? mat.descricao : `Material #${it.material_id}`}</td>
                      <td style={{ textAlign: 'center' }}>{mat ? mat.unidade_medida : 'un'}</td>
                      <td style={{ textAlign: 'center' }}><strong>{it.qtd_pedida}</strong></td>
                      <td style={{ textAlign: 'center', color: it.qtd_atendida > 0 ? '#047857' : '#000' }}>
                        <strong>{it.qtd_atendida || 0}</strong>
                      </td>
                      {isGestor && <td style={{ textAlign: 'right' }}>{formatarMoeda(it.valor_unitario)}</td>}
                      {isGestor && <td style={{ textAlign: 'right' }}>{formatarMoeda(valSolicitado)}</td>}
                      {isGestor && (
                        <td style={{ textAlign: 'right', fontWeight: 'bold', color: valAtendido > 0 ? '#047857' : '#000' }}>
                          {formatarMoeda(valAtendido)}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              {isGestor && (
                <tfoot>
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'right' }}><strong>SUBTOTAIS E RESUMO FINANCEIRO:</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{formatarMoeda(valorTotalSolicitado)}</strong></td>
                    <td style={{ textAlign: 'right', color: '#047857' }}><strong>{formatarMoeda(valorTotalAtendido)}</strong></td>
                  </tr>
                </tfoot>
              )}
            </table>

            {/* Card Resumo Financeiro apenas para Gestor */}
            {isGestor && (
              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end', gap: '15px', fontSize: '9.5pt' }}>
                <div style={{ background: '#f8fafc', padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                  Total Solicitado: <strong>{formatarMoeda(valorTotalSolicitado)}</strong>
                </div>
                <div style={{ background: '#ecfdf5', padding: '6px 12px', border: '1px solid #a7f3d0', borderRadius: '4px', color: '#065f46' }}>
                  Total Efetivamente Atendido/Liberado: <strong>{formatarMoeda(valorTotalAtendido)}</strong>
                </div>
              </div>
            )}

            <div style={{ marginTop: '15px', border: '1px solid #000', padding: '8px', fontSize: '9pt' }}>
              <strong>OBSERVAÇÕES DA USF:</strong> {pedido.observacoes || 'Sem observações.'}
            </div>

            <div style={{ marginTop: '15px', border: '1px solid #000', padding: '8px', fontSize: '9pt' }}>
              <strong>RASTREABILIDADE DE RECEPÇÃO E ENVIO (ALMOXARIFADO CENTRAL):</strong><br />
              - Recebimento no Almoxarifado: <strong>{pedido.apontador_recebimento_nome || 'Pendente'}</strong> em <strong>{pedido.data_recebimento ? formatarData(pedido.data_recebimento) : 'N/D'}</strong><br />
              - Despacho / Envio do Material: <strong>{pedido.apontador_envio_nome || 'Pendente'}</strong> em <strong>{pedido.data_envio ? formatarData(pedido.data_envio) : 'N/D'}</strong>
            </div>

            <div className="pbs-print-signatures">
              <div className="pbs-sig-box">
                <strong>{pedido.responsavel_nome}</strong><br />
                {pedido.responsavel_funcao || 'Solicitante USF'}<br />
                {pedido.responsavel_registro || ''}
              </div>
              <div className="pbs-sig-box">
                <strong>{pedido.apontador_recebimento_nome || '___________________________'}</strong><br />
                Conferência / Recebedor Almoxarifado
              </div>
              <div className="pbs-sig-box">
                <strong>{pedido.apontador_envio_nome || '___________________________'}</strong><br />
                Responsável pelo Despacho / Envio
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
