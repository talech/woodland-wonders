import {
  boardSpaceHeight,
  computeBoardLayout,
  contentWidth,
  MIN_CELL,
  MIN_COMFORTABLE,
  trayCardBasis,
  trayIsCompact,
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
  it('is compact for three species at 360 pt and roomy on wide screens', () => {
    expect(trayIsCompact(contentWidth(360, noInsets), 3, 1)).toBe(true);
    expect(trayIsCompact(contentWidth(1024, noInsets), 3, 1)).toBe(false);
    expect(trayIsCompact(contentWidth(360, noInsets), 1, 1)).toBe(false);
  });

  it('becomes compact sooner and uses wider cards for large text', () => {
    expect(trayIsCompact(contentWidth(390, noInsets), 2, 1)).toBe(false);
    expect(trayIsCompact(contentWidth(390, noInsets), 2, 1.5)).toBe(true);
    expect(trayCardBasis(1)).toBe(96);
    expect(trayCardBasis(2)).toBeGreaterThan(trayCardBasis(1.3));
    expect(trayCardBasis(0.8)).toBe(96);
  });
});
