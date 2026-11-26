import {
  type CellMark,
  createPuzzleOrThrow,
  isSolved,
  type PuzzleDefinition,
  parsePuzzleDefinition,
  WOODLAND_V1,
} from '@ww/puzzle-core';
import { deduce, type Tier } from '@ww/puzzle-solver';
import { search } from '@ww/puzzle-solver/search';
import { describe, expect, it } from 'vitest';
import { substantiveChain } from '../src/analyze.ts';
import { BAND_IDS, bandRejection } from '../src/bands.ts';
import {
  bandSpec,
  GENERATOR_VERSION,
  generate,
  REJECTION_REASONS,
  runAttempt,
  toJson,
} from '../src/generate.ts';
import { createLayout } from '../src/layout.ts';
import { createRng } from '../src/prng.ts';

const blank = (d: PuzzleDefinition): CellMark[] => new Array<CellMark>(d.rows * d.columns).fill('unmarked');

describe('layout', () => {
  it('produces valid completed boards (core isSolved) with every species present', () => {
    for (let i = 0; i < 200; i++) {
      const species = ['fox', 'mouse', 'rabbit'].slice(0, 1 + (i % 3));
      const r = createLayout(createRng(`layout/${i}`), WOODLAND_V1, {
        rows: 5 + (i % 3),
        columns: 5 + (i % 2),
        species,
        habitatDensity: 0.25,
        animalDensity: 0.4,
      });
      if (!r.ok) continue;
      const def = { ...r.layout.definition, id: 'layout' };
      const puzzle = createPuzzleOrThrow(def);
      const marks: CellMark[] = r.layout.animals.map((a) => a ?? 'unmarked');
      expect(isSolved(puzzle, marks)).toBe(true);
      expect(Object.keys(def.population)).toEqual(species);
    }
  });
});

describe('generation', () => {
  it('is deterministic: same seed ⇒ byte-identical output (golden fingerprints)', () => {
    const run = () => generate({ band: 'intermediate', count: 3, seed: 'golden', maxAttempts: 2000 });
    const a = run();
    const b = run();
    expect(a.puzzles.map((p) => toJson(p.definition))).toEqual(b.puzzles.map((p) => toJson(p.definition)));
    expect(a.report).toEqual(b.report);
    expect(a.puzzles.map((p) => p.fingerprint)).toMatchInlineSnapshot(`
      [
        "cd2de4da",
        "e61288b8",
        "0c31cf0c",
      ]
    `);
    expect(a.report.attempts).toMatchInlineSnapshot(`91`);
    expect(
      generate({ band: 'intermediate', count: 3, seed: 'golden2', maxAttempts: 2000 }).puzzles[0]
        ?.fingerprint,
    ).not.toBe(a.puzzles[0]?.fingerprint);
  });

  it.each(BAND_IDS.map((b) => [b] as const))(
    'every accepted %s puzzle independently passes the gate',
    (band) => {
      const { puzzles, report } = generate({ band, count: 4, seed: `verify-${band}`, maxAttempts: 5000 });
      expect(report.accepted).toBe(4);
      for (const p of puzzles) {
        const def = p.definition;
        const parsed = parsePuzzleDefinition(JSON.parse(toJson(def)));
        expect(parsed.ok).toBe(true);
        const puzzle = createPuzzleOrThrow(def);
        expect(search(puzzle, { nodeBudget: 1_000_000 }).kind).toBe('unique');
        const tier = def.difficulty?.metrics?.requiredTier as Tier;
        expect(deduce(puzzle, blank(def), { maxTier: tier }).kind).toBe('solved');
        if (tier > 1)
          expect(deduce(puzzle, blank(def), { maxTier: (tier - 1) as Tier }).kind).not.toBe('solved');
        expect(def.difficulty?.tier).toBe(band);
        expect(bandRejection(bandSpec(band).accept, p.metrics)).toBeNull();
        expect(def.provenance?.generatorVersion).toBe(GENERATOR_VERSION);
        // The provenance seed alone reproduces the puzzle.
        const again = runAttempt(bandSpec(band), def.provenance?.seed ?? '');
        expect(again.kind === 'accepted' && toJson(again.puzzle.definition)).toBe(toJson(def));
      }
      expect(new Set(puzzles.map((p) => p.fingerprint)).size).toBe(puzzles.length);
    },
  );

  it('counts rejection reasons correctly on forced-failure configurations', () => {
    const seen: string[] = [];
    const r = generate({
      band: 'beginner',
      count: 5,
      seed: 'forced',
      maxAttempts: 60,
      overrides: { nodeBudget: 0 },
      onAttempt: (_i, res) => seen.push(res.kind === 'accepted' ? 'accepted' : res.reason),
    });
    expect(r.report.attempts).toBe(60);
    expect(r.report.accepted).toBe(0);
    expect(r.report.rejections['unknown-budget'] + r.report.rejections['layout-failed']).toBe(60);
    expect(r.report.rejections['unknown-budget']).toBe(seen.filter((x) => x === 'unknown-budget').length);
    expect(r.report.rejections['unknown-budget']).toBeGreaterThan(50);

    const t = generate({
      band: 'tutorial',
      count: 1,
      seed: 'forced',
      maxAttempts: 40,
      overrides: { accept: { tiers: [1], maxSubstantiveSteps: 0 } },
    });
    const total = REJECTION_REASONS.reduce((n, reason) => n + t.report.rejections[reason], 0);
    expect(total + t.report.accepted).toBe(t.report.attempts);
    expect(t.report.rejections['too-many-steps']).toBeGreaterThan(20);
    expect(t.report.rejections['too-many-steps']).toBe(t.report.gatedTiers.tier1 ?? 0);
  });

  it('enforces max attempts', () => {
    const r = generate({ band: 'advanced', count: 1000, seed: 'cap', maxAttempts: 25 });
    expect(r.report.attempts).toBe(25);
  });

  it('flags duplicates and too-similar layouts', () => {
    const r = generate({ band: 'tutorial', count: 30, seed: 'dupes', maxAttempts: 3000, maxSimilarity: 0.5 });
    expect(r.report.rejections['too-similar']).toBeGreaterThan(0);
    for (const [i, p] of r.puzzles.entries())
      for (const q of r.puzzles.slice(i + 1)) expect(p.fingerprint).not.toBe(q.fingerprint);
  });
});

describe('substantive chain', () => {
  it('ignores no-habitat steps', () => {
    const step = (strategy: 'no-habitat' | 'line-forced', cell: number, premises: number[]) => ({
      strategy,
      tier: 1 as const,
      eliminations: [{ cell, values: ['fox'] }],
      premises: { constraints: [], cells: premises },
      explanation: { key: 'k', params: {} },
    });
    expect(
      substantiveChain([step('no-habitat', 1, []), step('line-forced', 2, [1]), step('line-forced', 3, [2])]),
    ).toBe(2);
    expect(substantiveChain([step('no-habitat', 1, [])])).toBe(0);
  });
});
