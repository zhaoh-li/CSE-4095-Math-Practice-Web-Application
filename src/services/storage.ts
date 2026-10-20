/**
 * A safe wrapper around browser storage.
 *
 * - Every key is prefixed so the app never touches other sites' or apps' data.
 * - Reading never throws: bad JSON or invalid data falls back to a default.
 * - Writing reports problems (storage blocked, storage full) instead of crashing.
 * - If storage is unavailable (private mode, blocked cookies), an in-memory
 *   store is used so the app still works until the page is closed.
 */

export const STORAGE_PREFIX = 'mathPractice:';

export type StorageProblem = 'unavailable' | 'quota' | 'parse' | 'invalid' | 'unknown';

export type WriteResult = { ok: true } | { ok: false; problem: StorageProblem };

export interface ReadResult<T> {
  value: T;
  /** Set when the stored data could not be used as-is. */
  problem?: StorageProblem;
}

export interface StorageService {
  /** False when data only lives in memory and will be lost on refresh. */
  readonly isPersistent: boolean;
  read<T>(key: string, parse: (raw: unknown) => ReadResult<T>, fallback: T): ReadResult<T>;
  write(key: string, value: unknown): WriteResult;
  remove(key: string): void;
  /** Removes only this app's keys. */
  clearAll(): void;
  /** This app's keys, without the prefix. */
  keys(): string[];
}

/** Returns browser localStorage if it actually works, otherwise null. */
export function getBrowserStorage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const testKey = `${STORAGE_PREFIX}__test__`;
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return window.localStorage;
  } catch {
    return null;
  }
}

/** A Storage-compatible object that keeps data in memory only. */
export function createMemoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => {
      data.delete(key);
    },
    setItem: (key, value) => {
      data.set(key, String(value));
    },
  };
}

export function isQuotaError(error: unknown): boolean {
  if (!(error instanceof DOMException)) return false;
  return (
    error.name === 'QuotaExceededError' ||
    error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    error.code === 22 ||
    error.code === 1014
  );
}

export function createStorageService(
  backend: Storage | null = getBrowserStorage(),
): StorageService {
  const isPersistent = backend !== null;
  const store = backend ?? createMemoryStorage();
  const fullKey = (key: string) => `${STORAGE_PREFIX}${key}`;

  function keys(): string[] {
    const result: string[] = [];
    try {
      for (let i = 0; i < store.length; i++) {
        const key = store.key(i);
        if (key?.startsWith(STORAGE_PREFIX)) result.push(key.slice(STORAGE_PREFIX.length));
      }
    } catch {
      // Treat unreadable storage as empty
    }
    return result;
  }

  return {
    isPersistent,

    read(key, parse, fallback) {
      let raw: string | null;
      try {
        raw = store.getItem(fullKey(key));
      } catch {
        return { value: fallback, problem: 'unavailable' };
      }
      if (raw === null) return { value: fallback };

      let json: unknown;
      try {
        json = JSON.parse(raw);
      } catch {
        return { value: fallback, problem: 'parse' };
      }

      try {
        return parse(json);
      } catch {
        return { value: fallback, problem: 'invalid' };
      }
    },

    write(key, value) {
      try {
        store.setItem(fullKey(key), JSON.stringify(value));
        return { ok: true };
      } catch (error) {
        return { ok: false, problem: isQuotaError(error) ? 'quota' : 'unknown' };
      }
    },

    remove(key) {
      try {
        store.removeItem(fullKey(key));
      } catch {
        // Nothing useful to do if removal fails
      }
    },

    clearAll() {
      for (const key of keys()) this.remove(key);
    },

    keys,
  };
}
