import { useEffect, useRef, useState } from 'react';
import type { Question, SelfReportedResult } from '../../types';
import {
  formatNumber,
  formatQuestionText,
  formatSpokenQuestion,
} from '../../utils/questions/buildQuestion';
import { Button } from '../ui/Button';
import { AnswerChoice } from './AnswerChoice';
import styles from './QuestionCard.module.css';

export interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  /** Total questions in the session, or null for continuous practice. */
  totalQuestions: number | null;
  onResult: (result: SelfReportedResult, selectedAnswer: number) => void;
  /** Turns the 3D flip on or off. Reduced-motion users never see it either way. */
  animationsEnabled?: boolean;
  /** Move keyboard focus to the question when the card appears. */
  autoFocus?: boolean;
}

/**
 * A two-sided flash card. Front: the question and four choices.
 * Back: the correct answer and buttons for the student to say how they did.
 *
 * Give it a `key` of the question ID so a new question starts fresh.
 */
export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  onResult,
  animationsEnabled = true,
  autoFocus = false,
}: QuestionCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [reportedResult, setReportedResult] = useState<SelfReportedResult | null>(null);

  const frontHeadingRef = useRef<HTMLHeadingElement>(null);
  const backHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (autoFocus) frontHeadingRef.current?.focus({ preventScroll: true });
  }, [autoFocus]);

  // The Flip button disappears with the front, so move focus to the back
  useEffect(() => {
    if (isCardFlipped) backHeadingRef.current?.focus({ preventScroll: true });
  }, [isCardFlipped]);

  const questionText = formatQuestionText(question);
  const spokenQuestion = formatSpokenQuestion(question);
  const progressText =
    totalQuestions === null
      ? `Question ${questionNumber}`
      : `Question ${questionNumber} of ${totalQuestions}`;

  function handleFlip() {
    if (selectedAnswer === null) return;
    setIsCardFlipped(true);
  }

  function handleResult(result: SelfReportedResult) {
    if (reportedResult !== null || selectedAnswer === null) return;
    setReportedResult(result);
    onResult(result, selectedAnswer);
  }

  const cardClassName = [
    styles.card,
    animationsEnabled ? styles.animated : styles.static,
    isCardFlipped ? styles.flipped : '',
  ].join(' ');

  return (
    <div className={styles.scene}>
      <p className={styles.progress}>{progressText}</p>
      <div className={cardClassName} data-flipped={isCardFlipped}>
        {/* Front */}
        <section
          className={`${styles.face} ${styles.front}`}
          data-face="front"
          aria-label="Question"
          aria-hidden={isCardFlipped}
          inert={isCardFlipped}
        >
          <h2
            ref={frontHeadingRef}
            className={styles.problem}
            tabIndex={-1}
            aria-label={`What is ${spokenQuestion}?`}
          >
            {questionText} = ?
          </h2>
          <div className={styles.choices} role="group" aria-label="Answer choices">
            {question.choices.map((choice, index) => (
              <AnswerChoice
                key={choice}
                value={choice}
                index={index}
                isSelected={selectedAnswer === choice}
                disabled={isCardFlipped}
                onSelect={setSelectedAnswer}
              />
            ))}
          </div>
          <Button onClick={handleFlip} disabled={selectedAnswer === null}>
            Flip Card
          </Button>
          {selectedAnswer === null && <p className={styles.hint}>Pick an answer, then flip!</p>}
        </section>

        {/* Back */}
        <section
          className={`${styles.face} ${styles.back}`}
          data-face="back"
          aria-label="Answer"
          aria-hidden={!isCardFlipped}
          inert={!isCardFlipped}
        >
          <h2
            ref={backHeadingRef}
            className={styles.backTitle}
            tabIndex={-1}
            aria-label={`${spokenQuestion} equals ${formatNumber(question.correctAnswer)}`}
          >
            {questionText} ={' '}
            <span className={styles.answer}>{formatNumber(question.correctAnswer)}</span>
          </h2>
          <p className={styles.yourAnswer}>
            You picked:{' '}
            <strong>{selectedAnswer === null ? '—' : formatNumber(selectedAnswer)}</strong>
          </p>
          <p className={styles.ask}>Did you get it right?</p>
          <div className={styles.resultButtons}>
            <Button
              variant="positive"
              onClick={() => handleResult('correct')}
              disabled={reportedResult !== null}
            >
              <span aria-hidden="true">✓</span> I Got It Right
            </Button>
            <Button
              variant="negative"
              onClick={() => handleResult('incorrect')}
              disabled={reportedResult !== null}
            >
              <span aria-hidden="true">✗</span> I Got It Wrong
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
