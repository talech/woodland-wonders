import type { Constraint, Puzzle } from '../contracts/constraints.ts';
import type { SpeciesRule } from '../contracts/definition.ts';
import { columnCells, rowCells } from '../geometry.ts';
import { lineCountConstraint, speciesCountConstraint } from './count.ts';
import { habitatAdjacencyConstraint, speciesExclusionConstraint } from './species.ts';

/** Everything about a compiled puzzle except its constraints — the input to constraint factories. */
export type PuzzleShape = Omit<Puzzle, 'constraints'>;

/** Builds constraints that apply to every puzzle (lines, populations, future local clues). */
export type GlobalConstraintFactory = (shape: PuzzleShape) => Constraint[];
/** Builds constraints for a species rule declared in the ruleset (`SpeciesRuleRef.kind`). */
export type SpeciesConstraintFactory = (shape: PuzzleShape, species: SpeciesRule) => Constraint[];

export interface ConstraintRegistry {
  readonly global: readonly GlobalConstraintFactory[];
  readonly species: Readonly<Record<string, SpeciesConstraintFactory>>;
}

const grass = (shape: PuzzleShape, cells: number[]) => cells.filter((c) => shape.habitatAt[c] == null);

export const lineCounts: GlobalConstraintFactory = (shape) => {
  const { rows, columns, definition } = shape;
  const out: Constraint[] = [];
  for (let r = 0; r < rows; r++)
    out.push(
      lineCountConstraint(`row:${r}`, grass(shape, rowCells(columns, r)), definition.rowClues[r] ?? 0),
    );
  for (let c = 0; c < columns; c++)
    out.push(
      lineCountConstraint(
        `column:${c}`,
        grass(shape, columnCells(rows, columns, c)),
        definition.columnClues[c] ?? 0,
      ),
    );
  return out;
};

export const speciesCounts: GlobalConstraintFactory = (shape) => {
  const all = grass(
    shape,
    shape.habitatAt.map((_, i) => i),
  );
  return shape.species.map((s) => speciesCountConstraint(s, all, shape.definition.population[s] ?? 0));
};

export const DEFAULT_REGISTRY: ConstraintRegistry = {
  global: [lineCounts, speciesCounts],
  species: {
    'habitat-adjacency': habitatAdjacencyConstraint,
    'species-exclusion': speciesExclusionConstraint,
  },
};

/** Returns a new registry; never mutates the base (no hidden global state). */
export function extendRegistry(
  base: ConstraintRegistry,
  extra: {
    global?: readonly GlobalConstraintFactory[];
    species?: Readonly<Record<string, SpeciesConstraintFactory>>;
  },
): ConstraintRegistry {
  return {
    global: [...base.global, ...(extra.global ?? [])],
    species: { ...base.species, ...(extra.species ?? {}) },
  };
}
