import { OPERATION_INFO, SESSION_LENGTH_OPTIONS } from '../config/practiceOptions';
import { DIFFICULTY_LEVELS, MATH_OPERATIONS, type PracticeConfig } from '../types';

/** Checks that unknown data (e.g. router state) is a usable practice config. */
export function isPracticeConfig(value: unknown): value is PracticeConfig {
  if (typeof value !== 'object' || value === null) return false;
  const config = value as Record<string, unknown>;

  return (
    (config.mode === 'regular' || config.mode === 'mistake-review') &&
    Array.isArray(config.operations) &&
    config.operations.length > 0 &&
    config.operations.every((op) => (MATH_OPERATIONS as readonly unknown[]).includes(op)) &&
    (DIFFICULTY_LEVELS as readonly unknown[]).includes(config.difficulty) &&
    SESSION_LENGTH_OPTIONS.some((option) => option.value === config.sessionLength)
  );
}

/** Builds a short readable summary, e.g. "Addition and Subtraction". */
export function describeOperations(config: PracticeConfig): string {
  const labels = MATH_OPERATIONS.filter((op) => config.operations.includes(op)).map(
    (op) => OPERATION_INFO[op].label,
  );
  if (labels.length <= 1) return labels.join('');
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
}
