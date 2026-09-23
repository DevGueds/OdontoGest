import { PrismaClient } from '@prisma/client';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { parseEnv } from 'node:util';

const migrationEnv = existsSync('.env.migrate') ? parseEnv(readFileSync('.env.migrate', 'utf8')) : {};
const originalUrl = migrationEnv.DATABASE_URL || process.env.DATABASE_URL!;
const admin = new PrismaClient({ datasourceUrl: originalUrl });
const url = new URL(originalUrl);
const database = `odontogest_test_${randomBytes(6).toString('hex')}`;
if (!/^odontogest_test_[a-f0-9]{12}$/.test(database) || url.pathname === `/${database}`) throw new Error('Banco de teste inválido.');
url.pathname = `/${database}`;
let created = false;
try {
  await admin.$executeRawUnsafe(`CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  created = true;
  const env = { ...process.env, DATABASE_URL: url.toString(), NODE_ENV: 'test', COOKIE_SECRET: randomBytes(48).toString('hex'), APP_ORIGINS: 'http://localhost:3000,http://127.0.0.1:3417', TEST_DATABASE: database };
  const migration = spawnSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], { env, stdio: 'inherit' });
  if (migration.status !== 0) throw new Error('Falha ao preparar o banco isolado.');
  const result = spawnSync(process.execPath, ['--import', 'tsx', '--test', '--test-concurrency=1', 'tests/integration/api.integration.ts'], { env, stdio: 'inherit' });
  process.exitCode = result.status ?? 1;
} finally {
  if (created) await admin.$executeRawUnsafe(`DROP DATABASE \`${database}\``);
  await admin.$disconnect();
}
