import { describe, expect, it } from 'vitest';
import type { PuzzleMetrics } from '../src/analyze.ts';
import { BANDS, bandRejection, isLineTrivial } from '../src/bands.ts';

const metrics = (over: Partial<PuzzleMetrics> & { counts?: Record<string, number> }): PuzzleMetrics => ({
  requiredTier: 1,
  substantiveSteps: 10,
  substantiveChain: 5,
  overlap: 0.3,
  lineShare: 0.5,
  searchNodes: 1,
  ...over,
  difficulty: {
    stepCount: 20,
    maxTier: over.requiredTier ?? 1,
    strategyCounts: over.counts ?? { 'species-forced': 1 },
    tierCounts: { 1: 20, 2: 0, 3: 0, 4: 0 },
    longestChain: 6,
  },
});

describe('band filter', () => {
  it('classifies by tier first', () => {
    expect(bandRejection(BANDS.intermediate.accept, metrics({ requiredTier: 3 }))).toBe('above-band');
    expect(bandRejection(BANDS.intermediate.accept, metrics({ requiredTier: 2 }))).toBeNull();
    expect(bandRejection(BANDS.advanced.accept, metrics({ requiredTier: 3 }))).toBeNull();
    expect(bandRejection(BANDS.advanced.accept, metrics({ requiredTier: 1, substantiveChain: 30 }))).toBe(
      'below-band',
    );
  });

  it('accepts the deep alternative only with a long substantive chain', () => {
    const accept = BANDS.intermediate.accept;
    expect(bandRejection(accept, metrics({ substantiveChain: 9 }))).toBe('below-band');
    expect(bandRejection(accept, metrics({ substantiveChain: 10 }))).toBeNull();
    expect(bandRejection(accept, metrics({ substantiveChain: 10, overlap: 0.1 }))).toBe('low-overlap');
    expect(bandRejection(accept, metrics({ substantiveChain: 10, counts: { 'line-forced': 3 } }))).toBe(
      'line-trivial',
    );
    expect(bandRejection(BANDS.advanced.accept, metrics({ requiredTier: 2, substantiveChain: 12 }))).toBe(
      'below-band',
    );
    expect(
      bandRejection(BANDS.advanced.accept, metrics({ requiredTier: 2, substantiveChain: 13 })),
    ).toBeNull();
  });

  it('applies easy and tutorial filters', () => {
    expect(bandRejection(BANDS.easy.accept, metrics({ overlap: 0.05 }))).toBe('low-overlap');
    expect(
      bandRejection(
        BANDS.easy.accept,
        metrics({ counts: { 'line-saturated': 5, 'neighbour-exclusion': 2 } }),
      ),
    ).toBe('line-trivial');
    expect(bandRejection(BANDS.tutorial.accept, metrics({ substantiveSteps: 7 }))).toBe('too-many-steps');
    expect(bandRejection(BANDS.tutorial.accept, metrics({ substantiveSteps: 6 }))).toBeNull();
  });

  it('line-trivial means no population counting was needed at tier 1', () => {
    expect(isLineTrivial(metrics({ counts: { 'line-forced': 2 } }))).toBe(true);
    expect(isLineTrivial(metrics({ counts: { 'species-exhausted': 1 } }))).toBe(false);
    expect(isLineTrivial(metrics({ requiredTier: 2, counts: {} }))).toBe(false);
  });
});
