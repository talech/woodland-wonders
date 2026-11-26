import { type PuzzleDefinition, SCHEMA_VERSION, type SpeciesId, WOODLAND_V1 } from '@ww/puzzle-core';
import type { EditorDocument } from './document.ts';

/** Clues derived from the painted animals. */
export function solutionClues(doc: EditorDocument): {
  rowClues: number[];
  columnClues: number[];
  population: Record<SpeciesId, number>;
} {
  const rowClues = new Array<number>(doc.rows).fill(0);
  const columnClues = new Array<number>(doc.columns).fill(0);
  const counts = new Map<SpeciesId, number>();
  doc.cells.forEach((cell, i) => {
    if (cell.kind !== 'animal') return;
    const row = Math.floor(i / doc.columns);
    const col = i % doc.columns;
    rowClues[row] = (rowClues[row] ?? 0) + 1;
    columnClues[col] = (columnClues[col] ?? 0) + 1;
    counts.set(cell.species, (counts.get(cell.species) ?? 0) + 1);
  });
  const population: Record<SpeciesId, number> = {};
  // Canonical ruleset order keeps output deterministic.
  for (const s of WOODLAND_V1.species) {
    const n = counts.get(s.id);
    if (n !== undefined) population[s.id] = n;
  }
  return { rowClues, columnClues, population };
}

/** The clues the definition will carry (imported ones if the document still holds them). */
export function effectiveClues(doc: EditorDocument) {
  return doc.clues.mode === 'imported'
    ? {
        rowClues: [...doc.clues.rowClues],
        columnClues: [...doc.clues.columnClues],
        population: { ...doc.clues.population },
      }
    : solutionClues(doc);
}

/** Derive a definition. It never contains the solution (animal positions). */
export function deriveDefinition(doc: EditorDocument): PuzzleDefinition {
  const habitats = doc.cells.flatMap((cell, i) =>
    cell.kind === 'habitat'
      ? [{ row: Math.floor(i / doc.columns), col: i % doc.columns, habitat: cell.habitat }]
      : [],
  );
  const { rowClues, columnClues, population } = effectiveClues(doc);
  const { metrics } = doc.preserved;
  return {
    schemaVersion: SCHEMA_VERSION,
    id: doc.id,
    revision: doc.revision,
    rulesetId: doc.rulesetId,
    rows: doc.rows,
    columns: doc.columns,
    habitats,
    rowClues,
    columnClues,
    population,
    difficulty: metrics ? { tier: doc.tier, metrics } : { tier: doc.tier },
    ...(doc.preserved.provenance ? { provenance: doc.preserved.provenance } : {}),
  };
}
