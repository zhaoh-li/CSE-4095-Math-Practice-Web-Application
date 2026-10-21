import type { DifficultyLevel, MathOperation, Question, QuestionSource } from './question';

/** Number of questions in a session, or no fixed end. */
export type SessionLength = 5 | 10 | 20 | 'continuous';

export type PracticeMode = 'regular' | 'mistake-review';

/** The student's own judgment after flipping the card. */
export type SelfReportedResult = 'correct' | 'incorrect';

/** Choices made on the practice setup page. */
export interface PracticeConfig {
  mode: PracticeMode;
  operations: MathOperation[];
  difficulty: DifficultyLevel;
  sessionLength: SessionLength;
}

/** One answered question. */
export interface PracticeAttempt {
  id: string;
  sessionId: string;
  questionId: string;
  operation: MathOperation;
  difficulty: DifficultyLevel;
  firstOperand: number;
  secondOperand: number;
  correctAnswer: number;
  selectedAnswer: number;
  result: SelfReportedResult;
  source: QuestionSource;
  mistakePatternId?: string;
  /** ISO 8601 timestamp. */
  answeredAt: string;
}

export interface PracticeSession {
  id: string;
  mode: PracticeMode;
  operations: MathOperation[];
  difficulty: DifficultyLevel;
  sessionLength: SessionLength;
  currentQuestionIndex: number;
  attemptedCount: number;
  correctCount: number;
  incorrectCount: number;
  mistakeReviewCount: number;
  isActive: boolean;
  /** ISO 8601 timestamp. */
  startedAt: string;
  /** ISO 8601 timestamp, set when the session ends. */
  completedAt?: string;
}

/**
 * Everything needed to pick up an unfinished session after a refresh or
 * after closing the tab, exactly where the student left off.
 */
export interface ActiveSessionSnapshot {
  /** Identifies the browser history entry, so a refresh resumes this session. */
  routeKey: string;
  config: PracticeConfig;
  session: PracticeSession;
  currentQuestion: Question;
  selectedAnswer: number | null;
  isCardFlipped: boolean;
  /** ISO 8601 timestamp. */
  savedAt: string;
}
