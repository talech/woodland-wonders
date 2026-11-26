/**
 * Tier 3 · Line capacity ("k animals must fit in touching segments").
 *
 * Split the cells of line L that could hold an animal into maximal runs of geometrically consecutive cells
 * (consecutive cells touch). In a run whose only animal candidate is one species S with an exclusion rule,
 * no two consecutive cells can both hold animals, so it holds at most ⌈n/2⌉; any other run holds at most n.
 * Let cap = Σ run capacities (an upper bound on L's animals in every solution).
 * - cap < clue: no solution (conflict).
 * - cap = clue: every run is filled to capacity. A free run is all animals; an odd single-species run of
 *   length n holding (n+1)/2 has the unique pattern S·S·…·S (even offsets S, odd offsets empty). Even
 *   single-species runs admit several patterns and yield nothing.
 * Relies on: every cell of L.
 */
import type { CellIndex, ConstraintId } from '@ww/puzzle-core';
import { EMPTY_BIT } from '../model.ts';
import type { ValueSet } from '../types.ts';
import { lineParams } from './line-saturated.ts';
import { type Finding, key, makeStep, type Strategy, type StrategyContext } from './strategy.ts';

export const lineCapacity: Strategy = {
  id: 'line-capacity',
  tier: 3,
  *find(ctx: StrategyContext): Iterable<Finding> {
    const { model } = ctx;
    for (const line of model.lines) {
      const stride = line.kind === 'row' ? 1 : model.puzzle.columns;
      const runs: CellIndex[][] = [];
      let run: CellIndex[] = [];
      let prev = -1;
      for (const cell of line.cells) {
        const possible = ((ctx.domains[cell] ?? 0) & model.animalMask) !== 0;
        if (possible && run.length > 0 && cell - prev === stride) run.push(cell);
        else {
          if (run.length > 0) runs.push(run);
          run = possible ? [cell] : [];
        }
        prev = cell;
      }
      if (run.length > 0) runs.push(run);

      let capacity = 0;
      const removals: [CellIndex, ValueSet][] = [];
      const exclusions: ConstraintId[] = [];
      for (const r of runs) {
        const union = r.reduce((m, c) => m | ((ctx.domains[c] ?? 0) & model.animalMask), 0);
        const single = model.species.find((s) => s.bit === union && s.exclusionConstraint != null);
        if (single?.exclusionConstraint != null && r.length > 1) {
          capacity += Math.ceil(r.length / 2);
          if (!exclusions.includes(single.exclusionConstraint)) exclusions.push(single.exclusionConstraint);
          if (r.length % 2 === 1)
            r.forEach((c, i) => {
              removals.push([c, i % 2 === 0 ? EMPTY_BIT : single.bit]);
            });
        } else {
          capacity += r.length;
          for (const c of r) removals.push([c, EMPTY_BIT]);
        }
      }
      const premises = { constraints: [line.id, ...exclusions], cells: line.cells };
      if (capacity < line.target) {
        yield {
          kind: 'conflict',
          conflict: {
            violation: {
              constraintId: line.id,
              kind: 'count-unreachable',
              cells: line.cells,
              data: { target: line.target, capacity },
            },
            premises,
          },
        };
        continue;
      }
      if (capacity !== line.target || exclusions.length === 0) continue;
      const f = makeStep(ctx, lineCapacity, removals, premises, {
        key: key('line-capacity'),
        params: { ...lineParams(line), target: line.target },
      });
      if (f) yield f;
    }
  },
};
