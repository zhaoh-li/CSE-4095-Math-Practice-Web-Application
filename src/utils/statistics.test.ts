import type { PracticeAttempt, PracticeSession } from '../types';
import {
  calculateAccuracy,
  calculateAppStatistics,
  calculateMistakeStatistics,
  calculateTotals,
  mostMissedOperations,
  sortByMostMissed,
  statisticsByDifficulty,
  statisticsByOperation,
} from './statistics';

let n = 0;
function attempt(extra: Partial<PracticeAttempt>): PracticeAttempt {
  n += 1;
  return {
    id: `a-${n}`,
    sessionId: 's-1',
    questionId: `q-${n}`,
    operation: 'addition',
    difficulty: 'beginner',
    firstOperand: 1,
    secondOperand: 1,
    correctAnswer: 2,
    selectedAnswer: 2,
    result: 'correct',
    source: 'regular',
    answeredAt: '2026-10-20T12:00:00.000Z',
    ...extra,
  };
}

function session(
  id: string,
  completedAt: string,
  correct: number,
  incorrect: number,
): PracticeSession {
  return {
    id,
    mode: 'regular',
    operations: ['addition'],
    difficulty: 'easy',
    sessionLength: 10,
    currentQuestionIndex: 0,
    attemptedCount: correct + incorrect,
    correctCount: correct,
    incorrectCount: incorrect,
    mistakeReviewCount: 0,
    isActive: false,
    startedAt: completedAt,
    completedAt,
  };
}

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

describe('calculateTotals', () => {
  it('counts attempted, correct, incorrect, and accuracy', () => {
    const attempts = [
      attempt({ result: 'correct' }),
      attempt({ result: 'correct' }),
      attempt({ result: 'correct' }),
      attempt({ result: 'incorrect' }),
    ];
    expect(calculateTotals(attempts)).toEqual({
      attempted: 4,
      correct: 3,
      incorrect: 1,
      accuracy: 75,
    });
  });

  it('handles no attempts', () => {
    expect(calculateTotals([])).toEqual({ attempted: 0, correct: 0, incorrect: 0, accuracy: 0 });
  });
});

describe('statisticsByOperation', () => {
  it('tracks each operation separately', () => {
    const stats = statisticsByOperation([
      attempt({ operation: 'addition', result: 'correct' }),
      attempt({ operation: 'addition', result: 'incorrect' }),
      attempt({ operation: 'subtraction', result: 'correct' }),
      attempt({ operation: 'multiplication', result: 'incorrect' }),
      attempt({ operation: 'division', result: 'correct' }),
      attempt({ operation: 'division', result: 'correct' }),
    ]);
    expect(stats.addition).toEqual({ attempted: 2, correct: 1, incorrect: 1, accuracy: 50 });
    expect(stats.subtraction).toEqual({ attempted: 1, correct: 1, incorrect: 0, accuracy: 100 });
    expect(stats.multiplication).toEqual({ attempted: 1, correct: 0, incorrect: 1, accuracy: 0 });
    expect(stats.division).toEqual({ attempted: 2, correct: 2, incorrect: 0, accuracy: 100 });
  });

  it('includes operations with no attempts', () => {
    expect(statisticsByOperation([]).division).toEqual({
      attempted: 0,
      correct: 0,
      incorrect: 0,
      accuracy: 0,
    });
  });
});

describe('statisticsByDifficulty', () => {
  it('tracks each level separately', () => {
    const stats = statisticsByDifficulty([
      attempt({ difficulty: 'beginner', result: 'correct' }),
      attempt({ difficulty: 'easy', result: 'incorrect' }),
      attempt({ difficulty: 'intermediate', result: 'correct' }),
      attempt({ difficulty: 'intermediate', result: 'incorrect' }),
      attempt({ difficulty: 'advanced', result: 'correct' }),
    ]);
    expect(stats.beginner.accuracy).toBe(100);
    expect(stats.easy.accuracy).toBe(0);
    expect(stats.intermediate).toEqual({ attempted: 2, correct: 1, incorrect: 1, accuracy: 50 });
    expect(stats.advanced.attempted).toBe(1);
  });
});

describe('calculateAppStatistics', () => {
  it('lists recent sessions newest first and skips empty ones', () => {
    const stats = calculateAppStatistics(
      [],
      [
        session('old', '2026-10-01T10:00:00.000Z', 5, 5),
        session('empty', '2026-10-25T10:00:00.000Z', 0, 0),
        session('new', '2026-10-20T10:00:00.000Z', 9, 1),
      ],
    );
    expect(stats.recentSessions.map((s) => s.sessionId)).toEqual(['new', 'old']);
    expect(stats.recentSessions[0].totals).toEqual({
      attempted: 10,
      correct: 9,
      incorrect: 1,
      accuracy: 90,
    });
  });

  it('limits the number of recent sessions', () => {
    const sessions = Array.from({ length: 15 }, (_, i) =>
      session(`s${i}`, `2026-10-${String(i + 1).padStart(2, '0')}T10:00:00.000Z`, 1, 0),
    );
    expect(calculateAppStatistics([], sessions, [], 10).recentSessions).toHaveLength(10);
  });
});

describe('mistake statistics', () => {
  const pattern = (id: string, extra: Partial<import('../types').MistakePattern> = {}) => ({
    id,
    operation: 'addition' as const,
    firstOperand: 2,
    secondOperand: 3,
    correctAnswer: 5,
    difficulty: 'beginner' as const,
    incorrectCount: 1,
    similarCorrectCount: 0,
    isMastered: false,
    createdAt: '2026-10-01T10:00:00.000Z',
    lastIncorrectAt: '2026-10-01T10:00:00.000Z',
    ...extra,
  });

  it('counts active and mastered patterns, and review answers', () => {
    const stats = calculateMistakeStatistics(
      [pattern('a'), pattern('b'), pattern('c', { isMastered: true })],
      [
        attempt({ source: 'mistake-review', result: 'correct' }),
        attempt({ source: 'mistake-review', result: 'correct' }),
        attempt({ source: 'mistake-review', result: 'incorrect' }),
        attempt({ source: 'regular', result: 'correct' }),
      ],
    );
    expect(stats).toEqual({
      activePatterns: 2,
      masteredPatterns: 1,
      similarQuestionsPracticed: 3,
      reviewQuestionsCorrect: 2,
    });
  });

  it('finds the most missed operation', () => {
    const result = mostMissedOperations([
      attempt({ operation: 'multiplication', result: 'incorrect' }),
      attempt({ operation: 'multiplication', result: 'incorrect' }),
      attempt({ operation: 'addition', result: 'incorrect' }),
      attempt({ operation: 'addition', result: 'correct' }),
    ]);
    expect(result).toEqual({ operations: ['multiplication'], count: 2 });
  });

  it('reports every operation in a tie, in + − × ÷ order', () => {
    const result = mostMissedOperations([
      attempt({ operation: 'division', result: 'incorrect' }),
      attempt({ operation: 'addition', result: 'incorrect' }),
    ]);
    expect(result).toEqual({ operations: ['addition', 'division'], count: 1 });
  });

  it('returns null when nothing was missed', () => {
    expect(mostMissedOperations([attempt({ result: 'correct' })])).toBeNull();
    expect(mostMissedOperations([])).toBeNull();
  });

  it('sorts by most missed, breaking ties by most recent, then by id', () => {
    const sorted = sortByMostMissed([
      pattern('few', { incorrectCount: 1 }),
      pattern('tie-old', { incorrectCount: 4, lastIncorrectAt: '2026-10-01T10:00:00.000Z' }),
      pattern('many', { incorrectCount: 7 }),
      pattern('tie-new', { incorrectCount: 4, lastIncorrectAt: '2026-10-15T10:00:00.000Z' }),
      pattern('tie-same-b', { incorrectCount: 2 }),
      pattern('tie-same-a', { incorrectCount: 2 }),
    ]);
    expect(sorted.map((p) => p.id)).toEqual([
      'many',
      'tie-new',
      'tie-old',
      'tie-same-a',
      'tie-same-b',
      'few',
    ]);
  });

  it('includes mistake totals in the app statistics', () => {
    const stats = calculateAppStatistics(
      [],
      [],
      [pattern('a'), pattern('b', { isMastered: true })],
    );
    expect(stats.mistakes.activePatterns).toBe(1);
    expect(stats.mistakes.masteredPatterns).toBe(1);
  });
});
