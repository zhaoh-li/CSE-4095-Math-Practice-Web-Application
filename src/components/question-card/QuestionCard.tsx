import { useEffect, useRef, useState } from 'react';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import type { Question, SelfReportedResult } from '../../types';
import { isInteractiveTarget } from '../../utils/keyboard';
import {
  formatNumber,
  formatQuestionText,
  formatSpokenQuestion,
} from '../../utils/questions/buildQuestion';
import { Button } from '../ui/Button';
import { KeyHint } from '../ui/KeyHint';
import { AnswerChoice } from './AnswerChoice';
import { ExplanationPanel } from './ExplanationPanel';
import styles from './QuestionCard.module.css';

export interface QuestionCardProps {
  question: Question;
  /** selectedAnswer is null when the card was flipped without picking an answer. */
  onResult: (result: SelfReportedResult, selectedAnswer: number | null) => void;
  /** Turns the flip and slide-in animations on or off. Reduced-motion users never see them. */
  animationsEnabled?: boolean;
  /** Move keyboard focus to the question when the card appears. */
  autoFocus?: boolean;
  /**
   * Keyboard shortcuts: 1–4 pick an answer, F or Enter flips,
   * R / W report right or wrong. Also shows the key hints.
   */
  shortcutsEnabled?: boolean;
  /** Restores a card that was in progress (e.g. after a page refresh). */
  initialSelectedAnswer?: number | null;
  initialFlipped?: boolean;
  /** Adds a "How to solve it" button to the back of the card. */
  showExplanation?: boolean;
  /** Told whenever the picked answer or flipped side changes, so it can be saved. */
  onStateChange?: (state: CardState) => void;
}

export interface CardState {
  selectedAnswer: number | null;
  isCardFlipped: boolean;
}

/**
 * A two-sided flash card. Front: the question and four choices.
 * Back: the correct answer and buttons for the student to say how they did.
 *
 * Give it a `key` of the question ID so a new question starts fresh.
 */
export function QuestionCard({
  question,
  onResult,
  animationsEnabled = true,
  autoFocus = false,
  shortcutsEnabled = true,
  initialSelectedAnswer = null,
  initialFlipped = false,
  showExplanation = true,
  onStateChange,
}: QuestionCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(() =>
    initialSelectedAnswer !== null && question.choices.includes(initialSelectedAnswer)
      ? initialSelectedAnswer
      : null,
  );
  const [isCardFlipped, setIsCardFlipped] = useState(initialFlipped);
  const [reportedResult, setReportedResult] = useState<SelfReportedResult | null>(null);
  // Read aloud by screen readers when it changes
  const [announcement, setAnnouncement] = useState('');

  const frontHeadingRef = useRef<HTMLHeadingElement>(null);
  const backHeadingRef = useRef<HTMLHeadingElement>(null);

  // Report changes using the latest callback, without re-running for new callbacks
  const onStateChangeRef = useRef(onStateChange);
  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  });
  useEffect(() => {
    onStateChangeRef.current?.({ selectedAnswer, isCardFlipped });
  }, [selectedAnswer, isCardFlipped]);

  useEffect(() => {
    if (autoFocus) frontHeadingRef.current?.focus({ preventScroll: true });
  }, [autoFocus]);

  // The Flip button disappears with the front, so move focus to the back
  useEffect(() => {
    if (isCardFlipped) backHeadingRef.current?.focus({ preventScroll: true });
  }, [isCardFlipped]);

  const questionText = formatQuestionText(question);
  const spokenQuestion = formatSpokenQuestion(question);

  function selectAnswer(value: number, { announce = false } = {}) {
    if (isCardFlipped) return;
    setSelectedAnswer(value);
    // A click already announces "pressed"; a shortcut key needs to say what happened
    if (announce) setAnnouncement(`You picked ${formatNumber(value)}.`);
  }

  // Flipping is allowed even without picking an answer first
  function handleFlip() {
    if (isCardFlipped) return;
    setIsCardFlipped(true);
    setAnnouncement(
      selectedAnswer === null
        ? "You didn't pick an answer. Did you get it right?"
        : `You picked ${formatNumber(selectedAnswer)}. Did you get it right?`,
    );
  }

  function handleResult(result: SelfReportedResult) {
    if (!isCardFlipped || reportedResult !== null) return;
    setReportedResult(result);
    setAnnouncement(result === 'correct' ? 'Marked as right.' : 'Marked as wrong.');
    onResult(result, selectedAnswer);
  }

  useKeyboardShortcuts((event) => {
    const key = event.key.toLowerCase();
    if (!isCardFlipped) {
      const choiceIndex = ['1', '2', '3', '4'].indexOf(key);
      if (choiceIndex !== -1 && choiceIndex < question.choices.length) {
        selectAnswer(question.choices[choiceIndex], { announce: true });
        return true;
      }
      // Enter on a focused button keeps doing that button's job
      if (key === 'f' || (key === 'enter' && !isInteractiveTarget(event.target))) {
        handleFlip();
        return true;
      }
      return false;
    }
    if (key === 'r') {
      handleResult('correct');
      return true;
    }
    if (key === 'w') {
      handleResult('incorrect');
      return true;
    }
    return false;
  }, shortcutsEnabled);

  const cardClassName = [
    styles.card,
    animationsEnabled ? styles.animated : styles.static,
    isCardFlipped ? styles.flipped : '',
  ].join(' ');

  return (
    <div className={`${styles.scene} ${animationsEnabled ? styles.enter : ''}`}>
      <p className="visually-hidden" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
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
                onSelect={(value) => selectAnswer(value)}
                shortcutEnabled={shortcutsEnabled}
              />
            ))}
          </div>
          <Button onClick={handleFlip} aria-keyshortcuts={shortcutsEnabled ? 'F Enter' : undefined}>
            Flip Card
            {shortcutsEnabled && <KeyHint>F</KeyHint>}
          </Button>
          {shortcutsEnabled ? (
            <p className={styles.hint}>
              <span aria-hidden="true">⌨️ </span>
              Press <KeyHint decorative={false}>1</KeyHint>–<KeyHint decorative={false}>4</KeyHint>{' '}
              to pick, then <KeyHint decorative={false}>F</KeyHint> to flip.
            </p>
          ) : (
            selectedAnswer === null && (
              <p className={styles.hint}>Pick an answer, then flip! Or flip to see the answer.</p>
            )
          )}
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
            {selectedAnswer === null ? (
              "You didn't pick an answer."
            ) : (
              <>
                You picked: <strong>{formatNumber(selectedAnswer)}</strong>
              </>
            )}
          </p>
          {showExplanation && <ExplanationPanel facts={question} />}
          <p className={styles.ask}>Did you get it right?</p>
          <div className={styles.resultButtons}>
            <Button
              variant="positive"
              onClick={() => handleResult('correct')}
              disabled={reportedResult !== null}
              aria-keyshortcuts={shortcutsEnabled ? 'R' : undefined}
            >
              <span aria-hidden="true">✓</span> I Got It Right
              {shortcutsEnabled && <KeyHint>R</KeyHint>}
            </Button>
            <Button
              variant="negative"
              onClick={() => handleResult('incorrect')}
              disabled={reportedResult !== null}
              aria-keyshortcuts={shortcutsEnabled ? 'W' : undefined}
            >
              <span aria-hidden="true">✗</span> I Got It Wrong
              {shortcutsEnabled && <KeyHint>W</KeyHint>}
            </Button>
          </div>
          {shortcutsEnabled && (
            <p className={styles.hint}>
              <span aria-hidden="true">⌨️ </span>
              Press <KeyHint decorative={false}>R</KeyHint> if you got it right or{' '}
              <KeyHint decorative={false}>W</KeyHint> if you got it wrong.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
