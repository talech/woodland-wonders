import { CATALOG } from '@ww/puzzle-content';
import { createPuzzleOrThrow, type Puzzle } from '@ww/puzzle-core';
import { FIXTURES, UNIQUE_FIXTURES } from '@ww/puzzle-core/testing';
import { type DeductionStep, STRATEGIES, type StrategyId } from '@ww/puzzle-solver';
import { describeHint, explainStep, hasTemplate, STRATEGY_NAMES, violationText } from '../src/game/hintText';
import { createSession, type HintState, type Session, sessionReducer } from '../src/game/session';

const puzzle = createPuzzleOrThrow(FIXTURES.trio6x6.definition);
const BAD = /undefined|NaN|\[object|\{|\}/;

function step(
  strategy: StrategyId,
  params: DeductionStep['explanation']['params'],
  key = `solver.${strategy}`,
) {
  return {
    strategy,
    tier: 1,
    eliminations: [{ cell: 0, values: ['fox', 'mouse'] }],
    premises: { constraints: [], cells: [] },
    explanation: { key, params },
  } satisfies DeductionStep;
}

/** Params as emitted by each solver strategy (see packages/puzzle-solver/src/strategies). */
const SAMPLE: Readonly<Record<StrategyId, DeductionStep[]>> = {
  'no-habitat': [step('no-habitat', { cell: 0, row: 0, col: 0 })],
  'neighbour-exclusion': [step('neighbour-exclusion', { cell: 7, row: 1, col: 1, species: 'fox' })],
  'line-saturated': [step('line-saturated', { line: 'row', index: 2, target: 2 })],
  'line-forced': [
    step('line-forced', { line: 'column', index: 0, target: 1 }),
    step('line-forced', { line: 'row', index: 4, target: 3 }),
  ],
  'species-exhausted': [step('species-exhausted', { species: 'mouse', target: 1 })],
  'species-forced': [step('species-forced', { species: 'rabbit', target: 2 })],
  'species-group': [
    step('species-group', { species: 'fox,mouse', target: 5 }, 'solver.species-group.saturated'),
    step('species-group', { species: 'fox,rabbit', target: 4 }, 'solver.species-group.forced'),
  ],
  'line-pointing': [step('line-pointing', { line: 'row', index: 1, species: 'fox', minimum: 1 })],
  'line-capacity': [step('line-capacity', { line: 'column', index: 3, target: 3 })],
  'species-capacity': [step('species-capacity', { species: 'fox', regions: 4 })],
};

describe('hint templates', () => {
  it('every solver strategy has a name and an explanation template', () => {
    expect(STRATEGIES.length).toBeGreaterThan(0);
    const missing = STRATEGIES.map((s) => s.id).filter((id) => !hasTemplate(id));
    expect(missing).toEqual([]);
    expect(Object.keys(STRATEGY_NAMES).sort()).toEqual(STRATEGIES.map((s) => s.id).sort());
  });

  it.each(STRATEGIES.map((s) => [s.id] as const))('%s explains its params in plain words', (id) => {
    for (const s of SAMPLE[id]) {
      const text = explainStep(s, { puzzle });
      expect(text).not.toMatch(BAD);
      expect(text.length).toBeGreaterThan(20);
    }
  });

  it('uses 1-based lines and presentation names', () => {
    expect(explainStep(step('line-saturated', { line: 'row', index: 2, target: 2 }), { puzzle })).toBe(
      'Row 3 needs 2 animals and the steps above show where all 2 go, so every other cell in row 3 is empty.',
    );
    expect(explainStep(step('no-habitat', { cell: 0, row: 0, col: 0 }), { puzzle })).toBe(
      'Row 1, column 1 has no tree or mushroom directly beside it (up, down, left or right), so a fox or a mouse can’t live there.',
    );
    expect(
      explainStep(step('species-group', { species: 'fox,mouse', target: 5 }, 'solver.species-group.forced'), {
        puzzle,
      }),
    ).toMatch(/^Together there are 5 foxes and mice, and only 5 cells could still hold a fox or a mouse/);
  });

  it('describes violations gently', () => {
    const v = (constraintId: string, kind: string, cells: number[], data = {}) => ({
      constraintId,
      kind,
      cells,
      data,
    });
    expect(violationText(v('row:1', 'count-over', []), puzzle)).toBe('Row 2 has more animals than its clue.');
    expect(violationText(v('column:0', 'count-unreachable', []), puzzle)).toBe(
      'Column 1 can’t reach its clue any more.',
    );
    expect(violationText(v('species:fox', 'count-over', []), puzzle)).toBe(
      'There are more foxes than the puzzle needs.',
    );
    expect(
      violationText(v('exclusion:fox', 'same-species-touching', [0, 7], { species: 'fox' }), puzzle),
    ).toBe('Two foxes are touching: row 1, column 1 and row 2, column 2.');
    expect(
      violationText(
        v('habitat:mouse', 'missing-habitat', [0], { species: 'mouse', habitats: 'mushroom' }),
        puzzle,
      ),
    ).toBe('The mouse at row 1, column 1 has no mushroom directly beside it.');
  });
});

/** Every hint description met while solving real puzzles renders clean text. */
function describeAll(p: Puzzle): string[] {
  const texts: string[] = [];
  let s: Session = createSession(p);
  const collect = (h: HintState | null) => {
    if (!h) return;
    const d = describeHint(h, p);
    texts.push(
      d.title,
      ...d.body,
      ...d.steps,
      d.conclusion ?? '',
      d.announcement,
      ...d.actions.map((a) => a.label),
    );
  };
  for (let i = 0; i < p.cellCount; i++) {
    s = sessionReducer(s, { type: 'requestHint' });
    collect(s.hint);
    if (s.hint?.kind !== 'deduction') break;
    s = sessionReducer(s, { type: 'revealHint' });
    collect(s.hint);
    s = sessionReducer(s, { type: 'applyHint' });
  }
  return texts;
}

describe('describeHint', () => {
  it('produces clean text for every hint while solving fixtures and the catalog', () => {
    for (const def of [...UNIQUE_FIXTURES.map((f) => f.definition), ...CATALOG.puzzles]) {
      for (const t of describeAll(createPuzzleOrThrow(def))) expect(t).not.toMatch(BAD);
    }
  });

  it('stage 1 names the place and idea without revealing the value', () => {
    const p = createPuzzleOrThrow(FIXTURES.tiny4x4.definition);
    const s = sessionReducer(createSession(p), { type: 'requestHint' });
    if (s.hint?.kind !== 'deduction') throw new Error('expected deduction');
    const d = describeHint(s.hint, p);
    expect(d.title).toMatch(/^(Look|Think)/);
    expect(d.body[0]).toMatch(/^Idea: /);
    expect(d.conclusion).toBeNull();
    expect(d.steps).toEqual([]);
    expect(d.focus).toBe(s.hint.conclusion.cell);
    expect(d.region.has(s.hint.conclusion.cell)).toBe(true);
    expect(d.actions.map((a) => a.id)).toEqual(['reveal']);

    const d2 = describeHint({ ...s.hint, stage: 2 }, p);
    expect(d2.steps.length).toBe(s.hint.steps.length);
    expect(d2.conclusion).toMatch(/^So row \d, column \d must be (empty|a fox)\.$/);
    expect(d2.actions.map((a) => a.id)).toEqual(['apply']);
  });

  it('stuck is honest and offers no move', () => {
    const d = describeHint({ kind: 'stuck' }, puzzle);
    expect(d.actions).toEqual([]);
    expect(d.region.size).toBe(0);
    expect(d.body.join(' ')).toMatch(/won’t guess/);
  });
});

describe('"already placed" wording is only used when literally true', () => {
  const saturated = (cells: number[]) => ({
    ...step('line-saturated', { line: 'row', index: 0, target: 2 }),
    premises: { constraints: ['row:0'], cells },
  });
  const exhausted = (cells: number[]) => ({
    ...step('species-exhausted', { species: 'fox', target: 2 }),
    premises: { constraints: ['species:fox'], cells },
  });

  it('branches on whether the relied-on cells are placed on the board', () => {
    const marks = new Array(puzzle.cellCount).fill('unmarked');
    marks[3] = 'fox';
    marks[5] = 'mouse';
    expect(explainStep(saturated([3, 5]), { puzzle, marks })).toMatch(/needs 2 animals and already has them/);
    expect(explainStep(saturated([3, 4]), { puzzle, marks })).toMatch(/the steps above show where all 2 go/);
    expect(explainStep(exhausted([3, 5]), { puzzle, marks })).toMatch(/the steps above show where all 2 go/);
    marks[5] = 'fox';
    expect(explainStep(exhausted([3, 5]), { puzzle, marks })).toMatch(/they are all already placed/);
  });

  it('holds for every hint step met while solving the whole catalog by hints', () => {
    let deducedOnly = 0;
    for (const def of CATALOG.puzzles) {
      const p = createPuzzleOrThrow(def);
      let s: Session = createSession(p);
      for (let i = 0; i < p.cellCount; i++) {
        s = sessionReducer(s, { type: 'requestHint' });
        const h = s.hint;
        if (h?.kind !== 'deduction') break;
        const marks = s.game.board.marks;
        for (const st of h.steps) {
          const text = explainStep(st, { puzzle: p, marks });
          if (/already has them|already placed/.test(text))
            for (const c of st.premises.cells) expect(marks[c]).not.toMatch(/^(unmarked|empty)$/);
          if (/the steps above show/.test(text)) deducedOnly++;
        }
        s = sessionReducer(sessionReducer(s, { type: 'revealHint' }), { type: 'applyHint' });
      }
    }
    expect(deducedOnly).toBeGreaterThan(0); // the case the review found does occur in the catalog
  });
});
