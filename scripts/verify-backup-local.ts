import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
const file = process.argv[2];
if (!file?.endsWith('.dpapi')) throw new Error('Informe o arquivo .dpapi gerado pelo backup local.');
const json = execFileSync('powershell.exe', ['-NoProfile', '-Command', "[Console]::InputEncoding = [Text.UTF8Encoding]::new($false); [Console]::OutputEncoding = [Text.UTF8Encoding]::new($false); Add-Type -AssemblyName System.Security; $backupCipher = [Convert]::FromBase64String([Console]::In.ReadToEnd().Trim()); [Text.Encoding]::UTF8.GetString([Security.Cryptography.ProtectedData]::Unprotect($backupCipher, $null, [Security.Cryptography.DataProtectionScope]::CurrentUser))"], { input: readFileSync(file, 'utf8'), encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
const tables = JSON.parse(json) as Record<string, unknown[]>;
console.log(JSON.stringify({ readable: true, rows: Object.fromEntries(Object.entries(tables).map(([table, rows]) => [table, rows.length])) }));
if (process.argv.includes('--compare-catalog')) {
  const db = new PrismaClient();
  try {
    const current = await db.$queryRaw<Record<string, unknown>[]>`SELECT id, descricao, unidade_medida, fornecedor, qtd_estoque FROM materiais ORDER BY id`;
    const baseline = (tables.materiais as Record<string, unknown>[]).map(m => ({ id: m.id, descricao: m.descricao, unidade_medida: m.unidade_medida, fornecedor: m.fornecedor, qtd_estoque: m.qtd_estoque })).sort((a,b) => Number(a.id) - Number(b.id));
    const columns = ['id', 'descricao', 'unidade_medida', 'fornecedor', 'qtd_estoque'];
    const differences = Object.fromEntries(columns.map(column => [column, current.filter((row, index) => String(row[column]) !== String(baseline[index]?.[column as keyof typeof baseline[number]])).length]));
    const matches = current.length === baseline.length && Object.values(differences).every(n => n === 0);
    console.log(JSON.stringify({ originalCatalogAndUnicodePreserved: matches, differences }));
    if (!matches) process.exitCode = 1;
  } finally { await db.$disconnect(); }
}
