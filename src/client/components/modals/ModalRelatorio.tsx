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

  // Export to Excel (CSV with UTF-8 BOM)
  const handleExportarExcel = () => {
    let csvLines: string[] = [];
    const dataEmissao = new Date().toLocaleDateString('pt-BR');
    const nomeMes = mesFiltro === 'TODOS' ? 'Todos os Meses' : mesFiltro;

    // Byte Order Mark for UTF-8 Excel support
    csvLines.push('\uFEFF');

    if (tipoRelatorio === 'FINANCEIRO' || tipoRelatorio === 'COMPLETO') {
      csvLines.push(`"RELATÓRIO DE FLUXO FINANCEIRO E CONSOLIDAÇÃO MULTICLÍNICA"`);
      csvLines.push(`"Período: ${nomeMes}";"Data de Emissão: ${dataEmissao}"`);
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

        csvLines.push(`"${item.nome}";"${item.tipo}";"${item.custoInsumosAtendidos.toFixed(2).replace('.', ',')}";"${item.custoHonorariosDentistas.toFixed(2).replace('.', ',')}";"${item.custoManutencaoEquipamentos.toFixed(2).replace('.', ',')}";"${item.custoTotalGeral.toFixed(2).replace('.', ',')}"`);
      });

      csvLines.push(`"TOTAL GERAL MULTICLÍNICA";"";"${totalInsumos.toFixed(2).replace('.', ',')}";"${totalHonorarios.toFixed(2).replace('.', ',')}";"${totalManutencao.toFixed(2).replace('.', ',')}";"${totalGeral.toFixed(2).replace('.', ',')}"`);
      csvLines.push(``);
    }

    if (tipoRelatorio === 'INSUMOS' || tipoRelatorio === 'COMPLETO') {
      csvLines.push(`"RELATÓRIO DE GESTÃO DE INSUMOS & ESTOQUE DE MATERIAIS"`);
      csvLines.push(`"Período: ${nomeMes}";"Data de Emissão: ${dataEmissao}"`);
      csvLines.push(``);
      csvLines.push(`"ID";"Insumo / Material";"Unidade Medida";"Fornecedor";"Estoque Atual";"Limite Máx. Pedido";"Valor Estimado (R$)";"Valor Total Estoque (R$)";"Status Estoque"`);

      materiais.forEach(m => {
        const est = m.qtd_estoque ?? 0;
        const totalVal = est * (m.valor_estimado || 0);
        const status = est <= 0 ? 'ESGOTADO' : (est < 20 ? 'ESTOQUE BAIXO' : 'OK');

        csvLines.push(`"${m.id}";"${m.descricao}";"${m.unidade_medida}";"${m.fornecedor || 'Não Informado'}";"${est}";"${m.limite_max_pedido || 'Sem limite'}";"${(m.valor_estimado || 0).toFixed(2).replace('.', ',')}";"${totalVal.toFixed(2).replace('.', ',')}";"${status}"`);
      });

      csvLines.push(``);
    }

    if (tipoRelatorio === 'MANUTENCAO' || tipoRelatorio === 'COMPLETO') {
      csvLines.push(`"RELATÓRIO DE GESTÃO DE EQUIPAMENTOS & MANUTENÇÃO"`);
      csvLines.push(`"Período: ${nomeMes}";"Data de Emissão: ${dataEmissao}"`);
      csvLines.push(``);
      csvLines.push(`"ID Chamado";"Unidade de Saúde";"Equipamento";"Nº de Série";"Tipo Chamado";"Descrição do Defeito / Serviço";"Data Abertura";"Custo Reparo (R$)";"Status"`);

      chamadosFiltrados.forEach(c => {
        const uni = unidades.find(u => u.id === c.unidade_id);
        const eq = equipamentos.find(e => e.id === c.equipamento_id);

        csvLines.push(`"#${c.id}";"${uni?.nome || 'N/D'}";"${eq?.nome || 'N/D'}";"${eq?.numero_serie || 'N/D'}";"${c.tipo}";"${c.descricao_defeito.replace(/"/g, '""')}";"${c.data_abertura}";"${(c.custo_reparo || 0).toFixed(2).replace('.', ',')}";"${c.status}"`);
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
          .meta-item { display: flex; flex-direction: column; }
          .meta-item span { font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: bold; }
          .meta-item strong { font-size: 13px; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 25px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; font-size: 11px; }
          th { background: #0f172a; color: #ffffff; font-weight: 600; text-transform: uppercase; font-size: 10px; }
          tr:nth-child(even) { background: #f8fafc; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .section-title { font-size: 15px; font-weight: bold; color: #0f172a; border-left: 4px solid #0284c7; padding-left: 8px; margin-top: 25px; margin-bottom: 10px; }
          .total-row { background: #e0f2fe !important; font-weight: bold; font-size: 12px; }
          .footer-signatures { margin-top: 50px; display: flex; justify-content: space-between; gap: 40px; page-break-inside: avoid; }
          .sig-box { flex: 1; text-align: center; border-top: 1px solid #0f172a; padding-top: 6px; font-size: 11px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 15px; text-align: right;">
          <button onclick="window.print()" style="background: #0284c7; color: #fff; border: none; padding: 8px 16px; font-weight: bold; border-radius: 4px; cursor: pointer;">
            🖨️ Imprimir ou Salvar PDF
          </button>
        </div>

        <div class="header">
          <h1>ODONTOGEST — SISTEMA DE GESTÃO</h1>
          <h2>RELATÓRIO GERENCIAL DE FLUXO FINANCEIRO & GESTÃO OPERACIONAL</h2>
        </div>

        <div class="meta-box">
          <div class="meta-item">
            <span>Tipo de Relatório</span>
            <strong>${tipoRelatorio === 'FINANCEIRO' ? 'Fluxo Financeiro & Consolidação Multiclínica' : (tipoRelatorio === 'INSUMOS' ? 'Gestão de Insumos & Estoque' : (tipoRelatorio === 'MANUTENCAO' ? 'Manutenção de Equipamentos' : 'Relatório Geral Consolidado'))}</strong>
          </div>
          <div class="meta-item">
            <span>Período de Referência</span>
            <strong>${nomeMes}</strong>
          </div>
          <div class="meta-item">
            <span>Data de Emissão</span>
            <strong>${dataEmissao}</strong>
          </div>
          <div class="meta-item">
            <span>Filtro de Unidade</span>
            <strong>${unidadeFiltro === 'TODAS' ? 'Todas as Unidades' : (unidades.find(u => u.id === unidadeFiltro)?.nome || 'Unidade Especificada')}</strong>
          </div>
        </div>
    `;

    if (tipoRelatorio === 'FINANCEIRO' || tipoRelatorio === 'COMPLETO') {
      let tInsumos = 0, tHonorarios = 0, tManutencao = 0, tGeral = 0;

      conteudoHTML += `
        <div class="section-title">1. Consolidação Financeira Multiclínica por Unidade de Saúde</div>
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
            <td><strong>${item.nome}</strong></td>
            <td class="text-center">${item.tipo}</td>
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
            <td><strong>${m.descricao}</strong></td>
            <td class="text-center">${m.unidade_medida}</td>
            <td>${m.fornecedor || 'Não Informado'}</td>
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
            <td><strong>${uni?.nome || 'N/D'}</strong></td>
            <td>${eq?.nome || 'N/D'}</td>
            <td>${c.tipo}</td>
            <td>${c.descricao_defeito}</td>
            <td class="text-center">${formatarData(c.data_abertura)}</td>
            <td class="text-right"><strong>${formatarMoeda(c.custo_reparo || 0)}</strong></td>
            <td class="text-center">${c.status}</td>
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
    <div className="modal active">
      <div className="modal-content" style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <h3>
            <i className="fa-solid fa-file-export text-primary"></i> Exportar Relatórios (PDF & Excel)
          </h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <p className="text-muted text-sm" style={{ marginBottom: '1.2rem' }}>
            Selecione o tipo de relatório desejado e o filtro mensal/estabelecimento para exportar planilhas para o Microsoft Excel ou documento formatado em PDF.
          </p>

          <form onSubmit={(e) => e.preventDefault()}>
            {/* Tipo de Relatório */}
            <div className="form-group">
              <label style={{ fontWeight: 700, marginBottom: '0.4rem', display: 'block' }}>
                <i className="fa-solid fa-layer-group text-primary"></i> Tipo de Relatório *
              </label>
              <select 
                className="form-control"
                value={tipoRelatorio}
                onChange={e => setTipoRelatorio(e.target.value as TipoRelatorio)}
              >
                <option value="FINANCEIRO">💰 Fluxo Financeiro & Consolidação Multiclínica</option>
                <option value="INSUMOS">📦 Gestão de Insumos & Estoque de Materiais</option>
                <option value="MANUTENCAO">🛠️ Manutenção de Equipamentos & Chamados</option>
                <option value="COMPLETO">📊 Relatório Geral Consolidado (Todas as Áreas)</option>
              </select>
            </div>

            {/* Filtro Mensal */}
            <div className="form-grid margin-top-sm">
              <div className="form-group">
                <label style={{ fontWeight: 700, marginBottom: '0.4rem', display: 'block' }}>
                  <i className="fa-solid fa-calendar-days text-amber"></i> Filtro Mensal / Período *
                </label>
                <select 
                  className="form-control"
                  value={mesFiltro}
                  onChange={e => setMesFiltro(e.target.value)}
                >
                  <option value="TODOS">📅 Todos os Meses</option>
                  {mesesDisponiveis.map(m => (
                    <option key={m} value={m}>📆 {m}</option>
                  ))}
                </select>
              </div>

              {/* Filtro por Unidade */}
              <div className="form-group">
                <label style={{ fontWeight: 700, marginBottom: '0.4rem', display: 'block' }}>
                  <i className="fa-solid fa-hospital text-emerald"></i> Unidade de Saúde *
                </label>
                <select 
                  className="form-control"
                  value={unidadeFiltro}
                  onChange={e => setUnidadeFiltro(e.target.value === 'TODAS' ? 'TODAS' : Number(e.target.value))}
                >
                  <option value="TODAS">🏥 Todas as Unidades de Saúde</option>
                  {unidades.map(u => (
                    <option key={u.id} value={u.id}>{u.nome} ({u.tipo})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="form-actions margin-top-md" style={{ gap: '0.75rem', flexWrap: 'wrap' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={onClose}
              >
                Cancelar
              </button>

              <button 
                type="button" 
                className="btn btn-emerald" 
                onClick={handleExportarExcel}
                title="Download de Planilha Excel (.CSV)"
              >
                <i className="fa-solid fa-file-excel"></i> Exportar Excel (.CSV)
              </button>

              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleGerarPDF}
                title="Gerar Visualização e Salvar em PDF"
              >
                <i className="fa-solid fa-file-pdf"></i> Gerar Relatório PDF
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
