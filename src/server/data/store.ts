import { prisma } from '../db/prisma.js';

export type NaturezaDespesa = 'CUSTEIO' | 'INVESTIMENTO';

export interface UnidadeSaude {
  id: number;
  nome: string;
  tipo: string;
  orcamento_custeio?: number;
  orcamento_investimento?: number;
  criado_em?: string;
}

export interface Material {
  id: number;
  descricao: string;
  unidade_medida: string;
  valor_estimado: number;
  qtd_estoque: number;
  limite_max_pedido?: number | null;
  fornecedor?: string | null;
  natureza?: NaturezaDespesa;
  criado_em?: string;
}

export interface ItemPedido {
  id: number;
  pedido_id: number;
  numero_item: number;
  material_id: number;
  qtd_pedida: number;
  qtd_atendida: number;
  valor_unitario: number;
  valor_total: number;
}

export interface PedidoPBS {
  id: number;
  numero_pbs: string;
  unidade_emitente_id: number;
  data_pedido: string;
  responsavel_nome: string;
  responsavel_funcao?: string;
  responsavel_registro?: string;
  atividade_programa?: string;
  elemento_despesa?: string;
  observacoes?: string;
  status: 'SOLICITADO' | 'RECEBIDO' | 'ENVIADO' | 'ATENDIDO_PARCIAL' | 'ATENDIDO_TOTAL' | 'CANCELADO';
  valor_total_estimado: number;
  apontador_envio_nome?: string | null;
  data_envio?: string | null;
  apontador_recebimento_nome?: string | null;
  data_recebimento?: string | null;
  criado_em?: string;
  atualizado_em?: string;
  itens: ItemPedido[];
}

export interface UnidadeStats {
  unidadeId: number;
  nome: string;
  tipo: string;
  totalPedidos: number;
  pendentes: number;
  atendidos: number;
  cancelados: number;
  totalSolicitado: number;
  totalAtendido: number;
}

export interface EstatisticasGerais {
  unidadesStats: UnidadeStats[];
  geral: {
    totalSolicitadoGeral: number;
    totalAtendidoGeral: number;
    totalPedidosGeral: number;
    totalPendentesGeral: number;
    totalAtendidosGeral: number;
    totalUnidades: number;
  };
}

export const INITIAL_UNIDADES: UnidadeSaude[] = [
  { id: 1, nome: "SECRETARIA MUNICIPAL DE SAÚDE (SMS)", tipo: "SMS", criado_em: "2026-08-18 00:00:00" }
];

export const INITIAL_MATERIAIS: Material[] = [];

export const INITIAL_PEDIDOS: PedidoPBS[] = [];
export type TipoContratoOdontologo = 'FOLHA_FIXA' | 'COMISSAO' | 'PLANTAO' | 'PJ_RPA';

export interface HonorarioOdontologo {
  id: number;
  unidade_id: number;
  nome_dentista: string;
  cro: string;
  tipo_contrato: TipoContratoOdontologo;
  mes_referencia: string;
  valor_fixo: number;
  valor_comissao: number;
  valor_total: number;
  observacoes?: string;
  criado_em?: string;
}

export interface Equipamento {
  id: number;
  unidade_id: number;
  nome: string;
  numero_serie: string;
  categoria: string;
  data_ultima_preventiva?: string | null;
  criado_em?: string;
}

export type StatusChamado = 'ABERTO' | 'APROVADO_ADM' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'RECUSADO';
export type TipoChamado = 'CORRETIVA' | 'PREVENTIVA';

export interface ChamadoManutencao {
  id: number;
  unidade_id: number;
  equipamento_id: number;
  tipo: TipoChamado;
  descricao_defeito: string;
  custo_reparo: number;
  status: StatusChamado;
  aprovado_adm?: boolean;
  data_abertura: string;
  data_aprovacao?: string | null;
  data_conclusao?: string | null;
  observacoes?: string;
  criado_em?: string;
}

export interface UnidadeConsolidacaoFinanceira {
  unidadeId: number;
  nome: string;
  tipo: string;
  custoInsumosAtendidos: number;
  custoHonorariosDentistas: number;
  custoManutencaoEquipamentos: number;
  custoTotalGeral: number;
}

export const INITIAL_HONORARIOS: HonorarioOdontologo[] = [];

export const INITIAL_EQUIPAMENTOS: Equipamento[] = [];

export const INITIAL_CHAMADOS: ChamadoManutencao[] = [];

export type TipoRecorrencia = 'RECORRENTE' | 'PARCELA_UNICA';

export interface EntradaRecurso {
  id: number;
  unidade_id?: number | null;
  natureza: NaturezaDespesa;
  tipo_recorrencia: TipoRecorrencia;
  descricao: string;
  valor: number;
  data_credito: string;
  mes_referencia: string;
  observacoes?: string;
  criado_em?: string;
}

export const INITIAL_ENTRADAS: EntradaRecurso[] = [];

class DataStore {
  private inMemoryUnidades: UnidadeSaude[] = [...INITIAL_UNIDADES];
  private inMemoryMateriais: Material[] = [...INITIAL_MATERIAIS];
  private inMemoryPedidos: PedidoPBS[] = [...INITIAL_PEDIDOS];
  private inMemoryHonorarios: HonorarioOdontologo[] = [...INITIAL_HONORARIOS];
  private inMemoryEquipamentos: Equipamento[] = [...INITIAL_EQUIPAMENTOS];
  private inMemoryChamados: ChamadoManutencao[] = [...INITIAL_CHAMADOS];
  private inMemoryEntradas: EntradaRecurso[] = [...INITIAL_ENTRADAS];

  // Unidades
  async getUnidades(): Promise<UnidadeSaude[]> {
    try {
      const list = await prisma.unidadeSaude.findMany();
      if (list) {
        return list.map(u => ({
          id: u.id,
          nome: u.nome,
          tipo: u.tipo,
          criado_em: u.criadoEm.toISOString()
        }));
      }
    } catch (err) {
      // Fallback
    }
    return this.inMemoryUnidades;
  }

  async addUnidade(nome: string, tipo: string = "UNIDADE"): Promise<UnidadeSaude> {
    try {
      const u = await prisma.unidadeSaude.create({
        data: { nome, tipo }
      });
      const nova = { id: u.id, nome: u.nome, tipo: u.tipo, criado_em: u.criadoEm.toISOString() };
      this.inMemoryUnidades.push(nova);
      return nova;
    } catch (err) {
      if (this.inMemoryUnidades.some(u => u.nome.toLowerCase() === nome.toLowerCase())) {
        throw new Error(`Unidade "${nome}" já cadastrada.`);
      }
      const nova: UnidadeSaude = {
        id: this.inMemoryUnidades.length ? Math.max(...this.inMemoryUnidades.map(u => u.id)) + 1 : 1,
        nome,
        tipo,
        criado_em: new Date().toISOString()
      };
      this.inMemoryUnidades.push(nova);
      return nova;
    }
  }

  async updateUnidade(id: number, nome: string, tipo?: string): Promise<UnidadeSaude> {
    try {
      const existing = this.inMemoryUnidades.find(u => u.id === Number(id));
      const tipoFinal = tipo || existing?.tipo || "UNIDADE";
      const u = await prisma.unidadeSaude.update({
        where: { id: Number(id) },
        data: { nome, tipo: tipoFinal }
      });
      const idx = this.inMemoryUnidades.findIndex(item => item.id === Number(id));
      const alt = { id: u.id, nome: u.nome, tipo: u.tipo, criado_em: u.criadoEm.toISOString() };
      if (idx !== -1) this.inMemoryUnidades[idx] = alt;
      return alt;
    } catch (err) {
      const idx = this.inMemoryUnidades.findIndex(item => item.id === Number(id));
      if (idx !== -1) {
        this.inMemoryUnidades[idx].nome = nome;
        if (tipo) this.inMemoryUnidades[idx].tipo = tipo;
        return this.inMemoryUnidades[idx];
      }
      throw new Error(`Estabelecimento #${id} não encontrado.`);
    }
  }

  async deleteUnidade(id: number): Promise<void> {
    try {
      await prisma.unidadeSaude.delete({
        where: { id: Number(id) }
      });
    } catch (err) {}
    this.inMemoryUnidades = this.inMemoryUnidades.filter(u => u.id !== Number(id));
  }

  // Materiais
  async getMateriais(): Promise<Material[]> {
    try {
      const list = await prisma.material.findMany({
        orderBy: { descricao: 'asc' }
      });
      if (list) {
        return list.map(m => ({
          id: m.id,
          descricao: m.descricao,
          unidade_medida: m.unidadeMedida,
          valor_estimado: Number(m.valorEstimado),
          qtd_estoque: m.qtdEstoque,
          limite_max_pedido: (m as any).limiteMaxPedido,
          fornecedor: (m as any).fornecedor || null,
          criado_em: m.criadoEm.toISOString()
        }));
      }
    } catch (err) {
      // Fallback
    }
    return this.inMemoryMateriais;
  }

  async addMaterial(
    descricao: string, 
    unidade_medida: string, 
    valor_estimado: number = 0, 
    qtd_estoque: number = 100,
    limite_max_pedido: number | null = null,
    fornecedor: string | null = null
  ): Promise<Material> {
    try {
      const m = await (prisma.material as any).create({
        data: {
          descricao,
          unidadeMedida: unidade_medida,
          valorEstimado: valor_estimado,
          qtdEstoque: qtd_estoque,
          limiteMaxPedido: limite_max_pedido,
          fornecedor: fornecedor
        }
      });
      const novo = { 
        id: m.id, 
        descricao: m.descricao, 
        unidade_medida: m.unidadeMedida, 
        valor_estimado: Number(m.valorEstimado), 
        qtd_estoque: m.qtdEstoque,
        limite_max_pedido: m.limiteMaxPedido,
        fornecedor: m.fornecedor
      };
      this.inMemoryMateriais.push(novo);
      return novo;
    } catch (err) {
      const fornNorm = (fornecedor || '').toLowerCase().trim();
      const descNorm = descricao.toLowerCase().trim();
      if (this.inMemoryMateriais.some(m => m.descricao.toLowerCase().trim() === descNorm && (m.fornecedor || '').toLowerCase().trim() === fornNorm)) {
        throw new Error(`Material "${descricao}" do mesmo fornecedor já cadastrado.`);
      }
      const novo: Material = {
        id: this.inMemoryMateriais.length ? Math.max(...this.inMemoryMateriais.map(m => m.id)) + 1 : 1,
        descricao,
        unidade_medida,
        valor_estimado: Number(valor_estimado) || 0,
        qtd_estoque: Number(qtd_estoque) || 0,
        limite_max_pedido: limite_max_pedido ? Number(limite_max_pedido) : null,
        fornecedor: fornecedor || null,
        criado_em: new Date().toISOString()
      };
      this.inMemoryMateriais.push(novo);
      return novo;
    }
  }

  async atualizarEstoqueMaterial(materialId: number, novaQtd: number): Promise<Material> {
    try {
      const m = await prisma.material.update({
        where: { id: Number(materialId) },
        data: { qtdEstoque: Math.max(0, Number(novaQtd) || 0) }
      });
      return { 
        id: m.id, 
        descricao: m.descricao, 
        unidade_medida: m.unidadeMedida, 
        valor_estimado: Number(m.valorEstimado), 
        qtd_estoque: m.qtdEstoque,
        limite_max_pedido: (m as any).limiteMaxPedido,
        fornecedor: (m as any).fornecedor || null
      };
    } catch (err) {
      const mIndex = this.inMemoryMateriais.findIndex(m => m.id === Number(materialId));
      if (mIndex === -1) throw new Error("Material não encontrado.");
      this.inMemoryMateriais[mIndex].qtd_estoque = Math.max(0, Number(novaQtd) || 0);
      return this.inMemoryMateriais[mIndex];
    }
  }

  async updateMaterial(materialId: number, dados: Partial<Material>): Promise<Material> {
    try {
      const m = await (prisma.material as any).update({
        where: { id: Number(materialId) },
        data: {
          ...(dados.descricao && { descricao: dados.descricao }),
          ...(dados.unidade_medida && { unidadeMedida: dados.unidade_medida }),
          ...(dados.valor_estimado !== undefined && { valorEstimado: dados.valor_estimado }),
          ...(dados.qtd_estoque !== undefined && { qtdEstoque: dados.qtd_estoque }),
          ...(dados.limite_max_pedido !== undefined && { limiteMaxPedido: dados.limite_max_pedido }),
          ...(dados.fornecedor !== undefined && { fornecedor: dados.fornecedor })
        }
      });
      return { 
        id: m.id, 
        descricao: m.descricao, 
        unidade_medida: m.unidadeMedida, 
        valor_estimado: Number(m.valorEstimado), 
        qtd_estoque: m.qtdEstoque,
        limite_max_pedido: m.limiteMaxPedido,
        fornecedor: m.fornecedor
      };
    } catch (err) {
      const mIndex = this.inMemoryMateriais.findIndex(m => m.id === Number(materialId));
      if (mIndex === -1) throw new Error("Material não encontrado.");

      if (dados.descricao && this.inMemoryMateriais.some(m => m.id !== Number(materialId) && m.descricao.toLowerCase() === dados.descricao!.toLowerCase())) {
        throw new Error(`Outro material já cadastrado com o nome "${dados.descricao}".`);
      }

      if (dados.descricao !== undefined) this.inMemoryMateriais[mIndex].descricao = dados.descricao;
      if (dados.unidade_medida !== undefined) this.inMemoryMateriais[mIndex].unidade_medida = dados.unidade_medida;
      if (dados.valor_estimado !== undefined) this.inMemoryMateriais[mIndex].valor_estimado = Number(dados.valor_estimado) || 0;
      if (dados.qtd_estoque !== undefined) this.inMemoryMateriais[mIndex].qtd_estoque = Math.max(0, Number(dados.qtd_estoque) || 0);
      if (dados.limite_max_pedido !== undefined) this.inMemoryMateriais[mIndex].limite_max_pedido = dados.limite_max_pedido !== null ? Number(dados.limite_max_pedido) : null;

      return this.inMemoryMateriais[mIndex];
    }
  }

  async deleteMaterial(id: number): Promise<void> {
    try {
      await prisma.material.delete({
        where: { id: Number(id) }
      });
    } catch (err) {}
    this.inMemoryMateriais = this.inMemoryMateriais.filter(m => m.id !== Number(id));
  }

  // Pedidos
  async getPedidos(unidadeEmitenteId?: number): Promise<PedidoPBS[]> {
    try {
      const list = await prisma.pedidoPBS.findMany({
        where: unidadeEmitenteId ? { unidadeEmitenteId } : undefined,
        include: { itens: true },
        orderBy: { id: 'desc' },
        take: 300
      });
      if (list) {
        return list.map(p => ({
          id: p.id,
          numero_pbs: p.numeroPbs || '',
          unidade_emitente_id: p.unidadeEmitenteId,
          data_pedido: p.dataPedido.toISOString().substring(0, 10),
          responsavel_nome: p.responsavelNome,
          responsavel_funcao: p.responsavelFuncao || undefined,
          responsavel_registro: p.responsavelRegistro || undefined,
          atividade_programa: p.atividadePrograma || undefined,
          elemento_despesa: p.elementoDespesa || undefined,
          observacoes: p.observacoes || undefined,
          status: p.status as any,
          valor_total_estimado: Number(p.valorTotalEstimado),
          apontador_envio_nome: p.apontadorEnvioNome,
          data_envio: p.dataEnvio ? p.dataEnvio.toISOString().substring(0, 10) : null,
          apontador_recebimento_nome: p.apontadorRecebimentoNome,
          data_recebimento: p.dataRecebimento ? p.dataRecebimento.toISOString().substring(0, 10) : null,
          itens: p.itens.map(it => ({
            id: it.id,
            pedido_id: it.pedidoId,
            numero_item: it.numeroItem,
            material_id: it.materialId,
            qtd_pedida: it.qtdPedida,
            qtd_atendida: it.qtdAtendida,
            valor_unitario: Number(it.valorUnitario || 0),
            valor_total: Number(it.valorTotal || 0)
          }))
        }));
      }
    } catch (err) {
      // Fallback
    }
    if (unidadeEmitenteId) {
      return this.inMemoryPedidos.filter(p => p.unidade_emitente_id === unidadeEmitenteId);
    }
    return this.inMemoryPedidos;
  }

  async salvarPedido(dados: {
    unidade_emitente_id: number;
    data_pedido: string;
    responsavel_nome: string;
    responsavel_funcao?: string;
    responsavel_registro?: string;
    atividade_programa?: string;
    elemento_despesa?: string;
    observacoes?: string;
    numero_pbs?: string;
    itens: { material_id: number; qtd_pedida: number; valor_unitario?: number }[];
  }): Promise<PedidoPBS> {
    if (!Array.isArray(dados.itens) || dados.itens.length === 0 || dados.itens.length > 100) {
      throw new Error("O pedido deve conter entre 1 e 100 itens.");
    }

    try {
      // Validar cada material a partir do catálogo do servidor (evita manipulação de preço pelo cliente)
      let valorTotalEstimado = 0;
      const itensCreate: {
        numeroItem: number;
        materialId: number;
        qtdPedida: number;
        qtdAtendida: number;
        valorUnitario: number;
        valorTotal: number;
      }[] = [];

      for (let i = 0; i < dados.itens.length; i++) {
        const item = dados.itens[i];
        const qPed = Math.floor(Number(item.qtd_pedida));
        if (!Number.isFinite(qPed) || qPed <= 0) {
          throw new Error(`Quantidade inválida para o item #${i + 1}. Deve ser um número inteiro positivo.`);
        }

        let mat = await prisma.material.findUnique({ where: { id: Number(item.material_id) } }).catch(() => null);
        if (!mat) {
          mat = this.inMemoryMateriais.find(m => m.id === Number(item.material_id)) as any;
        }
        if (!mat) {
          throw new Error(`Material #${item.material_id} não encontrado no catálogo.`);
        }

        if (mat.limiteMaxPedido && mat.limiteMaxPedido > 0 && qPed > mat.limiteMaxPedido) {
          throw new Error(`Quantidade solicitada (${qPed}) excede o limite máximo permitido (${mat.limiteMaxPedido}) para o material "${mat.descricao}".`);
        }

        const vUnit = Number(mat.valorEstimado ?? (mat as any).valor_estimado ?? 0);
        const vTot = vUnit * qPed;
        valorTotalEstimado += vTot;

        itensCreate.push({
          numeroItem: i + 1,
          materialId: Number(item.material_id),
          qtdPedida: qPed,
          qtdAtendida: 0,
          valorUnitario: vUnit,
          valorTotal: vTot
        });
      }

      const count = await prisma.pedidoPBS.count();
      const nextId = count + 1;
      const anoAtual = new Date().getFullYear();
      const numeroPbs = `PBS-${anoAtual}/${String(nextId).padStart(4, '0')}`;

      const p = await prisma.pedidoPBS.create({
        data: {
          numeroPbs,
          unidadeEmitenteId: Number(dados.unidade_emitente_id),
          dataPedido: new Date(dados.data_pedido || Date.now()),
          responsavelNome: dados.responsavel_nome,
          responsavelFuncao: dados.responsavel_funcao || "",
          responsavelRegistro: dados.responsavel_registro || "",
          atividadePrograma: dados.atividade_programa || "",
          elementoDespesa: dados.elemento_despesa || "",
          observacoes: dados.observacoes || "",
          status: "SOLICITADO",
          valorTotalEstimado,
          itens: {
            create: itensCreate
          }
        },
        include: { itens: true }
      });

      const res: PedidoPBS = {
        id: p.id,
        numero_pbs: p.numeroPbs || '',
        unidade_emitente_id: p.unidadeEmitenteId,
        data_pedido: p.dataPedido.toISOString().substring(0, 10),
        responsavel_nome: p.responsavelNome,
        responsavel_funcao: p.responsavelFuncao || undefined,
        responsavel_registro: p.responsavelRegistro || undefined,
        atividade_programa: p.atividadePrograma || undefined,
        elemento_despesa: p.elementoDespesa || undefined,
        observacoes: p.observacoes || undefined,
        status: p.status as any,
        valor_total_estimado: Number(p.valorTotalEstimado),
        apontador_envio_nome: p.apontadorEnvioNome,
        data_envio: p.dataEnvio ? p.dataEnvio.toISOString().substring(0, 10) : null,
        apontador_recebimento_nome: p.apontadorRecebimentoNome,
        data_recebimento: p.dataRecebimento ? p.dataRecebimento.toISOString().substring(0, 10) : null,
        itens: p.itens.map(it => ({
          id: it.id,
          pedido_id: it.pedidoId,
          numero_item: it.numeroItem,
          material_id: it.materialId,
          qtd_pedida: it.qtdPedida,
          qtd_atendida: it.qtdAtendida,
          valor_unitario: Number(it.valorUnitario || 0),
          valor_total: Number(it.valorTotal || 0)
        }))
      };

      this.inMemoryPedidos.unshift(res);
      if (this.inMemoryPedidos.length > 200) this.inMemoryPedidos.pop();
      return res;
    } catch (err: any) {
      if (err.code === 'P2003' || err.code === 'P2002' || err.message?.includes('não encontrado') || err.message?.includes('excede') || err.message?.includes('inválida')) {
        throw err;
      }

      const nextId = this.inMemoryPedidos.length ? Math.max(...this.inMemoryPedidos.map(p => p.id)) + 1 : 1;
      const anoAtual = new Date().getFullYear();
      const numeroPbs = `PBS-${anoAtual}/${String(nextId).padStart(4, '0')}`;

      let valorTotalEstimado = 0;
      const itensCompletos: ItemPedido[] = [];

      for (let i = 0; i < dados.itens.length; i++) {
        const item = dados.itens[i];
        const qPed = Math.max(1, Math.floor(Number(item.qtd_pedida) || 1));
        const mat = this.inMemoryMateriais.find(m => m.id === Number(item.material_id));
        const vUnit = Number(mat?.valor_estimado || 0);
        const vTot = vUnit * qPed;
        valorTotalEstimado += vTot;

        itensCompletos.push({
          id: Date.now() + i,
          pedido_id: nextId,
          numero_item: i + 1,
          material_id: Number(item.material_id),
          qtd_pedida: qPed,
          qtd_atendida: 0,
          valor_unitario: vUnit,
          valor_total: vTot
        });
      }

      const novoPedido: PedidoPBS = {
        id: nextId,
        numero_pbs: numeroPbs,
        unidade_emitente_id: Number(dados.unidade_emitente_id),
        data_pedido: dados.data_pedido || new Date().toISOString().substring(0, 10),
        responsavel_nome: dados.responsavel_nome,
        responsavel_funcao: dados.responsavel_funcao || "",
        responsavel_registro: dados.responsavel_registro || "",
        atividade_programa: dados.atividade_programa || "",
        elemento_despesa: dados.elemento_despesa || "",
        observacoes: dados.observacoes || "",
        status: "SOLICITADO",
        valor_total_estimado: valorTotalEstimado,
        apontador_envio_nome: null,
        data_envio: null,
        apontador_recebimento_nome: null,
        data_recebimento: null,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
        itens: itensCompletos
      };

      this.inMemoryPedidos.unshift(novoPedido);
      if (this.inMemoryPedidos.length > 200) this.inMemoryPedidos.pop();
      return novoPedido;
    }
  }

  async confirmarRecebimento(pedidoId: number, apontadorRecebimentoNome: string, dataRecebimento: string): Promise<PedidoPBS> {
    try {
      const p = await prisma.pedidoPBS.update({
        where: { id: Number(pedidoId) },
        data: {
          status: 'RECEBIDO',
          apontadorRecebimentoNome,
          dataRecebimento: new Date(dataRecebimento || Date.now())
        },
        include: { itens: true }
      });

      return {
        id: p.id,
        numero_pbs: p.numeroPbs || '',
        unidade_emitente_id: p.unidadeEmitenteId,
        data_pedido: p.dataPedido.toISOString().substring(0, 10),
        responsavel_nome: p.responsavelNome,
        responsavel_funcao: p.responsavelFuncao || undefined,
        responsavel_registro: p.responsavelRegistro || undefined,
        atividade_programa: p.atividadePrograma || undefined,
        elemento_despesa: p.elementoDespesa || undefined,
        observacoes: p.observacoes || undefined,
        status: p.status as any,
        valor_total_estimado: Number(p.valorTotalEstimado),
        apontador_envio_nome: p.apontadorEnvioNome,
        data_envio: p.dataEnvio ? p.dataEnvio.toISOString().substring(0, 10) : null,
        apontador_recebimento_nome: p.apontadorRecebimentoNome,
        data_recebimento: p.dataRecebimento ? p.dataRecebimento.toISOString().substring(0, 10) : null,
        itens: p.itens.map(it => ({
          id: it.id,
          pedido_id: it.pedidoId,
          numero_item: it.numeroItem,
          material_id: it.materialId,
          qtd_pedida: it.qtdPedida,
          qtd_atendida: it.qtdAtendida,
          valor_unitario: Number(it.valorUnitario || 0),
          valor_total: Number(it.valorTotal || 0)
        }))
      };
    } catch (err) {
      const pIndex = this.inMemoryPedidos.findIndex(p => p.id === Number(pedidoId));
      if (pIndex === -1) throw new Error("Pedido não encontrado.");

      this.inMemoryPedidos[pIndex].status = "RECEBIDO";
      this.inMemoryPedidos[pIndex].apontador_recebimento_nome = apontadorRecebimentoNome;
      this.inMemoryPedidos[pIndex].data_recebimento = dataRecebimento || new Date().toISOString().substring(0, 10);
      this.inMemoryPedidos[pIndex].atualizado_em = new Date().toISOString();

      return this.inMemoryPedidos[pIndex];
    }
  }

  async atenderPedido(pedidoId: number, itensAtendidos: { item_id?: number; material_id: number; qtd_atendida: number }[]): Promise<PedidoPBS> {
    try {
      const pedidoAtual = await prisma.pedidoPBS.findUnique({
        where: { id: Number(pedidoId) },
        include: { itens: true }
      });
      if (!pedidoAtual) throw new Error("Pedido não encontrado.");

      if (['CANCELADO', 'ENVIADO', 'ATENDIDO_TOTAL'].includes(pedidoAtual.status)) {
        throw new Error(`Pedido com status "${pedidoAtual.status}" não pode ser atendido.`);
      }

      if (!Array.isArray(itensAtendidos) || itensAtendidos.length === 0) {
        throw new Error("Nenhum item informado para atendimento.");
      }

      // Validar limites e estoque antes de persistir
      const itemUpdates: { itemId: number; materialId: number; diferenca: number; qNova: number }[] = [];
      let todosAtendidos100 = true;
      let algumAtendido = false;

      for (const item of pedidoAtual.itens) {
        const matAtualizacao = itensAtendidos.find(i => i.item_id === item.id || i.material_id === item.materialId);
        let qAtendidaNova = Number(item.qtdAtendida) || 0;

        if (matAtualizacao) {
          const informed = Math.floor(Number(matAtualizacao.qtd_atendida));
          if (!Number.isFinite(informed) || informed < 0) {
            throw new Error("Quantidade atendida deve ser um número não negativo.");
          }
          if (informed > item.qtdPedida) {
            throw new Error(`Quantidade atendida (${informed}) não pode exceder a quantidade solicitada (${item.qtdPedida}).`);
          }
          qAtendidaNova = informed;
        }

        const qAtendidaAntiga = Number(item.qtdAtendida) || 0;
        const diferenca = qAtendidaNova - qAtendidaAntiga;

        if (diferenca > 0) {
          const mat = await prisma.material.findUnique({ where: { id: item.materialId } });
          if (mat && mat.qtdEstoque < diferenca) {
            throw new Error(`Estoque insuficiente para o material "${mat.descricao}". Disponível: ${mat.qtdEstoque}, requerido adicional: ${diferenca}.`);
          }
        }

        itemUpdates.push({
          itemId: item.id,
          materialId: item.materialId,
          diferenca,
          qNova: qAtendidaNova
        });

        if (qAtendidaNova > 0) algumAtendido = true;
        if (qAtendidaNova < item.qtdPedida) todosAtendidos100 = false;
      }

      let novoStatus: any = pedidoAtual.status;
      if (todosAtendidos100 && algumAtendido) {
        novoStatus = "ATENDIDO_TOTAL";
      } else if (algumAtendido) {
        novoStatus = "ATENDIDO_PARCIAL";
      }

      // Execução transacional atômica
      const p = await prisma.$transaction(async (tx) => {
        for (const update of itemUpdates) {
          if (update.diferenca !== 0) {
            await tx.material.update({
              where: { id: update.materialId },
              data: { qtdEstoque: { decrement: update.diferenca } }
            });
          }
          await tx.itemPedidoPBS.update({
            where: { id: update.itemId },
            data: { qtdAtendida: update.qNova }
          });
        }

        return await tx.pedidoPBS.update({
          where: { id: Number(pedidoId) },
          data: { status: novoStatus },
          include: { itens: true }
        });
      });

      return {
        id: p.id,
        numero_pbs: p.numeroPbs || '',
        unidade_emitente_id: p.unidadeEmitenteId,
        data_pedido: p.dataPedido.toISOString().substring(0, 10),
        responsavel_nome: p.responsavelNome,
        responsavel_funcao: p.responsavelFuncao || undefined,
        responsavel_registro: p.responsavelRegistro || undefined,
        atividade_programa: p.atividadePrograma || undefined,
        elemento_despesa: p.elementoDespesa || undefined,
        observacoes: p.observacoes || undefined,
        status: p.status as any,
        valor_total_estimado: Number(p.valorTotalEstimado),
        apontador_envio_nome: p.apontadorEnvioNome,
        data_envio: p.dataEnvio ? p.dataEnvio.toISOString().substring(0, 10) : null,
        apontador_recebimento_nome: p.apontadorRecebimentoNome,
        data_recebimento: p.dataRecebimento ? p.dataRecebimento.toISOString().substring(0, 10) : null,
        itens: p.itens.map(it => ({
          id: it.id,
          pedido_id: it.pedidoId,
          numero_item: it.numeroItem,
          material_id: it.materialId,
          qtd_pedida: it.qtdPedida,
          qtd_atendida: it.qtdAtendida,
          valor_unitario: Number(it.valorUnitario || 0),
          valor_total: Number(it.valorTotal || 0)
        }))
      };
    } catch (err: any) {
      if (err.message && (err.message.includes('Estoque') || err.message.includes('Quantidade') || err.message.includes('Pedido') || err.message.includes('status'))) {
        throw err;
      }

      const pIndex = this.inMemoryPedidos.findIndex(p => p.id === Number(pedidoId));
      if (pIndex === -1) throw new Error("Pedido não encontrado.");

      const pedidoMem = this.inMemoryPedidos[pIndex];
      if (['CANCELADO', 'ENVIADO', 'ATENDIDO_TOTAL'].includes(pedidoMem.status)) {
        throw new Error(`Pedido com status "${pedidoMem.status}" não pode ser atendido.`);
      }

      let todosAtendidos100 = true;
      let algumAtendido = false;

      for (const item of pedidoMem.itens) {
        const matAtualizacao = itensAtendidos.find(i => i.item_id === item.id || i.material_id === item.material_id);
        if (matAtualizacao) {
          const informed = Math.floor(Number(matAtualizacao.qtd_atendida));
          if (!Number.isFinite(informed) || informed < 0) throw new Error("Quantidade atendida deve ser não negativa.");
          if (informed > item.qtd_pedida) throw new Error("Quantidade atendida excede quantidade pedida.");

          const qAtendidaAntiga = Number(item.qtd_atendida) || 0;
          const diferenca = informed - qAtendidaAntiga;
          if (diferenca > 0) {
            const matObj = this.inMemoryMateriais.find(m => m.id === item.material_id);
            if (matObj && (matObj.qtd_estoque || 0) < diferenca) {
              throw new Error(`Estoque insuficiente para o material "${matObj.descricao}".`);
            }
            if (matObj) {
              matObj.qtd_estoque = Math.max(0, (matObj.qtd_estoque || 0) - diferenca);
            }
          } else if (diferenca < 0) {
            const matObj = this.inMemoryMateriais.find(m => m.id === item.material_id);
            if (matObj) {
              matObj.qtd_estoque = (matObj.qtd_estoque || 0) - diferenca;
            }
          }

          item.qtd_atendida = informed;
          if (informed > 0) algumAtendido = true;
          if (informed < item.qtd_pedida) todosAtendidos100 = false;
        }
      }

      if (todosAtendidos100 && algumAtendido) {
        pedidoMem.status = "ATENDIDO_TOTAL";
      } else if (algumAtendido) {
        pedidoMem.status = "ATENDIDO_PARCIAL";
      }

      pedidoMem.atualizado_em = new Date().toISOString();
      return pedidoMem;
    }
  }

  async confirmarEnvio(pedidoId: number, apontadorEnvioNome: string, dataEnvio: string): Promise<PedidoPBS> {
    try {
      const p = await prisma.pedidoPBS.update({
        where: { id: Number(pedidoId) },
        data: {
          status: 'ENVIADO',
          apontadorEnvioNome,
          dataEnvio: new Date(dataEnvio || Date.now())
        },
        include: { itens: true }
      });

      return {
        id: p.id,
        numero_pbs: p.numeroPbs || '',
        unidade_emitente_id: p.unidadeEmitenteId,
        data_pedido: p.dataPedido.toISOString().substring(0, 10),
        responsavel_nome: p.responsavelNome,
        responsavel_funcao: p.responsavelFuncao || undefined,
        responsavel_registro: p.responsavelRegistro || undefined,
        atividade_programa: p.atividadePrograma || undefined,
        elemento_despesa: p.elementoDespesa || undefined,
        observacoes: p.observacoes || undefined,
        status: p.status as any,
        valor_total_estimado: Number(p.valorTotalEstimado),
        apontador_envio_nome: p.apontadorEnvioNome,
        data_envio: p.dataEnvio ? p.dataEnvio.toISOString().substring(0, 10) : null,
        apontador_recebimento_nome: p.apontadorRecebimentoNome,
        data_recebimento: p.dataRecebimento ? p.dataRecebimento.toISOString().substring(0, 10) : null,
        itens: p.itens.map(it => ({
          id: it.id,
          pedido_id: it.pedidoId,
          numero_item: it.numeroItem,
          material_id: it.materialId,
          qtd_pedida: it.qtdPedida,
          qtd_atendida: it.qtdAtendida,
          valor_unitario: Number(it.valorUnitario || 0),
          valor_total: Number(it.valorTotal || 0)
        }))
      };
    } catch (err) {
      const pIndex = this.inMemoryPedidos.findIndex(p => p.id === Number(pedidoId));
      if (pIndex === -1) throw new Error("Pedido não encontrado.");

      this.inMemoryPedidos[pIndex].status = "ENVIADO";
      this.inMemoryPedidos[pIndex].apontador_envio_nome = apontadorEnvioNome;
      this.inMemoryPedidos[pIndex].data_envio = dataEnvio || new Date().toISOString().substring(0, 10);
      this.inMemoryPedidos[pIndex].atualizado_em = new Date().toISOString();

      return this.inMemoryPedidos[pIndex];
    }
  }

  async cancelarPedido(pedidoId: number): Promise<PedidoPBS> {
    try {
      const pedidoAtual = await prisma.pedidoPBS.findUnique({
        where: { id: Number(pedidoId) },
        include: { itens: true }
      });
      if (!pedidoAtual) throw new Error("Pedido não encontrado.");

      if (pedidoAtual.status === 'ATENDIDO_TOTAL' || pedidoAtual.status === 'ENVIADO') {
        throw new Error(`Não é permitido cancelar pedidos com status "${pedidoAtual.status}".`);
      }

      const p = await prisma.$transaction(async (tx) => {
        // Restaurar estoque se já houve atendimento parcial
        if (pedidoAtual.status === 'ATENDIDO_PARCIAL') {
          for (const item of pedidoAtual.itens) {
            if (item.qtdAtendida > 0) {
              await tx.material.update({
                where: { id: item.materialId },
                data: { qtdEstoque: { increment: item.qtdAtendida } }
              });
            }
          }
        }

        return await tx.pedidoPBS.update({
          where: { id: Number(pedidoId) },
          data: { status: 'CANCELADO' },
          include: { itens: true }
        });
      });

      return {
        id: p.id,
        numero_pbs: p.numeroPbs || '',
        unidade_emitente_id: p.unidadeEmitenteId,
        data_pedido: p.dataPedido.toISOString().substring(0, 10),
        responsavel_nome: p.responsavelNome,
        responsavel_funcao: p.responsavelFuncao || undefined,
        responsavel_registro: p.responsavelRegistro || undefined,
        atividade_programa: p.atividadePrograma || undefined,
        elemento_despesa: p.elementoDespesa || undefined,
        observacoes: p.observacoes || undefined,
        status: p.status as any,
        valor_total_estimado: Number(p.valorTotalEstimado),
        apontador_envio_nome: p.apontadorEnvioNome,
        data_envio: p.dataEnvio ? p.dataEnvio.toISOString().substring(0, 10) : null,
        apontador_recebimento_nome: p.apontadorRecebimentoNome,
        data_recebimento: p.dataRecebimento ? p.dataRecebimento.toISOString().substring(0, 10) : null,
        itens: p.itens.map(it => ({
          id: it.id,
          pedido_id: it.pedidoId,
          numero_item: it.numeroItem,
          material_id: it.materialId,
          qtd_pedida: it.qtdPedida,
          qtd_atendida: it.qtdAtendida,
          valor_unitario: Number(it.valorUnitario || 0),
          valor_total: Number(it.valorTotal || 0)
        }))
      };
    } catch (err: any) {
      if (err.message && (err.message.includes('Não é permitido') || err.message.includes('Pedido'))) {
        throw err;
      }
      const pIndex = this.inMemoryPedidos.findIndex(p => p.id === Number(pedidoId));
      if (pIndex === -1) throw new Error("Pedido não encontrado.");

      const pedidoMem = this.inMemoryPedidos[pIndex];
      if (pedidoMem.status === 'ATENDIDO_TOTAL' || pedidoMem.status === 'ENVIADO') {
        throw new Error(`Não é permitido cancelar pedidos com status "${pedidoMem.status}".`);
      }

      if (pedidoMem.status === 'ATENDIDO_PARCIAL') {
        pedidoMem.itens.forEach(it => {
          if (it.qtd_atendida > 0) {
            const mat = this.inMemoryMateriais.find(m => m.id === it.material_id);
            if (mat) mat.qtd_estoque = (mat.qtd_estoque || 0) + it.qtd_atendida;
          }
        });
      }

      pedidoMem.status = "CANCELADO";
      pedidoMem.atualizado_em = new Date().toISOString();

      return pedidoMem;
    }
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

  // Honorários & Folha dos Odontólogos
  async getHonorarios(): Promise<HonorarioOdontologo[]> {
    try {
      const list = await (prisma as any).honorarioOdontologo.findMany();
      if (list) {
        return list.map((h: any) => ({
          id: h.id,
          unidade_id: h.unidadeId,
          nome_dentista: h.nomeDentista,
          cro: h.cro,
          tipo_contrato: h.tipoContrato,
          mes_referencia: h.mesReferencia,
          valor_fixo: Number(h.valorFixo),
          valor_comissao: Number(h.valorComissao),
          valor_total: Number(h.valorTotal),
          observacoes: h.observacoes || undefined,
          criado_em: h.criadoEm?.toISOString()
        }));
      }
    } catch (err) {}
    return this.inMemoryHonorarios;
  }

  async addHonorario(dados: Omit<HonorarioOdontologo, 'id'>): Promise<HonorarioOdontologo> {
    const vTotal = Number(dados.valor_fixo || 0) + Number(dados.valor_comissao || 0);
    try {
      const h = await (prisma as any).honorarioOdontologo.create({
        data: {
          unidadeId: Number(dados.unidade_id),
          nomeDentista: dados.nome_dentista,
          cro: dados.cro,
          tipoContrato: dados.tipo_contrato,
          mesReferencia: dados.mes_referencia,
          valorFixo: dados.valor_fixo,
          valorComissao: dados.valor_comissao,
          valorTotal: vTotal,
          observacoes: dados.observacoes
        }
      });
      const novo = {
        id: h.id,
        unidade_id: h.unidadeId,
        nome_dentista: h.nomeDentista,
        cro: h.cro,
        tipo_contrato: h.tipoContrato as any,
        mes_referencia: h.mesReferencia,
        valor_fixo: Number(h.valorFixo),
        valor_comissao: Number(h.valorComissao),
        valor_total: Number(h.valorTotal),
        observacoes: h.observacoes || undefined
      };
      this.inMemoryHonorarios.push(novo);
      return novo;
    } catch (err) {
      const novo: HonorarioOdontologo = {
        id: this.inMemoryHonorarios.length ? Math.max(...this.inMemoryHonorarios.map(h => h.id)) + 1 : 1,
        ...dados,
        valor_total: vTotal
      };
      this.inMemoryHonorarios.push(novo);
      return novo;
    }
  }

  async updateHonorario(id: number, dados: Partial<HonorarioOdontologo>): Promise<HonorarioOdontologo> {
    const hIndex = this.inMemoryHonorarios.findIndex(h => h.id === Number(id));
    const current = hIndex !== -1 ? this.inMemoryHonorarios[hIndex] : null;

    const vFixo = dados.valor_fixo !== undefined ? Number(dados.valor_fixo) : (current ? current.valor_fixo : 0);
    const vComissao = dados.valor_comissao !== undefined ? Number(dados.valor_comissao) : (current ? current.valor_comissao : 0);
    const vTotal = vFixo + vComissao;

    try {
      const h = await (prisma as any).honorarioOdontologo.update({
        where: { id: Number(id) },
        data: {
          ...(dados.unidade_id !== undefined ? { unidadeId: Number(dados.unidade_id) } : {}),
          ...(dados.nome_dentista !== undefined ? { nomeDentista: dados.nome_dentista } : {}),
          ...(dados.cro !== undefined ? { cro: dados.cro } : {}),
          ...(dados.tipo_contrato !== undefined ? { tipoContrato: dados.tipo_contrato } : {}),
          ...(dados.mes_referencia !== undefined ? { mesReferencia: dados.mes_referencia } : {}),
          ...(dados.valor_fixo !== undefined ? { valorFixo: vFixo } : {}),
          ...(dados.valor_comissao !== undefined ? { valorComissao: vComissao } : {}),
          valorTotal: vTotal,
          ...(dados.observacoes !== undefined ? { observacoes: dados.observacoes } : {})
        }
      });
      const updated: HonorarioOdontologo = {
        id: h.id,
        unidade_id: h.unidadeId,
        nome_dentista: h.nomeDentista,
        cro: h.cro,
        tipo_contrato: h.tipoContrato as any,
        mes_referencia: h.mesReferencia,
        valor_fixo: Number(h.valorFixo),
        valor_comissao: Number(h.valorComissao),
        valor_total: Number(h.valorTotal),
        observacoes: h.observacoes || undefined
      };
      if (hIndex !== -1) {
        this.inMemoryHonorarios[hIndex] = updated;
      }
      return updated;
    } catch (err) {
      if (hIndex === -1) throw new Error("Honorário não encontrado.");
      const updated: HonorarioOdontologo = {
        ...this.inMemoryHonorarios[hIndex],
        ...dados,
        valor_fixo: vFixo,
        valor_comissao: vComissao,
        valor_total: vTotal
      };
      this.inMemoryHonorarios[hIndex] = updated;
      return updated;
    }
  }

  async deleteHonorario(id: number): Promise<void> {
    try {
      await (prisma as any).honorarioOdontologo.delete({
        where: { id: Number(id) }
      });
    } catch (err) {}
    this.inMemoryHonorarios = this.inMemoryHonorarios.filter(h => h.id !== Number(id));
  }

  // Equipamentos
  async getEquipamentos(): Promise<Equipamento[]> {
    try {
      const list = await (prisma as any).equipamento.findMany();
      if (list) {
        return list.map((e: any) => ({
          id: e.id,
          unidade_id: e.unidadeId,
          nome: e.nome,
          numero_serie: e.numeroSerie,
          categoria: e.categoria,
          data_ultima_preventiva: e.dataUltimaPreventiva ? e.dataUltimaPreventiva.toISOString().substring(0, 10) : null
        }));
      }
    } catch (err) {}
    return this.inMemoryEquipamentos;
  }

  async addEquipamento(dados: Omit<Equipamento, 'id'>): Promise<Equipamento> {
    try {
      const e = await (prisma as any).equipamento.create({
        data: {
          unidadeId: Number(dados.unidade_id),
          nome: dados.nome,
          numeroSerie: dados.numero_serie,
          categoria: dados.categoria,
          dataUltimaPreventiva: dados.data_ultima_preventiva ? new Date(dados.data_ultima_preventiva) : null
        }
      });
      const novo = {
        id: e.id,
        unidade_id: e.unidadeId,
        nome: e.nome,
        numero_serie: e.numeroSerie,
        categoria: e.categoria,
        data_ultima_preventiva: e.dataUltimaPreventiva ? e.dataUltimaPreventiva.toISOString().substring(0, 10) : null
      };
      this.inMemoryEquipamentos.push(novo);
      return novo;
    } catch (err) {
      const novo: Equipamento = {
        id: this.inMemoryEquipamentos.length ? Math.max(...this.inMemoryEquipamentos.map(e => e.id)) + 1 : 1,
        ...dados
      };
      this.inMemoryEquipamentos.push(novo);
      return novo;
    }
  }

  async updateEquipamento(id: number, dados: Partial<Equipamento>): Promise<Equipamento> {
    try {
      const updateData: any = {};
      if (dados.unidade_id !== undefined) updateData.unidadeId = Number(dados.unidade_id);
      if (dados.nome !== undefined) updateData.nome = dados.nome;
      if (dados.numero_serie !== undefined) updateData.numeroSerie = dados.numero_serie;
      if (dados.categoria !== undefined) updateData.categoria = dados.categoria;
      if (dados.data_ultima_preventiva !== undefined) {
        updateData.dataUltimaPreventiva = dados.data_ultima_preventiva ? new Date(dados.data_ultima_preventiva) : null;
      }

      const e = await (prisma as any).equipamento.update({
        where: { id: Number(id) },
        data: updateData
      });
      const updated: Equipamento = {
        id: e.id,
        unidade_id: e.unidadeId,
        nome: e.nome,
        numero_serie: e.numeroSerie,
        categoria: e.categoria,
        data_ultima_preventiva: e.dataUltimaPreventiva ? e.dataUltimaPreventiva.toISOString().substring(0, 10) : null
      };
      const idx = this.inMemoryEquipamentos.findIndex(item => item.id === id);
      if (idx !== -1) {
        this.inMemoryEquipamentos[idx] = updated;
      }
      return updated;
    } catch (err) {
      const idx = this.inMemoryEquipamentos.findIndex(item => item.id === id);
      if (idx !== -1) {
        this.inMemoryEquipamentos[idx] = {
          ...this.inMemoryEquipamentos[idx],
          ...dados
        };
        return this.inMemoryEquipamentos[idx];
      }
      throw new Error("Equipamento não encontrado.");
    }
  }

  // Chamados de Manutenção & Regra de Manutenção Preventiva Automática
  async getChamados(): Promise<ChamadoManutencao[]> {
    try {
      const list = await (prisma as any).chamadoManutencao.findMany();
      if (list) {
        return list.map((c: any) => ({
          id: c.id,
          unidade_id: c.unidadeId,
          equipamento_id: c.equipamentoId,
          tipo: c.tipo as any,
          descricao_defeito: c.descricaoDefeito,
          custo_reparo: Number(c.custoReparo),
          status: c.status as any,
          data_abertura: c.dataAbertura.toISOString().substring(0, 10),
          data_conclusao: c.dataConclusao ? c.dataConclusao.toISOString().substring(0, 10) : null,
          observacoes: c.observacoes || undefined
        }));
      }
    } catch (err) {}
    return this.inMemoryChamados;
  }

  async addChamado(dados: Omit<ChamadoManutencao, 'id'>): Promise<ChamadoManutencao> {
    const custoReparo = Math.max(0, Number(dados.custo_reparo || 0));

    // Validar se o equipamento pertence à unidade indicada
    if (dados.equipamento_id) {
      const eq = await (prisma as any).equipamento.findUnique({ where: { id: Number(dados.equipamento_id) } }).catch(() => null)
        || this.inMemoryEquipamentos.find(e => e.id === Number(dados.equipamento_id));
      if (eq && Number(eq.unidadeId || (eq as any).unidade_id) !== Number(dados.unidade_id)) {
        throw new Error("O equipamento informado não pertence à unidade indicada.");
      }
    }

    try {
      const c = await (prisma as any).chamadoManutencao.create({
        data: {
          unidadeId: Number(dados.unidade_id),
          equipamentoId: Number(dados.equipamento_id),
          tipo: dados.tipo || 'CORRETIVA',
          descricaoDefeito: dados.descricao_defeito,
          custoReparo,
          status: 'ABERTO', // Sempre força status inicial como ABERTO
          dataAbertura: dados.data_abertura ? new Date(dados.data_abertura) : new Date(),
          observacoes: dados.observacoes
        }
      });
      const novo = {
        id: c.id,
        unidade_id: c.unidadeId,
        equipamento_id: c.equipamentoId,
        tipo: c.tipo as any,
        descricao_defeito: c.descricaoDefeito,
        custo_reparo: Number(c.custoReparo),
        status: c.status as any,
        data_abertura: c.dataAbertura.toISOString().substring(0, 10),
        observacoes: c.observacoes || undefined
      };
      this.inMemoryChamados.push(novo);
      return novo;
    } catch (err: any) {
      if (err.message?.includes('não pertence')) throw err;
      const novo: ChamadoManutencao = {
        id: this.inMemoryChamados.length ? Math.max(...this.inMemoryChamados.map(c => c.id)) + 1 : 1,
        ...dados,
        custo_reparo: custoReparo,
        status: 'ABERTO'
      };
      this.inMemoryChamados.push(novo);
      return novo;
    }
  }

  async updateStatusChamado(chamadoId: number, status: StatusChamado, custoReparo?: number): Promise<ChamadoManutencao> {
    if (custoReparo !== undefined && custoReparo < 0) {
      throw new Error("O custo de reparo não pode ser negativo.");
    }

    // Buscar chamado para verificar máquina de estados
    let chamadoAtual = await (prisma as any).chamadoManutencao.findUnique({ where: { id: Number(chamadoId) } }).catch(() => null);
    if (!chamadoAtual) {
      chamadoAtual = this.inMemoryChamados.find(c => c.id === Number(chamadoId));
    }
    if (!chamadoAtual) throw new Error("Chamado não encontrado.");

    const statusAtual = chamadoAtual.status;
    if ((statusAtual === 'ABERTO' || statusAtual === 'RECUSADO') && (status === 'EM_ANDAMENTO' || status === 'CONCLUIDO')) {
      throw new Error(`Chamados com status "${statusAtual}" requerem aprovação da gestão antes da execução.`);
    }

    const dataConc = status === 'CONCLUIDO' ? new Date().toISOString().substring(0, 10) : null;
    try {
      const c = await (prisma as any).chamadoManutencao.update({
        where: { id: Number(chamadoId) },
        data: {
          status,
          ...(custoReparo !== undefined && { custoReparo: Math.max(0, custoReparo) }),
          ...(status === 'CONCLUIDO' && { dataConclusao: new Date() })
        }
      });
      return {
        id: c.id,
        unidade_id: c.unidadeId,
        equipamento_id: c.equipamentoId,
        tipo: c.tipo as any,
        descricao_defeito: c.descricaoDefeito,
        custo_reparo: Number(c.custoReparo),
        status: c.status as any,
        data_abertura: c.dataAbertura.toISOString().substring(0, 10),
        data_conclusao: c.dataConclusao ? c.dataConclusao.toISOString().substring(0, 10) : null
      };
    } catch (err: any) {
      if (err.message?.includes('requerem aprovação') || err.message?.includes('não encontrado')) throw err;
      const index = this.inMemoryChamados.findIndex(c => c.id === Number(chamadoId));
      if (index === -1) throw new Error("Chamado não encontrado.");
      this.inMemoryChamados[index].status = status;
      if (custoReparo !== undefined) this.inMemoryChamados[index].custo_reparo = Math.max(0, custoReparo);
      if (status === 'CONCLUIDO') this.inMemoryChamados[index].data_conclusao = dataConc;
      return this.inMemoryChamados[index];
    }
  }

  async aprovarChamadoManutencao(chamadoId: number, aprovar: boolean = true): Promise<ChamadoManutencao> {
    const novoStatus: StatusChamado = aprovar ? 'APROVADO_ADM' : 'RECUSADO';
    try {
      const c = await (prisma as any).chamadoManutencao.update({
        where: { id: Number(chamadoId) },
        data: {
          status: novoStatus
        }
      });
      const index = this.inMemoryChamados.findIndex(ch => ch.id === Number(chamadoId));
      if (index !== -1) {
        this.inMemoryChamados[index].status = novoStatus;
        this.inMemoryChamados[index].aprovado_adm = aprovar;
        this.inMemoryChamados[index].data_aprovacao = new Date().toISOString().substring(0, 10);
      }
      return {
        id: c.id,
        unidade_id: c.unidadeId,
        equipamento_id: c.equipamentoId,
        tipo: c.tipo as any,
        descricao_defeito: c.descricaoDefeito,
        custo_reparo: Number(c.custoReparo),
        status: c.status as any,
        data_abertura: c.dataAbertura.toISOString().substring(0, 10),
        data_conclusao: c.dataConclusao ? c.dataConclusao.toISOString().substring(0, 10) : null
      };
    } catch (err) {
      const index = this.inMemoryChamados.findIndex(c => c.id === Number(chamadoId));
      if (index !== -1) {
        this.inMemoryChamados[index].status = novoStatus;
        this.inMemoryChamados[index].aprovado_adm = aprovar;
        this.inMemoryChamados[index].data_aprovacao = new Date().toISOString().substring(0, 10);
        return this.inMemoryChamados[index];
      }
      throw new Error("Chamado não encontrado.");
    }
  }

  // Regra Automatizada de Manutenção Preventiva
  async verificarAlertasPreventiva(): Promise<{ equipamento: Equipamento; unidade: UnidadeSaude; mensagem: string }[]> {
    try {
      const equipamentos = await (prisma as any).equipamento.findMany();
      const chamadosAbertos = await (prisma as any).chamadoManutencao.findMany({
        where: { status: { in: ['ABERTO', 'EM_ANDAMENTO', 'APROVADO_ADM'] } }
      });
      const unidades = await prisma.unidadeSaude.findMany();

      const alertas: { equipamento: Equipamento; unidade: UnidadeSaude; mensagem: string }[] = [];
      equipamentos.forEach((eq: any) => {
        const temChamadoPendente = chamadosAbertos.some((c: any) => c.equipamentoId === eq.id);
        if (!temChamadoPendente) {
          const uni = unidades.find(u => u.id === eq.unidadeId);
          const nomeUni = uni ? uni.nome : `Unidade #${eq.unidadeId}`;
          alertas.push({
            equipamento: {
              id: eq.id,
              unidade_id: eq.unidadeId,
              nome: eq.nome,
              numero_serie: eq.numeroSerie,
              categoria: eq.categoria,
              data_ultima_preventiva: eq.dataUltimaPreventiva ? eq.dataUltimaPreventiva.toISOString().substring(0, 10) : undefined
            },
            unidade: uni ? { id: uni.id, nome: uni.nome, tipo: uni.tipo } : { id: eq.unidadeId, nome: nomeUni, tipo: 'USF' },
            mensagem: `O equipamento ${eq.nome} (${eq.numeroSerie}) na ${nomeUni} não possui chamados de reparo/defeito pendentes. Recomenda-se agendar a Manutenção Preventiva periódica para garantir o bom funcionamento.`
          });
        }
      });
      return alertas;
    } catch (err) {
      const alertas: { equipamento: Equipamento; unidade: UnidadeSaude; mensagem: string }[] = [];
      const chamadosAbertos = this.inMemoryChamados.filter(c => c.status === 'ABERTO' || c.status === 'EM_ANDAMENTO' || c.status === 'APROVADO_ADM');

      this.inMemoryEquipamentos.forEach(eq => {
        const temChamadoPendente = chamadosAbertos.some(c => c.equipamento_id === eq.id);
        if (!temChamadoPendente) {
          const uni = this.inMemoryUnidades.find(u => u.id === eq.unidade_id);
          const nomeUni = uni ? uni.nome : `Unidade #${eq.unidade_id}`;
          alertas.push({
            equipamento: eq,
            unidade: uni || { id: eq.unidade_id, nome: nomeUni, tipo: 'USF' },
            mensagem: `O equipamento ${eq.nome} (${eq.numero_serie}) na ${nomeUni} não possui chamados de reparo/defeito pendentes. Recomenda-se agendar a Manutenção Preventiva periódica para garantir o bom funcionamento.`
          });
        }
      });

      return alertas;
    }
  }

  // Consolidação Financeira Multiclínica por Unidade de Saúde (com consulta prioritária ao MySQL)
  async getConsolidacaoFinanceiraMulticlinica(): Promise<UnidadeConsolidacaoFinanceira[]> {
    try {
      const unidades = await prisma.unidadeSaude.findMany();
      const pedidos = await prisma.pedidoPBS.findMany({
        where: { status: { not: 'CANCELADO' } },
        include: { itens: true }
      });
      const honorarios = await (prisma as any).honorarioOdontologo.findMany();
      const chamados = await (prisma as any).chamadoManutencao.findMany({
        where: { status: { in: ['APROVADO_ADM', 'EM_ANDAMENTO', 'CONCLUIDO'] } }
      });

      return unidades.map(u => {
        const pedidosUnidade = pedidos.filter(p => p.unidadeEmitenteId === u.id);
        let custoInsumos = 0;
        pedidosUnidade.forEach(p => {
          (p.itens || []).forEach(it => {
            custoInsumos += (Number(it.qtdAtendida || 0) * Number(it.valorUnitario || 0));
          });
        });

        const honorariosUnidade = honorarios.filter((h: any) => h.unidadeId === u.id);
        const custoHonorarios = honorariosUnidade.reduce((acc: number, h: any) => acc + Number(h.valorTotal || 0), 0);

        const chamadosUnidade = chamados.filter((c: any) => c.unidadeId === u.id);
        const custoManutencao = chamadosUnidade.reduce((acc: number, c: any) => acc + Math.max(0, Number(c.custoReparo || 0)), 0);

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
    } catch (err) {
      return this.inMemoryUnidades.map(u => {
        const pedidosUnidade = this.inMemoryPedidos.filter(p => p.unidade_emitente_id === u.id && p.status !== 'CANCELADO');
        let custoInsumos = 0;
        pedidosUnidade.forEach(p => {
          (p.itens || []).forEach(it => {
            custoInsumos += (Number(it.qtd_atendida || 0) * Number(it.valor_unitario || 0));
          });
        });

        const honorariosUnidade = this.inMemoryHonorarios.filter(h => h.unidade_id === u.id);
        const custoHonorarios = honorariosUnidade.reduce((acc, h) => acc + Number(h.valor_total || 0), 0);

        const chamadosUnidade = this.inMemoryChamados.filter(c => c.unidade_id === u.id && ['APROVADO_ADM', 'EM_ANDAMENTO', 'CONCLUIDO'].includes(c.status));
        const custoManutencao = chamadosUnidade.reduce((acc, c) => acc + Math.max(0, Number(c.custo_reparo || 0)), 0);

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
  }

  // Entradas e Aportes Financeiros
  async getEntradas(): Promise<EntradaRecurso[]> {
    try {
      const list = await (prisma as any).entradaRecurso.findMany({
        orderBy: { id: 'desc' }
      });
      if (list) {
        return list.map((e: any) => ({
          id: e.id,
          unidade_id: e.unidadeId,
          natureza: e.natureza,
          tipo_recorrencia: e.tipoRecorrencia,
          descricao: e.descricao,
          valor: Number(e.valor),
          data_credito: e.dataCredito ? e.dataCredito.toISOString().substring(0, 10) : '',
          mes_referencia: e.mesReferencia,
          observacoes: e.observacoes || undefined
        }));
      }
    } catch (err) {}
    return this.inMemoryEntradas;
  }

  async addEntrada(dados: Omit<EntradaRecurso, 'id'>): Promise<EntradaRecurso> {
    try {
      const e = await (prisma as any).entradaRecurso.create({
        data: {
          unidadeId: dados.unidade_id || null,
          natureza: dados.natureza,
          tipoRecorrencia: dados.tipo_recorrencia,
          descricao: dados.descricao,
          valor: Number(dados.valor),
          dataCredito: new Date(dados.data_credito || Date.now()),
          mesReferencia: dados.mes_referencia,
          observacoes: dados.observacoes || null
        }
      });
      const nova: EntradaRecurso = {
        id: e.id,
        unidade_id: e.unidadeId,
        natureza: e.natureza,
        tipo_recorrencia: e.tipoRecorrencia,
        descricao: e.descricao,
        valor: Number(e.valor),
        data_credito: e.dataCredito.toISOString().substring(0, 10),
        mes_referencia: e.mesReferencia,
        observacoes: e.observacoes || undefined
      };
      this.inMemoryEntradas.unshift(nova);
      return nova;
    } catch (err) {
      const nextId = this.inMemoryEntradas.length ? Math.max(...this.inMemoryEntradas.map(e => e.id)) + 1 : 1;
      const nova: EntradaRecurso = {
        id: nextId,
        ...dados,
        valor: Number(dados.valor) || 0
      };
      this.inMemoryEntradas.unshift(nova);
      return nova;
    }
  }

  async deleteEntrada(id: number): Promise<void> {
    try {
      await (prisma as any).entradaRecurso.delete({
        where: { id: Number(id) }
      });
    } catch (err) {}
    this.inMemoryEntradas = this.inMemoryEntradas.filter(e => e.id !== Number(id));
  }

  async exportarSQL(): Promise<string> {
    const escapeSql = (val: any): string => {
      if (val === null || val === undefined) return 'NULL';
      return "'" + String(val).replace(/\\/g, '\\\\').replace(/'/g, "''") + "'";
    };

    const unidades = await this.getUnidades();
    const materiais = await this.getMateriais();
    const pedidos = await this.getPedidos();

    let sql = `-- =======================================================\n`;
    sql += `-- SCRIPT SQL DUMP DE DADOS DA BASE ALMOXARIFADO DE SAÚDE\n`;
    sql += `-- Gerado em: ${new Date().toLocaleString('pt-BR')}\n`;
    sql += `-- =======================================================\n\n`;

    sql += `USE almoxarifado_saude_db;\n\n`;

    sql += `-- 1. Unidades de Saúde\n`;
    unidades.forEach(u => {
      sql += `INSERT INTO unidades_saude (id, nome, tipo) VALUES (${u.id}, ${escapeSql(u.nome)}, ${escapeSql(u.tipo)}) ON DUPLICATE KEY UPDATE nome=VALUES(nome);\n`;
    });

    sql += `\n-- 2. Materiais do Catálogo\n`;
    materiais.forEach(m => {
      sql += `INSERT INTO materiais (id, descricao, unidade_medida, qtd_estoque) VALUES (${m.id}, ${escapeSql(m.descricao)}, ${escapeSql(m.unidade_medida)}, ${m.qtd_estoque || 0}) ON DUPLICATE KEY UPDATE descricao=VALUES(descricao), qtd_estoque=VALUES(qtd_estoque);\n`;
    });

    sql += `\n-- 3. Pedidos PBS\n`;
    pedidos.forEach(p => {
      const apEnv = escapeSql(p.apontador_envio_nome);
      const dtEnv = escapeSql(p.data_envio);
      const apRec = escapeSql(p.apontador_recebimento_nome);
      const dtRec = escapeSql(p.data_recebimento);
      const obs = escapeSql(p.observacoes);

      sql += `INSERT INTO pedidos_pbs (\n`;
      sql += `    id, numero_pbs, unidade_emitente_id, data_pedido, responsavel_nome, responsavel_funcao, responsavel_registro,\n`;
      sql += `    atividade_programa, elemento_despesa, observacoes, status, valor_total_estimado,\n`;
      sql += `    apontador_envio_nome, data_envio, apontador_recebimento_nome, data_recebimento\n`;
      sql += `) VALUES (\n`;
      sql += `    ${p.id}, ${escapeSql(p.numero_pbs)}, ${p.unidade_emitente_id}, ${escapeSql(p.data_pedido)}, ${escapeSql(p.responsavel_nome)}, ${escapeSql(p.responsavel_funcao || '')}, ${escapeSql(p.responsavel_registro || '')},\n`;
      sql += `    ${escapeSql(p.atividade_programa || '')}, ${escapeSql(p.elemento_despesa || '')}, ${obs}, ${escapeSql(p.status)}, ${Number(p.valor_total_estimado || 0).toFixed(2)},\n`;
      sql += `    ${apEnv}, ${dtEnv}, ${apRec}, ${dtRec}\n`;
      sql += `) ON DUPLICATE KEY UPDATE status=VALUES(status), apontador_recebimento_nome=VALUES(apontador_recebimento_nome), data_recebimento=VALUES(data_recebimento), apontador_envio_nome=VALUES(apontador_envio_nome), data_envio=VALUES(data_envio);\n`;

      sql += `-- Itens do Pedido ${p.numero_pbs}\n`;
      (p.itens || []).forEach(it => {
        sql += `INSERT INTO itens_pedido_pbs (id, pedido_id, numero_item, material_id, qtd_pedida, qtd_atendida, valor_unitario, valor_total) VALUES (${it.id}, ${p.id}, ${it.numero_item}, ${it.material_id}, ${it.qtd_pedida}, ${it.qtd_atendida}, ${Number(it.valor_unitario || 0).toFixed(2)}, ${Number(it.valor_total || 0).toFixed(2)});\n`;
      });
      sql += `\n`;
    });

    return sql;
  }
}

export const dataStore = new DataStore();
