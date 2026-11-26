import {
  type CellMark,
  createPuzzle,
  evaluateBoard,
  type Puzzle,
  type PuzzleDefinition,
  parsePuzzleDefinition,
  type Violation,
} from '@ww/puzzle-core';
import { deriveDefinition } from './derive.ts';
import type { EditorDocument } from './document.ts';

export interface ValidationReport {
  readonly definition: PuzzleDefinition;
  /** Schema/semantic problems with the derived definition (core). Empty when the definition is valid. */
  readonly definitionIssues: readonly string[];
  /** Rule violations of the painted solution in `complete` mode. Empty when no puzzle could be built. */
  readonly violations: readonly Violation[];
  /** Violations grouped by cell index, for highlighting. */
  readonly violationsByCell: ReadonlyMap<number, readonly Violation[]>;
  /** True iff the definition is valid AND the painted animals solve it. */
  readonly solved: boolean;
  /** Compiled puzzle when the definition is valid. */
  readonly puzzle?: Puzzle;
}

export function marksFor(doc: EditorDocument): CellMark[] {
  return doc.cells.map((c): CellMark => (c.kind === 'animal' ? c.species : 'unmarked'));
}

export function validateDocument(doc: EditorDocument): ValidationReport {
  const definition = deriveDefinition(doc);
  // Round-trip through JSON so validation sees exactly what an export would contain.
  const parsed = parsePuzzleDefinition(JSON.parse(JSON.stringify(definition)));
  if (!parsed.ok) return fail(definition, parsed.issues);
  const compiled = createPuzzle(parsed.value);
  if (!compiled.ok) return fail(definition, compiled.issues);

  const evaluation = evaluateBoard(compiled.value, marksFor(doc), 'complete');
  const byCell = new Map<number, Violation[]>();
  for (const v of evaluation.violations)
    for (const cell of v.cells) byCell.set(cell, [...(byCell.get(cell) ?? []), v]);
  return {
    definition,
    definitionIssues: [],
    violations: evaluation.violations,
    violationsByCell: byCell,
    solved: evaluation.isSolved,
    puzzle: compiled.value,
  };
}

function fail(definition: PuzzleDefinition, issues: readonly string[]): ValidationReport {
  return { definition, definitionIssues: issues, violations: [], violationsByCell: new Map(), solved: false };
}

/** Human-readable one-liner for a violation (presentation only; rules live in core). */
export function describeViolation(v: Violation): string {
  const data = Object.entries(v.data)
    .map(([k, val]) => `${k}=${val}`)
    .join(', ');
  return `${v.constraintId}: ${v.kind}${data ? ` (${data})` : ''}`;
}
