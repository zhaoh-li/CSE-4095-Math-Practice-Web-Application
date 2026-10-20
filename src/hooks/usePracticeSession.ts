import { useCallback, useReducer } from 'react';
import { appData } from '../services/appData';
import type { PracticeConfig, SelfReportedResult } from '../types';
import { generateQuestion } from '../utils/questions/generateQuestion';
import {
  createAttempt,
  createInitialSessionState,
  isLastQuestion,
  sessionReducer,
  type SessionAction,
  type SessionState,
} from '../utils/session/practiceSession';

/** Saves whatever changed between two session states. */
function persistChanges(before: SessionState, after: SessionState) {
  if (after === before) return;
  const newAttempt = after.attempts.length > before.attempts.length ? after.attempts.at(-1) : null;
  if (newAttempt) appData.saveAttempt(newAttempt);
  appData.saveSession(after.session);
}

/**
 * Runs one practice session. Questions are generated in event handlers,
 * never during render. Every answer is saved as soon as it is recorded.
 */
export function usePracticeSession(config: PracticeConfig) {
  const [state, dispatch] = useReducer(sessionReducer, config, (initialConfig) =>
    createInitialSessionState(initialConfig, generateQuestion(initialConfig)),
  );

  // Run the (pure) reducer here too, so we know exactly what to save
  const apply = useCallback(
    (action: SessionAction) => {
      persistChanges(state, sessionReducer(state, action));
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
      // No need for a new question if this was the last one
      const nextQuestion = isLastQuestion(session)
        ? currentQuestion
        : generateQuestion({ ...config, avoid: currentQuestion });
      apply({ type: 'recordAttempt', attempt, nextQuestion, now });
    },
    [state, config, apply],
  );

  const endSession = useCallback(() => {
    apply({ type: 'endSession', now: new Date().toISOString() });
  }, [apply]);

  return { ...state, recordResult, endSession };
}
