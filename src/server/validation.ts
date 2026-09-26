import { z } from 'zod';

const text = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) => z.string().trim().max(max).optional();
export const id = z.number().int().positive().max(2147483647);
const quantity = z.number().int().min(0).max(1000000);
const money = z.number().min(0).max(99999999.99).multipleOf(0.01);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s => {
  const d = new Date(s); return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === s;
}, 'Data inválida');
const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
const natureza = z.enum(['CUSTEIO', 'INVESTIMENTO']);
const password = z.string().min(8).max(128);
export const schemas = {
  login: z.object({ email: z.string().trim().email().max(150), senha: z.string().min(1).max(128) }).strict(),
  password: z.object({ senha_atual: z.string().min(1).max(128), nova_senha: password }).strict(),
  unidade: z.object({ nome: text(150), tipo: text(50).default('UNIDADE') }).strict(),
  material: z.object({ descricao: text(255), unidade_medida: text(20), valor_estimado: money.default(0), qtd_estoque: quantity.default(0), limite_max_pedido: quantity.min(1).nullable().default(null), fornecedor: z.string().trim().max(150).nullable().default(null), natureza: natureza.default('CUSTEIO') }).strict(),
  estoque: z.object({ qtd_estoque: quantity, estoque_anterior: quantity }).strict(),
  pedido: z.object({ unidade_emitente_id: id, data_pedido: date, responsavel_nome: text(150), responsavel_funcao: optionalText(100), responsavel_registro: optionalText(50), atividade_programa: optionalText(150), elemento_despesa: optionalText(100), observacoes: optionalText(5000), numero_pbs: optionalText(50), itens: z.array(z.object({ material_id: id, qtd_pedida: quantity.min(1), valor_unitario: money.optional() }).strict()).min(1).max(100) }).strict(),
  receber: z.object({ apontador_recebimento_nome: text(150), data_recebimento: date }).strict(),
  enviar: z.object({ apontador_envio_nome: text(150), data_envio: date }).strict(),
  atender: z.object({ itensAtendidos: z.array(z.object({ item_id: id, material_id: id, qtd_atendida: quantity }).strict()).min(1).max(100) }).strict(),
  honorario: z.object({ unidade_id: id, nome_dentista: text(150), cro: text(50), tipo_contrato: z.enum(['FOLHA_FIXA', 'COMISSAO', 'PLANTAO', 'PJ_RPA']), mes_referencia: month, valor_fixo: money, valor_comissao: money, valor_total: money.optional(), observacoes: optionalText(5000) }).strict(),
  equipamento: z.object({ unidade_id: id, nome: text(150), numero_serie: z.string().trim().max(100), categoria: z.string().trim().max(100).default(''), data_ultima_preventiva: date.nullable().optional() }).strict(),
  chamado: z.object({ unidade_id: id, equipamento_id: id, tipo: z.enum(['CORRETIVA', 'PREVENTIVA']), descricao_defeito: text(5000), custo_reparo: money.default(0), status: z.literal('ABERTO').optional(), aprovado_adm: z.literal(false).optional(), data_abertura: date, observacoes: optionalText(5000) }).strict(),
  status: z.object({ status: z.enum(['EM_ANDAMENTO', 'CONCLUIDO']), custo_reparo: money.optional() }).strict(),
  aprovar: z.object({ aprovar: z.boolean() }).strict(),
  entrada: z.object({ unidade_id: id.nullable().optional(), natureza, tipo_recorrencia: z.enum(['RECORRENTE', 'PARCELA_UNICA']), descricao: text(255), valor: money, data_credito: date, mes_referencia: month, observacoes: optionalText(5000) }).strict(),
  user: z.object({ email: z.string().trim().email().max(150), senha: password, nome: text(150), funcao: optionalText(100), registro: optionalText(50), perfil: z.enum(['SOLICITANTE', 'GESTOR', 'ADMINISTRADOR', 'TECNICO']), unidade_id: id }).strict(),
};
export type Input<K extends keyof typeof schemas> = z.infer<(typeof schemas)[K]>;
export function parseId(value: unknown) { return id.parse(typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value); }
