import type { AppSettings } from '../types';

export const DEFAULT_SETTINGS: AppSettings = {
  // A chime when an answer is marked right
  soundEffectsEnabled: true,
  cardAnimationsEnabled: true,
  keyboardShortcutsEnabled: true,
  showExplanations: true,
  feedbackEffectsEnabled: true,
  colorVisionMode: 'off',
  defaultSessionLength: 10,
  defaultDifficulties: ['beginner'],
  defaultOperations: ['addition'],
  masteryThreshold: 3,
};
