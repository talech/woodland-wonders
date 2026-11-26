/**
 * Deterministic propagation: repeatedly apply the first strategy (in canonical order) that yields a finding,
 * restarting from the first strategy after every step. No trial-and-error, look-ahead or search.
 */
import { type CellMark, evaluateBoard, isSolved, type Violation } from '@ww/puzzle-core';
import { rawDomains } from './domains.ts';
import { bitOf, cellParams, type SolverModel, singleValue } from './model.ts';
import { STRATEGY_ORDER } from './strategies/index.ts';
import type { Conflict, Strategy } from './strategies/strategy.ts';
import type { DeductionResult, DeductionStep, Premises, ValueSet } from './types.ts';

export type PropagationOutcome =
  | { readonly kind: 'stable' }
  | { readonly kind: 'conflict'; readonly conflict: Conflict };

export function strategiesUpTo(maxTier: number): readonly Strategy[] {
  return STRATEGY_ORDER.filter((s) => s.tier <= maxTier);
}

/** Apply a step's eliminations in place. Returns the first cell left without candidates, if any. */
export function applyStep(model: SolverModel, domains: ValueSet[], step: DeductionStep): number | null {
  let wiped: number | null = null;
  for (const e of step.eliminations) {
    let mask = 0;
    for (const v of e.values) mask |= bitOf(model, v);
    const next = (domains[e.cell] ?? 0) & ~mask;
    domains[e.cell] = next;
    if (next === 0 && wiped === null) wiped = e.cell;
  }
  return wiped;
}

function wipeoutConflict(model: SolverModel, cell: number, premises: Premises): Conflict {
  return {
    violation: {
      constraintId: `cell:${cell}`,
      kind: 'no-candidates',
      cells: [cell],
      data: cellParams(model, cell),
    },
    premises: { constraints: premises.constraints, cells: [cell] },
  };
}

/** Propagate to a fixpoint in place. `onStep` receives each applied step in order. */
export function propagate(
  model: SolverModel,
  domains: ValueSet[],
  strategies: readonly Strategy[],
  onStep?: (step: DeductionStep) => void,
): PropagationOutcome {
  for (;;) {
    let progressed = false;
    for (const strategy of strategies) {
      for (const finding of strategy.find({ model, domains })) {
        if (finding.kind === 'conflict') return finding;
        onStep?.(finding.step);
        const wiped = applyStep(model, domains, finding.step);
        if (wiped !== null)
          return { kind: 'conflict', conflict: wipeoutConflict(model, wiped, finding.step.premises) };
        progressed = true;
        break;
      }
      if (progressed) break;
    }
    if (!progressed) return { kind: 'stable' };
  }
}

/** Marks for a fully determined board, or null if some grass cell is still open. */
export function domainsToMarks(model: SolverModel, domains: readonly ValueSet[]): CellMark[] | null {
  const marks: CellMark[] = new Array<CellMark>(model.puzzle.cellCount).fill('unmarked');
  for (const cell of model.grass) {
    const v = singleValue(model, domains[cell] ?? 0);
    if (v === null) return null;
    marks[cell] = v;
  }
  return marks;
}

function contradiction(
  origin: 'marks' | 'deduction',
  steps: readonly DeductionStep[],
  violations: readonly Violation[],
  premises: Premises,
): DeductionResult {
  const [conflict] = violations;
  if (!conflict) throw new Error('contradiction without a violation');
  return { kind: 'contradiction', origin, steps, conflict, violations, premises };
}

/** Full deduction run from the player's marks (see `deduce`). */
export function runDeduction(
  model: SolverModel,
  marks: readonly CellMark[],
  strategies: readonly Strategy[],
): DeductionResult {
  const { puzzle } = model;
  const raw = rawDomains(model, marks);
  if (raw.invalid.length > 0) {
    const violations: Violation[] = raw.invalid.map((cell) => ({
      constraintId: `cell:${cell}`,
      kind: 'invalid-mark',
      cells: [cell],
      data: { ...cellParams(model, cell), mark: marks[cell] ?? '' },
    }));
    return contradiction('marks', [], violations, { constraints: [], cells: raw.invalid });
  }
  // Immediate contradictions in the player's own marks are judged by core (single source of truth).
  const local = evaluateBoard(puzzle, marks, 'partial').violations;
  if (local.length > 0)
    return contradiction('marks', [], local, {
      constraints: [...new Set(local.map((v) => v.constraintId))],
      cells: [...new Set(local.flatMap((v) => v.cells))].filter((c) => model.isGrass[c]),
    });

  const domains = raw.domains;
  const steps: DeductionStep[] = [];
  const outcome = propagate(model, domains, strategies, (s) => steps.push(s));
  if (outcome.kind === 'conflict')
    return contradiction('deduction', steps, [outcome.conflict.violation], outcome.conflict.premises);

  const solution = domainsToMarks(model, domains);
  if (solution === null) return { kind: 'stuck', steps, domains };
  if (isSolved(puzzle, solution)) return { kind: 'solved', steps, domains };
  // Fully determined yet rejected by core: only possible via constraints the solver does not model.
  const violations = evaluateBoard(puzzle, solution, 'complete').violations;
  return contradiction('deduction', steps, violations, {
    constraints: [...new Set(violations.map((v) => v.constraintId))],
    cells: model.grass,
  });
}
