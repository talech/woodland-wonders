/**
 * Public solver types (M0-REVIEW §6.4, ADR-0006). Prose-free: explanations are localizable keys + params.
 */
import type { CellIndex, CellMark, ConstraintId, SpeciesId, Violation } from '@ww/puzzle-core';

/** A candidate value of a grass cell. */
export type Value = 'empty' | SpeciesId;

/**
 * Bitset over a puzzle's values: bit 0 = `empty`, bit i+1 = `puzzle.species[i]` (canonical ruleset order).
 * Habitat cells always hold `0` and are never part of reasoning.
 */
export type ValueSet = number;

/** Candidate set per cell, indexed by `CellIndex`. */
export type Domains = readonly ValueSet[];

export type StrategyId =
  | 'no-habitat'
  | 'neighbour-exclusion'
  | 'line-saturated'
  | 'line-forced'
  | 'species-exhausted'
  | 'species-forced'
  | 'species-group'
  | 'line-pointing'
  | 'line-capacity'
  | 'species-capacity';

/** 1 = single-constraint counting, 2 = two interacting constraints, 3 = capacity/packing arguments. */
export type Tier = 1 | 2 | 3 | 4;

export interface Elimination {
  readonly cell: CellIndex;
  /** Values removed from the cell's candidates, in canonical value order. Never empty. */
  readonly values: readonly Value[];
}

export interface Premises {
  /** Core constraint ids the deduction relies on. */
  readonly constraints: readonly ConstraintId[];
  /**
   * Exactly the cells whose *current candidates* the deduction relies on. Cells that are merely affected
   * appear in `eliminations`. Used for dependency/chain analysis and minimal hint replay.
   */
  readonly cells: readonly CellIndex[];
}

export interface Explanation {
  /** Localizable template key, e.g. `solver.line-saturated`. */
  readonly key: string;
  readonly params: Readonly<Record<string, number | string>>;
}

export interface DeductionStep {
  readonly strategy: StrategyId;
  readonly tier: Tier;
  readonly eliminations: readonly Elimination[];
  readonly premises: Premises;
  readonly explanation: Explanation;
}

/**
 * - `marks`: the player's marks already break a rule locally (core `evaluateBoard` partial mode).
 * - `deduction`: marks look locally fine, but sound deduction proves no completion exists.
 */
export type ContradictionOrigin = 'marks' | 'deduction';

export type DeductionResult =
  | {
      readonly kind: 'solved' | 'stuck';
      readonly steps: readonly DeductionStep[];
      readonly domains: Domains;
    }
  | {
      readonly kind: 'contradiction';
      readonly origin: ContradictionOrigin;
      readonly steps: readonly DeductionStep[];
      /** The primary conflict. */
      readonly conflict: Violation;
      /** All conflicts found at the point of failure (≥1; first equals `conflict`). */
      readonly violations: readonly Violation[];
      /** What the conflict relies on (same semantics as step premises). */
      readonly premises: Premises;
    };

export interface DeduceOptions {
  /** Only use strategies up to this tier (default: all). */
  readonly maxTier?: Tier;
}

export interface Conclusion {
  readonly cell: CellIndex;
  /** The value the cell is now proven to hold; differs from the player's current mark. */
  readonly value: Value;
}

export type Hint =
  | { readonly kind: 'solved' }
  | {
      readonly kind: 'deduction';
      /** Minimal replayable subsequence of the canonical trace that proves `conclusion`, in order. */
      readonly steps: readonly DeductionStep[];
      readonly conclusion: Conclusion;
    }
  | {
      readonly kind: 'contradiction';
      readonly origin: ContradictionOrigin;
      readonly conflict: Violation;
      readonly violations: readonly Violation[];
      /** Minimal subsequence of steps that exposes the conflict (empty for `origin: 'marks'`). */
      readonly steps: readonly DeductionStep[];
    }
  /** No supported strategy reaches a new player-visible conclusion. Never filled in by guessing. */
  | { readonly kind: 'stuck' };

export interface DifficultyMetrics {
  readonly stepCount: number;
  /** Highest tier used; 0 when there are no steps. */
  readonly maxTier: number;
  readonly strategyCounts: Readonly<Partial<Record<StrategyId, number>>>;
  readonly tierCounts: Readonly<Record<Tier, number>>;
  /** Longest chain of steps where each depends (via premises) on an earlier one; 0 with no steps. */
  readonly longestChain: number;
}

export type SearchResult =
  | { readonly kind: 'none'; readonly nodes: number }
  | { readonly kind: 'unique'; readonly solution: readonly CellMark[]; readonly nodes: number }
  | {
      readonly kind: 'multiple';
      readonly solutions: readonly [readonly CellMark[], readonly CellMark[]];
      readonly nodes: number;
    }
  | { readonly kind: 'unknown'; readonly reason: 'budget'; readonly nodes: number };

export interface SearchOptions {
  /** Maximum search-tree nodes (root included). Exceeding it yields `unknown`. */
  readonly nodeBudget: number;
  /** Respect these player marks (animals fixed, `empty` fixed). Default: blank board. */
  readonly marks?: readonly CellMark[];
}
