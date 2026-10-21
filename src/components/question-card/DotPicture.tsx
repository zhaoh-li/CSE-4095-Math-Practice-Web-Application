import type { ExplanationPicture } from '../../utils/explanations/explainQuestion';
import styles from './Explanation.module.css';

const dots = (count: number, className = styles.dot) =>
  Array.from({ length: count }, (_, i) => <span key={i} className={className} />);

/**
 * Dots that show a small problem: two groups to add, dots crossed out to
 * subtract, rows to multiply, or equal groups to divide.
 */
export function DotPicture({ picture, label }: { picture: ExplanationPicture; label: string }) {
  return (
    <div className={styles.picture} role="img" aria-label={label}>
      {picture.type === 'add' && (
        <div className={styles.addRow}>
          <span className={styles.dotGroup}>{dots(picture.first)}</span>
          <span className={styles.operator}>+</span>
          <span className={styles.dotGroup}>{dots(picture.second)}</span>
        </div>
      )}

      {picture.type === 'subtract' && (
        <span className={styles.dotGroup}>
          {dots(picture.total - picture.takeAway)}
          {/* Taken-away dots are hollow and crossed out, not just a different color */}
          {dots(picture.takeAway, `${styles.dot} ${styles.removed}`)}
        </span>
      )}

      {picture.type === 'groups' && picture.mode === 'rows' && (
        <div className={styles.rows}>
          {Array.from({ length: picture.groups }, (_, row) => (
            <span key={row} className={styles.dotGroup}>
              {dots(picture.perGroup)}
            </span>
          ))}
        </div>
      )}

      {picture.type === 'groups' && picture.mode === 'share' && (
        <div className={styles.shareGroups}>
          {Array.from({ length: picture.groups }, (_, g) => (
            <span key={g} className={`${styles.dotGroup} ${styles.shareBox}`}>
              {dots(picture.perGroup)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
