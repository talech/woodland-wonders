/**
 * Pipeline steps 1–3: habitats, a valid completed animal board, derived clues and population.
 * Rule data (accepted habitats, which species exist) comes from the core ruleset; adjacency from core geometry.
 */
import {
  type CellIndex,
  type HabitatPlacement,
  kingNeighbours,
  orthogonalNeighbours,
  type PuzzleDefinition,
  type Ruleset,
  SCHEMA_VERSION,
  type SpeciesId,
} from '@ww/puzzle-core';
import type { Rng } from './prng.ts';

export interface LayoutParams {
  readonly rows: number;
  readonly columns: number;
  /** Species to use, in canonical ruleset order. */
  readonly species: readonly SpeciesId[];
  /** Fraction of cells that become habitats. */
  readonly habitatDensity: number;
  /** Target fraction of grass cells holding an animal (soft; placement stops when no valid cell remains). */
  readonly animalDensity: number;
}

export interface Layout {
  readonly definition: Omit<PuzzleDefinition, 'id'>;
  /** The completed board used to derive clues (generator-internal; never exported). */
  readonly animals: readonly (SpeciesId | null)[];
}

export type LayoutResult = { readonly ok: true; readonly layout: Layout } | { readonly ok: false };

export function createLayout(rng: Rng, ruleset: Ruleset, p: LayoutParams): LayoutResult {
  const { rows, columns } = p;
  const cellCount = rows * columns;
  const orth = orthogonalNeighbours(rows, columns);
  const king = kingNeighbours(rows, columns);
  const rules = ruleset.species.filter((s) => p.species.includes(s.id));

  // 1. Habitats: uniform random cells; each serves a species of the puzzle (each species gets ≥ 1).
  const habitatAt: (string | null)[] = new Array(cellCount).fill(null);
  const habitatCount = Math.max(rules.length, Math.round(p.habitatDensity * cellCount));
  const habitatCells = rng.shuffle(Array.from({ length: cellCount }, (_, i) => i)).slice(0, habitatCount);
  habitatCells.forEach((cell, i) => {
    // The first habitats go one per species so every species has somewhere to live.
    const owner = i < rules.length ? rules[i] : rng.pick(rules);
    if (owner) habitatAt[cell] = rng.pick(owner.habitats);
  });

  // 2. Animals: round-robin over species, each placing on a random valid free cell.
  const animals: (SpeciesId | null)[] = new Array(cellCount).fill(null);
  const grassCount = habitatAt.filter((h) => h == null).length;
  const target = Math.max(rules.length, Math.round(p.animalDensity * grassCount));
  const canHost = (cell: CellIndex, s: (typeof rules)[number]) =>
    habitatAt[cell] == null &&
    animals[cell] == null &&
    (orth[cell] ?? []).some((n) => {
      const h = habitatAt[n];
      return h != null && s.habitats.includes(h);
    }) &&
    !(king[cell] ?? []).some((n) => animals[n] === s.id);
  const active = new Set(rules.map((s) => s.id));
  let placed = 0;
  while (placed < target && active.size > 0) {
    for (const s of rules) {
      if (!active.has(s.id) || placed >= target) continue;
      const free: CellIndex[] = [];
      for (let cell = 0; cell < cellCount; cell++) if (canHost(cell, s)) free.push(cell);
      if (free.length === 0) {
        active.delete(s.id);
        continue;
      }
      animals[rng.pick(free)] = s.id;
      placed++;
    }
  }

  // 3. Clues and population.
  const rowClues = new Array<number>(rows).fill(0);
  const columnClues = new Array<number>(columns).fill(0);
  const population: Record<SpeciesId, number> = {};
  animals.forEach((s, cell) => {
    if (s == null) return;
    const r = Math.floor(cell / columns);
    const c = cell % columns;
    rowClues[r] = (rowClues[r] ?? 0) + 1;
    columnClues[c] = (columnClues[c] ?? 0) + 1;
    population[s] = (population[s] ?? 0) + 1;
  });
  if (rules.some((s) => !population[s.id])) return { ok: false };
  const orderedPopulation: Record<SpeciesId, number> = {};
  for (const s of rules) orderedPopulation[s.id] = population[s.id] ?? 0;

  const habitats: HabitatPlacement[] = [];
  habitatAt.forEach((h, cell) => {
    if (h != null) habitats.push({ row: Math.floor(cell / columns), col: cell % columns, habitat: h });
  });
  return {
    ok: true,
    layout: {
      definition: {
        schemaVersion: SCHEMA_VERSION,
        revision: 1,
        rulesetId: ruleset.id,
        rows,
        columns,
        habitats,
        rowClues,
        columnClues,
        population: orderedPopulation,
      },
      animals,
    },
  };
}
