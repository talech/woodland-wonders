/** Pipeline steps 4–6: uniqueness gate, minimum required tier, metrics. Uses only public solver APIs. */
import { type CellMark, createPuzzle, type Puzzle, type PuzzleDefinition } from '@ww/puzzle-core';
import {
  analyzeDifficulty,
  createDomains,
  type DeductionStep,
  type DifficultyMetrics,
  deduce,
  domainValues,
  type StrategyId,
  type Tier,
} from '@ww/puzzle-solver';
import { search } from '@ww/puzzle-solver/search';

/** Highest tier the solver implements. */
export const MAX_SOLVER_TIER: Tier = 3;

export interface PuzzleMetrics {
  /** Lowest `maxTier` at which `deduce` solves the blank board. */
  readonly requiredTier: Tier;
  readonly difficulty: DifficultyMetrics;
  /**
   * Substantive steps: deduction steps excluding `no-habitat` eliminations, which are visible at a glance
   * and treated as setup.
   */
  readonly substantiveSteps: number;
  /**
   * Substantive chain depth: longest premise-dependency chain counting only substantive steps
   * (`no-habitat` steps have depth 0). `difficulty.longestChain` is the solver's raw measure.
   */
  readonly substantiveChain: number;
  /** Share of grass cells whose initial domain allows ≥ 2 species. */
  readonly overlap: number;
  /** Share of substantive steps that are pure line counting (`line-saturated` / `line-forced`). */
  readonly lineShare: number;
  readonly searchNodes: number;
}

export type GateResult =
  | { readonly ok: true; readonly puzzle: Puzzle; readonly metrics: PuzzleMetrics }
  | {
      readonly ok: false;
      readonly reason: 'invalid' | 'none' | 'multiple' | 'unknown-budget' | 'requires-guessing';
      readonly searchNodes: number;
    };

export function speciesOverlap(puzzle: Puzzle): number {
  const blank = new Array<CellMark>(puzzle.cellCount).fill('unmarked');
  const domains = createDomains(puzzle, blank);
  let grass = 0;
  let multi = 0;
  puzzle.habitatAt.forEach((h, cell) => {
    if (h != null) return;
    grass++;
    if (domainValues(puzzle, domains[cell] ?? 0).filter((v) => v !== 'empty').length >= 2) multi++;
  });
  return grass === 0 ? 0 : multi / grass;
}

/**
 * Longest dependency chain over substantive steps. Step k depends on an earlier step j iff j eliminated a
 * candidate in one of k's premise cells (the solver's documented premise semantics); `no-habitat` steps
 * contribute depth 0.
 */
export function substantiveChain(steps: readonly DeductionStep[]): number {
  const depthAt = new Map<number, number>(); // cell → deepest step that eliminated there
  let best = 0;
  for (const step of steps) {
    const own = step.strategy === 'no-habitat' ? 0 : 1;
    const before = step.premises.cells.reduce((m, c) => Math.max(m, depthAt.get(c) ?? 0), 0);
    const depth = before + own;
    best = Math.max(best, depth);
    for (const e of step.eliminations) depthAt.set(e.cell, Math.max(depthAt.get(e.cell) ?? 0, depth));
  }
  return best;
}

const LINE_STRATEGIES: readonly StrategyId[] = ['line-saturated', 'line-forced'];

/** Publication gate + metrics: unique via search, then minimum tier via deduce with increasing maxTier. */
export function gate(definition: PuzzleDefinition, nodeBudget: number): GateResult {
  const compiled = createPuzzle(definition);
  if (!compiled.ok) return { ok: false, reason: 'invalid', searchNodes: 0 };
  const puzzle = compiled.value;
  const s = search(puzzle, { nodeBudget });
  if (s.kind === 'none') return { ok: false, reason: 'none', searchNodes: s.nodes };
  if (s.kind === 'multiple') return { ok: false, reason: 'multiple', searchNodes: s.nodes };
  if (s.kind === 'unknown') return { ok: false, reason: 'unknown-budget', searchNodes: s.nodes };

  const blank = new Array<CellMark>(puzzle.cellCount).fill('unmarked');
  for (let tier = 1; tier <= MAX_SOLVER_TIER; tier++) {
    const t = tier as Tier; // 1..MAX_SOLVER_TIER are all valid tiers
    const result = deduce(puzzle, blank, { maxTier: t });
    if (result.kind !== 'solved') continue;
    const difficulty = analyzeDifficulty(result.steps);
    const substantiveSteps = difficulty.stepCount - (difficulty.strategyCounts['no-habitat'] ?? 0);
    const lineSteps = LINE_STRATEGIES.reduce((n, id) => n + (difficulty.strategyCounts[id] ?? 0), 0);
    return {
      ok: true,
      puzzle,
      metrics: {
        requiredTier: t,
        difficulty,
        substantiveSteps,
        substantiveChain: substantiveChain(result.steps),
        overlap: speciesOverlap(puzzle),
        lineShare: substantiveSteps === 0 ? 1 : lineSteps / substantiveSteps,
        searchNodes: s.nodes,
      },
    };
  }
  return { ok: false, reason: 'requires-guessing', searchNodes: s.nodes };
}
