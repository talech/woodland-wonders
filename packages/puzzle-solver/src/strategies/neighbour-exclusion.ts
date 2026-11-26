/**
 * Tier 1 · A cell certainly holding species S (with a same-species exclusion rule) removes S from all of its
 * king-move neighbours. Relies on: that cell.
 */
import { cellParams } from '../model.ts';
import { type Finding, key, makeStep, type Strategy, type StrategyContext } from './strategy.ts';

export const neighbourExclusion: Strategy = {
  id: 'neighbour-exclusion',
  tier: 1,
  *find(ctx: StrategyContext): Iterable<Finding> {
    const { model } = ctx;
    for (const cell of model.grass) {
      const d = ctx.domains[cell] ?? 0;
      const s = model.species.find((sp) => sp.bit === d);
      if (!s || s.exclusionConstraint == null) continue;
      const removals = (model.puzzle.king[cell] ?? []).map((n) => [n, s.bit] as const);
      const f = makeStep(
        ctx,
        neighbourExclusion,
        removals,
        { constraints: [s.exclusionConstraint], cells: [cell] },
        { key: key('neighbour-exclusion'), params: { ...cellParams(model, cell), species: s.id } },
      );
      if (f) yield f;
    }
  },
};
