/**
 * Seeded PRNG: sfc32 state from a cyrb128 hash of a string seed. Pure and explicit — every generator gets its
 * own instance; no `Math.random`, no clock, no module state.
 */

/** cyrb128: 128-bit string hash as four uint32 words. */
export function hash128(text: string): [number, number, number, number] {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;
  for (let i = 0; i < text.length; i++) {
    const k = text.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= h2 ^ h3 ^ h4;
  h2 ^= h1;
  h3 ^= h1;
  h4 ^= h1;
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

/** Short stable hex digest of a string (first 32 bits of cyrb128). */
export function shortHash(text: string): string {
  return hash128(text)[0].toString(16).padStart(8, '0');
}

export interface Rng {
  /** Uniform uint32. */
  nextUint32(): number;
  /** Uniform in [0, 1). */
  float(): number;
  /** Uniform integer in [0, n). */
  int(n: number): number;
  /** Uniform integer in [lo, hi] (inclusive). */
  range(lo: number, hi: number): number;
  chance(p: number): boolean;
  pick<T>(items: readonly T[]): T;
  /** Fisher–Yates; returns a new array. */
  shuffle<T>(items: readonly T[]): T[];
}

export function createRng(seed: string): Rng {
  let [a, b, c, d] = hash128(seed);
  const nextUint32 = (): number => {
    a >>>= 0;
    b >>>= 0;
    c >>>= 0;
    d >>>= 0;
    const t = (a + b + d) >>> 0;
    d = (d + 1) >>> 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) >>> 0;
    c = ((c << 21) | (c >>> 11)) >>> 0;
    c = (c + t) >>> 0;
    return t;
  };
  // Discard a few outputs so similar seeds diverge immediately.
  for (let i = 0; i < 12; i++) nextUint32();
  const float = () => nextUint32() / 4294967296;
  const int = (n: number) => {
    if (!Number.isInteger(n) || n <= 0) throw new RangeError(`int(n) needs a positive integer, got ${n}`);
    return Math.floor(float() * n);
  };
  return {
    nextUint32,
    float,
    int,
    range: (lo, hi) => lo + int(hi - lo + 1),
    chance: (p) => float() < p,
    pick<T>(items: readonly T[]): T {
      const item = items[int(items.length)];
      if (item === undefined) throw new RangeError('pick from an empty list');
      return item;
    },
    shuffle<T>(items: readonly T[]): T[] {
      const out = [...items];
      for (let i = out.length - 1; i > 0; i--) {
        const j = int(i + 1);
        // Both indices are in bounds (0 ≤ j ≤ i < length), so these reads are defined.
        const x = out[i] as T;
        out[i] = out[j] as T;
        out[j] = x;
      }
      return out;
    },
  };
}
