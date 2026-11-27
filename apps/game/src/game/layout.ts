/**
 * Puzzle-screen sizing (pure). Cells aim for ≥ 44 pt (MIN_COMFORTABLE) and never drop below 32 pt (MIN_CELL).
 *
 * The toolbar is a fixed bottom bar; header + tray + board scroll above it. The board is sized from the space
 * actually measured for the scroll viewport minus the measured header/tray block.
 *
 * Trade-off: on the smallest supported viewport (360 pt wide) a 10-column board only fits at 32 pt cells with a
 * 24 pt clue gutter and 8 pt side padding. We keep the whole board visible horizontally at ≥ 32 pt rather than
 * use 44 pt cells that would need horizontal scrolling. When the height is too small even at 32 pt (short
 * screens, very large text), the board stays at 32 pt and the region above the toolbar scrolls.
 */
export const MIN_CELL = 32;
export const MIN_COMFORTABLE = 44;
export const MAX_CELL = 60;
export const MIN_CLUE = 24;
export const MAX_CLUE = 40;
/** Horizontal padding on each side of the puzzle screen content. */
export const SIDE_PADDING = 8;
/** Widest the puzzle content gets (tablets / desktop web). */
export const MAX_CONTENT_WIDTH = 720;
/** Vertical padding/gaps inside the scroll region around the board (must match PuzzleScreen styles). */
export const SCROLL_PADDING_TOP = 8;
export const SCROLL_PADDING_BOTTOM = 12;
export const SECTION_GAP = 12;
/** Pre-measurement estimates (first frame only). */
export const ESTIMATED_TOOLBAR_HEIGHT = 250;
export const ESTIMATED_CHROME_HEIGHT = 64;
/**
 * Vertical space the cream backing around the board adds (padding 4 + border 2, top and bottom). Horizontally the
 * backing hangs into the side padding, so width needs no allowance.
 */
export const BOARD_FRAME_V = 12;

export interface Insets {
  readonly top: number;
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
}

export interface LayoutInput {
  readonly availableWidth: number;
  readonly availableHeight: number;
  readonly rows: number;
  readonly columns: number;
}

export interface BoardLayout {
  readonly cellSize: number;
  readonly clueSize: number;
  /** True when the board fits the available height without scrolling. */
  readonly fitsHeight: boolean;
}

export function clueSizeFor(cell: number): number {
  return Math.min(MAX_CLUE, Math.max(MIN_CLUE, Math.round(cell * 0.7)));
}

/** Largest cell size in [MIN_CELL, MAX_CELL] that fits both dimensions; MIN_CELL (scroll) when none does. */
export function computeBoardLayout({
  availableWidth,
  availableHeight,
  rows,
  columns,
}: LayoutInput): BoardLayout {
  const fitsW = (cell: number) => columns * cell + clueSizeFor(cell) <= availableWidth;
  const fitsH = (cell: number) => rows * cell + clueSizeFor(cell) <= availableHeight;
  for (let cell = MAX_CELL; cell >= MIN_CELL; cell--) {
    if (fitsW(cell) && fitsH(cell)) return { cellSize: cell, clueSize: clueSizeFor(cell), fitsHeight: true };
  }
  return { cellSize: MIN_CELL, clueSize: clueSizeFor(MIN_CELL), fitsHeight: false };
}

/** Content width available to the board and tray. */
export function contentWidth(windowWidth: number, insets: Insets): number {
  return Math.min(MAX_CONTENT_WIDTH, windowWidth - insets.left - insets.right) - SIDE_PADDING * 2;
}

export interface BoardSpaceInput {
  /** Height of the scroll viewport above the fixed toolbar (measured, or null before first layout). */
  readonly viewportHeight: number | null;
  /** Height of the header + tray block (measured, or null before first layout). */
  readonly chromeHeight: number | null;
  readonly windowHeight: number;
  readonly insets: Insets;
}

/** Height left for the board (clues included) inside the scroll viewport. */
export function boardSpaceHeight({
  viewportHeight,
  chromeHeight,
  windowHeight,
  insets,
}: BoardSpaceInput): number {
  const viewport = viewportHeight ?? windowHeight - insets.top - insets.bottom - ESTIMATED_TOOLBAR_HEIGHT;
  const chrome = chromeHeight ?? ESTIMATED_CHROME_HEIGHT;
  return viewport - chrome - SCROLL_PADDING_TOP - SECTION_GAP - SCROLL_PADDING_BOTTOM;
}

/** Tray card flex-basis: wider for large text so cards wrap onto more rows instead of breaking words. */
export function trayCardBasis(fontScale: number): number {
  return Math.round(88 * Math.min(2.2, Math.max(1, fontScale)));
}

/** Gap between the hint panel and the toolbar (must match PuzzleScreen styles). */
export const HINT_PANEL_GAP = 8;
export const MIN_HINT_PANEL = 168;
export const MAX_HINT_PANEL = 300;

export interface ScreenLayoutInput {
  readonly availableWidth: number;
  /** Scroll viewport height measured while the hint panel was closed, or null before first layout. */
  readonly closedViewportHeight: number | null;
  readonly chromeHeight: number | null;
  readonly windowHeight: number;
  readonly insets: Insets;
  readonly rows: number;
  readonly columns: number;
  readonly fontScale: number;
  readonly hintOpen: boolean;
  /**
   * Height of the completion banner shown above the toolbar (measured, or an estimate), or null when the
   * puzzle is not solved. Ignored while the hint panel is open (only one bottom panel shows at a time).
   */
  readonly sceneBanner?: number | null;
  /**
   * Height freed above the dock while a panel is open (the mode switch and animal row hide). Adds to the room the
   * panel and board share; it never changes the closed-state board.
   */
  readonly extraRoom?: number;
}

/** Pre-measurement estimate of the compact completion banner. */
export const ESTIMATED_SCENE_BANNER = 112;

export interface ScreenLayout {
  readonly board: BoardLayout;
  /** Fixed hint-panel height while open (its content scrolls inside), else null. */
  readonly hintPanelHeight: number | null;
}

/**
 * Board, hint-panel and completion-banner sizes. Closed: the board fits below header + tray. Open: the screen scrolls header + tray
 * away and the panel takes the space the board doesn't need, within [MIN_HINT_PANEL, MAX_HINT_PANEL] (larger
 * minimum for large text). If the minimum panel leaves too little room, the board shrinks (never below 32 pt)
 * so it stays fully visible; it never grows when a hint opens. The panel height is fixed per board, so moving
 * between hint stages never resizes anything.
 */
export function puzzleScreenLayout(input: ScreenLayoutInput): ScreenLayout {
  const { availableWidth, rows, columns, fontScale, hintOpen } = input;
  const closedViewport =
    input.closedViewportHeight ??
    input.windowHeight - input.insets.top - input.insets.bottom - ESTIMATED_TOOLBAR_HEIGHT;
  const closed = computeBoardLayout({
    availableWidth,
    availableHeight: boardSpaceHeight({ ...input, viewportHeight: closedViewport }) - BOARD_FRAME_V,
    rows,
    columns,
  });
  const room =
    closedViewport +
    Math.max(0, input.extraRoom ?? 0) -
    SCROLL_PADDING_TOP -
    SCROLL_PADDING_BOTTOM -
    HINT_PANEL_GAP;
  if (!hintOpen) {
    const banner = input.sceneBanner ?? null;
    if (banner === null) return { board: closed, hintPanelHeight: null };
    // Solved: header + tray scroll away so the whole scene stays visible above the banner; never grows.
    const scene = computeBoardLayout({
      availableWidth,
      availableHeight: room - banner - BOARD_FRAME_V,
      rows,
      columns,
    });
    return { board: scene.cellSize < closed.cellSize ? scene : closed, hintPanelHeight: null };
  }

  const boardHeight = rows * closed.cellSize + closed.clueSize + BOARD_FRAME_V;
  const minPanel = Math.round(MIN_HINT_PANEL * Math.min(1.4, Math.max(1, fontScale)));
  const panel = Math.min(MAX_HINT_PANEL, Math.max(minPanel, room - boardHeight));
  const open = computeBoardLayout({
    availableWidth,
    availableHeight: room - panel - BOARD_FRAME_V,
    rows,
    columns,
  });
  return { board: open.cellSize < closed.cellSize ? open : closed, hintPanelHeight: panel };
}
