/**
 * @ww/puzzle-solver — human-style deduction with structured proof steps, hints and difficulty metrics.
 * Gameplay-safe (no search). Exhaustive search lives in `@ww/puzzle-solver/search` (ADR-0004).
 */
import type { CellMark, Puzzle } from '@ww/puzzle-core';
import { runDeduction, strategiesUpTo } from './engine.ts';
import { compileModel } from './model.ts';
import { STRATEGY_ORDER } from './strategies/index.ts';
import type { DeduceOptions, DeductionResult, StrategyId, Tier } from './types.ts';

export const SOLVER_VERSION = '0.1.0';

export { analyzeDifficulty } from './difficulty.ts';
export { createDomains, domainValues } from './domains.ts';
export { nextHint } from './hint.ts';
export type * from './types.ts';

export interface StrategyInfo {
  readonly id: StrategyId;
  readonly tier: Tier;
}

/** Strategies in canonical application order. */
export const STRATEGIES: readonly StrategyInfo[] = STRATEGY_ORDER.map(({ id, tier }) => ({ id, tier }));

/**
 * Deduce from the player's marks using only sound, human-style strategies (no guessing or search).
 * - `solved`: every grass cell determined and confirmed by core `isSolved`.
 * - `stuck`: no strategy makes progress; `domains` holds the remaining candidates.
 * - `contradiction`: the marks break a rule (`origin: 'marks'`, judged by core) or deduction proves that
 *   no completion exists (`origin: 'deduction'`).
 * Deterministic: identical inputs give identical steps.
 */
export function deduce(
  puzzle: Puzzle,
  marks: readonly CellMark[],
  options: DeduceOptions = {},
): DeductionResult {
  return runDeduction(compileModel(puzzle), marks, strategiesUpTo(options.maxTier ?? 4));
}
