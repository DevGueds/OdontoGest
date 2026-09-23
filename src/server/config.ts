import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
if (existsSync('.env')) loadEnvFile('.env');
export function getConfig() {
  const production = process.env.NODE_ENV === 'production';
  const secret = process.env.COOKIE_SECRET || '';
  if (secret.length < 32 || secret === 'super-secret-key-pbs-saude-owasp-2026') throw new Error('Configure COOKIE_SECRET com pelo menos 32 caracteres aleatórios.');
  const origins = (process.env.APP_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001').split(',').map(s => s.trim());
  if (production && (!process.env.APP_ORIGINS || origins.some(o => !o.startsWith('https://')))) throw new Error('Em produção, APP_ORIGINS deve conter somente origens HTTPS explícitas.');
  for (const origin of origins) if (new URL(origin).origin !== origin) throw new Error('APP_ORIGINS deve conter origens sem caminhos.');
  return { secret, origins, production, port: Number(process.env.PORT || 3001), host: process.env.HOST || '127.0.0.1' };
}
