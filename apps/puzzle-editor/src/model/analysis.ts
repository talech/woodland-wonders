import type { CellIndex, PuzzleDefinition, SpeciesId } from '@ww/puzzle-core';
import type { DifficultyMetrics, StrategyId, Tier, Value } from '@ww/puzzle-solver';

/** One deduction step prepared for display and grid highlighting. */
export interface TraceStep {
  readonly index: number;
  readonly strategy: StrategyId;
  readonly tier: Tier;
  /** Readable rendering of the explanation key and params. */
  readonly explanation: string;
  /** Readable per-cell eliminations, e.g. `(1,2): empty, fox`. */
  readonly eliminations: readonly string[];
  /** Cells whose candidates the step relied on. */
  readonly premiseCells: readonly CellIndex[];
  /** Cells that lost candidates in this step. */
  readonly affectedCells: readonly CellIndex[];
  /** Candidates per cell after this step (habitat cells are empty lists). */
  readonly domainsAfter: readonly (readonly Value[])[];
}

export type SolutionCount = 'zero' | 'one' | 'multiple' | 'unknown';

export interface PuzzleAnalysis {
  readonly solutionCount: SolutionCount;
  readonly nodes: number;
  /** One solution when unique, two when multiple (animals per cell, `null` for none). */
  readonly solutions: readonly (readonly (SpeciesId | null)[])[];
  /** Cells where the two solutions differ (multiple only). */
  readonly differingCells: readonly CellIndex[];
  readonly deduction: 'solved' | 'stuck' | 'contradiction';
  readonly trace: readonly TraceStep[];
  readonly metrics: DifficultyMetrics;
  /** Lowest `maxTier` that solves the blank board by deduction alone, or null if none does. */
  readonly requiredTier: Tier | null;
  readonly verdict: { readonly publishable: boolean; readonly reason: string };
}

export type AnalysisResult =
  | { readonly ok: true; readonly analysis: PuzzleAnalysis }
  | { readonly ok: false; readonly issues: readonly string[] };

export interface AnalyzeOptions {
  /** Search node budget; exceeding it reports `unknown`. */
  readonly nodeBudget?: number;
}

export type PuzzleAnalyzer = (definition: PuzzleDefinition, options?: AnalyzeOptions) => AnalysisResult;
