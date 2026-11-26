/** Tier 1 · A row/column already holding its clue's worth of certain animals has no further animals. */
import type { CountRule } from '../model.ts';
import { saturate } from './count.ts';
import { type Finding, key, type Strategy, type StrategyContext } from './strategy.ts';

export function lineParams(line: CountRule): { line: string; index: number } {
  return { line: line.kind, index: line.index };
}

export const lineSaturated: Strategy = {
  id: 'line-saturated',
  tier: 1,
  *find(ctx: StrategyContext): Iterable<Finding> {
    for (const line of ctx.model.lines) {
      const f = saturate(
        ctx,
        lineSaturated,
        { ...line, constraints: [line.id] },
        {
          key: key('line-saturated'),
          params: lineParams(line),
        },
      );
      if (f) yield f;
    }
  },
};
