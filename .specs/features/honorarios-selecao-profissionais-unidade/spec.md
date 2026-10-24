# Seleção de Profissionais por Unidade no Registro de Honorários Specification

## Problem Statement

Atualmente, ao registrar um novo honorário odontológico no modal "Registrar Honorário Odontológico" da aba `HonorariosTab`, o usuário seleciona a Unidade de Saúde Alocada, mas é obrigado a digitar manualmente em campos de texto livre o "Nome Completo do Cirurgião Dentista" e o "CRO". 
Como os profissionais já estão cadastrados no sistema vinculados às suas respectivas unidades de saúde com nome e registro/CRO, a ausência de um campo de seleção (`select`) gera retrabalho, propensão a erros de digitação e inconsistência cadastral.

## Goals

- [ ] Disponibilizar os dados de usuários/profissionais (`usuarios`) no componente `HonorariosTab`.
- [ ] No modal "Registrar Honorário Odontológico", exibir um campo de seleção (`select`) contendo apenas os profissionais vinculados à unidade de saúde selecionada, formatados com Nome e CRO.
- [ ] Ao selecionar um profissional da lista, preencher automaticamente os campos de Nome do Cirurgião Dentista e CRO.
- [ ] Permitir a opção de preenchimento manual caso o profissional seja novo ou ainda não esteja cadastrado na unidade.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Alteração estrutural na tabela de honorários no banco de dados | A tabela `honorarios_odontologos` já armazena `nome_dentista` e `cro` em conformidade com o modelo atual. |
| Cadastro de novos profissionais de dentro do modal de honorários | O cadastro e gestão de usuários/profissionais permanece centralizado na aba `UsuariosTab`. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Formato de exibição do profissional no select | "Nome - CRO" (ou "Nome - S/ CRO" caso não possua registro) | Facilita a identificação rápida e inequívoca do dentista conforme solicitado pelo usuário. | Sim |
| Opção de preenchimento manual | Incluir opção "Outro / Preenchimento manual" no select e manter campos editáveis | Evita que o operador fique impedido de lançar honorários de prestadores eventuais ou recém-admitidos. | Sim |
| Troca de unidade de saúde no modal | Ao mudar a unidade, resetar a seleção do profissional e recarregar os profissionais da nova unidade | Garante coerência entre a unidade alocada e o profissional selecionado. | Sim |
| Disponibilização de usuários | Repassar `usuarios` do estado central de `App.tsx` para `HonorariosTab` | O estado de `usuarios` já é carregado pelo `dbService.getUsuarios()` no `App.tsx`. | Sim |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Seleção Automática de Dentista por Unidade no Registro de Honorário ⭐ MVP

**User Story**: Como gestor ou administrador, quero selecionar a unidade de saúde no modal de honorários e escolher o cirurgião dentista a partir de um select com os profissionais daquela unidade exibindo Nome e CRO, para agilizar o lançamento e evitar erros de digitação.

**Why P1**: Elimina a digitação manual redundante e garante a consistência dos dados de honorários com o quadro de profissionais da unidade.

**Acceptance Criteria** (EARS notation):

1. The system SHALL provide the list of users (`usuarios`) to `HonorariosTab`. <!-- ubiquitous -->
2. WHEN the user selects a health unit in the registration modal THEN the system SHALL filter and list in a select dropdown only the professionals allocated to that selected unit, displaying their Name and CRO. <!-- event-driven -->
3. WHEN a professional is selected from the dropdown THEN the system SHALL automatically populate the dentist name and CRO fields. <!-- event-driven -->
4. IF a unit has no registered professionals or the user chooses manual entry THEN the system SHALL allow manual entry of dentist name and CRO. <!-- unwanted-behavior -->
5. WHEN the health unit selection is changed in the modal THEN the system SHALL reset the selected professional and update the options for the new unit. <!-- event-driven -->

**Independent Test**: Abrir a aba de Honorários, clicar em "Registrar Honorário", alternar a Unidade de Saúde e verificar que o select de profissionais lista apenas os profissionais daquela unidade com Nome e CRO, e ao selecionar um profissional os campos correspondentes são preenchidos.

---

## Edge Cases

- IF the selected unit has no registered professionals THEN the system SHALL indicate "Nenhum profissional cadastrado nesta unidade" and keep the manual inputs active.
- IF a professional does not have a CRO registered THEN the system SHALL format the option with "(S/ CRO)".
- IF the user clears the professional selection THEN the system SHALL clear the prefilled dentist name and CRO.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| HONOR-01 | P1: Passagem de Usuários para HonorariosTab | Execute | Verified |
| HONOR-02 | P1: Select de Profissionais por Unidade com Nome e CRO | Execute | Verified |
| HONOR-03 | P1: Auto-preenchimento de Nome e CRO ao Selecionar | Execute | Verified |
| HONOR-04 | P1: Suporte a Preenchimento Manual e Fallback para Unidade sem Profissionais | Execute | Verified |

**Coverage:** 4 total, 4 mapped to tasks, 0 unmapped.

---

## Success Criteria

- [ ] Select de profissionais reativo à unidade selecionada funcionando no modal de honorários.
- [ ] Exibição clara no formato "Nome - CRO".
- [ ] Preenchimento automático de Nome e CRO ao selecionar um profissional.
- [ ] Capacidade mantida de informar manualmente caso necessário.
- [ ] Testes de compilação e verificação passando com sucesso.
