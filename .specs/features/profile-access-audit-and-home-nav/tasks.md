# Tasks: Profile Access Audit & Home Navigation

## Test Coverage Matrix

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Header & Client UI | none | Build Gate | `src/client/components/Header.tsx`, `App.tsx` | `npx tsc --noEmit; npx vite build` |
| Triagem Tab | none | Build Gate | `src/client/components/tabs/TriagemTab.tsx` | `npx tsc --noEmit` |
| Server API RBAC | none | Build Gate | `src/server/server.ts` | `npx tsc --noEmit` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | After single component changes | `npx tsc --noEmit` |
| Build | After each task commit and final verification | `npx tsc --noEmit; npx vite build` |

---

## Phase 1: Brand Home Navigation (P1)

### T1: Interactive Brand Logo & Home Navigation
**What**: Add `onNavigateHome` callback to `Header.tsx`. Wrap the brand logo and title in an interactive button with hover feedback, and wire `onNavigateHome` in `App.tsx` to switch to the profile's home tab (`dashboard` for Admin/Gestor, `triagem` for Solicitante, `equipamentos` for Técnico).
**Where**: `src/client/components/Header.tsx`, `src/client/App.tsx`
**Depends on**: none
**Reuses**: `ToothIcon`, button styling
**Tests**: none
**Gate**: quick
**Done when**:
- [x] Header brand element is an accessible button with hover feedback and `aria-label="Ir para o menu inicial"`
- [x] Clicking brand element navigates to `dashboard` (Admin/Gestor) or profile default
- [x] Gate check passes: `npx tsc --noEmit`
**Commit**: `feat(header): make brand logo and title navigate to home tab`

---

## Phase 2: Triagem Access Hardening (P2)

### T2: Enable Warehouse Gestor Operational Actions in TriagemTab
**What**: Update `TriagemTab.tsx` action button conditions from `isAdmin ?` to `isPrivilegiado ?` (`isAdmin || isGestor`), enabling Almoxarifado Gestor to receive, attend, and dispatch orders.
**Where**: `src/client/components/tabs/TriagemTab.tsx`
**Depends on**: T1
**Reuses**: `isPrivilegiado` flag in `TriagemTab.tsx`
**Tests**: none
**Gate**: quick
**Done when**:
- [ ] Gestor profile can view and click "1. Receber", "2. Atender", and "3. Enviar"
- [ ] Solicitante continues to see order progress badges with status tracking
- [ ] Gate check passes: `npx tsc --noEmit`
**Commit**: `fix(triagem): allow warehouse gestor to receive and dispatch orders`

---

## Phase 3: Client Shell Tab Security Guard (P3)

### T3: Enforce Comprehensive Tab RBAC in Application Shell
**What**: Harden `handleSelectTab` and reactive tab guard `useEffect` in `App.tsx` with a centralized `getHomeTabForProfile` and `isTabPermittedForProfile` helper, intercepting unauthorized tab selections for all 4 profiles.
**Where**: `src/client/App.tsx`
**Depends on**: T2
**Reuses**: `showToast`, `activeTab` state
**Tests**: none
**Gate**: build
**Done when**:
- [ ] Solicitante is redirected if selecting `dashboard`, `orcamento`, `honorarios`, `catalogo`, or `usuarios`
- [ ] Gestor is redirected if selecting `usuarios`
- [ ] Técnico is restricted exclusively to `equipamentos`
- [ ] Gate check passes: `npx tsc --noEmit; npx vite build`
**Commit**: `fix(auth): enforce strict tab permission matrix in app shell`

---

## Phase 4: Server-Side RBAC Enforcement (P4)

### T4: Implement Declarative RBAC Middleware on Sensitive Fastify Routes
**What**: Add `requireRole(allowedRoles)` middleware in `src/server/server.ts` and apply to `/api/usuarios`, `/api/honorarios`, `/api/entradas`, and order mutation routes, returning 403 Forbidden for unauthorized roles.
**Where**: `src/server/server.ts`
**Depends on**: T3
**Reuses**: `authenticate` middleware, `req.userSession`
**Tests**: none
**Gate**: build
**Done when**:
- [ ] `/api/usuarios` routes require `ADMINISTRADOR`
- [ ] `/api/honorarios` and `/api/entradas` routes require `ADMINISTRADOR` or `GESTOR`
- [ ] Gate check passes: `npx tsc --noEmit; npx vite build`
**Commit**: `sec(api): enforce rbac middleware on sensitive administrative endpoints`
