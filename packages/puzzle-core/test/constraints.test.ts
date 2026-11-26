import { describe, expect, it } from 'vitest';
import { createPuzzleOrThrow, evaluateBoard, type Puzzle, type Violation } from '../src/index.ts';
import { fromAscii, marksFromAscii } from '../src/testing/index.ts';

/** Build a puzzle from a solved grid, then evaluate a player board drawn on the same habitats. */
function setup(solved: string[]): Puzzle {
  return createPuzzleOrThrow(fromAscii(solved, { id: 'case' }).definition);
}
function violations(puzzle: Puzzle, board: string[], mode: 'partial' | 'complete' = 'partial'): Violation[] {
  return [...evaluateBoard(puzzle, marksFromAscii(puzzle, board), mode).violations];
}
const kinds = (vs: Violation[]) => vs.map((v) => `${v.constraintId}:${v.kind}`).sort();

describe('line-count constraint', () => {
  const p = setup(['F.t.', '....', 't..F', '....']); // rows [1,0,1,0], cols [1,0,0,1]

  it('over count is an immediate contradiction', () => {
    expect(kinds(violations(p, ['FFt.', '....', 't...', '....']))).toContain('row:0:count-over');
  });

  it('unreachable count: too few open cells left', () => {
    expect(kinds(violations(p, ['xxtx', '....', 't...', '....']))).toContain('row:0:count-unreachable');
  });

  it('under count is pending in partial mode, violated in complete mode', () => {
    const board = ['..t.', '....', 't...', '....'];
    expect(kinds(violations(p, board)).filter((k) => k.startsWith('row:0'))).toEqual([]);
    expect(kinds(violations(p, board, 'complete'))).toContain('row:0:count-under');
  });

  it('habitat cells are not open cells', () => {
    const q = setup(['Ft.', '...', '...']); // row 0 clue 1; cells (0,0),(0,2) are grass
    expect(evaluateBoard(q, marksFromAscii(q, ['xt.', '...', '...'])).rows[0]).toMatchObject({
      placed: 0,
      open: 1,
      status: 'pending',
    });
    expect(kinds(violations(q, ['xtx', '...', '...']))).toContain('row:0:count-unreachable');
  });

  it('column status mirrors rows on rectangular boards', () => {
    const q = setup(['F.....t', 't......', '.......']); // 3x7
    const e = evaluateBoard(q, marksFromAscii(q, ['F.....t', 't......', '.......']));
    expect(e.columns).toHaveLength(7);
    expect(e.rows).toHaveLength(3);
    expect(e.columns[0]).toMatchObject({ placed: 1, target: 1, status: 'satisfied' });
  });
});

describe('species-count constraint', () => {
  const p = setup(['F.t.', '....', 'm..M', '..t.']); // fox 1, mouse 1

  it('over population of one species', () => {
    const vs = violations(p, ['F.t.', '....', 'm.FM', '..t.']);
    expect(kinds(vs)).toContain('species:fox:count-over');
    expect(vs.find((v) => v.constraintId === 'species:fox')?.cells).toHaveLength(2);
  });

  it('missing species is a completion failure, not a partial contradiction', () => {
    const board = ['F.t.', '....', 'm...', '..t.'];
    expect(kinds(violations(p, board))).not.toContain('species:mouse:count-unreachable');
    expect(kinds(violations(p, board, 'complete'))).toContain('species:mouse:count-under');
  });
});

describe('habitat-adjacency constraint', () => {
  const p = setup(['.F..', '.t..', '....', 'm...']); // fox 1 orthogonal to tree; mushroom unused by fox

  it('orthogonal habitat satisfies; diagonal does not', () => {
    expect(kinds(violations(p, ['.F..', '.t..', '....', 'm...']))).toEqual([]);
    expect(kinds(violations(p, ['F...', '.t..', '....', 'm...']))).toContain('habitat:fox:missing-habitat');
  });

  it('a habitat of another species does not count', () => {
    const vs = violations(p, ['....', '.t..', 'F...', 'm...']).filter((v) =>
      v.constraintId.startsWith('habitat:'),
    );
    expect(kinds(vs)).toEqual(['habitat:fox:missing-habitat']);
    expect(vs[0]?.cells).toEqual([8]);
  });

  it('works at board edges', () => {
    const q = setup(['t..', 'F..', '...']);
    expect(kinds(violations(q, ['t..', 'F..', '...']))).toEqual([]);
  });
});

describe('species-exclusion constraint', () => {
  const p = setup(['F.F.', 'tttt', '....', '....']); // fox 2

  it('same species touching orthogonally or diagonally is a contradiction', () => {
    const q = setup(['tF..', '..F.', '.t..', '....']);
    expect(kinds(violations(q, ['tF..', '..F.', '.t..', '....']))).toContain(
      'exclusion:fox:same-species-touching',
    );
    expect(kinds(violations(p, ['FF..', 'tttt', '....', '....']))).toContain(
      'exclusion:fox:same-species-touching',
    );
  });

  it('gap of one cell is allowed', () => {
    expect(kinds(violations(p, ['F.F.', 'tttt', '....', '....']))).toEqual([]);
  });

  it('different species may touch', () => {
    const q = setup(['FM..', 'tm..', '....', '....']);
    expect(kinds(violations(q, ['FM..', 'tm..', '....', '....']))).toEqual([]);
  });

  it('reports each touching pair once', () => {
    const q = setup(['t.t.t', 'F.F.F', '.....']);
    const vs = violations(q, ['t.t.t', 'FFFFF', '.....']).filter((v) => v.kind === 'same-species-touching');
    expect(vs.map((v) => v.cells)).toEqual([
      [5, 6],
      [6, 7],
      [7, 8],
      [8, 9],
    ]);
  });
});
