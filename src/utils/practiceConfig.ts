import { DIFFICULTY_INFO, OPERATION_INFO, SESSION_LENGTH_OPTIONS } from '../config/practiceOptions';
import {
  DIFFICULTY_LEVELS,
  MATH_OPERATIONS,
  type AppSettings,
  type PracticeConfig,
} from '../types';

/** Checks that unknown data (e.g. router state) is a usable practice config. */
export function isPracticeConfig(value: unknown): value is PracticeConfig {
  if (typeof value !== 'object' || value === null) return false;
  const config = value as Record<string, unknown>;

  return (
    (config.mode === 'regular' || config.mode === 'mistake-review') &&
    Array.isArray(config.operations) &&
    config.operations.length > 0 &&
    config.operations.every((op) => (MATH_OPERATIONS as readonly unknown[]).includes(op)) &&
    Array.isArray(config.difficulties) &&
    config.difficulties.length > 0 &&
    config.difficulties.every((d) => (DIFFICULTY_LEVELS as readonly unknown[]).includes(d)) &&
    SESSION_LENGTH_OPTIONS.some((option) => option.value === config.sessionLength)
  );
}

/** "A", "A and B", or "A, B and C". */
export function listInWords(items: readonly string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/** Builds a short readable summary, e.g. "Addition and Subtraction". */
export function describeOperations(config: Pick<PracticeConfig, 'operations'>): string {
  return listInWords(
    MATH_OPERATIONS.filter((op) => config.operations.includes(op)).map(
      (op) => OPERATION_INFO[op].label,
    ),
  );
}

/** e.g. "Beginner (Level 1)" for one level, or "Beginner and Easy" for several. */
export function describeDifficulties(config: Pick<PracticeConfig, 'difficulties'>): string {
  const levels = DIFFICULTY_LEVELS.filter((level) => config.difficulties.includes(level));
  if (levels.length === 1) {
    const info = DIFFICULTY_INFO[levels[0]];
    return `${info.label} (Level ${info.level})`;
  }
  return listInWords(levels.map((level) => DIFFICULTY_INFO[level].label));
}

/** The practice setup to start from, based on the saved default settings. */
export function configFromSettings(settings: AppSettings): PracticeConfig {
  return {
    mode: 'regular',
    operations: [...settings.defaultOperations],
    difficulties: [...settings.defaultDifficulties],
    sessionLength: settings.defaultSessionLength,
  };
}
