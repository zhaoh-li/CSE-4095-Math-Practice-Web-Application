import { useId } from 'react';
import { DIFFICULTY_INFO } from '../../config/practiceOptions';
import { DIFFICULTY_LEVELS, type DifficultyLevel } from '../../types';
import styles from './OptionCards.module.css';

interface DifficultySelectorProps {
  selected: DifficultyLevel;
  onChange: (difficulty: DifficultyLevel) => void;
}

/** Radio cards for picking exactly one difficulty level. */
export function DifficultySelector({ selected, onChange }: DifficultySelectorProps) {
  const groupId = useId();

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>2. Choose a level</legend>
      <div className={`${styles.grid} ${styles.cols2}`}>
        {DIFFICULTY_LEVELS.map((difficulty) => {
          const info = DIFFICULTY_INFO[difficulty];
          const isSelected = selected === difficulty;
          const titleId = `${groupId}-${difficulty}-title`;
          const descriptionId = `${groupId}-${difficulty}-description`;
          return (
            <label
              key={difficulty}
              className={`${styles.card} ${isSelected ? styles.selected : ''}`}
            >
              <input
                type="radio"
                className="visually-hidden"
                name={`${groupId}-difficulty`}
                value={difficulty}
                checked={isSelected}
                onChange={() => onChange(difficulty)}
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
              />
              <span className={styles.badge} aria-hidden="true">
                Level {info.level}
              </span>
              <span id={titleId} className={styles.title}>
                {info.label}
              </span>
              <span id={descriptionId} className={styles.description}>
                {info.description}
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
