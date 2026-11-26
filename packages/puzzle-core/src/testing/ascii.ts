import type { CellMark } from '../contracts/board.ts';
import type { Puzzle } from '../contracts/constraints.ts';
import type { HabitatPlacement, PuzzleDefinition, SpeciesId } from '../contracts/definition.ts';
import { SCHEMA_VERSION } from '../contracts/definition.ts';

/**
 * ASCII legend for woodland-v1 test boards:
 *   t tree · m mushroom · b burrow · F fox · M mouse · R rabbit · . grass/unmarked · x explicit empty
 */
export const HABITAT_CHARS: Readonly<Record<string, string>> = { t: 'tree', m: 'mushroom', b: 'burrow' };
export const SPECIES_CHARS: Readonly<Record<string, SpeciesId>> = { F: 'fox', M: 'mouse', R: 'rabbit' };

const charOf = (map: Readonly<Record<string, string>>, value: string) =>
  Object.entries(map).find(([, v]) => v === value)?.[0];

function cellChar(grid: readonly string[], r: number, c: number): string {
  const ch = grid[r]?.[c];
  if (ch === undefined) throw new Error(`ragged grid at (${r},${c})`);
  return ch;
}

/**
 * Build a definition from a solved ASCII board; clues and population are derived from the animals.
 * Returns the solution marks too (test-only — solutions never ship, ADR-0008).
 */
export function fromAscii(
  grid: readonly string[],
  opts: { id: string; revision?: number },
): { definition: PuzzleDefinition; solution: CellMark[] } {
  const rows = grid.length;
  const columns = grid[0]?.length ?? 0;
  const habitats: HabitatPlacement[] = [];
  const solution: CellMark[] = [];
  const rowClues = new Array<number>(rows).fill(0);
  const columnClues = new Array<number>(columns).fill(0);
  const population: Record<SpeciesId, number> = {};
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      const ch = cellChar(grid, r, c);
      const habitat = HABITAT_CHARS[ch];
      const species = SPECIES_CHARS[ch];
      if (habitat) {
        habitats.push({ row: r, col: c, habitat });
        solution.push('unmarked');
      } else if (species) {
        solution.push(species);
        rowClues[r] = (rowClues[r] ?? 0) + 1;
        columnClues[c] = (columnClues[c] ?? 0) + 1;
        population[species] = (population[species] ?? 0) + 1;
      } else if (ch === '.' || ch === 'x') {
        solution.push('empty');
      } else throw new Error(`unknown ASCII cell '${ch}'`);
    }
  }
  return {
    definition: {
      schemaVersion: SCHEMA_VERSION,
      id: opts.id,
      revision: opts.revision ?? 1,
      rulesetId: 'woodland-v1',
      rows,
      columns,
      habitats,
      rowClues,
      columnClues,
      population,
    },
    solution,
  };
}

/** Parse player marks for an existing puzzle. Habitat letters must match the puzzle. */
export function marksFromAscii(puzzle: Puzzle, grid: readonly string[]): CellMark[] {
  const marks: CellMark[] = [];
  for (let r = 0; r < puzzle.rows; r++) {
    for (let c = 0; c < puzzle.columns; c++) {
      const ch = cellChar(grid, r, c);
      const i = r * puzzle.columns + c;
      const habitat = puzzle.habitatAt[i];
      if (habitat != null) {
        if (HABITAT_CHARS[ch] !== habitat)
          throw new Error(`expected habitat '${habitat}' at (${r},${c}), got '${ch}'`);
        marks.push('unmarked');
      } else if (ch === '.') marks.push('unmarked');
      else if (ch === 'x') marks.push('empty');
      else {
        const species = SPECIES_CHARS[ch];
        if (!species) throw new Error(`unknown mark '${ch}' at (${r},${c})`);
        marks.push(species);
      }
    }
  }
  return marks;
}

export function toAscii(puzzle: Puzzle, marks: readonly CellMark[]): string[] {
  const out: string[] = [];
  for (let r = 0; r < puzzle.rows; r++) {
    let line = '';
    for (let c = 0; c < puzzle.columns; c++) {
      const i = r * puzzle.columns + c;
      const habitat = puzzle.habitatAt[i];
      const mark = marks[i] ?? 'unmarked';
      if (habitat != null) line += charOf(HABITAT_CHARS, habitat) ?? '?';
      else if (mark === 'unmarked') line += '.';
      else if (mark === 'empty') line += 'x';
      else line += charOf(SPECIES_CHARS, mark) ?? '?';
    }
    out.push(line);
  }
  return out;
}
