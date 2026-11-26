# ADR-0005: Core contracts

- Status: Accepted
- Date: 2026-11-26
- Deciders: human owner (approved M0-REVIEW "approve all"), director
- Source: [M0-REVIEW.md](../M0-REVIEW.md) §6.1–6.3

## Decision

The contracts in M0-REVIEW §6.1–6.3 are frozen as implemented in `packages/puzzle-core/src/contracts/`. Refinements made at implementation time:

- `SpeciesId`, `HabitatId`, `PuzzleId` are plain `string` aliases (not branded) so JSON content and tests stay ergonomic. Runtime schemas validate them.
- `ConstraintStatus` reports **all** violations of a constraint (`violations: Violation[]`), not just the first.
- `evaluate(board, mode)` takes `'partial'` (unmarked = undecided) or `'complete'` (unmarked = empty). Completion = no violations in complete mode.
- Undo/redo operate on `GameState { board, history }` through pure functions.

Changes after freeze require a new ADR and director integration.
