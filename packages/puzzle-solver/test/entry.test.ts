import { describe, expect, it } from 'vitest';
import { SOLVER_VERSION } from '../src/index.ts';

describe('@ww/puzzle-solver entry (stub until lane B)', () => {
  it('exposes a version', () => expect(SOLVER_VERSION).toMatch(/^\d+\.\d+\.\d+$/));
});
