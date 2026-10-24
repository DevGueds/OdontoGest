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
### AD-008
- **Decision**: Padronizar todos os botões de ações de linha das tabelas no formato icon-button compacto `h-8 w-8 p-0` com tooltips via `title` e cores semânticas clínicas (Primary para edição com ícone `Pencil`, Rose para exclusão com `Trash2`, Emerald para reposição com `Boxes`/`PlusCircle` e Cyan para preventiva com `CalendarCheck`), e unificar botões de transição de workflow em `h-7.5 px-2.5 text-xs font-medium gap-1.5`.
- **Reason**: Eliminar dispersão de larguras, cores hexadecimais inline, truncamentos de texto e inconsistências entre abas, elevando a densidade informacional e o alinhamento com o design system do shadcn/ui.
- **Trade-off**: Ações CRUD deixam de exibir texto para usar ícones autoexplicativos com tooltips e `aria-label`.
- **Scope**: `src/client/components/tabs/CatalogoTab.tsx`, `src/client/components/tabs/UsuariosTab.tsx`, `src/client/components/tabs/OrcamentoTab.tsx`, `src/client/components/tabs/DashboardTab.tsx`, `src/client/components/tabs/EquipamentosTab.tsx`, `src/client/components/tabs/TriagemTab.tsx`.
- **Date**: 2026-10-24
- **Status**: active

### AD-009
- **Decision**: Padronizar todos os botões de ações de formulários e caixas de diálogo no sistema com cores semânticas dedicadas, ícones da ação, transições suaves de hover e tooltips explícitos (`title` e `aria-label`).
- **Reason**: Atender à solicitação do usuário eliminando botões monocromáticos sem ícones ou sem dica visual, elevando a ergonomia cognitiva, a acessibilidade e a uniformidade de toda a suíte de telas do OdontoGest.
- **Trade-off**: Todos os botões de cancelamento passam a exibir `<X />` com hover suave em rose, botões de salvamento passam a ter elevação e ícones dedicados (`Save`, `Plus`, `Send`, `Check`), e botões destrutivos exibem `<Trash2 />`.
- **Scope**: Todos os modais em `src/client/components/modals/`, `src/client/components/ui/confirm-dialog.tsx`, `LoginModal.tsx` e abas com formulários (`NovoPedidoTab.tsx`, `OrcamentoTab.tsx`, `UsuariosTab.tsx`, `EquipamentosTab.tsx`, `HonorariosTab.tsx`).
- **Date**: 2026-10-24
- **Status**: active

## Handoff

- **Feature**: .specs/features/padronizacao-botoes-acoes-formularios
- **Phase / Task**: Verified / Complete
- **Completed**:
  - `confirm-dialog.tsx`: Botões Cancelar e Excluir padronizados com ícones (`X` e `Trash2`), cores semânticas, hover suave e tooltips.
  - `LoginModal.tsx`: Botão Entrar no Sistema padronizado com elevação, sombra no hover e tooltips.
  - Modais de Catálogo (`ModalUnidade.tsx`, `ModalEditarUnidade.tsx`, `ModalMaterial.tsx`, `ModalEditarMaterial.tsx`, `ModalAjusteEstoque.tsx`): Botões Cancelar e Salvar/Cadastrar/Estoque padronizados com ícones (`X`, `Plus`, `Save`, `Check`), hover suave e tooltips.
  - Modais de Workflow (`ModalEnvio.tsx`, `ModalRecebimento.tsx`, `ModalAtendimento.tsx`, `ModalRelatorio.tsx`, `ModalFichaPbs.tsx`): Botões de despacho, recebimento, atendimento, exportação Excel/PDF e impressão padronizados.
  - `UsuariosTab.tsx` e `HonorariosTab.tsx`: Modais de cadastro/edição com Cancelar (`X` + hover rose) e Salvar (`Save` + hover glow + tooltips).
  - `EquipamentosTab.tsx`: Todos os 4 modais (Novo Equipamento, Editar Equipamento, Abrir Chamado, Atualizar Status) padronizados com ícones semânticos e tooltips.
  - `NovoPedidoTab.tsx` e `OrcamentoTab.tsx`: Botões de formulário (Adicionar Insumo, Remover Linha, Cancelar, Emitir PBS, Limpar e Registrar Entrada) padronizados.
  - Todos os gates determinísticos aprovados: `npx tsc --noEmit` (exit 0), `npx vite build` (exit 0), `validate_spec.py` (exit 0), `validate_tasks.py` (exit 0) e `validate_state.py` (exit 0).
- **In-progress**: None
- **Next step**: Homologação do usuário na interface
- **Blockers**: None
- **Uncommitted files**: none
- **Branch**: main
