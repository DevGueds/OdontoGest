async function runTests() {
  console.log('--- Testing Isolamento de Pedidos por Unidade (RBAC & Multi-tenant) ---');

  // Helper para acumular cookies de requisições
  function mergeCookies(existing: string, response: Response): string {
    const setCookies = response.headers.getSetCookie ? response.headers.getSetCookie() : [response.headers.get('set-cookie') || ''];
    const cookieMap = new Map<string, string>();
    if (existing) {
      existing.split(';').forEach(c => {
        const [k, v] = c.trim().split('=');
        if (k && v) cookieMap.set(k, v);
      });
    }
    setCookies.forEach(sc => {
      if (!sc) return;
      const parts = sc.split(';')[0].trim().split('=');
      if (parts[0] && parts[1]) cookieMap.set(parts[0], parts[1]);
    });
    return Array.from(cookieMap.entries()).map(([k, v]) => `${k}=${v}`).join('; ');
  }

  // 1. Admin login
  const loginAdmin = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@saude.gov.br', senha: '123456' })
  });
  let adminCookies = mergeCookies('', loginAdmin);

  // Obter CSRF token para requests POST
  const meAdminRes = await fetch('http://localhost:3001/api/auth/me', {
    headers: { 'Cookie': adminCookies }
  });
  adminCookies = mergeCookies(adminCookies, meAdminRes);
  const meAdmin = await meAdminRes.json();
  const csrfAdmin = meAdmin.csrfToken;

  // Obter lista de unidades
  const resUnidades = await fetch('http://localhost:3001/api/unidades', {
    headers: { 'Cookie': adminCookies }
  });
  const unidades = await resUnidades.json();
  console.log(`Unidades disponíveis: ${unidades.length}`);
  if (unidades.length < 2) {
    throw new Error('Precisamos de pelo menos 2 unidades para o teste de isolamento.');
  }

  const unidadeA = unidades[0];
  const unidadeB = unidades[1];
  console.log(`Unidade A: ID ${unidadeA.id} (${unidadeA.nome})`);
  console.log(`Unidade B: ID ${unidadeB.id} (${unidadeB.nome})`);

  // Obter materiais para criar pedido de teste
  const resMateriais = await fetch('http://localhost:3001/api/materiais', {
    headers: { 'Cookie': adminCookies }
  });
  const materiais = await resMateriais.json();
  const mat = materiais[0] || { id: 1, valor_unitario: 10 };

  // 2. Admin cria um pedido especificamente para Unidade B
  const resPedidoB = await fetch('http://localhost:3001/api/pedidos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': adminCookies,
      'x-csrf-token': csrfAdmin
    },
    body: JSON.stringify({
      unidade_emitente_id: unidadeB.id,
      data_pedido: new Date().toISOString(),
      responsavel_nome: 'Enfermeira Teste Unidade B',
      responsavel_funcao: 'Enfermeira Chefe',
      observacoes: 'Pedido teste para Unidade B criado pelo Admin',
      itens: [{ material_id: mat.id, qtd_pedida: 2, valor_unitario: mat.valor_unitario || 10 }]
    })
  });

  if (!resPedidoB.ok) {
    const errText = await resPedidoB.text();
    throw new Error(`Falha ao criar pedido para Unidade B: ${errText}`);
  }
  const pedidoBCriado = await resPedidoB.json();
  console.log(`✓ Pedido criado com sucesso para Unidade B: ${pedidoBCriado.numero_pbs} (ID: ${pedidoBCriado.id})`);

  // 3. Admin lista pedidos filtrando por Unidade B via query param
  const resFiltroB = await fetch(`http://localhost:3001/api/pedidos?unidade_id=${unidadeB.id}`, {
    headers: { 'Cookie': adminCookies }
  });
  const pedidosFiltroB = await resFiltroB.json();
  const contemPedidoB = pedidosFiltroB.some((p: any) => p.id === pedidoBCriado.id);
  const temOutrasUnidades = pedidosFiltroB.some((p: any) => p.unidade_emitente_id !== unidadeB.id);
  if (!contemPedidoB || temOutrasUnidades) {
    throw new Error(`Filtro por unidade_id=${unidadeB.id} falhou. Contem pedido: ${contemPedidoB}, tem outras: ${temOutrasUnidades}`);
  }
  console.log(`✓ Filtro por query unidade_id=${unidadeB.id} funcionando perfeitamente para Admin/Gestor.`);

  // 4. Testar acesso como Solicitante vinculado à Unidade A
  let loginSol = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'solicitante_unidade_a@saude.gov.br', senha: '123456' })
  });

  if (!loginSol.ok) {
    console.log('Criando usuário Solicitante para Unidade A...');
    await fetch('http://localhost:3001/api/usuarios', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': adminCookies,
        'x-csrf-token': csrfAdmin
      },
      body: JSON.stringify({
        email: 'solicitante_unidade_a@saude.gov.br',
        senha: '123456',
        nome: 'Solicitante Unidade A',
        funcao: 'Dentista Responsável',
        registro: 'CRO-12345',
        perfil: 'SOLICITANTE',
        unidade_id: unidadeA.id
      })
    });
    loginSol = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'solicitante_unidade_a@saude.gov.br', senha: '123456' })
    });
  }

  const solCookies = mergeCookies('', loginSol);

  // 5. O Solicitante da Unidade A faz GET /api/pedidos
  const resPedidosSol = await fetch('http://localhost:3001/api/pedidos', {
    headers: { 'Cookie': solCookies }
  });
  const pedidosSol = await resPedidosSol.json();
  console.log(`Total de pedidos retornados para Solicitante (Unidade ${unidadeA.id}): ${pedidosSol.length}`);

  // Verificar que NENHUM pedido da Unidade B é retornado para o Solicitante da Unidade A
  const vazouPedidoB = pedidosSol.some((p: any) => p.id === pedidoBCriado.id || p.unidade_emitente_id !== unidadeA.id);
  if (vazouPedidoB) {
    throw new Error('FALHA DE ISOLAMENTO: O solicitante da Unidade A conseguiu visualizar pedidos da Unidade B!');
  }
  console.log('✓ ISOLAMENTO CONFIRMADO: Pedido da Unidade B NÃO apareceu para o Solicitante da Unidade A!');

  console.log('>>> TODOS OS TESTES DE ISOLAMENTO PASSARAM COM SUCESSO! <<<');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
