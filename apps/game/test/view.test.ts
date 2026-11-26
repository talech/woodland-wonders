import { CATALOG } from '@ww/puzzle-content';
import { createPuzzleOrThrow } from '@ww/puzzle-core';
import { FIXTURES } from '@ww/puzzle-core/testing';
import { clueLabel } from '../src/game/labels';
import { computeBoardLayout, MIN_CELL, MIN_COMFORTABLE } from '../src/game/layout';
import { compileLevels, findLevel, LEVELS, nextLevel } from '../src/game/levels';
import { createSession, type SessionAction, sessionReducer } from '../src/game/session';
import { derivePuzzleView } from '../src/game/view';

const puzzle = createPuzzleOrThrow(FIXTURES.pair5x5.definition);
const play = (actions: readonly SessionAction[]) => actions.reduce(sessionReducer, createSession(puzzle));

describe('derivePuzzleView', () => {
  it('labels cells with 1-based coordinates and content', () => {
    const view = derivePuzzleView(play([{ type: 'tapCell', cell: 19 }]));
    expect(view.cells[0]?.accessibilityLabel).toBe('Row 1, column 1: unmarked');
    expect(view.cells[14]?.accessibilityLabel).toBe('Row 3, column 5: tree (habitat)');
    expect(view.cells[19]?.accessibilityLabel).toBe('Row 4, column 5: fox');
  });

  it('highlights habitats accepted by the selected species only', () => {
    const fox = derivePuzzleView(createSession(puzzle));
    expect(fox.cells[14]?.highlighted).toBe(true); // tree
    expect(fox.cells[11]?.highlighted).toBe(false); // mushroom
    const mouse = derivePuzzleView(play([{ type: 'selectSpecies', species: 'mouse' }]));
    expect(mouse.cells[11]?.highlighted).toBe(true);
    expect(mouse.cells[14]?.highlighted).toBe(false);
    const empty = derivePuzzleView(play([{ type: 'selectEmpty' }]));
    expect(empty.cells.some((c) => c.highlighted)).toBe(false);
  });

  it('flags same-species touching and missing habitat from core violations', () => {
    const view = derivePuzzleView(
      play([
        { type: 'selectSpecies', species: 'mouse' },
        { type: 'tapCell', cell: 8 },
        { type: 'tapCell', cell: 12 },
        { type: 'tapCell', cell: 0 },
      ]),
    );
    expect(view.cells[8]?.flagged).toBe(true);
    expect(view.cells[12]?.accessibilityLabel).toBe('Row 3, column 3: mouse, touching another mouse');
    expect(view.cells[0]?.accessibilityLabel).toBe('Row 1, column 1: mouse, needs a mushroom next to it');
    expect(view.cells[1]?.flagged).toBe(false);
  });

  it('reports species counts and over-count status on tools', () => {
    const view = derivePuzzleView(
      play([
        { type: 'tapCell', cell: 19 },
        { type: 'tapCell', cell: 0 },
      ]),
    );
    const fox = view.tools.find((t) => t.id === 'fox');
    expect(fox?.count.placed).toBe(2);
    expect(fox?.statusText).toBe('too many');
    expect(fox?.accessibilityLabel).toBe('Fox, 2 of 1 placed, too many. Lives next to a tree');
  });

  it('is solved only when core says so', () => {
    expect(derivePuzzleView(createSession(puzzle)).solved).toBe(false);
    const solved = play([
      { type: 'tapCell', cell: 19 },
      { type: 'selectSpecies', species: 'mouse' },
      { type: 'tapCell', cell: 8 },
      { type: 'tapCell', cell: 15 },
    ]);
    expect(derivePuzzleView(solved).solved).toBe(true);
  });
});

describe('clueLabel', () => {
  const count = (
    placed: number,
    target: number,
    open: number,
    status: 'satisfied' | 'pending' | 'violated',
  ) => ({
    placed,
    target,
    open,
    status,
  });
  it('describes progress and status in words', () => {
    expect(clueLabel('row', 1, count(1, 2, 3, 'pending'))).toBe('Row 2: 1 of 2 animals');
    expect(clueLabel('column', 0, count(1, 1, 0, 'satisfied'))).toBe('Column 1: 1 of 1 animal, complete');
    expect(clueLabel('row', 0, count(3, 2, 0, 'violated'))).toBe('Row 1: 3 of 2 animals, too many');
    expect(clueLabel('row', 0, count(0, 2, 1, 'violated'))).toBe(
      'Row 1: 0 of 2 animals, not enough room left',
    );
  });
});

describe('computeBoardLayout', () => {
  const noInsets = { top: 0, bottom: 0, left: 0, right: 0 };
  it('fits a 10×10 board in a 360×640 viewport at ≥ 32 pt', () => {
    const l = computeBoardLayout({
      width: 360,
      height: 640,
      insets: { ...noInsets, top: 24 },
      rows: 10,
      columns: 10,
    });
    expect(l.cellSize).toBeGreaterThanOrEqual(MIN_CELL);
    expect(10 * l.cellSize + l.clueSize).toBeLessThanOrEqual(360 - 16);
  });
  it('reaches the comfortable size on small boards and phones', () => {
    const l = computeBoardLayout({ width: 390, height: 844, insets: noInsets, rows: 6, columns: 6 });
    expect(l.cellSize).toBeGreaterThanOrEqual(MIN_COMFORTABLE);
    expect(l.fitsHeight).toBe(true);
  });
  it('never goes below the minimum, even on short screens', () => {
    const l = computeBoardLayout({ width: 360, height: 400, insets: noInsets, rows: 10, columns: 10 });
    expect(l.cellSize).toBe(MIN_CELL);
    expect(l.fitsHeight).toBe(false);
  });
});

describe('levels', () => {
  it('compiles every catalog puzzle in order', () => {
    expect(LEVELS.map((l) => l.id)).toEqual(CATALOG.puzzles.map((p) => p.id));
    expect(LEVELS.map((l) => l.number)).toEqual(CATALOG.puzzles.map((_, i) => i + 1));
  });
  it('finds levels and their successor', () => {
    const [first, second] = LEVELS;
    expect(first && findLevel(first.id)).toBe(first);
    expect(first && nextLevel(first.id)).toBe(second);
    expect(nextLevel(LEVELS.at(-1)?.id ?? '')).toBeUndefined();
    expect(findLevel('no-such-puzzle')).toBeUndefined();
  });
  it('skips definitions that fail to compile', () => {
    const bad = { ...FIXTURES.tiny4x4.definition, id: 'bad', rulesetId: 'nope' };
    expect(compileLevels([bad, FIXTURES.tiny4x4.definition]).map((l) => l.id)).toEqual(['tiny-4x4']);
  });
});
