# ADR-0002: Stack and versions

- Status: Accepted
- Date: 2026-11-26
- Deciders: human owner (approved M0-REVIEW "approve all"), director
- Source: [M0-REVIEW.md](../M0-REVIEW.md) T0–T2, §4

## Decision

- Node 24 LTS (installed via Homebrew `node@24`; `.nvmrc` = 24). pnpm 12.19.0 pinned via `packageManager`, activated with corepack.
- Expo SDK 58 · React Native 0.88 · React 19.3 · TypeScript ~6.0 (the versions pinned by the Expo 58 template). TypeScript 7 is deferred until Expo adopts it.
- pnpm workspaces with isolated `node_modules`. If Metro resolution fails, fall back to `node-linker=hoisted` and amend this ADR.
- Exact versions are pinned and the lockfile committed. Dependency versions published within the previous two weeks are avoided.

## Alternatives

Node 26 LTS (newer, less proven with Metro); npm workspaces (no strict isolation).

## Consequences

Upgrades happen per Expo SDK and are coordinated by the director (lockfile owner).
