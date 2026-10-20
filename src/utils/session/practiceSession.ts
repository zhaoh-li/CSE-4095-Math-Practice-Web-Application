import type {
  PracticeAttempt,
  PracticeConfig,
  PracticeSession,
  Question,
  SelfReportedResult,
} from '../../types';
import { createId } from '../id';
import { isPracticeConfig } from '../practiceConfig';

/** Everything the practice page needs to run a session. */
export interface SessionState {
  session: PracticeSession;
  currentQuestion: Question;
  attempts: PracticeAttempt[];
}

export type SessionAction =
  | {
      type: 'recordAttempt';
      attempt: PracticeAttempt;
      /**
       * The question to show next. Ignored when this attempt completes the session.
       * null means there is nothing left to ask (e.g. every mistake is mastered),
       * so the session ends early.
       */
      nextQuestion: Question | null;
      now: string;
    }
  | { type: 'endSession'; now: string };

export function createPracticeSession(
  config: PracticeConfig,
  now: string = new Date().toISOString(),
): PracticeSession {
  return {
    id: createId(),
    mode: config.mode,
    operations: [...config.operations],
    difficulty: config.difficulty,
    sessionLength: config.sessionLength,
    currentQuestionIndex: 0,
    attemptedCount: 0,
    correctCount: 0,
    incorrectCount: 0,
    mistakeReviewCount: 0,
    isActive: true,
    startedAt: now,
  };
}

export function createInitialSessionState(
  config: PracticeConfig,
  firstQuestion: Question,
  now?: string,
): SessionState {
  return {
    session: createPracticeSession(config, now),
    currentQuestion: firstQuestion,
    attempts: [],
  };
}

export function createAttempt(
  session: PracticeSession,
  question: Question,
  selectedAnswer: number,
  result: SelfReportedResult,
  now: string = new Date().toISOString(),
): PracticeAttempt {
  return {
    id: createId(),
    sessionId: session.id,
    questionId: question.id,
    operation: question.operation,
    difficulty: question.difficulty,
    firstOperand: question.firstOperand,
    secondOperand: question.secondOperand,
    correctAnswer: question.correctAnswer,
    selectedAnswer,
    result,
    source: question.source,
    ...(question.mistakePatternId ? { mistakePatternId: question.mistakePatternId } : {}),
    answeredAt: now,
  };
}

/** True when a fixed-length session has had all its questions answered. */
export function hasReachedSessionLength(session: PracticeSession): boolean {
  return session.sessionLength !== 'continuous' && session.attemptedCount >= session.sessionLength;
}

/** True when recording one more attempt would finish the session. */
export function isLastQuestion(session: PracticeSession): boolean {
  return (
    session.sessionLength !== 'continuous' && session.attemptedCount + 1 >= session.sessionLength
  );
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  const { session } = state;
  if (!session.isActive) return state;

  switch (action.type) {
    case 'recordAttempt': {
      const { attempt } = action;
      // Only the current question can be answered, and only once
      if (attempt.questionId !== state.currentQuestion.id) return state;
      if (state.attempts.some((a) => a.questionId === attempt.questionId)) return state;

      const updated: PracticeSession = {
        ...session,
        attemptedCount: session.attemptedCount + 1,
        correctCount: session.correctCount + (attempt.result === 'correct' ? 1 : 0),
        incorrectCount: session.incorrectCount + (attempt.result === 'incorrect' ? 1 : 0),
        mistakeReviewCount:
          session.mistakeReviewCount + (attempt.source === 'mistake-review' ? 1 : 0),
      };
      const attempts = [...state.attempts, attempt];

      if (hasReachedSessionLength(updated) || action.nextQuestion === null) {
        return {
          ...state,
          attempts,
          session: { ...updated, isActive: false, completedAt: action.now },
        };
      }

      return {
        session: { ...updated, currentQuestionIndex: session.currentQuestionIndex + 1 },
        currentQuestion: action.nextQuestion,
        attempts,
      };
    }

    case 'endSession':
      return { ...state, session: { ...session, isActive: false, completedAt: action.now } };
  }
}

/** The setup choices a session was started with, e.g. for "Practice Again". */
export function configFromSession(session: PracticeSession): PracticeConfig {
  return {
    mode: session.mode,
    operations: [...session.operations],
    difficulty: session.difficulty,
    sessionLength: session.sessionLength,
  };
}

/** Checks that unknown data (e.g. router state) is a finished session the summary can show. */
export function isCompletedSession(value: unknown): value is PracticeSession {
  if (typeof value !== 'object' || value === null) return false;
  const session = value as Record<string, unknown>;
  const counts = ['attemptedCount', 'correctCount', 'incorrectCount', 'mistakeReviewCount'];
  return (
    typeof session.id === 'string' &&
    session.isActive === false &&
    typeof session.completedAt === 'string' &&
    Array.isArray(session.operations) &&
    counts.every((key) => Number.isInteger(session[key]) && (session[key] as number) >= 0) &&
    (session.correctCount as number) + (session.incorrectCount as number) ===
      session.attemptedCount &&
    isPracticeConfig(configFromSession(session as unknown as PracticeSession))
  );
}
