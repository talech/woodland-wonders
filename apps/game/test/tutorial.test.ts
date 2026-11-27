import { findLevel } from '../src/game/levels';
import { createSession } from '../src/game/session';
import {
  createScreenState,
  type ScreenAction,
  type ScreenState,
  screenReducer,
  TUTORIAL_PUZZLE_ID,
  TUTORIAL_STEPS,
  TUTORIAL_TEXT,
} from '../src/game/tutorial';

// tutorial-01: trees at (0,3), (2,3), (3,2); cell 2 = (0,2) is beside a tree, cell 0 = (0,0) is not.
const level = findLevel(TUTORIAL_PUZZLE_ID);
if (!level) throw new Error('tutorial-01 missing from catalog');
const start = () => createScreenState(createSession(level.puzzle), true);
const run = (actions: readonly ScreenAction[], from: ScreenState = start()) =>
  actions.reduce(screenReducer, from);

describe('tutorial steps', () => {
  it('has text for every step and starts at the clue step', () => {
    for (const step of TUTORIAL_STEPS) expect(TUTORIAL_TEXT[step].body.length).toBeGreaterThan(10);
    expect(start().tutorial).toBe('clues');
    expect(createScreenState(createSession(level.puzzle), false).tutorial).toBeNull();
  });

  it('advances only on the matching real action', () => {
    let s = run([{ type: 'selectEmpty' }, { type: 'requestHint' }, { type: 'dismissHint' }]);
    expect(s.tutorial).toBe('clues'); // unrelated actions do nothing
    s = run(
      [
        { type: 'selectSpecies', species: 'fox' },
        { type: 'tapCell', cell: 0 },
      ],
      s,
    );
    expect(s.tutorial).toBe('habitat'); // placed a fox (anywhere)

    s = run([{ type: 'tapCell', cell: 5 }], s);
    expect(s.tutorial).toBe('habitat'); // (1,1) has no tree next to it: core reports missing habitat
    s = run([{ type: 'tapCell', cell: 2 }], s);
    expect(s.tutorial).toBe('touching');

    s = run([{ type: 'tapCell', cell: 15 }], s);
    expect(s.tutorial).toBe('touching');
    s = run([{ type: 'selectEmpty' }], s);
    expect(s.tutorial).toBe('mark-empty');

    s = run([{ type: 'tapCell', cell: 6 }], s);
    expect(s.session.game.board.marks[6]).toBe('empty');
    expect(s.tutorial).toBe('undo');

    s = run([{ type: 'redo' }], s);
    expect(s.tutorial).toBe('undo');
    s = run([{ type: 'undo' }], s);
    expect(s.tutorial).toBe('hint');

    s = run([{ type: 'requestHint' }], s);
    expect(s.tutorial).toBe('done');
    s = run([{ type: 'tapCell', cell: 1 }], s);
    expect(s.tutorial).toBe('done');
  });

  it('can be closed at any step without touching the board', () => {
    const s = run([{ type: 'tapCell', cell: 2 }, { type: 'closeTutorial' }]);
    expect(s.tutorial).toBeNull();
    expect(s.session.game.board.marks[2]).toBe('fox');
    expect(run([{ type: 'closeTutorial' }], s)).toBe(s);
    expect(run([{ type: 'tapCell', cell: 3 }], s).tutorial).toBeNull();
  });
});
