import { 
  UnidadeSaude, 
  Material, 
  PedidoPBS, 
  EstatisticasGerais,
  HonorarioOdontologo,
  Equipamento,
  ChamadoManutencao,
  StatusChamado,
  UnidadeConsolidacaoFinanceira,
  SaldosNaturezaRecursos,
  NaturezaDespesa,
  EntradaRecurso,
  UserSistema
} from '../types';
import { RequestCache } from './requestCache';

class ApiService {
  private cache = new RequestCache();
  private pendingWrites = new Map<string, Promise<unknown>>();
  clearCache() { this.cache.clear(); }
  private invalidate(url: string) {
    const resource = url.split('/')[2];
    const groups: Record<string, string[]> = {
      materiais: ['materiais', 'pedidos', 'financeiro'], pedidos: ['pedidos', 'materiais', 'financeiro'],
      honorarios: ['honorarios', 'financeiro'], equipamentos: ['equipamentos', 'chamados', 'manutencao'],
      chamados: ['chamados', 'equipamentos', 'manutencao', 'financeiro'], entradas: ['entradas'], usuarios: ['usuarios'],
    };
    if (!groups[resource]) this.clearCache();
    else this.cache.invalidate(groups[resource].map(s => `/api/${s}`));
    window.dispatchEvent(new Event('odontogest:data-changed'));
  }
  private async request<T>(url: string, options: RequestInit = {}, csrfToken?: string | null): Promise<T> {
    if (!options.method || options.method === 'GET') {
      if (url === '/api/export/sql') return this.fetchRequest<T>(url, options, csrfToken);
      return this.cache.get(url, signal => this.fetchPages<T>(url, { ...options, signal }));
    }
    const key = `${options.method}:${url}:${csrfToken || ''}:${String(options.body || '')}`;
    const pending = this.pendingWrites.get(key);
    if (pending) return pending as Promise<T>;
    const task = this.fetchRequest<T>(url, options, csrfToken).then(result => { this.invalidate(url); return result; });
    this.pendingWrites.set(key, task);
    try { return await task; } finally { if (this.pendingWrites.get(key) === task) this.pendingWrites.delete(key); }
  }
  private async fetchPages<T>(url: string, options: RequestInit): Promise<T> {
    let after = ''; const combined: unknown[] = [];
    do {
      const response = await this.fetchResponse(`${url}${after ? `?after=${after}` : ''}`, options);
      const data = await response.json();
      if (!Array.isArray(data)) return data as T;
      combined.push(...data);
      const next = response.headers.get('X-Next-Cursor') || '';
      if (next && (!/^\d+$/.test(next) || Number(next) <= Number(after))) throw new Error('Paginação inválida. Atualize a página.');
      after = next;
    } while (after);
    return combined as T;
  }
  private async fetchRequest<T>(url: string, options: RequestInit = {}, csrfToken?: string | null): Promise<T> {
    const response = await this.fetchResponse(url, options, csrfToken);
    return response.headers.get('content-type')?.includes('text/sql') ? (await response.text()) as T : response.json();
  }
  private async fetchResponse(url: string, options: RequestInit = {}, csrfToken?: string | null): Promise<Response> {
    const headers = new Headers(options.headers || {});
    
    if (csrfToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes((options.method || 'GET').toUpperCase())) {
      headers.set('X-CSRF-Token', csrfToken);
    }

    if (options.body && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include' // Always pass HttpOnly session cookies
      , cache: 'no-store', signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(20_000)]) : AbortSignal.timeout(20_000)
    });

    if (!response.ok) {
      if (response.status === 401) { this.clearCache(); window.dispatchEvent(new Event('odontogest:unauthorized')); }
      const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido na requisição.' }));
      throw new Error(errorData.error || `Erro HTTP ${response.status}`);
    }

    return response;
  }

  // Unidades
  async getUnidades(): Promise<UnidadeSaude[]> {
    return this.request<UnidadeSaude[]>('/api/unidades');
  }

  async addUnidade(nome: string, tipo: string = "UNIDADE", csrfToken?: string | null): Promise<UnidadeSaude> {
    return this.request<UnidadeSaude>('/api/unidades', {
      method: 'POST',
      body: JSON.stringify({ nome, tipo })
    }, csrfToken);
  }

  async updateUnidade(id: number, nome: string, tipo: string = "UNIDADE", csrfToken?: string | null): Promise<UnidadeSaude> {
    return this.request<UnidadeSaude>(`/api/unidades/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ nome, tipo })
    }, csrfToken);
  }

  async deleteUnidade(id: number, csrfToken?: string | null): Promise<void> {
    return this.request<void>(`/api/unidades/${id}`, {
      method: 'DELETE'
    }, csrfToken);
  }

  // Materiais
  async getMateriais(): Promise<Material[]> {
    return this.request<Material[]>('/api/materiais');
  }

  async addMaterial(
    descricao: string, 
    unidade_medida: string, 
    valor_estimado: number = 0, 
    qtd_estoque: number = 0,
    limite_max_pedido: number | null = null,
    fornecedor: string | null = null,
    natureza: NaturezaDespesa = 'CUSTEIO',
    csrfToken?: string | null
  ): Promise<Material> {
    return this.request<Material>('/api/materiais', {
      method: 'POST',
      body: JSON.stringify({ descricao, unidade_medida, valor_estimado, qtd_estoque, limite_max_pedido, fornecedor, natureza })
    }, csrfToken);
  }

  async atualizarEstoqueMaterial(materialId: number, novaQtd: number, estoqueAnterior: number, csrfToken?: string | null): Promise<Material> {
    return this.request<Material>(`/api/materiais/${materialId}/estoque`, {
      method: 'PATCH',
      body: JSON.stringify({ qtd_estoque: novaQtd, estoque_anterior: estoqueAnterior })
    }, csrfToken);
  }

  async updateMaterial(materialId: number, dados: Partial<Material>, csrfToken?: string | null): Promise<Material> {
    return this.request<Material>(`/api/materiais/${materialId}`, {
      method: 'PUT',
      body: JSON.stringify(dados)
    }, csrfToken);
  }

  async deleteMaterial(materialId: number, csrfToken?: string | null): Promise<void> {
    return this.request<void>(`/api/materiais/${materialId}`, {
      method: 'DELETE'
    }, csrfToken);
  }

  // Pedidos
  async getPedidos(): Promise<PedidoPBS[]> {
    return this.request<PedidoPBS[]>('/api/pedidos');
  }

  async salvarPedido(dados: any, csrfToken?: string | null): Promise<PedidoPBS> {
    return this.request<PedidoPBS>('/api/pedidos', {
      method: 'POST',
      body: JSON.stringify(dados)
    }, csrfToken);
  }

  async confirmarRecebimento(pedidoId: number, apontadorRecebimentoNome: string, dataRecebimento: string, csrfToken?: string | null): Promise<PedidoPBS> {
    return this.request<PedidoPBS>(`/api/pedidos/${pedidoId}/receber`, {
      method: 'PUT',
      body: JSON.stringify({ apontador_recebimento_nome: apontadorRecebimentoNome, data_recebimento: dataRecebimento })
    }, csrfToken);
  }

  async atenderPedido(pedidoId: number, itensAtendidos: any[], csrfToken?: string | null): Promise<PedidoPBS> {
    return this.request<PedidoPBS>(`/api/pedidos/${pedidoId}/atender`, {
      method: 'PUT',
      body: JSON.stringify({ itensAtendidos })
    }, csrfToken);
  }

  async confirmarEnvio(pedidoId: number, apontadorEnvioNome: string, dataEnvio: string, csrfToken?: string | null): Promise<PedidoPBS> {
    return this.request<PedidoPBS>(`/api/pedidos/${pedidoId}/enviar`, {
      method: 'PUT',
      body: JSON.stringify({ apontador_envio_nome: apontadorEnvioNome, data_envio: dataEnvio })
    }, csrfToken);
  }

  async cancelarPedido(pedidoId: number, csrfToken?: string | null): Promise<PedidoPBS> {
    return this.request<PedidoPBS>(`/api/pedidos/${pedidoId}/cancelar`, {
      method: 'PUT'
    }, csrfToken);
  }

  // Estatísticas
  getEstatisticasGastos(pedidos: PedidoPBS[]) {
    const pedidosValidos = pedidos.filter(p => p.status !== 'CANCELADO');

    let totalSolicitado = 0;
    let totalAtendido = 0;

    pedidosValidos.forEach(p => {
      totalSolicitado += (p.valor_total_estimado || 0);
      (p.itens || []).forEach(it => {
        totalAtendido += (Number(it.qtd_atendida || 0) * Number(it.valor_unitario || 0));
      });
    });

    const gastosPorMes: Record<string, number> = {};
    pedidosValidos.forEach(p => {
      const mesAno = (p.data_pedido || p.criado_em || '').substring(0, 7);
      if (mesAno) {
        gastosPorMes[mesAno] = (gastosPorMes[mesAno] || 0) + (p.valor_total_estimado || 0);
      }
    });

    const totalMeses = Object.keys(gastosPorMes).length || 1;
    const mediaMensal = totalSolicitado / totalMeses;

    return { totalSolicitado, totalAtendido, totalGasto: totalSolicitado, gastosPorMes, totalMeses, mediaMensal };
  }

  getEstatisticasPorUnidade(unidades: UnidadeSaude[], pedidos: PedidoPBS[]): EstatisticasGerais {
    let totalSolicitadoGeral = 0;
    let totalAtendidoGeral = 0;
    let totalPedidosGeral = 0;
    let totalPendentesGeral = 0;
    let totalAtendidosGeral = 0;

    const resultado = unidades.map(u => {
      const pedidosUnidade = pedidos.filter(p => p.unidade_emitente_id === u.id);
      const pedidosValidos = pedidosUnidade.filter(p => p.status !== 'CANCELADO');

      const totalPedidos = pedidosUnidade.length;
      const pendentes = pedidosUnidade.filter(p => p.status === 'SOLICITADO' || p.status === 'RECEBIDO').length;
      const atendidos = pedidosUnidade.filter(p => p.status === 'ATENDIDO_PARCIAL' || p.status === 'ATENDIDO_TOTAL' || p.status === 'ENVIADO').length;
      const cancelados = pedidosUnidade.filter(p => p.status === 'CANCELADO').length;

      let totalSolicitado = 0;
      let totalAtendido = 0;

      pedidosValidos.forEach(p => {
        totalSolicitado += (p.valor_total_estimado || 0);
        (p.itens || []).forEach(it => {
          totalAtendido += (Number(it.qtd_atendida || 0) * Number(it.valor_unitario || 0));
        });
      });

      totalSolicitadoGeral += totalSolicitado;
      totalAtendidoGeral += totalAtendido;
      totalPedidosGeral += totalPedidos;
      totalPendentesGeral += pendentes;
      totalAtendidosGeral += atendidos;

      return {
        unidadeId: u.id,
        nome: u.nome,
        tipo: u.tipo,
        totalPedidos,
        pendentes,
        atendidos,
        cancelados,
        totalSolicitado,
        totalAtendido
      };
    });

    return {
      unidadesStats: resultado,
      geral: {
        totalSolicitadoGeral,
        totalAtendidoGeral,
        totalPedidosGeral,
        totalPendentesGeral,
        totalAtendidosGeral,
        totalUnidades: unidades.length
      }
    };
  }

  // Honorários & Salários Odontológicos
  async getHonorarios(): Promise<HonorarioOdontologo[]> {
    return this.request<HonorarioOdontologo[]>('/api/honorarios');
  }

  async addHonorario(dados: Omit<HonorarioOdontologo, 'id'>, csrfToken?: string | null): Promise<HonorarioOdontologo> {
    const { valor_total: _totalCalculadoPeloServidor, ...input } = dados;
    return this.request<HonorarioOdontologo>('/api/honorarios', {
      method: 'POST',
      body: JSON.stringify(input)
    }, csrfToken);
  }

  // Equipamentos
  async getEquipamentos(): Promise<Equipamento[]> {
    return this.request<Equipamento[]>('/api/equipamentos');
  }

  async addEquipamento(dados: Omit<Equipamento, 'id'>, csrfToken?: string | null): Promise<Equipamento> {
    return this.request<Equipamento>('/api/equipamentos', {
      method: 'POST',
      body: JSON.stringify(dados)
    }, csrfToken);
  }

  async atualizarEquipamento(id: number, dados: Partial<Equipamento>, csrfToken?: string | null): Promise<Equipamento> {
    return this.request<Equipamento>(`/api/equipamentos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dados)
    }, csrfToken);
  }

  // Chamados de Manutenção
  async getChamados(): Promise<ChamadoManutencao[]> {
    return this.request<ChamadoManutencao[]>('/api/chamados');
  }

  async addChamado(dados: Omit<ChamadoManutencao, 'id'>, csrfToken?: string | null): Promise<ChamadoManutencao> {
    return this.request<ChamadoManutencao>('/api/chamados', {
      method: 'POST',
      body: JSON.stringify(dados)
    }, csrfToken);
  }

  async updateStatusChamado(chamadoId: number, status: StatusChamado, custoReparo?: number, csrfToken?: string | null): Promise<ChamadoManutencao> {
    return this.request<ChamadoManutencao>(`/api/chamados/${chamadoId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, custo_reparo: custoReparo })
    }, csrfToken);
  }

  async aprovarChamadoManutencao(chamadoId: number, aprovar: boolean = true, csrfToken?: string | null): Promise<ChamadoManutencao> {
    return this.request<ChamadoManutencao>(`/api/chamados/${chamadoId}/aprovar`, {
      method: 'PATCH',
      body: JSON.stringify({ aprovar })
    }, csrfToken);
  }

  // Usuários do Sistema
  async getUsuarios(): Promise<UserSistema[]> {
    return this.request<UserSistema[]>('/api/usuarios');
  }

  async addUsuario(dados: Omit<UserSistema, 'id'>, csrfToken?: string | null): Promise<UserSistema> {
    return this.request<UserSistema>('/api/usuarios', {
      method: 'POST',
      body: JSON.stringify(dados)
    }, csrfToken);
  }

  async updateUsuario(id: number, dados: Partial<UserSistema>, csrfToken?: string | null): Promise<UserSistema> {
    return this.request<UserSistema>(`/api/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dados)
    }, csrfToken);
  }

  async deleteUsuario(id: number, csrfToken?: string | null): Promise<void> {
    return this.request<void>(`/api/usuarios/${id}`, {
      method: 'DELETE'
    }, csrfToken);
  }

  async getAlertasPreventiva(): Promise<{ equipamento: Equipamento; unidade: UnidadeSaude; mensagem: string }[]> {
    return this.request<{ equipamento: Equipamento; unidade: UnidadeSaude; mensagem: string }[]>('/api/manutencao/alertas-preventiva');
  }

  async getConsolidacaoFinanceira(): Promise<UnidadeConsolidacaoFinanceira[]> {
    return this.request<UnidadeConsolidacaoFinanceira[]>('/api/financeiro/consolidacao');
  }

  getConsolidacaoFinanceiraLocal(
    unidades: UnidadeSaude[], 
    pedidos: PedidoPBS[], 
    honorarios: HonorarioOdontologo[], 
    chamados: ChamadoManutencao[]
  ): UnidadeConsolidacaoFinanceira[] {
    return unidades.map(u => {
      // 1. Insumos Atendidos (PBS)
      const pedidosUnidade = pedidos.filter(p => p.unidade_emitente_id === u.id && p.status !== 'CANCELADO');
      let custoInsumos = 0;
      pedidosUnidade.forEach(p => {
        (p.itens || []).forEach(it => {
          custoInsumos += (Number(it.qtd_atendida || 0) * Number(it.valor_unitario || 0));
        });
      });

      // 2. Honorários Odontólogos
      const honorariosUnidade = honorarios.filter(h => h.unidade_id === u.id);
      const custoHonorarios = honorariosUnidade.reduce((acc, h) => acc + Number(h.valor_total || 0), 0);

      // 3. Manutenção de Equipamentos
      const chamadosUnidade = chamados.filter(c => c.unidade_id === u.id && c.status === 'CONCLUIDO');
      const custoManutencao = chamadosUnidade.reduce((acc, c) => acc + Number(c.custo_reparo || 0), 0);

      const custoTotalGeral = custoInsumos + custoHonorarios + custoManutencao;

      return {
        unidadeId: u.id,
        nome: u.nome,
        tipo: u.tipo,
        custoInsumosAtendidos: custoInsumos,
        custoHonorariosDentistas: custoHonorarios,
        custoManutencaoEquipamentos: custoManutencao,
        custoTotalGeral
      };
    });
  }

  // Entradas e Aportes Financeiros
  async getEntradas(): Promise<EntradaRecurso[]> {
    return this.request<EntradaRecurso[]>('/api/entradas');
  }

  async addEntrada(dados: Omit<EntradaRecurso, 'id'>, csrfToken?: string | null): Promise<EntradaRecurso> {
    return this.request<EntradaRecurso>('/api/entradas', {
      method: 'POST',
      body: JSON.stringify(dados)
    }, csrfToken);
  }

  async deleteEntrada(id: number, csrfToken?: string | null): Promise<void> {
    return this.request<void>(`/api/entradas/${id}`, {
      method: 'DELETE'
    }, csrfToken);
  }

  getSaldosNaturezaRecursos(
    unidades: UnidadeSaude[],
    pedidos: PedidoPBS[],
    materiais: Material[],
    honorarios: HonorarioOdontologo[],
    chamados: ChamadoManutencao[],
    entradas: EntradaRecurso[] = []
  ): SaldosNaturezaRecursos {
    // 1. Orçamentos / Entradas Cadastradas
    let orcamentoCusteioTotal = 0;
    let orcamentoInvestimentoTotal = 0;

    if (entradas && entradas.length > 0) {
      entradas.forEach(e => {
        const val = Number(e.valor) || 0;
        if (e.natureza === 'INVESTIMENTO') {
          orcamentoInvestimentoTotal += val;
        } else {
          orcamentoCusteioTotal += val;
        }
      });
    }

    // Map para checar a natureza de cada material
    const mapaNaturezaMaterial = new Map<number, NaturezaDespesa>();
    materiais.forEach(m => {
      mapaNaturezaMaterial.set(m.id, m.natureza || 'CUSTEIO');
    });

    // 2. Gastos com Insumos por Natureza
    let insumosCusteio = 0;
    let insumosInvestimento = 0;

    const pedidosValidos = pedidos.filter(p => p.status !== 'CANCELADO');
    pedidosValidos.forEach(p => {
      (p.itens || []).forEach(it => {
        const naturezaItem = it.natureza || mapaNaturezaMaterial.get(it.material_id) || 'CUSTEIO';
        const valorAtendido = (Number(it.qtd_atendida || 0) * Number(it.valor_unitario || 0));

        if (naturezaItem === 'INVESTIMENTO') {
          insumosInvestimento += valorAtendido;
        } else {
          insumosCusteio += valorAtendido;
        }
      });
    });

    // 3. Gastos com RH / Honorários (100% Custeio)
    const rhHonorarios = honorarios.reduce((acc, h) => acc + Number(h.valor_total || 0), 0);

    // 4. Gastos com Manutenção de Equipamentos (100% Custeio)
    const manutencao = chamados.filter(c => c.status === 'CONCLUIDO').reduce((acc, c) => acc + Number(c.custo_reparo || 0), 0);

    // Totais e Saldos Custeio
    const gastoCusteioTotal = insumosCusteio + rhHonorarios + manutencao;
    const saldoCusteioDisponivel = orcamentoCusteioTotal - gastoCusteioTotal;
    const percentualCusteioComprometido = orcamentoCusteioTotal > 0 
      ? Math.min(100, Math.max(0, (gastoCusteioTotal / orcamentoCusteioTotal) * 100))
      : 0;

    // Totais e Saldos Investimento
    const gastoInvestimentoTotal = insumosInvestimento;
    const saldoInvestimentoDisponivel = orcamentoInvestimentoTotal - gastoInvestimentoTotal;
    const percentualInvestimentoComprometido = orcamentoInvestimentoTotal > 0 
      ? Math.min(100, Math.max(0, (gastoInvestimentoTotal / orcamentoInvestimentoTotal) * 100))
      : 0;

    return {
      orcamentoCusteioTotal,
      gastoCusteioTotal,
      saldoCusteioDisponivel,
      percentualCusteioComprometido,

      orcamentoInvestimentoTotal,
      gastoInvestimentoTotal,
      saldoInvestimentoDisponivel,
      percentualInvestimentoComprometido,

      detalhamentoCusteio: {
        insumos: insumosCusteio,
        rhHonorarios,
        manutencao
      },
      detalhamentoInvestimento: {
        equipamentosPermanentes: insumosInvestimento
      }
    };
  }

  async exportarSQL(): Promise<string> {
    return this.request<string>('/api/export/sql');
  }
}

export const dbService = new ApiService();
