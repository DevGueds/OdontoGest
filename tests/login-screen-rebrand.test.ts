import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { LoginModal } from '../src/client/components/LoginModal';
import { AuthProvider } from '../src/client/context/AuthContext';

console.log('--- Iniciando Testes Automatizados: Layout Split 60/40 & Rebrand de Login ---');

const html = renderToStaticMarkup(
  React.createElement(AuthProvider, null, React.createElement(LoginModal, null))
);

// 1. Layout Split 60/40 e Wallpaper Nítido
console.log('1. Testando layout split 60/40 e presença nítida da imagem...');
assert.ok(html.includes('lg:w-[60%]'), 'A imagem deve ocupar 60% do layout no desktop');
assert.ok(html.includes('lg:w-[40%]'), 'O formulário deve ocupar 40% do layout no desktop');
assert.ok(html.includes('/login-wallpaper.jpg'), 'A imagem oficial do wallpaper deve estar presente');
assert.ok(html.includes('OdontoGest'), 'O título da marca OdontoGest deve estar visível');
assert.ok(html.includes('Almoxarifado &amp; Gestão Odontológica') || html.includes('Almoxarifado & Gestão Odontológica'), 'O subtítulo oficial deve ser renderizado');
console.log('✓ Layout 60/40 e imagem validados com sucesso.');

// 2. Remoção dos elementos solicitados pelo usuário
console.log('2. Testando remoção de selos e atalhos não desejados...');
assert.ok(!html.includes('Ambiente SUS • Acesso Seguro'), 'O selo de Ambiente SUS foi removido conforme solicitado');
assert.ok(!html.includes('Acesso Rápido para Testes'), 'A seção de acesso rápido para testes foi removida conforme solicitado');
console.log('✓ Elementos excedentes removidos com sucesso.');

// 3. Ergonomia dos Inputs (Fitts, Similarity, Proximity, Jakob)
console.log('3. Testando ergonomia dos campos de e-mail e senha...');
assert.ok(html.includes('id="loginEmail"'), 'Campo de e-mail deve possuir id loginEmail');
assert.ok(html.includes('id="loginSenha"'), 'Campo de senha deve possuir id loginSenha');
assert.ok(html.includes('h-11'), 'Campos de entrada devem ter altura ergonômica de 44px (h-11) para Fitts Law');
assert.ok(html.includes('exemplo@saude.gov.br'), 'Campo de e-mail deve sugerir formato institucional');
assert.ok(html.includes('aria-label="Ver senha"'), 'Botão de revelação de senha deve possuir aria-label acessível');
console.log('✓ Ergonomia de inputs e acessibilidade validadas com sucesso.');

// 4. Botão de Ação Primária (Von Restorff Effect & Doherty Threshold)
console.log('4. Testando botão de ação primária em azul clínico...');
assert.ok(html.includes('bg-sky-600'), 'Botão primário deve utilizar azul clínico (bg-sky-600)');
assert.ok(html.includes('Entrar no Sistema'), 'Botão de submissão deve conter texto descritivo Entrar no Sistema');
assert.ok(html.includes('type="submit"'), 'Botão deve ter type=submit para permitir envio por tecla Enter');
console.log('✓ Botão de ação primária validado com sucesso.');

console.log('\n============================================================');
console.log('🎉 TODOS OS TESTES DO LAYOUT 60/40 DA TELA DE LOGIN PASSARAM!');
console.log('============================================================');
