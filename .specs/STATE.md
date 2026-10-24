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

### AD-005
- **Decision**: Tornar a marca no Header navegável para o menu inicial do perfil logado (Dashboard para Gestor/Admin, Meus Pedidos para Solicitante, Equipamentos para Técnico), liberar ações de atendimento de pedidos para o Almoxarifado Gestor em TriagemTab, endurecer guards de abas no App Shell e implementar middleware RBAC declarativo nos endpoints administrativos do Fastify.
- **Reason**: Atender à expectativa de usabilidade padrão de navegação pela marca, eliminar bloqueio indevido de gestores no fluxo operacional de materiais e reforçar conformidade com OWASP A01 (Broken Access Control) no backend e frontend.
- **Trade-off**: Ações no Header tornam-se interativas; requisições diretas a endpoints restritos retornam 403 Forbidden.
- **Scope**: `src/client/components/Header.tsx`, `src/client/App.tsx`, `src/client/components/tabs/TriagemTab.tsx`, `src/server/server.ts`.
- **Date**: 2026-10-23
- **Status**: active

### AD-006
- **Decision**: Substituir diálogos nativos `confirm()` por um componente `ConfirmDeleteDialog` do shadcn/ui, criar a suíte de componentes `select.tsx` baseada em `@radix-ui/react-select` e eliminar todas as cores roxas residuais (`#6366F1`) em favor do azul clínico (`#2563EB`).
- **Reason**: Elevar a sofisticação da UI, eliminar interrupções síncronas antiquadas do navegador e garantir fidelidade 100% à nova identidade visual clínica em todos os modais e abas.
- **Trade-off**: Ações destrutivas agora gerenciam estado de abertura de modal localmente.
- **Scope**: `src/client/components/ui/confirm-dialog.tsx`, `src/client/components/ui/select.tsx`, tabs e modais com confirmação de exclusão e cores roxas.
- **Date**: 2026-10-24
### AD-007
- **Decision**: Permitir que Gestores e Administradores consultem usuários no endpoint GET `/api/usuarios` com remoção segura de hashes de senha, alimentar `HonorariosTab` com os profissionais cadastrados e prover seleção automática por unidade de saúde alocada no modal de registro de honorários com autopreenchimento de Nome e CRO e fallback para digitação manual.
- **Reason**: Reduzir retrabalho de digitação manual, eliminar riscos de inconsistência cadastral entre honorários e o quadro profissional das unidades de saúde e manter conformidade com OWASP A01 (sanitizando credenciais de senha no payload HTTP).
- **Trade-off**: A aba de honorários passa a receber a lista de usuários do estado global.
- **Scope**: `src/server/server.ts`, `src/client/App.tsx`, `src/client/components/tabs/HonorariosTab.tsx`, `tests/honorarios-profissionais-unidade.test.ts`.
- **Date**: 2026-10-24
- **Status**: active

## Handoff

- **Feature**: .specs/features/honorarios-selecao-profissionais-unidade
- **Phase / Task**: Verified / Complete
- **Completed**:
  - `GET /api/usuarios` no backend atualizado para permitir papéis `ADMINISTRADOR` e `GESTOR`, com sanitização do campo `senha` (`src/server/server.ts`)
  - Componente `HonorariosTab` atualizado para receber `usuarios` e filtrar profissionais pela unidade de saúde alocada no modal (`src/client/components/tabs/HonorariosTab.tsx`)
  - Select de profissional implementado no modal com exibição formatada `Nome - Registro/CRO`, autopreenchimento reativo dos campos de texto e opção fallback de digitação manual
  - `App.tsx` atualizado repassando `usuarios={usuarios}` para `<HonorariosTab />` (`src/client/App.tsx`)
  - Teste de integração automatizado cobrindo RBAC, sanitização e associação de honorários criado e validado com sucesso (`tests/honorarios-profissionais-unidade.test.ts`)
  - Todos os gates determinísticos aprovados: `npx tsc --noEmit` (exit 0), `npx vite build` (exit 0), `validate_spec.py` (exit 0), `validate_tasks.py` (exit 0) e `validate_state.py` (exit 0)
- **In-progress**: None
- **Next step**: Validação do usuário em ambiente de desenvolvimento
- **Blockers**: None
- **Uncommitted files**: none
- **Branch**: main
