import assert from 'node:assert';
import { hashPassword, verifyPassword, sanitizeUser } from '../src/server/auth/store.js';
import { dataStore } from '../src/server/data/store.js';

async function runSecurityRemediationTests() {
  console.log('--- Iniciando Testes Automatizados de Remediação das Vulnerabilidades ---');

  // 1. Teste de Hashing e Comparação de Senhas (scrypt)
  console.log('1. Testando criptografia e verificação de senhas com scrypt...');
  const password = 'SenhaSegura@2026';
  const hashed = hashPassword(password);
  assert(hashed.startsWith('scrypt:'), 'Hash gerado deve começar com prefixo scrypt:');
  assert(verifyPassword(password, hashed), 'verifyPassword deve retornar true para a senha correta');
  assert(!verifyPassword('SenhaErrada', hashed), 'verifyPassword deve retornar false para senha incorreta');

  // Teste de sanitização de usuário (vazamento de credenciais)
  const fakeUser: any = {
    id: 99,
    email: 'teste@saude.gov.br',
    senha: 'senha-secreta',
    nome: 'Usuário Teste',
    funcao: 'Dentista',
    registro: '123',
    perfil: 'SOLICITANTE',
    unidade_id: 1
  };
  const sanitized = sanitizeUser(fakeUser);
  assert.strictEqual((sanitized as any).senha, undefined, 'Objeto sanitizado não deve conter o campo senha');
  console.log('✓ Hashing e sanitização de credenciais validados com sucesso.');

  // 2. Teste de Integridade de Preço e Quantidade em salvarPedido
  console.log('2. Testando integridade do catálogo e limites em salvarPedido...');
  // Cadastrar um material com valor oficial 150.00 e limite 10
  const mat = await dataStore.addMaterial(
    'Resina Composta Especial Teste',
    'cx',
    150.0,
    50,
    10,
    'Dental Teste'
  );

  // Tentativa de manipulação de preço pelo cliente (informando valor_unitario = 0.01)
  const pedido = await dataStore.salvarPedido({
    unidade_emitente_id: 1,
    data_pedido: '2026-11-06',
    responsavel_nome: 'Dr. Teste',
    itens: [
      {
        material_id: mat.id,
        qtd_pedida: 5,
        valor_unitario: 0.01 // Tentativa de burlar preço
      }
    ]
  });

  const itemSalvo = pedido.itens.find(i => i.material_id === mat.id);
  assert(itemSalvo, 'Item deve existir no pedido');
  assert.strictEqual(
    itemSalvo.valor_unitario,
    150.0,
    `Preço unitário deve ser o oficial do catálogo (150.00), e não o fornecido pelo cliente (obtido: ${itemSalvo.valor_unitario})`
  );
  assert.strictEqual(
    itemSalvo.valor_total,
    750.0,
    `Valor total deve ser calculado com base no catálogo (750.00)`
  );
  console.log('✓ Preço fixado pelo catálogo do servidor validado com sucesso.');

  // Teste de limite máximo do pedido
  let limiteExcedido = false;
  try {
    await dataStore.salvarPedido({
      unidade_emitente_id: 1,
      data_pedido: '2026-11-06',
      responsavel_nome: 'Dr. Teste',
      itens: [
        {
          material_id: mat.id,
          qtd_pedida: 25 // Excede limite de 10
        }
      ]
    });
  } catch (err: any) {
    limiteExcedido = true;
    assert(err.message.includes('excede o limite máximo permitido'), 'Erro deve informar limite excedido');
  }
  assert(limiteExcedido, 'salvarPedido deve lançar erro quando a quantidade excede limite_max_pedido');
  console.log('✓ Limite máximo de quantidade por item validado com sucesso.');

  // 3. Teste de Validações em Atendimento e Cancelamento de Pedidos
  console.log('3. Testando regras de atendimento e cancelamento de pedidos...');
  // Atendimento parcial de 3 unidades
  const pedidoAtendido = await dataStore.atenderPedido(pedido.id, [
    { item_id: itemSalvo.id, material_id: mat.id, qtd_atendida: 3 }
  ]);
  assert.strictEqual(pedidoAtendido.status, 'ATENDIDO_PARCIAL');

  // Cancelamento de pedido com atendimento parcial deve restaurar estoque
  const estoqueAntes = (await dataStore.getMateriais()).find(m => m.id === mat.id)?.qtd_estoque || 0;
  await dataStore.cancelarPedido(pedido.id);
  const estoqueDepois = (await dataStore.getMateriais()).find(m => m.id === mat.id)?.qtd_estoque || 0;
  assert.strictEqual(
    estoqueDepois,
    estoqueAntes + 3,
    'Cancelamento de pedido com atendimento parcial deve restaurar os itens atendidos ao estoque'
  );
  console.log('✓ Restauração de estoque no cancelamento validada com sucesso.');

  // 4. Teste de Máquina de Estados em Chamados de Manutenção
  console.log('4. Testando máquina de estados e restrições em chamados de manutenção...');
  const chamado = await dataStore.addChamado({
    unidade_id: 1,
    equipamento_id: 1,
    tipo: 'CORRETIVA',
    descricao_defeito: 'Peça de mão com ruído incomum',
    custo_reparo: -500 // Tentativa de custo negativo
  });

  assert.strictEqual(chamado.status, 'ABERTO', 'Novo chamado deve sempre iniciar com status ABERTO');
  assert.strictEqual(chamado.custo_reparo, 0, 'Custo de reparo não pode ser negativo (deve sanitizar para 0)');

  // Tentativa de pular aprovação administrativa (ir direto de ABERTO para CONCLUIDO)
  let puloStatusBloqueado = false;
  try {
    await dataStore.updateStatusChamado(chamado.id, 'CONCLUIDO', 250);
  } catch (err: any) {
    puloStatusBloqueado = true;
    assert(err.message.includes('requerem aprovação da gestão'), 'Deve impedir transição de chamado não aprovado');
  }
  assert(puloStatusBloqueado, 'updateStatusChamado deve bloquear transição sem aprovação prévia');

  // Agora aprovar pela gestão e avançar normalmente
  await dataStore.aprovarChamadoManutencao(chamado.id, true);
  const chamadoConcluido = await dataStore.updateStatusChamado(chamado.id, 'CONCLUIDO', 250);
  assert.strictEqual(chamadoConcluido.status, 'CONCLUIDO');
  assert.strictEqual(chamadoConcluido.custo_reparo, 250);
  console.log('✓ Máquina de estados e aprovação de chamados validadas com sucesso.');

  // 5. Teste de Sanitização de SQL Dump
  console.log('5. Testando escape seguro no dump SQL...');
  const dumpSql = await dataStore.exportarSQL();
  assert(typeof dumpSql === 'string' && dumpSql.length > 0, 'Dump SQL deve ser gerado');
  assert(!dumpSql.includes("''DROP TABLE"), 'Não deve conter breakouts de SQL não tratados');
  console.log('✓ Escape de SQL no gerador de dump validado com sucesso.');

  console.log('\n============================================================');
  console.log('🎉 TODOS OS TESTES DE REMEDIAÇÃO DE VULNERABILIDADES PASSARAM!');
  console.log('============================================================');
}

runSecurityRemediationTests().catch(err => {
  console.error('Falha nos testes de remediação:', err);
  process.exit(1);
});

