import { render } from '@testing-library/react-native';
import { createGame, createPuzzleOrThrow } from '@ww/puzzle-core';
import { FIXTURES } from '@ww/puzzle-core/testing';
import { AppState, type AppStateStatus, Platform, Text } from 'react-native';
import { createMemoryStorage } from '../src/storage/adapter';
import { SaveProvider, useSave } from '../src/storage/SaveProvider';
import { SAVE_KEY } from '../src/storage/saveData';
import { createSaveStore } from '../src/storage/store';

const tiny = createPuzzleOrThrow(FIXTURES.tiny4x4.definition);

function Probe() {
  const save = useSave();
  return <Text testID="probe">{save.loaded ? 'loaded' : 'loading'}</Text>;
}

describe('SaveProvider', () => {
  it('loads on mount and flushes pending writes when the app leaves the foreground', async () => {
    let handler: ((s: AppStateStatus) => void) | undefined;
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, h) => {
      handler = h as (s: AppStateStatus) => void;
      return { remove: jest.fn() };
    });
    const storage = createMemoryStorage();
    const store = createSaveStore({ adapter: storage, findPuzzle: () => tiny, debounceMs: 60_000 });
    const { findByText } = await render(
      <SaveProvider store={store}>
        <Probe />
      </SaveProvider>,
    );
    expect(await findByText('loaded')).toBeOnTheScreen();

    store.setActive(tiny.definition.id, createGame(tiny));
    expect(storage.data.has(SAVE_KEY)).toBe(false); // still debounced
    handler?.('background');
    expect(storage.data.has(SAVE_KEY)).toBe(true);
  });

  it('on web, flushes pending writes on pagehide (reload or navigation inside the debounce)', async () => {
    jest.replaceProperty(Platform, 'OS', 'web');
    const listeners = new Map<string, () => void>();
    const add = jest.fn((type: string, fn: () => void) => listeners.set(type, fn));
    const remove = jest.fn();
    // The native jest environment has no DOM event API on the global object; fake just the two methods we need.
    const win = globalThis as unknown as { addEventListener?: unknown; removeEventListener?: unknown };
    const saved = { add: win.addEventListener, remove: win.removeEventListener };
    win.addEventListener = add;
    win.removeEventListener = remove;
    try {
      const storage = createMemoryStorage();
      const store = createSaveStore({ adapter: storage, findPuzzle: () => tiny, debounceMs: 60_000 });
      const { findByText, unmount } = await render(
        <SaveProvider store={store}>
          <Probe />
        </SaveProvider>,
      );
      expect(await findByText('loaded')).toBeOnTheScreen();
      store.setActive(tiny.definition.id, createGame(tiny));
      expect(storage.data.has(SAVE_KEY)).toBe(false);
      listeners.get('pagehide')?.();
      expect(storage.data.has(SAVE_KEY)).toBe(true);
      await unmount();
      expect(remove).toHaveBeenCalledWith('pagehide', expect.any(Function));
    } finally {
      win.addEventListener = saved.add;
      win.removeEventListener = saved.remove;
    }
  });
});
