import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { AppError } from '../errors.js';

const options = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
const derive = (password: string, salt: Buffer) => new Promise<Buffer>((resolve, reject) => {
  scrypt(password, salt, 64, options, (error, key) => error ? reject(error) : resolve(key));
});
export function validatePassword(password: string) {
  if (password.length < 12 || password.length > 128 || /^(.)\1+$/.test(password) || /^(123456|password|senha123)/i.test(password)) {
    throw new AppError(400, 'Use uma senha de 12 a 128 caracteres, evitando sequências comuns.');
  }
}
export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  return `scrypt$32768$8$3$${salt.toString('hex')}$${(await derive(password, salt)).toString('hex')}`;
}
export async function verifyPassword(password: string, encoded: string) {
  if (!/^scrypt\$32768\$8\$3\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(encoded)) return false;
  const parts = encoded.split('$');
  return timingSafeEqual(await derive(password, Buffer.from(parts[4], 'hex')), Buffer.from(parts[5], 'hex'));
}
// Same work for an unknown account; never authenticate legacy plaintext passwords.
export const dummyHash = `scrypt$32768$8$3$${'0'.repeat(32)}$${'0'.repeat(128)}`;
