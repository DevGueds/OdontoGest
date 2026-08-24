import React, { useState, useMemo } from 'react';
import { 
  PedidoPBS, 
  UnidadeSaude, 
  Material, 
  StatusPedido, 
  HonorarioOdontologo, 
  ChamadoManutencao, 
  EntradaRecurso 
} from '../../types';
import { dbService } from '../../services/db';

interface Props {
  pedidos: PedidoPBS[];
  unidades: UnidadeSaude[];
  materiais: Material[];
  honorarios?: HonorarioOdontologo[];
  chamados?: ChamadoManutencao[];
  entradas?: EntradaRecurso[];
  onSwitchTab: (tabName: string) => void;
  onAbrirFicha: (pedido: PedidoPBS) => void;
  onAbrirAjusteEstoque: (material: Material) => void;
  onAbrirEditarMaterial: (material: Material) => void;
  onAbrirModalRelatorios?: () => void;
  formatarData: (d?: string | null) => string;
  formatarMoeda: (v: number) => string;
}

export const DashboardTab: React.FC<Props> = ({
  pedidos,
  unidades,
  materiais,
  honorarios = [],
  chamados = [],
  entradas = [],
  onSwitchTab,
  onAbrirFicha,
  onAbrirAjusteEstoque,
  onAbrirEditarMaterial,
  onAbrirModalRelatorios,
  formatarData,
  formatarMoeda
}) => {
  const [filtroAlerta, setFiltroAlerta] = useState<'todos' | 'esgotados' | 'baixo'>('todos');
  const [buscaAlerta, setBuscaAlerta] = useState('');

  // 1. Cálculos de Estatísticas e Saldos Segregados
  const pendentesCount = useMemo(() => 
    pedidos.filter(p => p.status === 'SOLICITADO' || p.status === 'RECEBIDO').length
  , [pedidos]);

  const estatsGastos = useMemo(() => 
    dbService.getEstatisticasGastos(pedidos)
  , [pedidos]);

  const saldosNatureza = useMemo(() => 
    dbService.getSaldosNaturezaRecursos(unidades, pedidos, materiais, honorarios, chamados, entradas)
  , [unidades, pedidos, materiais, honorarios, chamados, entradas]);

  const consolidacaoUnidades = useMemo(() => 
    dbService.getConsolidacaoFinanceiraLocal(unidades, pedidos, honorarios, chamados)
  , [unidades, pedidos, honorarios, chamados]);

  // 2. Filtragem de Insumos Críticos
  const materiaisCriticos = useMemo(() => {
    return materiais
      .filter(m => (m.qtd_estoque ?? 0) < 20)
      .sort((a, b) => (a.qtd_estoque ?? 0) - (b.qtd_estoque ?? 0));
  }, [materiais]);

  const esgotadosCount = useMemo(() => 
    materiaisCriticos.filter(m => (m.qtd_estoque ?? 0) <= 0).length
  , [materiaisCriticos]);

  const baixoCount = useMemo(() => 
    materiaisCriticos.filter(m => (m.qtd_estoque ?? 0) > 0).length
  , [materiaisCriticos]);

  const materiaisExibidos = useMemo(() => {
    return materiaisCriticos.filter(m => {
      const est = m.qtd_estoque ?? 0;
      if (filtroAlerta === 'esgotados' && est > 0) return false;
      if (filtroAlerta === 'baixo' && est <= 0) return false;
      if (buscaAlerta.trim()) {
        return m.descricao.toLowerCase().includes(buscaAlerta.toLowerCase());
      }
      return true;
    });
  }, [materiaisCriticos, filtroAlerta, buscaAlerta]);

  const recentes = useMemo(() => pedidos.slice(0, 5), [pedidos]);

  // Renderização semântica de badges de status
  const renderBadgeStatus = (status: StatusPedido) => {
    switch (status) {
      case 'SOLICITADO': return <span className="badge badge-amber"><i className="fa-solid fa-clock"></i> SOLICITADO</span>;
      case 'RECEBIDO': return <span className="badge badge-cyan"><i className="fa-solid fa-box-archive"></i> RECEBIDO</span>;
      case 'ATENDIDO_PARCIAL': return <span className="badge badge-purple"><i className="fa-solid fa-boxes-stacked"></i> ATENDIDO PARCIAL</span>;
      case 'ATENDIDO_TOTAL': return <span className="badge badge-emerald"><i className="fa-solid fa-check"></i> ATENDIDO TOTAL</span>;
      case 'ENVIADO': return <span className="badge badge-blue"><i className="fa-solid fa-truck"></i> ENVIADO</span>;
      case 'CANCELADO': return <span className="badge badge-rose"><i className="fa-solid fa-ban"></i> CANCELADO</span>;
      default: return <span className="badge badge-blue">{status}</span>;
    }
  };

  // Cálculo de percentual das categorias em Custeio para a Data Visualization
  const totalCusteio = saldosNatureza.gastoCusteioTotal || 1;
  const pctInsumos = Math.round((saldosNatureza.detalhamentoCusteio.insumos / totalCusteio) * 100);
  const pctRh = Math.round((saldosNatureza.detalhamentoCusteio.rhHonorarios / totalCusteio) * 100);
  const pctManutencao = Math.round((saldosNatureza.detalhamentoCusteio.manutencao / totalCusteio) * 100);

  // Maior gasto entre unidades para normalização de barras
  const maxGastoUnidade = useMemo(() => {
    return Math.max(...consolidacaoUnidades.map(u => u.custoTotalGeral), 1);
  }, [consolidacaoUnidades]);

  return (
    <div className="panel-stack" style={{ gap: '1.5rem' }}>
      
      {/* HEADER DE CONTEXTO E NÍVEL ESTRATÉGICO */}
      <div className="card" style={{ borderLeft: '5px solid var(--primary)', background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}>
        <div className="card-header flex-between" style={{ flexWrap: 'wrap', gap: '1rem', paddingBottom: '0.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
              <span className="badge badge-cyan" style={{ fontSize: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                <i className="fa-solid fa-chart-line"></i> Dashboard Estratégico & Tático
              </span>
              <span className="badge badge-emerald" style={{ fontSize: '0.75rem' }}>
                <i className="fa-solid fa-circle-check"></i> Operação Normal
              </span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Consolidação Financeira & Gestão de Recursos de Saúde Bucal
            </h2>
            <p className="text-muted text-sm">
              Visão macro dos aportes, saldos disponíveis segregados por natureza, liquidez de insumos e despesas por unidade.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            {onAbrirModalRelatorios && (
              <button className="btn btn-emerald" onClick={onAbrirModalRelatorios} title="Gerar Relatórios em PDF e Excel">
                <i className="fa-solid fa-file-export"></i> Exportar Relatórios (PDF / Excel)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* NÍVEL 1: MACRO KPIS DE ALTO IMPACTO (PIRÂMIDE DE INFORMAÇÃO) */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        
        {/* KPI 1: Saldo Custeio */}
        <div className="card" style={{ padding: '1.2rem', position: 'relative', overflow: 'hidden', borderTop: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Saldo Disponível (Custeio)
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa-solid fa-credit-card"></i>
            </div>
          </div>
          
          <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: saldosNatureza.saldoCusteioDisponivel >= 0 ? 'var(--emerald)' : 'var(--rose)', margin: '0.2rem 0' }}>
            {formatarMoeda(saldosNatureza.saldoCusteioDisponivel)}
          </h3>

          <div style={{ marginTop: '0.6rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              <span>Comprometido: <strong>{saldosNatureza.percentualCusteioComprometido.toFixed(1)}%</strong></span>
              <span>Total: {formatarMoeda(saldosNatureza.orcamentoCusteioTotal)}</span>
            </div>
            {/* Progress Bar */}
            <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  width: `${Math.min(100, saldosNatureza.percentualCusteioComprometido)}%`, 
                  height: '100%', 
                  background: saldosNatureza.percentualCusteioComprometido > 85 ? 'var(--rose)' : (saldosNatureza.percentualCusteioComprometido > 60 ? 'var(--amber)' : 'var(--primary)'),
                  transition: 'width 0.4s ease'
                }} 
              />
            </div>
          </div>
        </div>

        {/* KPI 2: Saldo Investimento */}
        <div className="card" style={{ padding: '1.2rem', position: 'relative', overflow: 'hidden', borderTop: '4px solid var(--purple)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Saldo Disponível (Investimento)
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--purple-light)', color: 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa-solid fa-building-columns"></i>
            </div>
          </div>

          <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: saldosNatureza.saldoInvestimentoDisponivel >= 0 ? 'var(--purple)' : 'var(--rose)', margin: '0.2rem 0' }}>
            {formatarMoeda(saldosNatureza.saldoInvestimentoDisponivel)}
          </h3>

          <div style={{ marginTop: '0.6rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              <span>Comprometido: <strong>{saldosNatureza.percentualInvestimentoComprometido.toFixed(1)}%</strong></span>
              <span>Total: {formatarMoeda(saldosNatureza.orcamentoInvestimentoTotal)}</span>
            </div>
            {/* Progress Bar */}
            <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  width: `${Math.min(100, saldosNatureza.percentualInvestimentoComprometido)}%`, 
                  height: '100%', 
                  background: 'var(--purple)',
                  transition: 'width 0.4s ease'
                }} 
              />
            </div>
          </div>
        </div>

        {/* KPI 3: Pedidos Pendentes */}
        <div className="card" style={{ padding: '1.2rem', position: 'relative', borderTop: '4px solid var(--amber)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Pedidos Pendentes
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--amber-light)', color: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa-solid fa-clock"></i>
            </div>
          </div>

          <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', margin: '0.2rem 0' }}>
            {pendentesCount}
          </h3>

          <span className="text-muted" style={{ fontSize: '0.8rem' }}>
            {pendentesCount > 0 ? '⚠️ Necessita atenção do Almoxarifado' : '✅ Nenhuma solicitação pendente'}
          </span>
        </div>

        {/* KPI 4: Insumos Críticos */}
        <div className="card" style={{ padding: '1.2rem', position: 'relative', borderTop: '4px solid var(--rose)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Insumos p/ Reabastecer
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--rose-light)', color: 'var(--rose)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
          </div>

          <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: materiaisCriticos.length > 0 ? 'var(--rose)' : 'var(--emerald)', margin: '0.2rem 0' }}>
            {materiaisCriticos.length}
          </h3>

          <span className="text-muted" style={{ fontSize: '0.8rem' }}>
            {esgotadosCount > 0 ? `🚨 ${esgotadosCount} com estoque esgotado` : 'Insumos com estoque baixo (<20 un)'}
          </span>
        </div>
      </div>

      {/* NÍVEL 2: VISUALIZAÇÃO DE DADOS & COMPARAÇÕES (DATA VISUALIZATION) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.2rem' }}>
        
        {/* GRÁFICO 1: Composição das Despesas de Custeio (Visual Bar Breakdown) */}
        <div className="card">
          <div className="card-header flex-between">
            <div>
              <h3><i className="fa-solid fa-chart-pie text-primary"></i> Composição das Saídas de Custeio</h3>
              <p className="text-muted text-sm">Distribuição percentual dos gastos operacionais realizados</p>
            </div>
            <span className="badge badge-cyan">{formatarMoeda(saldosNatureza.gastoCusteioTotal)}</span>
          </div>

          <div className="card-body">
            {/* Multi-Segmented Progress Bar */}
            <div style={{ marginBottom: '1.2rem' }}>
              <div style={{ display: 'flex', height: '14px', borderRadius: '6px', overflow: 'hidden', background: '#e2e8f0' }}>
                <div style={{ width: `${pctInsumos}%`, background: 'var(--primary)', transition: 'width 0.4s ease' }} title={`Insumos: ${pctInsumos}%`} />
                <div style={{ width: `${pctRh}%`, background: 'var(--purple)', transition: 'width 0.4s ease' }} title={`RH: ${pctRh}%`} />
                <div style={{ width: `${pctManutencao}%`, background: 'var(--amber)', transition: 'width 0.4s ease' }} title={`Manutenção: ${pctManutencao}%`} />
              </div>
            </div>

            {/* Visual Breakdown Legends */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem', textAlign: 'center' }}>
              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }} />
                  Insumos (PBS)
                </div>
                <strong style={{ display: 'block', fontSize: '0.95rem', marginTop: '0.2rem' }}>{formatarMoeda(saldosNatureza.detalhamentoCusteio.insumos)}</strong>
                <span className="text-muted" style={{ fontSize: '0.75rem' }}>{pctInsumos}% do total</span>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--purple)' }} />
                  Salários (RH)
                </div>
                <strong style={{ display: 'block', fontSize: '0.95rem', marginTop: '0.2rem' }}>{formatarMoeda(saldosNatureza.detalhamentoCusteio.rhHonorarios)}</strong>
                <span className="text-muted" style={{ fontSize: '0.75rem' }}>{pctRh}% do total</span>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--amber)' }} />
                  Manutenções
                </div>
                <strong style={{ display: 'block', fontSize: '0.95rem', marginTop: '0.2rem' }}>{formatarMoeda(saldosNatureza.detalhamentoCusteio.manutencao)}</strong>
                <span className="text-muted" style={{ fontSize: '0.75rem' }}>{pctManutencao}% do total</span>
              </div>
            </div>
          </div>
        </div>

        {/* GRÁFICO 2: Comparativo de Gastos Por Unidade de Saúde (Data Visualization Chart) */}
        <div className="card">
          <div className="card-header flex-between">
            <div>
              <h3><i className="fa-solid fa-chart-bar text-purple"></i> Comparativo de Gastos por Unidade</h3>
              <p className="text-muted text-sm">Volume financeiro total consumido por cada posto/unidade</p>
            </div>
            <span className="badge badge-purple">{unidades.length} Unidades</span>
          </div>

          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {consolidacaoUnidades.map(u => {
              const pct = Math.round((u.custoTotalGeral / maxGastoUnidade) * 100);
              return (
                <div key={u.unidadeId}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    <strong>{u.nome} <span className="badge badge-cyan" style={{ padding: '1px 6px', fontSize: '0.7rem' }}>{u.tipo}</span></strong>
                    <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{formatarMoeda(u.custoTotalGeral)}</span>
                  </div>
                  <div style={{ width: '100%', height: '10px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        width: `${pct}%`, 
                        height: '100%', 
                        background: 'linear-gradient(90deg, var(--primary) 0%, var(--purple) 100%)', 
                        borderRadius: '6px',
                        transition: 'width 0.4s ease'
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* NÍVEL 3: DETALHAMENTO OPERACIONAL & FOCO NA AÇÃO (DRILL-DOWN TABELAS) */}

      {/* Painel Alerta de Insumos Críticos (Lista com Ações Diretas) */}
      <div className="card" style={{ borderLeft: '4px solid var(--rose)' }}>
        <div className="card-header flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3><i className="fa-solid fa-boxes-stacked text-rose"></i> Alertas de Reabastecimento de Insumos Críticos</h3>
            <p className="text-muted text-sm">Ações rápidas para reposição de estoque e reordenamento</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              className="form-control" 
              style={{ width: '180px', padding: '4px 10px', fontSize: '0.82rem' }}
              placeholder="Buscar insumo..."
              value={buscaAlerta}
              onChange={(e) => setBuscaAlerta(e.target.value)}
            />

            <div className="btn-group">
              <button 
                className={`btn btn-sm ${filtroAlerta === 'todos' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setFiltroAlerta('todos')}
              >
                Todos ({materiaisCriticos.length})
              </button>
              <button 
                className={`btn btn-sm ${filtroAlerta === 'esgotados' ? 'btn-rose' : 'btn-outline'}`}
                onClick={() => setFiltroAlerta('esgotados')}
              >
                Esgotados ({esgotadosCount})
              </button>
              <button 
                className={`btn btn-sm ${filtroAlerta === 'baixo' ? 'btn-amber' : 'btn-outline'}`}
                onClick={() => setFiltroAlerta('baixo')}
              >
                Estoque Baixo ({baixoCount})
              </button>
            </div>
          </div>
        </div>

        <div className="card-body">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Insumo / Material</th>
                  <th>Natureza</th>
                  <th>Fornecedor</th>
                  <th>Estoque Atual</th>
                  <th>Valor Est.</th>
                  <th className="text-center">Ações de Reposição</th>
                </tr>
              </thead>
              <tbody>
                {materiaisExibidos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-muted" style={{ padding: '1.5rem' }}>
                      ✅ Nenhum insumo necessita de reposição para o filtro selecionado.
                    </td>
                  </tr>
                ) : (
                  materiaisExibidos.map(m => {
                    const est = m.qtd_estoque ?? 0;
                    return (
                      <tr key={m.id}>
                        <td><strong>#{m.id}</strong></td>
                        <td><strong>{m.descricao}</strong></td>
                        <td>
                          {m.natureza === 'INVESTIMENTO' ? (
                            <span className="badge badge-purple">Investimento</span>
                          ) : (
                            <span className="badge badge-cyan">Custeio</span>
                          )}
                        </td>
                        <td>
                          {m.fornecedor ? (
                            <span className="text-muted" style={{ fontSize: '0.82rem' }}>{m.fornecedor}</span>
                          ) : (
                            <span className="text-muted" style={{ fontSize: '0.82rem' }}>Não inf.</span>
                          )}
                        </td>
                        <td>
                          {est <= 0 ? (
                            <span className="badge badge-rose"><i className="fa-solid fa-circle-xmark"></i> 0 {m.unidade_medida} (Esgotado)</span>
                          ) : (
                            <span className="badge badge-amber"><i className="fa-solid fa-triangle-exclamation"></i> {est} {m.unidade_medida} (Baixo)</span>
                          )}
                        </td>
                        <td>{formatarMoeda(m.valor_estimado || 0)}</td>
                        <td className="text-center">
                          <div className="btn-group">
                            <button className="btn btn-emerald btn-sm" onClick={() => onAbrirAjusteEstoque(m)} title="Repor Estoque">
                              <i className="fa-solid fa-plus-circle"></i> Repor Estoque
                            </button>
                            <button className="btn btn-outline btn-sm" onClick={() => onAbrirEditarMaterial(m)} title="Editar Insumo">
                              <i className="fa-solid fa-pen"></i> Editar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Tabela de Consolidação Financeira Multiclínica por Unidade */}
      <div className="card">
        <div className="card-header flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3><i className="fa-solid fa-calculator text-primary"></i> Consolidação Financeira por Unidade de Saúde</h3>
            <p className="text-muted text-sm">Detalhamento por posto de saúde unindo Gastos com Insumos, Salários/Honorários e Manutenções.</p>
          </div>
          <span className="badge badge-cyan"><i className="fa-solid fa-table"></i> Tabela Executiva</span>
        </div>

        <div className="card-body">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Unidade de Saúde</th>
                  <th>Tipo</th>
                  <th className="text-right">Gastos em Insumos (R$)</th>
                  <th className="text-right">Salários / Honorários (R$)</th>
                  <th className="text-right">Manutenção Equipamentos (R$)</th>
                  <th className="text-right">Total Geral (R$)</th>
                </tr>
              </thead>
              <tbody>
                {consolidacaoUnidades.map(c => (
                  <tr key={c.unidadeId}>
                    <td><strong>{c.nome}</strong></td>
                    <td><span className="badge badge-cyan">{c.tipo}</span></td>
                    <td className="text-right">{formatarMoeda(c.custoInsumosAtendidos)}</td>
                    <td className="text-right">{formatarMoeda(c.custoHonorariosDentistas)}</td>
                    <td className="text-right">{formatarMoeda(c.custoManutencaoEquipamentos)}</td>
                    <td className="text-right" style={{ fontWeight: 800, color: 'var(--text-main)' }}>
                      {formatarMoeda(c.custoTotalGeral)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                  <td colSpan={2}><strong>TOTAL CONSOLIDADO MUNICIPAL:</strong></td>
                  <td className="text-right">
                    {formatarMoeda(consolidacaoUnidades.reduce((a, b) => a + b.custoInsumosAtendidos, 0))}
                  </td>
                  <td className="text-right">
                    {formatarMoeda(consolidacaoUnidades.reduce((a, b) => a + b.custoHonorariosDentistas, 0))}
                  </td>
                  <td className="text-right">
                    {formatarMoeda(consolidacaoUnidades.reduce((a, b) => a + b.custoManutencaoEquipamentos, 0))}
                  </td>
                  <td className="text-right" style={{ fontSize: '1.05rem', color: 'var(--primary)' }}>
                    <strong>{formatarMoeda(consolidacaoUnidades.reduce((a, b) => a + b.custoTotalGeral, 0))}</strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Pedidos Recentes (Drill-Down e Foco na Ação) */}
      <div className="card">
        <div className="card-header flex-between">
          <div>
            <h3><i className="fa-solid fa-clipboard-list text-primary"></i> Solicitações Recentes de Insumos (PBS)</h3>
            <p className="text-muted text-sm">Clique na solicitação para visualizar ou imprimir a Ficha PBS</p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => onSwitchTab('triagem')}>
            Ver Todos os Pedidos <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>

        <div className="card-body">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>N° PBS</th>
                  <th>Unidade Emitente</th>
                  <th>Solicitante</th>
                  <th>Data Pedido</th>
                  <th>Status</th>
                  <th className="text-right">Valor Estimado</th>
                  <th className="text-center">Ação</th>
                </tr>
              </thead>
              <tbody>
                {recentes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-muted" style={{ padding: '1.5rem' }}>
                      Nenhuma solicitação registrada até o momento.
                    </td>
                  </tr>
                ) : (
                  recentes.map(p => {
                    const uni = unidades.find(u => u.id === p.unidade_emitente_id);
                    return (
                      <tr key={p.id}>
                        <td><strong>{p.numero_pbs}</strong></td>
                        <td>{uni?.nome || 'Unidade N/D'}</td>
                        <td>{p.responsavel_nome}</td>
                        <td>{formatarData(p.data_pedido)}</td>
                        <td>{renderBadgeStatus(p.status)}</td>
                        <td className="text-right"><strong>{formatarMoeda(p.valor_total_estimado || 0)}</strong></td>
                        <td className="text-center">
                          <button className="btn btn-primary btn-sm" onClick={() => onAbrirFicha(p)}>
                            <i className="fa-solid fa-file-invoice"></i> Ver Ficha
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};
