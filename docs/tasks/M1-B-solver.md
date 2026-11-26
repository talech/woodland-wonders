# M1-B — Solver (lane B)

- Base: `b78c9ab` · Branch: `agent/m1/solver` · Worktree: `/Users/tammy/Documents/Projects/woodland-wonders.worktrees/m1-solver`
- Allowed writes: `packages/puzzle-solver/**` except `package.json`.
- References: ADR-0004, ADR-0005, ADR-0006, ADR-0008 (P3/P4), ADR-0009 (P7), M0-REVIEW §2 and §6.4, GDD §10–11, AGENTS.md "Contracts and correctness".

## Objective
Implement `@ww/puzzle-solver`: a human-style deduction solver with structured proof steps and hints (main entry, gameplay-safe, bundled in the game), and an exhaustive bounded search (`@ww/puzzle-solver/search`, offline/dev only). The generator is NOT in scope (next task).

## Requirements
1. **Domains:** per-cell candidate set over `'empty' | SpeciesId` (habitat cells excluded). Compact and deterministic (e.g. bitmask in ruleset species order). Initial domains from `(puzzle, marks)`. Player animal → that species only; player `empty` → `{empty}`; unmarked → all values minus species lacking an orthogonal accepted habitat.
2. **Deduction strategies** (each a separate, independently tested module; no species hardcoded; use the puzzle's ruleset and constraint semantics). Each produces `DeductionStep { strategy, tier, eliminations, premises: { constraints, cells }, explanation: { key, params } }` as in M0-REVIEW §6.4. Minimum set (refine names and tiers as needed and document them):
   - tier 1: no-habitat elimination; line saturated (placed = clue ⇒ remaining empty); line forced (possible cells = clue ⇒ all animals); species exhausted / species forced (population analogues); neighbour exclusion (a determined species removes itself from king neighbours).
   - tier 2: single candidate; line/species interactions, e.g. a cell that is "animal but species unknown" combined with population counts.
   - tier 3: intersection reasoning across row/column/species, e.g. a 2×2 window holds at most one of each species; "k animals must fit in a line segment whose candidates pairwise touch" style counting. Add only strategies you can prove sound.
   - **No trial-and-error, look-ahead or search in deduction.** If you believe a bounded "forcing chain" is a legitimate human technique worth including, don't implement it; describe it as a change request.
   Strategies are applied in a deterministic order: cheapest/lowest tier first, restarting from tier 1 after any progress.
3. **API (main entry):**
   - `createDomains(puzzle, marks)`
   - `deduce(puzzle, marks, options?) → DeductionResult` (`solved | stuck | contradiction` with steps).
   - `nextHint(puzzle, marks) → Hint`:
     - Must respect the player's marks.
     - Must return the shortest step sequence that ends in a **player-visible** conclusion: a cell becomes determined empty or a determined species that differs from its current mark.
     - On contradiction, return the conflict (violations/steps) and **never** invent a move or compare against a hidden solution.
     - Return `solved` when the board is complete.
   - `analyzeDifficulty(steps) → metrics` (step count, max tier, per-strategy counts, longest dependency chain where measurable).
   - Export all public types.
4. **Search (`/search`):** `search(puzzle, { nodeBudget, marks? }) → SearchResult` (`none | unique | multiple(2 solutions) | unknown(budget)`).
   - Stops at 2 solutions.
   - Deterministic branching order.
   - May use propagation for pruning.
   - Final candidate solutions must be confirmed with core `isSolved`.
5. **Single source of truth:** rule semantics come from core. Never re-implement a validator that could diverge; derive strategy logic from ruleset data plus core geometry.

## Required tests
- **Brute-force oracle** built ONLY on core `isSolved` (see `packages/puzzle-core/test/oracle.test.ts`). Generate ≥500 deterministic random tiny boards (3×3 to 4×4, 1–2 species, seeded PRNG in test code), with a mix of zero, one and multiple solutions. Assert:
  - search count (capped at 2) equals the oracle;
  - every elimination from every deduction step on those boards is absent from **all** oracle solutions (soundness);
  - for unique boards, deduce never eliminates the true value.
- Core fixtures (`@ww/puzzle-core/testing` FIXTURES): search returns the expected 0/1/2; `deduce` on the unique fixtures from the blank board reaches `solved`, or report honestly which are `stuck` and why.
- Budget exhaustion returns `unknown`.
- Determinism (same input ⇒ identical steps).
- One test per strategy with hand-built ASCII boards (`fromAscii`/`marksFromAscii`).
- Hints:
  - respect empty marks;
  - a wrong player placement leads to a contradiction result, not a correction;
  - a solved board returns `solved`.
- Performance sanity: `deduce` on the 6×6 fixture well under 50 ms.

## Out of scope
Generator, UI, content changes, local clues.
