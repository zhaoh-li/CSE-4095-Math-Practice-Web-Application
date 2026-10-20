import type { PerformanceTotals } from '../../types';
import styles from './PerformanceCard.module.css';

interface PerformanceCardProps {
  title: string;
  /** Large symbol or short tag shown before the title, e.g. "+" or "Level 1". */
  badge: string;
  totals: PerformanceTotals;
}

/** Results for one operation or one level, with an accuracy bar. */
export function PerformanceCard({ title, badge, totals }: PerformanceCardProps) {
  const hasAttempts = totals.attempted > 0;
  return (
    <article className={styles.card} aria-label={title}>
      <header className={styles.header}>
        <span className={styles.badge} aria-hidden="true">
          {badge}
        </span>
        <h3 className={styles.title}>{title}</h3>
      </header>

      {hasAttempts ? (
        <>
          <div className={styles.accuracyRow}>
            <div
              className={styles.track}
              role="meter"
              aria-label={`${title} accuracy`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={totals.accuracy}
              aria-valuetext={`${totals.accuracy}%`}
            >
              <div className={styles.fill} style={{ width: `${totals.accuracy}%` }} />
            </div>
            <span className={styles.accuracy}>{totals.accuracy}%</span>
          </div>
          <dl className={styles.counts}>
            <div>
              <dt>Tried</dt>
              <dd>{totals.attempted}</dd>
            </div>
            <div>
              <dt>
                <span aria-hidden="true">✓ </span>Correct
              </dt>
              <dd>{totals.correct}</dd>
            </div>
            <div>
              <dt>
                <span aria-hidden="true">✗ </span>Incorrect
              </dt>
              <dd>{totals.incorrect}</dd>
            </div>
          </dl>
        </>
      ) : (
        <p className={styles.empty}>Not practiced yet</p>
      )}
    </article>
  );
}
