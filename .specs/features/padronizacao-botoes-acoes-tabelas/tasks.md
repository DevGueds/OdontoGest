# Tasks: Padronização dos Botões de Ações das Tabelas

## Test Coverage Matrix

| Area | Requirement | Scenario | Test Type | Automated? |
| --- | --- | --- | --- | --- |
| CatalogoTab | BTN-01 | Unidades and Materiais table buttons follow `h-8 w-8` icon standard with semantic hovers | Unit/E2E | Yes |
| UsuariosTab | BTN-02 | Users table buttons adhere to unified tokens and semantic hover colors | Unit/E2E | Yes |
| OrcamentoTab | BTN-02 | Inflows table delete button aligns with `h-8 w-8` icon standard | Unit/E2E | Yes |
| DashboardTab | BTN-03 | Critical stock table buttons follow unified icon standard | Unit/E2E | Yes |
| EquipamentosTab | BTN-03, BTN-04 | Equipment table uses `h-8 w-8` icon buttons and Maintenance calls use `h-7.5` workflow buttons | Unit/E2E | Yes |
| TriagemTab | BTN-04 | Order triage table uses standardized `h-7.5 px-2.5 text-xs` workflow buttons | Unit/E2E | Yes |

*Gate check command:* `npx tsc --noEmit && npx vite build`.

---

## Gate Check Commands

- Quick gate: `npx tsc --noEmit`
- Full gate: `npx tsc --noEmit && npx vite build`

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

```
T1 → T2 → T3 → T4 → T5 → T6
```

---

## Task Breakdown

### T1: Padronizar botões de ações em CatalogoTab

**What**: Converter os botões das tabelas de Unidades e Materiais em `src/client/components/tabs/CatalogoTab.tsx` para o padrão de ícone-botão `h-8 w-8 p-0`, com tooltips via `title` e cores semânticas Tailwind.
**Where**: `src/client/components/tabs/CatalogoTab.tsx`
**Depends on**: None
**Requirement**: BTN-01

**Tools**:
- MCP: `filesystem`
- Skill: NONE

**Done when**:
- [x] Botões de Editar Unidade e Excluir Unidade usam `h-8 w-8 p-0`
- [x] Botões de Editar Material, Repor Estoque e Excluir Material usam `h-8 w-8 p-0`
- [x] Cores hexadecimais inline substituídas por tokens semânticos
- [x] `npx tsc --noEmit` passa sem erros

**Tests**: integration
**Gate**: quick

---

### T2: Padronizar botões de ações em UsuariosTab

**What**: Ajustar os botões de ação da tabela de usuários em `src/client/components/tabs/UsuariosTab.tsx` para alinhamento com a paleta semântica clínica e cabeçalho `w-24`.
**Where**: `src/client/components/tabs/UsuariosTab.tsx`
**Depends on**: T1
**Requirement**: BTN-02

**Tools**:
- MCP: `filesystem`
- Skill: NONE

**Done when**:
- [x] Botões de Editar e Excluir usam classes de hover semânticas padronizadas
- [x] Cabeçalho da coluna Ações tem largura proporcional `w-24`
- [x] `npx tsc --noEmit` passa sem erros

**Tests**: integration
**Gate**: quick

---

### T3: Padronizar botão de exclusão em OrcamentoTab

**What**: Ajustar o botão de exclusão de aporte na tabela de entradas em `src/client/components/tabs/OrcamentoTab.tsx` para `h-8 w-8 p-0` e hover semântico.
**Where**: `src/client/components/tabs/OrcamentoTab.tsx`
**Depends on**: T2
**Requirement**: BTN-02

**Tools**:
- MCP: `filesystem`
- Skill: NONE

**Done when**:
- [x] Botão de Remover Entrada usa `h-8 w-8 p-0` e hover rose semântico
- [x] `npx tsc --noEmit` passa sem erros

**Tests**: integration
**Gate**: quick

---

### T4: Padronizar botões de ações rápidas em DashboardTab

**What**: Converter os botões de ação da tabela de insumos críticos em `src/client/components/tabs/DashboardTab.tsx` para o padrão icon-button `h-8 w-8 p-0` com `Pencil` e `PlusCircle`.
**Where**: `src/client/components/tabs/DashboardTab.tsx`
**Depends on**: T3
**Requirement**: BTN-03

**Tools**:
- MCP: `filesystem`
- Skill: NONE

**Done when**:
- [ ] Botões de Repor e Editar usam `h-8 w-8 p-0` com tooltips
- [ ] Ícone `Edit2` unificado para `Pencil`
- [ ] Cabeçalho da coluna renomeado para "Ações" com `w-24`
- [ ] `npx tsc --noEmit` passa sem erros

**Tests**: integration
**Gate**: quick

---

### T5: Padronizar botões de ações em EquipamentosTab

**What**: Padronizar botões da tabela de equipamentos como icon-buttons `h-8 w-8 p-0` e botões da tabela de chamados como workflow buttons `h-7.5 px-2.5 text-xs font-medium gap-1.5` em `src/client/components/tabs/EquipamentosTab.tsx`.
**Where**: `src/client/components/tabs/EquipamentosTab.tsx`
**Depends on**: T4
**Requirement**: BTN-03, BTN-04

**Tools**:
- MCP: `filesystem`
- Skill: NONE

**Done when**:
- [ ] Tabela de equipamentos usa botões de Editar (`Pencil`) e Preventiva (`CalendarCheck`) em `h-8 w-8 p-0`
- [ ] Tabela de chamados usa botões de Aprovar, Rejeitar, Iniciar e Concluir em `h-7.5 px-2.5 text-xs`
- [ ] `npx tsc --noEmit` passa sem erros

**Tests**: integration
**Gate**: quick

---

### T6: Padronizar botões de workflow em TriagemTab

**What**: Padronizar os botões de fluxo de pedidos (Ficha, Cancelar, Receber, Atender, Enviar) em `src/client/components/tabs/TriagemTab.tsx` com `h-7.5 px-2.5 text-xs font-medium gap-1.5`.
**Where**: `src/client/components/tabs/TriagemTab.tsx`
**Depends on**: T5
**Requirement**: BTN-04

**Tools**:
- MCP: `filesystem`
- Skill: NONE

**Done when**:
- [ ] Botões de Ficha, Cancelar, Receber, Atender e Enviar seguem as dimensões `h-7.5 px-2.5 text-xs`
- [ ] Ícones dimensionados para `h-3.5 w-3.5`
- [ ] `npx tsc --noEmit` e `npx vite build` passam sem erros

**Tests**: integration
**Gate**: full
