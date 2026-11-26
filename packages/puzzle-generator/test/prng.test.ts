import { describe, expect, it } from 'vitest';
import { createRng, hash128, shortHash } from '../src/prng.ts';

describe('seeded PRNG', () => {
  it('is deterministic per seed and differs across seeds', () => {
    const seq = (seed: string) => {
      const r = createRng(seed);
      return Array.from({ length: 50 }, () => r.nextUint32());
    };
    expect(seq('alpha')).toEqual(seq('alpha'));
    expect(seq('alpha')).not.toEqual(seq('alphb'));
    expect(hash128('x')).toEqual(hash128('x'));
    expect(shortHash('x')).toMatch(/^[0-9a-f]{8}$/);
  });

  it('has a sane distribution', () => {
    const r = createRng('distribution');
    const buckets = new Array<number>(10).fill(0);
    const n = 100_000;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const x = r.float();
      expect(x >= 0 && x < 1).toBe(true);
      sum += x;
      buckets[Math.floor(x * 10)] = (buckets[Math.floor(x * 10)] ?? 0) + 1;
    }
    expect(Math.abs(sum / n - 0.5)).toBeLessThan(0.01);
    // χ² with 9 dof; 27.9 is the p = 0.001 critical value.
    const chi = buckets.reduce((a, b) => a + (b - n / 10) ** 2 / (n / 10), 0);
    expect(chi).toBeLessThan(27.9);
  });

  it('int, range, pick and shuffle stay in bounds', () => {
    const r = createRng('bounds');
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) {
      const v = r.range(3, 7);
      expect(v >= 3 && v <= 7 && Number.isInteger(v)).toBe(true);
      seen.add(v);
    }
    expect([...seen].sort()).toEqual([3, 4, 5, 6, 7]);
    expect(['a', 'b']).toContain(r.pick(['a', 'b']));
    const items = Array.from({ length: 20 }, (_, i) => i);
    const shuffled = r.shuffle(items);
    expect([...shuffled].sort((a, b) => a - b)).toEqual(items);
    expect(shuffled).not.toEqual(items);
    expect(() => r.int(0)).toThrow(RangeError);
    expect(() => r.pick([])).toThrow(RangeError);
  });
});
