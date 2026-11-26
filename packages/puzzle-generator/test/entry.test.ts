import { describe, expect, it } from 'vitest';
import { GENERATOR_VERSION } from '../src/index.ts';

describe('@ww/puzzle-generator entry (stub until lane B)', () => {
  it('exposes a version', () => expect(GENERATOR_VERSION).toMatch(/^\d+\.\d+\.\d+$/));
});
