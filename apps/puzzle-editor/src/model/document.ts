import {
  type DifficultyMetadata,
  type DifficultyTier,
  type HabitatId,
  MAX_DIMENSION,
  MIN_DIMENSION,
  type Provenance,
  type SpeciesId,
  WOODLAND_V1,
} from '@ww/puzzle-core';

export type CellContent =
  | { readonly kind: 'grass' }
  | { readonly kind: 'habitat'; readonly habitat: HabitatId }
  | { readonly kind: 'animal'; readonly species: SpeciesId };

export type Tool =
  | { readonly kind: 'erase' }
  | { readonly kind: 'habitat'; readonly habitat: HabitatId }
  | { readonly kind: 'species'; readonly species: SpeciesId };

/**
 * Where the clues come from. `derived` computes them from painted animals (the solution).
 * `imported` keeps the clues of an imported definition (which carries no solution) until the author
 * adopts the painted solution's clues.
 */
export type ClueSource =
  | { readonly mode: 'derived' }
  | {
      readonly mode: 'imported';
      readonly rowClues: readonly number[];
      readonly columnClues: readonly number[];
      readonly population: Readonly<Record<SpeciesId, number>>;
    };

/** Definition fields the editor does not edit but must not lose on import/export. */
export interface Preserved {
  readonly metrics?: DifficultyMetadata['metrics'];
  readonly provenance?: Provenance;
}

export interface EditorDocument {
  readonly id: string;
  readonly revision: number;
  readonly tier: DifficultyTier;
  readonly rulesetId: string;
  readonly rows: number;
  readonly columns: number;
  /** Row-major, `rows * columns` entries. */
  readonly cells: readonly CellContent[];
  readonly clues: ClueSource;
  readonly preserved: Preserved;
}

export const GRASS: CellContent = { kind: 'grass' };
export const TIERS: readonly DifficultyTier[] = ['tutorial', 'beginner', 'easy', 'intermediate', 'advanced'];

export function createDocument(rows = 5, columns = 5): EditorDocument {
  return {
    id: 'new-puzzle',
    revision: 1,
    tier: 'beginner',
    rulesetId: WOODLAND_V1.id,
    rows: clampDimension(rows),
    columns: clampDimension(columns),
    cells: new Array<CellContent>(clampDimension(rows) * clampDimension(columns)).fill(GRASS),
    clues: { mode: 'derived' },
    preserved: {},
  };
}

export function clampDimension(n: number): number {
  const v = Number.isFinite(n) ? Math.trunc(n) : MIN_DIMENSION;
  return Math.min(MAX_DIMENSION, Math.max(MIN_DIMENSION, v));
}

/** Resize, preserving in-bounds content. Imported clues no longer match, so clues become derived. */
export function resize(doc: EditorDocument, rows: number, columns: number): EditorDocument {
  const r = clampDimension(rows);
  const c = clampDimension(columns);
  if (r === doc.rows && c === doc.columns) return doc;
  const cells: CellContent[] = [];
  for (let row = 0; row < r; row++)
    for (let col = 0; col < c; col++)
      cells.push(row < doc.rows && col < doc.columns ? (doc.cells[row * doc.columns + col] ?? GRASS) : GRASS);
  return { ...doc, rows: r, columns: c, cells, clues: { mode: 'derived' } };
}

export function contentForTool(tool: Tool): CellContent {
  switch (tool.kind) {
    case 'erase':
      return GRASS;
    case 'habitat':
      return { kind: 'habitat', habitat: tool.habitat };
    case 'species':
      return { kind: 'animal', species: tool.species };
  }
}

function sameContent(a: CellContent, b: CellContent): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'habitat' && b.kind === 'habitat') return a.habitat === b.habitat;
  if (a.kind === 'animal' && b.kind === 'animal') return a.species === b.species;
  return true;
}

/** Paint one cell. Returns the same document when nothing changes or the cell is out of range. */
export function paint(doc: EditorDocument, cell: number, tool: Tool): EditorDocument {
  const current = doc.cells[cell];
  if (current === undefined) return doc;
  const next = contentForTool(tool);
  if (sameContent(current, next)) return doc;
  const cells = doc.cells.slice();
  cells[cell] = next;
  return { ...doc, cells };
}

/** Reset every cell to grass. */
export function clear(doc: EditorDocument): EditorDocument {
  return { ...doc, cells: doc.cells.map(() => GRASS) };
}

/** Remove animals only, keeping habitats. */
export function clearAnimals(doc: EditorDocument): EditorDocument {
  return { ...doc, cells: doc.cells.map((c) => (c.kind === 'animal' ? GRASS : c)) };
}

export function setMetadata(
  doc: EditorDocument,
  patch: Partial<Pick<EditorDocument, 'id' | 'revision' | 'tier'>>,
): EditorDocument {
  return { ...doc, ...patch };
}

/** Switch from imported clues to clues derived from the painted solution. */
export function adoptSolutionClues(doc: EditorDocument): EditorDocument {
  return doc.clues.mode === 'derived' ? doc : { ...doc, clues: { mode: 'derived' } };
}
