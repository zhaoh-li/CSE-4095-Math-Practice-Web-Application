import type { PerformanceTotals } from '../../types';
import styles from './StatTiles.module.css';

interface StatTilesProps {
  totals: PerformanceTotals;
  /** Accessible name for the list, e.g. "Your results". */
  label: string;
  /** Text for the first tile. */
  attemptedLabel?: string;
}

/** Four tiles: questions, ✓ correct, ✗ incorrect, and accuracy. */
export function StatTiles({ totals, label, attemptedLabel = 'Questions' }: StatTilesProps) {
  return (
    <ul className={styles.stats} aria-label={label}>
      <li className={styles.stat}>
        <span className={styles.value}>{totals.attempted}</span>
        <span className={styles.label}>{attemptedLabel}</span>
      </li>
      <li className={`${styles.stat} ${styles.correct}`}>
        <span className={styles.value}>
          <span aria-hidden="true">✓ </span>
          {totals.correct}
        </span>
        <span className={styles.label}>Correct</span>
      </li>
      <li className={`${styles.stat} ${styles.incorrect}`}>
        <span className={styles.value}>
          <span aria-hidden="true">✗ </span>
          {totals.incorrect}
        </span>
        <span className={styles.label}>Incorrect</span>
      </li>
      <li className={styles.stat}>
        <span className={styles.value}>{totals.accuracy}%</span>
        <span className={styles.label}>Accuracy</span>
      </li>
    </ul>
  );
}
