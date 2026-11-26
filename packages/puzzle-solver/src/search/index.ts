/**
 * @ww/puzzle-solver/search — exhaustive bounded search. Dev/offline only; never imported by the game
 * (ADR-0004).
 *
 * Depth-first search over candidate domains with sound propagation (all deduction strategies) for pruning.
 * Branching is deterministic: the open grass cell with the fewest candidates (lowest index on ties), values
 * in canonical order (empty, then ruleset species order). Every leaf is confirmed with core `isSolved`.
 * Stops at two solutions. A node is one propagation of a domain state (the root counts); exceeding
 * `nodeBudget` yields `unknown` (never publishable).
 */
import type { CellMark, Puzzle } from '@ww/puzzle-core';
import { isSolved } from '@ww/puzzle-core';
import { rawDomains } from '../domains.ts';
import { domainsToMarks, propagate } from '../engine.ts';
import { compileModel, popcount } from '../model.ts';
import { STRATEGY_ORDER } from '../strategies/index.ts';
import type { SearchOptions, SearchResult, ValueSet } from '../types.ts';

export type { SearchOptions, SearchResult } from '../types.ts';

export function search(puzzle: Puzzle, options: SearchOptions): SearchResult {
  const model = compileModel(puzzle);
  const marks = options.marks ?? new Array<CellMark>(puzzle.cellCount).fill('unmarked');
  const raw = rawDomains(model, marks);
  const solutions: CellMark[][] = [];
  let nodes = 0;
  let exhausted = false;
  if (raw.invalid.length > 0) return { kind: 'none', nodes };

  const visit = (domains: ValueSet[]): void => {
    if (nodes >= options.nodeBudget) {
      exhausted = true;
      return;
    }
    nodes++;
    if (propagate(model, domains, STRATEGY_ORDER).kind === 'conflict') return;
    let branch = -1;
    let size = Number.POSITIVE_INFINITY;
    for (const cell of model.grass) {
      const n = popcount(domains[cell] ?? 0);
      if (n > 1 && n < size) {
        size = n;
        branch = cell;
      }
    }
    if (branch < 0) {
      const solution = domainsToMarks(model, domains);
      if (solution && isSolved(puzzle, solution)) solutions.push(solution);
      return;
    }
    const d = domains[branch] ?? 0;
    for (let bit = 1; bit <= d; bit <<= 1) {
      if ((d & bit) === 0) continue;
      const child = domains.slice();
      child[branch] = bit;
      visit(child);
      if (exhausted || solutions.length >= 2) return;
    }
  };
  visit(raw.domains);

  const [first, second] = solutions;
  if (first && second) return { kind: 'multiple', solutions: [first, second], nodes };
  if (exhausted) return { kind: 'unknown', reason: 'budget', nodes };
  if (first) return { kind: 'unique', solution: first, nodes };
  return { kind: 'none', nodes };
}
