import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { StatTiles } from '../components/stats/StatTiles';
import { Button, ButtonLink } from '../components/ui/Button';
import { SESSION_LENGTH_OPTIONS } from '../config/practiceOptions';
import { appData } from '../services/appData';
import type { PracticeSession } from '../types';
import { activePatterns, createReviewConfig } from '../utils/mistakes/mistakePatterns';
import { describeDifficulties, describeOperations } from '../utils/practiceConfig';
import { configFromSession, isCompletedSession } from '../utils/session/practiceSession';
import { calculateAccuracy, totalsFromCounts } from '../utils/statistics';
import styles from './SessionSummaryPage.module.css';

/** Encouraging, never shaming. */
function getCheer(accuracy: number): { title: string; message: string } {
  if (accuracy >= 90) return { title: 'Amazing work!', message: 'You are a math star!' };
  if (accuracy >= 70)
    return { title: 'Great job!', message: 'You are getting really good at this.' };
  if (accuracy >= 50)
    return { title: 'Nice effort!', message: 'Keep practicing and you will keep improving.' };
  return {
    title: 'Way to keep trying!',
    message: 'Every question you practice helps your brain grow.',
  };
}

export function SessionSummaryPage() {
  const location = useLocation();
  const session = (location.state as { session?: unknown } | null)?.session;

  if (!isCompletedSession(session)) {
    return (
      <section className={styles.empty}>
        <h1>No Results Yet</h1>
        <p>Finish a practice session to see how you did.</p>
        <ButtonLink to="/practice/setup">Start Practice</ButtonLink>
      </section>
    );
  }

  return <SessionSummary session={session} />;
}

function SessionSummary({ session }: { session: PracticeSession }) {
  const navigate = useNavigate();
  const [patterns] = useState(() => appData.loadMistakePatterns());
  const config = configFromSession(session);
  const isReview = session.mode === 'mistake-review';
  const activeCount = activePatterns(patterns).length;
  const masteredThisSession = patterns.filter(
    (p) =>
      p.masteredAt !== undefined &&
      p.masteredAt >= session.startedAt &&
      p.masteredAt <= (session.completedAt ?? p.masteredAt),
  ).length;
  const accuracy = calculateAccuracy(session.correctCount, session.attemptedCount);
  const cheer =
    isReview && activeCount === 0
      ? {
          title: 'You mastered all your mistakes!',
          message: 'There is nothing left to review. Amazing!',
        }
      : getCheer(accuracy);
  const lengthLabel = SESSION_LENGTH_OPTIONS.find((o) => o.value === session.sessionLength)?.label;
  const endedEarly =
    session.sessionLength !== 'continuous' && session.attemptedCount < session.sessionLength;

  return (
    <section aria-labelledby="summary-title">
      <header className={styles.header}>
        <h1 id="summary-title">{cheer.title}</h1>
        <p className={styles.message}>{cheer.message}</p>
      </header>

      <StatTiles
        label="Your results"
        totals={totalsFromCounts(session.correctCount, session.incorrectCount)}
      />

      <dl className={styles.details}>
        <div>
          <dt>Operations</dt>
          <dd>{describeOperations(config)}</dd>
        </div>
        <div>
          <dt>
            {isReview ? 'Practice type' : config.difficulties.length > 1 ? 'Levels' : 'Level'}
          </dt>
          <dd>{isReview ? 'Mistake review' : describeDifficulties(config)}</dd>
        </div>
        <div>
          <dt>Session length</dt>
          <dd>
            {lengthLabel}
            {endedEarly && ' (ended early)'}
          </dd>
        </div>
        <div>
          <dt>Mistake review questions</dt>
          <dd>{session.mistakeReviewCount}</dd>
        </div>
        {isReview && (
          <div>
            <dt>Mistakes mastered</dt>
            <dd>
              {masteredThisSession > 0 && <span aria-hidden="true">🏆 </span>}
              {masteredThisSession}
            </dd>
          </div>
        )}
      </dl>

      <div className={styles.actions}>
        <Button onClick={() => navigate('/practice/session', { state: { config } })}>
          Practice Again
        </Button>
        <div className={styles.mistakes}>
          <Button
            variant="secondary"
            disabled={activeCount === 0}
            aria-describedby="practice-mistakes-note"
            fullWidth
            onClick={() =>
              navigate('/practice/session', {
                state: { config: createReviewConfig(patterns, config) },
              })
            }
          >
            Practice Mistakes
          </Button>
          <p id="practice-mistakes-note" className={styles.note}>
            {activeCount === 0
              ? 'No mistakes to practice!'
              : `${activeCount} ${activeCount === 1 ? 'mistake' : 'mistakes'} to review`}
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => navigate('/practice/setup', { state: { config } })}
        >
          Change Settings
        </Button>
        <ButtonLink to="/statistics" variant="secondary">
          View Statistics
        </ButtonLink>
        <ButtonLink to="/" variant="secondary">
          Return Home
        </ButtonLink>
      </div>
    </section>
  );
}
