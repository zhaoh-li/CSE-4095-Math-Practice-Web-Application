import { DIFFICULTY_RULES, type NumberRange } from '../../config/difficultyRules';
import type { DifficultyLevel, MathOperation, MistakePattern, Question } from '../../types';
import { pickRandom, type RandomSource } from '../random';
import { buildQuestion, calculateAnswer, type QuestionFacts } from '../questions/buildQuestion';
import { getQuestionErrors } from '../questions/validateQuestion';

export type SimilarityStrategy = 'nearby' | 'reversed' | 'fact-family';

export interface SimilarCandidate {
  strategy: SimilarityStrategy;
  facts: QuestionFacts;
}

/** Identifies one exact question, in order (7 × 8 and 8 × 7 are different here). */
export const exactQuestionKey = (
  f: Pick<QuestionFacts, 'operation' | 'firstOperand' | 'secondOperand'>,
) => `${f.operation}:${f.firstOperand}:${f.secondOperand}`;

const inRange = (n: number, r: NumberRange) => n >= r.min && n <= r.max;

/** True if the question follows the number ranges of the given level. */
export function fitsDifficulty(facts: QuestionFacts, difficulty: DifficultyLevel): boolean {
  const { operation, firstOperand: a, secondOperand: b, correctAnswer } = facts;
  if (![a, b, correctAnswer].every((n) => Number.isInteger(n) && n >= 0)) return false;
  if (calculateAnswer(operation, a, b) !== correctAnswer) return false;

  const rules = DIFFICULTY_RULES[difficulty];
  switch (operation) {
    case 'addition': {
      const { operand, maxResult } = rules.addition;
      return inRange(a, operand) && inRange(b, operand) && correctAnswer <= maxResult;
    }
    case 'subtraction': {
      const { minuend, subtrahend } = rules.subtraction;
      return inRange(a, minuend) && inRange(b, subtrahend) && b <= a;
    }
    case 'multiplication': {
      const { tableFactor, otherFactor } = rules.multiplication;
      return (
        (inRange(a, tableFactor) && inRange(b, otherFactor)) ||
        (inRange(b, tableFactor) && inRange(a, otherFactor))
      );
    }
    case 'division': {
      const { divisor, quotient } = rules.division;
      return b > 0 && inRange(b, divisor) && inRange(correctAnswer, quotient);
    }
  }
}

function facts(operation: MathOperation, first: number, second: number): QuestionFacts {
  return {
    operation,
    firstOperand: first,
    secondOperand: second,
    correctAnswer: calculateAnswer(operation, first, second),
  };
}

const NEARBY_STEPS = [-2, -1, 1, 2];

/** Same operation, one number nudged up or down (e.g. 7 × 8 → 7 × 9). */
function nearbyCandidates({
  operation,
  firstOperand: a,
  secondOperand: b,
  correctAnswer,
}: MistakePattern) {
  if (operation === 'division') {
    // Nudge the quotient or the divisor, then rebuild the dividend so it divides evenly
    return NEARBY_STEPS.flatMap((step) => [
      facts('division', b * (correctAnswer + step), b),
      facts('division', (b + step) * correctAnswer, b + step),
    ]);
  }
  return NEARBY_STEPS.flatMap((step) => [
    facts(operation, a + step, b),
    facts(operation, a, b + step),
  ]);
}

/** Same numbers, swapped (only for + and ×, where order doesn't change the answer). */
function reversedCandidates({ operation, firstOperand: a, secondOperand: b }: MistakePattern) {
  if ((operation === 'addition' || operation === 'multiplication') && a !== b) {
    return [facts(operation, b, a)];
  }
  return [];
}

/** The related fact from the opposite operation (e.g. 24 ÷ 6 = 4 → 4 × 6 = 24). */
function factFamilyCandidates({
  operation,
  firstOperand: a,
  secondOperand: b,
  correctAnswer: c,
}: MistakePattern) {
  switch (operation) {
    case 'division': // a ÷ b = c  →  c × b, b × c
      return [facts('multiplication', c, b), facts('multiplication', b, c)];
    case 'multiplication': // a × b = c  →  c ÷ a, c ÷ b
      return [facts('division', c, a), facts('division', c, b)].filter((f) => f.secondOperand > 0);
    case 'addition': // a + b = c  →  c − a, c − b
      return [facts('subtraction', c, a), facts('subtraction', c, b)];
    case 'subtraction': // a − b = c  →  b + c, c + b
      return [facts('addition', b, c), facts('addition', c, b)];
  }
}

/** Every valid related question for a mistake, grouped by strategy. */
export function similarCandidates(pattern: MistakePattern): SimilarCandidate[] {
  const original = exactQuestionKey(pattern);
  const seen = new Set<string>([original]);
  const result: SimilarCandidate[] = [];

  const add = (strategy: SimilarityStrategy, candidates: QuestionFacts[]) => {
    for (const candidate of candidates) {
      const key = exactQuestionKey(candidate);
      if (seen.has(key) || !fitsDifficulty(candidate, pattern.difficulty)) continue;
      seen.add(key);
      result.push({ strategy, facts: candidate });
    }
  };

  add('reversed', reversedCandidates(pattern));
  add('fact-family', factFamilyCandidates(pattern));
  add('nearby', nearbyCandidates(pattern));
  return result;
}

export interface SimilarQuestionOptions {
  random?: RandomSource;
  /** Exact questions to skip, e.g. the ones just shown. */
  avoidKeys?: readonly string[];
}

/**
 * Creates a review question related to a mistake. First picks a strategy at
 * random (from those that have valid questions), then a question from it.
 * If nothing related fits, asks the original question again.
 */
export function generateSimilarQuestion(
  pattern: MistakePattern,
  { random = Math.random, avoidKeys = [] }: SimilarQuestionOptions = {},
): Question {
  const avoid = new Set(avoidKeys);
  const candidates = similarCandidates(pattern).filter(
    (c) => !avoid.has(exactQuestionKey(c.facts)),
  );

  let chosen: QuestionFacts;
  if (candidates.length > 0) {
    const strategies = [...new Set(candidates.map((c) => c.strategy))];
    const strategy = pickRandom(strategies, random);
    chosen = pickRandom(
      candidates.filter((c) => c.strategy === strategy),
      random,
    ).facts;
  } else {
    chosen = facts(pattern.operation, pattern.firstOperand, pattern.secondOperand);
  }

  let built = buildQuestion(chosen, pattern.difficulty, random);
  const errors = getQuestionErrors(built);
  if (errors.length > 0) {
    // Should never happen, but a broken question must not reach the student
    if (import.meta.env.DEV) {
      console.warn('[generateSimilarQuestion] Invalid question, using the original:', errors);
    }
    built = buildQuestion(
      facts(pattern.operation, pattern.firstOperand, pattern.secondOperand),
      pattern.difficulty,
      random,
    );
  }

  return { ...built, source: 'mistake-review', mistakePatternId: pattern.id };
}
