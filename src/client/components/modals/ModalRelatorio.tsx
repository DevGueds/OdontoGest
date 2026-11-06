import React, { useState, useMemo } from 'react';
import { 
  UnidadeSaude, 
  PedidoPBS, 
  Material, 
  HonorarioOdontologo, 
  ChamadoManutencao, 
  Equipamento,
  UnidadeConsolidacaoFinanceira 
} from '../../types';
import { dbService } from '../../services/db';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { FileDown, FileSpreadsheet, FileText, Layers, Calendar, Building2, X } from 'lucide-react';

export type TipoRelatorio = 'FINANCEIRO' | 'INSUMOS' | 'MANUTENCAO' | 'COMPLETO';

interface Props {
  unidades: UnidadeSaude[];
  pedidos: PedidoPBS[];
  materiais: Material[];
  honorarios: HonorarioOdontologo[];
  chamados: ChamadoManutencao[];
  equipamentos: Equipamento[];
  isOpen: boolean;
  onClose: () => void;
  formatarMoeda: (v: number) => string;
  formatarData: (d?: string | null) => string;
}

export const ModalRelatorio: React.FC<Props> = ({
  unidades,
  pedidos,
  materiais,
  honorarios,
  chamados,
  equipamentos,
  isOpen,
  onClose,
  formatarMoeda,
  formatarData
}) => {
  const [tipoRelatorio, setTipoRelatorio] = useState<TipoRelatorio>('FINANCEIRO');
  const [mesFiltro, setMesFiltro] = useState<string>('TODOS');
  const [unidadeFiltro, setUnidadeFiltro] = useState<number | 'TODAS'>('TODAS');

  // List of unique months available in data
  const mesesDisponiveis = useMemo(() => {
    const setMeses = new Set<string>();
    
    // Default current month
    const mesAtual = new Date().toISOString().substring(0, 7);
    setMeses.add(mesAtual);

    pedidos.forEach(p => {
      if (p.data_pedido) setMeses.add(p.data_pedido.substring(0, 7));
    });

    honorarios.forEach(h => {
      if (h.mes_referencia) setMeses.add(h.mes_referencia.substring(0, 7));
    });

    chamados.forEach(c => {
      if (c.data_abertura) setMeses.add(c.data_abertura.substring(0, 7));
    });

    return Array.from(setMeses).sort().reverse();
  }, [pedidos, honorarios, chamados]);

  if (!isOpen) return null;

  // Filtering Helper
  const filtrarPorMesEUnidade = <T extends { data_pedido?: string; data_abertura?: string; mes_referencia?: string; unidade_id?: number; unidade_emitente_id?: number }>(
    lista: T[],
    campoData: 'data_pedido' | 'data_abertura' | 'mes_referencia' = 'data_pedido'
  ) => {
    return lista.filter(item => {
      // Unidade Filter
      const uId = item.unidade_id ?? item.unidade_emitente_id;
      if (unidadeFiltro !== 'TODAS' && uId !== unidadeFiltro) {
        return false;
      }

      // Month Filter
      if (mesFiltro !== 'TODOS') {
        const valData = item[campoData];
        if (!valData || !valData.startsWith(mesFiltro)) {
          return false;
        }
      }

      return true;
    });
  };

  // Data processing based on selected filters
  const pedidosFiltrados = filtrarPorMesEUnidade(pedidos, 'data_pedido');
  const honorariosFiltrados = filtrarPorMesEUnidade(honorarios, 'mes_referencia');
  const chamadosFiltrados = filtrarPorMesEUnidade(chamados, 'data_abertura');
  const unidadesFiltradas = unidadeFiltro === 'TODAS' 
    ? unidades 
    : unidades.filter(u => u.id === unidadeFiltro);

  // Consolidated Financial Data for selected month & unit
  const consolidacaoFinanceira: UnidadeConsolidacaoFinanceira[] = dbService.getConsolidacaoFinanceiraLocal(
    unidadesFiltradas,
    pedidosFiltrados,
    honorariosFiltrados,
    chamadosFiltrados
  );

  // Helper to escape formula characters in CSV exports (CWE-1236 / CSV Injection mitigation)
  const sanitizeCsvCell = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return '';
    let str = String(val);
    if (/^[=+\-@\t\r]/.test(str)) {
      str = "'" + str;
    }
    return str.replace(/"/g, '""');
  };

  // Helper to escape HTML characters before document.write (DOM XSS mitigation)
  const escapeHtml = (val: any): string => {
    if (val === null || val === undefined) return '';
    return String(val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  // Export to Excel (CSV with UTF-8 BOM)
  const handleExportarExcel = () => {
    let csvLines: string[] = [];
    const dataEmissao = new Date().toLocaleDateString('pt-BR');
    const nomeMes = mesFiltro === 'TODOS' ? 'Todos os Meses' : mesFiltro;

    // Byte Order Mark for UTF-8 Excel support
    csvLines.push('\uFEFF');

    if (tipoRelatorio === 'FINANCEIRO' || tipoRelatorio === 'COMPLETO') {
      csvLines.push(`"RELATÓRIO DE FLUXO FINANCEIRO E CONSOLIDAÇÃO MULTICLÍNICA"`);
      csvLines.push(`"Período: ${sanitizeCsvCell(nomeMes)}";"Data de Emissão: ${sanitizeCsvCell(dataEmissao)}"`);
      csvLines.push(``);
      csvLines.push(`"Estabelecimento de Saúde";"Tipo";"Gastos em Insumos (R$)";"Salários / Honorários Dentistas (R$)";"Manutenção Equipamentos (R$)";"CUSTO TOTAL GERAL (R$)"`);

      let totalInsumos = 0;
      let totalHonorarios = 0;
      let totalManutencao = 0;
      let totalGeral = 0;

      consolidacaoFinanceira.forEach(item => {
        totalInsumos += item.custoInsumosAtendidos;
        totalHonorarios += item.custoHonorariosDentistas;
        totalManutencao += item.custoManutencaoEquipamentos;
        totalGeral += item.custoTotalGeral;

        csvLines.push(`"${sanitizeCsvCell(item.nome)}";"${sanitizeCsvCell(item.tipo)}";"${item.custoInsumosAtendidos.toFixed(2).replace('.', ',')}";"${item.custoHonorariosDentistas.toFixed(2).replace('.', ',')}";"${item.custoManutencaoEquipamentos.toFixed(2).replace('.', ',')}";"${item.custoTotalGeral.toFixed(2).replace('.', ',')}"`);
      });

      csvLines.push(`"TOTAL GERAL MULTICLÍNICA";"";"${totalInsumos.toFixed(2).replace('.', ',')}";"${totalHonorarios.toFixed(2).replace('.', ',')}";"${totalManutencao.toFixed(2).replace('.', ',')}";"${totalGeral.toFixed(2).replace('.', ',')}"`);
      csvLines.push(``);
    }

    if (tipoRelatorio === 'INSUMOS' || tipoRelatorio === 'COMPLETO') {
      csvLines.push(`"RELATÓRIO DE GESTÃO DE INSUMOS & ESTOQUE DE MATERIAIS"`);
      csvLines.push(`"Período: ${sanitizeCsvCell(nomeMes)}";"Data de Emissão: ${sanitizeCsvCell(dataEmissao)}"`);
      csvLines.push(``);
      csvLines.push(`"ID";"Insumo / Material";"Unidade Medida";"Fornecedor";"Estoque Atual";"Limite Máx. Pedido";"Valor Estimado (R$)";"Valor Total Estoque (R$)";"Status Estoque"`);

      materiais.forEach(m => {
        const est = m.qtd_estoque ?? 0;
        const totalVal = est * (m.valor_estimado || 0);
        const status = est <= 0 ? 'ESGOTADO' : (est < 20 ? 'ESTOQUE BAIXO' : 'OK');

        csvLines.push(`"${m.id}";"${sanitizeCsvCell(m.descricao)}";"${sanitizeCsvCell(m.unidade_medida)}";"${sanitizeCsvCell(m.fornecedor || 'Não Informado')}";"${est}";"${sanitizeCsvCell(m.limite_max_pedido || 'Sem limite')}";"${(m.valor_estimado || 0).toFixed(2).replace('.', ',')}";"${totalVal.toFixed(2).replace('.', ',')}";"${status}"`);
      });

      csvLines.push(``);
    }

    if (tipoRelatorio === 'MANUTENCAO' || tipoRelatorio === 'COMPLETO') {
      csvLines.push(`"RELATÓRIO DE GESTÃO DE EQUIPAMENTOS & MANUTENÇÃO"`);
      csvLines.push(`"Período: ${sanitizeCsvCell(nomeMes)}";"Data de Emissão: ${sanitizeCsvCell(dataEmissao)}"`);
      csvLines.push(``);
      csvLines.push(`"ID Chamado";"Unidade de Saúde";"Equipamento";"Número de Patrimônio";"Tipo Chamado";"Descrição do Defeito / Serviço";"Data Abertura";"Custo Reparo (R$)";"Status"`);

      chamadosFiltrados.forEach(c => {
        const uni = unidades.find(u => u.id === c.unidade_id);
        const eq = equipamentos.find(e => e.id === c.equipamento_id);

        csvLines.push(`"#${c.id}";"${sanitizeCsvCell(uni?.nome || 'N/D')}";"${sanitizeCsvCell(eq?.nome || 'N/D')}";"${sanitizeCsvCell(eq?.numero_serie || 'N/D')}";"${sanitizeCsvCell(c.tipo)}";"${sanitizeCsvCell(c.descricao_defeito)}";"${c.data_abertura}";"${(c.custo_reparo || 0).toFixed(2).replace('.', ',')}";"${c.status}"`);
      });
    }

    csvLines.push(``);
    csvLines.push(`"ASSINATURAS E HOMOLOGAÇÃO:"`);
    csvLines.push(`"Coordenadora de Saúde Bucal";"Ana Beatriz Figueiredo Ferreira Santos"` );
    csvLines.push(`"Secretário Municipal de Saúde";"Paulo Roberto Sotillo de Lima Filho"`);

    const csvContent = csvLines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Relatorio_${tipoRelatorio}_${mesFiltro}_${new Date().toISOString().substring(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export to PDF / Print Window
  const handleGerarPDF = () => {
    const win = window.open('', '_blank', 'width=1100,height=850');
    if (!win) return;

    const nomeMes = mesFiltro === 'TODOS' ? 'Todos os Meses' : mesFiltro;
    const dataEmissao = new Date().toLocaleDateString('pt-BR');

    let conteudoHTML = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>Relatório - OdontoGest</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: #1e293b; padding: 20px; line-height: 1.5; }
          .header { text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px; }
          .header h1 { margin: 0; font-size: 20px; color: #0284c7; text-transform: uppercase; }
          .header h2 { margin: 4px 0 0 0; font-size: 14px; font-weight: normal; color: #64748b; }
          .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 15px; border-radius: 6px; margin-bottom: 20px; display: flex; justify-content: space-between; }
          .meta-item { font-size: 12px; }
          .meta-item strong { color: #0f172a; }
          .section-title { font-size: 14px; font-weight: bold; color: #0369a1; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 25px; margin-bottom: 12px; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          th { background: #f1f5f9; color: #334155; font-weight: 600; text-align: left; padding: 6px 8px; border: 1px solid #cbd5e1; font-size: 11px; text-transform: uppercase; }
          td { padding: 6px 8px; border: 1px solid #e2e8f0; font-size: 11px; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .total-row { font-weight: bold; background: #e0f2fe !important; }
          .footer-signatures { margin-top: 40px; display: flex; justify-content: space-between; page-break-inside: avoid; }
          .sig-box { width: 45%; text-align: center; border-top: 1px solid #94a3b8; padding-top: 5px; font-size: 11px; color: #475569; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PREFEITURA MUNICIPAL DE ALENQUER</h1>
          <h2>SECRETARIA MUNICIPAL DE SAÚDE - COORDENAÇÃO DE SAÚDE BUCAL</h2>
        </div>

        <div class="meta-box">
          <div class="meta-item">Relatório: <strong>${escapeHtml(tipoRelatorio)}</strong></div>
          <div class="meta-item">Período de Referência: <strong>${escapeHtml(nomeMes)}</strong></div>
          <div class="meta-item">Data de Emissão: <strong>${escapeHtml(dataEmissao)}</strong></div>
        </div>
    `;

    if (tipoRelatorio === 'FINANCEIRO' || tipoRelatorio === 'COMPLETO') {
      let tInsumos = 0;
      let tHonorarios = 0;
      let tManutencao = 0;
      let tGeral = 0;

      conteudoHTML += `
        <div class="section-title">1. Consolidação Financeira Multiclínica</div>
        <table>
          <thead>
            <tr>
              <th>Unidade de Saúde</th>
              <th class="text-center">Tipo</th>
              <th class="text-right">Gastos em Insumos (R$)</th>
              <th class="text-right">Salários / Honorários (R$)</th>
              <th class="text-right">Manutenção Equipamentos (R$)</th>
              <th class="text-right">Custo Total Geral (R$)</th>
            </tr>
          </thead>
          <tbody>
      `;

      consolidacaoFinanceira.forEach(item => {
        tInsumos += item.custoInsumosAtendidos;
        tHonorarios += item.custoHonorariosDentistas;
        tManutencao += item.custoManutencaoEquipamentos;
        tGeral += item.custoTotalGeral;

        conteudoHTML += `
          <tr>
            <td><strong>${escapeHtml(item.nome)}</strong></td>
            <td class="text-center">${escapeHtml(item.tipo)}</td>
            <td class="text-right">${formatarMoeda(item.custoInsumosAtendidos)}</td>
            <td class="text-right">${formatarMoeda(item.custoHonorariosDentistas)}</td>
            <td class="text-right">${formatarMoeda(item.custoManutencaoEquipamentos)}</td>
            <td class="text-right" style="font-weight: bold; color: #0284c7;">${formatarMoeda(item.custoTotalGeral)}</td>
          </tr>
        `;
      });

      conteudoHTML += `
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="2">TOTAL OPERACIONAL MULTICLÍNICA:</td>
              <td class="text-right">${formatarMoeda(tInsumos)}</td>
              <td class="text-right">${formatarMoeda(tHonorarios)}</td>
              <td class="text-right">${formatarMoeda(tManutencao)}</td>
              <td class="text-right" style="font-size: 13px; color: #0284c7;">${formatarMoeda(tGeral)}</td>
            </tr>
          </tfoot>
        </table>
      `;
    }

    if (tipoRelatorio === 'INSUMOS' || tipoRelatorio === 'COMPLETO') {
      conteudoHTML += `
        <div class="section-title">2. Gestão de Insumos & Posição de Estoque</div>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Material / Insumo</th>
              <th class="text-center">Unid.</th>
              <th>Fornecedor</th>
              <th class="text-center">Estoque</th>
              <th class="text-right">Valor Estimado (R$)</th>
              <th class="text-right">Valor Total Estoque (R$)</th>
              <th class="text-center">Status</th>
            </tr>
          </thead>
          <tbody>
      `;

      materiais.forEach(m => {
        const est = m.qtd_estoque ?? 0;
        const totalVal = est * (m.valor_estimado || 0);
        const status = est <= 0 ? '<span style="color:#e11d48;font-weight:bold;">ESGOTADO</span>' : (est < 20 ? '<span style="color:#d97706;font-weight:bold;">BAIXO</span>' : '<span style="color:#059669;font-weight:bold;">OK</span>');

        conteudoHTML += `
          <tr>
            <td>#${m.id}</td>
            <td><strong>${escapeHtml(m.descricao)}</strong></td>
            <td class="text-center">${escapeHtml(m.unidade_medida)}</td>
            <td>${escapeHtml(m.fornecedor || 'Não Informado')}</td>
            <td class="text-center"><strong>${est}</strong></td>
            <td class="text-right">${formatarMoeda(m.valor_estimado || 0)}</td>
            <td class="text-right">${formatarMoeda(totalVal)}</td>
            <td class="text-center">${status}</td>
          </tr>
        `;
      });

      conteudoHTML += `
          </tbody>
        </table>
      `;
    }

    if (tipoRelatorio === 'MANUTENCAO' || tipoRelatorio === 'COMPLETO') {
      let tCustoManut = 0;
      conteudoHTML += `
        <div class="section-title">3. Gestão de Manutenção de Equipamentos & Chamados</div>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Unidade de Saúde</th>
              <th>Equipamento</th>
              <th>Tipo</th>
              <th>Descrição do Defeito / Serviço</th>
              <th class="text-center">Data Abertura</th>
              <th class="text-right">Custo Reparo (R$)</th>
              <th class="text-center">Status</th>
            </tr>
          </thead>
          <tbody>
      `;

      chamadosFiltrados.forEach(c => {
        const uni = unidades.find(u => u.id === c.unidade_id);
        const eq = equipamentos.find(e => e.id === c.equipamento_id);
        tCustoManut += (c.custo_reparo || 0);

        conteudoHTML += `
          <tr>
            <td>#${c.id}</td>
            <td><strong>${escapeHtml(uni?.nome || 'N/D')}</strong></td>
            <td>${escapeHtml(eq?.nome || 'N/D')}</td>
            <td>${escapeHtml(c.tipo)}</td>
            <td>${escapeHtml(c.descricao_defeito)}</td>
            <td class="text-center">${formatarData(c.data_abertura)}</td>
            <td class="text-right"><strong>${formatarMoeda(c.custo_reparo || 0)}</strong></td>
            <td class="text-center">${escapeHtml(c.status)}</td>
          </tr>
        `;
      });

      conteudoHTML += `
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="6">TOTAL CUSTO MANUTENÇÃO:</td>
              <td class="text-right" style="font-size: 12px; color: #0284c7;">${formatarMoeda(tCustoManut)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      `;
    }

    conteudoHTML += `
        <div class="footer-signatures">
          <div class="sig-box">
            <strong>Ana Beatriz Figueiredo Ferreira Santos</strong><br />
            Coordenadora de Saúde Bucal
          </div>
          <div class="sig-box">
            <strong>Paulo Roberto Sotillo de Lima Filho</strong><br />
            Secretário Municipal de Saúde
          </div>
        </div>
      </body>
      </html>
    `;

    win.document.open();
    win.document.write(conteudoHTML);
    win.document.close();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="w-5 h-5 text-primary" />
            Exportar Relatórios Gerenciais
          </DialogTitle>
          <DialogDescription>
            Exporte planilhas estruturadas para o Excel (.CSV) ou gere documentos analíticos formatados para impressão e PDF.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => e.preventDefault()} className="space-y-4 pt-2">
          {/* Tipo de Relatório */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-primary" />
              Tipo de Relatório *
            </label>
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-[#121215] dark:text-zinc-100"
              value={tipoRelatorio}
              onChange={e => setTipoRelatorio(e.target.value as TipoRelatorio)}
            >
              <option value="FINANCEIRO">Fluxo Financeiro e Consolidação Multiclínica</option>
              <option value="INSUMOS">Gestão de Insumos e Estoque de Materiais</option>
              <option value="MANUTENCAO">Manutenção de Equipamentos e Chamados</option>
              <option value="COMPLETO">Relatório Geral Consolidado (Todas as Áreas)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Filtro Mensal */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                Período / Mês *
              </label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-[#121215] dark:text-zinc-100"
                value={mesFiltro}
                onChange={e => setMesFiltro(e.target.value)}
              >
                <option value="TODOS">Todos os Meses</option>
                {mesesDisponiveis.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Filtro por Unidade */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                Unidade de Saúde *
              </label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-[#121215] dark:text-zinc-100"
                value={unidadeFiltro}
                onChange={e => setUnidadeFiltro(e.target.value === 'TODAS' ? 'TODAS' : Number(e.target.value))}
              >
                <option value="TODAS">Todas as Unidades de Saúde</option>
                {unidades.map(u => (
                  <option key={u.id} value={u.id}>{u.nome} ({u.tipo})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t border-border">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="gap-1.5 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 dark:hover:border-rose-800 transition-colors"
              title="Cancelar e fechar modal de relatórios"
              aria-label="Cancelar"
            >
              <X className="w-4 h-4" />
              Cancelar
            </Button>

            <Button 
              type="button" 
              variant="emerald" 
              onClick={handleExportarExcel}
              className="gap-2 shadow-sm hover:shadow-md transition-all"
              title="Download de Planilha Excel (.CSV)"
              aria-label="Exportar Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel (.CSV)
            </Button>

            <Button 
              type="button" 
              onClick={handleGerarPDF}
              className="gap-2 hover:shadow-md transition-all"
              title="Gerar Visualização e Salvar em PDF"
              aria-label="Gerar Relatório PDF"
            >
              <FileText className="w-4 h-4" />
              Relatório PDF
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
