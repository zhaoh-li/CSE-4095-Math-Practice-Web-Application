import { useMemo, useState } from 'react';
import { PerformanceCard } from '../components/stats/PerformanceCard';
import { RecentSessionsTable } from '../components/stats/RecentSessionsTable';
import { StatTiles } from '../components/stats/StatTiles';
import { Button, ButtonLink } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { DIFFICULTY_INFO, OPERATION_INFO } from '../config/practiceOptions';
import { appData } from '../services/appData';
import { DIFFICULTY_LEVELS, MATH_OPERATIONS } from '../types';
import { calculateAppStatistics } from '../utils/statistics';
import styles from './StatisticsPage.module.css';

function loadHistory() {
  return { attempts: appData.loadAttempts(), sessions: appData.loadSessions() };
}

export function StatisticsPage() {
  const [history, setHistory] = useState(loadHistory);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  const stats = useMemo(
    () => calculateAppStatistics(history.attempts, history.sessions),
    [history],
  );

  function handleReset() {
    appData.resetStatistics();
    setHistory(loadHistory());
    setIsConfirmingReset(false);
    setResetMessage('Your statistics have been reset.');
  }

  const hasHistory = stats.overall.attempted > 0;

  return (
    <section aria-labelledby="stats-title">
      <h1 id="stats-title">Your Statistics</h1>

      <p className={styles.status} role="status">
        {resetMessage}
      </p>

      {!appData.isPersistent && (
        <p className={styles.warning}>
          This browser isn't letting the app save data, so your progress will be lost when you close
          the page.
        </p>
      )}

      {!hasHistory ? (
        <div className={styles.empty}>
          <p className={styles.emptyIcon} aria-hidden="true">
            📊
          </p>
          <h2>No practice yet!</h2>
          <p>Finish some questions and your progress will show up here.</p>
          <ButtonLink to="/practice/setup">Start Practice</ButtonLink>
        </div>
      ) : (
        <>
          <section className={styles.section} aria-labelledby="overview-title">
            <h2 id="overview-title">Overview</h2>
            <StatTiles label="Overall results" totals={stats.overall} attemptedLabel="Questions" />
          </section>

          <section className={styles.section} aria-labelledby="by-operation-title">
            <h2 id="by-operation-title">By Operation</h2>
            <div className={styles.grid}>
              {MATH_OPERATIONS.map((op) => (
                <PerformanceCard
                  key={op}
                  title={OPERATION_INFO[op].label}
                  badge={OPERATION_INFO[op].symbol}
                  totals={stats.byOperation[op]}
                />
              ))}
            </div>
          </section>

          <section className={styles.section} aria-labelledby="by-level-title">
            <h2 id="by-level-title">By Level</h2>
            <div className={styles.grid}>
              {DIFFICULTY_LEVELS.map((level) => (
                <PerformanceCard
                  key={level}
                  title={DIFFICULTY_INFO[level].label}
                  badge={`Level ${DIFFICULTY_INFO[level].level}`}
                  totals={stats.byDifficulty[level]}
                />
              ))}
            </div>
          </section>

          <section className={styles.section} aria-labelledby="recent-title">
            <h2 id="recent-title">Recent Sessions</h2>
            {stats.recentSessions.length > 0 ? (
              <RecentSessionsTable sessions={stats.recentSessions} />
            ) : (
              <p className={styles.muted}>No sessions yet.</p>
            )}
          </section>

          <section className={`${styles.section} ${styles.reset}`} aria-labelledby="reset-title">
            <h2 id="reset-title">Start Over</h2>
            <p className={styles.muted}>
              Reset clears your answers and sessions. Your settings stay the same.
            </p>
            <Button variant="danger" onClick={() => setIsConfirmingReset(true)}>
              Reset Statistics
            </Button>
          </section>
        </>
      )}

      <ConfirmDialog
        open={isConfirmingReset}
        title="Reset your statistics?"
        confirmLabel="Yes, reset everything"
        cancelLabel="No, keep them"
        onConfirm={handleReset}
        onCancel={() => setIsConfirmingReset(false)}
      >
        <p>
          This deletes all {stats.overall.attempted} answers and {history.sessions.length} sessions.
          It cannot be undone.
        </p>
      </ConfirmDialog>
    </section>
  );
}
