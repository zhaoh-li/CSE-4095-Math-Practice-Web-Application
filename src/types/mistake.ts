import type { DifficultyLevel, MathOperation } from './question';

/** A math fact the student got wrong, tracked until mastered. */
export interface MistakePattern {
  id: string;
  operation: MathOperation;
  firstOperand: number;
  secondOperand: number;
  correctAnswer: number;
  difficulty: DifficultyLevel;
  incorrectCount: number;
  /** Correct answers to similar review questions since the last mistake. */
  similarCorrectCount: number;
  isMastered: boolean;
  /** ISO 8601 timestamps. */
  createdAt: string;
  lastIncorrectAt: string;
  masteredAt?: string;
}
