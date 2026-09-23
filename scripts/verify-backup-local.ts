import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const file = process.argv[2];
if (!file?.endsWith('.dpapi')) throw new Error('Informe o arquivo .dpapi gerado pelo backup local.');
const json = execFileSync('powershell.exe', ['-NoProfile', '-Command', "Add-Type -AssemblyName System.Security; $backupCipher = [Convert]::FromBase64String([Console]::In.ReadToEnd().Trim()); [Text.Encoding]::UTF8.GetString([Security.Cryptography.ProtectedData]::Unprotect($backupCipher, $null, [Security.Cryptography.DataProtectionScope]::CurrentUser))"], { input: readFileSync(file, 'utf8'), encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
const tables = JSON.parse(json) as Record<string, unknown[]>;
console.log(JSON.stringify({ readable: true, rows: Object.fromEntries(Object.entries(tables).map(([table, rows]) => [table, rows.length])) }));
