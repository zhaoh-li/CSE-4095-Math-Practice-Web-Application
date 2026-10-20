import {
  STORAGE_PREFIX,
  createMemoryStorage,
  createStorageService,
  getBrowserStorage,
  isQuotaError,
  type ReadResult,
} from './storage';

const parseNumber = (raw: unknown): ReadResult<number> =>
  typeof raw === 'number' ? { value: raw } : { value: 0, problem: 'invalid' };

/** A Storage whose methods all throw, like a browser with storage blocked. */
function brokenStorage(): Storage {
  const fail = () => {
    throw new DOMException('Access denied', 'SecurityError');
  };
  return {
    length: 0,
    clear: fail,
    getItem: fail,
    key: fail,
    removeItem: fail,
    setItem: fail,
  };
}

describe('createStorageService', () => {
  it('writes and reads JSON values under the app prefix', () => {
    const backend = createMemoryStorage();
    const storage = createStorageService(backend);
    expect(storage.write('score', 42)).toEqual({ ok: true });
    expect(backend.getItem(`${STORAGE_PREFIX}score`)).toBe('42');
    expect(storage.read('score', parseNumber, 0)).toEqual({ value: 42 });
  });

  it('returns the fallback when nothing is stored', () => {
    const storage = createStorageService(createMemoryStorage());
    expect(storage.read('missing', parseNumber, 7)).toEqual({ value: 7 });
  });

  it('recovers from broken JSON', () => {
    const backend = createMemoryStorage();
    backend.setItem(`${STORAGE_PREFIX}score`, '{not json');
    const storage = createStorageService(backend);
    expect(storage.read('score', parseNumber, 0)).toEqual({ value: 0, problem: 'parse' });
  });

  it('reports invalid data using the parser', () => {
    const backend = createMemoryStorage();
    backend.setItem(`${STORAGE_PREFIX}score`, '"hello"');
    const storage = createStorageService(backend);
    expect(storage.read('score', parseNumber, 0)).toEqual({ value: 0, problem: 'invalid' });
  });

  it('recovers when the parser throws', () => {
    const backend = createMemoryStorage();
    backend.setItem(`${STORAGE_PREFIX}score`, '1');
    const storage = createStorageService(backend);
    const throwingParser = (): ReadResult<number> => {
      throw new Error('boom');
    };
    expect(storage.read('score', throwingParser, 5)).toEqual({ value: 5, problem: 'invalid' });
  });

  it('reports a full storage instead of crashing', () => {
    const backend = createMemoryStorage();
    backend.setItem = () => {
      throw new DOMException('Full', 'QuotaExceededError');
    };
    const storage = createStorageService(backend);
    expect(storage.write('big', 'x')).toEqual({ ok: false, problem: 'quota' });
  });

  it('handles storage that throws on every call', () => {
    const storage = createStorageService(brokenStorage());
    expect(storage.read('score', parseNumber, 3)).toEqual({ value: 3, problem: 'unavailable' });
    expect(storage.write('score', 1)).toEqual({ ok: false, problem: 'unknown' });
    expect(() => storage.remove('score')).not.toThrow();
    expect(storage.keys()).toEqual([]);
  });

  it('falls back to memory when there is no browser storage', () => {
    const storage = createStorageService(null);
    expect(storage.isPersistent).toBe(false);
    storage.write('score', 9);
    expect(storage.read('score', parseNumber, 0).value).toBe(9);
  });

  it('only lists and clears its own keys', () => {
    const backend = createMemoryStorage();
    backend.setItem('someOtherApp', 'keep me');
    const storage = createStorageService(backend);
    storage.write('a', 1);
    storage.write('b', 2);

    expect(storage.keys().sort()).toEqual(['a', 'b']);
    storage.clearAll();
    expect(storage.keys()).toEqual([]);
    expect(backend.getItem('someOtherApp')).toBe('keep me');
  });
});

describe('getBrowserStorage', () => {
  it('returns localStorage when it works', () => {
    expect(getBrowserStorage()).toBe(window.localStorage);
  });

  it('returns null when localStorage throws', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError');
    });
    expect(getBrowserStorage()).toBeNull();
    spy.mockRestore();
  });
});

describe('isQuotaError', () => {
  it.each([
    [new DOMException('x', 'QuotaExceededError'), true],
    [new DOMException('x', 'NS_ERROR_DOM_QUOTA_REACHED'), true],
    [new DOMException('x', 'SecurityError'), false],
    [new Error('x'), false],
  ])('%s → %s', (error, expected) => {
    expect(isQuotaError(error)).toBe(expected);
  });
});
