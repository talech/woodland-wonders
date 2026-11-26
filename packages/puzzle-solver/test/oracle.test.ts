/**
 * Soundness and completeness of solver + search against the brute-force oracle (core semantics only).
 */
import { type CellMark, createPuzzleOrThrow, isSolved } from '@ww/puzzle-core';
import { describe, expect, it } from 'vitest';
import { deduce, nextHint } from '../src/index.ts';
import { compileModel } from '../src/model.ts';
import { search } from '../src/search/index.ts';
import { blank, oracle, randomBoard, randomMarks, unsoundEliminations } from './support.ts';

const BOARDS = 600;
const SEEDS = Array.from({ length: BOARDS }, (_, i) => 1000 + i);

interface Case {
  readonly seed: number;
  readonly count: number;
}

describe('brute-force oracle', () => {
  it('pruned oracle equals unpruned isSolved enumeration on 3×3 boards', () => {
    let checked = 0;
    for (const seed of SEEDS) {
      const def = randomBoard(seed);
      if (def.rows !== 3 || def.columns !== 3) continue;
      const puzzle = createPuzzleOrThrow(def);
      const a = oracle(puzzle).solutions.map((s) => s.join());
      const b = oracle(puzzle, undefined, false).solutions.map((s) => s.join());
      expect(a).toEqual(b);
      if (++checked >= 40) break;
    }
    expect(checked).toBe(40);
  });
});

describe(`solver vs oracle on ${BOARDS} random tiny boards`, () => {
  const cases: Case[] = [];

  it('search count (capped at 2) equals the oracle; solutions are genuine', () => {
    for (const seed of SEEDS) {
      const puzzle = createPuzzleOrThrow(randomBoard(seed));
      const o = oracle(puzzle);
      const count = o.solutions.length;
      cases.push({ seed, count });
      const r = search(puzzle, { nodeBudget: 100_000 });
      const expected = count === 0 ? 'none' : count === 1 ? 'unique' : 'multiple';
      expect(r.kind, `seed ${seed}`).toBe(expected);
      const known = new Set(o.solutions.map((s) => s.join()));
      if (r.kind === 'unique') expect(r.solution).toEqual(o.solutions[0]);
      if (r.kind === 'multiple') {
        const [x, y] = r.solutions;
        expect(known.has(x.join()) && known.has(y.join()) && x.join() !== y.join(), `seed ${seed}`).toBe(
          true,
        );
      }
    }
    const zero = cases.filter((c) => c.count === 0).length;
    const one = cases.filter((c) => c.count === 1).length;
    const many = cases.filter((c) => c.count >= 2).length;
    // The generator must produce a genuine mix of outcomes.
    expect(zero).toBeGreaterThanOrEqual(50);
    expect(one).toBeGreaterThanOrEqual(50);
    expect(many).toBeGreaterThanOrEqual(50);
  });

  it('every elimination of every deduction step is absent from all oracle solutions', () => {
    let steps = 0;
    for (const seed of SEEDS) {
      const puzzle = createPuzzleOrThrow(randomBoard(seed));
      const o = oracle(puzzle);
      const r = deduce(puzzle, blank(puzzle));
      steps += r.steps.length;
      expect(unsoundEliminations(r.steps, o), `seed ${seed}`).toEqual([]);
      if (o.solutions.length > 0) expect(r.kind, `seed ${seed}`).not.toBe('contradiction');
      if (r.kind === 'solved') expect(o.solutions.length, `seed ${seed}`).toBe(1);
    }
    expect(steps).toBeGreaterThan(BOARDS);
  });

  it('on unique boards deduce never eliminates the true value; solved domains equal the solution', () => {
    const model = (seed: number) => compileModel(createPuzzleOrThrow(randomBoard(seed)));
    let unique = 0;
    for (const seed of SEEDS) {
      const puzzle = createPuzzleOrThrow(randomBoard(seed));
      const o = oracle(puzzle);
      const [solution] = o.solutions;
      if (o.solutions.length !== 1 || !solution) continue;
      unique++;
      const r = deduce(puzzle, blank(puzzle));
      for (const s of r.steps)
        for (const e of s.eliminations) expect(e.values, `seed ${seed}`).not.toContain(solution[e.cell]);
      if (r.kind === 'solved') {
        const m = model(seed);
        for (const cell of m.grass) expect(r.domains[cell]).toBe(1 << m.values.indexOf(solution[cell] ?? ''));
      }
    }
    expect(unique).toBeGreaterThanOrEqual(50);
  });

  it('is sound from random player marks too (deduce, hint and search respect marks)', () => {
    for (const seed of SEEDS) {
      const puzzle = createPuzzleOrThrow(randomBoard(seed));
      const solution = oracle(puzzle).solutions[0];
      for (const variant of [0, 1]) {
        const marks = randomMarks(puzzle, seed * 31 + variant, variant === 0 ? solution : undefined);
        const o = oracle(puzzle, marks);
        const r = deduce(puzzle, marks);
        expect(unsoundEliminations(r.steps, o), `seed ${seed}/${variant}`).toEqual([]);
        if (o.solutions.length > 0) expect(r.kind).not.toBe('contradiction');

        const s = search(puzzle, { nodeBudget: 100_000, marks });
        expect(s.kind).toBe(
          o.solutions.length === 0 ? 'none' : o.solutions.length === 1 ? 'unique' : 'multiple',
        );

        const h = nextHint(puzzle, marks);
        if (h.kind === 'solved') expect(isSolved(puzzle, marks)).toBe(true);
        if (h.kind === 'contradiction') expect(o.solutions.length).toBe(0);
        if (h.kind === 'deduction') {
          expect(unsoundEliminations(h.steps, o)).toEqual([]);
          const { cell, value } = h.conclusion;
          expect(value).not.toBe(marks[cell] as CellMark);
          for (const sol of o.solutions) expect(sol[cell]).toBe(value);
        }
      }
    }
  });
});
