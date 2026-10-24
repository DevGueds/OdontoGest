# Tasks: Padronização dos Botões de Ações de Formulários

## Test Coverage Matrix

| Area | Requirement | Scenario | Test Type | Automated? |
| --- | --- | --- | --- | --- |
| Confirm Dialog & Login | FBTN-02, FBTN-03 | Cancelar and Excluir dialog buttons have icons, semantic colors, hover and tooltips | Unit/E2E | Yes |
| Catalog Modals | FBTN-01, FBTN-02, FBTN-04 | Unit and Material create/edit/stock modals standardized | Unit/E2E | Yes |
| Workflow Modals | FBTN-01, FBTN-02, FBTN-04 | Envio, Recebimento, Atendimento, Relatorio and Ficha modals standardized | Unit/E2E | Yes |
| Users & Honorários | FBTN-01, FBTN-02 | User and Honorario registration modals standardized | Unit/E2E | Yes |
| Equipment Modals | FBTN-01, FBTN-02 | Equipment, Preventive and Repair chamados modals standardized | Unit/E2E | Yes |
| Order & Budget Forms | FBTN-01, FBTN-02, FBTN-04 | NovoPedidoTab and OrcamentoTab form actions standardized | Unit/E2E | Yes |
| Type & Build Integrity | FBTN-05 | Full TypeScript compilation and production build succeed | Static/Build | Yes |

*Gate check command:* `npx tsc --noEmit` and `npx vite build`.

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

### T1: Padronizar botões em confirm-dialog e LoginModal

**What**: Adicionar ícones (`X`, `Trash2`, `LogIn`), cores semânticas com hover e tooltips aos botões de `src/client/components/ui/confirm-dialog.tsx` e `src/client/components/LoginModal.tsx`.
**Where**: `src/client/components/ui/confirm-dialog.tsx`, `src/client/components/LoginModal.tsx`
**Depends on**: None
**Requirement**: FBTN-02, FBTN-03
**Tools**:
- MCP: `filesystem`
- Skill: NONE

**Done when**:
- [x] `ConfirmDeleteDialog` exibe `<X className="w-4 h-4" />` no botão de Cancelar com hover rose suave e tooltip
- [x] `ConfirmDeleteDialog` exibe `<Trash2 className="w-4 h-4" />` no botão de Excluir com tooltip de aviso
- [x] `LoginModal` possui tooltip no botão de submissão e transições adequadas
- [x] `npx tsc --noEmit` passa sem erros

**Tests**: static
**Gate**: quick

---

### T2: Padronizar botões nos modais de Unidades, Materiais e Estoque

**What**: Padronizar botões de Cancelar (`X`, outline com hover rose, tooltip) e Salvar/Cadastrar/Estoque (`Save`, `Plus`, `Check`, variant default ou emerald, hover e tooltip) em `ModalUnidade.tsx`, `ModalEditarUnidade.tsx`, `ModalMaterial.tsx`, `ModalEditarMaterial.tsx` e `ModalAjusteEstoque.tsx`.
**Where**: `src/client/components/modals/ModalUnidade.tsx`, `src/client/components/modals/ModalEditarUnidade.tsx`, `src/client/components/modals/ModalMaterial.tsx`, `src/client/components/modals/ModalEditarMaterial.tsx`, `src/client/components/modals/ModalAjusteEstoque.tsx`
**Depends on**: T1
**Requirement**: FBTN-01, FBTN-02, FBTN-04
**Tools**:
- MCP: `filesystem`
- Skill: NONE

**Done when**:
- [x] Todos os 5 modais possuem botão Cancelar com ícone `<X />`, hover semântico e tooltip
- [x] Todos os botões de confirmação/salvamento possuem ícones correspondentes (`Plus`, `Save`, `Check`), cores apropriadas e tooltips
- [x] `npx tsc --noEmit` passa sem erros

**Tests**: static
**Gate**: quick

---

### T3: Padronizar botões nos modais de Envio, Recebimento, Atendimento, Relatório e Ficha PBS

**What**: Atualizar os botões de ação em `ModalEnvio.tsx`, `ModalRecebimento.tsx`, `ModalAtendimento.tsx`, `ModalRelatorio.tsx` e `ModalFichaPbs.tsx` com ícones, cores semânticas, hover suave e tooltips descritivos.
**Where**: `src/client/components/modals/ModalEnvio.tsx`, `src/client/components/modals/ModalRecebimento.tsx`, `src/client/components/modals/ModalAtendimento.tsx`, `src/client/components/modals/ModalRelatorio.tsx`, `src/client/components/modals/ModalFichaPbs.tsx`
**Depends on**: T2
**Requirement**: FBTN-01, FBTN-02, FBTN-04
**Tools**:
- MCP: `filesystem`
- Skill: NONE

**Done when**:
- [x] Botões Cancelar e Fechar recebem ícone `<X />` e hover sutil
- [x] Botões de despacho, recebimento e atendimento recebem tooltips e estilização padrão
- [x] Botões de exportação em `ModalRelatorio` (Excel e PDF) e impressão em `ModalFichaPbs` recebem ícones e tooltips
- [x] `npx tsc --noEmit` passa sem erros

**Tests**: static
**Gate**: quick

---

### T4: Padronizar botões nos modais de Usuários e Honorários

**What**: Atualizar rodapé dos formulários em `src/client/components/tabs/UsuariosTab.tsx` e `src/client/components/tabs/HonorariosTab.tsx` adicionando ícone `<X />` com hover suave e tooltip no botão Cancelar, e tooltip descritivo no botão Salvar (`Save`).
**Where**: `src/client/components/tabs/UsuariosTab.tsx`, `src/client/components/tabs/HonorariosTab.tsx`
**Depends on**: T3
**Requirement**: FBTN-01, FBTN-02
**Tools**:
- MCP: `filesystem`
- Skill: NONE

**Done when**:
- [x] Formulário de usuário possui Cancelar com `<X />` e hover suave, e Salvar com `<Save />` e tooltip
- [x] Formulário de honorário possui Cancelar com `<X />` e hover suave, e Salvar com `<Save />` e tooltip
- [x] `npx tsc --noEmit` passa sem erros

**Tests**: static
**Gate**: quick

---

### T5: Padronizar botões nos modais de Equipamentos e Manutenção

**What**: Atualizar os modais de Cadastro de Equipamento, Edição de Equipamento, Abertura de Chamado e Atualização de Status em `src/client/components/tabs/EquipamentosTab.tsx`, garantindo que todos os botões Cancelar e Submeter tenham ícones da ação, cores semânticas, hover e tooltips.
**Where**: `src/client/components/tabs/EquipamentosTab.tsx`
**Depends on**: T4
**Requirement**: FBTN-01, FBTN-02
**Tools**:
- MCP: `filesystem`
- Skill: NONE

**Done when**:
- [x] Modal Novo Equipamento possui botões com ícones (`X` e `Plus`), cores e tooltips
- [x] Modal Editar Equipamento possui botões com ícones (`X` e `Save`), cores e tooltips
- [x] Modal Abrir Chamado possui botões com ícones (`X` e `Wrench`/`CalendarCheck`), cores e tooltips
- [x] Modal Atualizar Status possui botões com ícones (`X` e `Check`), cores e tooltips
- [x] `npx tsc --noEmit` passa sem erros

**Tests**: static
**Gate**: quick

---

### T6: Padronizar ações de formulário em NovoPedidoTab e OrcamentoTab

**What**: Atualizar botões de ação em `NovoPedidoTab.tsx` (Adicionar Insumo, Cancelar e Emitir PBS) e `OrcamentoTab.tsx` (Registrar Entrada e Limpar) com ícones, cores semânticas, hover e tooltips completos.
**Where**: `src/client/components/tabs/NovoPedidoTab.tsx`, `src/client/components/tabs/OrcamentoTab.tsx`
**Depends on**: T5
**Requirement**: FBTN-01, FBTN-02, FBTN-04, FBTN-05
**Tools**:
- MCP: `filesystem`
- Skill: NONE

**Done when**:
- [x] Botão "Adicionar Insumo" possui ícone `<Plus />`, estilo semântico e tooltip
- [x] Botão "Cancelar" possui ícone `<X />` com hover rose suave e tooltip
- [x] Botão "Emitir Solicitação de PBS" possui ícone `<Send />`, elevação e tooltip
- [x] Botão "Registrar Entrada" em Orçamentos possui ícone `<Check />` e tooltip
- [x] `npx tsc --noEmit` e `npx vite build` concluem com 0 erros

**Tests**: static
**Gate**: full
