import type { PuzzleDefinition } from '@ww/puzzle-core';
import { FIXTURES } from '@ww/puzzle-core/testing';
import { describe, expect, it } from 'vitest';
import { canonicalForm, fingerprint, layoutSimilarity } from '../src/fingerprint.ts';

/** Rotate 90° clockwise: (r, c) → (c, R−1−r). */
function rot90(d: PuzzleDefinition): PuzzleDefinition {
  return {
    ...d,
    rows: d.columns,
    columns: d.rows,
    habitats: d.habitats.map((h) => ({ row: h.col, col: d.rows - 1 - h.row, habitat: h.habitat })),
    rowClues: [...d.columnClues],
    columnClues: [...d.rowClues].reverse(),
  };
}
/** Mirror left↔right. */
function mirror(d: PuzzleDefinition): PuzzleDefinition {
  return {
    ...d,
    habitats: d.habitats.map((h) => ({ ...h, col: d.columns - 1 - h.col })),
    columnClues: [...d.columnClues].reverse(),
  };
}

describe('canonical fingerprint', () => {
  it('is equal for all 8 symmetries of a square board', () => {
    const d = FIXTURES.trio6x6.definition;
    const images = [d, rot90(d), rot90(rot90(d)), rot90(rot90(rot90(d)))];
    const all = [...images, ...images.map(mirror)];
    for (const img of all) expect(fingerprint(img)).toBe(fingerprint(d));
    expect(new Set(all.map((x) => JSON.stringify(x.habitats))).size).toBeGreaterThan(1);
  });

  it('is equal for the 4 symmetries of a non-square board', () => {
    const d = FIXTURES.wide5x7.definition;
    const flipV: PuzzleDefinition = {
      ...d,
      habitats: d.habitats.map((h) => ({ ...h, row: d.rows - 1 - h.row })),
      rowClues: [...d.rowClues].reverse(),
    };
    for (const img of [mirror(d), flipV, mirror(flipV), rot90(rot90(d))])
      expect(canonicalForm(img)).toBe(canonicalForm(d));
  });

  it('differs for different puzzles', () => {
    const d = FIXTURES.trio6x6.definition;
    const moved = { ...d, habitats: d.habitats.map((h, i) => (i === 0 ? { ...h, habitat: 'burrow' } : h)) };
    expect(fingerprint(moved)).not.toBe(fingerprint(d));
    expect(fingerprint(FIXTURES.pair5x5.definition)).not.toBe(fingerprint(d));
  });
});

describe('layout similarity', () => {
  it('is 1 for symmetric copies, lower for other layouts, 0 across dimensions', () => {
    const d = FIXTURES.trio6x6.definition;
    expect(layoutSimilarity(d, rot90(d))).toBe(1);
    const other = { ...d, habitats: d.habitats.slice(0, 4) };
    const s = layoutSimilarity(d, other);
    expect(s).toBeGreaterThan(0);
    expect(s).toBeLessThan(1);
    expect(layoutSimilarity(d, FIXTURES.pair5x5.definition)).toBe(0);
  });
});
