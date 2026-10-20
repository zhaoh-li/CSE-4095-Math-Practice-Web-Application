import type { DifficultyLevel, MathOperation, Question } from '../../types';
import { createSeededRandom, pickRandom, type RandomSource } from '../random';
import { buildQuestion, type QuestionFacts } from './buildQuestion';
import { OPERATION_GENERATORS } from './operations';
import { getQuestionErrors } from './validateQuestion';

const MAX_ATTEMPTS = 20;

export interface GenerateQuestionOptions {
  operations: readonly MathOperation[];
  difficulty: DifficultyLevel;
  random?: RandomSource;
  /** A question not to repeat right away (usually the previous one). */
  avoid?: Question;
}

const isSameQuestion = (a: Question, b: Question) =>
  a.operation === b.operation &&
  a.firstOperand === b.firstOperand &&
  a.secondOperand === b.secondOperand;

/** Simple, always-valid questions used only if generation keeps failing. */
const FALLBACK_FACTS: Record<MathOperation, QuestionFacts> = {
  addition: { operation: 'addition', firstOperand: 2, secondOperand: 3, correctAnswer: 5 },
  subtraction: { operation: 'subtraction', firstOperand: 7, secondOperand: 4, correctAnswer: 3 },
  multiplication: {
    operation: 'multiplication',
    firstOperand: 3,
    secondOperand: 4,
    correctAnswer: 12,
  },
  division: { operation: 'division', firstOperand: 12, secondOperand: 3, correctAnswer: 4 },
};

export function createFallbackQuestion(
  operation: MathOperation,
  difficulty: DifficultyLevel,
): Question {
  // A fixed seed keeps the fallback predictable even if the random source is broken
  return buildQuestion(FALLBACK_FACTS[operation], difficulty, createSeededRandom(1));
}

/**
 * Creates a valid question for one of the chosen operations (picked at random
 * when there are several). Retries if a question is invalid or repeats the
 * previous one, and falls back to a simple question if it keeps failing.
 */
export function generateQuestion({
  operations,
  difficulty,
  random = Math.random,
  avoid,
}: GenerateQuestionOptions): Question {
  let lastValid: Question | undefined;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const operation = pickRandom(operations, random);
      const question = OPERATION_GENERATORS[operation](difficulty, random);
      const errors = getQuestionErrors(question);
      if (errors.length > 0) {
        logGenerationProblem(`Invalid ${operation} question: ${errors.join('; ')}`, question);
        continue;
      }
      if (avoid && isSameQuestion(question, avoid)) {
        lastValid = question;
        continue;
      }
      return question;
    } catch (error) {
      logGenerationProblem('Question generation threw an error', error);
    }
  }

  // Only tiny ranges can't avoid a repeat; a repeat is better than nothing
  if (lastValid) return lastValid;

  logGenerationProblem(`Using a fallback question after ${MAX_ATTEMPTS} failed attempts`);
  return createFallbackQuestion(operations[0] ?? 'addition', difficulty);
}

function logGenerationProblem(message: string, detail?: unknown) {
  if (import.meta.env.DEV) console.warn(`[generateQuestion] ${message}`, detail ?? '');
}
