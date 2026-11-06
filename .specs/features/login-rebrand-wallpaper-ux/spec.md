# Rebrand da Tela de Login & Wallpaper Clínico (16 Leis de UX) Specification

## Problem Statement

A tela de autenticação atual do OdontoGest (`src/client/components/LoginModal.tsx`) é exibida como um modal flutuante genérico sobre um fundo escuro neutro (`bg-zinc-950/60`), sem integrar a rica identidade visual do produto recém-estabelecida pela marca OdontoGest.

Além disso, faltam alinhamentos com as **16 Leis de UI-UX** (Laws of UX de Jon Yablonski):
1. Falta de imersão de marca e apelo estético odontológico (**Aesthetic-Usability Effect**).
2. O botão de submissão e os inputs possuem áreas de clique padrão sem otimização de Fitts (**Fitts's Law**).
3. Usuários em ambiente de testes ou novos operadores precisam adivinhar credenciais de teste, elevando a sobrecarga cognitiva (**Hick's Law** e **Parkinson's Law**).
4. O contraste entre a superfície e o fundo não aproveita o efeito de região comum e clareza geométrica (**Law of Common Region** e **Law of Prägnanz**).
5. O botão de ação principal não possui destaque suficiente para ser o ponto focal imediato de conversão (**Von Restorff Effect**).

## Goals

- [ ] Estruturar a tela de login em layout split 60/40 no desktop: 60% dedicado à imagem com 100% de nitidez original e 40% dedicado ao formulário de autenticação.
- [ ] Implementar painel de login sólido, limpo e direto (bg-white / dark:bg-zinc-900) sem elementos poluentes como badges secundários ou atalhos de teste.
- [ ] Aplicar rigorosamente as 16 Leis de UX: alvos táteis ergonômicos de 44px (Fitts), agrupamento semântico por proximidade (Proximity), inputs padronizados (Similarity), foco estrito nos dados essenciais (Hick/Occam/Miller) e botão CTA em azul clínico (Von Restorff).
- [ ] Fornecer feedback visual instantâneo em menos de 100ms com transições táteis, loading spinner com desativação do botão contra duplo-clique (Doherty Threshold & Peak-End Rule) e suporte a tecla Enter.

## Out of Scope

Explicitamente excluído para prevenir desvios de escopo:

| Feature | Reason |
| --- | --- |
| Alteração nas rotas de autenticação da API Fastify | O endpoint `/api/auth/login` e as regras de sessão e cookies HTTPOnly permanecem inalterados. |
| Criação de fluxo de auto-cadastro ou recuperação de senha por e-mail | O sistema é de rede pública/institucional interna (SMS), onde usuários são cadastrados por administradores. |
| Alterações nas abas internas após o login | O escopo é estritamente a tela e experiência de autenticação do usuário. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Estrutura do Layout Desktop | Split 60/40 (60% imagem à esquerda, 40% login à direita) | Permite que a arte do wallpaper seja exibida com máxima nitidez e proporção, enquanto o formulário de login tem espaço próprio e limpo. | y |
| Resolução do wallpaper | Armazenado em `src/client/assets/login-wallpaper.jpg` e `public/login-wallpaper.jpg` (78 KB) | O arquivo é leve, carrega instantaneamente sem travar a renderização inicial e funciona perfeitamente em dev e produção (Vite). | y |
| Acessibilidade e Contraste | Painel de login com `bg-white` (e `dark:bg-zinc-900`) e bordas nítidas | Garante contraste WCAG AAA para todos os textos e inputs, eliminando transparências e efeito de vidro fosco. | y |
| Remoção de Elementos Excedentes | Omissão de selos de ambiente SUS e atalhos rápidos de teste | Mantém a interface focada, profissional e sem ruídos cognitivos (Hick's Law e Occam's Razor). | y |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Rebrand Estético e Fundo Imersivo com Wallpaper ⭐ MVP

**User Story**: Como profissional de saúde acessando o OdontoGest, quero que a tela de login apresente o wallpaper institucional oficial e um card de login elegante com vidro fosco para que minha primeira impressão transmita confiança, profissionalismo clínico e pertencimento à área odontológica.

**Why P1**: Define a identidade visual completa da entrada do sistema e atende ao *Aesthetic-Usability Effect* e à *Law of Common Region*.

**Acceptance Criteria** (EARS notation):

1. The system SHALL display the OdontoGest dental clinic and warehouse wallpaper as a responsive full-viewport background with `background-size: cover` and `background-position: center`. <!-- ubiquitous -->
2. The system SHALL render the authentication form inside an elevated solid card with `bg-white dark:bg-zinc-900`, rounded borders (`rounded-xl`), and high-contrast typography satisfying WCAG AAA standards. <!-- ubiquitous -->
3. WHEN the screen is viewed on mobile devices (width < 640px) THEN the system SHALL adjust the card padding and margins ensuring the form remains fully visible without horizontal scrolling. <!-- event-driven -->

**Independent Test**: Carregar a tela de login deslogado e verificar o wallpaper preenchendo a tela e o card de vidro fosco centralizado com textos legíveis.

---

### P2: Ergonomia de Interação Conforme as 16 Leis de UX ⭐ MVP

**User Story**: Como usuário, quero preencher meu e-mail institucional e senha com alvos táteis amplos, alternador visual de senha, validação clara de erros e feedback de carregamento para ter uma experiência fluida, previsível e sem atritos.

**Why P2**: Cumpre os princípios de *Fitts's Law*, *Jakob's Law*, *Von Restorff Effect*, *Doherty Threshold* e *Peak-End Rule*.

**Acceptance Criteria** (EARS notation):

1. The system SHALL provide email and password input fields with at least 44px height and dedicated leading icons (`Mail`, `KeyRound`). <!-- ubiquitous -->
2. The system SHALL render a password visibility toggle button with accessible `title` and `aria-label` allowing the user to switch between masked and plain text. <!-- ubiquitous -->
3. The system SHALL render the primary submit action button with high-contrast clinical blue styling (`from-sky-600 to-blue-700`), distinct from secondary elements, with hover and active tactile states. <!-- ubiquitous -->
4. WHEN the user submits credentials THEN the system SHALL immediately disable interactive elements, show an animated spinner, and display "Autenticando..." within 100ms. <!-- event-driven -->
5. IF the authentication fails THEN the system SHALL display a high-visibility semantic alert box with icon and descriptive error message above the inputs. <!-- unwanted -->

**Independent Test**: Digitar credenciais válidas e inválidas, testar o botão de revelar senha, verificar estados de loading e mensagem de erro.

---

### P3: Layout Split 60/40 e Interface Limpa sem Ruídos

**User Story**: Como usuário do OdontoGest, quero visualizar o sistema em uma divisão elegante de 60% para a imagem e 40% para o login, sem selos redundantes ou atalhos de teste na tela de produção, para ter uma experiência institucional sóbria e focada.

**Why P3**: Atende ao *Occam's Razor*, à *Law of Common Region* e à clareza do *Hick's Law*.

**Acceptance Criteria** (EARS notation):

1. The system SHALL structure the desktop layout with 60% dedicated to the wallpaper image pane (`lg:w-[60%]`) and 40% dedicated to the solid login form (`lg:w-[40%]`). <!-- ubiquitous -->
2. The system SHALL exclude testing quick-fill buttons and secondary environment badges from the login view ensuring visual simplicity. <!-- ubiquitous -->

**Independent Test**: Verificar o layout dividido em 60/40 no desktop e a ausência do selo Ambiente SUS e de botões de atalho de teste.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| LOGIN-01 | P1: Rebrand Estético e Fundo Imersivo com Wallpaper | Execute | Verified |
| LOGIN-02 | P1: Rebrand Estético e Fundo Imersivo com Wallpaper | Execute | Verified |
| LOGIN-03 | P2: Ergonomia de Interação Conforme as 16 Leis de UX | Execute | Verified |
| LOGIN-04 | P2: Ergonomia de Interação Conforme as 16 Leis de UX | Execute | Verified |
| LOGIN-05 | P3: Layout Split 60/40 e Interface Limpa sem Ruídos | Execute | Verified |

**Coverage:** 5 total, 5 mapped to tasks, 0 unmapped.

