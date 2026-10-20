import { useCallback, useReducer } from 'react';
import type { PracticeConfig, SelfReportedResult } from '../types';
import { generateQuestion } from '../utils/questions/generateQuestion';
import {
  createAttempt,
  createInitialSessionState,
  isLastQuestion,
  sessionReducer,
} from '../utils/session/practiceSession';

/**
 * Runs one practice session. Questions are generated in event handlers,
 * never during render.
 */
export function usePracticeSession(config: PracticeConfig) {
  const [state, dispatch] = useReducer(sessionReducer, config, (initialConfig) =>
    createInitialSessionState(initialConfig, generateQuestion(initialConfig)),
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
      dispatch({ type: 'recordAttempt', attempt, nextQuestion, now });
    },
    [state, config],
  );

  const endSession = useCallback(() => {
    dispatch({ type: 'endSession', now: new Date().toISOString() });
  }, []);

  return { ...state, recordResult, endSession };
}
