import { DEFAULT_SETTINGS } from '../config/defaultSettings';
import { SESSION_LENGTH_OPTIONS } from '../config/practiceOptions';
import {
  COLOR_VISION_MODES,
  DIFFICULTY_LEVELS,
  MATH_OPERATIONS,
  type AppSettings,
  type ColorVisionMode,
  type DifficultyLevel,
  type MathOperation,
  type ActiveSessionSnapshot,
  type MistakePattern,
  type PracticeAttempt,
  type PracticeSession,
  type SessionLength,
} from '../types';
import type { AttemptArchive } from '../utils/attemptArchive';
import { isPracticeConfig } from '../utils/practiceConfig';
import { getQuestionErrors } from '../utils/questions/validateQuestion';
import type { ReadResult } from './storage';

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === 'string' && value !== '';
const isCount = (value: unknown): value is number =>
  Number.isInteger(value) && (value as number) >= 0;
const isWhole = (value: unknown): value is number => Number.isInteger(value);
const isOptionalString = (value: unknown) => value === undefined || isString(value);

export const isMathOperation = (value: unknown): value is MathOperation =>
  (MATH_OPERATIONS as readonly unknown[]).includes(value);
export const isDifficultyLevel = (value: unknown): value is DifficultyLevel =>
  (DIFFICULTY_LEVELS as readonly unknown[]).includes(value);
export const isSessionLength = (value: unknown): value is SessionLength =>
  SESSION_LENGTH_OPTIONS.some((option) => option.value === value);
const isOperationList = (value: unknown): value is MathOperation[] =>
  Array.isArray(value) && value.length > 0 && value.every(isMathOperation);
const isDifficultyList = (value: unknown): value is DifficultyLevel[] =>
  Array.isArray(value) && value.length > 0 && value.every(isDifficultyLevel);

export function isStoredSession(value: unknown): value is PracticeSession {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    (value.mode === 'regular' || value.mode === 'mistake-review') &&
    isOperationList(value.operations) &&
    isDifficultyList(value.difficulties) &&
    isSessionLength(value.sessionLength) &&
    isCount(value.currentQuestionIndex) &&
    isCount(value.attemptedCount) &&
    isCount(value.correctCount) &&
    isCount(value.incorrectCount) &&
    isCount(value.mistakeReviewCount) &&
    value.correctCount + value.incorrectCount === value.attemptedCount &&
    typeof value.isActive === 'boolean' &&
    isString(value.startedAt) &&
    isOptionalString(value.completedAt)
  );
}

export function isStoredAttempt(value: unknown): value is PracticeAttempt {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    isString(value.sessionId) &&
    isString(value.questionId) &&
    isMathOperation(value.operation) &&
    isDifficultyLevel(value.difficulty) &&
    isCount(value.firstOperand) &&
    isCount(value.secondOperand) &&
    isCount(value.correctAnswer) &&
    (value.selectedAnswer === undefined || isWhole(value.selectedAnswer)) &&
    (value.result === 'correct' || value.result === 'incorrect') &&
    (value.source === 'regular' || value.source === 'mistake-review') &&
    isOptionalString(value.mistakePatternId) &&
    isString(value.answeredAt)
  );
}

export function isStoredMistakePattern(value: unknown): value is MistakePattern {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    isMathOperation(value.operation) &&
    isCount(value.firstOperand) &&
    isCount(value.secondOperand) &&
    isCount(value.correctAnswer) &&
    isDifficultyLevel(value.difficulty) &&
    isCount(value.incorrectCount) &&
    (value.incorrectCount as number) >= 1 &&
    isCount(value.similarCorrectCount) &&
    typeof value.isMastered === 'boolean' &&
    isString(value.createdAt) &&
    isString(value.lastIncorrectAt) &&
    isOptionalString(value.masteredAt)
  );
}

export function isActiveSessionSnapshot(value: unknown): value is ActiveSessionSnapshot {
  if (!isRecord(value)) return false;
  const { selectedAnswer, isCardFlipped, currentQuestion } = value;
  if (!isRecord(currentQuestion) || !Array.isArray(currentQuestion.choices)) return false;
  return (
    isString(value.routeKey) &&
    isPracticeConfig(value.config) &&
    isStoredSession(value.session) &&
    value.session.isActive &&
    getQuestionErrors(currentQuestion as never).length === 0 &&
    (selectedAnswer === null || currentQuestion.choices.includes(selectedAnswer)) &&
    typeof isCardFlipped === 'boolean' &&
    isString(value.savedAt)
  );
}

export function parseAttemptArchive(raw: unknown): ReadResult<AttemptArchive> {
  const empty = { counts: {}, archivedCount: 0 };
  if (!isRecord(raw) || !isRecord(raw.counts) || !isCount(raw.archivedCount)) {
    return { value: empty, problem: 'invalid' };
  }
  const keyPattern =
    /^(addition|subtraction|multiplication|division)\|(beginner|easy|intermediate|advanced)\|(regular|mistake-review)$/;
  const valid = Object.entries(raw.counts).every(
    ([key, count]) =>
      keyPattern.test(key) && isRecord(count) && isCount(count.correct) && isCount(count.incorrect),
  );
  return valid
    ? {
        value: { counts: raw.counts as AttemptArchive['counts'], archivedCount: raw.archivedCount },
      }
    : { value: empty, problem: 'invalid' };
}

/** Keeps the valid items of a stored list and reports if any were dropped. */
export function parseList<T>(guard: (item: unknown) => item is T) {
  return (raw: unknown): ReadResult<T[]> => {
    if (!Array.isArray(raw)) return { value: [], problem: 'invalid' };
    const valid = raw.filter(guard);
    return valid.length === raw.length ? { value: valid } : { value: valid, problem: 'invalid' };
  };
}

/**
 * Settings are checked field by field: a bad value falls back to its default
 * without throwing away the student's other choices.
 */
export function parseSettings(raw: unknown): ReadResult<AppSettings> {
  if (!isRecord(raw)) return { value: { ...DEFAULT_SETTINGS }, problem: 'invalid' };
  const stored: UnknownRecord = raw;
  let hadProblem = false;

  function pick<K extends keyof AppSettings>(
    key: K,
    guard: (value: unknown) => value is AppSettings[K],
  ): AppSettings[K] {
    const value = stored[key];
    if (value === undefined) return DEFAULT_SETTINGS[key];
    if (guard(value)) return value;
    hadProblem = true;
    return DEFAULT_SETTINGS[key];
  }

  const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';
  const isColorVisionMode = (value: unknown): value is ColorVisionMode =>
    (COLOR_VISION_MODES as readonly unknown[]).includes(value);
  const isThreshold = (value: unknown): value is number =>
    Number.isInteger(value) && (value as number) >= 1 && (value as number) <= 10;

  const settings: AppSettings = {
    soundEffectsEnabled: pick('soundEffectsEnabled', isBoolean),
    cardAnimationsEnabled: pick('cardAnimationsEnabled', isBoolean),
    keyboardShortcutsEnabled: pick('keyboardShortcutsEnabled', isBoolean),
    showExplanations: pick('showExplanations', isBoolean),
    feedbackEffectsEnabled: pick('feedbackEffectsEnabled', isBoolean),
    colorVisionMode: pick('colorVisionMode', isColorVisionMode),
    defaultSessionLength: pick('defaultSessionLength', isSessionLength),
    defaultDifficulties: pick('defaultDifficulties', isDifficultyList),
    defaultOperations: pick('defaultOperations', isOperationList),
    masteryThreshold: pick('masteryThreshold', isThreshold),
  };

  // Early test builds saved an on/off "colorBlindMode"; treat "on" as red-green
  if (stored.colorVisionMode === undefined && stored.colorBlindMode === true) {
    settings.colorVisionMode = 'red-green';
  }

  // Keep a stable order: + − × ÷, and Beginner → Advanced
  settings.defaultOperations = MATH_OPERATIONS.filter((op) =>
    settings.defaultOperations.includes(op),
  );
  settings.defaultDifficulties = DIFFICULTY_LEVELS.filter((level) =>
    settings.defaultDifficulties.includes(level),
  );

  return hadProblem ? { value: settings, problem: 'invalid' } : { value: settings };
}
