import { describe, expect, it } from 'vitest';
import {
  applyAction,
  canRedo,
  canUndo,
  cellView,
  createGame,
  createPuzzleOrThrow,
  dispatch,
  type GameState,
  parseGameState,
  redo,
  toIndex,
  undo,
} from '../src/index.ts';
import { FIXTURES, toAscii } from '../src/testing/index.ts';

const puzzle = createPuzzleOrThrow(FIXTURES.tiny4x4.definition); // ['..Ft', '.t.t', '.F..', '....']
const at = (r: number, c: number) => toIndex(puzzle.columns, r, c);

function play(game: GameState, ...actions: Parameters<typeof dispatch>[2][]): GameState {
  return actions.reduce((g, a) => {
    const r = dispatch(puzzle, g, a);
    if (!r.ok) throw new Error(r.reason);
    return r.game;
  }, game);
}

describe('actions', () => {
  it('places, replaces, marks empty and removes', () => {
    let g = createGame(puzzle);
    g = play(
      g,
      { type: 'setCell', cell: at(0, 2), mark: 'fox' },
      { type: 'setCell', cell: at(0, 0), mark: 'empty' },
    );
    expect(toAscii(puzzle, g.board.marks)).toEqual(['x.Ft', '.t.t', '....', '....']);
    g = play(g, { type: 'setCell', cell: at(0, 2), mark: 'unmarked' });
    expect(cellView(puzzle, g.board.marks, at(0, 2))).toEqual({ kind: 'unmarked' });
    expect(cellView(puzzle, g.board.marks, at(0, 0))).toEqual({ kind: 'empty' });
    expect(cellView(puzzle, g.board.marks, at(0, 3))).toEqual({ kind: 'habitat', habitat: 'tree' });
  });

  it('allows rule-breaking placements (ADR-0008 P1) but rejects structural errors', () => {
    const g = createGame(puzzle);
    expect(applyAction(puzzle, g.board, { type: 'setCell', cell: at(3, 0), mark: 'fox' }).ok).toBe(true);
    expect(applyAction(puzzle, g.board, { type: 'setCell', cell: at(0, 3), mark: 'fox' })).toEqual({
      ok: false,
      reason: 'habitat-cell',
    });
    expect(applyAction(puzzle, g.board, { type: 'setCell', cell: 16, mark: 'fox' })).toEqual({
      ok: false,
      reason: 'out-of-bounds',
    });
    expect(applyAction(puzzle, g.board, { type: 'setCell', cell: -1, mark: 'fox' })).toEqual({
      ok: false,
      reason: 'out-of-bounds',
    });
    expect(applyAction(puzzle, g.board, { type: 'setCell', cell: 0, mark: 'mouse' })).toEqual({
      ok: false,
      reason: 'unknown-species',
    });
    expect(applyAction(puzzle, g.board, { type: 'setCell', cell: 0, mark: 'unmarked' })).toEqual({
      ok: false,
      reason: 'no-op',
    });
    expect(applyAction(puzzle, g.board, { type: 'clearAll' })).toEqual({ ok: false, reason: 'no-op' });
  });

  it('never mutates the previous state', () => {
    const g0 = createGame(puzzle);
    const before = JSON.stringify(g0);
    play(g0, { type: 'setCell', cell: 0, mark: 'fox' });
    expect(JSON.stringify(g0)).toBe(before);
  });

  it('clearAll is a single undoable change', () => {
    let g = play(
      createGame(puzzle),
      { type: 'setCell', cell: 0, mark: 'fox' },
      { type: 'setCell', cell: 1, mark: 'empty' },
    );
    g = play(g, { type: 'clearAll' });
    expect(g.board.marks.every((m) => m === 'unmarked')).toBe(true);
    const u = undo(g);
    expect(u && toAscii(puzzle, u.board.marks)[0]).toBe('Fx.t');
  });
});

describe('undo / redo', () => {
  it('undo then redo restores identical states; new action clears redo', () => {
    const g0 = createGame(puzzle);
    const g1 = play(g0, { type: 'setCell', cell: 0, mark: 'fox' });
    const g2 = play(g1, { type: 'setCell', cell: 1, mark: 'empty' });
    const u1 = undo(g2);
    expect(u1?.board).toEqual(g1.board);
    const u2 = u1 && undo(u1);
    expect(u2?.board).toEqual(g0.board);
    expect(u2 && undo(u2)).toBeNull();
    const r1 = u2 && redo(u2);
    expect(r1?.board).toEqual(g1.board);
    const r2 = r1 && redo(r1);
    expect(r2?.board).toEqual(g2.board);
    expect(r2 && redo(r2)).toBeNull();

    const branched = u1 && play(u1, { type: 'setCell', cell: 2, mark: 'fox' });
    expect(branched && canRedo(branched)).toBe(false);
    expect(branched && canUndo(branched)).toBe(true);
  });

  it('random action sequences: undo-all returns to start, redo-all returns to end', () => {
    let seed = 42;
    const rand = (n: number) => {
      seed = (seed * 1103515245 + 12345) % 2 ** 31;
      return seed % n;
    };
    const marks = ['unmarked', 'empty', 'fox'] as const;
    for (let trial = 0; trial < 50; trial++) {
      let g = createGame(puzzle);
      for (let i = 0; i < 30; i++) {
        const r = dispatch(puzzle, g, { type: 'setCell', cell: rand(16), mark: marks[rand(3)] ?? 'empty' });
        if (r.ok) g = r.game;
      }
      const end = g;
      let back: GameState | null = g;
      while (back && canUndo(back)) back = undo(back);
      expect(back?.board).toEqual(createGame(puzzle).board);
      let fwd: GameState | null = back;
      while (fwd && canRedo(fwd)) fwd = redo(fwd);
      expect(fwd?.board).toEqual(end.board);
    }
  });
});

describe('save / restore (parseGameState)', () => {
  const g = play(
    createGame(puzzle),
    { type: 'setCell', cell: 0, mark: 'fox' },
    { type: 'setCell', cell: 1, mark: 'empty' },
    { type: 'setCell', cell: 0, mark: 'empty' },
  );
  const saved = undo(g);

  it('round-trips through JSON', () => {
    const r = parseGameState(puzzle, JSON.parse(JSON.stringify(saved)));
    expect(r.ok && r.value).toEqual(saved);
    if (r.ok) expect(redo(r.value)?.board).toEqual(g.board);
  });

  it.each([
    ['wrong puzzle', (s: GameState) => ({ ...s, board: { ...s.board, puzzleId: 'other' } })],
    ['stale revision', (s: GameState) => ({ ...s, board: { ...s.board, revision: 2 } })],
    ['wrong length', (s: GameState) => ({ ...s, board: { ...s.board, marks: s.board.marks.slice(1) } })],
    [
      'mark on habitat',
      (s: GameState) => ({
        ...s,
        board: { ...s.board, marks: s.board.marks.map((m, i) => (i === 3 ? 'fox' : m)) },
      }),
    ],
    [
      'unknown species',
      (s: GameState) => ({
        ...s,
        board: { ...s.board, marks: s.board.marks.map((m, i) => (i === 2 ? 'owl' : m)) },
      }),
    ],
    [
      'history inconsistent',
      (s: GameState) => ({
        ...s,
        board: { ...s.board, marks: s.board.marks.map((m, i) => (i === 0 ? 'unmarked' : m)) },
      }),
    ],
    ['garbage', () => 'not a save'],
  ])('rejects %s', (_n, corrupt) => {
    if (!saved) throw new Error('expected saved state');
    expect(parseGameState(puzzle, JSON.parse(JSON.stringify(corrupt(saved)))).ok).toBe(false);
  });
});
