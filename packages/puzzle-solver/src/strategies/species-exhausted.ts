/** Tier 1 · All animals of a species are certainly placed: no other cell can hold that species. */
import { saturate } from './count.ts';
import { type Finding, key, type Strategy, type StrategyContext } from './strategy.ts';

export const speciesExhausted: Strategy = {
  id: 'species-exhausted',
  tier: 1,
  *find(ctx: StrategyContext): Iterable<Finding> {
    for (const rule of ctx.model.speciesCounts) {
      const species = ctx.model.species[rule.index]?.id ?? '';
      const f = saturate(
        ctx,
        speciesExhausted,
        { ...rule, constraints: [rule.id] },
        {
          key: key('species-exhausted'),
          params: { species },
        },
      );
      if (f) yield f;
    }
  },
};
