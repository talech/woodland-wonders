import { describe, expect, it } from 'vitest';
import {
  type Constraint,
  createPuzzleOrThrow,
  DEFAULT_REGISTRY,
  evaluateBoard,
  extendRegistry,
  type Ruleset,
  WOODLAND_V1,
} from '../src/index.ts';
import { FIXTURES, marksFromAscii } from '../src/testing/index.ts';

describe('constraint registry extensibility', () => {
  it('registers a new species rule kind without touching existing ones', () => {
    // Hypothetical "hedgehog-style" rule applied to fox: may not touch any other animal.
    const loner = (
      shape: Parameters<(typeof DEFAULT_REGISTRY.species)[string]>[0],
      s: { id: string },
    ): Constraint[] => [
      {
        id: `loner:${s.id}`,
        kind: 'touch-no-animal',
        scope: [],
        species: s.id,
        evaluate: ({ marks }) => {
          const bad = marks.flatMap((m, i) =>
            m === s.id && shape.king[i]?.some((n) => marks[n] !== 'unmarked' && marks[n] !== 'empty')
              ? [i]
              : [],
          );
          return bad.length
            ? {
                status: 'violated',
                violations: [
                  { constraintId: `loner:${s.id}`, kind: 'touching-animal', cells: bad, data: {} },
                ],
              }
            : { status: 'satisfied' };
        },
      },
    ];
    const registry = extendRegistry(DEFAULT_REGISTRY, { species: { 'touch-no-animal': loner } });
    const ruleset: Ruleset = {
      ...WOODLAND_V1,
      species: WOODLAND_V1.species.map((s) =>
        s.id === 'fox' ? { ...s, rules: [...s.rules, { kind: 'touch-no-animal' }] } : s,
      ),
    };
    const p = createPuzzleOrThrow(FIXTURES.pair5x5.definition, { ruleset, registry });
    const marks = marksFromAscii(p, ['.....', '...M.', '.m.mt', 'Mm.tF', '.m..M']);
    expect(evaluateBoard(p, marks).violations.map((v) => v.kind)).toContain('touching-animal');
    expect(DEFAULT_REGISTRY.species['touch-no-animal']).toBeUndefined();
  });

  it('fails loudly for an unregistered rule kind', () => {
    const ruleset: Ruleset = {
      ...WOODLAND_V1,
      species: [{ id: 'fox', habitats: ['tree'], rules: [{ kind: 'mystery' }] }],
    };
    expect(() => createPuzzleOrThrow(FIXTURES.tiny4x4.definition, { ruleset })).toThrow(/mystery/);
  });
});
