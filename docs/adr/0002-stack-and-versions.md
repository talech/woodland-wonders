# ADR-0002: Stack and versions

- Status: Accepted
- Date: 2026-11-26
- Deciders: human owner (approved M0-REVIEW "approve all"), director
- Source: [M0-REVIEW.md](../M0-REVIEW.md) T0–T2, §4

## Decision

- Node 24 LTS (installed via Homebrew `node@24`; `.nvmrc` = 24). pnpm 12.19.0 pinned via `packageManager`, activated with corepack.
- Expo SDK 58 · React Native 0.88 · React 19.3 · TypeScript ~6.0 (the versions pinned by the Expo 58 template). TypeScript 7 is deferred until Expo adopts it.
- pnpm workspaces with isolated `node_modules`. If Metro resolution fails, fall back to `node-linker=hoisted` and amend this ADR.
- Exact versions are pinned and the lockfile committed.
- **Release-age policy:** direct dependencies are chosen from versions ≥14 days old. pnpm enforces `minimumReleaseAge: 10080` (7 days) for the whole tree, including transitive dependencies. A strict 14-day floor for transitives was tried and rejected because routine patch releases blocked resolution.
- Dependency install scripts are denied unless listed in `allowBuilds` (currently none allowed; `@parcel/watcher` explicitly denied, it ships prebuilt binaries).

## Implementation notes (2026-11-26)
- Isolated pnpm installs work with Expo 58 Metro for web, iOS and Android exports; the hoisted fallback was not needed.
- `expo` is held at 58.0.25 and `expo-router` at 58.0.31 although `expo install --check` suggests 58.1.0 / ~58.0.33 (published within 14 days). Re-align after 2026-12-10 via `pnpm expo install --fix`, then run `pnpm verify` + `pnpm smoke:native`.
- Node is keg-only from Homebrew: add `export PATH="/opt/homebrew/opt/node@24/bin:$PATH"` to the shell profile.

## Alternatives

Node 26 LTS (newer, less proven with Metro); npm workspaces (no strict isolation).

## Consequences

Upgrades happen per Expo SDK and are coordinated by the director (lockfile owner).
