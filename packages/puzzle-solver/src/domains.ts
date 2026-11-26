import type { CellIndex, CellMark, Puzzle } from '@ww/puzzle-core';
import { bitOf, compileModel, type SolverModel } from './model.ts';
import type { Domains, Value, ValueSet } from './types.ts';

export interface RawDomains {
  readonly domains: ValueSet[];
  /** Grass cells whose mark names a value that is not part of this puzzle (domain 0). */
  readonly invalid: readonly CellIndex[];
}

/**
 * Domains from the player's marks only: animal → {that species}, `empty` → {empty}, unmarked → everything.
 * Habitat cells → 0. Habitat-adjacency pruning is left to the `no-habitat` strategy so that it is credited
 * as a proof step.
 */
export function rawDomains(model: SolverModel, marks: readonly CellMark[]): RawDomains {
  const domains: ValueSet[] = new Array<ValueSet>(model.puzzle.cellCount).fill(0);
  const invalid: CellIndex[] = [];
  for (const cell of model.grass) {
    const mark = marks[cell] ?? 'unmarked';
    if (mark === 'unmarked') domains[cell] = model.fullMask;
    else {
      const bit = bitOf(model, mark);
      domains[cell] = bit;
      if (bit === 0) invalid.push(cell);
    }
  }
  return { domains, invalid };
}

/** Raw domains minus species lacking an orthogonally adjacent accepted habitat. */
export function initialDomains(model: SolverModel, marks: readonly CellMark[]): ValueSet[] {
  const { domains } = rawDomains(model, marks);
  for (const cell of model.grass) {
    if (marks[cell] != null && marks[cell] !== 'unmarked') continue;
    for (const s of model.species) if (!s.supported[cell]) domains[cell] = (domains[cell] ?? 0) & ~s.bit;
  }
  return domains;
}

/**
 * Initial candidate domains for `(puzzle, marks)` (bit 0 = empty, bit i+1 = `puzzle.species[i]`):
 * player animal → that species; player `empty` → {empty}; unmarked → all values minus species lacking an
 * orthogonally adjacent accepted habitat; habitat cells → 0. A marked value outside the puzzle yields 0.
 */
export function createDomains(puzzle: Puzzle, marks: readonly CellMark[]): Domains {
  return initialDomains(compileModel(puzzle), marks);
}

/** Candidate values of one cell in canonical order (`['empty', ...puzzle.species]` order). */
export function domainValues(puzzle: Puzzle, set: ValueSet): Value[] {
  const values: Value[] = ['empty', ...puzzle.species];
  return values.filter((_, i) => (set & (1 << i)) !== 0);
}
