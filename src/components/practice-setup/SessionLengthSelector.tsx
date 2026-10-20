import { useId } from 'react';
import { SESSION_LENGTH_OPTIONS } from '../../config/practiceOptions';
import type { SessionLength } from '../../types';
import styles from './OptionCards.module.css';

interface SessionLengthSelectorProps {
  /** Heading for the group. */
  legend?: string;
  selected: SessionLength;
  onChange: (length: SessionLength) => void;
}

/** Radio cards for picking how many questions to practice. */
export function SessionLengthSelector({
  selected,
  onChange,
  legend = '3. How many questions?',
}: SessionLengthSelectorProps) {
  const groupId = useId();

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={`${styles.grid} ${styles.cols4}`}>
        {SESSION_LENGTH_OPTIONS.map((option) => {
          const isSelected = selected === option.value;
          const titleId = `${groupId}-${option.value}-title`;
          const descriptionId = `${groupId}-${option.value}-description`;
          return (
            <label
              key={option.value}
              className={`${styles.card} ${isSelected ? styles.selected : ''}`}
            >
              <input
                type="radio"
                className="visually-hidden"
                name={`${groupId}-length`}
                value={String(option.value)}
                checked={isSelected}
                onChange={() => onChange(option.value)}
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
              />
              <span id={titleId} className={styles.title}>
                {option.label}
              </span>
              <span id={descriptionId} className={styles.description}>
                {option.description}
              </span>
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
