import {
  type CellMark,
  createPuzzle,
  type Puzzle,
  type PuzzleDefinition,
  type SpeciesId,
} from '@ww/puzzle-core';
import {
  analyzeDifficulty,
  createDomains,
  type DeductionStep,
  deduce,
  domainValues,
  type Explanation,
  type Tier,
  type Value,
} from '@ww/puzzle-solver';
import { search } from '@ww/puzzle-solver/search';
import type { AnalysisResult, AnalyzeOptions, PuzzleAnalyzer, TraceStep } from './analysis.ts';

export const DEFAULT_NODE_BUDGET = 20_000;
const TIERS: readonly Tier[] = [1, 2, 3, 4];

export function describeExplanation(e: Explanation): string {
  const name = e.key.replace(/^solver\./, '').replace(/-/g, ' ');
  const params = Object.entries(e.params)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');
  return params ? `${name} (${params})` : name;
}

/** Replay `steps` from the blank board, producing one display step with the domains after it. */
export function buildTrace(puzzle: Puzzle, steps: readonly DeductionStep[]): TraceStep[] {
  const blank = new Array<CellMark>(puzzle.cellCount).fill('unmarked');
  const values: readonly Value[] = ['empty', ...puzzle.species];
  const bits = createDomains(puzzle, blank).slice();
  return steps.map((step, index) => {
    for (const el of step.eliminations)
      for (const v of el.values) bits[el.cell] = (bits[el.cell] ?? 0) & ~(1 << values.indexOf(v));
    return {
      index,
      strategy: step.strategy,
      tier: step.tier,
      explanation: describeExplanation(step.explanation),
      eliminations: step.eliminations.map((el) => {
        const row = Math.floor(el.cell / puzzle.columns);
        return `(${row},${el.cell % puzzle.columns}): ${el.values.join(', ')}`;
      }),
      premiseCells: step.premises.cells,
      affectedCells: step.eliminations.map((el) => el.cell),
      domainsAfter: bits.map((b) => domainValues(puzzle, b)),
    };
  });
}

const animalsOf = (marks: readonly CellMark[]): (SpeciesId | null)[] =>
  marks.map((m) => (m === 'unmarked' || m === 'empty' ? null : m));

/** Analyze a definition with the solver (deduction) and bounded search (uniqueness). Dev-only. */
export const analyzeDefinition: PuzzleAnalyzer = (
  definition: PuzzleDefinition,
  options: AnalyzeOptions = {},
): AnalysisResult => {
  const compiled = createPuzzle(definition);
  if (!compiled.ok) return { ok: false, issues: compiled.issues };
  const puzzle = compiled.value;
  const blank = new Array<CellMark>(puzzle.cellCount).fill('unmarked');

  const found = search(puzzle, { nodeBudget: options.nodeBudget ?? DEFAULT_NODE_BUDGET });
  const full = deduce(puzzle, blank);
  const requiredTier = TIERS.find((t) => deduce(puzzle, blank, { maxTier: t }).kind === 'solved') ?? null;

  const solutions =
    found.kind === 'unique'
      ? [animalsOf(found.solution)]
      : found.kind === 'multiple'
        ? found.solutions.map(animalsOf)
        : [];
  const [a, b] = solutions;
  const differingCells = a && b ? a.flatMap((v, i) => (v !== b[i] ? [i] : [])) : [];

  let reason: string;
  if (found.kind === 'none') reason = 'no solution';
  else if (found.kind === 'multiple') reason = 'multiple solutions';
  else if (found.kind === 'unknown')
    reason = `uniqueness unknown (search budget exhausted after ${found.nodes} nodes)`;
  else if (full.kind === 'stuck') reason = 'unique, but deduction gets stuck (would need guessing)';
  else if (full.kind === 'contradiction') reason = 'unique, but deduction reports a contradiction';
  else reason = 'unique and solvable by deduction';

  return {
    ok: true,
    analysis: {
      solutionCount:
        found.kind === 'none'
          ? 'zero'
          : found.kind === 'unique'
            ? 'one'
            : found.kind === 'multiple'
              ? 'multiple'
              : 'unknown',
      nodes: found.nodes,
      solutions,
      differingCells,
      deduction: full.kind,
      trace: buildTrace(puzzle, full.steps),
      metrics: analyzeDifficulty(full.steps),
      requiredTier,
      verdict: { publishable: found.kind === 'unique' && full.kind === 'solved', reason },
    },
  };
};
