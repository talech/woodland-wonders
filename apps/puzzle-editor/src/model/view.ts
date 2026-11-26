import type { CellIndex } from '@ww/puzzle-core';
import type { PuzzleAnalysis } from './analysis.ts';

/** What the panel currently shows on the grid. */
export type AnalysisView =
  | { readonly kind: 'none' }
  | { readonly kind: 'step'; readonly index: number }
  | { readonly kind: 'solution'; readonly which: number };

export interface CellOverlay {
  readonly cell: CellIndex;
  /** `premise`, `affected`, `differs` or `plain`. */
  readonly role: 'premise' | 'affected' | 'differs' | 'plain';
  /** Short text: candidate list for steps, species for solutions. */
  readonly text: string;
}

/** Map the panel selection to per-cell grid overlays. Pure. Empty array when nothing is selected. */
export function overlayFor(analysis: PuzzleAnalysis, view: AnalysisView, cellCount: number): CellOverlay[] {
  if (view.kind === 'step') {
    const step = analysis.trace[view.index];
    if (!step) return [];
    const premise = new Set(step.premiseCells);
    const affected = new Set(step.affectedCells);
    return Array.from({ length: cellCount }, (_, cell) => ({
      cell,
      role: affected.has(cell) ? 'affected' : premise.has(cell) ? 'premise' : 'plain',
      text: (step.domainsAfter[cell] ?? []).map((v) => (v === 'empty' ? '-' : v.charAt(0))).join(''),
    }));
  }
  if (view.kind === 'solution') {
    const sol = analysis.solutions[view.which];
    if (!sol) return [];
    const differs = new Set(analysis.differingCells);
    return sol.map((s, cell) => ({
      cell,
      role: differs.has(cell) ? 'differs' : 'plain',
      text: s ? s.charAt(0) : '',
    }));
  }
  return [];
}
