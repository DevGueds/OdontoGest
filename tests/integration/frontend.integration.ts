import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium, expect, type Page, type Locator } from '@playwright/test';
import { buildApp } from '../../src/server/app.js';
import { prisma } from '../../src/server/db/prisma.js';
import { hashPassword } from '../../src/server/auth/password.js';
import { dataStore } from '../../src/server/data/store.js';

if (!/^odontogest_test_[a-f0-9]{12}$/.test(process.env.TEST_DATABASE || '') || new URL(process.env.DATABASE_URL!).pathname !== `/${process.env.TEST_DATABASE}`) throw new Error('Use npm run test:frontend para executar em banco isolado.');

const base = 'http://127.0.0.1:3417';
const output = '.local/frontend-review';
const initialPassword = 'Acesso de teste 123!';
const newPassword = 'Dente@42'; // Exactly eight characters, exercised through the real browser/API.
const viewports = [
  { width: 1440, height: 900 }, { width: 1024, height: 768 }, { width: 768, height: 1024 },
  { width: 390, height: 844 }, { width: 320, height: 740 }, { width: 844, height: 390 },
];
const findings: { screen: string; problems: string[] }[] = [];
let screenshots = 0;

async function inspect(page: Page, screen: string) {
  await page.evaluate(async () => { await document.fonts.ready; for (const animation of document.getAnimations()) if (Number.isFinite(animation.effect?.getComputedTiming().iterations)) animation.finish(); });
  const viewport = page.viewportSize()!;
  const directory = `${output}/${viewport.width}x${viewport.height}`;
  mkdirSync(directory, { recursive: true });
  await page.screenshot({ path: `${directory}/${screen}.png`, fullPage: false }); screenshots++;
  const problems = await page.evaluate(() => {
    const result: string[] = [];
    if (document.documentElement.scrollWidth > innerWidth + 2) result.push(`page overflow: ${document.documentElement.scrollWidth}/${innerWidth}`);
    const activeDialog = document.querySelector<HTMLElement>('.modal:not([inert])');
    const scope = activeDialog || document.querySelector('.app-main') || document.body;
    for (const element of scope.querySelectorAll<HTMLElement>('.modal-content, .modal-header, .modal-footer, .card, .card-header, .form-grid, .form-control, .form-actions, .kpi-card')) {
      if (!element.getClientRects().length || element.closest('[inert]')) continue;
      const box = element.getBoundingClientRect();
      if (!element.closest('.table-responsive, .print-area') && (box.left < -2 || box.right > innerWidth + 2)) result.push(`offscreen ${element.className}: ${Math.round(box.left)}..${Math.round(box.right)}`);
      if (!element.matches('input, select, textarea') && element.scrollWidth > element.clientWidth + 2) result.push(`clipped ${element.className}: ${element.scrollWidth}/${element.clientWidth}`);
      if (element.classList.contains('modal-content') && (box.top < -2 || box.bottom > innerHeight + 2)) result.push('dialog outside vertical viewport');
    }
    if (activeDialog && activeDialog.parentElement !== document.body) result.push('dialog is nested in layout');
    return result;
  });
  if (problems.length) findings.push({ screen: `${viewport.width}x${viewport.height}/${screen}`, problems });
}
async function openDialog(page: Page, trigger: Locator, name: string) {
  if (!await trigger.first().isVisible() && await page.locator('.header-menu-toggle').isVisible()) await page.locator('.header-menu-toggle').click();
  await trigger.first().click();
  await expect(page.locator('.modal:not([inert])')).toBeVisible();
  await inspect(page, name);
  const dialog = page.locator('.modal:not([inert])');
  const body = dialog.locator('.modal-body');
  await body.evaluate(el => { el.scrollTop = el.scrollHeight; });
  await inspect(page, `${name}-end`);
  await page.keyboard.press('Tab');
  assert.ok(await dialog.evaluate(el => el.contains(document.activeElement)), `${name}: focus left the dialog`);
  await page.keyboard.press('Escape');
  await expect(page.locator('.modal:not([inert])')).toHaveCount(0);
}
async function login(page: Page, role: string, password: string) {
  await page.goto(base);
  await page.getByLabel('Email *').fill(`${role}@layout.test`);
  await page.getByLabel('Senha de Acesso *').fill(password);
  await page.getByRole('button', { name: 'Entrar no Sistema' }).click();
}
async function selectTab(page: Page, label: string) {
  if (await page.locator('.header-menu-toggle[aria-expanded="true"]').isVisible()) await page.locator('.header-menu-toggle').click();
  await page.locator('.sidebar-nav').getByRole('button', { name: label }).click();
  await expect(page.locator('.app-main .card').first()).toBeVisible();
  await page.mouse.move(page.viewportSize()!.width - 5, 5);
}

test('complete frontend review: responsive screens, dialogs, keyboard, all roles and eight-character password', { timeout: 300_000 }, async () => {
  const app = await buildApp({ logger: false });
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge', headless: true });
  const errors: string[] = [];
  try {
    const unit = await prisma.unidadeSaude.create({ data: { nome: 'Unidade de Saúde Odontológica — Centro de Atendimento e Especialidades' } });
    const hash = await hashPassword(initialPassword);
    for (const [role, perfil] of [['admin', 'ADMINISTRADOR'], ['gestor', 'GESTOR'], ['solicitante', 'SOLICITANTE'], ['tecnico', 'TECNICO']] as const) await prisma.usuario.create({ data: { nome: role === 'admin' ? 'Administrador com nome completo para verificar a quebra de texto' : role, email: `${role}@layout.test`, senhaHash: hash, senhaRequerTroca: role === 'admin', perfil, unidadeId: unit.id } });
    const material = await prisma.material.create({ data: { descricao: 'Luva de procedimento odontológico sem pó — caixa com 100 unidades', unidadeMedida: 'CX', fornecedor: 'Distribuidora de materiais odontológicos', valorEstimado: 25.5, qtdEstoque: 100 } });
    for (let i = 0; i < 3; i++) {
      const order = await dataStore.salvarPedido({ unidade_emitente_id: unit.id, data_pedido: '2026-09-25', responsavel_nome: 'Responsável de teste', itens: [{ material_id: material.id, qtd_pedida: 2 }] });
      if (i > 0) await dataStore.confirmarRecebimento(order.id, { apontador_recebimento_nome: 'Recebedor', data_recebimento: '2026-09-25' });
      if (i > 1) await dataStore.atenderPedido(order.id, [{ item_id: order.itens[0].id!, material_id: material.id, qtd_atendida: 2 }]);
    }
    const equipment = await prisma.equipamento.create({ data: { nome: 'Equipo odontológico com cadeira e refletor', numeroSerie: 'EQ-001', categoria: 'Consultório', unidadeId: unit.id } });
    await prisma.equipamento.create({ data: { nome: 'Autoclave para esterilização', numeroSerie: 'EQ-002', categoria: 'Esterilização', unidadeId: unit.id } });
    await prisma.chamadoManutencao.create({ data: { equipamentoId: equipment.id, unidadeId: unit.id, tipo: 'CORRETIVA', descricaoDefeito: 'Verificação do sistema hidráulico e troca de componentes', status: 'APROVADO_ADM', dataAbertura: new Date('2026-09-25'), custoReparo: 350 } });
    await prisma.honorarioOdontologo.create({ data: { unidadeId: unit.id, nomeDentista: 'Profissional de odontologia de teste', cro: 'CRO-TESTE', tipoContrato: 'FOLHA_FIXA', mesReferencia: '2026-09', valorFixo: 5000, valorComissao: 0, valorTotal: 5000 } });
    await prisma.entradaRecurso.create({ data: { unidadeId: unit.id, natureza: 'CUSTEIO', tipoRecorrencia: 'PARCELA_UNICA', descricao: 'Repasse para atenção à saúde bucal', valor: 10000, dataCredito: new Date('2026-09-25'), mesReferencia: '2026-09' } });
    await app.listen({ port: 3417, host: '127.0.0.1' });
    const context = await browser.newContext({ viewport: viewports[0], reducedMotion: 'reduce' });
    const page = await context.newPage(); page.setDefaultTimeout(10_000);
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (!request.url().startsWith(base) && !request.url().startsWith('data:')) errors.push(`External request: ${request.url()}`); });
    await page.goto(base);
    for (const viewport of viewports) {
      await page.setViewportSize(viewport); await inspect(page, 'login');
      await page.getByRole('button', { name: 'Privacidade', exact: true }).click();
      await expect(page.getByRole('dialog', { name: 'Sua privacidade' })).toBeVisible();
      await inspect(page, 'privacy-login');
      await page.keyboard.press('Shift+Tab');
      await expect(page.getByRole('button', { name: 'Entendi' })).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(page.getByRole('button', { name: 'Fechar aviso' })).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('button', { name: 'Privacidade', exact: true })).toBeFocused();
    }
    await login(page, 'admin', initialPassword);
    await expect(page.getByText('Atualize sua senha para liberar o acesso ao sistema.')).toBeVisible();
    for (const viewport of viewports) { await page.setViewportSize(viewport); await inspect(page, 'initial-password'); }
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Salvar e continuar' })).toBeVisible();
    await page.getByLabel('Senha atual ou temporária').fill(initialPassword);
    await page.getByLabel('Nova senha', { exact: true }).fill(newPassword);
    await page.getByLabel('Confirmar nova senha').fill('Outra@42');
    await page.getByRole('button', { name: 'Salvar e continuar' }).click();
    await expect(page.getByRole('alert')).toContainText('não coincidem');
    await inspect(page, 'password-error');
    await page.getByLabel('Confirmar nova senha').fill(newPassword);
    await page.getByRole('button', { name: 'Salvar e continuar' }).click();
    await expect(page.locator('.app-header')).toBeVisible();

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await openDialog(page, page.getByRole('button', { name: 'Privacidade', exact: true }), 'privacy-header');
      await openDialog(page, page.getByRole('button', { name: 'Alterar senha', exact: true }), 'password-header');
      await openDialog(page, page.getByRole('button', { name: 'Relatórios PDF/Excel' }), 'reports');
      await selectTab(page, 'Dashboard & Indicadores'); await inspect(page, 'dashboard');
      await selectTab(page, 'Central de Atendimento'); await inspect(page, 'orders');
      await openDialog(page, page.getByRole('button', { name: 'Ver Ficha' }), 'order-sheet');
      await openDialog(page, page.getByRole('button', { name: '1. Confirmar Recebimento' }), 'order-receive');
      await openDialog(page, page.getByRole('button', { name: '2. Conferir/Atender' }), 'order-fulfill');
      await openDialog(page, page.getByRole('button', { name: '3. Informar Envio' }).last(), 'order-send');
      await selectTab(page, 'Novo Pedido (PBS)'); await inspect(page, 'new-order');
      await selectTab(page, 'Aportes & Orçamento'); await inspect(page, 'budget');
      await selectTab(page, 'Honorários & Salários'); await inspect(page, 'fees');
      await openDialog(page, page.getByRole('button', { name: /Registrar.*Honorário|Novo.*Honorário/ }), 'fee-create');
      await selectTab(page, 'Materiais & Unidades'); await inspect(page, 'catalog');
      await openDialog(page, page.getByRole('button', { name: 'Novo Estabelecimento' }), 'unit-create');
      await openDialog(page, page.getByTitle('Editar Estabelecimento'), 'unit-edit');
      await openDialog(page, page.getByRole('button', { name: 'Novo Insumo/Material' }), 'material-create');
      await openDialog(page, page.getByRole('button', { name: 'Editar Insumo' }), 'material-edit');
      await openDialog(page, page.getByRole('button', { name: 'Repor Estoque' }), 'stock-adjust');
      await selectTab(page, 'Usuários & Acessos'); await inspect(page, 'users');
      await openDialog(page, page.getByRole('button', { name: /Novo Usuário/ }), 'user-create');
      await openDialog(page, page.getByTitle('Editar Usuário'), 'user-edit');
      await selectTab(page, 'Equipamentos & Manutenção'); await inspect(page, 'equipment');
      await openDialog(page, page.getByRole('button', { name: 'Cadastrar Equipamento', exact: false }), 'equipment-create');
      await openDialog(page, page.getByTitle('Editar dados do equipamento / patrimônio'), 'equipment-edit');
      await openDialog(page, page.getByRole('button', { name: 'Abrir Chamado de Reparo' }), 'maintenance-create');
      await openDialog(page, page.getByTitle('Agendar manutenção preventiva'), 'preventive-create');
      await openDialog(page, page.getByRole('button', { name: 'Atualizar Status / Concluir' }), 'maintenance-status');
      console.log(`Frontend ${viewport.width}x${viewport.height}: all administrator screens and dialogs inspected.`);
    }
    if (!await page.getByTitle('Encerrar Sessão').isVisible()) await page.locator('.header-menu-toggle').click();
    await page.getByTitle('Encerrar Sessão').click();
    for (const role of ['gestor', 'solicitante', 'tecnico']) {
      await login(page, role, initialPassword);
      await expect(page.locator('.app-header')).toBeVisible();
      for (const viewport of [viewports[0], viewports[3]]) {
        await page.setViewportSize(viewport);
        const tabs = await page.locator('.sidebar-nav button').all();
        for (let i = 0; i < tabs.length; i++) { await tabs[i].click(); await expect(page.locator('.app-main .card').first()).toBeVisible(); await inspect(page, `${role}-tab-${i}`); }
      }
      if (!await page.getByTitle('Encerrar Sessão').isVisible()) await page.locator('.header-menu-toggle').click();
      await page.getByTitle('Encerrar Sessão').click();
    }
    // Verify that the new minimum also works for a subsequent login.
    await login(page, 'admin', newPassword); await expect(page.locator('.app-header')).toBeVisible();
    assert.deepEqual(errors, []);
    assert.deepEqual(findings, [], 'See .local/frontend-review/findings.json for layout failures.');
  } finally {
    mkdirSync(output, { recursive: true }); writeFileSync(`${output}/findings.json`, JSON.stringify({ screenshots, findings, errors }, null, 2));
    console.log(JSON.stringify({ screenshots, layoutFailures: findings.length, browserErrors: errors.length }));
    await browser.close(); await app.close(); await prisma.$disconnect();
  }
});
