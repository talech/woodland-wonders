import { CATALOG } from '@ww/puzzle-content';
import { canRedo, createPuzzleOrThrow, isSolved, type Puzzle } from '@ww/puzzle-core';
import { FIXTURES, UNIQUE_FIXTURES } from '@ww/puzzle-core/testing';
import { nextHint } from '@ww/puzzle-solver';
import {
  createSession,
  findWorkableRewind,
  type Session,
  type SessionAction,
  sessionReducer,
} from '../src/game/session';

const run = (actions: readonly SessionAction[], from: Session) => actions.reduce(sessionReducer, from);

/** Follow hints (request → show me → apply) until solved; returns the number of hints used. */
function solveWithHints(puzzle: Puzzle): { session: Session; hints: number } {
  let session = createSession(puzzle);
  let hints = 0;
  for (let guard = 0; guard < puzzle.cellCount + 1; guard++) {
    session = sessionReducer(session, { type: 'requestHint' });
    const hint = session.hint;
    if (hint?.kind === 'solved') return { session, hints };
    if (hint?.kind !== 'deduction') throw new Error(`unexpected hint ${hint?.kind ?? 'none'}`);
    expect(hint.stage).toBe(1);
    session = run([{ type: 'revealHint' }, { type: 'applyHint' }], session);
    expect(session.hint).toBeNull();
    hints++;
  }
  throw new Error('hints did not converge');
}

describe('hint flow (reducer)', () => {
  const tiny = createPuzzleOrThrow(FIXTURES.tiny4x4.definition);

  it('stage 1 → stage 2 → apply places the concluded mark as an undoable move', () => {
    const s1 = sessionReducer(createSession(tiny), { type: 'requestHint' });
    if (s1.hint?.kind !== 'deduction') throw new Error('expected a deduction');
    expect(s1.hint.stage).toBe(1);
    expect(s1.game.history.past).toHaveLength(0); // never auto-applied

    // Applying is not possible before the explanation is shown.
    expect(sessionReducer(s1, { type: 'applyHint' })).toBe(s1);

    const s2 = sessionReducer(s1, { type: 'revealHint' });
    expect(s2.hint?.kind === 'deduction' && s2.hint.stage).toBe(2);
    const { cell, value } = s1.hint.conclusion;
    const applied = sessionReducer(s2, { type: 'applyHint' });
    expect(applied.game.board.marks[cell]).toBe(value);
    expect(applied.game.history.past).toHaveLength(1);
    expect(applied.hint).toBeNull();

    const undone = sessionReducer(applied, { type: 'undo' });
    expect(undone.game.board.marks[cell]).toBe('unmarked');
    expect(canRedo(undone.game)).toBe(true);
  });

  it('any board change clears the hint; tool changes do not', () => {
    const shown = sessionReducer(createSession(tiny), { type: 'requestHint' });
    expect(shown.hint).not.toBeNull();
    expect(sessionReducer(shown, { type: 'selectEmpty' }).hint).toBe(shown.hint);
    expect(sessionReducer(shown, { type: 'tapCell', cell: 0 }).hint).toBeNull();
    const moved = sessionReducer(createSession(tiny), { type: 'tapCell', cell: 0 });
    expect(run([{ type: 'requestHint' }, { type: 'undo' }], moved).hint).toBeNull();
    expect(run([{ type: 'undo' }, { type: 'requestHint' }, { type: 'redo' }], moved).hint).toBeNull();
    expect(sessionReducer(shown, { type: 'dismissHint' }).hint).toBeNull();
  });

  it('a wrong-but-legal placement yields a contradiction; rewinding needs confirmation and stays redo-able', () => {
    // tiny-4x4 ('..Ft', '.t.t', '.F..', '....'): a fox at (0,1) touches a tree and breaks no clue yet,
    // but then the second fox has nowhere to live.
    const s0 = run(
      [
        { type: 'tapCell', cell: 1 },
        { type: 'selectEmpty' },
        { type: 'tapCell', cell: 12 },
        { type: 'requestHint' },
      ],
      createSession(tiny),
    );
    const hint = s0.hint;
    if (hint?.kind !== 'contradiction') throw new Error(`expected contradiction, got ${hint?.kind}`);
    expect(hint.hint.origin).toBe('deduction');
    expect(hint.rewind).toBe(2);
    expect(hint.confirming).toBe(false);

    expect(sessionReducer(s0, { type: 'confirmRewind' })).toBe(s0); // must ask first
    const asking = sessionReducer(s0, { type: 'askRewind' });
    expect(asking.hint?.kind === 'contradiction' && asking.hint.confirming).toBe(true);
    expect(sessionReducer(asking, { type: 'cancelRewind' }).hint).toEqual(hint);

    const rewound = sessionReducer(asking, { type: 'confirmRewind' });
    expect(rewound.hint).toBeNull();
    expect(rewound.game.board.marks.every((m) => m === 'unmarked')).toBe(true);
    expect(nextHint(tiny, rewound.game.board.marks).kind).toBe('deduction');
    expect(rewound.game.history.future).toHaveLength(2);
    const redone = run([{ type: 'redo' }, { type: 'redo' }], rewound);
    expect(redone.game.board.marks).toEqual(s0.game.board.marks);
  });

  it('immediate rule breaks are reported with origin "marks"', () => {
    const s = run(
      [{ type: 'tapCell', cell: 0 }, { type: 'requestHint' }], // fox with no tree next to it
      createSession(tiny),
    );
    expect(s.hint?.kind === 'contradiction' && s.hint.hint.origin).toBe('marks');
    expect(s.hint?.kind === 'contradiction' && s.hint.rewind).toBe(1);
  });

  it('a solved board reports solved', () => {
    const solution = FIXTURES.tiny4x4.solution ?? [];
    expect(solution.length).toBe(tiny.cellCount);
    let s = createSession(tiny);
    solution.forEach((m, i) => {
      if (m === 'fox') s = sessionReducer(s, { type: 'tapCell', cell: i });
    });
    expect(sessionReducer(s, { type: 'requestHint' }).hint).toEqual({ kind: 'solved' });
  });

  it('findWorkableRewind is null with no history', () => {
    expect(findWorkableRewind(tiny, createSession(tiny).game)).toBeNull();
  });

  it.each(UNIQUE_FIXTURES.map((f) => [f.name, f.definition] as const))(
    'following hints from blank solves fixture %s',
    (_name, definition) => {
      const puzzle = createPuzzleOrThrow(definition);
      const { session, hints } = solveWithHints(puzzle);
      expect(isSolved(puzzle, session.game.board.marks)).toBe(true);
      expect(hints).toBeGreaterThan(0);
    },
  );

  it.each(CATALOG.puzzles.map((d) => [d.id, d] as const))(
    'following hints from blank solves catalog puzzle %s',
    (_id, definition) => {
      const puzzle = createPuzzleOrThrow(definition);
      expect(isSolved(puzzle, solveWithHints(puzzle).session.game.board.marks)).toBe(true);
    },
  );

  it('nextHint stays well under 50 ms per call while solving every fixture and catalog puzzle', () => {
    let worst = 0;
    for (const def of [...UNIQUE_FIXTURES.map((f) => f.definition), ...CATALOG.puzzles]) {
      const puzzle = createPuzzleOrThrow(def);
      let s = createSession(puzzle);
      for (let i = 0; i < puzzle.cellCount; i++) {
        const t0 = performance.now();
        s = sessionReducer(s, { type: 'requestHint' });
        worst = Math.max(worst, performance.now() - t0);
        if (s.hint?.kind !== 'deduction') break;
        s = run([{ type: 'revealHint' }, { type: 'applyHint' }], s);
      }
    }
    // Report the observed worst case for the M2 performance note.
    console.info(`worst requestHint: ${worst.toFixed(2)} ms`);
    expect(worst).toBeLessThan(50);
  });
});
