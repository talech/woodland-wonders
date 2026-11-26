# Woodland Wonders

A cozy, mobile-first logic puzzle. Place woodland animals next to their habitats so that every row, column and species count holds, with no two animals of the same species touching.

- Product intent: [docs/GDD.md](docs/GDD.md)
- Engineering contract: [AGENTS.md](AGENTS.md) · orchestration: [ORCHESTRATION.md](ORCHESTRATION.md)
- Current state: [docs/STATUS.md](docs/STATUS.md) · decisions: [docs/adr/](docs/adr/)

> **Status:** M0b complete. The architecture is approved ([docs/M0-REVIEW.md](docs/M0-REVIEW.md), ADR-0002…0009). The rules engine (`@ww/puzzle-core`) is implemented and tested, and the other packages are scaffolded for parallel development. See [docs/STATUS.md](docs/STATUS.md).

## Prerequisites
- Node.js 24 LTS (`.nvmrc`). On macOS with Homebrew: `brew install node@24` and add `/opt/homebrew/opt/node@24/bin` to `PATH`.
- pnpm via corepack: `corepack enable` (the version is pinned by `packageManager` in `package.json`).
- Optional for native runs: Expo Go on a device; Xcode (iOS simulator) or a JDK + Android SDK (emulator).

## Setup
```sh
corepack enable
pnpm install --frozen-lockfile
```

## Commands
| Command | What it does |
|---|---|
| `pnpm verify` | Everything below in CI order. Must be green before integrating to `main`. |
| `pnpm lint` / `pnpm format:check` | Biome lint / format check (`pnpm format` writes) |
| `pnpm typecheck` | `tsc` in every workspace |
| `pnpm check:boundaries` | Package dependency direction, public-export-only imports, gameplay bundle exclusions (ADR-0004) |
| `pnpm test` | Vitest (packages, editor) + Jest/jest-expo (app) |
| `pnpm content:validate` | Validates every shipped puzzle (uniqueness + deduction replay join once the solver lands) |
| `pnpm build:web` | Expo web export to `apps/game/dist/web` |
| `pnpm smoke:native` | iOS + Android Metro bundle export (no device needed) |
| `bash scripts/check-hygiene.sh` | Tracked-file hygiene (also in CI) |

Run the game: `pnpm --filter @ww/game start` (press `w` for web, or scan the QR code with Expo Go).
Run the editor: `pnpm --filter @ww/puzzle-editor dev`.

Dependency changes are director-owned. Use `pnpm expo install <pkg>` inside `apps/game` for Expo-managed modules. pnpm refuses versions younger than 7 days (ADR-0002).

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
