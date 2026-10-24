# Tasks: UI Modals, Selects & Rebrand Cleanup

- [x] **T1: Implement ConfirmDeleteDialog Component** <!-- id: T1 -->
  - File: `src/client/components/ui/confirm-dialog.tsx`
  - Reusable, accessible Radix Dialog with alert triangle badge, destructive action, cancel button, and loading state.
  - Verification: `npx tsc --noEmit`
  - Commit: `82c0d25`

- [x] **T2: Replace All Native Browser confirm() Calls with ConfirmDeleteDialog** <!-- id: T2 -->
  - Files:
    - `src/client/components/tabs/UsuariosTab.tsx` (User deletion)
    - `src/client/components/tabs/OrcamentoTab.tsx` (Entry removal)
    - `src/client/components/tabs/CatalogoTab.tsx` (Unit and Material deletions)
    - `src/client/App.tsx` (Order cancellation)
  - Verification: `npx tsc --noEmit`
  - Commit: `84a7698`

- [x] **T3: Implement Shadcn/ui Select Component and Integrate into Key Tabs** <!-- id: T3 -->
  - Files:
    - `src/client/components/ui/select.tsx`
    - `src/client/components/tabs/TriagemTab.tsx` (Filter by status)
    - `src/client/components/tabs/UsuariosTab.tsx` (Profile and Unit selects in modal)
    - `src/client/components/tabs/OrcamentoTab.tsx` (Nature, Recurrence, Destination, and Filter selects)
  - Verification: `npx tsc --noEmit`
  - Commit: `37e92f9`

- [x] **T4: Purge Residual Legacy Purple Color Codes in Favor of Clinical Blue** <!-- id: T4 -->
  - Files:
    - `src/client/components/tabs/EquipamentosTab.tsx` (15 occurrences: header icons, table icons, modal icons, select/input focus rings)
    - `src/client/components/modals/ModalRecebimento.tsx` (Icon container)
    - `src/client/components/modals/ModalEnvio.tsx` (Icon container)
    - `src/client/components/modals/ModalAtendimento.tsx` (Icon container)
    - `src/client/components/modals/ModalFichaPbs.tsx` (Icon container, quantities, and totals)
  - Verification: Grep confirms 0 occurrences of `#6366F1` in `src/client/`. `npx tsc --noEmit; npx vite build`
  - Commit: Pending

- [x] **T5: Independent Verification & Decision Log** <!-- id: T5 -->
  - Files:
    - `.specs/features/ui-modals-selects-rebrand-cleanup/validation.md`
    - `.specs/STATE.md`
