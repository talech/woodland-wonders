/**
 * Tier 2 · Line × species exclusion ("pointing").
 *
 * For line L with clue t and species S (with an exclusion rule): let N be the cells of L that could hold an
 * animal other than S. L holds exactly t animals, at most |N| of them non-S, so L holds ≥ t − |N| animals
 * of S, all within G = {cells of L that could be S}. If t − |N| ≥ 1, any cell X outside G that touches
 * (king move) every cell of G cannot be S: an S at X would touch the S that G must contain.
 * Relies on: every cell of L (they determine N and G).
 */

import { lineParams } from './line-saturated.ts';
import { type Finding, key, makeStep, type Strategy, type StrategyContext } from './strategy.ts';

export const linePointing: Strategy = {
  id: 'line-pointing',
  tier: 2,
  *find(ctx: StrategyContext): Iterable<Finding> {
    const { model } = ctx;
    const king = model.puzzle.king;
    for (const line of model.lines) {
      for (const s of model.species) {
        if (s.exclusionConstraint == null) continue;
        const others = model.animalMask & ~s.bit;
        const group = line.cells.filter((c) => ((ctx.domains[c] ?? 0) & s.bit) !== 0);
        const nonS = line.cells.filter((c) => ((ctx.domains[c] ?? 0) & others) !== 0).length;
        const minS = line.target - nonS;
        if (minS < 1 || group.length === 0) continue;
        const inGroup = new Set(group);
        const [first, ...rest] = group;
        const targets = (king[first ?? 0] ?? []).filter(
          (x) => !inGroup.has(x) && rest.every((g) => (king[g] ?? []).includes(x)),
        );
        const f = makeStep(
          ctx,
          linePointing,
          targets.map((x) => [x, s.bit] as const),
          { constraints: [line.id, s.exclusionConstraint], cells: line.cells },
          { key: key('line-pointing'), params: { ...lineParams(line), species: s.id, minimum: minS } },
        );
        if (f) yield f;
      }
    }
  },
};
