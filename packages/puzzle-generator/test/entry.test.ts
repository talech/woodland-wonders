import { describe, expect, it } from 'vitest';
import { GENERATOR_VERSION } from '../src/index.ts';

describe('@ww/puzzle-generator entry', () => {
  it('exposes a version', () => expect(GENERATOR_VERSION).toMatch(/^\d+\.\d+\.\d+$/));
});
