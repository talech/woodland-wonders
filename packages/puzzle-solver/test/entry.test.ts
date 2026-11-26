import { describe, expect, it } from 'vitest';
import * as main from '../src/index.ts';
import * as searchEntry from '../src/search/index.ts';

describe('@ww/puzzle-solver entry points', () => {
  it('main entry exposes the gameplay-safe API and no search', () => {
    expect(main.SOLVER_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    for (const name of ['createDomains', 'deduce', 'nextHint', 'analyzeDifficulty', 'domainValues'])
      expect(typeof (main as Record<string, unknown>)[name]).toBe('function');
    expect(main).not.toHaveProperty('search');
  });

  it('search entry exposes search', () => {
    expect(typeof searchEntry.search).toBe('function');
  });
});
