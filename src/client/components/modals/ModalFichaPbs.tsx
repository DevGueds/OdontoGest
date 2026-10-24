import React from 'react';
import { PedidoPBS, UnidadeSaude, Material, PerfilUsuario } from '../../types';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Printer, X, FileText } from 'lucide-react';

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

  const handlePrint = () => {
    const itensHtml = (pedido.itens || []).map(it => {
      const mat = materiais.find(m => m.id === it.material_id);
      const valSolicitado = (Number(it.qtd_pedida) || 0) * (Number(it.valor_unitario) || 0);
      const valAtendido = (Number(it.qtd_atendida) || 0) * (Number(it.valor_unitario) || 0);
      
      let html = `
        <tr>
          <td style="text-align: center;">${it.numero_item}</td>
          <td>${mat ? mat.descricao : `Material #${it.material_id}`}</td>
          <td style="text-align: center;">${mat ? mat.unidade_medida : 'un'}</td>
          <td style="text-align: center;"><strong>${it.qtd_pedida}</strong></td>
          <td style="text-align: center; color: ${it.qtd_atendida > 0 ? '#047857' : '#000'}">
            <strong>${it.qtd_atendida || 0}</strong>
          </td>
      `;

      if (isGestor) {
        html += `
          <td style="text-align: right;">${formatarMoeda(it.valor_unitario)}</td>
          <td style="text-align: right;">${formatarMoeda(valSolicitado)}</td>
          <td style="text-align: right; font-weight: bold; color: ${valAtendido > 0 ? '#047857' : '#000'}">
            ${formatarMoeda(valAtendido)}
          </td>
        `;
      }
      html += '</tr>';
      return html;
    }).join('');

    let tfootHtml = '';
    if (isGestor) {
      tfootHtml = `
        <tfoot>
          <tr>
            <td colspan="6" style="text-align: right;"><strong>SUBTOTAIS E RESUMO FINANCEIRO:</strong></td>
            <td style="text-align: right;"><strong>${formatarMoeda(valorTotalSolicitado)}</strong></td>
            <td style="text-align: right; color: #047857;"><strong>${formatarMoeda(valorTotalAtendido)}</strong></td>
          </tr>
        </tfoot>
      `;
    }

    let resumoFinanceiroHtml = '';
    if (isGestor) {
      resumoFinanceiroHtml = `
        <div style="margin-top: 10px; display: flex; justify-content: flex-end; gap: 15px; font-size: 9.5pt;">
          <div style="background: #f8fafc; padding: 6px 12px; border: 1px solid #cbd5e1; border-radius: 4px;">
            Total Solicitado: <strong>${formatarMoeda(valorTotalSolicitado)}</strong>
          </div>
          <div style="background: #ecfdf5; padding: 6px 12px; border: 1px solid #a7f3d0; border-radius: 4px; color: #065f46;">
            Total Efetivamente Atendido/Liberado: <strong>${formatarMoeda(valorTotalAtendido)}</strong>
          </div>
        </div>
      `;
    }

    const conteudoHTML = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Ficha PBS - ${pedido.numero_pbs}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 10pt; color: #000; line-height: 1.3; }
          .pbs-header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
          .pbs-header h2 { margin: 0; font-size: 13pt; text-transform: uppercase; font-weight: bold; }
          .pbs-header h3 { margin: 3px 0 0; font-size: 12pt; }
          .pbs-info-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 9pt; }
          .pbs-info-table td { border: 1px solid #000; padding: 4px 6px; }
          .pbs-print-table { width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 10px; }
          .pbs-print-table th, .pbs-print-table td { border: 1px solid #000; padding: 4px 6px; }
          .pbs-print-table th { background-color: #f1f5f9; text-transform: uppercase; font-size: 8pt; }
        </style>
      </head>
      <body>
        <div class="pbs-header">
          <h2>SECRETARIA MUNICIPAL DE SAÚDE</h2>
          <h3>PEDIDO DE BENS E SERVIÇOS (PBS) - Nº ${pedido.numero_pbs}</h3>
          <p style="font-size: 8.5pt; margin: 3px 0 0;">
            Status: <strong>${pedido.status}</strong> | Emissão: ${formatarData(pedido.data_pedido)}
          </p>
        </div>

        <table class="pbs-info-table">
          <tbody>
            <tr>
              <td style="width: 60%;"><strong>UNIDADE EMITENTE:</strong> ${nomeUnidade}</td>
              <td style="width: 40%;"><strong>DATA PEDIDO:</strong> ${formatarData(pedido.data_pedido)}</td>
            </tr>
            <tr>
              <td><strong>RESPONSÁVEL USF:</strong> ${pedido.responsavel_nome}</td>
              <td><strong>FUNÇÃO / REGISTRO:</strong> ${(pedido.responsavel_funcao || '')} ${(pedido.responsavel_registro ? ` - ${pedido.responsavel_registro}` : '')}</td>
            </tr>
          </tbody>
        </table>

        <h4 style="font-size: 10pt; margin: 8px 0 4px; text-transform: uppercase;">1. ITENS E INSUMOS SOLICITADOS / ATENDIDOS</h4>
        <table class="pbs-print-table">
          <thead>
            <tr>
              <th style="width: 35px; text-align: center;">ITEM</th>
              <th>DESCRIÇÃO DO MATERIAL / INSUMO</th>
              <th style="width: 50px; text-align: center;">UNID.</th>
              <th style="width: 60px; text-align: center;">QTD. PED.</th>
              <th style="width: 60px; text-align: center;">QTD. ATEND.</th>
              ${isGestor ? '<th style="width: 80px; text-align: right;">VALOR UNIT.</th><th style="width: 85px; text-align: right;">TOT. SOLIC.</th><th style="width: 85px; text-align: right;">TOT. ATEND.</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${itensHtml}
          </tbody>
          ${tfootHtml}
        </table>

        ${resumoFinanceiroHtml}

        <div style="margin-top: 15px; border: 1px solid #000; padding: 8px; font-size: 8.5pt;">
          <strong>RASTREABILIDADE DE RECEPÇÃO E ENVIO (ALMOXARIFADO CENTRAL):</strong><br />
          - Recebimento no Almoxarifado: <strong>${pedido.apontador_recebimento_nome || 'Pendente'}</strong> em <strong>${pedido.data_recebimento ? formatarData(pedido.data_recebimento) : 'N/D'}</strong><br />
          - Despacho / Envio do Material: <strong>${pedido.apontador_envio_nome || 'Pendente'}</strong> em <strong>${pedido.data_envio ? formatarData(pedido.data_envio) : 'N/D'}</strong>
        </div>

        <div style="display: flex; justify-content: center; margin-top: 40px; page-break-inside: avoid;">
          <div style="width: 320px; text-align: center; border-top: 1px solid #000; padding-top: 5px; font-size: 9pt;">
            <strong>Ana Beatriz Figueiredo Ferreira Santos</strong><br />
            Coordenadora de Saúde Bucal
          </div>
        </div>
      </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    if (iframe.contentWindow) {
      iframe.contentWindow.document.open();
      iframe.contentWindow.document.write(conteudoHTML);
      iframe.contentWindow.document.close();
      iframe.contentWindow.focus();

      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1000);
      }, 300);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/60 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in-0 duration-150">
      <div className="min-h-full flex justify-center items-start">
        <div className="w-full max-w-4xl my-auto rounded-[12px] border border-[#E8E8EC] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:border-zinc-800 dark:bg-[#121215] max-h-[92vh] flex flex-col overflow-hidden relative">
        <div className="flex items-center justify-between p-4 px-6 border-b border-[#E8E8EC] dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-[6px] bg-[#2563EB]/10 text-[#2563EB]">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0A0A0A] dark:text-zinc-100 font-display">
                Ficha PBS - Nº {pedido.numero_pbs}
              </h3>
              <p className="text-xs text-[#6B6B6B] dark:text-zinc-400">
                Visualização do documento oficial e impressão / exportação PDF
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="default" size="sm" onClick={handlePrint} className="text-xs">
              <Printer className="h-3.5 w-3.5 mr-1" /> Imprimir / Gerar PDF
            </Button>
            <Button variant="ghost" size="iconSm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#FAFAFA] dark:bg-zinc-950/50">
          <div className="bg-white dark:bg-[#121215] p-6 rounded-[12px] border border-[#E8E8EC] dark:border-zinc-800 space-y-4">
            <div className="text-center pb-4 border-b border-[#E8E8EC] dark:border-zinc-800">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#6B6B6B] dark:text-zinc-400">
                SECRETARIA MUNICIPAL DE SAÚDE
              </h2>
              <h3 className="text-base font-bold text-[#0A0A0A] dark:text-zinc-100 mt-0.5">
                PEDIDO DE BENS E SERVIÇOS (PBS) - Nº {pedido.numero_pbs}
              </h3>
              <div className="mt-2 flex items-center justify-center gap-2 text-xs text-[#6B6B6B]">
                <span>Status: <Badge variant="outline">{pedido.status}</Badge></span>
                <span>•</span>
                <span>Emissão: <strong>{formatarData(pedido.data_pedido)}</strong></span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-zinc-50 dark:bg-zinc-800/40 p-3.5 rounded-[6px] border border-[#E8E8EC] dark:border-zinc-800">
              <div>
                <span className="text-[#6B6B6B]">Unidade Emitente:</span>
                <p className="font-medium text-[#0A0A0A] dark:text-zinc-200">{nomeUnidade}</p>
              </div>
              <div>
                <span className="text-[#6B6B6B]">Responsável Solicitante:</span>
                <p className="font-medium text-[#0A0A0A] dark:text-zinc-200">
                  {pedido.responsavel_nome} {pedido.responsavel_registro ? `(${pedido.responsavel_registro})` : ''}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6B6B6B] dark:text-zinc-400 mb-2">
                Itens e Insumos Solicitados / Atendidos
              </h4>
              <div className="rounded-[6px] border border-[#E8E8EC] dark:border-zinc-800 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-[#6B6B6B] dark:text-zinc-400">
                    <tr>
                      <th className="p-2 text-center w-10">Item</th>
                      <th className="p-2 text-left">Descrição do Material</th>
                      <th className="p-2 text-center w-16">Unid.</th>
                      <th className="p-2 text-center w-20">Qtd. Ped.</th>
                      <th className="p-2 text-center w-20">Qtd. Atend.</th>
                      {isGestor && <th className="p-2 text-right w-24">Val. Unit.</th>}
                      {isGestor && <th className="p-2 text-right w-24">Tot. Atend.</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E8EC] dark:divide-zinc-800">
                    {(pedido.itens || []).map(it => {
                      const mat = materiais.find(m => m.id === it.material_id);
                      const valAtendido = (Number(it.qtd_atendida) || 0) * (Number(it.valor_unitario) || 0);
                      return (
                        <tr key={it.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                          <td className="p-2 text-center font-mono">{it.numero_item}</td>
                          <td className="p-2 font-medium">{mat ? mat.descricao : `Material #${it.material_id}`}</td>
                          <td className="p-2 text-center text-[#6B6B6B]">{mat ? mat.unidade_medida : 'un'}</td>
                          <td className="p-2 text-center font-semibold">{it.qtd_pedida}</td>
                          <td className="p-2 text-center font-semibold text-[#2563EB]">{it.qtd_atendida || 0}</td>
                          {isGestor && <td className="p-2 text-right font-mono">{formatarMoeda(it.valor_unitario)}</td>}
                          {isGestor && <td className="p-2 text-right font-mono font-semibold text-[#2563EB]">{formatarMoeda(valAtendido)}</td>}
                        </tr>
                      );
                    })}
                  </tbody>
                  {isGestor && (
                    <tfoot className="bg-zinc-50 dark:bg-zinc-800/70 font-semibold border-t border-[#E8E8EC] dark:border-zinc-800">
                      <tr>
                        <td colSpan={5} className="p-2 text-right text-xs uppercase tracking-wider text-[#6B6B6B]">TOTAL ATENDIDO:</td>
                        <td colSpan={2} className="p-2 text-right text-[#2563EB] font-mono text-sm">
                          {formatarMoeda(valorTotalAtendido)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <strong>Rastreabilidade de Almoxarifado:</strong>
              <div>• Recebido por: <strong>{pedido.apontador_recebimento_nome || 'Pendente'}</strong> ({pedido.data_recebimento ? formatarData(pedido.data_recebimento) : 'N/D'})</div>
              <div>• Despachado por: <strong>{pedido.apontador_envio_nome || 'Pendente'}</strong> ({pedido.data_envio ? formatarData(pedido.data_envio) : 'N/D'})</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};
