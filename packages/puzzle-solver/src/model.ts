/**
 * Solver model: the reasoning-relevant view of a compiled core `Puzzle`.
 *
 * Single source of truth (AGENTS.md, ADR-0006): every rule the solver reasons about is located in
 * `puzzle.constraints` (core) by id and kind, and its parameters come from the definition, the ruleset and
 * core geometry (`puzzle.orthogonal`, `puzzle.king`). `compileModel` throws if core's constraints don't
 * match what the solver expects, so a divergence fails loudly instead of producing unsound deductions.
 * Constraints of unknown kinds are listed in `unmodelled`; the solver never reasons with them, and a fully
 * determined board is always confirmed with core `isSolved`.
 */
import {
  type CellIndex,
  type ConstraintId,
  type Puzzle,
  rowCells,
  type SpeciesId,
  toCoord,
} from '@ww/puzzle-core';
import type { Value, ValueSet } from './types.ts';

export const EMPTY_BIT: ValueSet = 1;

export interface CountRule {
  readonly id: ConstraintId;
  readonly kind: 'row' | 'column' | 'species';
  /** Row/column index, or species index for `species`. */
  readonly index: number;
  /** Grass cells in geometric order (left→right / top→bottom / ascending index). */
  readonly cells: readonly CellIndex[];
  readonly target: number;
  /** Values that count toward the target. */
  readonly mask: ValueSet;
}

export interface SpeciesModel {
  readonly id: SpeciesId;
  readonly bit: ValueSet;
  /** `habitat-adjacency` constraint id, or null if the species has no habitat rule. */
  readonly habitatConstraint: ConstraintId | null;
  /** `species-exclusion` constraint id, or null if the species may touch itself. */
  readonly exclusionConstraint: ConstraintId | null;
  /** Per cell: true iff the habitat rule allows this species there (always true without a habitat rule). */
  readonly supported: readonly boolean[];
}

export interface SolverModel {
  readonly puzzle: Puzzle;
  /** Grass (non-habitat) cells, ascending. */
  readonly grass: readonly CellIndex[];
  readonly isGrass: readonly boolean[];
  /** Puzzle values in bit order: `['empty', ...puzzle.species]`. */
  readonly values: readonly Value[];
  readonly species: readonly SpeciesModel[];
  readonly animalMask: ValueSet;
  readonly fullMask: ValueSet;
  /** Rows then columns. */
  readonly lines: readonly CountRule[];
  readonly speciesCounts: readonly CountRule[];
  /** Core constraints the solver does not reason about (future kinds). */
  readonly unmodelled: readonly ConstraintId[];
}

const MODELLED_KINDS = new Set(['line-count', 'species-count', 'habitat-adjacency', 'species-exclusion']);

function sameCells(a: readonly CellIndex[], b: readonly CellIndex[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  return sa.every((v, i) => v === sb[i]);
}

export function compileModel(puzzle: Puzzle): SolverModel {
  const { rows, columns, definition, cellCount } = puzzle;
  const byId = new Map(puzzle.constraints.map((c) => [c.id, c]));
  const isGrass = puzzle.habitatAt.map((h) => h == null);
  const grass: CellIndex[] = [];
  for (let i = 0; i < cellCount; i++) if (isGrass[i]) grass.push(i);

  const expect = (id: ConstraintId, kind: string, cells: readonly CellIndex[] | null) => {
    const c = byId.get(id);
    if (!c || c.kind !== kind || (cells && !sameCells(c.scope, cells)))
      throw new Error(`solver model diverges from core: expected ${kind} constraint '${id}'`);
  };

  if (puzzle.species.length > 30) throw new Error('solver supports at most 30 species per puzzle');
  const species: SpeciesModel[] = puzzle.species.map((id, i) => {
    const habitat = puzzle.constraints.find((c) => c.kind === 'habitat-adjacency' && c.species === id);
    const exclusion = puzzle.constraints.find((c) => c.kind === 'species-exclusion' && c.species === id);
    const rule = puzzle.ruleset.species.find((s) => s.id === id);
    if (!rule) throw new Error(`solver model diverges from core: species '${id}' missing from ruleset`);
    const accepted = new Set(rule.habitats);
    const supported = puzzle.orthogonal.map(
      (ns, cell) =>
        habitat == null ||
        (isGrass[cell] === true &&
          ns.some((n) => {
            const h = puzzle.habitatAt[n];
            return h != null && accepted.has(h);
          })),
    );
    return {
      id,
      bit: 1 << (i + 1),
      habitatConstraint: habitat?.id ?? null,
      exclusionConstraint: exclusion?.id ?? null,
      supported,
    };
  });
  const animalMask = species.reduce((m, s) => m | s.bit, 0);

  const lines: CountRule[] = [];
  for (let r = 0; r < rows; r++) {
    const cells = rowCells(columns, r).filter((c) => isGrass[c]);
    const id = `row:${r}`;
    expect(id, 'line-count', cells);
    lines.push({ id, kind: 'row', index: r, cells, target: definition.rowClues[r] ?? 0, mask: animalMask });
  }
  for (let c = 0; c < columns; c++) {
    const cells: CellIndex[] = [];
    for (let r = 0; r < rows; r++) {
      const cell = r * columns + c;
      if (isGrass[cell]) cells.push(cell);
    }
    const id = `column:${c}`;
    expect(id, 'line-count', cells);
    lines.push({
      id,
      kind: 'column',
      index: c,
      cells,
      target: definition.columnClues[c] ?? 0,
      mask: animalMask,
    });
  }
  const speciesCounts: CountRule[] = species.map((s, i) => {
    const id = `species:${s.id}`;
    expect(id, 'species-count', grass);
    return {
      id,
      kind: 'species',
      index: i,
      cells: grass,
      target: definition.population[s.id] ?? 0,
      mask: s.bit,
    };
  });

  return {
    puzzle,
    grass,
    isGrass,
    values: ['empty', ...puzzle.species],
    species,
    animalMask,
    fullMask: animalMask | EMPTY_BIT,
    lines,
    speciesCounts,
    unmodelled: puzzle.constraints.filter((c) => !MODELLED_KINDS.has(c.kind)).map((c) => c.id),
  };
}

/** Values of a set, in canonical bit order. */
export function valuesOf(model: SolverModel, set: ValueSet): Value[] {
  const out: Value[] = [];
  model.values.forEach((v, i) => {
    if (set & (1 << i)) out.push(v);
  });
  return out;
}

/** Bit for a value, or 0 if the value is not part of this puzzle. */
export function bitOf(model: SolverModel, value: Value): ValueSet {
  const i = model.values.indexOf(value);
  return i < 0 ? 0 : 1 << i;
}

export function popcount(set: ValueSet): number {
  let n = 0;
  for (let s = set; s !== 0; s &= s - 1) n++;
  return n;
}

/** Value held by a determined cell (singleton set), else null. */
export function singleValue(model: SolverModel, set: ValueSet): Value | null {
  if (set === 0 || (set & (set - 1)) !== 0) return null;
  return model.values[31 - Math.clz32(set)] ?? null;
}

export function cellParams(model: SolverModel, cell: CellIndex): { cell: number; row: number; col: number } {
  const { row, col } = toCoord(model.puzzle.columns, cell);
  return { cell, row, col };
}
