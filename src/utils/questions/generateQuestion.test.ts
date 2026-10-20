import { DIFFICULTY_LEVELS, MATH_OPERATIONS, type Question } from '../../types';
import { createSeededRandom } from '../random';
import { createFallbackQuestion, generateQuestion } from './generateQuestion';
import { getQuestionErrors } from './validateQuestion';

describe('generateQuestion', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(MATH_OPERATIONS.flatMap((op) => DIFFICULTY_LEVELS.map((d) => [op, d] as const)))(
    'creates valid %s questions at %s level',
    (operation, difficulty) => {
      const random = createSeededRandom(8);
      for (let i = 0; i < 50; i++) {
        const q = generateQuestion({ operations: [operation], difficulty, random });
        expect(q.operation).toBe(operation);
        expect(q.difficulty).toBe(difficulty);
        expect(getQuestionErrors(q)).toEqual([]);
      }
    },
  );

  it('mixes operations when several are chosen', () => {
    const random = createSeededRandom(3);
    const seen = new Set(
      Array.from(
        { length: 100 },
        () =>
          generateQuestion({ operations: MATH_OPERATIONS, difficulty: 'easy', random }).operation,
      ),
    );
    expect(seen).toEqual(new Set(MATH_OPERATIONS));
  });

  it('only uses the chosen operations', () => {
    const random = createSeededRandom(4);
    for (let i = 0; i < 100; i++) {
      const { operation } = generateQuestion({
        operations: ['addition', 'division'],
        difficulty: 'beginner',
        random,
      });
      expect(['addition', 'division']).toContain(operation);
    }
  });

  it('avoids repeating the previous question', () => {
    const random = createSeededRandom(6);
    let previous: Question | undefined;
    for (let i = 0; i < 200; i++) {
      const q = generateQuestion({
        operations: ['addition'],
        difficulty: 'beginner',
        random,
        avoid: previous,
      });
      if (previous) {
        expect([q.firstOperand, q.secondOperand]).not.toEqual([
          previous.firstOperand,
          previous.secondOperand,
        ]);
      }
      previous = q;
    }
  });

  it('falls back to a simple valid question when generation keeps failing', () => {
    const q = generateQuestion({
      operations: ['multiplication'],
      difficulty: 'advanced',
      random: () => Number.NaN,
    });
    expect(getQuestionErrors(q)).toEqual([]);
    expect(q.operation).toBe('multiplication');
    expect(console.warn).toHaveBeenCalled();
  });

  it('falls back to addition when no operations are given', () => {
    const q = generateQuestion({ operations: [], difficulty: 'beginner' });
    expect(q.operation).toBe('addition');
    expect(getQuestionErrors(q)).toEqual([]);
  });
});

describe('createFallbackQuestion', () => {
  it.each(MATH_OPERATIONS)('creates a valid %s question', (operation) => {
    expect(getQuestionErrors(createFallbackQuestion(operation, 'beginner'))).toEqual([]);
  });
});
