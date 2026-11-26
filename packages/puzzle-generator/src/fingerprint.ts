/**
 * Diversity helpers: a canonical fingerprint invariant under board symmetries (8 for square boards, 4 for
 * non-square), and a simple habitat-layout similarity.
 */
import type { PuzzleDefinition } from '@ww/puzzle-core';
import { shortHash } from './prng.ts';

interface Shape {
  readonly rows: number;
  readonly columns: number;
  /** grid[r][c] = habitat id or '' for grass. */
  readonly grid: readonly (readonly string[])[];
  readonly rowClues: readonly number[];
  readonly columnClues: readonly number[];
}

function toShape(def: PuzzleDefinition): Shape {
  const grid = Array.from({ length: def.rows }, () => new Array<string>(def.columns).fill(''));
  for (const h of def.habitats) {
    const row = grid[h.row];
    if (row) row[h.col] = h.habitat;
  }
  return { rows: def.rows, columns: def.columns, grid, rowClues: def.rowClues, columnClues: def.columnClues };
}

const flipH = (s: Shape): Shape => ({
  ...s,
  grid: s.grid.map((r) => [...r].reverse()),
  columnClues: [...s.columnClues].reverse(),
});
const flipV = (s: Shape): Shape => ({
  ...s,
  grid: [...s.grid].reverse(),
  rowClues: [...s.rowClues].reverse(),
});
const transpose = (s: Shape): Shape => ({
  rows: s.columns,
  columns: s.rows,
  grid: Array.from({ length: s.columns }, (_, c) => s.grid.map((r) => r[c] ?? '')),
  rowClues: s.columnClues,
  columnClues: s.rowClues,
});

/** All symmetric images of a shape (identity first). */
function images(s: Shape): Shape[] {
  const base = [s, flipH(s), flipV(s), flipH(flipV(s))];
  return s.rows === s.columns ? [...base, ...base.map(transpose)] : base;
}

function serialize(s: Shape): string {
  const grid = s.grid.map((r) => r.map((h) => (h === '' ? '.' : h)).join(',')).join('/');
  return `${s.rows}x${s.columns}|${grid}|r${s.rowClues.join(',')}|c${s.columnClues.join(',')}`;
}

/**
 * Canonical fingerprint of a puzzle (habitats, clues, population, ruleset): the lexicographically smallest
 * serialization over all board symmetries. Equal for rotated/reflected copies of the same puzzle.
 */
export function canonicalForm(def: PuzzleDefinition): string {
  const population = Object.keys(def.population)
    .sort()
    .map((k) => `${k}=${def.population[k] ?? 0}`)
    .join(',');
  const forms = images(toShape(def)).map(serialize).sort();
  return `${def.rulesetId}|${population}|${forms[0] ?? ''}`;
}

/** Short hash of the canonical form (stable across runs and platforms). */
export function fingerprint(def: PuzzleDefinition): string {
  return shortHash(canonicalForm(def));
}

/**
 * Habitat-layout similarity in [0, 1]: the best Jaccard index of (cell, habitat) pairs over all symmetries of
 * `b`. 0 for different dimensions (up to transposition). 1 means identical habitat layouts.
 */
export function layoutSimilarity(a: PuzzleDefinition, b: PuzzleDefinition): number {
  const sa = toShape(a);
  const cells = (s: Shape) => {
    const out = new Set<string>();
    s.grid.forEach((row, r) => {
      row.forEach((h, c) => {
        if (h !== '') out.add(`${r},${c},${h}`);
      });
    });
    return out;
  };
  const ca = cells(sa);
  let best = 0;
  for (const img of images(toShape(b))) {
    if (img.rows !== sa.rows || img.columns !== sa.columns) continue;
    const cb = cells(img);
    let inter = 0;
    for (const x of cb) if (ca.has(x)) inter++;
    const union = ca.size + cb.size - inter;
    best = Math.max(best, union === 0 ? 1 : inter / union);
  }
  return best;
}
