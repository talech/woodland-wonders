# Content curation — catalog v1 (40 puzzles)

- Date: 2026-11-26 · Generator `0.1.0` · Seed `content-v1` · Selection: `scripts/curate.py` (deterministic)
- Reproduce:
  1. For each band, run `node packages/puzzle-generator/scripts/generate.ts --band <band> --count <n> --seed content-v1 --max-attempts 50000 --max-similarity 0.85` with n = tutorial 30, beginner 40, easy 40, intermediate 120, advanced 50.
  2. Run `python3 scripts/curate.py`.
  3. Reset `puzzles.json` to `[]`.
  4. Run `pnpm content:add` on each file in `generated/curated/`.
- Every shipped puzzle passes `pnpm content:validate`: a unique solution (search), a deduction-only solve from the blank board, replay equal to the search solution, and scalar-only provenance (no answer keys).

## Pool yields (seed `content-v1`)
"Gated" = unique solution and deduction-solvable. Band filters are in `packages/puzzle-generator/src/bands.ts`.

| Band | Attempts | Accepted (requested) | Yield | Tiers among gated candidates |
|---|---|---|---|---|
| tutorial | 34 | 30 | 88% | t1 34 |
| beginner | 47 | 40 | 85% | t1 40 |
| easy | 285 | 40 | 14% | t1 202 · t2 5 · t3 11 |
| intermediate | 2,422 | 120 | 5% | t1 1,310 · t2 43 · t3 121 |
| advanced | 691 | 50 | 7% | t1 342 · t2 22 · t3 43 |

**Finding:** about 90% of valid puzzles need only tier-1 reasoning, which confirms the M0 shallowness risk. Tier 2 is rarer than tier 3 on 6×6 boards. Depth therefore comes from selection, never from relaxed criteria.

## Selection criteria (scripts/curate.py)
- **All bands:** populations balanced at max ≤ 3× min. Order within a band follows required tier, then substantive steps (excluding trivial `no-habitat` eliminations), then chain depth. Ids are renamed to `<band>-NN` in play order; the generator id is kept in `provenance.params.generatedId`.
- **Tutorial (4):** single species, introduced in GDD order (fox, fox, mouse, rabbit), with the fewest substantive steps.
- **Beginner (8):** 3 single-species and 5 two-species puzzles, spread evenly across substantive-step counts.
- **Easy (8):** the 20 highest species-overlap candidates, spread across substantive steps.
- **Intermediate (12):** 8 genuine tier-2 puzzles (spread across chain depth) plus the 4 tier-1 puzzles with the longest chains (chain 13).
- **Advanced (8):** tier 3 only, round-robin across board sizes (3× 6×6, 3× 7×7, 2× 8×8) by longest chain.

## Resulting catalog
| Band | Count | Boards | Required tier | Substantive steps | Chain |
|---|---|---|---|---|---|
| tutorial | 4 | 4×4 | 1 | 3–4 | 1–2 |
| beginner | 8 | 5×5 | 1 | 3–11 | 1–7 |
| easy | 8 | 5×5 | 1 | 8–14 | 4–8 |
| intermediate | 12 | 6×6 | 4× t1, 8× t2 | 13–18 | 7–15 |
| advanced | 8 | 6×6–8×8 | 3 | 16–25 | 8–20 |

## Caveats
- Difficulty is **provisional** until playtested (M4). Tutorial and beginner are only lightly filtered.
- Human review so far: the director inspected traces in the editor and play-throughs via Playwright. Nobody has done a fun or variety assessment yet; that needs human playtesters.
- The earlier seed puzzles `meadow-001…004` were retired before any saves existed (persistence ships in M3), so no migration is needed.
