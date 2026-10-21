import { useId, useRef } from 'react';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { KeyHint } from '../ui/KeyHint';
import styles from './ShortcutHelp.module.css';

const SHORTCUTS: { keys: string[]; action: string }[] = [
  { keys: ['1', '2', '3', '4'], action: 'Pick an answer' },
  { keys: ['F', 'Enter'], action: 'Flip the card' },
  { keys: ['R'], action: 'I got it right' },
  { keys: ['W'], action: 'I got it wrong' },
  { keys: ['?'], action: 'Show or hide this list' },
  { keys: ['Esc'], action: 'Close this list' },
];

interface ShortcutHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * A "Keyboard shortcuts" button that shows the list of shortcuts.
 * The ? key toggles it, and Esc closes it.
 */
export function ShortcutHelp({ open, onOpenChange }: ShortcutHelpProps) {
  const panelId = useId();
  const titleId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);

  useKeyboardShortcuts((event) => {
    if (event.key === '?') {
      onOpenChange(!open);
      return true;
    }
    if (event.key === 'Escape' && open) {
      onOpenChange(false);
      toggleRef.current?.focus();
      return true;
    }
    return false;
  }, true);

  return (
    <div className={styles.wrapper}>
      <button
        ref={toggleRef}
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls={panelId}
        aria-keyshortcuts="?"
        onClick={() => onOpenChange(!open)}
      >
        <span aria-hidden="true">⌨️ </span>
        Keyboard shortcuts
        <KeyHint>?</KeyHint>
      </button>

      <section id={panelId} className={styles.panel} aria-labelledby={titleId} hidden={!open}>
        <h2 id={titleId} className={styles.title}>
          Keyboard shortcuts
        </h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Press</th>
              <th scope="col">To</th>
            </tr>
          </thead>
          <tbody>
            {SHORTCUTS.map(({ keys, action }) => (
              <tr key={action}>
                <td>
                  {keys.map((key, i) => (
                    <span key={key}>
                      {i > 0 && <span className={styles.or}> or </span>}
                      <KeyHint decorative={false}>{key}</KeyHint>
                    </span>
                  ))}
                </td>
                <td>{action}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className={styles.note}>
          You can turn shortcuts off in Settings if keys get pressed by accident.
        </p>
      </section>
    </div>
  );
}
