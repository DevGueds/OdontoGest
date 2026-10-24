# Padronização dos Botões de Ações das Tabelas Specification

## Problem Statement

Atualmente, os botões de ação nas tabelas da aplicação apresentam inconsistências visuais e estruturais entre diferentes telas:
1. **Divergência de dimensões e formato**: Algumas tabelas usam botões com texto e largura dinâmica sujeitos a truncamentos (`hidden xl:inline` em `CatalogoTab`), enquanto outras usam ícones isolados com dimensões desiguais (`h-8 w-8` em `UsuariosTab` vs `h-7 w-7` em `OrcamentoTab` vs `h-7 text-xs` em `TriagemTab` e `EquipamentosTab`).
2. **Cores hardcoded e classes ad-hoc**: Uso disperso de cores hexadecimais legadas (`text-[#2563EB]`, `text-[#EF4444]`) e combinações de hover arbitrárias (`hover:text-red-700`, `hover:bg-red-50`), quebrando a harmonia com o tema clínico e o dark mode.
3. **Ausência de convenção clara entre ações CRUD e ações de Workflow**: Operações CRUD pontuais de linha (Editar, Apagar, Estoque, Preventiva) devem ter um padrão de ícone-botão refinado e compacto (`h-8 w-8`), enquanto transições de workflow (Receber, Enviar, Atender, Aprovar) devem seguir um padrão uniforme de botão com label e ícone (`h-7.5 px-2.5 text-xs`).

## Goals

- [ ] Padronizar todos os botões de ações de linha CRUD (Editar, Apagar/Excluir, Ajustar Estoque, Preventiva) como botões quadrados elegantes (`h-8 w-8 p-0 rounded-md`), com tooltips descritivos via `title` e paleta semântica clínica (Primary para edição, Rose para exclusão, Emerald para estoque, Cyan para preventiva).
- [ ] Padronizar todos os botões de ações de workflow (Triagem e Chamados) com altura uniforme (`h-7.5`), tipografia consistente (`text-xs font-medium`), espaçamento proporcional (`px-2.5 gap-1.5`) e ícones proporcionais (`h-3.5 w-3.5`).
- [ ] Eliminar todas as cores hexadecimais inline e classes de hover divergentes nos botões de tabela em favor de tokens do Tailwind (`text-primary`, `text-rose-600`, `text-emerald-600`, `text-cyan-600`).
- [ ] Padronizar o alinhamento centralizado e larguras de cabeçalho (`TableHead`) das colunas de Ações em todas as tabelas.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Alterações na lógica de negócios ou handlers dos botões | O escopo é estritamente de padronização visual, ergonômica e semântica dos botões nas tabelas. |
| Alterações em tabelas de modais de impressão (Ficha PBS, Relatórios) | Tabelas para impressão em papel possuem estilos específicos para impressão (print media CSS). |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Padrão para ações CRUD em tabelas | Botão `variant="ghost" size="sm"` com dimensões `h-8 w-8 p-0` e tooltip em `title` | Maximiza a densidade informacional da tabela, evita quebras de linha e segue o padrão de UI moderna (shadcn/ui, Linear, Vercel). | Sim |
| Padrão para ações de Workflow | Botão com label e ícone `h-7.5 px-2.5 text-xs font-medium gap-1.5` | Transições de status de pedidos e chamados exigem leitura clara da etapa a ser executada. | Sim |
| Cores semânticas de ação | Editar: Primary; Excluir/Cancelar: Rose; Estoque/Aprovar: Emerald; Preventiva: Cyan; Ficha: Muted/Outline | Mantém coerência cromática clínica em conformidade com AD-001 e AD-003. | Sim |
| Unificação de ícone de edição | Adotar `Pencil` em todas as ações de edição, substituindo ocorrências de `Edit2` | Garante coerência iconográfica em todas as tabelas. | Sim |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Padronização dos Botões de Ações CRUD nas Tabelas ⭐ MVP

**User Story**: Como operador do OdontoGest, quero que os botões de ação de linha nas tabelas de Catálogo, Usuários, Orçamento e Equipamentos tenham dimensões, ícones e cores padronizadas, para uma interface limpa, consistente e agradável.

**Why P1**: Elimina a poluição visual, alinha o design das tabelas ao padrão shadcn/ui e melhora a usabilidade tanto no modo claro quanto escuro.

**Acceptance Criteria** (EARS notation):

1. The system SHALL render row-level CRUD action buttons (Edit, Delete, Stock, Preventive) as standardized icon buttons with `h-8 w-8 p-0 rounded-md` dimensions and `h-3.5 w-3.5` icons across `CatalogoTab`, `UsuariosTab`, `OrcamentoTab`, `DashboardTab`, and `EquipamentosTab`. <!-- ubiquitous -->
2. The system SHALL apply semantic clinical hover styles for edit actions (`text-muted-foreground hover:text-primary hover:bg-primary/10`) and delete actions (`text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 dark:hover:bg-rose-950/30`). <!-- ubiquitous -->
3. The system SHALL provide descriptive `title` and `aria-label` attributes on every table action button. <!-- ubiquitous -->
4. WHEN the user hovers over an action button THEN the system SHALL transition background and text color smoothly without layout shift. <!-- event-driven -->

---

### P2: Padronização dos Botões de Workflow em Triagem e Chamados

**User Story**: Como almoxarife ou técnico, quero que os botões de fluxo operacional (Ficha, Receber, Atender, Enviar, Aprovar, Rejeitar) tenham dimensões uniformes e estilos consistentes com seu significado.

**Why P2**: Reduz a sobrecarga cognitiva e garante clareza nas ações operacionais de pedidos e chamados de manutenção.

**Acceptance Criteria** (EARS notation):

1. The system SHALL render workflow action buttons with uniform height (`h-7.5`), padding (`px-2.5`), font sizing (`text-xs font-medium`), and icon spacing (`gap-1.5`) across `TriagemTab` and `EquipamentosTab`. <!-- ubiquitous -->
2. The system SHALL style primary workflow progression buttons (Receber, Enviar, Concluir) with clinical blue default styling (`bg-[#2563EB] text-white`). <!-- ubiquitous -->
3. The system SHALL style secondary and status actions (Ficha, Atender, Iniciar) with styled outline borders and subtle colored hover effects. <!-- ubiquitous -->
4. The system SHALL style destructive actions (Cancelar, Rejeitar) with rose outline borders (`border-rose-500/30 text-rose-600 hover:bg-rose-500/10`). <!-- ubiquitous -->

---

## Edge Cases

- IF the user views the table on a compact screen THEN the system SHALL preserve button click targets of at least 32px (`h-8 w-8`) without causing horizontal row overflow.
- IF an entity is in read-only mode THEN the system SHALL render the standardized read-only badge/indicator without broken button wrappers.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| BTN-01 | P1: Padronização de Botões CRUD em CatalogoTab | Execute | Verified |
| BTN-02 | P1: Padronização de Botões CRUD em UsuariosTab e OrcamentoTab | Execute | Verified |
| BTN-03 | P1: Padronização de Botões CRUD em DashboardTab e EquipamentosTab | Execute | Verified |
| BTN-04 | P2: Padronização de Botões de Workflow em TriagemTab e Chamados | Execute | Verified |

**Coverage:** 4 total, 4 mapped to tasks, 0 unmapped.

---

## Success Criteria

- [ ] Todos os botões CRUD de linha nas tabelas convertidos para o padrão `h-8 w-8 p-0` com tooltips.
- [ ] Cores hexadecimais inline substituídas por tokens semânticos Tailwind.
- [ ] Botões de workflow em Triagem e Chamados harmonizados com `h-7.5 px-2.5 text-xs`.
- [ ] Ícones de edição unificados para `Pencil`.
- [ ] Build e validação estática sem erros (`npx tsc --noEmit && npx vite build`).
