import { PrismaClient, type Prisma } from '@prisma/client';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

export const legacyTables = ['unidades_saude', 'usuarios', 'materiais', 'pedidos_pbs', 'itens_pedido_pbs', 'honorarios_odontologos', 'equipamentos', 'chamados_manutencao', 'entradas_recursos'] as const;

// SELECTs only. Counts are safe to share; never return credentials or personal records.
export async function inspectUpgrade(db: PrismaClient) {
  return db.$transaction(async (tx: Prisma.TransactionClient) => {
    const tables = await tx.$queryRaw<{ TABLE_NAME: string }[]>`SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()`;
    const names = new Set(tables.map(t => t.TABLE_NAME));
    const blockers: string[] = [], warnings: string[] = [];
    const counts: Record<string, number> = {};
    const missing = legacyTables.filter(t => !names.has(t));
    if (missing.length) return { blockers: [`Tabelas legadas ausentes: ${missing.join(', ')}. Verifique o schema antes de migrar.`], warnings, counts, history: [] };
    const count = async (key: string, sql: string) => {
      const rows = await tx.$queryRawUnsafe<{ n: bigint }[]>(sql);
      counts[key] = Number(rows[0].n);
      return counts[key];
    };
    for (const table of legacyTables) await count(table, `SELECT COUNT(*) AS n FROM \`${table}\``);
    const checks = [
      ['materiais_repetidos_no_pedido', 'SELECT COUNT(*) AS n FROM (SELECT pedido_id, material_id FROM itens_pedido_pbs GROUP BY pedido_id, material_id HAVING COUNT(*) > 1) d', 'Há materiais repetidos em pedidos; o índice único falhará.'],
      ['estoques_negativos', 'SELECT COUNT(*) AS n FROM materiais WHERE qtd_estoque < 0', 'Há estoques negativos; o CHECK de materiais falhará.'],
      ['precos_negativos', 'SELECT COUNT(*) AS n FROM materiais WHERE valor_estimado < 0', 'Há preços negativos; o CHECK de materiais falhará.'],
      ['quantidades_invalidas', 'SELECT COUNT(*) AS n FROM itens_pedido_pbs WHERE qtd_pedida <= 0 OR qtd_atendida < 0 OR qtd_atendida > qtd_pedida', 'Há quantidades incompatíveis com o CHECK de itens.'],
      ['entradas_sem_unidade_existente', 'SELECT COUNT(*) AS n FROM entradas_recursos e LEFT JOIN unidades_saude u ON u.id = e.unidade_id WHERE e.unidade_id IS NOT NULL AND u.id IS NULL', 'Há entradas vinculadas a unidades inexistentes; a chave estrangeira falhará.'],
    ];
    for (const [key, sql, message] of checks) if (await count(key, sql)) blockers.push(message);
    const notices = [
      ['credenciais_sem_formato_scrypt', "SELECT COUNT(*) AS n FROM usuarios WHERE NOT REGEXP_LIKE(senha_hash, '^scrypt[$]32768[$]8[$]3[$][a-f0-9]{32}[$][a-f0-9]{128}$', 'c')", 'A autenticação nova rejeita credenciais legadas; execute a conversão antes de liberar o acesso.'],
      ['senhas_legadas_incompativeis', "SELECT COUNT(*) AS n FROM usuarios WHERE NOT REGEXP_LIKE(senha_hash, '^scrypt[$]32768[$]8[$]3[$][a-f0-9]{32}[$][a-f0-9]{128}$', 'c') AND (CHAR_LENGTH(senha_hash) > 128 OR CHAR_LENGTH(senha_hash) = 0 OR senha_hash LIKE 'scrypt$%')", 'Há credenciais que exigem redefinição individual; o conversor genérico não garante o acesso.'],
      ['solicitantes_sem_unidade', "SELECT COUNT(*) AS n FROM usuarios WHERE perfil = 'SOLICITANTE' AND unidade_id IS NULL", 'Solicitantes sem unidade terão acesso operacional bloqueado.'],
      ['emails_com_espacos', "SELECT COUNT(*) AS n FROM usuarios WHERE OCTET_LENGTH(email) <> OCTET_LENGTH(TRIM(email))", 'Revise e-mails com espaços antes da normalização usada no login.'],
      ['cancelados_com_atendimento', "SELECT COUNT(*) AS n FROM pedidos_pbs p WHERE p.status = 'CANCELADO' AND EXISTS (SELECT 1 FROM itens_pedido_pbs i WHERE i.pedido_id = p.id AND i.qtd_atendida > 0)", 'Cancelamentos antigos não devolveram estoque automaticamente; reconcilie com a contagem física, sem estorno cego.'],
      ['chamados_status_desconhecido', "SELECT COUNT(*) AS n FROM chamados_manutencao WHERE status NOT IN ('ABERTO','APROVADO_ADM','RECUSADO','EM_ANDAMENTO','CONCLUIDO')", 'Chamados com status desconhecido podem ficar sem transição no fluxo novo.'],
      ['chamados_unidade_divergente', 'SELECT COUNT(*) AS n FROM chamados_manutencao c JOIN equipamentos e ON e.id = c.equipamento_id WHERE c.unidade_id <> e.unidade_id', 'Há chamados e equipamentos vinculados a unidades diferentes; revise os vínculos antes da restrição por unidade.'],
      ['manutencoes_pendentes_com_custo', "SELECT COUNT(*) AS n FROM chamados_manutencao WHERE status <> 'CONCLUIDO' AND custo_reparo <> 0", 'Os relatórios novos contabilizam somente manutenção concluída; os saldos exibidos mudarão.'],
      ['pedidos_com_mais_de_100_itens', 'SELECT COUNT(*) AS n FROM (SELECT pedido_id FROM itens_pedido_pbs GROUP BY pedido_id HAVING COUNT(*) > 100) p', 'Pedidos com mais de 100 itens exigem atendimento em lotes; o frontend deve ser adaptado antes de operar esses registros.'],
      ['quantidades_acima_do_limite_da_api', 'SELECT COUNT(*) AS n FROM itens_pedido_pbs WHERE qtd_pedida > 1000000 OR qtd_atendida > 1000000', 'Quantidades históricas excedem os limites da API nova; revisar o fluxo de atendimento desses pedidos.'],
      ['materiais_fora_dos_limites_da_api', 'SELECT COUNT(*) AS n FROM materiais WHERE qtd_estoque > 1000000 OR limite_max_pedido <= 0 OR limite_max_pedido > 1000000', 'Há materiais fora dos novos limites de edição; revisar individualmente.'],
      ['honorarios_contrato_desconhecido', "SELECT COUNT(*) AS n FROM honorarios_odontologos WHERE tipo_contrato NOT IN ('FOLHA_FIXA','COMISSAO','PLANTAO','PJ_RPA')", 'Há tipos de contrato históricos fora do conjunto aceito nos novos cadastros.'],
    ];
    for (const [key, sql, message] of notices) if (await count(key, sql)) warnings.push(message);
    if (!await count('administradores', "SELECT COUNT(*) AS n FROM usuarios WHERE perfil = 'ADMINISTRADOR'")) warnings.push('Nenhum administrador persistido; preparar o acesso administrativo faz parte da atualização.');
    const history = names.has('_prisma_migrations') ? await tx.$queryRaw<{ migration_name: string; checksum: string; finished_at: Date | null; rolled_back_at: Date | null }[]>`SELECT migration_name, checksum, finished_at, rolled_back_at FROM _prisma_migrations ORDER BY started_at` : [];
    if (!history.some(m => m.migration_name === '0_init' && m.finished_at && !m.rolled_back_at)) blockers.push('Baseline 0_init ausente. Compare o schema antes de registrar o baseline; não execute deploy cegamente.');
    if (history.some(m => !m.finished_at && !m.rolled_back_at)) blockers.push('Há migration incompleta. O deploy será bloqueado; recuperar o estado parcial antes de continuar.');
    for (const migration of history.filter(m => m.finished_at && !m.rolled_back_at)) {
      // Only fixed, known paths; database strings never become filesystem paths.
      if (!['0_init', '20260923204000_security_integrity'].includes(migration.migration_name)) {
        warnings.push('O banco possui migration fora do histórico revisado.');
        continue;
      }
      const file = resolve('prisma/migrations', migration.migration_name, 'migration.sql');
      if (!existsSync(file) || createHash('sha256').update(readFileSync(file)).digest('hex') !== migration.checksum) warnings.push(`Checksum divergente: ${migration.migration_name}. Revisar o histórico; não editar _prisma_migrations automaticamente.`);
    }
    return { blockers, warnings, counts, history: history.map(({ checksum, ...m }) => m) };
  }, { isolationLevel: 'RepeatableRead', timeout: 30_000 });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const env = existsSync('.env.migrate') ? parseEnv(readFileSync('.env.migrate', 'utf8')) : {};
  const db = new PrismaClient({ datasourceUrl: env.DATABASE_URL || process.env.DATABASE_URL });
  try {
    const result = await inspectUpgrade(db);
    console.log(JSON.stringify(result, null, 2));
    // Warnings require review even when the SQL migration itself is compatible.
    if (result.blockers.length) process.exitCode = 1;
  } catch {
    console.error('Não foi possível verificar o banco. Confira a conexão, as permissões de leitura e o schema. Nenhuma alteração foi executada.');
    process.exitCode = 1;
  } finally { await db.$disconnect(); }
}
