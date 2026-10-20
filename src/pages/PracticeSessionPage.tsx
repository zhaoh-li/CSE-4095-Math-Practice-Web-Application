import { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { QuestionCard } from '../components/question-card/QuestionCard';
import { EndSessionControl } from '../components/session/EndSessionControl';
import { SessionProgress } from '../components/session/SessionProgress';
import { useSettings } from '../context/SettingsContext';
import { usePracticeSession } from '../hooks/usePracticeSession';
import type { PracticeConfig } from '../types';
import { isPracticeConfig } from '../utils/practiceConfig';

export const MISSING_SETUP_NOTICE = "Let's choose what to practice first!";

export function PracticeSessionPage() {
  const location = useLocation();
  const config = (location.state as { config?: unknown } | null)?.config;

  if (!isPracticeConfig(config)) {
    return <Navigate to="/practice/setup" replace state={{ notice: MISSING_SETUP_NOTICE }} />;
  }

  // A new location key (e.g. "Practice Again") starts a brand-new session
  return <PracticeRunner key={location.key} config={config} />;
}

function PracticeRunner({ config }: { config: PracticeConfig }) {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { session, currentQuestion, recordResult, endSession } = usePracticeSession(config);

  const totalQuestions = session.sessionLength === 'continuous' ? null : session.sessionLength;

  // When the session finishes, show the summary. Replace so Back goes to setup.
  useEffect(() => {
    if (!session.isActive) {
      navigate('/practice/summary', { replace: true, state: { session } });
    }
  }, [session, navigate]);

  function handleEnd() {
    if (session.attemptedCount === 0) {
      navigate('/practice/setup', { state: { config } });
      return;
    }
    endSession();
  }

  if (!session.isActive) return null;

  return (
    <section aria-labelledby="session-title">
      <h1 id="session-title" className="visually-hidden">
        Practice Session
      </h1>
      <SessionProgress
        questionNumber={session.currentQuestionIndex + 1}
        answeredCount={session.attemptedCount}
        totalQuestions={totalQuestions}
      />
      <QuestionCard
        key={currentQuestion.id}
        question={currentQuestion}
        onResult={recordResult}
        animationsEnabled={settings.cardAnimationsEnabled}
        autoFocus={session.currentQuestionIndex > 0}
      />
      <EndSessionControl needsConfirmation={session.attemptedCount > 0} onEnd={handleEnd} />
    </section>
  );
}
