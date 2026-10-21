import { useEffect, useState } from 'react';
import { Navigate, useBlocker, useLocation, useNavigate } from 'react-router';
import { QuestionCard, type CardState } from '../components/question-card/QuestionCard';
import { EndSessionControl } from '../components/session/EndSessionControl';
import { FeedbackBanner, type Feedback } from '../components/session/FeedbackBanner';
import { SessionProgress } from '../components/session/SessionProgress';
import { ShortcutHelp } from '../components/session/ShortcutHelp';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { pickFeedbackMessage } from '../config/feedbackMessages';
import { useSettings } from '../context/SettingsContext';
import { usePracticeSession } from '../hooks/usePracticeSession';
import { appData } from '../services/appData';
import { playCorrectChime } from '../services/sound';
import type { ActiveSessionSnapshot, PracticeConfig, SelfReportedResult } from '../types';
import { activePatterns } from '../utils/mistakes/mistakePatterns';
import { isPracticeConfig } from '../utils/practiceConfig';
import styles from './PracticeSessionPage.module.css';

export const MISSING_SETUP_NOTICE = "Let's choose what to practice first!";
export const NO_MISTAKES_NOTICE = 'You have no mistakes to review right now. Nice work!';

export function PracticeSessionPage() {
  const location = useLocation();
  const routeState = location.state as { config?: unknown; resume?: unknown } | null;
  const config = routeState?.config;
  // Read once when the page opens, not again mid-session
  const [saved] = useState(() => appData.loadActiveSession());
  const [hasActiveMistakes] = useState(
    () => activePatterns(appData.loadMistakePatterns()).length > 0,
  );

  // Pick up an unfinished session when the student asked to continue, when
  // the page was refreshed, or when they came back without new setup choices
  const shouldRestore =
    saved !== null &&
    (routeState?.resume === true || saved.routeKey === location.key || !isPracticeConfig(config));

  if (shouldRestore) {
    return (
      <PracticeRunner
        key={saved.session.id}
        config={saved.config}
        restore={saved}
        routeKey={location.key}
      />
    );
  }
  if (!isPracticeConfig(config)) {
    return <Navigate to="/practice/setup" replace state={{ notice: MISSING_SETUP_NOTICE }} />;
  }
  if (config.mode === 'mistake-review' && !hasActiveMistakes) {
    return <Navigate to="/practice/setup" replace state={{ notice: NO_MISTAKES_NOTICE }} />;
  }

  // A new location key (e.g. "Practice Again") starts a brand-new session
  return <PracticeRunner key={location.key} config={config} routeKey={location.key} />;
}

interface PracticeRunnerProps {
  config: PracticeConfig;
  routeKey: string;
  restore?: ActiveSessionSnapshot;
}

function PracticeRunner({ config, routeKey, restore }: PracticeRunnerProps) {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { session, currentQuestion, recordResult, endSession } = usePracticeSession(config, {
    masteryThreshold: settings.masteryThreshold,
    restore,
  });

  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [cardState, setCardState] = useState<CardState>({
    selectedAnswer: restore?.selectedAnswer ?? null,
    isCardFlipped: restore?.isCardFlipped ?? false,
  });

  const totalQuestions = session.sessionLength === 'continuous' ? null : session.sessionLength;
  const questionNumber = session.currentQuestionIndex + 1;
  const progressText =
    totalQuestions === null
      ? `Question ${questionNumber}.`
      : `Question ${questionNumber} of ${totalQuestions}.`;
  // Spoken when a new card appears (focus then moves to the question itself)
  const announcement =
    session.currentQuestionIndex === 0 && !feedback
      ? ''
      : [feedback?.message, progressText].filter(Boolean).join(' ');

  // Keep a snapshot of the unfinished session, so a refresh picks up right here
  useEffect(() => {
    if (!session.isActive) {
      appData.clearActiveSession();
      return;
    }
    appData.saveActiveSession({
      routeKey,
      config,
      session,
      currentQuestion,
      // A new question starts with nothing picked
      ...(cardState.selectedAnswer !== null &&
      !currentQuestion.choices.includes(cardState.selectedAnswer)
        ? { selectedAnswer: null, isCardFlipped: false }
        : cardState),
      savedAt: new Date().toISOString(),
    });
  }, [session, currentQuestion, cardState, config, routeKey]);

  // When the session finishes, show the summary. Replace so Back goes to setup.
  useEffect(() => {
    if (!session.isActive) {
      navigate('/practice/summary', { replace: true, state: { session } });
    }
  }, [session, navigate]);

  // Ask before leaving a session that has answers. Finishing never asks.
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      session.isActive &&
      session.attemptedCount > 0 &&
      nextLocation.pathname !== currentLocation.pathname &&
      nextLocation.pathname !== '/practice/summary',
  );

  function endAndLeave() {
    appData.saveSession({ ...session, isActive: false, completedAt: new Date().toISOString() });
    appData.clearActiveSession();
    blocker.proceed?.();
  }

  function handleResult(result: SelfReportedResult, selectedAnswer: number) {
    recordResult(result, selectedAnswer);
    if (result === 'correct' && settings.soundEffectsEnabled) playCorrectChime();
    if (settings.feedbackEffectsEnabled) {
      setFeedback((previous) => ({
        id: (previous?.id ?? 0) + 1,
        message: pickFeedbackMessage(result, previous?.message ?? null),
        result,
      }));
    }
  }

  function handleEnd() {
    if (session.attemptedCount === 0) {
      appData.clearActiveSession();
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
      <p className="visually-hidden" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
      {session.mode === 'mistake-review' && (
        <p className={styles.modeBadge}>
          <span aria-hidden="true">🔁 </span>Practicing your mistakes
        </p>
      )}
      {settings.feedbackEffectsEnabled && <FeedbackBanner feedback={feedback} />}
      <SessionProgress
        questionNumber={questionNumber}
        answeredCount={session.attemptedCount}
        totalQuestions={totalQuestions}
      />
      <QuestionCard
        key={currentQuestion.id}
        question={currentQuestion}
        onResult={handleResult}
        animationsEnabled={settings.cardAnimationsEnabled}
        shortcutsEnabled={settings.keyboardShortcutsEnabled}
        showExplanation={settings.showExplanations}
        autoFocus={session.currentQuestionIndex > 0}
        initialSelectedAnswer={
          restore && currentQuestion.id === restore.currentQuestion.id
            ? restore.selectedAnswer
            : null
        }
        initialFlipped={
          restore && currentQuestion.id === restore.currentQuestion.id
            ? restore.isCardFlipped
            : false
        }
        onStateChange={setCardState}
      />
      {settings.keyboardShortcutsEnabled && (
        <ShortcutHelp open={isHelpOpen} onOpenChange={setIsHelpOpen} />
      )}
      <EndSessionControl needsConfirmation={session.attemptedCount > 0} onEnd={handleEnd} />

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title="Leave this practice session?"
        confirmLabel="End and leave"
        cancelLabel="Keep practicing"
        onConfirm={endAndLeave}
        onCancel={() => blocker.reset?.()}
      >
        <p>
          You've answered {session.attemptedCount}{' '}
          {session.attemptedCount === 1 ? 'question' : 'questions'}, and they are saved. You can
          keep practicing, or end the session now.
        </p>
      </ConfirmDialog>
    </section>
  );
}
