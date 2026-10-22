import type { DifficultyLevel, MathOperation } from './question';
import type { SessionLength } from './session';

/** Color themes for different kinds of color vision. */
export const COLOR_VISION_MODES = ['off', 'red-green', 'blue-yellow', 'high-contrast'] as const;
export type ColorVisionMode = (typeof COLOR_VISION_MODES)[number];

export interface AppSettings {
  soundEffectsEnabled: boolean;
  cardAnimationsEnabled: boolean;
  /** Number and letter keys on flash cards (1–4, F, R, W, ?). */
  keyboardShortcutsEnabled: boolean;
  showExplanations: boolean;
  feedbackEffectsEnabled: boolean;
  /** Swaps the whole color theme for one suited to a type of color vision. */
  colorVisionMode: ColorVisionMode;
  defaultSessionLength: SessionLength;
  defaultDifficulties: DifficultyLevel[];
  defaultOperations: MathOperation[];
  /** Correct similar answers needed to master a mistake. Default is 3. */
  masteryThreshold: number;
}
