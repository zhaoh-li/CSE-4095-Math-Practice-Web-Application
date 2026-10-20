import styles from './SessionProgress.module.css';

interface SessionProgressProps {
  /** The number of the question being shown, starting at 1. */
  questionNumber: number;
  /** How many questions have been answered so far. */
  answeredCount: number;
  /** Total questions, or null for continuous practice (no bar is shown). */
  totalQuestions: number | null;
}

export function SessionProgress({
  questionNumber,
  answeredCount,
  totalQuestions,
}: SessionProgressProps) {
  if (totalQuestions === null) {
    return (
      <div className={styles.progress}>
        <p className={styles.label}>Question {questionNumber}</p>
      </div>
    );
  }

  const percent = Math.min(100, Math.round((answeredCount / totalQuestions) * 100));

  return (
    <div className={styles.progress}>
      <p className={styles.label} aria-hidden="true">
        Question {questionNumber} of {totalQuestions}
      </p>
      <div
        className={styles.track}
        role="progressbar"
        aria-label="Session progress"
        aria-valuemin={0}
        aria-valuemax={totalQuestions}
        aria-valuenow={answeredCount}
        aria-valuetext={`Question ${questionNumber} of ${totalQuestions}. ${answeredCount} answered.`}
      >
        <div className={styles.fill} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
