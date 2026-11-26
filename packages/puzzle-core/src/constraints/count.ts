import type { CellMark } from '../contracts/board.ts';
import type {
  Constraint,
  ConstraintContext,
  ConstraintStatus,
  CountStatus,
  EvaluationMode,
  Violation,
} from '../contracts/constraints.ts';
import type { CellIndex } from '../contracts/definition.ts';

export function isAnimal(mark: CellMark): boolean {
  return mark !== 'unmarked' && mark !== 'empty';
}

/**
 * Shared count semantics for rows, columns and species populations.
 * `cells` must exclude habitat cells. `matches` decides whether a mark counts toward the target.
 */
export function countStatus(
  marks: readonly CellMark[],
  cells: readonly CellIndex[],
  target: number,
  mode: EvaluationMode,
  matches: (mark: CellMark) => boolean,
): CountStatus {
  let placed = 0;
  let open = 0;
  for (const cell of cells) {
    const mark = marks[cell] ?? 'unmarked';
    if (matches(mark)) placed++;
    else if (mark === 'unmarked' && mode === 'partial') open++;
  }
  let status: CountStatus['status'];
  if (placed > target || placed + open < target) status = 'violated';
  else if (placed === target) status = 'satisfied';
  else status = 'pending';
  return { target, placed, open, status };
}

function countViolation(
  id: string,
  s: CountStatus,
  mode: EvaluationMode,
  cells: readonly CellIndex[],
): Violation {
  const kind = s.placed > s.target ? 'count-over' : mode === 'complete' ? 'count-under' : 'count-unreachable';
  return { constraintId: id, kind, cells, data: { target: s.target, placed: s.placed, open: s.open } };
}

function toConstraintStatus(
  id: string,
  s: CountStatus,
  mode: EvaluationMode,
  cells: readonly CellIndex[],
): ConstraintStatus {
  if (s.status === 'violated')
    return { status: 'violated', violations: [countViolation(id, s, mode, cells)] };
  return { status: s.status };
}

/** Row / column total animal count (any species). */
export function lineCountConstraint(id: string, cells: readonly CellIndex[], target: number): Constraint {
  return {
    id,
    kind: 'line-count',
    scope: cells,
    evaluate(ctx: ConstraintContext) {
      const s = countStatus(ctx.marks, cells, target, ctx.mode, isAnimal);
      return toConstraintStatus(id, s, ctx.mode, cells);
    },
  };
}

/** Exact population of one species across the board. */
export function speciesCountConstraint(
  species: string,
  cells: readonly CellIndex[],
  target: number,
): Constraint {
  const id = `species:${species}`;
  return {
    id,
    kind: 'species-count',
    scope: cells,
    species,
    evaluate(ctx: ConstraintContext) {
      const s = countStatus(ctx.marks, cells, target, ctx.mode, (m) => m === species);
      const violated = s.status === 'violated';
      const offending = violated ? cells.filter((c) => ctx.marks[c] === species) : cells;
      return toConstraintStatus(id, s, ctx.mode, offending);
    },
  };
}
