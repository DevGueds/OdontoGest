# Padronização dos Botões de Ações de Formulários Specification

## Problem Statement

Atualmente, os formulários e modais do sistema (cadastro de unidades, materiais, usuários, honorários, equipamentos, chamados, triagem, pedidos de PBS e orçamentos) apresentam inconsistências visuais e comportamentais em seus botões de ação:
1. Diversos botões de submissão e cancelamento não possuem ícones indicativos da ação.
2. Quase nenhum botão de formulário possui atributo de tooltip (`title` e `aria-label`) para orientar o operador.
3. Botões de cancelamento/fechamento não possuem padronização semântica de cores e estados de hover (muitos usam apenas texto "Cancelar" sem ícone `<X />` e sem transição clara).
4. Botões destrutivos (confirmação de exclusão) e botões de adição de linhas/itens carecem de uniformidade visual em toda a aplicação.

Essa falta de padronização prejudica a ergonomia visual, a acessibilidade e a consistência da experiência do usuário (UX) clínico.

## Goals

- [ ] Definir e aplicar o padrão semântico de cores, ícones, estados de hover e tooltips para todas as ações de formulários no sistema.
- [ ] Botões de **Salvar / Submeter / Confirmar / Cadastrar / Gravar**: Variante primária (`variant="default"` ou sólida clínica `#2563EB`), ícone semântico (`Save`, `Plus`, `Check`, `Send`), transição de elevação/sombra e tooltip descritivo.
- [ ] Botões de **Cancelar / Fechar / Descartar**: Variante `outline` com ícone `<X />`, hover semântico sutil (`hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:hover:bg-rose-950/30`), e tooltip descritivo.
- [ ] Botões de **Excluir / Deletar / Remover (Destrutivos)**: Variante `destructive` / `bg-rose-600 hover:bg-rose-700 text-white`, ícone `<Trash2 />`, e tooltip descritivo.
- [ ] Botões de **Ações Especiais de Formulário (Adicionar Insumo, Exportar Excel/PDF, Ajustar Estoque)**: Cores temáticas (esmeralda para estoque e Excel, primária para PDF e adição), ícones específicos e tooltips.
- [ ] Aplicar a padronização em 100% dos formulários e modais da aplicação.
- [ ] Garantir 0 erros de TypeScript (`npx tsc --noEmit`) e 0 erros de build (`npx vite build`).

## Out of Scope

| Feature | Reason |
| --- | --- |
| Alteração de regras de negócio ou payloads de API | O foco é unificação e padronização visual/acessibilidade dos botões de ação nos formulários. |
| Alteração nas tabelas de dados | As ações de linha de tabelas já foram padronizadas anteriormente. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Padrão para Cancelar em formulários | `variant="outline"` com `<X className="h-4 w-4" />` e hover em tons suaves de rose | Dá clareza imediata de que a ação cancela/descarta as alterações sem ser agressiva como um botão sólido vermelho. | Sim |
| Padrão para Salvar/Confirmar em formulários | `variant="default"` com `<Save className="h-4 w-4" />` (ou `<Plus />` em cadastros, `<Send />` em emissão) | Mantém a identidade azul clínica do OdontoGest com elevação `hover:-translate-y-[1px]` e sombra `hover:shadow-md`. | Sim |
| Presença de Tooltip | Todo botão de formulário conterá `title="..."` e `aria-label="..."` | Garante suporte a leitores de tela e auxílio visual ao passar o mouse. | Sim |
| Tamanho dos botões de rodapé de modais | Altura padrão `h-[38px]` (size `default` ou `sm` dependendo do modal) com `gap-2 text-xs` ou `text-sm` | Mantém proporção harmônica com os inputs do formulário. | Sim |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Padronização Visual e Semântica dos Botões de Formulários e Modais ⭐ MVP

**User Story**: Como usuário do OdontoGest, quero que todos os formulários e caixas de diálogo possuam botões de ação claros, com cores semânticas distintas, ícones expressivos, efeitos suaves de hover e tooltips ao passar o mouse, para que eu possa operar o sistema com segurança e rapidez.

**Why P1**: Elimina inconsistências de usabilidade e reduz erros operacionais em cadastros e atualizações críticas.

**Acceptance Criteria** (EARS notation):

1. The system SHALL display an action icon and descriptive tooltip (`title` and `aria-label`) on all form submit, save, and confirm buttons. <!-- ubiquitous -->
2. The system SHALL display an `X` icon, an outline variant with gentle rose hover effect, and a cancellation tooltip on all form dismiss and cancel buttons. <!-- ubiquitous -->
3. The system SHALL display a `Trash2` icon, a destructive color scheme, and an explicit warning tooltip on all delete and removal confirmation buttons. <!-- ubiquitous -->
4. The system SHALL maintain interactive hover animations (`hover:-translate-y-[1px]`, transitions) across all form action buttons. <!-- ubiquitous -->
5. WHEN any form or modal is rendered across all application screens THEN all action buttons SHALL adhere strictly to these standardized visual and accessible tokens. <!-- event-driven -->

**Independent Test**: Navegar por todos os modais e telas de formulário do sistema, inspecionar os botões de ação e verificar a presença de cor semântica, ícone correspondente, efeito de hover e tooltip visível via `title`.

---

## Edge Cases

- IF a form button is in loading or disabled state THEN the system SHALL maintain accessible disabled styling and avoid pointer events.
- IF a modal contains secondary actions (e.g. Exportar Excel / PDF) THEN the system SHALL apply distinct semantic colors (Emerald for Excel, Primary for PDF) with corresponding icons and tooltips.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| FBTN-01 | P1: Padronização de Botões de Confirmação e Submissão (Salvar/Cadastrar/Registrar) | Execute | Verified |
| FBTN-02 | P1: Padronização de Botões de Cancelamento e Fechamento (Cancelar/Fechar) | Execute | Verified |
| FBTN-03 | P1: Padronização de Botões Destrutivos em Diálogos de Confirmação (Excluir) | Execute | Verified |
| FBTN-04 | P1: Padronização de Ações Especiais de Formulários (Adicionar Insumo, Exportações) | Execute | Verified |
| FBTN-05 | P1: Verificação de Build Limpo e Tipagem TypeScript | Execute | Verified |

**Coverage:** 5 total, 5 mapped to tasks, 0 unmapped.

---

## Success Criteria

- [ ] 100% dos formulários e modais da aplicação utilizam o padrão unificado de botões de ação.
- [ ] Cada botão possui cor semântica dedicada, ícone da ação, transição de hover e tooltip (`title` / `aria-label`).
- [ ] `validate_spec.py` executa com 0 erros.
- [ ] `npx tsc --noEmit` executa com código 0.
- [ ] `npx vite build` gera o pacote de produção perfeitamente.
