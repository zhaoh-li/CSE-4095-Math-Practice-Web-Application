import { createSeededRandom, pickRandom, randomInt, shuffle } from './random';

describe('randomInt', () => {
  it('stays within the range, including both ends', () => {
    const random = createSeededRandom(1);
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) {
      const value = randomInt(3, 7, random);
      expect(value).toBeGreaterThanOrEqual(3);
      expect(value).toBeLessThanOrEqual(7);
      expect(Number.isInteger(value)).toBe(true);
      seen.add(value);
    }
    expect([...seen].sort()).toEqual([3, 4, 5, 6, 7]);
  });

  it('returns min when min equals max', () => {
    expect(randomInt(4, 4)).toBe(4);
  });

  it('handles the extreme ends of the random source', () => {
    expect(randomInt(0, 9, () => 0)).toBe(0);
    expect(randomInt(0, 9, () => 0.999999)).toBe(9);
  });

  it('rejects invalid ranges', () => {
    expect(() => randomInt(5, 1)).toThrow(RangeError);
    expect(() => randomInt(0.5, 3)).toThrow(RangeError);
  });
});

describe('shuffle', () => {
  it('keeps the same items and does not change the input', () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffle(input, createSeededRandom(2));
    expect(result).toHaveLength(5);
    expect([...result].sort()).toEqual([1, 2, 3, 4, 5]);
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });

  it('produces different orders', () => {
    const random = createSeededRandom(3);
    const orders = new Set<string>();
    for (let i = 0; i < 50; i++) orders.add(shuffle([1, 2, 3, 4], random).join(','));
    expect(orders.size).toBeGreaterThan(10);
  });

  it('handles empty and single-item arrays', () => {
    expect(shuffle([])).toEqual([]);
    expect(shuffle(['a'])).toEqual(['a']);
  });
});

describe('pickRandom', () => {
  it('returns an item from the array', () => {
    expect(['a', 'b', 'c']).toContain(pickRandom(['a', 'b', 'c']));
  });

  it('throws on an empty array', () => {
    expect(() => pickRandom([])).toThrow(RangeError);
  });
});

describe('createSeededRandom', () => {
  it('repeats the same sequence for the same seed', () => {
    const a = createSeededRandom(42);
    const b = createSeededRandom(42);
    for (let i = 0; i < 10; i++) expect(a()).toBe(b());
  });

  it('returns values in [0, 1)', () => {
    const random = createSeededRandom(7);
    for (let i = 0; i < 1000; i++) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});
