/**
 * Step dependency graph. Step k depends on an earlier step j iff j eliminated a candidate from one of k's
 * premise cells. Because premises list exactly the cells whose candidates a step relies on, replaying a
 * dependency-closed subsequence of a trace reproduces every premise cell's candidates exactly, so each
 * replayed step is still justified.
 */
import type { CellIndex } from '@ww/puzzle-core';
import type { DeductionStep } from './types.ts';

export interface DependencyGraph {
  /** For each step, the indices of the earlier steps it depends on (ascending). */
  readonly deps: readonly (readonly number[])[];
  /** For each cell, ascending indices of steps that eliminated a candidate there. */
  readonly touching: ReadonlyMap<CellIndex, readonly number[]>;
}

export function dependencyGraph(steps: readonly DeductionStep[]): DependencyGraph {
  const touching = new Map<CellIndex, number[]>();
  const deps: number[][] = [];
  steps.forEach((step, k) => {
    const d = new Set<number>();
    for (const cell of step.premises.cells) for (const j of touching.get(cell) ?? []) d.add(j);
    deps.push([...d].sort((a, b) => a - b));
    for (const e of step.eliminations) {
      const list = touching.get(e.cell);
      if (list) list.push(k);
      else touching.set(e.cell, [k]);
    }
  });
  return { deps, touching };
}

/** Steps that eliminated at any of `cells` before index `before` (exclusive). */
export function stepsTouching(graph: DependencyGraph, cells: Iterable<CellIndex>, before: number): number[] {
  const out = new Set<number>();
  for (const cell of cells) for (const j of graph.touching.get(cell) ?? []) if (j < before) out.add(j);
  return [...out];
}

/** Ascending indices of `seeds` plus everything they transitively depend on. */
export function closure(graph: DependencyGraph, seeds: Iterable<number>): number[] {
  const seen = new Set<number>();
  const stack = [...seeds];
  while (stack.length > 0) {
    const k = stack.pop();
    if (k === undefined || seen.has(k)) continue;
    seen.add(k);
    for (const j of graph.deps[k] ?? []) if (!seen.has(j)) stack.push(j);
  }
  return [...seen].sort((a, b) => a - b);
}

/** Length of the longest dependency chain (0 for no steps). */
export function longestChain(graph: DependencyGraph): number {
  const depth: number[] = [];
  let best = 0;
  graph.deps.forEach((ds, k) => {
    const d = 1 + ds.reduce((m, j) => Math.max(m, depth[j] ?? 0), 0);
    depth[k] = d;
    best = Math.max(best, d);
  });
  return best;
}
