# UI Modernization & Rebrand Context

**Gathered:** 2026-10-23
**Spec:** `.specs/features/ui-modernization-shadcn/spec.md`
**Status:** Ready for design

---

## Feature Boundary

Total visual modernization of the OdontoGest frontend using Tailwind CSS and shadcn/ui component architecture, replacing outdated vanilla styling and icons with a cohesive "Modern Clinical" design system. The scope is strictly visual and UX-centric: all existing business rules, API services, types, forms, and backend routes remain 100% intact.

---

## Implementation Decisions

### 1. Visual Identity & Color Palette
- **Style**: Modern Clinical (Slate + Cyan/Teal).
- **Aesthetics**: Clean, high-contrast, linear-inspired design with crisp borders (`border-slate-200 dark:border-slate-800`), refined typography (Inter / Outfit), subtle shadows, and clinical cyan/teal accents (`text-teal-600 dark:text-teal-400`, `bg-teal-600`).
- **Theme**: Full Light & Dark mode support from the start, powered by CSS variables and a dark class toggle on `document.documentElement` with `localStorage` persistence.

### 2. Component Architecture (shadcn/ui)
- **Engine**: Tailwind CSS + `clsx` + `tailwind-merge` + `class-variance-authority`.
- **Location**: Primitives located in `src/client/components/ui/` (`button.tsx`, `card.tsx`, `dialog.tsx`, `input.tsx`, `select.tsx`, `table.tsx`, `badge.tsx`, `tabs.tsx`, `tooltip.tsx`, `dropdown-menu.tsx`, etc.).
- **Icons**: 100% migration from CDN FontAwesome to `lucide-react` for crisp SVGs and unified icon styling.

### 3. Layout & Navigation
- **Sidebar**: Modern collapsible sidebar (compact icon-only mode with tooltips vs. expanded mode with section labels) + user role indicators.
- **Header / Topbar**: Minimalist topbar featuring the OdontoGest logo/brand, active screen breadcrumb/title, user profile badge, Theme Toggle (Sun/Moon), and primary action buttons (Exportar SQL, Relatórios, Sair).

### 4. Phased Component Refactoring
- **Phase 1**: Infrastructure (Tailwind setup, Radix/shadcn primitives, theme provider, global CSS tokens).
- **Phase 2**: Shell overhaul (Header, Navigation Sidebar, Toast system, LoginModal).
- **Phase 3**: Core operational tabs (DashboardTab, TriagemTab, NovoPedidoTab).
- **Phase 4**: Secondary tabs & Modals (EquipamentosTab, OrcamentoTab, HonorariosTab, CatalogoTab, UsuariosTab, and all dialog modals).

### Agent's Discretion
- Micro-interactions, hover animations, and subtle transition timings (`duration-200 ease-in-out`).
- Specific Radix UI headless component choices for dropdowns, tooltips, and dialogs.

### Declined / Undiscussed Gray Areas → Assumptions
- None. All major product decisions (pace, palette, icons, dark mode, sidebar format) were explicitly chosen.

---

## Specific References
- Modern B2B / Healthcare SaaS aesthetic (inspired by Linear / Vercel design system adapted to public health/dental clinic).
- Strict non-breaking contract with Fastify backend and Prisma schema.

---

## Deferred Ideas
- None - discussion strictly bounded to frontend UI modernization.
