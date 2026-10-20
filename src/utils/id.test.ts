import { createId } from './id';

describe('createId', () => {
  it('creates unique non-empty strings', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => createId()));
    expect(ids.size).toBe(1000);
    for (const id of ids) expect(id.length).toBeGreaterThan(0);
  });

  it('still works when crypto.randomUUID is unavailable', () => {
    const original = crypto.randomUUID;
    Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true });
    try {
      const a = createId();
      const b = createId();
      expect(a).toMatch(/^id-/);
      expect(a).not.toBe(b);
    } finally {
      Object.defineProperty(crypto, 'randomUUID', { value: original, configurable: true });
    }
  });
});
