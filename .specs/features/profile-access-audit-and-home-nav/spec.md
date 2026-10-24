# Profile Access Audit & Home Navigation Specification

## Problem Statement

Durante o uso operacional do OdontoGest, identificaram-se duas necessidades essenciais de usabilidade e governança de segurança:
1. **Navegação Inicial pela Marca**: O ícone odontológico e o nome "OdontoGest" no cabeçalho superior (`Header.tsx`) são elementos estáticos (`<div>`), sem ação de clique para retornar à tela inicial (Dashboard para Gestores/Admins, ou a tela padrão do perfil logado).
2. **Revisão Geral de Telas e Acessos por Perfil**:
   - Inconsistências de permissão no front-end: em `TriagemTab.tsx`, as ações de recebimento, atendimento e envio de pedidos estavam restritas a `isAdmin`, bloqueando operadores com perfil `GESTOR` (Almoxarifado Central) de movimentar pedidos.
   - Proteção de rotas em `App.tsx`: o guard de abas permitia que perfis `SOLICITANTE` e `GESTOR` alcançassem abas não autorizadas (como `usuarios` ou abas administrativas) sem redirecionamento defensivo para sua tela inicial.
   - Proteção no backend (`server.ts`): endpoints sensíveis (`/api/usuarios`, `/api/honorarios`, `/api/entradas`) realizavam apenas autenticação de sessão, sem validar se o perfil possui autorização para ler ou modificar os recursos.

## Goals

- [ ] Tornar o logotipo e o nome da aplicação no Header interativos e acessíveis, navegando imediatamente para a tela inicial correspondente ao perfil do usuário (`dashboard` para Gestor/Admin, `triagem` ou `novo-pedido` para Solicitante, `equipamentos` para Técnico).
- [ ] Conduzir auditoria e alinhamento completo da matriz de acesso (RBAC) para os 4 perfis (`ADMINISTRADOR`, `GESTOR`, `SOLICITANTE`, `TECNICO`) em componentes de UI, abas, modais e endpoints de API.
- [ ] Habilitar os fluxos operacionais de atendimento na Central de Triagem para o perfil `GESTOR` (Almoxarifado).
- [ ] Proteger endpoints críticos no Fastify (`/api/usuarios`, `/api/honorarios`, `/api/entradas`, `/api/export/sql`) com middleware declarativo de RBAC.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Criação de novos perfis além dos 4 existentes | A taxonomia atual (`ADMINISTRADOR`, `GESTOR`, `SOLICITANTE`, `TECNICO`) cobre todos os papéis da operação municipal. |
| Alteração nas tabelas do banco de dados | O modelo de dados e sessão já armazena e propaga o perfil corretamente. |

---

## Access Control Matrix (RBAC)

| Tela / Recurso | ADMINISTRADOR | GESTOR | SOLICITANTE | TECNICO |
| --- | :---: | :---: | :---: | :---: |
| **Home Tab (Logo Click)** | `dashboard` | `dashboard` | `triagem` / `novo-pedido` | `equipamentos` |
| **Dashboard & Indicadores** | Visualização Total | Visualização Total | Bloqueado | Bloqueado |
| **Central de Triagem / Meus Pedidos** | Gestão & Atendimento | Gestão & Atendimento | Meus Pedidos (Acompanhamento) | Bloqueado |
| **Novo Pedido (PBS)** | Emissão Livre | Emissão Livre | Emissão USF Vinculada | Bloqueado |
| **Equipamentos & Chamados** | Gestão & Aprovação | Gestão & Aprovação | Visualiza USF & Abre Chamado | Atendimento Técnico & Conclusão |
| **Aportes & Orçamento** | Acesso Total | Acesso Total | Bloqueado | Bloqueado |
| **Honorários & Salários** | Acesso Total | Acesso Total | Bloqueado | Bloqueado |
| **Materiais & Unidades (Catálogo)** | Acesso Total | Acesso Total | Bloqueado | Bloqueado |
| **Usuários & Acessos** | Acesso Total | Bloqueado | Bloqueado | Bloqueado |
| **Exportar Relatórios (PDF/XLS)** | Permitido | Permitido | Bloqueado | Bloqueado |
| **Exportar DUMP SQL** | Permitido | Bloqueado | Bloqueado | Bloqueado |

---

## User Stories

### P1: Navegação Inicial pelo Logotipo & Marca ⭐ MVP

**User Story**: Como usuário logado no OdontoGest, quero clicar no logotipo ou no nome do sistema no cabeçalho superior para retornar à minha tela inicial (Dashboard para gestores/admins ou meus pedidos/equipamentos para técnicos e solicitantes).

**Acceptance Criteria** (EARS notation):
1. The system SHALL render the brand logo and application title in `Header.tsx` as an interactive button with hover feedback and `aria-label="Ir para a página inicial"`. <!-- ubiquitous -->
2. WHEN the user clicks the brand logo or title in `Header.tsx` THEN the system SHALL navigate to the user's home tab according to their profile: `dashboard` for `ADMINISTRADOR` and `GESTOR`, `triagem` for `SOLICITANTE`, and `equipamentos` for `TECNICO`. <!-- event-driven -->

---

### P2: Revisão e Correção de Acesso na Central de Triagem (Gestor)

**User Story**: Como Gestor do Almoxarifado Central, quero poder receber, atender e despachar pedidos na Central de Triagem para que o fluxo de distribuição de materiais às USFs não fique travado.

**Acceptance Criteria** (EARS notation):
1. WHERE the user has profile `GESTOR` or `ADMINISTRADOR` the system SHALL display the operational action buttons (Receber, Atender, Enviar) in `TriagemTab.tsx`. <!-- optional-feature -->
2. WHERE the user has profile `SOLICITANTE` the system SHALL display only the order tracking badges and allow cancellation only if the order status is `SOLICITADO`. <!-- optional-feature -->

---

### P3: Proteção e Redirecionamento Defensivo de Abas no Shell

**User Story**: Como administrador de segurança, quero que o shell da aplicação (`App.tsx` e `Navigation.tsx`) impeça qualquer tentativa de acesso a abas não autorizadas, redirecionando automaticamente o usuário para sua tela inicial.

**Acceptance Criteria** (EARS notation):
1. IF a user with profile `SOLICITANTE` attempts to select or access `dashboard`, `orcamento`, `honorarios`, `catalogo`, or `usuarios` THEN the system SHALL redirect them to `triagem` and display an informational security toast. <!-- complex -->
2. IF a user with profile `GESTOR` attempts to access `usuarios` THEN the system SHALL redirect them to `dashboard`. <!-- complex -->
3. IF a user with profile `TECNICO` attempts to access any tab other than `equipamentos` THEN the system SHALL redirect them to `equipamentos`. <!-- complex -->

---

### P4: Validação RBAC nos Endpoints do Backend

**User Story**: Como auditor de segurança, quero que a API Fastify valide estritamente o perfil do usuário em endpoints sensíveis para impedir bypass de permissões via requisições HTTP diretas.

**Acceptance Criteria** (EARS notation):
1. The system SHALL reject requests to `/api/usuarios` (GET, POST, PUT, DELETE) with HTTP 403 Forbidden unless the authenticated session has `perfil === 'ADMINISTRADOR'`. <!-- ubiquitous -->
2. The system SHALL reject requests to `/api/honorarios` and `/api/entradas` with HTTP 403 Forbidden unless the authenticated session has `perfil === 'ADMINISTRADOR'` or `perfil === 'GESTOR'`. <!-- ubiquitous -->

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| **HOME-01** | P1: Brand Header Navigation to Home | Execute | Pending |
| **RBAC-01** | P2: Triagem Gestor Operational Actions | Execute | Pending |
| **RBAC-02** | P3: Client Shell Tab Guard & Redirection | Execute | Pending |
| **RBAC-03** | P4: Backend RBAC Middleware Enforcement | Execute | Pending |

**Coverage:** 4 total, 4 mapped to tasks, 0 unmapped.

---

## Success Criteria

- [ ] Clicar no logo/marca do Header redireciona instantaneamente para a tela inicial correta do perfil logado.
- [ ] Perfil Gestor consegue receber, atender e despachar pedidos na Central de Triagem.
- [ ] Tentativa de acesso a abas restritas por Solicitante ou Técnico é interceptada com redirecionamento limpo.
- [ ] Endpoints `/api/usuarios`, `/api/honorarios` e `/api/entradas` bloqueiam acessos não autorizados com status 403.
- [ ] Compilação TypeScript e build de produção passam com 0 erros.
