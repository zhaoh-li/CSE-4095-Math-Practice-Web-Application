import {
  MATH_OPERATIONS,
  type MathOperation,
  type MistakePattern,
  type PracticeAttempt,
  type PracticeConfig,
} from '../../types';
import { createId } from '../id';

interface Fact {
  operation: MathOperation;
  firstOperand: number;
  secondOperand: number;
}

/**
 * Identifies a math fact. Order doesn't matter for + and ×, so 7 × 8 and
 * 8 × 7 count as the same mistake; it does for − and ÷.
 */
export function factKey({ operation, firstOperand, secondOperand }: Fact): string {
  const isCommutative = operation === 'addition' || operation === 'multiplication';
  const [a, b] =
    isCommutative && firstOperand > secondOperand
      ? [secondOperand, firstOperand]
      : [firstOperand, secondOperand];
  return `${operation}:${a}:${b}`;
}

export const isActivePattern = (p: MistakePattern) => !p.isMastered;
export const activePatterns = (patterns: readonly MistakePattern[]) =>
  patterns.filter(isActivePattern);
export const masteredPatterns = (patterns: readonly MistakePattern[]) =>
  patterns.filter((p) => p.isMastered);

export function createMistakePattern(attempt: PracticeAttempt, now: string): MistakePattern {
  return {
    id: createId(),
    operation: attempt.operation,
    firstOperand: attempt.firstOperand,
    secondOperand: attempt.secondOperand,
    correctAnswer: attempt.correctAnswer,
    difficulty: attempt.difficulty,
    incorrectCount: 1,
    similarCorrectCount: 0,
    isMastered: false,
    createdAt: now,
    lastIncorrectAt: now,
  };
}

/** A missed fact: count it again and set back mastery progress. */
function recordMiss(pattern: MistakePattern, now: string): MistakePattern {
  const updated: MistakePattern = {
    ...pattern,
    incorrectCount: pattern.incorrectCount + 1,
    lastIncorrectAt: now,
    // A mastered fact comes back from the start. An active one loses one step,
    // which is gentler for kids than losing all progress.
    similarCorrectCount: pattern.isMastered ? 0 : Math.max(0, pattern.similarCorrectCount - 1),
    isMastered: false,
  };
  delete updated.masteredAt;
  return updated;
}

/** A correct review answer: one step closer to mastery. */
function recordReviewSuccess(
  pattern: MistakePattern,
  now: string,
  masteryThreshold: number,
): MistakePattern {
  const similarCorrectCount = pattern.similarCorrectCount + 1;
  if (similarCorrectCount >= masteryThreshold) {
    return { ...pattern, similarCorrectCount, isMastered: true, masteredAt: now };
  }
  return { ...pattern, similarCorrectCount };
}

export interface PatternUpdateOptions {
  now: string;
  /** Correct review answers needed to master a pattern. */
  masteryThreshold: number;
}

/**
 * Updates mistake patterns after one answer:
 * - Regular question answered wrong → create the pattern, or count it again.
 * - Review question answered right → its pattern moves toward mastery.
 * - Review question answered wrong → its pattern loses progress.
 * Regular correct answers don't change anything.
 */
export function applyAttemptToPatterns(
  patterns: readonly MistakePattern[],
  attempt: PracticeAttempt,
  { now, masteryThreshold }: PatternUpdateOptions,
): MistakePattern[] {
  const replace = (updated: MistakePattern) =>
    patterns.map((p) => (p.id === updated.id ? updated : p));

  if (attempt.source === 'mistake-review') {
    const pattern = patterns.find((p) => p.id === attempt.mistakePatternId);
    if (!pattern) return [...patterns];
    return replace(
      attempt.result === 'correct'
        ? recordReviewSuccess(pattern, now, masteryThreshold)
        : recordMiss(pattern, now),
    );
  }

  if (attempt.result === 'correct') return [...patterns];

  const key = factKey(attempt);
  const existing = patterns.find((p) => factKey(p) === key);
  return existing
    ? replace(recordMiss(existing, now))
    : [...patterns, createMistakePattern(attempt, now)];
}

/**
 * Setup for a mistake-review session. The operations come from the active
 * mistakes; the levels are kept only for display, since each question uses
 * its own mistake's level.
 */
export function createReviewConfig(
  patterns: readonly MistakePattern[],
  base: Pick<PracticeConfig, 'difficulties' | 'sessionLength'>,
): PracticeConfig {
  const operations = MATH_OPERATIONS.filter((op) =>
    activePatterns(patterns).some((p) => p.operation === op),
  );
  return {
    mode: 'mistake-review',
    operations: operations.length > 0 ? operations : ['addition'],
    difficulties: [...base.difficulties],
    sessionLength: base.sessionLength,
  };
}
