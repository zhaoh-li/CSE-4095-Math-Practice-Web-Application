/** The four arithmetic operations the app can practice. */
export const MATH_OPERATIONS = ['addition', 'subtraction', 'multiplication', 'division'] as const;
export type MathOperation = (typeof MATH_OPERATIONS)[number];

/** Difficulty levels, from Level 1 (beginner) to Level 4 (advanced). */
export const DIFFICULTY_LEVELS = ['beginner', 'easy', 'intermediate', 'advanced'] as const;
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];

/** Where a question came from: normal practice or review of a past mistake. */
export type QuestionSource = 'regular' | 'mistake-review';

export interface Question {
  id: string;
  operation: MathOperation;
  difficulty: DifficultyLevel;
  firstOperand: number;
  secondOperand: number;
  correctAnswer: number;
  /** Text shown to the student, e.g. "7 × 8". */
  displayText: string;
  /** Four shuffled multiple-choice answers, including the correct one. */
  choices: number[];
  source: QuestionSource;
  /** Set when the question was generated from a mistake pattern. */
  mistakePatternId?: string;
}
