import type { CellMark } from '../contracts/board.ts';
import type { PuzzleDefinition } from '../contracts/definition.ts';
import { fromAscii } from './ascii.ts';

export interface Fixture {
  readonly name: string;
  readonly definition: PuzzleDefinition;
  /** Known number of solutions (capped at 2), verified by an independent exhaustive counter. */
  readonly expectedSolutions: 0 | 1 | 2;
  /** One valid solution when expectedSolutions ≥ 1. Test-only data. */
  readonly solution?: readonly CellMark[];
}

function solved(name: string, grid: readonly string[]): Fixture {
  const { definition, solution } = fromAscii(grid, { id: name });
  return { name, definition, solution, expectedSolutions: 1 };
}

/**
 * Shared engine fixtures. Uniqueness of the `unique` set was verified at M0 by an independent exhaustive
 * counter (spike, see docs/M0-REVIEW.md §2); the solver lane must re-verify these with its own search.
 */
export const FIXTURES = {
  tiny4x4: solved('tiny-4x4', ['..Ft', '.t.t', '.F..', '....']),
  pair5x5: solved('pair-5x5', ['.....', '...M.', '.m.mt', 'Mm.tF', '.m...']),
  trio6x6: solved('trio-6x6', ['..tF..', '..b...', '.FRtF.', 'btmM.t', 'MF...F', 'm..Mm.']),
  wide5x7: solved('wide-5x7', ['...MmtF', '...mt..', '.....Ft', '...Rb..', '.Ftb...']),
  /** Structurally valid, zero solutions: the only two fox candidates touch diagonally. */
  none4x4: {
    name: 'none-4x4',
    expectedSolutions: 0,
    definition: {
      schemaVersion: 1,
      id: 'none-4x4',
      revision: 1,
      rulesetId: 'woodland-v1',
      rows: 4,
      columns: 4,
      habitats: [{ row: 0, col: 0, habitat: 'tree' }],
      rowClues: [1, 1, 0, 0],
      columnClues: [1, 1, 0, 0],
      population: { fox: 2 },
    },
  },
  /** Exactly two solutions: foxes at {(2,0),(3,2)} or {(3,0),(2,2)}. */
  multi4x4: {
    name: 'multi-4x4',
    expectedSolutions: 2,
    definition: {
      schemaVersion: 1,
      id: 'multi-4x4',
      revision: 1,
      rulesetId: 'woodland-v1',
      rows: 4,
      columns: 4,
      habitats: [
        { row: 2, col: 1, habitat: 'tree' },
        { row: 3, col: 1, habitat: 'tree' },
      ],
      rowClues: [0, 0, 1, 1],
      columnClues: [1, 0, 1, 0],
      population: { fox: 2 },
    },
  },
} as const satisfies Record<string, Fixture>;

export const UNIQUE_FIXTURES: readonly Fixture[] = [
  FIXTURES.tiny4x4,
  FIXTURES.pair5x5,
  FIXTURES.trio6x6,
  FIXTURES.wide5x7,
];
export const ALL_FIXTURES: readonly Fixture[] = Object.values(FIXTURES);
