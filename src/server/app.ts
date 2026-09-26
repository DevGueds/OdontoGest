import Fastify, { type FastifyRequest, type FastifyReply, type HTTPMethods } from 'fastify';
import cookie from '@fastify/cookie';
import csrf from '@fastify/csrf-protection';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import staticFiles from '@fastify/static';
import { randomUUID, createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { z, ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { getConfig } from './config.js';
import { prisma } from './db/prisma.js';
import { AppError } from './errors.js';
import { schemas, parseId } from './validation.js';
import { dataStore, type Page } from './data/store.js';
import { exportSql } from './data/export.js';
import { dataCache } from './cache.js';
import { getAllUsers, getUserById, authenticateUser, addUser, updateUser, deleteUser, changePassword, createSession, getSession, destroySession, pruneSessions, sessionLifetimeMs, type User } from './auth/store.js';

declare module 'fastify' { interface FastifyRequest { user?: User; auditId?: bigint } }
type Role = User['perfil'];
const all: Role[] = ['ADMINISTRADOR', 'GESTOR', 'SOLICITANTE', 'TECNICO'];
const management: Role[] = ['ADMINISTRADOR', 'GESTOR'];
const admin: Role[] = ['ADMINISTRADOR'];
const orderReaders: Role[] = ['ADMINISTRADOR', 'GESTOR', 'SOLICITANTE'];
const mutation = (method: string) => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
const routeId = (req: FastifyRequest) => parseId((req.params as { id: string }).id);
function unitScope(req: FastifyRequest) {
  if (req.user!.perfil !== 'SOLICITANTE') return undefined;
  if (!req.user!.unidade_id) throw new AppError(403, 'Solicitante sem unidade vinculada. Contate o administrador.');
  return req.user!.unidade_id;
}
const pageSchema = z.object({ after: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive().max(2147483647)).optional(), limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(200)).optional() }).strict();

export async function buildApp(options: { logger?: boolean } = {}) {
  const config = getConfig();
  const app = Fastify({ logger: options.logger === false ? false : { level: 'info', redact: ['req.headers.cookie', 'req.headers.authorization', 'req.headers["x-csrf-token"]'], serializers: { req: r => ({ method: r.method, url: r.url?.split('?')[0] }) } }, genReqId: () => randomUUID(), requestIdHeader: false, bodyLimit: 128 * 1024, requestTimeout: 30_000, connectionTimeout: 10_000, trustProxy: false });
  const cookieOptions = { path: '/', httpOnly: true, sameSite: 'strict' as const, secure: config.production, signed: true };
  await app.register(helmet, { contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'"], scriptSrcAttr: ["'none'"], styleSrc: ["'self'", "'unsafe-inline'"], fontSrc: ["'self'"], imgSrc: ["'self'", 'data:'], connectSrc: ["'self'"], frameSrc: ["'self'"], frameAncestors: ["'none'"], objectSrc: ["'none'"], baseUri: ["'none'"], formAction: ["'self'"], upgradeInsecureRequests: config.production ? [] : null } }, strictTransportSecurity: config.production ? { maxAge: 31536000 } : false, referrerPolicy: { policy: 'no-referrer' } });
  await app.register(cors, { origin: config.origins, credentials: true, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], allowedHeaders: ['Content-Type', 'X-CSRF-Token'], exposedHeaders: ['X-Next-Cursor'] });
  await app.register(cookie, { secret: config.secret });
  await app.register(csrf, { cookieKey: 'csrf_secret', cookieOpts: cookieOptions, getToken: req => String(req.headers['x-csrf-token'] || '') });
  await app.register(rateLimit, { max: 300, timeWindow: '1 minute', cache: 5000, errorResponseBuilder: () => ({ error: 'Muitas solicitações. Aguarde antes de tentar novamente.' }) });
  app.addHook('onRequest', async (req, reply) => {
    if (!req.url.startsWith('/api/')) return;
    reply.header('Cache-Control', 'no-store, private');
    if (req.headers.origin && !config.origins.includes(req.headers.origin)) throw new AppError(403, 'Origem não permitida.');
    if (mutation(req.method) && req.headers['sec-fetch-site'] === 'cross-site') throw new AppError(403, 'Requisição entre sites não permitida.');
    const publicRoute = ['/api/status', '/api/auth/csrf', '/api/auth/login'].includes(req.routeOptions.url || '');
    if (!publicRoute && req.routeOptions.url?.startsWith('/api/')) {
      const raw = req.cookies.session_id;
      const id = raw ? req.unsignCookie(raw).value : undefined;
      const session = getSession(id || undefined);
      const user = session ? await getUserById(session.userId) : null;
      if (!user) { destroySession(id || undefined); reply.clearCookie('session_id', { path: '/' }); throw new AppError(401, 'Sessão expirada. Faça login novamente.'); }
      req.user = user;
      if (user.senha_requer_troca && !['/api/auth/me', '/api/auth/password', '/api/auth/logout'].includes(req.routeOptions.url)) throw new AppError(403, 'Troque sua senha para continuar.');
    }
  });
  // Callback hook: csrfProtection sends errors itself, so never wrap it in an unresolved Promise.
  app.addHook('onRequest', (req, reply, done) => {
    if (req.url.startsWith('/api/') && mutation(req.method)) { app.csrfProtection(req, reply, done); return; }
    done();
  });
  app.addHook('onResponse', async (req, reply) => {
    if (!req.url.startsWith('/api/')) return;
    if (mutation(req.method) && reply.statusCode < 400) dataCache.clear();
    if (req.auditId || mutation(req.method) || reply.statusCode === 403 || req.routeOptions.url === '/api/export/sql') {
      const event = { actorId: req.user?.id ?? null, action: req.method, resource: (req.routeOptions.url || '/api/unknown').slice(0, 150), outcome: reply.statusCode, requestId: req.id };
      req.log.info({ audit: event }, 'security_event');
      try {
        if (req.auditId) await prisma.auditEvent.update({ where: { id: req.auditId }, data: { outcome: reply.statusCode } });
        else await prisma.auditEvent.create({ data: event });
      } catch { req.log.error({ requestId: req.id }, 'audit_persistence_failed'); }
    }
  });
  app.setErrorHandler((error, req, reply) => {
    let status = 500, message = 'Não foi possível concluir a operação.';
    if (error instanceof AppError) { status = error.statusCode; message = error.message; }
    else if (error instanceof ZodError) { status = 400; message = `Dados inválidos: ${[...new Set(error.issues.map(i => i.path.join('.') || 'corpo'))].slice(0, 5).join(', ')}.`; }
    else if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') { status = 409; message = 'Já existe um registro com estes dados únicos.'; }
      else if (error.code === 'P2003') { status = 409; message = 'Vínculo inexistente ou registro ainda utilizado por outros dados.'; }
      else if (error.code === 'P2025') { status = 404; message = 'Registro não encontrado.'; }
      else if (['P2034', 'P2028'].includes(error.code)) { status = 409; message = 'Conflito entre operações. Atualize os dados e tente novamente.'; }
      else { status = 503; message = 'Banco de dados indisponível. Tente novamente.'; }
    } else if (error instanceof Prisma.PrismaClientInitializationError) { status = 503; message = 'Banco de dados indisponível. Tente novamente.'; }
    else if (error instanceof Error && 'statusCode' in error && typeof error.statusCode === 'number' && error.statusCode >= 400 && error.statusCode < 500) { status = error.statusCode; message = status === 403 ? 'Validação CSRF falhou. Atualize a página.' : status === 429 ? 'Muitas solicitações. Aguarde antes de tentar novamente.' : 'Requisição inválida.'; }
    if (status >= 500) req.log.error({ requestId: req.id, errorType: error instanceof Error ? error.name : 'Error', code: (error as { code?: string }).code }, 'request_failed');
    reply.code(status).send({ error: message, requestId: req.id });
  });
  const access = (roles: Role[]) => async (req: FastifyRequest) => {
    if (!req.user || !roles.includes(req.user.perfil)) throw new AppError(403, 'Seu perfil não permite esta operação.');
    if (mutation(req.method) || req.routeOptions.url === '/api/export/sql') {
      // Persist an intent before writes; if the database/audit is unavailable, the mutation is blocked.
      const target = (req.params as { id?: string })?.id;
      const event = await prisma.auditEvent.create({ data: { actorId: req.user.id, action: req.method, resource: `${req.routeOptions.url}${target ? ` [${target}]` : ''}`.slice(0, 150), outcome: 0, requestId: req.id } });
      req.auditId = event.id;
    }
  };
  const sendSession = (req: FastifyRequest, reply: FastifyReply, user: User) => {
    const old = req.cookies.session_id ? req.unsignCookie(req.cookies.session_id).value : undefined;
    destroySession(old || undefined);
    const session = createSession(user.id);
    reply.setCookie('session_id', session.sessionId, { ...cookieOptions, maxAge: sessionLifetimeMs / 1000 });
    req.user = user;
    return { success: true, user, csrfToken: reply.generateCsrf() };
  };
  const attempts = new Map<string, { count: number; expires: number }>();
  app.get('/api/status', async () => { await prisma.$queryRaw`SELECT 1`; return { status: 'OK', system: 'OdontoGest' }; });
  app.get('/api/auth/csrf', async (_req, reply) => ({ csrfToken: reply.generateCsrf() }));
  app.post('/api/auth/login', { config: { rateLimit: { max: 15, timeWindow: '15 minutes' } } }, async (req, reply) => {
    const d = schemas.login.parse(req.body);
    const key = createHash('sha256').update(d.email.toLowerCase()).digest('hex');
    for (const [k, value] of attempts) if (value.expires < Date.now()) attempts.delete(k);
    if (attempts.size >= 5000) throw new AppError(429, 'Muitas tentativas. Aguarde antes de tentar novamente.');
    const value = attempts.get(key) || { count: 0, expires: Date.now() + 15 * 60_000 };
    if (value.count >= 10) throw new AppError(429, 'Muitas tentativas. Aguarde antes de tentar novamente.');
    value.count++; attempts.set(key, value);
    const user = await authenticateUser(d.email, d.senha);
    attempts.delete(key);
    return sendSession(req, reply, user);
  });
  app.get('/api/auth/me', async (req, reply) => ({ authenticated: true, user: req.user, csrfToken: reply.generateCsrf() }));
  app.post('/api/auth/password', { preHandler: access(all), config: { rateLimit: { max: 6, timeWindow: '15 minutes' } } }, async (req, reply) => {
    const d = schemas.password.parse(req.body); return sendSession(req, reply, await changePassword(req.user!.id, d.senha_atual, d.nova_senha));
  });
  app.post('/api/auth/logout', async (req, reply) => {
    destroySession(req.unsignCookie(req.cookies.session_id || '').value || undefined);
    reply.clearCookie('session_id', { path: '/' }).clearCookie('csrf_secret', { path: '/' });
    return { success: true };
  });
  const list = (url: string, roles: Role[], load: (req: FastifyRequest, page: Page) => Promise<{ id: number }[]>) => {
    app.get(url, { preHandler: access(roles) }, async (req, reply) => {
      const query = pageSchema.parse(req.query); const page = { limit: query.limit || 200, after: query.after };
      const key = `${url}:${req.user!.perfil}:${req.user!.unidade_id ?? 'none'}:${page.after || 0}:${page.limit}`;
      const rows = await dataCache.get(key, () => load(req, page));
      const data = rows.slice(0, page.limit);
      if (rows.length > page.limit) reply.header('X-Next-Cursor', data[data.length - 1].id);
      return data;
    });
  };
  list('/api/unidades', all, (req, p) => dataStore.getUnidades(p, unitScope(req)));
  list('/api/materiais', orderReaders, (_req, p) => dataStore.getMateriais(p));
  list('/api/pedidos', orderReaders, (req, p) => dataStore.getPedidos(p, unitScope(req)));
  list('/api/honorarios', management, (_req, p) => dataStore.getHonorarios(p));
  list('/api/equipamentos', all, (req, p) => dataStore.getEquipamentos(p, unitScope(req)));
  list('/api/chamados', all, (req, p) => dataStore.getChamados(p, unitScope(req), req.user!.perfil === 'TECNICO'));
  list('/api/entradas', management, (_req, p) => dataStore.getEntradas(p));
  app.get('/api/usuarios', { preHandler: access(admin) }, getAllUsers);
  const write = (method: HTTPMethods, url: string, roles: Role[], handler: (req: FastifyRequest) => Promise<unknown>) => app.route({ method, url, preHandler: access(roles), handler: async (req) => {
    const result = await handler(req); dataCache.clear(); return result ?? { success: true };
  } });
  write('POST', '/api/unidades', admin, req => dataStore.addUnidade(schemas.unidade.parse(req.body)));
  write('PUT', '/api/unidades/:id', admin, req => dataStore.updateUnidade(routeId(req), schemas.unidade.parse(req.body)));
  write('DELETE', '/api/unidades/:id', admin, req => dataStore.deleteUnidade(routeId(req)));
  write('POST', '/api/materiais', admin, req => dataStore.addMaterial(schemas.material.parse(req.body)));
  write('PUT', '/api/materiais/:id', admin, req => dataStore.updateMaterial(routeId(req), schemas.material.partial().parse(req.body)));
  write('PATCH', '/api/materiais/:id/estoque', admin, req => dataStore.atualizarEstoqueMaterial(routeId(req), schemas.estoque.parse(req.body)));
  write('DELETE', '/api/materiais/:id', admin, req => dataStore.deleteMaterial(routeId(req)));
  write('POST', '/api/pedidos', ['ADMINISTRADOR', 'SOLICITANTE'], req => {
    const d = schemas.pedido.parse(req.body); const scope = unitScope(req);
    if (scope !== undefined && d.unidade_emitente_id !== scope) throw new AppError(403, 'Pedido fora da unidade permitida.');
    return dataStore.salvarPedido({ ...d, responsavel_nome: req.user!.nome, responsavel_funcao: req.user!.funcao, responsavel_registro: req.user!.registro });
  });
  write('PUT', '/api/pedidos/:id/receber', admin, req => dataStore.confirmarRecebimento(routeId(req), schemas.receber.parse(req.body)));
  write('PUT', '/api/pedidos/:id/atender', admin, req => dataStore.atenderPedido(routeId(req), schemas.atender.parse(req.body).itensAtendidos));
  write('PUT', '/api/pedidos/:id/enviar', admin, req => dataStore.confirmarEnvio(routeId(req), schemas.enviar.parse(req.body)));
  write('PUT', '/api/pedidos/:id/cancelar', ['ADMINISTRADOR', 'SOLICITANTE'], req => dataStore.cancelarPedido(routeId(req), unitScope(req)));
  write('POST', '/api/honorarios', admin, req => dataStore.addHonorario(schemas.honorario.parse(req.body)));
  write('POST', '/api/equipamentos', admin, req => dataStore.addEquipamento(schemas.equipamento.parse(req.body)));
  write('PUT', '/api/equipamentos/:id', admin, req => dataStore.updateEquipamento(routeId(req), schemas.equipamento.partial().parse(req.body)));
  write('POST', '/api/chamados', ['ADMINISTRADOR', 'SOLICITANTE'], req => dataStore.addChamado(schemas.chamado.parse(req.body), unitScope(req)));
  write('PATCH', '/api/chamados/:id/status', ['ADMINISTRADOR', 'TECNICO'], req => dataStore.updateStatusChamado(routeId(req), schemas.status.parse(req.body)));
  write('PATCH', '/api/chamados/:id/aprovar', admin, req => dataStore.aprovarChamadoManutencao(routeId(req), schemas.aprovar.parse(req.body).aprovar));
  app.get('/api/manutencao/alertas-preventiva', { preHandler: access(orderReaders) }, req => dataCache.get(`preventiva:${unitScope(req) || 'all'}`, () => dataStore.verificarAlertasPreventiva(unitScope(req))));
  app.get('/api/financeiro/consolidacao', { preHandler: access(management) }, () => dataCache.get('financeiro', () => dataStore.getConsolidacaoFinanceiraMulticlinica()));
  write('POST', '/api/entradas', admin, req => dataStore.addEntrada(schemas.entrada.parse(req.body)));
  write('DELETE', '/api/entradas/:id', admin, req => dataStore.deleteEntrada(routeId(req)));
  write('POST', '/api/usuarios', admin, req => addUser(schemas.user.parse(req.body)));
  write('PUT', '/api/usuarios/:id', admin, req => updateUser(routeId(req), schemas.user.partial().parse(req.body)));
  write('DELETE', '/api/usuarios/:id', admin, req => { const id = routeId(req); if (id === req.user!.id) throw new AppError(409, 'Não é possível excluir sua própria conta.'); return deleteUser(id); });
  app.get('/api/export/sql', { preHandler: access(admin), config: { rateLimit: { max: 3, timeWindow: '1 minute' } } }, async (_req, reply) => {
    reply.type('text/sql; charset=utf-8').header('Content-Disposition', 'attachment; filename="odontogest-operacional.sql"'); return exportSql();
  });
  const staticPath = path.resolve('dist/public');
  if (existsSync(staticPath)) await app.register(staticFiles, { root: staticPath, prefix: '/', preCompressed: true, setHeaders: (reply, filePath) => { reply.header('Cache-Control', /[\\/]assets[\\/]/.test(filePath) ? 'public, max-age=31536000, immutable' : 'no-cache'); } });
  app.setNotFoundHandler((req, reply) => {
    if (!req.url.startsWith('/api') && req.method === 'GET' && existsSync(path.join(staticPath, 'index.html'))) return reply.header('Cache-Control', 'no-cache').sendFile('index.html');
    return reply.code(404).send({ error: 'Página ou endpoint não encontrado.' });
  });
  const cleanup = setInterval(pruneSessions, 60_000); cleanup.unref();
  app.addHook('onClose', async () => { clearInterval(cleanup); dataCache.clear(); });
  return app;
}
