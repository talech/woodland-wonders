# M2-D2 — Editor solver panel (lane D)

- Base: see dispatch message · Branch: `agent/m2/editor-solver` · Worktree: `/Users/tammy/Documents/Projects/woodland-wonders.worktrees/m2-editor-solver`
- Allowed writes: `apps/puzzle-editor/**` except `package.json`. **Do not edit** `packages/puzzle-content/src/data/puzzles.json` (director curates content). Other `packages/puzzle-content/**` edits are allowed only for the tier-fallback fix below (no package.json).
- References: ADR-0006, solver API (`packages/puzzle-solver/src/index.ts`, `src/types.ts`, `src/search/index.ts`), the `PuzzleAnalyzer` seam you created in `apps/puzzle-editor/src/model/analysis.ts`.

## Objective
Make the editor a real authoring and inspection tool: live solution count, deduction trace, difficulty and hint stepping, so a human can judge whether a puzzle is interesting.

## Requirements
- **Analyzer adapter** implementing `PuzzleAnalyzer` with `@ww/puzzle-solver` and `@ww/puzzle-solver/search`. The editor is dev-only, so search is allowed here. Use a node budget and show `unknown` honestly.
- **Solver panel:**
  - Solution count (0, 1, 2+, unknown) with nodes. When multiple, show the two distinct solutions side by side (or toggle) with differing cells highlighted.
  - Deduction trace from the blank board: an ordered list of steps (strategy, tier, explanation key + params rendered readably, eliminations). Clicking a step highlights its premise and affected cells on the grid and shows the domain state after that step (e.g. small candidate letters per cell).
  - Difficulty metrics from `analyzeDifficulty` (steps, max tier, per-strategy counts, chain depth) plus the minimum required tier (deduce with increasing `maxTier`).
  - Verdict badge: "publishable" iff unique AND deduction-solved; otherwise the reason.
- **Debounced recompute** on edits; never block typing. Keep heavy work out of render, using `useMemo`/`useEffect` with simple debounce (no workers needed unless measured slow).
- **Fix the tier inconsistency** found in review: an imported definition without `difficulty` exports as `beginner` but `add-puzzle` sorts a missing tier as `tutorial`. Make both use one shared default.
- Optional if cheap: a "load generator output" paste box is already covered by JSON import, so don't build anything new.

## Tests (Vitest, pure modules)
- Adapter results on core fixtures (`@ww/puzzle-core/testing`): unique/none/multiple, publishable verdict, required tier.
- Trace-to-view mapping (step → highlighted cells, domains after step).
- Tier default consistency test.

## Out of scope
Generator internals, game UI, content curation.
