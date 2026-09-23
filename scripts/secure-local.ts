import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { hashPassword } from '../src/server/auth/password.js';
import { execFileSync } from 'node:child_process';

const db = new PrismaClient();
try {
  let migrated = 0;
  for (const user of await db.usuario.findMany()) {
    if (user.senhaHash.startsWith('scrypt$')) continue;
    // Preserve access, but restrict these accounts to password change on next login.
    await db.usuario.update({ where: { id: user.id, senhaHash: user.senhaHash }, data: { senhaHash: await hashPassword(user.senhaHash), senhaRequerTroca: true } });
    migrated++;
  }
  if (!await db.usuario.count({ where: { perfil: 'ADMINISTRADOR' } })) {
    const unit = await db.unidadeSaude.findFirst({ orderBy: { id: 'asc' } });
    if (!unit) throw new Error('Cadastre uma unidade antes de preparar o administrador.');
    const email = 'admin@saude.gov.br';
    if (await db.usuario.findUnique({ where: { email } })) throw new Error('E-mail administrativo já utilizado. Revise o cadastro local.');
    const password = randomBytes(24).toString('base64url');
    mkdirSync('.local', { recursive: true });
    const file = '.local/primeiro-acesso-admin.txt';
    writeFileSync(file, `Acesso local temporário ao OdontoGest\nE-mail: ${email}\nSenha: ${password}\nTroque a senha ao entrar e exclua este arquivo após guardar o acesso.\n`, { flag: 'wx', mode: 0o600 });
    if (process.platform === 'win32') execFileSync('powershell.exe', ['-NoProfile', '-Command', "$credentialPath = (Resolve-Path -LiteralPath '.local/primeiro-acesso-admin.txt').Path; $credentialAcl = New-Object Security.AccessControl.FileSecurity; $credentialAcl.SetOwner([Security.Principal.WindowsIdentity]::GetCurrent().User); $credentialAcl.SetAccessRuleProtection($true, $false); $credentialRule = New-Object Security.AccessControl.FileSystemAccessRule([Security.Principal.WindowsIdentity]::GetCurrent().User, 'FullControl', 'Allow'); $credentialAcl.AddAccessRule($credentialRule); Set-Acl -LiteralPath $credentialPath -AclObject $credentialAcl"], { stdio: 'pipe' });
    await db.usuario.create({ data: { email, nome: 'Administrador', senhaHash: await hashPassword(password), perfil: 'ADMINISTRADOR', unidadeId: unit.id, senhaRequerTroca: true } });
    console.log(`Credencial inicial criada no arquivo local protegido ${file}`);
  }
  let env = readFileSync('.env', 'utf8');
  const entry = `COOKIE_SECRET=${randomBytes(48).toString('base64url')}`;
  env = /^COOKIE_SECRET=.*$/m.test(env) ? env.replace(/^COOKIE_SECRET=.*$/m, entry) : `${env.trimEnd()}\n${entry}\n`;
  writeFileSync('.env', env);
  console.log(`Senhas legadas protegidas: ${migrated}. Segredo de cookies rotacionado.`);
} finally { await db.$disconnect(); }
