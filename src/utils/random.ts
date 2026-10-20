/** Returns a number in [0, 1), like Math.random. Injectable so tests can be repeatable. */
export type RandomSource = () => number;

/** Random whole number from min to max, both included. */
export function randomInt(min: number, max: number, random: RandomSource = Math.random): number {
  if (!Number.isInteger(min) || !Number.isInteger(max)) {
    throw new RangeError(`randomInt needs whole numbers, got ${min} and ${max}`);
  }
  if (min > max) {
    throw new RangeError(`randomInt min (${min}) is greater than max (${max})`);
  }
  return min + Math.floor(random() * (max - min + 1));
}

/** Returns a shuffled copy of the array (Fisher–Yates). The input is not changed. */
export function shuffle<T>(items: readonly T[], random: RandomSource = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(0, i, random);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Picks one item at random. Throws if the array is empty. */
export function pickRandom<T>(items: readonly T[], random: RandomSource = Math.random): T {
  if (items.length === 0) throw new RangeError('pickRandom needs at least one item');
  return items[randomInt(0, items.length - 1, random)];
}

/**
 * A seeded random source (mulberry32). The same seed always gives the same
 * sequence, which makes tests of random behavior repeatable.
 */
export function createSeededRandom(seed: number): RandomSource {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
