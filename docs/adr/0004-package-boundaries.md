# ADR-0004: Package graph and bundle boundaries

- Status: Accepted
- Date: 2026-11-26
- Deciders: human owner (approved M0-REVIEW "approve all"), director
- Source: [M0-REVIEW.md](../M0-REVIEW.md) T6–T8, §5

## Decision

- Packages are `@ww/puzzle-core`, `@ww/puzzle-solver`, `@ww/puzzle-generator`, `@ww/puzzle-content`, `@ww/game-ui`, plus apps `apps/game` (Expo) and `apps/puzzle-editor` (Vite + React DOM, dev-only).
- Dependencies point toward core as drawn in M0-REVIEW §5. There are no cycles.
- Packages are consumed as TypeScript source and have no build step. `package.json#exports` defines the only importable entry points.
- Exhaustive search is reachable only via `@ww/puzzle-solver/search`. Test fixtures are reachable only via `@ww/puzzle-core/testing`.
- `pnpm check:boundaries` fails if:
  - a package imports something it doesn't declare;
  - code deep-imports another package's `src`;
  - `apps/game` or `packages/game-ui` imports `@ww/puzzle-generator`, `@ww/puzzle-solver/search`, or `/testing` outside test files.
- App libraries: expo-router, RN View-based board, react-native-svg for art, built-in `Animated`, AsyncStorage behind a `StorageAdapter`.
