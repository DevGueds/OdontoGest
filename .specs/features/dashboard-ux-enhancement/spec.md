# Dashboard UX Enhancement & Data Visualization Specification

## Problem Statement

O Dashboard gerencial do OdontoGest atualmente exibe múltiplos dados críticos (orçamento segregado, despesas de custeio, estoque crítico, consolidação multiclínica e pedidos recentes) empilhados verticalmente de forma monolítica e sobrecarregada, com tabelas extensas e ausência de visualização gráfica analítica moderna. Gestores e administradores precisam de uma interface de alto impacto com hierarquia clara, gráficos analíticos interativos (composição de despesas, consumo por unidade e pipeline de pedidos) e organização ergonômica com alternância fluida entre visão executiva e detalhamento operacional.

## Goals

- Implementar componentes de gráficos vetoriais nativos (SVG interativo) para composição de custeio (Donut Chart), ranking de consumo por unidade de saúde (Bar Chart) e distribuição do pipeline de pedidos (Pipeline Distribution Chart).
- Reestruturar a arquitetura de informação do Dashboard em seções coerentes: KPIs executivos de topo, Painel Gráfico Analítico e visualizações tabulares organizadas via abas ergonômicas (`@radix-ui/react-tabs`).
- Prover microinterações, filtros rápidos e suporte impecável aos modos Claro e Escuro com paleta Modern Clinical.
- Manter 100% da integridade dos cálculos financeiros (`dbService.getSaldosNaturezaRecursos` e `dbService.getConsolidacaoFinanceiraLocal`) e ações de modal existentes.

## Out of Scope

Explicitamente excluído para manter foco e estabilidade:

| Feature | Reason |
| --- | --- |
| Alterações em fórmulas de cálculo ou regras de negócio financeiras | Lógicas do `dbService` permanecem intactas |
| Modificação de endpoints de backend ou banco de dados | Escopo estritamente focado em UX e visualização no frontend |
| Inclusão de bibliotecas pesadas de gráficos via npm (ex: Chart.js, Recharts) | Uso de componentes SVG modulares nativos garantindo performance, leveza e customização total |

---

## Assumptions & Open Questions

Every ambiguity is resolved or recorded here - nothing is left silently unclear.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Biblioteca de Gráficos | SVG nativo com Tailwind CSS | Zero overhead de dependências, integração nativa com dark mode e alta fidelidade visual | Yes |
| Organização de Detalhes | Radix Tabs para alternar tabelas analíticas | Elimina rolagem vertical excessiva e permite ao gestor focar na métrica desejada | Yes |
| Componente UI Tabs | Criar primitive `src/client/components/ui/tabs.tsx` | Segue o padrão shadcn/ui do projeto integrado ao Radix UI já instalado | Yes |
| Paleta Visual | Modern Clinical (Emerald para Custeio, Blue para Investimento, Amber para Triagem, Rose para Zerados) | Harmoniza com o tema global do OdontoGest | Yes |

**Open questions:** none - all resolved or logged above (required before the spec is confirmed).

---

## User Stories

### P1: Modernização e Organização UX do Dashboard com Gráficos Analíticos ⭐ MVP

**User Story**: Como gestor ou administrador de saúde, quero visualizar o resumo operacional e financeiro através de KPIs destacados, gráficos interativos e abas de detalhamento organizadas, para tomar decisões ágeis de reposição de insumos e remanejamento orçamentário.

**Why P1**: Núcleo da experiência executiva e gerencial do sistema OdontoGest.

**Acceptance Criteria**:

1. The system SHALL render 4 top executive KPI cards displaying available Custeio balance, Investment balance, orders awaiting triage, and critical supply count with percentage progress bars.
2. The system SHALL render an interactive SVG Donut Chart displaying the percentage and absolute distribution of Custeio expenses across Insumos PBS, Folha/RH, and Manutenção.
3. The system SHALL render an SVG Bar Chart ranking health units by financial consumption with responsive bar scales and formatted monetary values.
4. The system SHALL render an operational pipeline chart illustrating the distribution of pedidos across their lifecycle statuses.
5. WHEN the user clicks on a detail tab (Visão Geral, Insumos Críticos, Consolidação por Unidade, Atividade Recente) THEN the system SHALL display the respective section without vertical layout shifts.
6. WHILE hovering over chart elements or action buttons the system SHALL display smooth micro-interactions and tooltips with accurate data values.
7. IF no critical supplies or recent orders exist for the current filter THEN the system SHALL render an informative and styled empty state.

**Independent Test**: Acessar a aba Dashboard como Gestor ou Administrador, interagir com os gráficos de Custeio e Unidades, alternar entre as abas de detalhamento e verificar a atualização imediata dos dados e filtros de estoque.

---

## Edge Cases

- IF total Custeio expenditure is zero THEN the system SHALL display an empty/neutral ring in the Donut Chart with a clear zero-expenditure message.
- IF an establishment has zero recorded expenses THEN the system SHALL render a baseline indicator without layout collapse.
- IF the screen width is narrow (mobile) THEN the system SHALL adapt chart layouts and tables responsively.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| DASH-01 | P1: Modernização e Organização UX do Dashboard | Execute | Verified |
| DASH-02 | P1: Modernização e Organização UX do Dashboard | Execute | Verified |
| DASH-03 | P1: Modernização e Organização UX do Dashboard | Execute | Verified |
| DASH-04 | P1: Modernização e Organização UX do Dashboard | Execute | Verified |
| DASH-05 | P1: Modernização e Organização UX do Dashboard | Execute | Verified |

**ID format:** `DASH-NN`

**Status values:** Pending → In Design → In Tasks → Implementing → Verified

**Coverage:** 5 total, 5 mapped to tasks, 0 unmapped ⚠️

---

## Success Criteria

- [x] Top 4 KPI cards com indicadores de progresso percentual e status claros.
- [x] Gráfico Donut SVG de Composição de Custeio renderizado com legendas limpas e valores exatos.
- [x] Gráfico de Barras SVG de Consumo por Unidade de Saúde com ordenação e visualização intuitiva.
- [x] Gráfico de Pipeline de Pedidos exibindo o funil de atendimento do Almoxarifado.
- [x] Abas ergonômicas (Radix Tabs) para navegação ágil entre tabelas sem rolagem excessiva.
- [x] 0 regressões de TypeScript e compilação de produção limpa.
