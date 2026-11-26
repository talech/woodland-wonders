/** Tier 1 · A row/column whose possible animal cells number exactly its clue: all of them hold animals. */
import { force } from './count.ts';
import { lineParams } from './line-saturated.ts';
import { type Finding, key, type Strategy, type StrategyContext } from './strategy.ts';

export const lineForced: Strategy = {
  id: 'line-forced',
  tier: 1,
  *find(ctx: StrategyContext): Iterable<Finding> {
    for (const line of ctx.model.lines) {
      const f = force(
        ctx,
        lineForced,
        { ...line, constraints: [line.id] },
        {
          key: key('line-forced'),
          params: lineParams(line),
        },
      );
      if (f) yield f;
    }
  },
};
