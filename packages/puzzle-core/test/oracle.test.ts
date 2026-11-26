import { describe, expect, it } from 'vitest';
import { type CellMark, createPuzzleOrThrow, isSolved, type Puzzle } from '../src/index.ts';
import { FIXTURES } from '../src/testing/index.ts';

/**
 * Brute-force reference enumerator built only on `isSolved` (single source of rule truth, ADR-0006).
 * Exponential — tiny boards only. The solver lane reuses this approach as its oracle.
 */
function bruteForceCount(puzzle: Puzzle, limit = 3): number {
  const grass = puzzle.habitatAt.flatMap((h, i) => (h == null ? [i] : []));
  const values: CellMark[] = ['empty', ...puzzle.species];
  const marks = new Array<CellMark>(puzzle.cellCount).fill('unmarked');
  let found = 0;
  const total = values.length ** grass.length;
  for (let n = 0; n < total && found < limit; n++) {
    let k = n;
    for (const cell of grass) {
      marks[cell] = values[k % values.length] ?? 'empty';
      k = Math.floor(k / values.length);
    }
    if (isSolved(puzzle, marks)) found++;
  }
  return found;
}

describe('fixture solution counts (brute force over core semantics)', () => {
  it.each([FIXTURES.tiny4x4, FIXTURES.none4x4, FIXTURES.multi4x4].map((f) => [f.name, f] as const))(
    '%s',
    (_n, f) => {
      expect(Math.min(bruteForceCount(createPuzzleOrThrow(f.definition)), 2)).toBe(f.expectedSolutions);
    },
  );
});
