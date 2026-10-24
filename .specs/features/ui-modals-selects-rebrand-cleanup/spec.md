# UI Modals, Selects & Rebrand Cleanup Specification

## Problem Statement

Durante a revisão visual e ergonômica do OdontoGest, identificaram-se três desalinhamentos estéticos e de usabilidade:
1. **Ações destrutivas com diálogos nativos**: Operações de exclusão (apagar usuário em `UsuariosTab`, remover aporte em `OrcamentoTab`, excluir unidade e material em `CatalogoTab`, cancelar pedido em `App.tsx`) acionam a função síncrona `confirm()` do navegador ao invés de um modal de confirmação estilizado (shadcn/ui).
2. **Selects nativos despadronizados**: Formulários e filtros utilizam elementos `<select>` nativos sem a sofisticação e acessibilidade da biblioteca shadcn/ui (`@radix-ui/react-select`).
3. **Ícones com cor roxa legada (`#6366F1`)**: Diversos componentes e modais (`TriagemTab`, `EquipamentosTab`, `CatalogoTab`, `ModalRecebimento`, `ModalFichaPbs`, `ModalEnvio`, `ModalAtendimento`) ainda utilizam o tom roxo/índigo antigo ao invés do azul clínico oficial (`#2563EB`).

## Goals

- [ ] Implementar um componente shadcn de diálogo de confirmação (`ConfirmDeleteDialog`) acessível, destrutivo e animado, substituindo todos os 5 usos de `confirm()` nativo no sistema.
- [ ] Implementar o componente `select.tsx` no padrão shadcn/ui baseado em `@radix-ui/react-select` com tokens de tema clínico e dark mode.
- [ ] Substituir todas as ocorrências residuais de cores roxas/índigo (`#6366F1`, `#4F46E5`, `#818CF8`) pela paleta azul clínico (`#2563EB` / `#1D4ED8`).

## Out of Scope

| Feature | Reason |
| --- | --- |
| Alterações de schema no Prisma ou backend | O escopo é estritamente de componentes visuais, diálogos e padronização de tokens. |

---

## User Stories

### P1: Modais de Confirmação para Ações de Exclusão ⭐ MVP

**User Story**: Como usuário do OdontoGest, quero que as ações de exclusão abram um modal de confirmação moderno e seguro da aplicação, ao invés do alerta nativo do navegador, para uma experiência fluida e profissional.

**Acceptance Criteria** (EARS notation):
1. The system SHALL render a styled confirmation dialog (`ConfirmDeleteDialog`) with clear warning text, a destructive confirmation button, and a cancel button whenever a delete action is requested. <!-- ubiquitous -->
2. WHEN the user confirms deletion in the modal THEN the system SHALL execute the delete handler, display a success toast, and close the modal. <!-- event-driven -->
3. WHEN the user clicks cancel or dismisses the modal THEN the system SHALL abort the deletion without modifying data. <!-- event-driven -->

---

### P2: Componente Select shadcn/ui

**User Story**: Como usuário, quero que os menus de seleção (selects) sigam o design system shadcn/ui com suporte a temas, cantos refinados e anéis de foco azul clínico.

**Acceptance Criteria** (EARS notation):
1. The system SHALL provide the official shadcn/ui `Select` component suite in `src/client/components/ui/select.tsx` wrapping `@radix-ui/react-select`. <!-- ubiquitous -->
2. The system SHALL render select triggers with clinical blue focus rings (`focus:ring-[#2563EB]/20 focus:border-[#2563EB]`) and dark mode background consistency. <!-- ubiquitous -->

---

### P3: Eliminação de Cores Roxas Residuais

**User Story**: Como usuário, quero que toda a aplicação reflita a identidade azul clínico sem ícones ou botões remanescentes na cor roxa.

**Acceptance Criteria** (EARS notation):
1. The system SHALL replace all residual `#6366F1`, `#4F46E5`, and `#818CF8` color codes with clinical blue (`#2563EB` / `#1D4ED8` and subtle background tint `#2563EB/10`). <!-- ubiquitous -->
2. The system SHALL have zero residual occurrences of the legacy purple color in active client tab and modal components. <!-- ubiquitous -->

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| **MODAL-01** | P1: Confirm Delete Dialog Component | Execute | Pending |
| **MODAL-02** | P1: Replace All Native confirm() Calls | Execute | Pending |
| **SELECT-01** | P2: Shadcn/ui Select Component Suite | Execute | Pending |
| **REBRAND-03** | P3: Purge Residual Purple Color Codes | Execute | Pending |

**Coverage:** 4 total, 4 mapped to tasks, 0 unmapped.
