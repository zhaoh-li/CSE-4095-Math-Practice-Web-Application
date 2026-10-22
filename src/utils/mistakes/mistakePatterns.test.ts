import type { MistakePattern, PracticeAttempt } from '../../types';
import {
  activePatterns,
  applyAttemptToPatterns,
  createReviewConfig,
  factKey,
  masteredPatterns,
} from './mistakePatterns';

const T1 = '2026-10-20T12:00:00.000Z';
const T2 = '2026-10-21T12:00:00.000Z';
const OPTIONS = { now: T2, masteryThreshold: 3 };

let n = 0;
function attempt(extra: Partial<PracticeAttempt> = {}): PracticeAttempt {
  n += 1;
  return {
    id: `a-${n}`,
    sessionId: 's-1',
    questionId: `q-${n}`,
    operation: 'multiplication',
    difficulty: 'easy',
    firstOperand: 7,
    secondOperand: 8,
    correctAnswer: 56,
    selectedAnswer: 54,
    result: 'incorrect',
    source: 'regular',
    answeredAt: T1,
    ...extra,
  };
}

function pattern(extra: Partial<MistakePattern> = {}): MistakePattern {
  return {
    id: 'p-1',
    operation: 'multiplication',
    firstOperand: 7,
    secondOperand: 8,
    correctAnswer: 56,
    difficulty: 'easy',
    incorrectCount: 1,
    similarCorrectCount: 0,
    isMastered: false,
    createdAt: T1,
    lastIncorrectAt: T1,
    ...extra,
  };
}

describe('factKey', () => {
  it('treats swapped + and × as the same fact', () => {
    expect(factKey({ operation: 'multiplication', firstOperand: 7, secondOperand: 8 })).toBe(
      factKey({ operation: 'multiplication', firstOperand: 8, secondOperand: 7 }),
    );
    expect(factKey({ operation: 'addition', firstOperand: 2, secondOperand: 9 })).toBe(
      factKey({ operation: 'addition', firstOperand: 9, secondOperand: 2 }),
    );
  });

  it('keeps order for − and ÷', () => {
    expect(factKey({ operation: 'subtraction', firstOperand: 9, secondOperand: 2 })).not.toBe(
      factKey({ operation: 'subtraction', firstOperand: 2, secondOperand: 9 }),
    );
    expect(factKey({ operation: 'division', firstOperand: 8, secondOperand: 2 })).not.toBe(
      factKey({ operation: 'division', firstOperand: 2, secondOperand: 8 }),
    );
  });
});

describe('applyAttemptToPatterns: new mistakes', () => {
  it('creates a pattern after a wrong answer, with all the details', () => {
    const [created] = applyAttemptToPatterns([], attempt({ answeredAt: T1 }), OPTIONS);
    expect(created).toMatchObject({
      operation: 'multiplication',
      firstOperand: 7,
      secondOperand: 8,
      correctAnswer: 56,
      difficulty: 'easy',
      incorrectCount: 1,
      similarCorrectCount: 0,
      isMastered: false,
      createdAt: T2,
      lastIncorrectAt: T2,
    });
    expect(created.id).toBeTruthy();
  });

  it('ignores correct answers to regular questions', () => {
    expect(applyAttemptToPatterns([], attempt({ result: 'correct' }), OPTIONS)).toEqual([]);
  });

  it('updates the existing pattern instead of making a duplicate', () => {
    const existing = pattern({ incorrectCount: 2 });
    const result = applyAttemptToPatterns(
      [existing],
      attempt({ firstOperand: 8, secondOperand: 7 }),
      OPTIONS,
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 'p-1', incorrectCount: 3, lastIncorrectAt: T2 });
  });

  it('keeps different facts as separate patterns', () => {
    const result = applyAttemptToPatterns(
      [pattern()],
      attempt({ secondOperand: 9, correctAnswer: 63 }),
      OPTIONS,
    );
    expect(result).toHaveLength(2);
  });

  it('takes one step of progress away from an active pattern', () => {
    const [updated] = applyAttemptToPatterns(
      [pattern({ similarCorrectCount: 2 })],
      attempt(),
      OPTIONS,
    );
    expect(updated.similarCorrectCount).toBe(1);
  });

  it('never lets progress go below zero', () => {
    const [updated] = applyAttemptToPatterns(
      [pattern({ similarCorrectCount: 0 })],
      attempt(),
      OPTIONS,
    );
    expect(updated.similarCorrectCount).toBe(0);
  });
});

describe('applyAttemptToPatterns: review answers', () => {
  const review = (result: 'correct' | 'incorrect') =>
    attempt({
      source: 'mistake-review',
      mistakePatternId: 'p-1',
      result,
      // A similar question, not the original fact
      firstOperand: 7,
      secondOperand: 9,
      correctAnswer: 63,
    });

  it('adds progress after a correct review answer', () => {
    const [updated] = applyAttemptToPatterns([pattern()], review('correct'), OPTIONS);
    expect(updated.similarCorrectCount).toBe(1);
    expect(updated.isMastered).toBe(false);
  });

  it('marks a pattern mastered after three correct review answers', () => {
    let patterns = [pattern()];
    for (let i = 0; i < 3; i++)
      patterns = applyAttemptToPatterns(patterns, review('correct'), OPTIONS);
    expect(patterns[0]).toMatchObject({ similarCorrectCount: 3, isMastered: true, masteredAt: T2 });
    expect(activePatterns(patterns)).toEqual([]);
    expect(masteredPatterns(patterns)).toHaveLength(1);
  });

  it('uses the configured mastery threshold', () => {
    let patterns = [pattern()];
    for (let i = 0; i < 2; i++) {
      patterns = applyAttemptToPatterns(patterns, review('correct'), {
        ...OPTIONS,
        masteryThreshold: 2,
      });
    }
    expect(patterns[0].isMastered).toBe(true);
  });

  it('a wrong review answer counts against the original pattern', () => {
    const [updated] = applyAttemptToPatterns(
      [pattern({ similarCorrectCount: 2 })],
      review('incorrect'),
      OPTIONS,
    );
    expect(updated).toMatchObject({
      id: 'p-1',
      incorrectCount: 2,
      similarCorrectCount: 1,
      lastIncorrectAt: T2,
    });
  });

  it('does not create a new pattern from a wrong review answer', () => {
    expect(applyAttemptToPatterns([pattern()], review('incorrect'), OPTIONS)).toHaveLength(1);
  });

  it('ignores review answers for a pattern that no longer exists', () => {
    const patterns = [pattern({ id: 'other' })];
    expect(applyAttemptToPatterns(patterns, review('correct'), OPTIONS)).toEqual(patterns);
  });
});

describe('mastered patterns coming back', () => {
  it('a mastered fact missed again becomes active with progress reset', () => {
    const mastered = pattern({ isMastered: true, similarCorrectCount: 3, masteredAt: T1 });
    const [updated] = applyAttemptToPatterns([mastered], attempt(), OPTIONS);
    expect(updated).toMatchObject({ isMastered: false, similarCorrectCount: 0, incorrectCount: 2 });
    expect(updated.masteredAt).toBeUndefined();
  });
});

describe('createReviewConfig', () => {
  it('uses the operations of the active mistakes, in + − × ÷ order', () => {
    const config = createReviewConfig(
      [
        pattern({ id: 'a', operation: 'division' }),
        pattern({ id: 'b', operation: 'addition' }),
        pattern({ id: 'c', operation: 'subtraction', isMastered: true }),
      ],
      { difficulties: ['easy'], sessionLength: 5 },
    );
    expect(config).toEqual({
      mode: 'mistake-review',
      operations: ['addition', 'division'],
      difficulties: ['easy'],
      sessionLength: 5,
    });
  });
});
