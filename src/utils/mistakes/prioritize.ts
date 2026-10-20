import type { MistakePattern } from '../../types';
import type { RandomSource } from '../random';
import { activePatterns } from './mistakePatterns';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface PriorityOptions {
  now: string;
  masteryThreshold: number;
}

/**
 * How urgently a pattern needs review. Higher = sooner.
 *   frequency: each miss adds 3 (capped at 10 misses)
 *   recency:   up to 5 for a miss today, fading over the following days
 *   progress:  2 for each correct review still needed for mastery
 */
export function priorityScore(pattern: MistakePattern, { now, masteryThreshold }: PriorityOptions) {
  const frequency = Math.min(pattern.incorrectCount, 10) * 3;
  const daysSinceMiss = Math.max(
    0,
    (Date.parse(now) - Date.parse(pattern.lastIncorrectAt)) / DAY_MS,
  );
  const recency = 5 / (1 + (Number.isFinite(daysSinceMiss) ? daysSinceMiss : 30));
  const remaining = Math.max(0, masteryThreshold - pattern.similarCorrectCount) * 2;
  return frequency + recency + remaining;
}

/** How much random wiggle to add, so patterns with similar scores are mixed up. */
const TIE_JITTER = 1;

/** Active patterns, most urgent first. Patterns with similar scores come in random order. */
export function prioritizePatterns(
  patterns: readonly MistakePattern[],
  options: PriorityOptions & { random?: RandomSource },
): MistakePattern[] {
  const random = options.random ?? Math.random;
  return activePatterns(patterns)
    .map((pattern) => ({ pattern, score: priorityScore(pattern, options) + random() * TIE_JITTER }))
    .sort((a, b) => b.score - a.score)
    .map(({ pattern }) => pattern);
}

/** Only the most urgent patterns are picked from, weighted by rank. */
const PICK_FROM_TOP = 5;

/**
 * Chooses the pattern for the next review question. Favors urgent patterns
 * but mixes several, and avoids the same pattern twice in a row when possible.
 */
export function pickNextPattern(
  patterns: readonly MistakePattern[],
  options: PriorityOptions & { random?: RandomSource; lastPatternId?: string },
): MistakePattern | null {
  const random = options.random ?? Math.random;
  let ranked = prioritizePatterns(patterns, { ...options, random });
  if (ranked.length > 1 && options.lastPatternId) {
    ranked = ranked.filter((p) => p.id !== options.lastPatternId);
  }
  if (ranked.length === 0) return null;

  const top = ranked.slice(0, PICK_FROM_TOP);
  // Rank 1 gets weight 5, rank 2 weight 4, ...
  const weights = top.map((_, index) => top.length - index);
  const total = weights.reduce((sum, w) => sum + w, 0);
  let roll = random() * total;
  for (let i = 0; i < top.length; i++) {
    roll -= weights[i];
    if (roll < 0) return top[i];
  }
  return top[top.length - 1];
}
