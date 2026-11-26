/**
 * Constraint & evaluation contracts. FROZEN — changes require an ADR.
 */
import type { CellMark } from './board.ts';
import type { CellIndex, HabitatId, PuzzleDefinition, Ruleset, SpeciesId } from './definition.ts';

/** Stable identifier, e.g. `row:3`, `column:0`, `species:fox`, `habitat:fox`, `exclusion:fox`. */
export type ConstraintId = string;

/** Built-in kinds; further kinds may be registered (e.g. local clues). */
export type ConstraintKind =
  | 'line-count'
  | 'species-count'
  | 'habitat-adjacency'
  | 'species-exclusion'
  | (string & {});

/**
 * - `partial`: unmarked cells are undecided.
 * - `complete`: unmarked cells are treated as empty (completion check, ADR-0008 P2).
 */
export type EvaluationMode = 'partial' | 'complete';

export type ViolationKind =
  | 'count-over'
  | 'count-under'
  | 'count-unreachable'
  | 'missing-habitat'
  | 'same-species-touching'
  | (string & {});

/** Structured, prose-free description of a broken rule. Presentation layers localize it. */
export interface Violation {
  readonly constraintId: ConstraintId;
  readonly kind: ViolationKind;
  readonly cells: readonly CellIndex[];
  readonly data: Readonly<Record<string, number | string>>;
}

export type ConstraintStatus =
  | { readonly status: 'satisfied' }
  | { readonly status: 'pending' }
  | { readonly status: 'violated'; readonly violations: readonly Violation[] };

/** Compiled, immutable puzzle with derived geometry and constraints. Build via `createPuzzle`. */
export interface Puzzle {
  readonly definition: PuzzleDefinition;
  readonly ruleset: Ruleset;
  readonly rows: number;
  readonly columns: number;
  readonly cellCount: number;
  /** Habitat at each cell, or null for grass. */
  readonly habitatAt: readonly (HabitatId | null)[];
  /** Species present in this puzzle, in canonical ruleset order. */
  readonly species: readonly SpeciesId[];
  /** Orthogonal (4) neighbours per cell — habitat adjacency. */
  readonly orthogonal: readonly (readonly CellIndex[])[];
  /** King (8) neighbours per cell — same-species exclusion. */
  readonly king: readonly (readonly CellIndex[])[];
  readonly constraints: readonly Constraint[];
}

export interface ConstraintContext {
  readonly puzzle: Puzzle;
  readonly marks: readonly CellMark[];
  readonly mode: EvaluationMode;
}

export interface Constraint {
  readonly id: ConstraintId;
  readonly kind: ConstraintKind;
  /** Cells whose marks can affect this constraint. */
  readonly scope: readonly CellIndex[];
  /** Species this constraint concerns, if any. */
  readonly species?: SpeciesId;
  evaluate(ctx: ConstraintContext): ConstraintStatus;
}

/** Count status for a row, column or species population. */
export interface CountStatus {
  readonly target: number;
  readonly placed: number;
  /** Unmarked cells that could still receive an animal (0 in complete mode). */
  readonly open: number;
  readonly status: 'satisfied' | 'pending' | 'violated';
}

export interface BoardEvaluation {
  readonly mode: EvaluationMode;
  readonly violations: readonly Violation[];
  readonly rows: readonly CountStatus[];
  readonly columns: readonly CountStatus[];
  readonly species: Readonly<Record<SpeciesId, CountStatus>>;
  /** True iff the board satisfies every constraint in complete mode. */
  readonly isSolved: boolean;
}
