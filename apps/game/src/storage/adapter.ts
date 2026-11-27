/** Key-value storage boundary (ADR-0007). Only `asyncStorageAdapter.ts` touches a concrete storage backend. */
export interface StorageAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

export interface MemoryStorage extends StorageAdapter {
  /** Direct view of stored values, for tests. */
  readonly data: Map<string, string>;
}

/** In-memory adapter for tests and as a safe fallback. */
export function createMemoryStorage(initial: Readonly<Record<string, string>> = {}): MemoryStorage {
  const data = new Map(Object.entries(initial));
  return {
    data,
    get: async (key) => data.get(key) ?? null,
    set: async (key, value) => {
      data.set(key, value);
    },
    remove: async (key) => {
      data.delete(key);
    },
  };
}
