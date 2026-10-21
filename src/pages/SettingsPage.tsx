import { useState } from 'react';
import { useNavigate } from 'react-router';
import { DifficultySelector } from '../components/practice-setup/DifficultySelector';
import { OperationSelector } from '../components/practice-setup/OperationSelector';
import { SessionLengthSelector } from '../components/practice-setup/SessionLengthSelector';
import { ColorVisionSelector } from '../components/settings/ColorVisionSelector';
import { MasteryThresholdSelector } from '../components/settings/MasteryThresholdSelector';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ToggleSwitch } from '../components/ui/ToggleSwitch';
import { useSettings } from '../context/SettingsContext';
import { appData } from '../services/appData';
import type { AppSettings, MathOperation } from '../types';
import styles from './SettingsPage.module.css';

export const DATA_CLEARED_NOTICE = 'All app data was cleared. Everything is back to the start.';

export function SettingsPage() {
  const navigate = useNavigate();
  const { settings, updateSettings, resetSettings, saveProblem, isPersistent } = useSettings();
  const [operations, setOperations] = useState<MathOperation[]>(settings.defaultOperations);
  const [savedMessage, setSavedMessage] = useState('');
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  function change(changes: Partial<AppSettings>) {
    updateSettings(changes);
    setSavedMessage('Settings saved.');
  }

  function changeOperations(next: MathOperation[]) {
    setOperations(next);
    // Only save a usable default; an empty list would leave Start disabled
    if (next.length > 0) change({ defaultOperations: next });
    else setSavedMessage('');
  }

  function handleClearAll() {
    appData.clearAllData();
    resetSettings();
    setIsConfirmingClear(false);
    navigate('/', { state: { notice: DATA_CLEARED_NOTICE } });
  }

  return (
    <section aria-labelledby="settings-title">
      <h1 id="settings-title">Settings</h1>
      <p className={styles.intro}>Changes are saved automatically.</p>

      <p className={styles.status} role="status">
        {saveProblem
          ? "Your settings couldn't be saved on this device."
          : isPersistent
            ? savedMessage
            : 'This browser is not saving data, so settings reset when you close the page.'}
      </p>

      <section className={styles.panel} aria-labelledby="practice-defaults-title">
        <h2 id="practice-defaults-title">Practice Defaults</h2>
        <p className={styles.help}>
          These are picked for you when you start practicing. You can still change them each time.
        </p>
        <OperationSelector
          legend="Default operations"
          selected={operations}
          onChange={changeOperations}
        />
        {operations.length === 0 && (
          <p className={styles.error} role="alert">
            <span aria-hidden="true">! </span>Pick at least one operation to save as a default.
          </p>
        )}
        <DifficultySelector
          legend="Default level"
          selected={settings.defaultDifficulty}
          onChange={(defaultDifficulty) => change({ defaultDifficulty })}
        />
        <SessionLengthSelector
          legend="Default number of questions"
          selected={settings.defaultSessionLength}
          onChange={(defaultSessionLength) => change({ defaultSessionLength })}
        />
        <MasteryThresholdSelector
          selected={settings.masteryThreshold}
          onChange={(masteryThreshold) => change({ masteryThreshold })}
        />
      </section>

      <section className={styles.panel} aria-labelledby="display-title">
        <h2 id="display-title">Display and Sound</h2>
        <ColorVisionSelector
          selected={settings.colorVisionMode}
          onChange={(colorVisionMode) => change({ colorVisionMode })}
        />
        <div className={styles.toggles}>
          <ToggleSwitch
            label="Animations"
            description="Flip and slide the flash cards, and other movement. Turn off for instant changes."
            checked={settings.cardAnimationsEnabled}
            onChange={(cardAnimationsEnabled) => change({ cardAnimationsEnabled })}
          />
          <ToggleSwitch
            label="Keyboard shortcuts"
            description="On flash cards: 1–4 pick an answer, F flips, R or W says right or wrong, ? shows the list. Turn off if keys get pressed by accident."
            checked={settings.keyboardShortcutsEnabled}
            onChange={(keyboardShortcutsEnabled) => change({ keyboardShortcutsEnabled })}
          />
          <ToggleSwitch
            label="Sound effects"
            description="Play sounds for right and wrong answers. Sounds are coming in a future update."
            checked={settings.soundEffectsEnabled}
            onChange={(soundEffectsEnabled) => change({ soundEffectsEnabled })}
          />
          <ToggleSwitch
            label="Show explanations"
            description="Explain the answer on the back of each card. Coming in a future update."
            checked={settings.showExplanations}
            onChange={(showExplanations) => change({ showExplanations })}
          />
        </div>
      </section>

      <section className={`${styles.panel} ${styles.danger}`} aria-labelledby="data-title">
        <h2 id="data-title">Your Data</h2>
        <p className={styles.help}>
          Your progress is saved only in this browser. Clearing it removes all answers, sessions,
          mistakes, and settings.
        </p>
        <Button variant="danger" onClick={() => setIsConfirmingClear(true)}>
          Clear All Application Data
        </Button>
      </section>

      <ConfirmDialog
        open={isConfirmingClear}
        title="Delete all app data?"
        confirmLabel="Delete everything"
        cancelLabel="Cancel"
        acknowledgement="I understand this deletes everything and cannot be undone."
        onConfirm={handleClearAll}
        onCancel={() => setIsConfirmingClear(false)}
      >
        <p>
          This permanently deletes <strong>all</strong> practice answers, sessions, statistics, and
          settings saved in this browser.
        </p>
      </ConfirmDialog>
    </section>
  );
}
