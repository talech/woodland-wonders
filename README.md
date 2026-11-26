# Woodland Wonders

A cozy, mobile-first logic puzzle. Place woodland animals next to their habitats so that every row, column and species count holds, with no two animals of the same species touching.

- Product intent: [docs/GDD.md](docs/GDD.md)
- Engineering contract: [AGENTS.md](AGENTS.md) · orchestration: [ORCHESTRATION.md](ORCHESTRATION.md)
- Current state: [docs/STATUS.md](docs/STATUS.md) · decisions: [docs/adr/](docs/adr/)

> **Status:** M0. The repository infrastructure is in place, and the architecture proposal is awaiting approval ([docs/M0-REVIEW.md](docs/M0-REVIEW.md)). The application workspace has not been scaffolded yet.

## Prerequisites (proposed, pending approval)
- Node.js 24 LTS
- pnpm (version pinned via `packageManager` in `package.json`)
- Optional for native runs: Expo Go on a device; Xcode (iOS simulator) or a JDK + Android SDK (emulator)

## Commands
Available now:

```sh
bash scripts/check-hygiene.sh   # tracked-file hygiene (also runs in CI)
```

Planned once the workspace is scaffolded (exact definitions in docs/M0-REVIEW.md §7):

```sh
pnpm install --frozen-lockfile
pnpm lint && pnpm format:check && pnpm typecheck
pnpm test
pnpm check:boundaries
pnpm content:validate
pnpm build:web
pnpm smoke:native
pnpm verify          # everything above, as CI runs it
```

## Repository layout (target)
```
apps/game               Expo app (iOS, Android, web)
apps/puzzle-editor      Developer puzzle editor (web, dev-only)
packages/puzzle-core    Rules engine: definitions, constraints, actions, history
packages/puzzle-solver  Deduction solver, hints, exhaustive search (subpath)
packages/puzzle-generator  Seeded offline generator + CLI
packages/puzzle-content Curated, versioned puzzle data and validation
packages/game-ui        Presentational React Native components
assets/                 Replaceable art with provenance
docs/                   GDD, status, ADRs
```

## Contributing workflow
Trunk-based development on `main`, with short-lived `feat/`, `fix/`, `chore/` and `refactor/` branches. Agent lanes work in isolated worktrees under `../woodland-wonders.worktrees/`. See [ADR-0001](docs/adr/0001-repository-workflow.md). Never commit `.env` files, credentials or build output; CI enforces this.
