import {
  BOARD_FRAME_V,
  boardSpaceHeight,
  computeBoardLayout,
  contentWidth,
  MAX_HINT_PANEL,
  MIN_CELL,
  MIN_COMFORTABLE,
  MIN_HINT_PANEL,
  puzzleScreenLayout,
  trayCardBasis,
} from '../src/game/layout';

const noInsets = { top: 0, bottom: 0, left: 0, right: 0 };

describe('computeBoardLayout', () => {
  it('fits a 10×10 board in 360 pt width at ≥ 32 pt', () => {
    const w = contentWidth(360, noInsets);
    const l = computeBoardLayout({ availableWidth: w, availableHeight: 400, rows: 10, columns: 10 });
    expect(l.cellSize).toBeGreaterThanOrEqual(MIN_CELL);
    expect(10 * l.cellSize + l.clueSize).toBeLessThanOrEqual(w);
    expect(l.fitsHeight).toBe(true);
  });

  it('sizes from the available height, not just the width', () => {
    const tall = computeBoardLayout({ availableWidth: 344, availableHeight: 600, rows: 6, columns: 6 });
    const short = computeBoardLayout({ availableWidth: 344, availableHeight: 300, rows: 6, columns: 6 });
    expect(short.cellSize).toBeLessThan(tall.cellSize);
    expect(6 * short.cellSize + short.clueSize).toBeLessThanOrEqual(300);
    expect(short.fitsHeight).toBe(true);
  });

  it('reaches the comfortable size on small boards', () => {
    const l = computeBoardLayout({ availableWidth: 374, availableHeight: 450, rows: 6, columns: 6 });
    expect(l.cellSize).toBeGreaterThanOrEqual(MIN_COMFORTABLE);
  });

  it('never goes below the minimum; reports that the region must scroll', () => {
    const l = computeBoardLayout({ availableWidth: 344, availableHeight: 200, rows: 10, columns: 10 });
    expect(l.cellSize).toBe(MIN_CELL);
    expect(l.fitsHeight).toBe(false);
  });
});

describe('boardSpaceHeight', () => {
  it('subtracts measured chrome and padding from the measured viewport', () => {
    const h = boardSpaceHeight({
      viewportHeight: 560,
      chromeHeight: 160,
      windowHeight: 640,
      insets: noInsets,
    });
    expect(h).toBe(560 - 160 - 8 - 12 - 12);
  });

  it('estimates before first layout, accounting for insets and the fixed toolbar', () => {
    const plain = boardSpaceHeight({
      viewportHeight: null,
      chromeHeight: null,
      windowHeight: 640,
      insets: noInsets,
    });
    const inset = boardSpaceHeight({
      viewportHeight: null,
      chromeHeight: null,
      windowHeight: 640,
      insets: { ...noInsets, top: 24, bottom: 20 },
    });
    expect(plain).toBeLessThan(640);
    expect(inset).toBe(plain - 44);
  });

  it('a 6×6 board fits above the fixed toolbar on 360×640 with a compact tray', () => {
    // Approximate measured values at 360×640: toolbar ≈ 84, header + compact tray ≈ 150.
    const h = boardSpaceHeight({
      viewportHeight: 640 - 84,
      chromeHeight: 150,
      windowHeight: 640,
      insets: noInsets,
    });
    const l = computeBoardLayout({
      availableWidth: contentWidth(360, noInsets),
      availableHeight: h,
      rows: 6,
      columns: 6,
    });
    expect(l.fitsHeight).toBe(true);
    expect(l.cellSize).toBeGreaterThanOrEqual(MIN_COMFORTABLE);
  });
});

describe('tray sizing', () => {
  it('uses wider cards for large text, never narrower than the base', () => {
    expect(trayCardBasis(1)).toBe(88);
    expect(trayCardBasis(2)).toBeGreaterThan(trayCardBasis(1.3));
    expect(trayCardBasis(0.8)).toBe(88);
  });
});

describe('puzzleScreenLayout with the hint panel', () => {
  const base = {
    availableWidth: contentWidth(360, noInsets),
    chromeHeight: 210,
    windowHeight: 640,
    insets: noInsets,
    rows: 6,
    columns: 6,
    fontScale: 1,
    closedViewportHeight: 552,
  };

  it('closed: plain board layout and no panel', () => {
    const l = puzzleScreenLayout({ ...base, hintOpen: false });
    expect(l.hintPanelHeight).toBeNull();
    expect(l.board).toEqual(
      computeBoardLayout({
        availableWidth: base.availableWidth,
        availableHeight: boardSpaceHeight({ ...base, viewportHeight: 552 }) - BOARD_FRAME_V,
        rows: 6,
        columns: 6,
      }),
    );
  });

  it('open: the panel takes the room the board does not need; the board keeps its size', () => {
    const closed = puzzleScreenLayout({ ...base, hintOpen: false });
    const open = puzzleScreenLayout({ ...base, hintOpen: true });
    const panel = open.hintPanelHeight ?? 0;
    expect(open.board).toEqual(closed.board);
    expect(panel).toBeGreaterThanOrEqual(MIN_HINT_PANEL);
    const viewport = 552 - panel - 8;
    expect(6 * open.board.cellSize + open.board.clueSize).toBeLessThanOrEqual(viewport - 20);
  });

  it('open on a 10×10 board at 360×640: whole board above the panel', () => {
    const open = puzzleScreenLayout({ ...base, rows: 10, columns: 10, hintOpen: true });
    const panel = open.hintPanelHeight ?? 0;
    expect(panel).toBeGreaterThanOrEqual(MIN_HINT_PANEL);
    expect(open.board.cellSize).toBeGreaterThanOrEqual(MIN_CELL);
    expect(10 * open.board.cellSize + open.board.clueSize).toBeLessThanOrEqual(552 - panel - 8 - 20);
  });

  it('panel height is bounded and larger for large text; the board shrinks rather than hides', () => {
    const big = puzzleScreenLayout({ ...base, fontScale: 1.5, hintOpen: true });
    expect(big.hintPanelHeight).toBeGreaterThan(MIN_HINT_PANEL);
    const tall = puzzleScreenLayout({
      ...base,
      windowHeight: 1400,
      closedViewportHeight: 1300,
      hintOpen: true,
    });
    expect(tall.hintPanelHeight).toBe(MAX_HINT_PANEL);
    const short = puzzleScreenLayout({ ...base, closedViewportHeight: 400, hintOpen: true });
    const closedShort = puzzleScreenLayout({ ...base, closedViewportHeight: 400, hintOpen: false });
    expect(short.board.cellSize).toBeLessThanOrEqual(closedShort.board.cellSize);
    expect(short.board.cellSize).toBeGreaterThanOrEqual(MIN_CELL);
  });
});

describe('puzzleScreenLayout with the completion banner', () => {
  const base = {
    availableWidth: contentWidth(360, noInsets),
    chromeHeight: 260,
    windowHeight: 640,
    insets: noInsets,
    fontScale: 1,
    hintOpen: false,
    // 640 minus a fixed toolbar bar of about 82 pt.
    closedViewportHeight: 558,
  };

  it.each([
    [6, 6],
    [8, 8],
  ])('a solved %i×%i board fits whole above the banner at 360×640', (rows, columns) => {
    const banner = 112;
    const closed = puzzleScreenLayout({ ...base, rows, columns });
    const scene = puzzleScreenLayout({ ...base, rows, columns, sceneBanner: banner });
    expect(scene.board.cellSize).toBeLessThanOrEqual(closed.board.cellSize);
    expect(scene.board.cellSize).toBeGreaterThanOrEqual(MIN_CELL);
    const region = 558 - banner - 8;
    expect(rows * scene.board.cellSize + scene.board.clueSize).toBeLessThanOrEqual(region - 20);
    expect(scene.hintPanelHeight).toBeNull();
  });

  it('the hint panel takes precedence over the banner', () => {
    const l = puzzleScreenLayout({ ...base, rows: 6, columns: 6, hintOpen: true, sceneBanner: 112 });
    expect(l.hintPanelHeight).not.toBeNull();
  });
});
