# UI/UX Ergonomics & Dental Rebrand Specification

## Problem Statement

O OdontoGest passou por uma modernização inicial, mas ainda apresenta atritos ergonômicos e desalinhamentos visuais identificados pelos operadores:
1. A cor base primária está em roxo/índigo (`#6366F1`), distanciando-se da identidade visual odontológica/clínica, e os ícones de marca não remetem ao domínio da odontologia.
2. Os cards do Dashboard foram excessivamente neutralizados em cinza monocromático, dificultando o reconhecimento semântico rápido dos indicadores operacionais e financeiros.
3. A tela de "Novo Pedido" impõe uma sobrecarga cognitiva excessiva aos solicitantes das USFs, que precisam preencher ou visualizar múltiplos campos já conhecidos pelo sistema (unidade, dados do profissional, data), e força o usuário a rolar a página para cima a cada novo item para alcançar o botão "Adicionar Insumo".
4. O menu lateral empurra o botão de recolhimento para o final infinito da página quando o conteúdo da direita é longo, e não permite abertura temporária por hover quando recolhido.

## Goals

- [ ] Migrar a cor base interativa para um azul clínico na mesma tonalidade e luminosidade da cor atual (`#2563EB`), integrando um ícone vetorial exclusivo de odontologia (dente clínico).
- [ ] Atribuir cores semânticas controladas aos ícones de indicadores do Dashboard (esmeralda para saldos de custeio, azul para investimentos, âmbar para pendências e vermelho para alertas críticos).
- [ ] Simplificar a tela de Novo Pedido adaptando os campos ao perfil do usuário (perfil Solicitante vê metadados pré-preenchidos de forma compacta e direta) e reposicionar o botão de adição de insumos imediatamente abaixo da última linha da tabela.
- [ ] Fixar a barra lateral na altura total da tela (`h-screen overflow-hidden`) com o botão de alternância sempre visível e implementar abertura fluida por hover no modo recolhido.

## Out of Scope

Explicitamente excluído para prevenir desvios de escopo.

| Feature | Reason |
| --- | --- |
| Alteração de rotas ou regras de negócio do backend | O escopo é estritamente de front-end visual, ergonômico e de interação. |
| Modificação de schemas do Prisma ou banco MySQL | A estrutura de dados de pedidos, materiais e unidades atende perfeitamente. |
| Alteração nas regras de restrição de acesso implementadas em AUTH-01..04 | As proteções de segurança para perfis permanecem intactas. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Tom do azul da cor primária | Azul clínico Royal (`#2563EB` / HSL `221 83% 53%`) com hover `#1D4ED8` | Mantém exatamente a mesma luminância e contraste do antigo `#6366F1`, transmitindo estética médica e confiabilidade. | y |
| Formato do ícone odontológico | SVG ToothIcon exclusivo alinhado ao padrão Lucide (24x24, stroke 2px, cantos arredondados) | Substitui o genérico `<Activity />` por um símbolo inequívoco de odontologia em Header e LoginModal. | y |
| Adaptação de campos no Novo Pedido para Solicitante | Exibir dados de Unidade e Solicitante em barra/card compacto de metadados, com opção de expansão se necessário | O solicitante da USF já está logado e vinculado à sua unidade; não faz sentido forçá-lo a preencher 5 inputs antes dos itens. | y |
| Comportamento do menu lateral em hover | Quando recolhido (`isCollapsed = true`), passar o mouse sobre a barra lateral expande temporariamente o menu | Melhora drástica de usabilidade, permitindo conferir títulos e notificações sem cliques desnecessários. | y |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Rebrand da Cor Base & Identidade Odontológica ⭐ MVP

**User Story**: Como usuário do OdontoGest, quero que o sistema utilize uma paleta de azul clínico e um ícone de odontologia para que a interface reflita imediatamente o segmento de saúde bucal com alta legibilidade e profissionalismo.

**Why P1**: Define os tokens visuais globais da aplicação e a marca primária.

**Acceptance Criteria** (EARS notation):

1. The system SHALL use the clinical blue palette (`#2563EB` default, `#1D4ED8` hover, HSL `221 83% 53%`) as the primary interactive color across buttons, active navigation, focus rings, and accents. <!-- ubiquitous -->
2. The system SHALL render a dedicated Lucide-compatible dental tooth icon (`ToothIcon`) in the application header and login screen brand badges. <!-- ubiquitous -->
3. WHEN the user hovers over primary action buttons or active tab links THEN the system SHALL apply smooth feedback using the clinical blue hover state. <!-- event-driven -->

**Independent Test**: Verificar visualmente o Header, tela de login, botões primários e guias ativas exibindo o novo azul e o ícone de dente.

---

### P2: Ergonomia do Formulário de Novo Pedido & Insumos

**User Story**: Como solicitante de uma unidade de saúde (USF), quero acessar a tela de novo pedido com meus dados e unidade já contextualizados e adicionar itens diretamente abaixo da lista, para que eu não precise preencher campos redundantes nem rolar a tela repetidamente.

**Why P2**: Elimina o maior atrito de produtividade diária dos operadores de postos de saúde.

**Acceptance Criteria** (EARS notation):

1. WHERE the logged user is a `SOLICITANTE` the system SHALL present the emitter unit and responsible professional as a concise pre-filled summary card rather than 5 repetitive form inputs. <!-- optional-feature -->
2. WHERE the logged user is a `GESTOR` or `ADMINISTRADOR` the system SHALL allow free selection of the emitter unit and dispatch data. <!-- optional-feature -->
3. The system SHALL render the "Adicionar Insumo" button immediately adjacent to and below the last row of the materials table. <!-- ubiquitous -->
4. WHEN a user clicks the "Adicionar Insumo" button at the bottom of the table THEN the system SHALL append a new empty item row immediately above the button and focus on it. <!-- event-driven -->

**Independent Test**: Abrir como Solicitante e verificar resumo compacto superior; adicionar 3 itens seguidos confirmando que o botão de adição permanece colado à última linha sem exigir rolagem para cima.

---

### P3: Menu Lateral com Altura Fixa & Expansão por Hover

**User Story**: Como usuário, quero que o botão de recolhimento da barra lateral permaneça sempre acessível no rodapé visível da tela e que a barra recolhida se expanda ao passar o mouse, para que a navegação seja instantânea e sem esforço.

**Why P3**: Resolve a perda de controle de navegação em páginas com rolagem extensa.

**Acceptance Criteria** (EARS notation):

1. The system SHALL constrain the application viewport to full screen height (`h-screen overflow-hidden`) so the sidebar never stretches beyond the viewport bounds. <!-- ubiquitous -->
2. The system SHALL keep the sidebar toggle button permanently visible at the bottom of the sidebar. <!-- ubiquitous -->
3. WHILE the sidebar is collapsed WHEN the user hovers the cursor over the sidebar rail THEN the system SHALL expand the sidebar to reveal full labels and counters. <!-- complex -->
4. WHEN the cursor leaves the expanded hover sidebar area THEN the system SHALL transition back to the collapsed rail without page jump. <!-- event-driven -->

**Independent Test**: Acessar uma página longa (como Equipamentos ou Triagem), verificar que o botão de recolher está ancorado na parte inferior visível, recolher o menu e passar o mouse sobre os ícones confirmando a expansão suave.

---

### P4: Ícones do Dashboard com Cores Semânticas Controladas

**User Story**: Como gestor, quero que os ícones dos cards do Dashboard exibam toques de cor semântica equilibrados para que eu possa diferenciar rapidamente os indicadores de saldo, pendências e alertas críticos.

**Why P4**: Restaura a legibilidade visual rápida sem reintroduzir o visual brega de cards coloridos.

**Acceptance Criteria** (EARS notation):

1. The system SHALL render the "Saldo Custeio" icon with an emerald semantic tone (`text-emerald-500` with subtle background tint). <!-- ubiquitous -->
2. The system SHALL render the "Saldo Investimento" icon with a clinical blue semantic tone (`text-blue-500` with subtle background tint). <!-- ubiquitous -->
3. The system SHALL render the "Pedidos Pendentes" icon with an amber semantic tone (`text-amber-500` with subtle background tint). <!-- ubiquitous -->
4. The system SHALL render the "Insumos Críticos" icon with a rose/red semantic tone (`text-rose-500` with subtle background tint). <!-- ubiquitous -->

**Independent Test**: Acessar o Dashboard e verificar os 4 cards KPI com ícones coloridos de forma equilibrada em fundo neutro.

---

## Edge Cases

- IF the user has a small laptop viewport (e.g., 768px height) THEN the system SHALL keep both header, sidebar toggle, and modal overlays accessible without vertical clipping.
- IF a Solicitante needs to adjust the request date or notes THEN the system SHALL offer a discreet "Ver mais detalhes" toggle in the summary header without cluttering the default view.
- IF the sidebar is pinned as expanded by click THEN hover interactions SHALL NOT cause redundant animations.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| REBRAND-01 | P1: Blue Palette Tokens & Hover | Execute | Pending |
| REBRAND-02 | P1: Dental Tooth Icon in Brand | Execute | Pending |
| DASH-01 | P4: Balanced Semantic Dashboard Icons | Execute | Pending |
| PEDIDO-01 | P2: Role-based Novo Pedido Layout | Execute | Pending |
| PEDIDO-02 | P2: Bottom Add-Item Button Placement | Execute | Pending |
| NAV-01 | P3: Viewport Shell & Fixed Toggle | Execute | Pending |
| NAV-02 | P3: Hover-Expand Collapsed Sidebar | Execute | Pending |

**Coverage:** 7 total, 7 mapped to tasks, 0 unmapped.

---

## Success Criteria

- [ ] A cor base é azul clínico `#2563EB` em todos os botões, links ativos e anéis de foco, com zero tons roxos remanescentes.
- [ ] O ícone da marca no Header e no Login é um dente odontológico minimalista.
- [ ] Os 4 cards de KPI do Dashboard exibem ícones semânticos distintos (esmeralda, azul, âmbar, vermelho) sobre fundo plano neutro.
- [ ] O solicitante visualiza seus dados de emissão de forma consolidada e compacta, e o botão de adicionar insumo está posicionado logo abaixo da tabela.
- [ ] A barra lateral não ultrapassa a viewport e expande ao passar o mouse quando recolhida.
- [ ] O build de produção (`npx vite build`) e a checagem de tipos (`npx tsc --noEmit`) passam com zero erros.
