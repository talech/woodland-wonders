import { type PuzzleDefinition, parsePuzzleDefinition } from '@ww/puzzle-core';

export interface CatalogIssue {
  readonly index: number;
  readonly id: string;
  readonly issues: readonly string[];
}

export interface Catalog {
  readonly puzzles: readonly PuzzleDefinition[];
  /** Entries rejected at load. Shipped content must have none (enforced by `content:validate`). */
  readonly rejected: readonly CatalogIssue[];
}

/** Validate raw catalog data at runtime. Invalid entries are dropped and reported, never thrown. */
export function loadCatalog(raw: unknown): Catalog {
  if (!Array.isArray(raw))
    return { puzzles: [], rejected: [{ index: -1, id: '(root)', issues: ['catalog must be an array'] }] };
  const puzzles: PuzzleDefinition[] = [];
  const rejected: CatalogIssue[] = [];
  const seen = new Set<string>();
  raw.forEach((entry: unknown, index) => {
    const result = parsePuzzleDefinition(entry);
    const id =
      typeof entry === 'object' && entry !== null && 'id' in entry
        ? String((entry as { id: unknown }).id)
        : '(unknown)';
    if (!result.ok) rejected.push({ index, id, issues: result.issues });
    else if (seen.has(result.value.id)) rejected.push({ index, id, issues: ['duplicate puzzle id'] });
    else {
      seen.add(result.value.id);
      puzzles.push(result.value);
    }
  });
  return { puzzles, rejected };
}
