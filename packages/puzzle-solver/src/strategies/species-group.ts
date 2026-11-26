/**
 * Tier 2 · Population counting over a group of ≥2 species. The number of cells holding a species of group G
 * is exactly Σ population(G) (sum of exact species constraints), so the count argument of `count.ts`
 * applies with mask = bits(G): e.g. "fox + mouse total 5, and 5 cells must be fox-or-mouse, so nothing else
 * is a fox or a mouse". Single-species groups are `species-exhausted`/`species-forced`.
 * Group conflicts are left to the single-species/line strategies (they would need a synthetic constraint id).
 */
import type { SolverModel, SpeciesModel } from '../model.ts';
import { force, saturate } from './count.ts';
import { type Finding, key, type Strategy, type StrategyContext } from './strategy.ts';

/** Species groups of size ≥ 2, ordered by size then by bitmask (deterministic). */
export function speciesGroups(model: SolverModel): SpeciesModel[][] {
  const n = model.species.length;
  if (n > 8) return []; // keep enumeration bounded; rulesets are far smaller
  const groups: SpeciesModel[][] = [];
  for (let size = 2; size <= n; size++) {
    for (let bits = 1; bits < 1 << n; bits++) {
      const members = model.species.filter((_, i) => (bits & (1 << i)) !== 0);
      if (members.length === size) groups.push(members);
    }
  }
  return groups;
}

export const speciesGroup: Strategy = {
  id: 'species-group',
  tier: 2,
  *find(ctx: StrategyContext): Iterable<Finding> {
    const { model } = ctx;
    for (const group of speciesGroups(model)) {
      const constraints = group.map((s) => `species:${s.id}`);
      const target = group.reduce((t, s) => t + (model.puzzle.definition.population[s.id] ?? 0), 0);
      const mask = group.reduce((m, s) => m | s.bit, 0);
      const spec = { id: constraints.join('+'), constraints, cells: model.grass, target, mask };
      const params = { species: group.map((s) => s.id).join(',') };
      for (const mode of ['saturate', 'force'] as const) {
        const explanation = {
          key: `${key('species-group')}.${mode === 'saturate' ? 'saturated' : 'forced'}`,
          params,
        };
        const f =
          mode === 'saturate'
            ? saturate(ctx, speciesGroup, spec, explanation)
            : force(ctx, speciesGroup, spec, explanation);
        if (f?.kind === 'step') yield f;
      }
    }
  },
};
