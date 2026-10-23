# UI Modernization & Rebrand Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/ui-modernization-shadcn/design.md`
**Status**: Draft

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: none - strong defaults applied.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| UI Primitives / Helpers | none | Typecheck & build validation | `src/client/components/ui/*.tsx` | `npx tsc --noEmit` |
| UI Shell & Layout | none | Typecheck & build validation | `src/client/components/*.tsx` | `npx tsc --noEmit` |
| Operational & Secondary Tabs | none | Typecheck & build validation | `src/client/components/tabs/*.tsx` | `npx tsc --noEmit` |
| Dialog Modals | none | Typecheck & build validation | `src/client/components/modals/*.tsx` | `npx tsc --noEmit` |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | After component changes or UI primitive creation | `npx tsc --noEmit` |
| Full | After phase completion | `npx tsc --noEmit && npx vite build` |
| Build | Full project build verification | `npm run build` |

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Foundation & Design System Primitives

```
T1 → T2 → T3 → T4 → T5
```

### Phase 2: App Shell & Global Navigation Rebrand

```
T6 → T7 → T8 → T9
```

### Phase 3: Core Operational Tabs & Modals

```
T10 → T11 → T12
```

### Phase 4: Secondary Tabs & Dialog Modals

```
T13 → T14 → T15 → T16
```

---

## Task Breakdown

### Phase 1: Foundation & Design System Primitives

#### T1: Install Tailwind CSS, Radix UI Primitives, and Lucide Icons

**What**: Install tailwindcss, postcss, autoprefixer, clsx, tailwind-merge, class-variance-authority, lucide-react, and @radix-ui primitives.
**Where**: `package.json`
**Depends on**: None
**Reuses**: Existing Vite setup
**Requirement**: UI-01

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Dependencies added to package.json and installed via npm
- [ ] No installation errors or conflicts with React 19
- [ ] Gate check passes: `npx tsc --noEmit`

**Tests**: none
**Gate**: Quick

---

#### T2: Configure Tailwind CSS and Modern Clinical CSS Variables

**What**: Create tailwind.config.js, postcss.config.js, and configure index.css with theme tokens for Light and Dark modes.
**Where**: `src/client/index.css`
**Depends on**: T1
**Reuses**: Design tokens from design.md
**Requirement**: UI-01

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] tailwind.config.js configured with dark mode class and color tokens
- [ ] postcss.config.js configured with tailwindcss and autoprefixer
- [ ] index.css contains @tailwind directives and Modern Clinical HSL variables
- [ ] Gate check passes: `npx tsc --noEmit`

**Tests**: none
**Gate**: Quick

---

#### T3: Create cn() Utility Helper

**What**: Implement class name merging helper combining clsx and tailwind-merge.
**Where**: `src/client/lib/utils.ts`
**Depends on**: T2
**Reuses**: clsx and tailwind-merge
**Requirement**: UI-01

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] cn function exported and properly typed
- [ ] Merges Tailwind classes without conflicts
- [ ] Gate check passes: `npx tsc --noEmit`

**Tests**: none
**Gate**: Quick

---

#### T4: Implement ThemeProvider and Dark Mode Hook

**What**: Create ThemeContext providing light/dark state with localStorage persistence.
**Where**: `src/client/context/ThemeContext.tsx`
**Depends on**: T3
**Reuses**: React Context pattern from AuthContext.tsx
**Requirement**: UI-02

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] ThemeContext provides theme, setTheme, and toggleTheme
- [ ] Adds/removes 'dark' class on document.documentElement
- [ ] Persists user choice in localStorage
- [ ] Gate check passes: `npx tsc --noEmit`

**Tests**: none
**Gate**: Quick

---

#### T5: Create shadcn UI Primitives

**What**: Implement Button, Card, Badge, Dialog, Input, Table, and Tooltip primitives.
**Where**: `src/client/components/ui/button.tsx`
**Depends on**: T4
**Reuses**: src/client/lib/utils.ts
**Requirement**: UI-01

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Primitives created in src/client/components/ui/
- [ ] CVA variants configured for Modern Clinical colors
- [ ] Gate check passes: `npx tsc --noEmit`

**Tests**: none
**Gate**: Quick

---

### Phase 2: App Shell & Global Navigation Rebrand

#### T6: Modernize Header Component

**What**: Redesign Header with Modern Clinical branding, user profile pill, theme toggle switch, and Lucide icons.
**Where**: `src/client/components/Header.tsx`
**Depends on**: T5
**Reuses**: ThemeContext and Button primitive
**Requirement**: UI-02

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Modern OdontoGest logo with cyan gradient badge
- [ ] Integrated Sun/Moon toggle for Dark Mode
- [ ] Replaced FontAwesome icons with Lucide icons
- [ ] Preserved all props and handlers (onExportarSQL, onAbrirModalRelatorios, logout)
- [ ] Gate check passes: `npx tsc --noEmit`

**Tests**: none
**Gate**: Quick

---

#### T7: Modernize Navigation Sidebar Component

**What**: Refactor Navigation into a collapsible sidebar with compact icon mode, tooltips, and Lucide icons.
**Where**: `src/client/components/Navigation.tsx`
**Depends on**: T6
**Reuses**: Tooltip and Badge primitives
**Requirement**: UI-03

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Sidebar supports expanded and compact icon-only modes
- [ ] Tooltips displayed on hover in compact mode
- [ ] Role-based access control tabs preserved
- [ ] Gate check passes: `npx tsc --noEmit`

**Tests**: none
**Gate**: Quick

---

#### T8: Modernize Toast and LoginModal Components

**What**: Restyle Toast notifications and LoginModal using shadcn Dialog and Badge primitives.
**Where**: `src/client/components/Toast.tsx`
**Depends on**: T7
**Reuses**: Dialog and Badge primitives
**Requirement**: UI-05

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Toast notifications render with smooth animations and Lucide icons
- [ ] LoginModal uses modern card/dialog styling with high contrast inputs
- [ ] Gate check passes: `npx tsc --noEmit`

**Tests**: none
**Gate**: Quick

---

#### T9: Update App.tsx Shell Layout

**What**: Integrate ThemeProvider, modernized Header, collapsible Navigation, and responsive container layout into App.tsx.
**Where**: `src/client/App.tsx`
**Depends on**: T8
**Reuses**: Header, Navigation, Toast, ThemeProvider
**Requirement**: UI-01

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] AppContent wrapped in ThemeProvider
- [ ] Layout dynamically adjusts to sidebar expanded/collapsed state
- [ ] No regression in data loading or modal state handlers
- [ ] Gate check passes: `npx tsc --noEmit && npx vite build`

**Tests**: none
**Gate**: Full

---

### Phase 3: Core Operational Tabs & Modals

#### T10: Modernize DashboardTab Component

**What**: Rebuild KPI metric cards, charts, and summary tables in DashboardTab using shadcn Card and Badge primitives.
**Where**: `src/client/components/tabs/DashboardTab.tsx`
**Depends on**: T9
**Reuses**: Card and Badge primitives
**Requirement**: UI-06

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Metric cards modernized with subtle borders and Lucide icons
- [ ] Financial KPIs and alerts styled with Modern Clinical palette
- [ ] Gate check passes: `npx tsc --noEmit`

**Tests**: none
**Gate**: Quick

---

#### T11: Modernize TriagemTab and NovoPedidoTab

**What**: Modernize order triage tables and PBS order creation form using shadcn Input, Select, and Table primitives.
**Where**: `src/client/components/tabs/NovoPedidoTab.tsx`
**Depends on**: T10
**Reuses**: Card, Input, Button, Badge, Table primitives
**Requirement**: UI-07

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Form sections use modern clinical card layout with clear visual hierarchy
- [ ] Status badges semantic in TriagemTab
- [ ] Item addition and stock validation limits preserved intact
- [ ] Gate check passes: `npx tsc --noEmit`

**Tests**: none
**Gate**: Quick

---

#### T12: Modernize Core Operational Modals

**What**: Restyle ModalRecebimento, ModalAtendimento, ModalEnvio, and ModalFichaPbs with shadcn Dialog primitives.
**Where**: `src/client/components/modals/ModalFichaPbs.tsx`
**Depends on**: T11
**Reuses**: Dialog, Button, Input primitives
**Requirement**: UI-09

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Modal backdrops feature backdrop-blur with smooth fade-in
- [ ] ModalFichaPbs formatted cleanly for print/view
- [ ] Gate check passes: `npx tsc --noEmit && npx vite build`

**Tests**: none
**Gate**: Full

---

### Phase 4: Secondary Tabs & Dialog Modals

#### T13: Modernize EquipamentosTab Component

**What**: Modernize equipment catalog, maintenance requests, and work order filters using shadcn Table and Card primitives.
**Where**: `src/client/components/tabs/EquipamentosTab.tsx`
**Depends on**: T12
**Reuses**: Table, Card, Button, Badge primitives
**Requirement**: UI-11

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Equipment list and maintenance ticket tables modernized
- [ ] Technician and Manager view modes preserved
- [ ] Gate check passes: `npx tsc --noEmit`

**Tests**: none
**Gate**: Quick

---

#### T14: Modernize OrcamentoTab and HonorariosTab

**What**: Modernize budget resource entries and dental payroll/fees tables using shadcn Table and Badge primitives.
**Where**: `src/client/components/tabs/OrcamentoTab.tsx`
**Depends on**: T13
**Reuses**: Table, Card, Badge primitives
**Requirement**: UI-11

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Financial balance cards and transaction tables restyled
- [ ] Currency formatters and calculations remain intact
- [ ] Gate check passes: `npx tsc --noEmit`

**Tests**: none
**Gate**: Quick

---

#### T15: Modernize CatalogoTab and UsuariosTab

**What**: Modernize materials catalog, healthcare units, and user access management tables.
**Where**: `src/client/components/tabs/CatalogoTab.tsx`
**Depends on**: T14
**Reuses**: Table, Card, Input, Button primitives
**Requirement**: UI-11

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Material catalog and unit listings restyled with search inputs
- [ ] User role badges color-coded with Modern Clinical tokens
- [ ] Gate check passes: `npx tsc --noEmit`

**Tests**: none
**Gate**: Quick

---

#### T16: Modernize Catalog and Reporting Dialog Modals

**What**: Restyle ModalMaterial, ModalEditarMaterial, ModalAjusteEstoque, ModalUnidade, ModalEditarUnidade, and ModalRelatorio with shadcn Dialog primitives.
**Where**: `src/client/components/modals/ModalRelatorio.tsx`
**Depends on**: T15
**Reuses**: Dialog, Button, Input primitives
**Requirement**: UI-13

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] All editing and creation modals modernized with shadcn Dialog
- [ ] Report generation filters (PDF/Excel) formatted cleanly
- [ ] FontAwesome CDN reference removed from index.html
- [ ] Gate check passes: `npm run build`

**Tests**: none
**Gate**: Build

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4

Phase 1:  T1 → T2 → T3 → T4 → T5
Phase 2:  T6 → T7 → T8 → T9
Phase 3:  T10 → T11 → T12
Phase 4:  T13 → T14 → T15 → T16
```

---

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1: Install Tailwind and Radix dependencies | 1 file (package.json) | ✅ Granular |
| T2: Configure Tailwind and CSS variables | 1 stylesheet + configs | ✅ Granular |
| T3: Create cn() utility helper | 1 utility file | ✅ Granular |
| T4: Implement ThemeProvider context | 1 context provider | ✅ Granular |
| T5: Create shadcn UI primitives | UI component set | ✅ Granular |
| T6: Modernize Header component | 1 component | ✅ Granular |
| T7: Modernize Navigation component | 1 component | ✅ Granular |
| T8: Modernize Toast and LoginModal | 2 shell components | ✅ Granular |
| T9: Update App.tsx shell layout | 1 shell file | ✅ Granular |
| T10: Modernize DashboardTab | 1 tab component | ✅ Granular |
| T11: Modernize Triagem and NovoPedido | 2 operational tabs | ✅ Granular |
| T12: Modernize core operational modals | Operational modals | ✅ Granular |
| T13: Modernize EquipamentosTab | 1 tab component | ✅ Granular |
| T14: Modernize Orcamento and Honorarios | 2 financial tabs | ✅ Granular |
| T15: Modernize Catalogo and Usuarios | 2 administrative tabs | ✅ Granular |
| T16: Modernize catalog/report modals | Administrative modals | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | None | ✅ Match |
| T2 | T1 | T1 | ✅ Match |
| T3 | T2 | T2 | ✅ Match |
| T4 | T3 | T3 | ✅ Match |
| T5 | T4 | T4 | ✅ Match |
| T6 | T5 | T5 | ✅ Match |
| T7 | T6 | T6 | ✅ Match |
| T8 | T7 | T7 | ✅ Match |
| T9 | T8 | T8 | ✅ Match |
| T10 | T9 | T9 | ✅ Match |
| T11 | T10 | T10 | ✅ Match |
| T12 | T11 | T11 | ✅ Match |
| T13 | T12 | T12 | ✅ Match |
| T14 | T13 | T13 | ✅ Match |
| T15 | T14 | T14 | ✅ Match |
| T16 | T15 | T15 | ✅ Match |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1 | Build configuration | none | none | ✅ OK |
| T2 | Stylesheet / Tokens | none | none | ✅ OK |
| T3 | Utility helper | none | none | ✅ OK |
| T4 | Context Provider | none | none | ✅ OK |
| T5 | UI Primitives | none | none | ✅ OK |
| T6 | Shell Component | none | none | ✅ OK |
| T7 | Navigation Component | none | none | ✅ OK |
| T8 | Shell Components | none | none | ✅ OK |
| T9 | Shell Layout | none | none | ✅ OK |
| T10 | Operational Tab | none | none | ✅ OK |
| T11 | Operational Tabs | none | none | ✅ OK |
| T12 | Dialog Modals | none | none | ✅ OK |
| T13 | Secondary Tab | none | none | ✅ OK |
| T14 | Secondary Tabs | none | none | ✅ OK |
| T15 | Administrative Tabs | none | none | ✅ OK |
| T16 | Administrative Modals | none | none | ✅ OK |
