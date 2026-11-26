import { CATALOG } from '@ww/puzzle-content';
import type { PuzzleDefinition } from '@ww/puzzle-core';
import { describe, expect, it } from 'vitest';
import {
  adoptSolutionClues,
  canRedo,
  canUndo,
  clear,
  clearAnimals,
  commit,
  createDocument,
  createHistory,
  deriveDefinition,
  type EditorDocument,
  exportDefinitionJson,
  importDefinition,
  importDefinitionJson,
  paint,
  redo,
  resize,
  setMetadata,
  type Tool,
  undo,
  validateDocument,
} from '../src/model/index.ts';

const fox: Tool = { kind: 'species', species: 'fox' };
const tree: Tool = { kind: 'habitat', habitat: 'tree' };
const erase: Tool = { kind: 'erase' };

/** 4x4: trees at (0,3),(1,1),(1,3); foxes at (0,2) and (2,1). */
function sampleDoc(): EditorDocument {
  let d = createDocument(4, 4);
  d = paint(d, 3, tree); // (0,3)
  d = paint(d, 5, tree); // (1,1)
  d = paint(d, 7, tree); // (1,3)
  d = paint(d, 2, fox); // (0,2) next to tree (0,3)
  d = paint(d, 9, fox); // (2,1) next to tree (1,1)
  return setMetadata(d, { id: 'sample-001' });
}

describe('document ops', () => {
  it('enforces dimension bounds and paints cells', () => {
    expect(createDocument(1, 99)).toMatchObject({ rows: 3, columns: 10 });
    let d = createDocument(3, 3);
    d = paint(d, 4, tree);
    expect(d.cells[4]).toEqual({ kind: 'habitat', habitat: 'tree' });
    d = paint(d, 4, fox);
    expect(d.cells[4]).toEqual({ kind: 'animal', species: 'fox' });
    d = paint(d, 4, erase);
    expect(d.cells[4]).toEqual({ kind: 'grass' });
    expect(paint(d, 99, fox)).toBe(d);
    expect(paint(d, 4, erase)).toBe(d);
  });

  it('resize preserves in-bounds content and keeps the grid rectangular', () => {
    const d = sampleDoc();
    const bigger = resize(d, 5, 6);
    expect(bigger.cells).toHaveLength(30);
    expect(bigger.cells[2]).toEqual({ kind: 'animal', species: 'fox' });
    expect(bigger.cells[1 * 6 + 3]).toEqual({ kind: 'habitat', habitat: 'tree' });
    expect(bigger.cells[4 * 6 + 5]).toEqual({ kind: 'grass' });
    const smaller = resize(bigger, 3, 3);
    expect(smaller.cells).toHaveLength(9);
    expect(smaller.cells[2]).toEqual({ kind: 'animal', species: 'fox' });
    expect(resize(d, 4, 4)).toBe(d);
  });

  it('clear and clearAnimals', () => {
    const d = sampleDoc();
    expect(clear(d).cells.every((c) => c.kind === 'grass')).toBe(true);
    const ca = clearAnimals(d);
    expect(ca.cells.filter((c) => c.kind === 'habitat')).toHaveLength(3);
    expect(ca.cells.filter((c) => c.kind === 'animal')).toHaveLength(0);
  });
});

describe('derive and validate', () => {
  it('derives clues, population and habitats', () => {
    const def = deriveDefinition(sampleDoc());
    expect(def.rowClues).toEqual([1, 0, 1, 0]);
    expect(def.columnClues).toEqual([0, 1, 1, 0]);
    expect(def.population).toEqual({ fox: 2 });
    expect(def.habitats).toEqual([
      { row: 0, col: 3, habitat: 'tree' },
      { row: 1, col: 1, habitat: 'tree' },
      { row: 1, col: 3, habitat: 'tree' },
    ]);
    expect(def.difficulty).toEqual({ tier: 'beginner' });
  });

  it('accepts a correct solution', () => {
    const r = validateDocument(sampleDoc());
    expect(r.definitionIssues).toEqual([]);
    expect(r.violations).toEqual([]);
    expect(r.solved).toBe(true);
  });

  it('reports definition issues when no animals are painted', () => {
    const r = validateDocument(clearAnimals(sampleDoc()));
    expect(r.definitionIssues.length).toBeGreaterThan(0);
    expect(r.solved).toBe(false);
  });

  it('rejects bad ids via core', () => {
    const r = validateDocument(setMetadata(sampleDoc(), { id: 'Bad Id' }));
    expect(r.definitionIssues.join()).toMatch(/id/);
  });

  it('surfaces violations per cell', () => {
    const d = paint(sampleDoc(), 10, fox); // (2,2) touches fox at (2,1), no tree adjacent... but clues derived
    const r = validateDocument(d);
    expect(r.definitionIssues).toEqual([]);
    expect(r.solved).toBe(false);
    const touching = r.violations.filter((v) => v.kind === 'same-species-touching');
    expect(touching.length).toBeGreaterThan(0);
    expect(r.violationsByCell.has(9)).toBe(true);
    expect(r.violationsByCell.has(10)).toBe(true);
    const missing = r.violations.filter((v) => v.kind === 'missing-habitat');
    expect(missing.flatMap((v) => v.cells)).toContain(10);
  });

  it('checks painted animals against imported clues', () => {
    const imported = importDefinition(JSON.parse(JSON.stringify(deriveDefinition(sampleDoc()))));
    if (!imported.ok) throw new Error('import failed');
    let d = imported.value;
    expect(validateDocument(d).definitionIssues).toEqual([]);
    expect(validateDocument(d).solved).toBe(false);
    d = paint(paint(d, 2, fox), 9, fox);
    expect(validateDocument(d).solved).toBe(true);
    d = paint(d, 9, erase);
    d = paint(d, 12, fox);
    const r = validateDocument(d);
    expect(r.solved).toBe(false);
    expect(r.violations.length).toBeGreaterThan(0);
    // adopting solution clues switches the clue source
    expect(deriveDefinition(adoptSolutionClues(d)).rowClues).toEqual([1, 0, 0, 1]);
  });
});

describe('import / export', () => {
  it('round-trips every catalog puzzle without solution data', () => {
    for (const def of CATALOG.puzzles) {
      const imp = importDefinition(def);
      if (!imp.ok) throw new Error(`import ${def.id}: ${imp.issues.join()}`);
      expect(imp.value.cells.some((c) => c.kind === 'animal')).toBe(false);
      const out = exportDefinitionJson(imp.value);
      if (!out.ok) throw new Error(`export ${def.id}: ${out.issues.join()}`);
      expect(JSON.parse(out.value)).toEqual(def);
      expect(out.value).not.toMatch(/animal|solution/);
    }
  });

  it('preserves metrics and provenance', () => {
    const def: PuzzleDefinition = {
      ...(CATALOG.puzzles[0] as PuzzleDefinition),
      difficulty: { tier: 'easy', metrics: { steps: 3 } },
      provenance: { generatorVersion: '1', seed: 'abc' },
    };
    const imp = importDefinition(def);
    if (!imp.ok) throw new Error('import');
    const out = exportDefinitionJson(imp.value);
    if (!out.ok) throw new Error('export');
    expect(JSON.parse(out.value)).toEqual(def);
  });

  it('exported definitions from a painted document omit the solution', () => {
    const out = exportDefinitionJson(sampleDoc());
    if (!out.ok) throw new Error('export');
    const parsed: Record<string, unknown> = JSON.parse(out.value);
    expect(Object.keys(parsed).sort()).toEqual(
      [
        'columnClues',
        'columns',
        'difficulty',
        'habitats',
        'id',
        'population',
        'revision',
        'rowClues',
        'rows',
        'rulesetId',
        'schemaVersion',
      ].sort(),
    );
    expect(out.value.endsWith('\n')).toBe(true);
  });

  it('rejects invalid JSON and invalid definitions', () => {
    expect(importDefinitionJson('{nope').ok).toBe(false);
    expect(importDefinitionJson('{"id":"x"}').ok).toBe(false);
    expect(exportDefinitionJson(createDocument()).ok).toBe(false);
  });
});

describe('history', () => {
  it('supports undo and redo, and clears redo on new edits', () => {
    let h = createHistory(createDocument(3, 3));
    expect(canUndo(h)).toBe(false);
    h = commit(h, paint(h.present, 0, tree));
    h = commit(h, paint(h.present, 1, fox));
    expect(commit(h, h.present)).toBe(h);
    h = undo(h);
    expect(h.present.cells[1]).toEqual({ kind: 'grass' });
    expect(canRedo(h)).toBe(true);
    h = redo(h);
    expect(h.present.cells[1]).toEqual({ kind: 'animal', species: 'fox' });
    h = undo(undo(h));
    h = commit(h, paint(h.present, 2, tree));
    expect(canRedo(h)).toBe(false);
    expect(h.past).toHaveLength(1);
    expect(undo(createHistory(1))).toEqual(createHistory(1));
    expect(redo(createHistory(1))).toEqual(createHistory(1));
  });
});
