import { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma.js';

export function sqlValue(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number' || typeof value === 'bigint' || Prisma.Decimal.isDecimal(value)) return String(value);
  if (typeof value === 'boolean') return value ? '1' : '0';
  const text = value instanceof Date ? value.toISOString().slice(0, 23).replace('T', ' ') : String(value);
  // Hex strings are safe under both ordinary MySQL escaping and NO_BACKSLASH_ESCAPES.
  return `CONVERT(X'${Buffer.from(text, 'utf8').toString('hex')}' USING utf8mb4)`;
}
export async function exportSql() {
  const tables = ['unidades_saude', 'materiais', 'pedidos_pbs', 'itens_pedido_pbs', 'honorarios_odontologos', 'equipamentos', 'chamados_manutencao', 'entradas_recursos'] as const;
  return prisma.$transaction(async tx => {
    let output = '-- Exportação operacional OdontoGest; não inclui contas, credenciais ou auditoria.\nSET NAMES utf8mb4;\nSTART TRANSACTION;\n';
    for (const table of tables) {
      // Identifiers come exclusively from the constant allowlist above.
      const rows = await tx.$queryRawUnsafe<Record<string, unknown>[]>(`SELECT * FROM \`${table}\``);
      for (const row of rows) {
        const keys = Object.keys(row);
        output += `INSERT INTO \`${table}\` (${keys.map(k => `\`${k}\``).join(',')}) VALUES (${keys.map(k => sqlValue(row[k])).join(',')});\n`;
      }
    }
    return output + 'COMMIT;\n';
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, timeout: 30_000 });
}
