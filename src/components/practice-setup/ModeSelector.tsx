import { useId } from 'react';
import type { PracticeMode } from '../../types';
import styles from './OptionCards.module.css';

interface ModeSelectorProps {
  selected: PracticeMode;
  onChange: (mode: PracticeMode) => void;
  /** Mistakes that still need practice. Mistake review is disabled at 0. */
  activeMistakeCount: number;
}

/** Choose between regular practice and reviewing past mistakes. */
export function ModeSelector({ selected, onChange, activeMistakeCount }: ModeSelectorProps) {
  const groupId = useId();
  const reviewDisabled = activeMistakeCount === 0;
  const mistakeWord = activeMistakeCount === 1 ? 'mistake' : 'mistakes';

  const options: {
    mode: PracticeMode;
    icon: string;
    title: string;
    description: string;
    disabled: boolean;
  }[] = [
    {
      mode: 'regular',
      icon: '✏️',
      title: 'Regular practice',
      description: 'New questions from the operations and level you choose.',
      disabled: false,
    },
    {
      mode: 'mistake-review',
      icon: '🔁',
      title: 'Practice my mistakes',
      description: reviewDisabled
        ? 'No mistakes to review yet. Questions you get wrong will show up here.'
        : `${activeMistakeCount} ${mistakeWord} to review with similar questions.`,
      disabled: reviewDisabled,
    },
  ];

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>What do you want to practice?</legend>
      <div className={`${styles.grid} ${styles.cols2}`}>
        {options.map((option) => {
          const isSelected = selected === option.mode;
          const titleId = `${groupId}-${option.mode}-title`;
          const descriptionId = `${groupId}-${option.mode}-description`;
          return (
            <label
              key={option.mode}
              className={[
                styles.card,
                isSelected ? styles.selected : '',
                option.disabled ? styles.disabled : '',
              ].join(' ')}
            >
              <input
                type="radio"
                className="visually-hidden"
                name={`${groupId}-mode`}
                value={option.mode}
                checked={isSelected}
                disabled={option.disabled}
                onChange={() => onChange(option.mode)}
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
              />
              <span className={styles.title} id={titleId}>
                <span aria-hidden="true">{option.icon} </span>
                {option.title}
              </span>
              <span className={styles.description} id={descriptionId}>
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
