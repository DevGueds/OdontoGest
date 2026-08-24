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
  unidade_id: number;
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

export const USERS_SEED: User[] = [
  {
    id: 1,
    email: "admin@saude.gov.br",
    senha: "123456",
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
          senhaHash: "123456",
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
      unidade_id: u.unidadeId || 1
    }));
  } catch (err) {}
  return inMemoryUsers;
}

export async function addUser(dados: Omit<User, 'id'>): Promise<User> {
  const emailNorm = dados.email.trim().toLowerCase();
  if (inMemoryUsers.some(u => u.email.toLowerCase() === emailNorm)) {
    throw new Error(`E-mail "${dados.email}" já está cadastrado.`);
  }

  try {
    const u = await prisma.usuario.create({
      data: {
        email: emailNorm,
        senhaHash: dados.senha || '123456',
        nome: dados.nome,
        funcao: dados.funcao || 'Profissional de Saúde',
        registro: dados.registro || '',
        perfil: dados.perfil as any,
        unidadeId: dados.unidade_id
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
      unidade_id: u.unidadeId || 1
    };
    inMemoryUsers.push(novo);
    return novo;
  } catch (err) {
    const nextId = inMemoryUsers.length ? Math.max(...inMemoryUsers.map(u => u.id)) + 1 : 1;
    const novo: User = {
      id: nextId,
      email: emailNorm,
      senha: dados.senha || '123456',
      nome: dados.nome,
      funcao: dados.funcao || 'Profissional de Saúde',
      registro: dados.registro || '',
      perfil: dados.perfil,
      unidade_id: dados.unidade_id
    };
    inMemoryUsers.push(novo);
    return novo;
  }
}

export async function updateUser(id: number, dados: Partial<User>): Promise<User> {
  try {
    const u = await prisma.usuario.update({
      where: { id: Number(id) },
      data: {
        ...(dados.nome && { nome: dados.nome }),
        ...(dados.email && { email: dados.email.trim().toLowerCase() }),
        ...(dados.senha && { senhaHash: dados.senha }),
        ...(dados.registro !== undefined && { registro: dados.registro }),
        ...(dados.funcao !== undefined && { funcao: dados.funcao }),
        ...(dados.perfil && { perfil: dados.perfil as any }),
        ...(dados.unidade_id && { unidadeId: dados.unidade_id })
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
      unidade_id: u.unidadeId || 1
    };
    if (idx !== -1) inMemoryUsers[idx] = alt;
    return alt;
  } catch (err) {
    const idx = inMemoryUsers.findIndex(u => u.id === Number(id));
    if (idx === -1) throw new Error("Usuário não encontrado.");

    inMemoryUsers[idx] = {
      ...inMemoryUsers[idx],
      ...dados
    };
    return inMemoryUsers[idx];
  }
}

export async function deleteUser(id: number): Promise<void> {
  try {
    await prisma.usuario.delete({
      where: { id: Number(id) }
    });
  } catch (err) {}
  inMemoryUsers = inMemoryUsers.filter(u => u.id !== Number(id));
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
        unidade_id: u.unidadeId || 1
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
      if (senha && u.senhaHash !== senha) {
        throw new Error("E-mail ou senha incorretos.");
      }

      return {
        id: u.id,
        email: u.email,
        senha: u.senhaHash,
        nome: u.nome,
        funcao: u.funcao || '',
        registro: u.registro || '',
        perfil: u.perfil as any,
        unidade_id: u.unidadeId || 1
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

  if (senha && user.senha && user.senha !== senha) {
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
