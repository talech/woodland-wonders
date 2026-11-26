import { describe, expect, it } from 'vitest';
import { CATALOG, loadCatalog } from '../src/index.ts';

describe('catalog', () => {
  it('shipped catalog loads without rejections', () => {
    expect(CATALOG.rejected).toEqual([]);
    expect(CATALOG.puzzles.length).toBeGreaterThan(0);
  });

  it('drops invalid and duplicate entries instead of throwing', () => {
    const first = CATALOG.puzzles[0];
    const c = loadCatalog([first, first, { id: 'broken' }]);
    expect(c.puzzles).toHaveLength(1);
    expect(c.rejected.map((r) => r.id)).toEqual([first?.id, 'broken']);
    expect(loadCatalog('nope').rejected).toHaveLength(1);
  });
});

import { WOODLAND_V1 } from '@ww/puzzle-core';
import { HABITAT_PRESENTATION, SPECIES_PRESENTATION } from '../src/index.ts';

describe('presentation config', () => {
  it('covers every ruleset species and habitat with a unique glyph', () => {
    for (const s of WOODLAND_V1.species) expect(SPECIES_PRESENTATION[s.id]).toBeDefined();
    for (const h of WOODLAND_V1.habitats) expect(HABITAT_PRESENTATION[h]).toBeDefined();
    const glyphs = [...Object.values(SPECIES_PRESENTATION), ...Object.values(HABITAT_PRESENTATION)].map(
      (p) => p.glyph,
    );
    expect(new Set(glyphs).size).toBe(glyphs.length);
  });
});
