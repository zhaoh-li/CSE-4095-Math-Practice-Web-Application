import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { DifficultySelector } from '../components/practice-setup/DifficultySelector';
import { OperationSelector } from '../components/practice-setup/OperationSelector';
import { SessionLengthSelector } from '../components/practice-setup/SessionLengthSelector';
import { Button } from '../components/ui/Button';
import { DEFAULT_PRACTICE_CONFIG } from '../config/practiceOptions';
import type { PracticeConfig } from '../types';
import styles from './PracticeSetupPage.module.css';

export function PracticeSetupPage() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<PracticeConfig>(DEFAULT_PRACTICE_CONFIG);
  const hasOperation = config.operations.length > 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasOperation) return;
    navigate('/practice/session', { state: { config } });
  }

  return (
    <section aria-labelledby="setup-title">
      <h1 id="setup-title">Set Up Your Practice</h1>
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
