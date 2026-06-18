# Rotina Sync

Daily logging PWA for tracking training adherence, diet, and hydration. Built for a 6x/week gym split with jiu-jitsu on Mon/Wed/Fri and a cutting-phase diet.

See [CONTEXT.md](./CONTEXT.md) for the full domain model and [docs/adr/](./docs/adr/) for architectural decisions.

## Stack

- React 19 + TypeScript 6 + Vite 8
- Persistence: IndexedDB (Camada 1) → Supabase (Camada 2, future)
- PWA: manifest + service worker (configured in a future task)

## Project structure

```
src/
  types/           Domain types (domain.ts) + Zod IDB parsers (schema.ts)
  persistencia/    Repository contracts (contratos.ts) + IDB adapter (TODO)
  motor-geracao/   Deterministic macro/plan calculation (TODO)
  banco-opcoes/    Curated exercise and meal options (TODO)
  styles/          theme.css — Modo Caverna design tokens, no component CSS
  components/      Shared UI components (TODO)
  features/        Feature modules: dashboard, registro, progresso (TODO)
  hooks/           React hooks (TODO)
  utils/           Pure helpers (TODO)

legacy/            Original HTML/CSS/JS implementation (reference only)
docs/adr/          Architectural Decision Records (ADR-0001 → ADR-0009)
```

## Commands

```bash
npm run dev        # dev server
npm run build      # type-check + bundle
npm run lint       # ESLint
npm run format     # Prettier (src/**/*.{ts,tsx,css})
npm run preview    # preview the production bundle
```

## Architecture layers

```
┌─────────────────────────────────────┐
│  Features / Components              │  React, hooks
├─────────────────────────────────────┤
│  Motor de Geração                   │  Deterministic, no AI (ADR-0005)
│  Banco de Opções                    │  Curated data
├─────────────────────────────────────┤
│  Camada de Persistência             │  Repository interfaces (ADR-0007)
│    └─ IDB Adapter (Camada 1)        │  IndexedDB, final schema (ADR-0006)
│    └─ Supabase Adapter (Camada 2)   │  future
└─────────────────────────────────────┘
```
