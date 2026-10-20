import { formatNumber } from '../../utils/questions/buildQuestion';
import styles from './QuestionCard.module.css';

interface AnswerChoiceProps {
  value: number;
  /** Position in the list, starting at 0. Shown to the student as 1–4. */
  index: number;
  isSelected: boolean;
  disabled: boolean;
  onSelect: (value: number) => void;
}

/** One multiple-choice answer, shown as a large button. */
export function AnswerChoice({ value, index, isSelected, disabled, onSelect }: AnswerChoiceProps) {
  const formatted = formatNumber(value);
  return (
    <button
      type="button"
      className={`${styles.choice} ${isSelected ? styles.choiceSelected : ''}`}
      aria-pressed={isSelected}
      aria-label={`Choice ${index + 1}: ${formatted}`}
      disabled={disabled}
      onClick={() => onSelect(value)}
    >
      <span className={styles.choiceNumber} aria-hidden="true">
        {index + 1}
      </span>
      <span className={styles.choiceValue}>{formatted}</span>
      <span className={styles.choiceCheck} aria-hidden="true">
        ✓
      </span>
    </button>
  );
}
