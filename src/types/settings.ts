import type { DifficultyLevel, MathOperation } from './question';
import type { SessionLength } from './session';

export interface AppSettings {
  soundEffectsEnabled: boolean;
  cardAnimationsEnabled: boolean;
  showExplanations: boolean;
  feedbackEffectsEnabled: boolean;
  defaultSessionLength: SessionLength;
  defaultDifficulty: DifficultyLevel;
  defaultOperations: MathOperation[];
  /** Correct similar answers needed to master a mistake. Default is 3. */
  masteryThreshold: number;
}
