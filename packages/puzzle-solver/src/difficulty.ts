import { dependencyGraph, longestChain } from './dependencies.ts';
import { STRATEGY_ORDER } from './strategies/index.ts';
import type { DeductionStep, DifficultyMetrics, StrategyId, Tier } from './types.ts';

/**
 * Provisional difficulty metrics for a deduction trace (ADR-0009 P7): step count, hardest tier,
 * per-strategy and per-tier counts, and the longest premise-dependency chain.
 */
export function analyzeDifficulty(steps: readonly DeductionStep[]): DifficultyMetrics {
  const tierCounts: Record<Tier, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const counts = new Map<StrategyId, number>();
  let maxTier = 0;
  for (const s of steps) {
    tierCounts[s.tier] += 1;
    counts.set(s.strategy, (counts.get(s.strategy) ?? 0) + 1);
    maxTier = Math.max(maxTier, s.tier);
  }
  const strategyCounts: Partial<Record<StrategyId, number>> = {};
  for (const s of STRATEGY_ORDER) {
    const n = counts.get(s.id);
    if (n !== undefined) strategyCounts[s.id] = n;
  }
  return {
    stepCount: steps.length,
    maxTier,
    strategyCounts,
    tierCounts,
    longestChain: longestChain(dependencyGraph(steps)),
  };
}
