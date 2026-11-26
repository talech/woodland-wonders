/**
 * Difficulty bands (ADR-0009 P7, GDD §5). PROVISIONAL until playtested; every number is configurable via
 * `overrides`. Classification uses the required strategy tier first, then size/shape.
 *
 * | Band         | Board   | Species | Accepts                                                              |
 * |--------------|---------|---------|----------------------------------------------------------------------|
 * | tutorial     | 4×4     | 1       | tier 1, ≤ 6 substantive steps                                          |
 * | beginner     | 5×5     | 1–2     | tier 1                                                               |
 * | easy         | 5×5     | 2       | tier 1, overlap ≥ 0.12, not line-trivial                             |
 * | intermediate | 6×6     | 3       | tier 2 · or tier 1 with chain ≥ 10, overlap ≥ 0.2, not line-trivial  |
 * | advanced     | 6×6–8×8 | 3       | tier 3 · or tier 2 with chain ≥ 13                                   |
 *
 * Definitions:
 * - substantive steps: deduction steps excluding `no-habitat` eliminations (visible at a glance; setup).
 * - chain: substantive chain depth — longest premise-dependency chain counting substantive steps only.
 * - overlap: share of grass cells whose initial domain allows ≥ 2 species.
 * - line-trivial: the tier-1 trace never needs species-population counting (`species-exhausted`,
 *   `species-forced`). Because the solver applies `no-habitat`, `neighbour-exclusion` and the two line
 *   strategies before population strategies and these rules are monotone, this holds exactly when line
 *   counting plus the local habitat/exclusion rules alone solve the board.
 */
import type { DifficultyTier } from '@ww/puzzle-core';
import type { Tier } from '@ww/puzzle-solver';
import type { PuzzleMetrics } from './analyze.ts';

export type BandId = DifficultyTier;

export interface DeepAlternative {
  /** A puzzle requiring only this tier is accepted when its chain is long enough. */
  readonly tier: Tier;
  readonly minChain: number;
  readonly minOverlap?: number;
  readonly rejectLineTrivial?: boolean;
}

export interface Acceptance {
  /** Required tiers accepted outright (subject to the filters below). */
  readonly tiers: readonly Tier[];
  readonly maxSubstantiveSteps?: number;
  readonly minOverlap?: number;
  readonly rejectLineTrivial?: boolean;
  readonly deepAlternative?: DeepAlternative;
}

export interface BandSpec {
  readonly id: BandId;
  readonly sizes: readonly { readonly rows: number; readonly columns: number }[];
  /** Number of species; one is drawn per attempt. */
  readonly speciesCounts: readonly number[];
  readonly habitatDensity: number;
  readonly animalDensity: number;
  /** Per-attempt search node budget. */
  readonly nodeBudget: number;
  readonly accept: Acceptance;
}

const NODE_BUDGET = 50_000;

export const BANDS: Readonly<Record<BandId, BandSpec>> = {
  tutorial: {
    id: 'tutorial',
    sizes: [{ rows: 4, columns: 4 }],
    speciesCounts: [1],
    habitatDensity: 0.2,
    animalDensity: 0.35,
    nodeBudget: NODE_BUDGET,
    accept: { tiers: [1], maxSubstantiveSteps: 6 },
  },
  beginner: {
    id: 'beginner',
    sizes: [{ rows: 5, columns: 5 }],
    speciesCounts: [1, 2],
    habitatDensity: 0.2,
    animalDensity: 0.35,
    nodeBudget: NODE_BUDGET,
    accept: { tiers: [1] },
  },
  easy: {
    id: 'easy',
    sizes: [{ rows: 5, columns: 5 }],
    speciesCounts: [2],
    habitatDensity: 0.3,
    animalDensity: 0.4,
    nodeBudget: NODE_BUDGET,
    accept: { tiers: [1], minOverlap: 0.12, rejectLineTrivial: true },
  },
  intermediate: {
    id: 'intermediate',
    sizes: [{ rows: 6, columns: 6 }],
    speciesCounts: [3],
    habitatDensity: 0.3,
    animalDensity: 0.45,
    nodeBudget: NODE_BUDGET,
    accept: {
      tiers: [2],
      deepAlternative: { tier: 1, minChain: 10, minOverlap: 0.2, rejectLineTrivial: true },
    },
  },
  advanced: {
    id: 'advanced',
    sizes: [
      { rows: 6, columns: 6 },
      { rows: 7, columns: 7 },
      { rows: 8, columns: 8 },
    ],
    speciesCounts: [3],
    habitatDensity: 0.28,
    animalDensity: 0.45,
    nodeBudget: NODE_BUDGET,
    accept: { tiers: [3], deepAlternative: { tier: 2, minChain: 13 } },
  },
};

export const BAND_IDS: readonly BandId[] = ['tutorial', 'beginner', 'easy', 'intermediate', 'advanced'];

export function isBandId(value: string): value is BandId {
  return (BAND_IDS as readonly string[]).includes(value);
}

export type BandRejection = 'above-band' | 'below-band' | 'too-many-steps' | 'low-overlap' | 'line-trivial';

export function isLineTrivial(m: PuzzleMetrics): boolean {
  const c = m.difficulty.strategyCounts;
  return m.requiredTier === 1 && !c['species-exhausted'] && !c['species-forced'];
}

/** Band filter (pipeline step 7). Returns null when accepted, else the first failing reason. */
export function bandRejection(accept: Acceptance, m: PuzzleMetrics): BandRejection | null {
  const alt = accept.deepAlternative;
  const top = Math.max(...accept.tiers, alt?.tier ?? 0);
  if (m.requiredTier > top) return 'above-band';
  if (accept.tiers.includes(m.requiredTier)) {
    if (accept.maxSubstantiveSteps !== undefined && m.substantiveSteps > accept.maxSubstantiveSteps)
      return 'too-many-steps';
    if (accept.minOverlap !== undefined && m.overlap < accept.minOverlap) return 'low-overlap';
    if (accept.rejectLineTrivial && isLineTrivial(m)) return 'line-trivial';
    return null;
  }
  if (alt && alt.tier === m.requiredTier) {
    if (m.substantiveChain < alt.minChain) return 'below-band';
    if (alt.minOverlap !== undefined && m.overlap < alt.minOverlap) return 'low-overlap';
    if (alt.rejectLineTrivial && isLineTrivial(m)) return 'line-trivial';
    return null;
  }
  return 'below-band';
}
