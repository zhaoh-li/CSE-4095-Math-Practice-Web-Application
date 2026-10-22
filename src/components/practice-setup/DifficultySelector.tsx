import { useId } from 'react';
import { DIFFICULTY_INFO } from '../../config/practiceOptions';
import { DIFFICULTY_LEVELS, type DifficultyLevel } from '../../types';
import { Button } from '../ui/Button';
import styles from './OptionCards.module.css';

interface DifficultySelectorProps {
  /** Heading for the group. */
  legend?: string;
  selected: DifficultyLevel[];
  onChange: (difficulties: DifficultyLevel[]) => void;
}

/** Checkbox cards for picking one or more difficulty levels. */
export function DifficultySelector({
  selected,
  onChange,
  legend = '2. Choose levels',
}: DifficultySelectorProps) {
  const groupId = useId();
  const allSelected = selected.length === DIFFICULTY_LEVELS.length;

  function toggle(level: DifficultyLevel) {
    const next = selected.includes(level)
      ? selected.filter((d) => d !== level)
      : [...selected, level];
    // Keep a stable order: Beginner → Advanced
    onChange(DIFFICULTY_LEVELS.filter((d) => next.includes(d)));
  }

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.legendRow}>
        <p className={styles.hint}>Pick one level, or mix a few together.</p>
        <Button
          variant="secondary"
          onClick={() => onChange(allSelected ? [] : [...DIFFICULTY_LEVELS])}
        >
          {allSelected ? 'Clear all levels' : 'Select all levels'}
        </Button>
      </div>
      <div className={`${styles.grid} ${styles.cols2}`}>
        {DIFFICULTY_LEVELS.map((difficulty) => {
          const info = DIFFICULTY_INFO[difficulty];
          const isSelected = selected.includes(difficulty);
          const titleId = `${groupId}-${difficulty}-title`;
          const descriptionId = `${groupId}-${difficulty}-description`;
          return (
            <label
              key={difficulty}
              className={`${styles.card} ${isSelected ? styles.selected : ''}`}
            >
              <input
                type="checkbox"
                className="visually-hidden"
                value={difficulty}
                checked={isSelected}
                onChange={() => toggle(difficulty)}
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
