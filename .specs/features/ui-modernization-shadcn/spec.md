# UI Modernization & Rebrand Specification

## Problem Statement

The OdontoGest system currently relies on custom vanilla CSS and FontAwesome CDN icons with an outdated visual appearance that lacks consistent design tokens, dark mode capabilities, and standardized UI primitives. The goal is to completely modernize the frontend into a sleek, professional "Modern Clinical" interface using Tailwind CSS and shadcn/ui components without modifying any underlying business logic or API contracts.

## Goals

- Establish a robust Tailwind CSS and shadcn/ui design system with a refined Modern Clinical palette (Slate + Cyan/Teal) and dark mode support.
- Modernize all shell layouts (Header with theme switcher, retractable Sidebar with tooltips, and Toast notifications) using Lucide icons.
- Modernize all 8 application tabs and 10 dialog modals to use modular shadcn primitives (Button, Card, Dialog, Badge, Input, Select, Table, Tabs) while preserving 100% of existing functionality.

## Out of Scope

Explicitly excluded to protect stability and prevent scope creep.

| Feature | Reason |
| --- | --- |
| Alterations to backend endpoints or Fastify server | Scope is strictly frontend UI modernization |
| Alterations to Prisma ORM schema or MySQL database | Scope is strictly visual presentation |
| Modification of business rules or calculation formulas | Business logic must remain intact |
| New backend reporting engines | Relatórios PDF and Excel export generation keep existing logic |

---

## Assumptions & Open Questions

Every ambiguity is resolved or recorded here - nothing is left silently unclear.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Visual identity style | Modern Clinical Slate + Cyan/Teal | Aligns with modern clinical SaaS aesthetics like Linear/Vercel | Yes |
| Icon library | Lucide React | Standard component library icon set for shadcn/ui with clean SVGs | Yes |
| Theme support | Full Light and Dark mode with Header switch | Enables comfortable use in clinical and administrative environments | Yes |
| Sidebar interaction | Retractable sidebar (compact/expanded) | Maximizes screen real estate for complex dental equipment and catalog tables | Yes |
| Component architecture | Shadcn/ui primitives in src/client/components/ui/ | Standard modular pattern that allows full control and zero lock-in | Yes |

**Open questions:** none - all resolved or logged above (required before the spec is confirmed).

---

## User Stories

### P1: Design System Foundation & App Shell Modernization ⭐ MVP

**User Story**: As a clinic administrator or healthcare professional, I want a modern, responsive interface shell with Dark Mode support and intuitive navigation so that I can easily navigate the OdontoGest system across any device.

**Why P1**: Lays the design tokens, component primitives, theme switching, and global navigation foundation required by all tabs and views.

**Acceptance Criteria**:

1. The system SHALL provide Tailwind CSS utility classes and CSS variables defining background, foreground, primary cyan/teal, border, card, and muted tones for both light and dark themes.
2. WHEN the user clicks the theme toggle button in the Header THEN the system SHALL toggle between light and dark modes and persist the choice in localStorage.
3. WHEN the user toggles the sidebar collapse control THEN the system SHALL transition between full navigation labels and compact icon-only navigation with tooltips.
4. WHILE in compact sidebar mode the system SHALL display tooltips displaying the tab title upon hovering over navigation icons.
5. IF a system toast notification is triggered THEN the system SHALL render a modern styled toast badge using Lucide icons for success, error, and info states.

**Independent Test**: Can toggle dark/light theme, toggle sidebar between compact and expanded states, and observe modern header and navigation rendering correctly.

---

### P2: Core Operational Tabs & Modals Modernization

**User Story**: As an almoxarifado manager or health post requestor, I want the Dashboard, Triagem, and Novo Pedido interfaces to utilize modern shadcn cards, form inputs, and status badges so that requesting and dispatching supplies is clean and error-free.

**Why P2**: Represents the daily operational workflow for health posts and stock managers.

**Acceptance Criteria**:

1. The system SHALL render all metric counters and KPIs in DashboardTab using shadcn Card and Badge components with responsive grid alignment.
2. WHEN the user fills out the Novo Pedido PBS form THEN the system SHALL render all inputs, selects, and table rows using styled shadcn form components.
3. WHEN an order status changes in TriagemTab THEN the system SHALL display semantic color-coded badges matching the new design tokens.
4. WHEN the user opens ModalRecebimento, ModalAtendimento, ModalEnvio, or ModalFichaPbs THEN the system SHALL display the modal using shadcn Dialog primitives with smooth backdrop blur.
5. IF required form fields are missing during submission THEN the system SHALL highlight the input border with destructive styling without breaking existing validation messages.

**Independent Test**: Can navigate to Dashboard, fill out a new PBS order in Novo Pedido, view status badges in Triagem, and open operational modals in both light and dark modes.

---

### P3: Secondary Tabs & Maintenance Management Modernization

**User Story**: As a maintenance technician or clinic manager, I want the Equipamentos, Orçamento, Honorários, Catálogo, and Usuários tabs to feature modern data tables and action menus so that administrative tasks look polished and consistent.

**Why P3**: Completes the full visual rebranding across all secondary and technical management screens.

**Acceptance Criteria**:

1. The system SHALL display equipment records, maintenance work orders, budget entries, dental fees, and users in shadcn-styled Data Tables with hover highlights.
2. WHEN an action button is hovered in any data table THEN the system SHALL provide visual feedback with smooth color transitions and Lucide icons.
3. WHEN opening ModalMaterial, ModalEditarMaterial, ModalUnidade, ModalEditarUnidade, or ModalRelatorio THEN the system SHALL render the dialogs with clean tabs, inputs, and typography.
4. WHERE the user has Solicitante or Tecnico profile the system SHALL render only their authorized navigation tabs using the modern sidebar layout.

**Independent Test**: Can open Equipamentos, Orcamento, Honorarios, Catalogo, and Usuarios tabs and confirm all tables, action buttons, and edit modals adhere to the new Modern Clinical design system.

---

## Edge Cases

- IF the user has a saved dark mode preference in localStorage THEN the system SHALL apply the dark theme immediately on initial page mount without visual flickering.
- IF an input in a modal is focused on a small viewport THEN the system SHALL ensure modal content remains scrollable without clipping submit actions.
- WHEN a table has zero records to display THEN the system SHALL render a dedicated empty state card with a Lucide icon and helpful guidance text.

---

## Requirement Traceability

Each requirement gets a unique ID for tracking across design, tasks, and validation.

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| UI-01 | P1: Design System Foundation & App Shell Modernization | Design | Pending |
| UI-02 | P1: Design System Foundation & App Shell Modernization | Design | Pending |
| UI-03 | P1: Design System Foundation & App Shell Modernization | Design | Pending |
| UI-04 | P1: Design System Foundation & App Shell Modernization | Design | Pending |
| UI-05 | P1: Design System Foundation & App Shell Modernization | Design | Pending |
| UI-06 | P2: Core Operational Tabs & Modals Modernization | Design | Pending |
| UI-07 | P2: Core Operational Tabs & Modals Modernization | Design | Pending |
| UI-08 | P2: Core Operational Tabs & Modals Modernization | Design | Pending |
| UI-09 | P2: Core Operational Tabs & Modals Modernization | Design | Pending |
| UI-10 | P2: Core Operational Tabs & Modals Modernization | Design | Pending |
| UI-11 | P3: Secondary Tabs & Maintenance Management Modernization | Design | Pending |
| UI-12 | P3: Secondary Tabs & Maintenance Management Modernization | Design | Pending |
| UI-13 | P3: Secondary Tabs & Maintenance Management Modernization | Design | Pending |
| UI-14 | P3: Secondary Tabs & Maintenance Management Modernization | Design | Pending |

**Coverage:** 14 total, 14 mapped to stories, 0 unmapped.

---

## Success Criteria

- [ ] All 8 application tabs and 10 modals completely modernized with Tailwind CSS and shadcn/ui components.
- [ ] Cohesive Modern Clinical visual identity with smooth switching between Light and Dark modes.
- [ ] 100% of FontAwesome CDN icons replaced with modern, scalable Lucide icons.
- [ ] Zero regressions or disruptions to Fastify API calls, Prisma database models, or user access permissions.
