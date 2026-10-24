# Tasks: Seleção de Profissionais por Unidade no Registro de Honorários

## Test Coverage Matrix

| Area | Requirement | Scenario | Test Type | Automated? |
| --- | --- | --- | --- | --- |
| Server API | HONOR-01 | GESTOR and ADMINISTRADOR can fetch users without password exposure | Integration | Yes |
| App Shell | HONOR-01 | App passes `usuarios` to `HonorariosTab` | Integration | Yes |
| Honorarios Modal | HONOR-02, HONOR-03 | Selecting unit displays professionals of that unit and populates Name and CRO | Unit/E2E | Yes |
| Fallback / Edge | HONOR-04 | Unit with no professionals or manual selection permits free-text typing | Unit/E2E | Yes |

*Gate check command:* `npm run build` e `npx tsx tests/honorarios-profissionais-unidade.test.ts`.

---

## Gate Check Commands

- Quick gate: `npx tsc --noEmit`
- Full gate: `npx tsc --noEmit && npx vite build`
- Test runner: `npx tsx tests/honorarios-profissionais-unidade.test.ts`

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

```
T1 → T2 → T3 → T4
```

---

## Task Breakdown

### T1: Permitir acesso seguro a usuários para GESTOR e ADMINISTRADOR no backend

**What**: Ajustar rota GET `/api/usuarios` em `src/server/server.ts` para permitir papéis `ADMINISTRADOR` e `GESTOR`, garantindo que hashes de senha não sejam expostos.
**Where**: `src/server/server.ts`
**Depends on**: None
**Requirement**: HONOR-01

**Tools**:
- MCP: `filesystem`
- Skill: NONE

**Done when**:
- [x] GET `/api/usuarios` permite autenticação de perfis ADMINISTRADOR e GESTOR
- [x] Nenhum hash de senha é retornado na resposta
- [x] TypeScript compila sem erros

**Tests**: integration
**Gate**: quick

---

### T2: Implementar select de profissionais no modal de Registrar Honorário

**What**: Atualizar `src/client/components/tabs/HonorariosTab.tsx` para aceitar `usuarios`, filtrar os profissionais da unidade selecionada (`u.unidade_id === unidadeId`), exibir o select com Nome e CRO e autopreencher os inputs de nome e CRO (com suporte a fallback manual).
**Where**: `src/client/components/tabs/HonorariosTab.tsx`
**Depends on**: T1
**Requirement**: HONOR-02, HONOR-03, HONOR-04

**Tools**:
- MCP: `filesystem`
- Skill: NONE

**Done when**:
- [x] Recebe `usuarios?: UserSistema[]` em Props
- [x] Filtra profissionais da unidade selecionada (`u.unidade_id === unidadeId`)
- [x] Exibe select de profissionais com formato `Nome - Registro/CRO`
- [x] Ao escolher um profissional, preenche `nomeDentista` e `cro`
- [x] Ao alternar a unidade, atualiza a lista de profissionais e reseta a seleção
- [x] Permite preenchimento manual caso nenhum profissional seja selecionado ou a unidade não tenha profissionais
- [x] `npx tsc --noEmit` passa sem erros

**Tests**: integration
**Gate**: quick

---

### T3: Passar prop usuarios para HonorariosTab no App Shell

**What**: Adicionar a prop `usuarios={usuarios}` na invocação de `<HonorariosTab />` dentro de `src/client/App.tsx`.
**Where**: `src/client/App.tsx`
**Depends on**: T2
**Requirement**: HONOR-01

**Tools**:
- MCP: `filesystem`
- Skill: NONE

**Done when**:
- [x] `HonorariosTab` recebe `usuarios={usuarios}`
- [x] TypeScript compila sem erros

**Tests**: integration
**Gate**: quick

---

### T4: Criar teste automatizado de verificação da feature

**What**: Criar o script de teste `tests/honorarios-profissionais-unidade.test.ts` cobrindo o acesso e relacionamento de profissionais por unidade.
**Where**: `tests/honorarios-profissionais-unidade.test.ts`
**Depends on**: T3
**Requirement**: HONOR-01, HONOR-02, HONOR-03, HONOR-04

**Tools**:
- MCP: `filesystem`
- Skill: NONE

**Done when**:
- [ ] Teste executa com sucesso via `npx tsx tests/honorarios-profissionais-unidade.test.ts`
- [ ] Build completo `npm run build` passa sem erros

**Tests**: integration
**Gate**: full
