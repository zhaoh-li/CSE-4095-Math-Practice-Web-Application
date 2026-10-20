import { createContext, useContext } from 'react';
import type { StorageProblem } from '../services/storage';
import type { AppSettings } from '../types';

export interface SettingsContextValue {
  settings: AppSettings;
  /** Changes some settings and saves them right away. */
  updateSettings: (changes: Partial<AppSettings>) => void;
  /** Puts every setting back to its default (used after clearing all data). */
  resetSettings: () => void;
  /** Set when the last save failed. */
  saveProblem: StorageProblem | null;
  /** False when settings can't be kept after the page closes. */
  isPersistent: boolean;
}

export const SettingsContext = createContext<SettingsContextValue | null>(null);

export function useSettings(): SettingsContextValue {
  const value = useContext(SettingsContext);
  if (!value) throw new Error('useSettings must be used inside <SettingsProvider>');
  return value;
}
