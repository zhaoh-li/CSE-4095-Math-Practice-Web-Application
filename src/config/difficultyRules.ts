import type { DifficultyLevel } from '../types';

/** An inclusive range of whole numbers. */
export interface NumberRange {
  min: number;
  max: number;
}

export interface AdditionRules {
  /** Range for each addend. */
  operand: NumberRange;
  /** The sum never goes above this. */
  maxResult: number;
}

export interface SubtractionRules {
  /** Range for the first number (the one being subtracted from). */
  minuend: NumberRange;
  /** Range for the second number. It is also capped at the minuend so answers are never negative. */
  subtrahend: NumberRange;
}

export interface MultiplicationRules {
  /** Range for the "table" factor, e.g. 0–5 means the 0 to 5 times tables. */
  tableFactor: NumberRange;
  /** Range for the other factor. */
  otherFactor: NumberRange;
}

export interface DivisionRules {
  /** Never includes 0. */
  divisor: NumberRange;
  quotient: NumberRange;
}

export interface DifficultyRules {
  addition: AdditionRules;
  subtraction: SubtractionRules;
  multiplication: MultiplicationRules;
  division: DivisionRules;
}

/**
 * Number ranges for each difficulty level.
 *
 * Level 1 Beginner:     + and − within 10,    times tables 0–5 × 0–5
 * Level 2 Easy:         + and − within 20,    times tables 0–10
 * Level 3 Intermediate: + and − within 100,   times tables 2–12
 * Level 4 Advanced:     + and − within 1,000, one-digit × 11–20
 *
 * Every range stays inside the limits in SPECIFICATION.md section 5
 * (checked by difficultyRules.test.ts).
 */
export const DIFFICULTY_RULES: Record<DifficultyLevel, DifficultyRules> = {
  beginner: {
    addition: { operand: { min: 0, max: 10 }, maxResult: 10 },
    subtraction: { minuend: { min: 0, max: 10 }, subtrahend: { min: 0, max: 10 } },
    multiplication: { tableFactor: { min: 0, max: 5 }, otherFactor: { min: 0, max: 5 } },
    division: { divisor: { min: 1, max: 5 }, quotient: { min: 0, max: 10 } },
  },
  easy: {
    addition: { operand: { min: 0, max: 20 }, maxResult: 20 },
    subtraction: { minuend: { min: 0, max: 20 }, subtrahend: { min: 0, max: 20 } },
    multiplication: { tableFactor: { min: 0, max: 10 }, otherFactor: { min: 0, max: 10 } },
    division: { divisor: { min: 1, max: 10 }, quotient: { min: 0, max: 10 } },
  },
  intermediate: {
    addition: { operand: { min: 10, max: 90 }, maxResult: 100 },
    subtraction: { minuend: { min: 20, max: 100 }, subtrahend: { min: 10, max: 99 } },
    multiplication: { tableFactor: { min: 2, max: 12 }, otherFactor: { min: 2, max: 12 } },
    division: { divisor: { min: 2, max: 12 }, quotient: { min: 2, max: 12 } },
  },
  advanced: {
    addition: { operand: { min: 100, max: 900 }, maxResult: 1000 },
    subtraction: { minuend: { min: 200, max: 1000 }, subtrahend: { min: 100, max: 999 } },
    multiplication: { tableFactor: { min: 2, max: 9 }, otherFactor: { min: 11, max: 20 } },
    division: { divisor: { min: 2, max: 9 }, quotient: { min: 11, max: 99 } },
  },
};
