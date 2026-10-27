async function runTests() {
  console.log('--- Testing Seleção de Profissionais por Unidade no Registro de Honorários ---');

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

  // 1. Solicitante não pode acessar /api/usuarios (RBAC guard)
  console.log('1. Testando que Solicitante não tem permissão para listar todos os usuários');
  const loginSol = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'solicitante@saude.gov.br', senha: '123456' })
  });
  const cookieSol = loginSol.headers.get('set-cookie') || '';
  const resSol = await fetch('http://localhost:3001/api/usuarios', {
    headers: { 'Cookie': cookieSol.split(';')[0] }
  });
  console.log('   Solicitante status =', resSol.status);
  if (resSol.status !== 403) {
    throw new Error(`Esperado status 403 para Solicitante em /api/usuarios, obtido: ${resSol.status}`);
  }

  // 2. Gestor pode acessar /api/usuarios para consultar profissionais
  console.log('2. Testando que Gestor pode acessar /api/usuarios');
  const loginGestor = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'gestor@saude.gov.br', senha: '123456' })
  });
  const cookieGestor = loginGestor.headers.get('set-cookie') || '';
  const resGestor = await fetch('http://localhost:3001/api/usuarios', {
    headers: { 'Cookie': cookieGestor.split(';')[0] }
  });
  console.log('   Gestor status =', resGestor.status);
  if (resGestor.status !== 200) {
    throw new Error(`Esperado status 200 para Gestor em /api/usuarios, obtido: ${resGestor.status}`);
  }
  const usersGestor = await resGestor.json();
  if (!Array.isArray(usersGestor) || usersGestor.length === 0) {
    throw new Error('Lista de usuários retornada para Gestor está vazia ou inválida');
  }

  // 3. Administrador pode acessar /api/usuarios
  console.log('3. Testando que Administrador pode acessar /api/usuarios');
  const loginAdmin = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@saude.gov.br', senha: '123456' })
  });
  let adminCookies = mergeCookies('', loginAdmin);
  const resAdmin = await fetch('http://localhost:3001/api/usuarios', {
    headers: { 'Cookie': adminCookies }
  });
  console.log('   Admin status =', resAdmin.status);
  if (resAdmin.status !== 200) {
    throw new Error(`Esperado status 200 para Admin em /api/usuarios, obtido: ${resAdmin.status}`);
  }
  const usersAdmin = await resAdmin.json();

  // 4. Verificar sanitização de segurança (nenhum campo senha exposto)
  console.log('4. Verificando que nenhum hash de senha é exposto em /api/usuarios');
  for (const u of usersAdmin) {
    if (u.senha !== undefined) {
      throw new Error(`Vazamento de credencial detectado: campo 'senha' presente no usuário ${u.email}`);
    }
  }

  // 5. Verificar vinculação de profissionais por unidade de saúde
  console.log('5. Verificando que usuários possuem unidade_id, nome e registro/CRO para filtro');
  const usersWithUnit = usersAdmin.filter((u: any) => u.unidade_id);
  console.log(`   Usuários com unidade vinculada: ${usersWithUnit.length} de ${usersAdmin.length}`);
  if (usersWithUnit.length === 0) {
    throw new Error('Nenhum usuário vinculado a unidade de saúde encontrado');
  }

  for (const u of usersWithUnit) {
    if (!u.nome) {
      throw new Error(`Usuário #${u.id} não possui nome definido`);
    }
    console.log(`   - Profissional: ${u.nome} | Unidade ID: ${u.unidade_id} | Registro: ${u.registro || '(S/ CRO)'}`);
  }

  // 6. Testar cadastro de honorário associando unidade e profissional
  console.log('6. Testando registro de honorário com dados de profissional da unidade');
  const meAdminRes = await fetch('http://localhost:3001/api/auth/me', {
    headers: { 'Cookie': adminCookies }
  });
  adminCookies = mergeCookies(adminCookies, meAdminRes);
  const meAdmin = await meAdminRes.json();
  const csrfAdmin = meAdmin.csrfToken;

  const targetProf = usersWithUnit[0];
  const mesAtual = new Date().toISOString().substring(0, 7);
  const novoHonorario = {
    unidade_id: targetProf.unidade_id,
    nome_dentista: targetProf.nome,
    cro: targetProf.registro || 'CRO/PA 9999',
    tipo_contrato: 'FOLHA_FIXA',
    mes_referencia: mesAtual,
    valor_fixo: 5000.00,
    valor_comissao: 500.00,
    valor_total: 5500.00,
    observacoes: 'Honorário de teste automatizado'
  };

  const resAdd = await fetch('http://localhost:3001/api/honorarios', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': adminCookies,
      'x-csrf-token': csrfAdmin || ''
    },
    body: JSON.stringify(novoHonorario)
  });
  console.log('   Add honorário status =', resAdd.status);
  if (resAdd.status !== 200 && resAdd.status !== 201) {
    const errBody = await resAdd.text();
    throw new Error(`Falha ao registrar honorário: ${resAdd.status} - ${errBody}`);
  }
  const honorarioCriado = await resAdd.json();
  console.log(`   Honorário criado com sucesso: ID ${honorarioCriado.id}, Dentista: ${honorarioCriado.nome_dentista}, CRO: ${honorarioCriado.cro}`);

  if (honorarioCriado.nome_dentista !== targetProf.nome) {
    throw new Error(`Nome do dentista esperado '${targetProf.nome}', obtido '${honorarioCriado.nome_dentista}'`);
  }

  // 7. Testando edição de honorário (PUT /api/honorarios/:id)
  console.log('7. Testando edição do honorário criado');
  const resEdit = await fetch(`http://localhost:3001/api/honorarios/${honorarioCriado.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': adminCookies,
      'x-csrf-token': csrfAdmin || ''
    },
    body: JSON.stringify({
      valor_fixo: 6000.00,
      valor_comissao: 800.00,
      observacoes: 'Honorário atualizado com sucesso'
    })
  });
  console.log('   Edit honorário status =', resEdit.status);
  if (resEdit.status !== 200) {
    throw new Error(`Falha ao editar honorário: ${resEdit.status}`);
  }
  const honorarioAtualizado = await resEdit.json();
  if (Number(honorarioAtualizado.valor_total) !== 6800.00) {
    throw new Error(`Valor total esperado 6800.00, obtido: ${honorarioAtualizado.valor_total}`);
  }
  console.log(`   Honorário atualizado com sucesso: Novo Total ${honorarioAtualizado.valor_total}`);

  // 8. Testando exclusão de honorário (DELETE /api/honorarios/:id)
  console.log('8. Testando exclusão do honorário criado');
  const resDel = await fetch(`http://localhost:3001/api/honorarios/${honorarioCriado.id}`, {
    method: 'DELETE',
    headers: {
      'Cookie': adminCookies,
      'x-csrf-token': csrfAdmin || ''
    }
  });
  console.log('   Delete honorário status =', resDel.status);
  if (resDel.status !== 200) {
    throw new Error(`Falha ao deletar honorário: ${resDel.status}`);
  }
  console.log('   Honorário excluído com sucesso');

  console.log('>>> TODOS OS TESTES DE INTEGRAÇÃO PASSARAM COM SUCESSO! <<<');
}

runTests().catch(err => {
  console.error('Falha nos testes:', err);
  process.exit(1);
});
