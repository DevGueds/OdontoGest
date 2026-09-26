import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import type { FastifyInstance } from 'fastify';

const url = new URL(process.env.DATABASE_URL!);
assert(/^odontogest_upgrade_[a-f0-9]{12}$/.test(process.env.TEST_DATABASE || ''));
assert.equal(url.pathname, `/${process.env.TEST_DATABASE}`);
// Dynamic imports only after checking the isolated destination.
const { prisma } = await import('../src/server/db/prisma.js');
const { authenticateUser } = await import('../src/server/auth/store.js');
const { dataStore } = await import('../src/server/data/store.js');
let app: FastifyInstance | undefined;
try {
  if (process.argv[2] === 'before') {
    await assert.rejects(authenticateUser('ensaio0@example.invalid', 'Antiga2026!'), { statusCode: 401 });
    console.log('PASS login legado bloqueado quando apenas a migration é executada');
  } else {
    for (let i = 0; i < 4; i++) {
      const user = await authenticateUser(`ensaio${i}@example.invalid`, 'Antiga2026!');
      assert.equal(user.id, 10 + i);
      assert.equal(user.senha_requer_troca, true);
    }
    const account = await prisma.usuario.findUniqueOrThrow({ where: { id: 10 } });
    assert.notEqual(account.senhaHash, 'Antiga2026!', 'A autenticação por igualdade da versão antiga não pode funcionar após a conversão.');
    process.env.COOKIE_SECRET = randomBytes(48).toString('hex');
    process.env.APP_ORIGINS = 'http://localhost:3000';
    const { buildApp } = await import('../src/server/app.js');
    app = await buildApp({ logger: false });
    const cookies: Record<string, string> = {};
    let csrf = '';
    const request = async (method: 'GET' | 'POST', path: string, payload?: object) => {
      const response = await app!.inject({ method, url: path, payload, headers: { origin: 'http://localhost:3000', 'x-csrf-token': csrf, cookie: Object.entries(cookies).map(([k,v]) => `${k}=${encodeURIComponent(v)}`).join('; ') } });
      for (const c of response.cookies) cookies[c.name] = c.value;
      return response;
    };
    csrf = (await request('GET', '/api/auth/csrf')).json().csrfToken;
    const login = await request('POST', '/api/auth/login', { email: 'ensaio0@example.invalid', senha: 'Antiga2026!' });
    assert.equal(login.statusCode, 200);
    csrf = login.json().csrfToken;
    assert.equal((await request('GET', '/api/pedidos')).statusCode, 403);
    const changed = await request('POST', '/api/auth/password', { senha_atual: 'Antiga2026!', nova_senha: 'Nova8!ab' });
    assert.equal(changed.statusCode, 200);
    csrf = changed.json().csrfToken;
    assert.equal((await request('GET', '/api/pedidos')).statusCode, 200);
    assert.equal((await authenticateUser('ensaio0@example.invalid', 'Nova8!ab')).senha_requer_troca, false);
    const pedidos = await dataStore.getPedidos({ limit: 200 });
    assert.equal(pedidos.length, 6);
    assert.equal(pedidos.find(p => p.id === 1003)?.itens[0].qtd_atendida, 2);
    assert.equal((await dataStore.getConsolidacaoFinanceiraMulticlinica())[0].custoManutencaoEquipamentos, 25.50);
    const stock = (await prisma.material.findUniqueOrThrow({ where: { id: 10 } })).qtdEstoque;
    await dataStore.atenderPedido(1003, [{ item_id: 10030, material_id: 10, qtd_atendida: 3 }]);
    assert.equal((await prisma.material.findUniqueOrThrow({ where: { id: 10 } })).qtdEstoque, stock - 1);
    await dataStore.cancelarPedido(1003);
    assert.equal((await prisma.material.findUniqueOrThrow({ where: { id: 10 } })).qtdEstoque, stock + 2);
    await assert.rejects(dataStore.cancelarPedido(1003), { statusCode: 409 });
    await assert.rejects(dataStore.cancelarPedido(1005), { statusCode: 409 });
    await dataStore.confirmarRecebimento(1001, { apontador_recebimento_nome: 'Operador de ensaio', data_recebimento: '2024-03-01' });
    await dataStore.atenderPedido(1001, [{ item_id: 10010, material_id: 10, qtd_atendida: 1 }]);
    await dataStore.confirmarEnvio(1001, { apontador_envio_nome: 'Operador de ensaio', data_envio: '2024-03-02' });
    await dataStore.aprovarChamadoManutencao(10, true);
    await dataStore.updateStatusChamado(10, { status: 'EM_ANDAMENTO' });
    await dataStore.updateStatusChamado(10, { status: 'CONCLUIDO', custo_reparo: 27.12 });
    const created = await dataStore.salvarPedido({ unidade_emitente_id: 10, data_pedido: '2024-03-01', responsavel_nome: 'Operador de ensaio', itens: [{ material_id: 10, qtd_pedida: 2 }] });
    assert.equal(created.id, 1007);
    assert.equal(created.valor_total_estimado, 24.68);
    assert.equal(created.numero_pbs, 'PBS-2024/001007');
    const oldUnit = await prisma.unidadeSaude.findUniqueOrThrow({ where: { id: 10 } });
    assert.equal(Number(oldUnit.orcamentoCusteio), 123456.78);
    assert.equal(Number(oldUnit.orcamentoInvestimento), 87654.32);
    const newUnit = await prisma.unidadeSaude.create({ data: { nome: 'Unidade nova após migration' } });
    assert.equal(Number(newUnit.orcamentoCusteio), 0);
    assert.equal(Number(newUnit.orcamentoInvestimento), 0);
    assert.equal((await prisma.material.create({ data: { descricao: 'Material novo após migration', unidadeMedida: 'UN' } })).qtdEstoque, 0);
    console.log('PASS credenciais, IDs, valores, atendimento parcial legado, cancelamento, envio e manutenção após upgrade');
  }
} finally { await app?.close(); await prisma.$disconnect(); }
