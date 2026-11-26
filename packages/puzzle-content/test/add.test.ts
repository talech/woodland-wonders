import { readFileSync } from 'node:fs';
import type { PuzzleDefinition } from '@ww/puzzle-core';
import { describe, expect, it } from 'vitest';
import { addPuzzle, formatCatalog, gameplayFingerprint, reportAdd, sortPuzzles } from '../src/add.ts';
import { CATALOG } from '../src/index.ts';

const base = CATALOG.puzzles;
const first = base[0] as PuzzleDefinition;
const fresh: PuzzleDefinition = { ...first, id: 'zz-new', revision: 1, difficulty: { tier: 'tutorial' } };

describe('addPuzzle', () => {
  it('adds a valid new puzzle and keeps tier then id ordering', () => {
    const r = addPuzzle(base, { ...fresh, id: 'aaa-first' });
    if (!r.ok) throw new Error(r.issues.join());
    expect(r.outcome.action).toBe('added');
    expect(r.catalog).toHaveLength(base.length + 1);
    const tutorials = r.catalog.filter((p) => p.difficulty?.tier === 'tutorial').map((p) => p.id);
    expect(tutorials).toEqual([...tutorials].sort());
    expect(r.catalog[0]?.id).toBe('aaa-first');
  });

  it('does not mutate the input catalog', () => {
    const copy = structuredClone(base);
    addPuzzle(base, fresh);
    expect(base).toEqual(copy);
  });

  it('rejects invalid input', () => {
    const r = addPuzzle(base, { id: 'broken' });
    expect(r.ok).toBe(false);
    const bad = addPuzzle(base, { ...fresh, rowClues: [9, 9, 9, 9] });
    expect(bad.ok).toBe(false);
    expect(reportAdd(bad)[0]).toBe('FAILED');
  });

  it('rejects duplicate ids without --replace', () => {
    const r = addPuzzle(base, first);
    expect(r).toMatchObject({ ok: false });
    expect(r.ok ? '' : r.issues.join()).toMatch(/already exists/);
  });

  it('replace: allows metadata-only change at same revision', () => {
    const r = addPuzzle(
      base,
      { ...first, difficulty: { tier: 'tutorial', metrics: { steps: 2 } } },
      { replace: true },
    );
    if (!r.ok) throw new Error(r.issues.join());
    expect(r.outcome).toMatchObject({ action: 'replaced', gameplayChanged: false });
  });

  it('replace: gameplay change requires a revision increase', () => {
    const changed: PuzzleDefinition = { ...first, habitats: first.habitats.slice(1) };
    const same = addPuzzle(base, changed, { replace: true });
    expect(same.ok).toBe(false);
    const up = addPuzzle(base, { ...changed, revision: first.revision + 1 }, { replace: true });
    expect(up.ok).toBe(true);
  });

  it('replace: never allows a lower revision', () => {
    const bumped = addPuzzle(base, { ...first, revision: 3 }, { replace: true });
    if (!bumped.ok) throw new Error('setup');
    const lower = addPuzzle(bumped.catalog, { ...first, revision: 2 }, { replace: true });
    expect(lower.ok).toBe(false);
  });

  it('refuses to operate on an invalid existing catalog', () => {
    expect(addPuzzle([{ id: 'x' }], fresh).ok).toBe(false);
  });

  it('fingerprint ignores habitat order, revision and difficulty', () => {
    const shuffled = {
      ...first,
      revision: 9,
      difficulty: { tier: 'advanced' as const },
      habitats: [...first.habitats].reverse(),
    };
    expect(gameplayFingerprint(shuffled)).toBe(gameplayFingerprint(first));
  });
});

describe('formatting', () => {
  it('reproduces the committed puzzles.json byte for byte', () => {
    const text = readFileSync(new URL('../src/data/puzzles.json', import.meta.url), 'utf8');
    expect(formatCatalog(JSON.parse(text))).toBe(text);
  });

  it('shipped catalog is already in stable order', () => {
    expect(sortPuzzles(base).map((p) => p.id)).toEqual(base.map((p) => p.id));
  });
});
