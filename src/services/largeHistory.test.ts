import type { PracticeAttempt } from '../types';
import { archiveCounts, addToArchive, EMPTY_ARCHIVE } from '../utils/attemptArchive';
import { calculateAppStatistics, mostMissedOperations } from '../utils/statistics';
import { ARCHIVE_BATCH, MAX_DETAILED_ATTEMPTS, createAppData } from './appData';
import { createMemoryStorage, createStorageService } from './storage';

const OPERATIONS = ['addition', 'subtraction', 'multiplication', 'division'] as const;
const LEVELS = ['beginner', 'easy', 'intermediate', 'advanced'] as const;

function makeAttempt(i: number): PracticeAttempt {
  return {
    id: `a-${i}`,
    sessionId: `s-${Math.floor(i / 10)}`,
    questionId: `q-${i}`,
    operation: OPERATIONS[i % 4],
    difficulty: LEVELS[Math.floor(i / 4) % 4],
    firstOperand: 3,
    secondOperand: 4,
    correctAnswer: 7,
    selectedAnswer: 7,
    // Every third answer is wrong; every fifth is a review question
    result: i % 3 === 0 ? 'incorrect' : 'correct',
    source: i % 5 === 0 ? 'mistake-review' : 'regular',
    answeredAt: new Date(Date.UTC(2026, 0, 1) + i * 60_000).toISOString(),
  };
}

describe('attempt archive', () => {
  it('adds answers to totals by operation, level, and source', () => {
    const archive = addToArchive(EMPTY_ARCHIVE, [makeAttempt(0), makeAttempt(1), makeAttempt(5)]);
    expect(archive.archivedCount).toBe(3);
    expect(archiveCounts(archive)).toEqual({ correct: 2, incorrect: 1 });
    expect(archiveCounts(archive, { operation: 'addition' })).toEqual({ correct: 0, incorrect: 1 });
    expect(archiveCounts(archive, { source: 'mistake-review' })).toEqual({
      correct: 1,
      incorrect: 1,
    });
  });
});

describe('several thousand answers', () => {
  const TOTAL = 5000;

  // Saving 5,000 answers one at a time is slow-ish, so do it once for all tests
  let filled: { data: ReturnType<typeof createAppData>; all: PracticeAttempt[] };
  beforeAll(() => {
    const data = createAppData(createStorageService(createMemoryStorage()));
    const all = Array.from({ length: TOTAL }, (_, i) => makeAttempt(i));
    for (const attempt of all) data.saveAttempt(attempt);
    filled = { data, all };
  }, 60_000);
  const fill = () => filled;

  it('keeps recent answers in detail and rolls older ones into totals', () => {
    const { data } = fill();
    const detailed = data.loadAttempts();
    const archive = data.loadAttemptArchive();

    expect(detailed.length).toBeLessThanOrEqual(MAX_DETAILED_ATTEMPTS);
    expect(detailed.length).toBeGreaterThanOrEqual(MAX_DETAILED_ATTEMPTS - ARCHIVE_BATCH);
    expect(detailed.length + archive.archivedCount).toBe(TOTAL);
    // The newest answer is always kept in detail
    expect(detailed.at(-1)?.id).toBe(`a-${TOTAL - 1}`);
  });

  it('statistics are exactly the same as if nothing had been archived', () => {
    const { data, all } = fill();
    const fromStorage = calculateAppStatistics(data.loadAttempts(), [], [], {
      archive: data.loadAttemptArchive(),
    });
    const fromEverything = calculateAppStatistics(all, [], []);

    expect(fromStorage.overall).toEqual(fromEverything.overall);
    expect(fromStorage.byOperation).toEqual(fromEverything.byOperation);
    expect(fromStorage.byDifficulty).toEqual(fromEverything.byDifficulty);
    expect(fromStorage.mistakes).toEqual(fromEverything.mistakes);
    expect(mostMissedOperations(data.loadAttempts(), data.loadAttemptArchive())).toEqual(
      mostMissedOperations(all),
    );
  });

  it('stays well under the usual 5 MB browser storage limit', () => {
    const { data } = fill();
    const bytes = data.storageUsageBytes();
    expect(bytes).toBeGreaterThan(0);
    expect(bytes).toBeLessThan(2 * 1024 * 1024);
  });

  it('calculates statistics quickly', () => {
    const { data } = fill();
    const attempts = data.loadAttempts();
    const archive = data.loadAttemptArchive();
    const start = performance.now();
    calculateAppStatistics(attempts, [], [], { archive });
    expect(performance.now() - start).toBeLessThan(200);
  });
});
