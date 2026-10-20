import { DIFFICULTY_RULES } from '../../config/difficultyRules';
import { DIFFICULTY_LEVELS, type DifficultyLevel, type Question } from '../../types';
import { createSeededRandom, type RandomSource } from '../random';
import {
  generateAdditionQuestion,
  generateDivisionQuestion,
  generateMultiplicationQuestion,
  generateSubtractionQuestion,
} from './operations';
import { getQuestionErrors } from './validateQuestion';

const RUNS = 300;

function sample(
  generator: (d: DifficultyLevel, r: RandomSource) => Question,
  difficulty: DifficultyLevel,
  seed = 123,
): Question[] {
  const random = createSeededRandom(seed);
  return Array.from({ length: RUNS }, () => generator(difficulty, random));
}

const lowest: RandomSource = () => 0;
const highest: RandomSource = () => 0.999999;

describe.each(DIFFICULTY_LEVELS)('%s questions', (difficulty) => {
  const rules = DIFFICULTY_RULES[difficulty];

  it('addition stays within operand and result limits', () => {
    const { operand, maxResult } = rules.addition;
    for (const q of sample(generateAdditionQuestion, difficulty)) {
      expect(getQuestionErrors(q)).toEqual([]);
      expect(q.operation).toBe('addition');
      for (const n of [q.firstOperand, q.secondOperand]) {
        expect(n).toBeGreaterThanOrEqual(operand.min);
        expect(n).toBeLessThanOrEqual(operand.max);
      }
      expect(q.correctAnswer).toBe(q.firstOperand + q.secondOperand);
      expect(q.correctAnswer).toBeLessThanOrEqual(maxResult);
      expect(q.displayText).toContain('+');
    }
  });

  it('addition reaches the minimum operands and never passes the maximum result', () => {
    const { operand, maxResult } = rules.addition;
    const low = generateAdditionQuestion(difficulty, lowest);
    expect(low.firstOperand).toBe(operand.min);
    expect(low.secondOperand).toBe(operand.min);
    const high = generateAdditionQuestion(difficulty, highest);
    expect(high.correctAnswer).toBeLessThanOrEqual(maxResult);
  });

  it('subtraction never gives a negative answer', () => {
    const { minuend } = rules.subtraction;
    for (const q of sample(generateSubtractionQuestion, difficulty)) {
      expect(getQuestionErrors(q)).toEqual([]);
      expect(q.firstOperand).toBeGreaterThanOrEqual(q.secondOperand);
      expect(q.firstOperand).toBeLessThanOrEqual(minuend.max);
      expect(q.correctAnswer).toBe(q.firstOperand - q.secondOperand);
      expect(q.correctAnswer).toBeGreaterThanOrEqual(0);
      expect(q.displayText).toContain('−');
    }
    // Even at the extremes of the random source
    for (const random of [lowest, highest]) {
      const q = generateSubtractionQuestion(difficulty, random);
      expect(q.firstOperand).toBeGreaterThanOrEqual(q.secondOperand);
    }
  });

  it('multiplication factors match the level', () => {
    const { tableFactor, otherFactor } = rules.multiplication;
    const inRange = (n: number, r: { min: number; max: number }) => n >= r.min && n <= r.max;
    for (const q of sample(generateMultiplicationQuestion, difficulty)) {
      expect(getQuestionErrors(q)).toEqual([]);
      const [a, b] = [q.firstOperand, q.secondOperand];
      const fits =
        (inRange(a, tableFactor) && inRange(b, otherFactor)) ||
        (inRange(b, tableFactor) && inRange(a, otherFactor));
      expect(fits).toBe(true);
      expect(q.correctAnswer).toBe(a * b);
      expect(q.displayText).toContain('×');
    }
  });

  it('multiplication covers the full factor range', () => {
    const { tableFactor } = rules.multiplication;
    const factors = new Set(
      sample(generateMultiplicationQuestion, difficulty).flatMap((q) => [
        q.firstOperand,
        q.secondOperand,
      ]),
    );
    expect(factors).toContain(tableFactor.min);
    expect(factors).toContain(tableFactor.max);
  });

  it('division never divides by zero and always has a whole-number answer', () => {
    const { divisor, quotient } = rules.division;
    for (const q of sample(generateDivisionQuestion, difficulty)) {
      expect(getQuestionErrors(q)).toEqual([]);
      expect(q.secondOperand).not.toBe(0);
      expect(q.secondOperand).toBeGreaterThanOrEqual(divisor.min);
      expect(q.secondOperand).toBeLessThanOrEqual(divisor.max);
      expect(Number.isInteger(q.correctAnswer)).toBe(true);
      expect(q.firstOperand % q.secondOperand).toBe(0);
      expect(q.firstOperand / q.secondOperand).toBe(q.correctAnswer);
      expect(q.correctAnswer).toBeGreaterThanOrEqual(quotient.min);
      expect(q.correctAnswer).toBeLessThanOrEqual(quotient.max);
      expect(q.displayText).toContain('÷');
    }
    // The lowest possible divisor is still not zero
    expect(generateDivisionQuestion(difficulty, lowest).secondOperand).toBeGreaterThan(0);
  });
});

describe('question objects', () => {
  it('have an ID, the difficulty, regular source, and readable text', () => {
    const q = generateAdditionQuestion('advanced', createSeededRandom(5));
    expect(q.id).toBeTruthy();
    expect(q.difficulty).toBe('advanced');
    expect(q.source).toBe('regular');
    expect(q.displayText).toMatch(/^[\d,]+ \+ [\d,]+$/);
  });

  it('formats large numbers with commas', () => {
    const q = generateSubtractionQuestion('advanced', highest);
    expect(q.displayText).toMatch(/^1,000 − /);
  });
});
