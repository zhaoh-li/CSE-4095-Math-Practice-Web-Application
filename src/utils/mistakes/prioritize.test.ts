import type { MistakePattern } from '../../types';
import { createSeededRandom } from '../random';
import { pickNextPattern, prioritizePatterns, priorityScore } from './prioritize';

const NOW = '2026-10-20T12:00:00.000Z';
const daysAgo = (days: number) => new Date(Date.parse(NOW) - days * 86_400_000).toISOString();
const OPTIONS = { now: NOW, masteryThreshold: 3 };

function pattern(id: string, extra: Partial<MistakePattern> = {}): MistakePattern {
  return {
    id,
    operation: 'addition',
    firstOperand: 2,
    secondOperand: 3,
    correctAnswer: 5,
    difficulty: 'beginner',
    incorrectCount: 1,
    similarCorrectCount: 0,
    isMastered: false,
    createdAt: daysAgo(10),
    lastIncorrectAt: daysAgo(10),
    ...extra,
  };
}

// No randomness: compare pure priority order
const noJitter = { ...OPTIONS, random: () => 0 };

describe('priorityScore', () => {
  it('is higher for patterns missed more often', () => {
    expect(priorityScore(pattern('a', { incorrectCount: 5 }), OPTIONS)).toBeGreaterThan(
      priorityScore(pattern('b', { incorrectCount: 1 }), OPTIONS),
    );
  });

  it('is higher for patterns missed more recently', () => {
    expect(priorityScore(pattern('a', { lastIncorrectAt: daysAgo(0) }), OPTIONS)).toBeGreaterThan(
      priorityScore(pattern('b', { lastIncorrectAt: daysAgo(7) }), OPTIONS),
    );
  });

  it('is higher for patterns with little review success', () => {
    expect(priorityScore(pattern('a', { similarCorrectCount: 0 }), OPTIONS)).toBeGreaterThan(
      priorityScore(pattern('b', { similarCorrectCount: 2 }), OPTIONS),
    );
  });

  it('handles a broken date without crashing', () => {
    expect(
      Number.isFinite(priorityScore(pattern('a', { lastIncorrectAt: 'not a date' }), OPTIONS)),
    ).toBe(true);
  });
});

describe('prioritizePatterns', () => {
  it('orders by frequency, recency, and review success', () => {
    const ordered = prioritizePatterns(
      [
        pattern('rarely-missed'),
        pattern('often-missed', { incorrectCount: 6 }),
        pattern('almost-mastered', { similarCorrectCount: 2 }),
        pattern('missed-today', { lastIncorrectAt: daysAgo(0) }),
      ],
      noJitter,
    );
    expect(ordered.map((p) => p.id)).toEqual([
      'often-missed',
      'missed-today',
      'rarely-missed',
      'almost-mastered',
    ]);
  });

  it('leaves out mastered patterns', () => {
    const ordered = prioritizePatterns(
      [pattern('a'), pattern('b', { isMastered: true, incorrectCount: 9 })],
      noJitter,
    );
    expect(ordered.map((p) => p.id)).toEqual(['a']);
  });

  it('mixes up patterns with the same priority', () => {
    const tied = ['a', 'b', 'c', 'd'].map((id) => pattern(id));
    const orders = new Set(
      Array.from({ length: 20 }, (_, seed) =>
        prioritizePatterns(tied, { ...OPTIONS, random: createSeededRandom(seed) })
          .map((p) => p.id)
          .join(''),
      ),
    );
    expect(orders.size).toBeGreaterThan(5);
  });

  it('does not let randomness override a clear priority difference', () => {
    for (let seed = 0; seed < 50; seed++) {
      const [first] = prioritizePatterns([pattern('low'), pattern('high', { incorrectCount: 5 })], {
        ...OPTIONS,
        random: createSeededRandom(seed),
      });
      expect(first.id).toBe('high');
    }
  });
});

describe('pickNextPattern', () => {
  it('returns null when every pattern is mastered', () => {
    expect(pickNextPattern([pattern('a', { isMastered: true })], OPTIONS)).toBeNull();
  });

  it('avoids the same pattern twice in a row when others exist', () => {
    const patterns = [pattern('a', { incorrectCount: 9 }), pattern('b')];
    for (let seed = 0; seed < 30; seed++) {
      const next = pickNextPattern(patterns, {
        ...OPTIONS,
        random: createSeededRandom(seed),
        lastPatternId: 'a',
      });
      expect(next?.id).toBe('b');
    }
  });

  it('repeats the only pattern if there is just one', () => {
    expect(pickNextPattern([pattern('a')], { ...OPTIONS, lastPatternId: 'a' })?.id).toBe('a');
  });

  it('favors urgent patterns but still mixes in others', () => {
    const patterns = [
      pattern('urgent', { incorrectCount: 8, lastIncorrectAt: daysAgo(0) }),
      pattern('medium', { incorrectCount: 3 }),
      pattern('low'),
    ];
    const random = createSeededRandom(42);
    const counts: Record<string, number> = { urgent: 0, medium: 0, low: 0 };
    for (let i = 0; i < 600; i++)
      counts[pickNextPattern(patterns, { ...OPTIONS, random })!.id] += 1;
    expect(counts.urgent).toBeGreaterThan(counts.medium);
    expect(counts.medium).toBeGreaterThan(counts.low);
    expect(counts.low).toBeGreaterThan(0);
  });
});
