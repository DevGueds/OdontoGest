import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TriagemTab } from '../src/client/components/tabs/TriagemTab';
import { AuthProvider } from '../src/client/context/AuthContext';
import { TooltipContent } from '../src/client/components/ui/tooltip';
import { PedidoPBS, UnidadeSaude } from '../src/client/types';

const unidadesFixture: UnidadeSaude[] = [
  { id: 1, nome: 'USF Centro', criado_em: '2026-01-01T00:00:00Z' }
];

const pedidosFixture: PedidoPBS[] = [
  {
    id: 101,
    numero_pbs: 'PBS-2026-0101',
    unidade_emitente_id: 1,
    data_pedido: '2026-10-01T10:00:00Z',
    responsavel_nome: 'Dr. Carlos',
    responsavel_funcao: 'Cirurgião Dentista',
    responsavel_registro: 'CRO-111',
    status: 'SOLICITADO',
    itens: []
  },
  {
    id: 102,
    numero_pbs: 'PBS-2026-0102',
    unidade_emitente_id: 1,
    data_pedido: '2026-10-02T10:00:00Z',
    responsavel_nome: 'Dra. Ana',
    responsavel_funcao: 'Cirurgiã Dentista',
    responsavel_registro: 'CRO-222',
    status: 'RECEBIDO',
    itens: []
  },
  {
    id: 103,
    numero_pbs: 'PBS-2026-0103',
    unidade_emitente_id: 1,
    data_pedido: '2026-10-03T10:00:00Z',
    responsavel_nome: 'Dr. Marcos',
    responsavel_funcao: 'Cirurgião Dentista',
    responsavel_registro: 'CRO-333',
    status: 'ATENDIDO_PARCIAL',
    itens: []
  },
  {
    id: 104,
    numero_pbs: 'PBS-2026-0104',
    unidade_emitente_id: 1,
    data_pedido: '2026-10-04T10:00:00Z',
    responsavel_nome: 'Dra. Julia',
    responsavel_funcao: 'Cirurgiã Dentista',
    responsavel_registro: 'CRO-444',
    status: 'ATENDIDO_TOTAL',
    itens: []
  }
];

interface ExtractedButton {
  title: string;
  ariaLabel: string;
  className: string;
  innerHtml: string;
  textContent: string;
}

function extractButtonsFromHtml(html: string): ExtractedButton[] {
  const buttons: ExtractedButton[] = [];
  const btnRegex = /<button\b([^>]*)>([\s\S]*?)<\/button>/g;
  let match: RegExpExecArray | null;
  while ((match = btnRegex.exec(html)) !== null) {
    const attrs = match[1];
    const innerHtml = match[2];
    const titleMatch = attrs.match(/\btitle="([^"]*)"/);
    const ariaMatch = attrs.match(/\baria-label="([^"]*)"/);
    const classMatch = attrs.match(/\bclass="([^"]*)"/);
    if (!titleMatch && !ariaMatch) continue; // Ignore SelectTrigger buttons which have no title/aria-label
    const textContent = innerHtml.replace(/<[^>]+>/g, '').trim();
    buttons.push({
      title: titleMatch ? titleMatch[1] : '',
      ariaLabel: ariaMatch ? ariaMatch[1] : '',
      className: classMatch ? classMatch[1] : '',
      innerHtml,
      textContent
    });
  }
  return buttons;
}

function collectReactNodes(node: React.ReactNode, predicate: (el: React.ReactElement<any>) => boolean): React.ReactElement<any>[] {
  const results: React.ReactElement<any>[] = [];
  function walk(current: React.ReactNode) {
    if (!current || typeof current !== 'object') return;
    if (Array.isArray(current)) {
      current.forEach(walk);
      return;
    }
    if (React.isValidElement(current)) {
      const el = current as React.ReactElement<any>;
      if (predicate(el)) {
        results.push(el);
      }
      if (el.props && el.props.children) {
        walk(el.props.children);
      }
    }
  }
  walk(node);
  return results;
}

async function runTests() {
  console.log('--- Testing Ícones de Ação com Tooltip na Central de Atendimento & Triagem de Pedidos ---');

  const calls = {
    ficha: [] as number[],
    recebimento: [] as number[],
    atendimento: [] as number[],
    envio: [] as number[],
    cancelar: [] as number[]
  };

  const propsPrivilegiado = {
    pedidos: pedidosFixture,
    unidades: unidadesFixture,
    perfilAtual: 'ADMINISTRADOR' as const,
    onAbrirFicha: (p: PedidoPBS) => calls.ficha.push(p.id),
    onAbrirRecebimento: (p: PedidoPBS) => calls.recebimento.push(p.id),
    onAbrirAtendimento: (p: PedidoPBS) => calls.atendimento.push(p.id),
    onAbrirEnvio: (p: PedidoPBS) => calls.envio.push(p.id),
    onCancelarPedido: (p: PedidoPBS) => calls.cancelar.push(p.id),
    formatarData: (d?: string | null) => d || '-'
  };

  // 1. Renderizar TriagemTab para perfil privilegiado (ADMINISTRADOR)
  const htmlPrivilegiado = renderToStaticMarkup(
    React.createElement(AuthProvider, null, React.createElement(TriagemTab, propsPrivilegiado))
  );

  const actionButtons = extractButtonsFromHtml(htmlPrivilegiado);

  // Para os 4 pedidos:
  // 101 (SOLICITADO): Ficha, Cancelar, Receber (3)
  // 102 (RECEBIDO): Ficha, Cancelar, Atender, Enviar (4)
  // 103 (ATENDIDO_PARCIAL): Ficha, Qtds, Enviar (3)
  // 104 (ATENDIDO_TOTAL): Ficha, Qtds, Enviar (3)
  // Total = 13 botões de ação
  assert.equal(actionButtons.length, 13, `Esperado 13 botões de ação para os 4 pedidos, encontrado ${actionButtons.length}`);

  // AC 1 (TRIAG-01): Todos os botões de ação devem ser h-8 w-8 p-0, conter SVG e NÃO conter texto inline
  const forbiddenLabels = ['Ficha', 'Cancelar', '1. Receber', '2. Atender', 'Qtds', '3. Enviar'];
  for (const btn of actionButtons) {
    assert.equal(btn.textContent, '', `Botão '${btn.title}' não deve conter texto visível inline, mas contém: '${btn.textContent}'`);
    for (const label of forbiddenLabels) {
      assert.equal(btn.innerHtml.includes(label), false, `Botão '${btn.title}' não deve conter o rótulo '${label}'`);
    }
    assert.equal(btn.className.includes('h-8'), true, `Botão '${btn.title}' deve possuir classe h-8`);
    assert.equal(btn.className.includes('w-8'), true, `Botão '${btn.title}' deve possuir classe w-8`);
    assert.equal(btn.className.includes('p-0'), true, `Botão '${btn.title}' deve possuir classe p-0`);
    assert.equal(btn.className.includes('px-2.5'), false, `Botão '${btn.title}' não deve possuir padding horizontal largo px-2.5`);
    assert.equal(btn.innerHtml.includes('<svg'), true, `Botão '${btn.title}' deve renderizar um ícone SVG`);
  }

  // AC 2 (TRIAG-02) & Edge Case 2: Verificar títulos/aria-labels exatos por pedido e status
  const titlesInOrder = actionButtons.map(b => b.title);
  const expectedTitlesInOrder = [
    // Pedido 101 (SOLICITADO)
    'Visualizar Ficha PBS',
    'Cancelar Solicitação',
    'Confirmar Recebimento',
    // Pedido 102 (RECEBIDO)
    'Visualizar Ficha PBS',
    'Cancelar Solicitação',
    'Atender Itens Solicitados',
    'Despachar Pedido',
    // Pedido 103 (ATENDIDO_PARCIAL)
    'Visualizar Ficha PBS',
    'Editar Quantidades Atendidas',
    'Despachar Pedido',
    // Pedido 104 (ATENDIDO_TOTAL)
    'Visualizar Ficha PBS',
    'Editar Quantidades Atendidas',
    'Despachar Pedido'
  ];
  assert.deepEqual(titlesInOrder, expectedTitlesInOrder);

  for (const btn of actionButtons) {
    assert.equal(btn.ariaLabel, btn.title, `aria-label ('${btn.ariaLabel}') deve corresponder ao title ('${btn.title}')`);
  }

  // AC 2 (TRIAG-02): Verificar que cada botão de ação possui TooltipContent correspondente na árvore React
  // Renderizar dentro do contexto de renderToStaticMarkup para manter o dispatcher de hooks do React ativo
  let treePrivilegiado: React.ReactNode = null;
  let treeSolicitante: React.ReactNode = null;

  const CaptureTree: React.FC<{
    props: typeof propsPrivilegiado;
    mockUser: { id: number; nome: string; email: string; funcao: string; registro: string; perfil: 'ADMINISTRADOR' | 'SOLICITANTE'; unidade_id: number };
    onCapture: (tree: React.ReactNode) => void;
  }> = ({ props, mockUser, onCapture }) => {
    const authProviderEl = (AuthProvider as any)({ children: null }) as React.ReactElement<any>;
    const AuthContextProvider = authProviderEl.type;
    const Inner: React.FC = () => {
      const rendered = (TriagemTab as any)(props);
      onCapture(rendered);
      return rendered;
    };
    return React.createElement(
      AuthContextProvider,
      {
        value: {
          user: mockUser,
          authenticated: true,
          loading: false,
          csrfToken: 'token',
          login: async () => {},
          logout: async () => {},
          csrfFetch: async () => new Response()
        }
      },
      React.createElement(Inner)
    );
  };

  renderToStaticMarkup(
    React.createElement(CaptureTree, {
      props: propsPrivilegiado,
      mockUser: { id: 1, nome: 'Admin', email: 'admin@saude.gov.br', funcao: 'Admin', registro: '1', perfil: 'ADMINISTRADOR', unidade_id: 1 },
      onCapture: (t) => { treePrivilegiado = t; }
    })
  );

  renderToStaticMarkup(
    React.createElement(CaptureTree, {
      props: { ...propsPrivilegiado, perfilAtual: 'SOLICITANTE' },
      mockUser: { id: 2, nome: 'Solicitante', email: 'sol@saude.gov.br', funcao: 'Dentista', registro: '2', perfil: 'SOLICITANTE', unidade_id: 1 },
      onCapture: (t) => { treeSolicitante = t; }
    })
  );

  const tooltipContentsPriv = collectReactNodes(treePrivilegiado, (el) => el.type === TooltipContent);
  const tooltipTextsPriv = tooltipContentsPriv.map(el => String(el.props.children));
  assert.deepEqual(tooltipTextsPriv, expectedTitlesInOrder, 'Cada botão de ação deve possuir um TooltipContent com o texto exato da ação');

  // AC 3 (TRIAG-03): Verificar cores semânticas e disparo dos handlers de clique (onAbrirFicha, onCancelarPedido, onAbrirRecebimento, onAbrirAtendimento, onAbrirEnvio)
  const fichaBtn = actionButtons.find(b => b.title === 'Visualizar Ficha PBS')!;
  assert.equal(fichaBtn.className.includes('text-blue-600'), true);
  const cancelarBtn = actionButtons.find(b => b.title === 'Cancelar Solicitação')!;
  assert.equal(cancelarBtn.className.includes('text-rose-600'), true);
  const receberBtn = actionButtons.find(b => b.title === 'Confirmar Recebimento')!;
  assert.equal(receberBtn.className.includes('bg-blue-600'), true);
  const atenderBtn = actionButtons.find(b => b.title === 'Atender Itens Solicitados')!;
  assert.equal(atenderBtn.className.includes('text-amber-700'), true);
  const qtdsBtn = actionButtons.find(b => b.title === 'Editar Quantidades Atendidas')!;
  assert.equal(qtdsBtn.className.includes('text-amber-700'), true);
  const enviarBtn = actionButtons.find(b => b.title === 'Despachar Pedido')!;
  assert.equal(enviarBtn.className.includes('bg-emerald-600'), true);

  const clickableButtonsPriv = collectReactNodes(treePrivilegiado, (el) => typeof el.props?.onClick === 'function' && Boolean(el.props?.title));
  assert.equal(clickableButtonsPriv.length, 13);
  for (const btnEl of clickableButtonsPriv) {
    btnEl.props.onClick();
  }
  assert.deepEqual(calls.ficha, [101, 102, 103, 104]);
  assert.deepEqual(calls.cancelar, [101, 102]);
  assert.deepEqual(calls.recebimento, [101]);
  assert.deepEqual(calls.atendimento, [102, 103, 104]);
  assert.deepEqual(calls.envio, [102, 103, 104]);

  // Edge Case 1: Perfil SOLICITANTE visualiza apenas Ficha (em todos os 4 pedidos) e Cancelar (apenas no pedido 101 SOLICITADO), todos em ícone com Tooltip
  const tooltipContentsSol = collectReactNodes(treeSolicitante, (el) => el.type === TooltipContent);
  const tooltipTextsSol = tooltipContentsSol.map(el => String(el.props.children));
  assert.deepEqual(tooltipTextsSol, [
    'Visualizar Ficha PBS',
    'Cancelar Solicitação',
    'Visualizar Ficha PBS',
    'Visualizar Ficha PBS',
    'Visualizar Ficha PBS'
  ]);

  const clickableButtonsSol = collectReactNodes(treeSolicitante, (el) => typeof el.props?.onClick === 'function' && Boolean(el.props?.title));
  assert.equal(clickableButtonsSol.length, 5);
  for (const btnEl of clickableButtonsSol) {
    assert.equal(String(btnEl.props.className).includes('h-8 w-8 p-0'), true, 'Botões do Solicitante também devem ter h-8 w-8 p-0');
    const childrenArray = React.Children.toArray(btnEl.props.children);
    const textChildren = childrenArray.filter(ch => typeof ch === 'string' && ch.trim().length > 0);
    assert.equal(textChildren.length, 0, 'Botões do Solicitante não devem ter texto inline');
  }

  console.log('✓ Todos os testes de ícones de ação com tooltip em TriagemTab passaram com sucesso!');
}

runTests().catch(err => {
  console.error('Falha nos testes:', err);
  process.exit(1);
});

