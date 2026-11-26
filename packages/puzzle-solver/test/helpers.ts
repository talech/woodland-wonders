/** Hand-built board helpers for strategy unit tests. */
import { type CellMark, createPuzzleOrThrow, type Puzzle, toIndex } from '@ww/puzzle-core';
import { fromAscii, marksFromAscii } from '@ww/puzzle-core/testing';
import { initialDomains, rawDomains } from '../src/domains.ts';
import { bitOf, compileModel, type SolverModel } from '../src/model.ts';
import type { Finding, Strategy } from '../src/strategies/strategy.ts';
import type { DeductionStep, Value, ValueSet } from '../src/types.ts';

export interface Board {
  readonly puzzle: Puzzle;
  readonly model: SolverModel;
  readonly solution: readonly CellMark[];
  /** Cell index for (row, col). */
  at(row: number, col: number): number;
  /** Bitset for values. */
  set(...values: Value[]): ValueSet;
}

/** A puzzle whose clues are derived from the solved ASCII grid (core `fromAscii`). */
export function board(grid: readonly string[]): Board {
  const { definition, solution } = fromAscii(grid, { id: 'unit' });
  const puzzle = createPuzzleOrThrow(definition);
  const model = compileModel(puzzle);
  return {
    puzzle,
    model,
    solution,
    at: (row, col) => toIndex(puzzle.columns, row, col),
    set: (...values) => values.reduce((m, v) => m | bitOf(model, v), 0),
  };
}

/** Domains from ASCII marks; `pruned` applies the initial habitat pruning (createDomains semantics). */
export function domainsFor(b: Board, marks: readonly string[] | null, pruned = true): ValueSet[] {
  const m: CellMark[] = marks
    ? marksFromAscii(b.puzzle, marks)
    : new Array(b.puzzle.cellCount).fill('unmarked');
  return pruned ? initialDomains(b.model, m) : rawDomains(b.model, m).domains;
}

export function findings(strategy: Strategy, b: Board, domains: readonly ValueSet[]): Finding[] {
  return [...strategy.find({ model: b.model, domains })];
}

export function steps(strategy: Strategy, b: Board, domains: readonly ValueSet[]): DeductionStep[] {
  return findings(strategy, b, domains).flatMap((f) => (f.kind === 'step' ? [f.step] : []));
}

/** Eliminations as a compact `cell:values` map for assertions. */
export function elim(step: DeductionStep | undefined): Record<number, string> {
  const out: Record<number, string> = {};
  for (const e of step?.eliminations ?? []) out[e.cell] = e.values.join(',');
  return out;
}
