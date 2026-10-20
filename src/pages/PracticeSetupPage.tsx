import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { DifficultySelector } from '../components/practice-setup/DifficultySelector';
import { OperationSelector } from '../components/practice-setup/OperationSelector';
import { SessionLengthSelector } from '../components/practice-setup/SessionLengthSelector';
import { Button } from '../components/ui/Button';
import { DEFAULT_PRACTICE_CONFIG } from '../config/practiceOptions';
import type { PracticeConfig } from '../types';
import { isPracticeConfig } from '../utils/practiceConfig';
import styles from './PracticeSetupPage.module.css';

export function PracticeSetupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as { config?: unknown; notice?: unknown } | null;
  const notice = typeof routeState?.notice === 'string' ? routeState.notice : null;
  // Coming back from a session ("Change Settings") keeps the previous choices
  const [config, setConfig] = useState<PracticeConfig>(() =>
    isPracticeConfig(routeState?.config) ? routeState.config : DEFAULT_PRACTICE_CONFIG,
  );
  const hasOperation = config.operations.length > 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasOperation) return;
    navigate('/practice/session', { state: { config } });
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
        <OperationSelector
          selected={config.operations}
          onChange={(operations) => setConfig((prev) => ({ ...prev, operations }))}
        />
        <DifficultySelector
          selected={config.difficulty}
          onChange={(difficulty) => setConfig((prev) => ({ ...prev, difficulty }))}
        />
        <SessionLengthSelector
          selected={config.sessionLength}
          onChange={(sessionLength) => setConfig((prev) => ({ ...prev, sessionLength }))}
        />

        <div className={styles.footer}>
          {!hasOperation && (
            <p className={styles.error} role="alert">
              <span aria-hidden="true">!</span> Pick at least one operation to start.
            </p>
          )}
          <Button type="submit" disabled={!hasOperation}>
            Start Session
          </Button>
        </div>
      </form>
    </section>
  );
}
