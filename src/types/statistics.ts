import type { DifficultyLevel, MathOperation } from './question';
import type { PracticeMode, SessionLength } from './session';

export interface PerformanceTotals {
  attempted: number;
  correct: number;
  incorrect: number;
  /** Percentage from 0 to 100. 0 when nothing has been attempted. */
  accuracy: number;
}

export type OperationStatistics = Record<MathOperation, PerformanceTotals>;

export type DifficultyStatistics = Record<DifficultyLevel, PerformanceTotals>;

export interface RecentSessionSummary {
  sessionId: string;
  mode: PracticeMode;
  /** ISO 8601 timestamp. */
  completedAt: string;
  operations: MathOperation[];
  difficulty: DifficultyLevel;
  sessionLength: SessionLength;
  totals: PerformanceTotals;
}

export interface MistakeStatistics {
  activePatterns: number;
  masteredPatterns: number;
  similarQuestionsPracticed: number;
  reviewQuestionsCorrect: number;
}

export interface AppStatistics {
  overall: PerformanceTotals;
  byOperation: OperationStatistics;
  byDifficulty: DifficultyStatistics;
  recentSessions: RecentSessionSummary[];
  mistakes: MistakeStatistics;
}
