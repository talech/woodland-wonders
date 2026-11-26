import type { CellIndex, Violation } from '@ww/puzzle-core';
import { type SolverModel, valuesOf } from '../model.ts';
import type {
  DeductionStep,
  Domains,
  Elimination,
  Explanation,
  Premises,
  StrategyId,
  Tier,
  ValueSet,
} from '../types.ts';

export interface StrategyContext {
  readonly model: SolverModel;
  readonly domains: Domains;
}

export interface Conflict {
  readonly violation: Violation;
  readonly premises: Premises;
}

export type Finding =
  | { readonly kind: 'step'; readonly step: DeductionStep }
  | { readonly kind: 'conflict'; readonly conflict: Conflict };

/**
 * A deduction strategy. `find` lazily yields, in a deterministic order, steps that remove at least one
 * candidate that is currently present, and conflicts it can prove. Strategies are pure: they never mutate
 * `ctx.domains`.
 */
export interface Strategy {
  readonly id: StrategyId;
  readonly tier: Tier;
  find(ctx: StrategyContext): Iterable<Finding>;
}

/**
 * Build a step from intended removals (cell → mask), keeping only values currently present.
 * Returns null when nothing would change.
 */
export function makeStep(
  ctx: StrategyContext,
  strategy: Strategy,
  removals: ReadonlyMap<CellIndex, ValueSet> | readonly (readonly [CellIndex, ValueSet])[],
  premises: Premises,
  explanation: Explanation,
): Finding | null {
  const eliminations: Elimination[] = [];
  const entries = [...removals].sort((a, b) => a[0] - b[0]);
  for (const [cell, mask] of entries) {
    const effective = (ctx.domains[cell] ?? 0) & mask;
    if (effective !== 0) eliminations.push({ cell, values: valuesOf(ctx.model, effective) });
  }
  if (eliminations.length === 0) return null;
  return {
    kind: 'step',
    step: {
      strategy: strategy.id,
      tier: strategy.tier,
      eliminations,
      premises: { constraints: premises.constraints, cells: [...premises.cells].sort((a, b) => a - b) },
      explanation,
    },
  };
}

export function key(id: StrategyId): string {
  return `solver.${id}`;
}
