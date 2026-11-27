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

/** Player-facing progress for one level, derived from save data. */
export type LevelStatus = 'completed' | 'in-progress' | 'new';

export interface ProgressView {
  readonly progress: Readonly<Record<string, { readonly completedRevision?: number }>>;
  readonly active: Readonly<Record<string, { readonly marks: readonly string[] }>>;
}

/** Completion is kept across content revisions (ADR-0007), so any recorded completion counts. */
export function isCompleted(save: ProgressView, id: string): boolean {
  return save.progress[id]?.completedRevision !== undefined;
}

export function levelStatus(save: ProgressView, id: string): LevelStatus {
  if (isCompleted(save, id)) return 'completed';
  const active = save.active[id];
  return active?.marks.some((m) => m !== 'unmarked') ? 'in-progress' : 'new';
}

/**
 * Next unsolved level in catalog order: after `afterId` (wrapping to the start) when given, else the first.
 * Undefined when every level is completed. No locks: this is only a suggestion.
 */
export function nextUnsolved(
  save: ProgressView,
  afterId?: string,
  levels: readonly Level[] = LEVELS,
): Level | undefined {
  const start = afterId === undefined ? 0 : levels.findIndex((l) => l.id === afterId) + 1;
  for (let k = 0; k < levels.length; k++) {
    const level = levels[(start + k) % levels.length];
    if (level && level.id !== afterId && !isCompleted(save, level.id)) return level;
  }
  return undefined;
}

export interface TierGroup {
  readonly tier: string;
  readonly levels: readonly Level[];
}

/** Levels grouped by difficulty tier, in order of first appearance in the catalog. */
export function groupByTier(levels: readonly Level[] = LEVELS): readonly TierGroup[] {
  const groups = new Map<string, Level[]>();
  for (const level of levels) {
    const tier = level.definition.difficulty?.tier ?? 'unrated';
    const list = groups.get(tier) ?? [];
    list.push(level);
    groups.set(tier, list);
  }
  return [...groups].map(([tier, ls]) => ({ tier, levels: ls }));
}
