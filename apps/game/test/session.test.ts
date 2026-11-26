import { createPuzzleOrThrow } from '@ww/puzzle-core';
import { FIXTURES } from '@ww/puzzle-core/testing';
import {
  createSession,
  markForTap,
  type Session,
  type SessionAction,
  sessionReducer,
} from '../src/game/session';

const puzzle = createPuzzleOrThrow(FIXTURES.pair5x5.definition);
// pair-5x5: '.....', '...M.', '.m.mt', 'Mm.tF', '.m...'  (species: fox, mouse)
const TREE = 14;

const run = (actions: readonly SessionAction[], from: Session = createSession(puzzle)) =>
  actions.reduce(sessionReducer, from);

describe('markForTap', () => {
  const fox = { kind: 'species', species: 'fox' } as const;
  const empty = { kind: 'empty' } as const;
  it('places the selected species on unmarked, empty or other-species cells', () => {
    expect(markForTap('unmarked', fox)).toBe('fox');
    expect(markForTap('empty', fox)).toBe('fox');
    expect(markForTap('mouse', fox)).toBe('fox');
  });
  it('clears a cell holding the same species', () => {
    expect(markForTap('fox', fox)).toBe('unmarked');
  });
  it('empty tool toggles empty/unmarked and marks animal cells empty', () => {
    expect(markForTap('unmarked', empty)).toBe('empty');
    expect(markForTap('empty', empty)).toBe('unmarked');
    expect(markForTap('fox', empty)).toBe('empty');
  });
});

describe('sessionReducer', () => {
  it('starts with the first canonical species tool and an empty history', () => {
    const s = createSession(puzzle);
    expect(s.tool).toEqual({ kind: 'species', species: 'fox' });
    expect(s.game.history.past).toHaveLength(0);
    expect(s.game.board.marks.every((m) => m === 'unmarked')).toBe(true);
  });

  it('selects species and empty tools; ignores species not in the puzzle', () => {
    const s0 = createSession(puzzle);
    const s1 = sessionReducer(s0, { type: 'selectSpecies', species: 'mouse' });
    expect(s1.tool).toEqual({ kind: 'species', species: 'mouse' });
    expect(sessionReducer(s1, { type: 'selectSpecies', species: 'rabbit' })).toBe(s1);
    expect(sessionReducer(s1, { type: 'selectSpecies', species: 'mouse' })).toBe(s1);
    const s2 = sessionReducer(s1, { type: 'selectEmpty' });
    expect(s2.tool).toEqual({ kind: 'empty' });
    expect(sessionReducer(s2, { type: 'selectEmpty' })).toBe(s2);
  });

  it('tap places, replaces and clears via core dispatch (recording history)', () => {
    const placed = run([{ type: 'tapCell', cell: 0 }]);
    expect(placed.game.board.marks[0]).toBe('fox');
    expect(placed.game.history.past).toHaveLength(1);

    const replaced = run(
      [
        { type: 'selectSpecies', species: 'mouse' },
        { type: 'tapCell', cell: 0 },
      ],
      placed,
    );
    expect(replaced.game.board.marks[0]).toBe('mouse');

    const cleared = run([{ type: 'tapCell', cell: 0 }], replaced);
    expect(cleared.game.board.marks[0]).toBe('unmarked');
    expect(cleared.game.history.past).toHaveLength(3);
  });

  it('allows rule-breaking placements (never blocks)', () => {
    // Two foxes touching, neither next to a tree.
    const s = run([
      { type: 'tapCell', cell: 0 },
      { type: 'tapCell', cell: 1 },
    ]);
    expect(s.game.board.marks.slice(0, 2)).toEqual(['fox', 'fox']);
  });

  it('empty tool toggles a cell', () => {
    const marked = run([{ type: 'selectEmpty' }, { type: 'tapCell', cell: 3 }]);
    expect(marked.game.board.marks[3]).toBe('empty');
    expect(run([{ type: 'tapCell', cell: 3 }], marked).game.board.marks[3]).toBe('unmarked');
  });

  it('habitat cells are inert', () => {
    const s0 = createSession(puzzle);
    expect(sessionReducer(s0, { type: 'tapCell', cell: TREE })).toBe(s0);
    const empty = sessionReducer(s0, { type: 'selectEmpty' });
    expect(sessionReducer(empty, { type: 'tapCell', cell: TREE })).toBe(empty);
  });

  it('ignores out-of-range cells', () => {
    const s0 = createSession(puzzle);
    expect(sessionReducer(s0, { type: 'tapCell', cell: 999 })).toBe(s0);
  });

  it('undo and redo restore boards; a new tap clears redo', () => {
    const two = run([
      { type: 'tapCell', cell: 19 },
      { type: 'selectSpecies', species: 'mouse' },
      { type: 'tapCell', cell: 8 },
    ]);
    const undone = sessionReducer(two, { type: 'undo' });
    expect(undone.game.board.marks[8]).toBe('unmarked');
    expect(undone.game.board.marks[19]).toBe('fox');
    expect(undone.tool).toEqual(two.tool);

    const redone = sessionReducer(undone, { type: 'redo' });
    expect(redone.game.board.marks).toEqual(two.game.board.marks);

    const branched = run([{ type: 'undo' }, { type: 'tapCell', cell: 15 }], redone);
    expect(branched.game.history.future).toHaveLength(0);
    expect(sessionReducer(branched, { type: 'redo' })).toBe(branched);
  });

  it('undo/redo with nothing to do return the same state', () => {
    const s0 = createSession(puzzle);
    expect(sessionReducer(s0, { type: 'undo' })).toBe(s0);
    expect(sessionReducer(s0, { type: 'redo' })).toBe(s0);
  });
});
