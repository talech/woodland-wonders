# ADR-0003: Tooling: lint, format, tests, validation

- Status: Accepted
- Date: 2026-11-26
- Deciders: human owner (approved M0-REVIEW "approve all"), director
- Source: [M0-REVIEW.md](../M0-REVIEW.md) T3–T5

## Decision

- Biome 2 for lint and format across the repo.
- Vitest for pure packages and the editor.
- jest-expo + React Native Testing Library for app component and flow tests.
- Playwright web smoke at phone viewports from M1.
- zod 4 for runtime validation of content and saves. Schemas live in `@ww/puzzle-core`.

## Alternatives

ESLint + Prettier (more rules, two tools, coupled to the TS compiler API); Valibot (smaller); hand-written validators.

## Consequences

Two test runners exist, split by package type. The app is tested with Expo's supported harness.
