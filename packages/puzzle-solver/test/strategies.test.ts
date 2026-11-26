/** One hand-built ASCII board per strategy (legend: t tree · m mushroom · F fox · M mouse · x empty mark). */
import { describe, expect, it } from 'vitest';
import { lineCapacity } from '../src/strategies/line-capacity.ts';
import { lineForced } from '../src/strategies/line-forced.ts';
import { linePointing } from '../src/strategies/line-pointing.ts';
import { lineSaturated } from '../src/strategies/line-saturated.ts';
import { neighbourExclusion } from '../src/strategies/neighbour-exclusion.ts';
import { noHabitat } from '../src/strategies/no-habitat.ts';
import { speciesCapacity } from '../src/strategies/species-capacity.ts';
import { speciesExhausted } from '../src/strategies/species-exhausted.ts';
import { speciesForced } from '../src/strategies/species-forced.ts';
import { speciesGroup } from '../src/strategies/species-group.ts';
import { board, domainsFor, elim, findings, steps } from './helpers.ts';

describe('no-habitat (tier 1)', () => {
  it('removes a species from cells without an orthogonal accepted habitat', () => {
    const b = board(['tF.', '...', '...']);
    const s = steps(noHabitat, b, domainsFor(b, null, false));
    expect(s.map((x) => x.eliminations[0]?.cell)).toEqual([2, 4, 5, 6, 7, 8]);
    expect(s[0]).toEqual({
      strategy: 'no-habitat',
      tier: 1,
      eliminations: [{ cell: 2, values: ['fox'] }],
      premises: { constraints: ['habitat:fox'], cells: [] },
      explanation: { key: 'solver.no-habitat', params: { cell: 2, row: 0, col: 2 } },
    });
  });

  it('handles each species by its own habitats (no species hardcoded)', () => {
    const b = board(['tFm', '...', 'M..']);
    const byCell = Object.fromEntries(
      steps(noHabitat, b, domainsFor(b, null, false)).map((s) => [s.eliminations[0]?.cell, s]),
    );
    expect(elim(byCell[b.at(1, 1)])).toEqual({ [b.at(1, 1)]: 'fox,mouse' });
    expect(byCell[b.at(1, 1)]?.premises.constraints).toEqual(['habitat:fox', 'habitat:mouse']);
    expect(elim(byCell[b.at(1, 2)])).toEqual({ [b.at(1, 2)]: 'fox' });
    expect(byCell[b.at(0, 1)]).toBeUndefined();
  });
});

describe('neighbour-exclusion (tier 1)', () => {
  it('a determined species removes only itself from its king neighbours', () => {
    const b = board(['.t.', 'MF.', '.t.']);
    const s = steps(neighbourExclusion, b, domainsFor(b, ['.t.', 'MF.', '.t.'], false));
    expect(elim(s[0])).toEqual({ 0: 'mouse', 6: 'mouse' });
    expect(s[0]?.premises).toEqual({ constraints: ['exclusion:mouse'], cells: [3] });
    expect(elim(s[1])).toEqual({ 0: 'fox', 2: 'fox', 5: 'fox', 6: 'fox', 8: 'fox' });
    expect(s[1]?.premises).toEqual({ constraints: ['exclusion:fox'], cells: [4] });
  });
});

describe('line-saturated (tier 1)', () => {
  it('a line holding its clue in certain animals clears its other cells', () => {
    const b = board(['.t..', '.F..', '....', '....']);
    const s = steps(lineSaturated, b, domainsFor(b, ['.t..', '.F..', '....', '....'], false));
    const row1 = s.find((x) => x.explanation.params.line === 'row' && x.explanation.params.index === 1);
    expect(elim(row1)).toEqual({ 4: 'fox', 6: 'fox', 7: 'fox' });
    expect(row1?.premises).toEqual({ constraints: ['row:1'], cells: [5] });
    expect(row1?.explanation).toEqual({
      key: 'solver.line-saturated',
      params: { line: 'row', index: 1, target: 1 },
    });
  });

  it('reports a conflict when certain animals exceed the clue', () => {
    const b = board(['.t..', '.F..', '....', '....']);
    const [first] = findings(lineSaturated, b, domainsFor(b, ['.t..', '.FF.', '....', '....'], false)).filter(
      (f) => f.kind === 'conflict',
    );
    expect(first?.kind === 'conflict' && first.conflict.violation.constraintId).toBe('row:1');
    expect(first?.kind === 'conflict' && first.conflict.violation.kind).toBe('count-over');
    expect(first?.kind === 'conflict' && first.conflict.premises.cells).toEqual([5, 6]);
  });
});

describe('line-forced (tier 1)', () => {
  it('a line with exactly clue-many possible cells fills them with animals', () => {
    const b = board(['F.F.', 't.t.', '....']);
    const [s] = steps(lineForced, b, domainsFor(b, ['.x.x', 't.t.', '....'], false));
    expect(elim(s)).toEqual({ 0: 'empty', 2: 'empty' });
    expect(s?.premises).toEqual({ constraints: ['row:0'], cells: [1, 3] });
  });

  it('reports an unreachable clue', () => {
    const b = board(['F.F.', 't.t.', '....']);
    const [f] = findings(lineForced, b, domainsFor(b, ['.xxx', 't.t.', '....'], false));
    expect(f?.kind).toBe('conflict');
    expect(f?.kind === 'conflict' && f.conflict.violation).toMatchObject({
      constraintId: 'row:0',
      kind: 'count-unreachable',
      data: { target: 2, placed: 0, open: 1 },
    });
    expect(f?.kind === 'conflict' && f.conflict.premises.cells).toEqual([1, 2, 3]);
  });
});

describe('species-exhausted (tier 1)', () => {
  it('a species whose population is placed disappears from all other cells', () => {
    const b = board(['tF..', '....', '..M.', '.m..']);
    const [s] = steps(speciesExhausted, b, domainsFor(b, ['tF..', '....', '....', '.m..'], false));
    expect(s?.premises).toEqual({ constraints: ['species:fox'], cells: [1] });
    expect(s?.explanation).toEqual({
      key: 'solver.species-exhausted',
      params: { species: 'fox', target: 1 },
    });
    expect(s?.eliminations.every((e) => e.values.join() === 'fox' && e.cell !== 1)).toBe(true);
    expect(s?.eliminations).toHaveLength(b.model.grass.length - 1);
  });
});

describe('species-forced (tier 1)', () => {
  it('a species with exactly population-many candidate cells occupies them', () => {
    const b = board(['tF..', '....', '....', '..Ft']);
    const [s] = steps(speciesForced, b, domainsFor(b, ['t...', 'x...', '...x', '...t']));
    expect(elim(s)).toEqual({ 1: 'empty', 14: 'empty' });
    expect(s?.premises.constraints).toEqual(['species:fox']);
    expect(s?.premises.cells).toHaveLength(b.model.grass.length - 2);
    expect(s?.premises.cells).toContain(4);
    expect(s?.premises.cells).toContain(11);
  });
});

describe('species-group (tier 2)', () => {
  const b = board(['tFM.', '.m..', '....']);
  const only = (cells: Record<number, number>) =>
    b.puzzle.habitatAt.map((h, i) => (h != null ? 0 : (cells[i] ?? b.set('empty'))));

  it('saturated: cells certainly fox-or-mouse exhaust the fox+mouse total', () => {
    const d = only({
      1: b.set('fox', 'mouse'),
      2: b.set('fox', 'mouse'),
      3: b.set('empty', 'fox', 'mouse'),
      4: b.set('empty', 'mouse'),
    });
    expect(steps(speciesExhausted, b, d)).toEqual([]);
    expect(steps(speciesForced, b, d)).toEqual([]);
    const [s] = steps(speciesGroup, b, d);
    expect(s?.explanation.key).toBe('solver.species-group.saturated');
    expect(elim(s)).toEqual({ 3: 'fox,mouse', 4: 'mouse' });
    expect(s?.premises).toEqual({ constraints: ['species:fox', 'species:mouse'], cells: [1, 2] });
  });

  it('forced: exactly total-many cells can hold fox or mouse', () => {
    const d = only({ 1: b.set('empty', 'fox', 'mouse'), 2: b.set('empty', 'fox', 'mouse') });
    const [s] = steps(speciesGroup, b, d);
    expect(s?.explanation.key).toBe('solver.species-group.forced');
    expect(elim(s)).toEqual({ 1: 'empty', 2: 'empty' });
  });
});

describe('line-pointing (tier 2)', () => {
  it("a line's required fox lies in two touching cells: their common neighbours cannot be foxes", () => {
    const b = board(['tF.t', '....', '.tt.']);
    const [s] = steps(linePointing, b, domainsFor(b, null));
    expect(elim(s)).toEqual({ 5: 'fox', 6: 'fox' });
    expect(s?.premises).toEqual({ constraints: ['row:0', 'exclusion:fox'], cells: [1, 2] });
    expect(s?.explanation.params).toMatchObject({ line: 'row', index: 0, species: 'fox', minimum: 1 });
  });
});

describe('line-capacity (tier 3)', () => {
  it('two foxes in three touching cells must alternate', () => {
    const b = board(['tF.Ft', '.ttt.', '.....']);
    expect(
      steps(lineForced, b, domainsFor(b, null)).filter((s) => s.premises.constraints[0] === 'row:0'),
    ).toEqual([]);
    const [s] = steps(lineCapacity, b, domainsFor(b, null));
    expect(elim(s)).toEqual({ 1: 'empty', 2: 'fox', 3: 'empty' });
    expect(s?.premises).toEqual({ constraints: ['row:0', 'exclusion:fox'], cells: [1, 2, 3] });
  });

  it('reports a clue that touching cells cannot hold', () => {
    const b = board(['tFFt', '.tt.', '....']);
    const [f] = findings(lineCapacity, b, domainsFor(b, null));
    expect(f?.kind === 'conflict' && f.conflict.violation).toMatchObject({
      constraintId: 'row:0',
      kind: 'count-unreachable',
      data: { target: 2, capacity: 1 },
    });
  });
});

describe('species-capacity (tier 3)', () => {
  const b = board(['F...', 't...', '..Ft', '....']);
  const only = (cells: number[]) =>
    b.puzzle.habitatAt.map((h, i) =>
      h != null ? 0 : cells.includes(i) ? b.set('empty', 'fox') : b.set('empty'),
    );

  it('two foxes, two 2×2 regions: the lone-cell region is a fox; a cell touching it is not', () => {
    const [s] = steps(speciesCapacity, b, only([0, 5, 10]));
    expect(elim(s)).toEqual({ 5: 'fox', 10: 'empty' });
    expect(s?.premises.constraints).toEqual(['species:fox', 'exclusion:fox']);
    expect(s?.explanation.params).toEqual({ species: 'fox', regions: 2 });
  });

  it('reports a population that cannot be packed', () => {
    const [f] = findings(speciesCapacity, b, only([0, 5]));
    expect(f?.kind === 'conflict' && f.conflict.violation).toMatchObject({
      constraintId: 'species:fox',
      kind: 'count-unreachable',
      data: { target: 2, capacity: 1 },
    });
  });
});
