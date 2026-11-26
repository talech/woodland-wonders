import { type ConstraintRegistry, DEFAULT_REGISTRY, type PuzzleShape } from './constraints/registry.ts';
import type { Constraint, Puzzle } from './contracts/constraints.ts';
import type { HabitatId, PuzzleDefinition, Ruleset } from './contracts/definition.ts';
import { kingNeighbours, orthogonalNeighbours, toIndex } from './geometry.ts';
import { getRuleset } from './ruleset.ts';
import { checkDefinition, type Result } from './schema.ts';

export interface CreatePuzzleOptions {
  /** Defaults to the canonical ruleset named by `definition.rulesetId`. */
  readonly ruleset?: Ruleset;
  readonly registry?: ConstraintRegistry;
}

/** Compile a definition into an immutable puzzle with geometry and constraints. Validates semantics. */
export function createPuzzle(
  definition: PuzzleDefinition,
  options: CreatePuzzleOptions = {},
): Result<Puzzle> {
  const ruleset = options.ruleset ?? getRuleset(definition.rulesetId);
  if (!ruleset) return { ok: false, issues: [`unknown rulesetId '${definition.rulesetId}'`] };
  const issues = checkDefinition(definition, ruleset);
  if (issues.length > 0) return { ok: false, issues };

  const { rows, columns } = definition;
  const habitatAt: (HabitatId | null)[] = new Array(rows * columns).fill(null);
  for (const h of definition.habitats) habitatAt[toIndex(columns, h.row, h.col)] = h.habitat;

  const shape: PuzzleShape = Object.freeze({
    definition,
    ruleset,
    rows,
    columns,
    cellCount: rows * columns,
    habitatAt: Object.freeze(habitatAt),
    species: Object.freeze(
      ruleset.species.map((s) => s.id).filter((id) => Object.hasOwn(definition.population, id)),
    ),
    orthogonal: Object.freeze(orthogonalNeighbours(rows, columns)),
    king: Object.freeze(kingNeighbours(rows, columns)),
  });

  const registry = options.registry ?? DEFAULT_REGISTRY;
  const constraints: Constraint[] = registry.global.flatMap((f) => f(shape));
  for (const speciesRule of ruleset.species) {
    if (!shape.species.includes(speciesRule.id)) continue;
    for (const ref of speciesRule.rules) {
      const factory = registry.species[ref.kind];
      if (!factory) return { ok: false, issues: [`no constraint registered for rule kind '${ref.kind}'`] };
      constraints.push(...factory(shape, speciesRule));
    }
  }
  return { ok: true, value: Object.freeze({ ...shape, constraints: Object.freeze(constraints) }) };
}

/** Convenience for trusted inputs (tests, fixtures, already-validated content). Throws on invalid input. */
export function createPuzzleOrThrow(definition: PuzzleDefinition, options?: CreatePuzzleOptions): Puzzle {
  const result = createPuzzle(definition, options);
  if (!result.ok) throw new Error(`Invalid puzzle '${definition.id}': ${result.issues.join('; ')}`);
  return result.value;
}
