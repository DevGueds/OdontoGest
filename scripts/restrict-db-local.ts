import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const owner = new PrismaClient();
const original = process.env.DATABASE_URL!;
const runtimeUrl = new URL(original);
if (runtimeUrl.username !== 'root') throw new Error('Este comando é destinado à configuração local inicial que utiliza root.');
if (existsSync('.env.migrate')) throw new Error('A configuração de migração já existe.');
const database = runtimeUrl.pathname.slice(1);
if (!/^[a-zA-Z0-9_]+$/.test(database)) throw new Error('Nome de banco inválido.');
const username = `odontogest_app_${randomBytes(4).toString('hex')}`;
const password = randomBytes(32).toString('hex');
try {
  // All interpolated identifiers/passwords are generated ASCII alphanumerics, never user input.
  await owner.$executeRawUnsafe(`CREATE USER '${username}'@'localhost' IDENTIFIED BY '${password}'`);
  for (const table of ['unidades_saude', 'usuarios', 'materiais', 'pedidos_pbs', 'itens_pedido_pbs', 'honorarios_odontologos', 'equipamentos', 'chamados_manutencao', 'entradas_recursos']) {
    await owner.$executeRawUnsafe(`GRANT SELECT, INSERT, UPDATE, DELETE ON \`${database}\`.\`${table}\` TO '${username}'@'localhost'`);
  }
  await owner.$executeRawUnsafe(`GRANT SELECT, INSERT, UPDATE ON \`${database}\`.audit_events TO '${username}'@'localhost'`);
  runtimeUrl.username = username; runtimeUrl.password = password;
  runtimeUrl.searchParams.set('connection_limit', '10'); runtimeUrl.searchParams.set('pool_timeout', '10');
  const runtime = new PrismaClient({ datasourceUrl: runtimeUrl.toString() });
  try { await runtime.usuario.count(); await runtime.$queryRaw`SELECT 1`; } finally { await runtime.$disconnect(); }
  writeFileSync('.env.migrate', `DATABASE_URL=${JSON.stringify(original)}\n`, { flag: 'wx', mode: 0o600 });
  const env = readFileSync('.env', 'utf8').replace(/^DATABASE_URL=.*$/m, `DATABASE_URL=${JSON.stringify(runtimeUrl.toString())}`);
  writeFileSync('.env', env);
  console.log('Aplicação configurada com usuário MySQL restrito; credencial de migração separada em .env.migrate.');
} catch (error) {
  console.error('Falha ao separar permissões do banco.', { code: (error as { code?: string }).code });
  process.exitCode = 1;
} finally { await owner.$disconnect(); }
