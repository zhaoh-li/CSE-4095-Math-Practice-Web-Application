import { useState } from 'react';
import { useLocation } from 'react-router';
import { QuestionCard } from '../components/question-card/QuestionCard';
import { ButtonLink, Button } from '../components/ui/Button';
import type { PracticeConfig, Question } from '../types';
import { isPracticeConfig } from '../utils/practiceConfig';
import { generateQuestion } from '../utils/questions/generateQuestion';
import styles from './PracticeSessionPage.module.css';

export function PracticeSessionPage() {
  const location = useLocation();
  const config = (location.state as { config?: unknown } | null)?.config;

  if (!isPracticeConfig(config)) {
    return (
      <section>
        <h1>Practice Session</h1>
        <p>Let's choose what to practice first.</p>
        <ButtonLink to="/practice/setup">Go to Practice Setup</ButtonLink>
      </section>
    );
  }

  return <PracticeRunner config={config} />;
}

/**
 * Milestone 1 version: shows one card after another.
 * Phase 7 adds result tracking, progress, and the session summary.
 */
function PracticeRunner({ config }: { config: PracticeConfig }) {
  const [question, setQuestion] = useState<Question>(() => generateQuestion(config));
  const [questionNumber, setQuestionNumber] = useState(1);
  const [isFinished, setIsFinished] = useState(false);

  const totalQuestions = config.sessionLength === 'continuous' ? null : config.sessionLength;

  function handleResult() {
    if (totalQuestions !== null && questionNumber >= totalQuestions) {
      setIsFinished(true);
      return;
    }
    setQuestion(generateQuestion({ ...config, avoid: question }));
    setQuestionNumber((n) => n + 1);
  }

  function restart() {
    setQuestion(generateQuestion(config));
    setQuestionNumber(1);
    setIsFinished(false);
  }

  if (isFinished) {
    return (
      <section className={styles.done}>
        <h1>Great job!</h1>
        <p>You finished all {totalQuestions} questions.</p>
        <div className={styles.actions}>
          <Button onClick={restart}>Practice Again</Button>
          <ButtonLink to="/practice/setup" variant="secondary">
            Change Settings
          </ButtonLink>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="session-title">
      <h1 id="session-title" className="visually-hidden">
        Practice Session
      </h1>
      <QuestionCard
        key={question.id}
        question={question}
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
        onResult={handleResult}
        autoFocus={questionNumber > 1}
      />
    </section>
  );
}
