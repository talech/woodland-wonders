/**
 * Shared exact-count reasoning for a set of cells that must contain exactly `target` values from `mask`
 * (rows/columns: any animal; species populations: one species; species groups: a union of species).
 *
 * Classification under the current domains:
 * - definitely counted: `D ⊆ mask` (and D ≠ ∅)
 * - possibly counted:   `D ∩ mask ≠ ∅`
 * - never counted:      `D ∩ mask = ∅`
 *
 * Soundness: in every solution consistent with the domains, counted cells ⊇ definite and ⊆ possible.
 * - saturated (|definite| = target): every other cell is uncounted → remove `mask`. Relies on: definite cells.
 * - forced (|possible| = target): every possible cell is counted → remove `~mask`. Relies on: never cells.
 * - |definite| > target or |possible| < target: no solution (conflict).
 */
import type { CellIndex, ConstraintId, Violation } from '@ww/puzzle-core';
import type { Explanation, ValueSet } from '../types.ts';
import { type Finding, makeStep, type Strategy, type StrategyContext } from './strategy.ts';

export interface CountSpec {
  /** Violation id for conflicts. */
  readonly id: ConstraintId;
  /** Premise constraint ids. */
  readonly constraints: readonly ConstraintId[];
  readonly cells: readonly CellIndex[];
  readonly target: number;
  readonly mask: ValueSet;
}

export interface CountAnalysis {
  readonly definite: readonly CellIndex[];
  readonly possible: readonly CellIndex[];
  readonly never: readonly CellIndex[];
}

export function analyzeCount(
  ctx: StrategyContext,
  cells: readonly CellIndex[],
  mask: ValueSet,
): CountAnalysis {
  const definite: CellIndex[] = [];
  const possible: CellIndex[] = [];
  const never: CellIndex[] = [];
  for (const cell of cells) {
    const d = ctx.domains[cell] ?? 0;
    if ((d & mask) === 0) never.push(cell);
    else {
      possible.push(cell);
      if ((d & ~mask) === 0) definite.push(cell);
    }
  }
  return { definite, possible, never };
}

function countViolation(
  spec: CountSpec,
  a: CountAnalysis,
  kind: 'count-over' | 'count-unreachable',
): Violation {
  return {
    constraintId: spec.id,
    kind,
    cells: spec.cells,
    data: { target: spec.target, placed: a.definite.length, open: a.possible.length - a.definite.length },
  };
}

/** Saturation: yields a conflict if over target, a step if exactly at target, else nothing. */
export function saturate(
  ctx: StrategyContext,
  strategy: Strategy,
  spec: CountSpec,
  explanation: Explanation,
): Finding | null {
  const a = analyzeCount(ctx, spec.cells, spec.mask);
  const premises = { constraints: spec.constraints, cells: a.definite };
  if (a.definite.length > spec.target)
    return { kind: 'conflict', conflict: { violation: countViolation(spec, a, 'count-over'), premises } };
  if (a.definite.length !== spec.target) return null;
  const definite = new Set(a.definite);
  const removals = a.possible.filter((c) => !definite.has(c)).map((c) => [c, spec.mask] as const);
  return makeStep(ctx, strategy, removals, premises, {
    key: explanation.key,
    params: { ...explanation.params, target: spec.target },
  });
}

/** Forcing: yields a conflict if the target is unreachable, a step if exactly reachable, else nothing. */
export function force(
  ctx: StrategyContext,
  strategy: Strategy,
  spec: CountSpec,
  explanation: Explanation,
): Finding | null {
  const a = analyzeCount(ctx, spec.cells, spec.mask);
  const premises = { constraints: spec.constraints, cells: a.never };
  if (a.possible.length < spec.target)
    return {
      kind: 'conflict',
      conflict: { violation: countViolation(spec, a, 'count-unreachable'), premises },
    };
  if (a.possible.length !== spec.target) return null;
  const removals = a.possible.map((c) => [c, ~spec.mask & ctx.model.fullMask] as const);
  return makeStep(ctx, strategy, removals, premises, {
    key: explanation.key,
    params: { ...explanation.params, target: spec.target },
  });
}
