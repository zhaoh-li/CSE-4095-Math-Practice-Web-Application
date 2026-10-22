import { DIFFICULTY_LEVELS, MATH_OPERATIONS, type MistakePattern } from '../../types';
import { generateQuestion } from '../questions/generateQuestion';
import { getQuestionErrors } from '../questions/validateQuestion';
import { createSeededRandom } from '../random';
import {
  exactQuestionKey,
  fitsDifficulty,
  generateSimilarQuestion,
  similarCandidates,
} from './similarQuestions';

function pattern(extra: Partial<MistakePattern>): MistakePattern {
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
    createdAt: '2026-10-20T12:00:00.000Z',
    lastIncorrectAt: '2026-10-20T12:00:00.000Z',
    ...extra,
  };
}

const keysFor = (p: MistakePattern, strategy: string) =>
  similarCandidates(p)
    .filter((c) => c.strategy === strategy)
    .map((c) => exactQuestionKey(c.facts));

describe('nearby-number questions', () => {
  it('nudges one number of a multiplication fact', () => {
    const keys = keysFor(pattern({}), 'nearby');
    expect(keys).toEqual(expect.arrayContaining(['multiplication:6:8', 'multiplication:7:9']));
  });

  it('stays within the level (easy × uses factors 0–10)', () => {
    const keys = keysFor(
      pattern({ firstOperand: 10, secondOperand: 10, correctAnswer: 100 }),
      'nearby',
    );
    expect(keys).not.toContain('multiplication:11:10');
    expect(keys).not.toContain('multiplication:12:10');
  });

  it('never makes a subtraction with a negative answer', () => {
    const p = pattern({
      operation: 'subtraction',
      firstOperand: 5,
      secondOperand: 4,
      correctAnswer: 1,
      difficulty: 'beginner',
    });
    for (const c of similarCandidates(p)) {
      if (c.facts.operation === 'subtraction') {
        expect(c.facts.firstOperand).toBeGreaterThanOrEqual(c.facts.secondOperand);
      }
    }
    expect(keysFor(p, 'nearby')).not.toContain('subtraction:5:6');
  });

  it('keeps division even and never divides by zero', () => {
    const p = pattern({
      operation: 'division',
      firstOperand: 24,
      secondOperand: 6,
      correctAnswer: 4,
    });
    const division = similarCandidates(p).filter((c) => c.facts.operation === 'division');
    expect(division.length).toBeGreaterThan(0);
    for (const { facts } of division) {
      expect(facts.secondOperand).toBeGreaterThan(0);
      expect(facts.firstOperand % facts.secondOperand).toBe(0);
    }
  });

  it('does not include the original question', () => {
    expect(keysFor(pattern({}), 'nearby')).not.toContain('multiplication:7:8');
  });
});

describe('reversed-operand questions', () => {
  it('swaps addition and multiplication', () => {
    expect(keysFor(pattern({}), 'reversed')).toEqual(['multiplication:8:7']);
    const add = pattern({
      operation: 'addition',
      firstOperand: 3,
      secondOperand: 6,
      correctAnswer: 9,
      difficulty: 'beginner',
    });
    expect(keysFor(add, 'reversed')).toEqual(['addition:6:3']);
  });

  it('does not swap subtraction or division, where order matters', () => {
    const sub = pattern({
      operation: 'subtraction',
      firstOperand: 9,
      secondOperand: 4,
      correctAnswer: 5,
      difficulty: 'beginner',
    });
    const div = pattern({
      operation: 'division',
      firstOperand: 24,
      secondOperand: 6,
      correctAnswer: 4,
    });
    expect(keysFor(sub, 'reversed')).toEqual([]);
    expect(keysFor(div, 'reversed')).toEqual([]);
  });

  it('skips doubles like 6 × 6, since swapping changes nothing', () => {
    expect(
      keysFor(pattern({ firstOperand: 6, secondOperand: 6, correctAnswer: 36 }), 'reversed'),
    ).toEqual([]);
  });
});

describe('fact-family questions', () => {
  it('turns a division mistake into multiplication', () => {
    const p = pattern({
      operation: 'division',
      firstOperand: 24,
      secondOperand: 6,
      correctAnswer: 4,
    });
    expect(keysFor(p, 'fact-family')).toEqual(
      expect.arrayContaining(['multiplication:4:6', 'multiplication:6:4']),
    );
  });

  it('turns a multiplication mistake into division', () => {
    expect(keysFor(pattern({}), 'fact-family')).toEqual(
      expect.arrayContaining(['division:56:7', 'division:56:8']),
    );
  });

  it('turns an addition mistake into subtraction', () => {
    const p = pattern({
      operation: 'addition',
      firstOperand: 8,
      secondOperand: 5,
      correctAnswer: 13,
      difficulty: 'easy',
    });
    expect(keysFor(p, 'fact-family')).toEqual(
      expect.arrayContaining(['subtraction:13:8', 'subtraction:13:5']),
    );
  });

  it('turns a subtraction mistake into addition', () => {
    const p = pattern({
      operation: 'subtraction',
      firstOperand: 13,
      secondOperand: 5,
      correctAnswer: 8,
      difficulty: 'easy',
    });
    expect(keysFor(p, 'fact-family')).toEqual(
      expect.arrayContaining(['addition:5:8', 'addition:8:5']),
    );
  });

  it('only keeps fact-family questions that fit the level', () => {
    // Beginner ÷ uses divisors 1–5, so 21 ÷ 7 is out but 21 ÷ 3 is in
    const p = pattern({
      firstOperand: 3,
      secondOperand: 7,
      correctAnswer: 21,
      difficulty: 'beginner',
    });
    const keys = keysFor(p, 'fact-family');
    expect(keys).toContain('division:21:3');
    expect(keys).not.toContain('division:21:7');
  });

  it('never divides by zero from a ×0 mistake', () => {
    const p = pattern({
      firstOperand: 0,
      secondOperand: 7,
      correctAnswer: 0,
      difficulty: 'beginner',
    });
    for (const { facts } of similarCandidates(p)) {
      if (facts.operation === 'division') expect(facts.secondOperand).not.toBe(0);
    }
  });
});

describe('generateSimilarQuestion', () => {
  it.each(MATH_OPERATIONS.flatMap((op) => DIFFICULTY_LEVELS.map((d) => [op, d] as const)))(
    'makes valid, labeled review questions for %s mistakes at %s level',
    (operation, difficulty) => {
      const random = createSeededRandom(17);
      for (let i = 0; i < 30; i++) {
        // Start from a real question so the mistake fits its level
        const original = generateQuestion({
          operations: [operation],
          difficulties: [difficulty],
          random,
        });
        const p = pattern({ ...original, id: `p-${i}` });
        const q = generateSimilarQuestion(p, { random });

        expect(getQuestionErrors(q)).toEqual([]);
        expect(q.source).toBe('mistake-review');
        expect(q.mistakePatternId).toBe(`p-${i}`);
        expect(q.difficulty).toBe(difficulty);
        expect(fitsDifficulty(q, difficulty)).toBe(true);
      }
    },
  );

  it('uses different strategies over time', () => {
    const random = createSeededRandom(3);
    const operations = new Set<string>();
    for (let i = 0; i < 40; i++)
      operations.add(generateSimilarQuestion(pattern({}), { random }).operation);
    // Fact-family questions switch × to ÷
    expect(operations).toEqual(new Set(['multiplication', 'division']));
  });

  it('skips questions it was told to avoid', () => {
    const random = createSeededRandom(5);
    const all = similarCandidates(pattern({})).map((c) => exactQuestionKey(c.facts));
    const allowed = all[0];
    const q = generateSimilarQuestion(pattern({}), { random, avoidKeys: all.slice(1) });
    expect(exactQuestionKey(q)).toBe(allowed);
  });

  it('falls back to the original question when nothing related fits', () => {
    const p = pattern({
      operation: 'addition',
      firstOperand: 0,
      secondOperand: 0,
      correctAnswer: 0,
      difficulty: 'beginner',
    });
    const avoidKeys = similarCandidates(p).map((c) => exactQuestionKey(c.facts));
    const q = generateSimilarQuestion(p, { avoidKeys });
    expect(exactQuestionKey(q)).toBe('addition:0:0');
    expect(q.source).toBe('mistake-review');
  });
});
