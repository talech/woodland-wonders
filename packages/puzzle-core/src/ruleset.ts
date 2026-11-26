import type { Ruleset, RulesetId } from './contracts/definition.ts';

/** Foundational ruleset (GDD §2–3): orthogonal habitat adjacency, king-move same-species exclusion. */
export const WOODLAND_V1: Ruleset = {
  id: 'woodland-v1',
  habitats: ['tree', 'mushroom', 'burrow'],
  species: [
    { id: 'fox', habitats: ['tree'], rules: [{ kind: 'habitat-adjacency' }, { kind: 'species-exclusion' }] },
    {
      id: 'mouse',
      habitats: ['mushroom'],
      rules: [{ kind: 'habitat-adjacency' }, { kind: 'species-exclusion' }],
    },
    {
      id: 'rabbit',
      habitats: ['burrow'],
      rules: [{ kind: 'habitat-adjacency' }, { kind: 'species-exclusion' }],
    },
  ],
};

export const RULESETS: Readonly<Record<RulesetId, Ruleset>> = { [WOODLAND_V1.id]: WOODLAND_V1 };

export function getRuleset(id: RulesetId): Ruleset | undefined {
  return Object.hasOwn(RULESETS, id) ? RULESETS[id] : undefined;
}
