# Tasks: UI/UX Ergonomics & Dental Rebrand

## Test Coverage Matrix

> Generated from codebase (Vite + React + TypeScript + Fastify).

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| UI Component | none | Build gate (TypeScript checking + Vite compilation) | `src/client/components/**/*.tsx` | `npx tsc --noEmit; npx vite build` |
| Design Tokens / CSS | none | Build gate | `src/client/index.css`, `tailwind.config.js` | `npx vite build` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | After single component changes | `npx tsc --noEmit` |
| Build | After each task commit and phase completion | `npx tsc --noEmit; npx vite build` |

---

## Phase 1: Brand & Theme Tokens (P1)

### T1: Create Dental ToothIcon Component
**What**: Create a dedicated Lucide-compatible `ToothIcon` vector component.
**Where**: `src/client/components/icons/ToothIcon.tsx`
**Depends on**: none
**Reuses**: Lucide icon conventions (24x24 viewBox, stroke-width 2, strokeLinecap round)
**Tests**: none
**Gate**: quick
**Done when**:
- [x] Exports `ToothIcon` accepting standard SVG props and `className`
- [x] Visual design reflects clinical dental tooth outline cleanly
- [x] Gate check passes: `npx tsc --noEmit`
**Commit**: `feat(ui): add dedicated dental ToothIcon component`

---

### T2: Update Theme Tokens to Clinical Blue
**What**: Update Genesis theme tokens from purple/indigo `#6366F1` to clinical blue `#2563EB` (HSL `221 83% 53%`) with `#1D4ED8` hover.
**Where**: `src/client/index.css`
**Depends on**: T1
**Reuses**: Existing Tailwind CSS variable structure
**Tests**: none
**Gate**: build
**Done when**:
- [x] `:root` and `.dark` `--primary` variables updated to clinical blue
- [x] `tailwind.config.js` `genesis.primary` updated to `#2563EB` and hover `#1D4ED8`
- [x] Button glow and focus rings reflect clinical blue
- [x] Gate check passes: `npx tsc --noEmit; npx vite build`
**Commit**: `style(ui): update primary brand palette to clinical blue`

---

### T3: Update Header & Login Brand Badges
**What**: Replace `<Activity />` with `ToothIcon` and update brand pills to clinical blue in Header and LoginModal.
**Where**: `src/client/components/Header.tsx`
**Depends on**: T1, T2
**Reuses**: `ToothIcon`
**Tests**: none
**Gate**: quick
**Done when**:
- [x] Header brand avatar renders `ToothIcon`
- [x] LoginModal brand avatar renders `ToothIcon`
- [x] Gate check passes: `npx tsc --noEmit`
**Commit**: `refactor(ui): update header and login modals with dental tooth branding`

---

## Phase 2: Dashboard Semantic Balance (P4)

### T4: Apply Balanced Semantic Colors to Dashboard KPIs
**What**: Balance KPI cards and section headers in `DashboardTab.tsx` with controlled semantic colors (emerald for Custeio, clinical blue for Investimento, amber for Pendentes, rose for Alertas).
**Where**: `src/client/components/tabs/DashboardTab.tsx`
**Depends on**: T2
**Reuses**: Tailwind semantic color tokens (`text-emerald-500`, `text-blue-500`, `text-amber-500`, `text-rose-500`)
**Tests**: none
**Gate**: quick
**Done when**:
- [ ] KPI cards display colored semantic icon badges with soft background tints
- [ ] Zero rainbow borders or tacky gradients introduced
- [ ] Gate check passes: `npx tsc --noEmit`
**Commit**: `style(dashboard): balance kpi cards with controlled semantic icon colors`

---

## Phase 3: Novo Pedido Ergonomics (P2)

### T5: Role-Adapted Header in Novo Pedido Tab
**What**: Restructure emitter identification in `NovoPedidoTab.tsx` so Solicitante sees a compact pre-filled metadata card while Gestor/Admin retain full selector controls.
**Where**: `src/client/components/tabs/NovoPedidoTab.tsx`
**Depends on**: T2
**Reuses**: Card and Badge components
**Tests**: none
**Gate**: quick
**Done when**:
- [ ] Solicitante view displays compact summary (Unit, Professional, Date) without 5 redundant inputs
- [ ] Admin/Gestor retains editable unit selection
- [ ] Form submission continues to send complete valid payload
- [ ] Gate check passes: `npx tsc --noEmit`
**Commit**: `refactor(novo-pedido): streamline header fields for solicitante role`

---

### T6: Relocate Add-Item Button to Bottom of Table
**What**: Move "Adicionar Insumo" button from the top header to directly below the last row of the materials table in `NovoPedidoTab.tsx`.
**Where**: `src/client/components/tabs/NovoPedidoTab.tsx`
**Depends on**: T5
**Reuses**: Button component with Plus icon
**Tests**: none
**Gate**: quick
**Done when**:
- [ ] "Adicionar Insumo" button renders immediately below the table
- [ ] Clicking appends new row without forcing vertical scroll to the top
- [ ] Gate check passes: `npx tsc --noEmit; npx vite build`
**Commit**: `feat(novo-pedido): move add material button adjacent to last table row`

---

## Phase 4: Navigation Shell & Hover Expand (P3)

### T7: Viewport Height Constrained App Shell
**What**: Constrain main application container to `h-screen overflow-hidden` and sidebar to `h-full` so the sidebar never stretches beyond the viewport bounds.
**Where**: `src/client/App.tsx`
**Depends on**: none
**Reuses**: Existing layout flexbox
**Tests**: none
**Gate**: quick
**Done when**:
- [ ] App root is `h-screen flex flex-col overflow-hidden`
- [ ] Main content area scrolls independently with `flex-1 overflow-y-auto`
- [ ] Sidebar toggle footer remains pinned at bottom of viewport
- [ ] Gate check passes: `npx tsc --noEmit`
**Commit**: `fix(layout): constrain app shell to viewport height to pin sidebar toggle`

---

### T8: Implement Hover-Expand on Collapsed Sidebar
**What**: Add smooth hover expansion to `Navigation.tsx` when collapsed, revealing labels and badges on mouseenter and collapsing on mouseleave.
**Where**: `src/client/components/Navigation.tsx`
**Depends on**: T7
**Reuses**: `isCollapsed` state with `isHovered` local overlay support
**Tests**: none
**Gate**: build
**Done when**:
- [ ] Moving mouse over collapsed sidebar expands it smoothly
- [ ] Moving mouse away returns sidebar to icon rail
- [ ] Toggle button still pins/unpins collapsed state cleanly
- [ ] Gate check passes: `npx tsc --noEmit; npx vite build`
**Commit**: `feat(navigation): add hover expand capability to collapsed sidebar rail`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4

Phase 1:  T1 (ToothIcon) ──────→ T2 (Blue Tokens) ──────→ T3 (Header/Login)
Phase 2:  T4 (Dashboard Semantic Icons)
Phase 3:  T5 (Novo Pedido Header) ──────→ T6 (Bottom Add Button)
Phase 4:  T7 (App Shell Viewport) ──────→ T8 (Hover Expand Sidebar)
```
