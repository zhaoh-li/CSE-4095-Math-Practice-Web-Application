import { useCallback, useReducer } from 'react';
import { appData } from '../services/appData';
import type { PracticeConfig, SelfReportedResult } from '../types';
import { applyAttemptToPatterns } from '../utils/mistakes/mistakePatterns';
import { generateQuestion } from '../utils/questions/generateQuestion';
import { nextQuestion } from '../utils/session/nextQuestion';
import {
  createAttempt,
  createInitialSessionState,
  isLastQuestion,
  sessionReducer,
  type SessionAction,
  type SessionState,
} from '../utils/session/practiceSession';

interface SessionOptions {
  /** Correct review answers needed to master a mistake. */
  masteryThreshold: number;
}

function createInitialState(config: PracticeConfig, masteryThreshold: number): SessionState {
  const first =
    nextQuestion({ config, patterns: appData.loadMistakePatterns(), masteryThreshold }) ??
    // Only reachable if review mode starts with no mistakes; the page prevents that
    generateQuestion(config);
  return createInitialSessionState(config, first);
}

/**
 * Runs one practice session. Questions are generated in event handlers,
 * never during render. Every answer is saved right away, along with the
 * mistake patterns it creates or updates.
 */
export function usePracticeSession(config: PracticeConfig, { masteryThreshold }: SessionOptions) {
  const [state, dispatch] = useReducer(sessionReducer, undefined, () =>
    createInitialState(config, masteryThreshold),
  );

  const apply = useCallback(
    (action: SessionAction, save?: () => void) => {
      // Run the (pure) reducer here too, so we only save real changes
      const after = sessionReducer(state, action);
      if (after !== state) {
        save?.();
        appData.saveSession(after.session);
      }
      dispatch(action);
    },
    [state],
  );

  const recordResult = useCallback(
    (result: SelfReportedResult, selectedAnswer: number) => {
      const { session, currentQuestion } = state;
      if (!session.isActive) return;

      const now = new Date().toISOString();
      const attempt = createAttempt(session, currentQuestion, selectedAnswer, result, now);
      const patterns = applyAttemptToPatterns(appData.loadMistakePatterns(), attempt, {
        now,
        masteryThreshold,
      });
      // Pick the next question from the updated patterns, so a just-mastered
      // mistake isn't asked again
      const next = isLastQuestion(session)
        ? null
        : nextQuestion({ config, previous: currentQuestion, patterns, masteryThreshold, now });

      apply({ type: 'recordAttempt', attempt, nextQuestion: next, now }, () => {
        appData.saveAttempt(attempt);
        appData.saveMistakePatterns(patterns);
      });
    },
    [state, config, masteryThreshold, apply],
  );

  const endSession = useCallback(() => {
    apply({ type: 'endSession', now: new Date().toISOString() });
  }, [apply]);

  return { ...state, recordResult, endSession };
}
