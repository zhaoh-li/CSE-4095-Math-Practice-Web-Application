import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { DifficultySelector } from '../components/practice-setup/DifficultySelector';
import { ModeSelector } from '../components/practice-setup/ModeSelector';
import { OperationSelector } from '../components/practice-setup/OperationSelector';
import { SessionLengthSelector } from '../components/practice-setup/SessionLengthSelector';
import { Button } from '../components/ui/Button';
import { useSettings } from '../context/SettingsContext';
import { appData } from '../services/appData';
import type { PracticeConfig } from '../types';
import { activePatterns, createReviewConfig } from '../utils/mistakes/mistakePatterns';
import { configFromSettings, isPracticeConfig } from '../utils/practiceConfig';
import styles from './PracticeSetupPage.module.css';

export function PracticeSetupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as { config?: unknown; notice?: unknown } | null;
  const notice = typeof routeState?.notice === 'string' ? routeState.notice : null;
  const { settings } = useSettings();
  const [patterns] = useState(() => appData.loadMistakePatterns());
  const activeMistakeCount = activePatterns(patterns).length;

  // Coming back from a session ("Change Settings") keeps the previous choices;
  // otherwise start from the defaults chosen on the Settings page
  const [config, setConfig] = useState<PracticeConfig>(() => {
    const initial = isPracticeConfig(routeState?.config)
      ? routeState.config
      : configFromSettings(settings);
    // Review mode isn't possible without mistakes
    return initial.mode === 'mistake-review' && activeMistakeCount === 0
      ? { ...configFromSettings(settings), sessionLength: initial.sessionLength }
      : initial;
  });

  const isReview = config.mode === 'mistake-review';
  const canStart = isReview ? activeMistakeCount > 0 : config.operations.length > 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canStart) return;
    const finalConfig = isReview ? createReviewConfig(patterns, config) : config;
    navigate('/practice/session', { state: { config: finalConfig } });
  }

  function changeMode(mode: PracticeConfig['mode']) {
    setConfig((prev) => {
      if (mode === 'regular' && prev.mode === 'mistake-review') {
        // Bring back the usual operation choices
        return { ...prev, mode, operations: [...settings.defaultOperations] };
      }
      return { ...prev, mode };
    });
  }

  return (
    <section aria-labelledby="setup-title">
      <h1 id="setup-title">Set Up Your Practice</h1>
      {notice && (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      )}
      <p className={styles.intro}>Choose what you want to practice, then press Start!</p>

      <form className={styles.panel} onSubmit={handleSubmit} noValidate>
        <ModeSelector
          selected={config.mode}
          onChange={changeMode}
          activeMistakeCount={activeMistakeCount}
        />

        {isReview ? (
          <p className={styles.reviewNote}>
            You'll get questions similar to the ones you missed. Answer a mistake's similar
            questions right {settings.masteryThreshold} times to master it!
          </p>
        ) : (
          <>
            <OperationSelector
              legend="Choose operations"
              selected={config.operations}
              onChange={(operations) => setConfig((prev) => ({ ...prev, operations }))}
            />
            <DifficultySelector
              legend="Choose a level"
              selected={config.difficulty}
              onChange={(difficulty) => setConfig((prev) => ({ ...prev, difficulty }))}
            />
          </>
        )}
        <SessionLengthSelector
          legend="How many questions?"
          selected={config.sessionLength}
          onChange={(sessionLength) => setConfig((prev) => ({ ...prev, sessionLength }))}
        />

        <div className={styles.footer}>
          {!canStart && (
            <p className={styles.error} role="alert">
              <span aria-hidden="true">!</span> Pick at least one operation to start.
            </p>
          )}
          <Button type="submit" disabled={!canStart}>
            Start Session
          </Button>
        </div>
      </form>
    </section>
  );
}
