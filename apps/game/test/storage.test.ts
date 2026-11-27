import { createGame, createPuzzleOrThrow, dispatch, type GameState, type Puzzle } from '@ww/puzzle-core';
import { FIXTURES } from '@ww/puzzle-core/testing';
import { createMemoryStorage, type StorageAdapter } from '../src/storage/adapter';
import {
  BACKUP_KEY_PREFIX,
  DEFAULT_SAVE,
  decodeSave,
  encodeSave,
  migrate,
  SAVE_KEY,
  type SaveDataV1,
  toActiveEntry,
  toGameState,
} from '../src/storage/saveData';
import { createSaveStore } from '../src/storage/store';

const tiny = createPuzzleOrThrow(FIXTURES.tiny4x4.definition);
const pair = createPuzzleOrThrow(FIXTURES.pair5x5.definition);
const PUZZLES: Record<string, Puzzle> = { [tiny.definition.id]: tiny, [pair.definition.id]: pair };
const findPuzzle = (id: string) => PUZZLES[id];

function play(puzzle: Puzzle, cells: readonly number[], mark = 'fox'): GameState {
  let game = createGame(puzzle);
  for (const cell of cells) {
    const r = dispatch(puzzle, game, { type: 'setCell', cell, mark });
    if (!r.ok) throw new Error(r.reason);
    game = r.game;
  }
  return game;
}

const sample = (): SaveDataV1 => ({
  schemaVersion: 1,
  progress: { 'tiny-4x4': { completedRevision: 1, completedAt: '2026-11-26T10:00:00.000Z' } },
  active: { 'pair-5x5': toActiveEntry(play(pair, [19])) },
  settings: { reducedMotion: 'on', onboardingDone: true },
});

describe('decodeSave', () => {
  it('round-trips a valid save', () => {
    const data = sample();
    const result = decodeSave(encodeSave(data), findPuzzle);
    expect(result.status).toBe('ok');
    expect(result.data).toEqual(data);
    const restored = toGameState(
      'pair-5x5',
      result.data.active['pair-5x5'] ?? toActiveEntry(createGame(pair)),
    );
    expect(restored.board.marks[19]).toBe('fox');
    expect(restored.history.past).toHaveLength(1);
  });

  it('returns defaults for an empty store', () => {
    expect(decodeSave(null, findPuzzle)).toEqual({ data: DEFAULT_SAVE, status: 'empty', dropped: [] });
  });

  it.each([
    ['not json', '{oops'],
    ['not an object', '[1,2]'],
    ['missing version', '{"progress":{}}'],
    ['future version', '{"schemaVersion":99}'],
  ])('treats %s as corrupt', (_name, raw) => {
    const r = decodeSave(raw, findPuzzle);
    expect(r.status).toBe('corrupt');
    expect(r.data).toEqual(DEFAULT_SAVE);
  });

  it('discards an active board whose puzzle revision changed but keeps completion', () => {
    const data = { ...sample(), active: { 'tiny-4x4': { ...toActiveEntry(play(tiny, [2])), revision: 7 } } };
    const r = decodeSave(JSON.stringify(data), findPuzzle);
    expect(r.status).toBe('repaired');
    expect(r.data.active).toEqual({});
    expect(r.data.progress['tiny-4x4']?.completedRevision).toBe(1);
    expect(r.dropped).toEqual(['active.tiny-4x4']);
  });

  it('drops invalid active boards individually (core parseGameState) and unknown puzzles', () => {
    const good = toActiveEntry(play(pair, [19]));
    const badMarks = { ...toActiveEntry(play(tiny, [2])), marks: ['fox'] };
    const inconsistent = { ...toActiveEntry(play(tiny, [2])), history: { past: [], future: [] } };
    inconsistent.marks = ['wolf', ...inconsistent.marks.slice(1)];
    const raw = JSON.stringify({
      ...sample(),
      active: { 'pair-5x5': good, 'tiny-4x4': badMarks, 'meadow-001': good },
    });
    const r = decodeSave(raw, findPuzzle);
    expect(Object.keys(r.data.active)).toEqual(['pair-5x5']);
    expect([...r.dropped].sort()).toEqual(['active.meadow-001', 'active.tiny-4x4']);
    expect(
      decodeSave(JSON.stringify({ ...sample(), active: { 'tiny-4x4': inconsistent } }), findPuzzle).data
        .active,
    ).toEqual({});
  });

  it('drops invalid progress entries and defaults invalid settings fields', () => {
    const raw = JSON.stringify({
      schemaVersion: 1,
      progress: { a: { completedRevision: 'x' }, b: { completedAt: 'not a date' }, c: {}, d: 5 },
      active: {},
      settings: { reducedMotion: 'sometimes', onboardingDone: true },
    });
    const r = decodeSave(raw, findPuzzle);
    expect(r.data.progress).toEqual({ c: {} });
    expect(r.data.settings).toEqual({ reducedMotion: 'system', onboardingDone: true });
  });
});

describe('migration chain', () => {
  it('v1 needs no steps', () => {
    expect(migrate({ schemaVersion: 1, x: 1 })).toEqual({ schemaVersion: 1, x: 1 });
  });

  it('applies ordered vN→vN+1 steps up to the target', () => {
    const order: string[] = [];
    const migrations = {
      1: (raw: Record<string, unknown>) => {
        order.push('1→2');
        return { ...raw, schemaVersion: 2, a: true };
      },
      2: (raw: Record<string, unknown>) => {
        order.push('2→3');
        return { ...raw, schemaVersion: 3, b: true };
      },
    };
    expect(migrate({ schemaVersion: 1 }, migrations, 3)).toEqual({ schemaVersion: 3, a: true, b: true });
    expect(order).toEqual(['1→2', '2→3']);
    expect(migrate({ schemaVersion: 2 }, migrations, 3)).toEqual({ schemaVersion: 3, b: true });
  });

  it('fails safely on a missing or misbehaving step', () => {
    expect(migrate({ schemaVersion: 1 }, {}, 2)).toBeNull();
    expect(migrate({ schemaVersion: 1 }, { 1: (r) => ({ ...r, schemaVersion: 5 }) }, 2)).toBeNull();
    expect(migrate({ schemaVersion: 0 })).toBeNull();
  });
});

describe('save store', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('loads, then debounces writes and flushes on demand', async () => {
    const storage = createMemoryStorage({ [SAVE_KEY]: encodeSave(sample()) });
    const store = createSaveStore({ adapter: storage, findPuzzle, debounceMs: 500 });
    expect(store.getSnapshot().loaded).toBe(false);
    await store.load();
    expect(store.getSnapshot().loaded).toBe(true);
    expect(store.getSnapshot().data).toEqual(sample());

    const set = jest.spyOn(storage, 'set');
    store.setActive('tiny-4x4', play(tiny, [2]));
    store.setActive('tiny-4x4', play(tiny, [2, 9]));
    jest.advanceTimersByTime(499);
    expect(set).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    await Promise.resolve();
    expect(set).toHaveBeenCalledTimes(1);
    const written = decodeSave(storage.data.get(SAVE_KEY) ?? null, findPuzzle).data;
    expect(written.active['tiny-4x4']?.marks.filter((m) => m === 'fox')).toHaveLength(2);

    store.updateSettings({ onboardingDone: false });
    await store.flush();
    expect(set).toHaveBeenCalledTimes(2);
    expect(decodeSave(storage.data.get(SAVE_KEY) ?? null, findPuzzle).data.settings.onboardingDone).toBe(
      false,
    );
    jest.advanceTimersByTime(1000);
    expect(set).toHaveBeenCalledTimes(2); // the flush cancelled the pending timer
  });

  it('records completion with an ISO timestamp and clears boards', async () => {
    const storage = createMemoryStorage();
    const store = createSaveStore({
      adapter: storage,
      findPuzzle,
      now: () => new Date('2026-11-26T12:00:00Z'),
    });
    await store.load();
    const listener = jest.fn();
    store.subscribe(listener);
    store.setActive('tiny-4x4', play(tiny, [2]));
    store.markCompleted('tiny-4x4', 1);
    expect(store.getSnapshot().data.progress['tiny-4x4']).toEqual({
      completedRevision: 1,
      completedAt: '2026-11-26T12:00:00.000Z',
    });
    store.clearActive('tiny-4x4');
    store.clearActive('tiny-4x4'); // no-op
    expect(store.getSnapshot().data.active).toEqual({});
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it('backs up a corrupt save under a counter key, starts from defaults, and never throws', async () => {
    const storage = createMemoryStorage({ [SAVE_KEY]: '{broken', [`${BACKUP_KEY_PREFIX}1`]: 'older' });
    const store = createSaveStore({ adapter: storage, findPuzzle });
    await store.load();
    expect(store.getSnapshot().data).toEqual(DEFAULT_SAVE);
    expect(storage.data.get(`${BACKUP_KEY_PREFIX}1`)).toBe('older');
    expect(storage.data.get(`${BACKUP_KEY_PREFIX}2`)).toBe('{broken');
    expect(decodeSave(storage.data.get(SAVE_KEY) ?? null, findPuzzle).status).toBe('ok');
  });

  it('keeps playing from memory when storage fails', async () => {
    const failing: StorageAdapter = {
      get: () => Promise.reject(new Error('nope')),
      set: () => Promise.reject(new Error('nope')),
      remove: () => Promise.reject(new Error('nope')),
    };
    const store = createSaveStore({ adapter: failing, findPuzzle });
    await expect(store.load()).resolves.toBeUndefined();
    store.setActive('tiny-4x4', play(tiny, [2]));
    await expect(store.flush()).resolves.toBeUndefined();
    expect(store.getSnapshot().data.active['tiny-4x4']).toBeDefined();
  });

  it('rewrites a repaired save so dropped entries do not linger', async () => {
    const raw = JSON.stringify({ ...sample(), active: { 'meadow-001': toActiveEntry(play(tiny, [2])) } });
    const storage = createMemoryStorage({ [SAVE_KEY]: raw });
    await createSaveStore({ adapter: storage, findPuzzle }).load();
    expect(JSON.parse(storage.data.get(SAVE_KEY) ?? '{}').active).toEqual({});
  });
});
