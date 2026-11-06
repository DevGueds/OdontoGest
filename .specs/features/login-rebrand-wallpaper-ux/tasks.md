# Tasks: Rebrand da Tela de Login & Wallpaper Clínico (16 Leis de UX)

## Test Coverage Matrix

| Area | Requirement | Scenario | Test Type | Automated? |
| --- | --- | --- | --- | --- |
| Wallpaper & Layout | LOGIN-01, LOGIN-02 | Wallpaper renders full viewport, card has glassmorphism and WCAG AAA contrast | Static/Visual | Yes |
| Input & CTA Ergonomics | LOGIN-03, LOGIN-04 | 44px hit targets, password toggle, clinical blue CTA button, loading state | Unit/E2E | Yes |
| Test Credential Accelerator | LOGIN-05 | Quick-fill profile badges automatically populate email and password fields | Unit/E2E | Yes |
| Build & Type Integrity | LOGIN-01..05 | Full TypeScript check and Vite production build pass without errors | Static/Build | Yes |

*Gate check command:* `npx tsc --noEmit` and `npx vite build`.

---

## Gate Check Commands

- Quick gate: `npx tsc --noEmit`
- Full gate: `npx tsc --noEmit && npx vite build`

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

```
T1 → T2 → T3 → T4
```

---

## Task Breakdown

### T1: Integrar o Wallpaper e Estrutura Glassmorphism na Tela de Login

**What**: Configurar o wallpaper oficial odontológico como plano de fundo full viewport responsivo e criar o card de autenticação com acabamento em Glassmorphism clínico (`backdrop-blur-xl bg-white/90 dark:bg-slate-950/90 shadow-2xl border border-white/60 rounded-2xl`).
**Where**: `src/client/components/LoginModal.tsx`
**Depends on**: None
**Requirement**: LOGIN-01, LOGIN-02
**Tools**:
- MCP: `filesystem`
- Skill: NONE

**Done when**:
- [x] O wallpaper `login-wallpaper.jpg` é importado e aplicado no plano de fundo com `bg-cover bg-center` e overlay suave
- [x] O card de login utiliza `backdrop-blur-xl`, cantos arredondados `rounded-2xl` e bordas translúcidas
- [x] Tipografia e ícones possuem contraste nítido em conformidade com WCAG AAA
- [x] `npx tsc --noEmit` passa sem erros

**Tests**: static
**Gate**: quick

---

### T2: Otimizar Interações dos Inputs e Ações Conforme as 16 Leis de UX

**What**: Aplicar Fitts's Law (inputs com altura mínima 44px, botão de alternância de senha acessível com target amplo), Von Restorff Effect (botão CTA destacado em azul clínico com elevação e gradiente), Doherty Threshold (feedback imediato e loading com desativação do botão) e Proximity/Similarity (agrupamentos lógicos e foco padronizado).
**Where**: `src/client/components/LoginModal.tsx`
**Depends on**: T1
**Requirement**: LOGIN-03, LOGIN-04
**Tools**:
- MCP: `filesystem`
- Skill: NONE

**Done when**:
- [x] Inputs de e-mail e senha possuem altura mínima de 44px com ícones `Mail` e `KeyRound`
- [x] Botão de revelar/ocultar senha possui `aria-label` e target de clique amplo
- [x] Botão de submissão possui gradiente azul clínico (`from-sky-600 to-blue-700`), hover táctil e estado loading com spinner
- [x] Caixa de alerta de erro com semântica visual e ícone de aviso em proximidade lógica

**Tests**: static
**Gate**: quick

---

### T3: Implementar Acelerador de Teste para Ambientes de Homologação

**What**: Implementar seletor rápido expansível com os 3 perfis de teste (Administrador, Solicitante e Gestor) permitindo autopreenchimento imediato em 1 clique (Hick's Law e Parkinson's Law) e criar teste automatizado em `tests/login-screen-rebrand.test.ts`.
**Where**: `tests/login-screen-rebrand.test.ts`
**Depends on**: T2
**Requirement**: LOGIN-05
**Tools**:
- MCP: `filesystem`
- Skill: NONE

**Done when**:
- [x] Seção colapsável de acesso rápido exibe badges para Administrador, Solicitante e Gestor
- [x] Clicar em qualquer perfil preenche os campos `email` e `senha` instantaneamente
- [x] Teste automatizado valida a renderização e o comportamento de autopreenchimento e conformidade das 16 leis
- [x] Teste passa com sucesso via `npx tsx tests/login-screen-rebrand.test.ts`

**Tests**: integration
**Gate**: quick

---

### T4: Verificação de Build Limpo e Conformidade Geral

**What**: Executar compilação completa TypeScript e build de produção Vite para assegurar que nenhum tipo foi quebrado e que os assets foram corretamente empacotados.
**Where**: `package.json`
**Depends on**: T3
**Requirement**: LOGIN-01, LOGIN-02, LOGIN-03, LOGIN-04, LOGIN-05
**Tools**:
- MCP: `filesystem`
- Skill: NONE

**Done when**:
- [x] `npx tsc --noEmit` executa sem nenhum erro
- [x] `npx vite build` gera o pacote de produção em `dist/public` com sucesso

**Tests**: static/build
**Gate**: full

---
