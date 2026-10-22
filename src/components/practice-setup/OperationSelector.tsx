import { OPERATION_INFO } from '../../config/practiceOptions';
import { MATH_OPERATIONS, type MathOperation } from '../../types';
import { Button } from '../ui/Button';
import styles from './OptionCards.module.css';

interface OperationSelectorProps {
  /** Heading for the group. */
  legend?: string;
  selected: MathOperation[];
  onChange: (operations: MathOperation[]) => void;
}

/** Checkbox cards for picking one or more operations. */
export function OperationSelector({
  selected,
  onChange,
  legend = '1. Choose operations',
}: OperationSelectorProps) {
  const allSelected = selected.length === MATH_OPERATIONS.length;

  function toggle(operation: MathOperation) {
    const next = selected.includes(operation)
      ? selected.filter((op) => op !== operation)
      : [...selected, operation];
    // Keep a stable order: + − × ÷
    onChange(MATH_OPERATIONS.filter((op) => next.includes(op)));
  }

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.legendRow}>
        <p className={styles.hint}>Pick as many as you like.</p>
        <Button
          variant="secondary"
          onClick={() => onChange(allSelected ? [] : [...MATH_OPERATIONS])}
        >
          {allSelected ? 'Clear all operations' : 'Select all operations'}
        </Button>
      </div>
      <div className={`${styles.grid} ${styles.cols4}`}>
        {MATH_OPERATIONS.map((operation) => {
          const info = OPERATION_INFO[operation];
          const isSelected = selected.includes(operation);
          return (
            <label
              key={operation}
              className={`${styles.card} ${styles.centered} ${isSelected ? styles.selected : ''}`}
            >
              <input
                type="checkbox"
                className="visually-hidden"
                checked={isSelected}
                onChange={() => toggle(operation)}
              />
              <span className={styles.symbol} aria-hidden="true">
                {info.symbol}
              </span>
              <span className={styles.title}>{info.label}</span>
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
