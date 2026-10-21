import { useEffect, useState } from 'react';
import { FEEDBACK_ICONS } from '../../config/feedbackMessages';
import type { SelfReportedResult } from '../../types';
import styles from './FeedbackBanner.module.css';

export interface Feedback {
  /** Changes for every new message, so the same text can show again later. */
  id: number;
  message: string;
  result: SelfReportedResult;
}

/** How long a message stays on screen. Short, so it doesn't distract. */
export const FEEDBACK_DURATION_MS = 2200;

/**
 * A short encouraging message above the card after each answer. It's hidden
 * from screen readers here; the session page reads it out with the progress.
 */
export function FeedbackBanner({ feedback }: { feedback: Feedback | null }) {
  const [hiddenId, setHiddenId] = useState<number | null>(null);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setHiddenId(feedback.id), FEEDBACK_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const visible = feedback !== null && hiddenId !== feedback.id;

  return (
    // Always rendered so the card below doesn't jump when a message appears
    <div className={styles.slot} aria-hidden="true">
      {visible && (
        <p
          key={feedback.id}
          className={`${styles.banner} ${feedback.result === 'correct' ? styles.correct : styles.incorrect}`}
        >
          <span>{FEEDBACK_ICONS[feedback.result]}</span> {feedback.message}
        </p>
      )}
    </div>
  );
}
