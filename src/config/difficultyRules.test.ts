import { DIFFICULTY_LEVELS, type DifficultyLevel } from '../types';
import { DIFFICULTY_RULES } from './difficultyRules';

/**
 * The upper limits from SPECIFICATION.md section 5. The app may use smaller
 * ranges (e.g. no ×0 or ×1 at Intermediate) but must never go beyond these.
 */
const SPEC_LIMITS: Record<
  DifficultyLevel,
  { addend: number; subtractionValue: number; factor: number; divisor: number; quotient?: number }
> = {
  beginner: { addend: 10, subtractionValue: 10, factor: 5, divisor: 5 },
  easy: { addend: 20, subtractionValue: 20, factor: 10, divisor: 10 },
  intermediate: { addend: 100, subtractionValue: 100, factor: 12, divisor: 12, quotient: 12 },
  advanced: { addend: 1000, subtractionValue: 1000, factor: 20, divisor: Infinity },
};

describe.each(DIFFICULTY_LEVELS)('%s ranges stay within the specification', (level) => {
  const rules = DIFFICULTY_RULES[level];
  const limit = SPEC_LIMITS[level];

  it('addition', () => {
    expect(rules.addition.operand.min).toBeGreaterThanOrEqual(0);
    expect(rules.addition.operand.max).toBeLessThanOrEqual(limit.addend);
  });

  it('subtraction (never negative, values within the limit)', () => {
    expect(rules.subtraction.subtrahend.min).toBeGreaterThanOrEqual(0);
    expect(rules.subtraction.minuend.max).toBeLessThanOrEqual(limit.subtractionValue);
  });

  it('multiplication', () => {
    const { tableFactor, otherFactor } = rules.multiplication;
    expect(Math.min(tableFactor.min, otherFactor.min)).toBeGreaterThanOrEqual(0);
    expect(tableFactor.max).toBeLessThanOrEqual(limit.factor);
    expect(otherFactor.max).toBeLessThanOrEqual(limit.factor);
  });

  it('division (never by zero, exact answers, divisors within the limit)', () => {
    const { divisor, quotient } = rules.division;
    expect(divisor.min).toBeGreaterThanOrEqual(1);
    expect(divisor.max).toBeLessThanOrEqual(limit.divisor);
    if (limit.quotient !== undefined) expect(quotient.max).toBeLessThanOrEqual(limit.quotient);
  });
});
