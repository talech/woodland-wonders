/** @ww/puzzle-generator — seeded offline generation, filtering, export. Dev/offline only (ADR-0004). */
export { gate, MAX_SOLVER_TIER, type PuzzleMetrics, speciesOverlap, substantiveChain } from './analyze.ts';
export {
  type Acceptance,
  BAND_IDS,
  BANDS,
  type BandId,
  type BandRejection,
  type BandSpec,
  bandRejection,
  type DeepAlternative,
  isBandId,
  isLineTrivial,
} from './bands.ts';
export { canonicalForm, fingerprint, layoutSimilarity } from './fingerprint.ts';
export {
  type AttemptResult,
  attemptSeed,
  bandSpec,
  GENERATOR_VERSION,
  type GeneratedPuzzle,
  type GenerateOptions,
  type GenerationReport,
  type GenerationResult,
  generate,
  REJECTION_REASONS,
  type RejectionReason,
  runAttempt,
  toJson,
} from './generate.ts';
export { createLayout, type Layout, type LayoutParams } from './layout.ts';
export { createRng, hash128, type Rng, shortHash } from './prng.ts';
