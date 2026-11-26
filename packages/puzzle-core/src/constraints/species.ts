import type { Constraint, ConstraintContext, ConstraintStatus, Violation } from '../contracts/constraints.ts';
import type { CellIndex, SpeciesRule } from '../contracts/definition.ts';
import type { PuzzleShape } from './registry.ts';

function status(violations: Violation[]): ConstraintStatus {
  return violations.length > 0 ? { status: 'violated', violations } : { status: 'satisfied' };
}

/** Every animal of `species` must have an orthogonally adjacent habitat it accepts. */
export function habitatAdjacencyConstraint(shape: PuzzleShape, species: SpeciesRule): Constraint[] {
  const id = `habitat:${species.id}`;
  const accepted = new Set(species.habitats);
  const supported: boolean[] = shape.orthogonal.map((ns) =>
    ns.some((n) => {
      const h = shape.habitatAt[n];
      return h != null && accepted.has(h);
    }),
  );
  const scope: CellIndex[] = shape.habitatAt.flatMap((h, i) => (h == null ? [i] : []));
  return [
    {
      id,
      kind: 'habitat-adjacency',
      scope,
      species: species.id,
      evaluate(ctx: ConstraintContext) {
        const violations: Violation[] = [];
        for (const cell of scope) {
          if (ctx.marks[cell] === species.id && !supported[cell]) {
            violations.push({
              constraintId: id,
              kind: 'missing-habitat',
              cells: [cell],
              data: { species: species.id, habitats: species.habitats.join(',') },
            });
          }
        }
        return status(violations);
      },
    },
  ];
}

/** No two animals of `species` may touch, including diagonally. */
export function speciesExclusionConstraint(shape: PuzzleShape, species: SpeciesRule): Constraint[] {
  const id = `exclusion:${species.id}`;
  const scope: CellIndex[] = shape.habitatAt.flatMap((h, i) => (h == null ? [i] : []));
  return [
    {
      id,
      kind: 'species-exclusion',
      scope,
      species: species.id,
      evaluate(ctx: ConstraintContext) {
        const violations: Violation[] = [];
        for (const cell of scope) {
          if (ctx.marks[cell] !== species.id) continue;
          for (const n of shape.king[cell] ?? []) {
            if (n > cell && ctx.marks[n] === species.id) {
              violations.push({
                constraintId: id,
                kind: 'same-species-touching',
                cells: [cell, n],
                data: { species: species.id },
              });
            }
          }
        }
        return status(violations);
      },
    },
  ];
}
