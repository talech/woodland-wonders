/**
 * English hint text (ADR-0008 P4). Every solver strategy has a plain-words name and an explanation template
 * for its `solver.<strategy>` key + params; `test/hint-text.test.ts` fails if a strategy ships without one.
 * Rows/columns are 1-based; species and habitat names come from presentation config.
 */
import type { CellIndex, ConstraintId, Puzzle, Violation } from '@ww/puzzle-core';
import type { Conclusion, DeductionStep, StrategyId } from '@ww/puzzle-solver';
import { habitatArt, speciesInfo } from './presentation.ts';
import type { HintState } from './session.ts';

type Params = DeductionStep['explanation']['params'];

const lower = (s: string) => s.toLocaleLowerCase('en');
const singular = (id: string) => lower(speciesInfo(id).name);
const plural = (id: string) => lower(speciesInfo(id).plural);
const habitatName = (id: string) => lower(habitatArt(id).name);

function num(params: Params, key: string): number {
  const v = params[key];
  return typeof v === 'number' ? v : Number(v ?? Number.NaN);
}

function str(params: Params, key: string): string {
  const v = params[key];
  return v === undefined ? '' : String(v);
}

export function joinList(items: readonly string[], conj: 'and' | 'or'): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} ${conj} ${items.at(-1) ?? ''}`;
}

function cap(s: string): string {
  return s.length === 0 ? s : `${s[0]?.toUpperCase() ?? ''}${s.slice(1)}`;
}

function cellText(puzzle: Puzzle, cell: CellIndex): string {
  return `row ${Math.floor(cell / puzzle.columns) + 1}, column ${(cell % puzzle.columns) + 1}`;
}

function lineText(params: Params): string {
  return `${str(params, 'line') === 'column' ? 'column' : 'row'} ${num(params, 'index') + 1}`;
}

function animals(n: number): string {
  return n === 1 ? '1 animal' : `${n} animals`;
}

function countOf(id: string, n: number): string {
  return n === 1 ? `1 ${singular(id)}` : `${n} ${plural(id)}`;
}

function acceptedHabitats(puzzle: Puzzle, species: string): readonly string[] {
  return puzzle.ruleset.species.find((s) => s.id === species)?.habitats ?? [];
}

/** Species ids removed by a step (empty is not a species). */
function eliminatedSpecies(step: DeductionStep): string[] {
  const out = new Set<string>();
  for (const e of step.eliminations) for (const v of e.values) if (v !== 'empty') out.add(v);
  return [...out];
}

function groupSpecies(params: Params): string[] {
  return str(params, 'species')
    .split(',')
    .filter((s) => s !== '');
}

export interface ExplainContext {
  readonly puzzle: Puzzle;
}

type Explainer = (step: DeductionStep, ctx: ExplainContext) => string;

/** Plain-words strategy names shown at hint stage 1. */
export const STRATEGY_NAMES: Readonly<Record<StrategyId, string>> = {
  'no-habitat': 'Every animal needs its home right next door',
  'neighbour-exclusion': 'Animals of the same kind never touch',
  'line-saturated': 'This line already has all its animals',
  'line-forced': 'This line needs every spot it has left',
  'species-exhausted': 'All of these animals are already placed',
  'species-forced': 'These animals have just enough room',
  'species-group': 'Count two kinds of animal together',
  'line-pointing': 'Where this line’s animals have to go',
  'line-capacity': 'A tight squeeze along this line',
  'species-capacity': 'Room for every animal, but only just',
};

/** Explanation templates, one per strategy (`solver.<strategy>`, plus key variants where the solver has them). */
export const EXPLAINERS: Readonly<Record<StrategyId, Explainer>> = {
  'no-habitat': (step, { puzzle }) => {
    const cell = num(step.explanation.params, 'cell');
    const species = eliminatedSpecies(step);
    const habitats = [...new Set(species.flatMap((s) => acceptedHabitats(puzzle, s)))].map(habitatName);
    const who = joinList(
      species.map((s) => `a ${singular(s)}`),
      'or',
    );
    return `${cap(cellText(puzzle, cell))} isn’t next to a ${joinList(habitats, 'or')}, so ${who} can’t live there.`;
  },
  'neighbour-exclusion': (step, { puzzle }) => {
    const p = step.explanation.params;
    const s = str(p, 'species');
    return `There’s a ${singular(s)} at ${cellText(puzzle, num(p, 'cell'))}. ${cap(plural(s))} never touch, not even corner to corner, so the cells around it can’t hold another ${singular(s)}.`;
  },
  'line-saturated': (step) => {
    const p = step.explanation.params;
    return `${cap(lineText(p))} needs ${animals(num(p, 'target'))} and already has them, so every other cell in ${lineText(p)} is empty.`;
  },
  'line-forced': (step) => {
    const p = step.explanation.params;
    const t = num(p, 'target');
    return `${cap(lineText(p))} needs ${animals(t)}, and only ${t} ${t === 1 ? 'cell' : 'cells'} there could still hold one, so ${t === 1 ? 'that cell holds' : 'each of them holds'} an animal.`;
  },
  'species-exhausted': (step) => {
    const p = step.explanation.params;
    const s = str(p, 'species');
    const t = num(p, 'target');
    return `The puzzle has ${countOf(s, t)}, and ${t === 1 ? 'it is' : 'they are all'} already placed, so no other cell can hold a ${singular(s)}.`;
  },
  'species-forced': (step) => {
    const p = step.explanation.params;
    const s = str(p, 'species');
    const t = num(p, 'target');
    return `The puzzle has ${countOf(s, t)}, and only ${t} ${t === 1 ? 'cell' : 'cells'} could still hold one, so ${t === 1 ? 'that cell is' : 'each of them is'} a ${singular(s)}.`;
  },
  'species-group': (step) => {
    const p = step.explanation.params;
    const group = groupSpecies(p);
    const names = joinList(group.map(plural), 'and');
    const either = joinList(
      group.map((s) => `a ${singular(s)}`),
      'or',
    );
    const t = num(p, 'target');
    return step.explanation.key.endsWith('.forced')
      ? `Together there are ${t} ${names}, and only ${t} cells could still hold ${either}, so each of those cells holds ${either}.`
      : `Together there are ${t} ${names}, and ${t} cells already certainly hold ${either}, so no other cell can hold ${either}.`;
  },
  'line-pointing': (step) => {
    const p = step.explanation.params;
    const s = str(p, 'species');
    const m = num(p, 'minimum');
    return `${cap(lineText(p))} must hold at least ${countOf(s, m)}, and every place ${m === 1 ? 'it' : 'they'} could go touches the same neighbouring cells. ${cap(plural(s))} never touch, so those cells can’t hold a ${singular(s)}.`;
  },
  'line-capacity': (step) => {
    const p = step.explanation.params;
    return `${cap(lineText(p))} needs ${animals(num(p, 'target'))}. Where only one kind of animal fits, neighbours can’t both hold it, so the open stretches of ${lineText(p)} have only just enough room: each must be filled as tightly as possible.`;
  },
  'species-capacity': (step) => {
    const p = step.explanation.params;
    const s = str(p, 'species');
    const k = num(p, 'regions');
    return `${cap(plural(s))} never touch, so each 2×2 patch holds at most one ${singular(s)}. All the places a ${singular(s)} could go fit into ${k} such ${k === 1 ? 'patch' : 'patches'}, one for each ${singular(s)}, so every patch holds exactly one.`;
  },
};

/** True when `id` has both a name and an explanation template. */
export function hasTemplate(id: string): boolean {
  return Object.hasOwn(EXPLAINERS, id) && Object.hasOwn(STRATEGY_NAMES, id);
}

export function explainStep(step: DeductionStep, ctx: ExplainContext): string {
  return Object.hasOwn(EXPLAINERS, step.strategy)
    ? EXPLAINERS[step.strategy](step, ctx)
    : 'A careful deduction rules out some options here.';
}

/** Where to look, from the concluding step's params: "Look at row 3", "Think about the foxes", … */
export function focusText(step: DeductionStep, puzzle: Puzzle): string {
  const p = step.explanation.params;
  if (p.line !== undefined) return `Look at ${lineText(p)}`;
  if (p.cell !== undefined) return `Look around ${cellText(puzzle, num(p, 'cell'))}`;
  const group = groupSpecies(p);
  if (group.length > 0) return `Think about the ${joinList(group.map(plural), 'and')}`;
  return 'Look at the highlighted cells';
}

export function conclusionText(conclusion: Conclusion, puzzle: Puzzle): string {
  const where = cellText(puzzle, conclusion.cell);
  return conclusion.value === 'empty'
    ? `So ${where} must be empty.`
    : `So ${where} must be a ${singular(conclusion.value)}.`;
}

function lineFromConstraint(id: ConstraintId): string | null {
  const m = /^(row|column):(\d+)$/.exec(id);
  return m ? `${m[1]} ${Number(m[2]) + 1}` : null;
}

/** A gentle sentence for a broken rule. */
export function violationText(v: Violation, puzzle: Puzzle): string {
  const line = lineFromConstraint(v.constraintId);
  const species = v.constraintId.startsWith('species:') ? v.constraintId.slice('species:'.length) : null;
  switch (v.kind) {
    case 'same-species-touching': {
      const s = str(v.data, 'species');
      return `Two ${plural(s)} are touching: ${joinList(
        v.cells.map((c) => cellText(puzzle, c)),
        'and',
      )}.`;
    }
    case 'missing-habitat': {
      const s = str(v.data, 'species');
      const homes = str(v.data, 'habitats').split(',').filter(Boolean).map(habitatName);
      const cell = v.cells[0];
      const at = cell === undefined ? '' : ` at ${cellText(puzzle, cell)}`;
      return `The ${singular(s)}${at} has no ${joinList(homes, 'or')} next to it.`;
    }
    case 'count-over':
      if (line) return `${cap(line)} has more animals than its clue.`;
      if (species) return `There are more ${plural(species)} than the puzzle needs.`;
      break;
    case 'count-under':
    case 'count-unreachable':
      if (line) return `${cap(line)} can’t reach its clue any more.`;
      if (species) return `There’s no longer room for all the ${plural(species)}.`;
      break;
  }
  return 'Two of the rules can’t both be met here.';
}

export const HINT_A11Y = {
  region: 'Part of the current hint',
  focus: 'The cell this hint is about',
} as const;

export type HintActionId = 'reveal' | 'apply' | 'rewind' | 'confirm-rewind' | 'cancel-rewind';

export interface HintAction {
  readonly id: HintActionId;
  readonly label: string;
  readonly primary: boolean;
}

export interface HintDescription {
  readonly tone: 'hint' | 'conflict' | 'info';
  readonly title: string;
  readonly body: readonly string[];
  readonly steps: readonly string[];
  readonly conclusion: string | null;
  readonly actions: readonly HintAction[];
  /** Cells to highlight; the focus cell (if any) is the one the hint concludes about. */
  readonly region: ReadonlySet<CellIndex>;
  readonly focus: CellIndex | null;
  /** Constraint ids (e.g. `row:2`) to highlight on clues. */
  readonly constraints: ReadonlySet<ConstraintId>;
  /** Short text for screen-reader announcement. */
  readonly announcement: string;
}

function moves(n: number): string {
  return n === 1 ? '1 move' : `${n} moves`;
}

export function describeHint(hint: HintState, puzzle: Puzzle): HintDescription {
  const ctx: ExplainContext = { puzzle };
  const none = { steps: [], conclusion: null, actions: [], region: new Set<CellIndex>(), focus: null };
  switch (hint.kind) {
    case 'solved':
      return {
        ...none,
        tone: 'info',
        title: 'All done!',
        body: ['Every rule is met. Lovely work!'],
        constraints: new Set(),
        announcement: 'Hint: all done. Every rule is met.',
      };
    case 'stuck':
      return {
        ...none,
        tone: 'info',
        title: 'No clear step',
        body: [
          'I can’t find a step I can explain from this board, and I won’t guess.',
          'Nothing is broken yet. Try a cell you’re sure about, or look at the clues again.',
        ],
        constraints: new Set(),
        announcement: 'Hint: no clear step from this board.',
      };
    case 'deduction': {
      const last = hint.steps.at(-1);
      const region = new Set<CellIndex>(hint.steps.flatMap((s) => s.premises.cells));
      region.add(hint.conclusion.cell);
      const constraints = new Set(hint.steps.flatMap((s) => s.premises.constraints));
      const focus = last ? focusText(last, puzzle) : 'Look at the highlighted cells';
      const idea = last ? STRATEGY_NAMES[last.strategy] : '';
      if (hint.stage === 1) {
        return {
          tone: 'hint',
          title: `${focus}.`,
          body: idea ? [`Idea: ${idea}.`, 'The highlighted cells hold the reason.'] : [],
          steps: [],
          conclusion: null,
          actions: [{ id: 'reveal', label: 'Show me', primary: true }],
          region,
          focus: hint.conclusion.cell,
          constraints,
          announcement: `Hint: ${focus}. ${idea}.`,
        };
      }
      const conclusion = conclusionText(hint.conclusion, puzzle);
      return {
        tone: 'hint',
        title: `${focus}.`,
        body: hint.steps.length > 1 ? ['Here’s the reasoning, step by step:'] : [],
        steps: hint.steps.map((s) => explainStep(s, ctx)),
        conclusion,
        actions: [{ id: 'apply', label: 'Apply', primary: true }],
        region,
        focus: hint.conclusion.cell,
        constraints,
        announcement: `Hint explained. ${conclusion}`,
      };
    }
    case 'contradiction': {
      const c = hint.hint;
      const region = new Set<CellIndex>([
        ...c.violations.flatMap((v) => v.cells),
        ...c.steps.flatMap((s) => s.premises.cells),
      ]);
      const constraints = new Set<ConstraintId>([
        ...c.violations.map((v) => v.constraintId),
        ...c.steps.flatMap((s) => s.premises.constraints),
      ]);
      const body: string[] =
        c.origin === 'marks'
          ? [
              'One of the rules is already broken, so the puzzle can’t be finished from this board.',
              violationText(c.conflict, puzzle),
              'The cells with a ! badge show what’s wrong.',
            ]
          : [
              'Nothing breaks a rule yet, but this board can’t be finished from here.',
              `Following the clues leads to a dead end. ${violationText(c.conflict, puzzle)}`,
            ];
      const actions: HintAction[] = [];
      if (hint.rewind === null) {
        body.push('Undoing won’t reach a workable board. Try clearing a few marks instead.');
      } else if (hint.confirming) {
        body.push(`Go back ${moves(hint.rewind)}? You can redo them afterwards.`);
        actions.push(
          { id: 'confirm-rewind', label: `Yes, go back ${moves(hint.rewind)}`, primary: true },
          { id: 'cancel-rewind', label: 'Keep this board', primary: false },
        );
      } else {
        body.push(`Your last workable board was ${moves(hint.rewind)} ago.`);
        actions.push({
          id: 'rewind',
          label: `Go back ${moves(hint.rewind)}`,
          primary: true,
        });
      }
      return {
        tone: 'conflict',
        title: 'Something doesn’t fit',
        body,
        steps: c.steps.map((s) => explainStep(s, ctx)),
        conclusion: null,
        actions,
        region,
        focus: null,
        constraints,
        announcement: `Hint: something doesn’t fit. ${body[1] ?? ''}`,
      };
    }
  }
}
