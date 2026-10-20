import type { AppSettings } from '../types';

export const DEFAULT_SETTINGS: AppSettings = {
  // Off until the app has sounds
  soundEffectsEnabled: false,
  cardAnimationsEnabled: true,
  showExplanations: true,
  feedbackEffectsEnabled: true,
  colorVisionMode: 'off',
  defaultSessionLength: 10,
  defaultDifficulty: 'beginner',
  defaultOperations: ['addition'],
  masteryThreshold: 3,
};
