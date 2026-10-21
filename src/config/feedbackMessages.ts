import type { SelfReportedResult } from '../types';
import { pickRandom, type RandomSource } from '../utils/random';

/**
 * Short messages shown after each answer. Wrong-answer messages are
 * supportive, never shaming: no "wrong", "bad", or "fail".
 */
export const FEEDBACK_MESSAGES: Record<SelfReportedResult, readonly string[]> = {
  correct: [
    'Great job!',
    'You got it!',
    'Awesome work!',
    'Super!',
    'Way to go!',
    'Fantastic!',
    'Nailed it!',
    'You are on a roll!',
  ],
  incorrect: [
    'Nice try! Keep going.',
    'Mistakes help your brain grow!',
    'Good effort! You will get it next time.',
    'That was a tricky one. Keep it up!',
    'Every try makes you stronger!',
    'No worries, practice makes progress!',
  ],
};

export const FEEDBACK_ICONS: Record<SelfReportedResult, string> = {
  correct: '🎉',
  incorrect: '💪',
};

/** A random message for the result, never the same as the previous one. */
export function pickFeedbackMessage(
  result: SelfReportedResult,
  previous: string | null,
  random: RandomSource = Math.random,
): string {
  const options = FEEDBACK_MESSAGES[result].filter((message) => message !== previous);
  return pickRandom(options, random);
}
