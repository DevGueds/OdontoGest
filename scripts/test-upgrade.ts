import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseEnv } from 'node:util';
import { pathToFileURL } from 'node:url';
import { inspectUpgrade, legacyTables } from './check-upgrade.js';

// This rehearsal targets the actual predecessor of the reviewed branch, not a fresh current schema.
const baseline = 'f632233';
const root = process.cwd();
const adminEnv = existsSync('.env.migrate') ? parseEnv(readFileSync('.env.migrate', 'utf8')) : {};
const sourceUrl = adminEnv.DATABASE_URL || process.env.DATABASE_URL;
if (!sourceUrl) throw new Error('Configure DATABASE_URL para criar bancos isolados de ensaio.');
const admin = new PrismaClient({ datasourceUrl: sourceUrl });
const runDir = resolve('.local/upgrade-review', randomBytes(6).toString('hex'));
const oldSchema = resolve(runDir, 'legacy/schema.prisma');
mkdirSync(resolve(runDir, 'legacy/migrations/0_init'), { recursive: true });
const originalMigration = execFileSync('git', ['show', `${baseline}:prisma/migrations/0_init/migration.sql`]);
const originalSql = originalMigration.toString('utf16le').replace(/^\uFEFF/, '');
assert.equal(originalSql.replace(/\r\n/g, '\n').trim(), readFileSync('prisma/migrations/0_init/migration.sql', 'utf8').replace(/\r\n/g, '\n').trim(), 'A migração inicial mudou além da codificação; rever o ensaio.');
writeFileSync(oldSchema, execFileSync('git', ['show', `${baseline}:prisma/schema.prisma`]));
// Keep original bytes so Prisma records the actual legacy checksum.
writeFileSync(resolve(runDir, 'legacy/migrations/0_init/migration.sql'), originalMigration);
writeFileSync(resolve(runDir, 'legacy/migrations/migration_lock.toml'), 'provider = "mysql"\n');
const report: { baseline: string; reviewedCommit: string; cases: Record<string, unknown>[] } = {
  baseline, reviewedCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), cases: [],
};
const cliPath = resolve('node_modules/prisma/build/index.js');
const prismaCli = (url: string, args: string[]) => spawnSync(process.execPath, [cliPath, ...args], { cwd: root, env: { ...process.env, DATABASE_URL: url }, encoding: 'utf8', timeout: 60_000 });
const output = (r: ReturnType<typeof prismaCli>) => `${r.stdout || ''}\n${r.stderr || ''}`;
const hash = (rows: unknown) => createHash('sha256').update(JSON.stringify(rows)).digest('hex');
type Columns = Record<string, string[]>;
async function columns(db: PrismaClient): Promise<Columns> {
  const result: Columns = {};
  for (const table of legacyTables) {
    const rows = await db.$queryRaw<{ COLUMN_NAME: string }[]>`SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ${table} ORDER BY ORDINAL_POSITION`;
    result[table] = rows.map(r => r.COLUMN_NAME);
  }
  return result;
}
async function fingerprints(db: PrismaClient, cols: Columns) {
  const result: Record<string, { rows: number; hash: string }> = {};
  for (const table of legacyTables) {
    assert(cols[table].every(c => /^[a-z_]+$/.test(c)));
    const rows = await db.$queryRawUnsafe<unknown[]>(`SELECT ${cols[table].map(c => `\`${c}\``).join(',')} FROM \`${table}\` ORDER BY id`);
    result[table] = { rows: rows.length, hash: hash(rows) };
  }
  return result;
}
async function seed(db: PrismaClient) {
  await db.$executeRaw`INSERT INTO unidades_saude (id,nome,tipo,orcamento_custeio,orcamento_investimento,criado_em) VALUES (10,'Clínica São João – ensaio','USF',123456.78,87654.32,'2024-02-29 23:59:59.123')`;
  for (const [index, perfil] of ['ADMINISTRADOR','GESTOR','SOLICITANTE','TECNICO'].entries()) {
    await db.$executeRaw`INSERT INTO usuarios (id,email,senha_hash,nome,perfil,unidade_id) VALUES (${index + 10},${`ensaio${index}@example.invalid`},'Antiga2026!','Usuário de ensaio',${perfil},10)`;
  }
  await db.$executeRaw`INSERT INTO materiais (id,descricao,unidade_medida,valor_estimado,qtd_estoque,natureza) VALUES (10,'Resina – ação','UN',12.34,100,'CUSTEIO'),(20,'Equipamento de ensaio','UN',567.89,30,'INVESTIMENTO')`;
  for (const [index, status] of ['SOLICITADO','RECEBIDO','ATENDIDO_PARCIAL','ATENDIDO_TOTAL','ENVIADO','CANCELADO'].entries()) {
    const id = 1001 + index;
    await db.$executeRaw`INSERT INTO pedidos_pbs (id,numero_pbs,unidade_emitente_id,data_pedido,responsavel_nome,status,valor_total_estimado,observacoes) VALUES (${id},${`PBS-2024/00${index+1}`},10,'2024-02-29','Responsável de ensaio',${status},629.59,'Observação com acentuação: manutenção, ç e ã')`;
    const fulfilled = [0,0,2,5,5,2][index];
    await db.$executeRaw`INSERT INTO itens_pedido_pbs (id,pedido_id,numero_item,material_id,qtd_pedida,qtd_atendida,valor_unitario,valor_total) VALUES (${id*10},${id},1,10,5,${fulfilled},12.34,61.70),(${id*10+1},${id},2,20,1,${index === 3 || index === 4 ? 1 : 0},567.89,567.89)`;
  }
  await db.$executeRaw`INSERT INTO honorarios_odontologos (id,unidade_id,nome_dentista,cro,tipo_contrato,mes_referencia,valor_fixo,valor_comissao,valor_total,observacoes) VALUES (10,10,'Dentista de ensaio','TESTE','FIXO','2024-02',1000.01,234.56,1234.57,'Descrição histórica')`;
  await db.$executeRaw`INSERT INTO equipamentos (id,unidade_id,nome,numero_serie,categoria,data_ultima_preventiva) VALUES (10,10,'Equipo odontológico','ENSAIO','ODONTO','2024-02-29')`;
  for (const [index, status] of ['ABERTO','APROVADO_ADM','EM_ANDAMENTO','CONCLUIDO','RECUSADO'].entries()) await db.$executeRaw`INSERT INTO chamados_manutencao (id,unidade_id,equipamento_id,descricao_defeito,custo_reparo,status) VALUES (${10+index},10,10,'Descrição de ensaio',25.50,${status})`;
  await db.$executeRaw`INSERT INTO entradas_recursos (id,unidade_id,natureza,descricao,valor,mes_referencia) VALUES (10,10,'CUSTEIO','Crédito de ensaio',100.01,'2024-02'),(20,NULL,'INVESTIMENTO','Crédito geral de ensaio',200.02,'2024-02')`;
}
async function restoreBackup(db: PrismaClient, file: string) {
  const json = execFileSync('powershell.exe', ['-NoProfile', '-Command', "[Console]::InputEncoding = [Text.UTF8Encoding]::new($false); [Console]::OutputEncoding = [Text.UTF8Encoding]::new($false); Add-Type -AssemblyName System.Security; $cipher = [Convert]::FromBase64String([Console]::In.ReadToEnd().Trim()); [Text.Encoding]::UTF8.GetString([Security.Cryptography.ProtectedData]::Unprotect($cipher, $null, [Security.Cryptography.DataProtectionScope]::CurrentUser))"], { input: readFileSync(file, 'utf8'), encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
  const snapshot = JSON.parse(json) as Record<string, Record<string, unknown>[]>;
  for (const table of legacyTables) {
    assert(Array.isArray(snapshot[table]), 'Backup não contém todas as tabelas legadas.');
    const metadata = await db.$queryRaw<{ COLUMN_NAME: string; DATA_TYPE: string }[]>`SELECT COLUMN_NAME, DATA_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ${table} ORDER BY ORDINAL_POSITION`;
    const names = metadata.map(m => m.COLUMN_NAME);
    assert(names.every(n => /^[a-z_]+$/.test(n)));
    for (const row of snapshot[table]) {
      assert(names.every(n => Object.hasOwn(row, n)), 'Backup possui schema diferente do legado.');
      const values = metadata.map(m => row[m.COLUMN_NAME] !== null && ['date','datetime','timestamp'].includes(m.DATA_TYPE) ? new Date(String(row[m.COLUMN_NAME])) : row[m.COLUMN_NAME]);
      await db.$executeRawUnsafe(`INSERT INTO \`${table}\` (${names.map(n => `\`${n}\``).join(',')}) VALUES (${names.map(() => '?').join(',')})`, ...values);
    }
  }
}
async function sandbox(name: string, work: (db: PrismaClient, url: string) => Promise<void>, backup?: string) {
  const database = `odontogest_upgrade_${randomBytes(6).toString('hex')}`;
  const url = new URL(sourceUrl!);
  assert(/^odontogest_upgrade_[a-f0-9]{12}$/.test(database));
  assert.notEqual(url.pathname, `/${database}`);
  url.pathname = `/${database}`;
  let created = false;
  const db = new PrismaClient({ datasourceUrl: url.toString() });
  try {
    await admin.$executeRawUnsafe(`CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    created = true;
    for (const statement of originalSql.split(';').map(s => s.trim()).filter(Boolean)) await db.$executeRawUnsafe(statement);
    if (backup) await restoreBackup(db, backup); else await seed(db);
    await work(db, url.toString());
    console.log(`PASS ${name}`);
  } finally {
    await db.$disconnect();
    // Drop only the random database that this invocation successfully created.
    if (created) await admin.$executeRawUnsafe(`DROP DATABASE \`${database}\``);
  }
}
async function baselineDb(url: string) {
  const result = prismaCli(url, ['migrate','resolve','--applied','0_init','--schema',oldSchema]);
  assert.equal(result.status, 0, 'Falha ao registrar baseline no banco isolado.');
}
async function successfulUpgrade(db: PrismaClient, url: string, name: string, behavior: boolean) {
  assert.equal(prismaCli(url, ['migrate','diff','--from-schema-datasource',oldSchema,'--to-schema-datamodel',oldSchema,'--exit-code']).status, 0, 'Schema de origem diverge do legado.');
  await baselineDb(url);
  const cols = await columns(db), before = await fingerprints(db, cols);
  const preflight = await inspectUpgrade(db);
  assert.deepEqual(preflight.blockers, []);
  const migrated = prismaCli(url, ['migrate','deploy']);
  assert.equal(migrated.status, 0, 'Upgrade de dados válidos falhou.');
  assert.equal(prismaCli(url, ['migrate','diff','--from-schema-datasource','prisma/schema.prisma','--to-schema-datamodel','prisma/schema.prisma','--exit-code']).status, 0, 'Schema migrado diverge do modelo atual.');
  assert.deepEqual(await fingerprints(db, cols), before, 'Uma coluna legada foi alterada pela migration.');
  const classified = await db.$queryRaw<{ n: bigint }[]>`SELECT COUNT(*) AS n FROM itens_pedido_pbs i JOIN materiais m ON m.id = i.material_id WHERE i.natureza <> m.natureza`;
  assert.equal(Number(classified[0].n), 0);
  const second = prismaCli(url, ['migrate','deploy']);
  assert.equal(second.status, 0);
  assert.deepEqual(await fingerprints(db, cols), before);
  report.cases.push({ name, preserved: before, repeatedDeploy: true, preflightWarnings: preflight.warnings, legacyChecksumAccepted: true, natureBackfillMatchesCatalog: true, schemaDiffClean: true });
  if (behavior) {
    const env = { ...process.env, DATABASE_URL: url, TEST_DATABASE: new URL(url).pathname.slice(1), NODE_ENV: 'test' };
    const probe = resolve('tests/upgrade-behavior.ts');
    assert.equal(spawnSync(process.execPath, ['--import','tsx',probe,'before'], { env, stdio: 'inherit' }).status, 0);
    const prepDir = resolve(runDir, 'secure-local');
    mkdirSync(prepDir, { recursive: true });
    writeFileSync(resolve(prepDir, '.env'), `COOKIE_SECRET=${randomBytes(48).toString('hex')}\n`);
    const loader = pathToFileURL(resolve('node_modules/tsx/dist/loader.mjs')).href;
    const secure = spawnSync(process.execPath, ['--import',loader,resolve('scripts/secure-local.ts')], { cwd: prepDir, env, encoding: 'utf8', timeout: 60_000 });
    assert.equal(secure.status, 0, 'Conversão isolada de credenciais falhou.');
    const hashes = await db.usuario.findMany({ select: { id: true, senhaHash: true } });
    const repeat = spawnSync(process.execPath, ['--import',loader,resolve('scripts/secure-local.ts')], { cwd: prepDir, env, encoding: 'utf8', timeout: 60_000 });
    assert.equal(repeat.status, 0);
    assert.deepEqual(await db.usuario.findMany({ select: { id: true, senhaHash: true } }), hashes, 'Conversor alterou novamente senhas já protegidas.');
    assert.equal(spawnSync(process.execPath, ['--import','tsx',probe,'after'], { env, stdio: 'inherit' }).status, 0);
  }
}
try {
  await sandbox('legado válido: preservação, novo deploy e fluxos após conversão', (db, url) => successfulUpgrade(db, url, 'valid_legacy', true));
  const badCases = [
    ['duplicate_items', 'INSERT INTO itens_pedido_pbs (pedido_id,numero_item,material_id,qtd_pedida) VALUES (1001,3,10,1)'],
    ['negative_stock', 'UPDATE materiais SET qtd_estoque = -1 WHERE id = 10'],
    ['negative_price', 'UPDATE materiais SET valor_estimado = -0.01 WHERE id = 10'],
    ['overfulfilled_item', 'UPDATE itens_pedido_pbs SET qtd_atendida = 6 WHERE id = 10010'],
    ['zero_requested_item', 'UPDATE itens_pedido_pbs SET qtd_pedida = 0 WHERE id = 10010'],
    ['orphan_income', 'UPDATE entradas_recursos SET unidade_id = 9999 WHERE id = 10'],
  ];
  for (const [name, sql] of badCases) await sandbox(name, async (db, url) => {
    await baselineDb(url);
    await db.$executeRawUnsafe(sql);
    const cols = await columns(db), before = await fingerprints(db, cols);
    const preflight = await inspectUpgrade(db);
    assert(preflight.blockers.length > 0, 'O preflight não detectou os dados incompatíveis.');
    const failed = prismaCli(url, ['migrate','deploy']);
    assert.notEqual(failed.status, 0);
    assert.match(output(failed), /P3018/);
    assert.deepEqual(await fingerprints(db, cols), before);
    const state = await db.$queryRaw<{ n: bigint }[]>`SELECT COUNT(*) AS n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'senha_requer_troca'`;
    assert.equal(Number(state[0].n), 1, 'O ensaio esperava observar DDL parcialmente confirmado.');
    const repeated = prismaCli(url, ['migrate','deploy']);
    assert.match(output(repeated), /P3009/);
    assert((await inspectUpgrade(db)).blockers.some(m => m.includes('migration incompleta')));
    report.cases.push({ name, preflightBlocked: true, error: 'P3018', repeatError: 'P3009', partialDDL: true, legacyColumnsPreserved: true });
  });
  await sandbox('banco antigo sem histórico', async (db, url) => {
    const cols = await columns(db), before = await fingerprints(db, cols);
    assert((await inspectUpgrade(db)).blockers.some(m => m.includes('Baseline')));
    const result = prismaCli(url, ['migrate','deploy']);
    assert.match(output(result), /P3005/);
    assert.deepEqual(await fingerprints(db, cols), before);
    report.cases.push({ name: 'missing_history', error: 'P3005', legacyColumnsPreserved: true });
  });
  const backupIndex = process.argv.indexOf('--backup');
  if (backupIndex !== -1) {
    const file = process.argv[backupIndex + 1];
    assert(file?.endsWith('.dpapi'), 'Informe o backup DPAPI legado.');
    await sandbox('restauração e upgrade do backup real anterior à auditoria', (db, url) => successfulUpgrade(db, url, 'real_legacy_backup', false), file);
  }
  console.log(`Ensaios concluídos: ${report.cases.length}. Nenhum banco original alterado.`);
} finally {
  writeFileSync(resolve(runDir, 'result.json'), JSON.stringify(report, null, 2));
  console.log(`Evidência sem dados pessoais: ${resolve(runDir, 'result.json')}`);
  await admin.$disconnect();
}
