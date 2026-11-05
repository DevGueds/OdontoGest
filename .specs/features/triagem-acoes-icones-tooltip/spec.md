# Ícones de Ação com Tooltip na Central de Atendimento & Triagem de Pedidos Specification

## Problem Statement

Na aba **Central de Atendimento & Triagem de Pedidos** (`TriagemTab.tsx`), a coluna de Ações da tabela ainda renderiza botões largos contendo ícone + rótulo textual (`Ficha`, `Cancelar`, `1. Receber`, `2. Atender`, `Qtds`, `3. Enviar`). Isso ocupa espaço horizontal excessivo na tabela e destoa do padrão de botões exclusivamente em ícone (`h-8 w-8 p-0`) com tooltip adotado nas demais tabelas do sistema.

## Goals

- [ ] Converter todos os botões de ação da tabela em `TriagemTab.tsx` para o formato somente ícone (`h-8 w-8 p-0`) sem texto visível no corpo do botão.
- [ ] Exibir tooltip descritivo em cada botão de ação utilizando o componente `Tooltip` (`TooltipProvider`, `Tooltip`, `TooltipTrigger`, `TooltipContent`) além dos atributos nativos `title` e `aria-label`.
- [ ] Preservar integralmente as cores semânticas, ícones, regras de visibilidade por perfil/status e handlers de clique existentes.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Alteração das regras de negócio ou transições de status dos pedidos | O escopo restringe-se à apresentação dos botões de ação como ícones com tooltip. |
| Alteração dos badges informativos de acompanhamento do perfil Solicitante (`Aguardando`, `Em Separação`, `Despachado`) | Badges são indicadores de status, não botões de ação. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Dimensão padrão dos botões de ícone na tabela | `h-8 w-8 p-0` com ícone `h-3.5 w-3.5` | Segue exatamente o padrão de botões de ação em ícone já consolidado em `CatalogoTab`, `UsuariosTab`, `EquipamentosTab` e `HonorariosTab`. | Sim |
| Mecanismo de Tooltip | Componente `Tooltip` (`../ui/tooltip`) combinado com `title` e `aria-label` no `Button` | Garante tooltip visual imediato do design system e acessibilidade nativa via `title`/`aria-label`. | Sim |
| Textos dos tooltips | Manter os textos descritivos já definidos: `Visualizar Ficha PBS`, `Cancelar Solicitação`, `Confirmar Recebimento`, `Atender Itens Solicitados`, `Editar Quantidades Atendidas`, `Despachar Pedido` | Descrevem com clareza cada etapa operacional da triagem sem poluir a linha da tabela. | Sim |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Botões de Ação Somente em Ícone com Tooltip na Triagem ⭐ MVP

**User Story**: Como usuário da Central de Atendimento & Triagem de Pedidos, quero que as ações da tabela sejam exibidas apenas como ícones com tooltip explicativo ao passar o mouse, para manter a tabela compacta, limpa e padronizada.

**Why P1**: Atende diretamente à solicitação de deixar os botões de ação da Central de Atendimento & Triagem de Pedidos somente em ícones com tooltip.

**Acceptance Criteria** (each line is one EARS pattern):

1. The system SHALL render all action buttons in `TriagemTab.tsx` (`Visualizar Ficha PBS`, `Cancelar Solicitação`, `Confirmar Recebimento`, `Atender Itens Solicitados`, `Editar Quantidades Atendidas`, and `Despachar Pedido`) as icon-only buttons with class `h-8 w-8 p-0` and without inline text labels (`Ficha`, `Cancelar`, `1. Receber`, `2. Atender`, `Qtds`, `3. Enviar`).
2. WHEN the user hovers or focuses any action button in `TriagemTab.tsx` THEN the system SHALL provide its corresponding descriptive tooltip via `TooltipContent` and native `title`/`aria-label` attributes (`Visualizar Ficha PBS`, `Cancelar Solicitação`, `Confirmar Recebimento`, `Atender Itens Solicitados`, `Editar Quantidades Atendidas`, `Despachar Pedido`).
3. WHILE rendering action buttons in `TriagemTab.tsx` the system SHALL preserve the existing semantic color classes and click handlers (`onAbrirFicha`, `onCancelarPedido`, `onAbrirRecebimento`, `onAbrirAtendimento`, `onAbrirEnvio`) for each order status and user profile.

**Independent Test**: Acessar a aba "Central de Atendimento & Triagem de Pedidos" e verificar que todos os botões na coluna "Ações" exibem apenas o ícone quadrado (`h-8 w-8 p-0`) e mostram o tooltip correspondente ao passar o cursor.

---

## Edge Cases

- IF the logged-in user has profile `SOLICITANTE` and the order status is `SOLICITADO` THEN the system SHALL render both `Visualizar Ficha PBS` and `Cancelar Solicitação` as icon-only buttons (`h-8 w-8 p-0`) with tooltips alongside the status badge.
- WHEN an order is in `RECEBIDO`, `ATENDIDO_PARCIAL`, or `ATENDIDO_TOTAL` status THEN the system SHALL render all applicable workflow action buttons side by side as `h-8 w-8 p-0` icon-only buttons with their specific tooltips (`Atender Itens Solicitados` vs `Editar Quantidades Atendidas`).

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| TRIAG-01 | P1: Botões de Ação Somente em Ícone (`h-8 w-8 p-0`) sem texto | Execute | Verified |
| TRIAG-02 | P1: Tooltips descritivos (`Tooltip` + `title`/`aria-label`) em todas as ações | Execute | Verified |
| TRIAG-03 | P1: Preservação de handlers, cores semânticas e regras por perfil/status | Execute | Verified |

**Coverage:** 3 total, 3 mapped to tasks, 0 unmapped

---

## Success Criteria

- [x] Nenhum botão de ação em `TriagemTab.tsx` exibe texto inline (`Ficha`, `Cancelar`, `1. Receber`, `2. Atender`, `Qtds`, `3. Enviar`).
- [x] Todos os 7 pontos de renderização de botão em `TriagemTab.tsx` utilizam `h-8 w-8 p-0` e possuem `Tooltip` (`TooltipTrigger` + `TooltipContent`) e `title`/`aria-label`.
- [x] Testes automatizados e build (`npx tsc --noEmit` e `npx vite build`) passam sem erros.
