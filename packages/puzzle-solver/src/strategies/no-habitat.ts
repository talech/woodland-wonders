/**
 * Tier 1 · A species with a habitat rule cannot occupy a cell without an orthogonally adjacent accepted
 * habitat. Relies only on the fixed habitat layout (no cell candidates), so `premises.cells` is empty.
 */
import { cellParams } from '../model.ts';
import { type Finding, key, makeStep, type Strategy, type StrategyContext } from './strategy.ts';

export const noHabitat: Strategy = {
  id: 'no-habitat',
  tier: 1,
  *find(ctx: StrategyContext): Iterable<Finding> {
    const { model } = ctx;
    for (const cell of model.grass) {
      let mask = 0;
      const constraints: string[] = [];
      for (const s of model.species) {
        if (s.habitatConstraint == null || s.supported[cell]) continue;
        if (((ctx.domains[cell] ?? 0) & s.bit) === 0) continue;
        mask |= s.bit;
        constraints.push(s.habitatConstraint);
      }
      if (mask === 0) continue;
      const f = makeStep(
        ctx,
        noHabitat,
        [[cell, mask]],
        { constraints, cells: [] },
        { key: key('no-habitat'), params: cellParams(model, cell) },
      );
      if (f) yield f;
    }
  },
};
