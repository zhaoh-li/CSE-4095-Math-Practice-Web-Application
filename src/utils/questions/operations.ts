import { DIFFICULTY_RULES } from '../../config/difficultyRules';
import type { DifficultyLevel, MathOperation, Question } from '../../types';
import { randomInt, type RandomSource } from '../random';
import { buildQuestion } from './buildQuestion';

/** Addition: both addends in range, and the sum never above the level's maximum. */
export function generateAdditionQuestion(
  difficulty: DifficultyLevel,
  random: RandomSource = Math.random,
): Question {
  const { operand, maxResult } = DIFFICULTY_RULES[difficulty].addition;
  const first = randomInt(operand.min, Math.min(operand.max, maxResult - operand.min), random);
  const second = randomInt(operand.min, Math.min(operand.max, maxResult - first), random);
  return buildQuestion(
    {
      operation: 'addition',
      firstOperand: first,
      secondOperand: second,
      correctAnswer: first + second,
    },
    difficulty,
    random,
  );
}

/** Subtraction: the first number is never smaller than the second, so answers are never negative. */
export function generateSubtractionQuestion(
  difficulty: DifficultyLevel,
  random: RandomSource = Math.random,
): Question {
  const { minuend, subtrahend } = DIFFICULTY_RULES[difficulty].subtraction;
  const first = randomInt(Math.max(minuend.min, subtrahend.min), minuend.max, random);
  const second = randomInt(subtrahend.min, Math.min(subtrahend.max, first), random);
  return buildQuestion(
    {
      operation: 'subtraction',
      firstOperand: first,
      secondOperand: second,
      correctAnswer: first - second,
    },
    difficulty,
    random,
  );
}

/** Multiplication: one factor from the level's times tables; the order is mixed up. */
export function generateMultiplicationQuestion(
  difficulty: DifficultyLevel,
  random: RandomSource = Math.random,
): Question {
  const { tableFactor, otherFactor } = DIFFICULTY_RULES[difficulty].multiplication;
  const table = randomInt(tableFactor.min, tableFactor.max, random);
  const other = randomInt(otherFactor.min, otherFactor.max, random);
  const [first, second] = random() < 0.5 ? [table, other] : [other, table];
  return buildQuestion(
    {
      operation: 'multiplication',
      firstOperand: first,
      secondOperand: second,
      correctAnswer: first * second,
    },
    difficulty,
    random,
  );
}

/**
 * Division: picks a divisor (never 0) and a whole-number quotient, then
 * works backwards to the dividend. Answers are always whole numbers.
 */
export function generateDivisionQuestion(
  difficulty: DifficultyLevel,
  random: RandomSource = Math.random,
): Question {
  const { divisor: divisorRange, quotient: quotientRange } = DIFFICULTY_RULES[difficulty].division;
  const divisor = randomInt(Math.max(1, divisorRange.min), divisorRange.max, random);
  const quotient = randomInt(quotientRange.min, quotientRange.max, random);
  return buildQuestion(
    {
      operation: 'division',
      firstOperand: divisor * quotient,
      secondOperand: divisor,
      correctAnswer: quotient,
    },
    difficulty,
    random,
  );
}

export const OPERATION_GENERATORS: Record<
  MathOperation,
  (difficulty: DifficultyLevel, random?: RandomSource) => Question
> = {
  addition: generateAdditionQuestion,
  subtraction: generateSubtractionQuestion,
  multiplication: generateMultiplicationQuestion,
  division: generateDivisionQuestion,
};
