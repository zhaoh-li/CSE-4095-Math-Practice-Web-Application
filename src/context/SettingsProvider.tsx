import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_SETTINGS } from '../config/defaultSettings';
import { appData } from '../services/appData';
import type { StorageProblem } from '../services/storage';
import type { AppSettings } from '../types';
import { SettingsContext, type SettingsContextValue } from './SettingsContext';

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => appData.loadSettings());
  const [saveProblem, setSaveProblem] = useState<StorageProblem | null>(null);

  // A color vision theme swaps the palette for the whole page (see index.css)
  useEffect(() => {
    const root = document.documentElement;
    if (settings.colorVisionMode === 'off') delete root.dataset.colorVision;
    else root.dataset.colorVision = settings.colorVisionMode;
  }, [settings.colorVisionMode]);

  const save = useCallback((next: AppSettings) => {
    setSettings(next);
    const result = appData.saveSettings(next);
    setSaveProblem(result.ok ? null : result.problem);
  }, []);

  const updateSettings = useCallback(
    (changes: Partial<AppSettings>) => save({ ...settings, ...changes }),
    [save, settings],
  );

  const resetSettings = useCallback(() => {
    setSettings({ ...DEFAULT_SETTINGS });
    setSaveProblem(null);
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      updateSettings,
      resetSettings,
      saveProblem,
      isPersistent: appData.isPersistent,
    }),
    [settings, updateSettings, resetSettings, saveProblem],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
