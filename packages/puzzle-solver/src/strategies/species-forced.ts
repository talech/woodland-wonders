/** Tier 1 · A species' possible cells number exactly its population: each of them holds that species. */
import { force } from './count.ts';
import { type Finding, key, type Strategy, type StrategyContext } from './strategy.ts';

export const speciesForced: Strategy = {
  id: 'species-forced',
  tier: 1,
  *find(ctx: StrategyContext): Iterable<Finding> {
    for (const rule of ctx.model.speciesCounts) {
      const species = ctx.model.species[rule.index]?.id ?? '';
      const f = force(
        ctx,
        speciesForced,
        { ...rule, constraints: [rule.id] },
        {
          key: key('species-forced'),
          params: { species },
        },
      );
      if (f) yield f;
    }
  },
};
