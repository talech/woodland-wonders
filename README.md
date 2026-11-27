# Woodland Wonders

A cozy, mobile-first logic puzzle. Place woodland animals next to their habitats so that every row, column and species count holds, with no two animals of the same species touching.

- Product intent: [docs/GDD.md](docs/GDD.md)
- Engineering contract: [AGENTS.md](AGENTS.md) · orchestration: [ORCHESTRATION.md](ORCHESTRATION.md)
- Current state: [docs/STATUS.md](docs/STATUS.md) · decisions: [docs/adr/](docs/adr/)

> **Status:** M4 ready for human playtesting (M0–M3 complete; CI verified green at `77058e0`). See [docs/STATUS.md](docs/STATUS.md) for current evidence and limitations.

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
| `pnpm verify` | Lint, format, types, boundaries, tests, content validation, web export and web bundle inspection. |
| `pnpm check:bundle` / `pnpm check:bundle:native` | Inspect exported bundles for forbidden runtime dependencies |
| `pnpm test:e2e` | Playwright phone-viewport flows (requires web export and Chromium) |
| `pnpm playtest:web` | Build and serve locally at http://127.0.0.1:4173 |
| `pnpm lint` / `pnpm format:check` | Biome lint / format check (`pnpm format` writes) |
| `pnpm typecheck` | `tsc` in every workspace |
| `pnpm check:boundaries` | Package dependency direction, public-export-only imports, gameplay bundle exclusions (ADR-0004) |
| `pnpm test` | Vitest (packages, editor) + Jest/jest-expo (app) |
| `pnpm content:validate` | Validates shipped puzzles, including uniqueness and deduction replay |
| `pnpm build:web` | Expo web export to `apps/game/dist/web` |
| `pnpm smoke:native` | iOS + Android Metro bundle export (no device needed) |
| `bash scripts/check-hygiene.sh` | Tracked-file hygiene (also in CI) |

Run the game: `pnpm --filter @ww/game start` (press `w` for web, or scan the QR code with Expo Go).
Run the editor: `pnpm --filter @ww/puzzle-editor dev`.

Dependency changes are director-owned. Use `pnpm expo install <pkg>` inside `apps/game` for Expo-managed modules. pnpm refuses versions younger than 7 days (ADR-0002).

For phone setup and session preparation, see [M4 readiness](docs/playtest/READY.md) and the [protocol](docs/playtest/PROTOCOL.md). CI also runs hygiene, native export/bundle inspection and e2e.

## Repository layout
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
