import { useId } from 'react';
import styles from '../practice-setup/OptionCards.module.css';

const MASTERY_THRESHOLD_OPTIONS = [2, 3, 4, 5] as const;

interface MasteryThresholdSelectorProps {
  selected: number;
  onChange: (threshold: number) => void;
}

/** How many correct similar answers it takes to master a mistake. */
export function MasteryThresholdSelector({ selected, onChange }: MasteryThresholdSelectorProps) {
  const groupId = useId();
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>Correct answers to master a mistake</legend>
      <p className={styles.hint}>
        A mistake counts as mastered after this many correct answers to similar questions. Each
        wrong answer takes one step back.
      </p>
      <div className={`${styles.grid} ${styles.cols4}`}>
        {MASTERY_THRESHOLD_OPTIONS.map((value) => {
          const isSelected = selected === value;
          return (
            <label
              key={value}
              className={`${styles.card} ${styles.centered} ${isSelected ? styles.selected : ''}`}
            >
              <input
                type="radio"
                className="visually-hidden"
                name={`${groupId}-mastery`}
                checked={isSelected}
                onChange={() => onChange(value)}
                aria-label={`${value} correct answers${value === 3 ? ' (default)' : ''}`}
              />
              <span className={styles.symbol}>{value}</span>
              <span className={styles.description}>{value === 3 ? 'Default' : '\u00a0'}</span>
              <span className={styles.check} aria-hidden="true">
                ✓
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
