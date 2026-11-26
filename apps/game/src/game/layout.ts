/**
 * Board sizing (pure). Cells aim for ≥ 44 pt (MIN_COMFORTABLE) and never drop below 32 pt (MIN_CELL).
 *
 * Trade-off: on the smallest supported viewport (360 pt wide) a 10-column board only fits at 32 pt cells with a
 * 24 pt clue gutter and 8 pt side padding. We prefer keeping the whole board visible horizontally at ≥ 32 pt over
 * 44 pt cells that would need horizontal scrolling; vertically the screen scrolls if chrome + board exceed the
 * height (e.g. at very large text sizes), so the board never shrinks below 32 pt to fit height.
 */
export const MIN_CELL = 32;
export const MIN_COMFORTABLE = 44;
export const MAX_CELL = 60;
export const MIN_CLUE = 24;
export const MAX_CLUE = 40;
/** Horizontal padding on each side of the puzzle screen content. */
export const SIDE_PADDING = 8;
/** Estimated vertical space used by header, tray, toolbar and gaps at default text size. */
export const CHROME_HEIGHT = 260;

export interface Insets {
  readonly top: number;
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
}

export interface LayoutInput {
  readonly width: number;
  readonly height: number;
  readonly insets: Insets;
  readonly rows: number;
  readonly columns: number;
}

export interface BoardLayout {
  readonly cellSize: number;
  readonly clueSize: number;
  /** True when the board fits the viewport height without scrolling. */
  readonly fitsHeight: boolean;
}

export function clueSizeFor(cell: number): number {
  return Math.min(MAX_CLUE, Math.max(MIN_CLUE, Math.round(cell * 0.7)));
}

export function computeBoardLayout({ width, height, insets, rows, columns }: LayoutInput): BoardLayout {
  const availW = width - insets.left - insets.right - SIDE_PADDING * 2;
  const availH = height - insets.top - insets.bottom - CHROME_HEIGHT;
  const fitsW = (cell: number) => columns * cell + clueSizeFor(cell) <= availW;
  const fitsH = (cell: number) => rows * cell + clueSizeFor(cell) <= availH;

  let widthOnly: number | null = null;
  for (let cell = MAX_CELL; cell >= MIN_CELL; cell--) {
    if (!fitsW(cell)) continue;
    widthOnly ??= cell;
    if (fitsH(cell)) return { cellSize: cell, clueSize: clueSizeFor(cell), fitsHeight: true };
  }
  const cell = widthOnly ?? MIN_CELL;
  return { cellSize: cell, clueSize: clueSizeFor(cell), fitsHeight: false };
}
