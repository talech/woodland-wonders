/**
 * Tier 3 · Species capacity (2×2 packing).
 *
 * Every king-move clique lies inside a 2×2 window, and a clique holds at most one animal of a species S with
 * an exclusion rule. Cover S's candidate cells with disjoint cliques W₁…W_k (deterministic greedy: for each
 * uncovered candidate in index order, take the in-bounds 2×2 window containing it with the most uncovered
 * candidates, first window on ties). Then S's population ≤ k in every solution.
 * - k < population: no solution (conflict).
 * - k = population: every clique holds exactly one S. Hence a one-cell clique is S, and a candidate X that
 *   touches every cell of some other clique W cannot be S (it would touch W's S).
 * The greedy cover may be larger than optimal; that only makes the strategy fire less often (still sound).
 * Relies on: every grass cell (they determine the candidate set).
 */
import type { CellIndex } from '@ww/puzzle-core';
import type { ValueSet } from '../types.ts';
import { type Finding, key, makeStep, type Strategy, type StrategyContext } from './strategy.ts';

export function windowsContaining(rows: number, columns: number, cell: CellIndex): CellIndex[][] {
  const r = Math.floor(cell / columns);
  const c = cell % columns;
  const out: CellIndex[][] = [];
  for (let top = r - 1; top <= r; top++) {
    for (let left = c - 1; left <= c; left++) {
      if (top < 0 || left < 0 || top + 1 >= rows || left + 1 >= columns) continue;
      const base = top * columns + left;
      out.push([base, base + 1, base + columns, base + columns + 1]);
    }
  }
  return out;
}

export const speciesCapacity: Strategy = {
  id: 'species-capacity',
  tier: 3,
  *find(ctx: StrategyContext): Iterable<Finding> {
    const { model } = ctx;
    const { rows, columns, king } = model.puzzle;
    for (const [index, s] of model.species.entries()) {
      if (s.exclusionConstraint == null) continue;
      const population = model.speciesCounts[index]?.target ?? 0;
      const candidates = model.grass.filter((c) => ((ctx.domains[c] ?? 0) & s.bit) !== 0);
      const uncovered = new Set(candidates);
      const cliques: CellIndex[][] = [];
      for (const cell of candidates) {
        if (!uncovered.has(cell)) continue;
        let best: CellIndex[] = [cell];
        for (const w of windowsContaining(rows, columns, cell)) {
          const members = w.filter((x) => uncovered.has(x));
          if (members.length > best.length) best = members;
        }
        for (const x of best) uncovered.delete(x);
        cliques.push(best);
      }
      const premises = { constraints: [`species:${s.id}`, s.exclusionConstraint], cells: model.grass };
      if (cliques.length < population) {
        yield {
          kind: 'conflict',
          conflict: {
            violation: {
              constraintId: `species:${s.id}`,
              kind: 'count-unreachable',
              cells: candidates,
              data: { target: population, capacity: cliques.length },
            },
            premises,
          },
        };
        continue;
      }
      if (cliques.length !== population) continue;
      const removals: [CellIndex, ValueSet][] = [];
      for (const w of cliques) {
        const [only] = w;
        if (w.length === 1 && only !== undefined) removals.push([only, model.fullMask & ~s.bit]);
      }
      for (const x of candidates) {
        const touchesClique = cliques.some(
          (w) => !w.includes(x) && w.every((y) => (king[y] ?? []).includes(x)),
        );
        if (touchesClique) removals.push([x, s.bit]);
      }
      const f = makeStep(ctx, speciesCapacity, removals, premises, {
        key: key('species-capacity'),
        params: { species: s.id, regions: cliques.length },
      });
      if (f) yield f;
    }
  },
};
