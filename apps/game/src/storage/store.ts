/**
 * Save store: loads once, keeps the decoded save in memory, and writes it back debounced (flushed on app
 * background by `SaveProvider`). Storage failures never reach the player; the game keeps working in memory.
 */
import type { GameState, Puzzle, PuzzleId } from '@ww/puzzle-core';
import type { StorageAdapter } from './adapter.ts';
import {
  BACKUP_KEY_PREFIX,
  DEFAULT_SAVE,
  decodeSave,
  encodeSave,
  MIGRATIONS,
  type Migration,
  SAVE_KEY,
  type SaveDataV1,
  type SaveSettings,
  toActiveEntry,
} from './saveData.ts';

export const DEFAULT_DEBOUNCE_MS = 400;
/** Backups use `ww.save.backup.<n>` with the first free n (no timestamps), capped to bound storage. */
export const MAX_BACKUPS = 20;

export interface SaveSnapshot {
  readonly loaded: boolean;
  readonly data: SaveDataV1;
}

export interface SaveStoreOptions {
  readonly adapter: StorageAdapter;
  readonly findPuzzle: (id: PuzzleId) => Puzzle | undefined;
  readonly debounceMs?: number;
  readonly now?: () => Date;
  readonly migrations?: Readonly<Record<number, Migration>>;
}

export interface SaveStore {
  /** Load and decode once; later calls return the same promise. Never rejects. */
  load(): Promise<void>;
  getSnapshot(): SaveSnapshot;
  subscribe(listener: () => void): () => void;
  setActive(id: PuzzleId, game: GameState): void;
  clearActive(id: PuzzleId): void;
  markCompleted(id: PuzzleId, revision: number): void;
  updateSettings(patch: Partial<SaveSettings>): void;
  /** Write pending changes now (app background, tests). Never rejects. */
  flush(): Promise<void>;
}

export function createSaveStore(options: SaveStoreOptions): SaveStore {
  const { adapter, findPuzzle } = options;
  const debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS;
  const now = options.now ?? (() => new Date());
  let snapshot: SaveSnapshot = { loaded: false, data: DEFAULT_SAVE };
  let loading: Promise<void> | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let dirty = false;
  const listeners = new Set<() => void>();

  const emit = () => {
    for (const l of listeners) l();
  };

  const write = async () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    if (!dirty) return;
    dirty = false;
    try {
      await adapter.set(SAVE_KEY, encodeSave(snapshot.data));
    } catch {
      dirty = true; // retry on the next change or flush
    }
  };

  /** `milestone`: completion / settings are written on the next tick instead of after the debounce. */
  const update = (fn: (data: SaveDataV1) => SaveDataV1, milestone = false) => {
    const data = fn(snapshot.data);
    if (data === snapshot.data) return;
    snapshot = { ...snapshot, data };
    dirty = true;
    emit();
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(
      () => {
        timer = null;
        void write();
      },
      milestone ? 0 : debounceMs,
    );
  };

  const backup = async (raw: string) => {
    for (let n = 1; n <= MAX_BACKUPS; n++) {
      const key = `${BACKUP_KEY_PREFIX}${n}`;
      if (n === MAX_BACKUPS || (await adapter.get(key)) === null) {
        await adapter.set(key, raw);
        return;
      }
    }
  };

  const doLoad = async () => {
    let raw: string | null = null;
    try {
      raw = await adapter.get(SAVE_KEY);
    } catch {
      raw = null;
    }
    const result = decodeSave(raw, findPuzzle, options.migrations ?? MIGRATIONS);
    // Changes made before loading finished (unlikely) are kept on top of the loaded data.
    snapshot = { loaded: true, data: result.data };
    try {
      if (result.status === 'corrupt' && raw !== null) {
        await backup(raw);
        dirty = true;
        await write();
      } else if (result.status === 'repaired') {
        dirty = true;
        await write();
      }
    } catch {
      // Storage unavailable: play on from memory.
    }
    emit();
  };

  return {
    load() {
      loading ??= doLoad();
      return loading;
    },
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setActive(id, game) {
      update((data) => ({ ...data, active: { ...data.active, [id]: toActiveEntry(game) } }));
    },
    clearActive(id) {
      update((data) => {
        if (!Object.hasOwn(data.active, id)) return data;
        const { [id]: _removed, ...active } = data.active;
        return { ...data, active };
      });
    },
    markCompleted(id, revision) {
      update(
        (data) => ({
          ...data,
          progress: {
            ...data.progress,
            [id]: { completedRevision: revision, completedAt: now().toISOString() },
          },
        }),
        true,
      );
    },
    updateSettings(patch) {
      update((data) => ({ ...data, settings: { ...data.settings, ...patch } }), true);
    },
    flush: () => write(),
  };
}
