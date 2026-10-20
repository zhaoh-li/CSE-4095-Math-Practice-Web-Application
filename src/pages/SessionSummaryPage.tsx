import { useLocation, useNavigate } from 'react-router';
import { Button, ButtonLink } from '../components/ui/Button';
import { DIFFICULTY_INFO, SESSION_LENGTH_OPTIONS } from '../config/practiceOptions';
import type { PracticeSession } from '../types';
import { describeOperations } from '../utils/practiceConfig';
import { configFromSession, isCompletedSession } from '../utils/session/practiceSession';
import { calculateAccuracy } from '../utils/statistics';
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
  const config = configFromSession(session);
  const accuracy = calculateAccuracy(session.correctCount, session.attemptedCount);
  const cheer = getCheer(accuracy);
  const difficulty = DIFFICULTY_INFO[session.difficulty];
  const lengthLabel = SESSION_LENGTH_OPTIONS.find((o) => o.value === session.sessionLength)?.label;
  const endedEarly =
    session.sessionLength !== 'continuous' && session.attemptedCount < session.sessionLength;

  return (
    <section aria-labelledby="summary-title">
      <header className={styles.header}>
        <h1 id="summary-title">{cheer.title}</h1>
        <p className={styles.message}>{cheer.message}</p>
      </header>

      <ul className={styles.stats} aria-label="Your results">
        <li className={styles.stat}>
          <span className={styles.statValue}>{session.attemptedCount}</span>
          <span className={styles.statLabel}>Questions</span>
        </li>
        <li className={`${styles.stat} ${styles.statCorrect}`}>
          <span className={styles.statValue}>
            <span aria-hidden="true">✓ </span>
            {session.correctCount}
          </span>
          <span className={styles.statLabel}>Correct</span>
        </li>
        <li className={`${styles.stat} ${styles.statIncorrect}`}>
          <span className={styles.statValue}>
            <span aria-hidden="true">✗ </span>
            {session.incorrectCount}
          </span>
          <span className={styles.statLabel}>Incorrect</span>
        </li>
        <li className={styles.stat}>
          <span className={styles.statValue}>{accuracy}%</span>
          <span className={styles.statLabel}>Accuracy</span>
        </li>
      </ul>

      <dl className={styles.details}>
        <div>
          <dt>Operations</dt>
          <dd>{describeOperations(config)}</dd>
        </div>
        <div>
          <dt>Level</dt>
          <dd>
            {difficulty.label} (Level {difficulty.level})
          </dd>
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
      </dl>

      <div className={styles.actions}>
        <Button onClick={() => navigate('/practice/session', { state: { config } })}>
          Practice Again
        </Button>
        <div className={styles.mistakes}>
          <Button variant="secondary" disabled aria-describedby="practice-mistakes-note" fullWidth>
            Practice Mistakes
          </Button>
          <p id="practice-mistakes-note" className={styles.note}>
            {session.incorrectCount === 0 ? 'No mistakes to practice!' : 'Coming soon!'}
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
