import { randomBytes } from 'node:crypto';
import type { Usuario } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { AppError } from '../errors.js';
import { hashPassword, verifyPassword, validatePassword, dummyHash } from './password.js';
import type { Input } from '../validation.js';

export function publicUser(u: Omit<Usuario, 'senhaHash'>) {
  return { id: u.id, email: u.email, nome: u.nome, funcao: u.funcao || '', registro: u.registro || '', perfil: u.perfil, unidade_id: u.unidadeId, senha_requer_troca: u.senhaRequerTroca };
}
export type User = ReturnType<typeof publicUser>;
const publicSelect = { id: true, email: true, nome: true, funcao: true, registro: true, perfil: true, unidadeId: true, senhaRequerTroca: true, criadoEm: true, atualizadoEm: true } as const;
export const getAllUsers = async () => (await prisma.usuario.findMany({ select: publicSelect, orderBy: { nome: 'asc' } })).map(publicUser);
export async function getUserById(id: number) {
  const user = await prisma.usuario.findUnique({ where: { id }, select: publicSelect });
  return user ? publicUser(user) : null;
}
export async function addUser(data: Input<'user'>) {
  validatePassword(data.senha);
  return publicUser(await prisma.usuario.create({ data: {
    email: data.email.toLowerCase(), senhaHash: await hashPassword(data.senha), nome: data.nome,
    funcao: data.funcao, registro: data.registro, perfil: data.perfil, unidadeId: data.unidade_id,
    senhaRequerTroca: true,
  }, select: publicSelect }));
}
export async function updateUser(id: number, data: Partial<Input<'user'>>) {
  if (data.senha) validatePassword(data.senha);
  const senhaHash = data.senha ? await hashPassword(data.senha) : undefined;
  const updated = await prisma.$transaction(async tx => {
    // Serialize administrator changes to protect the last administrator, including concurrent changes.
    await tx.$queryRaw`SELECT id FROM usuarios WHERE perfil = 'ADMINISTRADOR' FOR UPDATE`;
    const existing = await tx.usuario.findUniqueOrThrow({ where: { id } });
    if (existing.perfil === 'ADMINISTRADOR' && data.perfil && data.perfil !== 'ADMINISTRADOR' && await tx.usuario.count({ where: { perfil: 'ADMINISTRADOR' } }) <= 1) {
      throw new AppError(409, 'Mantenha pelo menos um administrador.');
    }
    return tx.usuario.update({ where: { id }, data: {
      nome: data.nome, email: data.email?.toLowerCase(), senhaHash, funcao: data.funcao,
      registro: data.registro, perfil: data.perfil, unidadeId: data.unidade_id,
      ...(senhaHash ? { senhaRequerTroca: true } : {}),
    }, select: publicSelect });
  });
  revokeUserSessions(id);
  return publicUser(updated);
}
export async function deleteUser(id: number) {
  await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM usuarios WHERE perfil = 'ADMINISTRADOR' FOR UPDATE`;
    const existing = await tx.usuario.findUniqueOrThrow({ where: { id } });
    if (existing.perfil === 'ADMINISTRADOR' && await tx.usuario.count({ where: { perfil: 'ADMINISTRADOR' } }) <= 1) throw new AppError(409, 'Mantenha pelo menos um administrador.');
    await tx.usuario.delete({ where: { id } });
  });
  revokeUserSessions(id);
}
export async function authenticateUser(email: string, password: string) {
  const user = await prisma.usuario.findUnique({ where: { email: email.trim().toLowerCase() } });
  const valid = await verifyPassword(password, user?.senhaHash || dummyHash);
  if (!user || !valid) throw new AppError(401, 'E-mail ou senha incorretos.');
  return publicUser(user);
}
export async function changePassword(id: number, current: string, next: string) {
  validatePassword(next);
  const user = await prisma.usuario.findUniqueOrThrow({ where: { id } });
  if (!await verifyPassword(current, user.senhaHash)) throw new AppError(401, 'Senha atual incorreta.');
  if (current === next) throw new AppError(400, 'A nova senha deve ser diferente da atual.');
  const updated = await prisma.usuario.update({ where: { id, senhaHash: user.senhaHash }, data: { senhaHash: await hashPassword(next), senhaRequerTroca: false }, select: publicSelect });
  revokeUserSessions(id);
  return publicUser(updated);
}

export interface Session { sessionId: string; userId: number; createdAt: number; expiresAt: number; lastSeen: number }
const sessions = new Map<string, Session>();
const idleMs = 30 * 60_000;
export const sessionLifetimeMs = 8 * 60 * 60_000;
export function pruneSessions(now = Date.now()) {
  for (const [key, s] of sessions) if (s.expiresAt <= now || s.lastSeen + idleMs <= now) sessions.delete(key);
}
export function createSession(userId: number): Session {
  pruneSessions();
  const userSessions = [...sessions.values()].filter(s => s.userId === userId);
  while (userSessions.length >= 5) sessions.delete(userSessions.shift()!.sessionId);
  if (sessions.size >= 5000) throw new AppError(503, 'Limite de sessões atingido. Tente novamente em alguns minutos.');
  const now = Date.now();
  const session = { sessionId: randomBytes(32).toString('hex'), userId, createdAt: now, expiresAt: now + sessionLifetimeMs, lastSeen: now };
  sessions.set(session.sessionId, session);
  return session;
}
export function getSession(id?: string) {
  if (!id) return undefined;
  const session = sessions.get(id);
  if (!session) return undefined;
  if (session.expiresAt <= Date.now() || session.lastSeen + idleMs <= Date.now()) { sessions.delete(id); return undefined; }
  session.lastSeen = Date.now();
  return session;
}
export function destroySession(id?: string) { if (id) sessions.delete(id); }
export function revokeUserSessions(userId: number) { for (const [id, s] of sessions) if (s.userId === userId) sessions.delete(id); }
