import crypto from 'crypto';
import { prisma } from '../db/prisma.js';

export interface User {
  id: number;
  email: string;
  senha?: string;
  nome: string;
  funcao: string;
  registro: string;
  perfil: 'SOLICITANTE' | 'GESTOR' | 'ADMINISTRADOR' | 'TECNICO';
  unidade_id: number | null;
}

export type SafeUser = Omit<User, 'senha'>;

export function sanitizeUser(u: User): SafeUser {
  const { senha, ...rest } = u;
  return rest;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHashOrPlaintext?: string): boolean {
  if (!storedHashOrPlaintext) return false;
  if (storedHashOrPlaintext.startsWith('scrypt:')) {
    const parts = storedHashOrPlaintext.split(':');
    if (parts.length !== 3) return false;
    const [, salt, expectedHashHex] = parts;
    const computedHash = crypto.scryptSync(password, salt, 64);
    const expectedBuffer = Buffer.from(expectedHashHex, 'hex');
    if (computedHash.length !== expectedBuffer.length) return false;
    return crypto.timingSafeEqual(computedHash, expectedBuffer);
  }
  // Legacy plaintext support with constant-time comparison
  const a = Buffer.from(password);
  const b = Buffer.from(storedHashOrPlaintext);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export interface Session {
  sessionId: string;
  userId: number;
  perfil: 'SOLICITANTE' | 'GESTOR' | 'ADMINISTRADOR' | 'TECNICO';
  createdAt: number;
  expiresAt: number;
}

export interface OAuthAuthCode {
  code: string;
  state: string;
  userId: number;
  codeChallenge: string;
  codeChallengeMethod: string;
  expiresAt: number;
}

const DEFAULT_ADMIN_HASH = hashPassword('123456');

export const USERS_SEED: User[] = [
  {
    id: 1,
    email: "admin@saude.gov.br",
    senha: DEFAULT_ADMIN_HASH,
    nome: "Dr. Roberto Sotillo (Administrador)",
    funcao: "Administrador Geral SMS",
    registro: "ADM/PA 001",
    perfil: "ADMINISTRADOR",
    unidade_id: 1
  }
];

let inMemoryUsers: User[] = [...USERS_SEED];

export const SESSIONS = new Map<string, Session>();
export const OAUTH_CODES = new Map<string, OAuthAuthCode>();

const MAX_SESSIONS = 5000;
const MAX_OAUTH_CODES = 1000;

// Periodic cleanup of expired sessions and oauth codes to prevent heap exhaustion
setInterval(() => {
  const now = Date.now();
  for (const [code, entry] of OAUTH_CODES.entries()) {
    if (now > entry.expiresAt) OAUTH_CODES.delete(code);
  }
  for (const [sid, sess] of SESSIONS.entries()) {
    if (now > sess.expiresAt) SESSIONS.delete(sid);
  }
}, 60_000).unref();

export async function getAllUsers(): Promise<User[]> {
  try {
    let list = await prisma.usuario.findMany();
    if (list.length === 0) {
      // Semear unidade SMS e Administrador padrao no MySQL caso a tabela esteja vazia
      let uni = await prisma.unidadeSaude.findFirst();
      if (!uni) {
        uni = await prisma.unidadeSaude.create({
          data: { nome: "SECRETARIA MUNICIPAL DE SAÚDE (SMS)", tipo: "SMS" }
        });
      }
      const admin = await prisma.usuario.create({
        data: {
          email: "admin@saude.gov.br",
          senhaHash: DEFAULT_ADMIN_HASH,
          nome: "Dr. Roberto Sotillo (Administrador)",
          funcao: "Administrador Geral SMS",
          registro: "ADM/PA 001",
          perfil: "ADMINISTRADOR" as any,
          unidadeId: uni.id
        }
      });
      list = [admin];
    }

    return list.map(u => ({
      id: u.id,
      email: u.email,
      senha: u.senhaHash,
      nome: u.nome,
      funcao: u.funcao || '',
      registro: u.registro || '',
      perfil: u.perfil as any,
      unidade_id: u.unidadeId ?? null
    }));
  } catch (err) {}
  return inMemoryUsers;
}

export async function addUser(dados: Omit<User, 'id'>): Promise<User> {
  const emailNorm = dados.email.trim().toLowerCase();
  if (inMemoryUsers.some(u => u.email.toLowerCase() === emailNorm)) {
    throw new Error(`E-mail "${dados.email}" já está cadastrado.`);
  }

  const senhaHashed = dados.senha ? (dados.senha.startsWith('scrypt:') ? dados.senha : hashPassword(dados.senha)) : DEFAULT_ADMIN_HASH;

  try {
    const u = await prisma.usuario.create({
      data: {
        email: emailNorm,
        senhaHash: senhaHashed,
        nome: dados.nome,
        funcao: dados.funcao || 'Profissional de Saúde',
        registro: dados.registro || '',
        perfil: dados.perfil as any,
        unidadeId: dados.unidade_id ?? null
      }
    });

    const novo: User = {
      id: u.id,
      email: u.email,
      senha: u.senhaHash,
      nome: u.nome,
      funcao: u.funcao || '',
      registro: u.registro || '',
      perfil: u.perfil as any,
      unidade_id: u.unidadeId ?? null
    };
    inMemoryUsers.push(novo);
    return novo;
  } catch (err) {
    const nextId = inMemoryUsers.length ? Math.max(...inMemoryUsers.map(u => u.id)) + 1 : 1;
    const novo: User = {
      id: nextId,
      email: emailNorm,
      senha: senhaHashed,
      nome: dados.nome,
      funcao: dados.funcao || 'Profissional de Saúde',
      registro: dados.registro || '',
      perfil: dados.perfil,
      unidade_id: dados.unidade_id ?? null
    };
    inMemoryUsers.push(novo);
    return novo;
  }
}

export async function updateUser(id: number, dados: Partial<User>): Promise<User> {
  const senhaHashed = dados.senha ? (dados.senha.startsWith('scrypt:') ? dados.senha : hashPassword(dados.senha)) : undefined;

  try {
    const u = await prisma.usuario.update({
      where: { id: Number(id) },
      data: {
        ...(dados.nome && { nome: dados.nome }),
        ...(dados.email && { email: dados.email.trim().toLowerCase() }),
        ...(senhaHashed && { senhaHash: senhaHashed }),
        ...(dados.registro !== undefined && { registro: dados.registro }),
        ...(dados.funcao !== undefined && { funcao: dados.funcao }),
        ...(dados.perfil && { perfil: dados.perfil as any }),
        ...(dados.unidade_id !== undefined && { unidadeId: dados.unidade_id })
      }
    });
    const idx = inMemoryUsers.findIndex(u => u.id === Number(id));
    const alt: User = {
      id: u.id,
      email: u.email,
      senha: u.senhaHash,
      nome: u.nome,
      funcao: u.funcao || '',
      registro: u.registro || '',
      perfil: u.perfil as any,
      unidade_id: u.unidadeId ?? null
    };
    if (idx !== -1) inMemoryUsers[idx] = alt;
    return alt;
  } catch (err) {
    const idx = inMemoryUsers.findIndex(u => u.id === Number(id));
    if (idx === -1) throw new Error("Usuário não encontrado.");

    inMemoryUsers[idx] = {
      ...inMemoryUsers[idx],
      ...dados,
      ...(senhaHashed && { senha: senhaHashed }),
      unidade_id: dados.unidade_id !== undefined ? dados.unidade_id : inMemoryUsers[idx].unidade_id
    };
    return inMemoryUsers[idx];
  }
}

export async function deleteUser(id: number): Promise<void> {
  const numId = Number(id);
  try {
    await prisma.usuario.delete({
      where: { id: numId }
    });
  } catch (err) {}

  inMemoryUsers = inMemoryUsers.filter(u => u.id !== numId);

  // Invalidate any active sessions for the deleted user immediately
  for (const [sessionId, session] of SESSIONS.entries()) {
    if (session.userId === numId) {
      SESSIONS.delete(sessionId);
    }
  }
}

export async function getUserById(userId: number): Promise<User | null> {
  try {
    const u = await prisma.usuario.findUnique({
      where: { id: Number(userId) }
    });
    if (u) {
      return {
        id: u.id,
        email: u.email,
        senha: u.senhaHash,
        nome: u.nome,
        funcao: u.funcao || '',
        registro: u.registro || '',
        perfil: u.perfil as any,
        unidade_id: u.unidadeId ?? null
      };
    }
  } catch (err) {
    // Fallback
  }
  return inMemoryUsers.find(u => u.id === Number(userId)) || null;
}

export async function authenticateUser(email: string, senha?: string): Promise<User> {
  const normalizedEmail = (email || '').trim().toLowerCase();

  try {
    const u = await prisma.usuario.findUnique({
      where: { email: normalizedEmail }
    });

    if (u) {
      if (!senha || !verifyPassword(senha, u.senhaHash)) {
        throw new Error("E-mail ou senha incorretos.");
      }

      // Upgrade legacy plaintext password to secure scrypt hash transparently
      if (!u.senhaHash.startsWith('scrypt:')) {
        const upgradedHash = hashPassword(senha);
        await prisma.usuario.update({
          where: { id: u.id },
          data: { senhaHash: upgradedHash }
        }).catch(() => {});
      }

      return {
        id: u.id,
        email: u.email,
        senha: u.senhaHash,
        nome: u.nome,
        funcao: u.funcao || '',
        registro: u.registro || '',
        perfil: u.perfil as any,
        unidade_id: u.unidadeId ?? null
      };
    }
  } catch (err: any) {
    if (err.message === "E-mail ou senha incorretos.") throw err;
  }

  // Fallback em memória se MySQL desconectado
  const user = inMemoryUsers.find(u => u.email.toLowerCase() === normalizedEmail);
  if (!user) {
    throw new Error("E-mail ou senha incorretos.");
  }

  if (!senha || !verifyPassword(senha, user.senha)) {
    throw new Error("E-mail ou senha incorretos.");
  }

  return user;
}

export async function createSession(userId: number): Promise<Session> {
  const sessionId = crypto.randomBytes(32).toString('hex');
  const user = await getUserById(userId);
  if (!user) throw new Error("Usuário não encontrado.");

  const now = Date.now();
  const expiresAt = now + 8 * 60 * 60 * 1000; // 8 Horas

  const session: Session = {
    sessionId,
    userId,
    perfil: user.perfil,
    createdAt: now,
    expiresAt
  };

  // Prevent unbounded heap growth
  if (SESSIONS.size >= MAX_SESSIONS) {
    const oldestKey = SESSIONS.keys().next().value;
    if (oldestKey) SESSIONS.delete(oldestKey);
  }

  SESSIONS.set(sessionId, session);
  return session;
}

export function getSession(sessionId: string): Session | undefined {
  const session = SESSIONS.get(sessionId);
  if (!session) return undefined;

  if (Date.now() > session.expiresAt) {
    SESSIONS.delete(sessionId);
    return undefined;
  }

  return session;
}

export function destroySession(sessionId: string): boolean {
  return SESSIONS.delete(sessionId);
}

export function generatePKCEChallenge(verifier: string): string {
  return crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
