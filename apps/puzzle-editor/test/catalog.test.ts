import { CATALOG } from '@ww/puzzle-content';
import { describe, expect, it } from 'vitest';

describe('editor shell (stub until lane D)', () => {
  it('can read the content catalog', () => expect(CATALOG.puzzles.length).toBeGreaterThan(0));
});
