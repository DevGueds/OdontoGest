import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../../src/server/app.js';
import { prisma } from '../../src/server/db/prisma.js';
import { hashPassword } from '../../src/server/auth/password.js';
import type { FastifyInstance, HTTPMethods } from 'fastify';
import { chromium, expect } from '@playwright/test';
import { Prisma } from '@prisma/client';
import { dataCache } from '../../src/server/cache.js';

if (!/^odontogest_test_[a-f0-9]{12}$/.test(process.env.TEST_DATABASE || '') || new URL(process.env.DATABASE_URL!).pathname !== `/${process.env.TEST_DATABASE}`) throw new Error('Execute pelo comando npm run test:integration, em banco isolado.');
let app: FastifyInstance;
const password = 'Teste isolado 123!';
let unitA: number, unitB: number, materialId: number, otherMaterial: number;
type Client = { cookies: Record<string, string>; csrf: string; userId?: number; ip: string };
const clients: Record<string, Client> = {};
let ip = 1;
async function request(client: Client, method: HTTPMethods, url: string, payload?: object, extra: Record<string, string> = {}) {
  const response = await app.inject({ method, url, payload, remoteAddress: client.ip, headers: { cookie: Object.entries(client.cookies).map(([k,v]) => `${k}=${encodeURIComponent(v)}`).join('; '), 'x-csrf-token': client.csrf, origin: 'http://localhost:3000', ...extra } });
  for (const c of response.cookies) { if (!c.value) delete client.cookies[c.name]; else client.cookies[c.name] = c.value; }
  return response;
}
async function login(role: string) {
  const client = { cookies: {}, csrf: '', ip: `127.0.0.${++ip}` };
  client.csrf = (await request(client, 'GET', '/api/auth/csrf')).json().csrfToken;
  const res = await request(client, 'POST', '/api/auth/login', { email: `${role.toLowerCase()}@test.invalid`, senha: password });
  assert.equal(res.statusCode, 200, res.body);
  client.csrf = res.json().csrfToken;
  return { ...client, userId: res.json().user.id };
}
before(async () => {
  unitA = (await prisma.unidadeSaude.create({ data: { nome: 'Unidade A' } })).id;
  unitB = (await prisma.unidadeSaude.create({ data: { nome: 'Unidade B' } })).id;
  const senhaHash = await hashPassword(password);
  for (const perfil of ['ADMINISTRADOR', 'GESTOR', 'SOLICITANTE', 'TECNICO'] as const) await prisma.usuario.create({ data: { email: `${perfil.toLowerCase()}@test.invalid`, senhaHash, nome: perfil, perfil, unidadeId: unitA } });
  materialId = (await prisma.material.create({ data: { descricao: '<img src=x onerror="window.PWNED=1">', unidadeMedida: 'UN', qtdEstoque: 10, valorEstimado: '2.15', limiteMaxPedido: 10, natureza: 'INVESTIMENTO' } })).id;
  otherMaterial = (await prisma.material.create({ data: { descricao: 'Outro', unidadeMedida: 'UN', qtdEstoque: 0, valorEstimado: 3 } })).id;
  app = await buildApp({ logger: false });
  await app.ready();
  for (const role of ['ADMINISTRADOR', 'GESTOR', 'SOLICITANTE', 'TECNICO']) clients[role] = await login(role);
});
after(async () => { await app?.close(); await prisma.$disconnect(); });

test('all business endpoints require authentication; removed OAuth cannot create sessions', async () => {
  for (const url of ['/api/unidades', '/api/materiais', '/api/pedidos', '/api/honorarios', '/api/equipamentos', '/api/chamados', '/api/entradas', '/api/usuarios', '/api/export/sql', '/api/financeiro/consolidacao']) assert.equal((await app.inject({ url })).statusCode, 401, url);
  assert.equal((await app.inject({ url: '/api/auth/authorize?user_id=1&code_challenge=anything&code_challenge_method=S256' })).statusCode, 404);
  assert.ok((await app.inject({ method: 'POST', url: '/api/auth/token', payload: {} })).statusCode >= 400);
});
test('credentials never leave the API, cookies are signed/HttpOnly, errors and cache headers are safe', async () => {
  const me = await request(clients.ADMINISTRADOR, 'GET', '/api/auth/me');
  assert.equal(me.statusCode, 200); assert.ok(!/senhaHash|senha_hash|scrypt\$|Teste isolado/.test(me.body));
  assert.match(String(me.headers['cache-control']), /no-store/);
  assert.match(String(me.headers['content-security-policy']), /script-src 'self'/);
  const users = await request(clients.ADMINISTRADOR, 'GET', '/api/usuarios');
  assert.ok(users.json().every((u: Record<string, unknown>) => !('senha' in u) && !('senhaHash' in u)));
  assert.equal((await request(clients.ADMINISTRADOR, 'GET', '/api/materiais?limit=99999')).statusCode, 400);
  const res = await app.inject({ url: '/api/auth/csrf' });
  assert.match(String(res.headers['set-cookie']), /HttpOnly/); assert.match(String(res.headers['set-cookie']), /SameSite=Strict/);
});
test('role rules and CSRF protect direct API calls including login', async () => {
  for (const role of ['SOLICITANTE', 'TECNICO', 'GESTOR']) {
    assert.equal((await request(clients[role], 'POST', '/api/unidades', { nome: 'Proibido' })).statusCode, 403);
    assert.equal((await request(clients[role], 'GET', '/api/usuarios')).statusCode, 403);
    assert.equal((await request(clients[role], 'GET', '/api/export/sql')).statusCode, 403);
  }
  assert.equal((await request(clients.SOLICITANTE, 'GET', '/api/honorarios')).statusCode, 403);
  assert.equal((await request(clients.ADMINISTRADOR, 'POST', '/api/unidades', { nome: 'Sem CSRF' }, { 'x-csrf-token': '' })).statusCode, 403);
  assert.equal((await request(clients.ADMINISTRADOR, 'GET', '/api/materiais', undefined, { origin: 'https://attacker.invalid' })).statusCode, 403);
  assert.equal((await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email: 'administrador@test.invalid', senha: password } })).statusCode, 403);
});
const order = (unit = unitA, quantity = 4, material = materialId) => ({ unidade_emitente_id: unit, data_pedido: '2026-09-23', responsavel_nome: 'Nome falsificado', numero_pbs: 'FALSO', itens: [{ material_id: material, qtd_pedida: quantity, valor_unitario: 0.01 }] });
test('unit isolation, authoritative prices/nature and identities, validation and pagination', async () => {
  assert.equal((await request(clients.SOLICITANTE, 'POST', '/api/pedidos', order(unitB))).statusCode, 403);
  for (const quantity of [-1, 0, 1.2, 11]) assert.equal((await request(clients.SOLICITANTE, 'POST', '/api/pedidos', order(unitA, quantity))).statusCode, 400);
  const duplicated = order(); duplicated.itens.push(duplicated.itens[0]);
  assert.equal((await request(clients.SOLICITANTE, 'POST', '/api/pedidos', duplicated)).statusCode, 400);
  const created = await request(clients.SOLICITANTE, 'POST', '/api/pedidos', order());
  assert.equal(created.statusCode, 200, created.body);
  assert.equal(created.json().valor_total_estimado, 8.6); assert.equal(created.json().responsavel_nome, 'SOLICITANTE');
  assert.equal(created.json().itens[0].natureza, 'INVESTIMENTO'); assert.notEqual(created.json().numero_pbs, 'FALSO');
  const foreign = (await request(clients.ADMINISTRADOR, 'POST', '/api/pedidos', order(unitB))).json();
  const own = (await request(clients.SOLICITANTE, 'GET', '/api/pedidos')).json();
  assert.ok(own.every((p: { unidade_emitente_id: number }) => p.unidade_emitente_id === unitA));
  assert.equal((await request(clients.SOLICITANTE, 'PUT', `/api/pedidos/${foreign.id}/cancelar`)).statusCode, 404);
  const page = await request(clients.ADMINISTRADOR, 'GET', '/api/materiais?limit=1');
  assert.equal(page.json().length, 1); assert.ok(page.headers['x-next-cursor']);
  const next = await request(clients.ADMINISTRADOR, 'GET', `/api/materiais?limit=1&after=${page.headers['x-next-cursor']}`);
  assert.notEqual(page.json()[0].id, next.json()[0].id);
});
async function received(quantity = 4, material = materialId) {
  const res = await request(clients.ADMINISTRADOR, 'POST', '/api/pedidos', order(unitA, quantity, material));
  assert.equal(res.statusCode, 200, res.body);
  const p = res.json();
  assert.equal((await request(clients.ADMINISTRADOR, 'PUT', `/api/pedidos/${p.id}/receber`, { apontador_recebimento_nome: 'Falso', data_recebimento: '2026-09-23' })).statusCode, 200);
  return p;
}
const attendance = (p: any, quantity: number) => ({ itensAtendidos: [{ item_id: p.itens[0].id, material_id: p.itens[0].material_id, qtd_atendida: quantity }] });
test('stock decrement is atomic and repeated attendance does not decrement twice', async () => {
  const p = await received(); const url = `/api/pedidos/${p.id}/atender`;
  const results = await Promise.all([request(clients.ADMINISTRADOR, 'PUT', url, attendance(p, 4)), request(clients.ADMINISTRADOR, 'PUT', url, attendance(p, 4))]);
  assert.ok(results.every(r => r.statusCode === 200), results.map(r => r.body).join('\n'));
  assert.equal((await prisma.material.findUniqueOrThrow({ where: { id: materialId } })).qtdEstoque, 6);
  assert.equal((await request(clients.ADMINISTRADOR, 'PUT', url, attendance(p, 5))).statusCode, 400);
  assert.equal((await request(clients.ADMINISTRADOR, 'PUT', url, { itensAtendidos: [{ item_id: p.itens[0].id, material_id: otherMaterial, qtd_atendida: 2 }] })).statusCode, 400);
  await request(clients.ADMINISTRADOR, 'PUT', `/api/pedidos/${p.id}/cancelar`);
  assert.equal((await prisma.material.findUniqueOrThrow({ where: { id: materialId } })).qtdEstoque, 10);
  assert.equal((await request(clients.ADMINISTRADOR, 'PUT', `/api/pedidos/${p.id}/cancelar`)).statusCode, 409);
});
test('competing orders cannot make stock negative; changes rollback if any item fails', async () => {
  const a = await received(7), b = await received(7);
  const results = await Promise.all([request(clients.ADMINISTRADOR, 'PUT', `/api/pedidos/${a.id}/atender`, attendance(a, 7)), request(clients.ADMINISTRADOR, 'PUT', `/api/pedidos/${b.id}/atender`, attendance(b, 7))]);
  assert.deepEqual(results.map(r => r.statusCode).sort(), [200, 409]);
  assert.equal((await prisma.material.findUniqueOrThrow({ where: { id: materialId } })).qtdEstoque, 3);
  const body = order(unitA, 1); body.itens.push({ material_id: otherMaterial, qtd_pedida: 1, valor_unitario: 1 });
  const p = (await request(clients.ADMINISTRADOR, 'POST', '/api/pedidos', body)).json();
  await request(clients.ADMINISTRADOR, 'PUT', `/api/pedidos/${p.id}/receber`, { apontador_recebimento_nome: 'Admin', data_recebimento: '2026-09-23' });
  const res = await request(clients.ADMINISTRADOR, 'PUT', `/api/pedidos/${p.id}/atender`, { itensAtendidos: p.itens.map((i: any) => ({ item_id: i.id, material_id: i.material_id, qtd_atendida: 1 })) });
  assert.equal(res.statusCode, 409); assert.equal((await prisma.material.findUniqueOrThrow({ where: { id: materialId } })).qtdEstoque, 3);
  assert.ok((await prisma.itemPedidoPBS.findMany({ where: { pedidoId: p.id } })).every(i => i.qtdAtendida === 0));
});
test('stock optimistic locking and immediate cache invalidation', async () => {
  await request(clients.ADMINISTRADOR, 'GET', '/api/materiais');
  const url = `/api/materiais/${materialId}/estoque`;
  assert.equal((await request(clients.ADMINISTRADOR, 'PATCH', url, { qtd_estoque: 20, estoque_anterior: 3 })).statusCode, 200);
  assert.equal((await request(clients.ADMINISTRADOR, 'PATCH', url, { qtd_estoque: 999, estoque_anterior: 3 })).statusCode, 409);
  const fresh = (await request(clients.ADMINISTRADOR, 'GET', '/api/materiais')).json();
  assert.equal(fresh.find((m: any) => m.id === materialId).qtd_estoque, 20);
  assert.equal((await request(clients.ADMINISTRADOR, 'DELETE', `/api/materiais/${materialId}`)).statusCode, 409);
});
test('maintenance requires approval, respects equipment/unit linkage and updates preventive history', async () => {
  const eq = (await request(clients.ADMINISTRADOR, 'POST', '/api/equipamentos', { unidade_id: unitA, nome: 'Equipo', numero_serie: 'TESTE' })).json();
  const payload = { unidade_id: unitA, equipamento_id: eq.id, tipo: 'PREVENTIVA', descricao_defeito: 'Preventiva', data_abertura: '2026-09-23' };
  assert.equal((await request(clients.SOLICITANTE, 'POST', '/api/chamados', { ...payload, unidade_id: unitB })).statusCode, 403);
  const created = await request(clients.SOLICITANTE, 'POST', '/api/chamados', payload); assert.equal(created.statusCode, 200, created.body);
  const id = created.json().id;
  assert.ok(!(await request(clients.TECNICO, 'GET', '/api/chamados')).json().some((c: any) => c.id === id));
  assert.equal((await request(clients.TECNICO, 'PATCH', `/api/chamados/${id}/status`, { status: 'EM_ANDAMENTO' })).statusCode, 409);
  assert.equal((await request(clients.TECNICO, 'PATCH', `/api/chamados/${id}/aprovar`, { aprovar: true })).statusCode, 403);
  assert.equal((await request(clients.ADMINISTRADOR, 'PATCH', `/api/chamados/${id}/aprovar`, { aprovar: true })).statusCode, 200);
  assert.equal((await request(clients.TECNICO, 'PATCH', `/api/chamados/${id}/status`, { status: 'EM_ANDAMENTO' })).statusCode, 200);
  assert.equal((await request(clients.TECNICO, 'PATCH', `/api/chamados/${id}/status`, { status: 'CONCLUIDO', custo_reparo: 10 })).statusCode, 200);
  assert.ok((await prisma.equipamento.findUniqueOrThrow({ where: { id: eq.id } })).dataUltimaPreventiva);
  const finance = await request(clients.GESTOR, 'GET', '/api/financeiro/consolidacao'); assert.equal(finance.statusCode, 200, finance.body);
  assert.equal(finance.json().find((u: any) => u.unidadeId === unitA).custoManutencaoEquipamentos, 10);
});
test('audit trails omit secrets and last administrator cannot be removed or demoted', async () => {
  assert.equal((await request(clients.ADMINISTRADOR, 'PUT', `/api/usuarios/${clients.ADMINISTRADOR.userId}`, { perfil: 'GESTOR' })).statusCode, 409);
  assert.equal((await request(clients.ADMINISTRADOR, 'DELETE', `/api/usuarios/${clients.ADMINISTRADOR.userId}`)).statusCode, 409);
  const audit = await prisma.auditEvent.findMany(); assert.ok(audit.length > 10);
  assert.ok(audit.some(a => a.outcome === 403)); assert.ok(audit.some(a => a.outcome === 200));
  assert.ok(!JSON.stringify(audit, (_, v) => typeof v === 'bigint' ? String(v) : v).includes(password));
});
test('password change is enforced and old sessions are revoked', async () => {
  await prisma.usuario.update({ where: { id: clients.SOLICITANTE.userId }, data: { senhaRequerTroca: true } });
  assert.equal((await request(clients.SOLICITANTE, 'GET', '/api/pedidos')).statusCode, 403);
  const old = { ...clients.SOLICITANTE, cookies: { ...clients.SOLICITANTE.cookies } };
  const changed = await request(clients.SOLICITANTE, 'POST', '/api/auth/password', { senha_atual: password, nova_senha: 'Nova senha segura 987!' });
  assert.equal(changed.statusCode, 200, changed.body); clients.SOLICITANTE.csrf = changed.json().csrfToken;
  assert.equal((await request(old, 'GET', '/api/pedidos')).statusCode, 401);
  assert.equal((await request(clients.SOLICITANTE, 'GET', '/api/pedidos')).statusCode, 200);
});
test('database errors fail closed without reporting a fictitious save', async () => {
  const count = await prisma.unidadeSaude.count();
  const original = prisma.unidadeSaude.create;
  try {
    prisma.unidadeSaude.create = async () => { throw new Prisma.PrismaClientInitializationError('Internal credentials must not be exposed', 'test'); };
    const res = await request(clients.ADMINISTRADOR, 'POST', '/api/unidades', { nome: 'Não persistida' });
    assert.equal(res.statusCode, 503); assert.ok(!res.body.includes('Internal credentials'));
  } finally { prisma.unidadeSaude.create = original; dataCache.clear(); }
  assert.equal(await prisma.unidadeSaude.count(), count);
});
test('browser login, scoped UI, no external requests, cache and logout cleanup', async () => {
  await app.listen({ port: 3417, host: '127.0.0.1' });
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge', headless: true });
  try {
    const context = await browser.newContext(); const page = await context.newPage(); page.setDefaultTimeout(10_000);
    const external: string[] = [], errors: string[] = [], calls: string[] = [];
    page.on('request', r => { if (!r.url().startsWith('http://127.0.0.1:3417') && !r.url().startsWith('data:')) external.push(new URL(r.url()).origin); if (r.url().includes('/api/')) calls.push(r.url()); });
    page.on('pageerror', e => { errors.push(e.message); console.log('Browser error:', e.message); });
    const landing = await page.goto('http://127.0.0.1:3417');
    assert.equal(landing?.status(), 200);
    await expect(page.locator('#loginEmail')).toBeVisible().catch(async e => { console.log(JSON.stringify({ browserErrors: errors, content: (await page.locator('body').innerText()).slice(0, 800), calls })); throw e; });
    await page.getByLabel('Email *').fill('administrador@test.invalid');
    await page.getByLabel('Senha de Acesso *').fill(password);
    await page.getByRole('button', { name: 'Entrar no Sistema' }).click();
    await expect(page.getByRole('button', { name: 'Usuários & Acessos' })).toBeVisible();
    await page.getByRole('button', { name: 'Materiais & Unidades' }).click();
    await expect(page.getByText('<img src=x onerror="window.PWNED=1">', { exact: true })).toBeVisible();
    assert.equal(await page.evaluate(() => (window as any).PWNED), undefined);
    const before = calls.length; await page.getByRole('button', { name: 'Dashboard & Indicadores' }).click(); await page.getByRole('button', { name: 'Materiais & Unidades' }).click();
    assert.equal(calls.length, before);
    await page.getByTitle('Encerrar Sessão').click().catch(async e => { console.log((await page.locator('body').innerText()).slice(0, 1000)); throw e; });
    await expect(page.getByRole('button', { name: 'Entrar no Sistema' })).toBeVisible();
    assert.equal(await page.locator('body').innerText().then(t => t.includes('<img src=x')), false);
    await page.getByLabel('Email *').fill('gestor@test.invalid'); await page.getByLabel('Senha de Acesso *').fill(password); await page.getByRole('button', { name: 'Entrar no Sistema' }).click();
    await expect(page.getByRole('button', { name: 'Dashboard & Indicadores' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Usuários & Acessos' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Novo Pedido (PBS)' })).toHaveCount(0);
    assert.deepEqual(external, []); assert.deepEqual(errors, []);
    console.log(`Browser: ${calls.length} chamadas API no fluxo, nenhuma chamada externa; troca de abas sem requisições.`);
  } finally { await browser.close(); }
});
test('login brute force is rate limited without exposing account details', async () => {
  const c: Client = { cookies: {}, csrf: '', ip: '127.0.0.99' };
  c.csrf = (await request(c, 'GET', '/api/auth/csrf')).json().csrfToken;
  let last = 0;
  for (let i = 0; i < 12; i++) last = (await request(c, 'POST', '/api/auth/login', { email: 'unknown@test.invalid', senha: 'bad' })).statusCode;
  assert.equal(last, 429);
});
