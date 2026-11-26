import { lineCapacity } from './line-capacity.ts';
import { lineForced } from './line-forced.ts';
import { linePointing } from './line-pointing.ts';
import { lineSaturated } from './line-saturated.ts';
import { neighbourExclusion } from './neighbour-exclusion.ts';
import { noHabitat } from './no-habitat.ts';
import { speciesCapacity } from './species-capacity.ts';
import { speciesExhausted } from './species-exhausted.ts';
import { speciesForced } from './species-forced.ts';
import { speciesGroup } from './species-group.ts';
import type { Strategy } from './strategy.ts';

/**
 * Canonical application order: lowest tier first, cheapest first within a tier. The engine applies the first
 * finding of the first strategy that has one, then restarts from the top.
 *
 * | id                  | tier | rule                                                                    |
 * |---------------------|------|-------------------------------------------------------------------------|
 * | no-habitat          | 1    | species needs an orthogonal accepted habitat                            |
 * | neighbour-exclusion | 1    | a determined species leaves its king neighbours                        |
 * | line-saturated      | 1    | row/column already holds its clue in certain animals → rest empty      |
 * | line-forced         | 1    | row/column possible cells = clue → all animals                          |
 * | species-exhausted   | 1    | species population certainly placed → species gone elsewhere           |
 * | species-forced      | 1    | species candidate cells = population → all that species                |
 * | species-group       | 2    | the same counting over a union of ≥2 species (sum of populations)      |
 * | line-pointing       | 2    | a line must contain species S in touching cells → common neighbours ≠ S |
 * | line-capacity       | 3    | touching single-species runs hold ≤ ⌈n/2⌉; tight capacity fixes runs   |
 * | species-capacity    | 3    | 2×2 packing bounds a population; tight packing fixes regions            |
 *
 * "Single candidate" is not a separate step: domains make a cell with one remaining value determined, and
 * the step that removed the last alternative is credited. Its "hidden single" form is `line-forced` /
 * `species-forced`. Every strategy's soundness argument is in its module header; all are checked against a
 * brute-force oracle (test/oracle.test.ts, test/strategy-soundness.test.ts).
 */
export const STRATEGY_ORDER: readonly Strategy[] = [
  noHabitat,
  neighbourExclusion,
  lineSaturated,
  lineForced,
  speciesExhausted,
  speciesForced,
  speciesGroup,
  linePointing,
  lineCapacity,
  speciesCapacity,
];
