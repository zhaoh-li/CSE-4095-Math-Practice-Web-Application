import { DIFFICULTY_LEVELS, MATH_OPERATIONS } from '../../types';
import { createSeededRandom } from '../random';
import {
  additionDistractors,
  divisionDistractors,
  generateAnswerChoices,
  generateDistractors,
  multiplicationDistractors,
  subtractionDistractors,
} from './answerChoices';
import type { QuestionFacts } from './buildQuestion';
import { OPERATION_GENERATORS } from './operations';

const facts = (
  operation: QuestionFacts['operation'],
  firstOperand: number,
  secondOperand: number,
  correctAnswer: number,
): QuestionFacts => ({ operation, firstOperand, secondOperand, correctAnswer });

function expectGoodDistractors(f: QuestionFacts, distractors: number[]) {
  expect(distractors).toHaveLength(3);
  expect(new Set(distractors).size).toBe(3);
  for (const d of distractors) {
    expect(d).not.toBe(f.correctAnswer);
    expect(Number.isInteger(d)).toBe(true);
    expect(d).toBeGreaterThanOrEqual(0);
  }
}

describe('generateDistractors', () => {
  it('gives three unique, whole, non-negative wrong answers for every operation and level', () => {
    const random = createSeededRandom(99);
    for (const operation of MATH_OPERATIONS) {
      for (const difficulty of DIFFICULTY_LEVELS) {
        for (let i = 0; i < 100; i++) {
          const q = OPERATION_GENERATORS[operation](difficulty, random);
          expectGoodDistractors(q, generateDistractors(q, random));
        }
      }
    }
  });

  it.each([
    ['0 + 0', facts('addition', 0, 0, 0)],
    ['1 − 1', facts('subtraction', 1, 1, 0)],
    ['1 − 0', facts('subtraction', 1, 0, 1)],
    ['0 × 7', facts('multiplication', 0, 7, 0)],
    ['0 × 0', facts('multiplication', 0, 0, 0)],
    ['0 ÷ 5', facts('division', 0, 5, 0)],
    ['1 ÷ 1', facts('division', 1, 1, 1)],
  ])('handles answers near zero: %s', (_label, f) => {
    for (let seed = 0; seed < 20; seed++) {
      expectGoodDistractors(f, generateDistractors(f, createSeededRandom(seed)));
    }
  });

  it('finishes even when the random source is stuck', () => {
    const f = facts('addition', 0, 0, 0);
    expectGoodDistractors(
      f,
      generateDistractors(f, () => 0),
    );
  });

  it('keeps wrong answers close to the correct one', () => {
    const f = facts('addition', 400, 500, 900);
    for (let seed = 0; seed < 20; seed++) {
      for (const d of generateDistractors(f, createSeededRandom(seed))) {
        expect(Math.abs(d - 900)).toBeLessThanOrEqual(900);
      }
    }
  });

  it('can allow negative answers when asked', () => {
    const f = facts('subtraction', 1, 1, 0);
    const all = new Set<number>();
    for (let seed = 0; seed < 30; seed++) {
      generateDistractors(f, createSeededRandom(seed), { allowNegative: true }).forEach((d) =>
        all.add(d),
      );
    }
    expect([...all].some((d) => d < 0)).toBe(true);
  });
});

describe('operation-specific distractors', () => {
  it('addition includes a forgot-to-carry answer', () => {
    // 27 + 15 = 42; forgetting the carry gives 32
    expect(additionDistractors(27, 15, 42)).toContain(32);
  });

  it('addition includes subtracting by mistake', () => {
    expect(additionDistractors(9, 4, 13)).toContain(5);
  });

  it('subtraction includes a borrowing mistake and adding by mistake', () => {
    // 52 − 17 = 35; subtracting smaller digits from larger gives 45
    const candidates = subtractionDistractors(52, 17, 35);
    expect(candidates).toContain(45);
    expect(candidates).toContain(69);
  });

  it('multiplication includes neighboring times-table facts', () => {
    // 7 × 8 = 56
    expect(multiplicationDistractors(7, 8)).toEqual(expect.arrayContaining([64, 48, 63, 49, 15]));
  });

  it('division includes fact-family mix-ups', () => {
    // 24 ÷ 6 = 4: off by one (3, 5), or picking the divisor (6)
    const candidates = divisionDistractors(24, 6, 4);
    expect(candidates).toEqual(expect.arrayContaining([3, 5, 6]));
    // 24 ÷ 4 = 6: neighbor divisor 3 gives 8
    expect(divisionDistractors(24, 4, 6)).toContain(8);
  });
});

describe('generateAnswerChoices', () => {
  it('returns four unique choices with the correct answer exactly once', () => {
    const random = createSeededRandom(11);
    for (let i = 0; i < 200; i++) {
      const q = OPERATION_GENERATORS.multiplication('easy', random);
      const choices = generateAnswerChoices(q, random);
      expect(choices).toHaveLength(4);
      expect(new Set(choices).size).toBe(4);
      expect(choices.filter((c) => c === q.correctAnswer)).toHaveLength(1);
    }
  });

  it('puts the correct answer in every position about equally often', () => {
    const random = createSeededRandom(2024);
    const positions = [0, 0, 0, 0];
    const runs = 4000;
    for (let i = 0; i < runs; i++) {
      const f = facts('addition', 3, 4, 7);
      positions[generateAnswerChoices(f, random).indexOf(7)] += 1;
    }
    for (const count of positions) {
      // Expect about 1000 each; allow a generous margin
      expect(count).toBeGreaterThan(850);
      expect(count).toBeLessThan(1150);
    }
  });
});
