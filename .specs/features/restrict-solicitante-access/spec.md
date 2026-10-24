# Restrict Solicitante Access Specification

## Problem Statement

O perfil SOLICITANTE (profissionais de saúde e dentistas das Unidades de Saúde da Família) atualmente possui acesso indevido a dados gerenciais sensíveis: o botão "Relatórios" no cabeçalho exibe dados consolidados de custos, honorários, salários e estoque de todas as clínicas, e o endpoint backend `/api/export/sql` carece de autenticação e autorização RBAC, permitindo o download arbitrário de todo o banco de dados. É mandatório restringir o acesso a relatórios e ao dump SQL para o perfil SOLICITANTE na interface gráfica e na camada de API.

## Goals

- Ocultar o botão "Relatórios" no cabeçalho para usuários com perfil SOLICITANTE (mantendo disponível para GESTOR e ADMINISTRADOR).
- Garantir no frontend (`App.tsx`) que o modal de relatórios não possa ser aberto nem renderizado para o perfil SOLICITANTE.
- Proteger o endpoint `GET /api/export/sql` no backend Fastify com middleware de sessão e validação de perfil restrita a ADMINISTRADOR, retornando HTTP 403 Forbidden caso o solicitante tente o acesso.
- Garantir tratamento defensivo no cliente (`handleExportarSQL`) impedindo qualquer tentativa de disparo para perfis não autorizados.

## Out of Scope

Explicitamente excluído para manter o foco do requisito:

| Feature | Reason |
| --- | --- |
| Alterar permissões das abas de Pedidos (PBS) ou Equipamentos | O solicitante continuará abrindo pedidos e chamados normalmente |
| Modificar regras de negócio dos relatórios gerenciais | Geração e cálculos de relatórios permanecem idênticos para Gestor e Admin |
| Alterar schema do banco de dados MySQL ou modelos do Prisma | Estrutura de dados existente permanece inalterada |

---

## Assumptions & Open Questions

Every ambiguity is resolved or recorded here - nothing is left silently unclear.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Visibilidade de Relatórios no Header | Visível apenas para GESTOR e ADMINISTRADOR | Relatórios contêm dados financeiros globais e salários de dentistas, inadequados para USF e técnicos | Yes |
| Permissão de Dump SQL | Exclusivo para ADMINISTRADOR | Dump completo contém dados de toda a base e credenciais do sistema | Yes |
| Resposta do Backend para Solicitante em `/api/export/sql` | HTTP 403 Forbidden com JSON `{ error: 'Acesso negado...' }` | Padrão REST/OWASP para requisições autenticadas sem permissão RBAC | Yes |
| Sessão não autenticada em `/api/export/sql` | HTTP 401 Unauthorized via middleware `authenticate` | Garante que requisições anônimas não façam download do banco | Yes |

**Open questions:** none - all resolved or logged above (required before the spec is confirmed).

---

## User Stories

### P1: Restringir Acesso a Relatórios e Dump SQL para Solicitante ⭐ MVP

**User Story**: Como administrador do sistema, quero que usuários com perfil SOLICITANTE não consigam acessar relatórios gerenciais nem efetuar o dump do banco de dados SQL, para garantir a segurança da informação e a privacidade dos dados da rede de saúde.

**Why P1**: Requisito crítico de segurança e conformidade para evitar vazamento de dados estratégicos, financeiros e estruturais da base de dados.

**Acceptance Criteria**:

1. The system SHALL hide the "Relatórios" button in the Header when the current user profile is 'SOLICITANTE'.
2. IF a user with profile 'SOLICITANTE' attempts to open the reports modal THEN the system SHALL keep the modal closed and block rendering of report data.
3. The system SHALL render the "SQL Dump" button in the Header exclusively when the current user profile is 'ADMINISTRADOR'.
4. WHEN a request is dispatched to 'GET /api/export/sql' without an active authenticated session THEN the system SHALL return HTTP 401 Unauthorized.
5. IF an authenticated user with profile 'SOLICITANTE' requests 'GET /api/export/sql' THEN the system SHALL return HTTP 403 Forbidden with an error message.
6. WHERE the user is authenticated with profile 'ADMINISTRADOR' the system SHALL permit the SQL dump download with HTTP 200 and Content-Type 'text/sql'.

**Independent Test**: Fazer login como solicitante e verificar que o botão Relatórios e o botão SQL Dump não estão visíveis; testar requisição HTTP a `/api/export/sql` e validar retorno 403; fazer login como admin e verificar acesso regular ao SQL Dump e aos Relatórios.

---

## Edge Cases

- IF an unauthenticated user sends a request to `/api/export/sql` THEN the system SHALL return HTTP 401 with error message.
- IF a user with profile 'SOLICITANTE' invokes the export SQL action in frontend THEN the system SHALL intercept the execution and display an error notification.
- IF a user with profile 'TECNICO' requests `/api/export/sql` THEN the system SHALL return HTTP 403 Forbidden.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| AUTH-01 | P1: Restringir Acesso a Relatórios e Dump SQL para Solicitante | Execute | Verified |
| AUTH-02 | P1: Restringir Acesso a Relatórios e Dump SQL para Solicitante | Execute | Verified |
| AUTH-03 | P1: Restringir Acesso a Relatórios e Dump SQL para Solicitante | Execute | Verified |
| AUTH-04 | P1: Restringir Acesso a Relatórios e Dump SQL para Solicitante | Execute | Verified |

**ID format:** `AUTH-NN`

**Status values:** Pending → In Design → In Tasks → Implementing → Verified

**Coverage:** 4 total, 4 mapped to tasks, 0 unmapped ⚠️

---

## Success Criteria

- [x] Usuário logado com perfil SOLICITANTE não vê o botão "Relatórios" no Header.
- [x] Usuário logado com perfil SOLICITANTE não vê o botão "SQL Dump" no Header.
- [x] O componente `ModalRelatorio` nunca é aberto ou alimentado para perfil SOLICITANTE.
- [x] A rota backend `GET /api/export/sql` retorna HTTP 401 para requisições não autenticadas e HTTP 403 para o perfil SOLICITANTE.
- [x] Usuários com perfil GESTOR ou ADMINISTRADOR continuam acessando Relatórios normalmente.
- [x] Usuários com perfil ADMINISTRADOR continuam acessando SQL Dump normalmente.
