/** Playable levels compiled once from the validated, static catalog (immutable module data, not mutable state). */
import { CATALOG } from '@ww/puzzle-content';
import { createPuzzle, type Puzzle, type PuzzleDefinition } from '@ww/puzzle-core';

export interface Level {
  readonly id: string;
  /** 1-based position in the catalog. */
  readonly number: number;
  readonly definition: PuzzleDefinition;
  readonly puzzle: Puzzle;
}

export function compileLevels(definitions: readonly PuzzleDefinition[]): readonly Level[] {
  const levels: Level[] = [];
  for (const definition of definitions) {
    const result = createPuzzle(definition);
    if (result.ok)
      levels.push({ id: definition.id, number: levels.length + 1, definition, puzzle: result.value });
  }
  return Object.freeze(levels);
}

export const LEVELS: readonly Level[] = compileLevels(CATALOG.puzzles);

export function findLevel(id: string, levels: readonly Level[] = LEVELS): Level | undefined {
  return levels.find((l) => l.id === id);
}

export function nextLevel(id: string, levels: readonly Level[] = LEVELS): Level | undefined {
  const i = levels.findIndex((l) => l.id === id);
  return i < 0 ? undefined : levels[i + 1];
}
