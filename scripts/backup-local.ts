import { PrismaClient } from '@prisma/client';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

// Recovery copy encrypted by Windows DPAPI, recoverable only by this Windows account.
if (process.platform !== 'win32') throw new Error('Este comando de cópia local requer Windows DPAPI.');
const db = new PrismaClient();
try {
  const snapshot = await db.$transaction(async tx => {
    const tables = await tx.$queryRaw<{ TABLE_NAME: string }[]>`SELECT TABLE_NAME FROM information_schema.tables WHERE table_schema = DATABASE()`;
    const result: Record<string, unknown> = {};
    for (const { TABLE_NAME: table } of tables) {
      if (!/^[a-z_]+$/.test(table)) throw new Error('Nome de tabela inesperado.');
      result[table] = await tx.$queryRawUnsafe(`SELECT * FROM \`${table}\``);
    }
    return result;
  });
  const json = JSON.stringify(snapshot, (_key, value) => typeof value === 'bigint' ? value.toString() : value);
  const encrypted = execFileSync('powershell.exe', ['-NoProfile', '-Command', "Add-Type -AssemblyName System.Security; $backupBytes = [Text.Encoding]::UTF8.GetBytes([Console]::In.ReadToEnd()); [Convert]::ToBase64String([Security.Cryptography.ProtectedData]::Protect($backupBytes, $null, [Security.Cryptography.DataProtectionScope]::CurrentUser))"], { input: json, encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
  mkdirSync('.local', { recursive: true });
  const file = `.local/backup-${new Date().toISOString().replace(/[:.]/g, '-')}.dpapi`;
  writeFileSync(file, encrypted.trim());
  console.log(`Cópia criptografada: ${file}`);
} finally { await db.$disconnect(); }
