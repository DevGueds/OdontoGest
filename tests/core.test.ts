import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, validatePassword } from '../src/server/auth/password.js';
import { AsyncCache } from '../src/server/cache.js';
import { RequestCache } from '../src/client/services/requestCache.js';
import { escapeHtml, csvText } from '../src/client/services/exportSafety.js';
import { sqlValue } from '../src/server/data/export.js';
import { schemas } from '../src/server/validation.js';

test('passwords use salted scrypt, reject wrong/legacy/malformed values', async () => {
  const password = 'Teste seguro 123!';
  const a = await hashPassword(password), b = await hashPassword(password);
  assert.notEqual(a, b); assert.ok(!a.includes(password));
  assert.equal(await verifyPassword(password, a), true);
  assert.equal(await verifyPassword('incorreta', a), false);
  assert.equal(await verifyPassword(password, password), false);
  assert.equal(await verifyPassword(password, 'scrypt$invalid'), false);
  assert.throws(() => validatePassword('123456')); assert.throws(() => validatePassword('a'.repeat(129)));
});
test('server cache coalesces concurrent loads and does not cache errors', async () => {
  const cache = new AsyncCache(1000, 2); let calls = 0;
  const load = async () => { calls++; return calls; };
  assert.deepEqual(await Promise.all([cache.get('a', load), cache.get('a', load)]), [1, 1]);
  cache.clear(); assert.equal(await cache.get('a', load), 2);
  await assert.rejects(cache.get('b', async () => { throw new Error('offline'); }));
  assert.equal(await cache.get('b', async () => 3), 3);
});
test('server cache invalidation during a load cannot restore stale entries', async () => {
  const cache = new AsyncCache(); let complete!: (value: number) => void;
  const old = cache.get('a', () => new Promise<number>(resolve => { complete = resolve; }));
  await Promise.resolve(); cache.clear(); complete(1); await old;
  assert.equal(await cache.get('a', async () => 2), 2);
});
test('browser cache cancels results from a previous login and selectively invalidates', async () => {
  const cache = new RequestCache(); let complete!: (value: string) => void;
  const old = cache.get('/api/materiais', () => new Promise<string>(resolve => { complete = resolve; }));
  cache.clear(); complete('private data'); await assert.rejects(old, { name: 'AbortError' });
  let calls = 0;
  const read = () => cache.get('/api/unidades', async () => ++calls);
  assert.equal(await read(), 1); cache.invalidate(['/api/materiais']); assert.equal(await read(), 1);
  cache.invalidate(['/api/unidades']); assert.equal(await read(), 2);
});
test('HTML, CSV and SQL export escape hostile user input', () => {
  assert.equal(escapeHtml('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
  for (const value of ['=HYPERLINK("http://x")', '+1', '-2', '@SUM(1)', '\t=1', '   =1']) assert.ok(csvText(value).startsWith("'"));
  assert.equal(csvText('Nome "teste"'), 'Nome ""teste""');
  const sql = sqlValue("x\\'; DROP TABLE usuarios; --");
  assert.match(sql, /^CONVERT\(X'[a-f0-9]+' USING utf8mb4\)$/);
});
test('validation rejects coercion, mass assignment, invalid dates and negative quantities', () => {
  assert.equal(schemas.login.safeParse({ email: 'x@y.com', senha: { $ne: null } }).success, false);
  assert.equal(schemas.material.safeParse({ descricao: 'A', unidade_medida: 'UN', qtd_estoque: -1 }).success, false);
  assert.equal(schemas.material.safeParse({ descricao: 'A', unidade_medida: 'UN', qtd_estoque: '5' }).success, false);
  assert.equal(schemas.equipamento.safeParse({ unidade_id: 1, nome: 'A', numero_serie: 'X', data_ultima_preventiva: '2026-02-30' }).success, false);
  assert.equal(schemas.user.partial().safeParse({ senhaHash: 'attack', id: 1 }).success, false);
});
