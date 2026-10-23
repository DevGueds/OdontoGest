# STATE

## Decisions

### AD-001
- **Decision**: Adotar Tailwind CSS + componentes shadcn/ui (Radix UI + Lucide React) com tema Modern Clinical (Slate + Cyan/Teal) e suporte nativo a Dark Mode.
- **Reason**: Modernizar a interface do OdontoGest para uma estética premium, acessível e manutenível, eliminando CSS monolítico customizado e dependência de FontAwesome via CDN.
- **Trade-off**: Adiciona dependências de build de CSS (Tailwind, postcss, autoprefixer) e componentes de UI desacoplados em `src/client/components/ui/`.
- **Scope**: Toda a camada visual do front-end (`src/client/`).
- **Date**: 2026-10-23
- **Status**: active

## Handoff

- **Feature**: .specs/features/ui-modernization-shadcn
- **Phase / Task**: Phase 1 / Specify
- **Completed**: none
- **In-progress** (file:line): `.specs/features/ui-modernization-shadcn/spec.md`
- **Next step**: Finalizar e validar o spec.md e context.md com validate_spec.py.
- **Blockers**: none
- **Uncommitted files**: none
- **Branch**: main
