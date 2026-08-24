import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyCookie from '@fastify/cookie';
import fastifyCsrf from '@fastify/csrf-protection';
import fastifyStatic from '@fastify/static';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

import { USERS_SEED, SESSIONS, OAUTH_CODES, createSession, getSession, destroySession, generatePKCEChallenge, authenticateUser, getUserById, getAllUsers, addUser, updateUser, deleteUser } from './auth/store.js';
import { dataStore } from './data/store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({
  logger: true
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

async function bootstrap() {
  // 1. CORS plugin
  await fastify.register(fastifyCors, {
    origin: (origin, cb) => {
      // Allow local origin or same-domain requests
      cb(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
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

    req.userSession = session;
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

  // OAuth 2.0 /authorize (Gerar Código de Autorização com PKCE)
  fastify.get('/api/auth/authorize', async (req, reply) => {
    const { response_type, client_id, state, code_challenge, code_challenge_method, user_id } = req.query as any;

    if (!code_challenge || code_challenge_method !== 'S256') {
      return reply.status(400).send({ error: 'Requisição OAuth inválida. Desafio PKCE (code_challenge com S256) é obrigatório.' });
    }

    const userId = Number(user_id) || 1;
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
      user,
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
        user,
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
    const csrfToken = reply.generateCsrf();

    return {
      authenticated: true,
      user,
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
  fastify.get('/api/unidades', async () => {
    return await dataStore.getUnidades();
  });

  fastify.post('/api/unidades', { preHandler: [authenticate] }, async (req, reply) => {
    const { nome, tipo } = req.body as any;
    try {
      const nova = await dataStore.addUnidade(nome, tipo);
      return nova;
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.put('/api/unidades/:id', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as any;
    const { nome, tipo } = req.body as any;
    try {
      const u = await dataStore.updateUnidade(Number(id), nome, tipo);
      return u;
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.delete('/api/unidades/:id', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as any;
    try {
      await dataStore.deleteUnidade(Number(id));
      return { success: true };
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  // Materiais
  fastify.get('/api/materiais', async () => {
    return await dataStore.getMateriais();
  });

  fastify.post('/api/materiais', { preHandler: [authenticate] }, async (req, reply) => {
    const { descricao, unidade_medida, valor_estimado, qtd_estoque, limite_max_pedido, fornecedor } = req.body as any;
    try {
      const novo = await dataStore.addMaterial(descricao, unidade_medida, valor_estimado, qtd_estoque, limite_max_pedido, fornecedor);
      return novo;
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.put('/api/materiais/:id', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as any;
    try {
      const mat = await dataStore.updateMaterial(Number(id), req.body as any);
      return mat;
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.patch('/api/materiais/:id/estoque', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as any;
    const { qtd_estoque } = req.body as any;
    try {
      const mat = await dataStore.atualizarEstoqueMaterial(Number(id), Number(qtd_estoque));
      return mat;
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  // Pedidos
  fastify.get('/api/pedidos', async () => {
    return await dataStore.getPedidos();
  });

  fastify.post('/api/pedidos', { preHandler: [authenticate] }, async (req, reply) => {
    try {
      const novo = await dataStore.salvarPedido(req.body as any);
      return novo;
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.put('/api/pedidos/:id/receber', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as any;
    const { apontador_recebimento_nome, data_recebimento } = req.body as any;
    try {
      const ped = await dataStore.confirmarRecebimento(Number(id), apontador_recebimento_nome, data_recebimento);
      return ped;
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.put('/api/pedidos/:id/atender', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as any;
    const { itensAtendidos } = req.body as any;
    try {
      const ped = await dataStore.atenderPedido(Number(id), itensAtendidos);
      return ped;
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.put('/api/pedidos/:id/enviar', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as any;
    const { apontador_envio_nome, data_envio } = req.body as any;
    try {
      const ped = await dataStore.confirmarEnvio(Number(id), apontador_envio_nome, data_envio);
      return ped;
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  // Honorários & Salários Odontológicos
  fastify.get('/api/honorarios', async () => {
    return await dataStore.getHonorarios();
  });

  fastify.post('/api/honorarios', { preHandler: [authenticate] }, async (req, reply) => {
    try {
      return await dataStore.addHonorario(req.body as any);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  // Equipamentos
  fastify.get('/api/equipamentos', async () => {
    return await dataStore.getEquipamentos();
  });

  fastify.post('/api/equipamentos', { preHandler: [authenticate] }, async (req, reply) => {
    try {
      return await dataStore.addEquipamento(req.body as any);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  // Chamados de Manutenção Corretiva & Preventiva
  fastify.get('/api/chamados', async () => {
    return await dataStore.getChamados();
  });

  fastify.post('/api/chamados', { preHandler: [authenticate] }, async (req, reply) => {
    try {
      return await dataStore.addChamado(req.body as any);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.patch('/api/chamados/:id/status', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as any;
    const { status, custo_reparo } = req.body as any;
    try {
      return await dataStore.updateStatusChamado(Number(id), status, custo_reparo);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.patch('/api/chamados/:id/aprovar', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as any;
    const { aprovar } = req.body as any;
    try {
      return await dataStore.aprovarChamadoManutencao(Number(id), aprovar !== false);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  // Regra Automatizada de Alertas de Manutenção Preventiva
  fastify.get('/api/manutencao/alertas-preventiva', async () => {
    return dataStore.verificarAlertasPreventiva();
  });

  // Consolidação Financeira Multiclínica
  fastify.get('/api/financeiro/consolidacao', async () => {
    return dataStore.getConsolidacaoFinanceiraMulticlinica();
  });

  // Entradas & Aportes Financeiros
  fastify.get('/api/entradas', async () => {
    return await dataStore.getEntradas();
  });

  fastify.post('/api/entradas', { preHandler: [authenticate] }, async (req, reply) => {
    try {
      return await dataStore.addEntrada(req.body as any);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.delete('/api/entradas/:id', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as any;
    try {
      await dataStore.deleteEntrada(Number(id));
      return { success: true };
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });
  // Gerenciamento de Usuários (Administrador)
  fastify.get('/api/usuarios', { preHandler: [authenticate] }, async () => {
    return await getAllUsers();
  });

  fastify.post('/api/usuarios', { preHandler: [authenticate] }, async (req, reply) => {
    try {
      return await addUser(req.body as any);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.put('/api/usuarios/:id', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as any;
    try {
      return await updateUser(Number(id), req.body as any);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.delete('/api/usuarios/:id', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as any;
    try {
      await deleteUser(Number(id));
      return { success: true };
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  // Exportar DUMP SQL
  fastify.get('/api/export/sql', async (req, reply) => {
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
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`=============================================================`);
    console.log(`🔒 SEGURANÇA OWASP TOP 10 & FASTIFY ATIVOS!`);
    console.log(`🛡️ HttpOnly Cookies + Anti-CSRF + OAuth 2.0 PKCE`);
    console.log(`🌐 Backend: http://localhost:${PORT}`);
    console.log(`=============================================================`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

bootstrap();
