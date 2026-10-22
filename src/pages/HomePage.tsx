import { useState } from 'react';
import { Button, ButtonLink } from '../components/ui/Button';
import { KeyHint } from '../components/ui/KeyHint';
import { useSettings } from '../context/SettingsContext';
import { useOneTimeNotice } from '../hooks/useOneTimeNotice';
import { appData } from '../services/appData';
import { archiveCounts } from '../utils/attemptArchive';
import { activePatterns, createReviewConfig } from '../utils/mistakes/mistakePatterns';
import { calculateTotals } from '../utils/statistics';
import styles from './HomePage.module.css';

export function HomePage() {
  const { settings } = useSettings();
  const notice = useOneTimeNotice();
  // Read once when the page opens
  const [progress] = useState(() => {
    const patterns = appData.loadMistakePatterns();
    return {
      totals: calculateTotals(appData.loadAttempts(), archiveCounts(appData.loadAttemptArchive())),
      patterns,
      mistakeCount: activePatterns(patterns).length,
    };
  });
  const { totals, mistakeCount } = progress;

  return (
    <section className={styles.hero} aria-labelledby="home-title">
      {notice && (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      )}
      <h1 id="home-title">Welcome to Math Practice!</h1>
      <p className={styles.intro}>
        Practice addition, subtraction, multiplication, and division with flash cards. Pick an
        answer, flip the card, and see how you did!
      </p>
      <div className={styles.progress} role="region" aria-labelledby="progress-title">
        <h2 id="progress-title" className={styles.progressTitle}>
          Your progress
        </h2>
        {totals.attempted === 0 ? (
          <p>No practice yet. Start your first session!</p>
        ) : (
          <p>
            You've answered <strong>{totals.attempted}</strong>{' '}
            {totals.attempted === 1 ? 'question' : 'questions'} and said you got{' '}
            <strong>{totals.correct}</strong> right.
            {mistakeCount > 0 && (
              <>
                {' '}
                <strong>{mistakeCount}</strong> {mistakeCount === 1 ? 'mistake is' : 'mistakes are'}{' '}
                ready to review.
              </>
            )}
          </p>
        )}
      </div>
      <div className={styles.actions}>
        <ButtonLink to="/practice/setup">Start Practice</ButtonLink>
        {mistakeCount > 0 ? (
          <ButtonLink
            to="/practice/setup"
            variant="secondary"
            state={{
              config: createReviewConfig(progress.patterns, {
                difficulties: settings.defaultDifficulties,
                sessionLength: settings.defaultSessionLength,
              }),
            }}
          >
            Review Mistakes
          </ButtonLink>
        ) : (
          <div className={styles.reviewEmpty}>
            <Button variant="secondary" disabled aria-describedby="review-empty-note" fullWidth>
              Review Mistakes
            </Button>
            <p id="review-empty-note" className={styles.note}>
              Answer some practice questions first. Any you miss will show up here.
            </p>
          </div>
        )}
        <ButtonLink to="/statistics" variant="secondary">
          View Statistics
        </ButtonLink>
        <ButtonLink to="/settings" variant="secondary">
          Settings
        </ButtonLink>
      </div>
      {settings.keyboardShortcutsEnabled && (
        <p className={styles.tip}>
          <span aria-hidden="true">⌨️ </span>
          Tip: you can practice with your keyboard! Press <KeyHint decorative={false}>?</KeyHint> on
          a flash card to see the shortcuts.
        </p>
      )}
    </section>
  );
}
