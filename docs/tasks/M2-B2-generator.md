# M2-B2 — Seeded generator + CLI (lane B)

- Base: see dispatch message · Branch: `agent/m2/generator` · Worktree: `/Users/tammy/Documents/Projects/woodland-wonders.worktrees/m2-generator`
- Allowed writes: `packages/puzzle-generator/**` except `package.json`. **Read-only:** everything else, including the solver (request changes via report).
- References: ADR-0006, ADR-0009 (P7, P9), M0-REVIEW §2 (feasibility spike: random puzzles are shallow; depth must be selected for), GDD §5 and §11 (pipeline steps 1–8), AGENTS.md (determinism, caps, rejection reasons, provenance).

## Objective
Offline, deterministic generation of candidate puzzles that pass the publication gate (unique via `@ww/puzzle-solver/search`, deduction-only solve via `deduce`) and are **selected for depth**. Report yield and rejection reasons honestly; never weaken criteria.

## Requirements
- **Seeded PRNG** (e.g. xoshiro128** / sfc32) from a string seed. No `Math.random` or `Date`. Same seed + params + `GENERATOR_VERSION` ⇒ byte-identical output.
- **Pipeline per attempt:**
  1. Place habitats (density, per-species mix).
  2. Place animals as a valid completed board (respect habitat adjacency and exclusion; target population per species).
  3. Derive clues and population.
  4. Run `search` with a node budget: anything other than `unique` is rejected with reason `none`, `multiple` or `unknown-budget`.
  5. Run `deduce` with increasing `maxTier` to find the **minimum tier required**. Not solved even at max tier ⇒ reject `requires-guessing`.
  6. Compute metrics with `analyzeDifficulty`, plus species-overlap ratio (share of grass cells whose initial domain has ≥2 species), steps, chain depth and per-strategy counts.
  7. Apply the band filter.
  8. Emit a `PuzzleDefinition` with `provenance { generatorVersion, seed (attempt seed), params }` and `difficulty { tier, metrics }`.
- **Difficulty bands** (provisional, documented in code, configurable). Classification uses required strategy tier first, size second:

  | Band | Board | Species | Required tier | Other |
  |---|---|---|---|---|
  | tutorial | 4×4 | 1 | 1 | few steps |
  | beginner | 5×5 | 1–2 | 1 | — |
  | easy | 5×5 | 2 | 1 | species overlap ≥ a threshold; reject trivially line-solved boards (e.g. solved by line strategies alone within N steps) |
  | intermediate | 6×6 | 3 | 2 | **or** tier 1 with long chain depth + high overlap |
  | advanced | 6×6–8×8 | 3 | 3 | **or** tier 2 with long chains |

  Tune habitat density and overlap to reach these. If a band's yield is poor, report actual numbers and leave its targets unlowered.
- **Diversity helpers:** canonical fingerprint invariant under the 8 symmetries (rotations/reflections) of square boards (4 for non-square) to dedupe; a simple layout-similarity measure.
- **CLI** `packages/puzzle-generator/scripts/generate.ts` (plain `node`, `.ts` imports, erasable TS only): args `--band <b> --count <n> --seed <s> [--max-attempts <n>] [--out <dir>]`. Writes candidates to `generated/<band>/<id>.json` under the repo root (gitignored) and prints a report: attempts, accepted, rejection counts by reason, tier distribution, timing. Enforce max attempts and a per-attempt search budget.
- **Performance:** document attempts per second per band; generating 20 accepted intermediate puzzles should take minutes, not hours. If the solver's search is the bottleneck, report it (change request), don't fork the solver.

## Tests (Vitest)
- PRNG determinism and distribution sanity.
- Same seed ⇒ identical candidates (golden test of fingerprints for a small run).
- Every accepted puzzle independently passes `parsePuzzleDefinition`, `search` → unique, `deduce` → solved, and its claimed required tier is accurate (not solvable at `tier − 1`).
- Rejection reasons are counted correctly on a forced-failure configuration.
- Symmetry fingerprint equal for rotated/reflected boards.

## Out of scope
Content curation (director), editor UI, game UI.
