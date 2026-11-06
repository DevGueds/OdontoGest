import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyCookie from '@fastify/cookie';
import fastifyCsrf from '@fastify/csrf-protection';
import fastifyStatic from '@fastify/static';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

import { USERS_SEED, SESSIONS, OAUTH_CODES, createSession, getSession, destroySession, generatePKCEChallenge, authenticateUser, getUserById, getAllUsers, addUser, updateUser, deleteUser, sanitizeUser } from './auth/store.js';
import { dataStore } from './data/store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isLanMode = process.env.HOST === '0.0.0.0' || process.argv.includes('--lan') || process.argv.includes('--host');
const isCloudOrProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.RAILWAY_ENVIRONMENT) || Boolean(process.env.PORT && process.env.PORT !== '3001');
const HOST = process.env.HOST || (isCloudOrProduction ? '0.0.0.0' : (isLanMode ? '0.0.0.0' : '127.0.0.1'));

const fastify = Fastify({
  trustProxy: true,
  logger: {
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'warn'),
    base: undefined // Remove hostname, pid e metadados internos do log
  }
});

const PORT = Number(process.env.PORT) || 3001;
const COOKIE_SECRET = process.env.COOKIE_SECRET || 'super-secret-key-pbs-saude-owasp-2026';

// Extend FastifyRequest type to include authenticated user
declare module 'fastify' {
  interface FastifyRequest {
    userSession?: {
      sessionId: string;
      userId: number;
      perfil: 'SOLICITANTE' | 'GESTOR' | 'ADMINISTRADOR' | 'TECNICO';
    };
  }
}

// Trusted origins for CORS
const ALLOWED_ORIGINS = new Set([
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001'
]);
if (process.env.APP_URL) {
  try {
    ALLOWED_ORIGINS.add(new URL(process.env.APP_URL).origin);
  } catch {}
}
if (process.env.RAILWAY_PUBLIC_DOMAIN) {
  ALLOWED_ORIGINS.add(`https://${process.env.RAILWAY_PUBLIC_DOMAIN}`);
  ALLOWED_ORIGINS.add(`http://${process.env.RAILWAY_PUBLIC_DOMAIN}`);
}
if (process.env.RAILWAY_STATIC_URL) {
  ALLOWED_ORIGINS.add(`https://${process.env.RAILWAY_STATIC_URL}`);
  ALLOWED_ORIGINS.add(`http://${process.env.RAILWAY_STATIC_URL}`);
}

// Verifica se a origem pertence a um domínio gerenciado na Railway
function isRailwayOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    const host = url.hostname;
    return host.endsWith('.railway.app') || host.endsWith('.up.railway.app');
  } catch {
    return false;
  }
}

// Verifica se a origem é um IP de rede local privada (RFC 1918)
function isLanOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    const host = url.hostname;
    return (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) ||
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(host)
    );
  } catch {
    return false;
  }
}

async function bootstrap() {
  // Executa migrações pendentes do Prisma se estiver rodando em produção/Railway
  if (process.env.DATABASE_URL && (process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT)) {
    try {
      const { execSync } = await import('child_process');
      fastify.log.info('Verificando migrações do banco de dados no Prisma...');
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    } catch (err: any) {
      fastify.log.warn({ msg: 'Aviso ao executar migrações do Prisma no bootstrap:', err: err?.message || err });
    }
  }

  // 1. CORS plugin with explicit origin allowlist
  await fastify.register(fastifyCors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin || ALLOWED_ORIGINS.has(origin) || isRailwayOrigin(origin)) {
        return cb(null, true);
      }
      // Se o servidor estiver escutando na rede local (0.0.0.0), permite requisições de IPs privados
      if (HOST === '0.0.0.0' && isLanOrigin(origin)) {
        return cb(null, true);
      }
      cb(new Error('Origem não permitida pela política CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  });

  // Security Headers
  fastify.addHook('onSend', async (_request, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'SAMEORIGIN');
  });

  // 2. Cookie plugin
  await fastify.register(fastifyCookie, {
    secret: COOKIE_SECRET,
    hook: 'onRequest'
  });

  // 3. CSRF Protection plugin (OWASP A01/A05 Double Submit Cookie Pattern)
  await fastify.register(fastifyCsrf, {
    cookieKey: 'XSRF-TOKEN',
    cookieOpts: {
      path: '/',
      httpOnly: false, // JS can read CSRF token to put in X-CSRF-Token header
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    },
    sessionPlugin: '@fastify/cookie'
  });

  // Serve static files (React SPA build)
  const distPublicPath = path.join(__dirname, '..', 'public');
  const fallbackPublicPath = path.join(__dirname, '..', '..', 'dist', 'public');
  const staticPath = fs.existsSync(distPublicPath) ? distPublicPath : fallbackPublicPath;

  if (fs.existsSync(staticPath)) {
    await fastify.register(fastifyStatic, {
      root: staticPath,
      prefix: '/'
    });
  }

  // Session Verification Helper Middleware
  const authenticate = async (req: FastifyRequest, reply: FastifyReply) => {
    const sessionId = req.cookies.session_id;
    if (!sessionId) {
      reply.status(401).send({ error: 'Não autenticado. Sessão ausente.' });
      return;
    }

    const session = getSession(sessionId);
    if (!session) {
      reply.clearCookie('session_id', { path: '/' });
      reply.status(401).send({ error: 'Sessão inválida ou expirada. Faça login novamente.' });
      return;
    }

    const user = await getUserById(session.userId);
    if (!user) {
      destroySession(sessionId);
      reply.clearCookie('session_id', { path: '/' });
      reply.status(401).send({ error: 'Conta de usuário desativada ou não encontrada.' });
      return;
    }

    req.userSession = session;
  };

  // RBAC Authorization Middleware (OWASP A01: Broken Access Control)
  const requireRoles = (roles: string[]) => {
    return async (req: FastifyRequest, reply: FastifyReply) => {
      await authenticate(req, reply);
      if (reply.sent) return;

      if (!req.userSession || !roles.includes(req.userSession.perfil)) {
        return reply.status(403).send({ 
          error: `Acesso negado. Esta operação requer perfil [${roles.join(', ')}].` 
        });
      }
    };
  };

  // Helper for safe client error messaging
  const sendClientError = (reply: FastifyReply, err: any, defaultMessage: string = 'Erro ao processar solicitação.') => {
    fastify.log.error(err);
    const msg = err?.message;
    const isSafeDomainMessage = typeof msg === 'string' && (
      msg.startsWith('E-mail') ||
      msg.startsWith('Acesso negado') ||
      msg.startsWith('Pedido') ||
      msg.startsWith('Usuário') ||
      msg.startsWith('Não') ||
      msg.startsWith('Material') ||
      msg.startsWith('Chamado') ||
      msg.startsWith('Estoque') ||
      msg.startsWith('Quantidade')
    );
    return reply.status(400).send({ error: isSafeDomainMessage ? msg : defaultMessage });
  };

  // CSRF Protection Hook on Mutative Requests (POST, PUT, PATCH, DELETE)
  fastify.addHook('onRequest', async (req, reply) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && req.url.startsWith('/api')) {
      // Exclude initial login / authorize from strict CSRF header check if starting session
      if (req.url === '/api/auth/login' || req.url === '/api/auth/token' || req.url === '/api/auth/authorize') {
        return;
      }
      try {
        await new Promise<void>((resolve, reject) => {
          fastify.csrfProtection(req, reply, (err?: Error) => {
            if (err) reject(err);
            else resolve();
          });
        });
      } catch (err) {
        reply.status(403).send({ error: 'Validação CSRF falhou. Cabeçalho X-CSRF-Token ausente ou inválido.' });
      }
    }
  });

  // =======================================================
  // ROTAS DE AUTENTICAÇÃO OAUTH 2.0 & SESSÃO (OWASP TOP 10)
  // =======================================================

  // Endpoint de Status da API
  fastify.get('/api/status', async () => {
    return {
      status: 'OK',
      system: 'OdontoGest',
      security: 'OWASP Top 10 Compliant (HttpOnly Cookies + CSRF + OAuth 2.0 PKCE)',
      timestamp: new Date().toISOString()
    };
  });

  // Obter Token CSRF
  fastify.get('/api/auth/csrf', async (req, reply) => {
    const token = reply.generateCsrf();
    return { csrfToken: token };
  });

  // OAuth 2.0 /authorize (Gerar Código de Autorização com PKCE) - Requer Sessão Autenticada
  fastify.get('/api/auth/authorize', async (req, reply) => {
    const sessionId = req.cookies.session_id;
    if (!sessionId) {
      return reply.status(401).send({ error: 'Autenticação prévia obrigatória para gerar código de autorização.' });
    }

    const session = getSession(sessionId);
    if (!session) {
      reply.clearCookie('session_id', { path: '/' });
      return reply.status(401).send({ error: 'Sessão inválida ou expirada.' });
    }

    const { state, code_challenge, code_challenge_method } = req.query as any;

    if (!code_challenge || code_challenge_method !== 'S256') {
      return reply.status(400).send({ error: 'Requisição OAuth inválida. Desafio PKCE (code_challenge com S256) é obrigatório.' });
    }

    // Bind strictly to authenticated session user ID (do not accept arbitrary query user_id)
    const userId = session.userId;
    const authCode = crypto.randomBytes(16).toString('hex');

    OAUTH_CODES.set(authCode, {
      code: authCode,
      state: state || '',
      userId,
      codeChallenge: code_challenge,
      codeChallengeMethod: code_challenge_method,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 Minutos
    });

    return {
      code: authCode,
      state: state || ''
    };
  });

  // OAuth 2.0 /token (Trocar Código por Sessão com validação PKCE)
  fastify.post('/api/auth/token', async (req, reply) => {
    const { grant_type, code, code_verifier } = req.body as any;

    if (grant_type !== 'authorization_code' || !code || !code_verifier) {
      return reply.status(400).send({ error: 'Parâmetros OAuth inválidos.' });
    }

    const oauthData = OAUTH_CODES.get(code);
    if (!oauthData || Date.now() > oauthData.expiresAt) {
      OAUTH_CODES.delete(code);
      return reply.status(400).send({ error: 'Código de autorização inválido ou expirado.' });
    }

    // Validar PKCE Verifier vs Challenge
    const expectedChallenge = generatePKCEChallenge(code_verifier);
    if (expectedChallenge !== oauthData.codeChallenge) {
      OAUTH_CODES.delete(code);
      return reply.status(401).send({ error: 'Falha na verificação PKCE. code_verifier incorreto.' });
    }

    OAUTH_CODES.delete(code);
    const session = await createSession(oauthData.userId);

    // Definir Cookie HttpOnly de Sessão
    reply.setCookie('session_id', session.sessionId, {
      path: '/',
      httpOnly: true, // Impedir acesso via JavaScript (Mitigação XSS)
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });

    // Gerar token CSRF para a sessão
    const csrfToken = reply.generateCsrf();

    const user = await getUserById(session.userId);
    return {
      success: true,
      user: user ? sanitizeUser(user) : null,
      csrfToken
    };
  });

  // Login Seguro com E-mail e Senha (Identificação Automática do Perfil)
  fastify.post('/api/auth/login', async (req, reply) => {
    const { email, senha } = req.body as any;

    if (!email || !senha) {
      return reply.status(400).send({ error: 'Por favor, informe o e-mail e a senha.' });
    }

    try {
      const user = await authenticateUser(email, senha);
      const session = await createSession(user.id);

      // Cookie de Sessão HttpOnly
      reply.setCookie('session_id', session.sessionId, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      });

      const csrfToken = reply.generateCsrf();

      return {
        success: true,
        user: sanitizeUser(user),
        csrfToken
      };
    } catch (err: any) {
      return reply.status(401).send({ error: err.message || 'E-mail ou senha incorretos.' });
    }
  });

  // Obter dados do usuário logado na sessão
  fastify.get('/api/auth/me', async (req, reply) => {
    const sessionId = req.cookies.session_id;
    if (!sessionId) {
      return reply.status(401).send({ authenticated: false });
    }

    const session = getSession(sessionId);
    if (!session) {
      reply.clearCookie('session_id', { path: '/' });
      return reply.status(401).send({ authenticated: false });
    }

    const user = await getUserById(session.userId);
    if (!user) {
      destroySession(sessionId);
      reply.clearCookie('session_id', { path: '/' });
      return reply.status(401).send({ authenticated: false });
    }

    const csrfToken = reply.generateCsrf();

    return {
      authenticated: true,
      user: sanitizeUser(user),
      csrfToken
    };
  });

  // Logout
  fastify.post('/api/auth/logout', async (req, reply) => {
    const sessionId = req.cookies.session_id;
    if (sessionId) {
      destroySession(sessionId);
    }

    reply.clearCookie('session_id', { path: '/' });
    reply.clearCookie('XSRF-TOKEN', { path: '/' });

    return { success: true, message: 'Sessão encerrada com sucesso.' };
  });

  // =======================================================
  // ROTAS REST DE DADOS (PROTEGIDAS COM SESSÃO & CSRF)
  // =======================================================

  // Unidades
  fastify.get('/api/unidades', { preHandler: [authenticate] }, async () => {
    return await dataStore.getUnidades();
  });

  fastify.post('/api/unidades', { preHandler: [requireRoles(['ADMINISTRADOR'])] }, async (req, reply) => {
    const { nome, tipo } = req.body as any;
    try {
      const nova = await dataStore.addUnidade(nome, tipo);
      return nova;
    } catch (err: any) {
      return sendClientError(reply, err);
    }
  });

  fastify.put('/api/unidades/:id', { preHandler: [requireRoles(['ADMINISTRADOR'])] }, async (req, reply) => {
    const { id } = req.params as any;
    const { nome, tipo } = req.body as any;
    try {
      const u = await dataStore.updateUnidade(Number(id), nome, tipo);
      return u;
    } catch (err: any) {
      return sendClientError(reply, err);
    }
  });

  fastify.delete('/api/unidades/:id', { preHandler: [requireRoles(['ADMINISTRADOR'])] }, async (req, reply) => {
    const { id } = req.params as any;
    try {
      await dataStore.deleteUnidade(Number(id));
      return { success: true };
    } catch (err: any) {
      return sendClientError(reply, err);
    }
  });

  // Materiais
  fastify.get('/api/materiais', { preHandler: [authenticate] }, async () => {
    return await dataStore.getMateriais();
  });

  fastify.post('/api/materiais', { preHandler: [requireRoles(['ADMINISTRADOR', 'GESTOR'])] }, async (req, reply) => {
    const { descricao, unidade_medida, valor_estimado, qtd_estoque, limite_max_pedido, fornecedor } = req.body as any;
    try {
      const novo = await dataStore.addMaterial(descricao, unidade_medida, valor_estimado, qtd_estoque, limite_max_pedido, fornecedor);
      return novo;
    } catch (err: any) {
      return sendClientError(reply, err);
    }
  });

  fastify.put('/api/materiais/:id', { preHandler: [requireRoles(['ADMINISTRADOR', 'GESTOR'])] }, async (req, reply) => {
    const { id } = req.params as any;
    try {
      const mat = await dataStore.updateMaterial(Number(id), req.body as any);
      return mat;
    } catch (err: any) {
      return sendClientError(reply, err);
    }
  });

  fastify.patch('/api/materiais/:id/estoque', { preHandler: [requireRoles(['ADMINISTRADOR', 'GESTOR'])] }, async (req, reply) => {
    const { id } = req.params as any;
    const { qtd_estoque } = req.body as any;
    try {
      const mat = await dataStore.atualizarEstoqueMaterial(Number(id), Number(qtd_estoque));
      return mat;
    } catch (err: any) {
      return sendClientError(reply, err);
    }
  });

  fastify.delete('/api/materiais/:id', { preHandler: [requireRoles(['ADMINISTRADOR', 'GESTOR'])] }, async (req, reply) => {
    const { id } = req.params as any;
    try {
      await dataStore.deleteMaterial(Number(id));
      return { success: true };
    } catch (err: any) {
      return sendClientError(reply, err);
    }
  });

  // Pedidos
  fastify.get('/api/pedidos', { preHandler: [authenticate] }, async (req) => {
    const session = req.userSession!;
    const { unidade_id } = req.query as any;
    let pedidos = await dataStore.getPedidos();

    // Se o perfil for SOLICITANTE, filtra estritamente pela sua unidade vinculada
    if (session.perfil === 'SOLICITANTE') {
      const user = await getUserById(session.userId);
      if (user?.unidade_id) {
        return pedidos.filter(p => p.unidade_emitente_id === user.unidade_id);
      }
      return [];
    }

    if (unidade_id && unidade_id !== 'TODAS') {
      pedidos = pedidos.filter(p => p.unidade_emitente_id === Number(unidade_id));
    }
    return pedidos;
  });

  fastify.post('/api/pedidos', { preHandler: [authenticate] }, async (req, reply) => {
    try {
      const session = req.userSession!;
      const body = req.body as any;
      if (session.perfil === 'SOLICITANTE') {
        const user = await getUserById(session.userId);
        if (!user?.unidade_id) {
          return reply.status(403).send({ error: 'Usuário solicitante não está vinculado a nenhuma unidade de saúde.' });
        }
        // Garante integridade: o solicitante só pode emitir para a sua própria unidade
        body.unidade_emitente_id = user.unidade_id;
      }
      const novo = await dataStore.salvarPedido(body);
      return novo;
    } catch (err: any) {
      return sendClientError(reply, err);
    }
  });

  fastify.put('/api/pedidos/:id/receber', { preHandler: [requireRoles(['ADMINISTRADOR', 'GESTOR'])] }, async (req, reply) => {
    const { id } = req.params as any;
    const { apontador_recebimento_nome, data_recebimento } = req.body as any;
    try {
      const ped = await dataStore.confirmarRecebimento(Number(id), apontador_recebimento_nome, data_recebimento);
      return ped;
    } catch (err: any) {
      return sendClientError(reply, err);
    }
  });

  fastify.put('/api/pedidos/:id/atender', { preHandler: [requireRoles(['ADMINISTRADOR', 'GESTOR'])] }, async (req, reply) => {
    const { id } = req.params as any;
    const { itensAtendidos } = req.body as any;
    try {
      const ped = await dataStore.atenderPedido(Number(id), itensAtendidos);
      return ped;
    } catch (err: any) {
      return sendClientError(reply, err);
    }
  });

  fastify.put('/api/pedidos/:id/enviar', { preHandler: [requireRoles(['ADMINISTRADOR', 'GESTOR'])] }, async (req, reply) => {
    const { id } = req.params as any;
    const { apontador_envio_nome, data_envio } = req.body as any;
    try {
      const ped = await dataStore.confirmarEnvio(Number(id), apontador_envio_nome, data_envio);
      return ped;
    } catch (err: any) {
      return sendClientError(reply, err);
    }
  });

  fastify.put('/api/pedidos/:id/cancelar', { preHandler: [requireRoles(['SOLICITANTE', 'ADMINISTRADOR', 'GESTOR'])] }, async (req, reply) => {
    const { id } = req.params as any;
    const session = req.userSession!;
    try {
      const pedidos = await dataStore.getPedidos();
      const pedido = pedidos.find(p => p.id === Number(id));
      if (!pedido) {
        return reply.status(404).send({ error: 'Pedido não encontrado.' });
      }

      if (session.perfil === 'SOLICITANTE') {
        const user = await getUserById(session.userId);
        if (!user?.unidade_id || pedido.unidade_emitente_id !== user.unidade_id) {
          return reply.status(403).send({ error: 'Acesso negado. Você só pode cancelar pedidos da sua unidade.' });
        }
      }

      const ped = await dataStore.cancelarPedido(Number(id));
      return ped;
    } catch (err: any) {
      return sendClientError(reply, err);
    }
  });

  // Honorários & Salários Odontológicos
  fastify.get('/api/honorarios', { preHandler: [authenticate] }, async () => {
    return await dataStore.getHonorarios();
  });

  fastify.post('/api/honorarios', { preHandler: [requireRoles(['ADMINISTRADOR'])] }, async (req, reply) => {
    try {
      return await dataStore.addHonorario(req.body as any);
    } catch (err: any) {
      return sendClientError(reply, err);
    }
  });

  fastify.put('/api/honorarios/:id', { preHandler: [requireRoles(['ADMINISTRADOR'])] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      return await dataStore.updateHonorario(Number(id), req.body as any);
    } catch (err: any) {
      return sendClientError(reply, err);
    }
  });

  fastify.delete('/api/honorarios/:id', { preHandler: [requireRoles(['ADMINISTRADOR'])] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      await dataStore.deleteHonorario(Number(id));
      return { success: true };
    } catch (err: any) {
      return sendClientError(reply, err);
    }
  });

  // Equipamentos
  fastify.get('/api/equipamentos', { preHandler: [authenticate] }, async () => {
    return await dataStore.getEquipamentos();
  });

  fastify.post('/api/equipamentos', { preHandler: [requireRoles(['ADMINISTRADOR', 'GESTOR'])] }, async (req, reply) => {
    try {
      return await dataStore.addEquipamento(req.body as any);
    } catch (err: any) {
      return sendClientError(reply, err);
    }
  });

  fastify.put('/api/equipamentos/:id', { preHandler: [requireRoles(['ADMINISTRADOR', 'GESTOR'])] }, async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      return await dataStore.updateEquipamento(Number(id), req.body as any);
    } catch (err: any) {
      return sendClientError(reply, err);
    }
  });

  // Chamados de Manutenção Corretiva & Preventiva
  fastify.get('/api/chamados', { preHandler: [authenticate] }, async () => {
    return await dataStore.getChamados();
  });

  fastify.post('/api/chamados', { preHandler: [authenticate] }, async (req, reply) => {
    try {
      const session = req.userSession!;
      const body = req.body as any;
      if (session.perfil === 'SOLICITANTE') {
        const user = await getUserById(session.userId);
        if (!user?.unidade_id) {
          return reply.status(403).send({ error: 'Usuário solicitante não está vinculado a uma unidade.' });
        }
        body.unidade_id = user.unidade_id;
      }
      return await dataStore.addChamado(body);
    } catch (err: any) {
      return sendClientError(reply, err);
    }
  });

  fastify.patch('/api/chamados/:id/status', { preHandler: [requireRoles(['ADMINISTRADOR', 'GESTOR', 'TECNICO'])] }, async (req, reply) => {
    const { id } = req.params as any;
    const { status, custo_reparo } = req.body as any;
    try {
      return await dataStore.updateStatusChamado(Number(id), status, custo_reparo);
    } catch (err: any) {
      return sendClientError(reply, err);
    }
  });

  fastify.patch('/api/chamados/:id/aprovar', { preHandler: [requireRoles(['ADMINISTRADOR', 'GESTOR'])] }, async (req, reply) => {
    const { id } = req.params as any;
    const { aprovar } = req.body as any;
    try {
      return await dataStore.aprovarChamadoManutencao(Number(id), aprovar !== false);
    } catch (err: any) {
      return sendClientError(reply, err);
    }
  });

  // Regra Automatizada de Alertas de Manutenção Preventiva
  fastify.get('/api/manutencao/alertas-preventiva', { preHandler: [authenticate] }, async () => {
    return dataStore.verificarAlertasPreventiva();
  });

  // Consolidação Financeira Multiclínica
  fastify.get('/api/financeiro/consolidacao', { preHandler: [authenticate] }, async () => {
    return dataStore.getConsolidacaoFinanceiraMulticlinica();
  });

  // Entradas & Aportes Financeiros
  fastify.get('/api/entradas', { preHandler: [authenticate] }, async () => {
    return await dataStore.getEntradas();
  });

  fastify.post('/api/entradas', { preHandler: [requireRoles(['ADMINISTRADOR'])] }, async (req, reply) => {
    try {
      return await dataStore.addEntrada(req.body as any);
    } catch (err: any) {
      return sendClientError(reply, err);
    }
  });

  fastify.delete('/api/entradas/:id', { preHandler: [requireRoles(['ADMINISTRADOR'])] }, async (req, reply) => {
    const { id } = req.params as any;
    try {
      await dataStore.deleteEntrada(Number(id));
      return { success: true };
    } catch (err: any) {
      return sendClientError(reply, err);
    }
  });

  // Gerenciamento de Usuários (Administrador e Gestor para consulta de profissionais)
  fastify.get('/api/usuarios', { preHandler: [requireRoles(['ADMINISTRADOR', 'GESTOR'])] }, async () => {
    const users = await getAllUsers();
    return users.map(u => sanitizeUser(u));
  });

  fastify.post('/api/usuarios', { preHandler: [requireRoles(['ADMINISTRADOR'])] }, async (req, reply) => {
    try {
      const u = await addUser(req.body as any);
      return sanitizeUser(u);
    } catch (err: any) {
      return sendClientError(reply, err);
    }
  });

  fastify.put('/api/usuarios/:id', { preHandler: [requireRoles(['ADMINISTRADOR'])] }, async (req, reply) => {
    const { id } = req.params as any;
    try {
      const u = await updateUser(Number(id), req.body as any);
      return sanitizeUser(u);
    } catch (err: any) {
      return sendClientError(reply, err);
    }
  });

  fastify.delete('/api/usuarios/:id', { preHandler: [requireRoles(['ADMINISTRADOR'])] }, async (req, reply) => {
    const { id } = req.params as any;
    try {
      await deleteUser(Number(id));
      return { success: true };
    } catch (err: any) {
      return sendClientError(reply, err);
    }
  });

  // Exportar DUMP SQL (Exclusivo Administrador)
  fastify.get('/api/export/sql', { preHandler: [requireRoles(['ADMINISTRADOR'])] }, async (req, reply) => {
    const sql = await dataStore.exportarSQL();
    reply.header('Content-Type', 'text/sql');
    reply.header('Content-Disposition', `attachment; filename=almoxarifado_saude_dump_${new Date().toISOString().substring(0, 10)}.sql`);
    return sql;
  });

  // SPA Fallback Handler
  fastify.setNotFoundHandler((req, reply) => {
    if (req.url.startsWith('/api')) {
      reply.status(404).send({ error: 'Endpoint da API não encontrado.' });
    } else if (fs.existsSync(path.join(staticPath, 'index.html'))) {
      reply.sendFile('index.html');
    } else {
      reply.status(404).send('Página não encontrada');
    }
  });

  try {
    await fastify.listen({ port: PORT, host: HOST });
    const isLocalOnly = HOST === '127.0.0.1';
    console.log(`\n🚀 OdontoGest Backend rodando em http://${isLocalOnly ? 'localhost' : HOST}:${PORT}`);
    if (isLocalOnly) {
      console.log(`🔒 Modo Seguro Ativo: acessível apenas nesta máquina (127.0.0.1).`);
      console.log(`💡 Para permitir acesso de outras pessoas na mesma rede Wi-Fi, use: npm run dev:lan\n`);
    } else {
      console.log(`🌐 Modo Rede Local (LAN) Ativo: acessível por dispositivos na mesma rede.`);
      console.log(`⚠️ Certifique-se de estar conectado em uma rede Wi-Fi confiável.\n`);
    }
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

bootstrap();



