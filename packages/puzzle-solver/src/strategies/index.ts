import { lineCapacity } from './line-capacity.ts';
import { lineForced } from './line-forced.ts';
import { linePointing } from './line-pointing.ts';
import { lineSaturated } from './line-saturated.ts';
import { neighbourExclusion } from './neighbour-exclusion.ts';
import { noHabitat } from './no-habitat.ts';
import { speciesCapacity } from './species-capacity.ts';
import { speciesExhausted } from './species-exhausted.ts';
import { speciesForced } from './species-forced.ts';
import { speciesGroup } from './species-group.ts';
import type { Strategy } from './strategy.ts';

/** Canonical application order: lowest tier first, cheapest first within a tier. */
export const STRATEGY_ORDER: readonly Strategy[] = [
  noHabitat,
  neighbourExclusion,
  lineSaturated,
  lineForced,
  speciesExhausted,
  speciesForced,
  speciesGroup,
  linePointing,
  lineCapacity,
  speciesCapacity,
];
