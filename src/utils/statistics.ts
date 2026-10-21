import {
  DIFFICULTY_LEVELS,
  MATH_OPERATIONS,
  type AppStatistics,
  type DifficultyStatistics,
  type MathOperation,
  type MistakePattern,
  type MistakeStatistics,
  type OperationStatistics,
  type PerformanceTotals,
  type PracticeAttempt,
  type PracticeSession,
  type RecentSessionSummary,
} from '../types';
import { archiveCounts, EMPTY_ARCHIVE, type AttemptArchive } from './attemptArchive';

/** Percentage of correct answers, rounded to a whole number. 0 when nothing was attempted. */
export function calculateAccuracy(correct: number, attempted: number): number {
  if (attempted <= 0) return 0;
  return Math.round((correct / attempted) * 100);
}

export function totalsFromCounts(correct: number, incorrect: number): PerformanceTotals {
  const attempted = correct + incorrect;
  return { attempted, correct, incorrect, accuracy: calculateAccuracy(correct, attempted) };
}

/**
 * Attempted, correct, incorrect, and accuracy for a list of attempts, plus
 * any matching archived totals.
 */
export function calculateTotals(
  attempts: readonly PracticeAttempt[],
  archived: { correct: number; incorrect: number } = { correct: 0, incorrect: 0 },
): PerformanceTotals {
  const correct = attempts.filter((a) => a.result === 'correct').length;
  return totalsFromCounts(
    correct + archived.correct,
    attempts.length - correct + archived.incorrect,
  );
}

/** Totals for each operation. Every operation is included, even with no attempts. */
export function statisticsByOperation(
  attempts: readonly PracticeAttempt[],
  archive: AttemptArchive = EMPTY_ARCHIVE,
): OperationStatistics {
  return Object.fromEntries(
    MATH_OPERATIONS.map((op) => [
      op,
      calculateTotals(
        attempts.filter((a) => a.operation === op),
        archiveCounts(archive, { operation: op }),
      ),
    ]),
  ) as OperationStatistics;
}

/** Totals for each difficulty level. Every level is included, even with no attempts. */
export function statisticsByDifficulty(
  attempts: readonly PracticeAttempt[],
  archive: AttemptArchive = EMPTY_ARCHIVE,
): DifficultyStatistics {
  return Object.fromEntries(
    DIFFICULTY_LEVELS.map((level) => [
      level,
      calculateTotals(
        attempts.filter((a) => a.difficulty === level),
        archiveCounts(archive, { difficulty: level }),
      ),
    ]),
  ) as DifficultyStatistics;
}

export function summarizeSession(session: PracticeSession): RecentSessionSummary {
  return {
    sessionId: session.id,
    mode: session.mode,
    completedAt: session.completedAt ?? session.startedAt,
    operations: [...session.operations],
    difficulty: session.difficulty,
    sessionLength: session.sessionLength,
    totals: totalsFromCounts(session.correctCount, session.incorrectCount),
  };
}

/**
 * All statistics for the Statistics page.
 * Sessions with no answers are left out of the recent list.
 */
export function calculateAppStatistics(
  attempts: readonly PracticeAttempt[],
  sessions: readonly PracticeSession[],
  patterns: readonly MistakePattern[] = [],
  {
    archive = EMPTY_ARCHIVE,
    recentLimit = 10,
  }: { archive?: AttemptArchive; recentLimit?: number } = {},
): AppStatistics {
  const recentSessions = sessions
    .filter((s) => s.attemptedCount > 0)
    .map(summarizeSession)
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    .slice(0, recentLimit);

  return {
    overall: calculateTotals(attempts, archiveCounts(archive)),
    byOperation: statisticsByOperation(attempts, archive),
    byDifficulty: statisticsByDifficulty(attempts, archive),
    recentSessions,
    mistakes: calculateMistakeStatistics(patterns, attempts, archive),
  };
}

/** Counts for the Mistakes section of the Statistics page. */
export function calculateMistakeStatistics(
  patterns: readonly MistakePattern[],
  attempts: readonly PracticeAttempt[],
  archive: AttemptArchive = EMPTY_ARCHIVE,
): MistakeStatistics {
  const reviewAttempts = attempts.filter((a) => a.source === 'mistake-review');
  const archivedReview = archiveCounts(archive, { source: 'mistake-review' });
  return {
    activePatterns: patterns.filter((p) => !p.isMastered).length,
    masteredPatterns: patterns.filter((p) => p.isMastered).length,
    similarQuestionsPracticed:
      reviewAttempts.length + archivedReview.correct + archivedReview.incorrect,
    reviewQuestionsCorrect:
      reviewAttempts.filter((a) => a.result === 'correct').length + archivedReview.correct,
  };
}

export interface MostMissed {
  /** More than one when tied. In + − × ÷ order. */
  operations: MathOperation[];
  count: number;
}

/** The operation(s) answered wrong most often, or null if nothing was missed. */
export function mostMissedOperations(
  attempts: readonly PracticeAttempt[],
  archive: AttemptArchive = EMPTY_ARCHIVE,
): MostMissed | null {
  const counts = MATH_OPERATIONS.map((op) => ({
    op,
    count:
      attempts.filter((a) => a.operation === op && a.result === 'incorrect').length +
      archiveCounts(archive, { operation: op }).incorrect,
  }));
  const max = Math.max(...counts.map((c) => c.count));
  if (max === 0) return null;
  return { operations: counts.filter((c) => c.count === max).map((c) => c.op), count: max };
}

/**
 * Mistake patterns, most-missed first. Ties go to the most recently missed,
 * then to a fixed order, so the list never jumps around.
 */
export function sortByMostMissed(patterns: readonly MistakePattern[]): MistakePattern[] {
  return [...patterns].sort(
    (a, b) =>
      b.incorrectCount - a.incorrectCount ||
      b.lastIncorrectAt.localeCompare(a.lastIncorrectAt) ||
      a.id.localeCompare(b.id),
  );
}
