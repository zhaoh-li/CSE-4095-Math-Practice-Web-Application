import { randomInt, shuffle, type RandomSource } from '../random';
import type { QuestionFacts } from './buildQuestion';

const DISTRACTOR_COUNT = 3;
const MAX_RANDOM_ATTEMPTS = 50;

export interface DistractorOptions {
  /** Whether wrong answers may be below zero. Off for this version of the app. */
  allowNegative?: boolean;
}

/** Answers just above and below the correct one (counting slips). */
export function nearbyDistractors(answer: number): number[] {
  const candidates = [answer - 1, answer + 1, answer - 2, answer + 2];
  if (answer >= 20) candidates.push(answer - 10, answer + 10);
  return candidates;
}

/** Common addition mistakes. */
export function additionDistractors(a: number, b: number, answer: number): number[] {
  const candidates = [answer + 1, answer - 1];
  // Forgot to carry the 1 (e.g. 27 + 15 = 32), or carried twice
  if ((a % 10) + (b % 10) >= 10) candidates.push(answer - 10, answer + 10);
  // Subtracted instead of adding
  if (a !== b) candidates.push(Math.abs(a - b));
  return candidates;
}

/** Common subtraction mistakes. */
export function subtractionDistractors(a: number, b: number, answer: number): number[] {
  const candidates = [answer + 1, answer - 1, a + b];
  // Borrowing mistake: subtracting the smaller digit from the larger in each column
  // (e.g. 52 − 17 = 45 instead of 35)
  const digitwise = digitwiseDifference(a, b);
  if (digitwise !== answer) candidates.push(digitwise);
  if (answer >= 10) candidates.push(answer + 10, answer - 10);
  return candidates;
}

/** Common multiplication mistakes: neighboring times-table facts, or adding instead. */
export function multiplicationDistractors(a: number, b: number): number[] {
  return [(a + 1) * b, (a - 1) * b, a * (b + 1), a * (b - 1), a + b];
}

/** Common division mistakes: off-by-one quotients and fact-family mix-ups. */
export function divisionDistractors(dividend: number, divisor: number, answer: number): number[] {
  const candidates = [answer + 1, answer - 1, answer + 2];
  // Fact family confusion: in 24 ÷ 6 = 4, picking 6
  if (divisor !== answer) candidates.push(divisor);
  // The quotient for a neighboring divisor, when it divides evenly
  for (const neighbor of [divisor - 1, divisor + 1]) {
    if (neighbor > 0 && dividend % neighbor === 0) candidates.push(dividend / neighbor);
  }
  return candidates;
}

function digitwiseDifference(a: number, b: number): number {
  let result = 0;
  let place = 1;
  while (a > 0 || b > 0) {
    result += Math.abs((a % 10) - (b % 10)) * place;
    a = Math.floor(a / 10);
    b = Math.floor(b / 10);
    place *= 10;
  }
  return result;
}

function operationDistractors(facts: QuestionFacts): number[] {
  const { operation, firstOperand: a, secondOperand: b, correctAnswer: answer } = facts;
  switch (operation) {
    case 'addition':
      return additionDistractors(a, b, answer);
    case 'subtraction':
      return subtractionDistractors(a, b, answer);
    case 'multiplication':
      return multiplicationDistractors(a, b);
    case 'division':
      return divisionDistractors(a, b, answer);
  }
}

/**
 * Picks three wrong answers that are unique, whole numbers, different from the
 * correct answer, and close enough to be believable.
 */
export function generateDistractors(
  facts: QuestionFacts,
  random: RandomSource = Math.random,
  { allowNegative = false }: DistractorOptions = {},
): number[] {
  const answer = facts.correctAnswer;
  // Keep wrong answers believable: not wildly far from the right one
  const maxDistance = Math.max(10, answer);
  const chosen = new Set<number>();

  const tryAdd = (candidate: number) => {
    if (chosen.size >= DISTRACTOR_COUNT) return;
    if (!Number.isInteger(candidate)) return;
    if (candidate === answer) return;
    if (!allowNegative && candidate < 0) return;
    if (Math.abs(candidate - answer) > maxDistance) return;
    chosen.add(candidate);
  };

  // 1. Mistake-based answers first, then nearby numbers, each in random order
  shuffle(operationDistractors(facts), random).forEach(tryAdd);
  shuffle(nearbyDistractors(answer), random).forEach(tryAdd);

  // 2. Random numbers close to the answer, with a retry limit
  const spread = Math.max(5, Math.ceil(answer * 0.2));
  for (let i = 0; i < MAX_RANDOM_ATTEMPTS && chosen.size < DISTRACTOR_COUNT; i++) {
    const low = allowNegative ? answer - spread : Math.max(0, answer - spread);
    tryAdd(randomInt(low, answer + spread, random));
  }

  // 3. Guaranteed finish: step outward from the answer
  for (let step = 1; chosen.size < DISTRACTOR_COUNT; step++) {
    tryAdd(answer + step);
    tryAdd(answer - step);
  }

  return [...chosen];
}

/** The correct answer plus three distractors, shuffled. */
export function generateAnswerChoices(
  facts: QuestionFacts,
  random: RandomSource = Math.random,
  options?: DistractorOptions,
): number[] {
  return shuffle([facts.correctAnswer, ...generateDistractors(facts, random, options)], random);
}
