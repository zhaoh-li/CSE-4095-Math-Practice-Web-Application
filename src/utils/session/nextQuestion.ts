import type { MistakePattern, PracticeConfig, Question } from '../../types';
import { pickNextPattern } from '../mistakes/prioritize';
import { exactQuestionKey, generateSimilarQuestion } from '../mistakes/similarQuestions';
import { generateQuestion } from '../questions/generateQuestion';
import type { RandomSource } from '../random';

export interface NextQuestionOptions {
  config: PracticeConfig;
  /** The question just answered, if any. */
  previous?: Question;
  /** Current mistake patterns (used in mistake review). */
  patterns: readonly MistakePattern[];
  masteryThreshold: number;
  now?: string;
  random?: RandomSource;
}

/**
 * The next question for a session.
 * Regular practice: a new random question.
 * Mistake review: a question related to one of the active mistakes, or null
 * when every mistake has been mastered.
 */
export function nextQuestion({
  config,
  previous,
  patterns,
  masteryThreshold,
  now = new Date().toISOString(),
  random = Math.random,
}: NextQuestionOptions): Question | null {
  if (config.mode === 'regular') {
    return generateQuestion({ ...config, random, avoid: previous });
  }

  const pattern = pickNextPattern(patterns, {
    now,
    masteryThreshold,
    random,
    lastPatternId: previous?.mistakePatternId,
  });
  if (!pattern) return null;

  return generateSimilarQuestion(pattern, {
    random,
    avoidKeys: previous ? [exactQuestionKey(previous)] : [],
  });
}
