import { type CellMark, isSolved, type Puzzle } from '@ww/puzzle-core';
import { closure, dependencyGraph, stepsTouching } from './dependencies.ts';
import { rawDomains } from './domains.ts';
import { applyStep, runDeduction } from './engine.ts';
import { compileModel, singleValue } from './model.ts';
import { STRATEGY_ORDER } from './strategies/index.ts';
import type { DeductionStep, Hint } from './types.ts';

/**
 * Next hint for the player's current marks (ADR-0008 P4). Never compares against a hidden solution.
 *
 * 1. Board already complete (core `isSolved`) → `solved`.
 * 2. Run the canonical deduction from the marks. Contradiction → the conflict plus the minimal
 *    dependency-closed subsequence of steps that exposes it (never a corrective move).
 * 3. Otherwise collect every player-visible conclusion in the trace (a cell whose candidates become a
 *    single value different from its current mark) and return the one with the fewest steps in its
 *    dependency closure (ties: earliest in the trace, then lowest cell). "Shortest" is therefore minimal
 *    with respect to the canonical trace, not a global minimum over all possible proofs.
 * 4. No visible conclusion → `stuck`.
 */
export function nextHint(puzzle: Puzzle, marks: readonly CellMark[]): Hint {
  const model = compileModel(puzzle);
  const raw = rawDomains(model, marks);
  if (raw.invalid.length === 0 && isSolved(puzzle, marks)) return { kind: 'solved' };

  const result = runDeduction(model, marks, STRATEGY_ORDER);
  const graph = dependencyGraph(result.steps);
  const pick = (indices: readonly number[]): DeductionStep[] =>
    indices.flatMap((i) => {
      const s = result.steps[i];
      return s ? [s] : [];
    });

  if (result.kind === 'contradiction') {
    const seeds = stepsTouching(graph, result.premises.cells, result.steps.length);
    return {
      kind: 'contradiction',
      origin: result.origin,
      conflict: result.conflict,
      violations: result.violations,
      steps: result.origin === 'marks' ? [] : pick(closure(graph, seeds)),
    };
  }

  const domains = raw.domains;
  let best: Hint | null = null;
  let bestSize = Number.POSITIVE_INFINITY;
  for (const [k, step] of result.steps.entries()) {
    applyStep(model, domains, step);
    for (const e of step.eliminations) {
      const value = singleValue(model, domains[e.cell] ?? 0);
      if (value === null || value === (marks[e.cell] ?? 'unmarked')) continue;
      const indices = closure(graph, stepsTouching(graph, [e.cell], k + 1));
      if (indices.length < bestSize) {
        bestSize = indices.length;
        best = { kind: 'deduction', steps: pick(indices), conclusion: { cell: e.cell, value } };
      }
    }
  }
  return best ?? { kind: 'stuck' };
}
