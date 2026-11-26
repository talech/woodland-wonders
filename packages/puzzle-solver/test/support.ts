/**
 * Test-only support: seeded PRNG, random tiny boards, and the brute-force oracle.
 *
 * The oracle is built ONLY on core semantics (ADR-0006): leaves are accepted by core `isSolved`; branches
 * are pruned when a core constraint reports a violation in `partial` mode. Partial violations are monotone
 * (count-over, count-unreachable, missing-habitat and same-species-touching all persist under any
 * completion), so pruning never loses a solution; `oracle.test.ts` cross-checks this against an unpruned
 * enumeration.
 */
import {
  type CellMark,
  createPuzzleOrThrow,
  type HabitatPlacement,
  isSolved,
  type Puzzle,
  type PuzzleDefinition,
  type SpeciesId,
  WOODLAND_V1,
} from '@ww/puzzle-core';
import { STRATEGY_ORDER } from '../src/strategies/index.ts';
import type { Strategy } from '../src/strategies/strategy.ts';
import type { DeductionStep } from '../src/types.ts';

/** mulberry32 — deterministic, test-local. */
export function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function blank(puzzle: Puzzle): CellMark[] {
  return new Array<CellMark>(puzzle.cellCount).fill('unmarked');
}

export interface OracleResult {
  readonly solutions: readonly (readonly CellMark[])[];
  /** Per cell, the set of values taken in at least one solution. */
  readonly possible: readonly ReadonlySet<CellMark>[];
}

/**
 * All solutions consistent with `marks` (marked grass cells fixed to their mark). `pruned: false` checks
 * only complete boards with `isSolved` (exponential; 3×3 only).
 */
export function oracle(puzzle: Puzzle, marks?: readonly CellMark[], pruned = true): OracleResult {
  const grass = puzzle.habitatAt.flatMap((h, i) => (h == null ? [i] : []));
  const values: CellMark[] = ['empty', ...puzzle.species];
  const board = new Array<CellMark>(puzzle.cellCount).fill('unmarked');
  const solutions: CellMark[][] = [];
  const locallyBroken = () =>
    puzzle.constraints.some(
      (c) => c.evaluate({ puzzle, marks: board, mode: 'partial' }).status === 'violated',
    );
  const walk = (k: number): void => {
    if (pruned && locallyBroken()) return;
    const cell = grass[k];
    if (cell === undefined) {
      if (isSolved(puzzle, board)) solutions.push(board.slice());
      return;
    }
    const fixed = marks?.[cell];
    for (const v of fixed && fixed !== 'unmarked' ? [fixed] : values) {
      board[cell] = v;
      walk(k + 1);
    }
    board[cell] = 'unmarked';
  };
  walk(0);
  const possible = board.map((_, i) => new Set(solutions.map((s) => s[i] ?? 'unmarked')));
  return { solutions, possible };
}

/** Every elimination in `steps` is absent from every oracle solution. Returns offending descriptions. */
export function unsoundEliminations(steps: readonly DeductionStep[], o: OracleResult): string[] {
  const bad: string[] = [];
  for (const [k, s] of steps.entries())
    for (const e of s.eliminations)
      for (const v of e.values)
        if (o.possible[e.cell]?.has(v)) bad.push(`step ${k} ${s.strategy} removed ${v}@${e.cell}`);
  return bad;
}

const ALL_SPECIES: readonly SpeciesId[] = WOODLAND_V1.species.map((s) => s.id);

/**
 * Random tiny board (3×3–4×4, 1–2 species). Clues come from a random animal layout that either respects the
 * rules (≥1 solution), ignores them (often 0), or has row clues reversed (mixed). Dense-habitat layouts give
 * many multi-solution boards.
 */
export function randomBoard(seed: number): PuzzleDefinition {
  const rand = prng(seed);
  const shuffle = <T>(xs: readonly T[]): T[] => {
    const out = [...xs];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      const a = out[i];
      const b = out[j];
      if (a !== undefined && b !== undefined) {
        out[i] = b;
        out[j] = a;
      }
    }
    return out;
  };
  const pick = <T>(xs: readonly T[]): T => {
    const x = xs[Math.floor(rand() * xs.length)];
    if (x === undefined) throw new Error('empty pick');
    return x;
  };
  const rows = rand() < 0.5 ? 3 : 4;
  const columns = rand() < 0.5 ? 3 : 4;
  const nSpecies = rand() < 0.5 ? 1 : 2;
  const species = shuffle(ALL_SPECIES).slice(0, nSpecies);
  const speciesRules = WOODLAND_V1.species.filter((s) => species.includes(s.id));
  const habitatPool = speciesRules.flatMap((s) => s.habitats);
  // mode < 0.35: rule-respecting layout · < 0.7: dense habitats, rule-respecting
  // < 0.82: swap construction (multi-solution prone) · < 0.85: rule-ignoring layout (often unsolvable)
  // else: rule-respecting with row clues reversed.
  const mode = rand();
  const dense = mode >= 0.35 && mode < 0.7;
  const density = dense ? 0.3 + rand() * 0.2 : 0.1 + rand() * 0.25;
  const habitats: HabitatPlacement[] = [];
  const habitatAt: (string | null)[] = new Array(rows * columns).fill(null);
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < columns; c++)
      if (rand() < density) {
        const habitat = rand() < 0.9 ? pick(habitatPool) : pick(WOODLAND_V1.habitats);
        habitats.push({ row: r, col: c, habitat });
        habitatAt[r * columns + c] = habitat;
      }
  const grass = habitatAt.flatMap((h, i) => (h == null ? [i] : []));
  if (grass.length === 0) return randomBoard(seed + 7919);

  const layout: (SpeciesId | null)[] = new Array(rows * columns).fill(null);
  const swap = mode >= 0.7 && mode < 0.82;
  const respectRules = mode < 0.7 || mode >= 0.85;
  const order = shuffle(grass);
  const near = (a: number, b: number) =>
    Math.abs(Math.floor(a / columns) - Math.floor(b / columns)) <= 1 &&
    Math.abs((a % columns) - (b % columns)) <= 1;
  const ok = (cell: number, s: SpeciesId) => {
    if (!respectRules) return true;
    const rule = speciesRules.find((x) => x.id === s);
    const r = Math.floor(cell / columns);
    const c = cell % columns;
    const orth = [
      [r - 1, c],
      [r + 1, c],
      [r, c - 1],
      [r, c + 1],
    ].filter(([y, x]) => y !== undefined && x !== undefined && y >= 0 && x >= 0 && y < rows && x < columns);
    const supported = orth.some(([y, x]) => {
      const h = habitatAt[(y ?? 0) * columns + (x ?? 0)];
      return h != null && (rule?.habitats.includes(h) ?? false);
    });
    return supported && !layout.some((v, i) => v === s && i !== cell && near(i, cell));
  };
  for (const cell of order) {
    if (rand() < (dense ? 0.18 : 0.35)) {
      const s = pick(species);
      if (ok(cell, s)) layout[cell] = s;
    }
  }
  for (const s of species)
    if (!layout.includes(s) && !swap) {
      const free = order.filter((c) => layout[c] == null);
      const cell = free.find((c) => ok(c, s)) ?? free[0] ?? order[0] ?? 0;
      layout[cell] = s;
    }

  if (swap) {
    // Swap construction: one species on two corners of a rectangle whose other corners are also valid,
    // so the clues admit both diagonals (≥2 solutions unless other animals interfere).
    const s = pick(species);
    const rule = speciesRules.find((x) => x.id === s);
    const r1 = Math.floor(rand() * (rows - 2));
    const r2 = r1 + 2 + Math.floor(rand() * (rows - r1 - 2));
    const c1 = Math.floor(rand() * (columns - 1));
    const c2 = c1 + 1 + Math.floor(rand() * (columns - c1 - 1));
    const corners = [r1 * columns + c1, r1 * columns + c2, r2 * columns + c1, r2 * columns + c2];
    layout.fill(null);
    for (const cell of corners) {
      const i = habitats.findIndex((h) => h.row * columns + h.col === cell);
      if (i >= 0) habitats.splice(i, 1);
      habitatAt[cell] = null;
    }
    for (const cell of corners) {
      const r = Math.floor(cell / columns);
      const c = cell % columns;
      const spots = [
        [r, c - 1],
        [r, c + 1],
      ].filter(([, x]) => x !== undefined && x >= 0 && x < columns && !corners.includes(r * columns + x));
      const has = spots.some(([, x]) => rule?.habitats.includes(habitatAt[r * columns + (x ?? 0)] ?? ''));
      const spot = spots[0];
      if (!has && spot && rule) {
        const at = r * columns + (spot[1] ?? 0);
        const habitat = rule.habitats[0] ?? 'tree';
        const i = habitats.findIndex((h) => h.row * columns + h.col === at);
        if (i >= 0) habitats.splice(i, 1);
        habitats.push({ row: r, col: spot[1] ?? 0, habitat });
        habitatAt[at] = habitat;
      }
    }
    layout[r1 * columns + c1] = s;
    layout[r2 * columns + c2] = s;
  }

  const rowClues = new Array<number>(rows).fill(0);
  const columnClues = new Array<number>(columns).fill(0);
  const population: Record<SpeciesId, number> = {};
  layout.forEach((s, i) => {
    if (s == null) return;
    const r = Math.floor(i / columns);
    const c = i % columns;
    rowClues[r] = (rowClues[r] ?? 0) + 1;
    columnClues[c] = (columnClues[c] ?? 0) + 1;
    population[s] = (population[s] ?? 0) + 1;
  });
  if (mode > 0.85) rowClues.reverse();
  return {
    schemaVersion: 1,
    id: `rand-${seed}`,
    revision: 1,
    rulesetId: 'woodland-v1',
    rows,
    columns,
    habitats,
    rowClues,
    columnClues,
    population,
  };
}

export function randomPuzzle(seed: number): Puzzle {
  return createPuzzleOrThrow(randomBoard(seed));
}

/** Random player marks: a mix of truths from `solution` (if any) and arbitrary values. */
export function randomMarks(puzzle: Puzzle, seed: number, solution?: readonly CellMark[]): CellMark[] {
  const rand = prng(seed);
  const values: CellMark[] = ['empty', ...puzzle.species];
  return puzzle.habitatAt.map((h, i) => {
    if (h != null || rand() < 0.6) return 'unmarked';
    if (solution && rand() < 0.8) return solution[i] ?? 'unmarked';
    return values[Math.floor(rand() * values.length)] ?? 'empty';
  });
}

export function strategyById(id: string): Strategy {
  const s = STRATEGY_ORDER.find((x) => x.id === id);
  if (!s) throw new Error(`unknown strategy ${id}`);
  return s;
}
