import { createContext, type ReactNode, useContext, useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import type { SaveSnapshot, SaveStore } from './store.ts';

const SaveContext = createContext<SaveStore | null>(null);

/** Loads the save on mount and flushes pending writes when the app goes to the background. */
export function SaveProvider({ store, children }: { store: SaveStore; children: ReactNode }) {
  useEffect(() => {
    void store.load();
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') void store.flush();
    });
    return () => {
      sub.remove();
      void store.flush();
    };
  }, [store]);
  return <SaveContext.Provider value={store}>{children}</SaveContext.Provider>;
}

export function useSaveStore(): SaveStore {
  const store = useContext(SaveContext);
  if (!store) throw new Error('useSaveStore must be used inside <SaveProvider>');
  return store;
}

export function useSave(): SaveSnapshot {
  const store = useSaveStore();
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}
