/** English UI strings and accessibility labels. Kept in one module so localization can replace it later. */
import type { CellView, CountStatus } from '@ww/puzzle-core';
import { habitatArt, speciesInfo } from './presentation.ts';

/** Non-blocking cell issues derived from core violations. */
export type CellIssue =
  | { readonly kind: 'touching'; readonly speciesName: string }
  | { readonly kind: 'missing-habitat'; readonly habitatNames: readonly string[] };

const lower = (s: string) => s.toLocaleLowerCase('en');

function joinOr(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} or ${items.at(-1) ?? ''}`;
}

export function issueText(issue: CellIssue): string {
  return issue.kind === 'touching'
    ? `touching another ${lower(issue.speciesName)}`
    : `needs a ${joinOr(issue.habitatNames.map(lower))} directly beside it`;
}

/** e.g. "Row 2, column 3: fox", "… : empty", "… : unmarked", "… : tree (habitat)". Rows/columns are 1-based. */
export function cellLabel(
  row: number,
  col: number,
  view: CellView,
  names: { species: (id: string) => string; habitat: (id: string) => string },
  issues: readonly CellIssue[] = [],
): string {
  let what: string;
  switch (view.kind) {
    case 'habitat':
      what = `${lower(names.habitat(view.habitat))} (habitat)`;
      break;
    case 'animal':
      what = lower(names.species(view.species));
      break;
    default:
      what = view.kind;
  }
  const base = `Row ${row + 1}, column ${col + 1}: ${what}`;
  return issues.length === 0 ? base : `${base}, ${issues.map(issueText).join(', ')}`;
}

/** Short words for a violated count, or null. "Unreachable" means too few open cells remain. */
export function countProblem(count: CountStatus): string | null {
  if (count.status !== 'violated') return null;
  return count.placed > count.target ? 'too many' : 'not enough room left';
}

function countSuffix(count: CountStatus): string {
  if (count.status === 'satisfied') return ', complete';
  const problem = countProblem(count);
  return problem ? `, ${problem}` : '';
}

/** e.g. "Row 2: 1 of 2 animals". */
export function clueLabel(axis: 'row' | 'column', index: number, count: CountStatus): string {
  const noun = count.target === 1 ? 'animal' : 'animals';
  const Axis = axis === 'row' ? 'Row' : 'Column';
  return `${Axis} ${index + 1}: ${count.placed} of ${count.target} ${noun}${countSuffix(count)}`;
}

/** e.g. "Fox, 1 of 2 placed. Lives beside a tree (not diagonally)". */
export function speciesToolLabel(name: string, hint: string, count: CountStatus): string {
  const head = `${name}, ${count.placed} of ${count.target} placed${countSuffix(count)}`;
  return hint ? `${head}. ${hint}` : head;
}

export const STRINGS = {
  appTitle: 'Woodland Wonders',
  levelsHeading: 'Choose a clearing',
  levelsIntro:
    'Place each animal directly beside its home: up, down, left or right. Animals of a kind never touch, not even corner to corner.',
  back: 'Back to levels',
  completeTitle: 'Scene complete!',
  completeMessage: 'Every animal has found a cosy spot in the woods.',
  playAgain: 'Play again',
  next: 'Next puzzle',
  backToList: 'Back to levels',
  closeHint: 'Close hint',
  continue: 'Continue',
  allComplete: 'Every clearing is complete. Lovely work! Replay any puzzle you like.',
  completed: 'Completed',
  inProgress: 'In progress',
  nextUp: 'Next up',
  reset: 'Reset',
  resetLabel: 'Reset puzzle',
  resetQuestion: 'Clear every mark on this board? You can undo this.',
  resetConfirm: 'Clear board',
  resetCancel: 'Keep playing',
  skipTutorial: 'Skip tutorial',
  startPlaying: 'Start playing',
  tutorialStep: (step: number, total: number) => `Step ${step} of ${total}`,
  gotIt: 'Got it',
  howToPlay: 'How to play',
  playTutorial: 'Play the tutorial',
  notFoundTitle: 'This clearing is hidden',
  notFoundMessage: "We couldn't find that puzzle. It may have moved.",
} as const;

export function levelTitle(number: number): string {
  return `Level ${number}`;
}

export function sizeText(rows: number, columns: number): string {
  return `${rows}×${columns}`;
}

export function sizeSpoken(rows: number, columns: number): string {
  return `${rows} by ${columns}`;
}

export function tierText(tier: string | undefined): string {
  if (!tier) return 'Unrated';
  return `${tier[0]?.toUpperCase() ?? ''}${tier.slice(1)}`;
}

const STATUS_SPOKEN = { completed: 'completed', 'in-progress': 'in progress', new: 'not started' } as const;

/** e.g. "Level 5, beginner, completed, 5 by 5" (+ ", next up"). */
export function levelLabel(
  number: number,
  tier: string | undefined,
  status: 'completed' | 'in-progress' | 'new',
  rows: number,
  columns: number,
  suggested: boolean,
): string {
  const parts = [
    levelTitle(number),
    tierText(tier).toLocaleLowerCase('en'),
    STATUS_SPOKEN[status],
    sizeSpoken(rows, columns),
  ];
  if (suggested) parts.push('next up');
  return parts.join(', ');
}

/** e.g. "New friend: mice live directly beside a mushroom (up, down, left or right)." */
export function speciesIntroText(species: string, habitats: readonly string[]): string {
  const homes = habitats.map((h) => habitatArt(h).name.toLocaleLowerCase('en'));
  const names = speciesInfo(species).plural.toLocaleLowerCase('en');
  const where =
    homes.length === 0 ? 'anywhere' : `directly beside a ${homes.join(' or ')} (up, down, left or right)`;
  return `New friend: ${names} live ${where}.`;
}
