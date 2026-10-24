# STATE

## Decisions

### AD-001
- **Decision**: Adotar Tailwind CSS + componentes shadcn/ui (Radix UI + Lucide React) com tema Modern Clinical (Slate + Cyan/Teal) e suporte nativo a Dark Mode.
- **Reason**: Modernizar a interface do OdontoGest para uma estética premium, acessível e manutenível, eliminando CSS monolítico customizado e dependência de FontAwesome via CDN.
- **Trade-off**: Adiciona dependências de build de CSS (Tailwind, postcss, autoprefixer) e componentes de UI desacoplados em `src/client/components/ui/`.
- **Scope**: Toda a camada visual do front-end (`src/client/`).
- **Date**: 2026-10-23
- **Status**: active

### AD-002
- **Decision**: Restringir acesso a relatórios gerenciais e ao dump SQL do banco de dados para o perfil SOLICITANTE (e perfis não-administrativos).
- **Reason**: Mitigar risco de vazamento de dados estratégicos (folha de honorários, orçamentos e insumos consolidados) e extração indiscriminada de dados por operadores de USF, em conformidade com OWASP A01 (Broken Access Control).
- **Trade-off**: Relatórios passam a ser exclusivos de Gestores e Administradores; Dump SQL passa a exigir sessão ativa com perfil Administrador.
- **Scope**: Backend (`src/server/server.ts`) e Shell de interface (`src/client/components/Header.tsx`, `src/client/App.tsx`).
- **Date**: 2026-10-23
- **Status**: active

## Handoff

- **Feature**: .specs/features/restrict-solicitante-access
- **Phase / Task**: Execute / Validation Complete
- **Completed**: AUTH-01 through AUTH-04 (Endpoint /api/export/sql protected with RBAC 403; Header reports button restricted; App guards in place; automated test suite verified)
- **In-progress** (file:line): none
- **Next step**: User acceptance testing or deployment.
- **Blockers**: none
- **Uncommitted files**: none
- **Branch**: main
