import { buildApp } from './app.js';
import { getConfig } from './config.js';
import { prisma } from './db/prisma.js';

const app = await buildApp();
try {
  await prisma.$connect();
  const config = getConfig();
  await app.listen({ port: config.port, host: config.host });
} catch (error) {
  app.log.error({ errorType: error instanceof Error ? error.name : 'Error' }, 'startup_failed');
  await prisma.$disconnect();
  process.exitCode = 1;
}
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, async () => { await app.close(); await prisma.$disconnect(); });
