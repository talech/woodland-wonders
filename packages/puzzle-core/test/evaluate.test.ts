import { describe, expect, it } from 'vitest';
import { type CellMark, createPuzzleOrThrow, evaluateBoard, isSolved } from '../src/index.ts';
import { FIXTURES, UNIQUE_FIXTURES } from '../src/testing/index.ts';

describe('board evaluation & completion', () => {
  it.each(UNIQUE_FIXTURES.map((f) => [f.name, f] as const))(
    '%s: known solution is solved without contradictions',
    (_n, f) => {
      const p = createPuzzleOrThrow(f.definition);
      const solution = f.solution ?? [];
      expect(isSolved(p, solution)).toBe(true);
      expect(evaluateBoard(p, solution).violations).toEqual([]);
      expect(evaluateBoard(p, solution).isSolved).toBe(true);
    },
  );

  it('unmarked and explicitly empty cells are equivalent for completion (ADR-0008 P2)', () => {
    const f = FIXTURES.pair5x5;
    const p = createPuzzleOrThrow(f.definition);
    const withUnmarked = (f.solution ?? []).map((m): CellMark => (m === 'empty' ? 'unmarked' : m));
    expect(isSolved(p, withUnmarked)).toBe(true);
  });

  it('a fresh board is not solved but has no contradictions', () => {
    const p = createPuzzleOrThrow(FIXTURES.trio6x6.definition);
    const blank = new Array<CellMark>(p.cellCount).fill('unmarked');
    const e = evaluateBoard(p, blank);
    expect(e.violations).toEqual([]);
    expect(e.isSolved).toBe(false);
    expect(Object.keys(e.species)).toEqual(['fox', 'mouse', 'rabbit']);
  });

  it('removing one animal from a solution breaks completion', () => {
    const f = FIXTURES.trio6x6;
    const p = createPuzzleOrThrow(f.definition);
    const marks = [...(f.solution ?? [])];
    const idx = marks.indexOf('rabbit');
    marks[idx] = 'unmarked';
    expect(isSolved(p, marks)).toBe(false);
    expect(evaluateBoard(p, marks).violations).toEqual([]);
  });

  it('evaluation does not depend on a stored solution', () => {
    const p = createPuzzleOrThrow(FIXTURES.tiny4x4.definition);
    expect(JSON.stringify(p.definition)).not.toMatch(/solution/);
  });
});
