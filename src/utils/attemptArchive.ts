import type { DifficultyLevel, MathOperation, PracticeAttempt, QuestionSource } from '../types';

/** Right and wrong counts for one combination of operation, level, and source. */
export interface ArchiveCount {
  correct: number;
  incorrect: number;
}

/**
 * Totals for old answers whose details were removed to save space.
 * Keyed by "operation|difficulty|source", so every statistic can still be
 * calculated exactly.
 */
export interface AttemptArchive {
  counts: Record<string, ArchiveCount>;
  archivedCount: number;
}

export const EMPTY_ARCHIVE: AttemptArchive = { counts: {}, archivedCount: 0 };

export const archiveKey = (
  operation: MathOperation,
  difficulty: DifficultyLevel,
  source: QuestionSource,
) => `${operation}|${difficulty}|${source}`;

/** Adds answers to the totals. */
export function addToArchive(
  archive: AttemptArchive,
  attempts: readonly PracticeAttempt[],
): AttemptArchive {
  const counts: Record<string, ArchiveCount> = { ...archive.counts };
  for (const attempt of attempts) {
    const key = archiveKey(attempt.operation, attempt.difficulty, attempt.source);
    const current = counts[key] ?? { correct: 0, incorrect: 0 };
    counts[key] =
      attempt.result === 'correct'
        ? { ...current, correct: current.correct + 1 }
        : { ...current, incorrect: current.incorrect + 1 };
  }
  return { counts, archivedCount: archive.archivedCount + attempts.length };
}

export interface ArchiveFilter {
  operation?: MathOperation;
  difficulty?: DifficultyLevel;
  source?: QuestionSource;
}

/** Right and wrong counts in the archive, optionally for just some answers. */
export function archiveCounts(archive: AttemptArchive, filter: ArchiveFilter = {}): ArchiveCount {
  let correct = 0;
  let incorrect = 0;
  for (const [key, count] of Object.entries(archive.counts)) {
    const [operation, difficulty, source] = key.split('|');
    if (filter.operation && filter.operation !== operation) continue;
    if (filter.difficulty && filter.difficulty !== difficulty) continue;
    if (filter.source && filter.source !== source) continue;
    correct += count.correct;
    incorrect += count.incorrect;
  }
  return { correct, incorrect };
}
