import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { LoginModal } from '../src/client/components/LoginModal';
import { AuthProvider } from '../src/client/context/AuthContext';

console.log('--- Iniciando Testes Automatizados: Rebrand da Tela de Login & 16 Leis de UX ---');

const html = renderToStaticMarkup(
  React.createElement(AuthProvider, null, React.createElement(LoginModal, null))
);

// 1. LOGIN-01 & LOGIN-02: Fundo Imersivo com Wallpaper e Glassmorphism Clínico
console.log('1. Testando presença do wallpaper, glassmorphism e identidade de marca...');
assert.ok(html.includes('bg-cover'), 'O plano de fundo deve utilizar classe bg-cover para o wallpaper');
assert.ok(html.includes('bg-center'), 'O plano de fundo deve utilizar classe bg-center para alinhamento da imagem');
assert.ok(html.includes('backdrop-blur-xl'), 'O card deve aplicar efeito de vidro fosco (backdrop-blur-xl)');
assert.ok(html.includes('rounded-2xl'), 'O card deve possuir cantos arredondados modernos (rounded-2xl)');
assert.ok(html.includes('OdontoGest'), 'O título da marca OdontoGest deve estar visível');
assert.ok(html.includes('Almoxarifado &amp; Gestão Odontológica') || html.includes('Almoxarifado & Gestão Odontológica'), 'O subtítulo oficial deve ser renderizado');
assert.ok(html.includes('Ambiente SUS • Acesso Seguro'), 'O selo de segurança institucional deve ser exibido');
console.log('✓ Wallpaper e estrutura Glassmorphism validados com sucesso.');

// 2. LOGIN-03: Ergonomia dos Inputs (Fitts, Similarity, Proximity, Jakob)
console.log('2. Testando ergonomia dos campos de e-mail e senha...');
assert.ok(html.includes('id="loginEmail"'), 'Campo de e-mail deve possuir id loginEmail');
assert.ok(html.includes('id="loginSenha"'), 'Campo de senha deve possuir id loginSenha');
assert.ok(html.includes('h-11'), 'Campos de entrada devem ter altura ergonômica de 44px (h-11) para Fitts Law');
assert.ok(html.includes('exemplo@saude.gov.br'), 'Campo de e-mail deve sugerir formato institucional');
assert.ok(html.includes('aria-label="Ver senha"'), 'Botão de revelação de senha deve possuir aria-label acessível');
console.log('✓ Ergonomia de inputs e acessibilidade validadas com sucesso.');

// 3. LOGIN-04: Botão de Ação Primária (Von Restorff Effect & Doherty Threshold)
console.log('3. Testando botão de ação primária com destaque azul clínico...');
assert.ok(html.includes('from-sky-600'), 'Botão primário deve utilizar gradiente azul clínico (from-sky-600)');
assert.ok(html.includes('to-blue-700'), 'Botão primário deve finalizar no azul real (to-blue-700)');
assert.ok(html.includes('Entrar no Sistema'), 'Botão de submissão deve conter texto descritivo Entrar no Sistema');
assert.ok(html.includes('type="submit"'), 'Botão deve ter type=submit para permitir envio por tecla Enter');
console.log('✓ Botão de ação primária validado com sucesso.');

// 4. LOGIN-05: Acelerador de Testes (Hick e Parkinson)
console.log('4. Testando atalhos rápidos de teste para homologação...');
assert.ok(html.includes('Acesso Rápido para Testes'), 'Seção de acesso rápido para homologação deve estar presente');
assert.ok(html.includes('Admin'), 'Atalho de preenchimento para Admin deve estar disponível');
assert.ok(html.includes('Solicitante'), 'Atalho de preenchimento para Solicitante deve estar disponível');
assert.ok(html.includes('Gestor'), 'Atalho de preenchimento para Gestor deve estar disponível');
console.log('✓ Aceleradores de homologação validados com sucesso.');

console.log('\n============================================================');
console.log('🎉 TODOS OS TESTES DA TELA DE LOGIN (16 LEIS DE UX) PASSARAM!');
console.log('============================================================');
