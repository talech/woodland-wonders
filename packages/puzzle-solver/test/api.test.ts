import {
  type CellMark,
  type Constraint,
  createPuzzleOrThrow,
  DEFAULT_REGISTRY,
  extendRegistry,
  isSolved,
  type Ruleset,
  WOODLAND_V1,
} from '@ww/puzzle-core';
import { ALL_FIXTURES, FIXTURES, fromAscii, marksFromAscii, UNIQUE_FIXTURES } from '@ww/puzzle-core/testing';
import { describe, expect, it } from 'vitest';
import {
  analyzeDifficulty,
  createDomains,
  type DeductionStep,
  deduce,
  domainValues,
  nextHint,
  STRATEGIES,
} from '../src/index.ts';
import { compileModel } from '../src/model.ts';
import { search } from '../src/search/index.ts';
import { blank, oracle, unsoundEliminations } from './support.ts';

const puzzleOf = (f: (typeof ALL_FIXTURES)[number]) => createPuzzleOrThrow(f.definition);

describe('createDomains', () => {
  it('derives candidates from marks and habitats', () => {
    const puzzle = createPuzzleOrThrow(FIXTURES.pair5x5.definition);
    const marks = marksFromAscii(puzzle, ['x....', '...M.', '.m.mt', '.m.t.', '.m...']);
    const d = createDomains(puzzle, marks);
    const at = (r: number, c: number) => domainValues(puzzle, d[r * 5 + c] ?? 0);
    expect(puzzle.species).toEqual(['fox', 'mouse']);
    expect(at(0, 0)).toEqual(['empty']); // player empty
    expect(at(1, 3)).toEqual(['mouse']); // player animal
    expect(at(2, 1)).toEqual([]); // habitat
    expect(at(3, 0)).toEqual(['empty', 'mouse']); // mushroom only
    expect(at(3, 4)).toEqual(['empty', 'fox']); // tree only
    expect(at(1, 4)).toEqual(['empty', 'fox']);
    expect(at(0, 4)).toEqual(['empty']); // no habitat at all
  });
});

describe('deduce on core fixtures', () => {
  it.each(UNIQUE_FIXTURES.map((f) => [f.name, f] as const))('%s is solved from the blank board', (_n, f) => {
    const puzzle = puzzleOf(f);
    const r = deduce(puzzle, blank(puzzle));
    expect(r.kind).toBe('solved');
    if (r.kind !== 'solved') return;
    const solved = puzzle.habitatAt.map((h, i) =>
      h != null ? 'unmarked' : (domainValues(puzzle, r.domains[i] ?? 0)[0] ?? ''),
    );
    expect(solved).toEqual(f.solution);
    expect(unsoundEliminations(r.steps, oracle(puzzle))).toEqual([]);
  });

  it('none-4x4 is a deduction contradiction; multi-4x4 is stuck', () => {
    const none = deduce(puzzleOf(FIXTURES.none4x4), blank(puzzleOf(FIXTURES.none4x4)));
    expect(none.kind === 'contradiction' && none.origin).toBe('deduction');
    expect(deduce(puzzleOf(FIXTURES.multi4x4), blank(puzzleOf(FIXTURES.multi4x4))).kind).toBe('stuck');
  });

  it('maxTier restricts strategies', () => {
    const puzzle = puzzleOf(FIXTURES.trio6x6);
    expect(deduce(puzzle, blank(puzzle), { maxTier: 1 }).steps.every((s) => s.tier === 1)).toBe(true);
  });

  it('reports invalid and locally contradictory marks with origin "marks"', () => {
    const puzzle = puzzleOf(FIXTURES.tiny4x4);
    const touching = marksFromAscii(puzzle, ['..Ft', '.tFt', '....', '....']);
    const r = deduce(puzzle, touching);
    expect(r.kind === 'contradiction' && r.origin).toBe('marks');
    expect(r.kind === 'contradiction' && r.violations.map((v) => v.kind)).toContain('same-species-touching');
    const invalid: CellMark[] = blank(puzzle);
    invalid[0] = 'rabbit';
    const r2 = deduce(puzzle, invalid);
    expect(r2.kind === 'contradiction' && r2.conflict).toMatchObject({ kind: 'invalid-mark', cells: [0] });
  });

  it('is deterministic', () => {
    for (const f of ALL_FIXTURES) {
      const puzzle = puzzleOf(f);
      expect(JSON.stringify(deduce(puzzle, blank(puzzle)))).toBe(
        JSON.stringify(deduce(puzzleOf(f), blank(puzzle))),
      );
      expect(JSON.stringify(nextHint(puzzle, blank(puzzle)))).toBe(
        JSON.stringify(nextHint(puzzle, blank(puzzle))),
      );
    }
  });

  it('runs the 6×6 fixture well under 50 ms', () => {
    const puzzle = puzzleOf(FIXTURES.trio6x6);
    deduce(puzzle, blank(puzzle));
    const times: number[] = [];
    for (let i = 0; i < 15; i++) {
      const t = performance.now();
      deduce(puzzle, blank(puzzle));
      times.push(performance.now() - t);
    }
    times.sort((a, b) => a - b);
    expect(times[7]).toBeLessThan(10);
    expect(times[14]).toBeLessThan(50);
  });
});

describe('rules come from core and ruleset data (no species hardcoded)', () => {
  it('a species without an exclusion rule may touch itself', () => {
    const ruleset: Ruleset = {
      ...WOODLAND_V1,
      species: WOODLAND_V1.species.map((s) =>
        s.id === 'fox' ? { ...s, rules: [{ kind: 'habitat-adjacency' }] } : s,
      ),
    };
    const { definition } = fromAscii(['tFF', '..t', '...'], { id: 'touchy' });
    const puzzle = createPuzzleOrThrow(definition, { ruleset });
    expect(compileModel(puzzle).species[0]?.exclusionConstraint).toBeNull();
    const o = oracle(puzzle);
    const r = deduce(puzzle, blank(puzzle));
    expect(unsoundEliminations(r.steps, o)).toEqual([]);
    expect(r.steps.some((s) => s.strategy === 'neighbour-exclusion' || s.strategy === 'line-capacity')).toBe(
      false,
    );
    expect(o.solutions.length).toBeGreaterThan(0);
    expect(o.solutions.some((sol) => sol[1] === 'fox' && sol[2] === 'fox')).toBe(true);
    expect(search(puzzle, { nodeBudget: 1000 }).kind).toBe(o.solutions.length === 1 ? 'unique' : 'multiple');
  });

  it('unmodelled constraint kinds are judged by core isSolved, never ignored', () => {
    const corner: Constraint = {
      id: 'test:corner',
      kind: 'test-corner',
      scope: [0],
      evaluate: (ctx) =>
        ctx.marks[0] === 'fox'
          ? {
              status: 'violated',
              violations: [{ constraintId: 'test:corner', kind: 'test', cells: [0], data: {} }],
            }
          : { status: 'satisfied' },
    };
    const registry = extendRegistry(DEFAULT_REGISTRY, { global: [() => [corner]] });
    const { definition } = fromAscii(['Ft.', '...', '...'], { id: 'corner' });
    const puzzle = createPuzzleOrThrow(definition, { registry });
    expect(compileModel(puzzle).unmodelled).toEqual(['test:corner']);
    const r = deduce(puzzle, blank(puzzle));
    expect(r.kind === 'contradiction' && r.conflict.constraintId).toBe('test:corner');
    expect(search(puzzle, { nodeBudget: 1000 }).kind).toBe('none');
  });

  it('rejects a puzzle whose core constraints diverge from the solver model', () => {
    const puzzle = puzzleOf(FIXTURES.tiny4x4);
    const broken = { ...puzzle, constraints: puzzle.constraints.filter((c) => c.id !== 'row:0') };
    expect(() => deduce(broken, blank(puzzle))).toThrow(/diverges from core/);
  });
});

describe('nextHint', () => {
  it('returns solved for a complete board', () => {
    const f = FIXTURES.trio6x6;
    const puzzle = puzzleOf(f);
    const marks = (f.solution ?? []).map((m) => (m === 'empty' ? 'unmarked' : m));
    expect(nextHint(puzzle, marks)).toEqual({ kind: 'solved' });
  });

  it.each(UNIQUE_FIXTURES.map((f) => [f.name, f] as const))(
    'following hints from blank solves %s',
    (_n, f) => {
      const puzzle = puzzleOf(f);
      const marks = blank(puzzle);
      for (let i = 0; i < puzzle.cellCount; i++) {
        const h = nextHint(puzzle, marks);
        if (h.kind === 'solved') break;
        expect(h.kind).toBe('deduction');
        if (h.kind !== 'deduction') return;
        expect(h.steps.length).toBeGreaterThan(0);
        expect(h.conclusion.value).toBe(f.solution?.[h.conclusion.cell]);
        marks[h.conclusion.cell] = h.conclusion.value;
      }
      expect(isSolved(puzzle, marks)).toBe(true);
    },
  );

  it('returns the minimal replayable chain (a lone no-habitat step for an obvious empty cell)', () => {
    const puzzle = puzzleOf(FIXTURES.tiny4x4);
    const h = nextHint(puzzle, blank(puzzle));
    expect(h.kind === 'deduction' && h.steps.map((s) => s.strategy)).toEqual(['no-habitat']);
    expect(h.kind === 'deduction' && h.conclusion.value).toBe('empty');
  });

  it('respects empty marks: they constrain deduction and are never contradicted by a hint', () => {
    const puzzle = puzzleOf(FIXTURES.multi4x4);
    const marks = blank(puzzle);
    let last = nextHint(puzzle, marks);
    for (let i = 0; i < puzzle.cellCount && last.kind === 'deduction'; i++) {
      marks[last.conclusion.cell] = last.conclusion.value;
      last = nextHint(puzzle, marks);
    }
    expect(last).toEqual({ kind: 'stuck' }); // two solutions: no sound hint can choose between them
    marks[8] = 'empty'; // player rules out fox at (2,0)
    const h = nextHint(puzzle, marks);
    expect(h.kind).toBe('deduction');
    if (h.kind !== 'deduction') return;
    expect(h.conclusion.cell).not.toBe(8);
    const o = oracle(puzzle, marks);
    expect(o.solutions).toHaveLength(1);
    expect(o.solutions[0]?.[h.conclusion.cell]).toBe(h.conclusion.value);
    expect(search(puzzle, { nodeBudget: 100, marks }).kind).toBe('unique');
  });

  it('a wrong but locally fine placement yields a contradiction, not a correction', () => {
    const puzzle = puzzleOf(FIXTURES.tiny4x4);
    const marks = marksFromAscii(puzzle, ['.F.t', '.t.t', '....', '....']);
    expect(deduce(puzzle, marks).kind).toBe('contradiction');
    const h = nextHint(puzzle, marks);
    expect(h.kind).toBe('contradiction');
    if (h.kind !== 'contradiction') return;
    expect(h.origin).toBe('deduction');
    expect(h.steps.length).toBeGreaterThan(0);
    expect(h).not.toHaveProperty('conclusion');
  });

  it('a locally broken board yields the conflict with origin "marks"', () => {
    const puzzle = puzzleOf(FIXTURES.tiny4x4);
    const h = nextHint(puzzle, marksFromAscii(puzzle, ['..Ft', '.tFt', '....', '....']));
    expect(h.kind === 'contradiction' && h.origin).toBe('marks');
    expect(h.kind === 'contradiction' && h.steps).toEqual([]);
  });
});

describe('search', () => {
  it.each(ALL_FIXTURES.map((f) => [f.name, f] as const))('%s has the expected solution count', (_n, f) => {
    const puzzle = puzzleOf(f);
    const r = search(puzzle, { nodeBudget: 10_000 });
    expect(r.kind).toBe(['none', 'unique', 'multiple'][f.expectedSolutions]);
    if (r.kind === 'unique') expect(r.solution).toEqual(f.solution);
    if (r.kind === 'multiple') for (const s of r.solutions) expect(isSolved(puzzle, s)).toBe(true);
  });

  it('returns unknown when the node budget is exhausted', () => {
    const multi = puzzleOf(FIXTURES.multi4x4);
    expect(search(multi, { nodeBudget: 1 })).toEqual({ kind: 'unknown', reason: 'budget', nodes: 1 });
    expect(search(multi, { nodeBudget: 0 })).toEqual({ kind: 'unknown', reason: 'budget', nodes: 0 });
    expect(search(multi, { nodeBudget: 3 }).kind).toBe('multiple');
  });

  it('is deterministic', () => {
    for (const f of ALL_FIXTURES) {
      const puzzle = puzzleOf(f);
      expect(search(puzzle, { nodeBudget: 10_000 })).toEqual(search(puzzle, { nodeBudget: 10_000 }));
    }
  });
});

describe('analyzeDifficulty', () => {
  it('handles an empty trace', () => {
    expect(analyzeDifficulty([])).toEqual({
      stepCount: 0,
      maxTier: 0,
      strategyCounts: {},
      tierCounts: { 1: 0, 2: 0, 3: 0, 4: 0 },
      longestChain: 0,
    });
  });

  it('measures the longest premise-dependency chain', () => {
    const step = (cell: number, premise: number[], tier: 1 | 2 | 3 = 1): DeductionStep => ({
      strategy: tier === 1 ? 'line-saturated' : 'line-capacity',
      tier,
      eliminations: [{ cell, values: ['fox'] }],
      premises: { constraints: [], cells: premise },
      explanation: { key: 'k', params: {} },
    });
    const m = analyzeDifficulty([step(1, []), step(2, [1]), step(9, []), step(3, [2], 3)]);
    expect(m).toMatchObject({ stepCount: 4, maxTier: 3, longestChain: 3 });
    expect(m.strategyCounts).toEqual({ 'line-saturated': 3, 'line-capacity': 1 });
  });

  it('summarises fixture traces consistently', () => {
    for (const f of UNIQUE_FIXTURES) {
      const puzzle = puzzleOf(f);
      const { steps } = deduce(puzzle, blank(puzzle));
      const m = analyzeDifficulty(steps);
      expect(Object.values(m.strategyCounts).reduce((a, b) => a + (b ?? 0), 0)).toBe(m.stepCount);
      expect(m.longestChain).toBeGreaterThan(0);
      expect(m.longestChain).toBeLessThanOrEqual(m.stepCount);
    }
  });

  it('lists strategies in canonical order with tiers', () => {
    expect(STRATEGIES.map((s) => s.tier)).toEqual([...STRATEGIES.map((s) => s.tier)].sort());
    expect(STRATEGIES).toHaveLength(10);
  });
});
