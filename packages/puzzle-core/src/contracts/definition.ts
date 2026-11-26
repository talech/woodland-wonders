/**
 * Puzzle definition & ruleset contracts. FROZEN — changes require an ADR (see docs/adr/0005-core-contracts.md).
 *
 * Coordinates: rows × columns grid, 0-based (row, col), origin top-left.
 * CellIndex = row * columns + col.
 */

export type PuzzleId = string;
export type SpeciesId = string;
export type HabitatId = string;
export type RulesetId = string;
/** Row-major cell index: `row * columns + col`. */
export type CellIndex = number;

export const SCHEMA_VERSION = 1 as const;
export const MIN_DIMENSION = 3;
export const MAX_DIMENSION = 10;

/** Values with special meaning in player marks; species IDs may never use them. */
export const RESERVED_IDS: readonly string[] = ['unmarked', 'empty'];

export interface HabitatPlacement {
  readonly row: number;
  readonly col: number;
  readonly habitat: HabitatId;
}

export type DifficultyTier = 'tutorial' | 'beginner' | 'easy' | 'intermediate' | 'advanced';

/** Informational only; never used to evaluate rules. Metrics are produced by the solver. */
export interface DifficultyMetadata {
  readonly tier: DifficultyTier;
  readonly metrics?: Readonly<Record<string, number>>;
}

export interface Provenance {
  readonly generatorVersion: string;
  readonly seed: string;
  readonly params?: Readonly<Record<string, unknown>>;
}

/** Immutable, serializable puzzle definition (schema v1). Contains no solution. */
export interface PuzzleDefinition {
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly id: PuzzleId;
  /** Bump on any gameplay-affecting change; invalidates in-progress boards for this puzzle. */
  readonly revision: number;
  readonly rulesetId: RulesetId;
  readonly rows: number;
  readonly columns: number;
  readonly habitats: readonly HabitatPlacement[];
  /** Exact number of animals (any species) per row. */
  readonly rowClues: readonly number[];
  /** Exact number of animals (any species) per column. */
  readonly columnClues: readonly number[];
  /** Exact number of animals per species. Every listed species has count ≥ 1. */
  readonly population: Readonly<Record<SpeciesId, number>>;
  readonly difficulty?: DifficultyMetadata;
  readonly provenance?: Provenance;
}

/** A rule attached to a species. `kind` selects a registered constraint factory. */
export interface SpeciesRuleRef {
  readonly kind: string;
}

export interface SpeciesRule {
  readonly id: SpeciesId;
  /** Habitat types satisfying this species' adjacency requirement. */
  readonly habitats: readonly HabitatId[];
  readonly rules: readonly SpeciesRuleRef[];
}

/** Canonical rule data shared by engine, solver and generator (ADR-0009 P8). */
export interface Ruleset {
  readonly id: RulesetId;
  readonly habitats: readonly HabitatId[];
  /** Order is canonical: solver value indices follow it. */
  readonly species: readonly SpeciesRule[];
}
