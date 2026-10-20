import { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/Button';
import styles from './EndSessionControl.module.css';

interface EndSessionControlProps {
  /** Ask "are you sure?" first. Skipped when nothing has been answered yet. */
  needsConfirmation: boolean;
  onEnd: () => void;
}

/** An End Session button with a built-in confirmation step. */
export function EndSessionControl({ needsConfirmation, onEnd }: EndSessionControlProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const endRef = useRef<HTMLButtonElement>(null);
  const hasOpened = useRef(false);

  // Move focus into the question when it opens, and back to the button when it closes
  useEffect(() => {
    if (isConfirming) {
      hasOpened.current = true;
      confirmRef.current?.focus();
    } else if (hasOpened.current) {
      endRef.current?.focus();
    }
  }, [isConfirming]);

  function handleEndClick() {
    if (needsConfirmation) setIsConfirming(true);
    else onEnd();
  }

  if (!isConfirming) {
    return (
      <div className={styles.wrapper}>
        <Button ref={endRef} variant="secondary" onClick={handleEndClick}>
          End Session
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.confirm} role="group" aria-labelledby="end-session-question">
        <p id="end-session-question" className={styles.question}>
          End this session and see how you did?
        </p>
        <div className={styles.buttons}>
          <Button ref={confirmRef} onClick={onEnd}>
            Yes, end it
          </Button>
          <Button variant="secondary" onClick={() => setIsConfirming(false)}>
            Keep practicing
          </Button>
        </div>
      </div>
    </div>
  );
}
