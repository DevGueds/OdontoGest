import { Prisma, type Material, type UnidadeSaude, type HonorarioOdontologo, type Equipamento, type ChamadoManutencao, type EntradaRecurso } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { AppError } from '../errors.js';
import type { Input } from '../validation.js';
import { today } from '../../shared/dates.js';

const day = (d: Date | null) => d?.toISOString().slice(0, 10) ?? null;
export const mapUnidade = (u: UnidadeSaude) => ({ id: u.id, nome: u.nome, tipo: u.tipo, orcamento_custeio: Number(u.orcamentoCusteio), orcamento_investimento: Number(u.orcamentoInvestimento), criado_em: u.criadoEm.toISOString() });
export const mapMaterial = (m: Material) => ({ id: m.id, descricao: m.descricao, unidade_medida: m.unidadeMedida, fornecedor: m.fornecedor, valor_estimado: Number(m.valorEstimado), qtd_estoque: m.qtdEstoque, limite_max_pedido: m.limiteMaxPedido, natureza: m.natureza });
export const mapPedido = (p: Prisma.PedidoPBSGetPayload<{ include: { itens: true } }>) => ({
  id: p.id, numero_pbs: p.numeroPbs || '', unidade_emitente_id: p.unidadeEmitenteId, data_pedido: day(p.dataPedido),
  responsavel_nome: p.responsavelNome, responsavel_funcao: p.responsavelFuncao, responsavel_registro: p.responsavelRegistro,
  atividade_programa: p.atividadePrograma, elemento_despesa: p.elementoDespesa, observacoes: p.observacoes,
  status: p.status, valor_total_estimado: Number(p.valorTotalEstimado), apontador_envio_nome: p.apontadorEnvioNome,
  data_envio: day(p.dataEnvio), apontador_recebimento_nome: p.apontadorRecebimentoNome, data_recebimento: day(p.dataRecebimento),
  itens: p.itens.map(i => ({ id: i.id, pedido_id: i.pedidoId, numero_item: i.numeroItem, material_id: i.materialId, qtd_pedida: i.qtdPedida, qtd_atendida: i.qtdAtendida, valor_unitario: Number(i.valorUnitario), valor_total: Number(i.valorTotal), natureza: i.natureza })),
});
export const mapHonorario = (h: HonorarioOdontologo) => ({ id: h.id, unidade_id: h.unidadeId, nome_dentista: h.nomeDentista, cro: h.cro, tipo_contrato: h.tipoContrato, mes_referencia: h.mesReferencia, valor_fixo: Number(h.valorFixo), valor_comissao: Number(h.valorComissao), valor_total: Number(h.valorTotal), observacoes: h.observacoes });
export const mapEquipamento = (e: Equipamento) => ({ id: e.id, unidade_id: e.unidadeId, nome: e.nome, numero_serie: e.numeroSerie, categoria: e.categoria, data_ultima_preventiva: day(e.dataUltimaPreventiva) });
export const mapChamado = (c: ChamadoManutencao) => ({ id: c.id, unidade_id: c.unidadeId, equipamento_id: c.equipamentoId, tipo: c.tipo, descricao_defeito: c.descricaoDefeito, custo_reparo: Number(c.custoReparo), status: c.status, data_abertura: day(c.dataAbertura), data_conclusao: day(c.dataConclusao), observacoes: c.observacoes });
export const mapEntrada = (e: EntradaRecurso) => ({ id: e.id, unidade_id: e.unidadeId, natureza: e.natureza, tipo_recorrencia: e.tipoRecorrencia, descricao: e.descricao, valor: Number(e.valor), data_credito: day(e.dataCredito), mes_referencia: e.mesReferencia, observacoes: e.observacoes });

export type Page = { after?: number; limit: number };
const paging = (p: Page) => ({ take: p.limit + 1, orderBy: { id: 'asc' as const }, ...(p.after ? { cursor: { id: p.after }, skip: 1 } : {}) });
const money = (value: Prisma.Decimal | number) => new Prisma.Decimal(value);
const ensureTotal = (value: Prisma.Decimal) => { if (value.gt('99999999.99')) throw new AppError(400, 'Valor total excede o limite permitido.'); return value; };
async function lockPedido(tx: Prisma.TransactionClient, id: number) {
  await tx.$queryRaw`SELECT id FROM pedidos_pbs WHERE id = ${id} FOR UPDATE`;
  return tx.pedidoPBS.findUniqueOrThrow({ where: { id }, include: { itens: { orderBy: { materialId: 'asc' } } } });
}
function expectStatus(actual: string, allowed: string[]) { if (!allowed.includes(actual)) throw new AppError(409, 'Operação incompatível com o status atual. Atualize os dados.'); }

export class DataStore {
  getUnidades = async (p: Page, unidadeId?: number) => (await prisma.unidadeSaude.findMany({ ...paging(p), where: { id: unidadeId } })).map(mapUnidade);
  addUnidade = async (data: Input<'unidade'>) => mapUnidade(await prisma.unidadeSaude.create({ data }));
  updateUnidade = async (id: number, data: Input<'unidade'>) => mapUnidade(await prisma.unidadeSaude.update({ where: { id }, data }));
  async deleteUnidade(id: number) {
    await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM unidades_saude WHERE id = ${id} FOR UPDATE`;
      if (await tx.usuario.count({ where: { unidadeId: id } })) throw new AppError(409, 'Unidade vinculada a usuários; transfira os vínculos antes de excluir.');
      await tx.unidadeSaude.delete({ where: { id } });
    });
  }
  getMateriais = async (p: Page) => (await prisma.material.findMany(paging(p))).map(mapMaterial);
  async addMaterial(d: Input<'material'>) {
    return mapMaterial(await prisma.material.create({ data: { descricao: d.descricao, unidadeMedida: d.unidade_medida, valorEstimado: d.valor_estimado, qtdEstoque: d.qtd_estoque, limiteMaxPedido: d.limite_max_pedido, fornecedor: d.fornecedor, natureza: d.natureza } }));
  }
  async updateMaterial(id: number, d: Partial<Input<'material'>>) {
    if (d.qtd_estoque !== undefined) throw new AppError(400, 'Use o ajuste de estoque para alterar quantidades.');
    return mapMaterial(await prisma.material.update({ where: { id }, data: { descricao: d.descricao, unidadeMedida: d.unidade_medida, valorEstimado: d.valor_estimado, limiteMaxPedido: d.limite_max_pedido, fornecedor: d.fornecedor, natureza: d.natureza } }));
  }
  async atualizarEstoqueMaterial(id: number, d: Input<'estoque'>) {
    return prisma.$transaction(async tx => {
      const changed = await tx.material.updateMany({ where: { id, qtdEstoque: d.estoque_anterior }, data: { qtdEstoque: d.qtd_estoque } });
      if (!changed.count) throw new AppError(409, 'O estoque foi alterado por outra operação. Atualize e tente novamente.');
      return mapMaterial(await tx.material.findUniqueOrThrow({ where: { id } }));
    });
  }
  deleteMaterial = async (id: number) => { await prisma.material.delete({ where: { id } }); };
  getPedidos = async (p: Page, unidadeId?: number) => (await prisma.pedidoPBS.findMany({ ...paging(p), where: { unidadeEmitenteId: unidadeId }, include: { itens: { orderBy: { numeroItem: 'asc' } } } })).map(mapPedido);
  async salvarPedido(d: Input<'pedido'>) {
    const ids = d.itens.map(i => i.material_id);
    if (new Set(ids).size !== ids.length) throw new AppError(400, 'Não repita o mesmo material no pedido.');
    return prisma.$transaction(async tx => {
      const materials = new Map((await tx.material.findMany({ where: { id: { in: ids } } })).map(m => [m.id, m]));
      const itens = d.itens.map((i, index) => {
        const m = materials.get(i.material_id);
        if (!m) throw new AppError(400, 'Material inexistente. Atualize o catálogo.');
        if (m.limiteMaxPedido && i.qtd_pedida > m.limiteMaxPedido) throw new AppError(400, `Quantidade excede o limite do material #${m.id}.`);
        return { numeroItem: index + 1, materialId: m.id, qtdPedida: i.qtd_pedida, valorUnitario: m.valorEstimado, valorTotal: ensureTotal(money(m.valorEstimado).mul(i.qtd_pedida)), natureza: m.natureza };
      });
      const total = ensureTotal(itens.reduce((sum, i) => sum.add(i.valorTotal), money(0)));
      const created = await tx.pedidoPBS.create({ data: {
        unidadeEmitenteId: d.unidade_emitente_id, dataPedido: new Date(d.data_pedido), responsavelNome: d.responsavel_nome,
        responsavelFuncao: d.responsavel_funcao, responsavelRegistro: d.responsavel_registro, atividadePrograma: d.atividade_programa,
        elementoDespesa: d.elemento_despesa, observacoes: d.observacoes, valorTotalEstimado: total, itens: { create: itens },
      } });
      return mapPedido(await tx.pedidoPBS.update({ where: { id: created.id }, data: { numeroPbs: `PBS-${created.dataPedido.getUTCFullYear()}/${String(created.id).padStart(6, '0')}` }, include: { itens: true } }));
    });
  }
  async confirmarRecebimento(id: number, d: Input<'receber'>) {
    return prisma.$transaction(async tx => {
      const p = await lockPedido(tx, id); expectStatus(p.status, ['SOLICITADO']);
      if (d.data_recebimento < day(p.dataPedido)!) throw new AppError(400, 'Recebimento anterior à solicitação.');
      return mapPedido(await tx.pedidoPBS.update({ where: { id }, data: { status: 'RECEBIDO', apontadorRecebimentoNome: d.apontador_recebimento_nome, dataRecebimento: new Date(d.data_recebimento) }, include: { itens: true } }));
    });
  }
  async atenderPedido(id: number, updates: Input<'atender'>['itensAtendidos']) {
    return prisma.$transaction(async tx => {
      const p = await lockPedido(tx, id); expectStatus(p.status, ['RECEBIDO', 'ATENDIDO_PARCIAL', 'ATENDIDO_TOTAL']);
      if (new Set(updates.map(i => i.item_id)).size !== updates.length) throw new AppError(400, 'Itens repetidos no atendimento.');
      const changes = new Map(updates.map(i => [i.item_id, i]));
      for (const update of updates) if (!p.itens.some(i => i.id === update.item_id && i.materialId === update.material_id)) throw new AppError(400, 'Item não pertence a este pedido.');
      for (const item of p.itens) {
        const update = changes.get(item.id); if (!update) continue;
        if (update.qtd_atendida > item.qtdPedida) throw new AppError(400, 'Quantidade atendida maior que a solicitada.');
        const delta = update.qtd_atendida - item.qtdAtendida;
        if (delta !== 0) {
          const changed = await tx.material.updateMany({ where: { id: item.materialId, ...(delta > 0 ? { qtdEstoque: { gte: delta } } : {}) }, data: { qtdEstoque: { decrement: delta } } });
          if (!changed.count) throw new AppError(409, 'Estoque insuficiente para atender o pedido.');
          await tx.itemPedidoPBS.update({ where: { id: item.id }, data: { qtdAtendida: update.qtd_atendida } });
        }
        item.qtdAtendida = update.qtd_atendida;
      }
      const status = p.itens.every(i => i.qtdAtendida === i.qtdPedida) ? 'ATENDIDO_TOTAL' : p.itens.some(i => i.qtdAtendida > 0) ? 'ATENDIDO_PARCIAL' : 'RECEBIDO';
      return mapPedido(await tx.pedidoPBS.update({ where: { id }, data: { status }, include: { itens: true } }));
    });
  }
  async confirmarEnvio(id: number, d: Input<'enviar'>) {
    return prisma.$transaction(async tx => {
      const p = await lockPedido(tx, id); expectStatus(p.status, ['ATENDIDO_PARCIAL', 'ATENDIDO_TOTAL']);
      if (d.data_envio < day(p.dataRecebimento || p.dataPedido)!) throw new AppError(400, 'Envio anterior ao recebimento.');
      return mapPedido(await tx.pedidoPBS.update({ where: { id }, data: { status: 'ENVIADO', apontadorEnvioNome: d.apontador_envio_nome, dataEnvio: new Date(d.data_envio) }, include: { itens: true } }));
    });
  }
  async cancelarPedido(id: number, unidadeId?: number) {
    return prisma.$transaction(async tx => {
      const p = await lockPedido(tx, id);
      if (unidadeId !== undefined && p.unidadeEmitenteId !== unidadeId) throw new AppError(404, 'Pedido não encontrado.');
      expectStatus(p.status, unidadeId !== undefined ? ['SOLICITADO'] : ['SOLICITADO', 'RECEBIDO', 'ATENDIDO_PARCIAL', 'ATENDIDO_TOTAL']);
      for (const item of p.itens) if (item.qtdAtendida > 0) await tx.material.update({ where: { id: item.materialId }, data: { qtdEstoque: { increment: item.qtdAtendida } } });
      await tx.itemPedidoPBS.updateMany({ where: { pedidoId: id }, data: { qtdAtendida: 0 } });
      return mapPedido(await tx.pedidoPBS.update({ where: { id }, data: { status: 'CANCELADO' }, include: { itens: true } }));
    });
  }
  getHonorarios = async (p: Page) => (await prisma.honorarioOdontologo.findMany(paging(p))).map(mapHonorario);
  async addHonorario(d: Input<'honorario'>) {
    return mapHonorario(await prisma.honorarioOdontologo.create({ data: { unidadeId: d.unidade_id, nomeDentista: d.nome_dentista, cro: d.cro, tipoContrato: d.tipo_contrato, mesReferencia: d.mes_referencia, valorFixo: d.valor_fixo, valorComissao: d.valor_comissao, valorTotal: ensureTotal(money(d.valor_fixo).add(d.valor_comissao)), observacoes: d.observacoes } }));
  }
  getEquipamentos = async (p: Page, unidadeId?: number) => (await prisma.equipamento.findMany({ ...paging(p), where: { unidadeId } })).map(mapEquipamento);
  async addEquipamento(d: Input<'equipamento'>) {
    return mapEquipamento(await prisma.equipamento.create({ data: { unidadeId: d.unidade_id, nome: d.nome, numeroSerie: d.numero_serie, categoria: d.categoria, dataUltimaPreventiva: d.data_ultima_preventiva ? new Date(d.data_ultima_preventiva) : null } }));
  }
  async updateEquipamento(id: number, d: Partial<Input<'equipamento'>>) {
    return prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM equipamentos WHERE id = ${id} FOR UPDATE`;
      const old = await tx.equipamento.findUniqueOrThrow({ where: { id } });
      if (d.unidade_id && d.unidade_id !== old.unidadeId && await tx.chamadoManutencao.count({ where: { equipamentoId: id } })) throw new AppError(409, 'Equipamento com histórico de manutenção não pode ser transferido neste fluxo.');
      return mapEquipamento(await tx.equipamento.update({ where: { id }, data: { unidadeId: d.unidade_id, nome: d.nome, numeroSerie: d.numero_serie, categoria: d.categoria, ...(d.data_ultima_preventiva !== undefined ? { dataUltimaPreventiva: d.data_ultima_preventiva ? new Date(d.data_ultima_preventiva) : null } : {}) } }));
    });
  }
  getChamados = async (p: Page, unidadeId?: number, tecnico = false) => (await prisma.chamadoManutencao.findMany({ ...paging(p), where: { unidadeId, ...(tecnico ? { status: { in: ['APROVADO_ADM', 'EM_ANDAMENTO', 'CONCLUIDO'] } } : {}) } })).map(mapChamado);
  async addChamado(d: Input<'chamado'>, unidadeId?: number) {
    return prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM equipamentos WHERE id = ${d.equipamento_id} FOR UPDATE`;
      const eq = await tx.equipamento.findUniqueOrThrow({ where: { id: d.equipamento_id } });
      if (eq.unidadeId !== d.unidade_id || (unidadeId !== undefined && eq.unidadeId !== unidadeId)) throw new AppError(403, 'Equipamento não pertence à unidade permitida.');
      return mapChamado(await tx.chamadoManutencao.create({ data: { unidadeId: eq.unidadeId, equipamentoId: eq.id, tipo: d.tipo, descricaoDefeito: d.descricao_defeito, custoReparo: d.custo_reparo, status: 'ABERTO', dataAbertura: new Date(d.data_abertura), observacoes: d.observacoes } }));
    });
  }
  async updateStatusChamado(id: number, d: Input<'status'>) {
    return prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM chamados_manutencao WHERE id = ${id} FOR UPDATE`;
      const c = await tx.chamadoManutencao.findUniqueOrThrow({ where: { id } });
      expectStatus(c.status, d.status === 'EM_ANDAMENTO' ? ['APROVADO_ADM'] : ['EM_ANDAMENTO']);
      const now = new Date(today());
      if (d.status === 'CONCLUIDO' && c.tipo === 'PREVENTIVA') await tx.equipamento.update({ where: { id: c.equipamentoId }, data: { dataUltimaPreventiva: now } });
      return mapChamado(await tx.chamadoManutencao.update({ where: { id }, data: { status: d.status, custoReparo: d.custo_reparo, ...(d.status === 'CONCLUIDO' ? { dataConclusao: now } : {}) } }));
    });
  }
  async aprovarChamadoManutencao(id: number, aprovar: boolean) {
    return prisma.$transaction(async tx => {
      const changed = await tx.chamadoManutencao.updateMany({ where: { id, status: 'ABERTO' }, data: { status: aprovar ? 'APROVADO_ADM' : 'RECUSADO' } });
      if (!changed.count) throw new AppError(409, 'Somente chamados abertos podem ser aprovados ou recusados.');
      return mapChamado(await tx.chamadoManutencao.findUniqueOrThrow({ where: { id } }));
    });
  }
  async verificarAlertasPreventiva(unidadeId?: number) {
    const cutoff = new Date(Date.now() - 180 * 86400000);
    return (await prisma.equipamento.findMany({ where: { unidadeId, OR: [{ dataUltimaPreventiva: null }, { dataUltimaPreventiva: { lte: cutoff } }], chamados: { none: { status: { in: ['ABERTO', 'APROVADO_ADM', 'EM_ANDAMENTO'] } } } }, include: { unidade: true }, take: 500 })).map(e => ({ equipamento: mapEquipamento(e), unidade: mapUnidade(e.unidade), mensagem: 'Equipamento sem preventiva registrada nos últimos 180 dias.' }));
  }
  async getConsolidacaoFinanceiraMulticlinica() {
    const [units, items, fees, repairs] = await prisma.$transaction([
      prisma.unidadeSaude.findMany(),
      prisma.$queryRaw<{ unidadeId: number; total: Prisma.Decimal }[]>`SELECT p.unidade_emitente_id AS unidadeId, COALESCE(SUM(i.qtd_atendida * i.valor_unitario), 0) AS total FROM pedidos_pbs p JOIN itens_pedido_pbs i ON i.pedido_id = p.id WHERE p.status <> 'CANCELADO' GROUP BY p.unidade_emitente_id`,
      prisma.honorarioOdontologo.groupBy({ by: ['unidadeId'], orderBy: { unidadeId: 'asc' }, _sum: { valorTotal: true } }),
      prisma.chamadoManutencao.groupBy({ by: ['unidadeId'], orderBy: { unidadeId: 'asc' }, where: { status: 'CONCLUIDO' }, _sum: { custoReparo: true } }),
    ], { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
    const im = new Map(items.map(i => [i.unidadeId, Number(i.total)]));
    const fm = new Map(fees.map(f => [f.unidadeId, Number(f._sum?.valorTotal || 0)]));
    const rm = new Map(repairs.map(r => [r.unidadeId, Number(r._sum?.custoReparo || 0)]));
    return units.map(u => { const insumos = im.get(u.id) || 0, honorarios = fm.get(u.id) || 0, manutencao = rm.get(u.id) || 0; return { unidadeId: u.id, nome: u.nome, tipo: u.tipo, custoInsumosAtendidos: insumos, custoHonorariosDentistas: honorarios, custoManutencaoEquipamentos: manutencao, custoTotalGeral: insumos + honorarios + manutencao }; });
  }
  getEntradas = async (p: Page) => (await prisma.entradaRecurso.findMany(paging(p))).map(mapEntrada);
  async addEntrada(d: Input<'entrada'>) {
    return mapEntrada(await prisma.entradaRecurso.create({ data: { unidadeId: d.unidade_id, natureza: d.natureza, tipoRecorrencia: d.tipo_recorrencia, descricao: d.descricao, valor: d.valor, dataCredito: new Date(d.data_credito), mesReferencia: d.mes_referencia, observacoes: d.observacoes } }));
  }
  deleteEntrada = async (id: number) => { await prisma.entradaRecurso.delete({ where: { id } }); };
}
export const dataStore = new DataStore();
