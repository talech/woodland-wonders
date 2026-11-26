/** English UI strings and accessibility labels. Kept in one module so localization can replace it later. */
import type { CellView, CountStatus } from '@ww/puzzle-core';

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
    : `needs a ${joinOr(issue.habitatNames.map(lower))} next to it`;
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

/** e.g. "Fox, 1 of 2 placed. Lives next to a tree". */
export function speciesToolLabel(name: string, hint: string, count: CountStatus): string {
  const head = `${name}, ${count.placed} of ${count.target} placed${countSuffix(count)}`;
  return hint ? `${head}. ${hint}` : head;
}

export const STRINGS = {
  appTitle: 'Woodland Wonders',
  levelsHeading: 'Choose a clearing',
  levelsIntro:
    'Place each animal next to its home. Animals of a kind never touch, not even corner to corner.',
  back: 'Back to levels',
  completeTitle: 'Scene complete!',
  completeMessage: 'Every animal has found a cosy spot.',
  next: 'Next puzzle',
  backToList: 'Back to levels',
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
