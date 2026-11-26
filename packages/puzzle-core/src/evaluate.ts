import { countStatus, isAnimal } from './constraints/count.ts';
import type { CellMark } from './contracts/board.ts';
import type {
  BoardEvaluation,
  CountStatus,
  EvaluationMode,
  Puzzle,
  Violation,
} from './contracts/constraints.ts';
import type { SpeciesId } from './contracts/definition.ts';
import { columnCells, rowCells } from './geometry.ts';

/**
 * Evaluate a board. In `partial` mode (default) violations are immediate local contradictions only;
 * `isSolved` is always computed in complete mode. Never compares against a solution (ADR-0008).
 */
export function evaluateBoard(
  puzzle: Puzzle,
  marks: readonly CellMark[],
  mode: EvaluationMode = 'partial',
): BoardEvaluation {
  const violations: Violation[] = [];
  for (const c of puzzle.constraints) {
    const s = c.evaluate({ puzzle, marks, mode });
    if (s.status === 'violated') violations.push(...s.violations);
  }
  const grass = (cells: number[]) => cells.filter((i) => puzzle.habitatAt[i] == null);
  const { rows, columns, definition } = puzzle;
  const rowStatus: CountStatus[] = definition.rowClues.map((t, r) =>
    countStatus(marks, grass(rowCells(columns, r)), t, mode, isAnimal),
  );
  const columnStatus: CountStatus[] = definition.columnClues.map((t, c) =>
    countStatus(marks, grass(columnCells(rows, columns, c)), t, mode, isAnimal),
  );
  const all = grass(puzzle.habitatAt.map((_, i) => i));
  const species: Record<SpeciesId, CountStatus> = {};
  for (const s of puzzle.species)
    species[s] = countStatus(marks, all, definition.population[s] ?? 0, mode, (m) => m === s);

  return {
    mode,
    violations,
    rows: rowStatus,
    columns: columnStatus,
    species,
    isSolved: mode === 'complete' ? violations.length === 0 : isSolved(puzzle, marks),
  };
}

/** True iff placed animals satisfy every constraint, treating unmarked cells as empty (ADR-0008 P2). */
export function isSolved(puzzle: Puzzle, marks: readonly CellMark[]): boolean {
  return puzzle.constraints.every(
    (c) => c.evaluate({ puzzle, marks, mode: 'complete' }).status !== 'violated',
  );
}
