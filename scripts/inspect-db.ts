import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
try {
  const tables = await db.$queryRaw<{ TABLE_NAME: string }[]>`SELECT TABLE_NAME FROM information_schema.tables WHERE table_schema = DATABASE()`;
  console.log(JSON.stringify({ tables: tables.map(t => t.TABLE_NAME) }));
  const users = await db.usuario.findMany({ select: { senhaHash: true, perfil: true } });
  console.log(JSON.stringify({ users: users.length, legacyPasswords: users.filter(u => !u.senhaHash.startsWith('scrypt$')).length, roles: users.reduce((a, u) => ({ ...a, [u.perfil]: (a[u.perfil] || 0) + 1 }), {} as Record<string, number>) }));
  console.log(JSON.stringify({ unidades: await db.unidadeSaude.count(), materiais: await db.material.count(), pedidos: await db.pedidoPBS.count(), equipamentos: await db.equipamento.count(), chamados: await db.chamadoManutencao.count() }));
  console.log(JSON.stringify({ negativeStock: await db.material.count({ where: { qtdEstoque: { lt: 0 } } }) }));
} finally { await db.$disconnect(); }
