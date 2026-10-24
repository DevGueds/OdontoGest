# Tasks: UI Modals, Selects & Rebrand Cleanup

## Test Coverage Matrix

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| UI Primitives | none | Build Gate | `src/client/components/ui/*.tsx` | `npx tsc --noEmit; npx vite build` |
| Tabs & Modals | none | Build Gate | `src/client/components/**/*.tsx` | `npx tsc --noEmit` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | After single component changes | `npx tsc --noEmit` |
| Build | After each task commit and final verification | `npx tsc --noEmit; npx vite build` |

---

## Phase 1: Confirmation Modal (P1)

### T1: Create ConfirmDeleteDialog Component
**What**: Create a dedicated, reusable `ConfirmDeleteDialog` component in `src/client/components/ui/confirm-dialog.tsx` using Radix Dialog with title, description, destructive confirm button, cancel button, and danger icon badge.
**Where**: `src/client/components/ui/confirm-dialog.tsx`
**Depends on**: none
**Reuses**: `Dialog` component, `Button`, `AlertTriangle` icon
**Tests**: none
**Gate**: quick
**Done when**:
- [x] Exports `ConfirmDeleteDialog` with props: `open`, `onOpenChange`, `title`, `description`, `onConfirm`, `confirmLabel`, `cancelLabel`
- [x] Gate check passes: `npx tsc --noEmit`
**Commit**: `feat(ui): add accessible ConfirmDeleteDialog component`

---

### T2: Replace Native confirm() Calls with ConfirmDeleteDialog
**What**: Replace all 5 native `confirm()` / `window.confirm()` calls with `ConfirmDeleteDialog` state and modal rendering in `UsuariosTab.tsx`, `OrcamentoTab.tsx`, `CatalogoTab.tsx`, and `App.tsx`.
**Where**: `src/client/components/tabs/UsuariosTab.tsx`, `src/client/components/tabs/OrcamentoTab.tsx`, `src/client/components/tabs/CatalogoTab.tsx`, `src/client/App.tsx`
**Depends on**: T1
**Reuses**: `ConfirmDeleteDialog`
**Tests**: none
**Gate**: quick
**Done when**:
- [ ] Zero occurrences of `confirm(` remain in `src/client/`
- [ ] Delete actions trigger modern confirmation modals with cancel and confirm flows
- [ ] Gate check passes: `npx tsc --noEmit`
**Commit**: `refactor(ui): replace native browser confirm dialogs with ConfirmDeleteDialog`

---

## Phase 2: Shadcn/ui Select Component (P2)

### T3: Implement Shadcn/ui Select Component Suite
**What**: Create `src/client/components/ui/select.tsx` wrapping `@radix-ui/react-select` with `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectValue` styled with clinical blue focus rings and dark mode support.
**Where**: `src/client/components/ui/select.tsx`
**Depends on**: none
**Reuses**: `@radix-ui/react-select`, `cn` utility, `ChevronDown`
**Tests**: none
**Gate**: quick
**Done when**:
- [ ] `select.tsx` exports all Radix Select primitives with shadcn CSS tokens
- [ ] Gate check passes: `npx tsc --noEmit`
**Commit**: `feat(ui): add shadcn select component wrapping radix select primitive`

---

## Phase 3: Purge Residual Legacy Purple Colors (P3)

### T4: Replace Residual Purple Colors with Clinical Blue
**What**: Scan and replace all residual occurrences of `#6366F1`, `#4F46E5`, `#818CF8` with `#2563EB`, `#1D4ED8`, and `#2563EB/10` across all tabs and modals.
**Where**: `src/client/components/tabs/TriagemTab.tsx`, `src/client/components/tabs/EquipamentosTab.tsx`, `src/client/components/tabs/CatalogoTab.tsx`, `src/client/components/modals/*.tsx`
**Depends on**: none
**Reuses**: Tailwind clinical blue tokens
**Tests**: none
**Gate**: build
**Done when**:
- [ ] Zero occurrences of `#6366F1`, `#4F46E5`, `#818CF8` remain in `src/client/`
- [ ] All modal headers and tab section icons use clinical blue `#2563EB`
- [ ] Gate check passes: `npx tsc --noEmit; npx vite build`
**Commit**: `style(ui): purge residual legacy purple color codes in favor of clinical blue`
