import { DEFAULT_TIER, TIER_ORDER } from '@ww/puzzle-content';
import { createPuzzleOrThrow } from '@ww/puzzle-core';
import { FIXTURES, UNIQUE_FIXTURES } from '@ww/puzzle-core/testing';
import { deduce } from '@ww/puzzle-solver';
import { describe, expect, it } from 'vitest';
import {
  analyzeDefinition,
  buildTrace,
  exportDefinitionJson,
  importDefinition,
  overlayFor,
} from '../src/model/index.ts';

function run(def = FIXTURES.tiny4x4.definition, nodeBudget?: number) {
  const r = analyzeDefinition(def, nodeBudget === undefined ? {} : { nodeBudget });
  if (!r.ok) throw new Error(r.issues.join());
  return r.analysis;
}

describe('analyzeDefinition', () => {
  it('reports unique, publishable fixtures with a required tier', () => {
    for (const f of UNIQUE_FIXTURES) {
      const a = run(f.definition);
      expect(a.solutionCount).toBe('one');
      expect(a.solutions).toHaveLength(1);
      expect(a.verdict.publishable).toBe(a.deduction === 'solved');
      if (a.deduction === 'solved') {
        expect(a.requiredTier).not.toBeNull();
        expect(a.metrics.stepCount).toBe(a.trace.length);
        expect(a.metrics.maxTier).toBeLessThanOrEqual(a.requiredTier ?? 0);
      }
    }
    expect(run().verdict).toEqual({ publishable: true, reason: 'unique and solvable by deduction' });
  });

  it('reports zero solutions', () => {
    const a = run(FIXTURES.none4x4.definition);
    expect(a.solutionCount).toBe('zero');
    expect(a.verdict.publishable).toBe(false);
    expect(a.verdict.reason).toMatch(/no solution/);
  });

  it('reports multiple solutions with the differing cells', () => {
    const a = run(FIXTURES.multi4x4.definition);
    expect(a.solutionCount).toBe('multiple');
    expect(a.solutions).toHaveLength(2);
    expect(a.verdict.publishable).toBe(false);
    // foxes at (2,0),(3,2) vs (3,0),(2,2)
    expect([...a.differingCells].sort((x, y) => x - y)).toEqual([8, 10, 12, 14]);
  });

  it('shows unknown honestly when the budget is exhausted', () => {
    const a = run(FIXTURES.trio6x6.definition, 0);
    expect(a.solutionCount).toBe('unknown');
    expect(a.verdict.publishable).toBe(false);
    expect(a.verdict.reason).toMatch(/unknown/);
  });

  it('rejects invalid definitions', () => {
    const r = analyzeDefinition({ ...FIXTURES.tiny4x4.definition, rowClues: [9, 9, 9, 9] });
    expect(r.ok).toBe(false);
  });
});

describe('trace view mapping', () => {
  it('maps steps to highlighted cells and domains after the step', () => {
    const def = FIXTURES.tiny4x4.definition;
    const a = run(def);
    expect(a.trace.length).toBeGreaterThan(0);
    const puzzle = createPuzzleOrThrow(def);
    const raw = deduce(puzzle, new Array(puzzle.cellCount).fill('unmarked')).steps;
    const trace = buildTrace(puzzle, raw);
    const last = trace[trace.length - 1];
    // after the final step every grass cell is decided (one candidate), habitats have none
    last?.domainsAfter.forEach((d, i) => {
      expect(d.length).toBe(puzzle.habitatAt[i] == null ? 1 : 0);
    });
    const first = a.trace[0];
    if (!first) throw new Error('no steps');
    const overlay = overlayFor(a, { kind: 'step', index: 0 }, puzzle.cellCount);
    expect(overlay).toHaveLength(puzzle.cellCount);
    for (const c of first.affectedCells) expect(overlay[c]?.role).toBe('affected');
    for (const c of first.premiseCells)
      if (!first.affectedCells.includes(c)) expect(overlay[c]?.role).toBe('premise');
    expect(overlayFor(a, { kind: 'none' }, puzzle.cellCount)).toEqual([]);
    expect(overlayFor(a, { kind: 'step', index: 999 }, puzzle.cellCount)).toEqual([]);
  });

  it('maps multiple solutions to overlays marking differing cells', () => {
    const a = run(FIXTURES.multi4x4.definition);
    const o = overlayFor(a, { kind: 'solution', which: 1 }, 16);
    expect(o.filter((c) => c.role === 'differs').map((c) => c.cell)).toEqual(a.differingCells);
    expect(o.filter((c) => c.text === 'f')).toHaveLength(2);
  });
});

describe('tier default', () => {
  it('editor import fallback matches the catalog sort default', () => {
    const { difficulty: _drop, ...noTier } = FIXTURES.tiny4x4.definition;
    const imp = importDefinition(noTier);
    if (!imp.ok) throw new Error('import');
    expect(imp.value.tier).toBe(DEFAULT_TIER);
    const out = exportDefinitionJson(imp.value);
    if (!out.ok) throw new Error('export');
    expect(JSON.parse(out.value).difficulty.tier).toBe(DEFAULT_TIER);
    expect(TIER_ORDER[0]).toBe(DEFAULT_TIER);
  });
});
