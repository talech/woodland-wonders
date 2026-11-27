/**
 * Save data (ADR-0007, M0-REVIEW §6.5). Decoding never throws: unknown or corrupt data is reported as `corrupt`
 * (the caller backs it up and starts from defaults); individually invalid entries are dropped. Active boards are
 * validated with core `parseGameState`, so the app adds no rule or schema logic of its own for them.
 */
import {
  type CellMark,
  type GameState,
  type History,
  type Puzzle,
  type PuzzleId,
  parseGameState,
} from '@ww/puzzle-core';

export const SAVE_KEY = 'ww.save';
export const BACKUP_KEY_PREFIX = 'ww.save.backup.';
export const SAVE_SCHEMA_VERSION = 1;

export interface ProgressEntry {
  readonly completedRevision?: number;
  /** ISO 8601 timestamp. */
  readonly completedAt?: string;
}

export interface ActiveEntry {
  readonly revision: number;
  readonly marks: readonly CellMark[];
  readonly history: History;
}

export type ReducedMotionSetting = 'system' | 'on' | 'off';

export interface SaveSettings {
  readonly reducedMotion: ReducedMotionSetting;
  readonly onboardingDone: boolean;
}

export interface SaveDataV1 {
  readonly schemaVersion: 1;
  readonly progress: Readonly<Record<PuzzleId, ProgressEntry>>;
  readonly active: Readonly<Record<PuzzleId, ActiveEntry>>;
  readonly settings: SaveSettings;
}

export const DEFAULT_SETTINGS: SaveSettings = { reducedMotion: 'system', onboardingDone: false };

export const DEFAULT_SAVE: SaveDataV1 = {
  schemaVersion: 1,
  progress: {},
  active: {},
  settings: DEFAULT_SETTINGS,
};

type RawObject = Record<string, unknown>;

/** `vN → vN+1` steps, keyed by the source version. Empty while v1 is the only version. */
export type Migration = (raw: RawObject) => RawObject;
export const MIGRATIONS: Readonly<Record<number, Migration>> = {};

function isObject(v: unknown): v is RawObject {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Run the ordered chain up to `target`. Returns null when a step is missing or the version is unusable. */
export function migrate(
  raw: RawObject,
  migrations: Readonly<Record<number, Migration>> = MIGRATIONS,
  target: number = SAVE_SCHEMA_VERSION,
): RawObject | null {
  const start = raw.schemaVersion;
  if (typeof start !== 'number' || !Number.isInteger(start) || start < 1 || start > target) return null;
  let current = raw;
  for (let version = start; version < target; version++) {
    const step = migrations[version];
    if (!step) return null;
    current = step(current);
    if (current.schemaVersion !== version + 1) return null;
  }
  return current;
}

function decodeProgress(raw: unknown, dropped: string[]): Record<PuzzleId, ProgressEntry> {
  const out: Record<PuzzleId, ProgressEntry> = {};
  if (!isObject(raw)) return out;
  for (const [id, entry] of Object.entries(raw)) {
    if (!isObject(entry)) {
      dropped.push(`progress.${id}`);
      continue;
    }
    const { completedRevision, completedAt } = entry;
    const revisionOk =
      completedRevision === undefined ||
      (typeof completedRevision === 'number' &&
        Number.isInteger(completedRevision) &&
        completedRevision >= 1);
    const atOk =
      completedAt === undefined ||
      (typeof completedAt === 'string' && !Number.isNaN(Date.parse(completedAt)));
    if (!revisionOk || !atOk) {
      dropped.push(`progress.${id}`);
      continue;
    }
    out[id] = {
      ...(typeof completedRevision === 'number' ? { completedRevision } : {}),
      ...(typeof completedAt === 'string' ? { completedAt } : {}),
    };
  }
  return out;
}

function decodeActive(
  raw: unknown,
  findPuzzle: (id: PuzzleId) => Puzzle | undefined,
  dropped: string[],
): Record<PuzzleId, ActiveEntry> {
  const out: Record<PuzzleId, ActiveEntry> = {};
  if (!isObject(raw)) return out;
  for (const [id, entry] of Object.entries(raw)) {
    const puzzle = findPuzzle(id);
    if (!puzzle || !isObject(entry)) {
      dropped.push(`active.${id}`);
      continue;
    }
    // Revision mismatch: the content changed, so the board is discarded (completion is kept separately).
    if (entry.revision !== puzzle.definition.revision) {
      dropped.push(`active.${id}`);
      continue;
    }
    const parsed = parseGameState(puzzle, {
      board: { puzzleId: id, revision: entry.revision, marks: entry.marks },
      history: entry.history,
    });
    if (!parsed.ok) {
      dropped.push(`active.${id}`);
      continue;
    }
    out[id] = toActiveEntry(parsed.value);
  }
  return out;
}

function decodeSettings(raw: unknown): SaveSettings {
  if (!isObject(raw)) return DEFAULT_SETTINGS;
  const rm = raw.reducedMotion;
  return {
    reducedMotion: rm === 'on' || rm === 'off' || rm === 'system' ? rm : DEFAULT_SETTINGS.reducedMotion,
    onboardingDone:
      typeof raw.onboardingDone === 'boolean' ? raw.onboardingDone : DEFAULT_SETTINGS.onboardingDone,
  };
}

export type DecodeStatus = 'empty' | 'ok' | 'repaired' | 'corrupt';

export interface DecodeResult {
  readonly data: SaveDataV1;
  readonly status: DecodeStatus;
  /** Paths of entries dropped during repair (e.g. `active.beginner-02`). */
  readonly dropped: readonly string[];
}

export function decodeSave(
  raw: string | null,
  findPuzzle: (id: PuzzleId) => Puzzle | undefined,
  migrations: Readonly<Record<number, Migration>> = MIGRATIONS,
): DecodeResult {
  if (raw === null) return { data: DEFAULT_SAVE, status: 'empty', dropped: [] };
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { data: DEFAULT_SAVE, status: 'corrupt', dropped: [] };
  }
  if (!isObject(json)) return { data: DEFAULT_SAVE, status: 'corrupt', dropped: [] };
  const migrated = migrate(json, migrations);
  if (!migrated) return { data: DEFAULT_SAVE, status: 'corrupt', dropped: [] };

  const dropped: string[] = [];
  const data: SaveDataV1 = {
    schemaVersion: 1,
    progress: decodeProgress(migrated.progress, dropped),
    active: decodeActive(migrated.active, findPuzzle, dropped),
    settings: decodeSettings(migrated.settings),
  };
  return { data, status: dropped.length > 0 ? 'repaired' : 'ok', dropped };
}

export function encodeSave(data: SaveDataV1): string {
  return JSON.stringify(data);
}

export function toActiveEntry(game: GameState): ActiveEntry {
  return { revision: game.board.revision, marks: game.board.marks, history: game.history };
}

/** Rebuild a game state from a stored (already validated) active entry. */
export function toGameState(puzzleId: PuzzleId, entry: ActiveEntry): GameState {
  return { board: { puzzleId, revision: entry.revision, marks: entry.marks }, history: entry.history };
}
