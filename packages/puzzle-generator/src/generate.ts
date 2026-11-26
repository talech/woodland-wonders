/**
 * Seeded generation pipeline (GDD §11 steps 1–8). Deterministic: same seed + options + GENERATOR_VERSION ⇒
 * identical attempts, rejections and output. No clock, no ambient randomness.
 */
import { type PuzzleDefinition, type Ruleset, type SpeciesId, WOODLAND_V1 } from '@ww/puzzle-core';
import type { StrategyId, Tier } from '@ww/puzzle-solver';
import { gate, type PuzzleMetrics } from './analyze.ts';
import { BANDS, type BandId, type BandRejection, type BandSpec, bandRejection } from './bands.ts';
import { canonicalForm, fingerprint, layoutSimilarity } from './fingerprint.ts';
import { createLayout } from './layout.ts';
import { createRng } from './prng.ts';

export const GENERATOR_VERSION = '0.1.0';

export type RejectionReason =
  | 'layout-failed'
  | 'invalid'
  | 'none'
  | 'multiple'
  | 'unknown-budget'
  | 'requires-guessing'
  | BandRejection
  | 'duplicate'
  | 'too-similar';

export const REJECTION_REASONS: readonly RejectionReason[] = [
  'layout-failed',
  'invalid',
  'none',
  'multiple',
  'unknown-budget',
  'requires-guessing',
  'above-band',
  'below-band',
  'too-many-steps',
  'low-overlap',
  'line-trivial',
  'duplicate',
  'too-similar',
];

export interface GeneratedPuzzle {
  readonly definition: PuzzleDefinition;
  readonly fingerprint: string;
  readonly metrics: PuzzleMetrics;
}

export type AttemptResult =
  | { readonly kind: 'accepted'; readonly puzzle: GeneratedPuzzle }
  | { readonly kind: 'rejected'; readonly reason: RejectionReason; readonly requiredTier?: Tier };

export interface GenerateOptions {
  readonly band: BandId;
  /** Stop after this many accepted puzzles. */
  readonly count: number;
  readonly seed: string;
  /** Hard cap on attempts. */
  readonly maxAttempts: number;
  /** Band parameter overrides (tuning, tests). */
  readonly overrides?: Partial<Omit<BandSpec, 'id'>>;
  /** Reject a candidate whose habitat layout similarity to an accepted one is ≥ this (default: off). */
  readonly maxSimilarity?: number;
  readonly ruleset?: Ruleset;
  readonly onAttempt?: (index: number, result: AttemptResult) => void;
}

export interface GenerationReport {
  readonly generatorVersion: string;
  readonly band: BandId;
  readonly seed: string;
  readonly attempts: number;
  readonly accepted: number;
  /** Count per reason; every reason is present (0 if unused). */
  readonly rejections: Readonly<Record<RejectionReason, number>>;
  /** Required tier of accepted puzzles. */
  readonly acceptedTiers: Readonly<Record<string, number>>;
  /** Required tier of every candidate that passed the uniqueness and deduction gates. */
  readonly gatedTiers: Readonly<Record<string, number>>;
  readonly searchNodes: number;
}

export interface GenerationResult {
  readonly puzzles: readonly GeneratedPuzzle[];
  readonly report: GenerationReport;
}

export function bandSpec(band: BandId, overrides: GenerateOptions['overrides'] = {}): BandSpec {
  return { ...BANDS[band], ...overrides, id: band };
}

/** Seed of attempt `index` in a run (recorded as provenance; reproduces the attempt on its own). */
export function attemptSeed(seed: string, band: BandId, index: number): string {
  return `${seed}/${band}/${index}`;
}

const round3 = (x: number) => Math.round(x * 1000) / 1000;

function metricsRecord(m: PuzzleMetrics): Record<string, number> {
  const out: Record<string, number> = {
    requiredTier: m.requiredTier,
    steps: m.difficulty.stepCount,
    substantiveSteps: m.substantiveSteps,
    chain: m.substantiveChain,
    rawChain: m.difficulty.longestChain,
    overlap: round3(m.overlap),
    lineShare: round3(m.lineShare),
    searchNodes: m.searchNodes,
  };
  for (const [id, n] of Object.entries(m.difficulty.strategyCounts) as [StrategyId, number][])
    out[`strategy.${id}`] = n;
  return out;
}

/** One attempt, fully determined by `seed` (an attempt seed) and `spec`. Duplicate checks are run-level. */
export function runAttempt(spec: BandSpec, seed: string, ruleset: Ruleset = WOODLAND_V1): AttemptResult {
  const rng = createRng(seed);
  const size = rng.pick(spec.sizes);
  const k = rng.pick(spec.speciesCounts);
  const ids = ruleset.species.map((s) => s.id);
  const chosen = new Set(rng.shuffle(ids).slice(0, k));
  const species: SpeciesId[] = ids.filter((id) => chosen.has(id));
  const params = {
    band: spec.id,
    rows: size.rows,
    columns: size.columns,
    species: species.join(','),
    habitatDensity: spec.habitatDensity,
    animalDensity: spec.animalDensity,
    nodeBudget: spec.nodeBudget,
  };
  const layout = createLayout(rng, ruleset, {
    ...size,
    species,
    habitatDensity: spec.habitatDensity,
    animalDensity: spec.animalDensity,
  });
  if (!layout.ok) return { kind: 'rejected', reason: 'layout-failed' };

  const draft: PuzzleDefinition = { ...layout.layout.definition, id: 'candidate' };
  const g = gate(draft, spec.nodeBudget);
  if (!g.ok) return { kind: 'rejected', reason: g.reason };
  const rejection = bandRejection(spec.accept, g.metrics);
  if (rejection) return { kind: 'rejected', reason: rejection, requiredTier: g.metrics.requiredTier };

  const fp = fingerprint(draft);
  const definition: PuzzleDefinition = {
    schemaVersion: draft.schemaVersion,
    id: `${spec.id}-${fp}`,
    revision: draft.revision,
    rulesetId: draft.rulesetId,
    rows: draft.rows,
    columns: draft.columns,
    habitats: draft.habitats,
    rowClues: draft.rowClues,
    columnClues: draft.columnClues,
    population: draft.population,
    difficulty: { tier: spec.id, metrics: metricsRecord(g.metrics) },
    provenance: { generatorVersion: GENERATOR_VERSION, seed, params },
  };
  return { kind: 'accepted', puzzle: { definition, fingerprint: fp, metrics: g.metrics } };
}

/** Generate up to `count` accepted puzzles for a band within `maxAttempts` attempts. */
export function generate(options: GenerateOptions): GenerationResult {
  const spec = bandSpec(options.band, options.overrides);
  const ruleset = options.ruleset ?? WOODLAND_V1;
  const rejections = Object.fromEntries(REJECTION_REASONS.map((r) => [r, 0])) as Record<
    RejectionReason,
    number
  >;
  const acceptedTiers: Record<string, number> = {};
  const gatedTiers: Record<string, number> = {};
  const puzzles: GeneratedPuzzle[] = [];
  const seen = new Set<string>();
  let attempts = 0;
  let searchNodes = 0;

  while (puzzles.length < options.count && attempts < options.maxAttempts) {
    const index = attempts++;
    let result = runAttempt(spec, attemptSeed(options.seed, options.band, index), ruleset);
    if (result.kind === 'accepted') {
      const def = result.puzzle.definition;
      const canonical = canonicalForm(def);
      if (seen.has(canonical))
        result = { kind: 'rejected', reason: 'duplicate', requiredTier: result.puzzle.metrics.requiredTier };
      else if (
        options.maxSimilarity !== undefined &&
        puzzles.some((p) => layoutSimilarity(p.definition, def) >= (options.maxSimilarity ?? 1))
      )
        result = {
          kind: 'rejected',
          reason: 'too-similar',
          requiredTier: result.puzzle.metrics.requiredTier,
        };
      else seen.add(canonical);
    }
    const tier = result.kind === 'accepted' ? result.puzzle.metrics.requiredTier : result.requiredTier;
    if (tier !== undefined) gatedTiers[`tier${tier}`] = (gatedTiers[`tier${tier}`] ?? 0) + 1;
    if (result.kind === 'accepted') {
      puzzles.push(result.puzzle);
      searchNodes += result.puzzle.metrics.searchNodes;
      const key = `tier${result.puzzle.metrics.requiredTier}`;
      acceptedTiers[key] = (acceptedTiers[key] ?? 0) + 1;
    } else rejections[result.reason] += 1;
    options.onAttempt?.(index, result);
  }

  return {
    puzzles,
    report: {
      generatorVersion: GENERATOR_VERSION,
      band: options.band,
      seed: options.seed,
      attempts,
      accepted: puzzles.length,
      rejections,
      acceptedTiers,
      gatedTiers,
      searchNodes,
    },
  };
}

/** Stable JSON for a generated definition (byte-identical across runs). */
export function toJson(definition: PuzzleDefinition): string {
  return `${JSON.stringify(definition, null, 2)}\n`;
}
