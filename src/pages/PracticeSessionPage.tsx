import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { QuestionCard } from '../components/question-card/QuestionCard';
import { EndSessionControl } from '../components/session/EndSessionControl';
import { SessionProgress } from '../components/session/SessionProgress';
import { ShortcutHelp } from '../components/session/ShortcutHelp';
import { useSettings } from '../context/SettingsContext';
import { usePracticeSession } from '../hooks/usePracticeSession';
import { appData } from '../services/appData';
import type { PracticeConfig } from '../types';
import { activePatterns } from '../utils/mistakes/mistakePatterns';
import { isPracticeConfig } from '../utils/practiceConfig';
import styles from './PracticeSessionPage.module.css';

export const MISSING_SETUP_NOTICE = "Let's choose what to practice first!";
export const NO_MISTAKES_NOTICE = 'You have no mistakes to review right now. Nice work!';

export function PracticeSessionPage() {
  const location = useLocation();
  const config = (location.state as { config?: unknown } | null)?.config;
  // Checked once when the page opens, not again mid-session
  const [hasActiveMistakes] = useState(
    () => activePatterns(appData.loadMistakePatterns()).length > 0,
  );

  if (!isPracticeConfig(config)) {
    return <Navigate to="/practice/setup" replace state={{ notice: MISSING_SETUP_NOTICE }} />;
  }
  if (config.mode === 'mistake-review' && !hasActiveMistakes) {
    return <Navigate to="/practice/setup" replace state={{ notice: NO_MISTAKES_NOTICE }} />;
  }

  // A new location key (e.g. "Practice Again") starts a brand-new session
  return <PracticeRunner key={location.key} config={config} />;
}

function PracticeRunner({ config }: { config: PracticeConfig }) {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { session, currentQuestion, recordResult, endSession } = usePracticeSession(config, {
    masteryThreshold: settings.masteryThreshold,
  });

  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const totalQuestions = session.sessionLength === 'continuous' ? null : session.sessionLength;
  const questionNumber = session.currentQuestionIndex + 1;
  // Spoken when a new card appears (focus then moves to the question itself)
  const progressAnnouncement =
    session.currentQuestionIndex === 0
      ? ''
      : totalQuestions === null
        ? `Question ${questionNumber}.`
        : `Question ${questionNumber} of ${totalQuestions}.`;

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
      {session.mode === 'mistake-review' && (
        <p className={styles.modeBadge}>
          <span aria-hidden="true">🔁 </span>Practicing your mistakes
        </p>
      )}
      <p className="visually-hidden" aria-live="polite" aria-atomic="true">
        {progressAnnouncement}
      </p>
      <SessionProgress
        questionNumber={questionNumber}
        answeredCount={session.attemptedCount}
        totalQuestions={totalQuestions}
      />
      <QuestionCard
        key={currentQuestion.id}
        question={currentQuestion}
        onResult={recordResult}
        animationsEnabled={settings.cardAnimationsEnabled}
        shortcutsEnabled={settings.keyboardShortcutsEnabled}
        autoFocus={session.currentQuestionIndex > 0}
      />
      {settings.keyboardShortcutsEnabled && (
        <ShortcutHelp open={isHelpOpen} onOpenChange={setIsHelpOpen} />
      )}
      <EndSessionControl needsConfirmation={session.attemptedCount > 0} onEnd={handleEnd} />
    </section>
  );
}
