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

### AD-003
- **Decision**: Adotar paleta de Azul Clínico (`#2563EB` / HSL `221 83% 53%`), ícone odontológico dedicado (`ToothIcon`), simplificação ergonômica da emissão de pedidos por perfil e contenção de viewport no shell de navegação com hover expand.
- **Reason**: Alinhar a identidade visual do OdontoGest ao segmento odontológico, mitigar sobrecarga cognitiva de solicitantes de USF eliminando campos redundantes, e resolver atritos de usabilidade na barra lateral e rolagem.
- **Trade-off**: Substitui o tom índigo anterior pelo azul clínico; campos de identificação de solicitante tornam-se compactos por padrão com expansão sob demanda.
- **Scope**: Shell (`App.tsx`, `Navigation.tsx`, `Header.tsx`), Tokens (`index.css`, `tailwind.config.js`), e Telas (`NovoPedidoTab.tsx`, `DashboardTab.tsx`).
- **Date**: 2026-10-23
- **Status**: active

### AD-004
- **Decision**: Reestruturar a experiência do usuário (UX) do Dashboard Gerencial com KPIs executivos destacados, três gráficos vetoriais nativos em SVG (Donut de Custeio, Barras de Consumo por Unidade e Funil de Ciclo de Vida de Pedidos) e abas ergonômicas Radix Tabs para alternância de visualizações detalhadas.
- **Reason**: Reduzir a fadiga visual causada por rolagem vertical de tabelas monolíticas, proporcionar inteligência de dados instantânea para gestores e manter zero dependências extras no bundle de produção.
- **Trade-off**: Tabelas de insumos críticos, consolidação orçamentária e histórico recente passam a ser acessadas via abas segmentadas em vez de ocuparem a página simultaneamente.
- **Scope**: `src/client/components/tabs/DashboardTab.tsx`, `src/client/components/dashboard/*`, `src/client/components/ui/tabs.tsx`.
- **Date**: 2026-10-23
- **Status**: active

## Handoff

- **Feature**: .specs/features/dashboard-ux-enhancement
- **Phase / Task**: Execute / Validation Complete
- **Completed**: DASH-01 through DASH-05 (Radix Tabs primitive implemented; SVG charts for Custeio, Unidades and Pedidos created; DashboardTab redesigned; validation passed)
- **In-progress** (file:line): none
- **Next step**: User acceptance testing or deployment.
- **Blockers**: none
- **Uncommitted files**: none
- **Branch**: main
