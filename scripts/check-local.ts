import { PrismaClient } from '@prisma/client';
import { getConfig } from '../src/server/config.js';
const db = new PrismaClient();
const runtimeProcess = (globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined>; exitCode?: number };
}).process;
try {
  const users = await db.usuario.findMany({ select: { senhaHash: true, perfil: true, senhaRequerTroca: true } });
  const grants = await db.$queryRawUnsafe<Record<string, string>[]>('SHOW GRANTS FOR CURRENT_USER');
  const grantText = grants.flatMap(Object.values).join('\n');
  const result = {
    databaseConnected: true,
    runtimeUsesRoot: new URL(runtimeProcess?.env?.DATABASE_URL ?? '').username === 'root',
    runtimeHasDDL: /\b(ALL PRIVILEGES|CREATE|ALTER|DROP|GRANT OPTION)\b/i.test(grantText),
    cookieSecretConfigured: getConfig().secret.length >= 32,
    unidades: await db.unidadeSaude.count(), materiais: await db.material.count(), pedidos: await db.pedidoPBS.count(),
    usuarios: users.length, administradores: users.filter(u => u.perfil === 'ADMINISTRADOR').length,
    legacyPasswords: users.filter(u => !u.senhaHash.startsWith('scrypt$')).length,
    passwordChangesRequired: users.filter(u => u.senhaRequerTroca).length,
    negativeStock: await db.material.count({ where: { qtdEstoque: { lt: 0 } } }),
  };
  console.log(JSON.stringify(result, null, 2));
  if (result.runtimeUsesRoot || result.runtimeHasDDL || result.legacyPasswords || result.negativeStock) runtimeProcess && (runtimeProcess.exitCode = 1);
} finally { await db.$disconnect(); }
