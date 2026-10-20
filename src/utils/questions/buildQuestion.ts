import { OPERATION_INFO } from '../../config/practiceOptions';
import type { DifficultyLevel, MathOperation, Question } from '../../types';
import { createId } from '../id';
import type { RandomSource } from '../random';
import { generateAnswerChoices } from './answerChoices';

/** The math part of a question, before ID, text, and choices are added. */
export interface QuestionFacts {
  operation: MathOperation;
  firstOperand: number;
  secondOperand: number;
  correctAnswer: number;
}

/** Formats numbers for display, e.g. 1000 → "1,000". */
export function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

/** Text shown to the student, e.g. "7 × 8". */
export function formatQuestionText({ operation, firstOperand, secondOperand }: QuestionFacts) {
  return `${formatNumber(firstOperand)} ${OPERATION_INFO[operation].symbol} ${formatNumber(secondOperand)}`;
}

const SPOKEN_OPERATORS: Record<MathOperation, string> = {
  addition: 'plus',
  subtraction: 'minus',
  multiplication: 'times',
  division: 'divided by',
};

/** Words for screen readers, e.g. "7 times 8". */
export function formatSpokenQuestion({ operation, firstOperand, secondOperand }: QuestionFacts) {
  return `${formatNumber(firstOperand)} ${SPOKEN_OPERATORS[operation]} ${formatNumber(secondOperand)}`;
}

/** Calculates the right answer for two operands. */
export function calculateAnswer(operation: MathOperation, first: number, second: number): number {
  switch (operation) {
    case 'addition':
      return first + second;
    case 'subtraction':
      return first - second;
    case 'multiplication':
      return first * second;
    case 'division':
      return first / second;
  }
}

/** Turns question facts into a full Question with an ID, display text, and four choices. */
export function buildQuestion(
  facts: QuestionFacts,
  difficulty: DifficultyLevel,
  random: RandomSource = Math.random,
): Question {
  return {
    id: createId(),
    ...facts,
    difficulty,
    displayText: formatQuestionText(facts),
    choices: generateAnswerChoices(facts, random),
    source: 'regular',
  };
}
