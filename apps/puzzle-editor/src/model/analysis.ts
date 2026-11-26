import type { PuzzleDefinition } from '@ww/puzzle-core';

/**
 * Seam for the follow-up solver integration (solution count, deduction trace). The editor depends
 * only on this interface; an adapter over `@ww/puzzle-solver` is supplied once lane B publishes it.
 */
export interface PuzzleAnalysis {
  readonly solutionCount: 'zero' | 'one' | 'multiple' | 'unknown';
  readonly notes: readonly string[];
}

export type PuzzleAnalyzer = (definition: PuzzleDefinition) => PuzzleAnalysis;
