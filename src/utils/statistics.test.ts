import { calculateAccuracy } from './statistics';

describe('calculateAccuracy', () => {
  it.each([
    [8, 10, 80],
    [10, 10, 100],
    [0, 10, 0],
    [1, 3, 33],
    [2, 3, 67],
  ])('%i of %i correct is %i%%', (correct, attempted, expected) => {
    expect(calculateAccuracy(correct, attempted)).toBe(expected);
  });

  it('returns 0 instead of dividing by zero', () => {
    expect(calculateAccuracy(0, 0)).toBe(0);
  });
});
