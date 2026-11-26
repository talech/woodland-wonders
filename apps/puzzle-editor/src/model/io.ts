import { DEFAULT_TIER } from '@ww/puzzle-content';
import { type PuzzleDefinition, parsePuzzleDefinition, type Result } from '@ww/puzzle-core';
import { type CellContent, type EditorDocument, GRASS } from './document.ts';
import { validateDocument } from './validate.ts';

/**
 * Import a definition (untrusted JSON value). Definitions carry no solution, so the document shows
 * habitats and the imported clues; animals must be repainted.
 */
export function importDefinition(raw: unknown): Result<EditorDocument> {
  const parsed = parsePuzzleDefinition(raw);
  if (!parsed.ok) return parsed;
  return { ok: true, value: documentFromDefinition(parsed.value) };
}

export function importDefinitionJson(text: string): Result<EditorDocument> {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    return { ok: false, issues: [`invalid JSON: ${e instanceof Error ? e.message : String(e)}`] };
  }
  return importDefinition(raw);
}

export function documentFromDefinition(def: PuzzleDefinition): EditorDocument {
  const cells = new Array<CellContent>(def.rows * def.columns).fill(GRASS);
  for (const h of def.habitats) cells[h.row * def.columns + h.col] = { kind: 'habitat', habitat: h.habitat };
  return {
    id: def.id,
    revision: def.revision,
    tier: def.difficulty?.tier ?? DEFAULT_TIER,
    rulesetId: def.rulesetId,
    rows: def.rows,
    columns: def.columns,
    cells,
    clues: {
      mode: 'imported',
      rowClues: def.rowClues,
      columnClues: def.columnClues,
      population: def.population,
    },
    preserved: {
      ...(def.difficulty?.metrics ? { metrics: def.difficulty.metrics } : {}),
      ...(def.provenance ? { provenance: def.provenance } : {}),
    },
  };
}

/** Export the definition JSON (2-space). Fails if the derived definition is invalid. Never contains animals. */
export function exportDefinitionJson(doc: EditorDocument): Result<string> {
  const report = validateDocument(doc);
  if (report.definitionIssues.length > 0) return { ok: false, issues: report.definitionIssues };
  return { ok: true, value: `${JSON.stringify(report.definition, null, 2)}\n` };
}
