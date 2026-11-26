import { describe, expect, it } from 'vitest';
import { createPuzzle, type PuzzleDefinition, parsePuzzleDefinition } from '../src/index.ts';
import { ALL_FIXTURES, FIXTURES } from '../src/testing/index.ts';

const base: PuzzleDefinition = FIXTURES.tiny4x4.definition;
const mutate = (patch: Record<string, unknown>) => ({ ...JSON.parse(JSON.stringify(base)), ...patch });

describe('puzzle definition validation', () => {
  it('accepts every fixture, including JSON round-trip', () => {
    for (const f of ALL_FIXTURES) {
      const r = parsePuzzleDefinition(JSON.parse(JSON.stringify(f.definition)));
      expect(r.ok, f.name).toBe(true);
    }
  });

  it.each([
    ['wrong rowClues length', { rowClues: [1, 1, 0] }, /rowClues has 3/],
    ['clue totals disagree', { rowClues: [1, 1, 1, 0] }, /totals disagree/],
    ['clue exceeds line', { rows: 4, rowClues: [5, 0, 0, 0] }, /exceeds/],
    ['habitat out of bounds', { habitats: [{ row: 4, col: 0, habitat: 'tree' }] }, /out of bounds/],
    [
      'duplicate habitat',
      {
        habitats: [
          { row: 0, col: 3, habitat: 'tree' },
          { row: 0, col: 3, habitat: 'tree' },
        ],
      },
      /duplicate/,
    ],
    ['unknown habitat', { habitats: [{ row: 0, col: 3, habitat: 'lake' }] }, /unknown habitat/],
    ['unknown species', { population: { owl: 2 } }, /unknown species/],
    ['reserved species id', { population: { empty: 2 } }, /reserved/],
    ['unknown ruleset', { rulesetId: 'nope' }, /unknown rulesetId/],
    ['bad id slug', { id: 'Bad Id' }, /slug/],
    ['zero population', { population: { fox: 0 } }, /population/],
    ['unexpected key', { solution: [] }, /solution|Unrecognized/i],
    ['dimension too small', { rows: 2 }, /rows/],
    ['schema version', { schemaVersion: 2 }, /schemaVersion/],
  ])('rejects %s', (_name, patch, message) => {
    const r = parsePuzzleDefinition(mutate(patch));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.join('\n')).toMatch(message);
  });

  it('createPuzzle refuses invalid definitions instead of compiling them', () => {
    const r = createPuzzle({ ...base, rowClues: [9, 9, 9, 9] });
    expect(r.ok).toBe(false);
  });

  it('compiled puzzles are frozen', () => {
    const r = createPuzzle(base);
    if (!r.ok) throw new Error('expected ok');
    expect(Object.isFrozen(r.value)).toBe(true);
    expect(Object.isFrozen(r.value.constraints)).toBe(true);
  });
});
